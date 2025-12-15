import { eq, and, or, like, desc, asc, sql, isNull, inArray, gte, lte, lt, gt, ne } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  categories,
  brands,
  products,
  productImages,
  productVariants,
  coupons,
  orders,
  orderItems,
  banners,
  homeBlocks,
  settings,
  addresses,
  wishlistItems,
  cartItems,
  reviews,
  reviewVotes,
  sharedWishlists,
  giftRegistries,
  giftRegistryItems,
  stockNotifications,
  comboOffers,
  quickPages,
  otpCodes,
  adminRoles,
  rolePermissions,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Brand,
  type InsertBrand,
  type Product,
  type InsertProduct,
  type ProductImage,
  type InsertProductImage,
  type ProductVariant,
  type InsertProductVariant,
  type Coupon,
  type InsertCoupon,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Banner,
  type InsertBanner,
  type HomeBlock,
  type InsertHomeBlock,
  type Setting,
  type InsertSetting,
  type Address,
  type InsertAddress,
  type WishlistItem,
  type InsertWishlistItem,
  type CartItem,
  type InsertCartItem,
  type Review,
  type InsertReview,
  type ReviewVote,
  type InsertReviewVote,
  type SharedWishlist,
  type InsertSharedWishlist,
  type GiftRegistry,
  type InsertGiftRegistry,
  type GiftRegistryItem,
  type InsertGiftRegistryItem,
  type ComboOffer,
  type InsertComboOffer,
  type QuickPage,
  type InsertQuickPage,
  verifiedRazorpayPayments,
  type ProductWithDetails,
  type CategoryWithChildren,
  type OrderWithItems,
  type CartItemWithProduct,
  type ReviewWithUser,
  type GiftRegistryWithItems,
  type AdminRole,
  type InsertAdminRole,
  type RolePermission,
  type InsertRolePermission,
} from "@shared/schema";

// Extended type for combo offer with full product details
export interface ComboOfferWithProducts extends ComboOffer {
  products: ProductWithDetails[];
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: { email: string; passwordHash: string; firstName?: string | null; lastName?: string | null; role?: string }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUserPassword(id: string, passwordHash: string): Promise<User | undefined>;
  getUsers(search?: string): Promise<{ users: User[]; total: number }>;
  getAdminUsers(search?: string): Promise<{ users: User[]; total: number }>;
  getCustomerUsers(search?: string): Promise<{ users: any[]; total: number }>;

  getCategories(): Promise<CategoryWithChildren[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;

  getBrands(): Promise<Brand[]>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: string, brand: Partial<InsertBrand>): Promise<Brand | undefined>;
  deleteBrand(id: string): Promise<void>;

  getProducts(filters?: ProductFilters): Promise<{ products: ProductWithDetails[]; total: number }>;
  getProductById(id: string): Promise<ProductWithDetails | undefined>;
  getProductBySlug(slug: string): Promise<ProductWithDetails | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  addProductImage(image: InsertProductImage): Promise<ProductImage>;
  deleteProductImage(id: string): Promise<void>;
  deleteProductImages(productId: string): Promise<void>;
  addProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  deleteProductVariant(id: string): Promise<void>;
  deleteProductVariants(productId: string): Promise<void>;

  getCoupons(): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: string, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: string): Promise<void>;
  hasUserUsedCoupon(userId: string, couponCode: string): Promise<boolean>;
  hasGuestUsedCoupon(guestEmail: string, couponCode: string): Promise<boolean>;

  getOrders(filters?: OrderFilters): Promise<{ orders: OrderWithItems[]; total: number }>;
  getOrderById(id: string): Promise<OrderWithItems | undefined>;
  getOrderByNumber(orderNumber: string): Promise<OrderWithItems | undefined>;
  getUserOrders(userId: string): Promise<OrderWithItems[]>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems>;
  updateOrderStatus(id: string, status: string, trackingNumber?: string): Promise<Order | undefined>;

  getBanners(): Promise<Banner[]>;
  getActiveBanners(type?: string): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: string, banner: Partial<InsertBanner>): Promise<Banner | undefined>;
  deleteBanner(id: string): Promise<void>;

  getHomeBlocks(): Promise<HomeBlock[]>;
  getActiveHomeBlocks(): Promise<HomeBlock[]>;
  createHomeBlock(block: InsertHomeBlock): Promise<HomeBlock>;
  updateHomeBlock(id: string, block: Partial<InsertHomeBlock>): Promise<HomeBlock | undefined>;
  deleteHomeBlock(id: string): Promise<void>;

  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSettings(settingsMap: Record<string, string>): Promise<void>;

  getUserAddresses(userId: string): Promise<Address[]>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: string, address: Partial<InsertAddress>): Promise<Address | undefined>;
  deleteAddress(id: string): Promise<void>;

  getWishlistItems(userId: string): Promise<WishlistItem[]>;
  addToWishlist(item: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;

  getCartItems(userId?: string, sessionId?: string): Promise<CartItemWithProduct[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId?: string, sessionId?: string): Promise<void>;

  getProductReviews(productId: string, approved?: boolean): Promise<ReviewWithUser[]>;
  getReviewById(id: string): Promise<ReviewWithUser | undefined>;
  getAllReviews(filters?: ReviewFilters): Promise<{ reviews: ReviewWithUser[]; total: number }>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, review: Partial<InsertReview>): Promise<Review | undefined>;
  deleteReview(id: string): Promise<void>;
  voteReview(vote: InsertReviewVote): Promise<ReviewVote>;
  hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean>;
  hasUserReviewedProduct(userId: string, productId: string): Promise<boolean>;
  updateProductRating(productId: string): Promise<void>;

  getSharedWishlist(userId: string): Promise<SharedWishlist | undefined>;
  getSharedWishlistByCode(shareCode: string): Promise<SharedWishlist | undefined>;
  createOrUpdateSharedWishlist(wishlist: InsertSharedWishlist): Promise<SharedWishlist>;
  deleteSharedWishlist(userId: string): Promise<void>;

  getGiftRegistries(userId: string): Promise<GiftRegistry[]>;
  getGiftRegistryById(id: string): Promise<GiftRegistryWithItems | undefined>;
  getGiftRegistryByCode(shareCode: string): Promise<GiftRegistryWithItems | undefined>;
  createGiftRegistry(registry: InsertGiftRegistry): Promise<GiftRegistry>;
  updateGiftRegistry(id: string, registry: Partial<InsertGiftRegistry>): Promise<GiftRegistry | undefined>;
  deleteGiftRegistry(id: string): Promise<void>;
  addGiftRegistryItem(item: InsertGiftRegistryItem): Promise<GiftRegistryItem>;
  updateGiftRegistryItem(id: string, item: Partial<InsertGiftRegistryItem>): Promise<GiftRegistryItem | undefined>;
  removeGiftRegistryItem(id: string): Promise<void>;
  markGiftRegistryItemPurchased(id: string, purchasedBy: string): Promise<GiftRegistryItem | undefined>;

  getLowStockProducts(threshold?: number): Promise<ProductWithDetails[]>;
  getStockNotifications(productId?: string): Promise<any[]>;
  createStockNotification(notification: { productId: string; variantId?: string; email: string; userId?: string }): Promise<any>;
  deleteStockNotification(id: string): Promise<void>;
  markStockNotificationsNotified(productId: string): Promise<void>;
  getUnnotifiedStockNotifications(productId: string): Promise<any[]>;

  // Combo Offers
  getComboOffers(activeOnly?: boolean): Promise<ComboOfferWithProducts[]>;
  getComboOfferById(id: string): Promise<ComboOfferWithProducts | undefined>;
  getComboOfferBySlug(slug: string): Promise<ComboOfferWithProducts | undefined>;
  createComboOffer(offer: InsertComboOffer): Promise<ComboOffer>;
  updateComboOffer(id: string, offer: Partial<InsertComboOffer>): Promise<ComboOffer | undefined>;
  deleteComboOffer(id: string): Promise<void>;

  // Verified Razorpay Payments
  createVerifiedRazorpayPayment(payment: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    userId?: string | null;
    guestSessionId?: string | null;
    amount: string;
    currency?: string;
  }): Promise<any>;
  getVerifiedRazorpayPayment(
    razorpayPaymentId: string,
    userId?: string | null,
    guestSessionId?: string | null
  ): Promise<any | undefined>;
  consumeVerifiedRazorpayPayment(id: string): Promise<void>;
  cleanupExpiredRazorpayPayments(): Promise<void>;

  // Quick Pages (Dynamic CMS Pages)
  getQuickPages(publishedOnly?: boolean): Promise<QuickPage[]>;
  getQuickPageById(id: string): Promise<QuickPage | undefined>;
  getQuickPageBySlug(slug: string): Promise<QuickPage | undefined>;
  createQuickPage(page: InsertQuickPage): Promise<QuickPage>;
  updateQuickPage(id: string, page: Partial<InsertQuickPage>): Promise<QuickPage | undefined>;
  deleteQuickPage(id: string): Promise<void>;
  getFooterQuickPages(): Promise<QuickPage[]>;

  // OTP Codes
  createOtpCode(otp: { email: string; phone?: string | null; code: string; purpose: string; expiresAt: Date }): Promise<any>;
  getOtpCode(email: string, purpose: string): Promise<any | undefined>;
  verifyOtpCode(email: string, code: string, purpose: string): Promise<boolean>;
  incrementOtpAttempts(id: string): Promise<void>;
  deleteOtpCodes(email: string, purpose: string): Promise<void>;
  cleanupExpiredOtpCodes(): Promise<void>;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  isInStock?: boolean;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface OrderFilters {
  search?: string;
  status?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface ReviewFilters {
  productId?: string;
  userId?: string;
  isApproved?: boolean;
  minRating?: number;
  maxRating?: number;
  limit?: number;
  offset?: number;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    return user;
  }

  async createUser(userData: { id?: string; email: string; passwordHash: string; firstName?: string | null; lastName?: string | null; role?: string; createdAt?: Date }): Promise<User> {
    const insertData: any = {
      email: userData.email.toLowerCase().trim(),
      passwordHash: userData.passwordHash,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      role: userData.role || "customer",
    };
    if (userData.id) {
      insertData.id = userData.id;
    }
    if (userData.createdAt) {
      insertData.createdAt = userData.createdAt;
    }
    const [created] = await db.insert(users).values(insertData).returning();
    return created;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First check if user exists by ID
    const [existingById] = await db.select().from(users).where(eq(users.id, userData.id)).limit(1);
    
    if (existingById) {
      const [updated] = await db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, userData.id))
        .returning();
      return updated;
    }
    
    // Check if a user exists with the same email (different ID)
    if (userData.email) {
      const [existingByEmail] = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
      if (existingByEmail) {
        // Update the existing user's ID to the new one (linking accounts)
        // Or just update their info with the new ID
        const [updated] = await db
          .update(users)
          .set({ 
            id: userData.id,
            ...userData, 
            updatedAt: new Date() 
          })
          .where(eq(users.email, userData.email))
          .returning();
        return updated;
      }
    }
    
    const [created] = await db.insert(users).values(userData).returning();
    return created;
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getUsers(search?: string): Promise<{ users: User[]; total: number }> {
    let query = db.select().from(users);
    
    if (search) {
      query = query.where(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        )
      ) as typeof query;
    }
    
    const result = await query.orderBy(desc(users.createdAt));
    return { users: result, total: result.length };
  }

  async getAdminUsers(search?: string): Promise<{ users: (User & { adminRoleName?: string })[]; total: number }> {
    const adminRolesArr = ["admin", "manager", "support"];
    let baseCondition = inArray(users.role, adminRolesArr);
    
    let whereCondition: any = baseCondition;
    
    if (search) {
      whereCondition = and(
        baseCondition,
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        )
      );
    }
    
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        phone: users.phone,
        role: users.role,
        adminRoleId: users.adminRoleId,
        passwordHash: users.passwordHash,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        adminRoleName: adminRoles.name,
      })
      .from(users)
      .leftJoin(adminRoles, eq(users.adminRoleId, adminRoles.id))
      .where(whereCondition)
      .orderBy(desc(users.createdAt));
    
    return { users: result, total: result.length };
  }

  async getCustomerUsers(search?: string): Promise<{ users: any[]; total: number }> {
    let baseCondition = eq(users.role, "customer");
    
    let whereCondition: any = baseCondition;
    
    if (search) {
      whereCondition = and(
        baseCondition,
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        )
      );
    }
    
    const customerList = await db.select().from(users).where(whereCondition).orderBy(desc(users.createdAt));
    
    const customersWithStats = await Promise.all(
      customerList.map(async (customer) => {
        const customerOrders = await db.select().from(orders).where(eq(orders.userId, customer.id));
        const orderCount = customerOrders.length;
        const totalSpent = customerOrders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0);
        
        return {
          ...customer,
          orderCount,
          totalSpent,
        };
      })
    );
    
    return { users: customersWithStats, total: customersWithStats.length };
  }

  async getCategories(): Promise<CategoryWithChildren[]> {
    const allCategories = await db.select().from(categories).orderBy(asc(categories.position));
    return this.buildCategoryTree(allCategories);
  }

  private buildCategoryTree(cats: Category[], parentId: string | null = null): CategoryWithChildren[] {
    return cats
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        ...c,
        children: this.buildCategoryTree(cats, c.id),
      }));
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(or(eq(categories.id, id), eq(categories.parentId, id)));
  }

  async getBrands(): Promise<Brand[]> {
    return db.select().from(brands).orderBy(asc(brands.name));
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [created] = await db.insert(brands).values(brand).returning();
    return created;
  }

  async updateBrand(id: string, brand: Partial<InsertBrand>): Promise<Brand | undefined> {
    const [updated] = await db
      .update(brands)
      .set({ ...brand, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning();
    return updated;
  }

  async deleteBrand(id: string): Promise<void> {
    await db.delete(brands).where(eq(brands.id, id));
  }

  async getProducts(filters: ProductFilters = {}): Promise<{ products: ProductWithDetails[]; total: number }> {
    const conditions = [];
    
    if (filters.search) {
      conditions.push(
        or(
          like(products.title, `%${filters.search}%`),
          like(products.shortDesc, `%${filters.search}%`),
          like(products.sku, `%${filters.search}%`)
        )
      );
    }
    if (filters.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
    if (filters.brandIds && filters.brandIds.length > 0) {
      conditions.push(inArray(products.brandId, filters.brandIds));
    } else if (filters.brandId) {
      conditions.push(eq(products.brandId, filters.brandId));
    }
    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      conditions.push(gte(products.price, filters.minPrice.toString()));
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      conditions.push(lte(products.price, filters.maxPrice.toString()));
    }
    if (filters.isFeatured !== undefined) conditions.push(eq(products.isFeatured, filters.isFeatured));
    if (filters.isTrending !== undefined) conditions.push(eq(products.isTrending, filters.isTrending));
    if (filters.isNewArrival !== undefined) conditions.push(eq(products.isNewArrival, filters.isNewArrival));
    if (filters.isOnSale !== undefined) {
      conditions.push(eq(products.isOnSale, filters.isOnSale));
      if (filters.isOnSale) {
        const now = new Date();
        conditions.push(
          or(
            isNull(products.salePriceStart),
            lte(products.salePriceStart, now)
          )
        );
        conditions.push(
          or(
            isNull(products.salePriceEnd),
            gte(products.salePriceEnd, now)
          )
        );
      }
    }
    if (filters.isActive !== undefined) conditions.push(eq(products.isActive, filters.isActive));
    if (filters.isInStock) conditions.push(gt(products.stock, 0));

    const baseQuery = conditions.length > 0 
      ? db.select().from(products).where(and(...conditions))
      : db.select().from(products);

    const countResult = await (conditions.length > 0
      ? db.select({ count: sql<number>`count(*)` }).from(products).where(and(...conditions))
      : db.select({ count: sql<number>`count(*)` }).from(products));
    
    const total = Number(countResult[0]?.count || 0);

    let sortColumn: any = products.createdAt;
    if (filters.sortBy === "price") sortColumn = products.price;
    else if (filters.sortBy === "title") sortColumn = products.title;
    else if (filters.sortBy === "rating") sortColumn = products.averageRating;

    const sortFn = filters.sortOrder === "asc" ? asc : desc;
    
    let query = baseQuery.orderBy(sortFn(sortColumn)) as any;
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.offset(filters.offset);

    const productList = await query;

    if (productList.length === 0) {
      return { products: [], total };
    }

    const productsWithDetails = await this.batchLoadProductDetails(productList);

    return { products: productsWithDetails, total };
  }

  private async batchLoadProductDetails(productList: Product[]): Promise<ProductWithDetails[]> {
    const productIds = productList.map(p => p.id);
    const brandIds = Array.from(new Set(productList.map(p => p.brandId).filter((id): id is string => id !== null)));
    const categoryIds = Array.from(new Set(productList.map(p => p.categoryId).filter((id): id is string => id !== null)));

    const [allBrands, allCategories, allImages, allVariants] = await Promise.all([
      brandIds.length > 0 
        ? db.select().from(brands).where(inArray(brands.id, brandIds))
        : Promise.resolve([]),
      categoryIds.length > 0 
        ? db.select().from(categories).where(inArray(categories.id, categoryIds))
        : Promise.resolve([]),
      db.select().from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.position)),
      db.select().from(productVariants).where(inArray(productVariants.productId, productIds)),
    ]);

    const brandMap = new Map(allBrands.map(b => [b.id, b]));
    const categoryMap = new Map(allCategories.map(c => [c.id, c]));
    const imageMap = new Map<string, ProductImage[]>();
    const variantMap = new Map<string, ProductVariant[]>();

    allImages.forEach(img => {
      if (!imageMap.has(img.productId)) {
        imageMap.set(img.productId, []);
      }
      imageMap.get(img.productId)!.push(img);
    });

    allVariants.forEach(v => {
      if (!variantMap.has(v.productId)) {
        variantMap.set(v.productId, []);
      }
      variantMap.get(v.productId)!.push(v);
    });

    return productList.map(product => ({
      ...product,
      brand: product.brandId ? brandMap.get(product.brandId) || null : null,
      category: product.categoryId ? categoryMap.get(product.categoryId) || null : null,
      images: imageMap.get(product.id) || [],
      variants: variantMap.get(product.id) || [],
    }));
  }

  private async loadProductDetails(product: Product): Promise<ProductWithDetails> {
    const [brand, category, images, variants] = await Promise.all([
      product.brandId ? db.select().from(brands).where(eq(brands.id, product.brandId)).limit(1) : Promise.resolve([]),
      product.categoryId ? db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1) : Promise.resolve([]),
      db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.position)),
      db.select().from(productVariants).where(eq(productVariants.productId, product.id)),
    ]);

    return {
      ...product,
      brand: brand[0] || null,
      category: category[0] || null,
      images,
      variants,
    };
  }

  async getProductById(id: string): Promise<ProductWithDetails | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) return undefined;
    return this.loadProductDetails(product);
  }

  async getProductBySlug(slug: string): Promise<ProductWithDetails | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    if (!product) return undefined;
    return this.loadProductDetails(product);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await Promise.all([
      db.delete(productImages).where(eq(productImages.productId, id)),
      db.delete(productVariants).where(eq(productVariants.productId, id)),
    ]);
    await db.delete(products).where(eq(products.id, id));
  }

  async addProductImage(image: InsertProductImage): Promise<ProductImage> {
    const [created] = await db.insert(productImages).values(image).returning();
    return created;
  }

  async deleteProductImage(id: string): Promise<void> {
    await db.delete(productImages).where(eq(productImages.id, id));
  }

  async addProductVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const [created] = await db.insert(productVariants).values(variant).returning();
    return created;
  }

  async deleteProductVariant(id: string): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
  }

  async deleteProductImages(productId: string): Promise<void> {
    await db.delete(productImages).where(eq(productImages.productId, productId));
  }

  async deleteProductVariants(productId: string): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.productId, productId));
  }

  async getCoupons(): Promise<Coupon[]> {
    return db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase())).limit(1);
    return coupon;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [created] = await db.insert(coupons).values({ ...coupon, code: coupon.code.toUpperCase() }).returning();
    return created;
  }

  async updateCoupon(id: string, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    const update = coupon.code ? { ...coupon, code: coupon.code.toUpperCase() } : coupon;
    const [updated] = await db
      .update(coupons)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();
    return updated;
  }

  async deleteCoupon(id: string): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async hasUserUsedCoupon(userId: string, couponCode: string): Promise<boolean> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.couponCode, couponCode.toUpperCase())
        )
      );
    return Number(result?.count || 0) > 0;
  }

  async hasGuestUsedCoupon(guestEmail: string, couponCode: string): Promise<boolean> {
    const normalizedEmail = guestEmail.toLowerCase().trim();
    const normalizedCode = couponCode.toUpperCase();
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        and(
          sql`lower(${orders.guestEmail}) = ${normalizedEmail}`,
          eq(orders.couponCode, normalizedCode)
        )
      );
    return Number(result?.count || 0) > 0;
  }

  async getOrders(filters: OrderFilters = {}): Promise<{ orders: OrderWithItems[]; total: number }> {
    const conditions = [];
    
    if (filters.search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${filters.search}%`),
          like(orders.guestEmail, `%${filters.search}%`)
        )
      );
    }
    if (filters.status) conditions.push(eq(orders.status, filters.status));
    if (filters.userId) conditions.push(eq(orders.userId, filters.userId));

    const baseQuery = conditions.length > 0
      ? db.select().from(orders).where(and(...conditions))
      : db.select().from(orders);

    const countResult = await (conditions.length > 0
      ? db.select({ count: sql<number>`count(*)` }).from(orders).where(and(...conditions))
      : db.select({ count: sql<number>`count(*)` }).from(orders));
    
    const total = Number(countResult[0]?.count || 0);

    let query = baseQuery.orderBy(desc(orders.createdAt)) as any;
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.offset(filters.offset);

    const orderList = await query;

    const ordersWithItems = await Promise.all(
      orderList.map(async (order: Order) => this.loadOrderDetails(order))
    );

    return { orders: ordersWithItems, total };
  }

  private async loadOrderDetails(order: Order): Promise<OrderWithItems> {
    const [items, user] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
      order.userId ? db.select().from(users).where(eq(users.id, order.userId)).limit(1) : Promise.resolve([]),
    ]);

    return {
      ...order,
      items,
      user: user[0] || null,
    };
  }

  async getOrderById(id: string): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return undefined;
    return this.loadOrderDetails(order);
  }

  async getOrderByNumber(orderNumber: string): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    if (!order) return undefined;
    return this.loadOrderDetails(order);
  }

  async getUserOrders(userId: string): Promise<OrderWithItems[]> {
    const orderList = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    return Promise.all(orderList.map((order) => this.loadOrderDetails(order)));
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const [createdOrder] = await db.insert(orders).values(order).returning();
    
    const itemsWithOrderId = items.map((item) => ({ ...item, orderId: createdOrder.id }));
    const createdItems = await db.insert(orderItems).values(itemsWithOrderId).returning();

    return {
      ...createdOrder,
      items: createdItems,
      user: null,
    };
  }

  async updateOrderStatus(id: string, status: string, trackingNumber?: string): Promise<Order | undefined> {
    const updates: Partial<Order> = { status, updatedAt: new Date() };
    if (trackingNumber) updates.trackingNumber = trackingNumber;
    
    const [updated] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async getBanners(): Promise<Banner[]> {
    return db.select().from(banners).orderBy(asc(banners.position));
  }

  async getActiveBanners(type?: string): Promise<Banner[]> {
    const conditions = [eq(banners.isActive, true)];
    if (type) conditions.push(eq(banners.type, type));
    
    return db.select().from(banners).where(and(...conditions)).orderBy(asc(banners.position));
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const [created] = await db.insert(banners).values(banner).returning();
    return created;
  }

  async updateBanner(id: string, banner: Partial<InsertBanner>): Promise<Banner | undefined> {
    const [updated] = await db
      .update(banners)
      .set({ ...banner, updatedAt: new Date() })
      .where(eq(banners.id, id))
      .returning();
    return updated;
  }

  async deleteBanner(id: string): Promise<void> {
    await db.delete(banners).where(eq(banners.id, id));
  }

  async getHomeBlocks(): Promise<HomeBlock[]> {
    return db.select().from(homeBlocks).orderBy(asc(homeBlocks.position));
  }

  async getActiveHomeBlocks(): Promise<HomeBlock[]> {
    return db.select().from(homeBlocks).where(eq(homeBlocks.isActive, true)).orderBy(asc(homeBlocks.position));
  }

  async createHomeBlock(block: InsertHomeBlock): Promise<HomeBlock> {
    const [created] = await db.insert(homeBlocks).values(block).returning();
    return created;
  }

  async updateHomeBlock(id: string, block: Partial<InsertHomeBlock>): Promise<HomeBlock | undefined> {
    const [updated] = await db
      .update(homeBlocks)
      .set({ ...block, updatedAt: new Date() })
      .where(eq(homeBlocks.id, id))
      .returning();
    return updated;
  }

  async deleteHomeBlock(id: string): Promise<void> {
    await db.delete(homeBlocks).where(eq(homeBlocks.id, id));
  }

  async getSettings(): Promise<Setting[]> {
    return db.select().from(settings);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return setting;
  }

  async upsertSettings(settingsMap: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settingsMap)) {
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value, updatedAt: new Date() },
        });
    }
  }

  async getUserAddresses(userId: string): Promise<Address[]> {
    return db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault));
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    if (address.isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, address.userId));
    }
    const [created] = await db.insert(addresses).values(address).returning();
    return created;
  }

  async updateAddress(id: string, address: Partial<InsertAddress>): Promise<Address | undefined> {
    const [updated] = await db
      .update(addresses)
      .set({ ...address, updatedAt: new Date() })
      .where(eq(addresses.id, id))
      .returning();
    return updated;
  }

  async deleteAddress(id: string): Promise<void> {
    await db.delete(addresses).where(eq(addresses.id, id));
  }

  async getWishlistItems(userId: string): Promise<WishlistItem[]> {
    return db.select().from(wishlistItems).where(eq(wishlistItems.userId, userId)).orderBy(desc(wishlistItems.createdAt));
  }

  async addToWishlist(item: InsertWishlistItem): Promise<WishlistItem> {
    const [existing] = await db
      .select()
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, item.userId), eq(wishlistItems.productId, item.productId)))
      .limit(1);
    
    if (existing) return existing;
    
    const [created] = await db.insert(wishlistItems).values(item).returning();
    return created;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await db.delete(wishlistItems).where(
      and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId))
    );
  }

  async getCartItems(userId?: string, sessionId?: string): Promise<CartItemWithProduct[]> {
    if (!userId && !sessionId) return [];

    const condition = userId 
      ? eq(cartItems.userId, userId)
      : eq(cartItems.sessionId, sessionId!);

    const items = await db.select().from(cartItems).where(condition).orderBy(desc(cartItems.createdAt));

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await this.getProductById(item.productId);
        const variant = item.variantId
          ? (await db.select().from(productVariants).where(eq(productVariants.id, item.variantId)).limit(1))[0]
          : null;
        
        return {
          ...item,
          product: product!,
          variant,
        };
      })
    );

    return itemsWithProducts.filter((item) => item.product);
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Include comboOfferId in uniqueness check - combo items should be kept separate
    const comboCondition = item.comboOfferId 
      ? eq(cartItems.comboOfferId, item.comboOfferId) 
      : isNull(cartItems.comboOfferId);
    const variantCondition = item.variantId 
      ? eq(cartItems.variantId, item.variantId) 
      : isNull(cartItems.variantId);
    
    const condition = item.userId
      ? and(eq(cartItems.userId, item.userId), eq(cartItems.productId, item.productId), variantCondition, comboCondition)
      : and(eq(cartItems.sessionId, item.sessionId!), eq(cartItems.productId, item.productId), variantCondition, comboCondition);

    const [existing] = await db.select().from(cartItems).where(condition).limit(1);

    if (existing) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing.quantity + (item.quantity || 1), updatedAt: new Date() })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(cartItems).values(item).returning();
    return created;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, id))
      .returning();
    return updated;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId?: string, sessionId?: string): Promise<void> {
    if (!userId && !sessionId) return;

    const condition = userId 
      ? eq(cartItems.userId, userId)
      : eq(cartItems.sessionId, sessionId!);

    await db.delete(cartItems).where(condition);
  }

  async getProductReviews(productId: string, approved?: boolean): Promise<ReviewWithUser[]> {
    let query = db.select().from(reviews).where(eq(reviews.productId, productId));
    
    if (approved !== undefined) {
      query = db.select().from(reviews).where(
        and(eq(reviews.productId, productId), eq(reviews.isApproved, approved))
      ) as typeof query;
    }

    const reviewList = await query.orderBy(desc(reviews.createdAt));
    return this.loadReviewsWithUsers(reviewList);
  }

  private async loadReviewsWithUsers(reviewList: Review[]): Promise<ReviewWithUser[]> {
    if (reviewList.length === 0) return [];

    const userIds = [...new Set(reviewList.filter(r => r.userId).map(r => r.userId!))];
    
    const userMap = new Map<string, { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null }>();
    
    if (userIds.length > 0) {
      const userResults = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(inArray(users.id, userIds));
      
      userResults.forEach(u => userMap.set(u.id, u));
    }
    
    return reviewList.map(review => ({
      ...review,
      user: review.userId ? userMap.get(review.userId) || null : null,
    }));
  }

  async getReviewById(id: string): Promise<ReviewWithUser | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!review) return undefined;

    const [withUser] = await this.loadReviewsWithUsers([review]);
    return withUser;
  }

  async getAllReviews(filters: ReviewFilters = {}): Promise<{ reviews: ReviewWithUser[]; total: number }> {
    const conditions = [];

    if (filters.productId) conditions.push(eq(reviews.productId, filters.productId));
    if (filters.userId) conditions.push(eq(reviews.userId, filters.userId));
    if (filters.isApproved !== undefined) conditions.push(eq(reviews.isApproved, filters.isApproved));
    if (filters.minRating) conditions.push(gte(reviews.rating, filters.minRating));
    if (filters.maxRating) conditions.push(lte(reviews.rating, filters.maxRating));

    const baseQuery = conditions.length > 0
      ? db.select().from(reviews).where(and(...conditions))
      : db.select().from(reviews);

    const countResult = await (conditions.length > 0
      ? db.select({ count: sql<number>`count(*)` }).from(reviews).where(and(...conditions))
      : db.select({ count: sql<number>`count(*)` }).from(reviews));

    const total = Number(countResult[0]?.count || 0);

    let query = baseQuery.orderBy(desc(reviews.createdAt)) as any;
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.offset(filters.offset);

    const reviewList = await query;
    const reviewsWithUsers = await this.loadReviewsWithUsers(reviewList);

    return { reviews: reviewsWithUsers, total };
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async updateReview(id: string, review: Partial<InsertReview>): Promise<Review | undefined> {
    const [updated] = await db
      .update(reviews)
      .set({ ...review, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return updated;
  }

  async deleteReview(id: string): Promise<void> {
    await db.delete(reviewVotes).where(eq(reviewVotes.reviewId, id));
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  async voteReview(vote: InsertReviewVote): Promise<ReviewVote> {
    const condition = vote.userId
      ? and(eq(reviewVotes.reviewId, vote.reviewId), eq(reviewVotes.userId, vote.userId))
      : and(eq(reviewVotes.reviewId, vote.reviewId), eq(reviewVotes.sessionId, vote.sessionId!));

    const [existing] = await db.select().from(reviewVotes).where(condition).limit(1);

    if (existing) {
      const [updated] = await db
        .update(reviewVotes)
        .set({ isHelpful: vote.isHelpful })
        .where(eq(reviewVotes.id, existing.id))
        .returning();
      
      await this.updateReviewHelpfulCount(vote.reviewId);
      return updated;
    }

    const [created] = await db.insert(reviewVotes).values(vote).returning();
    await this.updateReviewHelpfulCount(vote.reviewId);
    return created;
  }

  private async updateReviewHelpfulCount(reviewId: string): Promise<void> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviewVotes)
      .where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.isHelpful, true)));
    
    const helpfulCount = Number(result?.count || 0);
    await db.update(reviews).set({ helpfulCount }).where(eq(reviews.id, reviewId));
  }

  async hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orderItems.productId, productId),
          eq(orders.status, "delivered")
        )
      )
      .limit(1);
    
    return !!result;
  }

  async hasUserReviewedProduct(userId: string, productId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)))
      .limit(1);
    
    return !!result;
  }

  async updateProductRating(productId: string): Promise<void> {
    const [result] = await db
      .select({
        avgRating: sql<string>`COALESCE(AVG(rating), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)));

    const averageRating = parseFloat(result?.avgRating || "0").toFixed(1);
    const reviewCount = Number(result?.count || 0);

    await db
      .update(products)
      .set({ averageRating, reviewCount })
      .where(eq(products.id, productId));
  }

  async getSharedWishlist(userId: string): Promise<SharedWishlist | undefined> {
    const [wishlist] = await db
      .select()
      .from(sharedWishlists)
      .where(eq(sharedWishlists.userId, userId))
      .limit(1);
    return wishlist;
  }

  async getSharedWishlistByCode(shareCode: string): Promise<SharedWishlist | undefined> {
    const [wishlist] = await db
      .select()
      .from(sharedWishlists)
      .where(eq(sharedWishlists.shareCode, shareCode))
      .limit(1);
    return wishlist;
  }

  async createOrUpdateSharedWishlist(wishlist: InsertSharedWishlist): Promise<SharedWishlist> {
    const [existing] = await db
      .select()
      .from(sharedWishlists)
      .where(eq(sharedWishlists.userId, wishlist.userId))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(sharedWishlists)
        .set({ ...wishlist, updatedAt: new Date() })
        .where(eq(sharedWishlists.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(sharedWishlists).values(wishlist).returning();
    return created;
  }

  async deleteSharedWishlist(userId: string): Promise<void> {
    await db.delete(sharedWishlists).where(eq(sharedWishlists.userId, userId));
  }

  async getGiftRegistries(userId: string): Promise<GiftRegistry[]> {
    return db.select().from(giftRegistries).where(eq(giftRegistries.userId, userId)).orderBy(desc(giftRegistries.createdAt));
  }

  async getGiftRegistryById(id: string): Promise<GiftRegistryWithItems | undefined> {
    const [registry] = await db.select().from(giftRegistries).where(eq(giftRegistries.id, id)).limit(1);
    if (!registry) return undefined;
    return this.getGiftRegistryWithItems(registry);
  }

  async getGiftRegistryByCode(shareCode: string): Promise<GiftRegistryWithItems | undefined> {
    const [registry] = await db.select().from(giftRegistries).where(eq(giftRegistries.shareCode, shareCode)).limit(1);
    if (!registry) return undefined;
    return this.getGiftRegistryWithItems(registry);
  }

  private async getGiftRegistryWithItems(registry: GiftRegistry): Promise<GiftRegistryWithItems> {
    const items = await db
      .select()
      .from(giftRegistryItems)
      .where(eq(giftRegistryItems.registryId, registry.id))
      .orderBy(asc(giftRegistryItems.createdAt));

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await this.getProductById(item.productId);
        const variant = item.variantId
          ? (await db.select().from(productVariants).where(eq(productVariants.id, item.variantId)).limit(1))[0]
          : null;
        return { ...item, product: product!, variant };
      })
    );

    const [user] = registry.userId
      ? await db.select().from(users).where(eq(users.id, registry.userId)).limit(1)
      : [null];

    const [shippingAddress] = registry.shippingAddressId
      ? await db.select().from(addresses).where(eq(addresses.id, registry.shippingAddressId)).limit(1)
      : [null];

    return {
      ...registry,
      items: itemsWithProducts,
      user: user || undefined,
      shippingAddress: shippingAddress || undefined,
    };
  }

  async createGiftRegistry(registry: InsertGiftRegistry): Promise<GiftRegistry> {
    const [created] = await db.insert(giftRegistries).values(registry).returning();
    return created;
  }

  async updateGiftRegistry(id: string, registry: Partial<InsertGiftRegistry>): Promise<GiftRegistry | undefined> {
    const [updated] = await db
      .update(giftRegistries)
      .set({ ...registry, updatedAt: new Date() })
      .where(eq(giftRegistries.id, id))
      .returning();
    return updated;
  }

  async deleteGiftRegistry(id: string): Promise<void> {
    await db.delete(giftRegistryItems).where(eq(giftRegistryItems.registryId, id));
    await db.delete(giftRegistries).where(eq(giftRegistries.id, id));
  }

  async addGiftRegistryItem(item: InsertGiftRegistryItem): Promise<GiftRegistryItem> {
    const [existing] = await db
      .select()
      .from(giftRegistryItems)
      .where(
        and(
          eq(giftRegistryItems.registryId, item.registryId),
          eq(giftRegistryItems.productId, item.productId),
          item.variantId ? eq(giftRegistryItems.variantId, item.variantId) : isNull(giftRegistryItems.variantId)
        )
      )
      .limit(1);

    if (existing) {
      const newQuantity = (existing.quantityDesired || 1) + (item.quantityDesired || 1);
      const [updated] = await db
        .update(giftRegistryItems)
        .set({ quantityDesired: newQuantity })
        .where(eq(giftRegistryItems.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(giftRegistryItems).values(item).returning();
    return created;
  }

  async updateGiftRegistryItem(id: string, item: Partial<InsertGiftRegistryItem>): Promise<GiftRegistryItem | undefined> {
    const [updated] = await db
      .update(giftRegistryItems)
      .set(item)
      .where(eq(giftRegistryItems.id, id))
      .returning();
    return updated;
  }

  async removeGiftRegistryItem(id: string): Promise<void> {
    await db.delete(giftRegistryItems).where(eq(giftRegistryItems.id, id));
  }

  async markGiftRegistryItemPurchased(id: string, purchasedBy: string): Promise<GiftRegistryItem | undefined> {
    const [item] = await db.select().from(giftRegistryItems).where(eq(giftRegistryItems.id, id)).limit(1);
    if (!item) return undefined;

    const newPurchasedQty = (item.quantityPurchased || 0) + 1;
    const isPurchased = newPurchasedQty >= (item.quantityDesired || 1);

    const [updated] = await db
      .update(giftRegistryItems)
      .set({
        quantityPurchased: newPurchasedQty,
        isPurchased,
        purchasedBy,
        purchasedAt: new Date(),
      })
      .where(eq(giftRegistryItems.id, id))
      .returning();
    return updated;
  }

  async getLowStockProducts(threshold?: number): Promise<ProductWithDetails[]> {
    const defaultThreshold = threshold || 10;
    
    const result = await db
      .select()
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(products.isActive, true),
          or(
            lte(products.stock, sql`COALESCE(${products.lowStockThreshold}, ${defaultThreshold})`),
            eq(products.stock, 0)
          )
        )
      )
      .orderBy(asc(products.stock));

    const productIds = result.map((r) => r.products.id);
    
    const images = productIds.length > 0 
      ? await db.select().from(productImages).where(inArray(productImages.productId, productIds))
      : [];
    
    const variants = productIds.length > 0
      ? await db.select().from(productVariants).where(inArray(productVariants.productId, productIds))
      : [];

    return result.map((r) => ({
      ...r.products,
      brand: r.brands,
      category: r.categories,
      images: images.filter((img) => img.productId === r.products.id),
      variants: variants.filter((v) => v.productId === r.products.id),
    }));
  }

  async getStockNotifications(productId?: string): Promise<any[]> {
    const query = db
      .select()
      .from(stockNotifications)
      .leftJoin(products, eq(stockNotifications.productId, products.id));

    if (productId) {
      return query.where(eq(stockNotifications.productId, productId));
    }
    return query;
  }

  async createStockNotification(notification: { productId: string; variantId?: string; email: string; userId?: string }): Promise<any> {
    const existing = await db
      .select()
      .from(stockNotifications)
      .where(
        and(
          eq(stockNotifications.productId, notification.productId),
          eq(stockNotifications.email, notification.email),
          notification.variantId 
            ? eq(stockNotifications.variantId, notification.variantId) 
            : isNull(stockNotifications.variantId),
          eq(stockNotifications.isNotified, false)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [created] = await db.insert(stockNotifications).values(notification).returning();
    return created;
  }

  async deleteStockNotification(id: string): Promise<void> {
    await db.delete(stockNotifications).where(eq(stockNotifications.id, id));
  }

  async markStockNotificationsNotified(productId: string): Promise<void> {
    await db
      .update(stockNotifications)
      .set({ isNotified: true, notifiedAt: new Date() })
      .where(
        and(
          eq(stockNotifications.productId, productId),
          eq(stockNotifications.isNotified, false)
        )
      );
  }

  async getUnnotifiedStockNotifications(productId: string): Promise<any[]> {
    return db
      .select()
      .from(stockNotifications)
      .where(
        and(
          eq(stockNotifications.productId, productId),
          eq(stockNotifications.isNotified, false)
        )
      );
  }

  // Combo Offers Methods
  async getComboOffers(activeOnly: boolean = false): Promise<ComboOfferWithProducts[]> {
    let query = db.select().from(comboOffers);
    
    if (activeOnly) {
      const now = new Date();
      query = query.where(
        and(
          eq(comboOffers.isActive, true),
          or(
            isNull(comboOffers.startDate),
            lte(comboOffers.startDate, now)
          ),
          or(
            isNull(comboOffers.endDate),
            gte(comboOffers.endDate, now)
          )
        )
      ) as any;
    }
    
    const offers = await query.orderBy(asc(comboOffers.position));
    
    // Fetch products for all offers
    return Promise.all(offers.map(async (offer) => {
      const productsList = await this.getProductsByIds(offer.productIds);
      return { ...offer, products: productsList };
    }));
  }

  async getComboOfferById(id: string): Promise<ComboOfferWithProducts | undefined> {
    const [offer] = await db.select().from(comboOffers).where(eq(comboOffers.id, id)).limit(1);
    if (!offer) return undefined;
    
    const productsList = await this.getProductsByIds(offer.productIds);
    return { ...offer, products: productsList };
  }

  async getComboOfferBySlug(slug: string): Promise<ComboOfferWithProducts | undefined> {
    const [offer] = await db.select().from(comboOffers).where(eq(comboOffers.slug, slug)).limit(1);
    if (!offer) return undefined;
    
    const productsList = await this.getProductsByIds(offer.productIds);
    return { ...offer, products: productsList };
  }

  async createComboOffer(offer: InsertComboOffer): Promise<ComboOffer> {
    const [created] = await db.insert(comboOffers).values(offer).returning();
    return created;
  }

  async updateComboOffer(id: string, offer: Partial<InsertComboOffer>): Promise<ComboOffer | undefined> {
    const [updated] = await db
      .update(comboOffers)
      .set({ ...offer, updatedAt: new Date() })
      .where(eq(comboOffers.id, id))
      .returning();
    return updated;
  }

  async deleteComboOffer(id: string): Promise<void> {
    await db.delete(comboOffers).where(eq(comboOffers.id, id));
  }

  // Verified Razorpay Payments
  async createVerifiedRazorpayPayment(payment: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    userId?: string | null;
    guestSessionId?: string | null;
    amount: string;
    currency?: string;
  }): Promise<any> {
    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    const [created] = await db.insert(verifiedRazorpayPayments).values({
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      userId: payment.userId || null,
      guestSessionId: payment.guestSessionId || null,
      amount: payment.amount,
      currency: payment.currency || "INR",
      status: "verified",
      expiresAt,
    }).returning();
    return created;
  }

  async getVerifiedRazorpayPayment(
    razorpayPaymentId: string,
    userId?: string | null,
    guestSessionId?: string | null
  ): Promise<any | undefined> {
    const now = new Date();
    
    // Base conditions: payment ID, status, and not expired
    const baseConditions = [
      eq(verifiedRazorpayPayments.razorpayPaymentId, razorpayPaymentId),
      eq(verifiedRazorpayPayments.status, "verified"),
      gte(verifiedRazorpayPayments.expiresAt, now),
    ];
    
    // For authenticated users: match by userId (must match exactly)
    // For guest users: match by sessionId (must match exactly)
    // This prevents cross-account payment reuse
    if (userId) {
      // Authenticated user: must match userId
      const [payment] = await db
        .select()
        .from(verifiedRazorpayPayments)
        .where(and(...baseConditions, eq(verifiedRazorpayPayments.userId, userId)))
        .limit(1);
      return payment;
    } else if (guestSessionId) {
      // Guest user: must match sessionId
      const [payment] = await db
        .select()
        .from(verifiedRazorpayPayments)
        .where(and(...baseConditions, eq(verifiedRazorpayPayments.guestSessionId, guestSessionId)))
        .limit(1);
      return payment;
    }
    
    // No valid identifier provided - cannot verify
    return undefined;
  }

  async consumeVerifiedRazorpayPayment(id: string): Promise<void> {
    await db
      .update(verifiedRazorpayPayments)
      .set({ status: "consumed" })
      .where(eq(verifiedRazorpayPayments.id, id));
  }

  async cleanupExpiredRazorpayPayments(): Promise<void> {
    const now = new Date();
    await db
      .delete(verifiedRazorpayPayments)
      .where(
        or(
          lt(verifiedRazorpayPayments.expiresAt, now),
          eq(verifiedRazorpayPayments.status, "consumed")
        )
      );
  }

  private async getProductsByIds(productIds: string[]): Promise<ProductWithDetails[]> {
    if (productIds.length === 0) return [];
    
    const result = await db
      .select()
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(inArray(products.id, productIds));
    
    const images = await db.select().from(productImages).where(inArray(productImages.productId, productIds));
    const variants = await db.select().from(productVariants).where(inArray(productVariants.productId, productIds));
    
    return result.map((r) => ({
      ...r.products,
      brand: r.brands,
      category: r.categories,
      images: images.filter((img) => img.productId === r.products.id),
      variants: variants.filter((v) => v.productId === r.products.id),
    }));
  }

  // Quick Pages (Dynamic CMS Pages)
  async getQuickPages(publishedOnly: boolean = false): Promise<QuickPage[]> {
    const conditions = [];
    if (publishedOnly) {
      conditions.push(eq(quickPages.status, "published"));
    }
    
    return db
      .select()
      .from(quickPages)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(quickPages.position), asc(quickPages.title));
  }

  async getQuickPageById(id: string): Promise<QuickPage | undefined> {
    const [page] = await db.select().from(quickPages).where(eq(quickPages.id, id));
    return page;
  }

  async getQuickPageBySlug(slug: string): Promise<QuickPage | undefined> {
    const [page] = await db.select().from(quickPages).where(eq(quickPages.slug, slug));
    return page;
  }

  async createQuickPage(page: InsertQuickPage): Promise<QuickPage> {
    const [created] = await db.insert(quickPages).values({
      ...page,
      publishedAt: page.status === "published" ? new Date() : null,
    }).returning();
    return created;
  }

  async updateQuickPage(id: string, page: Partial<InsertQuickPage>): Promise<QuickPage | undefined> {
    const updateData: any = { ...page, updatedAt: new Date() };
    
    // Set publishedAt when status changes to published
    if (page.status === "published") {
      const existing = await this.getQuickPageById(id);
      if (existing && existing.status !== "published") {
        updateData.publishedAt = new Date();
      }
    }
    
    const [updated] = await db
      .update(quickPages)
      .set(updateData)
      .where(eq(quickPages.id, id))
      .returning();
    return updated;
  }

  async deleteQuickPage(id: string): Promise<void> {
    await db.delete(quickPages).where(eq(quickPages.id, id));
  }

  async getFooterQuickPages(): Promise<QuickPage[]> {
    return db
      .select()
      .from(quickPages)
      .where(and(
        eq(quickPages.status, "published"),
        eq(quickPages.showInFooter, true)
      ))
      .orderBy(asc(quickPages.position), asc(quickPages.title));
  }

  // OTP Codes
  async createOtpCode(otp: { email: string; phone?: string | null; code: string; purpose: string; expiresAt: Date }): Promise<any> {
    // Delete any existing OTP codes for this email and purpose
    await this.deleteOtpCodes(otp.email, otp.purpose);
    
    const [created] = await db.insert(otpCodes).values({
      email: otp.email.toLowerCase().trim(),
      phone: otp.phone || null,
      code: otp.code,
      purpose: otp.purpose,
      expiresAt: otp.expiresAt,
      verified: false,
      attempts: 0,
    }).returning();
    return created;
  }

  async getOtpCode(email: string, purpose: string): Promise<any | undefined> {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(and(
        eq(otpCodes.email, email.toLowerCase().trim()),
        eq(otpCodes.purpose, purpose),
        eq(otpCodes.verified, false),
        gte(otpCodes.expiresAt, new Date())
      ))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);
    return otp;
  }

  async verifyOtpCode(email: string, code: string, purpose: string): Promise<boolean> {
    const otp = await this.getOtpCode(email, purpose);
    
    if (!otp) {
      return false;
    }
    
    // Check max attempts (5)
    if (otp.attempts >= 5) {
      return false;
    }
    
    if (otp.code !== code) {
      await this.incrementOtpAttempts(otp.id);
      return false;
    }
    
    // Mark as verified
    await db
      .update(otpCodes)
      .set({ verified: true })
      .where(eq(otpCodes.id, otp.id));
    
    return true;
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    await db
      .update(otpCodes)
      .set({ attempts: sql`${otpCodes.attempts} + 1` })
      .where(eq(otpCodes.id, id));
  }

  async deleteOtpCodes(email: string, purpose: string): Promise<void> {
    await db
      .delete(otpCodes)
      .where(and(
        eq(otpCodes.email, email.toLowerCase().trim()),
        eq(otpCodes.purpose, purpose)
      ));
  }

  async cleanupExpiredOtpCodes(): Promise<void> {
    await db
      .delete(otpCodes)
      .where(lt(otpCodes.expiresAt, new Date()));
  }

  // Admin Roles CRUD
  async getAdminRoles(): Promise<AdminRole[]> {
    return await db
      .select()
      .from(adminRoles)
      .orderBy(asc(adminRoles.name));
  }

  async getAdminRoleById(id: string): Promise<AdminRole | undefined> {
    const [role] = await db
      .select()
      .from(adminRoles)
      .where(eq(adminRoles.id, id));
    return role;
  }

  async getAdminRoleWithPermissions(id: string): Promise<{ role: AdminRole; permissions: RolePermission[] } | undefined> {
    const role = await this.getAdminRoleById(id);
    if (!role) return undefined;

    const permissions = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, id));

    return { role, permissions };
  }

  async createAdminRole(data: InsertAdminRole): Promise<AdminRole> {
    const [role] = await db
      .insert(adminRoles)
      .values(data)
      .returning();
    return role;
  }

  async updateAdminRole(id: string, data: Partial<InsertAdminRole>): Promise<AdminRole | undefined> {
    const [role] = await db
      .update(adminRoles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adminRoles.id, id))
      .returning();
    return role;
  }

  async deleteAdminRole(id: string): Promise<boolean> {
    // Check if it's a system role
    const role = await this.getAdminRoleById(id);
    if (role?.isSystemRole) {
      return false; // Cannot delete system roles
    }
    
    const result = await db
      .delete(adminRoles)
      .where(eq(adminRoles.id, id))
      .returning();
    return result.length > 0;
  }

  // Role Permissions CRUD
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
  }

  async setRolePermissions(roleId: string, permissions: Omit<InsertRolePermission, 'roleId'>[]): Promise<RolePermission[]> {
    // Delete existing permissions
    await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    
    // Insert new permissions
    if (permissions.length === 0) {
      return [];
    }
    
    const permissionsWithRoleId = permissions.map(p => ({
      ...p,
      roleId,
    }));
    
    return await db
      .insert(rolePermissions)
      .values(permissionsWithRoleId)
      .returning();
  }

  async getUserPermissions(userId: string): Promise<RolePermission[]> {
    const user = await this.getUser(userId);
    if (!user?.adminRoleId) {
      return [];
    }
    return await this.getRolePermissions(user.adminRoleId);
  }

  async checkUserPermission(userId: string, module: string, action: 'view' | 'add' | 'edit' | 'delete'): Promise<boolean> {
    const user = await this.getUser(userId);
    
    // Super admins (legacy admin role without specific role assignment) have all permissions
    if (user?.role === 'admin' && !user.adminRoleId) {
      return true;
    }
    
    if (!user?.adminRoleId) {
      return false;
    }
    
    const [permission] = await db
      .select()
      .from(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, user.adminRoleId),
        eq(rolePermissions.module, module)
      ));
    
    if (!permission) {
      return false;
    }
    
    switch (action) {
      case 'view': return permission.canView ?? false;
      case 'add': return permission.canAdd ?? false;
      case 'edit': return permission.canEdit ?? false;
      case 'delete': return permission.canDelete ?? false;
      default: return false;
    }
  }
}

export const storage = new DatabaseStorage();
