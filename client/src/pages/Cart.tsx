import { Link } from "wouter";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useStore } from "@/contexts/StoreContext";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AppliedCoupon {
  code: string;
  type: string;
  amount: string;
  productId?: string | null;
}

export default function Cart() {
  const { cartItems, cartTotal, updateCartItem, removeFromCart, isCartLoading } = useStore();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

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

  const subtotal = cartTotal;
  const discount = calculateDiscount();
  const shipping = subtotal >= 500 ? 0 : 99;
  const total = subtotal - discount + shipping;

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
                        <p className="font-semibold">
                          {formatCurrency(parseFloat(price as string) * item.quantity)}
                        </p>
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
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span data-testid="text-cart-discount">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Free shipping on orders over {CURRENCY_SYMBOL}500
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span data-testid="text-cart-total">{formatCurrency(total)}</span>
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
