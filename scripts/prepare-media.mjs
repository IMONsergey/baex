import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Two videos are stored in byte-preserving parts to fit the upload transport.
// Reassembly is local and offline; no media is downloaded during installation.
const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root, "media-parts/manifest.json"), "utf8"));
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
let assembled = 0;

for (const asset of manifest.files) {
  const target = resolve(root, asset.target);
  try {
    const existing = await readFile(target);
    if (existing.length === asset.size && sha256(existing) === asset.sha256) continue;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const parts = [];
  for (const part of asset.parts) {
    const buffer = await readFile(resolve(root, part.path));
    if (buffer.length !== part.size || sha256(buffer) !== part.sha256) {
      throw new Error(`Media part is missing or corrupt: ${part.path}`);
    }
    parts.push(buffer);
  }
  const complete = Buffer.concat(parts);
  if (complete.length !== asset.size || sha256(complete) !== asset.sha256) {
    throw new Error(`Assembled media does not match its source: ${asset.target}`);
  }
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.preparing-${process.pid}`;
  try {
    await writeFile(temporary, complete);
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  assembled++;
}

console.log(`Large media ready: ${manifest.files.length} files, ${assembled} assembled locally.`);
