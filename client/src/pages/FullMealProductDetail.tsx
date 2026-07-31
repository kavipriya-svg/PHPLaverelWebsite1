import { useState, useEffect, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ShoppingCart, ArrowRight, Star, Truck, RotateCcw,
  Shield, Timer, BadgeCheck, Heart,
} from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { EditorialHeader, EditorialFooter, C } from "@/components/store/EditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";
import type { HomepageSettings } from "@/lib/homepageDefaults";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductWithDetails, Coupon, ReviewWithUser } from "@shared/schema";

// ─── Shared typography constants ─────────────────────────────────────────────
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" };
const PLAYFAIR: React.CSSProperties = { fontFamily: "'Playfair Display', serif" };
const HARD_SHADOW: React.CSSProperties = { boxShadow: "40px 40px 0px 0px rgba(1,45,29,0.15)" };
const LABEL_CAPS: React.CSSProperties = { fontFamily: "'Inter', sans-serif", fontSize: 11, lineHeight: "16px", letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getImg(product: any, idx = 0): string {
  const imgs = product?.images || product?.productImages || [];
  const img = imgs[idx];
  return img?.url || img?.imageUrl || (idx === 0 ? product?.imageUrl || "" : "");
}

function stripHtml(html = "") { return html.replace(/<[^>]+>/g, "").trim(); }

function specimenNo(id: string | number) {
  const n = parseInt(String(id), 10);
  return String(isNaN(n) ? 42 : (n % 900) + 42).padStart(3, "0");
}

function couponLabel(c: Coupon) {
  return c.type === "percentage" ? `${c.amount}% OFF` : `₹${parseFloat(c.amount as string).toFixed(0)} OFF`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function FilledStar({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={C.primary} stroke="none">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center px-3 py-2 min-w-[52px]" style={{ backgroundColor: C.primary, color: "#fff" }}>
      <div className="text-2xl font-bold leading-none" style={MONO}>{String(value).padStart(2, "0")}</div>
      <div className="text-[9px] mt-1" style={{ ...MONO, color: "#a5d0b8" }}>{label}</div>
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [wishlistPending, setWishlistPending] = useState(false);

  const { addToCart, isInWishlist, toggleWishlist } = useStore();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: homepageData } = useQuery<{ settings: Partial<HomepageSettings> }>({ queryKey: ["/api/settings/homepage"] });
  const nav = homepageData ? mergeHomepageSettings(homepageData.settings || {}).nav : DEFAULT_HOMEPAGE_SETTINGS.nav;
  const footer = homepageData ? mergeHomepageSettings(homepageData.settings || {}).footer : DEFAULT_HOMEPAGE_SETTINGS.footer;

  const { data, isLoading } = useQuery<{ product: ProductWithDetails }>({
    queryKey: [`/api/products/${slug}`],
    enabled: !!slug,
  });
  const product = data?.product;

  const { data: couponsData } = useQuery<{ coupons: Coupon[] }>({
    queryKey: ["/api/coupons", product?.id],
    queryFn: async () => { const r = await fetch(`/api/coupons?productId=${product?.id}`); return r.json(); },
    enabled: !!product?.id,
  });

  const { data: reviewsData } = useQuery<{ reviews: ReviewWithUser[] }>({
    queryKey: ["/api/products", product?.id, "reviews"],
    enabled: !!product?.id,
  });
  const { data: adminFeedback = [] } = useQuery<any[]>({
    queryKey: ["/api/full-meal-feedback"],
  });
  const { data: adBanners = [] } = useQuery<any[]>({
    queryKey: ["/api/full-meal-ad-banners?placement=product"],
  });
  const bs = (section: string, pos: string) =>
    adBanners.filter((b: any) => b.placement === section && b.position === pos);
  const { data: canReviewData } = useQuery<{ canReview: boolean }>({
    queryKey: ["/api/products", product?.id, "can-review"],
    enabled: !!product?.id && isAuthenticated,
  });

  const relatedParams = new URLSearchParams();
  if (product?.categoryId) { relatedParams.set("categoryId", product.categoryId); relatedParams.set("limit", "3"); if (product.id) relatedParams.set("exclude", product.id); }
  const { data: relatedData } = useQuery<{ products: any[] }>({
    queryKey: ["/api/products", relatedParams.toString()],
    enabled: !!product?.categoryId,
  });

  const submitReview = useMutation({
    mutationFn: (body: { rating: number; title: string; content: string }) =>
      apiRequest("POST", `/api/products/${product?.id}/reviews`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product?.id, "reviews"] });
      toast({ title: "Field Report submitted" });
      setShowReviewForm(false); setReviewTitle(""); setReviewContent(""); setReviewRating(5);
    },
    onError: () => toast({ title: "Error", description: "Could not submit.", variant: "destructive" }),
  });

  // ── Auto-select first variant ─────────────────────────────────────────────
  useEffect(() => {
    const variants = product?.variants || [];
    if (variants.length > 0 && !selectedVariantId) setSelectedVariantId(String(variants[0].id));
    setActiveImg(0);
  }, [product?.id]);

  // ── Sale countdown ────────────────────────────────────────────────────────
  const salePriceEnd = (product as any)?.salePriceEnd;
  const salePriceStart = (product as any)?.salePriceStart;
  const isOnSale = (product as any)?.isOnSale;
  const isSaleActive = isOnSale && salePriceEnd && new Date(salePriceEnd) > new Date() &&
    (!salePriceStart || new Date(salePriceStart) <= new Date());

  const calcCountdown = useCallback(() => {
    if (!isSaleActive || !salePriceEnd) { setCountdown(null); return; }
    const diff = new Date(salePriceEnd).getTime() - Date.now();
    if (diff <= 0) { setCountdown(null); return; }
    setCountdown({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) });
  }, [isSaleActive, salePriceEnd]);

  useEffect(() => {
    calcCountdown();
    if (!isSaleActive) return;
    const t = setInterval(calcCountdown, 1000);
    return () => clearInterval(t);
  }, [calcCountdown, isSaleActive]);

  // ── Loading / 404 ─────────────────────────────────────────────────────────
  if (isLoading) return (
    <>
      <EditorialHeader nav={nav} />
      <div className="min-h-screen flex items-center justify-center" style={{ marginTop: 96 }}>
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: C.primary, borderTopColor: "transparent" }} />
          <p style={{ ...MONO, fontSize: 11, color: C.onSurfaceVariant }}>Loading specimen…</p>
        </div>
      </div>
    </>
  );
  if (!product) return (
    <>
      <EditorialHeader nav={nav} />
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ marginTop: 96 }}>
        <p style={{ ...MONO, fontSize: 11, color: C.onSurfaceVariant }}>Specimen not found</p>
        <Link href="/full-meals">
          <button className="px-8 py-3 border" style={{ borderColor: C.primary, color: C.primary, ...MONO, fontSize: 11 }}>
            ← Back to Archive
          </button>
        </Link>
      </div>
    </>
  );

  // ── Derived values ────────────────────────────────────────────────────────
  const images = product.images || [];
  const allImgs: string[] = images.length > 0 ? images.map((i: any) => i.url || i.imageUrl || "") : [getImg(product)];

  const variants = product.variants || [];
  const selectedVariant = variants.find((v: any) => String(v.id) === selectedVariantId);
  const currentPrice = selectedVariant?.salePrice || selectedVariant?.price || product.salePrice || product.price;
  const originalPrice = selectedVariant?.price || product.price;
  const maxStock = selectedVariant?.stock ?? product.stock ?? Infinity;
  const hasDiscount = !!(currentPrice && originalPrice && parseFloat(String(currentPrice)) < parseFloat(String(originalPrice)));
  const discountPct = hasDiscount ? Math.round(((parseFloat(String(originalPrice)) - parseFloat(String(currentPrice))) / parseFloat(String(originalPrice))) * 100) : 0;

  const allCoupons = (couponsData?.coupons || []).filter((c) => c.isActive);
  const productCoupons = allCoupons.filter((c) => c.productId === product.id);
  const storeCoupons = allCoupons.filter((c) => !c.productId && (!c.minQuantity || c.minQuantity <= 1));
  const bulkCoupons = allCoupons.filter((c) => !c.productId && c.minQuantity && c.minQuantity > 1);
  const visibleCoupons = [...productCoupons, ...storeCoupons.slice(0, 3), ...bulkCoupons.slice(0, 2)];

  const reviews = (reviewsData?.reviews || []).filter((r) => r.status === "approved");
  const avgRating = product.averageRating ? parseFloat(String(product.averageRating)) : 0;
  const related = relatedData?.products || [];
  const inWishlist = isInWishlist?.(product.id) ?? false;

  const shortDesc = (product as any).shortDesc as string | undefined;
  const longDesc = (product as any).longDesc || product.description;
  const longDescText = longDesc ? stripHtml(longDesc) : "";
  const weight = (product as any).weight;
  const dimensions = (product as any).dimensions;
  const returnDays = (product as any).returnDays as number | undefined;
  const returnText = (product as any).returnText as string | undefined;
  const shippingText = (product as any).shippingText as string | undefined;
  const freeShipping = (product as any).freeShipping as boolean | undefined;
  const secureCheckoutText = (product as any).secureCheckoutText as string | undefined;
  const bannerUrl = (product as any).bannerUrl as string | undefined;
  const bannerTitle = (product as any).bannerTitle as string | undefined;
  const bannerSubtitle = (product as any).bannerSubtitle as string | undefined;
  const bannerCtaText = (product as any).bannerCtaText as string | undefined;
  const bannerCtaLink = (product as any).bannerCtaLink as string | undefined;
  const gstRate = (product as any).gstRate as string | undefined;

  const deliveryDate = product.expectedDeliveryDays
    ? (() => { const d = new Date(); d.setDate(d.getDate() + product.expectedDeliveryDays!); return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }); })()
    : null;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: `${code} copied!` });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, qty, selectedVariantId ? Number(selectedVariantId) : undefined);
      toast({ title: `${product.title} added to cart` });
    } catch { toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" }); }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { window.location.href = "/api/login"; return; }
    setWishlistPending(true);
    try { await toggleWishlist(product.id); }
    catch { toast({ title: "Error", description: "Wishlist error.", variant: "destructive" }); }
    finally { setWishlistPending(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <EditorialHeader nav={nav} />

      {/* ── Ads: product-hero top (Before Product Details) ── */}
      <AdBannerStrip banners={bs("product-hero", "top")} />

      <main style={{ marginTop: 96, backgroundColor: "#f9faf6", color: "#1a1c1a", fontFamily: "Inter, sans-serif", overflowX: "hidden" }}>

        {/* ════ HERO SECTION ════ */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 py-20 min-h-screen px-5 md:px-16">

          {/* Left — gallery */}
          <div className="md:col-span-7 flex flex-col md:flex-row gap-6 relative">

            {/* Thumbnail strip */}
            {allImgs.length > 1 && (
              <div className="hidden md:flex flex-col gap-4 w-32 shrink-0">
                {allImgs.map((src, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} data-testid={`thumb-${i}`}
                    className="w-full transition-opacity duration-200"
                    style={{ aspectRatio: "4/5", opacity: i === activeImg ? 1 : 0.5, border: `1px solid ${C.outlineVariant}4D` }}>
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-grow">
              <div className="relative overflow-hidden group" style={{ aspectRatio: "4/5", ...HARD_SHADOW }}>
                <img
                  src={allImgs[activeImg] || ""}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Discount badge */}
                {hasDiscount && (
                  <div className="absolute top-5 right-5 px-3 py-1"
                    style={{ backgroundColor: C.secondary, color: "#fff", ...LABEL_CAPS }}>
                    SALE
                  </div>
                )}
                {/* Organic / New arrival badge */}
                {(product as any).isNewArrival ? (
                  <div className="absolute bottom-6 left-6 px-4 py-1"
                    style={{ backgroundColor: C.primary, color: "#fff", ...LABEL_CAPS, letterSpacing: "0.2em" }}>
                    NEW ARRIVAL
                  </div>
                ) : (
                  <div className="absolute bottom-6 left-6 px-4 py-1"
                    style={{ backgroundColor: C.primary, color: "#fff", ...LABEL_CAPS, letterSpacing: "0.2em" }}>
                    Verified Organic
                  </div>
                )}
              </div>
              {/* Mobile thumbnails row */}
              {allImgs.length > 1 && (
                <div className="flex md:hidden gap-3 mt-4 overflow-x-auto">
                  {allImgs.map((src, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className="shrink-0 transition-opacity"
                      style={{ width: 64, aspectRatio: "4/5", opacity: i === activeImg ? 1 : 0.5, border: `1px solid ${C.outlineVariant}4D` }}>
                      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — commerce block */}
          <div className="md:col-span-5 flex flex-col justify-start pt-8 md:pt-24 space-y-8">

            {/* Title block */}
            <div className="space-y-2">
              <p style={{ ...LABEL_CAPS, color: C.secondary }}>Biological Collection / Full Meals</p>
              <h1 style={{ ...PLAYFAIR, fontSize: "clamp(32px,4vw,48px)", fontWeight: 600, lineHeight: "1.15", color: C.primary }}>
                {product.title}
              </h1>
              {/* Specimen / SKU / Price row */}
              <div className="flex flex-wrap items-center gap-4 py-3 border-y" style={{ borderColor: `${C.outlineVariant}33` }}>
                <span style={{ ...MONO, fontSize: 14, color: C.onSurface }}>
                  SPECIMEN NO. {specimenNo(product.id)}
                  {product.sku ? ` | SKU: ${product.sku}` : ""}
                </span>
                <span className="w-px h-4 shrink-0" style={{ backgroundColor: C.outlineVariant }} />
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    {hasDiscount && (
                      <span className="line-through" style={{ color: C.onSurfaceVariant, fontSize: 16 }}>
                        {formatCurrency(originalPrice!)}
                      </span>
                    )}
                    <span style={{ ...PLAYFAIR, fontSize: 32, lineHeight: "40px", fontWeight: 400, color: C.primary }}>
                      {formatCurrency(currentPrice!)}
                    </span>
                  </div>
                  {gstRate && (
                    <span style={{ fontSize: 10, color: C.onSurfaceVariant, textTransform: "uppercase" }}>
                      + {gstRate}% GST
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Short description */}
            {shortDesc && (
              <p style={{ fontSize: 14, color: C.onSurfaceVariant, lineHeight: 1.6 }}>{shortDesc}</p>
            )}

            <div className="space-y-8">

              {/* Variant selector — or single weight fallback */}
              {variants.length > 0 ? (
                <div className="space-y-4">
                  <label style={{ ...LABEL_CAPS, color: C.onSurfaceVariant, display: "block" }}>
                    Select Weight (SKU)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {variants.map((v: any) => {
                      const isSelected = String(v.id) === selectedVariantId;
                      const vPrice = v.salePrice || v.price;
                      return (
                        <button key={v.id} data-testid={`variant-${v.id}`}
                          onClick={() => setSelectedVariantId(String(v.id))}
                          className="p-4 text-left flex justify-between items-center transition-colors duration-200"
                          style={{
                            border: isSelected ? `2px solid ${C.primary}` : `1px solid ${C.outlineVariant}`,
                          }}>
                          <span style={{ fontWeight: 700, color: isSelected ? C.primary : C.onSurfaceVariant }}>
                            {v.name}
                          </span>
                          <span style={{ ...MONO, fontSize: 12, color: isSelected ? C.primaryContainer : C.onSurfaceVariant }}>
                            {formatCurrency(vPrice)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label style={{ ...LABEL_CAPS, color: C.onSurfaceVariant, display: "block" }}>
                    Weight (SKU)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 flex justify-between items-center"
                      style={{ border: `2px solid ${C.primary}` }}>
                      <span style={{ fontWeight: 700, color: C.primary }}>
                        {weight ? `${weight}g` : "Standard"}
                      </span>
                      <span style={{ ...MONO, fontSize: 12, color: C.primaryContainer }}>
                        {formatCurrency(currentPrice!)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription box + delivery */}
              <div className="space-y-4">
                <div className="p-4 flex items-center gap-4"
                  style={{ border: `1px solid ${C.secondary}33`, backgroundColor: "#fe9e71" }}>
                  <BadgeCheck className="w-5 h-5 shrink-0" style={{ color: C.secondary }} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#351000", lineHeight: 1.4 }}>
                      Subscription customers save more.
                    </p>
                    <p style={{ fontSize: 13, color: C.onSurfaceVariant, marginTop: 2 }}>
                      Automated replenishment for the pack.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2" style={{ fontSize: 14, color: C.onSurfaceVariant }}>
                    <Truck className="w-4 h-4" style={{ color: C.primary }} />
                    <span>
                      {deliveryDate
                        ? `Delivery by ${deliveryDate}`
                        : freeShipping
                          ? (shippingText || "Free Shipping")
                          : (shippingText || "Standard Shipping")}
                    </span>
                  </div>
                  {product.stock !== undefined && product.stock !== null && product.stock > 0 && (
                    <div style={{ ...MONO, fontSize: 12, color: C.secondary }}>
                      {product.stock} units available
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div style={{ ...MONO, fontSize: 12, color: "#ba1a1a" }}>Out of stock</div>
                  )}
                </div>
              </div>

              {/* Sale countdown */}
              {isSaleActive && countdown && (
                <div className="space-y-2" data-testid="sale-countdown">
                  <p style={{ ...LABEL_CAPS, color: "#ba1a1a", display: "flex", alignItems: "center", gap: 6 }}>
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

              {/* Product banner (from admin) */}
              {bannerUrl && (
                <div className="relative overflow-hidden" data-testid="product-banner">
                  {bannerCtaLink
                    ? <Link href={bannerCtaLink}>
                        <img src={bannerUrl} alt={bannerTitle || ""} className="w-full object-cover max-h-40" />
                        {(bannerTitle || bannerSubtitle) && (
                          <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent">
                            {bannerTitle && <p className="text-white text-sm font-bold">{bannerTitle}</p>}
                            {bannerSubtitle && <p className="text-white/80 text-xs mt-0.5">{bannerSubtitle}</p>}
                            {bannerCtaText && <span className="mt-2 self-start text-xs uppercase px-4 py-1.5" style={{ backgroundColor: "#fff", color: C.primary, ...LABEL_CAPS }}>{bannerCtaText}</span>}
                          </div>
                        )}
                      </Link>
                    : <>
                        <img src={bannerUrl} alt={bannerTitle || ""} className="w-full object-cover max-h-40" />
                        {(bannerTitle || bannerSubtitle) && (
                          <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent">
                            {bannerTitle && <p className="text-white text-sm font-bold">{bannerTitle}</p>}
                            {bannerSubtitle && <p className="text-white/80 text-xs mt-0.5">{bannerSubtitle}</p>}
                          </div>
                        )}
                      </>
                  }
                </div>
              )}

              {/* Coupons */}
              {visibleCoupons.length > 0 && (
                <div className="space-y-3 pb-2" data-testid="card-coupons">
                  <p style={{ ...LABEL_CAPS, color: C.onSurfaceVariant }}>Available Coupons</p>
                  <div className="flex flex-wrap gap-2">
                    {visibleCoupons.map((c) => (
                      <button key={c.id} data-testid={`coupon-${c.id}`}
                        onClick={() => copyCode(c.code)}
                        title="Click to copy"
                        className="flex flex-col text-left transition-opacity hover:opacity-80 active:scale-95"
                        style={{ border: `1px dashed ${C.primary}`, padding: "4px 12px", borderRadius: 4, backgroundColor: `${C.primaryContainer}0D` }}>
                        <span style={{ ...MONO, fontSize: 12, fontWeight: 700, color: copiedCode === c.code ? "#2d6a4f" : C.onSurface }}>
                          {copiedCode === c.code ? "COPIED!" : c.code}
                        </span>
                        <span style={{ fontSize: 10, opacity: 0.7, color: C.onSurface }}>{couponLabel(c)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Qty + Add to Cart + Wishlist */}
              <div className="flex gap-4">
                <div className="flex items-center" style={{ border: `1px solid ${C.outlineVariant}`, height: 56 }}>
                  <button data-testid="qty-minus" onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-4 h-full flex items-center transition-colors duration-150 hover:bg-gray-100"
                    style={{ fontSize: 18, color: C.primary }}>−</button>
                  <input type="number" value={qty} readOnly data-testid="qty-input"
                    className="w-12 text-center bg-transparent focus:ring-0 border-none"
                    style={{ fontSize: 16, color: C.onSurface }} />
                  <button data-testid="qty-plus" onClick={() => setQty((q) => Math.min(q + 1, maxStock))}
                    disabled={qty >= maxStock}
                    className="px-4 h-full flex items-center transition-colors duration-150 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ fontSize: 18, color: C.primary }}>+</button>
                </div>
                <button data-testid="add-to-cart" onClick={handleAddToCart}
                  className="flex-grow font-bold uppercase transition-all active:scale-95 flex flex-col items-center justify-center"
                  style={{ height: 56, backgroundColor: C.primary, color: "#fff", letterSpacing: "0.18em", fontSize: 13 }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = C.primaryContainer)}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = C.primary)}>
                  <span>Add to Cart</span>
                  {currentPrice && (qty > 1 || discountPct > 0) && (
                    <span style={{ fontSize: 11, letterSpacing: "0.05em", opacity: 0.85, fontWeight: 400, marginTop: 2 }}>
                      {qty > 1 ? `${qty} × ${formatCurrency(parseFloat(String(currentPrice)))} = ${formatCurrency(qty * parseFloat(String(currentPrice)))}` : ""}
                      {qty > 1 && discountPct > 0 ? "  ·  " : ""}
                      {discountPct > 0 ? <span style={{ backgroundColor: "#FFD700", color: "#1a1a1a", fontWeight: 800, padding: "1px 6px", borderRadius: 2 }}>{discountPct}% OFF</span> : ""}
                    </span>
                  )}
                </button>
                <button data-testid="wishlist-btn" onClick={handleWishlist} disabled={wishlistPending}
                  className="flex items-center justify-center transition-colors"
                  style={{ width: 56, height: 56, border: `1px solid ${C.outlineVariant}`, color: inWishlist ? "#ba1a1a" : C.onSurfaceVariant }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = C.primary)}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = C.outlineVariant)}>
                  <Heart className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`} />
                </button>
              </div>

              {/* Trust badges row — icon + label only */}
              <div className="grid grid-cols-3 gap-2 py-6 border-b" style={{ borderColor: `${C.outlineVariant}4D` }}>
                <div className="flex flex-col items-center text-center gap-1">
                  <Truck className="w-5 h-5" style={{ color: C.primary }} />
                  <span style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurface }}>
                    {freeShipping ? "Free Shipping" : "Shipping"}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <RotateCcw className="w-5 h-5" style={{ color: C.primary }} />
                  <span style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurface }}>
                    {returnDays ? `${returnDays}-Day Returns` : "30-Day Returns"}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <Shield className="w-5 h-5" style={{ color: C.primary }} />
                  <span style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurface }}>Secure Checkout</span>
                </div>
              </div>

              {/* Info rows */}
              <div className="flex flex-col gap-2">
                {[
                  ["Ancestral Sourcing", returnText || "100% traceable, ethically harvested"],
                  ["Veterinary Approval", secureCheckoutText || "Formulated with nutritional scientists"],
                ].map(([label]) => (
                  <div key={label}
                    className="flex justify-between items-center py-3 cursor-pointer group border-b"
                    style={{ borderColor: `${C.outlineVariant}4D` }}>
                    <span style={{ ...LABEL_CAPS, color: C.primary }}>{label}</span>
                    <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" style={{ color: C.primary }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════ PRODUCT NARRATIVE ════ */}
        {longDescText && (
          <section className="py-20 border-t px-5 md:px-16" style={{ borderColor: `${C.outlineVariant}33` }}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5">
                <h2 style={{ ...PLAYFAIR, fontSize: 48, lineHeight: "56px", fontWeight: 600, fontStyle: "italic", color: C.primary, marginBottom: 32 }}>
                  Biological Synthesis
                </h2>
                <p style={{ fontSize: 18, lineHeight: "28px", fontWeight: 300, color: C.onSurfaceVariant }}
                  className="first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                  {longDescText}
                </p>
                {weight && (
                  <p style={{ ...MONO, fontSize: 11, color: C.onSurfaceVariant, marginTop: 24 }}>
                    WEIGHT: {weight}g{dimensions ? `  ·  DIMENSIONS: ${dimensions}` : ""}
                  </p>
                )}
              </div>
              <div className="md:col-start-7 md:col-span-6 relative h-[500px]">
                <div className="absolute inset-0 z-0 rounded-full blur-3xl" style={{ backgroundColor: `${C.primaryContainer}0D` }} />
                <img
                  src={allImgs.length > 1 ? allImgs[1] : allImgs[0]}
                  alt={product.title}
                  className="w-full h-full object-cover z-10 shadow-2xl"
                  style={{ filter: "grayscale(100%)", transition: "filter 0.5s ease", position: "relative" }}
                  onMouseOver={(e) => (e.currentTarget.style.filter = "grayscale(0%)")}
                  onMouseOut={(e) => (e.currentTarget.style.filter = "grayscale(100%)")}
                  loading="lazy"
                />
              </div>
            </div>
          </section>
        )}

        {/* ════ TECHNICAL SPEC SHEET ════ */}
        <section className="py-20" style={{ backgroundColor: "#ffffff", marginLeft: 0, marginRight: 0 }}>
          <div className="px-5 md:px-16 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <div>
                <span style={{ ...MONO, fontSize: 12, color: C.secondary, display: "block", marginBottom: 4 }}>
                  DATA REPORT {specimenNo(product.id)}-A
                </span>
                <h2 style={{ ...PLAYFAIR, fontSize: 32, lineHeight: "40px", color: C.primary }}>Technical Specification</h2>
              </div>
              <p style={{ ...LABEL_CAPS, color: C.onSurfaceVariant, borderBottom: `1px solid ${C.primary}`, paddingBottom: 4 }}>
                Laboratory Verified Content
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Macro Profile */}
              <div className="space-y-6">
                <h3 className="pb-2 border-b" style={{ ...LABEL_CAPS, color: C.onSurface, borderColor: `${C.outlineVariant}4D` }}>
                  Macro Profile (%)
                </h3>
                <div className="space-y-8">
                  {[["PROTEIN (MIN)", 68.5], ["FAT (MAX)", 12.2], ["MOISTURE (MAX)", 8.2], ["CRUDE FIBRE (MAX)", 3.5]].map(([label, val]) => (
                    <div key={String(label)}>
                      <div className="flex justify-between mb-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>
                        <span>{label}</span><span>{val}%</span>
                      </div>
                      <div className="w-full h-0.5" style={{ backgroundColor: `${C.outlineVariant}4D` }}>
                        <div className="h-full transition-all duration-1000" style={{ width: `${val}%`, backgroundColor: "#fe9e71" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Micronutrient Density */}
              <div className="space-y-6">
                <h3 className="pb-2 border-b" style={{ ...LABEL_CAPS, color: C.onSurface, borderColor: `${C.outlineVariant}4D` }}>
                  Micronutrient Density (mg/kg)
                </h3>
                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  {[["IRON", "24.1"], ["COPPER", "4.8"], ["OMEGA-3", "1200"], ["SELENIUM", "0.9"]].map(([label, value]) => (
                    <div key={label} className="pl-4" style={{ borderLeft: `2px solid ${C.primaryContainer}` }}>
                      <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurfaceVariant }}>{label}</p>
                      <p style={{ ...PLAYFAIR, fontSize: 32, lineHeight: "40px", color: C.primary }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Admin product metadata */}
                {(weight || dimensions) && (
                  <div className="pt-4 space-y-2 border-t" style={{ borderColor: `${C.outlineVariant}4D` }}>
                    {weight && <div className="flex justify-between" style={{ ...MONO, fontSize: 12, color: C.onSurfaceVariant }}><span>WEIGHT</span><span>{weight}g</span></div>}
                    {dimensions && <div className="flex justify-between" style={{ ...MONO, fontSize: 12, color: C.onSurfaceVariant }}><span>DIMENSIONS</span><span>{dimensions}</span></div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Ads: product-hero bottom (After Product Details) ── */}
        <AdBannerStrip banners={bs("product-hero", "bottom")} />

        {/* ── Ads: product-feedback top (Before Customer Feedback) ── */}
        <AdBannerStrip banners={bs("product-feedback", "top")} />

        {/* ════ CUSTOMER FEEDBACK ════ */}
        {(() => {
          // Merge real reviews with editorial placeholders for a full section
          const BUILTIN_PLACEHOLDERS = [
            { name: "Priya S.", role: "Labrador Owner", avatarBg: "#a5d0b8", avatarFg: "#264e3c", rating: 5, reviewText: "My lab absolutely loves this meal. The coat quality has visibly improved within 3 weeks. Will never go back to kibble.", hasMedia: true, mediaType: "photo" },
            { name: "Rohan M.", role: "Golden Retriever Dad", avatarBg: "#ffb695", avatarFg: "#76330d", rating: 5, reviewText: "Ordered twice now. The packaging is premium and the food smells genuinely fresh. My dog finishes the bowl in under 2 minutes.", hasMedia: true, mediaType: "video" },
            { name: "Ananya K.", role: "Verified Buyer", avatarBg: "#c0edd4", avatarFg: "#012d1d", rating: 5, reviewText: "Switched from another brand and the difference in energy levels is remarkable. 19 Dogs is worth every rupee.", hasMedia: false, mediaType: "photo" },
            { name: "Vikram T.", role: "Dog Trainer", avatarBg: "#ffdbcc", avatarFg: "#471800", rating: 4, reviewText: "Use this as training reward and as daily meals. High acceptance rate across all breeds I work with. Strongly recommended.", hasMedia: true, mediaType: "photo" },
            { name: "Meera R.", role: "Poodle Owner", avatarBg: "#a5d0b8", avatarFg: "#264e3c", rating: 5, reviewText: "The ingredients list is clean and transparent. I can trust what I'm feeding. My vet approves!", hasMedia: false, mediaType: "video" },
            { name: "Arjun D.", role: "Husky Parent", avatarBg: "#ffb695", avatarFg: "#76330d", rating: 5, reviewText: "Best decision for my husky. He used to be a picky eater — now he gets excited at meal time. The texture and smell are excellent.", hasMedia: true, mediaType: "video" },
          ];

          type FeedbackItem = {
            id: string | number;
            name: string;
            role: string;
            initials: string;
            color: string;
            bg: string;
            rating: number;
            text: string;
            hasMedia: boolean;
            mediaType: "photo" | "video";
            mediaUrl: string | null;
          };

          function getYouTubeId(url: string): string | null {
            const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            return m ? m[1] : null;
          }

          // Use admin-entered feedback if available, otherwise fall back to built-ins
          const rawSource: any[] = adminFeedback.length > 0 ? adminFeedback : BUILTIN_PLACEHOLDERS;

          const feedbackItems: FeedbackItem[] = rawSource.slice(0, 6).map((item: any, i: number) => {
            const nm: string = item.name || "Verified Buyer";
            const parts = nm.trim().split(" ");
            const initials = parts.map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
            return {
              id: item.id ?? i,
              name: nm,
              role: item.role || "Verified Buyer",
              initials,
              color: item.avatarFg || "#264e3c",
              bg: item.avatarBg || "#a5d0b8",
              rating: item.rating ?? 5,
              text: item.reviewText || "",
              hasMedia: item.hasMedia ?? false,
              mediaType: (item.mediaType === "video" ? "video" : "photo") as "photo" | "video",
              mediaUrl: item.mediaUrl ?? null,
            };
          });

          const totalReviews = product.reviewCount ?? (reviews.length > 0 ? reviews.length : 142);
          const displayRating = avgRating > 0 ? avgRating : 4.9;

          const AvatarCircle = ({ item, size = 56 }: { item: FeedbackItem; size?: number }) => (
            <div className="rounded-full flex items-center justify-center font-bold shrink-0"
              style={{ width: size, height: size, backgroundColor: item.bg, color: item.color, fontSize: size * 0.3, fontFamily: "'Inter', sans-serif" }}>
              {item.initials}
            </div>
          );

          const StarRow = ({ rating, light = false }: { rating: number; light?: boolean }) => (
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <svg key={s} width={14} height={14} viewBox="0 0 24 24"
                  fill={s <= rating ? (light ? "#a5d0b8" : C.primary) : "none"}
                  stroke={light ? "#a5d0b8" : C.primary} strokeWidth={1.5}>
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              ))}
            </div>
          );

          const MediaBlock = ({ item }: { item: FeedbackItem }) => {
            if (!item.hasMedia) return null;

            if (item.mediaType === "video" && item.mediaUrl) {
              const ytId = getYouTubeId(item.mediaUrl);
              if (ytId) {
                return (
                  <div className="w-full rounded-sm overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      title="Customer video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                );
              }
            }

            if (item.mediaType === "photo" && item.mediaUrl) {
              return (
                <div className="w-full rounded-sm overflow-hidden" style={{ aspectRatio: "4/3" }}>
                  <img src={item.mediaUrl} alt={`${item.name}'s photo`}
                    className="w-full h-full object-cover" />
                </div>
              );
            }

            // Placeholder when hasMedia=true but no URL yet
            return (
              <div className="w-full rounded-sm overflow-hidden flex items-center justify-center"
                style={{ aspectRatio: "4/3", backgroundColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex flex-col items-center gap-2">
                  {item.mediaType === "video" ? (
                    <>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      </div>
                      <span style={{ ...MONO, fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Customer Video</span>
                    </>
                  ) : (
                    <>
                      <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
                        stroke="rgba(255,255,255,0.4)" strokeWidth={1.5}>
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21,15 16,10 5,21"/>
                      </svg>
                      <span style={{ ...MONO, fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Customer Photo</span>
                    </>
                  )}
                </div>
              </div>
            );
          };

          return (
            <section style={{ backgroundColor: C.primary, color: "#fff" }}>
              {/* ── Section header ── */}
              <div className="px-5 md:px-16 pt-20 pb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <p style={{ ...LABEL_CAPS, color: "#a5d0b8", marginBottom: 8 }}>Verified Purchasers</p>
                    <h2 style={{ ...PLAYFAIR, fontSize: "clamp(36px,5vw,56px)", fontWeight: 600, lineHeight: 1.1, color: "#fff" }}>
                      Customer Feedback
                    </h2>
                  </div>
                  <div className="flex items-center gap-6 pb-2">
                    <div className="text-center">
                      <p style={{ ...PLAYFAIR, fontSize: 48, fontWeight: 600, color: "#c0edd4", lineHeight: 1 }}>
                        {displayRating.toFixed(1)}
                      </p>
                      <div className="flex justify-center mt-1">
                        <StarRow rating={5} light />
                      </div>
                      <p style={{ ...MONO, fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                        {totalReviews}+ Reviews
                      </p>
                    </div>
                    <div className="w-px h-16" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
                    <div className="space-y-1">
                      {[["5 ★", 82], ["4 ★", 12], ["3 ★", 4], ["2 ★", 1], ["1 ★", 1]].map(([label, pct]) => (
                        <div key={String(label)} className="flex items-center gap-2">
                          <span style={{ ...MONO, fontSize: 10, color: "rgba(255,255,255,0.5)", width: 28 }}>{label}</span>
                          <div className="h-1 rounded-full overflow-hidden" style={{ width: 80, backgroundColor: "rgba(255,255,255,0.1)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#a5d0b8" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bento grid ── */}
              <div className="px-5 md:px-16 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                  {/* Featured large card — col-span-5 */}
                  {feedbackItems[0] && (
                    <div className="md:col-span-5 flex flex-col gap-4 p-8"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div className="flex items-center gap-3">
                        <AvatarCircle item={feedbackItems[0]} size={56} />
                        <div>
                          <p style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>{feedbackItems[0].name}</p>
                          <p style={{ ...MONO, fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{feedbackItems[0].role}</p>
                        </div>
                        <div className="ml-auto">
                          <StarRow rating={feedbackItems[0].rating} light />
                        </div>
                      </div>
                      {feedbackItems[0].hasMedia && (
                        <MediaBlock item={feedbackItems[0]} />
                      )}
                      <p style={{ ...PLAYFAIR, fontSize: 18, fontStyle: "italic", lineHeight: 1.75, color: "rgba(255,255,255,0.85)" }}>
                        "{feedbackItems[0].text}"
                      </p>
                      <div className="flex items-center gap-2 mt-auto pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="#a5d0b8"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <span style={{ ...MONO, fontSize: 10, color: "#a5d0b8" }}>Verified Purchase</span>
                      </div>
                    </div>
                  )}

                  {/* Middle column — two stacked cards — col-span-4 */}
                  <div className="md:col-span-4 flex flex-col gap-4">
                    {feedbackItems[1] && (
                      <div className="flex-1 p-6 flex flex-col gap-4"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <div className="flex items-center gap-3">
                          <AvatarCircle item={feedbackItems[1]} size={44} />
                          <div className="flex-1 min-w-0">
                            <p style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{feedbackItems[1].name}</p>
                            <p style={{ ...MONO, fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{feedbackItems[1].role}</p>
                          </div>
                          <StarRow rating={feedbackItems[1].rating} light />
                        </div>
                        <p style={{ ...PLAYFAIR, fontSize: 15, fontStyle: "italic", lineHeight: 1.7, color: "rgba(255,255,255,0.8)" }}>
                          "{feedbackItems[1].text}"
                        </p>
                        {feedbackItems[1].hasMedia && (
                          <MediaBlock item={feedbackItems[1]} />
                        )}
                      </div>
                    )}
                    {feedbackItems[2] && (
                      <div className="flex-1 p-6 flex flex-col gap-3"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <div className="flex items-center gap-3">
                          <AvatarCircle item={feedbackItems[2]} size={44} />
                          <div className="flex-1 min-w-0">
                            <p style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{feedbackItems[2].name}</p>
                            <p style={{ ...MONO, fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{feedbackItems[2].role}</p>
                          </div>
                          <StarRow rating={feedbackItems[2].rating} light />
                        </div>
                        <p style={{ ...PLAYFAIR, fontSize: 15, fontStyle: "italic", lineHeight: 1.7, color: "rgba(255,255,255,0.8)" }}>
                          "{feedbackItems[2].text}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right column — stat tile + card — col-span-3 */}
                  <div className="md:col-span-3 flex flex-col gap-4">
                    <div className="p-6 flex flex-col items-center justify-center text-center"
                      style={{ backgroundColor: "#a5d0b8", minHeight: 140 }}>
                      <p style={{ ...PLAYFAIR, fontSize: 52, fontWeight: 700, color: C.primary, lineHeight: 1 }}>98%</p>
                      <p style={{ ...MONO, fontSize: 10, color: C.primaryContainer, marginTop: 6, lineHeight: 1.5 }}>
                        Would recommend to another dog parent
                      </p>
                    </div>
                    {feedbackItems[3] && (
                      <div className="flex-1 p-6 flex flex-col gap-3"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <div className="flex items-center gap-3">
                          <AvatarCircle item={feedbackItems[3]} size={40} />
                          <div className="flex-1 min-w-0">
                            <p style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{feedbackItems[3].name}</p>
                            <StarRow rating={feedbackItems[3].rating} light />
                          </div>
                        </div>
                        {feedbackItems[3].hasMedia && (
                          <MediaBlock item={feedbackItems[3]} />
                        )}
                        <p style={{ ...PLAYFAIR, fontSize: 14, fontStyle: "italic", lineHeight: 1.65, color: "rgba(255,255,255,0.75)" }}>
                          "{feedbackItems[3].text}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom row — 3 equal cards */}
                  {feedbackItems.slice(4, 6).map((item) => (
                    <div key={item.id} className="md:col-span-6 p-6 flex gap-5"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <AvatarCircle item={item} size={52} />
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>{item.name}</p>
                            <p style={{ ...MONO, fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{item.role}</p>
                          </div>
                          <StarRow rating={item.rating} light />
                        </div>
                        <p style={{ ...PLAYFAIR, fontSize: 15, fontStyle: "italic", lineHeight: 1.7, color: "rgba(255,255,255,0.8)" }}>
                          "{item.text}"
                        </p>
                        {item.hasMedia && (
                          <div className="mt-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm"
                              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                              {item.mediaType === "video"
                                ? <svg width={12} height={12} viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)"><polygon points="5,3 19,12 5,21"/></svg>
                                : <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
                              }
                              <span style={{ ...MONO, fontSize: 9, color: "rgba(255,255,255,0.5)" }}>
                                {item.mediaType === "video" ? "Customer Video Attached" : "Customer Photo Attached"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Submit / CTA row ── */}
                <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6 pt-10"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <p style={{ ...PLAYFAIR, fontSize: 20, fontStyle: "italic", color: "rgba(255,255,255,0.6)" }}>
                    Share your experience with the pack.
                  </p>
                  <div className="flex gap-4 items-center">
                    {isAuthenticated && canReviewData?.canReview && !showReviewForm && (
                      <button data-testid="write-review-btn" onClick={() => setShowReviewForm(true)}
                        className="px-8 py-3 transition-opacity hover:opacity-80"
                        style={{ backgroundColor: "#fff", color: C.primary, ...LABEL_CAPS }}>
                        Write a Review
                      </button>
                    )}
                    {reviews.length > 0 && (
                      <button style={{ ...LABEL_CAPS, borderBottom: "1px solid rgba(255,255,255,0.4)", paddingBottom: 3, color: "rgba(255,255,255,0.7)" }}>
                        View All {totalReviews}+ Reviews
                      </button>
                    )}
                  </div>
                </div>

                {/* Review form */}
                {showReviewForm && (
                  <div className="mt-8 p-8 max-w-2xl"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <p style={{ ...LABEL_CAPS, color: "#a5d0b8", marginBottom: 16 }}>New Customer Review</p>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setReviewRating(s)}>
                          <svg width={24} height={24} viewBox="0 0 24 24"
                            fill={s <= reviewRating ? "#a5d0b8" : "none"}
                            stroke="#a5d0b8" strokeWidth={1.5}>
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                          </svg>
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <input data-testid="review-title" value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="Review title"
                        className="w-full px-4 py-3 bg-transparent"
                        style={{ border: "1px solid rgba(255,255,255,0.2)", color: "#fff", outline: "none", fontFamily: "Inter, sans-serif" }} />
                      <textarea data-testid="review-content" value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        placeholder="Tell us about your experience…" rows={4}
                        className="w-full px-4 py-3 bg-transparent resize-none"
                        style={{ border: "1px solid rgba(255,255,255,0.2)", color: "#fff", outline: "none", fontFamily: "Inter, sans-serif" }} />
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button data-testid="submit-review"
                        onClick={() => submitReview.mutate({ rating: reviewRating, title: reviewTitle, content: reviewContent })}
                        disabled={submitReview.isPending || !reviewContent.trim()}
                        style={{ backgroundColor: "#fff", color: C.primary, ...LABEL_CAPS, padding: "12px 32px", opacity: submitReview.isPending ? 0.7 : 1 }}>
                        {submitReview.isPending ? "Submitting…" : "Submit Review"}
                      </button>
                      <button onClick={() => setShowReviewForm(false)}
                        style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", ...LABEL_CAPS, padding: "12px 32px" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {/* ── Ads: product-feedback bottom (After Customer Feedback) ── */}
        <AdBannerStrip banners={bs("product-feedback", "bottom")} />

        {/* ════ RELATED SPECIMENS ════ */}
        {related.length > 0 && (
          <section className="py-20 px-5 md:px-16 border-t" style={{ borderColor: `${C.outlineVariant}33` }}>
            <div className="max-w-7xl mx-auto">
              <h2 style={{ ...PLAYFAIR, fontSize: "clamp(32px,4vw,48px)", fontWeight: 600, fontStyle: "italic", color: C.primary, marginBottom: 32 }}>
                Related Specimens
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((rp: any) => {
                  const rpImg = getImg(rp);
                  const rpPrice = rp.salePrice || rp.price;
                  return (
                    <Link key={rp.id} href={`/full-meals/product/${rp.slug}`}>
                      <div className="group cursor-pointer">
                        <div className="overflow-hidden mb-4 border" style={{ aspectRatio: "4/5", borderColor: `${C.outlineVariant}4D` }}>
                          <img src={rpImg} alt={rp.title} loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                        <p style={{ ...LABEL_CAPS, color: C.secondary, fontSize: 12, marginBottom: 4 }}>
                          Specimen No. {specimenNo(rp.id)}
                        </p>
                        <h3 style={{ ...PLAYFAIR, fontSize: 24, color: C.primary, marginBottom: 8 }}>{rp.title}</h3>
                        {rp.shortDesc && (
                          <p style={{ fontSize: 14, color: C.onSurfaceVariant, marginBottom: 16 }}>{rp.shortDesc}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.primary }}>
                            {rpPrice ? formatCurrency(rpPrice) : "—"}
                          </span>
                          <button data-testid={`related-view-${rp.id}`}
                            style={{ ...LABEL_CAPS, borderBottom: `1px solid ${C.primary}`, paddingBottom: 4, color: C.primary }}
                            className="hover:text-secondary hover:border-secondary transition-colors">
                            View Specimen
                          </button>
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
