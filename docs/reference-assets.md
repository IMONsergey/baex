# Reference assets

Captured on 2026-11-03 from https://www.rejouice.com/. Source attribution and exact URLs are retained in asset-provenance.json and brand-provenance.json. The editable app does not depend on the source CMS or CDN at runtime.

## Reproducibility

Run `python scripts/sync-reference-assets.py --verify-only` to verify all local media hashes and content coverage without network access. Run without that flag to retrieve missing originals and reproduce variants. Default concurrency is two workers, configurable from one to four. ffmpeg is limited to two codec threads per video. No credentials are used. Changed source bytes fail verification instead of silently updating the snapshot.

Captured encoder environment:

- Python 3.12.14
- Pillow 12.3.0 with WebP and AVIF support
- ffmpeg version 6.1.1-3ubuntu5 Copyright (c) 2000-2023 the FFmpeg developers

Byte hashes are pinned to this encoder environment. Different library builds may produce equivalent media with different bytes; the script reports that discrepancy.

## Media preparation

Originals total 1,468,986,789 bytes. The app uses 412 local files totaling 250,140,547 bytes: 316 captured assets plus 22 authored crops, deduplicated where byte-identical, and 77 local posters. Largest file is 25,065,715 bytes. Images use WebP quality 87 with a maximum side of 2560px. High-bitrate videos use H.264 CRF23 at a maximum width of 1920px, preserving fps and duration. One VP9 source has an H.264 fallback.

Keys use SHA256(origin + pathname + optional decoded rect query), truncated to ten hex characters. Use asset-map.json rather than predicting filenames. asset-details.json includes natural dimensions, duration, fps and poster paths.

## Source gaps

Two Connect Homes gallery items are already broken in the published HTML and current public CMS document: editor-local blob URLs for a video and an image. They are recorded in source-gaps.json and omitted from active galleries. All 19 projects remain; active gallery media total 203, with zero unresolved references. No replacement content was fabricated.

## Fonts

Source font files are retained locally with provenance. SuisseIntl Regular contains Cyrillic; the captured Light file does not. The Russian adaptation needs an explicit choice for light-weight Cyrillic headings.

## Control marks

The reference Arrow component renders the typographic glyph `↗` in two animated spans. It is not an SVG. Its observed transitions use 0.7s cubic-bezier(.52,0,0,1). The 17×17 SVG in brand-map.close is the cursor close mark and must not be used as an arrow.
