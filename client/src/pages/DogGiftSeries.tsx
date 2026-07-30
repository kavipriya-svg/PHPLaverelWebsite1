import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ShoppingCart, ArrowRight } from "lucide-react";
import {
  HomeEditorialHeader as EditorialHeader,
  HomeEditorialFooter as EditorialFooter,
} from "@/components/store/HomeEditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:                "#00160c",
  secondary:              "#944923",
  white:                  "#ffffff",
  surface:                "#f9faf6",
  surfaceContainerLow:    "#f3f4f0",
  surfaceContainer:       "#eeeeeb",
  surfaceContainerHigh:   "#e8e8e5",
  surfaceContainerHighest:"#e2e3e0",
  surfaceContainerLowest: "#ffffff",
  surfaceDim:             "#dadad7",
  secondaryFixed:         "#ffdbcc",
  outlineVariant:         "#c1c8c2",
  outline:                "#717973",
  onSurface:              "#1a1c1a",
  onSurfaceVariant:       "#414844",
};

const BG_CYCLE = [
  "#f3f4f0","#e2e3e0","#f9faf6","#e8e8e5",
  "#ffffff","#00160c","#f3f4f0","#dadad7","#e8e8e5","#ffffff",
];

const PLAYFAIR: React.CSSProperties  = { fontFamily: "Playfair Display, serif" };
const INTER: React.CSSProperties     = { fontFamily: "Inter, sans-serif" };
const MONO: React.CSSProperties      = { fontFamily: "monospace" };
const LABEL_CAPS: React.CSSProperties = { ...INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" };

// ─── Static fallback testimonials ─────────────────────────────────────────────
const STATIC_TESTIMONIALS = [
  { id: "s1", subjectCode: "GS-001", satisfactionLabel: "5/5", quote: "The Twinning Protocol bundle was the most thoughtful gift I've ever given — or received. My Doberman and I have never looked more synchronized.", location: "Mumbai", envData: null, mediaType: "none", mediaUrl: null, isActive: true, sortOrder: 0 },
  { id: "s2", subjectCode: "GS-002", satisfactionLabel: "5/5", quote: "I ordered the Wolf Diet Bundle for my Labrador and the packaging alone felt like opening a luxury artifact. The food quality is unmatched — she's visibly more energetic.", location: "Bengaluru", envData: null, mediaType: "none", mediaUrl: null, isActive: true, sortOrder: 1 },
  { id: "s3", subjectCode: "GS-003", satisfactionLabel: "5/5", quote: "The Arctic Shield Shell is worth every rupee. My Husky absolutely refused to take it off during our Himalayan trip. Functional and cinematic.", location: "Delhi", envData: null, mediaType: "none", mediaUrl: null, isActive: true, sortOrder: 2 },
  { id: "s4", subjectCode: "GS-004", satisfactionLabel: "4/5", quote: "Gifted the Cognitive Stimuli Pack to my friend's Border Collie. The dog solved the Level 4 module in under two hours. It's almost unsettling how good this is.", location: "Pune", envData: null, mediaType: "none", mediaUrl: null, isActive: true, sortOrder: 3 },
];

// ─── Gift Services category ID ─────────────────────────────────────────────────
const GIFT_SERVICES_CATEGORY_ID = "02edbc27-d6ff-4691-a1b8-00358b7d94b4";

// ─── Default page settings ─────────────────────────────────────────────────────
const PAGE_DEFAULTS = {
  hero: {
    tag: "GIFTING SERVICES",
    headline: "The Synchronization Vault",
    subtitle: "Precision biological alignment. Aesthetic harmony. The ultimate canine-human gift protocols.",
    bgImageUrl: "",
    scrollCta: "SCROLL TO ACCESS DOSSIERS",
    showCta1: false, cta1Text: "Explore Gifts", cta1Href: "#",
    showCta2: false, cta2Text: "Learn More",    cta2Href: "#",
  },
  dossiers: { visible: true, sectionLabel: "Protocol" },
  testimonials: { visible: true, tag: "Field Reports", headline: "Verified Transmissions" },
  relatedProducts: { visible: true, tag: "Gift Services", headline: "More From the Vault", ctaText: "Explore All Gift Services", ctaHref: "/category/gift-services" },
};

function deepMerge(defaults: any, overrides: any): any {
  const r = { ...defaults };
  for (const k of Object.keys(overrides ?? {})) {
    if (typeof defaults[k] === "object" && defaults[k] !== null && !Array.isArray(defaults[k]) && overrides[k]) {
      r[k] = deepMerge(defaults[k], overrides[k]);
    } else if (overrides[k] !== undefined) {
      r[k] = overrides[k];
    }
  }
  return r;
}

// ─── Scroll-reveal hook ────────────────────────────────────────────────────────
function useReveal<T extends HTMLElement>(): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function FilledStar({ dark = false }: { dark?: boolean }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill={dark ? C.secondaryFixed : C.secondary} stroke="none">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

// ─── Ad Banner strip ──────────────────────────────────────────────────────────
function AdBannerStrip({ banners, position }: { banners: any[]; position: "top" | "bottom" }) {
  const filtered = banners.filter(b => b.position === position && b.isActive);
  if (!filtered.length) return null;
  return (
    <>
      {filtered.map(b => (
        <div key={b.id} style={{ width: "100%", overflow: "hidden", position: "relative" }}>
          {b.mediaType === "video" ? (
            <div style={{ aspectRatio: "16/5", backgroundColor: C.primary }} />
          ) : (
            <img src={b.mediaUrl} alt={b.title ?? "banner"} style={{ width: "100%", display: "block", maxHeight: 300, objectFit: "cover" }} />
          )}
          {(b.title || b.ctaText) && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)", padding: 24, textAlign: "center" }}>
              {b.title && <p style={{ ...PLAYFAIR, fontSize: "clamp(18px,3vw,32px)", color: C.white, fontWeight: 600, marginBottom: 8 }}>{b.title}</p>}
              {b.subtitle && <p style={{ ...INTER, fontSize: 14, color: "rgba(255,255,255,0.85)", marginBottom: 16 }}>{b.subtitle}</p>}
              {b.ctaText && b.ctaUrl && (
                <Link href={b.ctaUrl}>
                  <button style={{ ...LABEL_CAPS, backgroundColor: C.secondary, color: C.white, border: "none", padding: "12px 32px", cursor: "pointer" }}>
                    {b.ctaText}
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

// ─── Dossier section ──────────────────────────────────────────────────────────
function DossierSection({ product, index, allBanners, sectionLabel }: { product: any; index: number; allBanners: any[]; sectionLabel: string }) {
  const [imgRef, imgVisible] = useReveal<HTMLDivElement>();
  const [textRef, textVisible] = useReveal<HTMLDivElement>();
  const [imgHovered, setImgHovered] = useState(false);
  const [cartPending, setCartPending] = useState(false);
  const { addToCart } = useStore();
  const { toast } = useToast();

  const imageRight = index % 2 === 1;
  const bg = BG_CYCLE[index % BG_CYCLE.length];
  const isDark = bg === "#00160c";

  const img = product.images?.[0]?.url || product.images?.[0]?.imageUrl || product.imageUrl || product.primaryImageUrl;
  const price = product.salePrice || product.price;
  const originalPrice = product.price;
  const onSale = price && originalPrice && parseFloat(String(price)) < parseFloat(String(originalPrice));

  const dossierBanners = allBanners.filter(b => b.placement === "dossiers" || b.placement === "both");

  const handleAddToCart = async () => {
    if (!product?.id) return;
    setCartPending(true);
    try {
      await addToCart(product.id, 1, undefined);
      toast({ title: `${product.title} added to cart` });
    } catch {
      toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" });
    } finally {
      setCartPending(false);
    }
  };

  const imgCol = (
    <div
      ref={imgRef}
      className={imageRight ? "order-1 md:order-2" : "order-1"}
      style={{
        opacity: imgVisible ? 1 : 0,
        transform: imgVisible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 1s cubic-bezier(0.2,1,0.3,1), transform 1s cubic-bezier(0.2,1,0.3,1)",
        transitionDelay: "0.1s",
        height: "80vh", minHeight: 500, overflow: "hidden",
      }}
    >
      <img
        src={img || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop"}
        alt={product.title}
        onError={e => { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb = "1"; t.src = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop"; } }}
        onMouseEnter={() => setImgHovered(true)}
        onMouseLeave={() => setImgHovered(false)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: imgHovered ? "grayscale(0%)" : "grayscale(100%)", transition: "filter 0.6s ease" }}
      />
    </div>
  );

  const textCol = (
    <div
      ref={textRef}
      className={`${imageRight ? "order-2 md:order-1" : "order-2"} px-8 md:px-16`}
      style={{
        opacity: textVisible ? 1 : 0,
        transform: textVisible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 1s cubic-bezier(0.2,1,0.3,1), transform 1s cubic-bezier(0.2,1,0.3,1)",
        transitionDelay: "0.25s",
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}
    >
      <span style={{ ...MONO, color: C.secondary, fontWeight: 700, fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>
        {sectionLabel} // {String(index + 1).padStart(3, "0")}
      </span>
      <h2 style={{ ...PLAYFAIR, fontSize: "clamp(32px,4vw,48px)", lineHeight: "1.15", fontWeight: 600, color: isDark ? C.white : C.primary, marginBottom: 20 }}>
        {product.title}
      </h2>
      <p style={{ ...INTER, fontSize: 16, lineHeight: "26px", color: isDark ? "rgba(255,255,255,0.7)" : C.onSurfaceVariant, marginBottom: 32 }}>
        {product.description || product.shortDescription || "A precision-engineered product crafted for the modern dog and their human companion."}
      </p>
      <div style={{ borderLeft: `1px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,22,12,0.2)"}`, paddingLeft: 24, marginBottom: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        {product.sku && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ ...MONO, fontSize: 10, color: isDark ? "rgba(255,255,255,0.4)" : C.outline, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>SKU</span>
            <span style={{ ...INTER, fontSize: 14, fontWeight: 600, color: isDark ? C.white : C.primary }}>{product.sku}</span>
          </div>
        )}
        {product.weight && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ ...MONO, fontSize: 10, color: isDark ? "rgba(255,255,255,0.4)" : C.outline, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Weight</span>
            <span style={{ ...INTER, fontSize: 14, fontWeight: 600, color: isDark ? C.white : C.primary }}>{product.weight}</span>
          </div>
        )}
        {product.stockQuantity !== undefined && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ ...MONO, fontSize: 10, color: isDark ? "rgba(255,255,255,0.4)" : C.outline, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Availability</span>
            <span style={{ ...INTER, fontSize: 14, fontWeight: 600, color: isDark ? C.white : C.primary }}>
              {product.stockQuantity > 0 ? `${product.stockQuantity} units available` : "Out of stock"}
            </span>
          </div>
        )}
      </div>
      {price && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 28 }}>
          {onSale && (
            <span style={{ ...INTER, fontSize: 15, color: isDark ? "rgba(255,255,255,0.4)" : C.outline, textDecoration: "line-through" }}>
              {formatCurrency(originalPrice)}
            </span>
          )}
          <span style={{ ...PLAYFAIR, fontSize: 28, fontWeight: 400, color: isDark ? C.white : C.primary }}>{formatCurrency(price)}</span>
          {onSale && <span style={{ ...LABEL_CAPS, fontSize: 10, backgroundColor: C.secondary, color: C.white, padding: "3px 8px" }}>SALE</span>}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <button
          onClick={handleAddToCart}
          disabled={cartPending}
          data-testid={`button-add-to-cart-${product.id}`}
          style={{ ...INTER, backgroundColor: isDark ? C.secondaryFixed : C.primary, color: isDark ? C.primary : C.white, border: "2px solid transparent", padding: "16px 28px", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: cartPending ? "not-allowed" : "pointer", opacity: cartPending ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8, transition: "opacity 0.2s" }}
        >
          <ShoppingCart size={14} />
          {cartPending ? "Adding…" : "Add to Cart"}
        </button>
        <Link href={`/giftseries/product/${product.slug}`}>
          <button
            data-testid={`button-view-specimen-${product.id}`}
            style={{ ...INTER, backgroundColor: "transparent", color: isDark ? C.white : C.primary, border: `2px solid ${isDark ? "rgba(255,255,255,0.4)" : "rgba(0,22,12,0.3)"}`, padding: "16px 28px", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
            onMouseOver={e => { e.currentTarget.style.opacity = "0.7"; }}
            onMouseOut={e => { e.currentTarget.style.opacity = "1"; }}
          >
            View Details <ArrowRight size={14} />
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {index === 0 && <AdBannerStrip banners={dossierBanners} position="top" />}
      <section style={{ borderBottom: `1px solid ${C.outlineVariant}33`, backgroundColor: bg, padding: "80px 0" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 items-center">
          {imageRight ? <>{textCol}{imgCol}</> : <>{imgCol}{textCol}</>}
        </div>
      </section>
      {index === 0 && <AdBannerStrip banners={dossierBanners} position="bottom" />}
    </>
  );
}

// ─── Testimonials section ─────────────────────────────────────────────────────
function TestimonialsSection({ testimonials, banners, tag, headline }: { testimonials: any[]; banners: any[]; tag: string; headline: string }) {
  const [ref, visible] = useReveal<HTMLDivElement>();
  const sectionBanners = banners.filter(b => b.placement === "testimonials" || b.placement === "both");
  const display = testimonials.length > 0 ? testimonials : STATIC_TESTIMONIALS;

  return (
    <>
      <AdBannerStrip banners={sectionBanners} position="top" />
      <section ref={ref} style={{ backgroundColor: C.primary, padding: "clamp(48px,8vw,96px) clamp(20px,5vw,64px)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ ...LABEL_CAPS, color: C.secondaryFixed, display: "block", marginBottom: 16 }}>{tag}</span>
            <h2 style={{ ...PLAYFAIR, fontSize: "clamp(32px,4vw,48px)", color: C.white, fontWeight: 600 }}>{headline}</h2>
            <div style={{ height: 1, width: 64, backgroundColor: C.secondary, margin: "24px auto 0" }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {display.map((t, i) => {
              const ratingNum = parseInt(String(t.satisfactionLabel ?? "5")) || 5;
              return (
                <div key={t.id ?? i} style={{ padding: 40, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)" }}>
                  {t.mediaType && t.mediaType !== "none" && t.mediaUrl && (
                    <div style={{ marginBottom: 20, borderRadius: 4, overflow: "hidden", height: 140 }}>
                      <img src={t.mediaUrl} alt="testimonial media" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 4, marginBottom: 16, alignItems: "center" }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ opacity: s <= ratingNum ? 1 : 0.2 }}><FilledStar dark /></span>)}
                    <span style={{ ...MONO, fontSize: 10, color: "rgba(255,255,255,0.4)", marginLeft: 8, letterSpacing: "0.05em" }}>{t.satisfactionLabel}</span>
                  </div>
                  <p style={{ ...INTER, fontSize: 16, lineHeight: "26px", color: "rgba(255,255,255,0.8)", fontStyle: "italic", marginBottom: 28 }}>"{t.quote}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: C.secondary, display: "flex", alignItems: "center", justifyContent: "center", ...LABEL_CAPS, color: C.white, fontSize: 12 }}>
                      {t.subjectCode?.slice(-3) ?? "GS"}
                    </div>
                    <div>
                      <div style={{ ...INTER, fontWeight: 700, color: C.white, fontSize: 14 }}>{t.subjectCode}</div>
                      {t.location && <div style={{ ...MONO, fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t.location}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <AdBannerStrip banners={sectionBanners} position="bottom" />
    </>
  );
}

// ─── Related Products section ─────────────────────────────────────────────────
function RelatedProductsSection({ products, banners, tag, headline, ctaText, ctaHref }: { products: any[]; banners: any[]; tag: string; headline: string; ctaText: string; ctaHref: string }) {
  const [ref, visible] = useReveal<HTMLDivElement>();
  const sectionBanners = banners.filter(b => b.placement === "related-products" || b.placement === "both");
  if (!products.length) return null;

  return (
    <>
      <AdBannerStrip banners={sectionBanners} position="top" />
      <section ref={ref} style={{ backgroundColor: C.surfaceContainerLow, padding: "clamp(48px,8vw,96px) clamp(20px,5vw,64px)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ ...LABEL_CAPS, color: C.secondary, display: "block", marginBottom: 16 }}>{tag}</span>
            <h2 style={{ ...PLAYFAIR, fontSize: "clamp(32px,4vw,48px)", color: C.primary, fontWeight: 600 }}>{headline}</h2>
            <div style={{ height: 1, width: 64, backgroundColor: C.secondary, margin: "24px auto 0" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 4).map(p => {
              const img = p.images?.[0]?.url || p.images?.[0]?.imageUrl || p.imageUrl;
              const price = p.salePrice || p.price;
              const isOnSale = p.salePrice && parseFloat(p.salePrice) < parseFloat(p.price);
              return (
                <Link key={p.id} href={`/giftseries/product/${p.slug}`}>
                  <div data-testid={`card-related-${p.id}`} style={{ cursor: "pointer", backgroundColor: C.white }} className="group">
                    <div style={{ overflow: "hidden", aspectRatio: "4/5" }}>
                      <img
                        src={img}
                        alt={p.title}
                        onError={e => { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb = "1"; t.src = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&auto=format&fit=crop"; } }}
                        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(60%)", transition: "filter 0.5s ease, transform 0.5s ease" }}
                        className="group-hover:grayscale-0 group-hover:scale-105"
                      />
                    </div>
                    <div style={{ padding: "20px 16px" }}>
                      <p style={{ ...MONO, fontSize: 10, color: C.outline, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{tag}</p>
                      <h3 style={{ ...PLAYFAIR, fontSize: 18, color: C.primary, fontWeight: 600, marginBottom: 10 }}>{p.title}</h3>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        {isOnSale && <span style={{ ...INTER, fontSize: 13, color: C.outline, textDecoration: "line-through" }}>{formatCurrency(p.price)}</span>}
                        <span style={{ ...PLAYFAIR, fontSize: 20, fontWeight: 400, color: C.primary }}>{formatCurrency(price)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link href={ctaHref}>
              <button
                data-testid="button-view-all-gift-services"
                style={{ ...LABEL_CAPS, backgroundColor: C.primary, color: C.white, border: "none", padding: "20px 48px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10 }}
                onMouseOver={e => { e.currentTarget.style.opacity = "0.8"; }}
                onMouseOut={e => { e.currentTarget.style.opacity = "1"; }}
              >
                {ctaText} <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </section>
      <AdBannerStrip banners={sectionBanners} position="bottom" />
    </>
  );
}

function DossierSkeleton() {
  return (
    <section style={{ backgroundColor: C.surfaceContainerLow, padding: "80px 0", borderBottom: `1px solid ${C.outlineVariant}33` }}>
      <div className="grid grid-cols-1 md:grid-cols-2 items-center">
        <div style={{ height: "80vh", minHeight: 500, backgroundColor: C.surfaceContainer }} />
        <div className="px-8 md:px-16 space-y-6">
          {[120, 280, 180, 140].map((w, i) => (
            <div key={i} style={{ height: i === 1 ? 40 : i === 2 ? 60 : 12, width: w, backgroundColor: C.surfaceContainerHigh, borderRadius: 2 }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function DogGiftSeries() {
  // Homepage nav/footer settings
  const { data: rawNav } = useQuery<{ settings: any }>({ queryKey: ["/api/settings/homepage"] });
  const navSettings = rawNav ? mergeHomepageSettings(rawNav.settings || {}) : DEFAULT_HOMEPAGE_SETTINGS;

  // Gift Services page content settings
  const { data: rawPage } = useQuery({ queryKey: ["/api/settings/gift-services-page"] });
  const page = deepMerge(PAGE_DEFAULTS, rawPage && typeof rawPage === "object" ? rawPage : {});

  // Products from Gift Services category
  const { data: productsData, isLoading: productsLoading } = useQuery<{ products: any[] }>({
    queryKey: ["/api/products", `categoryId=${GIFT_SERVICES_CATEGORY_ID}&limit=20`],
    queryFn: async () => {
      const r = await fetch(`/api/products?categoryId=${GIFT_SERVICES_CATEGORY_ID}&limit=20`);
      return r.json();
    },
  });
  const products = productsData?.products || [];

  // Testimonials
  const { data: rawTestimonials = [] } = useQuery<any[]>({ queryKey: ["/api/dog-gift-series-testimonials"] });

  // Ad banners
  const { data: allBanners = [] } = useQuery<any[]>({ queryKey: ["/api/dog-gift-series-ad-banners"] });
  const heroBanners = allBanners.filter(b => b.placement === "hero" || b.placement === "both");

  // Custom cursor
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + "px";
        cursorRef.current.style.top  = e.clientY + "px";
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // Hero parallax
  const heroImgRef = useRef<HTMLImageElement>(null);
  const [heroError, setHeroError] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      if (heroImgRef.current) heroImgRef.current.style.transform = `scale(1.05) translateY(${window.scrollY * 0.25}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroBg = page.hero.bgImageUrl ||
    (heroError
      ? "https://images.unsplash.com/photo-1534361960057-19f073a9dee3?w=1600&auto=format&fit=crop"
      : "https://lh3.googleusercontent.com/aida-public/AB6AXuCYsP8GnqxhFOxyNBXUmvJD-3jOrE5G7fmxHhwbLjQz8voaI1PpP4IqfXjZo5UzwYmfB47e4buBryvn3yBupaBXesMJB8lgZzNCC6ALki1Jqida_kyUAocar8W_J2OUpcoBl2UjXcMTWDJrvLFecuoDwuQ4xuCBhXe3PbuG0SFqxxW4mLAsVWbLjsa4ELcXfonCWL99eCjijZWf79fZNyVZflnIs6K-KU8hldrF2GgxZX5vMR9XtrjiZ-EDoXCRkAtM9x5wQoQydeOb");

  return (
    <div style={{ backgroundColor: C.surface, color: C.onSurface, overflowX: "hidden" }}>
      {/* Custom cursor */}
      <div
        ref={cursorRef}
        className="hidden md:block"
        style={{ position: "fixed", width: 20, height: 20, border: `1px solid ${C.secondaryFixed}`, borderRadius: "50%", pointerEvents: "none", zIndex: 9999, left: 0, top: 0, transform: "translate(-50%, -50%)", transition: "left 0.05s, top 0.05s" }}
      />

      <EditorialHeader nav={navSettings.nav} />

      {/* ─── Hero ─── */}
      <AdBannerStrip banners={heroBanners} position="top" />
      <section style={{ position: "relative", height: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 1 }} />
          <img
            ref={heroImgRef}
            src={heroBg}
            onError={() => setHeroError(true)}
            alt={page.hero.headline}
            loading="eager"
            fetchpriority="high"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.05)", transformOrigin: "center center" }}
          />
        </div>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 20px" }}>
          <span style={{ ...LABEL_CAPS, color: C.secondaryFixed, display: "block", marginBottom: 16 }}>
            {page.hero.tag}
          </span>
          <h1 style={{ ...PLAYFAIR, fontWeight: 700, color: C.white, fontSize: "clamp(48px, 7vw, 84px)", lineHeight: "1.1", textShadow: "0 4px 12px rgba(0,0,0,0.5)", maxWidth: 900, margin: "0 auto 32px" }}>
            {page.hero.headline}
          </h1>
          <div style={{ height: 1, width: 96, backgroundColor: C.secondaryFixed, margin: "0 auto 32px" }} />
          <p style={{ ...INTER, fontSize: 18, lineHeight: "28px", fontWeight: 300, color: "rgba(255,255,255,0.8)", maxWidth: 480, margin: "0 auto", fontStyle: "italic" }}>
            {page.hero.subtitle}
          </p>
          {/* Optional CTA buttons */}
          {(page.hero.showCta1 || page.hero.showCta2) && (
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
              {page.hero.showCta1 && (
                <Link href={page.hero.cta1Href}>
                  <button style={{ ...LABEL_CAPS, backgroundColor: C.secondary, color: C.white, border: "none", padding: "16px 32px", cursor: "pointer" }}>
                    {page.hero.cta1Text}
                  </button>
                </Link>
              )}
              {page.hero.showCta2 && (
                <Link href={page.hero.cta2Href}>
                  <button style={{ ...LABEL_CAPS, backgroundColor: "transparent", color: C.white, border: `1px solid rgba(255,255,255,0.5)`, padding: "16px 32px", cursor: "pointer" }}>
                    {page.hero.cta2Text}
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 2, color: C.white, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ ...LABEL_CAPS, fontSize: 10 }}>{page.hero.scrollCta}</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>
      </section>
      <AdBannerStrip banners={heroBanners} position="bottom" />

      {/* ─── Product Dossiers ─── */}
      {page.dossiers.visible && (
        <div>
          {productsLoading ? (
            <><DossierSkeleton /><DossierSkeleton /></>
          ) : products.length > 0 ? (
            products.map((p, i) => (
              <DossierSection key={p.id} product={p} index={i} allBanners={allBanners} sectionLabel={page.dossiers.sectionLabel} />
            ))
          ) : (
            <section style={{ backgroundColor: C.surfaceContainerLow, padding: "clamp(48px,8vw,96px) clamp(20px,5vw,64px)", textAlign: "center" }}>
              <div style={{ maxWidth: 480, margin: "0 auto" }}>
                <span style={{ ...LABEL_CAPS, color: C.secondary, display: "block", marginBottom: 16 }}>No Products Yet</span>
                <p style={{ ...INTER, color: C.onSurfaceVariant, fontSize: 16 }}>
                  Add products with the <strong>Gift Services</strong> category in the admin panel to populate this section.
                </p>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ─── Testimonials ─── */}
      {page.testimonials.visible && (
        <TestimonialsSection
          testimonials={rawTestimonials}
          banners={allBanners}
          tag={page.testimonials.tag}
          headline={page.testimonials.headline}
        />
      )}

      {/* ─── Related Products ─── */}
      {page.relatedProducts.visible && (
        <RelatedProductsSection
          products={products}
          banners={allBanners}
          tag={page.relatedProducts.tag}
          headline={page.relatedProducts.headline}
          ctaText={page.relatedProducts.ctaText}
          ctaHref={page.relatedProducts.ctaHref}
        />
      )}

      <EditorialFooter footer={navSettings.footer} />
    </div>
  );
}
