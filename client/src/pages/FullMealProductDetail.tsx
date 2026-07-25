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
  const hasDiscount = !!(currentPrice && originalPrice && parseFloat(String(currentPrice)) < parseFloat(String(originalPrice)));

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
                  <button data-testid="qty-plus" onClick={() => setQty((q) => q + 1)}
                    className="px-4 h-full flex items-center transition-colors duration-150 hover:bg-gray-100"
                    style={{ fontSize: 18, color: C.primary }}>+</button>
                </div>
                <button data-testid="add-to-cart" onClick={handleAddToCart}
                  className="flex-grow font-bold uppercase transition-all active:scale-95"
                  style={{ height: 56, backgroundColor: C.primary, color: "#fff", letterSpacing: "0.18em", fontSize: 13 }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = C.primaryContainer)}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = C.primary)}>
                  Add to Cart
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

        {/* ════ FIELD REPORTS (Reviews) ════ */}
        <section className="py-20 px-5 md:px-16 max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 style={{ ...PLAYFAIR, fontSize: "clamp(32px,5vw,48px)", fontWeight: 600, lineHeight: "56px", color: C.primary }}>
              Field Reports
            </h2>
            {avgRating > 0 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => <FilledStar key={s} size={20} />)}
                </div>
                <span style={{ ...MONO, fontSize: 12 }}>Based on {product.reviewCount ?? reviews.length} Observations</span>
              </div>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {reviews.slice(0, 4).map((r) => (
                <div key={r.id} className="p-8 space-y-4 border-l" style={{ borderColor: `${C.outlineVariant}4D` }}>
                  <p style={{ fontSize: 18, lineHeight: "28px", fontWeight: 300, fontStyle: "italic", color: C.onSurface }}>
                    "{r.content}"
                  </p>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", color: C.primary, letterSpacing: "0.05em" }}>
                      {r.user?.firstName ? `${r.user.firstName} ${r.user.lastName || ""}`.trim() : "Verified Buyer"}
                    </p>
                    {r.title && (
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.onSurfaceVariant }}>
                        {r.title}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Placeholder reviews matching the Stitch design */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                ["Dr. Adrian Vance", "Behavioral K9 Specialist", "The texture is superior to any commercial jerky I've tested. My Malinois shows heightened focus during scent-work when used as a primary motivator."],
                ["Sarah J. L.", "Professional Show Handler", "A biological marvel. The transition from raw-fed to 19 Dogs snacks was seamless. The coat quality improvement over 30 days is clinically visible."],
                ["Julian Thorne", "Verified Collector", "Minimalist packaging meets maximalist nutrition. It's the only treat my sensitive-stomach GSP can process without inflammation."],
                ["Marcus Wei", "Urban K9 Athletics", "The specimens arrive in perfect condition. The moisture control is evident. It snaps perfectly for micro-dosing during high-intensity training."],
              ].map(([name, role, text]) => (
                <div key={name} className="p-8 border-l space-y-4" style={{ borderColor: `${C.outlineVariant}4D` }}>
                  <p style={{ fontSize: 18, lineHeight: "28px", fontWeight: 300, fontStyle: "italic", color: C.onSurface }}>"{text}"</p>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", color: C.primary, letterSpacing: "0.05em" }}>{name}</p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.onSurfaceVariant }}>{role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-20 text-center">
            {isAuthenticated && canReviewData?.canReview && !showReviewForm && (
              <button data-testid="write-review-btn" onClick={() => setShowReviewForm(true)}
                style={{ ...LABEL_CAPS, borderBottom: `2px solid ${C.primary}`, paddingBottom: 4, color: C.primary }}>
                Submit Field Report
              </button>
            )}
            {!showReviewForm && reviews.length > 0 && (
              <button style={{ ...LABEL_CAPS, borderBottom: `2px solid ${C.primary}`, paddingBottom: 4, color: C.primary }}>
                View All Field Observations
              </button>
            )}
            {showReviewForm && (
              <div className="max-w-xl mx-auto text-left mt-8 p-8 space-y-4" style={{ border: `1px solid ${C.outlineVariant}4D` }}>
                <p style={{ ...LABEL_CAPS, color: C.primary }}>New Field Report</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setReviewRating(s)}>
                      <Star className={`w-6 h-6 ${s <= reviewRating ? "fill-current" : ""}`} style={{ color: C.primary }} />
                    </button>
                  ))}
                </div>
                <input data-testid="review-title" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Report title" className="w-full px-4 py-3 bg-transparent"
                  style={{ border: `1px solid ${C.outlineVariant}`, color: C.onSurface, outline: "none", fontFamily: "Inter, sans-serif" }} />
                <textarea data-testid="review-content" value={reviewContent} onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="Describe your observation…" rows={5} className="w-full px-4 py-3 bg-transparent resize-none"
                  style={{ border: `1px solid ${C.outlineVariant}`, color: C.onSurface, outline: "none", fontFamily: "Inter, sans-serif" }} />
                <div className="flex gap-3">
                  <button data-testid="submit-review"
                    onClick={() => submitReview.mutate({ rating: reviewRating, title: reviewTitle, content: reviewContent })}
                    disabled={submitReview.isPending || !reviewContent.trim()}
                    style={{ backgroundColor: C.primary, color: "#fff", ...LABEL_CAPS, padding: "12px 32px", opacity: submitReview.isPending ? 0.7 : 1 }}>
                    {submitReview.isPending ? "Submitting…" : "Submit"}
                  </button>
                  <button onClick={() => setShowReviewForm(false)}
                    style={{ border: `1px solid ${C.outlineVariant}`, color: C.onSurfaceVariant, ...LABEL_CAPS, padding: "12px 32px" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

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
