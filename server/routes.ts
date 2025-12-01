import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getUserInfo } from "./replitAuth";
import { randomUUID } from "crypto";
import {
  insertProductSchema,
  insertCategorySchema,
  insertBrandSchema,
  insertCouponSchema,
  insertOrderSchema,
  insertBannerSchema,
  insertHomeBlockSchema,
  insertAddressSchema,
} from "@shared/schema";

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || !["admin", "manager"].includes(user.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated?.()) {
    return next();
  }
  let sessionId = req.cookies?.sessionId;
  if (!sessionId) {
    sessionId = randomUUID();
    res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
  }
  (req as any).guestSessionId = sessionId;
  next();
};

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await setupAuth(app);

  app.get("/api/auth/user", async (req, res) => {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      return res.json(null);
    }
    const user = await storage.getUser(userInfo.id);
    res.json(user || null);
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/menu", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      const activeCategories = categories.filter((c) => c.isActive !== false);
      res.json({ categories: activeCategories });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json({ category });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json({ brands });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch brands" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        brandId: req.query.brandId as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        isFeatured: req.query.featured === "true" ? true : undefined,
        isTrending: req.query.trending === "true" ? true : undefined,
        isActive: true,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      };
      const result = await storage.getProducts(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:slug", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({ product });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.get("/api/banners", async (req, res) => {
    try {
      const type = req.query.type as string;
      const banners = await storage.getActiveBanners(type);
      res.json({ banners });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch banners" });
    }
  });

  app.get("/api/home-blocks", async (req, res) => {
    try {
      const blocks = await storage.getActiveHomeBlocks();
      res.json({ blocks });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch home blocks" });
    }
  });

  app.get("/api/cart", optionalAuth, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const sessionId = (req as any).guestSessionId || req.cookies?.sessionId;
      const items = await storage.getCartItems(userInfo?.id, sessionId);
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", optionalAuth, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const sessionId = (req as any).guestSessionId || req.cookies?.sessionId;
      const { productId, quantity = 1, variantId } = req.body;
      
      const item = await storage.addToCart({
        userId: userInfo?.id,
        sessionId: userInfo?.id ? undefined : sessionId,
        productId,
        quantity,
        variantId,
      });
      res.json({ item });
    } catch (error) {
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:id", optionalAuth, async (req, res) => {
    try {
      const { quantity } = req.body;
      const item = await storage.updateCartItem(req.params.id, quantity);
      res.json({ item });
    } catch (error) {
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", optionalAuth, async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart", optionalAuth, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const sessionId = (req as any).guestSessionId || req.cookies?.sessionId;
      await storage.clearCart(userInfo?.id, sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  app.get("/api/wishlist", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const items = await storage.getWishlistItems(userInfo!.id);
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const { productId } = req.body;
      const item = await storage.addToWishlist({ userId: userInfo!.id, productId });
      res.json({ item });
    } catch (error) {
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/wishlist/:productId", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      await storage.removeFromWishlist(userInfo!.id, req.params.productId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });

  app.get("/api/coupons/validate/:code", async (req, res) => {
    try {
      const coupon = await storage.getCouponByCode(req.params.code);
      if (!coupon || !coupon.isActive) {
        return res.status(404).json({ error: "Invalid coupon code" });
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Coupon has expired" });
      }
      if (coupon.maxUses && coupon.usedCount && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ error: "Coupon usage limit reached" });
      }
      res.json({ coupon });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate coupon" });
    }
  });

  app.post("/api/orders", optionalAuth, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const { items, shippingAddress, billingAddress, paymentMethod, couponCode, guestEmail } = req.body;

      let subtotal = 0;
      const orderItems = items.map((item: any) => {
        subtotal += parseFloat(item.price) * item.quantity;
        return {
          productId: item.productId,
          variantId: item.variantId,
          title: item.title,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        };
      });

      let discount = 0;
      if (couponCode) {
        const coupon = await storage.getCouponByCode(couponCode);
        if (coupon && coupon.isActive) {
          if (coupon.type === "percentage") {
            discount = (subtotal * parseFloat(coupon.amount as string)) / 100;
          } else {
            discount = parseFloat(coupon.amount as string);
          }
        }
      }

      const tax = subtotal * 0.08;
      const shippingCost = subtotal > 50 ? 0 : 9.99;
      const total = subtotal - discount + tax + shippingCost;

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const order = await storage.createOrder(
        {
          orderNumber,
          userId: userInfo?.id,
          guestEmail: userInfo?.id ? undefined : guestEmail,
          subtotal: subtotal.toString(),
          discount: discount.toString(),
          tax: tax.toString(),
          shippingCost: shippingCost.toString(),
          total: total.toString(),
          status: "pending",
          paymentMethod,
          paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
          shippingAddress,
          billingAddress,
          couponCode,
        },
        orderItems
      );

      const sessionId = req.cookies?.sessionId;
      await storage.clearCart(userInfo?.id, sessionId);

      res.json({ order });
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/orders/track/:orderNumber", async (req, res) => {
    try {
      const order = await storage.getOrderByNumber(req.params.orderNumber);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json({ order });
    } catch (error) {
      res.status(500).json({ error: "Failed to track order" });
    }
  });

  app.get("/api/account/orders", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const orders = await storage.getUserOrders(userInfo!.id);
      res.json({ orders });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/account/addresses", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const addresses = await storage.getUserAddresses(userInfo!.id);
      res.json({ addresses });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  app.post("/api/account/addresses", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const parsed = insertAddressSchema.parse({ ...req.body, userId: userInfo!.id });
      const address = await storage.createAddress(parsed);
      res.json({ address });
    } catch (error) {
      res.status(500).json({ error: "Failed to create address" });
    }
  });

  app.get("/api/admin/dashboard", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const [products, orders, users] = await Promise.all([
        storage.getProducts({ limit: 1000 }),
        storage.getOrders({ limit: 1000 }),
        storage.getUsers(),
      ]);

      const totalRevenue = orders.orders.reduce(
        (sum, order) => sum + parseFloat(order.total as string),
        0
      );

      const recentOrders = orders.orders.slice(0, 5);

      res.json({
        stats: {
          totalProducts: products.total,
          totalOrders: orders.total,
          totalCustomers: users.total,
          totalRevenue,
        },
        recentOrders,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/admin/products", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        isActive: req.query.status === "active" ? true : req.query.status === "inactive" ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };
      const result = await storage.getProducts(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/admin/products/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({ product });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/admin/products", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(parsed);
      
      if (req.body.images?.length) {
        for (const img of req.body.images) {
          await storage.addProductImage({ productId: product.id, ...img });
        }
      }
      if (req.body.variants?.length) {
        for (const variant of req.body.variants) {
          await storage.addProductVariant({ productId: product.id, ...variant });
        }
      }
      
      const fullProduct = await storage.getProductById(product.id);
      res.json({ product: fullProduct });
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      res.json({ product });
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  app.get("/api/admin/categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(parsed);
      res.json({ category });
    } catch (error) {
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.patch("/api/admin/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const category = await storage.updateCategory(req.params.id, req.body);
      res.json({ category });
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  app.get("/api/admin/brands", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json({ brands });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch brands" });
    }
  });

  app.post("/api/admin/brands", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertBrandSchema.parse(req.body);
      const brand = await storage.createBrand(parsed);
      res.json({ brand });
    } catch (error) {
      res.status(500).json({ error: "Failed to create brand" });
    }
  });

  app.patch("/api/admin/brands/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const brand = await storage.updateBrand(req.params.id, req.body);
      res.json({ brand });
    } catch (error) {
      res.status(500).json({ error: "Failed to update brand" });
    }
  });

  app.delete("/api/admin/brands/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteBrand(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete brand" });
    }
  });

  app.get("/api/admin/orders", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };
      const result = await storage.getOrders(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/orders/:id/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status, trackingNumber } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status, trackingNumber);
      res.json({ order });
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.get("/api/admin/coupons", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const coupons = await storage.getCoupons();
      res.json({ coupons });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coupons" });
    }
  });

  app.post("/api/admin/coupons", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertCouponSchema.parse(req.body);
      const coupon = await storage.createCoupon(parsed);
      res.json({ coupon });
    } catch (error) {
      res.status(500).json({ error: "Failed to create coupon" });
    }
  });

  app.patch("/api/admin/coupons/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const coupon = await storage.updateCoupon(req.params.id, req.body);
      res.json({ coupon });
    } catch (error) {
      res.status(500).json({ error: "Failed to update coupon" });
    }
  });

  app.delete("/api/admin/coupons/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCoupon(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete coupon" });
    }
  });

  app.get("/api/admin/banners", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const banners = await storage.getBanners();
      res.json({ banners });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch banners" });
    }
  });

  app.post("/api/admin/banners", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertBannerSchema.parse(req.body);
      const banner = await storage.createBanner(parsed);
      res.json({ banner });
    } catch (error) {
      res.status(500).json({ error: "Failed to create banner" });
    }
  });

  app.patch("/api/admin/banners/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const banner = await storage.updateBanner(req.params.id, req.body);
      res.json({ banner });
    } catch (error) {
      res.status(500).json({ error: "Failed to update banner" });
    }
  });

  app.delete("/api/admin/banners/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteBanner(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete banner" });
    }
  });

  app.get("/api/admin/home-blocks", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const blocks = await storage.getHomeBlocks();
      res.json({ blocks });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch home blocks" });
    }
  });

  app.post("/api/admin/home-blocks", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertHomeBlockSchema.parse(req.body);
      const block = await storage.createHomeBlock(parsed);
      res.json({ block });
    } catch (error) {
      res.status(500).json({ error: "Failed to create home block" });
    }
  });

  app.patch("/api/admin/home-blocks/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const block = await storage.updateHomeBlock(req.params.id, req.body);
      res.json({ block });
    } catch (error) {
      res.status(500).json({ error: "Failed to update home block" });
    }
  });

  app.delete("/api/admin/home-blocks/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteHomeBlock(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete home block" });
    }
  });

  app.get("/api/admin/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({ settings });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { settings: settingsMap } = req.body;
      await storage.upsertSettings(settingsMap);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const search = req.query.search as string;
      const result = await storage.getUsers(search);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/role", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      const user = await storage.updateUserRole(req.params.id, role);
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  return httpServer;
}
