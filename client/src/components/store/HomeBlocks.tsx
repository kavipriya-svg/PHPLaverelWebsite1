import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, Clock, Flame, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductGrid } from "./ProductGrid";
import { useQuery } from "@tanstack/react-query";
import type { HomeBlock, ProductWithDetails, Category, Banner } from "@shared/schema";

interface HomeBlocksProps {
  blocks: HomeBlock[];
}

type BannerRow = Banner[];

function groupBannersIntoRows(banners: Banner[]): BannerRow[] {
  if (banners.length === 0) return [];
  
  const sortedBanners = [...banners].sort((a, b) => (a.position || 0) - (b.position || 0));
  const rows: BannerRow[] = [];
  let currentRow: Banner[] = [];
  let currentRowWidth = 0;
  
  for (const banner of sortedBanners) {
    const bannerWidth = banner.displayWidth ?? 100;
    
    if (bannerWidth === 100) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
        currentRowWidth = 0;
      }
      rows.push([banner]);
    } else if (currentRowWidth + bannerWidth <= 100) {
      currentRow.push(banner);
      currentRowWidth += bannerWidth;
      if (currentRowWidth === 100) {
        rows.push(currentRow);
        currentRow = [];
        currentRowWidth = 0;
      }
    } else {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [banner];
      currentRowWidth = bannerWidth;
    }
  }
  
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }
  
  return rows;
}

export function HomeBlocks({ blocks }: HomeBlocksProps) {
  const sortedBlocks = [...blocks].sort((a, b) => (a.position || 0) - (b.position || 0));
  
  const { data: bannersData } = useQuery<{ banners: Banner[] }>({
    queryKey: ["/api/banners"],
  });
  
  const sectionBanners = (bannersData?.banners || []).filter(
    b => b.type === "section" && b.isActive
  );
  
  const topOfPageBanners = sectionBanners.filter(b => !b.targetBlockId);
  const topOfPageRows = groupBannersIntoRows(topOfPageBanners);
  
  const getBannerRowsForBlock = (blockId: string, placement: "above" | "below") => {
    const banners = sectionBanners.filter(
      b => b.targetBlockId === blockId && b.relativePlacement === placement
    );
    return groupBannersIntoRows(banners);
  };

  return (
    <div className="space-y-16">
      {/* Render banners positioned at top of page (no target block) */}
      {topOfPageRows.map((row, rowIndex) => (
        <SectionBannerRow key={`top-row-${rowIndex}`} banners={row} />
      ))}
      
      {sortedBlocks.map((block) => {
        const aboveRows = getBannerRowsForBlock(block.id, "above");
        const belowRows = getBannerRowsForBlock(block.id, "below");
        
        return (
          <div key={block.id}>
            {/* Render banners positioned above this block */}
            {aboveRows.map((row, rowIndex) => (
              <SectionBannerRow key={`above-${block.id}-${rowIndex}`} banners={row} />
            ))}
            
            <HomeBlockRenderer block={block} />
            
            {/* Render banners positioned below this block */}
            {belowRows.map((row, rowIndex) => (
              <SectionBannerRow key={`below-${block.id}-${rowIndex}`} banners={row} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function SectionBannerRow({ banners }: { banners: Banner[] }) {
  const validBanners = banners.filter(b => b.mediaUrl || b.videoUrl);
  if (validBanners.length === 0) return null;
  
  const isSingleBanner = validBanners.length === 1;
  
  if (isSingleBanner) {
    const banner = validBanners[0];
    const width = banner.displayWidth ?? 100;
    const widthClass = 
      width === 25 ? "w-full md:w-1/4" :
      width === 50 ? "w-full md:w-1/2" : 
      width === 75 ? "w-full md:w-3/4" : 
      "w-full";
    
    const alignmentClass = 
      banner.alignment === "left" ? "mr-auto" : 
      banner.alignment === "right" ? "ml-auto" : 
      "mx-auto";

    return (
      <section 
        className="w-full px-4 py-8"
        data-testid={`section-banner-${banner.id}`}
      >
        <div className={`${widthClass} ${alignmentClass}`}>
          <SectionBannerCard banner={banner} />
        </div>
      </section>
    );
  }
  
  const widthToFr = (w: number) => {
    if (w === 25) return '1fr';
    if (w === 50) return '2fr';
    if (w === 75) return '3fr';
    return '4fr';
  };
  
  const gridColsDesktop = validBanners.map(b => widthToFr(b.displayWidth ?? 100)).join(' ');
  
  const gridStyle = {
    '--banner-grid-cols': gridColsDesktop,
  } as React.CSSProperties;
  
  return (
    <section 
      className="w-full px-4 py-8"
      data-testid="section-banner-row"
    >
      <div 
        className="grid grid-cols-1 gap-4 md:[grid-template-columns:var(--banner-grid-cols)]"
        style={gridStyle}
      >
        {validBanners.map((banner) => (
          <div 
            key={banner.id} 
            className="min-w-0 h-full"
            data-testid={`section-banner-${banner.id}`}
          >
            <SectionBannerCard banner={banner} className="h-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionBannerCard({ banner, className = "" }: { banner: Banner; className?: string }) {
  const bannerContent = (
    <Card className={`overflow-hidden hover-elevate ${className}`}>
      <div className="relative h-full">
        {banner.mediaType === "video" && banner.videoUrl ? (
          <video
            src={banner.videoUrl}
            className="w-full h-full object-cover"
            muted
            loop
            autoPlay={banner.autoplay !== false}
            playsInline
          />
        ) : banner.mediaUrl ? (
          <img
            src={banner.mediaUrl}
            alt={banner.title || "Promotional banner"}
            className="w-full h-full object-cover"
          />
        ) : null}
        {(banner.title || banner.subtitle) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4 md:p-6">
            {banner.title && (
              <h3 className="text-white font-bold text-lg md:text-xl">{banner.title}</h3>
            )}
            {banner.subtitle && (
              <p className="text-white/90 text-sm md:text-base mt-1">{banner.subtitle}</p>
            )}
            {banner.ctaText && (
              <Button variant="secondary" size="sm" className="mt-3 w-fit">
                {banner.ctaText}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  return banner.ctaLink ? (
    <Link href={banner.ctaLink} className="block h-full">{bannerContent}</Link>
  ) : (
    bannerContent
  );
}

function HomeBlockRenderer({ block }: { block: HomeBlock }) {
  switch (block.type) {
    case "featured_products":
      return <FeaturedProductsBlock block={block} />;
    case "category_products":
      return <CategoryProductsBlock block={block} />;
    case "promo_html":
      return <PromoHtmlBlock block={block} />;
    case "banner_carousel":
      return <BannerCarouselBlock block={block} />;
    case "custom_code":
      return <CustomCodeBlock block={block} />;
    default:
      return null;
  }
}

function FeaturedProductsBlock({ block }: { block: HomeBlock }) {
  const { data, isLoading } = useQuery<{ products: ProductWithDetails[] }>({
    queryKey: ["/api/products", { featured: true, limit: 8 }],
  });

  const payload = block.payload as { title?: string; productIds?: string[] } | null;
  const title = payload?.title || block.title || "Featured Products";

  return (
    <section className="w-full px-4" data-testid="section-featured-products">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
        <Button variant="ghost" asChild>
          <Link href="/featured" className="flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <ProductGrid 
        products={data?.products || []} 
        isLoading={isLoading} 
      />
    </section>
  );
}

function CategoryProductsBlock({ block }: { block: HomeBlock }) {
  const payload = block.payload as { categoryId?: string; categorySlug?: string; title?: string } | null;
  
  const { data: categoryData } = useQuery<{ category: Category }>({
    queryKey: ["/api/categories", payload?.categoryId || payload?.categorySlug],
    enabled: !!(payload?.categoryId || payload?.categorySlug),
  });

  const { data: productsData, isLoading } = useQuery<{ products: ProductWithDetails[] }>({
    queryKey: ["/api/products", { categoryId: payload?.categoryId, limit: 8 }],
    enabled: !!payload?.categoryId,
  });

  const title = payload?.title || block.title || categoryData?.category?.name || "Products";

  return (
    <section className="w-full px-4" data-testid={`section-category-${payload?.categoryId}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
        {categoryData?.category && (
          <Button variant="ghost" asChild>
            <Link href={`/category/${categoryData.category.slug}`} className="flex items-center gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
      <ProductGrid 
        products={productsData?.products || []} 
        isLoading={isLoading} 
      />
    </section>
  );
}

function PromoHtmlBlock({ block }: { block: HomeBlock }) {
  const payload = block.payload as { html?: string; backgroundColor?: string } | null;
  
  if (!payload?.html) return null;

  return (
    <section 
      className="w-full px-4"
      data-testid={`section-promo-${block.id}`}
    >
      <Card style={{ backgroundColor: payload.backgroundColor }}>
        <CardContent className="p-6 md:p-8">
          <div 
            className="prose prose-sm md:prose-base max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: payload.html }}
          />
        </CardContent>
      </Card>
    </section>
  );
}

function BannerCarouselBlock({ block }: { block: HomeBlock }) {
  const payload = block.payload as { bannerIds?: string[] } | null;
  
  const { data } = useQuery<{ banners: { id: string; mediaUrl: string; title: string; ctaLink: string }[] }>({
    queryKey: ["/api/banners", { ids: payload?.bannerIds }],
    enabled: !!(payload?.bannerIds?.length),
  });

  const banners = data?.banners || [];

  if (!banners.length) return null;

  return (
    <section className="w-full px-4" data-testid={`section-banner-carousel-${block.id}`}>
      {block.title && (
        <h2 className="text-2xl md:text-3xl font-bold mb-6">{block.title}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map((banner) => (
          <Link key={banner.id} href={banner.ctaLink || "#"}>
            <Card className="overflow-hidden hover-elevate">
              <div className="aspect-[16/9] relative">
                <img
                  src={banner.mediaUrl}
                  alt={banner.title || "Promotional banner"}
                  className="w-full h-full object-cover"
                />
                {banner.title && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <h3 className="text-white font-semibold">{banner.title}</h3>
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CustomCodeBlock({ block }: { block: HomeBlock }) {
  const payload = block.payload as { html?: string } | null;
  
  if (!payload?.html) return null;

  return (
    <section 
      className="w-full px-4"
      data-testid={`section-custom-${block.id}`}
    >
      <div dangerouslySetInnerHTML={{ __html: payload.html }} />
    </section>
  );
}

function calculateTimeLeft(endDate: Date | null): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} | null {
  if (!endDate) return null;
  
  const now = new Date().getTime();
  const end = new Date(endDate).getTime();
  const difference = end - now;

  if (difference <= 0) return null;

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
}

function useCountdown(endDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(endDate));

  useEffect(() => {
    if (!endDate) {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return timeLeft;
}

function CountdownTimer({ endDate }: { endDate: Date | null }) {
  const timeLeft = useCountdown(endDate);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-2 bg-destructive/10 px-3 py-1.5 rounded-md" data-testid="countdown-timer">
      <Clock className="h-4 w-4 text-destructive" />
      <div className="flex items-center gap-1 text-sm font-medium">
        {timeLeft.days > 0 && (
          <span className="text-destructive">{timeLeft.days}d</span>
        )}
        <span className="text-destructive">{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-destructive">{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-destructive">{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
    </div>
  );
}

function SaleProductCard({ product }: { product: ProductWithDetails }) {
  const endDate = product.salePriceEnd ? new Date(product.salePriceEnd) : null;
  
  return (
    <div className="relative">
      {endDate && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <CountdownTimer endDate={endDate} />
        </div>
      )}
    </div>
  );
}

export function SpecialOffersSection() {
  const { data, isLoading } = useQuery<{ products: ProductWithDetails[] }>({
    queryKey: ["/api/products", { onSale: true, limit: 8 }],
  });

  const products = data?.products || [];
  const earliestEndDate = products.length > 0 
    ? products.reduce((earliest, p) => {
        if (!p.salePriceEnd) return earliest;
        const pEnd = new Date(p.salePriceEnd);
        return earliest ? (pEnd < earliest ? pEnd : earliest) : pEnd;
      }, null as Date | null)
    : null;

  if (products.length === 0 && !isLoading) return null;

  return (
    <section className="w-full px-4" data-testid="section-special-offers">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="h-6 w-6 text-destructive" />
              <h2 className="text-2xl md:text-3xl font-bold text-destructive">On Sale</h2>
            </div>
            <p className="text-muted-foreground mt-1">Limited time deals you don't want to miss</p>
          </div>
          {earliestEndDate && (
            <div className="hidden md:block">
              <p className="text-xs text-muted-foreground mb-1">Sale ends in:</p>
              <CountdownTimer endDate={earliestEndDate} />
            </div>
          )}
        </div>
        <Button variant="ghost" asChild>
          <Link href="/special-offers" className="flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      {earliestEndDate && (
        <div className="md:hidden mb-4">
          <p className="text-xs text-muted-foreground mb-1">Sale ends in:</p>
          <CountdownTimer endDate={earliestEndDate} />
        </div>
      )}
      <ProductGrid 
        products={products} 
        isLoading={isLoading}
        emptyMessage="No special offers available right now"
      />
    </section>
  );
}

export function NewArrivalsSection() {
  const { data, isLoading } = useQuery<{ products: ProductWithDetails[] }>({
    queryKey: ["/api/products", { newArrival: true, limit: 8 }],
  });

  const products = data?.products || [];

  if (products.length === 0 && !isLoading) return null;

  return (
    <section className="w-full px-4" data-testid="section-new-arrivals">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">New Arrivals</h2>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/new-arrivals" className="flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <ProductGrid 
        products={products} 
        isLoading={isLoading}
        emptyMessage="No new arrivals right now"
      />
    </section>
  );
}

export function TrendingSection() {
  const { data, isLoading } = useQuery<{ products: ProductWithDetails[] }>({
    queryKey: ["/api/products", { trending: true, limit: 8 }],
  });

  const products = data?.products || [];

  if (products.length === 0 && !isLoading) return null;

  return (
    <section className="w-full px-4" data-testid="section-trending">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-orange-500" />
          <h2 className="text-2xl md:text-3xl font-bold">Trending Now</h2>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/trending" className="flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <ProductGrid 
        products={products} 
        isLoading={isLoading}
        emptyMessage="No trending products right now"
      />
    </section>
  );
}

export function FeaturedSection() {
  const { data, isLoading } = useQuery<{ products: ProductWithDetails[] }>({
    queryKey: ["/api/products", { featured: true, limit: 8 }],
  });

  const products = data?.products || [];

  if (products.length === 0 && !isLoading) return null;

  return (
    <section className="w-full px-4" data-testid="section-featured">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
        <Button variant="ghost" asChild>
          <Link href="/featured" className="flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <ProductGrid 
        products={products} 
        isLoading={isLoading}
        emptyMessage="No featured products right now"
      />
    </section>
  );
}

interface HomeCategorySectionItem {
  id?: string;
  categoryId: string;
  customLabel?: string;
  imageUrl?: string;
  position: number;
  isVisible: boolean;
  displayWidth?: "25" | "50" | "75" | "100";
  alignment?: "left" | "center" | "right";
}

interface HomeCategorySection {
  title: string;
  subtitle: string;
  isVisible: boolean;
  position: number;
  categories: HomeCategorySectionItem[];
}

type CategoryItemRow = HomeCategorySectionItem[];

function groupCategoryItemsIntoRows(items: HomeCategorySectionItem[]): CategoryItemRow[] {
  if (items.length === 0) return [];
  
  const sortedItems = [...items].sort((a, b) => (a.position || 0) - (b.position || 0));
  const rows: CategoryItemRow[] = [];
  let currentRow: HomeCategorySectionItem[] = [];
  let currentRowWidth = 0;
  
  for (const item of sortedItems) {
    const itemWidth = parseInt(item.displayWidth || "50");
    
    if (itemWidth === 100) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
        currentRowWidth = 0;
      }
      rows.push([item]);
    } else if (currentRowWidth + itemWidth <= 100) {
      currentRow.push(item);
      currentRowWidth += itemWidth;
      if (currentRowWidth === 100) {
        rows.push(currentRow);
        currentRow = [];
        currentRowWidth = 0;
      }
    } else {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [item];
      currentRowWidth = itemWidth;
    }
  }
  
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }
  
  return rows;
}

export function CategoryShowcase() {
  const { data: settingsData } = useQuery<{ settings: HomeCategorySection }>({
    queryKey: ["/api/settings/home-category-section"],
  });

  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["/api/categories", { level: 1 }],
  });

  const settings = settingsData?.settings;
  const allCategories = categoriesData?.categories || [];

  if (!settings?.isVisible) return null;

  const visibleItems = settings.categories.filter(item => item.isVisible);

  if (visibleItems.length === 0) {
    const defaultCategories = allCategories.slice(0, 6);
    if (defaultCategories.length === 0) return null;

    return (
      <section className="w-full px-4" data-testid="section-categories">
        <h2 className="text-2xl md:text-3xl font-bold mb-6" data-testid="text-categories-title">{settings?.title || "Shop by Category"}</h2>
        {settings?.subtitle && (
          <p className="text-muted-foreground mb-6" data-testid="text-categories-subtitle">{settings.subtitle}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-testid="grid-categories">
          {defaultCategories.map((category) => (
            <Link key={category.id} href={`/category/${category.slug}`} data-testid={`link-category-${category.id}`}>
              <Card className="overflow-hidden hover-elevate group" data-testid={`card-category-${category.id}`}>
                <div className="relative w-full" style={{ maxHeight: '600px' }}>
                  {category.imageUrl || category.bannerUrl ? (
                    <img
                      src={category.imageUrl || category.bannerUrl || ""}
                      alt={category.name}
                      className="w-full h-auto max-h-[600px] object-cover transition-transform duration-300 group-hover:scale-105"
                      data-testid={`img-category-${category.id}`}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                    <h3 className="text-white font-semibold text-lg" data-testid={`text-category-name-${category.id}`}>{category.name}</h3>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  const rows = groupCategoryItemsIntoRows(visibleItems);

  return (
    <section className="w-full px-4" data-testid="section-categories">
      <h2 className="text-2xl md:text-3xl font-bold mb-6" data-testid="text-categories-title">{settings?.title || "Shop by Category"}</h2>
      {settings?.subtitle && (
        <p className="text-muted-foreground mb-6" data-testid="text-categories-subtitle">{settings.subtitle}</p>
      )}
      <div className="space-y-4" data-testid="grid-categories">
        {rows.map((row, rowIndex) => (
          <CategoryRow 
            key={rowIndex} 
            items={row} 
            allCategories={allCategories} 
          />
        ))}
      </div>
    </section>
  );
}

function CategoryRow({ items, allCategories }: { items: HomeCategorySectionItem[]; allCategories: Category[] }) {
  if (items.length === 0) return null;
  
  const isSingleItem = items.length === 1;
  
  if (isSingleItem) {
    const item = items[0];
    const width = parseInt(item.displayWidth || "50");
    
    const widthClass = 
      width === 100 ? "w-full" :
      width === 25 ? "w-full md:w-1/4" :
      width === 75 ? "w-full md:w-3/4" : 
      "w-full md:w-1/2";
    
    const alignmentClass = width === 100 ? "" : 
      item.alignment === "left" ? "mr-auto" : 
      item.alignment === "right" ? "ml-auto" : 
      "mx-auto";

    return (
      <div className={`${widthClass} ${alignmentClass}`}>
        <CategoryCard item={item} allCategories={allCategories} />
      </div>
    );
  }
  
  const totalWidth = items.reduce((sum, item) => sum + parseInt(item.displayWidth || "50"), 0);
  const isPartialRow = totalWidth < 100;
  
  const widthClass = totalWidth === 100 ? "w-full" : 
    totalWidth === 25 ? "w-full md:w-1/4" :
    totalWidth === 50 ? "w-full md:w-1/2" :
    totalWidth === 75 ? "w-full md:w-3/4" :
    "w-full";
    
  const alignmentClass = !isPartialRow ? "" :
    items[0]?.alignment === "left" ? "mr-auto" : 
    items[0]?.alignment === "right" ? "ml-auto" : 
    "mx-auto";
  
  const widthToFr = (w: number) => {
    if (w === 25) return '1fr';
    if (w === 50) return '2fr';
    if (w === 75) return '3fr';
    return '4fr';
  };
  
  const gridColsDesktop = items.map(item => widthToFr(parseInt(item.displayWidth || "50"))).join(' ');
  
  const gridStyle = {
    '--category-grid-cols': gridColsDesktop,
  } as React.CSSProperties;
  
  return (
    <div className={`${widthClass} ${alignmentClass}`}>
      <div 
        className="grid grid-cols-1 gap-4 md:[grid-template-columns:var(--category-grid-cols)]"
        style={gridStyle}
      >
        {items.map((item, idx) => (
          <div key={item.id || `item_${item.categoryId}_${idx}`} className="min-w-0">
            <CategoryCard item={item} allCategories={allCategories} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryCard({ item, allCategories }: { item: HomeCategorySectionItem; allCategories: Category[] }) {
  const category = allCategories.find(c => c.id === item.categoryId);
  if (!category) return null;
  
  const displayImage = item.imageUrl || category.imageUrl || category.bannerUrl;
  const displayLabel = item.customLabel || category.name;
  
  return (
    <Link href={`/category/${category.slug}`} data-testid={`link-category-${item.categoryId}`}>
      <Card className="overflow-hidden hover-elevate group" data-testid={`card-category-${item.categoryId}`}>
        <div className="relative w-full" style={{ maxHeight: '600px' }}>
          {displayImage ? (
            <img
              src={displayImage}
              alt={displayLabel}
              className="w-full h-auto max-h-[600px] object-cover transition-transform duration-300 group-hover:scale-105"
              data-testid={`img-category-${item.categoryId}`}
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
            <h3 className="text-white font-semibold text-lg" data-testid={`text-category-name-${item.categoryId}`}>{displayLabel}</h3>
          </div>
        </div>
      </Card>
    </Link>
  );
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  author: string;
  readTime: string;
  publishedAt: string;
  position: number;
  isVisible: boolean;
}

interface BlogSection {
  title: string;
  subtitle: string;
  isVisible: boolean;
  position: number;
  posts: BlogPost[];
}

export function BlogShowcase() {
  const { data } = useQuery<{ settings: BlogSection }>({
    queryKey: ["/api/settings/blog-section"],
  });

  const settings = data?.settings;

  if (!settings?.isVisible) return null;

  const visiblePosts = settings.posts
    .filter(post => post.isVisible)
    .sort((a, b) => a.position - b.position)
    .slice(0, 3);

  if (visiblePosts.length === 0) return null;

  return (
    <section className="w-full px-4" data-testid="section-blog">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold" data-testid="text-blog-title">{settings.title || "From Our Blog"}</h2>
        {settings.subtitle && (
          <p className="text-muted-foreground mt-2" data-testid="text-blog-subtitle">{settings.subtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="grid-blog-posts">
        {visiblePosts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} data-testid={`link-blog-${post.id}`}>
            <Card className="overflow-hidden hover-elevate group h-full" data-testid={`card-blog-${post.id}`}>
              <div className="aspect-video bg-muted overflow-hidden">
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    data-testid={`img-blog-${post.id}`}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2" data-testid={`text-blog-meta-${post.id}`}>
                  {post.publishedAt && <span>{post.publishedAt}</span>}
                  {post.publishedAt && post.readTime && <span>•</span>}
                  {post.readTime && <span>{post.readTime}</span>}
                </div>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors" data-testid={`text-blog-post-title-${post.id}`}>
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-blog-excerpt-${post.id}`}>
                    {post.excerpt}
                  </p>
                )}
                {post.author && (
                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground" data-testid={`text-blog-author-${post.id}`}>
                    By {post.author}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
