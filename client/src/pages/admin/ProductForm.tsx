import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Upload, Loader2, Video, Image, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category, Brand, ProductWithDetails, ProductVariant, Coupon, InvoiceSettings } from "@shared/schema";
import { Link } from "wouter";
import { Ticket, Tag, Package, Truck, Image as ImageIcon } from "lucide-react";

interface MediaItem {
  id?: string;
  url: string;
  altText?: string;
  mediaType: "image" | "video";
  isPrimary?: boolean;
  position: number;
}

interface VariantItem {
  id?: string;
  optionName: string;
  optionValue: string;
  sku?: string;
  price?: string;
  stock: number;
}

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  shortDesc: z.string().optional(),
  longDesc: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  salePrice: z.string().optional(),
  salePriceStart: z.string().optional(),
  salePriceEnd: z.string().optional(),
  stock: z.number().min(0).default(0),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  expectedDeliveryDays: z.number().min(1).default(5),
  gstRate: z.string().default("18"), // GST rate percentage
  // Product badges/features
  freeShipping: z.boolean().default(true),
  shippingText: z.string().default("Free Shipping"),
  returnDays: z.number().min(0).default(30),
  returnText: z.string().default("Easy Returns"),
  secureCheckout: z.boolean().default(true),
  secureCheckoutText: z.string().default("Secure Checkout"),
  // Product-specific banner
  bannerUrl: z.string().optional(),
  bannerTitle: z.string().optional(),
  bannerSubtitle: z.string().optional(),
  bannerCtaText: z.string().optional(),
  bannerCtaLink: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

const VARIANT_OPTION_TYPES = [
  { value: "size", label: "Size" },
  { value: "weight", label: "Weight" },
  { value: "color", label: "Color" },
  { value: "material", label: "Material" },
  { value: "style", label: "Style" },
];

// Helper to flatten category tree into flat list
interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

function flattenCategories(cats: CategoryWithChildren[]): Category[] {
  const result: Category[] = [];
  function traverse(categories: CategoryWithChildren[]) {
    for (const cat of categories) {
      const { children, ...categoryData } = cat;
      result.push(categoryData);
      if (children && children.length > 0) {
        traverse(children);
      }
    }
  }
  traverse(cats);
  return result;
}

export default function ProductForm() {
  const [, params] = useRoute("/admin/products/:id");
  const isNew = params?.id === "new";
  const productId = isNew ? undefined : params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Category hierarchy state
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");

  const { data: productData } = useQuery<{ product: ProductWithDetails }>({
    queryKey: ["/api/admin/products", productId],
    enabled: !!productId,
  });

  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["/api/categories"],
  });

  const { data: brandsData } = useQuery<{ brands: Brand[] }>({
    queryKey: ["/api/brands"],
  });

  // Fetch invoice settings for GST rates
  const { data: invoiceSettingsData } = useQuery<{ settings: InvoiceSettings }>({
    queryKey: ["/api/settings/invoice"],
  });

  // Get available GST rates from invoice settings
  const gstRates = invoiceSettingsData?.settings?.gstRates || [0, 5, 12, 18, 28];

  // Fetch all coupons for display
  const { data: couponsData } = useQuery<{ coupons: Coupon[] }>({
    queryKey: ["/api/admin/coupons"],
  });

  // Group coupons by type - proper classification
  const activeCoupons = (couponsData?.coupons || []).filter((c) => c.isActive);
  
  // Product-specific: has productId matching current product
  const productSpecificCoupons = productId 
    ? activeCoupons.filter((c) => c.productId === productId)
    : [];
  
  // All-product (store-wide): no productId AND no minQuantity (or minQuantity <= 1)
  const allProductCoupons = activeCoupons.filter(
    (c) => !c.productId && (!c.minQuantity || c.minQuantity <= 1)
  );
  
  // Bulk purchase: no productId AND minQuantity > 1 (store-wide bulk discounts)
  const bulkCoupons = activeCoupons.filter(
    (c) => !c.productId && c.minQuantity && c.minQuantity > 1
  );

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      title: "",
      slug: "",
      brandId: "",
      categoryId: "",
      shortDesc: "",
      longDesc: "",
      price: "",
      salePrice: "",
      salePriceStart: "",
      salePriceEnd: "",
      stock: 0,
      weight: "",
      dimensions: "",
      expectedDeliveryDays: 5,
      gstRate: "18",
      freeShipping: true,
      shippingText: "Free Shipping",
      returnDays: 30,
      returnText: "Easy Returns",
      secureCheckout: true,
      secureCheckoutText: "Secure Checkout",
      bannerUrl: "",
      bannerTitle: "",
      bannerSubtitle: "",
      bannerCtaText: "",
      bannerCtaLink: "",
      isFeatured: false,
      isTrending: false,
      isNewArrival: false,
      isOnSale: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (productData?.product) {
      const p = productData.product;
      form.reset({
        sku: p.sku,
        title: p.title,
        slug: p.slug,
        brandId: p.brandId || "",
        categoryId: p.categoryId || "",
        shortDesc: p.shortDesc || "",
        longDesc: p.longDesc || "",
        price: p.price as string,
        salePrice: p.salePrice as string || "",
        salePriceStart: (p as any).salePriceStart ? new Date((p as any).salePriceStart).toISOString().split("T")[0] : "",
        salePriceEnd: (p as any).salePriceEnd ? new Date((p as any).salePriceEnd).toISOString().split("T")[0] : "",
        stock: p.stock || 0,
        weight: p.weight as string || "",
        dimensions: p.dimensions || "",
        expectedDeliveryDays: (p as any).expectedDeliveryDays || 5,
        gstRate: (p as any).gstRate as string || "18",
        freeShipping: (p as any).freeShipping !== false,
        shippingText: (p as any).shippingText || "Free Shipping",
        returnDays: (p as any).returnDays ?? 30,
        returnText: (p as any).returnText || "Easy Returns",
        secureCheckout: (p as any).secureCheckout !== false,
        secureCheckoutText: (p as any).secureCheckoutText || "Secure Checkout",
        bannerUrl: (p as any).bannerUrl || "",
        bannerTitle: (p as any).bannerTitle || "",
        bannerSubtitle: (p as any).bannerSubtitle || "",
        bannerCtaText: (p as any).bannerCtaText || "",
        bannerCtaLink: (p as any).bannerCtaLink || "",
        isFeatured: p.isFeatured || false,
        isTrending: p.isTrending || false,
        isNewArrival: (p as any).isNewArrival || false,
        isOnSale: (p as any).isOnSale || false,
        isActive: p.isActive !== false,
      });
      // Set media items from existing images
      setMediaItems(
        p.images?.map((img, index) => ({
          id: img.id,
          url: img.url,
          altText: img.altText || "",
          mediaType: ((img as any).mediaType || "image") as "image" | "video",
          isPrimary: img.isPrimary || index === 0,
          position: img.position || index,
        })) || []
      );
      // Set variants
      setVariants(
        p.variants?.map((v) => ({
          id: v.id,
          optionName: v.optionName,
          optionValue: v.optionValue,
          sku: v.sku || "",
          price: v.price as string || "",
          stock: v.stock || 0,
        })) || []
      );
    }
  }, [productData, form]);

  // Set parent categories when editing existing product
  useEffect(() => {
    if (productData?.product?.categoryId && categoriesData?.categories) {
      // Flatten the category tree to find nested categories
      const allCats = flattenCategories(categoriesData.categories as CategoryWithChildren[]);
      const selectedCat = allCats.find(c => c.id === productData.product.categoryId);
      
      if (selectedCat) {
        if (selectedCat.parentId) {
          // This is a sub or child category
          const parentCat = allCats.find(c => c.id === selectedCat.parentId);
          if (parentCat) {
            if (parentCat.parentId) {
              // selectedCat is a child category (level 3)
              setSelectedMainCategory(parentCat.parentId);
              setSelectedSubCategory(parentCat.id);
            } else {
              // selectedCat is a subcategory (level 2)
              setSelectedMainCategory(parentCat.id);
              setSelectedSubCategory(selectedCat.id);
            }
          }
        } else {
          // This is a main category
          setSelectedMainCategory(selectedCat.id);
        }
      }
    }
  }, [productData, categoriesData]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTitleChange = (title: string) => {
    form.setValue("title", title);
    if (!productId) {
      form.setValue("slug", generateSlug(title));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload = { 
        ...data, 
        images: mediaItems.map((m, i) => ({
          url: m.url,
          altText: m.altText,
          mediaType: m.mediaType,
          isPrimary: m.isPrimary || i === 0,
          position: i,
        })),
        variants: variants.map(v => ({
          optionName: v.optionName,
          optionValue: v.optionValue,
          sku: v.sku || undefined,
          price: v.price || undefined,
          stock: v.stock || 0,
        })),
      };
      if (productId) {
        return await apiRequest("PATCH", `/api/admin/products/${productId}`, payload);
      } else {
        return await apiRequest("POST", "/api/admin/products", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({ title: `Product ${productId ? "updated" : "created"} successfully` });
      setLocation("/admin/products");
    },
    onError: () => {
      toast({ title: "Failed to save product", variant: "destructive" });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    saveMutation.mutate(data);
  };

  // Handle file upload to object storage
  const handleFileUpload = async (file: File, mediaType: "image" | "video") => {
    setIsUploading(true);
    try {
      console.log("[Upload] Starting upload for:", file.name, file.type);
      
      // Get presigned URL for upload
      const presignedResponse = await apiRequest("POST", "/api/upload/presigned-url", {
        filename: file.name,
        contentType: file.type,
        folder: "products",
      });
      const { presignedUrl, objectPath } = await presignedResponse.json();
      console.log("[Upload] Got presigned URL:", presignedUrl);
      console.log("[Upload] Object path:", objectPath);

      // Upload file directly to storage
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });
      console.log("[Upload] Upload response status:", uploadResponse.status);

      // Finalize upload to set ACL policy for public access
      const finalizeResponse = await apiRequest("POST", "/api/admin/upload/finalize", {
        uploadURL: presignedUrl,
      });
      const finalizedResult = await finalizeResponse.json();
      console.log("[Upload] Finalized result:", finalizedResult);

      // Add to media items using the finalized object path
      const finalUrl = finalizedResult.objectPath || `/objects/${objectPath}`;
      console.log("[Upload] Final URL for media:", finalUrl);
      
      const newMedia: MediaItem = {
        url: finalUrl,
        altText: file.name.replace(/\.[^/.]+$/, ""),
        mediaType,
        isPrimary: mediaItems.length === 0,
        position: mediaItems.length,
      };
      console.log("[Upload] Adding new media item:", newMedia);
      setMediaItems([...mediaItems, newMedia]);
      toast({ title: `${mediaType === "video" ? "Video" : "Image"} uploaded successfully` });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Add variant
  const addVariant = () => {
    setVariants([
      ...variants,
      {
        optionName: "Size",
        optionValue: "",
        sku: "",
        price: "",
        stock: 0,
      },
    ]);
  };

  // Remove variant
  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Update variant
  const updateVariant = (index: number, field: keyof VariantItem, value: string | number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  // Remove media item
  const removeMediaItem = (index: number) => {
    const updated = mediaItems.filter((_, i) => i !== index);
    // If removed item was primary, set first item as primary
    if (mediaItems[index]?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setMediaItems(updated);
  };

  // Set primary media item
  const setPrimaryMedia = (index: number) => {
    setMediaItems(mediaItems.map((m, i) => ({
      ...m,
      isPrimary: i === index,
    })));
  };

  // Flatten the category tree to get a flat list for filtering
  const categories = categoriesData?.categories 
    ? flattenCategories(categoriesData.categories as CategoryWithChildren[]) 
    : [];
  const brands = brandsData?.brands || [];

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNew ? "Add Product" : "Edit Product"}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? "Create a new product" : "Update product details"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          data-testid="input-product-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-product-sku" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-product-slug" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Category Hierarchy Selection */}
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    {/* Main Category */}
                    <FormItem>
                      <FormLabel>Main Category</FormLabel>
                      <Select
                        value={selectedMainCategory}
                        onValueChange={(value) => {
                          setSelectedMainCategory(value);
                          setSelectedSubCategory("");
                          form.setValue("categoryId", value);
                        }}
                      >
                        <SelectTrigger data-testid="select-main-category">
                          <SelectValue placeholder="Select main category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter((cat) => !cat.parentId)
                            .map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormItem>

                    {/* Subcategory - only show if main category selected */}
                    {selectedMainCategory && categories.some((cat) => cat.parentId === selectedMainCategory) && (
                      <FormItem>
                        <FormLabel>Subcategory</FormLabel>
                        <Select
                          value={selectedSubCategory}
                          onValueChange={(value) => {
                            setSelectedSubCategory(value);
                            form.setValue("categoryId", value);
                          }}
                        >
                          <SelectTrigger data-testid="select-sub-category">
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              .filter((cat) => cat.parentId === selectedMainCategory)
                              .map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}

                    {/* Child Category - only show if subcategory selected and has children */}
                    {selectedSubCategory && categories.some((cat) => cat.parentId === selectedSubCategory) && (
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Child Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-child-category">
                                  <SelectValue placeholder="Select child category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories
                                  .filter((cat) => cat.parentId === selectedSubCategory)
                                  .map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* Brand Selection */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-product-brand">
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="shortDesc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="input-product-short-desc" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longDesc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Long Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={5} data-testid="input-product-long-desc" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing & Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-product-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-product-sale-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gstRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Rate (%)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gst-rate">
                              <SelectValue placeholder="Select GST Rate" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gstRates.map((rate) => (
                              <SelectItem key={rate} value={String(rate)} data-testid={`option-gst-rate-${rate}`}>
                                {rate}%
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>GST rate applicable to this product</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-product-stock"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dimensions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimensions</FormLabel>
                        <FormControl>
                          <Input placeholder="10 x 20 x 5 cm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expectedDeliveryDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Delivery (Days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                            data-testid="input-expected-delivery"
                          />
                        </FormControl>
                        <FormDescription>Days until delivery after order</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media (Images & Videos)</CardTitle>
                <CardDescription>
                  Upload product images and videos. First item will be the primary display image. Click on an item to set it as primary.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {mediaItems.map((media, index) => (
                    <div 
                      key={index} 
                      className={`relative aspect-square group cursor-pointer ${media.isPrimary ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      onClick={() => setPrimaryMedia(index)}
                    >
                      {media.mediaType === "video" ? (
                        <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                          <Video className="h-12 w-12 text-muted-foreground" />
                          <video
                            src={media.url}
                            className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            muted
                          />
                        </div>
                      ) : (
                        <img
                          src={media.url}
                          alt={media.altText || `Product ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      )}
                      {media.isPrimary && (
                        <Badge className="absolute bottom-2 left-2 text-xs">Primary</Badge>
                      )}
                      <Badge variant="outline" className="absolute top-2 left-2 text-xs bg-background">
                        {media.mediaType === "video" ? <Video className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                      </Badge>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMediaItem(index);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {/* Upload Image Button */}
                  <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors p-2">
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                    ) : (
                      <>
                        <Image className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground text-center">Add Image</span>
                        <span className="text-xs text-muted-foreground/70 text-center mt-1">800x800px or larger</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0], "image");
                        }
                      }}
                      data-testid="input-upload-image"
                    />
                  </label>
                  
                  {/* Upload Video Button */}
                  <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors p-2">
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                    ) : (
                      <>
                        <Video className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground text-center">Add Video</span>
                        <span className="text-xs text-muted-foreground/70 text-center mt-1">1080p, max 50MB</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="video/*"
                      disabled={isUploading}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0], "video");
                        }
                      }}
                      data-testid="input-upload-video"
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Product Variants</CardTitle>
                  <CardDescription>
                    Add size, weight, color, or other options for this product
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addVariant} data-testid="button-add-variant">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variant
                </Button>
              </CardHeader>
              <CardContent>
                {variants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No variants added. Click "Add Variant" to create size, weight, or other options.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                        <div className="flex-1 grid sm:grid-cols-5 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Option Type</label>
                            <Select
                              value={variant.optionName}
                              onValueChange={(value) => updateVariant(index, "optionName", value)}
                            >
                              <SelectTrigger data-testid={`select-variant-type-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {VARIANT_OPTION_TYPES.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Value</label>
                            <Input
                              placeholder={variant.optionName === "weight" ? "e.g., 500g" : "e.g., Large"}
                              value={variant.optionValue}
                              onChange={(e) => updateVariant(index, "optionValue", e.target.value)}
                              data-testid={`input-variant-value-${index}`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">SKU (Optional)</label>
                            <Input
                              placeholder="SKU-001-L"
                              value={variant.sku}
                              onChange={(e) => updateVariant(index, "sku", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Price Override</label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Leave empty for default"
                              value={variant.price}
                              onChange={(e) => updateVariant(index, "price", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Stock</label>
                            <Input
                              type="number"
                              value={variant.stock}
                              onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-6 text-destructive hover:text-destructive"
                          onClick={() => removeVariant(index)}
                          data-testid={`button-remove-variant-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status & Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Product will be visible on the store
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Featured</FormLabel>
                        <FormDescription>
                          Show in featured products section
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isTrending"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Trending</FormLabel>
                        <FormDescription>
                          Mark as trending product
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isNewArrival"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">New Arrival</FormLabel>
                        <FormDescription>
                          Mark as a new arrival product
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-new-arrival" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isOnSale"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">On Sale</FormLabel>
                        <FormDescription>
                          Product is on sale with special pricing
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-on-sale" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {form.watch("isOnSale") && (
                  <div className="grid sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                    <FormField
                      control={form.control}
                      name="salePriceStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-sale-start" />
                          </FormControl>
                          <FormDescription>When the sale begins</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="salePriceEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-sale-end" />
                          </FormControl>
                          <FormDescription>When the sale ends</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping, Returns & Checkout Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping, Returns & Checkout
                </CardTitle>
                <CardDescription>
                  Configure product-specific shipping, return policy, and checkout information badges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Free Shipping */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name="freeShipping"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel className="text-base">Free Shipping</FormLabel>
                          <FormDescription>Show free shipping badge on product page</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-free-shipping" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {form.watch("freeShipping") && (
                    <FormField
                      control={form.control}
                      name="shippingText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shipping Badge Text</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Free Shipping" data-testid="input-shipping-text" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Returns */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-base font-medium">Return Policy</label>
                      <p className="text-sm text-muted-foreground">Configure return days and display text</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="returnDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Return Days</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-return-days"
                            />
                          </FormControl>
                          <FormDescription>Set to 0 for no returns</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="returnText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Return Badge Text</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Easy Returns" data-testid="input-return-text" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Secure Checkout */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name="secureCheckout"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel className="text-base">Secure Checkout</FormLabel>
                          <FormDescription>Show secure checkout badge on product page</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-secure-checkout" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {form.watch("secureCheckout") && (
                    <FormField
                      control={form.control}
                      name="secureCheckoutText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secure Checkout Badge Text</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Secure Checkout" data-testid="input-secure-checkout-text" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Banner Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Product Banner
                </CardTitle>
                <CardDescription>
                  Add a promotional banner that will appear on this product's page (below coupons section)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Banner Upload */}
                <div className="space-y-3">
                  <FormLabel>Banner Image</FormLabel>
                  {form.watch("bannerUrl") ? (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img
                        src={form.watch("bannerUrl")}
                        alt="Banner preview"
                        className="w-full max-h-48 object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => form.setValue("bannerUrl", "")}
                        data-testid="button-remove-banner"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => document.getElementById("banner-upload")?.click()}
                    >
                      <input
                        id="banner-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const presignedRes = await apiRequest("POST", "/api/upload/presigned-url", {
                                filename: file.name,
                                contentType: file.type,
                              });
                              const presignedData = await presignedRes.json();
                              const { uploadId, uploadUrl } = presignedData;
                              await fetch(uploadUrl, {
                                method: "PUT",
                                body: file,
                                headers: { "Content-Type": file.type },
                              });
                              const finalizeRes = await apiRequest("POST", "/api/upload/finalize", { uploadId });
                              const finalizeData = await finalizeRes.json();
                              form.setValue("bannerUrl", finalizeData.url);
                              toast({ title: "Banner uploaded successfully" });
                            } catch (error) {
                              toast({ title: "Failed to upload banner", variant: "destructive" });
                            }
                          }
                          e.target.value = "";
                        }}
                        data-testid="input-banner-file"
                      />
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload banner image</p>
                      <p className="text-xs text-muted-foreground mt-1">Recommended: 1200x400px or similar wide aspect ratio</p>
                    </div>
                  )}
                </div>

                {form.watch("bannerUrl") && (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bannerTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Banner Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Special Offer!" data-testid="input-banner-title" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bannerSubtitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Banner Subtitle</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Limited time only" data-testid="input-banner-subtitle" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bannerCtaText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Button Text</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Shop Now" data-testid="input-banner-cta-text" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bannerCtaLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Button Link</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="/shop or https://..." data-testid="input-banner-cta-link" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Applicable Coupons Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Applicable Coupons
                </CardTitle>
                <CardDescription>
                  Coupons that can be applied to this product. Only one coupon can be used per order.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product-Specific Coupons */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4 text-primary" />
                    Product-Specific Coupons
                  </div>
                  {productSpecificCoupons.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {productSpecificCoupons.map((coupon) => (
                        <Badge key={coupon.id} variant="secondary" className="px-3 py-1.5">
                          <span className="font-mono font-semibold mr-2">{coupon.code}</span>
                          <span className="text-muted-foreground">
                            {coupon.type === "percentage" ? `${coupon.amount}% off` : `₹${coupon.amount} off`}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {isNew 
                        ? "Save the product first to add product-specific coupons" 
                        : "No product-specific coupons available"}
                    </p>
                  )}
                </div>

                {/* All-Product Coupons */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Ticket className="h-4 w-4 text-green-600" />
                    All-Product Coupons (General)
                  </div>
                  {allProductCoupons.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allProductCoupons.map((coupon) => (
                        <Badge key={coupon.id} variant="outline" className="px-3 py-1.5">
                          <span className="font-mono font-semibold mr-2">{coupon.code}</span>
                          <span className="text-muted-foreground">
                            {coupon.type === "percentage" ? `${coupon.amount}% off` : `₹${coupon.amount} off`}
                            {coupon.minCartTotal && ` (min ₹${coupon.minCartTotal})`}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No general coupons available</p>
                  )}
                </div>

                {/* Bulk/Volume Coupons */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Package className="h-4 w-4 text-orange-600" />
                    Bulk Purchase Coupons (Volume Discounts)
                  </div>
                  {bulkCoupons.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {bulkCoupons.map((coupon) => (
                        <Badge key={coupon.id} variant="outline" className="px-3 py-1.5 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                          <span className="font-mono font-semibold mr-2">{coupon.code}</span>
                          <span className="text-muted-foreground">
                            {coupon.type === "percentage" ? `${coupon.amount}% off` : `₹${coupon.amount} off`}
                            {` (min ${coupon.minQuantity} items)`}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No bulk purchase coupons available</p>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                  <strong>Note:</strong> Customers can only use one coupon per order. Manage coupons in the{" "}
                  <Link href="/admin/coupons" className="text-primary underline">
                    Coupons section
                  </Link>
                  .
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/products">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-product">
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isNew ? "Create Product" : "Update Product"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
