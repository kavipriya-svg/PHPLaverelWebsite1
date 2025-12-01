import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Ticket,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Coupon, ProductWithDetails } from "@shared/schema";

export default function AdminCoupons() {
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [deleteCoupon, setDeleteCoupon] = useState<Coupon | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ coupons: Coupon[] }>({
    queryKey: ["/api/admin/coupons"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "Coupon deleted successfully" });
      setDeleteCoupon(null);
    },
    onError: () => {
      toast({ title: "Failed to delete coupon", variant: "destructive" });
    },
  });

  const coupons = data?.coupons || [];

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Coupon code copied!" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Coupons</h1>
            <p className="text-muted-foreground">Manage discount codes</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-coupon">
            <Plus className="h-4 w-4 mr-2" />
            Add Coupon
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Min. Cart</TableHead>
                <TableHead>Min. Qty</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No coupons yet
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-primary" />
                        <code className="font-mono font-medium">{coupon.code}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(coupon as any).minQuantity ? (
                        coupon.productId ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <Package className="h-3 w-3" />
                            Volume (Product)
                          </Badge>
                        ) : (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            Volume (All)
                          </Badge>
                        )
                      ) : coupon.productId ? (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Package className="h-3 w-3" />
                          Product
                        </Badge>
                      ) : (
                        <Badge variant="outline">All Products</Badge>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{coupon.type}</TableCell>
                    <TableCell>
                      {coupon.type === "percentage"
                        ? `${coupon.amount}%`
                        : `$${parseFloat(coupon.amount as string).toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {coupon.minCartTotal ? `$${parseFloat(coupon.minCartTotal as string).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      {(coupon as any).minQuantity ? `${(coupon as any).minQuantity}+ items` : "-"}
                    </TableCell>
                    <TableCell>
                      {coupon.usedCount || 0} / {coupon.maxUses || "∞"}
                    </TableCell>
                    <TableCell>
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.isActive ? "default" : "outline"}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditCoupon(coupon)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteCoupon(coupon)}
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

        <CouponDialog
          open={isAddDialogOpen || !!editCoupon}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditCoupon(null);
            }
          }}
          coupon={editCoupon}
        />

        <AlertDialog open={!!deleteCoupon} onOpenChange={() => setDeleteCoupon(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the coupon "{deleteCoupon?.code}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCoupon && deleteMutation.mutate(deleteCoupon.id)}
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

function CouponDialog({
  open,
  onOpenChange,
  coupon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
}) {
  const [code, setCode] = useState(coupon?.code || "");
  const [type, setType] = useState(coupon?.type || "percentage");
  const [amount, setAmount] = useState(coupon?.amount?.toString() || "");
  const [minCartTotal, setMinCartTotal] = useState(coupon?.minCartTotal?.toString() || "");
  const [minQuantity, setMinQuantity] = useState((coupon as any)?.minQuantity?.toString() || "");
  const [maxUses, setMaxUses] = useState(coupon?.maxUses?.toString() || "");
  const [expiresAt, setExpiresAt] = useState(
    coupon?.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : ""
  );
  const [isActive, setIsActive] = useState(coupon?.isActive !== false);
  const getInitialScope = () => {
    if ((coupon as any)?.minQuantity) {
      return coupon?.productId ? "volume_product" : "volume_all";
    }
    return coupon?.productId ? "product" : "all";
  };
  const [scope, setScope] = useState<"all" | "product" | "volume_all" | "volume_product">(getInitialScope());
  const [productId, setProductId] = useState(coupon?.productId || "");
  const { toast } = useToast();

  const { data: productsData } = useQuery<{ products: ProductWithDetails[]; total: number }>({
    queryKey: ["/api/admin/products"],
    enabled: open,
  });

  const products = productsData?.products || [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const isVolumeScope = scope === "volume_all" || scope === "volume_product";
      const payload = {
        code: code.toUpperCase(),
        type,
        amount,
        minCartTotal: minCartTotal || null,
        minQuantity: isVolumeScope && minQuantity ? parseInt(minQuantity) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt || null,
        isActive,
        productId: (scope === "product" || scope === "volume_product") ? productId : null,
      };
      if (coupon) {
        return await apiRequest("PATCH", `/api/admin/coupons/${coupon.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/admin/coupons", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: `Coupon ${coupon ? "updated" : "created"} successfully` });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to save coupon", variant: "destructive" });
    },
  });

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{coupon ? "Edit Coupon" : "Add Coupon"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Code</Label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SAVE20"
                className="font-mono"
                data-testid="input-coupon-code"
              />
              <Button type="button" variant="outline" onClick={generateCode}>
                Generate
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Coupon Scope</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as "all" | "product" | "volume_all" | "volume_product")}>
              <SelectTrigger data-testid="select-coupon-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="product">Specific Product</SelectItem>
                <SelectItem value="volume_all">Volume Purchase - All Products</SelectItem>
                <SelectItem value="volume_product">Volume Purchase - Single Product</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {scope === "volume_all" && "Discount applies when buying min quantity of any products"}
              {scope === "volume_product" && "Discount applies when buying min quantity of a specific product"}
            </p>
          </div>

          {(scope === "product" || scope === "volume_product") && (
            <div className="space-y-2">
              <Label>Select Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger data-testid="select-coupon-product">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(scope === "volume_all" || scope === "volume_product") && (
            <div className="space-y-2">
              <Label>Minimum Quantity Required</Label>
              <Input
                type="number"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                placeholder="e.g. 3"
                min="1"
                data-testid="input-coupon-min-quantity"
              />
              <p className="text-xs text-muted-foreground">
                Customer must buy at least this many items to use the coupon
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={type === "percentage" ? "20" : "10.00"}
                data-testid="input-coupon-amount"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Cart Total</Label>
              <Input
                type="number"
                value={minCartTotal}
                onChange={(e) => setMinCartTotal(e.target.value)}
                placeholder="50.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Expires At</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-coupon">
            {coupon ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
