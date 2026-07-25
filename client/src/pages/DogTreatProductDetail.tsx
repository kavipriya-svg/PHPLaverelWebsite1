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
import { HomeEditorialHeader as EditorialHeader, HomeEditorialFooter as EditorialFooter } from "@/components/store/HomeEditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";
import type { HomepageSettings } from "@/lib/homepageDefaults";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductWithDetails, Coupon, ReviewWithUser } from "@shared/schema";

// ─── Shared typography constants ─────────────────────────────────────────────
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" };
const PLAYFAIR: React.CSSProperties = { fontFamily: "'Playfair Display', serif" };
const HARD_SHADOW: React.CSSProperties = { boxShadow: "40px 40px 0px 0px rgba(1,45,29,0.15)" };
const LABEL_CAPS: React.CSSProperties = { fontFamily: "'Inter', sans-serif", fontSize: 11, lineHeight: "16px", letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" };

const C = {
  primary: "#012d1d",
  secondary: "#944923",
  primaryContainer: "#264e3c",
  onSurface: "#1a1c1a",
  onSurfaceVariant: "#414844",
  outlineVariant: "#c1c8c2",
  mint: "#a5d0b8",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Ad Banner Strip ─────────────────────────────────────────────────────────
function AdBannerStrip({ banners }: { banners: any[] }) {
  if (!banners.length) return null;
  return (
    <div className="w-full">
      {banners.map((b: any) => {
        const isYT = b.mediaType === "video" && b.mediaUrl?.includes("youtube");
        return (
          <div key={b.id} className="relative w-full overflow-hidden" style={{ maxHeight: 320 }}>
            {isYT
              ? <iframe src={b.mediaUrl} className="w-full" style={{ height: 320, border: 0 }} allow="autoplay; encrypted-media" allowFullScreen />
              : <img src={b.mediaUrl} alt={b.title || ""} className="w-full object-cover" style={{ maxHeight: 320 }} />}
            {(b.title || b.ctaText) && (
              <div className="absolute inset-0 flex flex-col justify-end p-8" style={{ background: "linear-gradient(to top, rgba(1,45,29,0.85) 0%, transparent 60%)" }}>
                {b.title && <p style={{ ...PLAYFAIR, fontSize: 28, color: "#fff", marginBottom: 8 }}>{b.title}</p>}
                {b.subtitle && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 16 }}>{b.subtitle}</p>}
                {b.ctaText && b.ctaUrl && (
                  <Link href={b.ctaUrl}>
                    <span className="inline-block px-8 py-3" style={{ backgroundColor: "#fff", color: C.primary, ...LABEL_CAPS }}>
                      {b.ctaText}
                    </span>
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DogTreatProductDetail() {
  const [, params] = useRoute("/dogtreat/product/:slug");
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
    queryKey: ["/api/dog-treats-feedback"],
  });

  const { data: adBanners = [] } = useQuery<any[]>({
    queryKey: ["/api/dog-treats-ad-banners?placement=product"],
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
      <EditorialFooter footer={footer} />
    </>
  );
  if (!product) return (
    <>
      <EditorialHeader nav={nav} />
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ marginTop: 96 }}>
        <p style={{ ...MONO, fontSize: 11, color: C.onSurfaceVariant }}>Specimen not found</p>
        <Link href="/dogtreat">
          <button className="px-8 py-3 border" style={{ borderColor: C.primary, color: C.primary, ...MONO, fontSize: 11 }}>
            ← Back to Wild Treats
          </button>
        </Link>
      </div>
      <EditorialFooter footer={footer} />
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
  const freeShipping = (product as any).freeShipping as boolean | undefined;
  const shippingText = (product as any).shippingText as string | undefined;
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

      {/* Ads: product-hero top */}
      <AdBannerStrip banners={bs("product-hero", "top")} />

      <main style={{ marginTop: 96, backgroundColor: "#f9faf6", color: "#1a1c1a", fontFamily: "Inter, sans-serif", overflowX: "hidden" }}>

        {/* ════ HERO SECTION ════ */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 py-20 min-h-screen px-5 md:px-16">

          {/* Left — gallery */}
          <div className="md:col-span-7 flex flex-col md:flex-row gap-6 relative">
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
            <div className="flex-grow">
              <div className="relative overflow-hidden group" style={{ aspectRatio: "4/5", ...HARD_SHADOW }}>
                <img src={allImgs[activeImg] || ""} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
                {hasDiscount && (
                  <div className="absolute top-5 right-5 px-3 py-1" style={{ backgroundColor: C.secondary, color: "#fff", ...LABEL_CAPS }}>SALE</div>
                )}
                {(product as any).isNewArrival ? (
                  <div className="absolute bottom-6 left-6 px-4 py-1" style={{ backgroundColor: C.primary, color: "#fff", ...LABEL_CAPS, letterSpacing: "0.2em" }}>NEW ARRIVAL</div>
                ) : (
                  <div className="absolute bottom-6 left-6 px-4 py-1" style={{ backgroundColor: C.primary, color: "#fff", ...LABEL_CAPS, letterSpacing: "0.2em" }}>Wild Sourced</div>
                )}
              </div>
              {allImgs.length > 1 && (
                <div className="flex md:hidden gap-3 mt-4 overflow-x-auto">
                  {allImgs.map((src, i) => (
                    <button key={i} onClick={() => setActiveImg(i)} className="shrink-0 transition-opacity"
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
            <div className="space-y-2">
              <p style={{ ...LABEL_CAPS, color: C.secondary }}>Wild Treats Collection / Dehydrated</p>
              <h1 style={{ ...PLAYFAIR, fontSize: "clamp(32px,4vw,48px)", fontWeight: 600, lineHeight: "1.15", color: C.primary }}>
                {product.title}
              </h1>
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
                    <span style={{ fontSize: 10, color: C.onSurfaceVariant, textTransform: "uppercase" }}>+ {gstRate}% GST</span>
                  )}
                </div>
              </div>
            </div>

            {shortDesc && <p style={{ fontSize: 14, color: C.onSurfaceVariant, lineHeight: 1.6 }}>{shortDesc}</p>}

            <div className="space-y-8">
              {/* Variant selector */}
              {variants.length > 0 ? (
                <div className="space-y-4">
                  <label style={{ ...LABEL_CAPS, color: C.onSurfaceVariant, display: "block" }}>
                    Select {variants[0]?.optionName || "Weight"} (SKU)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {variants.map((v: any) => {
                      const isSelected = String(v.id) === selectedVariantId;
                      const vPrice = v.salePrice || v.price;
                      const label = v.optionValue || v.name || v.option_value || "Standard";
                      return (
                        <button key={v.id} data-testid={`variant-${v.id}`}
                          onClick={() => setSelectedVariantId(String(v.id))}
                          className="p-4 text-left flex justify-between items-center transition-colors duration-200"
                          style={{ border: isSelected ? `2px solid ${C.primary}` : `1px solid ${C.outlineVariant}` }}>
                          <span style={{ fontWeight: 700, color: isSelected ? C.primary : C.onSurfaceVariant }}>{label}</span>
                          <span style={{ ...MONO, fontSize: 12, color: isSelected ? C.primaryContainer : C.onSurfaceVariant }}>{formatCurrency(vPrice)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label style={{ ...LABEL_CAPS, color: C.onSurfaceVariant, display: "block" }}>Weight (SKU)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 flex justify-between items-center" style={{ border: `2px solid ${C.primary}` }}>
                      <span style={{ fontWeight: 700, color: C.primary }}>{weight ? `${weight}g` : "Standard"}</span>
                      <span style={{ ...MONO, fontSize: 12, color: C.primaryContainer }}>{formatCurrency(currentPrice!)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription box */}
              <div className="space-y-4">
                <div className="p-4 flex items-center gap-4" style={{ border: `1px solid ${C.secondary}33`, backgroundColor: "#fe9e71" }}>
                  <BadgeCheck className="w-5 h-5 shrink-0" style={{ color: C.secondary }} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#351000", lineHeight: 1.4 }}>Subscription customers save more.</p>
                    <p style={{ fontSize: 13, color: C.onSurfaceVariant, marginTop: 2 }}>Automated replenishment for your pet.</p>
                  </div>
                </div>
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2" style={{ fontSize: 14, color: C.onSurfaceVariant }}>
                    <Truck className="w-4 h-4" style={{ color: C.primary }} />
                    <span>{deliveryDate ? `Delivery by ${deliveryDate}` : freeShipping ? (shippingText || "Free Shipping") : (shippingText || "Standard Shipping")}</span>
                  </div>
                  {product.stock !== undefined && product.stock !== null && product.stock > 0 && (
                    <div style={{ ...MONO, fontSize: 12, color: C.secondary }}>{product.stock} units available</div>
                  )}
                  {product.stock === 0 && <div style={{ ...MONO, fontSize: 12, color: "#ba1a1a" }}>Out of stock</div>}
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

              {/* Product banner */}
              {bannerUrl && (
                <div className="relative overflow-hidden" data-testid="product-banner">
                  {bannerCtaLink
                    ? <Link href={bannerCtaLink}><img src={bannerUrl} alt={bannerTitle || ""} className="w-full object-cover max-h-40" />
                        {(bannerTitle || bannerSubtitle) && (
                          <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent">
                            {bannerTitle && <p className="text-white text-sm font-bold">{bannerTitle}</p>}
                            {bannerSubtitle && <p className="text-white/80 text-xs mt-0.5">{bannerSubtitle}</p>}
                            {bannerCtaText && <span className="mt-2 self-start text-xs uppercase px-4 py-1.5" style={{ backgroundColor: "#fff", color: C.primary, ...LABEL_CAPS }}>{bannerCtaText}</span>}
                          </div>
                        )}</Link>
                    : <><img src={bannerUrl} alt={bannerTitle || ""} className="w-full object-cover max-h-40" />
                        {(bannerTitle || bannerSubtitle) && (
                          <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent">
                            {bannerTitle && <p className="text-white text-sm font-bold">{bannerTitle}</p>}
                            {bannerSubtitle && <p className="text-white/80 text-xs mt-0.5">{bannerSubtitle}</p>}
                          </div>
                        )}</>}
                </div>
              )}

              {/* Coupons */}
              {visibleCoupons.length > 0 && (
                <div className="space-y-3 pb-2" data-testid="card-coupons">
                  <p style={{ ...LABEL_CAPS, color: C.onSurfaceVariant }}>Available Coupons</p>
                  <div className="flex flex-wrap gap-2">
                    {visibleCoupons.map((c) => (
                      <button key={c.id} data-testid={`coupon-${c.id}`}
                        onClick={() => copyCode(c.code)} title="Click to copy"
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

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 py-6 border-b" style={{ borderColor: `${C.outlineVariant}4D` }}>
                <div className="flex flex-col items-center text-center gap-1">
                  <Truck className="w-5 h-5" style={{ color: C.primary }} />
                  <span style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurface }}>{freeShipping ? "Free Shipping" : "Shipping"}</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <RotateCcw className="w-5 h-5" style={{ color: C.primary }} />
                  <span style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurface }}>{returnDays ? `${returnDays}-Day Returns` : "30-Day Returns"}</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <Shield className="w-5 h-5" style={{ color: C.primary }} />
                  <span style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurface }}>Secure Checkout</span>
                </div>
              </div>

              {/* Info rows */}
              <div className="flex flex-col gap-2">
                {[
                  ["Ancestral Sourcing", "100% traceable, ethically harvested"],
                  ["Veterinary Approval", "Formulated with nutritional scientists"],
                ].map(([label]) => (
                  <div key={label} className="flex justify-between items-center py-3 cursor-pointer group border-b" style={{ borderColor: `${C.outlineVariant}4D` }}>
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
                  Wild Sourced Profile
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

        {/* ════ TECHNICAL SPEC ════ */}
        <section className="py-20" style={{ backgroundColor: "#ffffff" }}>
          <div className="px-5 md:px-16 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <div>
                <span style={{ ...MONO, fontSize: 12, color: C.secondary, display: "block", marginBottom: 4 }}>DATA REPORT {specimenNo(product.id)}-A</span>
                <h2 style={{ ...PLAYFAIR, fontSize: 32, lineHeight: "40px", color: C.primary }}>Technical Specification</h2>
              </div>
              <p style={{ ...LABEL_CAPS, color: C.onSurfaceVariant, borderBottom: `1px solid ${C.primary}`, paddingBottom: 4 }}>Laboratory Verified Content</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="pb-2 border-b" style={{ ...LABEL_CAPS, color: C.onSurface, borderColor: `${C.outlineVariant}4D` }}>Macro Profile (%)</h3>
                <div className="space-y-8">
                  {[["PROTEIN (MIN)", 72], ["FAT (MAX)", 8], ["MOISTURE (MAX)", 10], ["CRUDE FIBRE (MAX)", 4]].map(([label, val]) => (
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
              <div className="space-y-6">
                <h3 className="pb-2 border-b" style={{ ...LABEL_CAPS, color: C.onSurface, borderColor: `${C.outlineVariant}4D` }}>Micronutrient Density (mg/kg)</h3>
                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  {[["TAURINE", "High"], ["IRON", "24.1"], ["OMEGA-3", "1200"], ["SELENIUM", "0.9"]].map(([label, value]) => (
                    <div key={label} className="pl-4" style={{ borderLeft: `2px solid ${C.primaryContainer}` }}>
                      <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurfaceVariant }}>{label}</p>
                      <p style={{ ...PLAYFAIR, fontSize: 32, lineHeight: "40px", color: C.primary }}>{value}</p>
                    </div>
                  ))}
                </div>
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

        {/* Ads: product-hero bottom */}
        <AdBannerStrip banners={bs("product-hero", "bottom")} />

        {/* Ads: product-feedback top */}
        <AdBannerStrip banners={bs("product-feedback", "top")} />

        {/* ════ CUSTOMER REPORTS ════ */}
        {(() => {
          const BUILTIN_PLACEHOLDERS = [
            { name: "Priya S.", role: "Labrador Owner", avatarBg: "#a5d0b8", avatarFg: "#264e3c", rating: 5, reviewText: "My dog goes absolutely crazy for these wild treats. The coat has improved visibly and energy levels are through the roof.", hasMedia: false, mediaType: "photo", mediaUrl: null },
            { name: "Rohan M.", role: "Golden Retriever Dad", avatarBg: "#ffb695", avatarFg: "#76330d", rating: 5, reviewText: "Finally a treat that doesn't have fillers. The dehydrated duck is a hit — he finishes it in seconds.", hasMedia: false, mediaType: "photo", mediaUrl: null },
            { name: "Ananya K.", role: "Verified Buyer", avatarBg: "#c0edd4", avatarFg: "#012d1d", rating: 5, reviewText: "Switched to 19 Dogs wild treats and haven't looked back. My vet is impressed with the ingredient list.", hasMedia: false, mediaType: "photo", mediaUrl: null },
          ];

          type FeedbackItem = { id: string | number; name: string; role: string; initials: string; color: string; bg: string; rating: number; text: string; hasMedia: boolean; mediaType: "photo" | "video"; mediaUrl: string | null };

          const rawSource: any[] = adminFeedback.length > 0 ? adminFeedback : BUILTIN_PLACEHOLDERS;
          const feedbackItems: FeedbackItem[] = rawSource.slice(0, 6).map((item: any, i: number) => {
            const nm: string = item.name || "Verified Buyer";
            const parts = nm.trim().split(" ");
            const initials = parts.map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
            return {
              id: item.id ?? i, name: nm, role: item.role || "Verified Buyer", initials,
              color: item.avatarFg || "#264e3c", bg: item.avatarBg || "#a5d0b8",
              rating: item.rating ?? 5, text: item.reviewText || "",
              hasMedia: !!(item.hasMedia && item.mediaUrl),
              mediaType: (item.mediaType === "video" ? "video" : "photo") as "photo" | "video",
              mediaUrl: item.mediaUrl ?? null,
            };
          });

          const totalReviews = product.reviewCount ?? (reviews.length > 0 ? reviews.length : 94);
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

          return (
            <section style={{ backgroundColor: "#f9faf6", padding: "80px 0" }}>
              {/* Full-width section — no max-w container */}
              <div className="px-5 md:px-16">
                {/* Aggregate header */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
                  <div className="md:col-span-3 flex flex-col justify-center" style={{ backgroundColor: C.primary, padding: "40px 32px" }}>
                    <span style={{ ...MONO, fontSize: 11, color: "#a5d0b8", marginBottom: 12 }}>CUSTOMER REPORTS</span>
                    <p style={{ ...PLAYFAIR, fontSize: 72, lineHeight: "80px", fontWeight: 700, color: "#fff" }}>{displayRating.toFixed(1)}</p>
                    <StarRow rating={Math.round(displayRating)} light />
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Based on {totalReviews} verified reports</p>
                  </div>
                  <div className="md:col-span-9 flex flex-col justify-center">
                    <h2 style={{ ...PLAYFAIR, fontSize: "clamp(28px,4vw,48px)", fontWeight: 600, color: C.primary, marginBottom: 16 }}>
                      Customer Reports
                    </h2>
                    <p style={{ fontSize: 16, color: C.onSurfaceVariant, lineHeight: 1.6 }}>
                      Verified observations from owners in the field. Unedited feedback from real dogs, real results.
                    </p>
                  </div>
                </div>

                {/* Feedback grid — full width, 3 cols on large screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {feedbackItems.map((item) => (
                    <div key={item.id} className="flex flex-col gap-0" style={{ border: `1px solid ${C.outlineVariant}4D`, backgroundColor: "#fff" }}>
                      {/* Media (image or video) from admin — shown when hasMedia is true and mediaUrl exists */}
                      {item.hasMedia && item.mediaUrl && (
                        <div className="w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                          {item.mediaType === "video" ? (
                            <video
                              src={item.mediaUrl}
                              controls
                              playsInline
                              className="w-full h-full object-cover"
                              data-testid={`feedback-video-${item.id}`}
                            />
                          ) : (
                            <img
                              src={item.mediaUrl}
                              alt={`${item.name}'s photo`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              data-testid={`feedback-image-${item.id}`}
                            />
                          )}
                        </div>
                      )}
                      {/* Card body */}
                      <div className="flex flex-col gap-4 p-6">
                        <div className="flex items-start gap-4">
                          <AvatarCircle item={item} />
                          <div>
                            <p style={{ fontWeight: 700, color: C.onSurface }}>{item.name}</p>
                            <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurfaceVariant }}>{item.role}</p>
                            <StarRow rating={item.rating} />
                          </div>
                        </div>
                        <p style={{ fontSize: 14, color: C.onSurfaceVariant, lineHeight: 1.6 }}>{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Write review */}
                {isAuthenticated && canReviewData?.canReview && (
                  <div className="mt-12">
                    {!showReviewForm ? (
                      <button onClick={() => setShowReviewForm(true)} data-testid="btn-write-review"
                        className="px-8 py-4" style={{ border: `1px solid ${C.primary}`, color: C.primary, ...LABEL_CAPS }}>
                        Submit a Customer Report
                      </button>
                    ) : (
                      <div className="max-w-xl space-y-6" style={{ border: `1px solid ${C.outlineVariant}4D`, padding: 32, backgroundColor: "#fff" }}>
                        <h3 style={{ ...PLAYFAIR, fontSize: 24, color: C.primary }}>Submit Customer Report</h3>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(s => (
                            <button key={s} onClick={() => setReviewRating(s)} data-testid={`review-star-${s}`}>
                              <FilledStar size={24} />
                            </button>
                          ))}
                        </div>
                        <input value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="Report title"
                          className="w-full bg-transparent focus:outline-none py-3 border-b"
                          style={{ borderColor: C.outlineVariant, ...MONO, fontSize: 13 }}
                          data-testid="input-review-title" />
                        <textarea value={reviewContent} onChange={e => setReviewContent(e.target.value)} placeholder="Your observations…"
                          rows={4} className="w-full bg-transparent focus:outline-none py-3 border-b resize-none"
                          style={{ borderColor: C.outlineVariant, fontSize: 14, color: C.onSurface }}
                          data-testid="textarea-review-content" />
                        <div className="flex gap-4">
                          <button onClick={() => submitReview.mutate({ rating: reviewRating, title: reviewTitle, content: reviewContent })}
                            data-testid="btn-submit-review"
                            className="px-8 py-3" style={{ backgroundColor: C.primary, color: "#fff", ...LABEL_CAPS }}>
                            {submitReview.isPending ? "Submitting…" : "Submit"}
                          </button>
                          <button onClick={() => setShowReviewForm(false)} className="px-8 py-3" style={{ border: `1px solid ${C.outlineVariant}`, color: C.onSurfaceVariant, ...LABEL_CAPS }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {/* Ads: product-feedback bottom */}
        <AdBannerStrip banners={bs("product-feedback", "bottom")} />

        {/* ════ RELATED PRODUCTS ════ */}
        {related.length > 0 && (
          <section className="py-20 px-5 md:px-16 border-t" style={{ borderColor: `${C.outlineVariant}33` }}>
            <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
              <h2 style={{ ...PLAYFAIR, fontSize: 32, color: C.primary }}>From the Same Collection</h2>
              <Link href="/dogtreat">
                <span style={{ ...LABEL_CAPS, color: C.primary, borderBottom: `1px solid ${C.primary}`, paddingBottom: 4, cursor: "pointer" }}>
                  View All Wild Treats →
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((p: any) => {
                const imgs = p.images || [];
                const imgUrl = imgs.find((i: any) => i.isPrimary)?.imageUrl || imgs[0]?.imageUrl || "";
                const price = p.salePrice || p.price;
                return (
                  <Link key={p.id} href={`/dogtreat/product/${p.slug}`}>
                    <div className="group cursor-pointer" data-testid={`related-product-${p.id}`}>
                      <div className="overflow-hidden mb-4" style={{ aspectRatio: "4/5" }}>
                        <img src={imgUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      </div>
                      <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.secondary, marginBottom: 4 }}>Wild Treats</p>
                      <p style={{ ...PLAYFAIR, fontSize: 20, color: C.primary, marginBottom: 4 }}>{p.name}</p>
                      <p style={{ ...MONO, fontSize: 14, color: C.onSurface }}>{formatCurrency(price)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <EditorialFooter footer={footer} />
    </>
  );
}
