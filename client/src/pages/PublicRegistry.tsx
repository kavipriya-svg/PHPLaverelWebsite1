import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { Gift, ShoppingCart, Calendar, Users, Check, Lock, Heart, PartyPopper, Baby, Home, Cake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/components/SEOHead";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { GiftRegistryWithItems } from "@shared/schema";

const eventTypeLabels: Record<string, { label: string; icon: typeof Gift }> = {
  wedding: { label: "Wedding Registry", icon: Users },
  baby_shower: { label: "Baby Shower Registry", icon: Baby },
  birthday: { label: "Birthday Registry", icon: Cake },
  housewarming: { label: "Housewarming Registry", icon: Home },
  other: { label: "Gift Registry", icon: PartyPopper },
};

export default function PublicRegistryPage() {
  const { shareCode } = useParams();
  const { addToCart } = useStore();
  const { toast } = useToast();
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [purchaserEmail, setPurchaserEmail] = useState("");

  const { data, isLoading, error } = useQuery<{ registry: GiftRegistryWithItems }>({
    queryKey: ["/api/registry", shareCode],
    queryFn: async () => {
      const res = await fetch(`/api/registry/${shareCode}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load registry");
      }
      return res.json();
    },
  });

  const markPurchasedMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/registry/${shareCode}/items/${selectedItemId}/purchase`, {
        email: purchaserEmail,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registry", shareCode] });
      setPurchaseDialogOpen(false);
      setSelectedItemId(null);
      setPurchaserEmail("");
      toast({
        title: "Thank you!",
        description: "The item has been marked as purchased.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark item as purchased",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = async (productId: string, itemId: string) => {
    try {
      await addToCart(productId);
      toast({
        title: "Added to cart",
        description: "The item has been added to your cart.",
      });
      setSelectedItemId(itemId);
      setPurchaseDialogOpen(true);
    } catch {
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  const handleMarkPurchased = (itemId: string) => {
    setSelectedItemId(itemId);
    setPurchaseDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48 mb-6" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
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
                  <h3 className="font-semibold mb-2">This registry is private</h3>
                  <p className="text-muted-foreground mb-4">
                    Only the owner can view this registry.
                  </p>
                </>
              ) : (
                <>
                  <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Registry not found</h3>
                  <p className="text-muted-foreground mb-4">
                    This registry may have been removed or the link is invalid.
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

  const registry = data.registry;
  const eventConfig = eventTypeLabels[registry.eventType] || eventTypeLabels.other;
  const Icon = eventConfig.icon;
  
  const registrantNames = [registry.registrantName, registry.partnerName].filter(Boolean).join(" & ");
  const totalItems = registry.items?.length || 0;
  const purchasedItems = registry.items?.filter(item => item.isPurchased).length || 0;
  const progressPercent = totalItems > 0 ? (purchasedItems / totalItems) * 100 : 0;

  return (
    <>
      <SEOHead
        title={`${registry.title} - ${eventConfig.label}`}
        description={registry.description || `View ${registrantNames}'s gift registry`}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-4">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">{registry.title}</CardTitle>
              {registrantNames && (
                <p className="text-lg text-muted-foreground">
                  <Users className="h-4 w-4 inline mr-2" />
                  {registrantNames}
                </p>
              )}
              {registry.eventDate && (
                <p className="text-muted-foreground">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  {format(new Date(registry.eventDate), "MMMM d, yyyy")}
                </p>
              )}
              {registry.description && (
                <CardDescription className="mt-4 text-base">
                  {registry.description}
                </CardDescription>
              )}
            </CardHeader>
            {totalItems > 0 && (
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>{purchasedItems} of {totalItems} items purchased</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </CardContent>
            )}
          </Card>

          {(!registry.items || registry.items.length === 0) ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No items in this registry yet</h3>
                <p className="text-muted-foreground">
                  Check back later for gift ideas!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {registry.items.map((item) => {
                const image = item.product?.images?.find(img => img.isPrimary)?.url || item.product?.images?.[0]?.url;
                const price = parseFloat((item.product?.salePrice || item.product?.price) as string);
                const isFullyPurchased = (item.quantityPurchased || 0) >= (item.quantityDesired || 1);
                const remainingQty = (item.quantityDesired || 1) - (item.quantityPurchased || 0);
                
                return (
                  <Card key={item.id} className={isFullyPurchased ? "opacity-75" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Link href={`/product/${item.product?.slug}`} className="shrink-0">
                          <img
                            src={image || "/placeholder-product.jpg"}
                            alt={item.product?.title}
                            className="w-24 h-24 object-cover rounded-md"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link href={`/product/${item.product?.slug}`}>
                                <h3 className="font-medium hover:text-primary line-clamp-2">
                                  {item.product?.title}
                                </h3>
                              </Link>
                              <p className="text-muted-foreground">
                                {formatCurrency(price)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={
                                item.priority === "high" ? "destructive" : 
                                item.priority === "low" ? "secondary" : "default"
                              }>
                                {item.priority === "high" ? "Most Wanted" : 
                                 item.priority === "low" ? "Nice to Have" : "Wanted"}
                              </Badge>
                              {isFullyPurchased && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <Check className="h-3 w-3 mr-1" />
                                  Purchased
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {item.note && (
                            <p className="mt-2 text-sm text-muted-foreground italic">
                              "{item.note}"
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {isFullyPurchased ? (
                                <span>All {item.quantityDesired} purchased</span>
                              ) : (
                                <span>
                                  {remainingQty} of {item.quantityDesired} still needed
                                </span>
                              )}
                            </div>
                            {!isFullyPurchased && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAddToCart(item.productId, item.id)}
                                  disabled={item.product?.stock === 0}
                                  data-testid={`button-add-to-cart-${item.id}`}
                                >
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Add to Cart
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkPurchased(item.id)}
                                  data-testid={`button-mark-purchased-${item.id}`}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  I Bought This
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Mark as Purchased</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-muted-foreground">
                  Let {registrantNames || "the registrants"} know you've purchased this item! 
                  Your email will only be visible to them.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={purchaserEmail}
                    onChange={(e) => setPurchaserEmail(e.target.value)}
                    placeholder="your@email.com"
                    data-testid="input-purchaser-email"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPurchaseDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => markPurchasedMutation.mutate()}
                  disabled={markPurchasedMutation.isPending}
                  data-testid="button-confirm-purchased"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Purchase
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
