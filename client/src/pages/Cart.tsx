import { Link } from "wouter";
import { Minus, Plus, X, ArrowRight, Tag, Gift, Info, Calendar, Truck, Copy, Lock, ShieldCheck } from "lucide-react";
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
import { HomeEditorialHeader, HomeEditorialFooter } from "@/components/store/HomeEditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";

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

  if (!user || user.customerType !== "subscription") {
    return { finalPrice: Math.round(currentPrice * 100) / 100, hasSubscriptionDiscount: false, originalPrice: Math.round(currentPrice * 100) / 100 };
  }

  let discountType: string | null = null;
  let discountValue: number | null = null;

  if (categoryId && user.categoryDiscounts && user.categoryDiscounts.length > 0) {
    const categoryDiscount = user.categoryDiscounts.find((d) => d.categoryId === categoryId);
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
  if (discountType === "percentage") {
    finalPrice = currentPrice * (1 - discountValue / 100);
  } else {
    finalPrice = currentPrice - discountValue;
  }

  finalPrice = Math.max(0, Math.round(finalPrice * 100) / 100);
  const roundedOriginal = Math.round(currentPrice * 100) / 100;

  return {
    finalPrice,
    hasSubscriptionDiscount: finalPrice < roundedOriginal,
    originalPrice: roundedOriginal,
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
  const [duplicatePopoverOpenId, setDuplicatePopoverOpenId] = useState<string | null>(null);
  const [duplicatingItemId, setDuplicatingItemId] = useState<string | null>(null);

  const isSubscriptionCustomer = user?.customerType === "subscription";
  const isAuthenticated = !!user;

  // Homepage nav/footer settings
  const { data: rawNav } = useQuery<{ settings: any }>({ queryKey: ["/api/settings/homepage"] });
  const navSettings = rawNav ? mergeHomepageSettings(rawNav.settings || {}) : DEFAULT_HOMEPAGE_SETTINGS;

  // Cart page dynamic settings
  const { data: rawCartSettings } = useQuery<{ settings: any }>({ queryKey: ["/api/settings/shopping-cart"] });
  const cs = {
    pageTitle: "Biological Protocol: Shopping Cart",
    pageSubLabel: "Inventory Verification Stage 1/3",
    emptyCartTitle: "Your dossier is empty.",
    emptyCartButtonText: "Begin Protocol",
    integrityBadgeTitle: "Biological Integrity Guaranteed",
    integrityBadgeDescription:
      "Every protocol item undergoes rigorous clinical sanitization and veterinary inspection prior to dispatch from our 19 DOGS biological logistics center.",
    showIntegrityBadge: true,
    relatedSectionLabel: "Related Dossiers",
    relatedSectionTitle: "Complete the biological set.",
    relatedSectionDescription:
      "Our atelier designs products that work in synergy — engineered to enhance the biomechanics of active canine movement during high-intensity intervals.",
    showRelatedSection: true,
    orderSummaryTitle: "Order Summary",
    checkoutButtonText: "Proceed to Checkout",
    trustBadge1: "Secure Encrypted Connection",
    trustBadge2Text: "Free Shipping on Orders Over",
    heroImageUrl: "",
    showHeroImage: false,
    ...(rawCartSettings?.settings || {}),
  };

  // Related products
  const { data: relatedRaw } = useQuery<any>({
    queryKey: ["/api/products", { limit: 6, featured: true }],
    queryFn: () => fetch("/api/products?limit=6&featured=true").then((r) => r.json()).then((d) => Array.isArray(d) ? d : d.products ?? []),
  });
  const relatedProducts: any[] = Array.isArray(relatedRaw) ? relatedRaw : [];

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

  const defaultShippingCity = useMemo(() => {
    const addresses = addressesData?.addresses;
    if (!addresses || addresses.length === 0) return null;
    const defaultAddr =
      addresses.find((addr) => addr.isDefault && addr.type === "shipping") ||
      addresses.find((addr) => addr.isDefault) ||
      addresses[0];
    return defaultAddr?.city?.toLowerCase() || null;
  }, [addressesData]);

  const { data: comboOffersData } = useQuery<{ offers: ComboOffer[] }>({
    queryKey: ["/api/combo-offers"],
  });

  const { data: deliveryTiersData } = useQuery<{ tiers: SubscriptionDeliveryTier[] }>({
    queryKey: ["/api/subscription-delivery-tiers"],
    enabled: isSubscriptionCustomer,
  });

  const updateDeliveryDateMutation = useMutation({
    mutationFn: async ({ itemId, deliveryDate }: { itemId: string; deliveryDate: string | null }) => {
      const res = await apiRequest("PATCH", `/api/cart/${itemId}/delivery-date`, { deliveryDate });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to update delivery date", description: "Please try again." });
    },
  });

  const duplicateCartItemMutation = useMutation({
    mutationFn: async ({ itemId, deliveryDate }: { itemId: string; deliveryDate: string }) => {
      setDuplicatingItemId(itemId);
      const res = await apiRequest("POST", `/api/cart/${itemId}/duplicate`, { deliveryDate });
      return res.json();
    },
    onSuccess: () => {
      setDuplicatePopoverOpenId(null);
      setDuplicatingItemId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Item added for another delivery date", description: "The product has been added with the selected delivery date." });
    },
    onError: () => {
      setDuplicatePopoverOpenId(null);
      setDuplicatingItemId(null);
      toast({ variant: "destructive", title: "Failed to add item", description: "Please try again." });
    },
  });

  const includedGst = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat((item.variant?.price || item.product.salePrice || item.product.price) as string);
      const gstRate = parseFloat((item.product.gstRate as string) || "18");
      const itemTotal = price * item.quantity;
      const gstAmount = (itemTotal * gstRate) / (100 + gstRate);
      return total + gstAmount;
    }, 0);
  }, [cartItems]);

  const comboDiscount = useMemo(() => {
    if (!comboOffersData?.offers || cartItems.length === 0) return 0;
    const comboGroups: Record<string, typeof cartItems> = {};
    cartItems.forEach((item) => {
      const comboId = item.comboOfferId;
      if (comboId) {
        if (!comboGroups[comboId]) comboGroups[comboId] = [];
        comboGroups[comboId].push(item);
      }
    });
    let totalComboDiscount = 0;
    Object.entries(comboGroups).forEach(([comboId, items]) => {
      const comboOffer = comboOffersData.offers.find((o) => o.id === comboId);
      if (!comboOffer || !comboOffer.productIds || !comboOffer.isActive) return;
      const now = new Date();
      if (comboOffer.startDate && new Date(comboOffer.startDate) > now) return;
      if (comboOffer.endDate && new Date(comboOffer.endDate) < now) return;
      const cartProductIds = items.map((item) => item.productId);
      const allProductsPresent = comboOffer.productIds.every((pid) => cartProductIds.includes(pid));
      if (allProductsPresent) {
        const comboSets = Math.min(...comboOffer.productIds.map((pid) => items.find((i) => i.productId === pid)?.quantity || 0));
        if (comboSets > 0) {
          const originalPrice = parseFloat(comboOffer.originalPrice as string) || 0;
          const comboPrice = parseFloat(comboOffer.comboPrice as string) || 0;
          totalComboDiscount += (originalPrice - comboPrice) * comboSets;
        }
      }
    });
    return totalComboDiscount;
  }, [cartItems, comboOffersData?.offers]);

  const subscriptionPricing = useMemo(() => {
    if (!isSubscriptionCustomer) {
      return {
        adjustedTotal: cartTotal,
        subscriptionDiscount: 0,
        itemPrices: new Map<string, { finalPrice: number; originalPrice: number; hasDiscount: boolean }>(),
      };
    }
    let adjustedTotal = 0;
    let originalTotal = 0;
    const itemPrices = new Map<string, { finalPrice: number; originalPrice: number; hasDiscount: boolean }>();
    cartItems.forEach((item) => {
      const basePrice = item.variant?.price || item.product.price;
      const salePrice = item.variant?.salePrice || item.product.salePrice;
      const { finalPrice, hasSubscriptionDiscount, originalPrice } = calculateSubscriptionPrice(
        basePrice,
        salePrice,
        user as UserWithDiscounts,
        item.product.categoryId
      );
      itemPrices.set(item.id, { finalPrice: finalPrice * item.quantity, originalPrice: originalPrice * item.quantity, hasDiscount: hasSubscriptionDiscount });
      adjustedTotal += finalPrice * item.quantity;
      originalTotal += originalPrice * item.quantity;
    });
    return { adjustedTotal, subscriptionDiscount: originalTotal - adjustedTotal, itemPrices };
  }, [cartItems, user, isSubscriptionCustomer, cartTotal]);

  const deliveryDateShipping = useMemo(() => {
    if (!isSubscriptionCustomer) {
      return { groups: new Map<string, { totalWeight: number; shippingFee: number; items: typeof cartItems }>(), totalShipping: 0, hasMultipleDeliveryDates: false };
    }
    const deliveryTiers = deliveryTiersData?.tiers || [];
    const sortedTiers = [...deliveryTiers].filter((t) => t.isActive).sort((a, b) => parseFloat(String(a.upToWeightKg)) - parseFloat(String(b.upToWeightKg)));
    const groups = new Map<string, { totalWeight: number; shippingFee: number; items: typeof cartItems }>();
    cartItems.forEach((item) => {
      const deliveryDate = (item as any).deliveryDate || "unassigned";
      const itemWeight = parseFloat(String(item.product.weight || 0)) * item.quantity;
      if (!groups.has(deliveryDate)) groups.set(deliveryDate, { totalWeight: 0, shippingFee: 0, items: [] });
      const group = groups.get(deliveryDate)!;
      group.totalWeight += itemWeight;
      group.items.push(item);
    });
    let totalShipping = 0;
    const isChennai = defaultShippingCity ? defaultShippingCity.includes("chennai") : true;
    const isEstimate = !defaultShippingCity;
    groups.forEach((group) => {
      if (sortedTiers.length === 0 || group.totalWeight === 0) {
        group.shippingFee = 0;
      } else {
        const tier = sortedTiers.find((t) => group.totalWeight <= parseFloat(String(t.upToWeightKg))) || sortedTiers[sortedTiers.length - 1];
        group.shippingFee = parseFloat(String(isChennai ? tier.chennaiFee : tier.panIndiaFee));
      }
      totalShipping += group.shippingFee;
    });
    return { groups, totalShipping, hasMultipleDeliveryDates: groups.size > 1 || (groups.size === 1 && !groups.has("unassigned")), isEstimate, isChennai };
  }, [cartItems, isSubscriptionCustomer, deliveryTiersData, defaultShippingCity]);

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
        description: `Discount of ${coupon.type === "percentage" ? `${coupon.amount}%` : formatCurrency(parseFloat(coupon.amount))} has been applied.`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Invalid coupon", description: error.message || "This coupon code is invalid or expired.", variant: "destructive" });
    },
  });

  const removeCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem("appliedCoupon");
    toast({ title: "Coupon removed", description: "The discount has been removed from your order." });
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.productId) {
      const applicableItem = cartItems.find((item) => item.productId === appliedCoupon.productId);
      if (!applicableItem) return 0;
      const itemPrice = applicableItem.variant?.price || applicableItem.product.salePrice || applicableItem.product.price;
      const itemTotal = parseFloat(itemPrice as string) * applicableItem.quantity;
      if (appliedCoupon.type === "percentage") return (itemTotal * parseFloat(appliedCoupon.amount)) / 100;
      return Math.min(parseFloat(appliedCoupon.amount), itemTotal);
    }
    if (appliedCoupon.type === "percentage") return (cartTotal * parseFloat(appliedCoupon.amount)) / 100;
    return Math.min(parseFloat(appliedCoupon.amount), cartTotal);
  };

  const subtotal = isSubscriptionCustomer ? subscriptionPricing.adjustedTotal : cartTotal;
  const couponDiscount = calculateDiscount();
  const totalDiscount = couponDiscount + comboDiscount;
  const shipping = isSubscriptionCustomer ? deliveryDateShipping.totalShipping : subtotal >= 500 ? 0 : 99;
  const total = subtotal - totalDiscount + shipping;

  // ─── Loading state ────────────────────────────────────────────────────────
  if (isCartLoading) {
    return (
      <div className="min-h-screen bg-[#f9faf6] flex flex-col">
        <HomeEditorialHeader nav={navSettings.nav} />
        <div className="flex-1 flex items-center justify-center pt-[120px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00160c]" />
        </div>
        <HomeEditorialFooter footer={navSettings.footer} />
      </div>
    );
  }

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f9faf6] flex flex-col">
        <HomeEditorialHeader nav={navSettings.nav} />
        <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 md:px-16 pt-[120px] pb-20">
          <header className="mb-16 border-b border-[#c1c8c2] pb-4">
            <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl font-semibold italic mb-2">{cs.pageTitle}</h1>
            <span className="text-[11px] font-['Inter'] font-bold uppercase tracking-[0.2em] text-[#414844]">{cs.pageSubLabel}</span>
          </header>
          <div className="text-center py-24">
            <p className="font-['Playfair_Display'] text-2xl italic text-[#414844] mb-8">{cs.emptyCartTitle}</p>
            <Link href="/">
              <button className="bg-[#012d1d] text-white font-['Inter'] text-[11px] font-bold uppercase tracking-[0.2em] px-8 py-4 hover:bg-black transition-all" data-testid="button-continue-shopping">
                {cs.emptyCartButtonText}
              </button>
            </Link>
          </div>
        </main>
        <HomeEditorialFooter footer={navSettings.footer} />
      </div>
    );
  }

  // ─── Main cart ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f9faf6] flex flex-col" style={{ fontFamily: "Inter, sans-serif" }}>
      <HomeEditorialHeader nav={navSettings.nav} />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 md:px-16 pt-[120px] pb-20">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <header className="mb-16 border-b border-[#c1c8c2] pb-4">
          <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl font-semibold italic mb-3">
            {cs.pageTitle}
          </h1>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#414844]">
              {cs.pageSubLabel}
            </span>
            <Link href="/" className="flex items-center gap-2 group text-[#414844] hover:text-[#00160c] transition-colors">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em]">Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </header>

        {/* ── Optional Hero Image ───────────────────────────────────────── */}
        {cs.showHeroImage && cs.heroImageUrl && (
          <div className="mb-12 w-full overflow-hidden" style={{ maxHeight: 320 }}>
            <img
              src={cs.heroImageUrl}
              alt="Cart banner"
              className="w-full h-full object-cover"
              style={{ maxHeight: 320 }}
            />
          </div>
        )}

        {/* ── 12-col grid: cart items + order summary ──────────────────── */}
        <div className="grid grid-cols-12 gap-6 items-start">

          {/* ── Left: cart items (7 cols) ──────────────────────────────── */}
          <section className="col-span-12 lg:col-span-7">
            <div className="flex flex-col gap-12">
              {cartItems.map((item, idx) => {
                const price = item.variant?.price || item.product.salePrice || item.product.price;
                const imageUrl =
                  item.product.images?.find((img) => img.isPrimary)?.url ||
                  item.product.images?.[0]?.url ||
                  "/placeholder-product.jpg";

                const itemSubscriptionPricing = subscriptionPricing.itemPrices.get(item.id);
                const displayPrice = itemSubscriptionPricing?.finalPrice ?? parseFloat(price as string) * item.quantity;
                const hasItemSubscriptionDiscount = itemSubscriptionPricing?.hasDiscount ?? false;

                const serialNo = `19D-${String(idx + 1).padStart(3, "0")}`;

                return (
                  <div key={item.id} className="flex flex-col md:flex-row gap-8 pb-12 border-b border-[#DBDAD5] group" data-testid={`cart-item-${item.id}`}>
                    {/* Product image */}
                    <Link href={`/product/${item.product.slug}`} className="shrink-0">
                      <div
                        className="relative w-full md:w-56 aspect-[4/5] bg-[#eeeeeb] overflow-hidden transition-transform hover:-translate-y-1 duration-500"
                        style={{ boxShadow: "24px 24px 0px 0px rgba(1, 45, 29, 0.12)" }}
                      >
                        <img
                          src={imageUrl}
                          alt={item.product.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3 bg-[#00160c] text-white font-['Inter'] text-[9px] font-bold uppercase px-2 py-1 tracking-widest">
                          SERIAL: {serialNo}
                        </div>
                      </div>
                    </Link>

                    {/* Product details */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Link href={`/product/${item.product.slug}`}>
                            <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-normal mb-1 hover:text-[#944923] transition-colors">
                              {item.product.title}
                            </h2>
                          </Link>
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#414844]">
                            CATEGORY: {item.product.categoryId ? "ATELIER / PROTOCOL" : "GENERAL"}
                          </p>
                          {item.variant && (
                            <p className="text-sm text-[#414844] mt-1">
                              {item.variant.optionName}: {item.variant.optionValue}
                            </p>
                          )}
                          {hasItemSubscriptionDiscount && (
                            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-widest text-[#944923]">
                              <Tag className="w-3 h-3" />
                              Subscription Price
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[#c1c8c2] hover:text-red-500 transition-colors p-1"
                          data-testid={`button-remove-${item.id}`}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Subscription delivery date picker */}
                      {isSubscriptionCustomer && (
                        <div className="flex flex-col gap-2 mb-4 p-3 bg-[#f3f4f0] border border-[#c1c8c2]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Truck className="w-4 h-4 text-[#414844] shrink-0" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#414844]">Deliver on:</span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="flex items-center gap-1.5 border border-[#c1c8c2] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider hover:border-[#00160c] transition-colors" data-testid={`button-delivery-date-${item.id}`}>
                                  <Calendar className="w-3 h-3" />
                                  {(item as any).deliveryDate ? format(new Date((item as any).deliveryDate), "MMM d, yyyy") : "Select date"}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={(item as any).deliveryDate ? new Date((item as any).deliveryDate) : undefined}
                                  onSelect={(date) => {
                                    if (date) updateDeliveryDateMutation.mutate({ itemId: item.id, deliveryDate: format(date, "yyyy-MM-dd") });
                                  }}
                                  disabled={(date) => date < addDays(new Date(), 1)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            {(item as any).deliveryDate && (
                              <button
                                className="text-[11px] text-[#414844] hover:text-red-500 uppercase tracking-wider"
                                onClick={() => updateDeliveryDateMutation.mutate({ itemId: item.id, deliveryDate: null })}
                                data-testid={`button-clear-delivery-date-${item.id}`}
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <Popover
                            open={duplicatePopoverOpenId === item.id}
                            onOpenChange={(open) => setDuplicatePopoverOpenId(open ? item.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <button
                                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#414844] hover:text-[#944923] transition-colors w-fit disabled:opacity-40"
                                disabled={duplicatingItemId === item.id}
                                data-testid={`button-add-another-date-${item.id}`}
                              >
                                <Copy className="w-3 h-3" />
                                {duplicatingItemId === item.id ? "Adding..." : "Add for another delivery date"}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                onSelect={(date) => {
                                  if (date && duplicatingItemId !== item.id) {
                                    duplicateCartItemMutation.mutate({ itemId: item.id, deliveryDate: format(date, "yyyy-MM-dd") });
                                  }
                                }}
                                disabled={(date) => date < addDays(new Date(), 1)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}

                      {/* Bottom row: qty / specs / price */}
                      <div className="mt-auto grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-[#c1c8c2] pt-6">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#717973] mb-2">Quantity</p>
                          <div className="flex items-center gap-4 border border-[#c1c8c2] w-fit px-3 py-1.5">
                            <button
                              onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                              disabled={item.quantity <= 1}
                              className="hover:text-[#944923] transition-colors disabled:opacity-30"
                              data-testid={`button-decrease-${item.id}`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-sm font-bold min-w-[20px] text-center">
                              {String(item.quantity).padStart(2, "0")}
                            </span>
                            <button
                              onClick={() => updateCartItem(item.id, item.quantity + 1)}
                              className="hover:text-[#944923] transition-colors"
                              data-testid={`button-increase-${item.id}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#717973] mb-2">Specifications</p>
                          {item.variant ? (
                            <p className="text-sm">{item.variant.optionName}: {item.variant.optionValue}</p>
                          ) : (
                            <p className="text-sm text-[#414844]">Standard</p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#717973] mb-2">Price</p>
                          {hasItemSubscriptionDiscount ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="font-mono text-sm font-bold text-[#944923]" data-testid={`text-price-${item.id}`}>
                                {formatCurrency(displayPrice)}
                              </span>
                              <span className="font-mono text-xs text-[#414844] line-through">
                                {formatCurrency(itemSubscriptionPricing?.originalPrice ?? 0)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono text-sm font-bold" data-testid={`text-price-${item.id}`}>
                              {formatCurrency(displayPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Biological Integrity badge */}
            {cs.showIntegrityBadge && (
              <div className="mt-10 p-6 bg-[#f3f4f0] border-l-4 border-[#00160c]">
                <div className="flex items-start gap-4">
                  <ShieldCheck className="w-5 h-5 text-[#00160c] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-1">{cs.integrityBadgeTitle}</h4>
                    <p className="text-sm text-[#414844] max-w-md leading-relaxed">
                      {cs.integrityBadgeDescription}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── Right: order summary (4 cols, offset 1) ──────────────── */}
          <section className="col-span-12 lg:col-span-4 lg:col-start-9 bg-white p-8 lg:p-10 border border-[#c1c8c2] relative sticky top-8">
            <h3 className="font-['Playfair_Display'] text-3xl italic mb-8">{cs.orderSummaryTitle}</h3>

            {/* Line items */}
            <div className="flex flex-col gap-5 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#414844]">Subtotal</span>
                <span className="font-mono font-bold text-sm" data-testid="text-subtotal">{formatCurrency(subtotal)}</span>
              </div>

              {subscriptionPricing.subscriptionDiscount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#944923] flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Subscription Savings
                  </span>
                  <span className="font-mono font-bold text-sm text-[#944923]" data-testid="text-subscription-discount">
                    -{formatCurrency(subscriptionPricing.subscriptionDiscount)}
                  </span>
                </div>
              )}

              {comboDiscount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-600 flex items-center gap-1">
                    <Gift className="w-3 h-3" /> Combo Discount
                  </span>
                  <span className="font-mono font-bold text-sm text-purple-600" data-testid="text-combo-discount">
                    -{formatCurrency(comboDiscount)}
                  </span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#944923]">Coupon Discount</span>
                  <span className="font-mono font-bold text-sm text-[#944923]" data-testid="text-coupon-discount">
                    -{formatCurrency(couponDiscount)}
                  </span>
                </div>
              )}

              {/* Shipping */}
              {isSubscriptionCustomer && deliveryDateShipping.hasMultipleDeliveryDates ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#414844] flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Delivery Charges
                    </span>
                    {deliveryDateShipping.isEstimate && (
                      <span className="text-[9px] text-[#717973] uppercase">(estimate)</span>
                    )}
                  </div>
                  {Array.from(deliveryDateShipping.groups.entries()).map(([date, group]) => (
                    <div key={date} className="flex justify-between text-xs pl-4">
                      <span className="text-[#414844]">
                        {date === "unassigned" ? "No date" : format(new Date(date), "MMM d")}
                        <span className="ml-1 text-[10px]">({group.totalWeight.toFixed(2)}kg)</span>
                      </span>
                      <span className="font-mono">{group.shippingFee === 0 ? "Free" : formatCurrency(group.shippingFee)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#414844]">Shipping Protocol</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#944923]">
                    {shipping === 0 ? "Free" : formatCurrency(shipping)}
                  </span>
                </div>
              )}

              {/* Coupon field */}
              <div className="border-t border-[#DBDAD5] pt-5 mt-1">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-[#f3f4f0] border border-[#c1c8c2] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-[#944923]" />
                      <div>
                        <p className="text-[11px] font-bold text-[#944923] uppercase" data-testid="text-applied-coupon">{appliedCoupon.code}</p>
                        <p className="text-[10px] text-[#414844]" data-testid="text-discount-amount">
                          {appliedCoupon.type === "percentage" ? `${appliedCoupon.amount}% off` : `${formatCurrency(parseFloat(appliedCoupon.amount))} off`}
                        </p>
                      </div>
                    </div>
                    <button onClick={removeCoupon} className="text-[#c1c8c2] hover:text-red-500 transition-colors" data-testid="button-remove-coupon">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#717973] mb-2 block">
                      Promotion Code
                    </label>
                    <div className="flex">
                      <input
                        className="flex-1 bg-[#f9faf6] border border-[#c1c8c2] px-4 py-3 text-[11px] font-bold uppercase tracking-wider focus:outline-none focus:border-[#00160c] transition-colors placeholder:text-[#c1c8c2]"
                        placeholder="ENTER CODE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        data-testid="input-coupon"
                      />
                      <button
                        className="bg-[#00160c] text-white font-['Inter'] text-[10px] font-bold uppercase tracking-wider px-5 hover:bg-[#264e3c] transition-all disabled:opacity-40"
                        onClick={() => applyCouponMutation.mutate(couponCode)}
                        disabled={!couponCode || applyCouponMutation.isPending}
                        data-testid="button-apply-coupon"
                      >
                        {applyCouponMutation.isPending ? "..." : "Apply"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-end pt-4 mb-8">
              <div>
                <span className="font-['Playfair_Display'] text-3xl block leading-tight">Total</span>
                <span className="text-[10px] text-[#414844] uppercase tracking-tight flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Incl. GST: {formatCurrency(includedGst)}
                </span>
              </div>
              <span className="font-mono text-3xl font-extrabold text-[#00160c]" data-testid="text-cart-total">
                {formatCurrency(total)}
              </span>
            </div>

            {/* Checkout button */}
            <div className="flex flex-col gap-4">
              <Link href="/checkout">
                <button
                  className="w-full bg-[#012d1d] text-white py-5 font-['Inter'] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  data-testid="button-checkout"
                >
                  {cs.checkoutButtonText}
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </Link>

              <div className="flex flex-col gap-3 text-[10px] text-[#717973] font-bold uppercase tracking-wider opacity-70 mt-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{cs.trustBadge1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5" />
                  <span>
                    {!isSubscriptionCustomer && shipping === 0
                      ? "Free Shipping Applied"
                      : `${cs.trustBadge2Text} ${CURRENCY_SYMBOL}500`}
                  </span>
                </div>
              </div>
            </div>

            {/* Decorative accent */}
            <div className="hidden lg:block absolute -right-3 -bottom-3 w-16 h-16 bg-[#ffdbcc] opacity-20 -z-10" />
          </section>
        </div>

        {/* ── Related Dossiers section ──────────────────────────────────── */}
        {cs.showRelatedSection && relatedProducts.length > 0 && (
          <section className="mt-20 grid grid-cols-12 gap-6 border-t border-[#c1c8c2] pt-16">
            <div className="col-span-12 md:col-span-4">
              <span className="text-[#944923] text-[11px] font-bold uppercase tracking-[0.15em] mb-4 block italic">{cs.relatedSectionLabel}</span>
              <h3 className="font-['Playfair_Display'] text-4xl font-semibold mb-6 leading-tight">
                {cs.relatedSectionTitle}
              </h3>
              <p className="text-[#414844] text-base leading-relaxed font-light">
                {cs.relatedSectionDescription}
              </p>
            </div>
            <div className="col-span-12 md:col-span-7 md:col-start-6">
              <div className="flex gap-6 overflow-x-auto pb-6 snap-x" style={{ scrollbarWidth: "none" }}>
                {relatedProducts.map((product: any, i: number) => {
                  const img = product.images?.find((im: any) => im.isPrimary)?.url || product.images?.[0]?.url || "/placeholder-product.jpg";
                  const price = product.salePrice || product.price;
                  return (
                    <Link key={product.id || i} href={`/product/${product.slug}`} className="min-w-[260px] snap-start flex flex-col group cursor-pointer">
                      <div className="aspect-[3/4] mb-4 overflow-hidden relative">
                        <img
                          src={img}
                          alt={product.title}
                          className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#414844] opacity-50 mb-1">
                        Dossier: 19D-{String(i + 1).padStart(3, "0")}
                      </span>
                      <h4 className="font-['Playfair_Display'] text-xl italic group-hover:text-[#944923] transition-colors">
                        {product.title}
                      </h4>
                      <span className="font-mono text-sm mt-2">{formatCurrency(parseFloat(price as string))}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <HomeEditorialFooter footer={navSettings.footer} />
    </div>
  );
}
