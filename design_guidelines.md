# eCommerce Application Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from modern eCommerce leaders (Shopify, Etsy, Amazon) combined with contemporary design trends. The design prioritizes product discovery, trust-building, and frictionless purchasing while maintaining visual sophistication.

## Core Design Principles
1. **Product-First Visual Hierarchy**: Every page guides users toward discovering and purchasing products
2. **Trust & Transparency**: Clear pricing, shipping info, and order tracking build confidence
3. **Efficient Navigation**: Three-level category system must be intuitive and accessible
4. **Mobile Commerce Ready**: Touch-friendly interactions with thumb-zone optimization

---

## Typography System

### Font Families
- **Primary**: Inter or Outfit (headings, navigation, buttons) - clean, modern sans-serif via Google Fonts
- **Secondary**: System font stack for body text and product descriptions (optimal readability)
- **Accent**: DM Sans for pricing and CTAs (numbers need clarity)

### Type Scale
- **Hero Headline**: text-5xl md:text-7xl, font-bold, tracking-tight
- **Section Headers**: text-3xl md:text-4xl, font-semibold
- **Product Titles**: text-xl font-medium
- **Body Text**: text-base leading-relaxed
- **Small Print**: text-sm (shipping info, disclaimers)
- **Price Display**: text-2xl font-bold (current price), text-lg line-through (original price)

---

## Layout System

### Spacing Primitives
Consistent Tailwind units: **2, 4, 6, 8, 12, 16, 20, 24, 32** for padding, margins, and gaps
- Component spacing: p-4 to p-8
- Section spacing: py-16 md:py-24
- Grid gaps: gap-6 md:gap-8

### Container Strategy
- **Full-width**: Hero sections, category banners (w-full)
- **Standard content**: max-w-7xl mx-auto px-4
- **Product grids**: max-w-screen-2xl
- **Forms/checkout**: max-w-2xl

### Grid Systems
- **Product grid**: grid-cols-2 md:grid-cols-3 lg:grid-cols-4
- **Category tiles**: grid-cols-2 md:grid-cols-3
- **Feature showcase**: grid-cols-1 md:grid-cols-2

---

## Navigation Architecture

### Header (Sticky)
- **Top bar**: Promotional message/free shipping banner (text-sm, dismissible)
- **Main navigation bar**: Logo (left), search bar (center, expandable), icons cluster (right: wishlist, cart with badge, account, order tracking)
- **Mega menu**: Three-level category dropdown on hover - main categories in columns, subcategories nested, child categories as links with hover underline

### Search Implementation
Large search input with icon, suggestion dropdown showing categories + recent searches + popular products, category filter dropdown integrated

---

## Component Library

### Product Cards
- Image container (aspect-square, hover zoom effect)
- Quick-add button overlay (appears on hover, blurred background)
- Badge stack (top-right): "Sale" / "New" / "Trending" tags
- Product title (truncate after 2 lines)
- Star rating (small, inline)
- Price display: current price prominent, original price struck-through if on sale
- Wishlist heart icon (top-left, outline becomes filled)

### Hero Section
- Full-width, height: 70vh on desktop, 60vh on mobile
- Background: Video (autoplay, muted, loop) OR large hero image with subtle parallax
- Centered content overlay with blurred backdrop for text/CTA containers
- Large headline (text-6xl font-bold)
- Subheadline (text-xl)
- Primary CTA button with blurred background, no hover state needed
- Breadcrumb trail at bottom for category pages

### Cart Components
- **Mini cart dropdown**: Slide-in panel from right, product thumbnails, quantity adjusters, subtotal, "View Cart" and "Checkout" buttons
- **Cart page**: Table layout on desktop, stacked cards on mobile, quantity selectors, remove icon, running subtotal sidebar
- **Checkout**: Multi-step progress indicator, collapsible sections (shipping, payment, review), order summary sticky sidebar

### Order Tracking Interface
Modal or dedicated page with two-column layout:
- **Input section**: Order ID and Email fields, "Track Order" button
- **Status display**: Timeline visualization showing order stages (Pending → Processing → Shipped → Delivered), tracking number, estimated delivery date, shipment updates

### Homepage Blocks (Admin-Controlled)
- **Featured Products Carousel**: Auto-scroll, 4-6 visible items, nav arrows
- **Category Showcase**: Large image tiles (3 columns), category name overlay with blurred background
- **Promotional Banner**: Full-width, 2-column layout (image + text), strong CTA
- **Special Offers Grid**: 2x2 or 3x3 product grid with "Limited Time" badges
- **Custom HTML Block**: Flexible content area with contained max-width

### Admin Panel Components
- **Dashboard**: Stat cards (4 columns), recent orders table, quick actions
- **Data tables**: Sortable columns, bulk actions, inline edit, pagination controls
- **Form layouts**: Two-column for desktop, stacked for mobile, clear field labels
- **Drag-and-drop**: Visual handles, placeholder slots, smooth reordering
- **Media uploader**: Drag-drop zone, thumbnail previews, delete/reorder gallery images
- **WYSIWYG editor**: Toolbar with common formatting, preview toggle

---

## Images Section

### Product Images
- **Product cards**: Square (1:1 ratio), minimum 600x600px, consistent white/neutral backgrounds
- **Product detail gallery**: Large primary image (800x800px minimum), thumbnail strip below, zoom-on-click functionality, support 4-6 images per product

### Hero Sections
- **Homepage hero**: 1920x800px landscape image or MP4 video (under 10MB), showcasing lifestyle/products, high-quality with focal point centered
- **Category banners**: 1920x400px, category-relevant imagery

### Additional Images
- **Brand logos**: Vector/PNG, transparent backgrounds, displayed in "Our Brands" section
- **Trust badges**: Payment icons (Visa, Mastercard, PayPal), security seals, in footer
- **Category tiles**: 600x600px square images with overlay capability
- **Banner blocks**: Flexible dimensions (typically 1200x600px), promotional imagery

---

## Accessibility & Interactions

- Focus states: Visible ring offset (ring-2 ring-offset-2) on all interactive elements
- Touch targets: Minimum 44x44px for mobile buttons and links
- Skip navigation link for keyboard users
- Alt text for all product images and decorative images marked with empty alt=""
- Form validation: Inline error messages below fields, error states with border highlights
- Loading states: Skeleton screens for product grids, spinner for checkout

### Micro-Interactions
- Cart icon bounce when item added
- Smooth page transitions (fade-in on route change)
- Image lazy loading with blur-up placeholders
- Hover lift on product cards (translate-y-1 shadow-lg)
- Button press feedback (scale-95 on active)

---

## Responsive Breakpoints

- **Mobile**: Base styles, single column layouts, collapsible navigation
- **Tablet (md: 768px)**: 2-column product grids, visible category menu
- **Desktop (lg: 1024px)**: 3-4 column grids, mega menu, sticky filters sidebar
- **Large (xl: 1280px)**: Maximum content width, enhanced spacing

This design system creates a professional, conversion-optimized eCommerce experience that balances visual appeal with functional clarity. Every element serves the dual purpose of aesthetic consistency and user goal achievement.