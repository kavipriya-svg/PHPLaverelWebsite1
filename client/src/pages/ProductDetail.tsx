import { useState, useEffect } from "react";
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
  Play,
  Ticket,
  Calendar,
  Copy,
  Check,
  Timer,
  Sparkles,
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
import { Card } from "@/components/ui/card";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ProductGrid } from "@/components/store/ProductGrid";
import { ReviewSection } from "@/components/store/ReviewSection";
import { ShareButtons } from "@/components/store/ShareButtons";
import { SEOHead } from "@/components/SEOHead";
import type { ProductWithDetails, Coupon } from "@shared/schema";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug;
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [saleCountdown, setSaleCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  
  const { addToCart, isInWishlist, toggleWishlist } = useStore();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ product: ProductWithDetails }>({
    queryKey: [`/api/products/${slug}`],
    enabled: !!slug,
  });

  const product = data?.product;

  const { data: couponsData } = useQuery<{ coupons: Coupon[] }>({
    queryKey: ["/api/coupons", { productId: product?.id }],
    queryFn: async () => {
      const res = await fetch(`/api/coupons?productId=${product?.id}`);
      return res.json();
    },
    enabled: !!product?.id,
  });

  const relatedQueryParams = new URLSearchParams();
  if (product?.categoryId) {
    relatedQueryParams.set("categoryId", product.categoryId);
    relatedQueryParams.set("limit", "4");
    if (product.id) relatedQueryParams.set("exclude", product.id);
  }

  const { data: relatedData } = useQuery<{ products: ProductWithDetails[] }>({
    queryKey: ["/api/products", relatedQueryParams.toString()],
    enabled: !!product?.categoryId,
  });

  const relatedProducts = relatedData?.products || [];
  const images = product?.images || [];
  const variants = product?.variants || [];
  const applicableCoupons = (couponsData?.coupons || []).filter(
    (c) => c.isActive && (!c.productId || c.productId === product?.id)
  );
  
  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const currentPrice = selectedVariant?.price || product?.salePrice || product?.price;
  const originalPrice = product?.price;
  const hasDiscount = product?.salePrice && parseFloat(product.salePrice as string) < parseFloat(product.price as string);
  const discountPercentage = hasDiscount 
    ? Math.round((1 - parseFloat(product.salePrice as string) / parseFloat(product.price as string)) * 100)
    : 0;
  
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    toast({ title: "Coupon code copied!" });
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const getExpectedDeliveryDate = () => {
    if (!product?.expectedDeliveryDays) return null;
    const date = new Date();
    date.setDate(date.getDate() + product.expectedDeliveryDays);
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  const isOnSale = (product as any)?.isOnSale;
  const salePriceEnd = (product as any)?.salePriceEnd;
  const salePriceStart = (product as any)?.salePriceStart;
  const isSaleActive = isOnSale && salePriceEnd && new Date(salePriceEnd) > new Date() && 
    (!salePriceStart || new Date(salePriceStart) <= new Date());

  useEffect(() => {
    if (!isSaleActive || !salePriceEnd) {
      setSaleCountdown(null);
      return;
    }

    const calculateTimeLeft = () => {
      const endDate = new Date(salePriceEnd);
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();

      if (difference <= 0) {
        setSaleCountdown(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setSaleCountdown({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [isSaleActive, salePriceEnd]);

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
        <div className="flex gap-4">
          {images.length > 1 && (
            <div className="hidden md:flex flex-col gap-2 max-h-[500px] overflow-y-auto">
              {images.map((image, index) => {
                const isVideo = image.mediaType === "video";
                return (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors relative ${
                      index === selectedImageIndex ? "border-primary" : "border-muted hover:border-primary/50"
                    }`}
                    data-testid={`button-thumbnail-${index}`}
                  >
                    {isVideo ? (
                      <>
                        <video src={image.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-6 w-6 text-white fill-white" />
                        </div>
                      </>
                    ) : (
                      <img
                        src={image.url}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
          
          <div className="flex-1 space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              {images[selectedImageIndex]?.mediaType === "video" ? (
                <video
                  src={images[selectedImageIndex]?.url || ""}
                  controls
                  className="w-full h-full object-cover"
                  data-testid="video-product-main"
                />
              ) : (
                <img
                  src={primaryImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  data-testid="img-product-main"
                />
              )}
              {hasDiscount && (
                <Badge variant="destructive" className="absolute top-4 left-4">
                  -{discountPercentage}%
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
              <div className="flex md:hidden gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => {
                  const isVideo = image.mediaType === "video";
                  return (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors relative ${
                        index === selectedImageIndex ? "border-primary" : "border-transparent"
                      }`}
                      data-testid={`button-thumbnail-mobile-${index}`}
                    >
                      {isVideo ? (
                        <>
                          <video src={image.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="h-6 w-6 text-white fill-white" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={image.url}
                          alt={`${product.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold text-primary" data-testid="text-product-price">
              ${parseFloat(currentPrice as string).toFixed(2)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xl text-muted-foreground line-through" data-testid="text-original-price">
                  ${parseFloat(originalPrice as string).toFixed(2)}
                </span>
                <Badge variant="destructive" data-testid="badge-discount">
                  Save {discountPercentage}%
                </Badge>
              </>
            )}
          </div>

          {isSaleActive && saleCountdown && (
            <div className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg" data-testid="sale-countdown">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="h-5 w-5 text-red-500" />
                <span className="font-bold text-red-500">Sale Ends In:</span>
                {(product as any)?.isNewArrival && (
                  <Badge variant="secondary" className="ml-auto">
                    <Sparkles className="h-3 w-3 mr-1" />
                    New Arrival
                  </Badge>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <div className="text-center bg-background rounded-lg p-3 min-w-[60px] shadow-sm">
                  <div className="text-2xl font-bold text-foreground">{saleCountdown.days}</div>
                  <div className="text-xs text-muted-foreground uppercase">Days</div>
                </div>
                <div className="text-center bg-background rounded-lg p-3 min-w-[60px] shadow-sm">
                  <div className="text-2xl font-bold text-foreground">{saleCountdown.hours.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-muted-foreground uppercase">Hours</div>
                </div>
                <div className="text-center bg-background rounded-lg p-3 min-w-[60px] shadow-sm">
                  <div className="text-2xl font-bold text-foreground">{saleCountdown.minutes.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-muted-foreground uppercase">Minutes</div>
                </div>
                <div className="text-center bg-background rounded-lg p-3 min-w-[60px] shadow-sm">
                  <div className="text-2xl font-bold text-foreground">{saleCountdown.seconds.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-muted-foreground uppercase">Seconds</div>
                </div>
              </div>
            </div>
          )}

          {(product as any)?.isNewArrival && !isSaleActive && (
            <Badge variant="secondary" className="w-fit">
              <Sparkles className="h-3 w-3 mr-1" />
              New Arrival
            </Badge>
          )}

          {product.shortDesc && (
            <p className="text-muted-foreground">{product.shortDesc}</p>
          )}

          {getExpectedDeliveryDate() && (
            <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg" data-testid="delivery-date">
              <Calendar className="h-4 w-4 text-primary" />
              <span>
                Expected delivery by <strong>{getExpectedDeliveryDate()}</strong>
              </span>
            </div>
          )}

          {applicableCoupons.length > 0 && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Available Coupons</span>
              </div>
              <div className="space-y-2">
                {applicableCoupons.slice(0, 3).map((coupon) => (
                  <div
                    key={coupon.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                    data-testid={`coupon-${coupon.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-medium bg-background px-2 py-1 rounded">
                        {coupon.code}
                      </code>
                      <span className="text-xs text-muted-foreground">
                        {coupon.type === "percentage"
                          ? `${coupon.amount}% off`
                          : `$${parseFloat(coupon.amount as string).toFixed(2)} off`}
                        {coupon.minCartTotal && ` (min $${parseFloat(coupon.minCartTotal as string).toFixed(0)})`}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(coupon.code)}
                      className="h-7"
                      data-testid={`button-copy-coupon-${coupon.id}`}
                    >
                      {copiedCoupon === coupon.code ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
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
