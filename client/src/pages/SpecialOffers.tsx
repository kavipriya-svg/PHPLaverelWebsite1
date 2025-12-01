import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Percent } from "lucide-react";
import { ProductGrid } from "@/components/store/ProductGrid";
import { ProductFilters, SortSelect, type ProductFiltersState } from "@/components/store/ProductFilters";
import { Button } from "@/components/ui/button";
import type { ProductWithDetails } from "@shared/schema";

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

  const products = data?.products || [];
  const totalPages = data?.pages || 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <Percent className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-destructive">Special Offers</h1>
        </div>
        <p className="text-muted-foreground">
          Don't miss out on these amazing deals. Limited time only!
        </p>
      </div>

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
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
