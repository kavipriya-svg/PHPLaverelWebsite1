import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, FileText, Tag, Globe, ExternalLink, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductWithDetails, Category } from "@shared/schema";

interface SEOFormData {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  slug?: string;
}

export default function SEOSettings() {
  const [activeTab, setActiveTab] = useState("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const { data: productsData, isLoading: productsLoading } = useQuery<{
    products: ProductWithDetails[];
    total: number;
  }>({
    queryKey: ["/api/admin/products", { search: searchQuery, limit: 50 }],
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<{
    categories: Category[];
  }>({
    queryKey: ["/api/categories"],
  });

  const updateProductSEO = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SEOFormData }) => {
      const res = await apiRequest("PATCH", `/api/admin/products/${id}/seo`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "SEO Updated",
        description: "Product SEO settings have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update SEO settings.",
        variant: "destructive",
      });
    },
  });

  const updateCategorySEO = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SEOFormData }) => {
      const res = await apiRequest("PATCH", `/api/admin/categories/${id}/seo`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "SEO Updated",
        description: "Category SEO settings have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update SEO settings.",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = productsData?.products || [];
  const filteredCategories = (categoriesData?.categories || []).filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SEO Settings</h1>
          <p className="text-muted-foreground">
            Manage meta tags, URLs, and structured data for better search visibility
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Sitemap</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Auto-generated XML sitemap with all products and categories
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" data-testid="link-sitemap">
                  View Sitemap <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Robots.txt</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Crawler instructions for search engine bots
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/robots.txt" target="_blank" rel="noopener noreferrer" data-testid="link-robots">
                  View Robots.txt <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Structured Data</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                JSON-LD schema markup for rich search results
              </p>
              <Badge variant="secondary">Auto-generated</Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Meta Tag Editor</CardTitle>
            <CardDescription>
              Edit SEO meta tags for products and categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
                <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
              </TabsList>

              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <TabsContent value="products" className="mt-0">
                  <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                    {productsLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-12" />
                        ))}
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <p className="p-4 text-center text-muted-foreground">No products found</p>
                    ) : (
                      filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          className={`w-full p-3 text-left hover-elevate flex items-center justify-between ${
                            selectedProduct?.id === product.id ? "bg-accent" : ""
                          }`}
                          onClick={() => setSelectedProduct(product)}
                          data-testid={`button-select-product-${product.id}`}
                        >
                          <div>
                            <p className="font-medium text-sm">{product.title}</p>
                            <p className="text-xs text-muted-foreground">/product/{product.slug}</p>
                          </div>
                          {selectedProduct?.id === product.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="categories" className="mt-0">
                  <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                    {categoriesLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-12" />
                        ))}
                      </div>
                    ) : filteredCategories.length === 0 ? (
                      <p className="p-4 text-center text-muted-foreground">No categories found</p>
                    ) : (
                      filteredCategories.map((category) => (
                        <button
                          key={category.id}
                          className={`w-full p-3 text-left hover-elevate flex items-center justify-between ${
                            selectedCategory?.id === category.id ? "bg-accent" : ""
                          }`}
                          onClick={() => setSelectedCategory(category)}
                          data-testid={`button-select-category-${category.id}`}
                        >
                          <div>
                            <p className="font-medium text-sm">{category.name}</p>
                            <p className="text-xs text-muted-foreground">/category/{category.slug}</p>
                          </div>
                          {selectedCategory?.id === category.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </TabsContent>

                <div className="space-y-4">
                  {activeTab === "products" && selectedProduct ? (
                    <ProductSEOForm
                      product={selectedProduct}
                      onSave={(data) => updateProductSEO.mutate({ id: selectedProduct.id, data })}
                      isPending={updateProductSEO.isPending}
                    />
                  ) : activeTab === "categories" && selectedCategory ? (
                    <CategorySEOForm
                      category={selectedCategory}
                      onSave={(data) => updateCategorySEO.mutate({ id: selectedCategory.id, data })}
                      isPending={updateCategorySEO.isPending}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground border rounded-lg">
                      <FileText className="h-12 w-12 mb-4 opacity-20" />
                      <p>Select a {activeTab === "products" ? "product" : "category"} to edit its SEO settings</p>
                    </div>
                  )}
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO Best Practices</CardTitle>
            <CardDescription>Guidelines for optimizing your content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">Meta Title</h4>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Keep under 60 characters</li>
                  <li>Include primary keyword</li>
                  <li>Make it unique and compelling</li>
                  <li>Add brand name at the end</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Meta Description</h4>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Keep under 160 characters</li>
                  <li>Include call-to-action</li>
                  <li>Summarize page content</li>
                  <li>Make it unique per page</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">URL Slug</h4>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Use lowercase letters only</li>
                  <li>Separate words with hyphens</li>
                  <li>Keep it short and descriptive</li>
                  <li>Include relevant keywords</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function ProductSEOForm({
  product,
  onSave,
  isPending,
}: {
  product: ProductWithDetails;
  onSave: (data: SEOFormData) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState<SEOFormData>({
    metaTitle: (product as any).metaTitle || "",
    metaDescription: (product as any).metaDescription || "",
    metaKeywords: (product as any).metaKeywords || "",
    slug: product.slug || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const metaTitleLength = formData.metaTitle?.length || 0;
  const metaDescLength = formData.metaDescription?.length || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Meta Title</label>
        <Input
          value={formData.metaTitle}
          onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
          placeholder={product.title}
          data-testid="input-meta-title"
        />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Leave empty to use product title</span>
          <span className={metaTitleLength > 60 ? "text-destructive" : "text-muted-foreground"}>
            {metaTitleLength}/60
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Meta Description</label>
        <Textarea
          value={formData.metaDescription}
          onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
          placeholder={product.shortDesc || "Enter a description for search results..."}
          rows={3}
          data-testid="input-meta-description"
        />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Leave empty to use short description</span>
          <span className={metaDescLength > 160 ? "text-destructive" : "text-muted-foreground"}>
            {metaDescLength}/160
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Meta Keywords</label>
        <Input
          value={formData.metaKeywords}
          onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
          placeholder="keyword1, keyword2, keyword3"
          data-testid="input-meta-keywords"
        />
        <span className="text-xs text-muted-foreground">
          Comma-separated keywords (optional)
        </span>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">URL Slug</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/product/</span>
          <Input
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
            placeholder={product.slug}
            data-testid="input-slug"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} data-testid="button-save-seo">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save SEO Settings
      </Button>
    </form>
  );
}

function CategorySEOForm({
  category,
  onSave,
  isPending,
}: {
  category: Category;
  onSave: (data: SEOFormData) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState<SEOFormData>({
    metaTitle: (category as any).metaTitle || "",
    metaDescription: (category as any).metaDescription || "",
    metaKeywords: (category as any).metaKeywords || "",
    slug: category.slug || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const metaTitleLength = formData.metaTitle?.length || 0;
  const metaDescLength = formData.metaDescription?.length || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Meta Title</label>
        <Input
          value={formData.metaTitle}
          onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
          placeholder={category.name}
          data-testid="input-meta-title"
        />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Leave empty to use category name</span>
          <span className={metaTitleLength > 60 ? "text-destructive" : "text-muted-foreground"}>
            {metaTitleLength}/60
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Meta Description</label>
        <Textarea
          value={formData.metaDescription}
          onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
          placeholder={category.description || "Enter a description for search results..."}
          rows={3}
          data-testid="input-meta-description"
        />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Leave empty to use category description</span>
          <span className={metaDescLength > 160 ? "text-destructive" : "text-muted-foreground"}>
            {metaDescLength}/160
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Meta Keywords</label>
        <Input
          value={formData.metaKeywords}
          onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
          placeholder="keyword1, keyword2, keyword3"
          data-testid="input-meta-keywords"
        />
        <span className="text-xs text-muted-foreground">
          Comma-separated keywords (optional)
        </span>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">URL Slug</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/category/</span>
          <Input
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
            placeholder={category.slug}
            data-testid="input-slug"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} data-testid="button-save-seo">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save SEO Settings
      </Button>
    </form>
  );
}
