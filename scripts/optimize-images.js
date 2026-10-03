#!/usr/bin/env node
/*
  Shrinks big photos so the website loads fast on phones. GitHub runs this on every push.
  You can also run it on your computer:   npm install sharp   then   node scripts/optimize-images.js

  - Photos in images/gallery/  : longest side limited to 1600 px, about 85% quality
  - Pictures in images/products/: longest side limited to 800 px
  - Fixes photos that were rotated sideways by the phone camera
  - Removes hidden data inside photos (such as the GPS location where it was taken)
  - Keeps the same file name and type, so nothing on the website breaks
  - Skips photos that are already small, so running it twice does nothing the second time
  KEEP YOUR ORIGINAL PHOTOS on your computer: the copy in the repo is replaced by the small one.
*/
"use strict";
const fs = require("fs");
const path = require("path");

let sharp;
try { sharp = require("sharp"); }
catch (e) { console.error("The 'sharp' package is missing. Run:  npm install sharp"); process.exit(1); }

const ROOT = path.join(__dirname, "..");
const RULES = [
  { dir: path.join(ROOT, "images", "gallery"), maxSide: 1600, maxBytes: 350 * 1024 },
  { dir: path.join(ROOT, "images", "products"), maxSide: 800, maxBytes: 150 * 1024 }
];
const EXT = /\.(jpe?g|png|webp)$/i;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : (EXT.test(d.name) ? [p] : []);
  });
}
const kb = n => Math.round(n / 1024) + " KB";

async function optimize(file, rule) {
  const before = fs.statSync(file).size;
  const meta = await sharp(file).metadata();
  const tilted = meta.orientation && meta.orientation > 1;
  const tooBig = Math.max(meta.width || 0, meta.height || 0) > rule.maxSide || before > rule.maxBytes;
  const hasHiddenData = !!meta.exif; // camera data such as GPS location
  if (!tooBig && !tilted && !hasHiddenData) return null; // already fine

  let img = sharp(file).rotate().resize({ width: rule.maxSide, height: rule.maxSide, fit: "inside", withoutEnlargement: true });
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") img = img.png({ compressionLevel: 9, palette: true });
  else if (ext === ".webp") img = img.webp({ quality: 82 });
  else img = img.jpeg({ quality: 82, mozjpeg: true });
  const buf = await img.toBuffer(); // metadata is dropped by default

  // Only replace the file if the result is smaller, or if we had to fix rotation / remove hidden data.
  if (buf.length < before || tilted || hasHiddenData) {
    fs.writeFileSync(file, buf);
    return { before, after: buf.length };
  }
  return null;
}

(async () => {
  let n = 0, saved = 0;
  for (const rule of RULES) {
    for (const file of walk(rule.dir)) {
      try {
        const r = await optimize(file, rule);
        if (r) {
          n++; saved += r.before - r.after;
          console.log("  " + path.relative(ROOT, file) + ": " + kb(r.before) + " -> " + kb(r.after));
        }
      } catch (e) { console.warn("  skipped " + path.relative(ROOT, file) + ": " + e.message); }
    }
  }
  console.log(n ? "Optimized " + n + " image(s), saved " + kb(saved) + "." : "All images are already small.");
})();
