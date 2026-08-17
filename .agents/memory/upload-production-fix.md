---
name: Admin Upload — Production Fix
description: Root cause and fix for admin image uploads failing in production.
---

# Admin Upload — Production Fix

## The root cause
`/api/upload/file` (the endpoint all admin pages use) was configured with multer **disk storage** — it saved files to the local `/uploads/` directory and returned `/uploads/<filename>` as the URL. In production (containerised Replit deployment), local disk doesn't persist, so the URL was immediately broken.

All working images in the system use Replit Object Storage at `/objects/uploads/<uuid>`.

**Why:**  The two-step Object Storage flow (presigned URL → client PUT → finalize) was implemented for the admin panel's direct uploads, but the simple `/api/upload/file` endpoint that all admin pages call was never migrated to use it.

## The fix (August 2026)
Changed `/api/upload/file` and `/api/user/upload/file` to:
1. Use `multer.memoryStorage()` instead of disk storage — file lands in `req.file.buffer`
2. Call `objectStorageService.getObjectEntityUploadURL()` to get a signed PUT URL
3. PUT the buffer to Object Storage via `fetch(presignedUrl, { method: "PUT", body: req.file.buffer })`
4. Call `trySetObjectEntityAclPolicy(presignedUrl, { owner, visibility: "public" })` to make it public
5. Return `{ url: objectPath, fileUrl: objectPath }` where `objectPath` is `/objects/uploads/<uuid>`

Also removed the defunct `app.use("/uploads", express.static(uploadsDir))` static file server.

## How to apply
Any future file upload endpoint must use Object Storage, not local disk. Local disk is ephemeral in production.
The pattern: memoryStorage → getObjectEntityUploadURL → PUT buffer → trySetObjectEntityAclPolicy → return `/objects/uploads/<uuid>`.
