import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Heart, ShoppingCart, Star, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import type { ProductWithDetails } from "@shared/schema";

interface ProductCardProps {
  product: ProductWithDetails;
  showSaleCountdown?: boolean;
}

function calculateTimeLeft(endDate: Date | null): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} | null {
  if (!endDate) return null;
  
  const now = new Date().getTime();
  const end = new Date(endDate).getTime();
  const difference = end - now;

  if (difference <= 0) return null;

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
}

function useCountdown(endDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(endDate));

  useEffect(() => {
    if (!endDate) {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return timeLeft;
}

function ProductCountdownTimer({ endDate }: { endDate: Date }) {
  const timeLeft = useCountdown(endDate);

  if (!timeLeft) return null;

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20" data-testid="product-countdown-timer">
      <div className="flex items-center gap-1.5 bg-destructive text-white px-3 py-1.5 rounded-full shadow-lg">
        <Clock className="h-3.5 w-3.5" />
        <div className="flex items-center gap-0.5 text-xs font-bold whitespace-nowrap">
          {timeLeft.days > 0 && (
            <span>{timeLeft.days}d </span>
          )}
          <span>{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="opacity-75">:</span>
          <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="opacity-75">:</span>
          <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
}

export function ProductCard({ product, showSaleCountdown = false }: ProductCardProps) {
  const { addToCart, isInWishlist, toggleWishlist } = useStore();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const primaryImage = product.images?.find(img => img.isPrimary)?.url 
    || product.images?.[0]?.url 
    || "/placeholder-product.jpg";

  const currentPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && parseFloat(product.salePrice as string) < parseFloat(product.price as string);
  const discountPercent = hasDiscount
    ? Math.round((1 - parseFloat(product.salePrice as string) / parseFloat(product.price as string)) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    try {
      await addToCart(product.id);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }

    try {
      await toggleWishlist(product.id);
      toast({
        title: isInWishlist(product.id) ? "Removed from wishlist" : "Added to wishlist",
        description: isInWishlist(product.id) 
          ? `${product.title} has been removed from your wishlist.`
          : `${product.title} has been added to your wishlist.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card 
      className="group relative overflow-visible hover-elevate"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`card-product-${product.id}`}
    >
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden rounded-t-md">
          <img
            src={primaryImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge variant="destructive" className="text-xs">
                -{discountPercent}%
              </Badge>
            )}
            {product.isFeatured && (
              <Badge className="text-xs bg-primary">
                Featured
              </Badge>
            )}
            {product.isTrending && (
              <Badge variant="secondary" className="text-xs">
                Trending
              </Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={handleToggleWishlist}
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart 
              className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-destructive text-destructive" : ""}`} 
            />
          </Button>

          {showSaleCountdown && product.salePriceEnd && (
            <ProductCountdownTimer endDate={new Date(product.salePriceEnd)} />
          )}

          <div 
            className={`absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent transition-opacity ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={isLoading || product.stock === 0}
                data-testid={`button-add-to-cart-${product.id}`}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-9 w-9"
                data-testid={`button-view-${product.id}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {product.brand && (
            <p className="text-xs text-muted-foreground mb-1">{product.brand.name}</p>
          )}
          
          <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          {product.averageRating && parseFloat(product.averageRating as string) > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.round(parseFloat(product.averageRating as string))
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount})
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="font-bold text-lg" data-testid={`text-price-${product.id}`}>
              {formatCurrency(currentPrice)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          {product.stock !== null && product.stock <= 5 && product.stock > 0 && (
            <p className="text-xs text-destructive mt-2">
              Only {product.stock} left in stock
            </p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
