#!/usr/bin/env node
/*
  Builds js/gallery-data.js from your folders. GitHub runs this on every push.
  You can also run it yourself:  node scripts/build-gallery.js

  PHOTOS  : every image inside  images/gallery/<category>/
  VIDEOS  : every YouTube link inside  videos/<category>.txt  (one link per line)
  PRODUCT PICTURES : one image per product inside  images/products/  named after the product,
                     for example roller.jpg, roman.webp, motorized.png (the "What we make" list)
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const IMG_DIR = path.join(ROOT, "images", "gallery");
const VID_DIR = path.join(ROOT, "videos");
const PROD_DIR = path.join(ROOT, "images", "products");
const OUT = path.join(ROOT, "js", "gallery-data.js");
const IMG_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

// Known categories: order and display name. Any other folder you create is added at the end.
const KNOWN = [
  ["motorized", "Motorized curtains and blinds"],
  ["curtains", "Curtains"],
  ["roller", "Roller blinds"],
  ["roman", "Roman blinds"],
  ["vertical", "Vertical blinds"],
  ["honeycomb", "Honeycomb blinds"],
  ["chick", "PVC and wooden chick blinds"],
  ["skylight", "Skylight blinds"],
  ["awning", "Awnings"],
  ["film", "Sun control and decorative film"],
  ["repair", "Repairs"]
];

function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
}

function prettyKey(k) { return k.charAt(0).toUpperCase() + k.slice(1).replace(/[-_]+/g, " "); }

function titleFromFile(name) {
  // Camera and WhatsApp file names (IMG_9384, WhatsApp Image 2026...) make bad captions: show none.
  if (/^(img|dsc|dscn|pxl|photo|image|whatsapp|screenshot|vid|mvimg)[\s_-]*\d/i.test(name) || /^\d+\.[^.]+$/.test(name)) return "";
  let t = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+\d+$/, "").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

// When was this file added? Newest photos are shown first.
function addedTime(file) {
  try {
    const out = execSync('git log -1 --format=%ct -- "' + file + '"', { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (out) return parseInt(out, 10) * 1000;
  } catch (e) { /* not a git repo, or file not committed yet */ }
  return fs.statSync(file).mtimeMs;
}

function photosFor(cat) {
  const dir = path.join(IMG_DIR, cat);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => IMG_EXT.test(f))
    .map(f => ({ f, t: addedTime(path.join(dir, f)) }))
    .sort((a, b) => b.t - a.t || a.f.localeCompare(b.f, undefined, { numeric: true }))
    .map(o => ({
      src: ["images", "gallery", cat, o.f].map(encodeURIComponent).join("/"),
      title: titleFromFile(o.f)
    }));
}

function youtubeId(url) {
  let m;
  if ((m = url.match(/youtu\.be\/([\w-]{11})/))) return { id: m[1], vertical: false };
  if ((m = url.match(/youtube\.com\/shorts\/([\w-]{11})/))) return { id: m[1], vertical: true };
  if ((m = url.match(/[?&]v=([\w-]{11})/))) return { id: m[1], vertical: false };
  if ((m = url.match(/youtube\.com\/(?:embed|live)\/([\w-]{11})/))) return { id: m[1], vertical: false };
  if (/^[\w-]{11}$/.test(url)) return { id: url, vertical: false };
  return null;
}

function videosFor(cat) {
  const file = path.join(VID_DIR, cat + ".txt");
  if (!fs.existsSync(file)) return [];
  const out = [];
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const parts = line.split("|");
    const yt = youtubeId(parts[0].trim());
    if (!yt) { console.warn("  skipped " + cat + ".txt line " + (i + 1) + ": not a YouTube link"); return; }
    out.push({ youtube: yt.id, vertical: yt.vertical, title: (parts[1] || "").trim() });
  });
  return out;
}

const keys = KNOWN.map(k => k[0]);
listDirs(IMG_DIR).concat(fs.existsSync(VID_DIR) ? fs.readdirSync(VID_DIR).filter(f => /\.txt$/i.test(f)).map(f => f.replace(/\.txt$/i, "")) : [])
  .forEach(k => { if (!keys.includes(k)) keys.push(k); });

const labels = Object.fromEntries(KNOWN);
const categories = keys.map(k => {
  const photos = photosFor(k);
  const videos = videosFor(k);
  videos.forEach(v => { if (!v.title) v.title = (labels[k] || prettyKey(k)) + " video"; });
  return { key: k, label: labels[k] || prettyKey(k), photos, videos };
}).filter(c => c.photos.length || c.videos.length);

// One picture per product for the "What we make" list. File name (without extension) = product key.
const products = {};
if (fs.existsSync(PROD_DIR)) {
  fs.readdirSync(PROD_DIR).filter(f => IMG_EXT.test(f)).sort().forEach(f => {
    const key = f.replace(/\.[^.]+$/, "").toLowerCase();
    if (products[key]) return;
    const hash = crypto.createHash("md5").update(fs.readFileSync(path.join(PROD_DIR, f))).digest("hex").slice(0, 8);
    products[key] = "images/products/" + encodeURIComponent(f) + "?v=" + hash; // ?v= makes browsers reload a replaced picture
  });
}

const body = "/* AUTO-GENERATED by scripts/build-gallery.js. Do not edit by hand. */\n" +
  "window.GALLERY = " + JSON.stringify({ categories, products }, null, 2) + ";\n";

if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== body) fs.writeFileSync(OUT, body);
const np = categories.reduce((n, c) => n + c.photos.length, 0);
const nv = categories.reduce((n, c) => n + c.videos.length, 0);
console.log("Gallery built: " + np + " photos, " + nv + " videos, " + categories.length + " sections, " + Object.keys(products).length + " product pictures.");
