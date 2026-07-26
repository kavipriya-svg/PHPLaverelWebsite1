import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import {
  HomeEditorialHeader as EditorialHeader,
  HomeEditorialFooter as EditorialFooter,
} from "@/components/store/HomeEditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";
import { ArrowRight, SlidersHorizontal, Play, ShoppingCart } from "lucide-react";

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:              "#012d1d",
  secondary:            "#944923",
  white:                "#ffffff",
  surface:              "#f9faf6",
  surfaceContainer:     "#eeeeeb",
  surfaceContainerLow:  "#f3f4f0",
  surfaceContainerHigh: "#e8e8e5",
  surfaceContainerLowest:"#ffffff",
  outlineVariant:       "#c1c8c2",
  outline:              "#717973",
  onSurface:            "#1a1c1a",
  onSurfaceVariant:     "#414844",
  primaryContainer:     "#012d1d",
  secondaryContainer:   "#fe9e71",
  secondaryFixed:       "#ffdbcc",
  primaryFixed:         "#c0edd4",
  primaryFixedDim:      "#a5d0b8",
};

const PLAYFAIR: React.CSSProperties = { fontFamily: "Playfair Display, serif" };
const INTER: React.CSSProperties    = { fontFamily: "Inter, sans-serif" };
const MONO: React.CSSProperties     = { fontFamily: "'Courier New', Courier, monospace" };
const LABEL_CAPS: React.CSSProperties = {
  ...INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase",
};
const HARD_SHADOW = "40px 40px 0px 0px rgba(1, 45, 29, 0.15)";

// ─── Static fallback editorial content ───────────────────────────────────────
const DEFAULT_HERO_IMG = "https://lh3.googleusercontent.com/aida-public/AB6AXuCkZL5GN_QMWkxCmU1G9UeEGZcfXS4gd_xQnFb-u2U1UhgFOqTq6sGhlk0W8a2YiP_9n5W-6VCj-sBF3RJKQ-MQo5C5yC8HsZmJhwWuMPmjuNXaGKrWbvBJgI1hP-L9Zd3AomCiJYiItmFV8kFEP14MvFBbPi-3v0_1YuDqRb9p4PCDQ3xdq20L1bY-7Fce50rSNKjjd_K-KzFsHyR1Mky-P8QKrYe6j7TwuPdPHHGHEKnkxwJxNcT0jMtI_iOMwW_rP0lFlasb";

const FALLBACK_PRODUCTS = [
  { id: "APEX-TS-001", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4aCtkjWSxvyBKnAcgA3H2941kOkjgUSbVsY_C8Xnk6iWfvda414DeQJoc7gLQ_fIudHKBBtTu6XJC9YO9W-rl7AM-tDk7WZ8e8vBVNzgYDdtazRqtWbOHhqAYjUW2Zh98rozWzQUWzzcOh2XtrJ3FY6lQ48cLCQMDNoTKNqgEldeXm5P8dyPCZhgJ0wLE6KVCt292sLZ2ZeGbmkxFO6w-d76J2r6nXTF7gD3QTon5cHXF6oW4wKebEci3e4NJN9DYZfyPOi_HjJeI", name: "Apex Sync T-Shirt Set", price: "$840.00", tag: "CANINE + HUMAN DUAL SYSTEM", biometric: 92, thermal: 75 },
  { id: "LATT-PL-014", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeCDRtZ2u4qEfuWze3m1w_WzsnY2HroHWVS-BuQaZfN1v8zs9WxmySwuhtGzhNUfFz45bUxbVg_y8yLeBNGrS_y8aQpExhuAKs6W-biLstm5q04l-tISfrH02VnEBPA_i9EaMRv7xrsPMTrqO6rHphm_OYF9hOrFKPTxIo85LgFEytDQQl0aS-Upw5tE1G8blzYbYp3YwRxnsSRCPPwCL3ssqz9hopgd-r5tugVWzgQO51waAbri7NePn8Ow6zzzXb9fJIoeRyOBq4", name: "Thermal Lattice Polo", price: "$1,120.00", tag: "ADVANCED ENVIRONMENTAL SHIELD", biometric: 88, thermal: 98 },
  { id: "GRPH-TK-092", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlXVsJra3pdkpz1qhQF0Hsg58KRWBX8d-XgECBgfqpbPrKzyWCcOZG1bm7MwbF7pOoFPeMlnJ8lIlGAK_iAo0gNlASTa152XjvudpB4t1HiLfH-3d2hNkPQQOu6vyigaRS5lLxCgH5i2sXnPuUclCqin6oNjX05b7g_KsP8PuDPHfZWhxdKLWIRyZWTHg4DM9IQ-5C8YpKmAwjfSO0XNRsPp6AfN-aWrCK7AQuEAqMa8BFRTg6pRJIs9mNlPCboKlcvDrQAKh1_myT", name: "Graphene Urban Tank", price: "$650.00", tag: "TACTICAL CITY PROTECTION", biometric: 65, thermal: 82 },
  { id: "K9-SYN-SH-004", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkgJ93TAi4nqacsHYV6TQDlGtRJHIcsv0fw6x9W35hDyxoBYTnhv1BvZ02qge1bGBOuC5AD-k-YHD8VCzZUMLqHVOFPe-lE-OPi9MKTCk0v3KkZo_RIYk", name: "Synergy Field Shirt", price: "$920.00", tag: "REINFORCED EXTERIOR SHELL", biometric: 85, thermal: 90 },
  { id: "OB-NEX-DR-007", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFESqhEP2Zayq6cEZYferDV66JULFvqcOuuTO9sXUu-rkLwsDKTGv1FlLAFnkOah05OfZ5eKkAgN0JANMr7uGOL_jHyApihpOVBvg6ZebvPvMdz-sba5iP4wa1I6HY2tkB2USTueExGMpcWnr9CH_efH6Ak7k3WicCXLcgP9-7coHHF_PRR0C4s11LnlkL_stTtU-SGuokHqjVcFZXqFQ1QnqABtbUP1oZZgyNTF8w_LW9ws3Mjiv9CDT6H7D3fVdEI5ZByR0OKFtd", name: "Obsidian Nexus Dress", price: "$1,250.00", tag: "HIGH-ALTITUDE ENVIRONMENTAL ARMOR", biometric: 95, thermal: 85 },
  { id: "CRB-PLS-SK-012", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8AvznrObxilYdLKXzWG90TKIgn3d5h8e8mW_OtqImJFVdTT7M6vmHB7tBGRs-W7t0ckzXqpXqrXb7nBhbMx8nKn9fImvdRz2CMZF1h8sHJz_7_dRnFqAH9j_IqB_kL0V3JNXV-7MfYE2BUGjxjZ-VvUH4_mW8d0-xsK1E0Fvvp0pL8vSQ1E4Ql6FajSVGWz-1bJW1H3I5n9ZiCBVF2VjTN0W9DJl1Kv6zC53HsNe3hAaHLEo-q2-nFqe1AhfU6V_NJq0H", name: "Carbon Pulse Skirt", price: "$890.00", tag: "REACTIVE HAPTIC SYNCHRONIZATION", biometric: 88, thermal: 50 },
  { id: "CBLT-SHD-RM-003", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCBtaEQYQOCNiXA3X2nb6SQ2EyapYw4IL-Rk4BTL9v7SB0zK2HKFWFzSsYYr_ZyBTMXdpAQiwHMciH4oxoueTR7fKT5g6387191lFGpDUNyxYbBsgarZUVBH_Tl7wH7k7n_oSYn8qK2e1UMMsJurd41wWKUg-xFNp9j7AEONUoyj_8eg_4nWvaZyhs27Nawl_qrzwmkxi3ieZX3vUsQrZCX8a6aVqi0khXKPoKQtv1jHzrQS9TOUtHgNwZeWjlnc0NuAfitqUWiDvnj", name: "Cobalt Shield Romper", price: "$1,400.00", tag: "ARCTIC GRADE TACTICAL INSULATION", biometric: 92, thermal: 100 },
  { id: "NRL-BRDG-JS-001", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDztCyq5Qy0KuHK0i--Qtnh7QrVy-gKvx_3GZAhRtomMYSK0yb55M03d4_b2hIp6gg6PeKs43a9_Nl7LCmptwrjhiJAUAYtcLb-lUgeh5tLKF326tQCM__gZaufiXriJ_njcWXvwBWZ8AsI6fywtISKbA43K84bdAKjKnz49TdvwOaVH27nyUNs_PACJS6mfOJbbyBuosojC4-1vYhGCARfIMClCj2lQntc9atAp5LGUnHi98ihCtcDv-T8HGs9mwzjGhnaPky2sWqF", name: "Neural Bridge Jumpsuit", price: "$1,650.00", tag: "ULTIMATE SYNC PLATFORM", biometric: 100, thermal: 95 },
];

const FALLBACK_TESTIMONIALS = [
  { id: "f1", subjectCode: "COMMANDER ELIAS V.", satisfactionLabel: "5/5", quote: "Testing the Thermal Lattice Shell during a sub-zero coastal patrol. Syncing with my Malinois was instantaneous.", location: "REYKJAVÍK PERIPHERY", envData: "ENV: -8°C / 45% RH", mediaType: null, mediaUrl: null },
  { id: "f2", subjectCode: "SARAH J. KANE", satisfactionLabel: "5/5", quote: "The Urban Armor breathes unexpectedly well in smoggy, high-humidity corridors.", location: "L.A. INDUSTRIAL ZONE", envData: "ENV: 38°C / 88% RH", mediaType: null, mediaUrl: null },
  { id: "f3", subjectCode: "DR. MARCUS THOREN", satisfactionLabel: "5/5", quote: "Ascending at 4000m. The Apex set provided the necessary shield against biting winds.", location: "MONT BLANC SUMMIT LINE", envData: "ENV: -22°C / 15% RH", mediaType: null, mediaUrl: null },
];

const DEFAULT_SETTINGS = {
  hero: {
    collectionTag: "THE TWINNING COLLECTION // SERIES 02",
    headline: "BIOLOGICAL\nSYNCHRONIZATION",
    subtitle: "Precision-engineered twinning wear for you and your dog. Where human fashion meets veterinary textile science.",
    bgImageUrl: "",
    cta1Text: "Explore Collection",
    cta1Href: "#series02",
    cta2Text: "View Data Sheet",
    cta2Href: "#",
  },
  productSection: {
    visible: true,
    categorySlug: "dog-parent-clothing",
    productsPerGrid: 4,
  },
  molecularSection: {
    visible: true,
    label: "MOLECULAR PRECISION // DATA LOG 07",
    headline: "ENGINEERED FOR PERFECT SYNC",
    body: "Every fibre calibrated for dual-species compatibility. Our BioSync technology analyses the micro-climate between human and canine body heat to produce textiles that perform identically across species.",
    feature1Title: "Thermal Equilibrium",
    feature1Body: "Dual-layered carbon lattice distributes heat symmetrically across both specimens.",
    feature2Title: "Movement Sync",
    feature2Body: "4-directional stretch matrix adapts to bipedal and quadrupedal locomotion patterns.",
    feature3Title: "Chromatic Bonding",
    feature3Body: "Colourfast nano-dye process ensures identical hue rendering across both garments.",
    imageUrl: "",
  },
  fieldLogs: {
    visible: true,
    sectionLabel: "FIELD LOGS // SUBJECT FEEDBACK",
  },
  neuralBridge: {
    visible: true,
    label: "NEURAL BRIDGE // SERIES 03",
    headline: "THE BOND IS THE UNIFORM",
    body: "When two species share identical textile infrastructure, the psychological synchronisation is measurable. Neural Bridge Series 03 — the apex of the Twinning Collection.",
    ctaText: "Apply for Field Access",
    ctaHref: "#",
    imageUrl: "",
  },
};

function deepMerge(defaults: any, overrides: any): any {
  const result = { ...defaults };
  for (const key of Object.keys(overrides ?? {})) {
    if (typeof defaults[key] === "object" && !Array.isArray(defaults[key]) && overrides[key]) {
      result[key] = deepMerge(defaults[key], overrides[key]);
    } else if (overrides[key] !== undefined) {
      result[key] = overrides[key];
    }
  }
  return result;
}

function getYouTubeId(url: string): string | null {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]{11})/);
  return m ? m[1] : null;
}

// ─── Metric bar ───────────────────────────────────────────────────────────────
function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: C.onSurface }}>{label}</span>
      <div className="relative flex-shrink-0" style={{ width: 96, height: 2, backgroundColor: C.outlineVariant }}>
        <div className="absolute left-0 top-0 h-full" style={{ width: `${value}%`, backgroundColor: C.secondaryContainer }} />
      </div>
    </div>
  );
}

// ─── Ad banner strip ──────────────────────────────────────────────────────────
function AdBannerStrip({ banners, position }: { banners: any[]; position: "top" | "bottom" }) {
  const filtered = banners.filter(b => b.position === position);
  if (!filtered.length) return null;
  return (
    <>
      {filtered.map(b => {
        const ytId = b.mediaType === "video" ? getYouTubeId(b.mediaUrl) : null;
        return (
          <div key={b.id} className="relative w-full overflow-hidden" style={{ maxHeight: 320 }}>
            {ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=0&mute=1&loop=1&playlist=${ytId}`}
                className="w-full"
                style={{ height: 280 }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <div className="relative w-full" style={{ height: 200 }}>
                <img src={b.mediaUrl} alt={b.title || ""} className="w-full h-full object-cover" />
                {(b.title || b.subtitle || b.ctaText) && (
                  <div className="absolute inset-0 flex flex-col justify-center px-12" style={{ background: "linear-gradient(to right, rgba(1,45,29,0.75) 40%, transparent)" }}>
                    {b.title && <h3 className="text-white text-2xl font-bold mb-2" style={PLAYFAIR}>{b.title}</h3>}
                    {b.subtitle && <p className="text-white/80 text-sm mb-4">{b.subtitle}</p>}
                    {b.ctaText && (
                      <a href={b.ctaUrl || "#"}>
                        <button className="px-6 py-2 text-white text-xs" style={{ border: `1px solid white`, ...LABEL_CAPS }}>
                          {b.ctaText} →
                        </button>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── Editorial product card ───────────────────────────────────────────────────
function ProductCard({
  id, slug, img, name, price, tag, biometric, thermal, onAdd,
}: {
  id: string; slug?: string; img: string; name: string; price: string; tag: string;
  biometric: number; thermal: number; onAdd?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="flex flex-col group">
      <div
        className="relative overflow-visible mb-8"
        style={{
          aspectRatio: "4/5",
          backgroundColor: C.surfaceContainerLow,
          boxShadow: hovered ? HARD_SHADOW : "none",
          transform: hovered ? "translateY(-8px)" : "translateY(0)",
          transition: "transform 0.5s ease, box-shadow 0.5s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${img}')` }} />
        <div
          className="absolute top-4 left-4 px-3 py-1"
          style={{ backgroundColor: C.primary, color: C.white, ...MONO, fontSize: 10, letterSpacing: "0.1em" }}
        >
          ID: {id}
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="uppercase leading-tight" style={{ ...PLAYFAIR, fontSize: 20, fontWeight: 600, color: C.primary }}>{name}</h3>
          <span className="shrink-0" style={{ ...INTER, fontSize: 14, fontWeight: 600, color: C.secondary }}>{price}</span>
        </div>
        <p className="mb-4 tracking-widest" style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: C.onSurfaceVariant }}>{tag}</p>
        <div className="space-y-3 mb-6">
          <MetricBar label="BIOMETRIC SYNC" value={biometric} />
          <MetricBar label="THERMAL LEVEL" value={thermal} />
        </div>
        {/* Action buttons */}
        <div className="flex gap-3">
          {/* Add to Cart */}
          <button
            onClick={onAdd}
            data-testid={`btn-add-to-cart-${id}`}
            className="flex-1 flex justify-center items-center gap-2 px-4 py-4 transition-all duration-200"
            style={{ backgroundColor: C.primary, color: C.white, ...LABEL_CAPS, border: `1px solid ${C.primary}` }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#264e3c"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primary; }}
          >
            <ShoppingCart size={13} />
            <span>Add to Cart</span>
          </button>
          {/* View Specimen */}
          {slug ? (
            <Link href={`/twinning/product/${slug}`}>
              <button
                data-testid={`btn-view-specimen-${id}`}
                className="flex items-center justify-center gap-2 px-4 py-4 transition-all duration-200"
                style={{ border: `1px solid ${C.primary}`, color: C.primary, backgroundColor: "transparent", ...LABEL_CAPS }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primary; (e.currentTarget as HTMLButtonElement).style.color = C.white; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = C.primary; }}
              >
                <span>View Specimen</span>
                <ArrowRight size={13} />
              </button>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DogParentClothing() {
  const { toast } = useToast();

  const [specimenType, setSpecimenType] = useState("ALL GENOTYPES");
  const [syncLevel, setSyncLevel] = useState("LEVEL 01: THERMAL");
  const [environment, setEnvironment] = useState("ARCTIC GRADE");
  const [collageHover, setCollageHover] = useState(false);
  const [email, setEmail] = useState("");

  // ── Nav/footer settings ───────────────────────────────────────────────────
  const { data: rawSettings } = useQuery<any>({ queryKey: ["/api/settings/homepage"] });
  const navSettings = rawSettings ? mergeHomepageSettings(rawSettings.settings || {}) : DEFAULT_HOMEPAGE_SETTINGS;

  // ── Page settings from admin ──────────────────────────────────────────────
  const { data: pageSettingsRaw } = useQuery<any>({ queryKey: ["/api/settings/dog-parent-clothing-page"] });
  const S = pageSettingsRaw && Object.keys(pageSettingsRaw).length > 0
    ? deepMerge(DEFAULT_SETTINGS, pageSettingsRaw)
    : DEFAULT_SETTINGS;

  // ── Products from API ─────────────────────────────────────────────────────
  const categorySlug = S.productSection.categorySlug || "dog-parent-clothing";
  const { data: productsData } = useQuery<any>({
    queryKey: ["/api/products", { categorySlug }],
    queryFn: () => fetch(`/api/products?categorySlug=${encodeURIComponent(categorySlug)}&limit=16`).then(r => r.json()),
  });
  const apiProducts: any[] = productsData?.products || [];

  // ── Testimonials from admin ───────────────────────────────────────────────
  const { data: testimonialsData = [] } = useQuery<any[]>({
    queryKey: ["/api/dog-parent-clothing-testimonials"],
  });
  const testimonials = testimonialsData.length > 0 ? testimonialsData : FALLBACK_TESTIMONIALS;

  // ── Ad banners from admin ─────────────────────────────────────────────────
  const { data: adBannersData = [] } = useQuery<any[]>({
    queryKey: ["/api/dog-parent-clothing-ad-banners"],
  });
  const bannersFor = (placement: string) => adBannersData.filter(b => b.placement === placement || b.placement === "both");

  // ── Build product grids ───────────────────────────────────────────────────
  const perGrid = Math.max(1, S.productSection.productsPerGrid || 4);

  const buildGrid = (products: any[], fallbackStart: number) => {
    if (products.length > 0) {
      return products.map((p: any) => ({
        id: p.sku || String(p.id),
        slug: p.slug,
        img: p.images?.[0]?.url || FALLBACK_PRODUCTS[0].img,
        name: p.title,
        price: `₹${parseFloat(p.price).toFixed(2)}`,
        tag: p.shortDesc || "CANINE + HUMAN DUAL SYSTEM",
        biometric: 80,
        thermal: 80,
        productId: p.id,
      }));
    }
    return FALLBACK_PRODUCTS.slice(fallbackStart, fallbackStart + perGrid);
  };

  const allApiProducts = apiProducts;
  const grid1 = S.productSection.visible ? buildGrid(allApiProducts.slice(0, perGrid), 0) : [];
  const grid2 = S.productSection.visible ? buildGrid(allApiProducts.slice(perGrid, perGrid * 2), perGrid) : [];

  const totalCount = allApiProducts.length > 0 ? allApiProducts.length : FALLBACK_PRODUCTS.length;

  function handleAddToCart(product: any) {
    if (product.productId) {
      addToCart?.({ productId: product.productId, quantity: 1 });
    }
    toast({ title: `${product.name} added to cart` });
  }

  const selectStyle: React.CSSProperties = {
    background: "transparent", border: "none", padding: 0,
    ...INTER, fontSize: 14, fontWeight: 600, color: C.onSurface, cursor: "pointer", outline: "none",
  };

  const heroImg = S.hero.bgImageUrl || DEFAULT_HERO_IMG;
  const molecularImg = S.molecularSection.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCaPf5QPY87EewytkqmAZ2opXXpZQP2_Iz-owwWoUFxeAGSvN9OM-XPNGqVsImCDjAkouCInfrjgy0K0VT2OOWfdhCTmfkgJ9wMU3YZHMl1p7DAfGZCqexjUNcNd6zKpRcLOgq5VD8GG87B1SNk63Ki1cMMMT-wt8374ZWx4C0zJY63QSckTI2EYTyP4pUmbo8rXse5JRM8RK-anaPIO1D6CxrPMTI17084wdbM7iZFG6-s8SBhtSfAzrXCuSEfequ4-89RGsss3LIe";
  const neuralImg = S.neuralBridge.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDeJLNpYssyX0hfZ0sgQhoBnK_m_gTu4Qo2ItZBKil6pqbykDT35GXklutOcjulMed9wPMOKbSK44pr9ysO7Q3n6xvXUy91wBeLHXsxgjPEF4bZrXKwGi5bH1iXbdV2wG79YEh_BuVnTAQKeTwR0KyqlfA_IEp5zj2XimTcjNVrLXrHgpkg64Os1x_xmou0rvYo4mqRDuAtonCZ5DrfNb3tyrKxK_KwfbBqKKXS0ptlFuxlAc2N6YJEFPJjNPjwEgOZ1X_n5ZdIJKgk";

  return (
    <div style={{ backgroundColor: C.surface, color: C.onSurface, overflowX: "hidden" }}>
      <EditorialHeader nav={navSettings.nav} />

      {/* ══ 1. HERO ════════════════════════════════════════════════════════════ */}
      <section className="relative w-full flex items-center overflow-hidden" style={{ height: "90vh", paddingLeft: 64, paddingRight: 64, paddingTop: 96 }}>
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${heroImg}')`, filter: "grayscale(100%) brightness(0.55)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(1,45,29,0.7) 40%, transparent)" }} />
        </div>
        <div className="relative z-10 max-w-4xl">
          <p style={{ ...MONO, fontSize: 11, letterSpacing: "0.3em", color: C.primaryFixed, marginBottom: 16 }}>
            {S.hero.collectionTag}
          </p>
          <h1 className="uppercase leading-none mb-6" style={{ ...PLAYFAIR, fontSize: "clamp(56px, 8vw, 84px)", fontWeight: 700, color: C.white, letterSpacing: "-0.02em" }}>
            {S.hero.headline.split("\\n").map((line: string, i: number) => <span key={i}>{line}{i < S.hero.headline.split("\\n").length - 1 && <br />}</span>)}
          </h1>
          <p style={{ ...INTER, fontSize: 18, fontWeight: 300, lineHeight: "28px", color: "rgba(255,255,255,0.8)", maxWidth: 520, marginBottom: 32 }}>
            {S.hero.subtitle}
          </p>
          <div className="flex gap-6 flex-wrap">
            <a href={S.hero.cta1Href || "#series02"}>
              <button
                className="transition-colors duration-200 px-8 py-4"
                style={{ backgroundColor: C.white, color: C.primary, ...LABEL_CAPS }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.primaryFixed)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.white)}
              >
                {S.hero.cta1Text}
              </button>
            </a>
            <a href={S.hero.cta2Href || "#"}>
              <button
                className="transition-colors duration-200 px-8 py-4"
                style={{ border: `1px solid ${C.white}`, color: C.white, ...LABEL_CAPS, background: "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {S.hero.cta2Text}
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Ad banners — hero bottom */}
      <AdBannerStrip banners={bannersFor("hero")} position="bottom" />

      {/* ══ 2. FILTER BAR ═══════════════════════════════════════════════════════ */}
      <section
        className="sticky z-40 flex flex-wrap items-center gap-6"
        style={{ top: 72, backgroundColor: C.surfaceContainer, borderBottom: `1px solid ${C.outlineVariant}`, padding: "32px 64px" }}
      >
        <div className="flex items-center gap-2 pr-8" style={{ borderRight: `1px solid ${C.outlineVariant}` }}>
          <SlidersHorizontal size={18} style={{ color: C.primary }} />
          <span style={{ ...LABEL_CAPS, color: C.onSurface }}>FILTERS</span>
        </div>
        <div className="flex flex-1 gap-8 overflow-x-auto py-1 flex-wrap">
          <div className="group cursor-pointer">
            <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: C.onSurfaceVariant, marginBottom: 4 }}>SPECIMEN TYPE</p>
            <select value={specimenType} onChange={e => setSpecimenType(e.target.value)} style={selectStyle} data-testid="select-specimen-type">
              <option>ALL GENOTYPES</option>
              <option>WORKING GROUP</option>
              <option>SPORTING GROUP</option>
            </select>
          </div>
          <div className="cursor-pointer">
            <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: C.onSurfaceVariant, marginBottom: 4 }}>SYNC LEVEL</p>
            <select value={syncLevel} onChange={e => setSyncLevel(e.target.value)} style={selectStyle} data-testid="select-sync-level">
              <option>LEVEL 01: THERMAL</option>
              <option>LEVEL 02: BIOMETRIC</option>
              <option>LEVEL 03: FULL NEURAL</option>
            </select>
          </div>
          <div className="cursor-pointer">
            <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: C.onSurfaceVariant, marginBottom: 4 }}>ENVIRONMENT SHIELD</p>
            <select value={environment} onChange={e => setEnvironment(e.target.value)} style={selectStyle} data-testid="select-environment">
              <option>ARCTIC GRADE</option>
              <option>URBAN ARMOR</option>
              <option>AMPHIBIOUS</option>
            </select>
          </div>
        </div>
        <span style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", color: C.onSurfaceVariant }}>
          SHOWING {totalCount} SETS
        </span>
      </section>

      {/* ══ 3. SERIES 02 PRODUCT GRID ═══════════════════════════════════════════ */}
      {S.productSection.visible && grid1.length > 0 && (
        <>
          <AdBannerStrip banners={bannersFor("products-1")} position="top" />
          <section id="series02" style={{ padding: "80px 64px", backgroundColor: C.surface }}>
            <div
              className="flex flex-col md:flex-row justify-between items-baseline flex-wrap gap-4"
              style={{ borderBottom: `1px solid ${C.outlineVariant}`, paddingBottom: 24, marginBottom: 48 }}
            >
              <h2 className="uppercase" style={{ ...PLAYFAIR, fontSize: 32, fontWeight: 400, color: C.primary }}>
                SERIES 02 // TWINNING COLLECTION
              </h2>
              <p style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", color: C.onSurfaceVariant }}>
                DUAL-SPECIES TEXTILE SYSTEM
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {grid1.map((p, i) => (
                <ProductCard key={p.id || i} id={p.id} slug={p.slug} img={p.img} name={p.name} price={p.price} tag={p.tag} biometric={p.biometric} thermal={p.thermal} onAdd={() => handleAddToCart(p)} />
              ))}
            </div>
          </section>
          <AdBannerStrip banners={bannersFor("products-1")} position="bottom" />
        </>
      )}

      {/* ══ 4. MOLECULAR PRECISION ══════════════════════════════════════════════ */}
      {S.molecularSection.visible && (
        <>
          <AdBannerStrip banners={bannersFor("molecular")} position="top" />
          <section style={{ padding: "80px 0", backgroundColor: C.surfaceContainerLowest, overflow: "hidden" }}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center" style={{ padding: "0 64px" }}>
              <div className="lg:col-span-5 relative z-10">
                <p style={{ ...LABEL_CAPS, color: C.secondary, marginBottom: 24 }}>{S.molecularSection.label}</p>
                <h2 className="leading-tight" style={{ ...PLAYFAIR, fontSize: 48, fontWeight: 600, color: C.primary, marginBottom: 32 }}>
                  {S.molecularSection.headline}
                </h2>
                <p style={{ ...INTER, fontSize: 18, fontWeight: 300, lineHeight: "28px", color: C.onSurfaceVariant, marginBottom: 40 }}>
                  {S.molecularSection.body}
                </p>
                <ul className="space-y-6">
                  {[
                    { num: "01", title: S.molecularSection.feature1Title, desc: S.molecularSection.feature1Body },
                    { num: "02", title: S.molecularSection.feature2Title, desc: S.molecularSection.feature2Body },
                    { num: "03", title: S.molecularSection.feature3Title, desc: S.molecularSection.feature3Body },
                  ].map(item => (
                    <li key={item.num} className="flex items-start gap-4">
                      <span style={{ ...LABEL_CAPS, color: C.primary, border: `1px solid ${C.primary}`, padding: "8px", flexShrink: 0 }}>
                        {item.num}
                      </span>
                      <div>
                        <h4 className="uppercase" style={{ ...INTER, fontSize: 14, fontWeight: 600, color: C.primary, marginBottom: 4 }}>{item.title}</h4>
                        <p style={{ fontSize: 14, color: C.onSurfaceVariant }}>{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="lg:col-span-7 mt-12 lg:mt-0 relative cursor-pointer"
                onMouseEnter={() => setCollageHover(true)}
                onMouseLeave={() => setCollageHover(false)}
              >
                <div className="absolute top-0 right-0 w-full h-full -z-10" style={{ border: `1px solid ${C.outlineVariant}`, borderBottom: "none", borderLeft: "none", transform: "translate(48px, -48px)" }} />
                <div className="relative" style={{ aspectRatio: "16/9" }}>
                  <div className="w-full h-full bg-cover bg-center absolute inset-0" style={{ backgroundImage: `url('${molecularImg}')`, filter: "grayscale(100%) contrast(1.25)" }} />
                  <div className="w-full h-full bg-cover bg-center absolute inset-0" style={{ backgroundImage: `url('${molecularImg}')`, opacity: collageHover ? 1 : 0, transition: "opacity 0.5s ease-in-out" }} />
                </div>
              </div>
            </div>
          </section>
          <AdBannerStrip banners={bannersFor("molecular")} position="bottom" />
        </>
      )}

      {/* ══ 5. FIELD LOGS (TESTIMONIALS) ════════════════════════════════════════ */}
      {S.fieldLogs.visible && (
        <>
          <AdBannerStrip banners={bannersFor("field-logs")} position="top" />
          <section style={{ padding: "80px 64px", backgroundColor: C.surface }}>
            <div
              className="flex flex-col md:flex-row justify-between items-baseline flex-wrap gap-4"
              style={{ borderBottom: `1px solid ${C.outlineVariant}`, paddingBottom: 24, marginBottom: 32 }}
            >
              <h2 className="uppercase" style={{ ...PLAYFAIR, fontSize: 32, fontWeight: 400, color: C.primary }}>
                Synchronization Field Logs
              </h2>
              <p style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", color: C.onSurfaceVariant }}>
                {S.fieldLogs.sectionLabel}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((log: any, i: number) => {
                const accentColor = i % 2 === 0 ? C.primary : C.secondary;
                const ytId = log.mediaType === "youtube" ? getYouTubeId(log.mediaUrl || "") : null;
                return (
                  <div
                    key={log.id}
                    className="transition-colors duration-200 cursor-default"
                    style={{ backgroundColor: C.surfaceContainer, borderLeft: `4px solid ${accentColor}` }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.surfaceContainerHigh)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.surfaceContainer)}
                  >
                    {/* Media */}
                    {log.mediaType && log.mediaType !== "none" && log.mediaUrl && (
                      <div className="w-full overflow-hidden" style={{ height: 180 }}>
                        {ytId ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}?mute=1`}
                            className="w-full h-full"
                            allow="encrypted-media"
                            allowFullScreen
                          />
                        ) : (
                          <img src={log.mediaUrl} alt="testimonial" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                    <div className="p-8">
                      <div className="flex justify-between mb-6 flex-wrap gap-2">
                        <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", color: C.onSurfaceVariant, lineHeight: "18px" }}>
                          {log.location && <>LOC: {log.location}<br /></>}
                          {log.envData && log.envData}
                        </div>
                        <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", color: C.secondary }}>
                          SAT: {log.satisfactionLabel}
                        </span>
                      </div>
                      <p className="italic mb-6" style={{ ...INTER, fontSize: 16, lineHeight: "24px", color: C.primary }}>
                        "{log.quote}"
                      </p>
                      <div className="flex items-center gap-4">
                        <div style={{ width: 40, height: 40, backgroundColor: C.primaryContainer, flexShrink: 0 }} />
                        <div>
                          <p style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", color: C.primary, fontWeight: 700 }}>
                            {log.subjectCode}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <AdBannerStrip banners={bannersFor("field-logs")} position="bottom" />
        </>
      )}

      {/* ══ 6. NEURAL BRIDGE HIGHLIGHT ══════════════════════════════════════════ */}
      {S.neuralBridge.visible && (
        <>
          <AdBannerStrip banners={bannersFor("neural-bridge")} position="top" />
          <section style={{ padding: "80px 0", backgroundColor: C.primary, color: C.white }}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center" style={{ padding: "0 64px" }}>
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div
                  className="w-full bg-cover bg-center"
                  style={{ aspectRatio: "1/1", backgroundImage: `url('${neuralImg}')`, border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div className="lg:col-span-6 order-1 lg:order-2 mb-12 lg:mb-0">
                <p style={{ ...MONO, fontSize: 11, letterSpacing: "0.25em", color: C.primaryFixed, marginBottom: 16 }}>{S.neuralBridge.label}</p>
                <h2 className="uppercase leading-tight mb-8" style={{ ...PLAYFAIR, fontSize: 48, fontWeight: 600, color: C.white }}>
                  {S.neuralBridge.headline}
                </h2>
                <p style={{ ...INTER, fontSize: 18, fontWeight: 300, lineHeight: "28px", color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
                  {S.neuralBridge.body}
                </p>
                <a href={S.neuralBridge.ctaHref || "#"}>
                  <button
                    className="px-10 py-5 transition-colors duration-200"
                    style={{ backgroundColor: C.secondaryContainer, color: "#77330e", ...LABEL_CAPS }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.secondaryFixed)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.secondaryContainer)}
                    data-testid="btn-field-access"
                  >
                    {S.neuralBridge.ctaText}
                  </button>
                </a>
              </div>
            </div>
          </section>
          <AdBannerStrip banners={bannersFor("neural-bridge")} position="bottom" />
        </>
      )}

      {/* ══ 7. SERIES 03 PRODUCT GRID ═══════════════════════════════════════════ */}
      {S.productSection.visible && grid2.length > 0 && (
        <>
          <AdBannerStrip banners={bannersFor("products-2")} position="top" />
          <section id="series03" style={{ padding: "80px 64px", backgroundColor: C.surface }}>
            <div
              className="flex flex-col md:flex-row justify-between items-baseline flex-wrap gap-4"
              style={{ borderBottom: `1px solid ${C.outlineVariant}`, paddingBottom: 24, marginBottom: 48 }}
            >
              <h2 className="uppercase" style={{ ...PLAYFAIR, fontSize: 32, fontWeight: 400, color: C.primary }}>
                SERIES 03 // ARCHIVE EXPANSION
              </h2>
              <p style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", color: C.onSurfaceVariant }}>
                NEW DEPLOYMENT // TWINNING SETS
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {grid2.map((p, i) => (
                <ProductCard key={p.id || i} id={p.id} slug={p.slug} img={p.img} name={p.name} price={p.price} tag={p.tag} biometric={p.biometric} thermal={p.thermal} onAdd={() => handleAddToCart(p)} />
              ))}
            </div>
          </section>
          <AdBannerStrip banners={bannersFor("products-2")} position="bottom" />
        </>
      )}

      {/* ══ 8. EDITORIAL FOOTER ═════════════════════════════════════════════════ */}
      <EditorialFooter footer={navSettings.footer} email={email} onEmailChange={setEmail} />
    </div>
  );
}
