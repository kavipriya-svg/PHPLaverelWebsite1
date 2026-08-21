---
name: Hostinger Production Setup
description: 19dogs.com is hosted on Hostinger (Ubuntu VPS with nginx), NOT on Replit deployment. Critical for all production-related decisions.
---

# Hostinger Production Setup

## The fact
19dogs.com runs on a **Hostinger VPS** (nginx/1.24.0 on Ubuntu), not on Replit's deployment infrastructure.

**Evidence:**
- `Server: nginx/1.24.0 (Ubuntu)` in response headers
- Static file ETags use nginx inode format (`"694a445b-124a28"`), not Express ETags
- `/uploads/filename.png` and `/objects/uploads/uuid` are served as static directories by nginx from local disk

**Why:**
Replit's "Publish" button deploys to Replit's cloud — it has **zero effect on 19dogs.com**. The user deploys to Hostinger separately (manually or via script).

## File storage on Hostinger
nginx on Hostinger serves two static directories:
- `/uploads/` — files with extensions (e.g. `uuid.png`) — the standard upload path
- `/objects/uploads/` — files without extensions (matching Replit Object Storage URL pattern)

Both are real persistent directories on the Hostinger VPS filesystem. Local disk persists between restarts and deployments on a VPS.

## Upload code must use local disk, NOT Replit Object Storage
Replit Object Storage connects to `http://127.0.0.1:1106` (Replit's internal sidecar). This does NOT exist on Hostinger. Any upload code that calls `ObjectStorageService.getObjectEntityUploadURL()` will crash in production.

**Correct upload pattern for Hostinger:**
```typescript
const ext = (req.file.originalname.split(".").pop() || "").toLowerCase();
const filename = ext ? `${randomUUID()}.${ext}` : randomUUID();
fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
res.json({ url: `/uploads/${filename}`, fileUrl: `/uploads/${filename}` });
```

## How to apply changes to production
Changes in Replit dev must be **manually deployed to Hostinger** by the user (e.g. git pull, rsync, or FTP). There is no automatic sync.

## What IS shared between Replit dev and Hostinger
- The **PostgreSQL database** — same `DATABASE_URL`. DB changes (schema, indexes, data) applied in Replit dev affect production immediately.

## Production environment and schema sync
When the PostgreSQL password or connection URL changes on the VPS, PM2 must be restarted with `--update-env` and then saved; otherwise the running app can continue using its previous environment.

Passwords containing URL-reserved characters must be percent-encoded in `DATABASE_URL` before Node/pg can parse the URL. After the connection is fixed, verify the deployed schema against the app schema: a missing additive column can make otherwise healthy API routes return 500. Prefer a targeted `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for a known missing column, or review `npm run db:push` changes before applying a broader sync.

**Why:** Production had a valid PostgreSQL server but an old malformed PM2 URL and a schema missing a newly required category field; separating connection repair from the minimal schema repair made the failure diagnosable without destructive changes.
