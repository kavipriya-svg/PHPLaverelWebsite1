import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Package,
  Calendar,
  Percent,
  Image as ImageIcon,
  Search,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import type { ProductWithDetails } from "@shared/schema";

interface ComboOffer {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  mediaUrls: string[] | null;
  productIds: string[];
  originalPrice: string;
  comboPrice: string;
  discountPercentage: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean | null;
  position: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  products: ProductWithDetails[];
}

interface MediaItem {
  url: string;
  type: "image" | "video";
}

export default function AdminComboOffers() {
  const [editOffer, setEditOffer] = useState<ComboOffer | null>(null);
  const [deleteOffer, setDeleteOffer] = useState<ComboOffer | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ offers: ComboOffer[] }>({
    queryKey: ["/api/admin/combo-offers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/combo-offers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/combo-offers"] });
      toast({ title: "Combo offer deleted successfully" });
      setDeleteOffer(null);
    },
    onError: () => {
      toast({ title: "Failed to delete combo offer", variant: "destructive" });
    },
  });

  const offers = data?.offers || [];

  const isOfferActive = (offer: ComboOffer) => {
    if (!offer.isActive) return false;
    const now = new Date();
    if (offer.startDate && new Date(offer.startDate) > now) return false;
    if (offer.endDate && new Date(offer.endDate) < now) return false;
    return true;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Combo Offers</h1>
            <p className="text-muted-foreground">Create product bundles with special pricing</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-combo">
            <Plus className="h-4 w-4 mr-2" />
            Add Combo Offer
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Combo Name</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Original Price</TableHead>
                <TableHead>Combo Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No combo offers yet. Create one to offer product bundles!
                  </TableCell>
                </TableRow>
              ) : (
                offers.map((offer) => (
                  <TableRow key={offer.id} data-testid={`row-combo-${offer.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {offer.imageUrl ? (
                          <img 
                            src={offer.imageUrl} 
                            alt={offer.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <span className="font-medium">{offer.name}</span>
                          {offer.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {offer.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {offer.products.length > 0 ? (
                          offer.products.slice(0, 2).map((p) => (
                            <Badge key={p.id} variant="secondary" className="text-xs">
                              {p.title}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {offer.productIds.length} products
                          </span>
                        )}
                        {offer.products.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{offer.products.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground line-through">
                      {formatCurrency(parseFloat(offer.originalPrice))}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatCurrency(parseFloat(offer.comboPrice))}
                    </TableCell>
                    <TableCell>
                      {offer.discountPercentage && (
                        <Badge variant="default" className="bg-green-600">
                          <Percent className="h-3 w-3 mr-1" />
                          {parseFloat(offer.discountPercentage).toFixed(0)}% OFF
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {offer.startDate && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(offer.startDate).toLocaleDateString()}
                          </div>
                        )}
                        {offer.endDate && (
                          <div className="text-muted-foreground">
                            to {new Date(offer.endDate).toLocaleDateString()}
                          </div>
                        )}
                        {!offer.startDate && !offer.endDate && (
                          <span className="text-muted-foreground">Always</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isOfferActive(offer) ? "default" : "outline"}>
                        {isOfferActive(offer) ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-menu-${offer.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditOffer(offer)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteOffer(offer)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <ComboOfferDialog
          open={isAddDialogOpen || !!editOffer}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditOffer(null);
            }
          }}
          offer={editOffer}
        />

        <AlertDialog open={!!deleteOffer} onOpenChange={() => setDeleteOffer(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Combo Offer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteOffer?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteOffer && deleteMutation.mutate(deleteOffer.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

function ComboOfferDialog({
  open,
  onOpenChange,
  offer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: ComboOffer | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [comboPrice, setComboPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [position, setPosition] = useState("0");
  const [productSearch, setProductSearch] = useState("");
  const { toast } = useToast();

  const isVideoFile = (filename: string, contentType: string): boolean => {
    return contentType.startsWith("video/") || 
      /\.(mp4|webm|ogg|mov|avi)$/i.test(filename);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);

    try {
      const uploadedItems: MediaItem[] = [];

      for (const file of Array.from(files)) {
        const presignedResponse = await apiRequest("POST", "/api/upload/presigned-url", {
          filename: file.name,
          contentType: file.type,
          folder: "combo-offers",
        });
        
        if (!presignedResponse.ok) {
          throw new Error(`Failed to get upload URL for ${file.name}`);
        }
        
        const { presignedUrl, objectPath } = await presignedResponse.json();

        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const finalizeResponse = await apiRequest("POST", "/api/admin/upload/finalize", {
          uploadURL: presignedUrl,
        });
        
        if (!finalizeResponse.ok) {
          throw new Error(`Failed to finalize upload for ${file.name}`);
        }
        
        const finalizedResult = await finalizeResponse.json();
        const finalUrl = finalizedResult.objectPath || `/objects/${objectPath}`;
        
        uploadedItems.push({
          url: finalUrl,
          type: isVideoFile(file.name, file.type) ? "video" : "image",
        });
      }

      setMediaItems((prev) => [...prev, ...uploadedItems]);
      
      if (uploadedItems.length > 0 && !imageUrl) {
        const firstImage = uploadedItems.find((item) => item.type === "image");
        if (firstImage) {
          setImageUrl(firstImage.url);
        }
      }
      
      toast({ title: `${uploadedItems.length} file(s) uploaded successfully` });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ 
        title: "Failed to upload files", 
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsUploadingMedia(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const removeMediaItem = (index: number) => {
    setMediaItems((prev) => {
      const newItems = prev.filter((_, i) => i !== index);
      if (prev[index]?.url === imageUrl && newItems.length > 0) {
        const firstImage = newItems.find((item) => item.type === "image");
        setImageUrl(firstImage?.url || "");
      } else if (newItems.length === 0) {
        setImageUrl("");
      }
      return newItems;
    });
  };

  const setAsPrimaryImage = (url: string) => {
    setImageUrl(url);
    toast({ title: "Primary image updated" });
  };

  useEffect(() => {
    if (offer) {
      setName(offer.name || "");
      setDescription(offer.description || "");
      setImageUrl(offer.imageUrl || "");
      const existingMedia: MediaItem[] = (offer.mediaUrls || []).map((url) => ({
        url,
        type: /\.(mp4|webm|ogg|mov|avi)$/i.test(url) ? "video" as const : "image" as const,
      }));
      setMediaItems(existingMedia);
      setSelectedProductIds(offer.productIds || []);
      setComboPrice(offer.comboPrice || "");
      setStartDate(offer.startDate ? new Date(offer.startDate).toISOString().split("T")[0] : "");
      setEndDate(offer.endDate ? new Date(offer.endDate).toISOString().split("T")[0] : "");
      setIsActive(offer.isActive !== false);
      setPosition((offer.position || 0).toString());
    } else {
      setName("");
      setDescription("");
      setImageUrl("");
      setMediaItems([]);
      setSelectedProductIds([]);
      setComboPrice("");
      setStartDate("");
      setEndDate("");
      setIsActive(true);
      setPosition("0");
    }
    setProductSearch("");
  }, [offer, open]);

  const { data: productsData } = useQuery<{ products: ProductWithDetails[]; total: number }>({
    queryKey: ["/api/admin/products"],
    enabled: open,
  });

  const products = productsData?.products || [];

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));
  const originalPrice = selectedProducts.reduce((sum, p) => sum + parseFloat(p.salePrice || p.price), 0);

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        mediaUrls: mediaItems.map((item) => item.url),
        productIds: selectedProductIds,
        originalPrice: originalPrice.toString(),
        comboPrice,
        startDate: startDate || null,
        endDate: endDate || null,
        isActive,
        position: parseInt(position) || 0,
      };
      if (offer) {
        return await apiRequest("PATCH", `/api/admin/combo-offers/${offer.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/admin/combo-offers", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/combo-offers"] });
      toast({ title: `Combo offer ${offer ? "updated" : "created"} successfully` });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to save combo offer", variant: "destructive" });
    },
  });

  const savings = originalPrice - parseFloat(comboPrice || "0");
  const discountPercent = originalPrice > 0 ? ((savings / originalPrice) * 100).toFixed(0) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{offer ? "Edit Combo Offer" : "Create Combo Offer"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Combo Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Complete Kitchen Set"
                  data-testid="input-combo-name"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what's included in this combo..."
                  rows={2}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Images & Videos</Label>
                <div className="space-y-3">
                  {mediaItems.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {mediaItems.map((item, index) => (
                        <div key={index} className="relative group">
                          {item.type === "video" ? (
                            <video
                              src={item.url}
                              className={`w-full h-20 rounded object-cover border ${
                                item.url === imageUrl ? "ring-2 ring-primary" : ""
                              }`}
                            />
                          ) : (
                            <img
                              src={item.url}
                              alt={`Media ${index + 1}`}
                              className={`w-full h-20 rounded object-cover border cursor-pointer ${
                                item.url === imageUrl ? "ring-2 ring-primary" : ""
                              }`}
                              onClick={() => setAsPrimaryImage(item.url)}
                            />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                            {item.type === "image" && item.url !== imageUrl && (
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-6 w-6"
                                onClick={() => setAsPrimaryImage(item.url)}
                                type="button"
                                title="Set as primary"
                              >
                                <ImageIcon className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-6 w-6"
                              onClick={() => removeMediaItem(index)}
                              type="button"
                              data-testid={`button-remove-media-${index}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {item.url === imageUrl && (
                            <Badge className="absolute -top-2 -left-2 text-xs px-1">
                              Primary
                            </Badge>
                          )}
                          {item.type === "video" && (
                            <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs px-1">
                              Video
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                      id="combo-media-upload"
                      disabled={isUploadingMedia}
                      multiple
                    />
                    <Button asChild variant="outline" disabled={isUploadingMedia} type="button">
                      <label htmlFor="combo-media-upload" className="cursor-pointer">
                        {isUploadingMedia ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {isUploadingMedia ? "Uploading..." : "Upload Images/Videos"}
                      </label>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Select multiple files. First image becomes primary.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Select Products *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="pl-10"
                  data-testid="input-search-products"
                />
              </div>
              
              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-md">
                  {selectedProducts.map((p) => (
                    <Badge key={p.id} variant="secondary" className="flex items-center gap-1">
                      {p.title}
                      <button
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <ScrollArea className="h-48 border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No products found</p>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-2 rounded hover-elevate cursor-pointer"
                        onClick={() => toggleProduct(product.id)}
                        data-testid={`product-item-${product.id}`}
                      >
                        <Checkbox
                          checked={selectedProductIds.includes(product.id)}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                        {product.images?.[0]?.url ? (
                          <img
                            src={product.images[0].url}
                            alt={product.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(parseFloat(product.salePrice || product.price))}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Original Price (Total)</Label>
                <div className="p-3 bg-muted rounded-md font-medium text-lg">
                  {formatCurrency(originalPrice)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Calculated from selected products
                </p>
              </div>

              <div className="space-y-2">
                <Label>Combo Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={comboPrice}
                  onChange={(e) => setComboPrice(e.target.value)}
                  placeholder="0.00"
                  data-testid="input-combo-price"
                />
                {savings > 0 && (
                  <p className="text-xs text-green-600">
                    Customers save {formatCurrency(savings)} ({discountPercent}% off)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Position</Label>
                <Input
                  type="number"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">Show this combo on the store</p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  data-testid="switch-active"
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!name || selectedProductIds.length < 2 || !comboPrice || saveMutation.isPending}
            data-testid="button-save-combo"
          >
            {saveMutation.isPending ? "Saving..." : offer ? "Update" : "Create"} Combo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
