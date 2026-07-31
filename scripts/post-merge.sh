#!/bin/bash
set -e
npm install
# Push schema with a timeout so it doesn't hang if DB is temporarily unreachable
timeout 30 npm run db:push || echo "db:push skipped (DB not reachable — run manually once DB is available)"
