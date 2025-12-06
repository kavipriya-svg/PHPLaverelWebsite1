import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getUserInfo, getOidcConfig, client } from "./replitAuth";
import { emailService } from "./email";
import { randomUUID } from "crypto";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { hashPassword, verifyPassword, validatePasswordStrength } from "./password";
import {
  insertProductSchema,
  insertCategorySchema,
  insertBrandSchema,
  insertCouponSchema,
  insertOrderSchema,
  insertBannerSchema,
  insertHomeBlockSchema,
  insertAddressSchema,
  insertReviewSchema,
  invoiceSettingsSchema,
  defaultInvoiceSettings,
  homeCategorySectionSchema,
  defaultHomeCategorySection,
  blogSectionSchema,
  defaultBlogSection,
} from "@shared/schema";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const socialMediaCrawlers = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "Pinterest",
  "WhatsApp",
  "TelegramBot",
  "Slackbot",
  "Discordbot",
  "vkShare",
];

function isSocialCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return socialMediaCrawlers.some(crawler => userAgent.includes(crawler));
}

async function generateOgHtml(req: Request, baseUrl: string): Promise<string | null> {
  const url = req.path;
  
  const productMatch = url.match(/^\/product\/([^\/\?]+)/);
  if (productMatch) {
    const slug = productMatch[1];
    try {
      const product = await storage.getProductBySlug(slug);
      if (product) {
        const image = product.images?.[0]?.url || "";
        const price = product.salePrice || product.price;
        const description = product.metaDescription || product.shortDesc || product.longDesc || "";
        const title = product.metaTitle || product.title;
        const productUrl = `${baseUrl}/product/${slug}`;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)} | ShopEase</title>
  <meta name="description" content="${escapeHtml(description.slice(0, 160))}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description.slice(0, 160))}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(productUrl)}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="ShopEase" />
  <meta property="product:price:amount" content="${price}" />
  <meta property="product:price:currency" content="USD" />
  <meta property="product:availability" content="${product.stock && product.stock > 0 ? 'in stock' : 'out of stock'}" />
  ${product.brand ? `<meta property="product:brand" content="${escapeHtml(product.brand.name)}" />` : ""}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description.slice(0, 160))}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <p>Price: $${price}</p>
  ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" />` : ""}
</body>
</html>`;
      }
    } catch {
      return null;
    }
  }

  const categoryMatch = url.match(/^\/category\/([^\/\?]+)/);
  if (categoryMatch) {
    const slug = categoryMatch[1];
    try {
      const category = await storage.getCategoryBySlug(slug);
      if (category) {
        const title = category.metaTitle || category.name;
        const description = category.metaDescription || category.description || `Shop ${category.name} products`;
        const categoryUrl = `${baseUrl}/category/${slug}`;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)} | ShopEase</title>
  <meta name="description" content="${escapeHtml(description.slice(0, 160))}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description.slice(0, 160))}" />
  <meta property="og:url" content="${escapeHtml(categoryUrl)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="ShopEase" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description.slice(0, 160))}" />
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
</body>
</html>`;
      }
    } catch {
      return null;
    }
  }

  return null;
}

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const dbUser = user?.dbUser;
  if (!dbUser || !["admin", "manager"].includes(dbUser.role)) {
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

  app.use(async (req, res, next) => {
    try {
      if (isSocialCrawler(req.get("User-Agent"))) {
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const ogHtml = await generateOgHtml(req, baseUrl);
        if (ogHtml) {
          return res.status(200).set({ "Content-Type": "text/html" }).send(ogHtml);
        }
      }
    } catch {
    }
    next();
  });

  app.get("/api/auth/user", async (req, res) => {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      return res.json(null);
    }
    
    // Check if the token is expired (same as isAuthenticated middleware)
    const sessionUser = req.user as any;
    const now = Math.floor(Date.now() / 1000);
    if (sessionUser?.expires_at && now > sessionUser.expires_at) {
      // Token expired - try to refresh
      const refreshToken = sessionUser.refresh_token;
      if (!refreshToken) {
        return res.json(null); // No refresh token, user needs to re-login
      }
      
      try {
        const config = await getOidcConfig();
        const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
        // Update session with new tokens
        sessionUser.claims = tokenResponse.claims();
        sessionUser.access_token = tokenResponse.access_token;
        sessionUser.refresh_token = tokenResponse.refresh_token;
        sessionUser.expires_at = sessionUser.claims?.exp;
      } catch (error) {
        // Refresh failed, user needs to re-login
        return res.json(null);
      }
    }
    
    const user = await storage.getUser(userInfo.id);
    res.json(user || null);
  });

  // Admin email/password login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      if (!["admin", "manager"].includes(user.role)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      if (!user.passwordHash) {
        return res.status(401).json({ error: "Password not set. Please contact administrator." });
      }
      
      const isValid = await verifyPassword(password, user.passwordHash);
      
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Create session for the admin user
      const sessionUser = {
        claims: { sub: user.id },
        dbUser: user,
        isAdminAuth: true, // Flag to identify admin password-based auth
      };
      
      req.login(sessionUser, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to create session" });
        }
        res.json({ 
          success: true, 
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          }
        });
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      req.session?.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.clearCookie("connect.sid");
        res.json({ success: true });
      });
    });
  });

  // Admin password setup/change (for existing admins)
  app.post("/api/admin/set-password", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userInfo = getUserInfo(req);
      
      if (!userInfo) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const user = await storage.getUser(userInfo.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // If user already has a password, verify current password
      if (user.passwordHash) {
        if (!currentPassword) {
          return res.status(400).json({ error: "Current password is required" });
        }
        const isValid = await verifyPassword(currentPassword, user.passwordHash);
        if (!isValid) {
          return res.status(401).json({ error: "Current password is incorrect" });
        }
      }
      
      // Validate new password strength
      const validation = validatePasswordStrength(newPassword);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.message });
      }
      
      // Hash and save new password
      const passwordHash = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, passwordHash);
      
      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Set password error:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // Create admin user with password (super admin only)
  app.post("/api/admin/create-admin", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      if (role && !["admin", "manager", "support"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // Validate password strength
      const validation = validatePasswordStrength(password);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.message });
      }
      
      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const newUser = await storage.upsertUser({
        id: randomUUID(),
        email: email.toLowerCase().trim(),
        firstName: firstName || null,
        lastName: lastName || null,
        role: role || "admin",
        passwordHash,
      });
      
      res.json({ 
        success: true, 
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        }
      });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });

  // Update user profile
  app.put("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { firstName, lastName, phone } = req.body;
      const updatedUser = await storage.updateUser(userInfo.id, {
        firstName,
        lastName,
        phone,
      });
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Get user addresses
  app.get("/api/addresses", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const addresses = await storage.getUserAddresses(userInfo.id);
      res.json({ addresses });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  // Create new address
  app.post("/api/addresses", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const address = await storage.createAddress({
        ...req.body,
        userId: userInfo.id,
      });
      res.json(address);
    } catch (error) {
      res.status(500).json({ error: "Failed to create address" });
    }
  });

  // Update address
  app.put("/api/addresses/:id", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Verify ownership
      const addresses = await storage.getUserAddresses(userInfo.id);
      const ownsAddress = addresses.some(a => a.id === req.params.id);
      if (!ownsAddress) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const address = await storage.updateAddress(req.params.id, req.body);
      res.json(address);
    } catch (error) {
      res.status(500).json({ error: "Failed to update address" });
    }
  });

  // Delete address
  app.delete("/api/addresses/:id", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Verify ownership
      const addresses = await storage.getUserAddresses(userInfo.id);
      const ownsAddress = addresses.some(a => a.id === req.params.id);
      if (!ownsAddress) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      await storage.deleteAddress(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete address" });
    }
  });

  // Set default address
  app.put("/api/addresses/:id/default", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Verify ownership
      const addresses = await storage.getUserAddresses(userInfo.id);
      const ownsAddress = addresses.some(a => a.id === req.params.id);
      if (!ownsAddress) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const address = await storage.updateAddress(req.params.id, { isDefault: true });
      res.json(address);
    } catch (error) {
      res.status(500).json({ error: "Failed to set default address" });
    }
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
        isNewArrival: req.query.newArrival === "true" ? true : undefined,
        isOnSale: req.query.onSale === "true" ? true : undefined,
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

  app.get("/api/coupons", async (req, res) => {
    try {
      const productId = req.query.productId as string;
      const allCoupons = await storage.getCoupons();
      const now = new Date();
      
      const applicableCoupons = allCoupons.filter((coupon) => {
        if (!coupon.isActive) return false;
        if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return false;
        if (coupon.maxUses && coupon.usedCount !== null && coupon.usedCount >= coupon.maxUses) return false;
        if (productId && coupon.productId && coupon.productId !== productId) return false;
        return true;
      });
      
      res.json({ coupons: applicableCoupons });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coupons" });
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

  // Combo Offers - Public endpoints
  app.get("/api/combo-offers", async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const offers = await storage.getComboOffers(activeOnly);
      res.json({ offers });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch combo offers" });
    }
  });

  app.get("/api/combo-offers/:slug", async (req, res) => {
    try {
      const offer = await storage.getComboOfferBySlug(req.params.slug);
      if (!offer) {
        return res.status(404).json({ error: "Combo offer not found" });
      }
      res.json({ offer });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch combo offer" });
    }
  });

  // Public settings endpoint for frontend (currency, store name, etc.)
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      // Convert array to object for easier consumption
      const settingsObj: Record<string, string> = {};
      settings.forEach((s) => {
        settingsObj[s.key] = s.value || "";
      });
      // Set default currency to INR if not set
      if (!settingsObj.currency) {
        settingsObj.currency = "INR";
      }
      res.json({ settings: settingsObj });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Invoice Template Settings - GET
  app.get("/api/settings/invoice", async (req, res) => {
    try {
      const setting = await storage.getSetting("invoice_template");
      if (setting?.value) {
        try {
          const parsed = JSON.parse(setting.value);
          // Merge with defaults to ensure all fields exist
          const invoiceSettings = { ...defaultInvoiceSettings, ...parsed };
          res.json({ settings: invoiceSettings });
        } catch {
          res.json({ settings: defaultInvoiceSettings });
        }
      } else {
        res.json({ settings: defaultInvoiceSettings });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice settings" });
    }
  });

  // Invoice Template Settings - PUT (Admin only)
  app.put("/api/settings/invoice", isAdmin, async (req, res) => {
    try {
      const validatedData = invoiceSettingsSchema.parse(req.body);
      await storage.upsertSettings({
        invoice_template: JSON.stringify(validatedData),
      });
      res.json({ success: true, settings: validatedData });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid invoice settings", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update invoice settings" });
      }
    }
  });

  // Default footer settings
  const defaultFooterSettings = {
    storeName: "ShopHub",
    storeDescription: "Your one-stop destination for quality products at great prices. Shop with confidence.",
    logoUrl: "",
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      youtube: "",
    },
    contactInfo: {
      phone: "1-800-SHOPHUB",
      email: "support@shophub.com",
      address: "123 Commerce Street\nNew York, NY 10001",
    },
    quickLinks: [
      { label: "About Us", url: "/about" },
      { label: "Contact Us", url: "/contact" },
      { label: "FAQ", url: "/faq" },
      { label: "Track Order", url: "/track-order" },
      { label: "Shipping Info", url: "/shipping" },
      { label: "Returns & Exchanges", url: "/returns" },
    ],
    legalLinks: [
      { label: "Privacy Policy", url: "/privacy" },
      { label: "Terms of Service", url: "/terms" },
    ],
    newsletterEnabled: true,
    newsletterTitle: "Newsletter",
    newsletterDescription: "Subscribe for exclusive deals, new arrivals, and more.",
    copyrightText: "All rights reserved.",
    showSocialLinks: true,
    showContactInfo: true,
    showQuickLinks: true,
    showNewsletter: true,
  };

  // Footer Settings - GET
  app.get("/api/settings/footer", async (req, res) => {
    try {
      const setting = await storage.getSetting("footer_settings");
      if (setting?.value) {
        try {
          const parsed = JSON.parse(setting.value);
          const footerSettings = { ...defaultFooterSettings, ...parsed };
          res.json({ settings: footerSettings });
        } catch {
          res.json({ settings: defaultFooterSettings });
        }
      } else {
        res.json({ settings: defaultFooterSettings });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch footer settings" });
    }
  });

  // Footer Settings - PUT (Admin only)
  app.put("/api/settings/footer", isAdmin, async (req, res) => {
    try {
      await storage.upsertSettings({
        footer_settings: JSON.stringify(req.body),
      });
      res.json({ success: true, settings: req.body });
    } catch (error) {
      res.status(500).json({ error: "Failed to update footer settings" });
    }
  });

  // Site Branding Settings - GET
  app.get("/api/settings/branding", async (req, res) => {
    try {
      const setting = await storage.getSetting("branding_settings");
      const defaultBranding = {
        logoUrl: "",
        storeName: "ShopHub",
        showStoreName: true,
        faviconUrl: "",
        topBarText: "Free shipping on orders over ₹500 | Shop Now",
        showTopBar: true,
        showHomeButton: true,
      };
      if (setting?.value) {
        try {
          const parsed = JSON.parse(setting.value);
          res.json({ settings: { ...defaultBranding, ...parsed } });
        } catch {
          res.json({ settings: defaultBranding });
        }
      } else {
        res.json({ settings: defaultBranding });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch branding settings" });
    }
  });

  // Site Branding Settings - PUT (Admin only)
  app.put("/api/settings/branding", isAdmin, async (req, res) => {
    try {
      await storage.upsertSettings({
        branding_settings: JSON.stringify(req.body),
      });
      res.json({ success: true, settings: req.body });
    } catch (error) {
      res.status(500).json({ error: "Failed to update branding settings" });
    }
  });

  // Helper to generate unique IDs for category section items
  const generateCategoryItemId = () => `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Helper to normalize category section items (ensure all have IDs)
  const normalizeCategoryItems = (categories: any[]) => {
    return categories.map((cat, idx) => ({
      ...cat,
      id: cat.id || generateCategoryItemId()
    }));
  };

  // Home Category Section Settings - GET
  app.get("/api/settings/home-category-section", async (req, res) => {
    try {
      const setting = await storage.getSetting("home_category_section");
      if (setting?.value) {
        try {
          const parsed = JSON.parse(setting.value);
          const sectionSettings = { ...defaultHomeCategorySection, ...parsed };
          // Normalize categories to ensure all have IDs
          if (sectionSettings.categories) {
            sectionSettings.categories = normalizeCategoryItems(sectionSettings.categories);
          }
          res.json({ settings: sectionSettings });
        } catch {
          res.json({ settings: defaultHomeCategorySection });
        }
      } else {
        res.json({ settings: defaultHomeCategorySection });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch home category section settings" });
    }
  });

  // Home Category Section Settings - PUT (Admin only)
  app.put("/api/settings/home-category-section", isAdmin, async (req, res) => {
    try {
      const validatedData = homeCategorySectionSchema.parse(req.body);
      // Normalize categories to ensure all have IDs before saving
      if (validatedData.categories) {
        validatedData.categories = normalizeCategoryItems(validatedData.categories);
      }
      await storage.upsertSettings({
        home_category_section: JSON.stringify(validatedData),
      });
      res.json({ success: true, settings: validatedData });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid settings", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update home category section settings" });
      }
    }
  });

  // Blog Section Settings - GET
  app.get("/api/settings/blog-section", async (req, res) => {
    try {
      const setting = await storage.getSetting("blog_section");
      if (setting?.value) {
        try {
          const parsed = JSON.parse(setting.value);
          const sectionSettings = { ...defaultBlogSection, ...parsed };
          res.json({ settings: sectionSettings });
        } catch {
          res.json({ settings: defaultBlogSection });
        }
      } else {
        res.json({ settings: defaultBlogSection });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog section settings" });
    }
  });

  // Blog Section Settings - PUT (Admin only)
  app.put("/api/settings/blog-section", isAdmin, async (req, res) => {
    try {
      const validatedData = blogSectionSchema.parse(req.body);
      await storage.upsertSettings({
        blog_section: JSON.stringify(validatedData),
      });
      res.json({ success: true, settings: validatedData });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid settings", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update blog section settings" });
      }
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

  app.get("/api/wishlist/share", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const sharedWishlist = await storage.getSharedWishlist(userInfo!.id);
      res.json({ sharedWishlist });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared wishlist settings" });
    }
  });

  app.post("/api/wishlist/share", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const { title, description, isPublic, allowAnonymous } = req.body;
      
      const shareCode = Math.random().toString(36).substring(2, 10);
      const sharedWishlist = await storage.createOrUpdateSharedWishlist({
        userId: userInfo!.id,
        shareCode,
        title: title || "My Wishlist",
        description,
        isPublic: isPublic ?? true,
        allowAnonymous: allowAnonymous ?? true,
      });
      res.json({ sharedWishlist });
    } catch (error) {
      res.status(500).json({ error: "Failed to create shared wishlist" });
    }
  });

  app.put("/api/wishlist/share", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const { title, description, isPublic, allowAnonymous } = req.body;
      
      const existing = await storage.getSharedWishlist(userInfo!.id);
      if (!existing) {
        return res.status(404).json({ error: "No shared wishlist found" });
      }
      
      const sharedWishlist = await storage.createOrUpdateSharedWishlist({
        userId: userInfo!.id,
        shareCode: existing.shareCode,
        title,
        description,
        isPublic,
        allowAnonymous,
      });
      res.json({ sharedWishlist });
    } catch (error) {
      res.status(500).json({ error: "Failed to update shared wishlist" });
    }
  });

  app.delete("/api/wishlist/share", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      await storage.deleteSharedWishlist(userInfo!.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete shared wishlist" });
    }
  });

  app.get("/api/shared-wishlist/:shareCode", async (req, res) => {
    try {
      const sharedWishlist = await storage.getSharedWishlistByCode(req.params.shareCode);
      if (!sharedWishlist) {
        return res.status(404).json({ error: "Wishlist not found" });
      }
      if (!sharedWishlist.isPublic) {
        const userInfo = getUserInfo(req);
        if (!userInfo || sharedWishlist.userId !== userInfo.id) {
          return res.status(403).json({ error: "This wishlist is private" });
        }
      }
      
      const items = await storage.getWishlistItems(sharedWishlist.userId);
      const owner = await storage.getUser(sharedWishlist.userId);
      
      res.json({
        sharedWishlist,
        items,
        owner: owner ? { firstName: owner.firstName, lastName: owner.lastName } : null,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared wishlist" });
    }
  });

  app.get("/api/gift-registries", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const registries = await storage.getGiftRegistries(userInfo!.id);
      res.json({ registries });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gift registries" });
    }
  });

  app.get("/api/gift-registries/:id", isAuthenticated, async (req, res) => {
    try {
      const registry = await storage.getGiftRegistryById(req.params.id);
      if (!registry) {
        return res.status(404).json({ error: "Gift registry not found" });
      }
      
      const userInfo = getUserInfo(req);
      if (registry.userId !== userInfo!.id) {
        return res.status(403).json({ error: "Not authorized to view this registry" });
      }
      
      res.json({ registry });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gift registry" });
    }
  });

  app.post("/api/gift-registries", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const { title, eventType, eventDate, description, coverImage, registrantName, partnerName, shippingAddressId, isPublic, showPurchased, allowMessages } = req.body;
      
      const shareCode = Math.random().toString(36).substring(2, 10);
      const registry = await storage.createGiftRegistry({
        userId: userInfo!.id,
        shareCode,
        title,
        eventType,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        description,
        coverImage,
        registrantName,
        partnerName,
        shippingAddressId,
        isPublic: isPublic ?? true,
        showPurchased: showPurchased ?? false,
        allowMessages: allowMessages ?? true,
      });
      res.status(201).json({ registry });
    } catch (error) {
      console.error("Create registry error:", error);
      res.status(500).json({ error: "Failed to create gift registry" });
    }
  });

  app.put("/api/gift-registries/:id", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const existing = await storage.getGiftRegistryById(req.params.id);
      
      if (!existing) {
        return res.status(404).json({ error: "Gift registry not found" });
      }
      if (existing.userId !== userInfo!.id) {
        return res.status(403).json({ error: "Not authorized to update this registry" });
      }
      
      const { title, eventType, eventDate, description, coverImage, registrantName, partnerName, shippingAddressId, isPublic, showPurchased, allowMessages } = req.body;
      const registry = await storage.updateGiftRegistry(req.params.id, {
        title,
        eventType,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        description,
        coverImage,
        registrantName,
        partnerName,
        shippingAddressId,
        isPublic,
        showPurchased,
        allowMessages,
      });
      res.json({ registry });
    } catch (error) {
      res.status(500).json({ error: "Failed to update gift registry" });
    }
  });

  app.delete("/api/gift-registries/:id", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const existing = await storage.getGiftRegistryById(req.params.id);
      
      if (!existing) {
        return res.status(404).json({ error: "Gift registry not found" });
      }
      if (existing.userId !== userInfo!.id) {
        return res.status(403).json({ error: "Not authorized to delete this registry" });
      }
      
      await storage.deleteGiftRegistry(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete gift registry" });
    }
  });

  app.post("/api/gift-registries/:id/items", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const registry = await storage.getGiftRegistryById(req.params.id);
      
      if (!registry) {
        return res.status(404).json({ error: "Gift registry not found" });
      }
      if (registry.userId !== userInfo!.id) {
        return res.status(403).json({ error: "Not authorized to add items to this registry" });
      }
      
      const { productId, variantId, quantityDesired, priority, note } = req.body;
      const item = await storage.addGiftRegistryItem({
        registryId: req.params.id,
        productId,
        variantId,
        quantityDesired: quantityDesired || 1,
        priority: priority || "normal",
        note,
      });
      res.status(201).json({ item });
    } catch (error) {
      res.status(500).json({ error: "Failed to add item to gift registry" });
    }
  });

  app.put("/api/gift-registry-items/:itemId", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const { quantityDesired, priority, note } = req.body;
      
      const item = await storage.updateGiftRegistryItem(req.params.itemId, {
        quantityDesired,
        priority,
        note,
      });
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json({ item });
    } catch (error) {
      res.status(500).json({ error: "Failed to update gift registry item" });
    }
  });

  app.delete("/api/gift-registry-items/:itemId", isAuthenticated, async (req, res) => {
    try {
      await storage.removeGiftRegistryItem(req.params.itemId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove item from gift registry" });
    }
  });

  app.get("/api/registry/:shareCode", async (req, res) => {
    try {
      const registry = await storage.getGiftRegistryByCode(req.params.shareCode);
      if (!registry) {
        return res.status(404).json({ error: "Gift registry not found" });
      }
      if (!registry.isPublic) {
        const userInfo = getUserInfo(req);
        if (!userInfo || registry.userId !== userInfo.id) {
          return res.status(403).json({ error: "This registry is private" });
        }
      }
      
      const itemsToShow = registry.showPurchased 
        ? registry.items 
        : registry.items.map(item => ({
            ...item,
            isPurchased: false,
            purchasedBy: null,
            purchasedAt: null,
            quantityPurchased: 0,
          }));
      
      res.json({
        registry: { ...registry, items: itemsToShow },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gift registry" });
    }
  });

  app.post("/api/registry/:shareCode/items/:itemId/purchase", async (req, res) => {
    try {
      const registry = await storage.getGiftRegistryByCode(req.params.shareCode);
      if (!registry) {
        return res.status(404).json({ error: "Gift registry not found" });
      }
      if (!registry.isPublic) {
        return res.status(403).json({ error: "This registry is private" });
      }
      
      const userInfo = getUserInfo(req);
      const { email } = req.body;
      const purchasedBy = userInfo?.email || email || "Anonymous";
      
      const item = await storage.markGiftRegistryItemPurchased(req.params.itemId, purchasedBy);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json({ item });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark item as purchased" });
    }
  });

  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const reviews = await storage.getProductReviews(req.params.productId, true);
      res.json({ reviews });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.get("/api/products/:productId/can-review", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const hasPurchased = await storage.hasUserPurchasedProduct(userInfo!.id, req.params.productId);
      const hasReviewed = await storage.hasUserReviewedProduct(userInfo!.id, req.params.productId);
      res.json({ canReview: hasPurchased && !hasReviewed, hasPurchased, hasReviewed });
    } catch (error) {
      res.status(500).json({ error: "Failed to check review eligibility" });
    }
  });

  app.post("/api/products/:productId/reviews", isAuthenticated, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const productId = req.params.productId;

      const hasReviewed = await storage.hasUserReviewedProduct(userInfo!.id, productId);
      if (hasReviewed) {
        return res.status(400).json({ error: "You have already reviewed this product" });
      }

      const hasPurchased = await storage.hasUserPurchasedProduct(userInfo!.id, productId);
      
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        productId,
        userId: userInfo!.id,
        isVerifiedPurchase: hasPurchased,
        isApproved: false,
      });

      const review = await storage.createReview(reviewData);
      res.status(201).json({ review });
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.post("/api/reviews/:reviewId/vote", optionalAuth, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const guestSessionId = (req as any).guestSessionId;
      const { isHelpful } = req.body;

      const vote = await storage.voteReview({
        reviewId: req.params.reviewId,
        userId: userInfo?.id,
        sessionId: userInfo ? undefined : guestSessionId,
        isHelpful,
      });

      res.json({ vote });
    } catch (error) {
      res.status(500).json({ error: "Failed to vote on review" });
    }
  });

  app.get("/api/coupons/validate/:code", optionalAuth, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
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
      // Check if authenticated user has already used this coupon
      if (userInfo?.id) {
        const alreadyUsed = await storage.hasUserUsedCoupon(userInfo.id, req.params.code);
        if (alreadyUsed) {
          return res.status(400).json({ error: "You have already used this coupon" });
        }
      }
      res.json({ coupon });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate coupon" });
    }
  });

  app.post("/api/orders", optionalAuth, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      const { items, shippingAddress, billingAddress, paymentMethod, couponCode, guestEmail: rawGuestEmail } = req.body;
      // Normalize guest email for consistent comparisons
      const guestEmail = rawGuestEmail ? rawGuestEmail.toLowerCase().trim() : undefined;

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
          gstRate: item.gstRate || "18", // Capture GST rate at time of purchase
        };
      });

      let discount = 0;
      let validatedCouponCode: string | undefined = undefined;
      if (couponCode) {
        const coupon = await storage.getCouponByCode(couponCode);
        if (coupon && coupon.isActive) {
          // Check if authenticated user has already used this coupon
          if (userInfo?.id) {
            const alreadyUsed = await storage.hasUserUsedCoupon(userInfo.id, couponCode);
            if (alreadyUsed) {
              return res.status(400).json({ error: "You have already used this coupon. Only one coupon use per customer is allowed." });
            }
          } else if (guestEmail) {
            // Check if guest email has already used this coupon
            const alreadyUsed = await storage.hasGuestUsedCoupon(guestEmail, couponCode);
            if (alreadyUsed) {
              return res.status(400).json({ error: "This email has already used this coupon. Only one coupon use per customer is allowed." });
            }
          }
          validatedCouponCode = coupon.code;
          if (coupon.type === "percentage") {
            discount = (subtotal * parseFloat(coupon.amount as string)) / 100;
          } else {
            discount = parseFloat(coupon.amount as string);
          }
        }
      }

      const tax = subtotal * 0.08;
      const shippingCost = subtotal > 500 ? 0 : 99;
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
          couponCode: validatedCouponCode,
        },
        orderItems
      );

      const sessionId = req.cookies?.sessionId;
      await storage.clearCart(userInfo?.id, sessionId);

      const customerEmail = userInfo?.email || guestEmail;
      let customerName = "Customer";
      if (userInfo?.id) {
        const fullUser = await storage.getUser(userInfo.id);
        if (fullUser) {
          customerName = `${fullUser.firstName || ""} ${fullUser.lastName || ""}`.trim() || "Customer";
        }
      }
      
      if (customerEmail) {
        const parsedShipping = typeof shippingAddress === "string" ? JSON.parse(shippingAddress) : shippingAddress;
        emailService.sendOrderConfirmation({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName,
          customerEmail,
          items: orderItems.map((item: any) => ({
            title: item.title,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          shipping: shippingCost.toFixed(2),
          discount: discount > 0 ? discount.toFixed(2) : undefined,
          total: total.toFixed(2),
          shippingAddress: parsedShipping ? {
            name: parsedShipping.name,
            line1: parsedShipping.line1,
            line2: parsedShipping.line2,
            city: parsedShipping.city,
            state: parsedShipping.state,
            postalCode: parsedShipping.postalCode,
            country: parsedShipping.country,
          } : undefined,
          paymentMethod,
        }).catch(err => console.error("[Email] Order confirmation failed:", err));
      }

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
      
      const lowStockProducts = products.products
        .filter(p => p.stock !== null && p.stock <= 10)
        .slice(0, 5);

      res.json({
        stats: {
          totalProducts: products.total,
          totalOrders: orders.total,
          totalUsers: users.total,
          revenue: totalRevenue,
          recentOrders,
          lowStockProducts,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
  
  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const period = (req.query.period as string) || "30days";
      const orders = await storage.getOrders({ limit: 10000 });
      
      const now = new Date();
      let daysBack = 30;
      if (period === "7days") daysBack = 7;
      else if (period === "90days") daysBack = 90;
      else if (period === "year") daysBack = 365;
      
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysBack);
      startDate.setHours(0, 0, 0, 0);
      
      const revenueByDay: Record<string, { revenue: number; orders: number }> = {};
      const statusCounts: Record<string, number> = {};
      
      for (let i = 0; i <= daysBack; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const key = date.toISOString().split('T')[0];
        revenueByDay[key] = { revenue: 0, orders: 0 };
      }
      
      for (const order of orders.orders) {
        if (!order.createdAt) continue;
        const orderDate = new Date(order.createdAt);
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        
        if (orderDate >= startDate) {
          const key = orderDate.toISOString().split('T')[0];
          if (revenueByDay[key]) {
            revenueByDay[key].revenue += parseFloat(order.total as string) || 0;
            revenueByDay[key].orders += 1;
          }
        }
      }
      
      const salesTrend = Object.entries(revenueByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({
          date,
          revenue: Math.round(data.revenue * 100) / 100,
          orders: data.orders,
        }));
      
      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));
      
      const products = await storage.getProducts({ limit: 100 });
      const mostReviewedProducts = products.products
        .filter(p => (p.reviewCount || 0) > 0)
        .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          title: p.title,
          reviewCount: p.reviewCount || 0,
          price: parseFloat(p.price as string),
          stock: p.stock || 0,
        }));
      
      const periodRevenue = salesTrend.reduce((sum, d) => sum + d.revenue, 0);
      const periodOrders = salesTrend.reduce((sum, d) => sum + d.orders, 0);
      const avgOrderValue = periodOrders > 0 ? periodRevenue / periodOrders : 0;
      
      const midPoint = Math.floor(salesTrend.length / 2);
      const firstHalf = salesTrend.slice(0, midPoint);
      const secondHalf = salesTrend.slice(midPoint);
      const firstHalfRevenue = firstHalf.reduce((sum, d) => sum + d.revenue, 0);
      const secondHalfRevenue = secondHalf.reduce((sum, d) => sum + d.revenue, 0);
      
      let revenueGrowth: number | null = null;
      if (firstHalfRevenue > 0 && secondHalfRevenue >= 0) {
        revenueGrowth = Math.round(((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100);
      } else if (firstHalfRevenue === 0 && secondHalfRevenue > 0) {
        revenueGrowth = null;
      }

      res.json({
        salesTrend,
        ordersByStatus,
        mostReviewedProducts,
        summary: {
          periodRevenue: Math.round(periodRevenue * 100) / 100,
          periodOrders,
          avgOrderValue: Math.round(avgOrderValue * 100) / 100,
          revenueGrowth,
        },
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });

  app.get("/api/admin/inventory/low-stock", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : undefined;
      const products = await storage.getLowStockProducts(threshold);
      res.json({ products });
    } catch (error) {
      console.error("Low stock error:", error);
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  });

  app.get("/api/admin/inventory/notifications", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const productId = req.query.productId as string | undefined;
      const notifications = await storage.getStockNotifications(productId);
      res.json({ notifications });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock notifications" });
    }
  });

  app.post("/api/admin/inventory/send-low-stock-alerts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { productIds } = req.body;
      const productsToAlert = productIds 
        ? await Promise.all(productIds.map((id: string) => storage.getProductById(id)))
        : await storage.getLowStockProducts();
      
      const validProducts = productsToAlert.filter((p): p is NonNullable<typeof p> => !!p);
      
      if (validProducts.length === 0) {
        return res.json({ success: true, message: "No products to alert" });
      }

      const adminEmail = req.body.adminEmail || "admin@example.com";
      
      await emailService.sendLowStockAlert({
        adminEmail,
        products: validProducts.map(p => ({
          title: p.title,
          sku: p.sku,
          currentStock: p.stock || 0,
          threshold: p.lowStockThreshold || 10,
        })),
      });

      res.json({ success: true, message: `Low stock alert sent for ${validProducts.length} products` });
    } catch (error) {
      console.error("Low stock alert error:", error);
      res.status(500).json({ error: "Failed to send low stock alerts" });
    }
  });

  app.post("/api/products/:id/notify-restock", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const userInfo = getUserInfo(req);
      const notification = await storage.createStockNotification({
        productId: req.params.id,
        email,
        userId: userInfo?.id,
      });

      res.json({ success: true, notification });
    } catch (error) {
      res.status(500).json({ error: "Failed to create restock notification" });
    }
  });

  app.post("/api/admin/inventory/process-restock-notifications", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { productId } = req.body;
      
      const product = await storage.getProductById(productId);
      if (!product || !product.stock || product.stock <= 0) {
        return res.status(400).json({ error: "Product not restocked or not found" });
      }

      const notifications = await storage.getUnnotifiedStockNotifications(productId);
      
      if (notifications.length === 0) {
        return res.json({ success: true, message: "No pending notifications" });
      }

      for (const notification of notifications) {
        await emailService.sendRestockNotification(notification.email, {
          productTitle: product.title,
          productUrl: `/product/${product.slug}`,
          productImage: product.images?.[0]?.url,
        });
      }

      await storage.markStockNotificationsNotified(productId);

      res.json({ 
        success: true, 
        message: `Sent restock notifications to ${notifications.length} subscribers` 
      });
    } catch (error) {
      console.error("Restock notification error:", error);
      res.status(500).json({ error: "Failed to process restock notifications" });
    }
  });

  // Object Storage / Image Upload Routes
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    console.log("[Objects] Fetching object:", req.path);
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      console.log("[Objects] Found object, downloading...");
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("[Objects] Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        console.log("[Objects] Object not found");
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Presigned URL endpoint for direct uploads from frontend (admin only)
  app.post("/api/upload/presigned-url", isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log("[Upload] Getting presigned URL for:", req.body);
      const objectStorageService = new ObjectStorageService();
      const presignedUrl = await objectStorageService.getObjectEntityUploadURL();
      console.log("[Upload] Got presigned URL:", presignedUrl);
      
      // Extract the object path from the presigned URL
      const url = new URL(presignedUrl);
      const pathParts = url.pathname.split('/');
      // The path format is /bucket/prefix/uploads/uuid
      const objectPath = `uploads/${pathParts[pathParts.length - 1]}`;
      console.log("[Upload] Object path:", objectPath);
      
      res.json({ presignedUrl, objectPath });
    } catch (error) {
      console.error("Error getting presigned URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.post("/api/admin/upload", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.post("/api/admin/upload/finalize", isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log("[Upload Finalize] Request body:", req.body);
      if (!req.body.uploadURL) {
        return res.status(400).json({ error: "uploadURL is required" });
      }

      const userId = (req.user as any)?.dbUser?.id || (req.user as any)?.claims?.sub || "admin";
      console.log("[Upload Finalize] User ID:", userId);
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.uploadURL,
        {
          owner: userId,
          visibility: "public",
        }
      );
      console.log("[Upload Finalize] Finalized object path:", objectPath);

      res.json({ objectPath });
    } catch (error) {
      console.error("Error finalizing upload:", error);
      res.status(500).json({ error: "Failed to finalize upload" });
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
      // Convert empty strings to null for date fields
      const body = { ...req.body };
      if (body.salePriceStart === '' || body.salePriceStart === undefined) body.salePriceStart = null;
      if (body.salePriceEnd === '' || body.salePriceEnd === undefined) body.salePriceEnd = null;
      // Convert date strings to Date objects if they're valid
      if (body.salePriceStart && typeof body.salePriceStart === 'string') {
        body.salePriceStart = new Date(body.salePriceStart);
      }
      if (body.salePriceEnd && typeof body.salePriceEnd === 'string') {
        body.salePriceEnd = new Date(body.salePriceEnd);
      }
      
      // Convert empty strings to null for numeric fields
      const numericFields = ['price', 'salePrice', 'weight', 'gstRate', 'stock', 'lowStockThreshold', 'returnDays', 'expectedDeliveryDays'];
      for (const field of numericFields) {
        if (body[field] === '' || body[field] === undefined) {
          body[field] = null;
        }
      }
      
      // Convert empty strings to null for optional text fields
      const optionalTextFields = ['shippingText', 'returnText', 'secureCheckoutText', 'bannerUrl', 'bannerTitle', 'bannerSubtitle', 'bannerCtaText', 'bannerCtaLink'];
      for (const field of optionalTextFields) {
        if (body[field] === '') {
          body[field] = null;
        }
      }
      
      const parsed = insertProductSchema.parse(body);
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
      const { images, variants, ...productData } = req.body;
      
      // Convert empty strings to null for date fields
      if (productData.salePriceStart === '' || productData.salePriceStart === undefined) productData.salePriceStart = null;
      if (productData.salePriceEnd === '' || productData.salePriceEnd === undefined) productData.salePriceEnd = null;
      // Convert date strings to Date objects if they're valid
      if (productData.salePriceStart && typeof productData.salePriceStart === 'string') {
        productData.salePriceStart = new Date(productData.salePriceStart);
      }
      if (productData.salePriceEnd && typeof productData.salePriceEnd === 'string') {
        productData.salePriceEnd = new Date(productData.salePriceEnd);
      }
      
      // Convert empty strings to null for numeric fields
      const numericFields = ['price', 'salePrice', 'weight', 'gstRate', 'stock', 'lowStockThreshold', 'returnDays', 'expectedDeliveryDays'];
      for (const field of numericFields) {
        if (productData[field] === '' || productData[field] === undefined) {
          productData[field] = null;
        }
      }
      
      // Convert empty strings to null for optional text fields
      const optionalTextFields = ['shippingText', 'returnText', 'secureCheckoutText', 'bannerUrl', 'bannerTitle', 'bannerSubtitle', 'bannerCtaText', 'bannerCtaLink'];
      for (const field of optionalTextFields) {
        if (productData[field] === '') {
          productData[field] = null;
        }
      }
      
      const product = await storage.updateProduct(req.params.id, productData);
      
      // Update images if provided
      if (images !== undefined) {
        // Delete existing images
        await storage.deleteProductImages(req.params.id);
        // Add new images
        for (const img of images) {
          await storage.addProductImage({ productId: req.params.id, ...img });
        }
      }
      
      // Update variants if provided
      if (variants !== undefined) {
        // Delete existing variants
        await storage.deleteProductVariants(req.params.id);
        // Add new variants
        for (const variant of variants) {
          await storage.addProductVariant({ productId: req.params.id, ...variant });
        }
      }
      
      const fullProduct = await storage.getProductById(req.params.id);
      res.json({ product: fullProduct });
    } catch (error) {
      console.error("Product update error:", error);
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
      const { name, slug } = req.body;
      
      // Validate required fields
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Category name is required" });
      }
      if (!slug || !slug.trim()) {
        return res.status(400).json({ error: "Category slug is required" });
      }
      
      // Validate slug format
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(slug)) {
        return res.status(400).json({ 
          error: "Slug must contain only lowercase letters, numbers, and hyphens" 
        });
      }
      
      // Check for duplicate slug
      const existing = await storage.getCategoryBySlug(slug);
      if (existing) {
        return res.status(400).json({ error: "A category with this slug already exists" });
      }
      
      const parsed = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(parsed);
      res.json({ category });
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.patch("/api/admin/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { name, slug } = req.body;
      
      // Validate required fields if provided
      if (name !== undefined && !name.trim()) {
        return res.status(400).json({ error: "Category name cannot be empty" });
      }
      if (slug !== undefined && !slug.trim()) {
        return res.status(400).json({ error: "Category slug cannot be empty" });
      }
      
      // Validate slug format if provided
      if (slug) {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(slug)) {
          return res.status(400).json({ 
            error: "Slug must contain only lowercase letters, numbers, and hyphens" 
          });
        }
        
        // Check for duplicate slug (excluding current category)
        const existing = await storage.getCategoryBySlug(slug);
        if (existing && existing.id !== req.params.id) {
          return res.status(400).json({ error: "A category with this slug already exists" });
        }
      }
      
      const category = await storage.updateCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json({ category });
    } catch (error) {
      console.error("Update category error:", error);
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
      
      const existingOrder = await storage.getOrderById(req.params.id);
      const oldStatus = existingOrder?.status || "pending";
      
      const order = await storage.updateOrderStatus(req.params.id, status, trackingNumber);
      
      if (order && oldStatus !== status) {
        const customerEmail = order.userId 
          ? (await storage.getUser(order.userId))?.email
          : order.guestEmail;
        
        if (customerEmail) {
          const user = order.userId ? await storage.getUser(order.userId) : null;
          const customerName = user 
            ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer"
            : "Customer";
          
          emailService.sendStatusUpdate({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName,
            customerEmail,
            oldStatus,
            newStatus: status,
            trackingNumber: order.trackingNumber || undefined,
            trackingUrl: order.trackingNumber ? `https://track.example.com/${order.trackingNumber}` : undefined,
          }).catch(err => console.error("[Email] Status update failed:", err));
        }
      }
      
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
      console.log("[Coupon] Creating coupon with data:", JSON.stringify(req.body, null, 2));
      
      // Preprocess the body to handle empty strings and convert to proper types
      const body = { ...req.body };
      if (body.expiresAt === '' || body.expiresAt === undefined) body.expiresAt = null;
      if (body.minCartTotal === '' || body.minCartTotal === undefined) body.minCartTotal = null;
      if (body.minQuantity === '' || body.minQuantity === undefined) body.minQuantity = null;
      if (body.maxUses === '' || body.maxUses === undefined) body.maxUses = null;
      if (body.productId === '' || body.productId === undefined) body.productId = null;
      
      // Convert expiresAt string to Date if present
      if (body.expiresAt && typeof body.expiresAt === 'string') {
        body.expiresAt = new Date(body.expiresAt);
      }
      
      console.log("[Coupon] Preprocessed data:", JSON.stringify(body, null, 2));
      const parsed = insertCouponSchema.parse(body);
      console.log("[Coupon] Parsed coupon data:", JSON.stringify(parsed, null, 2));
      const coupon = await storage.createCoupon(parsed);
      res.json({ coupon });
    } catch (error: any) {
      console.error("[Coupon] Error creating coupon:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create coupon", details: error.message });
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

  app.get("/api/admin/reviews", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const filters = {
        isApproved: req.query.approved === "true" ? true : req.query.approved === "false" ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };
      const result = await storage.getAllReviews(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.get("/api/admin/reviews/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const review = await storage.getReviewById(req.params.id);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json({ review });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch review" });
    }
  });

  app.patch("/api/admin/reviews/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const review = await storage.updateReview(req.params.id, req.body);
      if (review && req.body.isApproved !== undefined) {
        await storage.updateProductRating(review.productId);
      }
      res.json({ review });
    } catch (error) {
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  app.delete("/api/admin/reviews/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const review = await storage.getReviewById(req.params.id);
      if (review) {
        await storage.deleteReview(req.params.id);
        await storage.updateProductRating(review.productId);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete review" });
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

  // Combo Offers - Admin endpoints
  app.get("/api/admin/combo-offers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const offers = await storage.getComboOffers(false);
      res.json({ offers });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch combo offers" });
    }
  });

  app.get("/api/admin/combo-offers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const offer = await storage.getComboOfferById(req.params.id);
      if (!offer) {
        return res.status(404).json({ error: "Combo offer not found" });
      }
      res.json({ offer });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch combo offer" });
    }
  });

  app.post("/api/admin/combo-offers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { name, description, imageUrl, productIds, originalPrice, comboPrice, startDate, endDate, isActive, position } = req.body;
      
      // Generate slug from name
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Calculate discount percentage
      const discount = originalPrice > 0 
        ? ((parseFloat(originalPrice) - parseFloat(comboPrice)) / parseFloat(originalPrice) * 100).toFixed(2)
        : "0";
      
      const offer = await storage.createComboOffer({
        name,
        slug,
        description,
        imageUrl,
        productIds: productIds || [],
        originalPrice,
        comboPrice,
        discountPercentage: discount,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive ?? true,
        position: position ?? 0,
      });
      
      res.json({ offer });
    } catch (error) {
      console.error("Failed to create combo offer:", error);
      res.status(500).json({ error: "Failed to create combo offer" });
    }
  });

  app.patch("/api/admin/combo-offers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { name, description, imageUrl, productIds, originalPrice, comboPrice, startDate, endDate, isActive, position } = req.body;
      
      const updateData: any = {};
      
      if (name !== undefined) {
        updateData.name = name;
        updateData.slug = name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      if (description !== undefined) updateData.description = description;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (productIds !== undefined) updateData.productIds = productIds;
      if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
      if (comboPrice !== undefined) updateData.comboPrice = comboPrice;
      if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (position !== undefined) updateData.position = position;
      
      // Recalculate discount if prices changed
      if (originalPrice !== undefined || comboPrice !== undefined) {
        const existing = await storage.getComboOfferById(req.params.id);
        const origPrice = parseFloat(originalPrice ?? existing?.originalPrice ?? "0");
        const cmbPrice = parseFloat(comboPrice ?? existing?.comboPrice ?? "0");
        if (origPrice > 0) {
          updateData.discountPercentage = ((origPrice - cmbPrice) / origPrice * 100).toFixed(2);
        }
      }
      
      const offer = await storage.updateComboOffer(req.params.id, updateData);
      res.json({ offer });
    } catch (error) {
      console.error("Failed to update combo offer:", error);
      res.status(500).json({ error: "Failed to update combo offer" });
    }
  });

  app.delete("/api/admin/combo-offers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteComboOffer(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete combo offer" });
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

  app.get("/api/admin/email/status", isAuthenticated, isAdmin, async (req, res) => {
    res.json({
      configured: emailService.isConfigured(),
      provider: "resend",
    });
  });

  app.post("/api/admin/email/test", isAuthenticated, isAdmin, async (req, res) => {
    const { email } = req.body;
    const user = (req as any).user;
    
    if (!emailService.isConfigured()) {
      return res.status(400).json({ error: "Email service not configured. Set RESEND_API_KEY environment variable." });
    }
    
    try {
      const testEmail = email || user?.email;
      if (!testEmail) {
        return res.status(400).json({ error: "No email address provided" });
      }
      
      const success = await emailService.sendOrderConfirmation({
        orderId: "test-123",
        orderNumber: "TEST-ORDER-001",
        customerName: user?.firstName || "Test User",
        customerEmail: testEmail,
        items: [
          { title: "Test Product", quantity: 1, price: "29.99" },
          { title: "Another Product", quantity: 2, price: "19.99" },
        ],
        subtotal: "69.97",
        tax: "5.60",
        shipping: "0.00",
        total: "75.57",
        paymentMethod: "stripe",
      });
      
      if (success) {
        res.json({ success: true, message: `Test email sent to ${testEmail}` });
      } else {
        res.status(500).json({ error: "Failed to send test email" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  app.post("/api/admin/inventory/check-low-stock", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const threshold = parseInt(req.body.threshold) || 10;
      const { products } = await storage.getProducts({ limit: 1000 });
      
      const lowStockProducts = products
        .filter(p => p.stock !== null && p.stock <= threshold)
        .map(p => ({
          id: p.id,
          title: p.title,
          sku: p.sku,
          currentStock: p.stock || 0,
          threshold,
        }));
      
      if (lowStockProducts.length === 0) {
        return res.json({ lowStockProducts: [], message: "No products below threshold" });
      }
      
      const adminEmail = req.body.adminEmail || (req as any).user?.email;
      let emailSent = false;
      
      if (adminEmail && emailService.isConfigured()) {
        emailSent = await emailService.sendLowStockAlert({
          adminEmail,
          products: lowStockProducts,
        });
      }
      
      res.json({
        lowStockProducts,
        emailSent,
        message: `Found ${lowStockProducts.length} product(s) with low stock`,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check low stock" });
    }
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const { products } = await storage.getProducts({ limit: 10000, isActive: true });
      const categories = await storage.getCategories();
      const activeCategories = categories.filter(c => c.isActive !== false);
      
      const now = new Date().toISOString();
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/shop</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

      for (const category of activeCategories) {
        xml += `
  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }

      for (const product of products) {
        const lastMod = product.updatedAt ? new Date(product.updatedAt).toISOString() : now;
        xml += `
  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }

      xml += `
</urlset>`;

      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("Sitemap generation error:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  app.get("/robots.txt", (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout
Disallow: /account/

Sitemap: ${baseUrl}/sitemap.xml`;
    
    res.set("Content-Type", "text/plain");
    res.send(robotsTxt);
  });

  app.get("/api/products/:slug/structured-data", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const primaryImage = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url;
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.shortDesc || product.longDesc?.substring(0, 160),
        image: primaryImage ? [primaryImage] : [],
        sku: product.sku,
        brand: product.brand ? {
          "@type": "Brand",
          name: product.brand.name,
        } : undefined,
        category: product.category?.name,
        offers: {
          "@type": "Offer",
          url: `${baseUrl}/product/${product.slug}`,
          priceCurrency: "USD",
          price: product.salePrice || product.price,
          availability: product.stock && product.stock > 0 
            ? "https://schema.org/InStock" 
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
        aggregateRating: product.reviewCount && product.reviewCount > 0 ? {
          "@type": "AggregateRating",
          ratingValue: product.averageRating || 0,
          reviewCount: product.reviewCount,
        } : undefined,
      };
      
      res.json(structuredData);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate structured data" });
    }
  });

  app.patch("/api/admin/products/:id/seo", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { metaTitle, metaDescription, metaKeywords, slug } = req.body;
      
      if (slug) {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(slug)) {
          return res.status(400).json({ 
            error: "Invalid slug format. Use lowercase letters, numbers, and hyphens only." 
          });
        }
        
        const existing = await storage.getProductBySlug(slug);
        if (existing && existing.id !== req.params.id) {
          return res.status(400).json({ error: "Slug already in use by another product" });
        }
      }
      
      const product = await storage.updateProduct(req.params.id, {
        metaTitle,
        metaDescription,
        metaKeywords,
        slug,
      });
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json({ product });
    } catch (error) {
      res.status(500).json({ error: "Failed to update product SEO" });
    }
  });

  app.patch("/api/admin/categories/:id/seo", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { metaTitle, metaDescription, metaKeywords, slug } = req.body;
      
      if (slug) {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(slug)) {
          return res.status(400).json({ 
            error: "Invalid slug format. Use lowercase letters, numbers, and hyphens only." 
          });
        }
        
        const existing = await storage.getCategoryBySlug(slug);
        if (existing && existing.id !== req.params.id) {
          return res.status(400).json({ error: "Slug already in use by another category" });
        }
      }
      
      const category = await storage.updateCategory(req.params.id, {
        metaTitle,
        metaDescription,
        metaKeywords,
        slug,
      });
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json({ category });
    } catch (error) {
      res.status(500).json({ error: "Failed to update category SEO" });
    }
  });

  return httpServer;
}
