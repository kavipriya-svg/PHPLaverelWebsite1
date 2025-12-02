import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        className="container mx-auto px-4 py-8"
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
      className="container mx-auto px-4 py-8"
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
    <section className="container mx-auto px-4" data-testid="section-featured-products">
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
    <section className="container mx-auto px-4" data-testid={`section-category-${payload?.categoryId}`}>
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
      className="container mx-auto px-4"
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
    <section className="container mx-auto px-4" data-testid={`section-banner-carousel-${block.id}`}>
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
      className="container mx-auto px-4"
      data-testid={`section-custom-${block.id}`}
    >
      <div dangerouslySetInnerHTML={{ __html: payload.html }} />
    </section>
  );
}

export function SpecialOffersSection() {
  const { data, isLoading } = useQuery<{ products: ProductWithDetails[] }>({
    queryKey: ["/api/products", { onSale: true, limit: 8 }],
  });

  return (
    <section className="container mx-auto px-4" data-testid="section-special-offers">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-destructive">Special Offers</h2>
          <p className="text-muted-foreground mt-1">Limited time deals you don't want to miss</p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/special-offers" className="flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <ProductGrid 
        products={data?.products || []} 
        isLoading={isLoading}
        emptyMessage="No special offers available right now"
      />
    </section>
  );
}

export function NewArrivalsSection() {
  const { data, isLoading } = useQuery<{ products: ProductWithDetails[] }>({
    queryKey: ["/api/products", { sort: "newest", limit: 8 }],
  });

  return (
    <section className="container mx-auto px-4" data-testid="section-new-arrivals">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">New Arrivals</h2>
        <Button variant="ghost" asChild>
          <Link href="/new-arrivals" className="flex items-center gap-1">
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

export function CategoryShowcase() {
  const { data } = useQuery<{ categories: Category[] }>({
    queryKey: ["/api/categories", { level: 1, limit: 6 }],
  });

  const categories = data?.categories || [];

  if (!categories.length) return null;

  return (
    <section className="container mx-auto px-4" data-testid="section-categories">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Shop by Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/category/${category.slug}`}>
            <Card className="overflow-hidden hover-elevate group">
              <div className="aspect-square relative">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-semibold text-lg">{category.name}</h3>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
