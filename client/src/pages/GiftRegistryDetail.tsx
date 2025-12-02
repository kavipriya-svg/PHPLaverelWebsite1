import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { Gift, Plus, Trash2, Copy, Check, ArrowLeft, ExternalLink, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { GiftRegistryWithItems, ProductWithDetails } from "@shared/schema";

export default function GiftRegistryDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [priority, setPriority] = useState("normal");
  const [note, setNote] = useState("");

  const { data: registryData, isLoading } = useQuery<{ registry: GiftRegistryWithItems }>({
    queryKey: ["/api/gift-registries", id],
  });

  const { data: productsData } = useQuery<{ products: ProductWithDetails[] }>({
    queryKey: ["/api/products", { search: searchQuery, limit: 10 }],
    enabled: searchQuery.length > 2,
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) return;
      return apiRequest("POST", `/api/gift-registries/${id}/items`, {
        productId: selectedProduct.id,
        quantityDesired: parseInt(quantity),
        priority,
        note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-registries", id] });
      setAddItemDialogOpen(false);
      setSelectedProduct(null);
      setQuantity("1");
      setPriority("normal");
      setNote("");
      setSearchQuery("");
      toast({
        title: "Item added",
        description: "The item has been added to your registry.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to registry",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: { quantityDesired?: number; priority?: string; note?: string } }) => {
      return apiRequest("PUT", `/api/gift-registry-items/${itemId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-registries", id] });
      toast({
        title: "Item updated",
        description: "The item has been updated.",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("DELETE", `/api/gift-registry-items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-registries", id] });
      toast({
        title: "Item removed",
        description: "The item has been removed from your registry.",
      });
    },
  });

  const copyShareLink = () => {
    if (!registryData?.registry) return;
    const shareUrl = `${window.location.origin}/registry/${registryData.registry.shareCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard.",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48 mb-6" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const registry = registryData?.registry;
  if (!registry) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Registry not found</h3>
              <Button asChild>
                <Link href="/gift-registry">Back to Registries</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const products = productsData?.products || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/gift-registry">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registries
            </Link>
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Gift className="h-6 w-6" />
                {registry.title}
              </h1>
              <p className="text-muted-foreground mt-1">
                {registry.items?.length || 0} items in registry
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyShareLink}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy Link
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/registry/${registry.shareCode}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Page
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Registry Items</CardTitle>
              <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-item">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Item to Registry</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Search Products</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSelectedProduct(null);
                          }}
                          placeholder="Search for products..."
                          className="pl-10"
                          data-testid="input-search-products"
                        />
                      </div>
                      {products.length > 0 && !selectedProduct && (
                        <div className="border rounded-md max-h-48 overflow-auto">
                          {products.map((product) => {
                            const image = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url;
                            return (
                              <button
                                key={product.id}
                                className="w-full flex items-center gap-3 p-2 hover:bg-muted text-left"
                                onClick={() => setSelectedProduct(product)}
                              >
                                {image && (
                                  <img src={image} alt={product.title} className="w-10 h-10 object-cover rounded" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{product.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatCurrency(product.salePrice || product.price)}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {selectedProduct && (
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {selectedProduct.images?.[0]?.url && (
                              <img
                                src={selectedProduct.images[0].url}
                                alt={selectedProduct.title}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{selectedProduct.title}</p>
                              <p className="text-muted-foreground">
                                {formatCurrency(selectedProduct.salePrice || selectedProduct.price)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedProduct(null)}
                            >
                              Change
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity Desired</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          data-testid="input-quantity"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="note">Personal Note (optional)</Label>
                      <Textarea
                        id="note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Why you want this item..."
                        className="resize-none"
                        data-testid="input-note"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => addItemMutation.mutate()}
                      disabled={!selectedProduct || addItemMutation.isPending}
                      data-testid="button-confirm-add"
                    >
                      Add to Registry
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {registry.items?.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No items yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add products from our catalog to your registry.
                </p>
                <Button onClick={() => setAddItemDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Item
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {registry.items?.map((item) => {
                  const image = item.product?.images?.find(img => img.isPrimary)?.url || item.product?.images?.[0]?.url;
                  const price = parseFloat((item.product?.salePrice || item.product?.price) as string);
                  
                  return (
                    <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <Link href={`/product/${item.product?.slug}`} className="shrink-0">
                        <img
                          src={image || "/placeholder-product.jpg"}
                          alt={item.product?.title}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/product/${item.product?.slug}`}>
                              <h4 className="font-medium hover:text-primary line-clamp-1">
                                {item.product?.title}
                              </h4>
                            </Link>
                            <p className="text-muted-foreground text-sm">
                              {formatCurrency(price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              item.priority === "high" ? "destructive" : 
                              item.priority === "low" ? "secondary" : "default"
                            }>
                              {item.priority}
                            </Badge>
                            {item.isPurchased && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Purchased
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Qty: {item.quantityDesired}</span>
                          {(item.quantityPurchased || 0) > 0 && (
                            <span>Received: {item.quantityPurchased}</span>
                          )}
                        </div>
                        {item.note && (
                          <p className="mt-2 text-sm text-muted-foreground italic">
                            "{item.note}"
                          </p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this item from your registry?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeItemMutation.mutate(item.id)}>
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
