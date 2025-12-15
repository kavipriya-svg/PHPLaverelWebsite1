import { useState, useMemo, useEffect, useRef } from "react";
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
  Users,
  Calendar,
  Tag,
  Percent,
  IndianRupee,
  ClipboardList,
  X,
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
  gstRate: number;
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
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerInputRef = useRef<HTMLDivElement>(null);
  
  const [orderDate, setOrderDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: string;
    amount: string;
    discount: number;
  } | null>(null);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [isQuotation, setIsQuotation] = useState(false);

  // Customer search query
  const { data: customerSearchData } = useQuery<{
    customers: Array<{
      id: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      email: string | null;
    }>;
  }>({
    queryKey: ["/api/admin/pos/customers", { search: customerSearch }],
    enabled: customerSearch.length >= 2,
  });

  const searchedCustomers = customerSearchData?.customers || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerInputRef.current && !customerInputRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCustomer = (customer: typeof searchedCustomers[0]) => {
    const fullName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    setCustomerName(fullName);
    setCustomerPhone(customer.phone || "");
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

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
      const response = await apiRequest("POST", "/api/admin/pos/orders", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      setLastOrderNumber(data.order?.orderNumber || "");
      setIsQuotation(data.order?.isQuotation || false);
      setShowSuccessDialog(true);
      resetCart();
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

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch(`/api/coupons/validate/${encodeURIComponent(code)}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Invalid coupon");
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      const coupon = data.coupon;
      let discountAmount = 0;
      if (coupon.type === "percentage") {
        discountAmount = (cartTotal * parseFloat(coupon.amount)) / 100;
      } else {
        discountAmount = parseFloat(coupon.amount);
      }
      setAppliedCoupon({
        code: coupon.code,
        type: coupon.type,
        amount: coupon.amount,
        discount: discountAmount,
      });
      setCouponCode("");
      toast({
        title: "Coupon Applied",
        description: `Discount of ${formatCurrency(discountAmount)} applied`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invalid Coupon",
        description: error.message || "Could not apply coupon",
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
    const gstRate = product.gstRate ? parseFloat(product.gstRate) : 18;

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
          gstRate,
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

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartGstDetails = useMemo(() => {
    return cart.map((item) => {
      const itemTotal = item.price * item.quantity;
      // GST is included in price: Extract GST from total
      const gstAmount = (itemTotal * item.gstRate) / (100 + item.gstRate);
      const basePrice = itemTotal - gstAmount; // Taxable value without GST
      return {
        productId: item.productId,
        gstRate: item.gstRate,
        gstAmount,
        basePrice,
      };
    });
  }, [cart]);

  const totalGst = useMemo(() => {
    return cartGstDetails.reduce((sum, item) => sum + item.gstAmount, 0);
  }, [cartGstDetails]);

  const manualDiscount = useMemo(() => {
    const value = parseFloat(discountValue) || 0;
    if (discountType === "percentage") {
      return (cartSubtotal * value) / 100;
    }
    return value;
  }, [discountType, discountValue, cartSubtotal]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percentage") {
      return (cartSubtotal * parseFloat(appliedCoupon.amount)) / 100;
    }
    return parseFloat(appliedCoupon.amount);
  }, [appliedCoupon, cartSubtotal]);

  const totalDiscount = manualDiscount + couponDiscount;
  // GST is already included in price, so total is just subtotal minus discount
  const cartTotal = Math.max(0, cartSubtotal - totalDiscount);

  const handleCheckout = (asQuotation = false) => {
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
        gstRate: item.gstRate,
      })),
      posPaymentType: paymentType,
      posCustomerName: customerName || undefined,
      posCustomerPhone: customerPhone || undefined,
      notes: notes || undefined,
      orderDate: orderDate,
      couponCode: appliedCoupon?.code || undefined,
      couponDiscount: couponDiscount > 0 ? couponDiscount.toString() : undefined,
      posManualDiscount: manualDiscount > 0 ? manualDiscount.toString() : undefined,
      isQuotation: asQuotation,
    });
  };

  const resetCart = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setNotes("");
    setCouponCode("");
    setAppliedCoupon(null);
    setDiscountValue("");
    setOrderDate(new Date().toISOString().split("T")[0]);
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
              <div className="relative flex-1" ref={customerInputRef}>
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-customer-search"
                  placeholder="Search existing customer..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="pl-10"
                />
                {showCustomerDropdown && searchedCustomers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {searchedCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        data-testid={`customer-option-${customer.id}`}
                        className="px-3 py-2 cursor-pointer hover-elevate"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="font-medium text-sm">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {customer.phone && <span>{customer.phone}</span>}
                          {customer.phone && customer.email && <span> • </span>}
                          {customer.email && <span>{customer.email}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-customer-name"
                placeholder="Customer Name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="pl-10"
              />
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
            <div>
              <Label className="text-sm mb-1 block">Order Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  data-testid="input-order-date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 min-h-[120px]">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mb-2" />
                <p className="text-sm">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3 pb-2">
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
                          {item.gstRate > 0 && (
                            <span className="ml-2 text-xs">
                              (GST {item.gstRate}%)
                            </span>
                          )}
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
          </div>

          <div className="p-4 border-t space-y-3">
            <div>
              <Label className="text-sm mb-1 block">Coupon Code</Label>
              <div className="flex gap-2">
                {appliedCoupon ? (
                  <div className="flex-1 flex items-center justify-between bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {appliedCoupon.code} (-{formatCurrency(couponDiscount)})
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setAppliedCoupon(null)}
                      data-testid="button-remove-coupon"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input
                      data-testid="input-coupon-code"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => couponCode && validateCouponMutation.mutate(couponCode)}
                      disabled={!couponCode || validateCouponMutation.isPending}
                      data-testid="button-apply-coupon"
                    >
                      {validateCouponMutation.isPending ? "..." : "Apply"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm mb-1 block">Manual Discount</Label>
              <div className="flex gap-2">
                <Select value={discountType} onValueChange={(v: "percentage" | "fixed") => setDiscountType(v)}>
                  <SelectTrigger className="w-24" data-testid="select-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        <span>%</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        <span>Fixed</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  data-testid="input-discount-value"
                  placeholder={discountType === "percentage" ? "0%" : "0.00"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="flex-1"
                />
              </div>
              {manualDiscount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Discount: -{formatCurrency(manualDiscount)}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm mb-1 block">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {paymentTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={paymentType === type.value ? "default" : "outline"}
                    size="sm"
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
              <Label className="text-sm mb-1 block">Notes (optional)</Label>
              <Textarea
                data-testid="textarea-notes"
                placeholder="Order notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>GST (included)</span>
                <span>{formatCurrency(totalGst)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span data-testid="text-cart-total">{formatCurrency(cartTotal)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleCheckout(true)}
                disabled={cart.length === 0 || createOrderMutation.isPending}
                data-testid="button-quotation"
              >
                <ClipboardList className="h-5 w-5 mr-2" />
                Quotation
              </Button>
              <Button
                size="lg"
                onClick={() => handleCheckout(false)}
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
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              {isQuotation ? "Quotation Created" : "Order Created Successfully"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-lg">
              {isQuotation ? "Quotation" : "Order"}{" "}
              <span className="font-bold">{lastOrderNumber}</span> has been
              created.
            </p>
            {!isQuotation && (
              <p className="text-center text-muted-foreground mt-2">
                Payment: {paymentTypes.find((t) => t.value === paymentType)?.label}
              </p>
            )}
            {isQuotation && (
              <p className="text-center text-muted-foreground mt-2">
                This is a quotation and can be converted to an order later.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              data-testid="button-close-success"
            >
              {isQuotation ? "Create New Quotation" : "Create New Order"}
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
