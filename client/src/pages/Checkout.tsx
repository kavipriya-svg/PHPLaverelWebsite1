import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Truck, Package, Tag, X } from "lucide-react";

interface AppliedCoupon {
  code: string;
  type: string;
  amount: string;
  productId?: string | null;
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const checkoutSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(1, "Phone number is required"),
  sameAsBilling: z.boolean().default(true),
  paymentMethod: z.enum(["stripe", "cod"]),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cartItems, cartTotal, clearCart } = useStore();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Load applied coupon from localStorage
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

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      phone: "",
      sameAsBilling: true,
      paymentMethod: "stripe",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const shippingAddress = {
        name: `${data.firstName} ${data.lastName}`,
        line1: data.address1,
        line2: data.address2 || "",
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone,
      };
      
      const orderData = {
        guestEmail: !isAuthenticated ? data.email : undefined,
        paymentMethod: data.paymentMethod,
        shippingAddress,
        billingAddress: data.sameAsBilling ? shippingAddress : shippingAddress,
        couponCode: appliedCoupon?.code,
        items: cartItems.map(item => {
          const price = item.variant?.price || item.product.salePrice || item.product.price;
          const primaryImage = item.product.images?.find(img => img.isPrimary)?.url || item.product.images?.[0]?.url;
          return {
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: price,
            title: item.product.title,
            sku: item.product.sku,
            imageUrl: primaryImage || "",
          };
        }),
      };
      const response = await apiRequest("POST", "/api/orders", orderData);
      return await response.json();
    },
    onSuccess: async (data: any) => {
      await clearCart();
      // Clear applied coupon after successful order
      localStorage.removeItem("appliedCoupon");
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Order placed successfully!",
        description: `Your order number is ${data.order.orderNumber}`,
      });
      setLocation(`/order-confirmation/${data.order.orderNumber}`);
    },
    onError: (error) => {
      console.error("Order creation error:", error);
      toast({
        title: "Failed to place order",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true);
    
    if (data.paymentMethod === "stripe") {
      toast({
        title: "Stripe Payment",
        description: "Stripe integration coming soon. Please use Cash on Delivery for now.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    createOrderMutation.mutate(data);
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">
          Add some items to your cart before checking out.
        </p>
        <Button asChild>
          <a href="/">Continue Shopping</a>
        </Button>
      </div>
    );
  }

  const subtotal = cartTotal;
  const discount = calculateDiscount();
  const shipping = subtotal >= 500 ? 0 : 99;
  const total = subtotal - discount + shipping;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {!isAuthenticated && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="email@example.com" 
                              {...field}
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Already have an account?{" "}
                      <a href="/api/login" className="text-primary hover:underline">
                        Sign in
                      </a>
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Truck className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-firstname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-lastname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} data-testid="input-address1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apartment, suite, etc. (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-address2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-postal" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="space-y-3"
                          >
                            <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate cursor-pointer">
                              <RadioGroupItem value="stripe" id="stripe" data-testid="radio-stripe" />
                              <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                                <div className="font-medium">Credit Card</div>
                                <p className="text-sm text-muted-foreground">
                                  Pay securely with your credit card
                                </p>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate cursor-pointer">
                              <RadioGroupItem value="cod" id="cod" data-testid="radio-cod" />
                              <Label htmlFor="cod" className="flex-1 cursor-pointer">
                                <div className="font-medium">Cash on Delivery</div>
                                <p className="text-sm text-muted-foreground">
                                  Pay when you receive your order
                                </p>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartItems.map((item) => {
                      const price = item.variant?.price || item.product.salePrice || item.product.price;
                      return (
                        <div key={item.id} className="flex gap-3">
                          <div className="relative">
                            <img
                              src={item.product.images?.[0]?.url || "/placeholder-product.jpg"}
                              alt={item.product.title}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2">{item.product.title}</p>
                            {item.variant && (
                              <p className="text-xs text-muted-foreground">
                                {item.variant.optionValue}
                              </p>
                            )}
                          </div>
                          <p className="text-sm font-medium">
                            {formatCurrency(parseFloat(price as string) * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  {appliedCoupon && (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 p-2 rounded-md border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-300" data-testid="text-checkout-coupon">
                          {appliedCoupon.code}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-green-600 hover:text-destructive"
                        onClick={removeCoupon}
                        type="button"
                        data-testid="button-checkout-remove-coupon"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Discount</span>
                        <span data-testid="text-checkout-discount">-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span data-testid="text-checkout-total">{formatCurrency(total)}</span>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isProcessing}
                    data-testid="button-place-order"
                  >
                    {isProcessing ? "Processing..." : "Place Order"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By placing this order, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
