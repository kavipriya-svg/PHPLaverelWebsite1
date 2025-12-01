import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { ProductGrid } from "@/components/store/ProductGrid";
import { ProductFilters, SortSelect, type ProductFiltersState } from "@/components/store/ProductFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductWithDetails } from "@shared/schema";

export default function SearchResults() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const query = searchParams.get("q") || "";

  const [filters, setFilters] = useState<ProductFiltersState>({
    sort: "newest",
  });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(query);
  const limit = 12;

  const { data, isLoading } = useQuery<{ 
    products: ProductWithDetails[]; 
    total: number;
    pages: number;
  }>({
    queryKey: ["/api/products", { 
      search: query,
      ...filters,
      page,
      limit,
    }],
    enabled: !!query,
  });

  const products = data?.products || [];
  const totalPages = data?.pages || 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchInput.trim())}`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Button type="submit" data-testid="button-search">
            Search
          </Button>
        </form>
      </div>

      {query && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Search results for "{query}"
          </h1>
          <p className="text-muted-foreground mt-1">
            {data?.total || 0} products found
          </p>
        </div>
      )}

      <div className="flex gap-8">
        <ProductFilters
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1);
          }}
        />

        <div className="flex-1">
          <div className="hidden lg:flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {data?.total || 0} products
            </p>
            <SortSelect
              value={filters.sort || "newest"}
              onChange={(value) => setFilters({ ...filters, sort: value })}
            />
          </div>

          <ProductGrid
            products={products}
            isLoading={isLoading}
            emptyMessage={query ? `No products found for "${query}"` : "Enter a search term"}
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
