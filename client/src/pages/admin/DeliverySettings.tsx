import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import type { SubscriptionDeliveryTier } from "@shared/schema";

export default function DeliverySettings() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTier, setEditTier] = useState<SubscriptionDeliveryTier | null>(null);
  const [deleteTier, setDeleteTier] = useState<SubscriptionDeliveryTier | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    label: "",
    upToWeightKg: "",
    chennaiFee: "",
    panIndiaFee: "",
    sortOrder: "0",
    isActive: true,
  });

  const { data, isLoading } = useQuery<{ tiers: SubscriptionDeliveryTier[] }>({
    queryKey: ["/api/admin/subscription-delivery-tiers"],
  });

  const tiers = data?.tiers || [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/admin/subscription-delivery-tiers", {
        label: data.label,
        upToWeightKg: parseFloat(data.upToWeightKg),
        chennaiFee: parseFloat(data.chennaiFee),
        panIndiaFee: parseFloat(data.panIndiaFee),
        sortOrder: parseInt(data.sortOrder) || 0,
        isActive: data.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-delivery-tiers"] });
      toast({ title: "Delivery tier created successfully" });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create delivery tier", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const updateData: any = {};
      if (data.label) updateData.label = data.label;
      if (data.upToWeightKg) updateData.upToWeightKg = parseFloat(data.upToWeightKg);
      if (data.chennaiFee) updateData.chennaiFee = parseFloat(data.chennaiFee);
      if (data.panIndiaFee) updateData.panIndiaFee = parseFloat(data.panIndiaFee);
      if (data.sortOrder !== undefined) updateData.sortOrder = parseInt(data.sortOrder) || 0;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      return apiRequest("PATCH", `/api/admin/subscription-delivery-tiers/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-delivery-tiers"] });
      toast({ title: "Delivery tier updated successfully" });
      setEditTier(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update delivery tier", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/subscription-delivery-tiers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-delivery-tiers"] });
      toast({ title: "Delivery tier deleted successfully" });
      setDeleteTier(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete delivery tier", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({
      label: "",
      upToWeightKg: "",
      chennaiFee: "",
      panIndiaFee: "",
      sortOrder: "0",
      isActive: true,
    });
  };

  const handleEditTier = (tier: SubscriptionDeliveryTier) => {
    setFormData({
      label: tier.label,
      upToWeightKg: tier.upToWeightKg?.toString() || "",
      chennaiFee: tier.chennaiFee?.toString() || "",
      panIndiaFee: tier.panIndiaFee?.toString() || "",
      sortOrder: tier.sortOrder?.toString() || "0",
      isActive: tier.isActive ?? true,
    });
    setEditTier(tier);
  };

  const handleSubmit = () => {
    if (!formData.label || !formData.upToWeightKg || !formData.chennaiFee || !formData.panIndiaFee) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (editTier) {
      updateMutation.mutate({ id: editTier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatCurrency = (value: string | number | null) => {
    if (!value) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `${CURRENCY_SYMBOL}${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Subscription Delivery Settings</h1>
            <p className="text-muted-foreground">
              Configure weight-based delivery fees for subscription customers
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-tier">
          <Plus className="h-4 w-4 mr-2" />
          Add Weight Tier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Weight-Based Delivery Tiers
          </CardTitle>
          <CardDescription>
            Define delivery fee tiers based on order weight. Fees are calculated for Chennai (local) and PAN India (nationwide).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Up to Weight</TableHead>
                <TableHead>Chennai Fee</TableHead>
                <TableHead>PAN India Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : tiers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No delivery tiers configured. Click "Add Weight Tier" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                tiers.map((tier) => (
                  <TableRow key={tier.id} data-testid={`row-tier-${tier.id}`}>
                    <TableCell className="font-medium">{tier.label}</TableCell>
                    <TableCell>{tier.upToWeightKg} kg</TableCell>
                    <TableCell>{formatCurrency(tier.chennaiFee)}</TableCell>
                    <TableCell>{formatCurrency(tier.panIndiaFee)}</TableCell>
                    <TableCell>
                      <Badge variant={tier.isActive ? "default" : "secondary"}>
                        {tier.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditTier(tier)}
                          data-testid={`button-edit-tier-${tier.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteTier(tier)}
                          data-testid={`button-delete-tier-${tier.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog || !!editTier} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditTier(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTier ? "Edit Delivery Tier" : "Add Delivery Tier"}
            </DialogTitle>
            <DialogDescription>
              Configure a weight-based delivery fee tier with Chennai and PAN India pricing.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                placeholder="e.g., Up to 1 kg"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                data-testid="input-tier-label"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upToWeightKg">Up to Weight (kg) *</Label>
              <Input
                id="upToWeightKg"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g., 1.0"
                value={formData.upToWeightKg}
                onChange={(e) => setFormData({ ...formData, upToWeightKg: e.target.value })}
                data-testid="input-tier-weight"
              />
              <p className="text-xs text-muted-foreground">
                This tier applies to orders up to this weight
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chennaiFee">Chennai Fee ({CURRENCY_SYMBOL}) *</Label>
                <Input
                  id="chennaiFee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 30"
                  value={formData.chennaiFee}
                  onChange={(e) => setFormData({ ...formData, chennaiFee: e.target.value })}
                  data-testid="input-tier-chennai-fee"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panIndiaFee">PAN India Fee ({CURRENCY_SYMBOL}) *</Label>
                <Input
                  id="panIndiaFee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 50"
                  value={formData.panIndiaFee}
                  onChange={(e) => setFormData({ ...formData, panIndiaFee: e.target.value })}
                  data-testid="input-tier-pan-india-fee"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                min="0"
                placeholder="0"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                data-testid="input-tier-sort-order"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Only active tiers are shown to customers
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-tier-active"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditTier(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-tier"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTier} onOpenChange={(open) => !open && setDeleteTier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery Tier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tier "{deleteTier?.label}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTier && deleteMutation.mutate(deleteTier.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
