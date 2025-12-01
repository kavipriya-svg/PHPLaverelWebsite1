import { useState } from "react";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import type { Category, Brand } from "@shared/schema";

export interface ProductFiltersState {
  categoryId?: string;
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  inStock?: boolean;
  onSale?: boolean;
}

interface ProductFiltersProps {
  filters: ProductFiltersState;
  onFiltersChange: (filters: ProductFiltersState) => void;
  showCategoryFilter?: boolean;
}

export function ProductFilters({ 
  filters, 
  onFiltersChange,
  showCategoryFilter = true 
}: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || 0,
    filters.maxPrice || 1000,
  ]);

  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["/api/categories", { level: 1 }],
  });

  const { data: brandsData } = useQuery<{ brands: Brand[] }>({
    queryKey: ["/api/brands"],
  });

  const categories = categoriesData?.categories || [];
  const brands = brandsData?.brands || [];

  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sort: value });
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  const handlePriceCommit = () => {
    onFiltersChange({
      ...filters,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    });
  };

  const handleBrandToggle = (brandId: string) => {
    const currentBrands = filters.brandIds || [];
    const newBrands = currentBrands.includes(brandId)
      ? currentBrands.filter((id) => id !== brandId)
      : [...currentBrands, brandId];
    onFiltersChange({ ...filters, brandIds: newBrands.length > 0 ? newBrands : undefined });
  };

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({ 
      ...filters, 
      categoryId: categoryId === "all" ? undefined : categoryId 
    });
  };

  const handleClearFilters = () => {
    setPriceRange([0, 1000]);
    onFiltersChange({
      sort: filters.sort,
    });
  };

  const activeFilterCount = [
    filters.categoryId,
    filters.brandIds?.length,
    filters.minPrice || filters.maxPrice,
    filters.inStock,
    filters.onSale,
  ].filter(Boolean).length;

  const FilterContent = () => (
    <div className="space-y-6">
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied
          </span>
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {showCategoryFilter && categories.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
            Category
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Select value={filters.categoryId || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
          Price Range
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <Slider
            value={priceRange}
            onValueChange={handlePriceChange}
            onValueCommit={handlePriceCommit}
            max={1000}
            step={10}
            className="w-full"
            data-testid="slider-price"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setPriceRange([val, priceRange[1]]);
              }}
              onBlur={handlePriceCommit}
              className="w-24"
              data-testid="input-min-price"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1000;
                setPriceRange([priceRange[0], val]);
              }}
              onBlur={handlePriceCommit}
              className="w-24"
              data-testid="input-max-price"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {brands.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
            Brand
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {brands.map((brand) => (
              <div key={brand.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand.id}`}
                  checked={filters.brandIds?.includes(brand.id)}
                  onCheckedChange={() => handleBrandToggle(brand.id)}
                  data-testid={`checkbox-brand-${brand.id}`}
                />
                <Label
                  htmlFor={`brand-${brand.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {brand.name}
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
          Availability
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="in-stock"
              checked={filters.inStock}
              onCheckedChange={(checked) =>
                onFiltersChange({ ...filters, inStock: checked ? true : undefined })
              }
              data-testid="checkbox-in-stock"
            />
            <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer">
              In Stock
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="on-sale"
              checked={filters.onSale}
              onCheckedChange={(checked) =>
                onFiltersChange({ ...filters, onSale: checked ? true : undefined })
              }
              data-testid="checkbox-on-sale"
            />
            <Label htmlFor="on-sale" className="text-sm font-normal cursor-pointer">
              On Sale
            </Label>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24">
          <h2 className="font-semibold mb-4">Filters</h2>
          <FilterContent />
        </div>
      </div>

      <div className="lg:hidden flex items-center gap-2 mb-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex-1" data-testid="button-mobile-filters">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>

        <Select value={filters.sort || "newest"} onValueChange={handleSortChange}>
          <SelectTrigger className="flex-1" data-testid="select-sort-mobile">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export function SortSelect({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]" data-testid="select-sort">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="price_asc">Price: Low to High</SelectItem>
        <SelectItem value="price_desc">Price: High to Low</SelectItem>
        <SelectItem value="popular">Most Popular</SelectItem>
        <SelectItem value="rating">Top Rated</SelectItem>
      </SelectContent>
    </Select>
  );
}
