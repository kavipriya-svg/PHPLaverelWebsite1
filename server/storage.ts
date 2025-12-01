import { eq, and, or, like, desc, asc, sql, isNull, inArray, gte, lte, ne } from "drizzle-orm";
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
  type ProductWithDetails,
  type CategoryWithChildren,
  type OrderWithItems,
  type CartItemWithProduct,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  getUsers(search?: string): Promise<{ users: User[]; total: number }>;

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
  addProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  deleteProductVariant(id: string): Promise<void>;

  getCoupons(): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: string, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: string): Promise<void>;

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
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isTrending?: boolean;
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

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [existing] = await db.select().from(users).where(eq(users.id, userData.id)).limit(1);
    
    if (existing) {
      const [updated] = await db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, userData.id))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(users).values(userData).returning();
    return created;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
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
    if (filters.brandId) conditions.push(eq(products.brandId, filters.brandId));
    if (filters.minPrice) conditions.push(gte(products.price, filters.minPrice.toString()));
    if (filters.maxPrice) conditions.push(lte(products.price, filters.maxPrice.toString()));
    if (filters.isFeatured !== undefined) conditions.push(eq(products.isFeatured, filters.isFeatured));
    if (filters.isTrending !== undefined) conditions.push(eq(products.isTrending, filters.isTrending));
    if (filters.isActive !== undefined) conditions.push(eq(products.isActive, filters.isActive));

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

    const productsWithDetails = await Promise.all(
      productList.map(async (product: Product) => this.loadProductDetails(product))
    );

    return { products: productsWithDetails, total };
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
    const condition = item.userId
      ? and(eq(cartItems.userId, item.userId), eq(cartItems.productId, item.productId), item.variantId ? eq(cartItems.variantId, item.variantId) : isNull(cartItems.variantId))
      : and(eq(cartItems.sessionId, item.sessionId!), eq(cartItems.productId, item.productId), item.variantId ? eq(cartItems.variantId, item.variantId) : isNull(cartItems.variantId));

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
}

export const storage = new DatabaseStorage();
