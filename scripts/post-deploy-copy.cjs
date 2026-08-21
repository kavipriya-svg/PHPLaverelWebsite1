#!/usr/bin/env node
/**
 * post-deploy-copy.cjs
 *
 * Runs as "postinstall" on every npm install.
 * Only does real work on the production server after an rsync deploy.
 *
 * The CI/CD rsync uploads built files to /var/www/19dogs/ (i.e. the project root):
 *   /var/www/19dogs/public/    ← Vite-built client (index.html + hashed assets)
 *   /var/www/19dogs/index.cjs  ← esbuild server bundle
 *
 * But PM2 was originally set up to run /var/www/19dogs/dist/index.cjs, which means
 * Express serves static files from /var/www/19dogs/dist/public/ — a path rsync
 * never touches.
 *
 * This script copies the freshly uploaded files into dist/ so PM2/Express sees them.
 *
 * Safety guards (all must be true to proceed):
 *   1. ./index.cjs exists at the project root  ← only present on server after rsync
 *   2. ./public/ directory exists              ← only present on server after rsync
 *   3. ./dist/ directory exists               ← pre-existing from initial deploy
 */

const fs   = require("fs");
const path = require("path");

// __dirname for a .cjs file is always the directory of the script itself.
const root      = path.resolve(__dirname, "..");   // one level up from scripts/
const srcCjs    = path.join(root, "index.cjs");
const srcPublic = path.join(root, "public");
const dstDist   = path.join(root, "dist");

const isProductionServer =
  fs.existsSync(srcCjs) &&      // guard 1: rsync-placed server bundle at root
  fs.existsSync(srcPublic) &&   // guard 2: rsync-placed static dir at root
  fs.existsSync(dstDist);       // guard 3: original dist dir must exist

if (!isProductionServer) {
  console.log("post-deploy-copy: not a production server context — skipping.");
  process.exit(0);
}

console.log("post-deploy-copy: production server detected. Syncing files into dist/ …");

// Copy public/ → dist/public/
console.log("  public/ → dist/public/");
copyDirSync(srcPublic, path.join(dstDist, "public"));

// Copy index.cjs → dist/index.cjs
console.log("  index.cjs → dist/index.cjs");
fs.copyFileSync(srcCjs, path.join(dstDist, "index.cjs"));

console.log("post-deploy-copy: done ✓");

// ─── helpers ──────────────────────────────────────────────────────────────────

function copyDirSync(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcEntry = path.join(src, entry.name);
    const dstEntry = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcEntry, dstEntry);
    } else {
      fs.copyFileSync(srcEntry, dstEntry);
    }
  }
}
