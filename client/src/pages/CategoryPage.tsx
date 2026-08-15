import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGrid } from "@/components/store/ProductGrid";
import { ProductFilters, SortSelect, type ProductFiltersState } from "@/components/store/ProductFilters";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import type { Category, ProductWithDetails } from "@shared/schema";

export default function CategoryPage() {
  const [, params] = useRoute("/category/:slug");
  const [location] = useLocation();
  const slug = params?.slug;

  // Read ?category=childSlug from URL
  const childSlugFromUrl = new URLSearchParams(window.location.search).get("category");

  const [filters, setFilters] = useState<ProductFiltersState>({
    sort: "newest",
    brandIds: [],
  });
  const [page, setPage] = useState(1);
  const [activeChildSlug, setActiveChildSlug] = useState<string | null>(childSlugFromUrl);
  const limit = 12;

  // Sync active child when URL changes (e.g. browser back/forward)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setActiveChildSlug(params.get("category"));
    setPage(1);
  }, [location]);

  const { data: categoryData, isLoading: categoryLoading } = useQuery<{
    category: Category & { parent?: Category; children?: Category[] };
  }>({
    queryKey: ["/api/categories/" + slug],
    enabled: !!slug,
  });

  // Fetch the active child category to get its ID for filtering
  const { data: childCategoryData } = useQuery<{
    category: Category & { parent?: Category };
  }>({
    queryKey: ["/api/categories/" + activeChildSlug],
    enabled: !!activeChildSlug,
  });

  const category = categoryData?.category;

  // Use child category ID when a child is selected, otherwise use parent ID
  const effectiveCategoryId = activeChildSlug
    ? childCategoryData?.category?.id
    : category?.id;

  const productsQueryParams = new URLSearchParams();
  if (effectiveCategoryId) productsQueryParams.set("categoryId", effectiveCategoryId);
  if (filters.minPrice) productsQueryParams.set("minPrice", filters.minPrice.toString());
  if (filters.maxPrice) productsQueryParams.set("maxPrice", filters.maxPrice.toString());
  if (filters.brandIds && filters.brandIds.length > 0) {
    productsQueryParams.set("brandIds", filters.brandIds.join(","));
  }
  if (filters.inStock) productsQueryParams.set("inStock", "true");
  if (filters.onSale) productsQueryParams.set("onSale", "true");
  if (filters.sort === "price_asc") {
    productsQueryParams.set("sortBy", "price");
    productsQueryParams.set("sortOrder", "asc");
  } else if (filters.sort === "price_desc") {
    productsQueryParams.set("sortBy", "price");
    productsQueryParams.set("sortOrder", "desc");
  } else if (filters.sort === "popular") {
    productsQueryParams.set("sortBy", "popular");
  } else if (filters.sort === "rating") {
    productsQueryParams.set("sortBy", "rating");
  }
  productsQueryParams.set("limit", limit.toString());
  productsQueryParams.set("offset", ((page - 1) * limit).toString());

  const queryString = productsQueryParams.toString();
  const { data: productsData, isLoading: productsLoading } = useQuery<{
    products: ProductWithDetails[];
    total: number;
  }>({
    queryKey: ["/api/products?" + queryString],
    enabled: !!effectiveCategoryId,
  });

  const products = productsData?.products || [];
  const totalItems = productsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  // Handle child category pill click — update URL param and filter state
  const handleChildClick = (childSlug: string) => {
    const next = activeChildSlug === childSlug ? null : childSlug;
    setActiveChildSlug(next);
    setPage(1);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("category", next);
    else url.searchParams.delete("category");
    window.history.replaceState(null, "", url.toString());
  };

  if (categoryLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-6 w-64 mb-6" />
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="flex gap-8">
          <div className="hidden lg:block w-64">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The category you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const activeChild = activeChildSlug
    ? category.children?.find((c) => c.slug === activeChildSlug)
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <SEOHead
        title={activeChild ? `${activeChild.name} — ${category.name}` : (category.metaTitle || category.name)}
        description={category.metaDescription || category.description || `Shop ${category.name} products`}
      />

      {category.bannerUrl && (
        <div className="relative w-full aspect-[3/1] min-h-[240px] mb-6 -mx-4 md:-mx-6 lg:-mx-8">
          <img
            src={category.bannerUrl}
            alt={`${category.name} banner`}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2">
              {activeChild ? activeChild.name : category.name}
            </h1>
            {category.description && !activeChild && (
              <p className="text-white/80 max-w-2xl text-sm md:text-base">{category.description}</p>
            )}
          </div>
        </div>
      )}

      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {category.parent && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/category/${category.parent.slug}`}>
                  {category.parent.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          {activeChild ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/category/${category.slug}`}>
                  {category.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{activeChild.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage>{category.name}</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {!category.bannerUrl && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {activeChild ? activeChild.name : category.name}
          </h1>
          {category.description && !activeChild && (
            <p className="text-muted-foreground">{category.description}</p>
          )}
        </div>
      )}

      {category.children && category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter by type</h2>
          <div className="flex flex-wrap gap-2">
            {category.children.map((child) => {
              const isActive = activeChildSlug === child.slug;
              return (
                <button
                  key={child.id}
                  onClick={() => handleChildClick(child.slug)}
                  className="cursor-pointer transition-colors"
                  style={{ background: "none", border: "none", padding: 0 }}
                >
                  <span
                    className={`inline-block px-4 py-2 text-sm font-medium border rounded-full transition-colors ${
                      isActive
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:border-foreground"
                    }`}
                  >
                    {child.name}
                  </span>
                </button>
              );
            })}
            {activeChildSlug && (
              <button
                onClick={() => handleChildClick(activeChildSlug)}
                className="cursor-pointer text-sm text-muted-foreground underline self-center"
                style={{ background: "none", border: "none" }}
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-8">
        <ProductFilters
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1);
          }}
          showCategoryFilter={false}
        />

        <div className="flex-1">
          <div className="hidden lg:flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {productsData?.total || 0} products
              {activeChild ? ` in ${activeChild.name}` : ""}
            </p>
            <SortSelect
              value={filters.sort || "newest"}
              onChange={(value) => setFilters({ ...filters, sort: value })}
            />
          </div>

          <ProductGrid
            products={products}
            isLoading={productsLoading}
            emptyMessage={`No products found in ${activeChild?.name || category.name}`}
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
                    if (page > 3) pageNum = page - 2 + i;
                    if (page > totalPages - 3) pageNum = totalPages - 4 + i;
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
