import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  ShoppingCart, 
  Minus, 
  Plus,
  Star,
  Truck,
  RotateCcw,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ProductGrid } from "@/components/store/ProductGrid";
import { ReviewSection } from "@/components/store/ReviewSection";
import { ShareButtons } from "@/components/store/ShareButtons";
import { SEOHead } from "@/components/SEOHead";
import type { ProductWithDetails } from "@shared/schema";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug;
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  
  const { addToCart, isInWishlist, toggleWishlist } = useStore();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ product: ProductWithDetails }>({
    queryKey: [`/api/products/${slug}`],
    enabled: !!slug,
  });

  const relatedQueryParams = new URLSearchParams();
  if (data?.product?.categoryId) {
    relatedQueryParams.set("categoryId", data.product.categoryId);
    relatedQueryParams.set("limit", "4");
    if (data.product.id) relatedQueryParams.set("exclude", data.product.id);
  }

  const { data: relatedData } = useQuery<{ products: ProductWithDetails[] }>({
    queryKey: ["/api/products", relatedQueryParams.toString()],
    enabled: !!data?.product?.categoryId,
  });

  const product = data?.product;
  const relatedProducts = relatedData?.products || [];
  const images = product?.images || [];
  const variants = product?.variants || [];
  
  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const currentPrice = selectedVariant?.price || product?.salePrice || product?.price;
  const originalPrice = product?.price;
  const hasDiscount = product?.salePrice && parseFloat(product.salePrice as string) < parseFloat(product.price as string);

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      await addToCart(product.id, quantity, selectedVariantId);
      toast({
        title: "Added to cart",
        description: `${product.title} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }

    try {
      await toggleWishlist(product.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wishlist.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-20 h-20" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const primaryImage = images[selectedImageIndex]?.url || images[0]?.url || "/placeholder-product.jpg";

  return (
    <div className="container mx-auto px-4 py-8">
      <SEOHead
        title={product.metaTitle || product.title}
        description={product.metaDescription || product.shortDesc || product.description || ""}
        image={primaryImage}
        type="product"
        price={currentPrice?.toString()}
        currency="USD"
        availability={product.stock === 0 ? "out of stock" : "in stock"}
        brand={product.brand?.name}
      />
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {product.category && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/category/${product.category.slug}`}>
                  {product.category.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{product.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={primaryImage}
              alt={product.title}
              className="w-full h-full object-cover"
              data-testid="img-product-main"
            />
            {hasDiscount && (
              <Badge variant="destructive" className="absolute top-4 left-4">
                Sale
              </Badge>
            )}
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80"
                  onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80"
                  onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                    index === selectedImageIndex ? "border-primary" : "border-transparent"
                  }`}
                  data-testid={`button-thumbnail-${index}`}
                >
                  <img
                    src={image.url}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {product.brand && (
            <Link 
              href={`/brand/${product.brand.slug}`}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {product.brand.name}
            </Link>
          )}
          
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-product-title">
            {product.title}
          </h1>

          {product.averageRating && parseFloat(product.averageRating as string) > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(parseFloat(product.averageRating as string))
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {parseFloat(product.averageRating as string).toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold" data-testid="text-product-price">
              ${parseFloat(currentPrice as string).toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xl text-muted-foreground line-through">
                ${parseFloat(originalPrice as string).toFixed(2)}
              </span>
            )}
          </div>

          {product.shortDesc && (
            <p className="text-muted-foreground">{product.shortDesc}</p>
          )}

          <Separator />

          {variants.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Select {variants[0]?.optionName || "Option"}
              </label>
              <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                <SelectTrigger data-testid="select-variant">
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.optionValue}
                      {variant.price && ` - $${parseFloat(variant.price).toFixed(2)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium">Quantity</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  data-testid="button-qty-decrease"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center" data-testid="text-quantity">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={product.stock !== null && quantity >= product.stock}
                  data-testid="button-qty-increase"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {product.stock !== null && (
                <span className="text-sm text-muted-foreground">
                  {product.stock} available
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              size="lg" 
              className="flex-1"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              data-testid="button-add-to-cart"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleToggleWishlist}
              data-testid="button-wishlist"
            >
              <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? "fill-destructive text-destructive" : ""}`} />
            </Button>
            <ShareButtons
              title={product.title}
              description={product.shortDesc || product.description || ""}
              imageUrl={primaryImage}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="flex flex-col items-center text-center p-3 bg-muted/50 rounded-lg">
              <Truck className="h-5 w-5 mb-2 text-primary" />
              <span className="text-xs">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-muted/50 rounded-lg">
              <RotateCcw className="h-5 w-5 mb-2 text-primary" />
              <span className="text-xs">30-Day Returns</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 mb-2 text-primary" />
              <span className="text-xs">Secure Checkout</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>SKU: {product.sku}</p>
            {product.category && <p>Category: {product.category.name}</p>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="description" className="mt-12">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({product.reviewCount || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="mt-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {product.longDesc ? (
              <div dangerouslySetInnerHTML={{ __html: product.longDesc }} />
            ) : (
              <p className="text-muted-foreground">No description available.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="details" className="mt-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {product.weight && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Weight</span>
                <span>{product.weight} kg</span>
              </div>
            )}
            {product.dimensions && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Dimensions</span>
                <span>{product.dimensions}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">SKU</span>
              <span>{product.sku}</span>
            </div>
            {product.brand && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Brand</span>
                <span>{product.brand.name}</span>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="reviews" className="mt-6">
          <ReviewSection
            productId={product.id}
            averageRating={product.averageRating as string | null}
            reviewCount={product.reviewCount || 0}
          />
        </TabsContent>
      </Tabs>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
