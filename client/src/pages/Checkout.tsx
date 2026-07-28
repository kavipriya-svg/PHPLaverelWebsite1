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
import type { Address, ComboOffer, User, SubscriptionCategoryDiscount, SubscriptionDeliveryTier } from "@shared/schema";
import { format } from "date-fns";

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

  const isSubscriptionCustomer = user?.customerType === 'subscription';

  // Fetch delivery tiers for subscription customers
  const { data: deliveryTiersData } = useQuery<{ tiers: SubscriptionDeliveryTier[] }>({
    queryKey: ["/api/subscription-delivery-tiers"],
    enabled: isSubscriptionCustomer,
  });

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

  // Watch shipping city to determine Chennai vs PAN India rates
  const shippingCity = form.watch("city");
  
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
    let totalShipping = 0;
    // Determine if Chennai based on shipping city (case-insensitive match)
    const isChennai = shippingCity?.toLowerCase().includes('chennai') || false;
    
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
      isChennai,
    };
  }, [cartItems, isSubscriptionCustomer, deliveryTiersData, shippingCity]);

  // Calculate subscription-adjusted cart totals
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
      
      // For subscription customers, always include delivery dates per item and shipping breakdown
      const subscriptionShipping = isSubscriptionCustomer
        ? {
            isSubscriptionDelivery: true,
            isChennai: deliveryDateShipping.isChennai,
            shippingBreakdown: Array.from(deliveryDateShipping.groups.entries()).map(([date, group]) => ({
              deliveryDate: date === 'unassigned' ? null : date,
              totalWeight: group.totalWeight,
              shippingFee: group.shippingFee,
              itemCount: group.items.length,
            })),
            totalShipping: deliveryDateShipping.totalShipping,
          }
        : null;

      const orderData = {
        guestEmail: !isAuthenticated ? data.email : undefined,
        paymentMethod: data.paymentMethod,
        shippingAddress,
        billingAddress,
        couponCode: appliedCoupon?.code,
        comboDiscount: comboDiscount,
        subscriptionShipping, // Include per-date shipping breakdown for subscription customers
        items: cartItems.map(item => {
          const basePrice = item.variant?.price || item.product.price;
          const salePrice = item.variant?.salePrice || item.product.salePrice;
          const itemSubPricing = subscriptionPricing.itemPrices.get(item.id);
          const unitPrice = itemSubPricing 
            ? (itemSubPricing.finalPrice / item.quantity).toFixed(2)
            : (item.variant?.price || item.product.salePrice || item.product.price);
          const primaryImage = item.product.images?.find(img => img.isPrimary)?.url || item.product.images?.[0]?.url;
          return {
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: unitPrice,
            title: item.product.title,
            sku: item.product.sku,
            imageUrl: primaryImage || "",
            gstRate: (item.product as any).gstRate || "18",
            deliveryDate: isSubscriptionCustomer ? ((item as any).deliveryDate || null) : null, // Include delivery date per item
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
      <div className="min-h-screen bg-[#f9faf6] flex flex-col items-center justify-center gap-6 px-4">
        <p className="font-bold tracking-[0.2em] uppercase text-[#00160c] text-xl">Your Cart Is Empty</p>
        <p className="text-sm text-[#00160c]/60 uppercase tracking-widest">No items to finalize. Return to the catalog.</p>
        <a
          href="/"
          className="inline-flex items-center gap-3 bg-[#00160c] text-white px-8 py-4 text-xs tracking-[0.2em] uppercase font-bold hover:bg-[#012d1d] transition-colors"
          data-testid="link-continue-shopping"
        >
          Return to Catalog
        </a>
      </div>
    );
  }

  const subtotal = isSubscriptionCustomer ? subscriptionPricing.adjustedTotal : cartTotal;
  const couponDiscount = calculateDiscount();
  const shipping = isSubscriptionCustomer
    ? deliveryDateShipping.totalShipping
    : (subtotal >= 500 ? 0 : 99);
  const total = subtotal - couponDiscount - comboDiscount + shipping;

  const inputCls = "w-full bg-transparent border-0 border-b border-[#00160c]/25 rounded-none px-0 py-2 text-sm text-[#00160c] placeholder:text-[#00160c]/30 focus:outline-none focus:border-[#944923] transition-colors";
  const labelCls = "block text-[10px] tracking-[0.15em] uppercase text-[#00160c]/50 mb-1 font-medium";
  const sectionHeadingCls = "text-xs tracking-[0.25em] uppercase font-bold text-[#00160c] border-b border-[#00160c]/10 pb-3 mb-6";

  return (
    <div className="min-h-screen bg-[#f9faf6] flex flex-col">
      {/* Checkout Header */}
      <header className="sticky top-0 z-50 bg-[#f9faf6] border-b border-[#00160c]/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16 py-4 flex items-center justify-between gap-4">
          <a href="/" className="font-black tracking-[-0.05em] text-[#00160c] text-xl uppercase" data-testid="link-header-logo">
            19 Dogs
          </a>
          <div className="flex-1 max-w-md hidden md:block">
            <div className="text-[9px] tracking-[0.2em] uppercase text-[#00160c]/40 mb-1.5">
              Protocol Status / Stage 2/3: Finalization
            </div>
            <div className="h-[2px] bg-[#00160c]/10 relative">
              <div className="absolute left-0 top-0 h-full bg-[#944923] transition-all" style={{ width: "66%" }} />
            </div>
          </div>
          <a href="/cart" className="text-[10px] tracking-[0.15em] uppercase text-[#00160c]/50 hover:text-[#00160c] transition-colors flex items-center gap-2" data-testid="link-back-to-cart">
            <X className="h-3.5 w-3.5" />
            Cancel
          </a>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 lg:px-16 py-12 grid grid-cols-12 gap-8 lg:gap-16 items-start">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="col-span-12 lg:col-span-7 flex flex-col gap-12">

            {/* Contact Info */}
            {!isAuthenticated && (
              <section>
                <div className={sectionHeadingCls}>Contact Information</div>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <label className={labelCls}>Email Address</label>
                        <FormControl>
                          <input
                            type="email"
                            placeholder="operative@domain.com"
                            className={inputCls}
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] text-red-600 mt-1" />
                      </FormItem>
                    )}
                  />
                  <p className="text-[10px] tracking-[0.1em] uppercase text-[#00160c]/40">
                    Already registered?{" "}
                    <a href="/api/login" className="text-[#944923] hover:underline">
                      Authenticate here
                    </a>
                  </p>
                </div>
              </section>
            )}

            {/* Shipping Address */}
            <section>
              <div className={sectionHeadingCls}>Shipping Address</div>

              {/* Saved addresses for authenticated users */}
              {isAuthenticated && (
                <div className="mb-6">
                  {addressesLoading ? (
                    <div className="flex items-center gap-2 py-4 text-[#00160c]/40">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-[10px] tracking-[0.1em] uppercase">Loading protocols...</span>
                    </div>
                  ) : savedAddresses.length > 0 ? (
                    <div className="space-y-2 mb-6">
                      <p className="text-[10px] tracking-[0.1em] uppercase text-[#00160c]/50 mb-3">Select saved address or enter new:</p>
                      {savedAddresses.map((address) => (
                        <div
                          key={address.id}
                          onClick={() => handleSelectShippingAddress(address.id)}
                          className={`border p-4 cursor-pointer transition-colors ${
                            selectedShippingAddressId === address.id
                              ? "border-[#944923] bg-[#944923]/5"
                              : "border-[#00160c]/15 hover:border-[#00160c]/30"
                          }`}
                          data-testid={`shipping-address-option-${address.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#00160c] uppercase tracking-wide">
                                {address.firstName} {address.lastName}
                                {address.isDefault && <span className="ml-2 text-[9px] text-[#944923] normal-case tracking-normal font-normal">Default</span>}
                              </p>
                              <p className="text-[11px] text-[#00160c]/50 mt-0.5">
                                {address.address1}{address.address2 && `, ${address.address2}`}, {address.city}, {address.state} {address.postalCode}
                              </p>
                            </div>
                            {selectedShippingAddressId === address.id && (
                              <Check className="h-4 w-4 text-[#944923] shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                      <div
                        onClick={() => handleSelectShippingAddress("new")}
                        className={`border border-dashed p-4 cursor-pointer transition-colors flex items-center gap-2 ${
                          selectedShippingAddressId === "new"
                            ? "border-[#944923] bg-[#944923]/5"
                            : "border-[#00160c]/20 hover:border-[#00160c]/40"
                        }`}
                        data-testid="shipping-address-option-new"
                      >
                        <Plus className="h-3.5 w-3.5 text-[#00160c]/40" />
                        <span className="text-[10px] tracking-[0.15em] uppercase text-[#00160c]/50">Use different address</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] tracking-[0.1em] uppercase text-[#00160c]/40 mb-4 flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      No saved addresses. Enter below.
                    </p>
                  )}
                </div>
              )}

              {/* Address form */}
              {(!isAuthenticated || showNewShippingForm || savedAddresses.length === 0) && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                      <FormItem>
                        <label className={labelCls}>First Name</label>
                        <FormControl><input className={inputCls} data-testid="input-firstname" {...field} /></FormControl>
                        <FormMessage className="text-[10px] text-red-600 mt-1" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                      <FormItem>
                        <label className={labelCls}>Last Name</label>
                        <FormControl><input className={inputCls} data-testid="input-lastname" {...field} /></FormControl>
                        <FormMessage className="text-[10px] text-red-600 mt-1" />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="address1" render={({ field }) => (
                    <FormItem>
                      <label className={labelCls}>Street Address</label>
                      <FormControl><input className={inputCls} placeholder="Unit / Building / Street" data-testid="input-address1" {...field} /></FormControl>
                      <FormMessage className="text-[10px] text-red-600 mt-1" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address2" render={({ field }) => (
                    <FormItem>
                      <label className={labelCls}>Apt / Suite / Floor (optional)</label>
                      <FormControl><input className={inputCls} data-testid="input-address2" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <label className={labelCls}>City</label>
                        <FormControl><input className={inputCls} data-testid="input-city" {...field} /></FormControl>
                        <FormMessage className="text-[10px] text-red-600 mt-1" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="state" render={({ field }) => (
                      <FormItem>
                        <label className={labelCls}>State</label>
                        <FormControl><input className={inputCls} data-testid="input-state" {...field} /></FormControl>
                        <FormMessage className="text-[10px] text-red-600 mt-1" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="postalCode" render={({ field }) => (
                      <FormItem>
                        <label className={labelCls}>Postal Code</label>
                        <FormControl><input className={inputCls} data-testid="input-postal" {...field} /></FormControl>
                        <FormMessage className="text-[10px] text-red-600 mt-1" />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <label className={labelCls}>Country</label>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="bg-transparent border-0 border-b border-[#00160c]/25 rounded-none px-0 py-2 text-sm text-[#00160c] focus:ring-0 focus:border-[#944923]" data-testid="select-country">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="India">India</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="text-[10px] text-red-600 mt-1" />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-6">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <label className={labelCls}>Phone</label>
                        <FormControl><input type="tel" className={inputCls} data-testid="input-phone" {...field} /></FormControl>
                        <FormMessage className="text-[10px] text-red-600 mt-1" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="gstNumber" render={({ field }) => (
                      <FormItem>
                        <label className={labelCls}>GST Number (optional)</label>
                        <FormControl><input className={inputCls} placeholder="22AAAAA0000A1Z5" data-testid="input-gst-number" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  {isAuthenticated && (
                    <FormField control={form.control} name="saveShippingAddress" render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-save-shipping" />
                        </FormControl>
                        <label className={`${labelCls} mb-0 cursor-pointer`}>Save address to account</label>
                      </FormItem>
                    )} />
                  )}
                </div>
              )}
            </section>

            {/* Billing Address */}
            <section>
              <div className={sectionHeadingCls}>Billing Address</div>
              <FormField control={form.control} name="sameAsBilling" render={({ field }) => (
                <FormItem className="flex items-center gap-3 mb-6">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-same-billing" />
                  </FormControl>
                  <label className={`${labelCls} mb-0 cursor-pointer`}>Same as shipping address</label>
                </FormItem>
              )} />

              {!sameAsBilling && (
                <>
                  {isAuthenticated && savedAddresses.length > 0 && (
                    <div className="space-y-2 mb-6">
                      <p className="text-[10px] tracking-[0.1em] uppercase text-[#00160c]/50 mb-3">Select billing address:</p>
                      {savedAddresses.map((address) => (
                        <div
                          key={address.id}
                          onClick={() => handleSelectBillingAddress(address.id)}
                          className={`border p-4 cursor-pointer transition-colors ${
                            selectedBillingAddressId === address.id
                              ? "border-[#944923] bg-[#944923]/5"
                              : "border-[#00160c]/15 hover:border-[#00160c]/30"
                          }`}
                          data-testid={`billing-address-option-${address.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-[#00160c] uppercase tracking-wide">{address.firstName} {address.lastName}</p>
                              <p className="text-[11px] text-[#00160c]/50 mt-0.5">{address.address1}, {address.city}, {address.state} {address.postalCode}</p>
                            </div>
                            {selectedBillingAddressId === address.id && <Check className="h-4 w-4 text-[#944923] shrink-0" />}
                          </div>
                        </div>
                      ))}
                      <div
                        onClick={() => handleSelectBillingAddress("new")}
                        className={`border border-dashed p-4 cursor-pointer flex items-center gap-2 transition-colors ${
                          selectedBillingAddressId === "new" ? "border-[#944923] bg-[#944923]/5" : "border-[#00160c]/20 hover:border-[#00160c]/40"
                        }`}
                        data-testid="billing-address-option-new"
                      >
                        <Plus className="h-3.5 w-3.5 text-[#00160c]/40" />
                        <span className="text-[10px] tracking-[0.15em] uppercase text-[#00160c]/50">New billing address</span>
                      </div>
                    </div>
                  )}

                  {(!isAuthenticated || showNewBillingForm || savedAddresses.length === 0) && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <FormField control={form.control} name="billingFirstName" render={({ field }) => (
                          <FormItem>
                            <label className={labelCls}>First Name</label>
                            <FormControl><input className={inputCls} data-testid="input-billing-firstname" {...field} /></FormControl>
                            <FormMessage className="text-[10px] text-red-600 mt-1" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="billingLastName" render={({ field }) => (
                          <FormItem>
                            <label className={labelCls}>Last Name</label>
                            <FormControl><input className={inputCls} data-testid="input-billing-lastname" {...field} /></FormControl>
                            <FormMessage className="text-[10px] text-red-600 mt-1" />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="billingAddress1" render={({ field }) => (
                        <FormItem>
                          <label className={labelCls}>Street Address</label>
                          <FormControl><input className={inputCls} placeholder="Street address" data-testid="input-billing-address1" {...field} /></FormControl>
                          <FormMessage className="text-[10px] text-red-600 mt-1" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="billingAddress2" render={({ field }) => (
                        <FormItem>
                          <label className={labelCls}>Apt / Suite (optional)</label>
                          <FormControl><input className={inputCls} data-testid="input-billing-address2" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="billingCity" render={({ field }) => (
                          <FormItem>
                            <label className={labelCls}>City</label>
                            <FormControl><input className={inputCls} data-testid="input-billing-city" {...field} /></FormControl>
                            <FormMessage className="text-[10px] text-red-600 mt-1" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="billingState" render={({ field }) => (
                          <FormItem>
                            <label className={labelCls}>State</label>
                            <FormControl><input className={inputCls} data-testid="input-billing-state" {...field} /></FormControl>
                            <FormMessage className="text-[10px] text-red-600 mt-1" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="billingPostalCode" render={({ field }) => (
                          <FormItem>
                            <label className={labelCls}>Postal Code</label>
                            <FormControl><input className={inputCls} data-testid="input-billing-postal" {...field} /></FormControl>
                            <FormMessage className="text-[10px] text-red-600 mt-1" />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="billingCountry" render={({ field }) => (
                        <FormItem>
                          <label className={labelCls}>Country</label>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger className="bg-transparent border-0 border-b border-[#00160c]/25 rounded-none px-0 py-2 text-sm text-[#00160c] focus:ring-0 focus:border-[#944923]" data-testid="select-billing-country">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="India">India</SelectItem>
                                <SelectItem value="US">United States</SelectItem>
                                <SelectItem value="CA">Canada</SelectItem>
                                <SelectItem value="GB">United Kingdom</SelectItem>
                                <SelectItem value="AU">Australia</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage className="text-[10px] text-red-600 mt-1" />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-6">
                        <FormField control={form.control} name="billingPhone" render={({ field }) => (
                          <FormItem>
                            <label className={labelCls}>Phone (optional)</label>
                            <FormControl><input type="tel" className={inputCls} data-testid="input-billing-phone" {...field} /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="billingGstNumber" render={({ field }) => (
                          <FormItem>
                            <label className={labelCls}>GST Number (optional)</label>
                            <FormControl><input className={inputCls} placeholder="22AAAAA0000A1Z5" data-testid="input-billing-gst" {...field} /></FormControl>
                          </FormItem>
                        )} />
                      </div>
                      {isAuthenticated && (
                        <FormField control={form.control} name="saveBillingAddress" render={({ field }) => (
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-save-billing" />
                            </FormControl>
                            <label className={`${labelCls} mb-0 cursor-pointer`}>Save billing address to account</label>
                          </FormItem>
                        )} />
                      )}
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Payment Method */}
            <section>
              <div className={sectionHeadingCls}>Payment Method</div>
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-3">
                        {/* Pay Online (Stripe) */}
                        <label className={`flex items-start gap-5 p-6 border cursor-pointer group transition-colors ${field.value === "stripe" ? "border-[#944923] bg-[#944923]/5" : "border-[#00160c]/15 hover:border-[#00160c]/30"}`}>
                          <RadioGroupItem value="stripe" id="stripe" className="mt-0.5" data-testid="radio-stripe" />
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#00160c]">Pay Online</span>
                              <CreditCard className="h-4 w-4 text-[#00160c]/40" />
                            </div>
                            <p className="text-[11px] text-[#00160c]/50">Pay securely with your credit card</p>
                          </div>
                        </label>

                        {/* Razorpay */}
                        {isRazorpayEnabled && (
                          <label className={`flex items-start gap-5 p-6 border cursor-pointer group transition-colors ${field.value === "razorpay" ? "border-[#944923] bg-[#944923]/5" : "border-[#00160c]/15 hover:border-[#00160c]/30"}`}>
                            <RadioGroupItem value="razorpay" id="razorpay" className="mt-0.5" data-testid="radio-razorpay" />
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#00160c]">Razorpay</span>
                                <Package className="h-4 w-4 text-[#00160c]/40" />
                              </div>
                              <p className="text-[11px] text-[#00160c]/50">UPI, Cards, Net Banking, Wallets</p>
                            </div>
                          </label>
                        )}

                        {/* COD */}
                        <label className={`flex items-start gap-5 p-6 border cursor-pointer group transition-colors ${field.value === "cod" ? "border-[#944923] bg-[#944923]/5" : "border-[#00160c]/15 hover:border-[#00160c]/30"}`}>
                          <RadioGroupItem value="cod" id="cod" className="mt-0.5" data-testid="radio-cod" />
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#00160c]">Cash on Delivery</span>
                              <Truck className="h-4 w-4 text-[#00160c]/40" />
                            </div>
                            <p className="text-[11px] text-[#00160c]/50">Pay when you receive your order</p>
                          </div>
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-[10px] text-red-600 mt-2" />
                  </FormItem>
                )}
              />
            </section>

            {/* Place Order Button (mobile / form footer) */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#00160c] text-white py-5 px-10 text-xs tracking-[0.25em] uppercase font-bold hover:bg-[#012d1d] transition-all flex justify-between items-center disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="button-place-order"
              >
                {isProcessing ? "Processing Protocol..." : "Place Order"}
                {!isProcessing && <span className="text-lg">&#8594;</span>}
              </button>
              <p className="text-[9px] text-center text-[#00160c]/40 tracking-[0.1em] uppercase">
                By placing this order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </form>

          {/* Right Column: Protocol Dossier */}
          <div className="col-span-12 lg:col-span-5 lg:sticky lg:top-32">
            <div
              className="bg-[#edf0eb] border border-[#00160c]/10 p-8 flex flex-col gap-8"
              style={{ boxShadow: "45px 26px 0px 0px rgba(1,45,29,0.08)" }}
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-black uppercase tracking-tight text-[#00160c]">Protocol Dossier</h3>
                <span className="text-[10px] tracking-[0.15em] bg-[#944923]/15 text-[#944923] px-3 py-1 uppercase font-bold">V.01-REV</span>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-6">
                {cartItems.map((item) => {
                  const price = item.variant?.price || item.product.salePrice || item.product.price;
                  const itemSubscriptionPricing = subscriptionPricing.itemPrices.get(item.id);
                  const displayPrice = itemSubscriptionPricing?.finalPrice ?? (parseFloat(price as string) * item.quantity);
                  const hasItemSubscriptionDiscount = itemSubscriptionPricing?.hasDiscount ?? false;
                  const primaryImage = item.product.images?.find(img => img.isPrimary)?.url || item.product.images?.[0]?.url;

                  return (
                    <div key={item.id} className="flex gap-4 group cursor-default" data-testid={`checkout-item-${item.id}`}>
                      <div className="w-20 h-24 bg-[#dde0db] overflow-hidden flex-shrink-0">
                        <img
                          src={primaryImage || "/placeholder-product.jpg"}
                          alt={item.product.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        />
                      </div>
                      <div className="flex flex-col justify-between py-1 flex-1">
                        <div>
                          <span className="text-[9px] text-white bg-[#00160c] px-2 py-0.5 mb-1 inline-block uppercase tracking-widest">
                            {item.product.sku ? `ID: ${item.product.sku}` : "19D-ITEM"}
                          </span>
                          <h4 className="text-sm font-bold text-[#00160c] leading-tight">
                            {item.quantity}x {item.product.title}
                          </h4>
                          {item.variant && (
                            <p className="text-[10px] text-[#00160c]/50 mt-0.5">{item.variant.optionValue}</p>
                          )}
                          <p className="text-[10px] text-[#00160c]/40 uppercase tracking-widest">Qty: {item.quantity} Unit</p>
                        </div>
                        <div className="flex items-end justify-between">
                          {hasItemSubscriptionDiscount ? (
                            <div>
                              <span className="text-sm font-bold text-[#00160c]">{formatCurrency(displayPrice)}</span>
                              <span className="text-[10px] text-[#00160c]/40 line-through ml-2">{formatCurrency(itemSubscriptionPricing?.originalPrice ?? 0)}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-[#00160c]">{formatCurrency(displayPrice)}</span>
                          )}
                          {hasItemSubscriptionDiscount && (
                            <span className="text-[9px] bg-[#944923]/15 text-[#944923] px-2 py-0.5 uppercase tracking-widest">Sub Price</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="h-px bg-[#00160c]/10 w-full" />

              {/* Coupon badge */}
              {appliedCoupon && (
                <div className="flex items-center justify-between border border-[#944923]/30 bg-[#944923]/5 p-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-[#944923]" />
                    <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-[#944923]" data-testid="text-checkout-coupon">{appliedCoupon.code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-[#944923] hover:text-[#00160c] transition-colors"
                    data-testid="button-checkout-remove-coupon"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-[#00160c]/50">Subtotal</span>
                  <span className="text-sm text-[#00160c] font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {subscriptionPricing.subscriptionDiscount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-[#944923]">Subscription Savings</span>
                    <span className="text-sm text-[#944923] font-medium" data-testid="text-checkout-subscription-discount">-{formatCurrency(subscriptionPricing.subscriptionDiscount)}</span>
                  </div>
                )}
                {comboDiscount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-[#944923]">Combo Discount</span>
                    <span className="text-sm text-[#944923] font-medium" data-testid="text-checkout-combo-discount">-{formatCurrency(comboDiscount)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-[#944923]">Coupon Discount</span>
                    <span className="text-sm text-[#944923] font-medium" data-testid="text-checkout-discount">-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                {isSubscriptionCustomer && deliveryDateShipping.hasMultipleDeliveryDates ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-[#00160c]/50">Shipping (multi-date)</span>
                      <span className="text-sm text-[#00160c] font-medium">{shipping === 0 ? "FREE" : formatCurrency(shipping)}</span>
                    </div>
                    {Array.from(deliveryDateShipping.groups.entries()).map(([date, group]) => (
                      <div key={date} className="flex justify-between items-center pl-3 border-l border-[#00160c]/10">
                        <span className="text-[9px] tracking-[0.1em] uppercase text-[#00160c]/40">
                          {date === 'unassigned' ? 'No date' : format(new Date(date), 'MMM d, yyyy')} ({group.totalWeight.toFixed(1)}kg)
                        </span>
                        <span className="text-[11px] text-[#00160c]/60">{group.shippingFee === 0 ? "Free" : formatCurrency(group.shippingFee)}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-[#00160c]/50">Shipping</span>
                    <span className="text-sm font-bold text-[#00160c]">{shipping === 0 ? "FREE" : formatCurrency(shipping)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-[#00160c]/50">Incl. GST</span>
                  <span className="text-[11px] text-[#00160c]/60" data-testid="text-checkout-included-gst">{formatCurrency(includedGst)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 mt-2 border-t-2 border-[#00160c]">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[9px] tracking-[0.15em] bg-[#00160c] text-white px-2 py-1 mb-2 inline-block uppercase">Total_Allocation</span>
                    <div className="text-4xl font-black text-[#00160c] leading-none" data-testid="text-checkout-total">
                      {formatCurrency(total)}
                    </div>
                  </div>
                  <span className="text-[9px] text-[#00160c]/40 tracking-widest mb-1">INR (SECURE)</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="border border-[#00160c]/15 bg-[#f9faf6] p-4 flex gap-4 items-center">
                <div className="shrink-0 w-6 h-6 text-[#00160c]">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#00160c] uppercase tracking-wide">19 Dogs Quantum Encryption</div>
                  <div className="text-[9px] text-[#00160c]/40 leading-tight uppercase tracking-wide mt-0.5">Biometric and financial data handled under ISO-9001 biological security standards.</div>
                </div>
              </div>
            </div>

            {/* Support links */}
            <div className="mt-4 flex justify-between px-2">
              <button type="button" className="flex items-center gap-2 text-[10px] text-[#00160c]/40 hover:text-[#00160c] transition-colors uppercase tracking-widest">
                <Info className="h-3.5 w-3.5" />
                Technical Assistance
              </button>
              <button type="button" className="flex items-center gap-2 text-[10px] text-[#00160c]/40 hover:text-[#00160c] transition-colors uppercase tracking-widest">
                <FileText className="h-3.5 w-3.5" />
                Protocol Archive
              </button>
            </div>
          </div>
        </Form>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#012d1d] text-white py-10 border-t border-white/5 mt-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16 grid grid-cols-12 gap-8 items-center">
          <div className="col-span-12 md:col-span-4">
            <div className="text-2xl font-black tracking-tight uppercase mb-2">19 Dogs</div>
            <p className="text-[9px] opacity-50 leading-relaxed uppercase tracking-wide">
              &copy; 19 Dogs Biological Wellness. All rights reserved. For scientific use only. Proprietary equipment and logistics systems.
            </p>
          </div>
          <div className="col-span-12 md:col-span-8 flex flex-wrap justify-end gap-8 text-[10px] tracking-[0.15em] opacity-70 uppercase">
            <a href="/pages/terms" className="hover:opacity-100 transition-opacity">Biological Compliance</a>
            <a href="/pages/privacy" className="hover:opacity-100 transition-opacity">Privacy Protocols</a>
            <a href="/contact" className="hover:opacity-100 transition-opacity">System Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
