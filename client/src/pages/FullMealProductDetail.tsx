import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ShoppingCart, Minus, Plus, ArrowRight, Star, ChevronLeft } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { EditorialHeader, EditorialFooter, C } from "@/components/store/EditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";
import type { HomepageSettings } from "@/lib/homepageDefaults";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductWithDetails, ReviewWithUser } from "@shared/schema";

function getProductImage(product: any, index = 0): string {
  const imgs = product?.images || product?.productImages || [];
  if (imgs[index]) {
    const img = imgs[index];
    return img.url || img.imageUrl || "";
  }
  return product?.imageUrl || product?.image || "";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

const SPECIMEN_LABELS = ["No. 042", "No. 017", "No. 088", "No. 031", "No. 056", "No. 073", "No. 099", "No. 024"];

function specimenNumber(id: string | number): string {
  const n = parseInt(String(id), 10);
  return `No. ${String(isNaN(n) ? 42 : (n % 900) + 42).padStart(3, "0")}`;
}

function StarRating({ rating, size = 20 }: { rating: number; size?: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= rating ? C.primary : "none"} stroke={C.primary} strokeWidth={1.5}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

export default function FullMealProductDetail() {
  const [, params] = useRoute("/full-meals/product/:slug");
  const slug = params?.slug;

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { addToCart } = useStore();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: homepageData } = useQuery<{ settings: Partial<HomepageSettings> }>({
    queryKey: ["/api/settings/homepage"],
  });
  const nav = homepageData ? mergeHomepageSettings(homepageData.settings || {}).nav : DEFAULT_HOMEPAGE_SETTINGS.nav;
  const footer = homepageData ? mergeHomepageSettings(homepageData.settings || {}).footer : DEFAULT_HOMEPAGE_SETTINGS.footer;

  const { data, isLoading } = useQuery<{ product: ProductWithDetails }>({
    queryKey: [`/api/products/${slug}`],
    enabled: !!slug,
  });
  const product = data?.product;

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
      setReviewTitle("");
      setReviewContent("");
      setReviewRating(5);
    },
    onError: () => toast({ title: "Error", description: "Could not submit review.", variant: "destructive" }),
  });

  useEffect(() => { setActiveImage(0); }, [slug]);

  if (isLoading) {
    return (
      <>
        <EditorialHeader nav={nav} />
        <div className="min-h-screen flex items-center justify-center" style={{ marginTop: 96 }}>
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: C.primary, borderTopColor: "transparent" }} />
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: C.onSurfaceVariant }}>Loading specimen...</p>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <EditorialHeader nav={nav} />
        <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ marginTop: 96 }}>
          <p className="font-mono text-xs uppercase tracking-widest" style={{ color: C.onSurfaceVariant }}>Specimen not found</p>
          <Link href="/full-meals">
            <button className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest px-8 py-3 border" style={{ borderColor: C.primary, color: C.primary }}>
              <ChevronLeft className="w-4 h-4" /> Back to Archive
            </button>
          </Link>
        </div>
      </>
    );
  }

  const images = product.images || [];
  const allImages = images.length > 0 ? images.map((img: any) => img.url || img.imageUrl || "") : [getProductImage(product)];
  const variants = product.variants || [];
  const selectedVariant = variants.find((v: any) => v.id === selectedVariantId);

  const currentPrice = selectedVariant?.salePrice || selectedVariant?.price || product.salePrice || product.price;
  const originalPrice = selectedVariant?.price || product.price;
  const hasDiscount = currentPrice && originalPrice && parseFloat(String(currentPrice)) < parseFloat(String(originalPrice));
  const discountPct = hasDiscount
    ? Math.round((1 - parseFloat(String(currentPrice!)) / parseFloat(String(originalPrice!))) * 100)
    : 0;

  const reviews = (reviewsData?.reviews || []).filter((r) => r.status === "approved");
  const avgRating = product.averageRating ? parseFloat(product.averageRating) : 0;
  const specNo = specimenNumber(product.id);
  const descriptionText = product.description ? stripHtml(product.description) : "";
  const relatedProducts = relatedData?.products || [];

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, quantity, selectedVariantId ? Number(selectedVariantId) : undefined);
      toast({ title: `${product.title} added to cart` });
    } catch {
      toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" });
    }
  };

  return (
    <>
      <EditorialHeader nav={nav} />

      <main style={{ marginTop: 96, backgroundColor: C.surface, color: C.onSurface, fontFamily: "Inter, sans-serif" }}>

        {/* ── Breadcrumb ── */}
        <div className="px-5 md:px-16 pt-6 pb-2 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.outlineVariant}33` }}>
          <Link href="/full-meals">
            <span className="font-mono text-xs uppercase tracking-widest cursor-pointer hover:underline" style={{ color: C.onSurfaceVariant }}>Archive</span>
          </Link>
          <span style={{ color: C.outlineVariant }}>/</span>
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: C.primary }}>{product.title}</span>
        </div>

        {/* ── Hero ── */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 px-5 md:px-16 py-16 min-h-screen items-start">

          {/* Left: Gallery */}
          <div className="md:col-span-7 flex flex-col md:flex-row gap-6">

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex flex-row md:flex-col gap-3 md:w-28 shrink-0 overflow-x-auto md:overflow-visible">
                {allImages.map((src: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    data-testid={`thumb-${i}`}
                    className="shrink-0"
                    style={{ width: 80, aspectRatio: "4/5", border: `2px solid ${i === activeImage ? C.primary : C.outlineVariant}`, opacity: i === activeImage ? 1 : 0.55, transition: "all 0.3s", cursor: "pointer" }}
                  >
                    <img src={src} alt={`${product.title} view ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-grow">
              <div className="relative overflow-hidden" style={{ aspectRatio: "4/5", boxShadow: `40px 40px 0px 0px ${C.primaryContainer}26` }}>
                <img
                  src={allImages[activeImage] || ""}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {product.isFeatured && (
                  <div className="absolute bottom-6 left-6 px-4 py-1 font-mono text-xs uppercase tracking-widest" style={{ backgroundColor: C.primary, color: "#c0edd4", letterSpacing: "0.2em" }}>
                    Verified Organic
                  </div>
                )}
                {hasDiscount && (
                  <div className="absolute top-6 right-6 px-3 py-1 font-mono text-xs font-bold" style={{ backgroundColor: "#944923", color: "#fff" }}>
                    -{discountPct}%
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Commerce */}
          <div className="md:col-span-5 flex flex-col justify-start pt-4 md:pt-24 space-y-8">

            {/* Meta */}
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-widest" style={{ color: C.secondary, letterSpacing: "0.15em" }}>
                Biological Collection / Full Meals
              </p>
              <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(32px,5vw,48px)", fontWeight: 600, lineHeight: 1.15, color: C.primary }}>
                {product.title}
              </h1>
              <div className="flex items-center gap-4 py-3" style={{ borderTop: `1px solid ${C.outlineVariant}33`, borderBottom: `1px solid ${C.outlineVariant}33` }}>
                <span className="font-mono text-sm uppercase" style={{ letterSpacing: "0.05em", color: C.onSurface }}>SPECIMEN {specNo}</span>
                {product.sku && (
                  <>
                    <span style={{ width: 1, height: 16, backgroundColor: C.outlineVariant, display: "inline-block" }} />
                    <span className="font-mono text-xs" style={{ color: C.onSurfaceVariant }}>SKU: {product.sku}</span>
                  </>
                )}
                {avgRating > 0 && (
                  <>
                    <span style={{ width: 1, height: 16, backgroundColor: C.outlineVariant, display: "inline-block" }} />
                    <div className="flex items-center gap-1">
                      <StarRating rating={Math.round(avgRating)} size={14} />
                      <span className="font-mono text-xs" style={{ color: C.onSurfaceVariant }}>({product.reviewCount ?? reviews.length})</span>
                    </div>
                  </>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 py-1">
                {hasDiscount && (
                  <span className="font-mono text-base line-through" style={{ color: C.onSurfaceVariant }}>
                    {formatCurrency(originalPrice!)}
                  </span>
                )}
                <span style={{ fontFamily: "Playfair Display, serif", fontSize: 32, fontWeight: 600, color: C.primary }}>
                  {formatCurrency(currentPrice!)}
                </span>
              </div>
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="space-y-3">
                <label className="font-mono text-xs uppercase tracking-widest block" style={{ color: C.onSurfaceVariant }}>
                  Select Weight / SKU
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {variants.map((v: any) => {
                    const isSelected = v.id === selectedVariantId;
                    const vPrice = v.salePrice || v.price;
                    return (
                      <button
                        key={v.id}
                        data-testid={`variant-${v.id}`}
                        onClick={() => setSelectedVariantId(isSelected ? undefined : String(v.id))}
                        className="p-4 text-left flex justify-between items-center transition-all duration-200"
                        style={{
                          border: `${isSelected ? 2 : 1}px solid ${isSelected ? C.primary : C.outlineVariant}`,
                          backgroundColor: isSelected ? `${C.primary}08` : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <div>
                          <span className="font-bold text-sm block" style={{ color: isSelected ? C.primary : C.onSurface }}>{v.name}</span>
                          {v.attributes && <span className="font-mono text-xs" style={{ color: C.onSurfaceVariant }}>{v.attributes}</span>}
                        </div>
                        <div className="text-right">
                          {v.salePrice && parseFloat(v.salePrice) < parseFloat(v.price) && (
                            <span className="font-mono text-xs line-through block" style={{ color: C.onSurfaceVariant }}>{formatCurrency(v.price)}</span>
                          )}
                          <span className="font-mono text-xs font-bold" style={{ color: C.primary }}>{formatCurrency(vPrice)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subscription badge */}
            <div className="flex items-center gap-4 p-4" style={{ backgroundColor: "#fe9e7122", border: `1px solid ${C.secondary}33` }}>
              <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: "#944923", color: "#fff", fontSize: 14, fontWeight: 700 }}>S</div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#77330e" }}>Subscription customers save more</p>
                <p className="text-xs mt-0.5" style={{ color: C.onSurfaceVariant }}>Automated replenishment for the pack.</p>
              </div>
            </div>

            {/* Qty + Add to Cart */}
            <div className="flex gap-4">
              <div className="flex items-center" style={{ border: `1px solid ${C.outlineVariant}`, height: 56 }}>
                <button
                  data-testid="qty-minus"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 h-full flex items-center justify-center transition-colors duration-200"
                  style={{ color: C.primary }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = C.outlineVariant + "55")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-mono text-base" style={{ color: C.onSurface }}>{quantity}</span>
                <button
                  data-testid="qty-plus"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 h-full flex items-center justify-center transition-colors duration-200"
                  style={{ color: C.primary }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = C.outlineVariant + "55")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                data-testid="add-to-cart"
                onClick={handleAddToCart}
                className="flex-grow flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-widest transition-all duration-300 active:scale-95"
                style={{ height: 56, backgroundColor: C.primary, color: "#fff", letterSpacing: "0.2em" }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#944923")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </div>

            {/* Stock status */}
            {product.stock !== undefined && (
              <p className="font-mono text-xs" style={{ color: product.stock > 0 ? "#2d6a4f" : "#ba1a1a" }}>
                {product.stock > 0 ? `${product.stock} units available` : "Out of stock"}
              </p>
            )}

            {/* Info links */}
            <div className="flex flex-col gap-0 pt-4" style={{ borderTop: `1px solid ${C.outlineVariant}20` }}>
              {[["Ancestral Sourcing", "100% traceable, ethically harvested ingredients"],
                ["Veterinary Approval", "Formulated with veterinary nutritionists"],
                ["Cold-synthesis process", "Nutrients preserved at molecular level"]].map(([label, desc]) => (
                <div key={label} className="flex justify-between items-center py-3 group cursor-default" style={{ borderBottom: `1px solid ${C.outlineVariant}30` }}>
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest block" style={{ color: C.primary }}>{label}</span>
                    <span className="text-xs mt-0.5 block" style={{ color: C.onSurfaceVariant }}>{desc}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" style={{ color: C.onSurfaceVariant }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Biological Synthesis (Description) ── */}
        {descriptionText && (
          <section className="py-20 px-5 md:px-16" style={{ borderTop: `1px solid ${C.outlineVariant}20` }}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center max-w-7xl mx-auto">
              <div className="md:col-span-5">
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 600, color: C.primary, fontStyle: "italic", marginBottom: 32 }}>
                  Biological Synthesis
                </h2>
                <p
                  className="leading-relaxed"
                  style={{ fontSize: 18, fontWeight: 300, color: C.onSurfaceVariant, lineHeight: 1.8 }}
                >
                  {descriptionText}
                </p>
              </div>
              {allImages.length > 1 && (
                <div className="md:col-start-7 md:col-span-6 relative" style={{ height: 480 }}>
                  <img
                    src={allImages[1] || allImages[0]}
                    alt={product.title}
                    className="w-full h-full object-cover shadow-2xl"
                    style={{ filter: "grayscale(0)", transition: "filter 0.5s ease" }}
                    onMouseOver={(e) => (e.currentTarget.style.filter = "grayscale(100%)")}
                    onMouseOut={(e) => (e.currentTarget.style.filter = "grayscale(0%)")}
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Technical Spec Sheet ── */}
        <section className="py-20 -mx-0 md:-mx-16 px-5 md:px-16" style={{ backgroundColor: "#ffffff", borderTop: `1px solid ${C.outlineVariant}20` }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest block mb-1" style={{ color: C.secondary }}>DATA REPORT</span>
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(24px,3vw,32px)", fontWeight: 400, color: C.primary }}>Technical Specification</h2>
              </div>
              <p className="font-mono text-xs uppercase tracking-widest pb-1" style={{ color: C.onSurfaceVariant, borderBottom: `1px solid ${C.primary}` }}>Laboratory Verified Content</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Macro Profile */}
              <div className="space-y-6">
                <h3 className="font-mono text-xs uppercase tracking-widest pb-2" style={{ color: C.onSurfaceVariant, borderBottom: `1px solid ${C.outlineVariant}30` }}>
                  Macro Profile (%)
                </h3>
                <div className="space-y-8">
                  {[
                    { label: "PROTEIN (MIN)", value: 68.5 },
                    { label: "FAT (MAX)", value: 12.2 },
                    { label: "MOISTURE (MAX)", value: 8.2 },
                    { label: "CRUDE FIBRE (MAX)", value: 3.5 },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="flex justify-between font-mono text-sm mb-2" style={{ color: C.onSurface }}>
                        <span>{label}</span>
                        <span>{value}%</span>
                      </div>
                      <div className="w-full h-0.5" style={{ backgroundColor: `${C.outlineVariant}50` }}>
                        <div className="h-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: "#fe9e71" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Micronutrient Density */}
              <div className="space-y-6">
                <h3 className="font-mono text-xs uppercase tracking-widest pb-2" style={{ color: C.onSurfaceVariant, borderBottom: `1px solid ${C.outlineVariant}30` }}>
                  Micronutrient Density (mg/kg)
                </h3>
                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  {[
                    { label: "IRON", value: "24.1" },
                    { label: "COPPER", value: "4.8" },
                    { label: "OMEGA-3", value: "1200" },
                    { label: "SELENIUM", value: "0.9" },
                  ].map(({ label, value }) => (
                    <div key={label} className="pl-4" style={{ borderLeft: `2px solid ${C.primaryContainer}` }}>
                      <p className="font-mono text-xs uppercase mb-1" style={{ color: C.onSurfaceVariant, fontSize: 10 }}>{label}</p>
                      <p style={{ fontFamily: "Playfair Display, serif", fontSize: 28, color: C.primary }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Field Reports (Reviews) ── */}
        <section className="py-20 px-5 md:px-16 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 600, color: C.primary }}>
              Field Reports
            </h2>
            {avgRating > 0 && (
              <div className="flex justify-center items-center gap-3 mt-4">
                <StarRating rating={Math.round(avgRating)} size={22} />
                <span className="font-mono text-xs uppercase tracking-widest" style={{ color: C.onSurfaceVariant }}>
                  Based on {product.reviewCount ?? reviews.length} Observations
                </span>
              </div>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {reviews.slice(0, 6).map((r) => (
                <div key={r.id} className="p-8 space-y-4" style={{ borderLeft: `1px solid ${C.outlineVariant}50` }}>
                  <StarRating rating={r.rating} size={16} />
                  <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontStyle: "italic", lineHeight: 1.7, color: C.onSurface }}>
                    "{r.content}"
                  </p>
                  <div>
                    <p className="font-mono text-xs uppercase font-bold" style={{ color: C.primary }}>
                      {r.user?.firstName ? `${r.user.firstName} ${r.user.lastName || ""}`.trim() : "Verified Buyer"}
                    </p>
                    {r.title && (
                      <p className="font-mono text-xs mt-0.5" style={{ color: C.onSurfaceVariant }}>{r.title}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center font-mono text-xs uppercase tracking-widest" style={{ color: C.onSurfaceVariant }}>
              No field reports yet. Be the first to submit.
            </p>
          )}

          {/* Write a review */}
          {isAuthenticated && canReviewData?.canReview && (
            <div className="mt-12 text-center">
              {!showReviewForm ? (
                <button
                  data-testid="write-review-btn"
                  onClick={() => setShowReviewForm(true)}
                  className="font-mono text-xs uppercase tracking-widest pb-1 transition-all duration-200"
                  style={{ borderBottom: `2px solid ${C.primary}`, color: C.primary }}
                >
                  Submit Field Report
                </button>
              ) : (
                <div className="max-w-xl mx-auto text-left space-y-4 mt-8 p-8" style={{ border: `1px solid ${C.outlineVariant}30` }}>
                  <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: C.primary }}>New Field Report</p>
                  {/* Star selector */}
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setReviewRating(s)}>
                        <Star className={`w-6 h-6 ${s <= reviewRating ? "fill-current" : ""}`} style={{ color: C.primary }} />
                      </button>
                    ))}
                  </div>
                  <input
                    data-testid="review-title"
                    placeholder="Report title"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-4 py-3 font-mono text-sm bg-transparent"
                    style={{ border: `1px solid ${C.outlineVariant}`, color: C.onSurface, outline: "none" }}
                  />
                  <textarea
                    data-testid="review-content"
                    placeholder="Describe your observation..."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 font-mono text-sm bg-transparent resize-none"
                    style={{ border: `1px solid ${C.outlineVariant}`, color: C.onSurface, outline: "none" }}
                  />
                  <div className="flex gap-3">
                    <button
                      data-testid="submit-review"
                      onClick={() => submitReview.mutate({ rating: reviewRating, title: reviewTitle, content: reviewContent })}
                      disabled={submitReview.isPending || !reviewContent.trim()}
                      className="font-mono text-xs uppercase tracking-widest px-8 py-3 transition-all duration-200"
                      style={{ backgroundColor: C.primary, color: "#fff", opacity: submitReview.isPending ? 0.7 : 1 }}
                    >
                      {submitReview.isPending ? "Submitting..." : "Submit"}
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="font-mono text-xs uppercase tracking-widest px-8 py-3"
                      style={{ border: `1px solid ${C.outlineVariant}`, color: C.onSurfaceVariant }}
                    >
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
          <section className="py-20 px-5 md:px-16" style={{ borderTop: `1px solid ${C.outlineVariant}20` }}>
            <div className="max-w-7xl mx-auto">
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 600, fontStyle: "italic", color: C.primary, marginBottom: 48 }}>
                Related Specimens
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedProducts.map((rp: any, i: number) => {
                  const rpImg = getProductImage(rp);
                  const rpPrice = rp.salePrice || rp.price;
                  return (
                    <Link key={rp.id} href={`/full-meals/product/${rp.slug}`}>
                      <div className="group cursor-pointer">
                        <div className="overflow-hidden mb-4" style={{ aspectRatio: "4/5", border: `1px solid ${C.outlineVariant}30` }}>
                          <img
                            src={rpImg}
                            alt={rp.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: C.secondary }}>
                          Specimen {specimenNumber(rp.id)}
                        </p>
                        <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.primary, marginBottom: 6 }}>
                          {rp.title}
                        </h3>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-sm" style={{ color: C.primary }}>
                            {rpPrice ? formatCurrency(rpPrice) : "—"}
                          </span>
                          <button
                            data-testid={`related-view-${rp.id}`}
                            className="font-mono text-xs uppercase pb-0.5 transition-colors duration-200"
                            style={{ borderBottom: `1px solid ${C.primary}`, color: C.primary }}
                          >
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
