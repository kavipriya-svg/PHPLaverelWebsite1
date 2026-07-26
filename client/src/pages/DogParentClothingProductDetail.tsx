import { useState, useEffect, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ShoppingCart, ArrowRight, Star, Truck, RotateCcw, Shield, Heart } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { HomeEditorialHeader as EditorialHeader, HomeEditorialFooter as EditorialFooter } from "@/components/store/HomeEditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";
import type { HomepageSettings } from "@/lib/homepageDefaults";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductWithDetails, Coupon, ReviewWithUser } from "@shared/schema";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:            "#012d1d",
  secondary:          "#944923",
  primaryContainer:   "#264e3c",
  onSurface:          "#1a1c1a",
  onSurfaceVariant:   "#414844",
  outlineVariant:     "#c1c8c2",
  mint:               "#a5d0b8",
  primaryFixed:       "#c0edd4",
  secondaryContainer: "#fe9e71",
};

const MONO: React.CSSProperties     = { fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" };
const PLAYFAIR: React.CSSProperties = { fontFamily: "'Playfair Display', serif" };
const LABEL_CAPS: React.CSSProperties = { fontFamily: "'Inter', sans-serif", fontSize: 11, lineHeight: "16px", letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" };
const HARD_SHADOW: React.CSSProperties = { boxShadow: "40px 40px 0px 0px rgba(1,45,29,0.15)" };

// ─── Fallback lifestyle images ─────────────────────────────────────────────────
const TWINNING_IMGS = [
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=900&auto=format&fit=crop",
];
function fallbackImg(idx: number) { return TWINNING_IMGS[idx % TWINNING_IMGS.length]; }

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getImg(product: any, idx = 0): string {
  const imgs = product?.images || product?.productImages || [];
  const img = imgs[idx];
  return img?.url || img?.imageUrl || (idx === 0 ? product?.imageUrl || "" : "");
}
function getProductImg(product: any, idx = 0): string {
  return getImg(product, idx) || fallbackImg(idx);
}
function stripHtml(html = "") { return html.replace(/<[^>]+>/g, "").trim(); }
function specimenNo(id: string | number) {
  const n = parseInt(String(id), 10);
  return String(isNaN(n) ? 42 : (n % 900) + 42).padStart(3, "0");
}
function couponLabel(c: Coupon) {
  return c.type === "percentage" ? `${c.amount}% OFF` : `₹${parseFloat(c.amount as string).toFixed(0)} OFF`;
}
function getYouTubeEmbedUrl(url: string): string | null {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

// ─── Star row ──────────────────────────────────────────────────────────────────
function FilledStar({ size = 18, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={light ? "#c0edd4" : C.primary} stroke="none">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}
function StarRow({ rating, light = false }: { rating: number; light?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ opacity: s <= rating ? 1 : 0.25 }}>
          <FilledStar size={14} light={light} />
        </span>
      ))}
    </div>
  );
}

// ─── Ad banner strip ───────────────────────────────────────────────────────────
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
                  <a href={b.ctaUrl}><span className="inline-block px-8 py-3" style={{ backgroundColor: "#fff", color: C.primary, ...LABEL_CAPS }}>{b.ctaText}</span></a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Countdown unit ────────────────────────────────────────────────────────────
function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center px-3 py-2 min-w-[52px]" style={{ backgroundColor: C.primary, color: "#fff" }}>
      <div className="text-2xl font-bold leading-none" style={MONO}>{String(value).padStart(2, "0")}</div>
      <div className="text-[9px] mt-1" style={{ ...MONO, color: C.mint }}>{label}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DogParentClothingProductDetail() {
  const [, params] = useRoute("/twinning/product/:slug");
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

  // ── Data fetching ──────────────────────────────────────────────────────────
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

  // Dog Parent Clothing testimonials (admin-managed)
  const { data: rawTestimonials = [] } = useQuery<any[]>({
    queryKey: ["/api/dog-parent-clothing-testimonials"],
  });

  // Static fallback testimonials shown when no admin testimonials exist
  const STATIC_TESTIMONIALS = [
    {
      id: "st-1", subjectCode: "LAB-001", satisfactionLabel: "EXCEEDED",
      mediaUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&auto=format&fit=crop",
      mediaType: "image",
      quote: "The BioSync technology is real. My Labrador and I have never moved with such synchronized energy. The thermal comfort is unmatched on our morning runs.",
      location: "Mumbai", envData: "TEMP: 28°C / HUMID: 75%",
    },
    {
      id: "st-2", subjectCode: "HUS-042", satisfactionLabel: "OUTSTANDING",
      mediaUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&auto=format&fit=crop",
      mediaType: "image",
      quote: "The graphene-infused material genuinely adapts to my Husky's body temperature. On our Himalayan trek it was a complete game-changer. Worth every rupee.",
      location: "Bengaluru", envData: "ALTITUDE: 3200m / WIND: 40kmph",
    },
    {
      id: "st-3", subjectCode: "DOB-017", satisfactionLabel: "EXCEEDED",
      mediaUrl: "https://images.unsplash.com/photo-1534361960057-19f073a9dee3?w=600&auto=format&fit=crop",
      mediaType: "image",
      quote: "Matching outfits that actually look editorial. My Doberman gets stopped on every walk. The build quality holds after 6 months of daily use — zero compromise.",
      location: "Delhi", envData: "URBAN / DAILY ACTIVE",
    },
  ];

  const testimonials = rawTestimonials.length > 0 ? rawTestimonials : STATIC_TESTIMONIALS;

  // Dog Parent Clothing ad banners
  const { data: adBanners = [] } = useQuery<any[]>({
    queryKey: ["/api/dog-parent-clothing-ad-banners"],
  });
  const bs = (section: string, pos: string) =>
    adBanners.filter((b: any) => b.isActive && (b.placement === `detail-${section}` || b.placement === "both") && b.position === pos);

  const { data: canReviewData } = useQuery<{ canReview: boolean }>({
    queryKey: ["/api/products", product?.id, "can-review"],
    enabled: !!product?.id && isAuthenticated,
  });

  // Related products (same category)
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

  useEffect(() => {
    const variants = product?.variants || [];
    if (variants.length > 0 && !selectedVariantId) setSelectedVariantId(String(variants[0].id));
    setActiveImg(0);
  }, [product?.id]);

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

  // ── Wishlist ───────────────────────────────────────────────────────────────
  async function handleWishlist() {
    if (!product) return;
    setWishlistPending(true);
    try { await toggleWishlist?.(product.id); }
    finally { setWishlistPending(false); }
  }

  // ── Add to cart ────────────────────────────────────────────────────────────
  function handleAddToCart() {
    if (!product) return;
    addToCart?.({
      productId: product.id,
      quantity: qty,
      variantId: selectedVariantId ? parseInt(selectedVariantId) : undefined,
    });
    toast({ title: `${product.title} added to cart` });
  }

  // ── Loading / 404 ──────────────────────────────────────────────────────────
  if (isLoading) return (
    <>
      <EditorialHeader nav={nav} />
      <div className="min-h-screen flex items-center justify-center" style={{ marginTop: 96 }}>
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: C.primary, borderTopColor: "transparent" }} />
          <p style={{ ...MONO, fontSize: 11, color: C.onSurfaceVariant }}>Loading specimen…</p>
        </div>
      </div>
      <EditorialFooter footer={footer} email="" onEmailChange={() => {}} />
    </>
  );
  if (!product) return (
    <>
      <EditorialHeader nav={nav} />
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ marginTop: 96 }}>
        <p style={{ ...MONO, fontSize: 11, color: C.onSurfaceVariant }}>Specimen not found</p>
        <Link href="/category/twinning">
          <button className="px-8 py-3 border" style={{ borderColor: C.primary, color: C.primary, ...MONO, fontSize: 11 }}>
            ← Back to Twinning Archive
          </button>
        </Link>
      </div>
      <EditorialFooter footer={footer} email="" onEmailChange={() => {}} />
    </>
  );

  // ── Derived values ─────────────────────────────────────────────────────────
  const images  = product.images || [];
  const rawImgs: string[] = images.length > 0
    ? images.map((i: any) => i.url || i.imageUrl || "").filter(Boolean)
    : [];
  const baseImg = rawImgs[0] || fallbackImg(0);
  const allImgs: string[] = rawImgs.length >= 4
    ? rawImgs
    : [baseImg, rawImgs[1] || fallbackImg(1), rawImgs[2] || fallbackImg(2), rawImgs[3] || fallbackImg(3)];

  const variants        = product.variants || [];
  const selectedVariant = variants.find((v: any) => String(v.id) === selectedVariantId);
  const currentPrice    = selectedVariant?.salePrice || selectedVariant?.price || product.salePrice || product.price;
  const originalPrice   = selectedVariant?.price || product.price;
  const hasDiscount     = !!(currentPrice && originalPrice && parseFloat(String(currentPrice)) < parseFloat(String(originalPrice)));

  const allCoupons     = (couponsData?.coupons || []).filter(c => c.isActive);
  const productCoupons = allCoupons.filter(c => c.productId === product.id);
  const storeCoupons   = allCoupons.filter(c => !c.productId && (!c.minQuantity || c.minQuantity <= 1));
  const bulkCoupons    = allCoupons.filter(c => !c.productId && c.minQuantity && c.minQuantity > 1);
  const visibleCoupons = [...productCoupons, ...storeCoupons.slice(0, 3), ...bulkCoupons.slice(0, 2)];

  const reviews        = (reviewsData?.reviews || []).filter(r => r.status === "approved");
  const avgRating      = product.averageRating ? parseFloat(String(product.averageRating)) : 0;
  const related        = relatedData?.products || [];
  const inWishlist     = isInWishlist?.(product.id) ?? false;

  const shortDesc   = (product as any).shortDesc as string | undefined;
  const longDesc    = (product as any).longDesc || product.description;
  const longDescText = longDesc ? stripHtml(longDesc) : "";
  const weight      = (product as any).weight;
  const dimensions  = (product as any).dimensions;
  const returnDays  = (product as any).returnDays as number | undefined;
  const freeShipping = (product as any).freeShipping as boolean | undefined;
  const gstRate     = (product as any).gstRate as string | undefined;

  const deliveryDate = product.expectedDeliveryDays
    ? (() => { const d = new Date(); d.setDate(d.getDate() + product.expectedDeliveryDays!); return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }); })()
    : null;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: `${code} copied!` });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Combined reviews display: customer testimonials from admin + product reviews
  const displayRating  = testimonials.length > 0 ? 4.8 : Math.max(avgRating, 4.5);
  const totalReviews   = testimonials.length + reviews.length;

  return (
    <>
      <EditorialHeader nav={nav} />

      <main style={{ paddingTop: 96, minHeight: "100vh", backgroundColor: "#f9faf6" }}>

        {/* ════ BREADCRUMB ════ */}
        <div className="px-5 md:px-16 py-4 border-b" style={{ borderColor: `${C.outlineVariant}33` }}>
          <nav style={{ ...MONO, fontSize: 10, color: C.onSurfaceVariant }}>
            <Link href="/category/twinning">
              <span className="cursor-pointer hover:underline" style={{ color: C.primary }}>Twinning Collection</span>
            </Link>
            <span className="mx-2">/</span>
            <span>{product.title}</span>
          </nav>
        </div>

        <AdBannerStrip banners={bs("hero", "top")} />

        {/* ════ HERO: IMAGE + PURCHASE PANEL ════ */}
        <section className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-12 items-start">

            {/* ── Image gallery — full-bleed left column ── */}
            <div className="md:col-span-7 flex flex-col">
              {/* Main image — no padding, fills column edge to edge */}
              <div
                style={{ paddingBottom: "125%", position: "relative", overflow: "hidden", backgroundColor: "#eeeeeb" }}
              >
                <img
                  src={allImgs[activeImg]}
                  alt={product.title}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={e => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = "1"; t.src = fallbackImg(activeImg); } }}
                />
                {/* Specimen ID tag */}
                <div
                  className="absolute top-4 left-4 px-3 py-1"
                  style={{ backgroundColor: C.primary, color: "#fff", ...MONO, fontSize: 10 }}
                >
                  SPEC-{specimenNo(product.id)}
                </div>
                {isSaleActive && (
                  <div
                    className="absolute top-4 right-4 px-3 py-1"
                    style={{ backgroundColor: C.secondaryContainer, color: "#77330e", ...MONO, fontSize: 10 }}
                  >
                    SALE ACTIVE
                  </div>
                )}
              </div>
              {/* Thumbnails */}
              <div className="flex gap-2 px-4 py-4" style={{ backgroundColor: "#eeeeeb" }}>
                {allImgs.slice(0, 4).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    data-testid={`thumb-${i}`}
                    className="flex-1 transition-opacity"
                    style={{
                      aspectRatio: "1/1",
                      opacity: activeImg === i ? 1 : 0.45,
                      outline: activeImg === i ? `2px solid ${C.primary}` : "none",
                      outlineOffset: 2,
                      overflow: "hidden",
                    }}
                  >
                    <img src={img} alt={`view ${i + 1}`} className="w-full h-full object-cover" loading="lazy"
                      onError={e => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = "1"; t.src = fallbackImg(i); } }} />
                  </button>
                ))}
              </div>
            </div>

            {/* ── Purchase panel ── */}
            <div className="md:col-span-5 space-y-6 md:sticky md:top-28 px-8 py-16">

              {/* Category tag */}
              <p style={{ ...MONO, fontSize: 10, color: C.secondary, marginBottom: 4 }}>
                TWINNING COLLECTION // DUAL-SPECIES TEXTILE
              </p>

              {/* Title */}
              <h1 style={{ ...PLAYFAIR, fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.15", fontWeight: 700, color: C.primary }}>
                {product.title}
              </h1>

              {/* Short description */}
              {shortDesc && (
                <p style={{ fontSize: 16, lineHeight: "24px", color: C.onSurfaceVariant }}>{shortDesc}</p>
              )}

              {/* Rating row */}
              {(reviews.length > 0 || testimonials.length > 0) && (
                <div className="flex items-center gap-3">
                  <StarRow rating={Math.round(displayRating)} />
                  <span style={{ ...MONO, fontSize: 11, color: C.onSurfaceVariant }}>
                    {displayRating.toFixed(1)} ({totalReviews} reports)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span style={{ ...PLAYFAIR, fontSize: 40, fontWeight: 700, color: C.primary }}>
                  {formatCurrency(currentPrice)}
                </span>
                {hasDiscount && (
                  <span style={{ fontSize: 20, color: C.onSurfaceVariant, textDecoration: "line-through" }}>
                    {formatCurrency(originalPrice)}
                  </span>
                )}
                {gstRate && (
                  <span style={{ ...MONO, fontSize: 10, color: C.onSurfaceVariant }}>
                    incl. {gstRate}% GST
                  </span>
                )}
              </div>

              {/* Sale countdown */}
              {isSaleActive && countdown && (
                <div className="space-y-2">
                  <p style={{ ...MONO, fontSize: 10, color: C.secondary }}>OFFER ENDS IN</p>
                  <div className="flex gap-1">
                    <CountdownUnit value={countdown.days}    label="DAYS" />
                    <CountdownUnit value={countdown.hours}   label="HRS"  />
                    <CountdownUnit value={countdown.minutes} label="MIN"  />
                    <CountdownUnit value={countdown.seconds} label="SEC"  />
                  </div>
                </div>
              )}

              {/* Variants */}
              {variants.length > 0 && (
                <div className="space-y-3">
                  <p style={{ ...LABEL_CAPS, color: C.onSurfaceVariant }}>Select Variant</p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v: any) => (
                      <button
                        key={v.id}
                        data-testid={`variant-${v.id}`}
                        onClick={() => setSelectedVariantId(String(v.id))}
                        className="px-4 py-2 transition-colors"
                        style={{
                          border: `1px solid ${String(v.id) === selectedVariantId ? C.primary : C.outlineVariant}`,
                          backgroundColor: String(v.id) === selectedVariantId ? C.primary : "transparent",
                          color: String(v.id) === selectedVariantId ? "#fff" : C.onSurface,
                          ...MONO, fontSize: 11,
                        }}
                      >
                        {v.name || v.value || `Variant ${v.id}`}
                        {v.salePrice ? ` — ${formatCurrency(v.salePrice)}` : v.price ? ` — ${formatCurrency(v.price)}` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery estimate */}
              {deliveryDate && (
                <div className="flex items-center gap-2" style={{ color: C.onSurfaceVariant }}>
                  <Truck className="w-4 h-4" style={{ color: C.primary }} />
                  <span style={{ ...MONO, fontSize: 11 }}>Estimated delivery: {deliveryDate}</span>
                </div>
              )}

              {/* Coupons */}
              {visibleCoupons.length > 0 && (
                <div className="space-y-2">
                  <p style={{ ...LABEL_CAPS, color: C.onSurfaceVariant }}>Available Coupons</p>
                  <div className="flex flex-wrap gap-2">
                    {visibleCoupons.map(c => (
                      <button key={c.id} data-testid={`coupon-${c.id}`} onClick={() => copyCode(c.code)}
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
                  <button data-testid="qty-minus" onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="px-4 h-full flex items-center transition-colors duration-150 hover:bg-gray-100"
                    style={{ fontSize: 18, color: C.primary }}>−</button>
                  <input type="number" value={qty} readOnly data-testid="qty-input"
                    className="w-12 text-center bg-transparent focus:ring-0 border-none"
                    style={{ fontSize: 16, color: C.onSurface }} />
                  <button data-testid="qty-plus" onClick={() => setQty(q => q + 1)}
                    className="px-4 h-full flex items-center transition-colors duration-150 hover:bg-gray-100"
                    style={{ fontSize: 18, color: C.primary }}>+</button>
                </div>
                <button data-testid="add-to-cart" onClick={handleAddToCart}
                  className="flex-grow font-bold uppercase transition-all active:scale-95"
                  style={{ height: 56, backgroundColor: C.primary, color: "#fff", letterSpacing: "0.18em", fontSize: 13 }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = C.primaryContainer)}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = C.primary)}>
                  Add to Cart
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
                  "BioSync Dual-Species Technology",
                  "Graphene-Infused Textile",
                  "Veterinary-Grade Materials",
                ].map(label => (
                  <div key={label} className="flex justify-between items-center py-3 cursor-pointer group border-b" style={{ borderColor: `${C.outlineVariant}4D` }}>
                    <span style={{ ...LABEL_CAPS, color: C.primary }}>{label}</span>
                    <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" style={{ color: C.primary }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <AdBannerStrip banners={bs("hero", "bottom")} />

        {/* ════ PRODUCT NARRATIVE ════ */}
        {longDescText && (
          <section className="py-20 border-t" style={{ borderColor: `${C.outlineVariant}33` }}>
            <div className="grid grid-cols-1 md:grid-cols-12 items-center">
              <div className="md:col-span-5 px-8 md:px-16 py-8">
                <h2 style={{ ...PLAYFAIR, fontSize: 48, lineHeight: "56px", fontWeight: 600, fontStyle: "italic", color: C.primary, marginBottom: 32 }}>
                  Technical Specimen Profile
                </h2>
                <p style={{ fontSize: 18, lineHeight: "28px", fontWeight: 300, color: C.onSurfaceVariant }}
                  className="first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                  {longDescText}
                </p>
                {weight && (
                  <p style={{ ...MONO, fontSize: 11, color: C.onSurfaceVariant, marginTop: 24 }}>
                    MATERIAL WEIGHT: {weight}{dimensions ? `  ·  DIMENSIONS: ${dimensions}` : ""}
                  </p>
                )}
              </div>
              <div className="md:col-span-7 relative" style={{ minHeight: 500 }}>
                <img
                  src={allImgs.length > 1 ? allImgs[1] : allImgs[0]}
                  alt={product.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: "grayscale(100%)", transition: "filter 0.5s ease" }}
                  onMouseOver={e => (e.currentTarget.style.filter = "grayscale(0%)")}
                  onMouseOut={e => (e.currentTarget.style.filter = "grayscale(100%)")}
                  loading="lazy"
                />
              </div>
            </div>
          </section>
        )}

        {/* ════ TEXTILE SPECIFICATION ════ */}
        <section className="py-20" style={{ backgroundColor: "#ffffff" }}>
          <div className="px-8 md:px-16">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <div>
                <span style={{ ...MONO, fontSize: 12, color: C.secondary, display: "block", marginBottom: 4 }}>TECHNICAL LOG {specimenNo(product.id)}-T</span>
                <h2 style={{ ...PLAYFAIR, fontSize: 32, lineHeight: "40px", color: C.primary }}>Textile Specification</h2>
              </div>
              <p style={{ ...LABEL_CAPS, color: C.onSurfaceVariant, borderBottom: `1px solid ${C.primary}`, paddingBottom: 4 }}>BioSync Verified Content</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="md:col-span-1 overflow-hidden" style={{ aspectRatio: "3/4" }}>
                <img src={allImgs[2]} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-12 content-start">
                <div className="space-y-6">
                  <h3 className="pb-2 border-b" style={{ ...LABEL_CAPS, color: C.onSurface, borderColor: `${C.outlineVariant}4D` }}>Performance Profile (%)</h3>
                  <div className="space-y-8">
                    {[["BIOMETRIC SYNC", 94], ["THERMAL RETENTION", 92], ["MOVEMENT FLEX", 96], ["DURABILITY INDEX", 97]].map(([label, val]) => (
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
                  <h3 className="pb-2 border-b" style={{ ...LABEL_CAPS, color: C.onSurface, borderColor: `${C.outlineVariant}4D` }}>Material Data</h3>
                  <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                    {[["GRAPHENE", "Active"], ["WASH CYCLES", "500+"], ["SIZE RANGE", "XS–3XL"], ["WARRANTY", "Lifetime"]].map(([label, value]) => (
                      <div key={label} className="pl-4" style={{ borderLeft: `2px solid ${C.primaryContainer}` }}>
                        <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.onSurfaceVariant }}>{label}</p>
                        <p style={{ ...PLAYFAIR, fontSize: 32, lineHeight: "40px", color: C.primary }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-hidden mt-4" style={{ aspectRatio: "16/9" }}>
                    <img src={allImgs[3]} alt={`${product.title} detail`} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <AdBannerStrip banners={bs("spec", "bottom")} />

        {/* ════ TESTIMONIAL ARCHIVE ════ */}
        {(testimonials.length > 0 || reviews.length > 0) && (
          <section style={{ backgroundColor: "#f9faf6", padding: "80px 0" }}>
            <div className="px-5 md:px-16">
              {/* Aggregate header */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
                <div className="md:col-span-3 flex flex-col justify-center" style={{ backgroundColor: C.primary, padding: "40px 32px" }}>
                  <span style={{ ...MONO, fontSize: 11, color: C.mint, marginBottom: 12 }}>SUBJECT ARCHIVE</span>
                  <p style={{ ...PLAYFAIR, fontSize: 72, lineHeight: "80px", fontWeight: 700, color: "#fff" }}>{displayRating.toFixed(1)}</p>
                  <StarRow rating={Math.round(displayRating)} light />
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Based on {totalReviews} verified reports</p>
                </div>
                <div className="md:col-span-9 flex flex-col justify-center">
                  <h2 style={{ ...PLAYFAIR, fontSize: "clamp(28px,4vw,48px)", fontWeight: 600, color: C.primary, marginBottom: 16 }}>
                    Testimonial Archive
                  </h2>
                  <p style={{ fontSize: 16, color: C.onSurfaceVariant, lineHeight: 1.6 }}>
                    Verified field reports from the Twinning Collection subjects. Real dogs, real owners, real synchronisation.
                  </p>
                </div>
              </div>

              {/* Admin-managed testimonials */}
              {testimonials.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {testimonials.slice(0, 6).map((t: any, ti: number) => {
                    const ytEmbed = t.mediaType === "youtube" ? getYouTubeEmbedUrl(t.mediaUrl || "") : null;
                    return (
                      <div key={t.id} className="flex flex-col" style={{ border: `1px solid ${C.outlineVariant}4D`, backgroundColor: "#fff" }}>
                        <div className="w-full overflow-hidden" style={{ aspectRatio: "3/2" }}>
                          {ytEmbed
                            ? <iframe src={ytEmbed} className="w-full h-full" allow="encrypted-media" allowFullScreen title={`Subject ${t.subjectCode}`} />
                            : <img src={t.mediaUrl || fallbackImg(ti + 2)} alt={`Subject ${t.subjectCode}`} className="w-full h-full object-cover" loading="lazy" />}
                        </div>
                        <div className="flex flex-col gap-4 p-6">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <span style={{ ...MONO, fontSize: 10, color: "#717973" }}>SUBJECT: {t.subjectCode}</span>
                            <span style={{ ...MONO, fontSize: 10, color: C.primary, fontWeight: 700 }}>{t.satisfactionLabel}</span>
                          </div>
                          <blockquote style={{ ...PLAYFAIR, fontSize: 18, lineHeight: "28px", color: C.onSurface, fontStyle: "italic" }}>
                            "{t.quote}"
                          </blockquote>
                          <div className="flex gap-4 flex-wrap pt-2 border-t" style={{ borderColor: `${C.outlineVariant}4D` }}>
                            {t.location && <span style={{ ...MONO, fontSize: 10, color: C.onSurfaceVariant }}>LOC: {t.location}</span>}
                            {t.envData  && <span style={{ ...MONO, fontSize: 10, color: C.onSurfaceVariant }}>{t.envData}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Product reviews */}
              {reviews.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {reviews.slice(0, 6).map((r: any) => (
                    <div key={r.id} className="flex flex-col gap-4 p-6" style={{ border: `1px solid ${C.outlineVariant}4D`, backgroundColor: "#fff" }}>
                      <div className="flex items-start justify-between gap-2">
                        <StarRow rating={r.rating} />
                        <span style={{ ...MONO, fontSize: 10, color: C.onSurfaceVariant }}>{r.satisfactionLabel || `${r.rating}/5`}</span>
                      </div>
                      {r.title && <p style={{ ...LABEL_CAPS, fontSize: 12, color: C.primary }}>{r.title}</p>}
                      <blockquote style={{ ...PLAYFAIR, fontSize: 16, lineHeight: "24px", color: C.onSurface, fontStyle: "italic" }}>
                        "{r.content}"
                      </blockquote>
                      <p style={{ ...MONO, fontSize: 10, color: C.onSurfaceVariant }}>{r.userName || "Verified Owner"}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Write review */}
              {isAuthenticated && canReviewData?.canReview && (
                <div className="mt-8">
                  {!showReviewForm ? (
                    <button onClick={() => setShowReviewForm(true)} data-testid="btn-write-review"
                      className="px-8 py-4" style={{ border: `1px solid ${C.primary}`, color: C.primary, ...LABEL_CAPS }}>
                      Submit a Field Report
                    </button>
                  ) : (
                    <div className="max-w-xl space-y-6" style={{ border: `1px solid ${C.outlineVariant}4D`, padding: 32, backgroundColor: "#fff" }}>
                      <h3 style={{ ...PLAYFAIR, fontSize: 24, color: C.primary }}>Submit Field Report</h3>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => setReviewRating(s)} data-testid={`review-star-${s}`}>
                            <FilledStar size={24} />
                          </button>
                        ))}
                      </div>
                      <input value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="Report title"
                        className="w-full bg-transparent focus:outline-none py-3 border-b"
                        style={{ borderColor: C.outlineVariant, ...MONO, fontSize: 13 }}
                        data-testid="input-review-title" />
                      <textarea value={reviewContent} onChange={e => setReviewContent(e.target.value)} placeholder="Your field observations…"
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
        )}

        <AdBannerStrip banners={bs("testimonials", "bottom")} />

        {/* ════ RELATED PRODUCTS ════ */}
        {related.length > 0 && (
          <section className="py-20 px-8 md:px-16 border-t" style={{ borderColor: `${C.outlineVariant}33` }}>
            <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
              <h2 style={{ ...PLAYFAIR, fontSize: 32, color: C.primary }}>More from the Twinning Collection</h2>
              <Link href="/category/twinning">
                <span style={{ ...LABEL_CAPS, color: C.primary, borderBottom: `1px solid ${C.primary}`, paddingBottom: 4, cursor: "pointer" }}>
                  View All Sets →
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((p: any, ri: number) => {
                const imgs   = p.images || [];
                const imgUrl = imgs.find((i: any) => i.isPrimary)?.url || imgs[0]?.url || imgs[0]?.imageUrl || fallbackImg(ri + 4);
                const price  = p.salePrice || p.price;
                return (
                  <Link key={p.id} href={`/twinning/product/${p.slug}`}>
                    <div className="group cursor-pointer" data-testid={`related-product-${p.id}`}>
                      <div className="overflow-hidden mb-4" style={{ aspectRatio: "4/5" }}>
                        <img src={imgUrl} alt={p.name || p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      </div>
                      <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.secondary, marginBottom: 4 }}>Twinning Collection</p>
                      <p style={{ ...PLAYFAIR, fontSize: 20, color: C.primary, marginBottom: 4 }}>{p.name || p.title}</p>
                      <p style={{ ...MONO, fontSize: 13, color: C.onSurface }}>{formatCurrency(price)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </main>

      <EditorialFooter footer={footer} email="" onEmailChange={() => {}} />
    </>
  );
}
