import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Plus, Search, Edit, Eye, UserPlus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { User, Category, SubscriptionCategoryDiscount } from "@shared/schema";
import { CURRENCY_SYMBOL } from "@/lib/currency";

interface SubscriptionCustomer extends User {
  orderCount?: number;
  totalSpent?: number;
}

interface CategoryDiscountFormData {
  categoryId: string;
  discountType: string;
  discountValue: string;
  saleDiscountType: string;
  saleDiscountValue: string;
}

export default function SubscriptionCustomers() {
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editCustomer, setEditCustomer] = useState<SubscriptionCustomer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<SubscriptionCustomer | null>(null);
  const [showAddCategoryDiscount, setShowAddCategoryDiscount] = useState(false);
  const [categoryDiscountForm, setCategoryDiscountForm] = useState<CategoryDiscountFormData>({
    categoryId: "",
    discountType: "percentage",
    discountValue: "",
    saleDiscountType: "percentage",
    saleDiscountValue: "",
  });
  const { toast } = useToast();

  // Form state for add/edit
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    subscriptionDiscountType: "percentage",
    subscriptionDiscountValue: "",
    subscriptionSaleDiscountType: "percentage",
    subscriptionSaleDiscountValue: "",
    subscriptionDeliveryFee: "",
    subscriptionDeliverySchedule: "weekly",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    subscriptionNotes: "",
  });

  const { data, isLoading } = useQuery<{ users: SubscriptionCustomer[]; total: number }>({
    queryKey: ["/api/admin/users/customers", { search: search || "", customerType: "subscription" }],
  });

  const customers = data?.users || [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/admin/users/subscription", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/customers"] });
      toast({ title: "Subscription customer created successfully" });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create customer", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return apiRequest("PATCH", `/api/admin/users/subscription/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/customers"] });
      toast({ title: "Customer updated successfully" });
      setEditCustomer(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update customer", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // Fetch categories for category discount selection
  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["/api/categories"],
  });
  const allCategories = categoriesData?.categories || [];

  // Build a flat list of categories with hierarchy labels
  const flattenCategories = (cats: Category[], parentLabel = ""): { id: string; label: string; level: number }[] => {
    const result: { id: string; label: string; level: number }[] = [];
    const buildList = (categories: any[], prefix: string, level: number) => {
      for (const cat of categories) {
        const label = prefix ? `${prefix} > ${cat.name}` : cat.name;
        result.push({ id: cat.id, label, level });
        if (cat.children && cat.children.length > 0) {
          buildList(cat.children, label, level + 1);
        }
      }
    };
    buildList(cats, parentLabel, 0);
    return result;
  };
  const flatCategories = flattenCategories(allCategories);

  // Fetch category discounts for the customer being edited
  const { data: categoryDiscountsData, refetch: refetchCategoryDiscounts } = useQuery<{ discounts: SubscriptionCategoryDiscount[] }>({
    queryKey: ["/api/admin/subscription-customers", editCustomer?.id, "category-discounts"],
    enabled: !!editCustomer?.id,
  });
  const categoryDiscounts = categoryDiscountsData?.discounts || [];

  // Create category discount mutation
  const createCategoryDiscountMutation = useMutation({
    mutationFn: async (data: CategoryDiscountFormData) => {
      return apiRequest("POST", `/api/admin/subscription-customers/${editCustomer?.id}/category-discounts`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-customers", editCustomer?.id, "category-discounts"] });
      toast({ title: "Category discount added successfully" });
      setShowAddCategoryDiscount(false);
      resetCategoryDiscountForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to add category discount", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // Delete category discount mutation
  const deleteCategoryDiscountMutation = useMutation({
    mutationFn: async (discountId: string) => {
      return apiRequest("DELETE", `/api/admin/subscription-customers/${editCustomer?.id}/category-discounts/${discountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-customers", editCustomer?.id, "category-discounts"] });
      toast({ title: "Category discount removed" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to remove category discount", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const resetCategoryDiscountForm = () => {
    setCategoryDiscountForm({
      categoryId: "",
      discountType: "percentage",
      discountValue: "",
      saleDiscountType: "percentage",
      saleDiscountValue: "",
    });
  };

  const handleAddCategoryDiscount = () => {
    if (!categoryDiscountForm.categoryId || !categoryDiscountForm.discountValue) {
      toast({ title: "Please select a category and enter a discount value", variant: "destructive" });
      return;
    }
    createCategoryDiscountMutation.mutate(categoryDiscountForm);
  };

  const getCategoryName = (categoryId: string): string => {
    const cat = flatCategories.find(c => c.id === categoryId);
    return cat?.label || "Unknown Category";
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      subscriptionDiscountType: "percentage",
      subscriptionDiscountValue: "",
      subscriptionSaleDiscountType: "percentage",
      subscriptionSaleDiscountValue: "",
      subscriptionDeliveryFee: "",
      subscriptionDeliverySchedule: "weekly",
      subscriptionStartDate: "",
      subscriptionEndDate: "",
      subscriptionNotes: "",
    });
  };

  const handleAddCustomer = () => {
    setShowAddDialog(true);
    resetForm();
  };

  const handleEditCustomer = (customer: SubscriptionCustomer) => {
    setEditCustomer(customer);
    setFormData({
      email: customer.email || "",
      password: "",
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      phone: customer.phone || "",
      subscriptionDiscountType: customer.subscriptionDiscountType || "percentage",
      subscriptionDiscountValue: customer.subscriptionDiscountValue || "",
      subscriptionSaleDiscountType: customer.subscriptionSaleDiscountType || "percentage",
      subscriptionSaleDiscountValue: customer.subscriptionSaleDiscountValue || "",
      subscriptionDeliveryFee: customer.subscriptionDeliveryFee || "",
      subscriptionDeliverySchedule: customer.subscriptionDeliverySchedule || "weekly",
      subscriptionStartDate: customer.subscriptionStartDate 
        ? new Date(customer.subscriptionStartDate).toISOString().split('T')[0] 
        : "",
      subscriptionEndDate: customer.subscriptionEndDate 
        ? new Date(customer.subscriptionEndDate).toISOString().split('T')[0] 
        : "",
      subscriptionNotes: customer.subscriptionNotes || "",
    });
  };

  const handleSubmitAdd = () => {
    if (!formData.email || !formData.password || !formData.firstName) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = () => {
    if (!editCustomer) return;
    const { email, password, ...updateData } = formData;
    updateMutation.mutate({ id: editCustomer.id, data: updateData });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDiscountDisplay = (type: string | null, value: string | null) => {
    if (!value) return "-";
    return type === "percentage" ? `${value}%` : formatCurrency(parseFloat(value));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users/customers">
            <Button variant="outline" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Subscription Customers</h1>
            <p className="text-muted-foreground">Manage subscription customers with special pricing</p>
          </div>
        </div>
        <Button onClick={handleAddCustomer} data-testid="button-add-subscription-customer">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Subscription Customer
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscription customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-subscription-customers"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          {customers.length} Subscription Customers
        </Badge>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Sale Discount</TableHead>
              <TableHead>Delivery Fee</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No subscription customers found. Click "Add Subscription Customer" to create one.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id} data-testid={`row-subscription-customer-${customer.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={customer.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {customer.firstName?.[0] || customer.email?.[0]?.toUpperCase() || "S"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {customer.firstName ? `${customer.firstName} ${customer.lastName || ""}` : "Customer"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getDiscountDisplay(customer.subscriptionDiscountType, customer.subscriptionDiscountValue)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getDiscountDisplay(customer.subscriptionSaleDiscountType, customer.subscriptionSaleDiscountValue)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {customer.subscriptionDeliveryFee 
                      ? formatCurrency(parseFloat(customer.subscriptionDeliveryFee)) 
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {customer.subscriptionDeliverySchedule || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setViewCustomer(customer)}
                        data-testid={`button-view-customer-${customer.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditCustomer(customer)}
                        data-testid={`button-edit-customer-${customer.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Subscription Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Subscription Customer</DialogTitle>
            <DialogDescription>
              Create a new subscription customer with special discount and delivery settings.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter first name"
                    data-testid="input-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter last name"
                    data-testid="input-lastname"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    data-testid="input-phone"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password (min 8 chars, uppercase, lowercase, number)"
                  data-testid="input-password"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Discount Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Regular Product Discount Type</Label>
                  <Select
                    value={formData.subscriptionDiscountType}
                    onValueChange={(value) => setFormData({ ...formData, subscriptionDiscountType: value })}
                  >
                    <SelectTrigger data-testid="select-discount-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ({CURRENCY_SYMBOL})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">Discount Value</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step="0.01"
                    value={formData.subscriptionDiscountValue}
                    onChange={(e) => setFormData({ ...formData, subscriptionDiscountValue: e.target.value })}
                    placeholder={formData.subscriptionDiscountType === "percentage" ? "e.g., 10" : "e.g., 100"}
                    data-testid="input-discount-value"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sale Product Discount Type</Label>
                  <Select
                    value={formData.subscriptionSaleDiscountType}
                    onValueChange={(value) => setFormData({ ...formData, subscriptionSaleDiscountType: value })}
                  >
                    <SelectTrigger data-testid="select-sale-discount-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ({CURRENCY_SYMBOL})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saleDiscountValue">Sale Discount Value</Label>
                  <Input
                    id="saleDiscountValue"
                    type="number"
                    step="0.01"
                    value={formData.subscriptionSaleDiscountValue}
                    onChange={(e) => setFormData({ ...formData, subscriptionSaleDiscountValue: e.target.value })}
                    placeholder="Discount on products already on sale"
                    data-testid="input-sale-discount-value"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Delivery Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryFee">Delivery Fee (per schedule)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    step="0.01"
                    value={formData.subscriptionDeliveryFee}
                    onChange={(e) => setFormData({ ...formData, subscriptionDeliveryFee: e.target.value })}
                    placeholder="Enter delivery fee"
                    data-testid="input-delivery-fee"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Schedule</Label>
                  <Select
                    value={formData.subscriptionDeliverySchedule}
                    onValueChange={(value) => setFormData({ ...formData, subscriptionDeliverySchedule: value })}
                  >
                    <SelectTrigger data-testid="select-delivery-schedule">
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Subscription Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.subscriptionStartDate}
                    onChange={(e) => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Subscription End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.subscriptionEndDate}
                    onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value })}
                    data-testid="input-end-date"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.subscriptionNotes}
                onChange={(e) => setFormData({ ...formData, subscriptionNotes: e.target.value })}
                placeholder="Any additional notes about this subscription customer..."
                rows={3}
                data-testid="input-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAdd} 
              disabled={createMutation.isPending}
              data-testid="button-submit-add"
            >
              {createMutation.isPending ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subscription Customer Dialog */}
      <Dialog open={!!editCustomer} onOpenChange={(open) => !open && setEditCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subscription Customer</DialogTitle>
            <DialogDescription>
              Update subscription customer settings and discounts.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    data-testid="input-edit-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    data-testid="input-edit-lastname"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={formData.email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="input-edit-phone"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Discount Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Regular Product Discount Type</Label>
                  <Select
                    value={formData.subscriptionDiscountType}
                    onValueChange={(value) => setFormData({ ...formData, subscriptionDiscountType: value })}
                  >
                    <SelectTrigger data-testid="select-edit-discount-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ({CURRENCY_SYMBOL})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-discountValue">Discount Value</Label>
                  <Input
                    id="edit-discountValue"
                    type="number"
                    step="0.01"
                    value={formData.subscriptionDiscountValue}
                    onChange={(e) => setFormData({ ...formData, subscriptionDiscountValue: e.target.value })}
                    data-testid="input-edit-discount-value"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sale Product Discount Type</Label>
                  <Select
                    value={formData.subscriptionSaleDiscountType}
                    onValueChange={(value) => setFormData({ ...formData, subscriptionSaleDiscountType: value })}
                  >
                    <SelectTrigger data-testid="select-edit-sale-discount-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ({CURRENCY_SYMBOL})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-saleDiscountValue">Sale Discount Value</Label>
                  <Input
                    id="edit-saleDiscountValue"
                    type="number"
                    step="0.01"
                    value={formData.subscriptionSaleDiscountValue}
                    onChange={(e) => setFormData({ ...formData, subscriptionSaleDiscountValue: e.target.value })}
                    data-testid="input-edit-sale-discount-value"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Delivery Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-deliveryFee">Delivery Fee (per schedule)</Label>
                  <Input
                    id="edit-deliveryFee"
                    type="number"
                    step="0.01"
                    value={formData.subscriptionDeliveryFee}
                    onChange={(e) => setFormData({ ...formData, subscriptionDeliveryFee: e.target.value })}
                    data-testid="input-edit-delivery-fee"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Schedule</Label>
                  <Select
                    value={formData.subscriptionDeliverySchedule}
                    onValueChange={(value) => setFormData({ ...formData, subscriptionDeliverySchedule: value })}
                  >
                    <SelectTrigger data-testid="select-edit-delivery-schedule">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Subscription Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.subscriptionStartDate}
                    onChange={(e) => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
                    data-testid="input-edit-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">Subscription End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.subscriptionEndDate}
                    onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value })}
                    data-testid="input-edit-end-date"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.subscriptionNotes}
                onChange={(e) => setFormData({ ...formData, subscriptionNotes: e.target.value })}
                rows={3}
                data-testid="input-edit-notes"
              />
            </div>

            <Separator />

            {/* Category-Specific Discounts Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Category-Specific Discounts
                </h3>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowAddCategoryDiscount(!showAddCategoryDiscount)}
                  data-testid="button-add-category-discount"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Category Discount
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Set specific discounts for product categories. These override the default discounts above.
              </p>

              {/* Add Category Discount Form */}
              {showAddCategoryDiscount && (
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Category</Label>
                      <Select
                        value={categoryDiscountForm.categoryId}
                        onValueChange={(value) => setCategoryDiscountForm({ ...categoryDiscountForm, categoryId: value })}
                      >
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Choose a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {flatCategories
                            .filter(cat => !categoryDiscounts.some(d => d.categoryId === cat.id))
                            .map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                <span style={{ paddingLeft: `${cat.level * 12}px` }}>{cat.label}</span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Regular Product Discount Type</Label>
                        <Select
                          value={categoryDiscountForm.discountType}
                          onValueChange={(value) => setCategoryDiscountForm({ ...categoryDiscountForm, discountType: value })}
                        >
                          <SelectTrigger data-testid="select-cat-discount-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount ({CURRENCY_SYMBOL})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Discount Value</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={categoryDiscountForm.discountValue}
                          onChange={(e) => setCategoryDiscountForm({ ...categoryDiscountForm, discountValue: e.target.value })}
                          placeholder={categoryDiscountForm.discountType === "percentage" ? "e.g., 10" : "e.g., 100"}
                          data-testid="input-cat-discount-value"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sale Product Discount Type</Label>
                        <Select
                          value={categoryDiscountForm.saleDiscountType}
                          onValueChange={(value) => setCategoryDiscountForm({ ...categoryDiscountForm, saleDiscountType: value })}
                        >
                          <SelectTrigger data-testid="select-cat-sale-discount-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount ({CURRENCY_SYMBOL})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Sale Discount Value</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={categoryDiscountForm.saleDiscountValue}
                          onChange={(e) => setCategoryDiscountForm({ ...categoryDiscountForm, saleDiscountValue: e.target.value })}
                          placeholder="Optional - for sale products"
                          data-testid="input-cat-sale-discount-value"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowAddCategoryDiscount(false);
                          resetCategoryDiscountForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={handleAddCategoryDiscount}
                        disabled={createCategoryDiscountMutation.isPending}
                        data-testid="button-save-category-discount"
                      >
                        {createCategoryDiscountMutation.isPending ? "Adding..." : "Add Discount"}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* List of existing category discounts */}
              {categoryDiscounts.length > 0 ? (
                <div className="space-y-2">
                  {categoryDiscounts.map((discount) => (
                    <div 
                      key={discount.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      data-testid={`category-discount-${discount.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{getCategoryName(discount.categoryId)}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>
                            Regular: {discount.discountType === "percentage" 
                              ? `${discount.discountValue}%` 
                              : `${CURRENCY_SYMBOL}${discount.discountValue}`}
                          </span>
                          {discount.saleDiscountValue && (
                            <span>
                              Sale: {discount.saleDiscountType === "percentage" 
                                ? `${discount.saleDiscountValue}%` 
                                : `${CURRENCY_SYMBOL}${discount.saleDiscountValue}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteCategoryDiscountMutation.mutate(discount.id)}
                        disabled={deleteCategoryDiscountMutation.isPending}
                        data-testid={`button-delete-category-discount-${discount.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No category-specific discounts configured. Default discounts will apply to all categories.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCustomer(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitEdit} 
              disabled={updateMutation.isPending}
              data-testid="button-submit-edit"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog open={!!viewCustomer} onOpenChange={(open) => !open && setViewCustomer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Subscription Customer Details</DialogTitle>
          </DialogHeader>

          {viewCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={viewCustomer.profileImageUrl || undefined} />
                  <AvatarFallback className="text-xl">
                    {viewCustomer.firstName?.[0] || viewCustomer.email?.[0]?.toUpperCase() || "S"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {viewCustomer.firstName} {viewCustomer.lastName}
                  </h3>
                  <p className="text-muted-foreground">{viewCustomer.email}</p>
                  {viewCustomer.phone && <p className="text-sm">{viewCustomer.phone}</p>}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Regular Discount</p>
                  <p className="font-medium">
                    {getDiscountDisplay(viewCustomer.subscriptionDiscountType, viewCustomer.subscriptionDiscountValue)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sale Item Discount</p>
                  <p className="font-medium">
                    {getDiscountDisplay(viewCustomer.subscriptionSaleDiscountType, viewCustomer.subscriptionSaleDiscountValue)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delivery Fee</p>
                  <p className="font-medium">
                    {viewCustomer.subscriptionDeliveryFee 
                      ? formatCurrency(parseFloat(viewCustomer.subscriptionDeliveryFee)) 
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delivery Schedule</p>
                  <p className="font-medium capitalize">
                    {viewCustomer.subscriptionDeliverySchedule || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {viewCustomer.subscriptionStartDate 
                      ? new Date(viewCustomer.subscriptionStartDate).toLocaleDateString() 
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {viewCustomer.subscriptionEndDate 
                      ? new Date(viewCustomer.subscriptionEndDate).toLocaleDateString() 
                      : "-"}
                  </p>
                </div>
              </div>

              {viewCustomer.subscriptionNotes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Notes</p>
                    <p className="text-sm">{viewCustomer.subscriptionNotes}</p>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCustomer(null)}>
              Close
            </Button>
            <Button onClick={() => {
              if (viewCustomer) {
                handleEditCustomer(viewCustomer);
                setViewCustomer(null);
              }
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
