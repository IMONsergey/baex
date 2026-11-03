#!/usr/bin/env python3
"""Reproduce or verify the captured public reference assets with bounded concurrency.

Requires Python 3.12+, Pillow with WebP/AVIF, ffmpeg and ffprobe. No credentials
or live CMS are used. Originals are verified against the pinned capture hashes.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import shutil
import subprocess
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ALLOWED_HOSTS = {"www.rejouice.com", "images.prismic.io", "rejouice-2024.cdn.prismic.io"}


def sha(path: Path) -> str:
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def public_file(path: str) -> Path:
    relative = Path(path.lstrip("/"))
    if len(relative.parts) != 2 or relative.parts[0] != "media" or ".." in relative.parts:
        raise ValueError(f"Unexpected public media path: {path}")
    return REPO / "public" / relative


def valid(path: Path, expected: str) -> bool:
    return path.is_file() and path.stat().st_size > 0 and sha(path) == expected


def run(command: list[str]) -> None:
    subprocess.run(command, check=True, timeout=600)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify-only", action="store_true", help="Check local bytes and content coverage; no network")
    parser.add_argument("--workers", type=int, choices=range(1, 5), default=2, metavar="1..4")
    parser.add_argument("--cache-dir", type=Path, default=Path(tempfile.gettempdir()) / "baex-reference-assets-cache")
    options = parser.parse_args()
    manifest = json.loads((REPO / "docs/asset-provenance.json").read_text())
    assets = manifest["assets"]
    originals = {row["source"]: row for row in assets if not row.get("rect")}
    asset_map = json.loads((REPO / "src/data/asset-map.json").read_text())
    expected: dict[Path, str] = {}
    for row in assets:
        expected[public_file(row["publicPath"])] = row["webSHA256"]
        if video := row.get("video"):
            expected[public_file(video["posterPublicPath"])] = video["posterSHA256"]

    if not options.verify_only:
        from PIL import Image, ImageOps
        options.cache_dir.mkdir(parents=True, exist_ok=True)

        def original(row: dict) -> Path:
            source = originals[row.get("originalSource", row["source"])]
            url = source["source"]
            parsed = urllib.parse.urlsplit(url)
            if parsed.scheme != "https" or parsed.hostname not in ALLOWED_HOSTS:
                raise ValueError(f"Unexpected source URL: {url}")
            cached = options.cache_dir / (source["assetKey"] + Path(parsed.path).suffix)
            if valid(cached, source["sha256"]):
                return cached
            partial = cached.with_suffix(cached.suffix + ".download")
            try:
                request = urllib.request.Request(url, headers={"User-Agent": "BAEX-reference-asset-sync/1", "Accept": "*/*"})
                with urllib.request.urlopen(request, timeout=40) as response, partial.open("wb") as output:
                    if urllib.parse.urlsplit(response.url).hostname not in ALLOWED_HOSTS:
                        raise ValueError("Unexpected redirect outside captured media hosts")
                    total = 0
                    while chunk := response.read(1024 * 1024):
                        total += len(chunk)
                        if total > source["bytes"] + 1024:
                            raise ValueError(f"Source grew beyond the pinned size: {url}")
                        output.write(chunk)
                if not valid(partial, source["sha256"]):
                    raise ValueError(f"Original source hash differs from the captured version: {url}")
                partial.replace(cached)
            finally:
                partial.unlink(missing_ok=True)
            return cached

        # Download once per original. At most four network requests exist at a time.
        required_sources = set()
        for row in assets:
            needs_media = not valid(public_file(row["publicPath"]), row["webSHA256"])
            video = row.get("video")
            needs_poster = video and not valid(public_file(video["posterPublicPath"]), video["posterSHA256"])
            if needs_media or needs_poster:
                required_sources.add(row.get("originalSource", row["source"]))
        with concurrent.futures.ThreadPoolExecutor(max_workers=options.workers) as pool:
            list(pool.map(original, [originals[url] for url in sorted(required_sources)]))

        def build(row: dict) -> None:
            destination = public_file(row["publicPath"])
            if valid(destination, row["webSHA256"]):
                return
            source = original(row)
            destination.parent.mkdir(parents=True, exist_ok=True)
            temporary = destination.with_name(destination.stem + ".building" + destination.suffix)
            transform = row["webTransform"]
            try:
                if destination.suffix == ".webp":
                    image = ImageOps.exif_transpose(Image.open(source))
                    if row.get("rect"):
                        x, y, width, height = map(int, row["rect"].split(","))
                        image = image.crop((x, y, x + width, y + height))
                    image.thumbnail((2560, 2560), Image.Resampling.LANCZOS)
                    if image.mode not in ("RGB", "RGBA"):
                        image = image.convert("RGBA" if "A" in image.mode else "RGB")
                    image.save(temporary, "WEBP", quality=87, method=5)
                elif "VP9 to H.264" in transform:
                    run(["ffmpeg", "-v", "error", "-y", "-i", str(source), "-c:v", "libx264", "-crf", "22", "-preset", "fast", "-threads", "2", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", str(temporary)])
                elif "H.264 CRF23" in transform or "H.264 CRF 23" in transform:
                    run(["ffmpeg", "-v", "error", "-y", "-i", str(source), "-map", "0:v:0", "-map", "0:a?", "-vf", "scale=min(1920\\,iw):-2", "-c:v", "libx264", "-crf", "23", "-preset", "fast", "-threads", "2", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(temporary)])
                else:
                    shutil.copy2(source, temporary)
                if not valid(temporary, row["webSHA256"]):
                    raise ValueError(f"Encoded output differs from the pinned capture: {destination.name}. Check encoder versions in docs/reference-assets.md.")
                temporary.replace(destination)
            finally:
                temporary.unlink(missing_ok=True)

        unique_media = {row["publicPath"]: row for row in assets}
        with concurrent.futures.ThreadPoolExecutor(max_workers=options.workers) as pool:
            list(pool.map(build, unique_media.values()))

        def poster(row: dict) -> None:
            video = row["video"]
            destination = public_file(video["posterPublicPath"])
            if valid(destination, video["posterSHA256"]):
                return
            source = original(row)
            temporary = destination.with_name(destination.stem + ".building.webp")
            try:
                run(["ffmpeg", "-v", "error", "-y", "-threads", "1", "-ss", str(video["posterTimeSeconds"]), "-i", str(source), "-frames:v", "1", "-vf", "scale=min(1600\\,iw):-2", "-c:v", "libwebp", "-q:v", "85", "-threads", "1", str(temporary)])
                if not valid(temporary, video["posterSHA256"]):
                    raise ValueError(f"Poster output differs from the pinned capture: {destination.name}")
                temporary.replace(destination)
            finally:
                temporary.unlink(missing_ok=True)
        with concurrent.futures.ThreadPoolExecutor(max_workers=options.workers) as pool:
            list(pool.map(poster, [row for row in assets if row.get("video")]))

    bad_files = [str(path.relative_to(REPO)) for path, digest in expected.items() if not valid(path, digest)]
    content = json.loads((REPO / "src/data/content.json").read_text())
    references = []
    def walk(value):
        if isinstance(value, dict):
            if "assetKey" in value:
                references.append(value)
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)
    walk(content)
    missing = [row["assetKey"] for row in references if row["assetKey"] not in asset_map or not public_file(asset_map[row["assetKey"]]).is_file()]
    receipt = {"checkedFiles": len(expected), "checkedBytes": sum(p.stat().st_size for p in expected if p.exists()), "contentReferences": len(references), "uniqueContentKeys": len({r["assetKey"] for r in references}), "galleryItems": sum(len(p["gallery"]) for p in content["projects"]), "projects": len(content["projects"]), "badFiles": bad_files, "missingReferences": missing}
    print(json.dumps(receipt, indent=2))
    if bad_files or missing:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
