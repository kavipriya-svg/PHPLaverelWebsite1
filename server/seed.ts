import { db } from "./db";
import {
  categories,
  brands,
  products,
  productImages as productImagesTable,
  productVariants,
  coupons,
  banners,
  homeBlocks,
  settings,
} from "@shared/schema";
import { randomUUID } from "crypto";

const categoryData = [
  { name: "Electronics", slug: "electronics", icon: "Laptop", description: "Latest electronic gadgets and devices", position: 1, children: [
    { name: "Smartphones", slug: "smartphones", description: "Mobile phones and accessories", position: 1, children: [
      { name: "Android Phones", slug: "android-phones", position: 1 },
      { name: "iPhones", slug: "iphones", position: 2 },
      { name: "Phone Cases", slug: "phone-cases", position: 3 },
    ]},
    { name: "Laptops", slug: "laptops", description: "Notebooks and ultrabooks", position: 2, children: [
      { name: "Gaming Laptops", slug: "gaming-laptops", position: 1 },
      { name: "Business Laptops", slug: "business-laptops", position: 2 },
    ]},
    { name: "Audio", slug: "audio", description: "Headphones, speakers, and more", position: 3, children: [
      { name: "Headphones", slug: "headphones", position: 1 },
      { name: "Speakers", slug: "speakers", position: 2 },
    ]},
  ]},
  { name: "Fashion", slug: "fashion", icon: "Shirt", description: "Clothing and accessories", position: 2, children: [
    { name: "Men's Clothing", slug: "mens-clothing", position: 1, children: [
      { name: "Shirts", slug: "mens-shirts", position: 1 },
      { name: "Pants", slug: "mens-pants", position: 2 },
      { name: "Jackets", slug: "mens-jackets", position: 3 },
    ]},
    { name: "Women's Clothing", slug: "womens-clothing", position: 2, children: [
      { name: "Dresses", slug: "womens-dresses", position: 1 },
      { name: "Tops", slug: "womens-tops", position: 2 },
    ]},
    { name: "Footwear", slug: "footwear", position: 3, children: [
      { name: "Sneakers", slug: "sneakers", position: 1 },
      { name: "Formal Shoes", slug: "formal-shoes", position: 2 },
    ]},
  ]},
  { name: "Home & Living", slug: "home-living", icon: "Home", description: "Furniture and home decor", position: 3, children: [
    { name: "Furniture", slug: "furniture", position: 1, children: [
      { name: "Living Room", slug: "living-room-furniture", position: 1 },
      { name: "Bedroom", slug: "bedroom-furniture", position: 2 },
    ]},
    { name: "Kitchen", slug: "kitchen", position: 2, children: [
      { name: "Cookware", slug: "cookware", position: 1 },
      { name: "Appliances", slug: "kitchen-appliances", position: 2 },
    ]},
  ]},
  { name: "Sports & Outdoors", slug: "sports-outdoors", icon: "Dumbbell", description: "Sports equipment and outdoor gear", position: 4, children: [
    { name: "Fitness", slug: "fitness", position: 1 },
    { name: "Camping", slug: "camping", position: 2 },
  ]},
  { name: "Beauty & Health", slug: "beauty-health", icon: "Heart", description: "Personal care and wellness", position: 5, children: [
    { name: "Skincare", slug: "skincare", position: 1 },
    { name: "Makeup", slug: "makeup", position: 2 },
  ]},
];

const brandData = [
  { name: "TechPro", slug: "techpro", description: "Premium technology products", logoUrl: "", isActive: true },
  { name: "StyleMax", slug: "stylemax", description: "Fashion-forward clothing", logoUrl: "", isActive: true },
  { name: "HomeEssentials", slug: "homeessentials", description: "Quality home products", logoUrl: "", isActive: true },
  { name: "SportElite", slug: "sportelite", description: "Professional sports gear", logoUrl: "", isActive: true },
  { name: "GlowUp", slug: "glowup", description: "Beauty and skincare", logoUrl: "", isActive: true },
  { name: "UrbanWear", slug: "urbanwear", description: "Street fashion", logoUrl: "", isActive: true },
  { name: "NatureFit", slug: "naturefit", description: "Natural wellness products", logoUrl: "", isActive: true },
  { name: "AudioMax", slug: "audiomax", description: "Premium audio equipment", logoUrl: "", isActive: true },
];

const productTemplates = [
  { title: "Pro Max Smartphone", price: "999.99", compareAtPrice: "1099.99", category: "smartphones", brand: "techpro", featured: true, trending: true },
  { title: "Ultra HD Wireless Earbuds", price: "149.99", compareAtPrice: "199.99", category: "headphones", brand: "audiomax", featured: true },
  { title: "Gaming Laptop Elite", price: "1499.99", compareAtPrice: "1799.99", category: "gaming-laptops", brand: "techpro", trending: true },
  { title: "Business Ultrabook Pro", price: "1299.99", category: "business-laptops", brand: "techpro" },
  { title: "Smart Speaker Home Hub", price: "129.99", compareAtPrice: "149.99", category: "speakers", brand: "audiomax", featured: true },
  { title: "Noise Cancelling Headphones", price: "299.99", category: "headphones", brand: "audiomax" },
  { title: "Men's Premium Oxford Shirt", price: "89.99", compareAtPrice: "120.00", category: "mens-shirts", brand: "stylemax", featured: true },
  { title: "Classic Denim Jacket", price: "149.99", category: "mens-jackets", brand: "urbanwear", trending: true },
  { title: "Slim Fit Chinos", price: "69.99", category: "mens-pants", brand: "stylemax" },
  { title: "Women's Floral Maxi Dress", price: "129.99", compareAtPrice: "159.99", category: "womens-dresses", brand: "stylemax", featured: true },
  { title: "Casual Blouse Top", price: "49.99", category: "womens-tops", brand: "stylemax" },
  { title: "Running Sneakers Pro", price: "129.99", compareAtPrice: "159.99", category: "sneakers", brand: "sportelite", trending: true },
  { title: "Classic Leather Oxfords", price: "189.99", category: "formal-shoes", brand: "stylemax" },
  { title: "Modern Sectional Sofa", price: "1299.99", compareAtPrice: "1599.99", category: "living-room-furniture", brand: "homeessentials", featured: true },
  { title: "King Size Platform Bed", price: "899.99", category: "bedroom-furniture", brand: "homeessentials" },
  { title: "Premium Cookware Set", price: "299.99", compareAtPrice: "399.99", category: "cookware", brand: "homeessentials", trending: true },
  { title: "Smart Air Fryer", price: "149.99", category: "kitchen-appliances", brand: "homeessentials" },
  { title: "Adjustable Dumbbells Set", price: "249.99", compareAtPrice: "299.99", category: "fitness", brand: "sportelite", featured: true },
  { title: "Camping Tent 4-Person", price: "199.99", category: "camping", brand: "sportelite" },
  { title: "Hydrating Face Serum", price: "59.99", compareAtPrice: "79.99", category: "skincare", brand: "glowup", featured: true },
  { title: "Full Coverage Foundation", price: "39.99", category: "makeup", brand: "glowup" },
  { title: "iPhone 15 Pro Case", price: "29.99", category: "phone-cases", brand: "techpro" },
  { title: "Android Fast Charger", price: "24.99", category: "android-phones", brand: "techpro" },
  { title: "Bluetooth Portable Speaker", price: "79.99", compareAtPrice: "99.99", category: "speakers", brand: "audiomax", trending: true },
  { title: "Over-Ear Studio Headphones", price: "249.99", category: "headphones", brand: "audiomax" },
  { title: "Men's Performance Polo", price: "59.99", category: "mens-shirts", brand: "sportelite" },
  { title: "Winter Down Jacket", price: "249.99", compareAtPrice: "299.99", category: "mens-jackets", brand: "urbanwear" },
  { title: "Yoga Mat Premium", price: "49.99", category: "fitness", brand: "naturefit" },
  { title: "Sleeping Bag Extreme", price: "129.99", category: "camping", brand: "sportelite" },
  { title: "Anti-Aging Night Cream", price: "89.99", compareAtPrice: "119.99", category: "skincare", brand: "glowup" },
  { title: "Eyeshadow Palette Pro", price: "49.99", category: "makeup", brand: "glowup" },
  { title: "Wireless Gaming Mouse", price: "79.99", category: "gaming-laptops", brand: "techpro" },
  { title: "Mechanical Keyboard RGB", price: "149.99", compareAtPrice: "179.99", category: "gaming-laptops", brand: "techpro", featured: true },
  { title: "Women's Casual Sneakers", price: "89.99", category: "sneakers", brand: "stylemax" },
  { title: "Men's Leather Belt", price: "45.99", category: "mens-pants", brand: "stylemax" },
  { title: "Coffee Maker Deluxe", price: "199.99", compareAtPrice: "249.99", category: "kitchen-appliances", brand: "homeessentials", trending: true },
  { title: "Non-Stick Pan Set", price: "89.99", category: "cookware", brand: "homeessentials" },
  { title: "Memory Foam Mattress", price: "799.99", compareAtPrice: "999.99", category: "bedroom-furniture", brand: "homeessentials", featured: true },
  { title: "Recliner Armchair", price: "599.99", category: "living-room-furniture", brand: "homeessentials" },
  { title: "Resistance Bands Set", price: "29.99", category: "fitness", brand: "naturefit" },
  { title: "Hiking Backpack 50L", price: "149.99", compareAtPrice: "179.99", category: "camping", brand: "sportelite", trending: true },
  { title: "Vitamin C Brightening Serum", price: "44.99", category: "skincare", brand: "glowup" },
  { title: "Lipstick Collection Set", price: "69.99", category: "makeup", brand: "glowup" },
  { title: "USB-C Hub Multiport", price: "49.99", category: "business-laptops", brand: "techpro" },
  { title: "Laptop Stand Ergonomic", price: "39.99", category: "business-laptops", brand: "techpro" },
  { title: "True Wireless Earbuds Sport", price: "99.99", compareAtPrice: "129.99", category: "headphones", brand: "audiomax", featured: true },
  { title: "Floor Standing Speakers", price: "599.99", category: "speakers", brand: "audiomax" },
  { title: "Women's Silk Blouse", price: "129.99", category: "womens-tops", brand: "stylemax" },
  { title: "Evening Cocktail Dress", price: "199.99", compareAtPrice: "249.99", category: "womens-dresses", brand: "stylemax", trending: true },
  { title: "Men's Casual Sneakers", price: "99.99", category: "sneakers", brand: "urbanwear" },
];

const couponData = [
  { code: "WELCOME10", type: "percentage", amount: "10", minPurchase: "50", maxUses: 1000, isActive: true },
  { code: "SAVE20", type: "percentage", amount: "20", minPurchase: "100", maxUses: 500, isActive: true },
  { code: "FLAT25", type: "fixed", amount: "25", minPurchase: "150", maxUses: 200, isActive: true },
  { code: "SUMMER30", type: "percentage", amount: "30", minPurchase: "200", isActive: true },
  { code: "FREESHIP", type: "fixed", amount: "10", minPurchase: "0", isActive: true },
];

const bannerData = [
  { title: "Summer Sale", subtitle: "Up to 50% off on selected items", imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=600&fit=crop", linkUrl: "/category/fashion", type: "hero", position: 1, isActive: true },
  { title: "New Electronics", subtitle: "Latest tech gadgets are here", imageUrl: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1920&h=600&fit=crop", linkUrl: "/category/electronics", type: "hero", position: 2, isActive: true },
  { title: "Home Makeover", subtitle: "Transform your living space", imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&h=600&fit=crop", linkUrl: "/category/home-living", type: "hero", position: 3, isActive: true },
  { title: "Free Shipping", subtitle: "On orders over $50", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop", type: "promotional", position: 1, isActive: true },
  { title: "24/7 Support", subtitle: "We're always here to help", imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop", type: "promotional", position: 2, isActive: true },
];

const homeBlockData = [
  { type: "featured_products", title: "Featured Products", subtitle: "Handpicked just for you", position: 1, isActive: true, config: { limit: 8 } },
  { type: "category_grid", title: "Shop by Category", subtitle: "Browse our collections", position: 2, isActive: true, config: { columns: 5 } },
  { type: "trending_products", title: "Trending Now", subtitle: "What everyone's buying", position: 3, isActive: true, config: { limit: 8 } },
  { type: "promotional_banner", title: "Special Offers", position: 4, isActive: true, config: {} },
  { type: "new_arrivals", title: "New Arrivals", subtitle: "Fresh from our warehouse", position: 5, isActive: true, config: { limit: 8 } },
];

const settingsData = [
  { key: "site_name", value: "ShopMax" },
  { key: "site_tagline", value: "Your One-Stop Shop" },
  { key: "contact_email", value: "support@shopmax.com" },
  { key: "contact_phone", value: "+1 (555) 123-4567" },
  { key: "address", value: "123 Commerce Street, New York, NY 10001" },
  { key: "currency", value: "USD" },
  { key: "tax_rate", value: "8" },
  { key: "free_shipping_threshold", value: "50" },
  { key: "shipping_cost", value: "9.99" },
  { key: "stripe_enabled", value: "true" },
  { key: "cod_enabled", value: "true" },
];

const productImageUrls = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop",
];

async function seed() {
  console.log("Seeding database...");

  console.log("Clearing existing data...");
  await db.delete(productImagesTable);
  await db.delete(productVariants);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(brands);
  await db.delete(coupons);
  await db.delete(banners);
  await db.delete(homeBlocks);
  await db.delete(settings);

  const categoryMap: Record<string, string> = {};
  const brandMap: Record<string, string> = {};

  async function insertCategories(cats: any[], parentId: string | null = null) {
    for (const cat of cats) {
      const id = randomUUID();
      categoryMap[cat.slug] = id;
      
      await db.insert(categories).values({
        id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        icon: cat.icon || null,
        imageUrl: null,
        parentId,
        position: cat.position,
        isActive: true,
      });

      if (cat.children?.length) {
        await insertCategories(cat.children, id);
      }
    }
  }

  console.log("Creating categories...");
  await insertCategories(categoryData);

  console.log("Creating brands...");
  for (const brand of brandData) {
    const id = randomUUID();
    brandMap[brand.slug] = id;
    await db.insert(brands).values({
      id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: brand.logoUrl,
      isActive: brand.isActive,
    });
  }

  console.log("Creating products...");
  for (let i = 0; i < productTemplates.length; i++) {
    const template = productTemplates[i];
    const productId = randomUUID();
    const slug = template.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const sku = `SKU-${(i + 1).toString().padStart(5, "0")}`;
    const imageUrl = productImageUrls[i % productImageUrls.length];

    await db.insert(products).values({
      id: productId,
      sku,
      title: template.title,
      slug,
      shortDesc: `High-quality ${template.title.toLowerCase()} for everyday use.`,
      longDesc: `Experience the excellence of our ${template.title}. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.`,
      price: template.price,
      compareAtPrice: template.compareAtPrice || null,
      costPrice: (parseFloat(template.price) * 0.6).toFixed(2),
      stock: Math.floor(Math.random() * 100) + 10,
      categoryId: categoryMap[template.category] || null,
      brandId: brandMap[template.brand] || null,
      mainImageUrl: imageUrl,
      isFeatured: template.featured || false,
      isTrending: template.trending || false,
      isActive: true,
      averageRating: (3.5 + Math.random() * 1.5).toFixed(1),
      reviewCount: Math.floor(Math.random() * 200),
    });

    await db.insert(productImagesTable).values({
      id: randomUUID(),
      productId,
      url: imageUrl,
      altText: template.title,
      position: 0,
    });
  }

  console.log("Creating coupons...");
  for (const coupon of couponData) {
    await db.insert(coupons).values({
      id: randomUUID(),
      code: coupon.code,
      type: coupon.type,
      amount: coupon.amount,
      minPurchase: coupon.minPurchase,
      maxUses: coupon.maxUses,
      usedCount: 0,
      isActive: coupon.isActive,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
  }

  console.log("Creating banners...");
  for (const banner of bannerData) {
    await db.insert(banners).values({
      id: randomUUID(),
      title: banner.title,
      subtitle: banner.subtitle,
      mediaUrl: banner.imageUrl,
      ctaLink: banner.linkUrl || null,
      type: banner.type,
      position: banner.position,
      isActive: banner.isActive,
    });
  }

  console.log("Creating home blocks...");
  for (const block of homeBlockData) {
    await db.insert(homeBlocks).values({
      id: randomUUID(),
      type: block.type,
      title: block.title,
      subtitle: block.subtitle || null,
      position: block.position,
      isActive: block.isActive,
      config: block.config,
    });
  }

  console.log("Creating settings...");
  for (const setting of settingsData) {
    await db.insert(settings).values({
      key: setting.key,
      value: setting.value,
    });
  }

  console.log("Database seeded successfully!");
}

seed().catch(console.error).finally(() => process.exit());
