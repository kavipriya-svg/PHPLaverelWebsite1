import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  decimal,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table with role support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  role: varchar("role").default("customer").notNull(), // admin, manager, support, customer (legacy field)
  customerType: varchar("customer_type").default("regular").notNull(), // regular, subscription, retailer, distributor, self_employed
  adminRoleId: varchar("admin_role_id"), // References adminRoles.id for dynamic permissions
  passwordHash: varchar("password_hash"), // For admin email/password authentication
  // Subscription customer specific fields
  subscriptionDiscountType: varchar("subscription_discount_type"), // "percentage" or "fixed"
  subscriptionDiscountValue: decimal("subscription_discount_value", { precision: 10, scale: 2 }),
  subscriptionSaleDiscountType: varchar("subscription_sale_discount_type"), // "percentage" or "fixed" - for products already on sale
  subscriptionSaleDiscountValue: decimal("subscription_sale_discount_value", { precision: 10, scale: 2 }),
  subscriptionDeliveryFee: decimal("subscription_delivery_fee", { precision: 10, scale: 2 }), // legacy field - kept for compatibility
  subscriptionDeliveryFeeCity: decimal("subscription_delivery_fee_city", { precision: 10, scale: 2 }), // delivery fee within city
  subscriptionDeliveryFeeIndia: decimal("subscription_delivery_fee_india", { precision: 10, scale: 2 }), // delivery fee within India
  subscriptionDeliverySchedule: varchar("subscription_delivery_schedule"), // "daily", "weekly", "biweekly", "monthly"
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  subscriptionNotes: text("subscription_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  addresses: many(addresses),
  wishlistItems: many(wishlistItems),
  cartItems: many(cartItems),
  subscriptionCategoryDiscounts: many(subscriptionCategoryDiscounts),
}));

// Subscription category discounts - per-customer, per-category discount settings
export const subscriptionCategoryDiscounts = pgTable("subscription_category_discounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  categoryId: varchar("category_id").notNull(),
  discountType: varchar("discount_type").notNull(), // "percentage" or "fixed"
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  saleDiscountType: varchar("sale_discount_type"), // "percentage" or "fixed" - for products already on sale
  saleDiscountValue: decimal("sale_discount_value", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("subscription_category_discounts_customer_category_idx").on(table.customerId, table.categoryId),
]);

export const subscriptionCategoryDiscountsRelations = relations(subscriptionCategoryDiscounts, ({ one }) => ({
  customer: one(users, {
    fields: [subscriptionCategoryDiscounts.customerId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [subscriptionCategoryDiscounts.categoryId],
    references: [categories.id],
  }),
}));

export const insertSubscriptionCategoryDiscountSchema = createInsertSchema(subscriptionCategoryDiscounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSubscriptionCategoryDiscount = z.infer<typeof insertSubscriptionCategoryDiscountSchema>;
export type SubscriptionCategoryDiscount = typeof subscriptionCategoryDiscounts.$inferSelect;

// Subscription Delivery Tiers - weight-based delivery fees for Chennai and PAN India
export const subscriptionDeliveryTiers = pgTable("subscription_delivery_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: varchar("label").notNull(), // Display label like "Up to 1kg", "1-3kg", etc.
  upToWeightKg: decimal("up_to_weight_kg", { precision: 10, scale: 2 }).notNull(), // Weight threshold in kg
  chennaiFee: decimal("chennai_fee", { precision: 10, scale: 2 }).notNull(), // Delivery fee for Chennai
  panIndiaFee: decimal("pan_india_fee", { precision: 10, scale: 2 }).notNull(), // Delivery fee for PAN India
  sortOrder: integer("sort_order").default(0), // For ordering tiers
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionDeliveryTierSchema = createInsertSchema(subscriptionDeliveryTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSubscriptionDeliveryTier = z.infer<typeof insertSubscriptionDeliveryTierSchema>;
export type SubscriptionDeliveryTier = typeof subscriptionDeliveryTiers.$inferSelect;

// OTP codes for verification (signup, forgot password, etc.)
export const otpCodes = pgTable("otp_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  code: varchar("code", { length: 8 }).notNull(),
  purpose: varchar("purpose").notNull(), // signup, forgot_password, phone_verify
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({
  id: true,
  createdAt: true,
});
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;

// Categories with 3-level hierarchy (main -> sub -> child)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id"),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  iconUrl: varchar("icon_url"), // Icon image for menu display
  bannerUrl: varchar("banner_url"), // Banner image for category page header
  position: integer("position").default(0),
  isActive: boolean("is_active").default(true),
  metaTitle: varchar("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: varchar("meta_keywords"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryHierarchy",
  }),
  children: many(categories, { relationName: "categoryHierarchy" }),
  products: many(products),
}));

// Brands
export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  logoUrl: varchar("logo_url"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: varchar("sku").notNull().unique(),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  brandId: varchar("brand_id"),
  categoryId: varchar("category_id"),
  shortDesc: text("short_desc"),
  longDesc: text("long_desc"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  salePriceStart: timestamp("sale_price_start"),
  salePriceEnd: timestamp("sale_price_end"),
  stock: integer("stock").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  allowBackorder: boolean("allow_backorder").default(false),
  restockDate: timestamp("restock_date"),
  warehouseLocation: varchar("warehouse_location"),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  dimensions: varchar("dimensions"),
  expectedDeliveryDays: integer("expected_delivery_days").default(5), // Expected delivery in days
  // Product badges/features
  freeShipping: boolean("free_shipping").default(true),
  shippingText: varchar("shipping_text").default("Free Shipping"),
  returnDays: integer("return_days").default(30),
  returnText: varchar("return_text").default("Easy Returns"),
  secureCheckout: boolean("secure_checkout").default(true),
  secureCheckoutText: varchar("secure_checkout_text").default("Secure Checkout"),
  // Product-specific banner
  bannerUrl: varchar("banner_url"),
  bannerTitle: varchar("banner_title"),
  bannerSubtitle: varchar("banner_subtitle"),
  bannerCtaText: varchar("banner_cta_text"),
  bannerCtaLink: varchar("banner_cta_link"),
  couponBoxBgColor: varchar("coupon_box_bg_color").default("#f0fdf4"), // Background color for coupon box on product page
  isFeatured: boolean("is_featured").default(false),
  isTrending: boolean("is_trending").default(false),
  isNewArrival: boolean("is_new_arrival").default(false),
  isOnSale: boolean("is_on_sale").default(false),
  isActive: boolean("is_active").default(true),
  averageRating: decimal("average_rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).default("18"), // GST percentage for this product
  metaTitle: varchar("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: varchar("meta_keywords"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  variants: many(productVariants),
  orderItems: many(orderItems),
  wishlistItems: many(wishlistItems),
  cartItems: many(cartItems),
}));

// Product Images (supports images and videos)
export const productImages = pgTable("product_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  url: varchar("url").notNull(),
  altText: varchar("alt_text"),
  mediaType: varchar("media_type").default("image"), // image, video
  isPrimary: boolean("is_primary").default(false),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

// Product Variants
export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  optionName: varchar("option_name").notNull(),
  optionValue: varchar("option_value").notNull(),
  sku: varchar("sku"),
  price: decimal("price", { precision: 10, scale: 2 }),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }), // Sale price for discount display
  stock: integer("stock").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

// Coupons
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(),
  type: varchar("type").notNull(), // percentage, fixed
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  minCartTotal: decimal("min_cart_total", { precision: 10, scale: 2 }),
  minQuantity: integer("min_quantity"), // Minimum quantity of items required for volume discounts
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  productId: varchar("product_id"), // If set, coupon is product-specific; null means general coupon
  description: text("description"), // Description shown to customers
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  userId: varchar("user_id"),
  guestEmail: varchar("guest_email"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default("pending").notNull(), // pending, processing, shipped, delivered, cancelled
  paymentMethod: varchar("payment_method"), // stripe, cod, razorpay
  paymentStatus: varchar("payment_status").default("pending"), // pending, paid, failed
  razorpayOrderId: varchar("razorpay_order_id"),
  razorpayPaymentId: varchar("razorpay_payment_id"),
  shippingAddress: jsonb("shipping_address"),
  billingAddress: jsonb("billing_address"),
  trackingNumber: varchar("tracking_number"),
  trackingStatus: varchar("tracking_status"),
  trackingUpdates: jsonb("tracking_updates"),
  couponCode: varchar("coupon_code"),
  notes: text("notes"),
  // POS-specific fields
  orderType: varchar("order_type").default("online"), // online, pos
  posPaymentType: varchar("pos_payment_type"), // cash, card, credit, upi
  posCustomerName: varchar("pos_customer_name"),
  posCustomerPhone: varchar("pos_customer_phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

// Order Items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  productId: varchar("product_id").notNull(),
  variantId: varchar("variant_id"),
  title: varchar("title").notNull(),
  sku: varchar("sku"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  imageUrl: varchar("image_url"),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).default("18"), // GST rate at time of purchase
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Banners (Hero and promotional)
export const banners = pgTable("banners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // hero, section
  title: varchar("title"),
  subtitle: varchar("subtitle"),
  mediaUrl: varchar("media_url"),
  videoUrl: varchar("video_url"),
  mediaType: varchar("media_type").default("image"), // image, video
  autoplay: boolean("autoplay").default(true),
  ctaText: varchar("cta_text"),
  ctaLink: varchar("cta_link"),
  position: integer("position").default(0),
  isActive: boolean("is_active").default(true),
  // Section banner placement options
  targetBlockId: varchar("target_block_id"), // Home block ID to position relative to
  relativePlacement: varchar("relative_placement").default("below"), // "above" or "below" the target block
  displayWidth: integer("display_width").default(100), // Width percentage: 50, 75, or 100
  alignment: varchar("alignment").default("center"), // "left", "center", or "right"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Home Blocks (Reorderable homepage sections)
export const homeBlocks = pgTable("home_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // featured_products, category_products, promo_html, banner_carousel, custom_code
  title: varchar("title"),
  payload: jsonb("payload"), // Configuration data for the block
  position: integer("position").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Settings
export const settings = pgTable("settings", {
  key: varchar("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Addresses
export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: varchar("type").default("shipping"), // shipping, billing
  isDefault: boolean("is_default").default(false),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  company: varchar("company"),
  gstNumber: varchar("gst_number"), // Optional GST number for business invoicing
  address1: varchar("address1").notNull(),
  address2: varchar("address2"),
  city: varchar("city").notNull(),
  state: varchar("state"),
  postalCode: varchar("postal_code").notNull(),
  country: varchar("country").notNull(),
  phone: varchar("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

// Wishlist Items
export const wishlistItems = pgTable("wishlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  productId: varchar("product_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));

// Cart Items
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  sessionId: varchar("session_id"),
  productId: varchar("product_id").notNull(),
  variantId: varchar("variant_id"),
  comboOfferId: varchar("combo_offer_id"), // Track which combo offer this item belongs to
  quantity: integer("quantity").notNull().default(1),
  deliveryDate: varchar("delivery_date"), // Selected delivery date for subscription customers (YYYY-MM-DD format)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

// Product Reviews
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  userId: varchar("user_id"),
  orderId: varchar("order_id"),
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title"),
  content: text("content"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  isApproved: boolean("is_approved").default(false), // Moderation status
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  votes: many(reviewVotes),
}));

// Verified Razorpay Payments - Server-side verification ledger
export const verifiedRazorpayPayments = pgTable("verified_razorpay_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  razorpayOrderId: varchar("razorpay_order_id").notNull(),
  razorpayPaymentId: varchar("razorpay_payment_id").notNull(),
  userId: varchar("user_id"),
  guestSessionId: varchar("guest_session_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("INR"),
  status: varchar("status").default("verified").notNull(), // verified, consumed, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type VerifiedRazorpayPayment = typeof verifiedRazorpayPayments.$inferSelect;
export type InsertVerifiedRazorpayPayment = typeof verifiedRazorpayPayments.$inferInsert;

// Review Helpful Votes
export const reviewVotes = pgTable("review_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").notNull(),
  userId: varchar("user_id"),
  sessionId: varchar("session_id"),
  isHelpful: boolean("is_helpful").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviewVotesRelations = relations(reviewVotes, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewVotes.reviewId],
    references: [reviews.id],
  }),
  user: one(users, {
    fields: [reviewVotes.userId],
    references: [users.id],
  }),
}));

// Shared Wishlists - Allow users to share their wishlist publicly
export const sharedWishlists = pgTable("shared_wishlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  shareCode: varchar("share_code").notNull().unique(), // Unique code for sharing
  title: varchar("title").default("My Wishlist"),
  description: text("description"),
  isPublic: boolean("is_public").default(true),
  allowAnonymous: boolean("allow_anonymous").default(true), // Allow non-logged-in users to view
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sharedWishlistsRelations = relations(sharedWishlists, ({ one }) => ({
  user: one(users, {
    fields: [sharedWishlists.userId],
    references: [users.id],
  }),
}));

// Gift Registries - For weddings, baby showers, birthdays, etc.
export const giftRegistries = pgTable("gift_registries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  shareCode: varchar("share_code").notNull().unique(),
  title: varchar("title").notNull(),
  eventType: varchar("event_type").notNull(), // wedding, baby_shower, birthday, housewarming, other
  eventDate: timestamp("event_date"),
  description: text("description"),
  coverImage: varchar("cover_image"),
  registrantName: varchar("registrant_name"),
  partnerName: varchar("partner_name"), // For wedding registries
  shippingAddressId: varchar("shipping_address_id"), // Link to addresses table
  isPublic: boolean("is_public").default(true),
  showPurchased: boolean("show_purchased").default(false), // Show which items have been bought
  allowMessages: boolean("allow_messages").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const giftRegistriesRelations = relations(giftRegistries, ({ one, many }) => ({
  user: one(users, {
    fields: [giftRegistries.userId],
    references: [users.id],
  }),
  shippingAddress: one(addresses, {
    fields: [giftRegistries.shippingAddressId],
    references: [addresses.id],
  }),
  items: many(giftRegistryItems),
}));

// Gift Registry Items
export const giftRegistryItems = pgTable("gift_registry_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  registryId: varchar("registry_id").notNull(),
  productId: varchar("product_id").notNull(),
  variantId: varchar("variant_id"),
  quantityDesired: integer("quantity_desired").default(1),
  quantityPurchased: integer("quantity_purchased").default(0),
  priority: varchar("priority").default("normal"), // high, normal, low
  note: text("note"), // Personal note about why they want this
  isPurchased: boolean("is_purchased").default(false),
  purchasedBy: varchar("purchased_by"), // userId or email of purchaser
  purchasedAt: timestamp("purchased_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const giftRegistryItemsRelations = relations(giftRegistryItems, ({ one }) => ({
  registry: one(giftRegistries, {
    fields: [giftRegistryItems.registryId],
    references: [giftRegistries.id],
  }),
  product: one(products, {
    fields: [giftRegistryItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [giftRegistryItems.variantId],
    references: [productVariants.id],
  }),
}));

// Stock Notifications - For restock alerts
export const stockNotifications = pgTable("stock_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  variantId: varchar("variant_id"),
  email: varchar("email").notNull(),
  userId: varchar("user_id"), // Optional if logged in
  isNotified: boolean("is_notified").default(false),
  notifiedAt: timestamp("notified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockNotificationsRelations = relations(stockNotifications, ({ one }) => ({
  product: one(products, {
    fields: [stockNotifications.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [stockNotifications.variantId],
    references: [productVariants.id],
  }),
  user: one(users, {
    fields: [stockNotifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBrandSchema = createInsertSchema(brands).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProductImageSchema = createInsertSchema(productImages).omit({ id: true, createdAt: true });
export const insertProductVariantSchema = createInsertSchema(productVariants).omit({ id: true, createdAt: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true, createdAt: true });
export const insertBannerSchema = createInsertSchema(banners).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHomeBlockSchema = createInsertSchema(homeBlocks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ updatedAt: true });
export const insertAddressSchema = createInsertSchema(addresses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({ id: true, createdAt: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewVoteSchema = createInsertSchema(reviewVotes).omit({ id: true, createdAt: true });
export const insertSharedWishlistSchema = createInsertSchema(sharedWishlists).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGiftRegistrySchema = createInsertSchema(giftRegistries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGiftRegistryItemSchema = createInsertSchema(giftRegistryItems).omit({ id: true, createdAt: true });
export const insertStockNotificationSchema = createInsertSchema(stockNotifications).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = z.infer<typeof insertProductImageSchema>;

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;

export type HomeBlock = typeof homeBlocks.$inferSelect;
export type InsertHomeBlock = z.infer<typeof insertHomeBlockSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type ReviewVote = typeof reviewVotes.$inferSelect;
export type InsertReviewVote = z.infer<typeof insertReviewVoteSchema>;

export type StockNotification = typeof stockNotifications.$inferSelect;
export type InsertStockNotification = z.infer<typeof insertStockNotificationSchema>;

// Extended types for frontend usage
export type ProductWithDetails = Product & {
  brand?: Brand | null;
  category?: Category | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
};

export type CategoryWithChildren = Category & {
  children?: CategoryWithChildren[];
  parent?: Category | null;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
  user?: User | null;
};

export type CartItemWithProduct = CartItem & {
  product: ProductWithDetails;
  variant?: ProductVariant | null;
};

export type ReviewWithUser = Review & {
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  } | null;
};

export type SharedWishlist = typeof sharedWishlists.$inferSelect;
export type InsertSharedWishlist = z.infer<typeof insertSharedWishlistSchema>;

export type GiftRegistry = typeof giftRegistries.$inferSelect;
export type InsertGiftRegistry = z.infer<typeof insertGiftRegistrySchema>;

export type GiftRegistryItem = typeof giftRegistryItems.$inferSelect;
export type InsertGiftRegistryItem = z.infer<typeof insertGiftRegistryItemSchema>;

export type GiftRegistryWithItems = GiftRegistry & {
  items: (GiftRegistryItem & {
    product: ProductWithDetails;
    variant?: ProductVariant | null;
  })[];
  user?: User | null;
  shippingAddress?: Address | null;
};

// Invoice Template Settings Schema
export const invoiceSettingsSchema = z.object({
  // Seller Details
  sellerName: z.string().default("Your Store"),
  sellerAddress: z.string().default(""),
  sellerCity: z.string().default(""),
  sellerState: z.string().default(""),
  sellerPostalCode: z.string().default(""),
  sellerCountry: z.string().default("India"),
  sellerPhone: z.string().default(""),
  sellerEmail: z.string().default(""),
  
  // GST Settings
  gstNumber: z.string().default(""),
  gstPercentage: z.number().min(0).max(100).default(18), // Default GST rate
  gstRates: z.array(z.number()).default([0, 5, 12, 18, 28]), // Available GST rates for products
  
  // Buyer Label Customization
  buyerLabelName: z.string().default("Customer Name"),
  buyerLabelAddress: z.string().default("Address"),
  buyerLabelPhone: z.string().default("Phone"),
  buyerLabelEmail: z.string().default("Email"),
  
  // Display Options
  showDiscountLine: z.boolean().default(true),
  showTaxBreakdown: z.boolean().default(true),
  showShippingCost: z.boolean().default(true),
  showPaymentMethod: z.boolean().default(true),
  showSKU: z.boolean().default(true),
  
  // Branding
  logoUrl: z.string().default(""),
  footerNote: z.string().default("Thank you for your business!"),
  termsAndConditions: z.string().default(""),
});

export type InvoiceSettings = z.infer<typeof invoiceSettingsSchema>;

// Default invoice settings
export const defaultInvoiceSettings: InvoiceSettings = {
  sellerName: "Your Store",
  sellerAddress: "",
  sellerCity: "",
  sellerState: "",
  sellerPostalCode: "",
  sellerCountry: "India",
  sellerPhone: "",
  sellerEmail: "",
  gstNumber: "",
  gstPercentage: 18,
  gstRates: [0, 5, 12, 18, 28],
  buyerLabelName: "Customer Name",
  buyerLabelAddress: "Address",
  buyerLabelPhone: "Phone",
  buyerLabelEmail: "Email",
  showDiscountLine: true,
  showTaxBreakdown: true,
  showShippingCost: true,
  showPaymentMethod: true,
  showSKU: true,
  logoUrl: "",
  footerNote: "Thank you for your business!",
  termsAndConditions: "",
};

// Home Category Section Settings Schema
export const homeCategorySectionItemSchema = z.object({
  id: z.string().optional(), // Unique ID for each entry (allows same category multiple times)
  categoryId: z.string(),
  customLabel: z.string().optional(),
  imageUrl: z.string().optional(),
  position: z.number().default(0),
  isVisible: z.boolean().default(true),
  displayWidth: z.enum(["25", "50", "75", "100"]).default("50"),
  alignment: z.enum(["left", "center", "right"]).default("center"),
});

export const homeCategorySectionSchema = z.object({
  title: z.string().default("Shop by Category"),
  subtitle: z.string().default(""),
  isVisible: z.boolean().default(true),
  position: z.number().default(0),
  categories: z.array(homeCategorySectionItemSchema).default([]),
});

export type HomeCategorySectionItem = z.infer<typeof homeCategorySectionItemSchema>;
export type HomeCategorySection = z.infer<typeof homeCategorySectionSchema>;

export const defaultHomeCategorySection: HomeCategorySection = {
  title: "Shop by Category",
  subtitle: "",
  isVisible: true,
  position: 0,
  categories: [],
};

// Blog Section Settings Schema
export const blogPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().default(""),
  content: z.string().default(""),
  imageUrl: z.string().default(""),
  author: z.string().default(""),
  readTime: z.string().default("5 min read"),
  publishedAt: z.string().default(""),
  position: z.number().default(0),
  isVisible: z.boolean().default(true),
});

export const blogSectionSchema = z.object({
  title: z.string().default("From Our Blog"),
  subtitle: z.string().default("Latest news and updates"),
  isVisible: z.boolean().default(true),
  position: z.number().default(0),
  posts: z.array(blogPostSchema).default([]),
});

export type BlogPost = z.infer<typeof blogPostSchema>;
export type BlogSection = z.infer<typeof blogSectionSchema>;

export const defaultBlogSection: BlogSection = {
  title: "From Our Blog",
  subtitle: "Latest news and updates",
  isVisible: true,
  position: 0,
  posts: [],
};

// Communication Settings Schema (MSG91 - Email, SMS, WhatsApp, OTP)
// MSG91 Global Settings (shared across all channels)
export const msg91SettingsSchema = z.object({
  authKey: z.string().optional(),
  senderId: z.string().optional(), // 6-char Sender ID for SMS
});

export const emailSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  templateId: z.string().optional(), // MSG91 email template ID
  fromEmail: z.string().email().optional().or(z.literal("")),
  fromName: z.string().optional(),
  domain: z.string().optional(), // Verified domain in MSG91
  // Notification toggles
  orderConfirmation: z.boolean().default(true),
  orderStatusUpdate: z.boolean().default(true),
  shippingUpdate: z.boolean().default(true),
  lowStockAlert: z.boolean().default(true),
  restockNotification: z.boolean().default(true),
  welcomeEmail: z.boolean().default(true),
  passwordReset: z.boolean().default(true),
});

export const smsSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  templateId: z.string().optional(), // MSG91 SMS template ID (DLT registered)
  // Notification toggles
  orderConfirmation: z.boolean().default(true),
  orderStatusUpdate: z.boolean().default(true),
  shippingUpdate: z.boolean().default(true),
  deliveryOtp: z.boolean().default(false),
});

export const whatsappSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  integratedNumber: z.string().optional(), // MSG91 WhatsApp Business number
  templateName: z.string().optional(), // WhatsApp template name
  // Notification toggles
  orderConfirmation: z.boolean().default(true),
  orderStatusUpdate: z.boolean().default(true),
  shippingUpdate: z.boolean().default(true),
  promotionalMessages: z.boolean().default(false),
});

export const otpSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  templateId: z.string().optional(), // MSG91 OTP template ID
  otpLength: z.number().min(4).max(8).default(6),
  otpExpiry: z.number().min(1).max(30).default(5), // Minutes
  emailFallback: z.boolean().default(true),
});

export const communicationSettingsSchema = z.object({
  msg91: msg91SettingsSchema.default({}),
  email: emailSettingsSchema.default({}),
  sms: smsSettingsSchema.default({}),
  whatsapp: whatsappSettingsSchema.default({}),
  otp: otpSettingsSchema.default({}),
});

export type Msg91Settings = z.infer<typeof msg91SettingsSchema>;
export type EmailSettings = z.infer<typeof emailSettingsSchema>;
export type SmsSettings = z.infer<typeof smsSettingsSchema>;
export type WhatsappSettings = z.infer<typeof whatsappSettingsSchema>;
export type OtpSettings = z.infer<typeof otpSettingsSchema>;
export type CommunicationSettings = z.infer<typeof communicationSettingsSchema>;

export const defaultCommunicationSettings: CommunicationSettings = {
  msg91: {
    authKey: "",
    senderId: "",
  },
  email: {
    enabled: false,
    templateId: "",
    fromEmail: "",
    fromName: "",
    domain: "",
    orderConfirmation: true,
    orderStatusUpdate: true,
    shippingUpdate: true,
    lowStockAlert: true,
    restockNotification: true,
    welcomeEmail: true,
    passwordReset: true,
  },
  sms: {
    enabled: false,
    templateId: "",
    orderConfirmation: true,
    orderStatusUpdate: true,
    shippingUpdate: true,
    deliveryOtp: false,
  },
  whatsapp: {
    enabled: false,
    integratedNumber: "",
    templateName: "",
    orderConfirmation: true,
    orderStatusUpdate: true,
    shippingUpdate: true,
    promotionalMessages: false,
  },
  otp: {
    enabled: false,
    templateId: "",
    otpLength: 6,
    otpExpiry: 5,
    emailFallback: true,
  },
};

// Combo Offers table
export const comboOffers = pgTable("combo_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  mediaUrls: text("media_urls").array(), // Array of image/video URLs
  productIds: text("product_ids").array().notNull(), // Array of product IDs in the combo
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(), // Sum of individual product prices
  comboPrice: decimal("combo_price", { precision: 10, scale: 2 }).notNull(), // Discounted combo price
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }), // Calculated discount %
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertComboOfferSchema = createInsertSchema(comboOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertComboOffer = z.infer<typeof insertComboOfferSchema>;
export type ComboOffer = typeof comboOffers.$inferSelect;

// Quick Links / Dynamic Pages table
export const quickPages = pgTable("quick_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  content: text("content"), // Rich text HTML content
  excerpt: text("excerpt"), // Short description for SEO
  status: varchar("status").default("draft").notNull(), // draft, published
  showInFooter: boolean("show_in_footer").default(true),
  footerSection: varchar("footer_section").default("quick_links"), // quick_links, customer_service, about
  position: integer("position").default(0),
  metaTitle: varchar("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: varchar("meta_keywords"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuickPageSchema = createInsertSchema(quickPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQuickPage = z.infer<typeof insertQuickPageSchema>;
export type QuickPage = typeof quickPages.$inferSelect;

// Admin Roles table for dynamic role-based access control
export const adminRoles = pgTable("admin_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  isSystemRole: boolean("is_system_role").default(false), // System roles like 'Super Admin' cannot be deleted
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminRolesRelations = relations(adminRoles, ({ many }) => ({
  permissions: many(rolePermissions),
}));

export const insertAdminRoleSchema = createInsertSchema(adminRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAdminRole = z.infer<typeof insertAdminRoleSchema>;
export type AdminRole = typeof adminRoles.$inferSelect;

// Role Permissions table - stores module-level permissions for each role
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => adminRoles.id, { onDelete: "cascade" }),
  module: varchar("module").notNull(), // e.g., 'products', 'orders', 'categories', 'users', 'settings'
  canView: boolean("can_view").default(false),
  canAdd: boolean("can_add").default(false),
  canEdit: boolean("can_edit").default(false),
  canDelete: boolean("can_delete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(adminRoles, {
    fields: [rolePermissions.roleId],
    references: [adminRoles.id],
  }),
}));

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

// Define available admin modules for permission assignment
export const ADMIN_MODULES = [
  { key: "dashboard", label: "Dashboard", description: "View dashboard and analytics" },
  { key: "products", label: "Products", description: "Manage products and inventory" },
  { key: "categories", label: "Categories", description: "Manage product categories" },
  { key: "brands", label: "Brands", description: "Manage product brands" },
  { key: "orders", label: "Orders", description: "View and manage customer orders" },
  { key: "customers", label: "Customers", description: "View and manage customer accounts" },
  { key: "marketing", label: "Marketing", description: "Customer segments for marketing campaigns" },
  { key: "coupons", label: "Coupons", description: "Manage discount coupons" },
  { key: "reviews", label: "Reviews", description: "Moderate product reviews" },
  { key: "banners", label: "Banners", description: "Manage home page banners" },
  { key: "home_blocks", label: "Home Blocks", description: "Manage home page content blocks" },
  { key: "blog", label: "Blog", description: "Manage blog posts" },
  { key: "pages", label: "Pages", description: "Manage quick links and CMS pages" },
  { key: "special_offers", label: "Special Offers", description: "Manage special offer sections" },
  { key: "combo_offers", label: "Combo Offers", description: "Manage combo/bundle offers" },
  { key: "settings", label: "Settings", description: "Store settings and configuration" },
  { key: "communication", label: "Communication", description: "Email, SMS, WhatsApp settings" },
  { key: "invoices", label: "Invoices", description: "Invoice settings and templates" },
  { key: "admin_users", label: "Admin Users", description: "Manage admin user accounts" },
  { key: "roles", label: "Roles & Permissions", description: "Manage admin roles and permissions" },
] as const;

export type AdminModuleKey = typeof ADMIN_MODULES[number]["key"];

// =====================================================
// SWIMMING & GROOMING MODULE
// =====================================================

// Swimming & Grooming Page Configuration (banners, videos, ads)
export const swimGroomPageConfig = pgTable("swim_groom_page_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configType: varchar("config_type").notNull(), // "hero_banner", "hero_video", "ad_banner", "ad_video"
  title: varchar("title"),
  subtitle: text("subtitle"),
  mediaUrl: varchar("media_url"),
  linkUrl: varchar("link_url"),
  placement: varchar("placement").default("top"), // "top", "middle", "bottom", "sidebar"
  position: integer("position").default(0),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSwimGroomPageConfigSchema = createInsertSchema(swimGroomPageConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSwimGroomPageConfig = z.infer<typeof insertSwimGroomPageConfigSchema>;
export type SwimGroomPageConfig = typeof swimGroomPageConfig.$inferSelect;

// Swimming & Grooming Services Catalog
export const swimGroomServices = pgTable("swim_groom_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  iconUrl: varchar("icon_url"),
  imageUrl: varchar("image_url"),
  position: integer("position").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSwimGroomServiceSchema = createInsertSchema(swimGroomServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSwimGroomService = z.infer<typeof insertSwimGroomServiceSchema>;
export type SwimGroomService = typeof swimGroomServices.$inferSelect;

// Swimming & Grooming Locations - Countries
export const swimGroomCountries = pgTable("swim_groom_countries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  code: varchar("code", { length: 10 }),
  isActive: boolean("is_active").default(true),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSwimGroomCountrySchema = createInsertSchema(swimGroomCountries).omit({
  id: true,
  createdAt: true,
});
export type InsertSwimGroomCountry = z.infer<typeof insertSwimGroomCountrySchema>;
export type SwimGroomCountry = typeof swimGroomCountries.$inferSelect;

// Swimming & Grooming Locations - States
export const swimGroomStates = pgTable("swim_groom_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  countryId: varchar("country_id").notNull().references(() => swimGroomCountries.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  code: varchar("code", { length: 10 }),
  isActive: boolean("is_active").default(true),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const swimGroomStatesRelations = relations(swimGroomStates, ({ one }) => ({
  country: one(swimGroomCountries, {
    fields: [swimGroomStates.countryId],
    references: [swimGroomCountries.id],
  }),
}));

export const insertSwimGroomStateSchema = createInsertSchema(swimGroomStates).omit({
  id: true,
  createdAt: true,
});
export type InsertSwimGroomState = z.infer<typeof insertSwimGroomStateSchema>;
export type SwimGroomState = typeof swimGroomStates.$inferSelect;

// Swimming & Grooming Locations - Cities
export const swimGroomCities = pgTable("swim_groom_cities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stateId: varchar("state_id").notNull().references(() => swimGroomStates.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  isActive: boolean("is_active").default(true),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const swimGroomCitiesRelations = relations(swimGroomCities, ({ one }) => ({
  state: one(swimGroomStates, {
    fields: [swimGroomCities.stateId],
    references: [swimGroomStates.id],
  }),
}));

export const insertSwimGroomCitySchema = createInsertSchema(swimGroomCities).omit({
  id: true,
  createdAt: true,
});
export type InsertSwimGroomCity = z.infer<typeof insertSwimGroomCitySchema>;
export type SwimGroomCity = typeof swimGroomCities.$inferSelect;

// Swimming & Grooming Locations - Localities/Areas
export const swimGroomLocalities = pgTable("swim_groom_localities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cityId: varchar("city_id").notNull().references(() => swimGroomCities.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  pincode: varchar("pincode"),
  isActive: boolean("is_active").default(true),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const swimGroomLocalitiesRelations = relations(swimGroomLocalities, ({ one }) => ({
  city: one(swimGroomCities, {
    fields: [swimGroomLocalities.cityId],
    references: [swimGroomCities.id],
  }),
}));

export const insertSwimGroomLocalitySchema = createInsertSchema(swimGroomLocalities).omit({
  id: true,
  createdAt: true,
});
export type InsertSwimGroomLocality = z.infer<typeof insertSwimGroomLocalitySchema>;
export type SwimGroomLocality = typeof swimGroomLocalities.$inferSelect;

// Service Providers
export const swimGroomProviders = pgTable("swim_groom_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  email: varchar("email").notNull().unique(),
  phone: varchar("phone"),
  description: text("description"),
  address: text("address"),
  cityId: varchar("city_id").references(() => swimGroomCities.id),
  stateId: varchar("state_id").references(() => swimGroomStates.id),
  countryId: varchar("country_id").references(() => swimGroomCountries.id),
  logoUrl: varchar("logo_url"),
  bannerUrl: varchar("banner_url"),
  videoUrl: varchar("video_url"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  commissionType: varchar("commission_type").default("percentage"), // "percentage" or "fixed"
  commissionValue: decimal("commission_value", { precision: 10, scale: 2 }).default("10.00"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  passwordHash: varchar("password_hash"), // For provider portal login
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const swimGroomProvidersRelations = relations(swimGroomProviders, ({ one, many }) => ({
  city: one(swimGroomCities, {
    fields: [swimGroomProviders.cityId],
    references: [swimGroomCities.id],
  }),
  state: one(swimGroomStates, {
    fields: [swimGroomProviders.stateId],
    references: [swimGroomStates.id],
  }),
  country: one(swimGroomCountries, {
    fields: [swimGroomProviders.countryId],
    references: [swimGroomCountries.id],
  }),
  services: many(swimGroomProviderServices),
  slots: many(swimGroomProviderSlots),
  media: many(swimGroomProviderMedia),
}));

export const insertSwimGroomProviderSchema = createInsertSchema(swimGroomProviders).omit({
  id: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSwimGroomProvider = z.infer<typeof insertSwimGroomProviderSchema>;
export type SwimGroomProvider = typeof swimGroomProviders.$inferSelect;

// Provider Services - Many-to-many relationship between providers and services
export const swimGroomProviderServices = pgTable("swim_groom_provider_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => swimGroomProviders.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => swimGroomServices.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").default(60), // Duration in minutes
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const swimGroomProviderServicesRelations = relations(swimGroomProviderServices, ({ one }) => ({
  provider: one(swimGroomProviders, {
    fields: [swimGroomProviderServices.providerId],
    references: [swimGroomProviders.id],
  }),
  service: one(swimGroomServices, {
    fields: [swimGroomProviderServices.serviceId],
    references: [swimGroomServices.id],
  }),
}));

export const insertSwimGroomProviderServiceSchema = createInsertSchema(swimGroomProviderServices).omit({
  id: true,
  createdAt: true,
});
export type InsertSwimGroomProviderService = z.infer<typeof insertSwimGroomProviderServiceSchema>;
export type SwimGroomProviderService = typeof swimGroomProviderServices.$inferSelect;

// Provider Media (additional banners, videos, gallery images)
export const swimGroomProviderMedia = pgTable("swim_groom_provider_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => swimGroomProviders.id, { onDelete: "cascade" }),
  mediaType: varchar("media_type").notNull(), // "image", "video", "banner"
  mediaUrl: varchar("media_url").notNull(),
  title: varchar("title"),
  position: integer("position").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const swimGroomProviderMediaRelations = relations(swimGroomProviderMedia, ({ one }) => ({
  provider: one(swimGroomProviders, {
    fields: [swimGroomProviderMedia.providerId],
    references: [swimGroomProviders.id],
  }),
}));

export const insertSwimGroomProviderMediaSchema = createInsertSchema(swimGroomProviderMedia).omit({
  id: true,
  createdAt: true,
});
export type InsertSwimGroomProviderMedia = z.infer<typeof insertSwimGroomProviderMediaSchema>;
export type SwimGroomProviderMedia = typeof swimGroomProviderMedia.$inferSelect;

// Provider Time Slots
export const swimGroomProviderSlots = pgTable("swim_groom_provider_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => swimGroomProviders.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").references(() => swimGroomServices.id),
  date: timestamp("date").notNull(),
  startTime: varchar("start_time").notNull(), // "09:00"
  endTime: varchar("end_time").notNull(), // "10:00"
  capacity: integer("capacity").default(1), // Number of bookings allowed
  bookedCount: integer("booked_count").default(0),
  price: decimal("price", { precision: 10, scale: 2 }),
  status: varchar("status").default("available"), // "available", "full", "blocked"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const swimGroomProviderSlotsRelations = relations(swimGroomProviderSlots, ({ one }) => ({
  provider: one(swimGroomProviders, {
    fields: [swimGroomProviderSlots.providerId],
    references: [swimGroomProviders.id],
  }),
  service: one(swimGroomServices, {
    fields: [swimGroomProviderSlots.serviceId],
    references: [swimGroomServices.id],
  }),
}));

export const insertSwimGroomProviderSlotSchema = createInsertSchema(swimGroomProviderSlots).omit({
  id: true,
  bookedCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSwimGroomProviderSlot = z.infer<typeof insertSwimGroomProviderSlotSchema>;
export type SwimGroomProviderSlot = typeof swimGroomProviderSlots.$inferSelect;

// Bookings
export const swimGroomBookings = pgTable("swim_groom_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingNumber: varchar("booking_number").notNull().unique(),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  providerId: varchar("provider_id").notNull().references(() => swimGroomProviders.id),
  slotId: varchar("slot_id").notNull().references(() => swimGroomProviderSlots.id),
  serviceId: varchar("service_id").references(() => swimGroomServices.id),
  serviceName: varchar("service_name"), // Snapshot at booking time
  providerName: varchar("provider_name"), // Snapshot at booking time
  bookingDate: timestamp("booking_date").notNull(),
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).default("0.00"),
  status: varchar("status").default("pending"), // "pending", "confirmed", "completed", "cancelled", "no_show"
  paymentStatus: varchar("payment_status").default("pending"), // "pending", "paid", "refunded"
  customerNotes: text("customer_notes"),
  providerNotes: text("provider_notes"),
  adminNotes: text("admin_notes"),
  contactViewedAt: timestamp("contact_viewed_at"), // When customer viewed contact info
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const swimGroomBookingsRelations = relations(swimGroomBookings, ({ one }) => ({
  customer: one(users, {
    fields: [swimGroomBookings.customerId],
    references: [users.id],
  }),
  provider: one(swimGroomProviders, {
    fields: [swimGroomBookings.providerId],
    references: [swimGroomProviders.id],
  }),
  slot: one(swimGroomProviderSlots, {
    fields: [swimGroomBookings.slotId],
    references: [swimGroomProviderSlots.id],
  }),
  service: one(swimGroomServices, {
    fields: [swimGroomBookings.serviceId],
    references: [swimGroomServices.id],
  }),
}));

export const insertSwimGroomBookingSchema = createInsertSchema(swimGroomBookings).omit({
  id: true,
  bookingNumber: true,
  commissionAmount: true,
  contactViewedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSwimGroomBooking = z.infer<typeof insertSwimGroomBookingSchema>;
export type SwimGroomBooking = typeof swimGroomBookings.$inferSelect;

// Provider Reviews
export const swimGroomProviderReviews = pgTable("swim_groom_provider_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => swimGroomProviders.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  bookingId: varchar("booking_id").references(() => swimGroomBookings.id),
  rating: integer("rating").notNull(), // 1-5
  title: varchar("title"),
  content: text("content"),
  status: varchar("status").default("pending"), // "pending", "approved", "rejected"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const swimGroomProviderReviewsRelations = relations(swimGroomProviderReviews, ({ one }) => ({
  provider: one(swimGroomProviders, {
    fields: [swimGroomProviderReviews.providerId],
    references: [swimGroomProviders.id],
  }),
  customer: one(users, {
    fields: [swimGroomProviderReviews.customerId],
    references: [users.id],
  }),
  booking: one(swimGroomBookings, {
    fields: [swimGroomProviderReviews.bookingId],
    references: [swimGroomBookings.id],
  }),
}));

export const insertSwimGroomProviderReviewSchema = createInsertSchema(swimGroomProviderReviews).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSwimGroomProviderReview = z.infer<typeof insertSwimGroomProviderReviewSchema>;
export type SwimGroomProviderReview = typeof swimGroomProviderReviews.$inferSelect;
