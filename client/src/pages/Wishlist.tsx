import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { Heart, ShoppingCart, Trash2, Share2, Copy, Check, Globe, Lock, ExternalLink, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductWithDetails, SharedWishlist } from "@shared/schema";

export default function Wishlist() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addToCart, toggleWishlist } = useStore();
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareTitle, setShareTitle] = useState("My Wishlist");
  const [shareDescription, setShareDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

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

  const { data: shareData } = useQuery<{ sharedWishlist: SharedWishlist | null }>({
    queryKey: ["/api/wishlist/share"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (shareData?.sharedWishlist) {
      setShareTitle(shareData.sharedWishlist.title || "My Wishlist");
      setShareDescription(shareData.sharedWishlist.description || "");
      setIsPublic(shareData.sharedWishlist.isPublic ?? true);
    }
  }, [shareData]);

  const createShareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/wishlist/share", {
        title: shareTitle,
        description: shareDescription,
        isPublic,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist/share"] });
      toast({
        title: "Wishlist shared",
        description: "Your wishlist is now shareable!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      });
    },
  });

  const updateShareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/wishlist/share", {
        title: shareTitle,
        description: shareDescription,
        isPublic,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist/share"] });
      toast({
        title: "Settings updated",
        description: "Your wishlist sharing settings have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const deleteShareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/wishlist/share");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist/share"] });
      toast({
        title: "Sharing disabled",
        description: "Your wishlist is no longer shared.",
      });
      setShareDialogOpen(false);
    },
  });

  const items = data?.items || [];
  const sharedWishlist = shareData?.sharedWishlist;

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

  const handleRemove = async (productId: string) => {
    try {
      await toggleWishlist(productId);
      toast({
        title: "Removed from wishlist",
        description: "Item has been removed from your wishlist.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove item.",
        variant: "destructive",
      });
    }
  };

  const copyShareLink = () => {
    if (!sharedWishlist) return;
    const shareUrl = `${window.location.origin}/wishlist/${sharedWishlist.shareCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard.",
    });
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6" />
            My Wishlist
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/gift-registry">
                <Gift className="h-4 w-4 mr-2" />
                Gift Registries
              </Link>
            </Button>
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-share-wishlist">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Wishlist
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Your Wishlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="share-title">Title</Label>
                    <Input
                      id="share-title"
                      value={shareTitle}
                      onChange={(e) => setShareTitle(e.target.value)}
                      placeholder="My Wishlist"
                      data-testid="input-share-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="share-description">Description (optional)</Label>
                    <Textarea
                      id="share-description"
                      value={shareDescription}
                      onChange={(e) => setShareDescription(e.target.value)}
                      placeholder="Let people know what this wishlist is for..."
                      className="resize-none"
                      data-testid="input-share-description"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isPublic ? (
                        <Globe className="h-4 w-4 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-amber-500" />
                      )}
                      <Label htmlFor="is-public">
                        {isPublic ? "Public" : "Private"} - Anyone with the link {isPublic ? "can" : "cannot"} view
                      </Label>
                    </div>
                    <Switch
                      id="is-public"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                      data-testid="switch-is-public"
                    />
                  </div>

                  {sharedWishlist ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={`${window.location.origin}/wishlist/${sharedWishlist.shareCode}`}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={copyShareLink}
                          data-testid="button-copy-link"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          asChild
                        >
                          <Link href={`/wishlist/${sharedWishlist.shareCode}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateShareMutation.mutate()}
                          disabled={updateShareMutation.isPending}
                          className="flex-1"
                          data-testid="button-update-share"
                        >
                          Update Settings
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => deleteShareMutation.mutate()}
                          disabled={deleteShareMutation.isPending}
                          data-testid="button-stop-sharing"
                        >
                          Stop Sharing
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => createShareMutation.mutate()}
                      disabled={createShareMutation.isPending}
                      className="w-full"
                      data-testid="button-create-share"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Create Share Link
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

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
                            {formatCurrency(currentPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatCurrency(product.price)}
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
