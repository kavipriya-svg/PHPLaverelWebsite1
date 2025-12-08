import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Percent, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductFilters, SortSelect, type ProductFiltersState } from "@/components/store/ProductFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductWithDetails } from "@shared/schema";

interface SpecialOffersPageSettings {
  bannerUrl: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerCtaText: string;
  bannerCtaLink: string;
  showBanner: boolean;
  sectionImageUrl: string;
  sectionTitle: string;
  sectionDescription: string;
  showSectionImage: boolean;
  sectionImageTargetRow: number;
  sectionImagePlacement: "before" | "after";
  sectionImageWidth: "25" | "50" | "75" | "100";
  sectionImageAlignment: "left" | "center" | "right";
}

export default function SpecialOffers() {
  const [filters, setFilters] = useState<ProductFiltersState>({
    sort: "newest",
    onSale: true,
  });
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading } = useQuery<{ 
    products: ProductWithDetails[]; 
    total: number;
    pages: number;
  }>({
    queryKey: ["/api/products", { 
      onSale: true,
      ...filters,
      page,
      limit,
    }],
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery<{ settings: SpecialOffersPageSettings }>({
    queryKey: ["/api/settings/special-offers"],
  });

  const settings = settingsData?.settings;
  const products = data?.products || [];
  const totalPages = data?.pages || 1;

  return (
    <div>
      {settings?.showBanner && settings?.bannerUrl && (
        <div className="relative overflow-hidden">
          <img 
            src={settings.bannerUrl} 
            alt={settings.bannerTitle || "Special Offers"} 
            className="w-full h-48 md:h-64 lg:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-lg text-white">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3" data-testid="text-banner-title">
                  {settings.bannerTitle || "Special Offers"}
                </h1>
                <p className="text-lg text-white/90 mb-6" data-testid="text-banner-subtitle">
                  {settings.bannerSubtitle || "Don't miss out on these amazing deals!"}
                </p>
                {settings.bannerCtaText && settings.bannerCtaLink && (
                  <Link href={settings.bannerCtaLink}>
                    <Button size="lg" variant="secondary" data-testid="button-banner-cta">
                      {settings.bannerCtaText}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {!settings?.showBanner && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Percent className="h-6 w-6 text-destructive" />
              </div>
              <h1 className="text-3xl font-bold text-destructive" data-testid="text-page-title">Special Offers</h1>
            </div>
            <p className="text-muted-foreground">
              Don't miss out on these amazing deals. Limited time only!
            </p>
          </div>
        )}

        <div className="flex gap-8">
          <ProductFilters
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters({ ...newFilters, onSale: true });
              setPage(1);
            }}
          />

          <div className="flex-1">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {data?.total || 0} products on sale
              </p>
              <SortSelect
                value={filters.sort || "newest"}
                onChange={(value) => setFilters({ ...filters, sort: value })}
              />
            </div>

            <SectionImageProductGrid 
              products={products}
              isLoading={isLoading}
              settings={settings}
            />

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  data-testid="button-previous-page"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (page > 3) {
                        pageNum = page - 2 + i;
                      }
                      if (page > totalPages - 3) {
                        pageNum = totalPages - 4 + i;
                      }
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="icon"
                        onClick={() => setPage(pageNum)}
                        data-testid={`button-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionImageBanner({ 
  settings,
  className 
}: { 
  settings: SpecialOffersPageSettings | undefined;
  className?: string;
}) {
  if (!settings?.showSectionImage || !settings?.sectionImageUrl) return null;

  const width = String(settings.sectionImageWidth || "100");
  const alignment = String(settings.sectionImageAlignment || "left");

  const widthClass = {
    "25": "w-full md:w-1/4",
    "50": "w-full md:w-1/2",
    "75": "w-full md:w-3/4",
    "100": "w-full",
  }[width] || "w-full";

  const alignmentClass = {
    "left": "justify-start",
    "center": "justify-center",
    "right": "justify-end",
  }[alignment] || "justify-start";

  return (
    <div 
      className={`flex ${alignmentClass} ${widthClass} ${className || ""}`} 
      data-testid="section-image-container"
      data-width={width}
      data-alignment={alignment}
    >
      <div className="w-full flex flex-col md:flex-row items-center gap-6 p-6 bg-gradient-to-r from-destructive/5 to-transparent rounded-xl border">
        <img 
          src={settings.sectionImageUrl} 
          alt={settings.sectionTitle || "Hot Deals"} 
          className="w-32 h-32 object-cover rounded-lg shadow-lg flex-shrink-0"
          data-testid="img-section"
        />
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-destructive mb-2" data-testid="text-section-title">
            {settings.sectionTitle || "Hot Deals"}
          </h2>
          <p className="text-muted-foreground" data-testid="text-section-description">
            {settings.sectionDescription || "Limited time offers on your favorite products"}
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionImageProductGrid({ 
  products, 
  isLoading, 
  settings 
}: { 
  products: ProductWithDetails[];
  isLoading: boolean;
  settings: SpecialOffersPageSettings | undefined;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No special offers available right now</p>
      </div>
    );
  }

  const productsPerRow = 4;
  const targetRow = Number(settings?.sectionImageTargetRow) || 1;
  const placement = String(settings?.sectionImagePlacement || "before");
  
  const insertIndex = placement === "before" 
    ? (targetRow - 1) * productsPerRow 
    : targetRow * productsPerRow;

  const showSectionImage = settings?.showSectionImage && settings?.sectionImageUrl;
  const shouldShowBanner = showSectionImage && products.length > 0;

  if (insertIndex === 0 && placement === "before") {
    return (
      <>
        {shouldShowBanner && (
          <SectionImageBanner settings={settings} className="mb-6" />
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </>
    );
  }

  const clampedIndex = Math.min(insertIndex, products.length);
  const beforeProducts = products.slice(0, clampedIndex);
  const afterProducts = products.slice(clampedIndex);

  return (
    <>
      {beforeProducts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          {beforeProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      
      {shouldShowBanner && (
        <SectionImageBanner settings={settings} className="mb-6" />
      )}
      
      {afterProducts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {afterProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
