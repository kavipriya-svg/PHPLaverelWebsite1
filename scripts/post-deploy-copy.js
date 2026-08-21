#!/usr/bin/env node
/**
 * post-deploy-copy.js
 *
 * Runs as "postinstall" during production deploys (via npm install in the SSH step).
 * The CI/CD rsync puts built files into /var/www/19dogs/public/ and /var/www/19dogs/index.cjs
 * but PM2 was originally configured to run from /var/www/19dogs/dist/.
 * This script bridges the gap by copying the freshly uploaded files into dist/.
 *
 * Safe to run locally: the `public/` guard ensures it's a no-op if there are
 * no rsync-uploaded files at the project root.
 */

const fs   = require("fs");
const path = require("path");

const root      = __dirname.replace(/[/\\]scripts$/, ""); // project root
const srcPublic = path.join(root, "public");
const dstDist   = path.join(root, "dist");
const srcCjs    = path.join(root, "index.cjs");
const dstCjs    = path.join(dstDist, "index.cjs");

// Only run when rsync has deposited files here (production server only)
if (!fs.existsSync(srcPublic) || !fs.existsSync(dstDist)) {
  console.log("post-deploy-copy: nothing to copy (not a production deploy context).");
  process.exit(0);
}

console.log("post-deploy-copy: copying public/ → dist/public/ …");
copyDirSync(srcPublic, path.join(dstDist, "public"));

if (fs.existsSync(srcCjs)) {
  console.log("post-deploy-copy: copying index.cjs → dist/index.cjs …");
  fs.copyFileSync(srcCjs, dstCjs);
}

console.log("post-deploy-copy: done.");

// ─── helpers ──────────────────────────────────────────────────────────────────

function copyDirSync(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}
