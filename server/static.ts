import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve hashed assets (e.g. /assets/index-AbCdEf.js) with a 1-year cache.
  // Vite fingerprints every asset filename so stale-cache is never an issue.
  app.use(
    "/assets",
    express.static(path.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
    }),
  );

  // Serve everything else (favicon, manifest, etc.) with a short cache.
  app.use(express.static(distPath, { maxAge: "1h" }));

  // Fall through to index.html for client-side routing (SPA fallback).
  app.use("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
