# eCommerce Application

## Overview

This is a full-stack eCommerce web application built with a modern tech stack. The application provides a complete online shopping experience with a public-facing storefront and a comprehensive admin panel for managing products, orders, and site content.

**Key Features:**
- Product catalog with hierarchical categories (3-level: main → sub → child)
- Shopping cart and wishlist functionality
- Order management and tracking
- Admin dashboard for complete store management
- Responsive design optimized for mobile and desktop
- Dynamic home page with customizable content blocks
- Section banner placement system with dynamic controls (position relative to home blocks, width percentage 25/50/75/100%, alignment)
- Multi-banner row layout: banners with complementary widths (e.g., 50%+50%, 75%+25%) display side-by-side on desktop with equal heights, stacking vertically on mobile
- Coupon and promotional offer system
- Multi-variant product support
- Product reviews and ratings with moderation
- Email notifications (order confirmation, status updates, low stock alerts, restock notifications)
- Wishlist sharing and gift registry functionality
- Advanced inventory management with low stock alerts and restock notifications
- Single-use coupon enforcement (one per customer/email per order)
- Three-category coupon display system (product-specific, store-wide, bulk purchase)
- Currency selection from Admin Settings (INR default)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React with TypeScript, using Wouter for routing

**UI Components:** Shadcn/ui component library built on Radix UI primitives, styled with Tailwind CSS

**Design System:**
- Uses the "new-york" style from Shadcn/ui
- Custom Tailwind configuration with CSS variables for theming
- Supports light/dark mode theming
- Typography system using Inter/Outfit for headings, system fonts for body text, and DM Sans for pricing
- Consistent spacing scale and grid systems for layouts
- Product-first visual hierarchy emphasizing discovery and purchasing

**State Management:**
- React Context API for global state (StoreContext for cart/wishlist, ThemeContext for theming)
- TanStack Query (React Query) for server state management and caching
- Form state managed with React Hook Form + Zod validation

**Key Frontend Patterns:**
- Context providers wrap the application to provide global state
- Custom hooks (useAuth, useStore) abstract business logic
- Component composition with reusable UI primitives
- Optimistic updates for better UX
- Error boundaries and loading states

### Backend Architecture

**Runtime:** Node.js with Express.js

**Language:** TypeScript with ES modules

**API Design:** RESTful API with JSON responses

**Key Backend Patterns:**
- Route handlers organized by feature in `server/routes.ts`
- Storage abstraction layer (`server/storage.ts`) separating business logic from database access
- Middleware for authentication, authorization, and request logging
- Role-based access control (admin, manager, support, customer)

**Authentication:**
- Replit Auth integration using OpenID Connect
- Passport.js for authentication strategy
- Session-based authentication with PostgreSQL session store
- Cookie-based session management with httpOnly and secure flags
- Optional authentication for guest browsing with session ID cookies

**Authorization:**
- Role-based middleware (`isAdmin`) for protecting admin routes
- User roles stored in database and checked on each request
- Public routes accessible without authentication
- Protected routes require valid session

### Data Storage

**Database:** PostgreSQL (Neon serverless)

**ORM:** Drizzle ORM with schema-first approach

**Schema Design:**
- **users**: User accounts with role-based permissions
- **categories**: Three-level hierarchical category system (parentId for relationships)
- **brands**: Product brand information
- **products**: Core product data with SKU, pricing, inventory, and SEO fields
- **productImages**: Multiple images per product with primary image designation
- **productVariants**: Product variations (size, color, etc.) with individual pricing and stock
- **coupons**: Discount codes with validation rules and usage tracking
- **orders**: Customer orders with status tracking and payment information
- **orderItems**: Line items for each order with snapshot of product details
- **banners**: Hero and section banners supporting image or video content with placement controls (targetBlockId, relativePlacement above/below, displayWidth 25/50/75/100%, alignment left/center/right)
- **homeBlocks**: Customizable content blocks for home page (featured products, categories, HTML promos)
- **settings**: Key-value store for site configuration
- **addresses**: Customer shipping/billing addresses
- **wishlistItems**: User-specific product wishlists
- **cartItems**: Shopping cart items (session-based for guests, user-linked when authenticated)
- **sessions**: PostgreSQL-backed session storage for authentication
- **reviews**: Product reviews with ratings, titles, content, and moderation status
- **reviewVotes**: Helpful/not helpful votes on reviews with user/session tracking
- **stockNotifications**: Customer email subscriptions for product restock alerts
- **giftRegistries**: User gift registries for events (wedding, birthday, baby shower, etc.)
- **giftRegistryItems**: Products added to gift registries with quantity tracking

**Data Relationships:**
- One-to-many: categories (parent-child), products-images, products-variants, users-orders, orders-orderItems
- Many-to-many: products-categories (via categoryId), users-wishlist (via wishlistItems)
- Cascade deletes configured for dependent records

### External Dependencies

**Database:**
- Neon PostgreSQL serverless database (`@neondatabase/serverless`)
- WebSocket support for database connections

**Authentication:**
- Replit Auth via OpenID Connect
- OAuth 2.0 flow for user authentication

**UI Libraries:**
- Radix UI primitives for accessible components
- Tailwind CSS for styling
- Lucide React for icons
- Google Fonts (Inter, Outfit, DM Sans) for typography

**Development Tools:**
- Vite for frontend build and development
- esbuild for server bundling
- tsx for TypeScript execution in development
- Drizzle Kit for database migrations

**Payment Integration:**
- Stripe (sandbox) for online payments (stub integration ready)
- Cash on Delivery (COD) support

**Session Management:**
- connect-pg-simple for PostgreSQL session store
- express-session for session middleware

**Validation:**
- Zod for runtime type validation
- Drizzle-Zod for automatic schema-to-Zod conversion

**File Storage:**
- Currently uses local storage for product images
- Designed with abstraction for future S3 migration

**Email Service:**
- Resend for transactional emails (order confirmations, status updates, low stock alerts)
- Configurable via RESEND_API_KEY environment variable
- HTML email templates with responsive design
- Admin panel for testing emails and checking low stock

**Notable Architectural Decisions:**

1. **Monorepo Structure**: Client and server code in same repository with shared schema
2. **TypeScript Throughout**: End-to-end type safety from database to UI
3. **Schema-First Design**: Database schema (`shared/schema.ts`) is source of truth
4. **Session-Based Auth**: Chose sessions over JWT for better security and server control
5. **Server-Side Bundling**: esbuild bundles key dependencies to reduce cold start times on deployment
6. **Optimistic UI Updates**: Cart and wishlist operations update UI before server confirmation
7. **Guest Browsing**: Anonymous users can browse and add to cart before authentication