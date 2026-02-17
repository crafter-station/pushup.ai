/**
 * Generate brand assets: OG images + favicon
 * Run: bun run scripts/generate-assets.ts
 */

import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

const OUT = join(import.meta.dir, "..", "public");

// Brand palette
const BG = "#000000";
const GRID = "#3a3a3a";
const ANNOTATION = "#6b6b6b";
const MID_GRAY = "#8a8a8a";
const LIGHT_GRAY = "#d4d4d4";
const WHITE = "#ffffff";

/** Vertical lenticular stripe pattern */
function stripes(w: number, h: number): string {
  const lines: string[] = [];
  for (let x = 0; x < w; x += 5) {
    lines.push(
      `<rect x="${x}" y="0" width="2" height="${h}" fill="${BG}" opacity="0.85"/>`
    );
  }
  return lines.join("");
}

/** Silhouette radial gradients */
function silhouette(w: number, h: number): string {
  return `
    <defs>
      <radialGradient id="head" cx="50%" cy="32%" rx="9%" ry="12%">
        <stop offset="0%" stop-color="#3A3A3A"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
      <radialGradient id="torso" cx="50%" cy="55%" rx="14%" ry="25%">
        <stop offset="0%" stop-color="#2A2A2A"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#head)"/>
    <rect width="${w}" height="${h}" fill="url(#torso)"/>
  `;
}

function ogSvg(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;

  return `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${BG}"/>

  <!-- Silhouette -->
  ${silhouette(w, h)}

  <!-- Lenticular stripes -->
  ${stripes(w, h)}

  <!-- Scattered typography -->
  <text x="${w * 0.1}" y="${cy - 100}" font-family="monospace" font-size="14" fill="${LIGHT_GRAY}" letter-spacing="8" text-anchor="start">SHALL WE</text>
  <text x="${w * 0.82}" y="${cy - 50}" font-family="monospace" font-size="36" fill="${MID_GRAY}" font-weight="bold" text-anchor="end">COUNT</text>
  <text x="${w * 0.15}" y="${cy - 5}" font-family="monospace" font-size="18" fill="${LIGHT_GRAY}" letter-spacing="5" text-anchor="start">YOUR</text>

  <!-- Central asterisk -->
  <text x="${cx}" y="${cy + 30}" font-family="monospace" font-size="96" fill="${WHITE}" text-anchor="middle" dominant-baseline="central" opacity="0.95">✳</text>

  <text x="${w * 0.88}" y="${cy + 90}" font-family="monospace" font-size="52" fill="${WHITE}" font-weight="bold" text-anchor="end">PUSH</text>
  <text x="${w * 0.12}" y="${cy + 140}" font-family="monospace" font-size="40" fill="${MID_GRAY}" text-anchor="start">UPS?</text>

  <!-- Brand -->
  <text x="${w - 40}" y="36" font-family="monospace" font-size="10" fill="${GRID}" letter-spacing="4" text-anchor="end">FLEX.IA</text>

  <!-- Tagline -->
  <text x="${cx}" y="${h - 50}" font-family="monospace" font-size="9" fill="${ANNOTATION}" letter-spacing="3" text-anchor="middle">START YOUR SESSION AND TRANSFORM YOUR BODY WITH COMPUTER VISION.</text>
</svg>`;
}

function faviconSvg(): string {
  return `
<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" fill="${BG}"/>
  <!-- Subtle stripes -->
  ${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 5}" y="0" width="2" height="48" fill="${BG}" opacity="0.7"/>`).join("")}
  <!-- Asterisk mark -->
  <text x="24" y="26" font-family="monospace" font-size="32" fill="${WHITE}" text-anchor="middle" dominant-baseline="central">✳</text>
</svg>`;
}

async function generate() {
  console.log("Generating OG images and favicon...\n");

  // OG image 1200x630
  const ogBuffer = Buffer.from(ogSvg(1200, 630));
  await sharp(ogBuffer).png({ quality: 90 }).toFile(join(OUT, "og.png"));
  console.log("  ✓ public/og.png (1200×630)");

  // Twitter OG 1200x600
  const twitterBuffer = Buffer.from(ogSvg(1200, 600));
  await sharp(twitterBuffer)
    .png({ quality: 90 })
    .toFile(join(OUT, "og-twitter.png"));
  console.log("  ✓ public/og-twitter.png (1200×600)");

  // Favicon — generate 48px PNG then convert to ICO manually
  const favBuffer = Buffer.from(faviconSvg());

  const png48 = await sharp(favBuffer)
    .resize(48, 48)
    .png()
    .toBuffer();
  const png32 = await sharp(favBuffer)
    .resize(32, 32)
    .png()
    .toBuffer();
  const png16 = await sharp(favBuffer)
    .resize(16, 16)
    .png()
    .toBuffer();

  // Build ICO container (multi-size)
  const ico = buildIco([
    { size: 16, data: png16 },
    { size: 32, data: png32 },
    { size: 48, data: png48 },
  ]);
  writeFileSync(join(OUT, "favicon.ico"), ico);
  console.log("  ✓ public/favicon.ico (16+32+48)");

  console.log("\nDone!");
}

/** Minimal ICO file builder */
function buildIco(images: { size: number; data: Buffer }[]): Buffer {
  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + entrySize * images.length;

  // ICO header
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = dirSize;
  const entries: Buffer[] = [];
  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 0); // width
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.data.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += img.data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

generate().catch(console.error);
