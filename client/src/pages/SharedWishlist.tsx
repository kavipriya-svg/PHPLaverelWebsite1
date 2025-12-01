import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { Heart, ShoppingCart, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import type { ProductWithDetails, SharedWishlist, WishlistItem } from "@shared/schema";

interface SharedWishlistResponse {
  sharedWishlist: SharedWishlist;
  items: (WishlistItem & { product: ProductWithDetails })[];
  owner: { firstName: string | null; lastName: string | null } | null;
}

export default function SharedWishlistPage() {
  const { shareCode } = useParams();
  const { addToCart } = useStore();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<SharedWishlistResponse>({
    queryKey: ["/api/shared-wishlist", shareCode],
    queryFn: async () => {
      const res = await fetch(`/api/shared-wishlist/${shareCode}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load wishlist");
      }
      return res.json();
    },
  });

  const handleAddToCart = async (product: ProductWithDetails) => {
    try {
      await addToCart(product.id);
      toast({
        title: "Added to cart",
        description: `${product.title} has been added to your cart.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48 mb-6" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    const isPrivate = error?.message?.includes("private");
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              {isPrivate ? (
                <>
                  <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">This wishlist is private</h3>
                  <p className="text-muted-foreground mb-4">
                    Only the owner can view this wishlist.
                  </p>
                </>
              ) : (
                <>
                  <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Wishlist not found</h3>
                  <p className="text-muted-foreground mb-4">
                    This wishlist may have been removed or the link is invalid.
                  </p>
                </>
              )}
              <Button asChild>
                <Link href="/">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { sharedWishlist, items, owner } = data;
  const ownerName = owner 
    ? [owner.firstName, owner.lastName].filter(Boolean).join(" ") || "Someone"
    : "Someone";

  return (
    <>
      <SEOHead
        title={`${sharedWishlist.title} - Shared Wishlist`}
        description={sharedWishlist.description || `View ${ownerName}'s wishlist`}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <User className="h-4 w-4" />
              <span>{ownerName}'s Wishlist</span>
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              {sharedWishlist.title}
            </h1>
            {sharedWishlist.description && (
              <p className="text-muted-foreground mt-2">{sharedWishlist.description}</p>
            )}
          </div>

          {items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">This wishlist is empty</h3>
                <p className="text-muted-foreground mb-4">
                  Check back later for new items!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{items.length} {items.length === 1 ? "item" : "items"}</Badge>
              </div>
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
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(product)}
                              disabled={product.stock === 0}
                              className="mt-3"
                              data-testid={`button-add-to-cart-${product.id}`}
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
