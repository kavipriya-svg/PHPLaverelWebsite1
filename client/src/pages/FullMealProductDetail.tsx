import { useState, useEffect, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ShoppingCart, Minus, Plus, ArrowRight, Star, ChevronLeft,
  Copy, Check, Ticket, Tag, Package, Truck, RotateCcw,
  Shield, Timer, Sparkles, Calendar, Heart,
} from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";
import { EditorialHeader, EditorialFooter, C } from "@/components/store/EditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";
import type { HomepageSettings } from "@/lib/homepageDefaults";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductWithDetails, Coupon, ReviewWithUser } from "@shared/schema";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getImg(product: any, index = 0): string {
  const imgs = product?.images || product?.productImages || [];
  const img = imgs[index];
  return img?.url || img?.imageUrl || product?.imageUrl || "";
}

function stripHtml(html = ""): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function specimenNo(id: string | number): string {
  const n = parseInt(String(id), 10);
  return `No. ${String(isNaN(n) ? 42 : (n % 900) + 42).padStart(3, "0")}`;
}

function couponValue(c: Coupon): string {
  return c.type === "percentage"
    ? `${c.amount}% off`
    : `${CURRENCY_SYMBOL}${parseFloat(c.amount as string).toFixed(0)} off`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Stars({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24"
          fill={s <= rating ? C.primary : "none"}
          stroke={C.primary} strokeWidth={1.5}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center px-3 py-2 min-w-[56px]" style={{ backgroundColor: C.primary, color: "#fff" }}>
      <div className="font-mono text-2xl font-bold leading-none">{String(value).padStart(2, "0")}</div>
      <div className="font-mono text-[9px] uppercase tracking-widest mt-1" style={{ color: "#c0edd4" }}>{label}</div>
    </div>
  );
}

function CouponRow({ coupon, onCopy, copied }: { coupon: Coupon; onCopy: (code: string) => void; copied: string | null }) {
  const isCopied = copied === coupon.code;
  return (
    <div className="flex items-center justify-between px-3 py-2.5 gap-3"
      style={{ border: `1px solid ${C.outlineVariant}40`, backgroundColor: `${C.primary}06` }}>
      <div className="flex items-center gap-3 min-w-0">
        <code className="font-mono text-xs font-bold px-2 py-1 shrink-0"
          style={{ backgroundColor: `${C.primary}12`, color: C.primary }}>
          {coupon.code}
        </code>
        <span className="text-xs truncate" style={{ color: C.onSurfaceVariant }}>
          {couponValue(coupon)}
          {coupon.minCartTotal ? ` · min ${CURRENCY_SYMBOL}${parseFloat(coupon.minCartTotal as string).toFixed(0)}` : ""}
          {coupon.minQuantity ? ` · min ${coupon.minQuantity} items` : ""}
          {coupon.description ? ` · ${coupon.description}` : ""}
        </span>
      </div>
      <button
        data-testid={`copy-coupon-${coupon.id}`}
        onClick={() => onCopy(coupon.code)}
        className="shrink-0 p-1.5 transition-colors duration-200 rounded"
        style={{ color: isCopied ? "#2d6a4f" : C.onSurfaceVariant }}
        title="Copy code"
      >
        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FullMealProductDetail() {
  const [, params] = useRoute("/full-meals/product/:slug");
  const slug = params?.slug;

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);

  const { addToCart, isInWishlist, toggleWishlist } = useStore();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: homepageData } = useQuery<{ settings: Partial<HomepageSettings> }>({
    queryKey: ["/api/settings/homepage"],
  });
  const nav = homepageData
    ? mergeHomepageSettings(homepageData.settings || {}).nav
    : DEFAULT_HOMEPAGE_SETTINGS.nav;
  const footer = homepageData
    ? mergeHomepageSettings(homepageData.settings || {}).footer
    : DEFAULT_HOMEPAGE_SETTINGS.footer;

  const { data, isLoading } = useQuery<{ product: ProductWithDetails }>({
    queryKey: [`/api/products/${slug}`],
    enabled: !!slug,
  });
  const product = data?.product;

  const { data: couponsData } = useQuery<{ coupons: Coupon[] }>({
    queryKey: ["/api/coupons", { productId: product?.id }],
    queryFn: async () => {
      const res = await fetch(`/api/coupons?productId=${product?.id}`);
      return res.json();
    },
    enabled: !!product?.id,
  });

  const relatedParams = new URLSearchParams();
  if (product?.categoryId) {
    relatedParams.set("categoryId", product.categoryId);
    relatedParams.set("limit", "3");
    if (product.id) relatedParams.set("exclude", product.id);
  }
  const { data: relatedData } = useQuery<{ products: any[] }>({
    queryKey: ["/api/products", relatedParams.toString()],
    enabled: !!product?.categoryId,
  });

  const { data: reviewsData } = useQuery<{ reviews: ReviewWithUser[] }>({
    queryKey: ["/api/products", product?.id, "reviews"],
    enabled: !!product?.id,
  });

  const { data: canReviewData } = useQuery<{ canReview: boolean }>({
    queryKey: ["/api/products", product?.id, "can-review"],
    enabled: !!product?.id && isAuthenticated,
  });

  const submitReview = useMutation({
    mutationFn: (body: { rating: number; title: string; content: string }) =>
      apiRequest("POST", `/api/products/${product?.id}/reviews`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product?.id, "reviews"] });
      toast({ title: "Field Report submitted", description: "Under review by our team." });
      setShowReviewForm(false);
      setReviewTitle(""); setReviewContent(""); setReviewRating(5);
    },
    onError: () => toast({ title: "Error", description: "Could not submit review.", variant: "destructive" }),
  });

  // ── Auto-select first variant ──────────────────────────────────────────────
  useEffect(() => {
    const variants = product?.variants || [];
    if (variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(String(variants[0].id));
    }
    setActiveImg(0);
  }, [product?.id]);

  // ── Sale countdown ─────────────────────────────────────────────────────────
  const salePriceEnd = (product as any)?.salePriceEnd;
  const salePriceStart = (product as any)?.salePriceStart;
  const isOnSale = (product as any)?.isOnSale;
  const isSaleActive = isOnSale && salePriceEnd && new Date(salePriceEnd) > new Date() &&
    (!salePriceStart || new Date(salePriceStart) <= new Date());

  const calcCountdown = useCallback(() => {
    if (!isSaleActive || !salePriceEnd) { setCountdown(null); return; }
    const diff = new Date(salePriceEnd).getTime() - Date.now();
    if (diff <= 0) { setCountdown(null); return; }
    setCountdown({
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    });
  }, [isSaleActive, salePriceEnd]);

  useEffect(() => {
    calcCountdown();
    if (!isSaleActive) return;
    const t = setInterval(calcCountdown, 1000);
    return () => clearInterval(t);
  }, [calcCountdown, isSaleActive]);

  // ── Derived values ─────────────────────────────────────────────────────────
  if (isLoading) return (
    <>
      <EditorialHeader nav={nav} />
      <div className="min-h-screen flex items-center justify-center" style={{ marginTop: 96 }}>
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: C.primary, borderTopColor: "transparent" }} />
          <p className="font-mono text-xs uppercase tracking-widest" style={{ color: C.onSurfaceVariant }}>Loading specimen…</p>
        </div>
      </div>
    </>
  );

  if (!product) return (
    <>
      <EditorialHeader nav={nav} />
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ marginTop: 96 }}>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: C.onSurfaceVariant }}>Specimen not found</p>
        <Link href="/full-meals">
          <button className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest px-8 py-3 border"
            style={{ borderColor: C.primary, color: C.primary }}>
            <ChevronLeft className="w-4 h-4" /> Back to Archive
          </button>
        </Link>
      </div>
    </>
  );

  const images = product.images || [];
  const allImgUrls: string[] = images.length > 0
    ? images.map((img: any) => img.url || img.imageUrl || "")
    : [getImg(product)];

  const variants = product.variants || [];
  const selectedVariant = variants.find((v: any) => String(v.id) === selectedVariantId);

  const currentPrice = selectedVariant?.salePrice || selectedVariant?.price || product.salePrice || product.price;
  const originalPrice = selectedVariant?.price || product.price;
  const hasDiscount = !!(currentPrice && originalPrice &&
    parseFloat(String(currentPrice)) < parseFloat(String(originalPrice)));
  const discountPct = hasDiscount
    ? Math.round((1 - parseFloat(String(currentPrice!)) / parseFloat(String(originalPrice!))) * 100)
    : 0;

  const activeCoupons = (couponsData?.coupons || []).filter((c) => c.isActive);
  const productSpecificCoupons = activeCoupons.filter((c) => c.productId === product.id);
  const storeWideCoupons = activeCoupons.filter((c) => !c.productId && (!c.minQuantity || c.minQuantity <= 1));
  const bulkCoupons = activeCoupons.filter((c) => !c.productId && c.minQuantity && c.minQuantity > 1);
  const hasCoupons = productSpecificCoupons.length > 0 || storeWideCoupons.length > 0 || bulkCoupons.length > 0;

  const reviews = (reviewsData?.reviews || []).filter((r) => r.status === "approved");
  const avgRating = product.averageRating ? parseFloat(String(product.averageRating)) : 0;
  const relatedProducts = relatedData?.products || [];

  const inWishlist = isInWishlist?.(product.id) ?? false;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    toast({ title: "Coupon code copied!" });
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, qty, selectedVariantId ? Number(selectedVariantId) : undefined);
      toast({ title: `${product.title} added to cart` });
    } catch {
      toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" });
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { window.location.href = "/api/login"; return; }
    setWishlistPending(true);
    try { await toggleWishlist(product.id); }
    catch { toast({ title: "Error", description: "Could not update wishlist.", variant: "destructive" }); }
    finally { setWishlistPending(false); }
  };

  const deliveryDate = product.expectedDeliveryDays
    ? (() => {
      const d = new Date();
      d.setDate(d.getDate() + product.expectedDeliveryDays!);
      return d.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" });
    })()
    : null;

  const shortDesc = (product as any).shortDesc;
  const longDesc = (product as any).longDesc || product.description;
  const longDescText = longDesc ? stripHtml(longDesc) : "";

  const weight = (product as any).weight;
  const dimensions = (product as any).dimensions;
  const returnDays = (product as any).returnDays;
  const returnText = (product as any).returnText;
  const shippingText = (product as any).shippingText;
  const freeShipping = (product as any).freeShipping;
  const secureCheckout = (product as any).secureCheckout;
  const secureCheckoutText = (product as any).secureCheckoutText;
  const bannerUrl = (product as any).bannerUrl;
  const bannerTitle = (product as any).bannerTitle;
  const bannerSubtitle = (product as any).bannerSubtitle;
  const bannerCtaText = (product as any).bannerCtaText;
  const bannerCtaLink = (product as any).bannerCtaLink;
  const gstRate = (product as any).gstRate;
  const couponBgColor = (product as any).couponBoxBgColor;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <EditorialHeader nav={nav} />

      <main style={{ marginTop: 96, backgroundColor: C.surface, color: C.onSurface, fontFamily: "Inter, sans-serif" }}>

        {/* Breadcrumb */}
        <div className="px-5 md:px-16 pt-5 pb-2 flex items-center gap-3 flex-wrap"
          style={{ borderBottom: `1px solid ${C.outlineVariant}28` }}>
          <Link href="/full-meals">
            <span className="font-mono text-xs uppercase tracking-widest cursor-pointer hover:underline"
              style={{ color: C.onSurfaceVariant }}>Archive</span>
          </Link>
          <span style={{ color: C.outlineVariant }}>/</span>
          {product.category && (
            <>
              <span className="font-mono text-xs uppercase tracking-widest" style={{ color: C.onSurfaceVariant }}>
                {product.category.name}
              </span>
              <span style={{ color: C.outlineVariant }}>/</span>
            </>
          )}
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: C.primary }}>
            {product.title}
          </span>
        </div>

        {/* ── Hero Grid ── */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 px-5 md:px-16 py-14">

          {/* Left: Gallery */}
          <div className="md:col-span-7 flex flex-col md:flex-row gap-5">
            {allImgUrls.length > 1 && (
              <div className="flex flex-row md:flex-col gap-3 md:w-24 shrink-0 overflow-x-auto md:overflow-visible">
                {allImgUrls.map((src, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} data-testid={`thumb-${i}`}
                    className="shrink-0 transition-all duration-200"
                    style={{
                      width: 72, aspectRatio: "4/5",
                      border: `2px solid ${i === activeImg ? C.primary : C.outlineVariant}`,
                      opacity: i === activeImg ? 1 : 0.5,
                    }}>
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-grow">
              <div className="relative overflow-hidden"
                style={{ aspectRatio: "4/5", boxShadow: `36px 36px 0px 0px ${C.primaryContainer}1A` }}>
                <img src={allImgUrls[activeImg] || ""} alt={product.title}
                  className="w-full h-full object-cover" loading="lazy" />
                {hasDiscount && (
                  <div className="absolute top-5 right-5 px-3 py-1 font-mono text-xs font-bold"
                    style={{ backgroundColor: "#944923", color: "#fff" }}>
                    -{discountPct}%
                  </div>
                )}
                {(product as any).isNewArrival && (
                  <div className="absolute top-5 left-5 px-3 py-1 font-mono text-xs font-bold flex items-center gap-1"
                    style={{ backgroundColor: C.primary, color: "#c0edd4" }}>
                    <Sparkles className="w-3 h-3" /> NEW
                  </div>
                )}
                {(product as any).isFeatured && !((product as any).isNewArrival) && (
                  <div className="absolute bottom-5 left-5 px-3 py-1 font-mono text-xs uppercase tracking-widest"
                    style={{ backgroundColor: C.primary, color: "#c0edd4" }}>
                    Verified Organic
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Commerce */}
          <div className="md:col-span-5 flex flex-col gap-6 pt-2 md:pt-16">

            {/* Brand + badges */}
            <div className="flex items-center gap-3 flex-wrap">
              {product.brand && (
                <span className="font-mono text-xs uppercase tracking-widest px-3 py-1"
                  style={{ backgroundColor: `${C.primary}10`, color: C.primary }}>
                  {product.brand.name}
                </span>
              )}
              {(product as any).isTrending && (
                <span className="font-mono text-xs uppercase tracking-widest px-3 py-1 flex items-center gap-1"
                  style={{ backgroundColor: "#fe9e7122", color: "#944923" }}>
                  Trending
                </span>
              )}
              {(product as any).isOnSale && (
                <span className="font-mono text-xs uppercase tracking-widest px-3 py-1"
                  style={{ backgroundColor: "#ba1a1a15", color: "#ba1a1a" }}>
                  On Sale
                </span>
              )}
            </div>

            {/* Title + specimen */}
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "#944923", letterSpacing: "0.15em" }}>
                Biological Collection / Full Meals
              </p>
              <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(28px,4.5vw,44px)", fontWeight: 600, lineHeight: 1.2, color: C.primary }}>
                {product.title}
              </h1>
              <div className="flex items-center gap-4 flex-wrap py-2"
                style={{ borderTop: `1px solid ${C.outlineVariant}30`, borderBottom: `1px solid ${C.outlineVariant}30` }}>
                <span className="font-mono text-sm uppercase" style={{ color: C.onSurface }}>
                  SPECIMEN {specimenNo(product.id)}
                </span>
                {product.sku && (
                  <span className="font-mono text-xs" style={{ color: C.onSurfaceVariant }}>SKU: {product.sku}</span>
                )}
                {avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Stars rating={Math.round(avgRating)} size={13} />
                    <span className="font-mono text-xs" style={{ color: C.onSurfaceVariant }}>
                      ({product.reviewCount ?? reviews.length})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Short description */}
            {shortDesc && (
              <p className="text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>{shortDesc}</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              {hasDiscount && (
                <span className="font-mono text-base line-through" style={{ color: C.onSurfaceVariant }}>
                  {formatCurrency(originalPrice!)}
                </span>
              )}
              <span style={{ fontFamily: "Playfair Display, serif", fontSize: 36, fontWeight: 600, color: C.primary, lineHeight: 1 }}>
                {formatCurrency(currentPrice!)}
              </span>
              {gstRate && (
                <span className="font-mono text-xs" style={{ color: C.onSurfaceVariant }}>+ {gstRate}% GST</span>
              )}
            </div>

            {/* Sale countdown */}
            {isSaleActive && countdown && (
              <div className="space-y-2" data-testid="sale-countdown">
                <p className="font-mono text-xs uppercase tracking-widest flex items-center gap-2" style={{ color: "#ba1a1a" }}>
                  <Timer className="w-3.5 h-3.5" /> Sale ends in
                </p>
                <div className="flex gap-2">
                  <CountdownUnit value={countdown.days} label="Days" />
                  <CountdownUnit value={countdown.hours} label="Hrs" />
                  <CountdownUnit value={countdown.minutes} label="Min" />
                  <CountdownUnit value={countdown.seconds} label="Sec" />
                </div>
              </div>
            )}

            {/* Delivery date */}
            {deliveryDate && (
              <div className="flex items-center gap-3 px-4 py-3 text-sm"
                style={{ backgroundColor: `${C.primary}06`, border: `1px solid ${C.outlineVariant}30` }}
                data-testid="delivery-date">
                <Calendar className="w-4 h-4 shrink-0" style={{ color: C.primary }} />
                <span style={{ color: C.onSurface }}>
                  Expected by <strong>{deliveryDate}</strong>
                </span>
              </div>
            )}

            {/* Variants */}
            {variants.length > 0 && (
              <div className="space-y-3">
                <label className="font-mono text-xs uppercase tracking-widest" style={{ color: C.onSurfaceVariant }}>
                  Select Weight / SKU
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {variants.map((v: any) => {
                    const isSelected = String(v.id) === selectedVariantId;
                    const vPrice = v.salePrice || v.price;
                    const vHasSale = v.salePrice && parseFloat(v.salePrice) < parseFloat(v.price);
                    return (
                      <button key={v.id} data-testid={`variant-${v.id}`}
                        onClick={() => setSelectedVariantId(isSelected ? undefined : String(v.id))}
                        className="p-4 text-left flex justify-between items-center transition-all duration-200"
                        style={{
                          border: `${isSelected ? 2 : 1}px solid ${isSelected ? C.primary : C.outlineVariant}`,
                          backgroundColor: isSelected ? `${C.primary}08` : "transparent",
                          cursor: "pointer",
                        }}>
                        <div>
                          <span className="font-bold text-sm block"
                            style={{ color: isSelected ? C.primary : C.onSurface }}>{v.name}</span>
                          {v.attributes && (
                            <span className="font-mono text-xs" style={{ color: C.onSurfaceVariant }}>{v.attributes}</span>
                          )}
                          {v.stock !== undefined && v.stock !== null && (
                            <span className="font-mono text-[10px] block mt-0.5"
                              style={{ color: v.stock > 0 ? "#2d6a4f" : "#ba1a1a" }}>
                              {v.stock > 0 ? `${v.stock} in stock` : "Out of stock"}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {vHasSale && (
                            <span className="font-mono text-xs line-through block"
                              style={{ color: C.onSurfaceVariant }}>{formatCurrency(v.price)}</span>
                          )}
                          <span className="font-mono text-xs font-bold"
                            style={{ color: C.primary }}>{formatCurrency(vPrice)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subscription badge */}
            <div className="flex items-center gap-4 p-4"
              style={{ backgroundColor: "#fe9e7118", border: `1px solid ${"#944923"}28` }}>
              <div className="w-7 h-7 flex items-center justify-center font-bold text-sm shrink-0"
                style={{ backgroundColor: "#944923", color: "#fff" }}>S</div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#77330e" }}>Subscription customers save more</p>
                <p className="text-xs mt-0.5" style={{ color: C.onSurfaceVariant }}>
                  Automated replenishment for the pack.
                </p>
              </div>
            </div>

            {/* Coupons */}
            {hasCoupons && (
              <div className="space-y-3 p-4"
                style={{ backgroundColor: couponBgColor || "#f0fdf4", border: `1px solid ${C.outlineVariant}30` }}
                data-testid="card-coupons">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" style={{ color: C.primary }} />
                  <span className="font-mono text-xs uppercase tracking-widest font-bold" style={{ color: C.primary }}>
                    Available Coupons
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 ml-auto"
                    style={{ border: `1px solid ${C.outlineVariant}50`, color: C.onSurfaceVariant }}>
                    One per order
                  </span>
                </div>

                {productSpecificCoupons.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest"
                      style={{ color: C.primary }}>
                      <Tag className="w-3 h-3" /> Exclusive to this product
                    </div>
                    {productSpecificCoupons.map((c) => (
                      <CouponRow key={c.id} coupon={c} onCopy={copyCode} copied={copiedCoupon} />
                    ))}
                  </div>
                )}

                {storeWideCoupons.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest"
                      style={{ color: "#2d6a4f" }}>
                      <Ticket className="w-3 h-3" /> Store-wide discounts
                    </div>
                    {storeWideCoupons.slice(0, 3).map((c) => (
                      <CouponRow key={c.id} coupon={c} onCopy={copyCode} copied={copiedCoupon} />
                    ))}
                  </div>
                )}

                {bulkCoupons.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest"
                      style={{ color: "#944923" }}>
                      <Package className="w-3 h-3" /> Bulk purchase discounts
                    </div>
                    {bulkCoupons.slice(0, 2).map((c) => (
                      <CouponRow key={c.id} coupon={c} onCopy={copyCode} copied={copiedCoupon} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Product banner (from admin) */}
            {bannerUrl && (
              <div className="relative overflow-hidden" data-testid="product-banner">
                {bannerCtaLink ? (
                  <Link href={bannerCtaLink}>
                    <img src={bannerUrl} alt={bannerTitle || "Promo"} className="w-full object-cover max-h-48" />
                    {(bannerTitle || bannerSubtitle) && (
                      <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent">
                        {bannerTitle && <p className="font-bold text-white text-sm">{bannerTitle}</p>}
                        {bannerSubtitle && <p className="text-white/80 text-xs mt-0.5">{bannerSubtitle}</p>}
                        {bannerCtaText && (
                          <span className="mt-2 self-start font-mono text-xs uppercase tracking-widest px-4 py-2"
                            style={{ backgroundColor: "#fff", color: C.primary }}>{bannerCtaText}</span>
                        )}
                      </div>
                    )}
                  </Link>
                ) : (
                  <>
                    <img src={bannerUrl} alt={bannerTitle || "Promo"} className="w-full object-cover max-h-48" />
                    {(bannerTitle || bannerSubtitle) && (
                      <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent">
                        {bannerTitle && <p className="font-bold text-white text-sm">{bannerTitle}</p>}
                        {bannerSubtitle && <p className="text-white/80 text-xs mt-0.5">{bannerSubtitle}</p>}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Qty + CTA row */}
            <div className="flex gap-3">
              <div className="flex items-center" style={{ border: `1px solid ${C.outlineVariant}`, height: 54 }}>
                <button data-testid="qty-minus" onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 h-full flex items-center"
                  style={{ color: C.primary }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = `${C.outlineVariant}44`)}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-mono text-base" style={{ color: C.onSurface }}>{qty}</span>
                <button data-testid="qty-plus" onClick={() => setQty((q) => q + 1)}
                  className="px-4 h-full flex items-center"
                  style={{ color: C.primary }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = `${C.outlineVariant}44`)}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button data-testid="add-to-cart" onClick={handleAddToCart}
                className="flex-grow flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest transition-all duration-300 active:scale-95"
                style={{ height: 54, backgroundColor: C.primary, color: "#fff", letterSpacing: "0.18em" }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#944923")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = C.primary)}>
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>

              <button data-testid="wishlist-btn" onClick={handleWishlist} disabled={wishlistPending}
                className="flex items-center justify-center transition-all duration-200"
                style={{ width: 54, height: 54, border: `1px solid ${C.outlineVariant}`, color: inWishlist ? "#ba1a1a" : C.onSurfaceVariant }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = C.primary)}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = C.outlineVariant)}
                title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}>
                <Heart className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Stock */}
            {product.stock !== undefined && product.stock !== null && (
              <p className="font-mono text-xs" style={{ color: product.stock > 0 ? "#2d6a4f" : "#ba1a1a" }}>
                {product.stock > 0 ? `${product.stock} units available` : "Currently out of stock"}
                {product.stock <= (product.lowStockThreshold ?? 5) && product.stock > 0 && (
                  <span className="ml-2 px-2 py-0.5 font-mono text-[10px]"
                    style={{ backgroundColor: "#ba1a1a18", color: "#ba1a1a" }}>
                    Low Stock
                  </span>
                )}
              </p>
            )}

            {/* Trust Badges — always shown, values from admin when set */}
            <div className="grid grid-cols-3 gap-px mt-2"
              style={{ border: `1px solid ${C.outlineVariant}30`, backgroundColor: `${C.outlineVariant}30` }}>
              {/* Free Shipping */}
              <div className="flex flex-col items-center text-center gap-2 py-5 px-3"
                style={{ backgroundColor: C.surface }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${C.primary}0E` }}>
                  <Truck className="w-4 h-4" style={{ color: C.primary }} />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest font-bold leading-tight"
                    style={{ color: C.primary }}>
                    {freeShipping ? "Free Shipping" : "Shipping"}
                  </p>
                  <p className="text-[11px] mt-1 leading-tight"
                    style={{ color: C.onSurfaceVariant }}>
                    {shippingText || "Free Shipping"}
                  </p>
                </div>
              </div>

              {/* Returns */}
              <div className="flex flex-col items-center text-center gap-2 py-5 px-3"
                style={{ backgroundColor: C.surface }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${C.primary}0E` }}>
                  <RotateCcw className="w-4 h-4" style={{ color: C.primary }} />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest font-bold leading-tight"
                    style={{ color: C.primary }}>
                    {returnDays ? `${returnDays}-Day Returns` : "30-Day Returns"}
                  </p>
                  <p className="text-[11px] mt-1 leading-tight"
                    style={{ color: C.onSurfaceVariant }}>
                    {returnText || "Easy Returns"}
                  </p>
                </div>
              </div>

              {/* Secure Checkout */}
              <div className="flex flex-col items-center text-center gap-2 py-5 px-3"
                style={{ backgroundColor: C.surface }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${C.primary}0E` }}>
                  <Shield className="w-4 h-4" style={{ color: C.primary }} />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest font-bold leading-tight"
                    style={{ color: C.primary }}>
                    Secure Checkout
                  </p>
                  <p className="text-[11px] mt-1 leading-tight"
                    style={{ color: C.onSurfaceVariant }}>
                    {secureCheckoutText || "Secure Checkout"}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── Biological Synthesis (Long Description) ── */}
        {longDescText && (
          <section className="py-20 px-5 md:px-16" style={{ borderTop: `1px solid ${C.outlineVariant}18` }}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center max-w-7xl mx-auto">
              <div className="md:col-span-5">
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(24px,3.5vw,40px)", fontWeight: 600, color: C.primary, fontStyle: "italic", marginBottom: 24 }}>
                  Biological Synthesis
                </h2>
                <p className="leading-relaxed"
                  style={{ fontSize: 17, fontWeight: 300, color: C.onSurfaceVariant, lineHeight: 1.85 }}>
                  {longDescText}
                </p>
                {weight && (
                  <p className="font-mono text-xs mt-6" style={{ color: C.onSurfaceVariant }}>
                    Weight: {weight}g
                    {dimensions ? `  ·  Dimensions: ${dimensions}` : ""}
                  </p>
                )}
              </div>
              {allImgUrls.length > 1 && (
                <div className="md:col-start-7 md:col-span-6 relative" style={{ height: 460 }}>
                  <img src={allImgUrls[1] || allImgUrls[0]} alt={product.title}
                    className="w-full h-full object-cover shadow-xl"
                    style={{ transition: "filter 0.5s ease" }}
                    onMouseOver={(e) => (e.currentTarget.style.filter = "grayscale(100%)")}
                    onMouseOut={(e) => (e.currentTarget.style.filter = "grayscale(0%)")}
                    loading="lazy" />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Technical Spec Sheet ── */}
        <section className="py-20 px-5 md:px-16" style={{ backgroundColor: "#ffffff", borderTop: `1px solid ${C.outlineVariant}18` }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest block mb-1" style={{ color: "#944923" }}>
                  DATA REPORT
                </span>
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(22px,3vw,32px)", fontWeight: 400, color: C.primary }}>
                  Technical Specification
                </h2>
              </div>
              <p className="font-mono text-xs uppercase tracking-widest pb-1"
                style={{ color: C.onSurfaceVariant, borderBottom: `1px solid ${C.primary}` }}>
                Laboratory Verified Content
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="font-mono text-xs uppercase tracking-widest pb-2"
                  style={{ color: C.onSurfaceVariant, borderBottom: `1px solid ${C.outlineVariant}30` }}>
                  Macro Profile (%)
                </h3>
                <div className="space-y-7">
                  {[["PROTEIN (MIN)", 68.5], ["FAT (MAX)", 12.2], ["MOISTURE (MAX)", 8.2], ["CRUDE FIBRE (MAX)", 3.5]].map(([label, val]) => (
                    <div key={String(label)}>
                      <div className="flex justify-between font-mono text-sm mb-2" style={{ color: C.onSurface }}>
                        <span>{label}</span><span>{val}%</span>
                      </div>
                      <div className="w-full h-0.5" style={{ backgroundColor: `${C.outlineVariant}40` }}>
                        <div className="h-full" style={{ width: `${val}%`, backgroundColor: "#fe9e71" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-mono text-xs uppercase tracking-widest pb-2"
                  style={{ color: C.onSurfaceVariant, borderBottom: `1px solid ${C.outlineVariant}30` }}>
                  Micronutrient Density (mg/kg)
                </h3>
                <div className="grid grid-cols-2 gap-y-7 gap-x-10">
                  {[["IRON", "24.1"], ["COPPER", "4.8"], ["OMEGA-3", "1200"], ["SELENIUM", "0.9"]].map(([label, value]) => (
                    <div key={label} className="pl-4" style={{ borderLeft: `2px solid ${C.primaryContainer}` }}>
                      <p className="font-mono text-[10px] uppercase mb-1" style={{ color: C.onSurfaceVariant }}>{label}</p>
                      <p style={{ fontFamily: "Playfair Display, serif", fontSize: 26, color: C.primary }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Product-level metadata */}
                {(weight || gstRate || product.sku) && (
                  <div className="mt-4 pt-4 space-y-2" style={{ borderTop: `1px solid ${C.outlineVariant}30` }}>
                    {weight && (
                      <div className="flex justify-between font-mono text-xs" style={{ color: C.onSurfaceVariant }}>
                        <span>WEIGHT</span><span>{weight}g</span>
                      </div>
                    )}
                    {dimensions && (
                      <div className="flex justify-between font-mono text-xs" style={{ color: C.onSurfaceVariant }}>
                        <span>DIMENSIONS</span><span>{dimensions}</span>
                      </div>
                    )}
                    {gstRate && (
                      <div className="flex justify-between font-mono text-xs" style={{ color: C.onSurfaceVariant }}>
                        <span>GST RATE</span><span>{gstRate}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Field Reports (Reviews) ── */}
        <section className="py-20 px-5 md:px-16 max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(26px,4vw,44px)", fontWeight: 600, color: C.primary }}>
              Field Reports
            </h2>
            {avgRating > 0 && (
              <div className="flex justify-center items-center gap-3 mt-4">
                <Stars rating={Math.round(avgRating)} size={20} />
                <span className="font-mono text-xs uppercase tracking-widest" style={{ color: C.onSurfaceVariant }}>
                  Based on {product.reviewCount ?? reviews.length} Observations
                </span>
              </div>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {reviews.slice(0, 6).map((r) => (
                <div key={r.id} className="p-8 space-y-4"
                  style={{ borderLeft: `1px solid ${C.outlineVariant}40` }}>
                  <Stars rating={r.rating} size={15} />
                  {r.title && (
                    <p className="font-mono text-xs uppercase tracking-widest" style={{ color: C.primary }}>{r.title}</p>
                  )}
                  <p style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontStyle: "italic", lineHeight: 1.75, color: C.onSurface }}>
                    "{r.content}"
                  </p>
                  <p className="font-mono text-xs uppercase font-bold" style={{ color: C.primary }}>
                    {r.user?.firstName ? `${r.user.firstName} ${r.user.lastName || ""}`.trim() : "Verified Buyer"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center font-mono text-xs uppercase tracking-widest py-12" style={{ color: C.onSurfaceVariant }}>
              No field reports yet. Be the first to submit.
            </p>
          )}

          {/* Submit review */}
          {isAuthenticated && canReviewData?.canReview && (
            <div className="mt-12 text-center">
              {!showReviewForm ? (
                <button data-testid="write-review-btn" onClick={() => setShowReviewForm(true)}
                  className="font-mono text-xs uppercase tracking-widest pb-1 transition-all duration-200"
                  style={{ borderBottom: `2px solid ${C.primary}`, color: C.primary }}>
                  Submit Field Report
                </button>
              ) : (
                <div className="max-w-xl mx-auto text-left space-y-4 mt-8 p-8"
                  style={{ border: `1px solid ${C.outlineVariant}30` }}>
                  <p className="font-mono text-xs uppercase tracking-widest" style={{ color: C.primary }}>New Field Report</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setReviewRating(s)}>
                        <Star className={`w-6 h-6 ${s <= reviewRating ? "fill-current" : ""}`} style={{ color: C.primary }} />
                      </button>
                    ))}
                  </div>
                  <input data-testid="review-title" placeholder="Report title" value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-4 py-3 font-mono text-sm bg-transparent"
                    style={{ border: `1px solid ${C.outlineVariant}`, color: C.onSurface, outline: "none" }} />
                  <textarea data-testid="review-content" placeholder="Describe your observation…" value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)} rows={5}
                    className="w-full px-4 py-3 font-mono text-sm bg-transparent resize-none"
                    style={{ border: `1px solid ${C.outlineVariant}`, color: C.onSurface, outline: "none" }} />
                  <div className="flex gap-3">
                    <button data-testid="submit-review"
                      onClick={() => submitReview.mutate({ rating: reviewRating, title: reviewTitle, content: reviewContent })}
                      disabled={submitReview.isPending || !reviewContent.trim()}
                      className="font-mono text-xs uppercase tracking-widest px-8 py-3"
                      style={{ backgroundColor: C.primary, color: "#fff", opacity: submitReview.isPending ? 0.7 : 1 }}>
                      {submitReview.isPending ? "Submitting…" : "Submit"}
                    </button>
                    <button onClick={() => setShowReviewForm(false)}
                      className="font-mono text-xs uppercase tracking-widest px-8 py-3"
                      style={{ border: `1px solid ${C.outlineVariant}`, color: C.onSurfaceVariant }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Related Specimens ── */}
        {relatedProducts.length > 0 && (
          <section className="py-20 px-5 md:px-16" style={{ borderTop: `1px solid ${C.outlineVariant}18` }}>
            <div className="max-w-7xl mx-auto">
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(26px,4vw,44px)", fontWeight: 600, fontStyle: "italic", color: C.primary, marginBottom: 40 }}>
                Related Specimens
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedProducts.map((rp: any) => {
                  const rpImg = getImg(rp);
                  const rpPrice = rp.salePrice || rp.price;
                  return (
                    <Link key={rp.id} href={`/full-meals/product/${rp.slug}`}>
                      <div className="group cursor-pointer">
                        <div className="overflow-hidden mb-4"
                          style={{ aspectRatio: "4/5", border: `1px solid ${C.outlineVariant}28` }}>
                          <img src={rpImg} alt={rp.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy" />
                        </div>
                        <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#944923" }}>
                          Specimen {specimenNo(rp.id)}
                        </p>
                        <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, color: C.primary, marginBottom: 6 }}>
                          {rp.title}
                        </h3>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-sm" style={{ color: C.primary }}>
                            {rpPrice ? formatCurrency(rpPrice) : "—"}
                          </span>
                          <span data-testid={`related-view-${rp.id}`}
                            className="font-mono text-xs uppercase pb-0.5"
                            style={{ borderBottom: `1px solid ${C.primary}`, color: C.primary }}>
                            View Specimen
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <EditorialFooter footer={footer} />
    </>
  );
}
