import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Truck, Package, Tag, X, MapPin, Plus, Check, Loader2, FileText, Gift, Info } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Address, ComboOffer } from "@shared/schema";

const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(1, "Phone number is required"),
  gstNumber: z.string().optional(),
});

const checkoutSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  // Shipping address fields
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(1, "Phone number is required"),
  gstNumber: z.string().optional(),
  saveShippingAddress: z.boolean().default(true),
  // Billing address fields (conditional)
  sameAsBilling: z.boolean().default(true),
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingAddress1: z.string().optional(),
  billingAddress2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  billingPhone: z.string().optional(),
  billingGstNumber: z.string().optional(),
  saveBillingAddress: z.boolean().default(true),
  paymentMethod: z.enum(["stripe", "cod", "razorpay"]),
}).refine((data) => {
  if (!data.sameAsBilling) {
    return data.billingFirstName && data.billingLastName && data.billingAddress1 && 
           data.billingCity && data.billingState && data.billingPostalCode && data.billingCountry;
  }
  return true;
}, {
  message: "Billing address is required when different from shipping",
  path: ["billingAddress1"],
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cartItems, cartTotal, clearCart } = useStore();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  // Shipping address selection
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string | "new" | null>(null);
  const [showNewShippingForm, setShowNewShippingForm] = useState(false);
  // Billing address selection
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | "new" | null>(null);
  const [showNewBillingForm, setShowNewBillingForm] = useState(false);

  // Fetch saved addresses for authenticated users
  const { data: addressData, isLoading: addressesLoading } = useQuery<{ addresses: Address[] }>({
    queryKey: ["/api/addresses"],
    enabled: isAuthenticated,
  });

  const savedAddresses = addressData?.addresses || [];

  // Fetch Razorpay config
  const { data: razorpayConfig } = useQuery<{ enabled: boolean; keyId: string; storeName: string }>({
    queryKey: ["/api/razorpay/config"],
  });

  const isRazorpayEnabled = razorpayConfig?.enabled && razorpayConfig?.keyId;

  // Fetch combo offers to calculate combo discounts
  const { data: comboOffersData } = useQuery<{ offers: ComboOffer[] }>({
    queryKey: ["/api/combo-offers"],
  });

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
      country: "India",
      phone: "",
      gstNumber: "",
      saveShippingAddress: true,
      sameAsBilling: true,
      billingFirstName: "",
      billingLastName: "",
      billingAddress1: "",
      billingAddress2: "",
      billingCity: "",
      billingState: "",
      billingPostalCode: "",
      billingCountry: "India",
      billingPhone: "",
      billingGstNumber: "",
      saveBillingAddress: true,
      paymentMethod: "cod",
    },
  });

  const sameAsBilling = form.watch("sameAsBilling");

  // Function to fill shipping form with address data
  const fillShippingFormWithAddress = (address: Address) => {
    form.setValue("firstName", address.firstName);
    form.setValue("lastName", address.lastName);
    form.setValue("address1", address.address1);
    form.setValue("address2", address.address2 || "");
    form.setValue("city", address.city);
    form.setValue("state", address.state || "");
    form.setValue("postalCode", address.postalCode);
    form.setValue("country", address.country);
    form.setValue("phone", address.phone || "");
    form.setValue("gstNumber", address.gstNumber || "");
  };

  // Function to fill billing form with address data
  const fillBillingFormWithAddress = (address: Address) => {
    form.setValue("billingFirstName", address.firstName);
    form.setValue("billingLastName", address.lastName);
    form.setValue("billingAddress1", address.address1);
    form.setValue("billingAddress2", address.address2 || "");
    form.setValue("billingCity", address.city);
    form.setValue("billingState", address.state || "");
    form.setValue("billingPostalCode", address.postalCode);
    form.setValue("billingCountry", address.country);
    form.setValue("billingPhone", address.phone || "");
    form.setValue("billingGstNumber", address.gstNumber || "");
  };

  // Handle shipping address selection
  const handleSelectShippingAddress = (addressId: string | "new") => {
    setSelectedShippingAddressId(addressId);
    if (addressId === "new") {
      setShowNewShippingForm(true);
      form.setValue("firstName", user?.firstName || "");
      form.setValue("lastName", user?.lastName || "");
      form.setValue("address1", "");
      form.setValue("address2", "");
      form.setValue("city", "");
      form.setValue("state", "");
      form.setValue("postalCode", "");
      form.setValue("country", "India");
      form.setValue("phone", "");
      form.setValue("gstNumber", "");
    } else {
      setShowNewShippingForm(false);
      const selectedAddress = savedAddresses.find(addr => addr.id === addressId);
      if (selectedAddress) {
        fillShippingFormWithAddress(selectedAddress);
      }
    }
  };

  // Handle billing address selection
  const handleSelectBillingAddress = (addressId: string | "new") => {
    setSelectedBillingAddressId(addressId);
    if (addressId === "new") {
      setShowNewBillingForm(true);
      form.setValue("billingFirstName", "");
      form.setValue("billingLastName", "");
      form.setValue("billingAddress1", "");
      form.setValue("billingAddress2", "");
      form.setValue("billingCity", "");
      form.setValue("billingState", "");
      form.setValue("billingPostalCode", "");
      form.setValue("billingCountry", "India");
      form.setValue("billingPhone", "");
      form.setValue("billingGstNumber", "");
    } else {
      setShowNewBillingForm(false);
      const selectedAddress = savedAddresses.find(addr => addr.id === addressId);
      if (selectedAddress) {
        fillBillingFormWithAddress(selectedAddress);
      }
    }
  };

  // Auto-select default addresses when addresses load
  useEffect(() => {
    if (isAuthenticated && savedAddresses.length > 0 && selectedShippingAddressId === null) {
      const defaultShipping = savedAddresses.find(addr => addr.isDefault && addr.type === "shipping") || 
                              savedAddresses.find(addr => addr.isDefault) || 
                              savedAddresses[0];
      if (defaultShipping) {
        setSelectedShippingAddressId(defaultShipping.id);
        fillShippingFormWithAddress(defaultShipping);
      }
    } else if (isAuthenticated && savedAddresses.length === 0 && !addressesLoading) {
      setShowNewShippingForm(true);
      setSelectedShippingAddressId("new");
    }
  }, [isAuthenticated, savedAddresses, addressesLoading, selectedShippingAddressId]);

  // Mutation to save new address
  const saveAddressMutation = useMutation({
    mutationFn: async (addressData: {
      type: string;
      firstName: string;
      lastName: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      phone?: string;
      gstNumber?: string;
      isDefault?: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/addresses", addressData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
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
        gstNumber: data.gstNumber || "",
      };

      const billingAddress = data.sameAsBilling ? shippingAddress : {
        name: `${data.billingFirstName} ${data.billingLastName}`,
        line1: data.billingAddress1 || "",
        line2: data.billingAddress2 || "",
        city: data.billingCity || "",
        state: data.billingState || "",
        postalCode: data.billingPostalCode || "",
        country: data.billingCountry || "",
        phone: data.billingPhone || "",
        gstNumber: data.billingGstNumber || "",
      };
      
      const orderData = {
        guestEmail: !isAuthenticated ? data.email : undefined,
        paymentMethod: data.paymentMethod,
        shippingAddress,
        billingAddress,
        couponCode: appliedCoupon?.code,
        comboDiscount: comboDiscount,
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
            gstRate: (item.product as any).gstRate || "18",
          };
        }),
      };
      const response = await apiRequest("POST", "/api/orders", orderData);
      return await response.json();
    },
    onSuccess: async (data: any) => {
      await clearCart();
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

  // Razorpay payment handler - amount is computed server-side for security
  const handleRazorpayPayment = async (data: CheckoutFormData) => {
    try {
      // Check Razorpay config is available
      if (!isRazorpayEnabled || !razorpayConfig?.keyId) {
        throw new Error("Razorpay is not configured");
      }

      // Load Razorpay script first if not already loaded
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay. Please check your internet connection."));
          document.body.appendChild(script);
        });
      }

      // Create Razorpay order - server computes amount from cart
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currency: "INR",
          couponCode: appliedCoupon?.code,
          comboDiscount: comboDiscount,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      // Open Razorpay checkout
      const options = {
        key: razorpayConfig.keyId,
        amount: orderData.amount, // Already in paise from server
        currency: orderData.currency,
        name: razorpayConfig.storeName || "19Dogs",
        description: "Order Payment",
        order_id: orderData.orderId,
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(response),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Payment verified, create the order with Razorpay payment info
              await createOrderMutation.mutateAsync({
                ...data,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
              } as any);
            } else {
              toast({
                title: "Payment verification failed",
                description: "Please contact support if amount was deducted.",
                variant: "destructive",
              });
              setIsProcessing(false);
            }
          } catch (error) {
            toast({
              title: "Payment verification error",
              description: "Please contact support.",
              variant: "destructive",
            });
            setIsProcessing(false);
          }
        },
        prefill: {
          name: `${data.firstName} ${data.lastName}`,
          email: user?.email || data.email,
          contact: data.phone,
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast({
              title: "Payment cancelled",
              description: "You can try again when ready.",
            });
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast({
          title: "Payment failed",
          description: response.error?.description || "Please try again.",
          variant: "destructive",
        });
        setIsProcessing(false);
      });
      rzp.open();
    } catch (error: any) {
      toast({
        title: "Payment error",
        description: error.message || "Failed to initialize payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true);
    
    if (data.paymentMethod === "stripe") {
      toast({
        title: "Stripe Payment",
        description: "Stripe integration coming soon. Please use Cash on Delivery or Razorpay.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    if (data.paymentMethod === "razorpay") {
      // Handle Razorpay payment - amount computed server-side
      await handleRazorpayPayment(data);
      return;
    }

    // Save new shipping address if authenticated and "save" is checked
    if (isAuthenticated && selectedShippingAddressId === "new" && data.saveShippingAddress) {
      try {
        await saveAddressMutation.mutateAsync({
          type: "shipping",
          firstName: data.firstName,
          lastName: data.lastName,
          address1: data.address1,
          address2: data.address2,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          phone: data.phone,
          gstNumber: data.gstNumber,
          isDefault: savedAddresses.length === 0,
        });
      } catch (error) {
        console.error("Failed to save shipping address:", error);
      }
    }

    // Save new billing address if different from shipping and authenticated
    if (isAuthenticated && !data.sameAsBilling && selectedBillingAddressId === "new" && data.saveBillingAddress) {
      try {
        await saveAddressMutation.mutateAsync({
          type: "billing",
          firstName: data.billingFirstName || "",
          lastName: data.billingLastName || "",
          address1: data.billingAddress1 || "",
          address2: data.billingAddress2,
          city: data.billingCity || "",
          state: data.billingState || "",
          postalCode: data.billingPostalCode || "",
          country: data.billingCountry || "",
          phone: data.billingPhone,
          gstNumber: data.billingGstNumber,
          isDefault: false,
        });
      } catch (error) {
        console.error("Failed to save billing address:", error);
      }
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
  const couponDiscount = calculateDiscount();
  const shipping = subtotal >= 500 ? 0 : 99;
  const total = subtotal - couponDiscount - comboDiscount + shipping;

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
                  {/* Shipping Address Selection for Authenticated Users */}
                  {isAuthenticated && (
                    <div className="space-y-3">
                      {addressesLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading saved addresses...</span>
                        </div>
                      ) : savedAddresses.length > 0 ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">Select a saved address or enter a new one:</p>
                          <div className="grid gap-3">
                            {savedAddresses.map((address) => (
                              <div
                                key={address.id}
                                onClick={() => handleSelectShippingAddress(address.id)}
                                className={`relative border rounded-lg p-4 cursor-pointer transition-all hover-elevate ${
                                  selectedShippingAddressId === address.id
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "border-border"
                                }`}
                                data-testid={`shipping-address-option-${address.id}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium">{address.firstName} {address.lastName}</span>
                                      {address.isDefault && (
                                        <Badge variant="secondary" className="text-xs">Default</Badge>
                                      )}
                                      {address.type && (
                                        <Badge variant="outline" className="text-xs capitalize">{address.type}</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {address.address1}
                                      {address.address2 && `, ${address.address2}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {address.city}, {address.state} {address.postalCode}
                                    </p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                      {user?.email && (
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                      )}
                                      {address.phone && (
                                        <p className="text-sm text-muted-foreground">{address.phone}</p>
                                      )}
                                    </div>
                                    {address.gstNumber && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        <span className="font-medium">GST:</span> {address.gstNumber}
                                      </p>
                                    )}
                                  </div>
                                  {selectedShippingAddressId === address.id && (
                                    <div className="shrink-0">
                                      <Check className="h-5 w-5 text-primary" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {/* Option to add new shipping address */}
                            <div
                              onClick={() => handleSelectShippingAddress("new")}
                              className={`relative border rounded-lg p-4 cursor-pointer transition-all hover-elevate ${
                                selectedShippingAddressId === "new"
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-dashed border-border"
                              }`}
                              data-testid="shipping-address-option-new"
                            >
                              <div className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Use a different address</span>
                              </div>
                            </div>
                          </div>
                          
                          {selectedShippingAddressId !== "new" && (
                            <Separator className="my-4" />
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground mb-4">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          No saved addresses. Enter your shipping address below.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show shipping address form for: guests, or when "new address" is selected, or when no saved addresses */}
                  {(!isAuthenticated || showNewShippingForm || savedAddresses.length === 0) && (
                    <>
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
                                <SelectItem value="India">India</SelectItem>
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

                      <FormField
                        control={form.control}
                        name="gstNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST Number (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 22AAAAA0000A1Z5" {...field} data-testid="input-gst-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {isAuthenticated && (
                        <FormField
                          control={form.control}
                          name="saveShippingAddress"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-save-shipping"
                                />
                              </FormControl>
                              <FormLabel className="font-normal">Save this address to my account</FormLabel>
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Billing Address Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="sameAsBilling"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="font-medium">Same as shipping address</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Use the shipping address for billing
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-same-billing"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Show billing address selection/form when different from shipping */}
                  {!sameAsBilling && (
                    <>
                      {/* Billing Address Selection for Authenticated Users */}
                      {isAuthenticated && savedAddresses.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">Select a billing address or enter a new one:</p>
                          <div className="grid gap-3">
                            {savedAddresses.map((address) => (
                              <div
                                key={address.id}
                                onClick={() => handleSelectBillingAddress(address.id)}
                                className={`relative border rounded-lg p-4 cursor-pointer transition-all hover-elevate ${
                                  selectedBillingAddressId === address.id
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "border-border"
                                }`}
                                data-testid={`billing-address-option-${address.id}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium">{address.firstName} {address.lastName}</span>
                                      {address.type && (
                                        <Badge variant="outline" className="text-xs capitalize">{address.type}</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {address.address1}, {address.city}, {address.state} {address.postalCode}
                                    </p>
                                    {address.gstNumber && (
                                      <p className="text-sm text-muted-foreground">
                                        <span className="font-medium">GST:</span> {address.gstNumber}
                                      </p>
                                    )}
                                  </div>
                                  {selectedBillingAddressId === address.id && (
                                    <Check className="h-5 w-5 text-primary shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            <div
                              onClick={() => handleSelectBillingAddress("new")}
                              className={`relative border rounded-lg p-4 cursor-pointer transition-all hover-elevate ${
                                selectedBillingAddressId === "new"
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-dashed border-border"
                              }`}
                              data-testid="billing-address-option-new"
                            >
                              <div className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Enter a new billing address</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Billing Address Form */}
                      {(!isAuthenticated || showNewBillingForm || savedAddresses.length === 0) && (
                        <>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="billingFirstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-billing-firstname" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="billingLastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-billing-lastname" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="billingAddress1"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="Street address" {...field} data-testid="input-billing-address1" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="billingAddress2"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Apartment, suite, etc. (optional)</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-billing-address2" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid sm:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="billingCity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-billing-city" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="billingState"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-billing-state" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="billingPostalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Postal Code</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-billing-postal" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="billingCountry"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-billing-country">
                                      <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="India">India</SelectItem>
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
                            name="billingPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone (optional)</FormLabel>
                                <FormControl>
                                  <Input type="tel" {...field} data-testid="input-billing-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="billingGstNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>GST Number (optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 22AAAAA0000A1Z5" {...field} data-testid="input-billing-gst" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {isAuthenticated && (
                            <FormField
                              control={form.control}
                              name="saveBillingAddress"
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      data-testid="switch-save-billing"
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">Save this billing address to my account</FormLabel>
                                </FormItem>
                              )}
                            />
                          )}
                        </>
                      )}
                    </>
                  )}
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
                            {isRazorpayEnabled && (
                              <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate cursor-pointer">
                                <RadioGroupItem value="razorpay" id="razorpay" data-testid="radio-razorpay" />
                                <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Razorpay</div>
                                  <p className="text-sm text-muted-foreground">
                                    Pay via UPI, Cards, Net Banking, Wallets
                                  </p>
                                </Label>
                              </div>
                            )}
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
                    {comboDiscount > 0 && (
                      <div className="flex justify-between text-sm text-purple-600 dark:text-purple-400">
                        <span className="flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          Combo Discount
                        </span>
                        <span data-testid="text-checkout-combo-discount">-{formatCurrency(comboDiscount)}</span>
                      </div>
                    )}
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Coupon Discount</span>
                        <span data-testid="text-checkout-discount">-{formatCurrency(couponDiscount)}</span>
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
                    <span data-testid="text-checkout-included-gst">{formatCurrency(includedGst)}</span>
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
