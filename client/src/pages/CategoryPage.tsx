import { useState, useEffect, useMemo } from "react";
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

// ─── Static clothing filter options ──────────────────────────────────
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const CLOTHING_MATERIALS = ["Cotton", "Polyester", "Linen", "Denim", "Fleece", "Wool", "Silk"];

// ─── Filter pill component ─────────────────────────────────────────
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer transition-all duration-200 whitespace-nowrap"
      style={{ background: "none", border: "none", padding: 0 }}
    >
      <span
        className="inline-block px-4 py-2 text-sm font-medium border rounded-full"
        style={{
          backgroundColor: active ? "#012d1d" : "transparent",
          color: active ? "#fff" : "#012d1d",
          borderColor: active ? "#012d1d" : "#c1c8c2",
          transition: "all 0.2s",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Filter row ────────────────────────────────────────────────────
function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b" style={{ borderColor: "#e8e8e5" }}>
      <span
        className="shrink-0 pt-1.5 font-inter text-xs uppercase tracking-widest font-semibold w-24"
        style={{ color: "#717973" }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

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
  const [activeSizes, setActiveSizes] = useState<string[]>([]);
  const [activeMaterials, setActiveMaterials] = useState<string[]>([]);
  const limit = 48; // fetch more since we also filter client-side

  // Sync active child when URL changes
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setActiveChildSlug(p.get("category"));
    setPage(1);
  }, [location]);

  const { data: categoryData, isLoading: categoryLoading } = useQuery<{
    category: Category & { parent?: Category; children?: Category[] };
  }>({
    queryKey: ["/api/categories/" + slug],
    enabled: !!slug,
  });

  // Fetch active child category to get its ID
  const { data: childCategoryData } = useQuery<{
    category: Category & { parent?: Category };
  }>({
    queryKey: ["/api/categories/" + activeChildSlug],
    enabled: !!activeChildSlug,
  });

  const category = categoryData?.category;
  const hasChildren = !!(category?.children && category.children.length > 0);

  // Use child category ID when one is selected, otherwise parent
  const effectiveCategoryId = activeChildSlug
    ? childCategoryData?.category?.id
    : category?.id;

  const productsQueryParams = new URLSearchParams();
  if (effectiveCategoryId) productsQueryParams.set("categoryId", effectiveCategoryId);
  if (filters.minPrice) productsQueryParams.set("minPrice", filters.minPrice.toString());
  if (filters.maxPrice) productsQueryParams.set("maxPrice", filters.maxPrice.toString());
  if (filters.brandIds && filters.brandIds.length > 0)
    productsQueryParams.set("brandIds", filters.brandIds.join(","));
  if (filters.inStock) productsQueryParams.set("inStock", "true");
  if (filters.onSale) productsQueryParams.set("onSale", "true");
  if (filters.sort === "price_asc") { productsQueryParams.set("sortBy", "price"); productsQueryParams.set("sortOrder", "asc"); }
  else if (filters.sort === "price_desc") { productsQueryParams.set("sortBy", "price"); productsQueryParams.set("sortOrder", "desc"); }
  else if (filters.sort === "popular") productsQueryParams.set("sortBy", "popular");
  else if (filters.sort === "rating") productsQueryParams.set("sortBy", "rating");
  productsQueryParams.set("limit", String(limit));
  productsQueryParams.set("offset", String((page - 1) * limit));

  const { data: productsData, isLoading: productsLoading } = useQuery<{
    products: ProductWithDetails[];
    total: number;
  }>({
    queryKey: ["/api/products?" + productsQueryParams.toString()],
    enabled: !!effectiveCategoryId,
  });

  // Client-side filter by size & material from variant optionValues
  const allProducts = productsData?.products || [];
  const displayProducts = useMemo(() => {
    let result = allProducts;
    if (activeSizes.length > 0) {
      result = result.filter((p: any) =>
        (p.variants || []).some((v: any) =>
          v.optionName?.toLowerCase() === "size" &&
          activeSizes.includes(v.optionValue)
        )
      );
    }
    if (activeMaterials.length > 0) {
      result = result.filter((p: any) =>
        activeMaterials.some((m) =>
          p.longDesc?.toLowerCase().includes(m.toLowerCase()) ||
          p.shortDesc?.toLowerCase().includes(m.toLowerCase()) ||
          (p.variants || []).some((v: any) =>
            v.optionName?.toLowerCase() === "material" &&
            v.optionValue?.toLowerCase() === m.toLowerCase()
          )
        )
      );
    }
    return result;
  }, [allProducts, activeSizes, activeMaterials]);

  const totalPages = Math.max(1, Math.ceil((productsData?.total || 0) / 12));

  // Child category pill toggle
  const handleChildClick = (childSlug: string) => {
    const next = activeChildSlug === childSlug ? null : childSlug;
    setActiveChildSlug(next);
    setPage(1);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("category", next);
    else url.searchParams.delete("category");
    window.history.replaceState(null, "", url.toString());
  };

  const toggleSize = (s: string) =>
    setActiveSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggleMaterial = (m: string) =>
    setActiveMaterials((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);

  const activeChild = activeChildSlug
    ? category?.children?.find((c) => c.slug === activeChildSlug)
    : null;

  // ── Loading skeleton ─────────────────────────────────────────────
  if (categoryLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-6 w-64 mb-6" />
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <p className="text-muted-foreground mb-8">The category you're looking for doesn't exist.</p>
        <Button asChild><Link href="/">Back to Home</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEOHead
        title={activeChild ? `${activeChild.name} — ${category.name}` : (category.metaTitle || category.name)}
        description={category.metaDescription || category.description || `Shop ${category.name} products`}
      />

      {/* ── Hero banner ─────────────────────────────────────────── */}
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

      {/* ── Breadcrumb ──────────────────────────────────────────── */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          {category.parent && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/category/${category.parent.slug}`}>{category.parent.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          {activeChild ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/category/${category.slug}`}>{category.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{activeChild.name}</BreadcrumbPage></BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem><BreadcrumbPage>{category.name}</BreadcrumbPage></BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Page title (no banner) ───────────────────────────────── */}
      {!category.bannerUrl && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">{activeChild ? activeChild.name : category.name}</h1>
          {category.description && !activeChild && (
            <p className="text-muted-foreground">{category.description}</p>
          )}
        </div>
      )}

      {/* ── Three filter rows (only for categories with children) ── */}
      {hasChildren && (
        <div className="mb-8 border-t" style={{ borderColor: "#e8e8e5" }}>

          {/* Filter 1 — Child categories */}
          <FilterRow label="Category">
            <FilterPill
              label="All"
              active={!activeChildSlug}
              onClick={() => handleChildClick(activeChildSlug || "")}
            />
            {category.children!.map((child) => (
              <FilterPill
                key={child.id}
                label={child.name}
                active={activeChildSlug === child.slug}
                onClick={() => handleChildClick(child.slug)}
              />
            ))}
          </FilterRow>

          {/* Filter 2 — Size */}
          <FilterRow label="Size">
            {CLOTHING_SIZES.map((s) => (
              <FilterPill
                key={s}
                label={s}
                active={activeSizes.includes(s)}
                onClick={() => toggleSize(s)}
              />
            ))}
            {activeSizes.length > 0 && (
              <button
                onClick={() => setActiveSizes([])}
                className="text-xs underline self-center cursor-pointer"
                style={{ background: "none", border: "none", color: "#717973" }}
              >
                Clear
              </button>
            )}
          </FilterRow>

          {/* Filter 3 — Material */}
          <FilterRow label="Material">
            {CLOTHING_MATERIALS.map((m) => (
              <FilterPill
                key={m}
                label={m}
                active={activeMaterials.includes(m)}
                onClick={() => toggleMaterial(m)}
              />
            ))}
            {activeMaterials.length > 0 && (
              <button
                onClick={() => setActiveMaterials([])}
                className="text-xs underline self-center cursor-pointer"
                style={{ background: "none", border: "none", color: "#717973" }}
              >
                Clear
              </button>
            )}
          </FilterRow>
        </div>
      )}

      {/* ── No-children fallback: subcategory links ──────────────── */}
      {!hasChildren && category.children && category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Subcategories</h2>
          <div className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link key={child.id} href={`/category/${child.slug}`}>
                <Button variant="outline" size="sm">{child.name}</Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Products area ─────────────────────────────────────────── */}
      <div className={hasChildren ? "w-full" : "flex gap-8"}>
        {/* Sidebar filters only for non-children pages */}
        {!hasChildren && (
          <ProductFilters
            filters={filters}
            onFiltersChange={(f) => { setFilters(f); setPage(1); }}
            showCategoryFilter={false}
          />
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {displayProducts.length} product{displayProducts.length !== 1 ? "s" : ""}
              {activeChild ? ` in ${activeChild.name}` : ""}
            </p>
            <SortSelect
              value={filters.sort || "newest"}
              onChange={(value) => setFilters({ ...filters, sort: value })}
            />
          </div>

          <ProductGrid
            products={displayProducts}
            isLoading={productsLoading}
            emptyMessage={`No products found in ${activeChild?.name || category.name}`}
          />

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
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
                    <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} size="icon" onClick={() => setPage(pageNum)}>
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button variant="outline" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
