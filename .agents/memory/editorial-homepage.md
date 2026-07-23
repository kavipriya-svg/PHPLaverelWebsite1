---
name: Editorial Homepage Architecture
description: How the 19 DOGS editorial homepage is structured and connected to the rest of the app.
---

## Rule
The homepage (route `/`) uses `HomeLayout` (no Header, no Footer) so it can render its own editorial header and footer matching the Stitch-generated design.

**Why:** The editorial design has a completely different header/footer style (Playfair Display, deep forest green palette) from the existing Shadcn-based `StoreLayout` header. Sharing StoreLayout would result in a double header.

**How to apply:** In `App.tsx`, the `/` route is wrapped in `HomeLayout` (a bare Suspense wrapper). All other store routes use `StoreLayout`. Admin routes use `AdminLayout`.

## Key files
- `client/src/pages/Home.tsx` — Complete editorial page with 13 sections, each as its own component
- `client/src/lib/homeApi.ts` — Service layer for home page API calls (helper functions)
- `tailwind.config.ts` — `ed-*` color tokens, `stack-lg/gutter/margin-desktop` spacing, `playfair` font family, editorial font sizes
- `client/src/index.css` — `.hard-shadow`, `.reveal/.reveal.active`, `.editorial-img-hover`, `.border-b-only` utilities

## Backend endpoints added
- `POST /api/newsletter/subscribe` — stores emails as JSON array in settings key `newsletter_subscribers`
- `GET /api/reviews/approved` — public endpoint for approved reviews (used as testimonials)

## Color palette constants
The editorial colors live in a `C` constant at the top of `Home.tsx`:
- `C.primary`: `#00160c` (deep forest green)
- `C.secondary`: `#944923` (warm brown/terracotta)
- `C.surface`: `#f9faf6` (off-white)
- `C.primaryContainer`: `#012d1d` (dark green for newsletter bg)

## API connections
- Best Sellers: `/api/products?featured=true&limit=4`
- Trending Apparel: `/api/products?trending=true&limit=3`
- Category Hub: `/api/categories` (filters to top-level, first 4)
- Testimonials: `/api/reviews/approved?limit=2`
