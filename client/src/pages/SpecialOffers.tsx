import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Percent, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { ProductGrid } from "@/components/store/ProductGrid";
import { ProductFilters, SortSelect, type ProductFiltersState } from "@/components/store/ProductFilters";
import { Button } from "@/components/ui/button";
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

        {settings?.showSectionImage && settings?.sectionImageUrl && (
          <div className="mb-8 flex flex-col md:flex-row items-center gap-6 p-6 bg-gradient-to-r from-destructive/5 to-transparent rounded-xl border">
            <img 
              src={settings.sectionImageUrl} 
              alt={settings.sectionTitle || "Hot Deals"} 
              className="w-32 h-32 object-cover rounded-lg shadow-lg"
              data-testid="img-section"
            />
            <div>
              <h2 className="text-2xl font-bold text-destructive mb-2" data-testid="text-section-title">
                {settings.sectionTitle || "Hot Deals"}
              </h2>
              <p className="text-muted-foreground" data-testid="text-section-description">
                {settings.sectionDescription || "Limited time offers on your favorite products"}
              </p>
            </div>
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

            <ProductGrid
              products={products}
              isLoading={isLoading}
              emptyMessage="No special offers available right now"
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
