import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductGrid } from "./ProductGrid";
import { useQuery } from "@tanstack/react-query";
import type { HomeBlock, ProductWithDetails, Category } from "@shared/schema";

interface HomeBlocksProps {
  blocks: HomeBlock[];
}

export function HomeBlocks({ blocks }: HomeBlocksProps) {
  const sortedBlocks = [...blocks].sort((a, b) => (a.position || 0) - (b.position || 0));

  return (
    <div className="space-y-16">
      {sortedBlocks.map((block) => (
        <HomeBlockRenderer key={block.id} block={block} />
      ))}
    </div>
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
