import { Link } from "wouter";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Tag, X, Gift, Info, Calendar, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";
import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import type { ComboOffer, User, SubscriptionCategoryDiscount, SubscriptionDeliveryTier } from "@shared/schema";

interface UserWithDiscounts extends User {
  categoryDiscounts?: SubscriptionCategoryDiscount[];
}

function calculateSubscriptionPrice(
  basePrice: string | number,
  salePrice: string | number | null | undefined,
  user: UserWithDiscounts | null | undefined,
  categoryId?: string | null
): { finalPrice: number; hasSubscriptionDiscount: boolean; originalPrice: number } {
  const base = parseFloat(String(basePrice));
  const sale = salePrice ? parseFloat(String(salePrice)) : null;
  const isOnSale = sale !== null && sale < base;
  const currentPrice = isOnSale ? sale : base;
  
  if (!user || user.customerType !== 'subscription') {
    return { finalPrice: Math.round(currentPrice * 100) / 100, hasSubscriptionDiscount: false, originalPrice: Math.round(currentPrice * 100) / 100 };
  }
  
  let discountType: string | null = null;
  let discountValue: number | null = null;
  
  if (categoryId && user.categoryDiscounts && user.categoryDiscounts.length > 0) {
    const categoryDiscount = user.categoryDiscounts.find(d => d.categoryId === categoryId);
    if (categoryDiscount) {
      if (isOnSale && categoryDiscount.saleDiscountType && categoryDiscount.saleDiscountValue) {
        discountType = categoryDiscount.saleDiscountType;
        discountValue = parseFloat(String(categoryDiscount.saleDiscountValue));
      } else {
        discountType = categoryDiscount.discountType;
        discountValue = parseFloat(String(categoryDiscount.discountValue));
      }
    }
  }
  
  if (!discountType || !discountValue || discountValue <= 0) {
    if (isOnSale) {
      discountType = user.subscriptionSaleDiscountType || null;
      discountValue = user.subscriptionSaleDiscountValue ? parseFloat(String(user.subscriptionSaleDiscountValue)) : null;
    } else {
      discountType = user.subscriptionDiscountType || null;
      discountValue = user.subscriptionDiscountValue ? parseFloat(String(user.subscriptionDiscountValue)) : null;
    }
  }
  
  if (!discountType || !discountValue || discountValue <= 0) {
    return { finalPrice: Math.round(currentPrice * 100) / 100, hasSubscriptionDiscount: false, originalPrice: Math.round(currentPrice * 100) / 100 };
  }
  
  let finalPrice: number;
  if (discountType === 'percentage') {
    finalPrice = currentPrice * (1 - discountValue / 100);
  } else {
    finalPrice = currentPrice - discountValue;
  }
  
  finalPrice = Math.max(0, Math.round(finalPrice * 100) / 100);
  const roundedOriginal = Math.round(currentPrice * 100) / 100;
  
  return { 
    finalPrice, 
    hasSubscriptionDiscount: finalPrice < roundedOriginal, 
    originalPrice: roundedOriginal 
  };
}

interface AppliedCoupon {
  code: string;
  type: string;
  amount: string;
  productId?: string | null;
}

export default function Cart() {
  const { cartItems, cartTotal, updateCartItem, removeFromCart, isCartLoading } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  
  const isSubscriptionCustomer = user?.customerType === 'subscription';
  const isAuthenticated = !!user;

  // Fetch saved addresses for subscription customers to determine shipping region
  interface SavedAddress {
    id: string;
    city: string;
    isDefault?: boolean;
    type?: string;
  }
  const { data: addressesData } = useQuery<{ addresses: SavedAddress[] }>({
    queryKey: ["/api/addresses"],
    enabled: isAuthenticated && isSubscriptionCustomer,
  });

  // Determine if default shipping address is Chennai
  const defaultShippingCity = useMemo(() => {
    const addresses = addressesData?.addresses;
    if (!addresses || addresses.length === 0) return null;
    const defaultAddr = addresses.find(addr => addr.isDefault && addr.type === 'shipping') 
      || addresses.find(addr => addr.isDefault)
      || addresses[0];
    return defaultAddr?.city?.toLowerCase() || null;
  }, [addressesData]);

  // Fetch combo offers to calculate combo discounts
  const { data: comboOffersData } = useQuery<{ offers: ComboOffer[] }>({
    queryKey: ["/api/combo-offers"],
  });

  // Fetch delivery tiers for subscription customers
  const { data: deliveryTiersData } = useQuery<{ tiers: SubscriptionDeliveryTier[] }>({
    queryKey: ["/api/subscription-delivery-tiers"],
    enabled: isSubscriptionCustomer,
  });

  // Mutation to update cart item delivery date
  const updateDeliveryDateMutation = useMutation({
    mutationFn: async ({ itemId, deliveryDate }: { itemId: string; deliveryDate: string | null }) => {
      const res = await apiRequest("PATCH", `/api/cart/${itemId}/delivery-date`, { deliveryDate });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to update delivery date",
        description: "Please try again.",
      });
    },
  });

  // Calculate GST included in cart items (for display purposes - GST is already in the price)
  const includedGst = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat((item.variant?.price || item.product.salePrice || item.product.price) as string);
      const gstRate = parseFloat((item.product.gstRate as string) || "18");
      const itemTotal = price * item.quantity;
      // GST is included in price, so: price = basePrice + GST, where GST = basePrice * (gstRate/100)
      // Therefore: price = basePrice * (1 + gstRate/100), so basePrice = price / (1 + gstRate/100)
      // And: includedGST = price - basePrice = price - price/(1 + gstRate/100) = price * gstRate / (100 + gstRate)
      const gstAmount = itemTotal * gstRate / (100 + gstRate);
      return total + gstAmount;
    }, 0);
  }, [cartItems]);

  // Calculate combo discount based on cart items with comboOfferId
  const comboDiscount = useMemo(() => {
    if (!comboOffersData?.offers || cartItems.length === 0) return 0;
    
    // Group cart items by comboOfferId
    const comboGroups: Record<string, typeof cartItems> = {};
    cartItems.forEach(item => {
      const comboId = item.comboOfferId;
      if (comboId) {
        if (!comboGroups[comboId]) {
          comboGroups[comboId] = [];
        }
        comboGroups[comboId].push(item);
      }
    });
    
    let totalComboDiscount = 0;
    
    // For each combo group, check if all products are present and calculate discount
    Object.entries(comboGroups).forEach(([comboId, items]) => {
      const comboOffer = comboOffersData.offers.find(o => o.id === comboId);
      if (!comboOffer || !comboOffer.productIds || !comboOffer.isActive) return;
      
      // Check dates if applicable
      const now = new Date();
      if (comboOffer.startDate && new Date(comboOffer.startDate) > now) return;
      if (comboOffer.endDate && new Date(comboOffer.endDate) < now) return;
      
      // Check if all products from the combo are in this group
      const cartProductIds = items.map(item => item.productId);
      const allProductsPresent = comboOffer.productIds.every(pid => cartProductIds.includes(pid));
      
      if (allProductsPresent) {
        // Calculate the number of complete combo sets based on minimum quantity
        // A complete combo set requires 1 of each product
        const comboSets = Math.min(
          ...comboOffer.productIds.map(pid => {
            const cartItem = items.find(i => i.productId === pid);
            return cartItem?.quantity || 0;
          })
        );
        
        if (comboSets > 0) {
          // Calculate discount per set: originalPrice - comboPrice
          const originalPrice = parseFloat(comboOffer.originalPrice as string) || 0;
          const comboPrice = parseFloat(comboOffer.comboPrice as string) || 0;
          const discountPerSet = originalPrice - comboPrice;
          totalComboDiscount += (discountPerSet * comboSets);
        }
      }
    });
    
    return totalComboDiscount;
  }, [cartItems, comboOffersData?.offers]);

  // Calculate subscription-adjusted cart totals and per-item pricing
  const subscriptionPricing = useMemo(() => {
    if (!isSubscriptionCustomer) {
      return {
        adjustedTotal: cartTotal,
        subscriptionDiscount: 0,
        itemPrices: new Map<string, { finalPrice: number; originalPrice: number; hasDiscount: boolean }>()
      };
    }
    
    let adjustedTotal = 0;
    let originalTotal = 0;
    const itemPrices = new Map<string, { finalPrice: number; originalPrice: number; hasDiscount: boolean }>();
    
    cartItems.forEach(item => {
      const basePrice = item.variant?.price || item.product.price;
      const salePrice = item.variant?.salePrice || item.product.salePrice;
      const { finalPrice, hasSubscriptionDiscount, originalPrice } = calculateSubscriptionPrice(
        basePrice,
        salePrice,
        user as UserWithDiscounts,
        item.product.categoryId
      );
      
      itemPrices.set(item.id, { 
        finalPrice: finalPrice * item.quantity, 
        originalPrice: originalPrice * item.quantity,
        hasDiscount: hasSubscriptionDiscount
      });
      
      adjustedTotal += finalPrice * item.quantity;
      originalTotal += originalPrice * item.quantity;
    });
    
    return {
      adjustedTotal,
      subscriptionDiscount: originalTotal - adjustedTotal,
      itemPrices
    };
  }, [cartItems, user, isSubscriptionCustomer, cartTotal]);

  // Calculate shipping grouped by delivery date for subscription customers
  const deliveryDateShipping = useMemo(() => {
    if (!isSubscriptionCustomer) {
      return {
        groups: new Map<string, { totalWeight: number; shippingFee: number; items: typeof cartItems }>(),
        totalShipping: 0,
        hasMultipleDeliveryDates: false,
      };
    }

    const deliveryTiers = deliveryTiersData?.tiers || [];
    const sortedTiers = [...deliveryTiers].filter(t => t.isActive).sort((a, b) => 
      parseFloat(String(a.upToWeightKg)) - parseFloat(String(b.upToWeightKg))
    );
    
    // Group cart items by delivery date
    const groups = new Map<string, { totalWeight: number; shippingFee: number; items: typeof cartItems }>();
    
    cartItems.forEach(item => {
      const deliveryDate = (item as any).deliveryDate || 'unassigned';
      const itemWeight = parseFloat(String(item.product.weight || 0)) * item.quantity;
      
      if (!groups.has(deliveryDate)) {
        groups.set(deliveryDate, { totalWeight: 0, shippingFee: 0, items: [] });
      }
      const group = groups.get(deliveryDate)!;
      group.totalWeight += itemWeight;
      group.items.push(item);
    });
    
    // Calculate shipping fee for each group based on weight tier
    // Use saved address city if available, otherwise show as estimate
    let totalShipping = 0;
    const isChennai = defaultShippingCity ? defaultShippingCity.includes('chennai') : true; // Default to Chennai if no address
    const isEstimate = !defaultShippingCity; // Only estimate if no saved address
    
    groups.forEach((group, date) => {
      if (sortedTiers.length === 0 || group.totalWeight === 0) {
        group.shippingFee = 0;
      } else {
        const tier = sortedTiers.find(t => group.totalWeight <= parseFloat(String(t.upToWeightKg))) 
          || sortedTiers[sortedTiers.length - 1];
        group.shippingFee = parseFloat(String(isChennai ? tier.chennaiFee : tier.panIndiaFee));
      }
      totalShipping += group.shippingFee;
    });
    
    return {
      groups,
      totalShipping,
      hasMultipleDeliveryDates: groups.size > 1 || (groups.size === 1 && !groups.has('unassigned')),
      isEstimate, // Only show estimate label if no saved address
      isChennai,
    };
  }, [cartItems, isSubscriptionCustomer, deliveryTiersData, defaultShippingCity]);

  // Load any previously applied coupon from localStorage on mount
  useEffect(() => {
    const savedCoupon = localStorage.getItem("appliedCoupon");
    if (savedCoupon) {
      try {
        setAppliedCoupon(JSON.parse(savedCoupon));
      } catch (e) {
        localStorage.removeItem("appliedCoupon");
      }
    }
  }, []);

  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("GET", `/api/coupons/validate/${encodeURIComponent(code)}`);
      return await response.json();
    },
    onSuccess: (data: { coupon: AppliedCoupon }) => {
      const coupon = data.coupon;
      setAppliedCoupon(coupon);
      localStorage.setItem("appliedCoupon", JSON.stringify(coupon));
      setCouponCode("");
      toast({
        title: "Coupon applied",
        description: `Discount of ${coupon.type === 'percentage' ? `${coupon.amount}%` : formatCurrency(parseFloat(coupon.amount))} has been applied.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invalid coupon",
        description: error.message || "This coupon code is invalid or expired.",
        variant: "destructive",
      });
    },
  });

  const removeCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem("appliedCoupon");
    toast({
      title: "Coupon removed",
      description: "The discount has been removed from your order.",
    });
  };

  // Calculate discount based on applied coupon
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    // If coupon is product-specific, only apply to that product
    if (appliedCoupon.productId) {
      const applicableItem = cartItems.find(item => item.productId === appliedCoupon.productId);
      if (!applicableItem) return 0;
      
      const itemPrice = applicableItem.variant?.price || applicableItem.product.salePrice || applicableItem.product.price;
      const itemTotal = parseFloat(itemPrice as string) * applicableItem.quantity;
      
      if (appliedCoupon.type === 'percentage') {
        return (itemTotal * parseFloat(appliedCoupon.amount)) / 100;
      } else {
        return Math.min(parseFloat(appliedCoupon.amount), itemTotal);
      }
    }
    
    // Store-wide coupon
    if (appliedCoupon.type === 'percentage') {
      return (cartTotal * parseFloat(appliedCoupon.amount)) / 100;
    } else {
      return Math.min(parseFloat(appliedCoupon.amount), cartTotal);
    }
  };

  if (isCartLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Button asChild size="lg">
            <Link href="/" data-testid="button-continue-shopping">
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = isSubscriptionCustomer ? subscriptionPricing.adjustedTotal : cartTotal;
  const couponDiscount = calculateDiscount();
  const totalDiscount = couponDiscount + comboDiscount;
  // For subscription customers, use weight-based shipping per delivery date; otherwise use default logic
  const shipping = isSubscriptionCustomer 
    ? deliveryDateShipping.totalShipping 
    : (subtotal >= 500 ? 0 : 99);
  const total = subtotal - totalDiscount + shipping;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const price = item.variant?.price || item.product.salePrice || item.product.price;
            const imageUrl = item.product.images?.find(img => img.isPrimary)?.url 
              || item.product.images?.[0]?.url
              || "/placeholder-product.jpg";
            
            const itemSubscriptionPricing = subscriptionPricing.itemPrices.get(item.id);
            const displayPrice = itemSubscriptionPricing?.finalPrice ?? (parseFloat(price as string) * item.quantity);
            const hasItemSubscriptionDiscount = itemSubscriptionPricing?.hasDiscount ?? false;

            return (
              <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Link href={`/product/${item.product.slug}`} className="shrink-0">
                      <img
                        src={imageUrl}
                        alt={item.product.title}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link href={`/product/${item.product.slug}`}>
                            <h3 className="font-medium hover:text-primary line-clamp-2">
                              {item.product.title}
                            </h3>
                          </Link>
                          {item.variant && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.variant.optionName}: {item.variant.optionValue}
                            </p>
                          )}
                          {hasItemSubscriptionDiscount && (
                            <Badge variant="secondary" className="mt-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              <Tag className="h-3 w-3 mr-1" />
                              Subscription Price
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive shrink-0"
                          onClick={() => removeFromCart(item.id)}
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {isSubscriptionCustomer && (
                        <div className="flex items-center gap-2 mt-3 p-2 bg-muted/50 rounded-md">
                          <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">Deliver on:</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 gap-1"
                                data-testid={`button-delivery-date-${item.id}`}
                              >
                                <Calendar className="h-3 w-3" />
                                {(item as any).deliveryDate 
                                  ? format(new Date((item as any).deliveryDate), 'MMM d, yyyy')
                                  : 'Select date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={(item as any).deliveryDate ? new Date((item as any).deliveryDate) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    updateDeliveryDateMutation.mutate({
                                      itemId: item.id,
                                      deliveryDate: format(date, 'yyyy-MM-dd'),
                                    });
                                  }
                                }}
                                disabled={(date) => date < addDays(new Date(), 1)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {(item as any).deliveryDate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground"
                              onClick={() => updateDeliveryDateMutation.mutate({ itemId: item.id, deliveryDate: null })}
                              data-testid={`button-clear-delivery-date-${item.id}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateCartItem(item.id, item.quantity + 1)}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          {hasItemSubscriptionDiscount ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="font-semibold text-green-600">
                                {formatCurrency(displayPrice)}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                {formatCurrency(itemSubscriptionPricing?.originalPrice ?? 0)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-semibold">
                              {formatCurrency(displayPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300" data-testid="text-applied-coupon">
                        {appliedCoupon.code}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400" data-testid="text-discount-amount">
                        {appliedCoupon.type === 'percentage' 
                          ? `${appliedCoupon.amount}% off` 
                          : `${formatCurrency(parseFloat(appliedCoupon.amount))} off`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-green-600 hover:text-destructive"
                    onClick={removeCoupon}
                    data-testid="button-remove-coupon"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    data-testid="input-coupon"
                  />
                  <Button
                    variant="outline"
                    onClick={() => applyCouponMutation.mutate(couponCode)}
                    disabled={!couponCode || applyCouponMutation.isPending}
                    data-testid="button-apply-coupon"
                  >
                    {applyCouponMutation.isPending ? "..." : "Apply"}
                  </Button>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {subscriptionPricing.subscriptionDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Subscription Savings (included)
                    </span>
                    <span data-testid="text-subscription-discount">
                      {formatCurrency(subscriptionPricing.subscriptionDiscount)}
                    </span>
                  </div>
                )}
                {comboDiscount > 0 && (
                  <div className="flex justify-between text-sm text-purple-600 dark:text-purple-400">
                    <span className="flex items-center gap-1">
                      <Gift className="h-3 w-3" />
                      Combo Discount
                    </span>
                    <span data-testid="text-combo-discount">-{formatCurrency(comboDiscount)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Coupon Discount</span>
                    <span data-testid="text-coupon-discount">-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                {isSubscriptionCustomer && deliveryDateShipping.hasMultipleDeliveryDates ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span>Delivery Charges</span>
                      {deliveryDateShipping.isEstimate && (
                        <span className="text-xs text-muted-foreground font-normal">(estimate)</span>
                      )}
                      {!deliveryDateShipping.isEstimate && !deliveryDateShipping.isChennai && (
                        <Badge variant="outline" className="text-xs">PAN India</Badge>
                      )}
                    </div>
                    {Array.from(deliveryDateShipping.groups.entries()).map(([date, group]) => (
                      <div key={date} className="flex justify-between text-sm pl-6">
                        <span className="text-muted-foreground">
                          {date === 'unassigned' ? 'No date selected' : format(new Date(date), 'MMM d, yyyy')}
                          <span className="text-xs ml-1">({group.totalWeight.toFixed(2)}kg)</span>
                        </span>
                        <span>{group.shippingFee === 0 ? "Free" : formatCurrency(group.shippingFee)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pl-6 pt-1 border-t">
                      <span className="text-muted-foreground font-medium">Total Shipping</span>
                      <span className="font-medium">{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
                    </div>
                    {deliveryDateShipping.isEstimate && (
                      <p className="text-xs text-muted-foreground mt-1 pl-6">
                        Final shipping based on delivery address at checkout
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
                    </div>
                    {!isSubscriptionCustomer && shipping > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Free shipping on orders over {CURRENCY_SYMBOL}500
                      </p>
                    )}
                  </>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span data-testid="text-cart-total">{formatCurrency(total)}</span>
              </div>
              
              {/* GST included info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 cursor-help">
                      <Info className="h-3 w-3" />
                      Incl. GST
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>GST is included in product prices</p>
                  </TooltipContent>
                </Tooltip>
                <span data-testid="text-included-gst">{formatCurrency(includedGst)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button asChild className="w-full" size="lg" data-testid="button-checkout">
                <Link href="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
