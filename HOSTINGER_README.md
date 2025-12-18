# Hostinger Deployment Guide

## Folder Structure

```
hostinger_deploy/
├── app/                    # Application files
│   ├── dist/               # Production build
│   │   ├── index.cjs       # Server bundle
│   │   └── public/         # Frontend static files
│   ├── shared/             # Shared types
│   └── package.json        # Dependencies
├── database/               # Database files
│   └── database.sql        # PostgreSQL dump
└── README.md               # This file
```

## Deployment Steps

### 1. Database Setup (Hostinger PostgreSQL)

1. Create a new PostgreSQL database in Hostinger panel
2. Import `database/database.sql` using phpPgAdmin or command line:
   ```bash
   psql -h your_host -U your_user -d your_database < database.sql
   ```

### 2. Application Setup

1. Upload the `app/` folder contents to your Hostinger Node.js hosting
2. Run dependency installation via Hostinger terminal
3. Set environment variables in Hostinger panel:
   - `DATABASE_URL=postgresql://user:password@host:5432/database`
   - `SESSION_SECRET=your_random_secret_key`
   - `NODE_ENV=production`
   - `PORT=3000` (or Hostinger assigned port)

### 3. Start the Application

```bash
node dist/index.cjs
```

Or configure as a process in Hostinger Node.js settings.

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| SESSION_SECRET | Random secret for sessions |
| NODE_ENV | Set to "production" |
| PORT | Server port (default: 5000) |

## Notes

- This is a Node.js application requiring Node.js 18+ hosting
- PostgreSQL database is required (not MySQL)
- Frontend is served from the same Node.js server
