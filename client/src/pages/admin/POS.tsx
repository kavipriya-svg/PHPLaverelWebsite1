import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  CheckCircle,
  User,
  Phone,
  Mail,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import type { ProductWithDetails } from "@shared/schema";

interface CartItem {
  productId: string;
  variantId?: string;
  product: ProductWithDetails;
  quantity: number;
  price: number;
}

const paymentTypes = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "upi", label: "UPI", icon: Smartphone },
  { value: "credit", label: "Credit", icon: FileText },
];

export default function POS() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState("");
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const { data: productsData, isLoading } = useQuery<{
    products: ProductWithDetails[];
    total: number;
  }>({
    queryKey: ["/api/admin/pos/products", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const response = await fetch(`/api/admin/pos/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/admin/pos/orders", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (data: any) => {
      setLastOrderNumber(data.order?.orderNumber || "");
      setShowSuccessDialog(true);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pos/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: typeof newCustomer) => {
      const response = await apiRequest("POST", "/api/admin/pos/customers", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      const customer = data.customer;
      const fullName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
      setCustomerName(fullName);
      if (customer.phone) {
        setCustomerPhone(customer.phone);
      }
      setShowNewCustomerDialog(false);
      setNewCustomer({ firstName: "", lastName: "", email: "", phone: "" });
      toast({
        title: "Customer Created",
        description: `${fullName} has been added as a new customer`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const handleCreateCustomer = () => {
    if (!newCustomer.firstName.trim()) {
      toast({
        title: "Error",
        description: "First name is required",
        variant: "destructive",
      });
      return;
    }
    createCustomerMutation.mutate(newCustomer);
  };

  const products = productsData?.products || [];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => (p.stock ?? 0) > 0);
  }, [products]);

  const addToCart = (product: ProductWithDetails) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    const price = product.salePrice
      ? parseFloat(product.salePrice)
      : parseFloat(product.price);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          product,
          quantity: 1,
          price,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add products to cart before checkout",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate({
      items: cart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      posPaymentType: paymentType,
      posCustomerName: customerName || undefined,
      posCustomerPhone: customerPhone || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="mb-4">
            <h1 className="text-2xl font-bold mb-4">Point of Sale</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-pos-search"
                placeholder="Search products by name, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-4" />
                <p>No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => {
                  const price = product.salePrice
                    ? parseFloat(product.salePrice)
                    : parseFloat(product.price);
                  const hasDiscount = product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price);
                  const inCart = cart.find((c) => c.productId === product.id);

                  return (
                    <Card
                      key={product.id}
                      data-testid={`card-product-${product.id}`}
                      className="cursor-pointer hover-elevate transition-all"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-3">
                        <div className="aspect-square relative mb-2 bg-muted rounded-md overflow-hidden">
                          {product.images?.[0]?.url ? (
                            <img
                              src={product.images[0].url}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <ShoppingCart className="h-8 w-8" />
                            </div>
                          )}
                          {inCart && (
                            <Badge className="absolute top-1 right-1">
                              {inCart.quantity}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm truncate">{product.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          SKU: {product.sku}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-sm">
                            {formatCurrency(price)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatCurrency(parseFloat(product.price))}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Stock: {product.stock ?? 0}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="w-96 border-l bg-card flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cart.length})
            </CardTitle>
          </CardHeader>

          <div className="px-4 pb-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-customer-name"
                  placeholder="Customer Name (optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setShowNewCustomerDialog(true)}
                title="Add new customer"
                data-testid="button-add-customer"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-customer-phone"
                placeholder="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mb-2" />
                <p className="text-sm">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <Card key={item.productId} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        {item.product.images?.[0]?.url ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.product.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price)} each
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.productId, -1);
                            }}
                            data-testid={`button-decrease-${item.productId}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.productId, 1);
                            }}
                            data-testid={`button-increase-${item.productId}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(item.productId);
                            }}
                            data-testid={`button-remove-${item.productId}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="font-bold text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {paymentTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={paymentType === type.value ? "default" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => setPaymentType(type.value)}
                    data-testid={`button-payment-${type.value}`}
                  >
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Notes (optional)</Label>
              <Textarea
                data-testid="textarea-notes"
                placeholder="Order notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Separator />

            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span data-testid="text-cart-total">{formatCurrency(cartTotal)}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={cart.length === 0 || createOrderMutation.isPending}
              data-testid="button-checkout"
            >
              {createOrderMutation.isPending ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Complete Sale
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Order Created Successfully
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-lg">
              Order <span className="font-bold">{lastOrderNumber}</span> has been
              created.
            </p>
            <p className="text-center text-muted-foreground mt-2">
              Payment: {paymentTypes.find((t) => t.value === paymentType)?.label}
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              data-testid="button-close-success"
            >
              Create New Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Customer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  data-testid="input-new-customer-firstname"
                  placeholder="First name"
                  value={newCustomer.firstName}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  data-testid="input-new-customer-lastname"
                  placeholder="Last name"
                  value={newCustomer.lastName}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  data-testid="input-new-customer-email"
                  placeholder="customer@example.com"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  data-testid="input-new-customer-phone"
                  placeholder="+91 98765 43210"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewCustomerDialog(false);
                setNewCustomer({ firstName: "", lastName: "", email: "", phone: "" });
              }}
              data-testid="button-cancel-new-customer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomer}
              disabled={createCustomerMutation.isPending}
              data-testid="button-save-new-customer"
            >
              {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
