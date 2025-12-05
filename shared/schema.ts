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
  role: varchar("role").default("customer").notNull(), // admin, manager, support, customer
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  addresses: many(addresses),
  wishlistItems: many(wishlistItems),
  cartItems: many(cartItems),
}));

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
  paymentMethod: varchar("payment_method"), // stripe, cod
  paymentStatus: varchar("payment_status").default("pending"), // pending, paid, failed
  shippingAddress: jsonb("shipping_address"),
  billingAddress: jsonb("billing_address"),
  trackingNumber: varchar("tracking_number"),
  trackingStatus: varchar("tracking_status"),
  trackingUpdates: jsonb("tracking_updates"),
  couponCode: varchar("coupon_code"),
  notes: text("notes"),
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
  quantity: integer("quantity").notNull().default(1),
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

// Combo Offers table
export const comboOffers = pgTable("combo_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
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
