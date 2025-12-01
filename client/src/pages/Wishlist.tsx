import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductWithDetails } from "@shared/schema";

export default function Wishlist() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addToCart, toggleWishlist } = useStore();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data, isLoading } = useQuery<{ items: { product: ProductWithDetails }[] }>({
    queryKey: ["/api/wishlist"],
    enabled: isAuthenticated,
  });

  const items = data?.items || [];

  const handleAddToCart = async (product: ProductWithDetails) => {
    try {
      await addToCart(product.id);
      toast({
        title: "Added to cart",
        description: `${product.title} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await toggleWishlist(productId);
      toast({
        title: "Removed from wishlist",
        description: "Item has been removed from your wishlist.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Heart className="h-6 w-6" />
          My Wishlist
        </h1>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Your wishlist is empty</h3>
              <p className="text-muted-foreground mb-4">
                Save items you love for later.
              </p>
              <Button asChild>
                <Link href="/">Explore Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map(({ product }) => {
              const primaryImage = product.images?.find(img => img.isPrimary)?.url 
                || product.images?.[0]?.url 
                || "/placeholder-product.jpg";
              const currentPrice = product.salePrice || product.price;
              const hasDiscount = product.salePrice && parseFloat(product.salePrice as string) < parseFloat(product.price as string);

              return (
                <Card key={product.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Link href={`/product/${product.slug}`} className="shrink-0">
                        <img
                          src={primaryImage}
                          alt={product.title}
                          className="w-24 h-24 object-cover rounded-md"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${product.slug}`}>
                          <h3 className="font-medium hover:text-primary line-clamp-2">
                            {product.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-semibold">
                            ${parseFloat(currentPrice as string).toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-muted-foreground line-through">
                              ${parseFloat(product.price as string).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                            data-testid={`button-add-to-cart-${product.id}`}
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemove(product.id)}
                            data-testid={`button-remove-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
