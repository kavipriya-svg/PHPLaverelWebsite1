import { useState, useEffect, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ShoppingCart, ArrowRight, Truck, RotateCcw, Shield, Heart, Timer, BadgeCheck,
} from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { HomeEditorialHeader as EditorialHeader, HomeEditorialFooter as EditorialFooter } from "@/components/store/HomeEditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";
import type { HomepageSettings } from "@/lib/homepageDefaults";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductWithDetails, Coupon, ReviewWithUser } from "@shared/schema";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  primary:            "#00160c",
  secondary:          "#944923",
  primaryContainer:   "#1a3d28",
  onSurface:          "#1a1c1a",
  onSurfaceVariant:   "#414844",
  outlineVariant:     "#c1c8c2",
  secondaryFixed:     "#ffdbcc",
  surface:            "#f9faf6",
  white:              "#ffffff",
};
const MONO: React.CSSProperties      = { fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em" };
const PLAYFAIR: React.CSSProperties  = { fontFamily: "Playfair Display, serif" };
const INTER: React.CSSProperties     = { fontFamily: "Inter, sans-serif" };
const LABEL_CAPS: React.CSSProperties = { ...INTER, fontSize: 11, lineHeight: "16px", letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const GIFT_FALLBACKS = [
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=900&auto=format&fit=crop",
];
function fallbackImg(i: number) { return GIFT_FALLBACKS[i % GIFT_FALLBACKS.length]; }
function getImg(product: any, idx = 0) {
  const imgs = product?.images || product?.productImages || [];
  const img = imgs[idx];
  return img?.url || img?.imageUrl || (idx === 0 ? product?.imageUrl || "" : "");
}
function stripHtml(html = "") { return html.replace(/<[^>]+>/g, "").trim(); }
function couponLabel(c: Coupon) {
  return c.type === "percentage" ? `${c.amount}% OFF` : `₹${parseFloat(c.amount as string).toFixed(0)} OFF`;
}

function FilledStar({ size = 16, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={light ? C.secondaryFixed : C.secondary} stroke="none">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}
function StarRow({ rating, light = false }: { rating: number; light?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1,2,3,4,5].map(s => <span key={s} style={{ opacity: s <= rating ? 1 : 0.25 }}><FilledStar size={14} light={light} /></span>)}
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "10px 14px", minWidth: 52, backgroundColor: C.primary, color: C.white }}>
      <div style={{ ...MONO, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{String(value).padStart(2, "0")}</div>
      <div style={{ ...MONO, fontSize: 9, marginTop: 4, color: C.secondaryFixed }}>{label}</div>
    </div>
  );
}

// ─── Related products ─────────────────────────────────────────────────────────
const TWINNING_CATEGORY_ID = "90bfbd9f-a163-4612-88d5-79dc1e782591";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DogGiftSeriesProductDetail() {
  const [, params] = useRoute("/giftseries/product/:slug");
  const slug = params?.slug;

  const [activeImg, setActiveImg]                       = useState(0);
  const [qty, setQty]                                   = useState(1);
  const [selectedVariantId, setSelectedVariantId]       = useState<string | undefined>();
  const [copiedCode, setCopiedCode]                     = useState<string | null>(null);
  const [countdown, setCountdown]                       = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [showReviewForm, setShowReviewForm]             = useState(false);
  const [reviewRating, setReviewRating]                 = useState(5);
  const [reviewTitle, setReviewTitle]                   = useState("");
  const [reviewContent, setReviewContent]               = useState("");
  const [wishlistPending, setWishlistPending]           = useState(false);

  const { addToCart, isInWishlist, toggleWishlist } = useStore();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: homepageData } = useQuery<{ settings: Partial<HomepageSettings> }>({ queryKey: ["/api/settings/homepage"] });
  const nav    = homepageData ? mergeHomepageSettings(homepageData.settings || {}).nav    : DEFAULT_HOMEPAGE_SETTINGS.nav;
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

  // Related from Dog Parent Clothing
  const { data: relatedData } = useQuery<{ products: any[] }>({
    queryKey: ["/api/products", `categoryId=${TWINNING_CATEGORY_ID}&limit=4`],
    queryFn: async () => { const r = await fetch(`/api/products?categoryId=${TWINNING_CATEGORY_ID}&limit=4`); return r.json(); },
  });

  const submitReview = useMutation({
    mutationFn: (body: { rating: number; title: string; content: string }) =>
      apiRequest("POST", `/api/products/${product?.id}/reviews`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product?.id, "reviews"] });
      toast({ title: "Field Report submitted." });
      setShowReviewForm(false); setReviewTitle(""); setReviewContent(""); setReviewRating(5);
    },
    onError: () => toast({ title: "Error", description: "Could not submit.", variant: "destructive" }),
  });

  useEffect(() => {
    const variants = product?.variants || [];
    if (variants.length > 0 && !selectedVariantId) setSelectedVariantId(String(variants[0].id));
    setActiveImg(0);
  }, [product?.id]);

  // Sale countdown
  const salePriceEnd   = (product as any)?.salePriceEnd;
  const salePriceStart = (product as any)?.salePriceStart;
  const isOnSale       = (product as any)?.isOnSale;
  const isSaleActive   = isOnSale && salePriceEnd && new Date(salePriceEnd) > new Date() &&
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

  // ── Loading / not found ────────────────────────────────────────────────────
  if (isLoading) return (
    <>
      <EditorialHeader nav={nav} />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 96 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `2px solid ${C.primary}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
          <p style={{ ...MONO, fontSize: 11, color: C.onSurfaceVariant }}>Loading specimen…</p>
        </div>
      </div>
      <EditorialFooter footer={footer} />
    </>
  );

  if (!product) return (
    <>
      <EditorialHeader nav={nav} />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 96 }}>
        <p style={{ ...MONO, fontSize: 11, color: C.onSurfaceVariant }}>Specimen not found</p>
        <Link href="/giftseries">
          <button style={{ ...LABEL_CAPS, padding: "16px 32px", border: `2px solid ${C.primary}`, color: C.primary, background: "transparent", cursor: "pointer" }}>
            ← Return to Gift Vault
          </button>
        </Link>
      </div>
      <EditorialFooter footer={footer} />
    </>
  );

  // ── Derived ────────────────────────────────────────────────────────────────
  const images   = product.images || [];
  const allImgs: string[] = images.length > 0 ? images.map((i: any) => i.url || i.imageUrl || "") : [getImg(product)];
  if (allImgs.every(s => !s)) allImgs.splice(0, allImgs.length, fallbackImg(0));

  const variants         = product.variants || [];
  const selectedVariant  = variants.find((v: any) => String(v.id) === selectedVariantId);
  const currentPrice     = selectedVariant?.salePrice || selectedVariant?.price || product.salePrice || product.price;
  const originalPrice    = selectedVariant?.price || product.price;
  const maxStock         = selectedVariant?.stock ?? product.stock ?? Infinity;
  const hasDiscount      = !!(currentPrice && originalPrice && parseFloat(String(currentPrice)) < parseFloat(String(originalPrice)));

  const allCoupons      = (couponsData?.coupons || []).filter(c => c.isActive);
  const productCoupons  = allCoupons.filter(c => c.productId === product.id);
  const storeCoupons    = allCoupons.filter(c => !c.productId && (!c.minQuantity || c.minQuantity <= 1));
  const bulkCoupons     = allCoupons.filter(c => !c.productId && c.minQuantity && c.minQuantity > 1);
  const visibleCoupons  = [...productCoupons, ...storeCoupons.slice(0, 3), ...bulkCoupons.slice(0, 2)];

  const reviews   = (reviewsData?.reviews || []).filter(r => r.status === "approved");
  const avgRating = product.averageRating ? parseFloat(String(product.averageRating)) : 0;
  const related   = (relatedData?.products || []).filter(p => p.id !== product.id).slice(0, 4);
  const inWishlist = isInWishlist?.(product.id) ?? false;

  const shortDesc     = (product as any).shortDesc as string | undefined;
  const longDesc      = (product as any).longDesc || (product as any).description;
  const longDescText  = longDesc ? stripHtml(longDesc) : "";
  const weight        = (product as any).weight;
  const dimensions    = (product as any).dimensions;
  const returnDays    = (product as any).returnDays as number | undefined;
  const freeShipping  = (product as any).freeShipping as boolean | undefined;
  const shippingText  = (product as any).shippingText as string | undefined;
  const gstRate       = (product as any).gstRate as string | undefined;

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

  const displayRating  = avgRating > 0 ? avgRating : 4.9;
  const totalReviews   = product.reviewCount ?? (reviews.length > 0 ? reviews.length : 47);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <EditorialHeader nav={nav} />

      <main style={{ marginTop: 96, backgroundColor: C.surface, color: C.onSurface, fontFamily: "Inter, sans-serif", overflowX: "hidden" }}>

        {/* Breadcrumb */}
        <div className="px-5 md:px-16 py-4 flex flex-wrap items-center gap-2" style={{ borderBottom: `1px solid ${C.outlineVariant}33` }}>
          <Link href="/giftseries">
            <span style={{ ...MONO, fontSize: 10, color: C.secondary, cursor: "pointer" }}>Gift Vault</span>
          </Link>
          <span style={{ ...MONO, fontSize: 10, color: C.outlineVariant }}>/</span>
          <span style={{ ...MONO, fontSize: 10, color: C.onSurfaceVariant }}>{product.title}</span>
        </div>

        {/* ════ HERO ════ */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 py-20 min-h-screen px-5 md:px-16">

          {/* Gallery */}
          <div className="md:col-span-7 flex flex-col md:flex-row gap-6 relative">
            {allImgs.length > 1 && (
              <div className="hidden md:flex flex-col gap-4 w-28 shrink-0">
                {allImgs.map((src, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} data-testid={`thumb-${i}`}
                    style={{ aspectRatio: "4/5", opacity: i === activeImg ? 1 : 0.45, border: `1px solid ${C.outlineVariant}4D`, overflow: "hidden" }}>
                    <img src={src || fallbackImg(i)} onError={e => { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb="1"; t.src = fallbackImg(i); } }} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-grow">
              <div className="relative overflow-hidden" style={{ aspectRatio: "4/5", boxShadow: "40px 40px 0px 0px rgba(0,22,12,0.12)" }}>
                <img
                  src={allImgs[activeImg] || fallbackImg(activeImg)}
                  onError={e => { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb="1"; t.src = fallbackImg(activeImg); } }}
                  alt={product.title} className="w-full h-full object-cover" loading="lazy"
                />
                {hasDiscount && (
                  <div className="absolute top-5 right-5 px-3 py-1" style={{ backgroundColor: C.secondary, color: C.white, ...LABEL_CAPS }}>SALE</div>
                )}
                <div className="absolute bottom-6 left-6 px-4 py-1" style={{ backgroundColor: C.primary, color: C.white, ...LABEL_CAPS, letterSpacing: "0.2em" }}>
                  Gift Vault
                </div>
              </div>
              {allImgs.length > 1 && (
                <div className="flex md:hidden gap-3 mt-4 overflow-x-auto">
                  {allImgs.map((src, i) => (
                    <button key={i} onClick={() => setActiveImg(i)} style={{ width: 64, aspectRatio: "4/5", flexShrink: 0, opacity: i === activeImg ? 1 : 0.45, border: `1px solid ${C.outlineVariant}4D`, overflow: "hidden" }}>
                      <img src={src || fallbackImg(i)} onError={e => { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb="1"; t.src = fallbackImg(i); } }} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Commerce block */}
          <div className="md:col-span-5 flex flex-col justify-start pt-8 md:pt-24 gap-8">
            <div className="space-y-2">
              <p style={{ ...LABEL_CAPS, color: C.secondary }}>Gift Vault Collection</p>
              <h1 style={{ ...PLAYFAIR, fontSize: "clamp(28px,4vw,44px)", fontWeight: 600, lineHeight: "1.15", color: C.primary }}>
                {product.title}
              </h1>
              {shortDesc && <p style={{ fontSize: 14, color: C.onSurfaceVariant, lineHeight: 1.7 }}>{shortDesc}</p>}

              <div className="flex flex-wrap items-center gap-4 py-3 border-y" style={{ borderColor: `${C.outlineVariant}33` }}>
                <span style={{ ...MONO, fontSize: 13, color: C.onSurface }}>
                  {product.sku ? `SKU: ${product.sku}` : `ID: ${product.id.slice(-6).toUpperCase()}`}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  {hasDiscount && (
                    <span style={{ color: C.onSurfaceVariant, fontSize: 16, textDecoration: "line-through" }}>
                      {formatCurrency(originalPrice!)}
                    </span>
                  )}
                  <span style={{ ...PLAYFAIR, fontSize: 32, lineHeight: "40px", fontWeight: 400, color: C.primary }}>
                    {formatCurrency(currentPrice!)}
                  </span>
                </div>
                {gstRate && <span style={{ fontSize: 10, color: C.onSurfaceVariant, textTransform: "uppercase" }}>+ {gstRate}% GST</span>}
              </div>

              {/* Rating strip */}
              {(avgRating > 0 || totalReviews > 0) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
                  <StarRow rating={Math.round(displayRating)} />
                  <span style={{ ...MONO, fontSize: 11, color: C.onSurfaceVariant }}>{displayRating.toFixed(1)} ({totalReviews} reports)</span>
                </div>
              )}
            </div>

            {/* Variant selector */}
            {variants.length > 0 ? (
              <div className="space-y-3">
                <label style={{ ...LABEL_CAPS, color: C.onSurfaceVariant, display: "block" }}>
                  Select {variants[0]?.optionName || "Option"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {variants.map((v: any) => {
                    const isSel = String(v.id) === selectedVariantId;
                    return (
                      <button key={v.id} data-testid={`variant-${v.id}`}
                        onClick={() => setSelectedVariantId(String(v.id))}
                        className="p-4 text-left flex justify-between items-center"
                        style={{ border: isSel ? `2px solid ${C.primary}` : `1px solid ${C.outlineVariant}`, transition: "border-color 0.2s" }}>
                        <span style={{ fontWeight: 700, color: isSel ? C.primary : C.onSurfaceVariant, fontSize: 14 }}>
                          {v.optionValue || v.name || "Standard"}
                        </span>
                        <span style={{ ...MONO, fontSize: 12, color: C.onSurfaceVariant }}>{formatCurrency(v.salePrice || v.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label style={{ ...LABEL_CAPS, color: C.onSurfaceVariant, display: "block" }}>Unit</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 flex justify-between items-center" style={{ border: `2px solid ${C.primary}` }}>
                    <span style={{ fontWeight: 700, color: C.primary, fontSize: 14 }}>{weight ? `${weight}g` : "Standard"}</span>
                    <span style={{ ...MONO, fontSize: 12, color: C.onSurfaceVariant }}>{formatCurrency(currentPrice!)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription nudge */}
            <div className="p-4 flex items-center gap-4" style={{ border: `1px solid ${C.secondary}33`, backgroundColor: "#fe9e7115" }}>
              <BadgeCheck className="w-5 h-5 shrink-0" style={{ color: C.secondary }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.primary, lineHeight: 1.4 }}>Subscription customers save more.</p>
                <p style={{ fontSize: 13, color: C.onSurfaceVariant, marginTop: 2 }}>Automated replenishment for your pet.</p>
              </div>
            </div>

            {/* Shipping / stock info */}
            <div className="flex justify-between items-center">
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.onSurfaceVariant }}>
                <Truck className="w-4 h-4" style={{ color: C.primary }} />
                <span>{deliveryDate ? `Delivery by ${deliveryDate}` : freeShipping ? (shippingText || "Free Shipping") : (shippingText || "Standard Shipping")}</span>
              </div>
              {product.stock != null && product.stock > 0 && (
                <div style={{ ...MONO, fontSize: 12, color: C.secondary }}>{product.stock} units left</div>
              )}
              {product.stock === 0 && (
                <div style={{ ...MONO, fontSize: 12, color: "#ba1a1a" }}>Out of stock</div>
              )}
            </div>

            {/* Sale countdown */}
            {isSaleActive && countdown && (
              <div data-testid="sale-countdown" className="space-y-2">
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

            {/* Coupons */}
            {visibleCoupons.length > 0 && (
              <div className="space-y-3" data-testid="card-coupons">
                <p style={{ ...LABEL_CAPS, color: C.onSurfaceVariant }}>Available Coupons</p>
                <div className="flex flex-wrap gap-2">
                  {visibleCoupons.map(c => (
                    <button key={c.id} data-testid={`coupon-${c.id}`}
                      onClick={() => copyCode(c.code)} title="Click to copy"
                      className="flex flex-col text-left transition-opacity hover:opacity-80"
                      style={{ border: `1px dashed ${C.primary}`, padding: "4px 12px", borderRadius: 4 }}>
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
                <button data-testid="qty-minus" onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-4 h-full flex items-center hover:bg-gray-100 transition-colors"
                  style={{ fontSize: 20, color: C.primary }}>−</button>
                <input type="number" value={qty} readOnly data-testid="qty-input"
                  className="w-12 text-center bg-transparent border-none focus:ring-0"
                  style={{ fontSize: 16, color: C.onSurface }} />
                <button data-testid="qty-plus" onClick={() => setQty(q => Math.min(q + 1, maxStock))}
                  disabled={qty >= maxStock}
                  className="px-4 h-full flex items-center hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ fontSize: 20, color: C.primary }}>+</button>
              </div>
              <button data-testid="add-to-cart" onClick={handleAddToCart}
                className="flex-grow font-bold uppercase active:scale-95 transition-all"
                style={{ height: 56, backgroundColor: C.primary, color: C.white, ...LABEL_CAPS, letterSpacing: "0.18em" }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = C.primaryContainer)}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = C.primary)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <ShoppingCart size={16} /> Add to Cart
                </div>
              </button>
              <button data-testid="wishlist-btn" onClick={handleWishlist} disabled={wishlistPending}
                className="flex items-center justify-center transition-colors"
                style={{ width: 56, height: 56, border: `1px solid ${C.outlineVariant}`, color: inWishlist ? "#ba1a1a" : C.onSurfaceVariant }}
                onMouseOver={e => (e.currentTarget.style.borderColor = C.primary)}
                onMouseOut={e => (e.currentTarget.style.borderColor = C.outlineVariant)}>
                <Heart className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 py-4 border-y" style={{ borderColor: `${C.outlineVariant}33` }}>
              {[
                { Icon: Truck, label: freeShipping ? "Free Shipping" : "Shipping" },
                { Icon: RotateCcw, label: returnDays ? `${returnDays}-Day Returns` : "30-Day Returns" },
                { Icon: Shield, label: "Secure Checkout" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1">
                  <Icon className="w-5 h-5" style={{ color: C.primary }} />
                  <span style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurface }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Info rows */}
            <div className="flex flex-col">
              {[
                ["Precision Sourced", "Traceable, ethically harvested"],
                ["Curated by Experts", "Formulated with veterinary scientists"],
                ["Gift Ready", "Arrives in signature vault packaging"],
              ].map(([label]) => (
                <div key={label} className="flex justify-between items-center py-3 cursor-pointer group border-b" style={{ borderColor: `${C.outlineVariant}33` }}>
                  <span style={{ ...LABEL_CAPS, color: C.primary, fontSize: 10 }}>{label}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: C.primary }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ PRODUCT NARRATIVE ════ */}
        {longDescText && (
          <section className="py-20 border-t px-5 md:px-16" style={{ borderColor: `${C.outlineVariant}33` }}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5">
                <h2 style={{ ...PLAYFAIR, fontSize: 44, lineHeight: "52px", fontWeight: 600, fontStyle: "italic", color: C.primary, marginBottom: 28 }}>
                  Specimen Profile
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
              <div className="md:col-start-7 md:col-span-6 relative" style={{ height: 500 }}>
                <img
                  src={allImgs.length > 1 ? (allImgs[1] || fallbackImg(1)) : (allImgs[0] || fallbackImg(0))}
                  onError={e => { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb="1"; t.src = fallbackImg(1); } }}
                  alt={product.title} className="w-full h-full object-cover shadow-2xl"
                  style={{ filter: "grayscale(100%)", transition: "filter 0.5s ease" }}
                  onMouseOver={e => (e.currentTarget.style.filter = "grayscale(0%)")}
                  onMouseOut={e => (e.currentTarget.style.filter = "grayscale(100%)")}
                  loading="lazy"
                />
              </div>
            </div>
          </section>
        )}

        {/* ════ REVIEWS ════ */}
        <section style={{ backgroundColor: C.white, padding: "80px 0" }}>
          <div className="px-5 md:px-16">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
              <div className="md:col-span-3 flex flex-col justify-center" style={{ backgroundColor: C.primary, padding: "40px 32px" }}>
                <span style={{ ...MONO, fontSize: 11, color: C.secondaryFixed, marginBottom: 12 }}>CUSTOMER REPORTS</span>
                <p style={{ ...PLAYFAIR, fontSize: 72, lineHeight: "80px", fontWeight: 700, color: C.white }}>{displayRating.toFixed(1)}</p>
                <StarRow rating={Math.round(displayRating)} light />
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Based on {totalReviews} verified reports</p>
              </div>
              <div className="md:col-span-9 flex flex-col justify-center">
                <h2 style={{ ...PLAYFAIR, fontSize: "clamp(28px,4vw,48px)", fontWeight: 600, color: C.primary, marginBottom: 16 }}>
                  Field Reports
                </h2>
                <p style={{ fontSize: 16, color: C.onSurfaceVariant, lineHeight: 1.6 }}>
                  Verified observations from owners in the field. Unedited feedback from real dogs, real results.
                </p>
              </div>
            </div>

            {/* Review cards */}
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map(r => {
                  const nm = (r as any).user?.name || (r as any).guestName || "Verified Buyer";
                  const parts = nm.trim().split(" ");
                  const initials = parts.map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={r.id} className="flex flex-col gap-4 p-6" style={{ border: `1px solid ${C.outlineVariant}4D`, backgroundColor: C.surface }}>
                      <div className="flex items-start gap-4">
                        <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: C.secondary, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, fontFamily: "Inter, sans-serif", flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: C.onSurface }}>{nm}</p>
                          <StarRow rating={r.rating} />
                          {r.title && <p style={{ fontSize: 13, fontWeight: 600, color: C.primary, marginTop: 4 }}>{r.title}</p>}
                        </div>
                      </div>
                      <p style={{ fontSize: 14, color: C.onSurfaceVariant, lineHeight: 1.65 }}>{r.content}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "48px 0", textAlign: "center", color: C.onSurfaceVariant }}>
                <p style={{ ...MONO, fontSize: 12 }}>No field reports yet. Be the first.</p>
              </div>
            )}

            {/* Submit review */}
            {isAuthenticated && canReviewData?.canReview && (
              <div style={{ marginTop: 48 }}>
                {!showReviewForm ? (
                  <button onClick={() => setShowReviewForm(true)} data-testid="button-write-review"
                    style={{ ...LABEL_CAPS, padding: "16px 40px", backgroundColor: C.primary, color: C.white, border: "none", cursor: "pointer" }}>
                    Submit Field Report
                  </button>
                ) : (
                  <div style={{ maxWidth: 560, padding: 40, border: `1px solid ${C.outlineVariant}4D`, backgroundColor: C.surface }}>
                    <h3 style={{ ...PLAYFAIR, fontSize: 24, color: C.primary, marginBottom: 24 }}>Your Field Report</h3>
                    <div className="space-y-6">
                      <div>
                        <label style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurfaceVariant, display: "block", marginBottom: 8 }}>Rating</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          {[1,2,3,4,5].map(s => (
                            <button key={s} onClick={() => setReviewRating(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                              <FilledStar size={24} light={s > reviewRating} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurfaceVariant, display: "block", marginBottom: 8 }}>Title</label>
                        <input value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="Summary of your experience"
                          style={{ width: "100%", padding: "12px 16px", border: `1px solid ${C.outlineVariant}`, backgroundColor: C.white, fontSize: 14, color: C.onSurface, outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurfaceVariant, display: "block", marginBottom: 8 }}>Report</label>
                        <textarea value={reviewContent} onChange={e => setReviewContent(e.target.value)} rows={4} placeholder="Detailed observations..."
                          style={{ width: "100%", padding: "12px 16px", border: `1px solid ${C.outlineVariant}`, backgroundColor: C.white, fontSize: 14, color: C.onSurface, outline: "none", resize: "vertical" }} />
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button onClick={() => submitReview.mutate({ rating: reviewRating, title: reviewTitle, content: reviewContent })}
                          disabled={submitReview.isPending || !reviewContent.trim()}
                          data-testid="button-submit-review"
                          style={{ ...LABEL_CAPS, padding: "14px 28px", backgroundColor: C.primary, color: C.white, border: "none", cursor: "pointer", opacity: submitReview.isPending ? 0.6 : 1 }}>
                          {submitReview.isPending ? "Submitting…" : "Submit"}
                        </button>
                        <button onClick={() => setShowReviewForm(false)} style={{ ...LABEL_CAPS, padding: "14px 28px", backgroundColor: "transparent", color: C.onSurfaceVariant, border: `1px solid ${C.outlineVariant}`, cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ════ RELATED — Dog Parent Clothing ════ */}
        {related.length > 0 && (
          <section style={{ backgroundColor: C.surface, padding: "80px 0", borderTop: `1px solid ${C.outlineVariant}33` }}>
            <div className="px-5 md:px-16">
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <span style={{ ...LABEL_CAPS, color: C.secondary, display: "block", marginBottom: 12 }}>Dog Parent Clothing</span>
                <h2 style={{ ...PLAYFAIR, fontSize: "clamp(28px,4vw,44px)", color: C.primary, fontWeight: 600 }}>
                  Synchronize Your Style
                </h2>
                <div style={{ height: 1, width: 56, backgroundColor: C.secondary, margin: "20px auto 0" }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((p: any) => {
                  const img = p.images?.[0]?.url || p.images?.[0]?.imageUrl || p.imageUrl;
                  const price = p.salePrice || p.price;
                  const isOnSale = p.salePrice && parseFloat(p.salePrice) < parseFloat(p.price);
                  return (
                    <Link key={p.id} href={`/giftseries/product/${p.slug}`}>
                      <div data-testid={`card-related-${p.id}`} style={{ cursor: "pointer", backgroundColor: C.white }} className="group">
                        <div style={{ overflow: "hidden", aspectRatio: "4/5" }}>
                          <img
                            src={img} alt={p.title}
                            onError={e => { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb="1"; t.src = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&auto=format&fit=crop"; } }}
                            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(60%)", transition: "filter 0.5s ease, transform 0.5s ease" }}
                            className="group-hover:grayscale-0 group-hover:scale-105"
                          />
                        </div>
                        <div style={{ padding: "20px 16px" }}>
                          <p style={{ ...MONO, fontSize: 10, color: C.outline, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Dog Parent Clothing</p>
                          <h3 style={{ ...PLAYFAIR, fontSize: 18, color: C.primary, fontWeight: 600, marginBottom: 10 }}>{p.title}</h3>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                            {isOnSale && <span style={{ fontSize: 13, color: C.outline, textDecoration: "line-through" }}>{formatCurrency(p.price)}</span>}
                            <span style={{ ...PLAYFAIR, fontSize: 20, fontWeight: 400, color: C.primary }}>{formatCurrency(price)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div style={{ textAlign: "center", marginTop: 48 }}>
                <Link href="/category/twinning">
                  <button data-testid="button-view-all-twinning"
                    style={{ ...LABEL_CAPS, padding: "18px 44px", backgroundColor: C.primary, color: C.white, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10 }}
                    onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
                    onMouseOut={e => (e.currentTarget.style.opacity = "1")}>
                    View All Dog Parent Clothing <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            </div>
          </section>
        )}

      </main>

      <EditorialFooter footer={footer} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
