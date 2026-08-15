import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { HomeEditorialHeader as EditorialHeader, HomeEditorialFooter as EditorialFooter } from "@/components/store/HomeEditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:            "#012d1d",
  secondary:          "#944923",
  white:              "#ffffff",
  surface:            "#f9faf6",
  surfaceContainer:   "#eeeeeb",
  surfaceContainerLow:"#f3f4f0",
  outlineVariant:     "#c1c8c2",
  outline:            "#717973",
  onSurface:          "#1a1c1a",
  onSurfaceVariant:   "#414844",
  mint:               "#a5d0b8",
  primaryFixed:       "#c0edd4",
  secondaryContainer: "#fe9e71",
};

const PLAYFAIR: React.CSSProperties = { fontFamily: "Playfair Display, serif" };
const INTER: React.CSSProperties    = { fontFamily: "Inter, sans-serif" };
const MONO: React.CSSProperties     = { fontFamily: "'Courier New', Courier, monospace" };
const LABEL_CAPS: React.CSSProperties = {
  ...INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase",
};

// ─── Fallback editorial images ────────────────────────────────────────────────
const FALLBACK_IMGS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAjTqqlFE6XXYe93rUfuNPSUFmxsLRUMoNC-w75YXl31rFLrWUnc2GwjNbvbuwv7su89OEvkj5z7_YCxxKJNa4qe9qnXOtERMo00cPV-fkdRyhb_e-vhCxlsEagGsit87CJWacm6VYfwfsCkVO_SH5IjAlpPuUrMpfEHmVG10fFrFAhb_nzcTXi6SY2FJon_CFM2gVjyPYSNcYX444pPw1Q1VpCD1E82Vokvphz97ByfUCmkF9er8lyr8cUJ__s8i3xTLInsU5wBomg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCRjJj_zey7VwoyMm9YHeGKOJ-GU06jliagpd-Es4qTJgFbrSeEjQqeK2Xe6YDJo-p6ZWaQM3K1fnFrMiIFkqd21BtnIUT6eXFtuNuqwT6dUkaAu22-YtzPgy7gvDejzxhumISLFku-bKk4oeUAFGFi0GAZMBvJa4jpAF6ZDC8_VfwtjPNbvYlOv-WzPYO_iRCj7A33V-JoRRmX8d40RGbS-JEwKwTBdoJhlggDo0rjHnaXc2guERvyN-zHfeI3YLJt_S4-1kt2HHt4",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDsnwVlecUS2AS25pcFSrMJAeBE4GQQ-vQ7I9oNl7RRIl-QO8qsHM__qk1JT_tk8LVAvRXQGF4JtLdB6sypALn0FqLD4NTuY-B95xAP7UgY__OvqlyZZpGp_zYXcNyYFMJGn-PxPRVHevDmW_T9a-L61FLmTjUdMHREvugWnqHHLLvdigRMKUqVJ0KPBl-Jkwfj93pIHPxJb1HQf9V3oXBxxPHlJrUKbl5W04IUCwsIT5li6-r10p27Ja",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDicc9eXPgk9sKE-EHebcr6on2P2KN0sICV3PRGdIhT2LNnzDqjKQ2SXjtuXZ_TGFW-sKaEUvtGCpv6Uw0BRoLVc0iHQKDa_xBkk-QE76r9FFqSg6zUGJCkOracdZlTie32mMx1AjCxmatOyTKZRNGDb48ZKEhAEI1iL-VsJaPaQtKz_gOxRzTj9NtGhZRZfKI05pUH0L60nyQ2FPyEzwaH2Tbva76tTJeOut00Re6lE0qtUH452Y6kjvC4TrTacin-bDSH8iYD8Zve",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBYERvfz63EpyQx0nXzUAXb_ZnPM4g9MQgMA6rfpt3oIaHVXNp20LXS3RSfsQt8It6czGJBPlnKXMCA9M4DPMItU41h8LpJHkcB1gi7E4MQsfUerOEfZ4Y36rgqDnDMTS4QKSTvLjZ6HQsBHWC52AjzxIrHLUfLVAv4HW7XDJyPocqqa4vSmi37vwK588WDnFlEWN6bXUIzzCLBIYWnaXSHw9CUyf4IZ7z9RzruDjjyKFBoipVGijIynh4rKUuNCqtEOUOjvlrX_TI-",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBN7uCAOsNiB0pY-iOj-IM-DCAoGL6W_cWItjC0c0Y1VYhaLlxUY2aVybtcpRYePT6j-8qzCzILnXIqHJZ1fjqxRx-_PyuovJGnEID-Azp9W7E4dlpXYz_RzrfywYK4UkE_SodLdxnSVoybK4g7DiY1ChdjBNtl_i6rXwWnBQQvcNkAWQAkz5-l32YF-r5Eaid2yDgl00wfS2BQNNTCuD_y9UR33DCsC6MTQK9ScUybyKAUs_61ucCAGem83VIsV9TkunSXXfBfT_gI",
];

// ─── Admin settings defaults ───────────────────────────────────────────────────
const SETTINGS_DEFAULTS = {
  hero: {
    collectionTag: "THE TWINNING COLLECTION // SERIES 02",
    headline: "CLINICAL SYNC:\nSERIES 02",
    subtitle: "Biological precision engineered for the modern urban environment. An intersection of high-fashion and veterinary-grade textile science.",
    bgImageUrl: FALLBACK_IMGS[0],
    cta1Text: "Explore Dossier",
    cta1Href: "#collection",
    cta2Text: "Technical Specs",
    cta2Href: "#",
  },
  productSection: {
    visible: true,
    categorySlug: "clothing",
    productsPerGrid: 3,
  },
  bioAdvantage: {
    visible: true,
    label: "BIOLOGICAL ADVANTAGE // DATA LOG 04",
    headline: "GRAPHENE-INFUSED HEAT DISTRIBUTION",
    body: "Traditional canine textiles fail at regulating micro-climates. Our patented Graphene-Sync technology utilises hexagonal carbon lattices to redistribute excess heat from the core to the extremities, maintaining a clinical 38.5°C homeostasis even in sub-zero urban environments.",
    stat1Value: "22%",
    stat1Label: "CORE STABILITY INCREASE",
    stat2Value: "0.4mm",
    stat2Label: "MATERIAL THICKNESS",
    stat3Value: "38.5°C",
    stat3Label: "TARGET HOMEOSTASIS",
    labQuote: '"The specimen showed no signs of thermal stress during the 60-minute exposure to wind chill factor -12. Textile integrity remains 100% after modular attachment cycles."',
    labRef: "REF: VET-TECH-S2",
  },
  testimonials: {
    visible: true,
    sectionLabel: "TESTIMONIAL ARCHIVE // SUBJECT FEEDBACK",
  },
};

function deepMerge(base: any, overrides: any): any {
  if (!overrides) return base;
  const result = { ...base };
  for (const key in overrides) {
    if (overrides[key] !== null && typeof overrides[key] === "object" && !Array.isArray(overrides[key]) && typeof base[key] === "object") {
      result[key] = deepMerge(base[key], overrides[key]);
    } else if (overrides[key] !== undefined) {
      result[key] = overrides[key];
    }
  }
  return result;
}

// ─── Technical spec rotation ──────────────────────────────────────────────────
const TECH = [
  { thermal: "LEVEL 4", shield: "WP/3000",     durability: "ELITE",    biometric: "SYNC"    },
  { thermal: "LEVEL 2", shield: "BR/5000",     durability: "MODULAR",  biometric: "PASSIVE" },
  { thermal: "LEVEL 5", shield: "STORM-PROOF", durability: "MIL-SPEC", biometric: "ACTIVE"  },
  { thermal: "LEVEL 1", shield: "HYBRID",      durability: "CARBON",   biometric: "SYNC"    },
  { thermal: "LEVEL 3", shield: "WIND",        durability: "MODULAR",  biometric: "PASSIVE" },
  { thermal: "LEVEL 5", shield: "POLAR",       durability: "RIPSTOP",  biometric: "SYNC"    },
];
const SPECIMEN_LETTERS = ["A", "B", "C", "S", "K", "P", "G", "N", "X"];

function specimenCode(idx: number) {
  return `SPECIMEN ${100 + idx * 103 + 4}-${SPECIMEN_LETTERS[idx % SPECIMEN_LETTERS.length]}`;
}

function fmt(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

interface EditorialProduct {
  id: string | number;
  slug?: string;
  name: string;
  price: number;
  img: string;
  specimen: string;
  specs: typeof TECH[0];
}

function mapProduct(p: any, idx: number): EditorialProduct {
  const imgs = p.images ?? [];
  const img = imgs.find((i: any) => i.isPrimary)?.imageUrl ?? imgs[0]?.imageUrl ?? FALLBACK_IMGS[idx % FALLBACK_IMGS.length];
  return {
    id: p.id,
    slug: p.slug,
    name: p.title ?? p.name ?? "Archive Collection Piece",
    price: Number(p.salePrice || p.price) * 100,
    img,
    specimen: specimenCode(idx),
    specs: TECH[idx % TECH.length],
  };
}

// ─── Ad banner helper ─────────────────────────────────────────────────────────
function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function AdBannerSlot({ banners, placement, position }: { banners: any[]; placement: string; position: "top" | "bottom" }) {
  const matching = banners.filter(b => b.isActive && (b.placement === placement || b.placement === "both") && b.position === position);
  if (matching.length === 0) return null;
  return (
    <div className="w-full" style={{ backgroundColor: C.surfaceContainerLow }}>
      {matching.map((b: any) => {
        const ytId = b.mediaType === "youtube" ? getYouTubeId(b.mediaUrl) : null;
        return (
          <div key={b.id} className="relative w-full overflow-hidden" style={{ maxHeight: 400 }}>
            {ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=0&mute=1&loop=1`}
                className="w-full"
                style={{ height: 300, border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img src={b.mediaUrl} alt={b.title ?? "ad banner"} className="w-full object-cover" style={{ maxHeight: 300 }} />
            )}
            {(b.title || b.ctaText) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: "rgba(1,45,29,0.5)" }}>
                {b.title && <p style={{ ...PLAYFAIR, fontSize: 32, color: C.white, textAlign: "center" }}>{b.title}</p>}
                {b.subtitle && <p style={{ ...INTER, fontSize: 16, color: C.mint, textAlign: "center" }}>{b.subtitle}</p>}
                {b.ctaText && b.ctaUrl && (
                  <a href={b.ctaUrl}>
                    <button style={{ ...LABEL_CAPS, padding: "12px 32px", backgroundColor: C.primaryFixed, color: C.primary, letterSpacing: "0.2em" }}>
                      {b.ctaText}
                    </button>
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart }: { product: EditorialProduct; onAddToCart: () => void }) {
  const [, navigate] = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleViewSpecimen = () => {
    if (product.slug) navigate(`/clothing/product/${product.slug}`);
  };

  return (
    <div className="relative group" data-testid={`product-card-${product.id}`}>
      <div
        ref={cardRef}
        className="aspect-[4/5] overflow-hidden mb-6 cursor-pointer"
        style={{
          backgroundColor: C.surfaceContainer,
          boxShadow: "40px 40px 0px 0px rgba(1, 45, 29, 0.15)",
          transform: "translate(0px, 0px)",
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
        }}
        onMouseEnter={() => { if (cardRef.current) { cardRef.current.style.boxShadow = "10px 10px 0px 0px rgba(1, 45, 29, 0.4)"; cardRef.current.style.transform = "translate(10px, 10px)"; } }}
        onMouseLeave={() => { if (cardRef.current) { cardRef.current.style.boxShadow = "40px 40px 0px 0px rgba(1, 45, 29, 0.15)"; cardRef.current.style.transform = "translate(0px, 0px)"; } }}
        onClick={handleViewSpecimen}
      >
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1)" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        />
      </div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p style={{ ...MONO, ...LABEL_CAPS, color: C.secondary, fontSize: 10, marginBottom: 4 }}>{product.specimen}</p>
          <h3
            style={{ ...PLAYFAIR, fontSize: 28, lineHeight: "36px", fontWeight: 400, color: C.onSurface, cursor: product.slug ? "pointer" : "default" }}
            onClick={handleViewSpecimen}
          >
            {product.name}
          </h3>
        </div>
        <p style={{ ...INTER, fontSize: 16, fontWeight: 700, color: C.primary, whiteSpace: "nowrap", paddingTop: 4 }}>
          {fmt(product.price)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6" style={{ borderTop: `1px solid ${C.outlineVariant}`, paddingTop: 16 }}>
        <div style={{ ...MONO, fontSize: 10, color: C.onSurfaceVariant }}>
          <p>THERMAL: {product.specs.thermal}</p>
          <p>SHIELD: {product.specs.shield}</p>
        </div>
        <div style={{ ...MONO, fontSize: 10, color: C.onSurfaceVariant, textAlign: "right" }}>
          <p>DURABILITY: {product.specs.durability}</p>
          <p>BIOMETRIC: {product.specs.biometric}</p>
        </div>
      </div>
      {/* Two action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className="py-4 transition-colors duration-300"
          style={{ backgroundColor: C.primary, color: C.white, ...LABEL_CAPS, letterSpacing: "0.15em" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#014026")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.primary)}
          onClick={onAddToCart}
          data-testid={`btn-add-to-cart-${product.id}`}
        >
          Add to Cart
        </button>
        <button
          className="py-4 transition-all duration-300"
          style={{ border: `1px solid ${C.primary}`, color: C.primary, backgroundColor: "transparent", ...LABEL_CAPS, letterSpacing: "0.15em" }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.backgroundColor = C.primary; b.style.color = C.white; }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.backgroundColor = "transparent"; b.style.color = C.primary; }}
          onClick={handleViewSpecimen}
          data-testid={`btn-view-specimen-${product.id}`}
        >
          View Specimen
        </button>
      </div>
    </div>
  );
}

// ─── Clothing filter constants ────────────────────────────────────────────────
const CLOTHING_SIZES     = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const CLOTHING_MATERIALS = ["Cotton", "Polyester", "Linen", "Denim", "Fleece", "Wool", "Silk"];

// ─── Filter dropdown ──────────────────────────────────────────────────────────
type FilterOption = { label: string; value: string };
function FilterDropdown({ label, options, value, onChange }: {
  label: string; options: FilterOption[]; value: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value) ?? options[0];
  return (
    <div className="relative" style={{ cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
      <span style={{ ...LABEL_CAPS, fontSize: 9, color: C.outline, display: "block", marginBottom: 4 }}>{label}</span>
      <div className="flex items-center gap-2">
        <span style={{ ...INTER, fontSize: 14, fontWeight: 600, color: C.onSurface }}>{current.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: C.onSurface, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {open && (
        <div className="absolute top-full left-0 z-50 min-w-[180px] mt-2"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.outlineVariant}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
          onClick={e => e.stopPropagation()}>
          {options.map(opt => (
            <div key={opt.value}
              className="px-4 py-3 cursor-pointer"
              style={{ ...LABEL_CAPS, fontSize: 10, color: value === opt.value ? C.primary : C.onSurfaceVariant, backgroundColor: value === opt.value ? C.primaryFixed : "transparent" }}
              onMouseEnter={e => { if (value !== opt.value) (e.currentTarget as HTMLDivElement).style.backgroundColor = C.surfaceContainer; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = value === opt.value ? C.primaryFixed : "transparent"; }}
              onClick={() => { onChange(opt.value); setOpen(false); }}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DogClothing() {
  const { toast } = useToast();
  const { addToCart } = useStore();
  const [email, setEmail] = useState("");
  const [activeChildSlug, setActiveChildSlug] = useState<string>(
    () => new URLSearchParams(window.location.search).get("category") ?? ""
  );
  const [activeSize, setActiveSize] = useState("");
  const [activeMaterial, setActiveMaterial] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);

  // ── Nav/footer settings ──────────────────────────────────────────────────
  const { data: rawSettings } = useQuery<{ settings: any }>({ queryKey: ["/api/settings/homepage"] });
  const navSettings = rawSettings ? mergeHomepageSettings(rawSettings.settings || {}) : DEFAULT_HOMEPAGE_SETTINGS;

  // ── Dog Clothing page settings ───────────────────────────────────────────
  const { data: pageSettingsData } = useQuery<{ settings: any }>({
    queryKey: ["/api/settings/dog-clothing-page"],
  });
  const pageSettings = deepMerge(SETTINGS_DEFAULTS, pageSettingsData?.settings ?? {});

  // ── Fetch testimonials ───────────────────────────────────────────────────
  const { data: testimonials = [] } = useQuery<any[]>({
    queryKey: ["/api/dog-clothing-testimonials"],
  });

  // ── Fetch ad banners ─────────────────────────────────────────────────────
  const { data: adBanners = [] } = useQuery<any[]>({
    queryKey: ["/api/dog-clothing-ad-banners"],
  });

  // ── Fetch child categories for the filter row ────────────────────────────
  const { data: allCatsData } = useQuery<{ categories: any[] }>({
    queryKey: ["/api/categories"],
  });
  const flatCats = useMemo(() => {
    const flatten = (nodes: any[]): any[] =>
      nodes.flatMap((n: any) => [n, ...flatten(n.children || [])]);
    return flatten(allCatsData?.categories ?? []);
  }, [allCatsData]);
  // Products live under root "clothing"; child filter options come from dogclothing's children
  const categorySlug = pageSettings.productSection.categorySlug || "clothing";
  const rootClothingCat = flatCats.find((c: any) => c.slug === categorySlug);
  const dogClothingCat  = flatCats.find((c: any) => c.slug === "dogclothing");
  const childCategories: any[] = dogClothingCat
    ? flatCats.filter((c: any) => c.parentId === dogClothingCat.id && c.isActive !== false)
    : [];

  // Active child cat — look in both the root's direct children and dogclothing's children
  const allFilterableCats = [
    ...(rootClothingCat ? flatCats.filter((c: any) => c.parentId === rootClothingCat.id) : []),
    ...childCategories,
  ];
  const activeChildCat = activeChildSlug
    ? allFilterableCats.find((c: any) => c.slug === activeChildSlug) ?? null
    : null;

  // ── Fetch clothing products ───────────────────────────────────────────────
  const productsPerGrid = pageSettings.productSection.productsPerGrid || 3;
  const { data: productsData } = useQuery<any>({
    queryKey: ["/api/products", { categorySlug, categoryId: activeChildCat?.id, limit: 50 }],
    queryFn: () => {
      const url = activeChildCat
        ? `/api/products?categoryId=${activeChildCat.id}&limit=50`
        : `/api/products?categorySlug=${categorySlug}&limit=50`;
      return fetch(url).then(r => r.json()).then(d => Array.isArray(d) ? d : (d.products ?? []));
    },
  });

  const apiProducts: any[] = Array.isArray(productsData) ? productsData : [];

  // ── Build editorial products ─────────────────────────────────────────────
  const allEditorialRaw: EditorialProduct[] = apiProducts.length > 0
    ? apiProducts.map(mapProduct)
    : FALLBACK_IMGS.map((img, idx) => ({
        id: idx + 1,
        slug: undefined,
        name: ["Graphene Urban Shell", "Archive Editorial Knit", "Tactical Field Parka",
               "Homeostatic Vest", "Modular Neck Shield", "Atmospheric Puffer"][idx],
        price: [48500, 32000, 61000, 39000, 18500, 55000][idx],
        img,
        specimen: specimenCode(idx),
        specs: TECH[idx],
      }));

  // Client-side size/material filtering
  const allEditorial = useMemo(() => {
    let result = allEditorialRaw;
    if (activeSize) {
      result = result.filter(p =>
        (apiProducts.find((ap: any) => ap.id === p.id)?.variants || []).some((v: any) =>
          v.optionName?.toLowerCase() === "size" && v.optionValue === activeSize
        )
      );
    }
    if (activeMaterial) {
      result = result.filter(p =>
        p.name?.toLowerCase().includes(activeMaterial.toLowerCase())
      );
    }
    return result;
  }, [allEditorialRaw, activeSize, activeMaterial]);

  const grid1 = allEditorial.slice(0, productsPerGrid);
  const grid2 = allEditorial.slice(productsPerGrid, productsPerGrid * 2);

  const handleCategoryChange = (slug: string) => {
    setActiveChildSlug(slug);
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("category", slug);
    else url.searchParams.delete("category");
    window.history.replaceState(null, "", url.toString());
  };

  // ── Parallax hero ────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) heroRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Add to cart ──────────────────────────────────────────────────────────
  const handleAddToCart = async (product: EditorialProduct) => {
    if (!product.slug) {
      toast({ title: "Coming soon", description: "This piece will be available shortly." });
      return;
    }
    try {
      await addToCart({ productId: String(product.id), quantity: 1 });
      toast({ title: "Added to dossier", description: `${product.name} has been added to your cart.` });
    } catch {
      toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" });
    }
  };

  const hero = pageSettings.hero;
  const bio = pageSettings.bioAdvantage;
  const testimonialSettings = pageSettings.testimonials;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.surface, overflowX: "hidden" }}>
      <EditorialHeader nav={navSettings.nav} />

      {/* ════════════════════════════════════════════════════════════════
          1. HERO BANNER
          ════════════════════════════════════════════════════════════════ */}
      <AdBannerSlot banners={adBanners} placement="hero" position="top" />
      <header className="relative w-full flex items-center overflow-hidden" style={{ height: "85vh", backgroundColor: C.primary }}>
        <div
          ref={heroRef}
          className="absolute inset-0"
          style={{
            backgroundImage: `url('${hero.bgImageUrl}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.75,
            willChange: "transform",
          }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(1,45,29,0.7) 0%, rgba(1,45,29,0.2) 60%, transparent 100%)" }} />
        <div className="relative z-10 w-full px-8 md:px-16 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-8 lg:col-span-6">
            <p style={{ ...LABEL_CAPS, color: C.secondaryContainer, marginBottom: 16 }}>
              {hero.collectionTag}
            </p>
            <h1 style={{ ...PLAYFAIR, fontSize: "clamp(48px,8vw,84px)", lineHeight: 1, letterSpacing: "-0.02em", fontWeight: 700, color: C.white, marginBottom: 32 }}>
              {hero.headline.split("\n").map((line: string, i: number) => <span key={i}>{line}{i < hero.headline.split("\n").length - 1 && <br />}</span>)}
            </h1>
            <p style={{ ...INTER, fontSize: 18, fontWeight: 300, color: C.mint, maxWidth: 480, marginBottom: 40, lineHeight: 1.6 }}>
              {hero.subtitle}
            </p>
            <div className="flex gap-6 flex-wrap">
              <a href={hero.cta1Href}>
                <button
                  className="transition-opacity duration-200"
                  style={{ backgroundColor: C.primaryFixed, color: C.primary, ...LABEL_CAPS, letterSpacing: "0.2em", padding: "16px 40px" }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  data-testid="btn-cta1"
                >
                  {hero.cta1Text}
                </button>
              </a>
              <a href={hero.cta2Href}>
                <button
                  className="transition-all duration-200"
                  style={{ border: `1px solid ${C.primaryFixed}`, color: C.primaryFixed, ...LABEL_CAPS, letterSpacing: "0.2em", padding: "16px 40px", backgroundColor: "transparent" }}
                  onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.backgroundColor = C.primaryFixed; b.style.color = C.primary; }}
                  onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.backgroundColor = "transparent"; b.style.color = C.primaryFixed; }}
                  data-testid="btn-cta2"
                >
                  {hero.cta2Text}
                </button>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full" style={{ height: 4, backgroundColor: "rgba(1,45,29,0.2)" }}>
          <div style={{ height: "100%", width: "33%", backgroundColor: C.secondaryContainer, transition: "width 1s ease-in-out" }} />
        </div>
      </header>
      <AdBannerSlot banners={adBanners} placement="hero" position="bottom" />

      {/* ════════════════════════════════════════════════════════════════
          2. STICKY FILTER BAR
          ════════════════════════════════════════════════════════════════ */}
      <section className="sticky z-40 border-b" style={{ top: 72, backgroundColor: C.surface, borderColor: C.outlineVariant, padding: "16px clamp(20px,5vw,64px)" }}>
        <div className="flex flex-wrap justify-between items-center gap-6">
          <div className="flex gap-10 flex-wrap items-end">
            {/* Category dropdown + per-filter clear */}
            <div className="flex flex-col gap-1">
              <FilterDropdown
                label="CATEGORY"
                options={[
                  { label: "ALL CATEGORIES", value: "" },
                  ...childCategories.map((c: any) => ({ label: c.name.toUpperCase(), value: c.slug })),
                ]}
                value={activeChildSlug}
                onChange={handleCategoryChange}
              />
              {activeChildSlug && (
                <button onClick={() => handleCategoryChange("")}
                  style={{ ...LABEL_CAPS, fontSize: 9, color: C.secondary, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                  × Clear
                </button>
              )}
            </div>

            {/* Size dropdown + per-filter clear */}
            <div className="flex flex-col gap-1">
              <FilterDropdown
                label="SIZE"
                options={[{ label: "ALL SIZES", value: "" }, ...CLOTHING_SIZES.map(s => ({ label: s, value: s }))]}
                value={activeSize}
                onChange={setActiveSize}
              />
              {activeSize && (
                <button onClick={() => setActiveSize("")}
                  style={{ ...LABEL_CAPS, fontSize: 9, color: C.secondary, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                  × Clear
                </button>
              )}
            </div>

            {/* Material dropdown + per-filter clear */}
            <div className="flex flex-col gap-1">
              <FilterDropdown
                label="MATERIAL"
                options={[{ label: "ALL MATERIALS", value: "" }, ...CLOTHING_MATERIALS.map(m => ({ label: m.toUpperCase(), value: m }))]}
                value={activeMaterial}
                onChange={setActiveMaterial}
              />
              {activeMaterial && (
                <button onClick={() => setActiveMaterial("")}
                  style={{ ...LABEL_CAPS, fontSize: 9, color: C.secondary, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                  × Clear
                </button>
              )}
            </div>

            {/* Global clear all */}
            {(activeChildSlug || activeSize || activeMaterial) && (
              <button
                onClick={() => { handleCategoryChange(""); setActiveSize(""); setActiveMaterial(""); }}
                style={{ ...LABEL_CAPS, fontSize: 9, color: C.outline, background: "none", border: `1px solid ${C.outlineVariant}`, cursor: "pointer", padding: "4px 10px", marginBottom: 2 }}>
                CLEAR ALL
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span style={{ ...LABEL_CAPS, color: C.outline }}>RESULTS: {allEditorial.length} ITEMS</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: C.onSurface }}>
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          3. PRODUCT DOSSIER GRID — SECTION 1
          ════════════════════════════════════════════════════════════════ */}
      {pageSettings.productSection.visible && (
        <>
          <AdBannerSlot banners={adBanners} placement="products-1" position="top" />
          <main id="collection" style={{ padding: "clamp(40px,8vw,80px) clamp(20px,5vw,64px)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-20">
              {grid1.map((product, i) => (
                <div key={product.id} className={i === 1 ? "lg:mt-24" : ""}>
                  <ProductCard product={product} onAddToCart={() => handleAddToCart(product)} />
                </div>
              ))}
            </div>
          </main>
          <AdBannerSlot banners={adBanners} placement="products-1" position="bottom" />
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          4. BIOLOGICAL ADVANTAGE BREAK
          ════════════════════════════════════════════════════════════════ */}
      {bio.visible && (
        <>
          <AdBannerSlot banners={adBanners} placement="bio" position="top" />
          <section className="relative overflow-hidden" style={{ backgroundColor: C.primary, color: C.white, padding: "clamp(40px,8vw,80px) clamp(20px,5vw,64px)" }}>
            <div className="absolute right-0 top-0 w-1/2 h-full pointer-events-none"
              style={{ background: "linear-gradient(135deg, transparent 30%, rgba(165,208,184,0.05) 100%)" }} />
            <div className="grid grid-cols-12 gap-6 items-center relative z-10">
              <div className="col-span-12 md:col-span-6 lg:col-span-5">
                <p style={{ ...LABEL_CAPS, color: C.primaryFixed, marginBottom: 24 }}>{bio.label}</p>
                <h2 style={{ ...PLAYFAIR, fontSize: "clamp(28px,4vw,48px)", fontWeight: 600, color: C.white, marginBottom: 32, lineHeight: 1.15 }}>
                  {bio.headline}
                </h2>
                <p style={{ ...INTER, fontSize: 18, fontWeight: 300, color: C.outlineVariant, marginBottom: 40, lineHeight: 1.7 }}>
                  {bio.body}
                </p>
                <div className="flex items-center gap-12 flex-wrap">
                  {[
                    { value: bio.stat1Value, label: bio.stat1Label },
                    { value: bio.stat2Value, label: bio.stat2Label },
                    { value: bio.stat3Value, label: bio.stat3Label },
                  ].map(s => (
                    <div key={s.label}>
                      <span style={{ ...PLAYFAIR, fontSize: 32, fontWeight: 600, display: "block", color: C.secondaryContainer }}>{s.value}</span>
                      <span style={{ ...MONO, ...LABEL_CAPS, fontSize: 10, color: C.outlineVariant }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-12 md:col-start-8 md:col-span-5 hidden md:block">
                <div style={{ border: `1px solid rgba(192,237,212,0.3)`, padding: 32, backdropFilter: "blur(8px)", backgroundColor: "rgba(255,255,255,0.04)" }}>
                  <p style={{ ...MONO, fontSize: 10, color: C.primaryFixed, marginBottom: 16 }}>TRANSCRIPTION // LAB NOTES</p>
                  <div className="space-y-4">
                    <div style={{ height: 1, backgroundColor: "rgba(192,237,212,0.2)", width: "100%" }} />
                    <p style={{ ...MONO, fontSize: 12, lineHeight: 1.7, color: C.outlineVariant, fontStyle: "italic" }}>{bio.labQuote}</p>
                    <div style={{ height: 1, backgroundColor: "rgba(192,237,212,0.2)", width: "100%" }} />
                    <p style={{ ...MONO, fontSize: 10, textAlign: "right", color: C.primaryFixed }}>{bio.labRef}</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {[{ label: "WIND RESISTANCE", value: "120 KMH" }, { label: "WASH CYCLES", value: "500+" },
                    { label: "SIZE RANGE", value: "XS — 3XL" }, { label: "WARRANTY", value: "LIFETIME" }].map(s => (
                    <div key={s.label} style={{ borderTop: `1px solid rgba(192,237,212,0.2)`, paddingTop: 16 }}>
                      <span style={{ ...MONO, fontSize: 10, color: C.outlineVariant, display: "block" }}>{s.label}</span>
                      <span style={{ ...INTER, fontSize: 18, fontWeight: 600, color: C.primaryFixed }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <AdBannerSlot banners={adBanners} placement="bio" position="bottom" />
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          5. PRODUCT DOSSIER GRID — SECTION 2
          ════════════════════════════════════════════════════════════════ */}
      {pageSettings.productSection.visible && grid2.length > 0 && (
        <>
          <AdBannerSlot banners={adBanners} placement="products-2" position="top" />
          <main style={{ backgroundColor: C.surfaceContainerLow, padding: "clamp(40px,8vw,80px) clamp(20px,5vw,64px)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-20">
              {grid2.map((product, i) => (
                <div key={product.id} className={i === 1 ? "lg:-mt-12" : ""}>
                  <ProductCard product={product} onAddToCart={() => handleAddToCart(product)} />
                </div>
              ))}
            </div>
            {allEditorial.length > productsPerGrid * 2 && (
              <div className="flex justify-center mt-20">
                <Link href="/shop">
                  <button
                    style={{ ...LABEL_CAPS, letterSpacing: "0.2em", padding: "16px 48px", border: `1px solid ${C.primary}`, color: C.primary, backgroundColor: "transparent" }}
                    onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.backgroundColor = C.primary; b.style.color = C.white; }}
                    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.backgroundColor = "transparent"; b.style.color = C.primary; }}
                    className="transition-all duration-200"
                    data-testid="btn-view-all"
                  >
                    VIEW COMPLETE ARCHIVE
                  </button>
                </Link>
              </div>
            )}
          </main>
          <AdBannerSlot banners={adBanners} placement="products-2" position="bottom" />
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          6. TESTIMONIAL ARCHIVE (dynamic)
          ════════════════════════════════════════════════════════════════ */}
      {testimonialSettings.visible && (testimonials.length > 0) && (
        <>
          <AdBannerSlot banners={adBanners} placement="testimonials" position="top" />
          <section style={{ backgroundColor: C.surface, padding: "clamp(40px,8vw,80px) clamp(20px,5vw,64px)", borderTop: `1px solid ${C.outlineVariant}` }}>
            <p style={{ ...MONO, ...LABEL_CAPS, color: C.secondary, marginBottom: 48 }}>
              {testimonialSettings.sectionLabel}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {testimonials.slice(0, 1).map(t => (
                <div key={t.id} className="md:col-span-7" style={{ borderLeft: `1px solid ${C.outlineVariant}`, paddingLeft: 32, paddingTop: 16, paddingBottom: 16 }}>
                  <div className="flex justify-between items-start mb-6 flex-wrap gap-2">
                    <span style={{ ...MONO, fontSize: 10, color: C.outline }}>SUBJECT: {t.subjectCode}</span>
                    <span style={{ ...MONO, fontSize: 10, color: C.primary, fontWeight: 700 }}>BIOLOGICAL SATISFACTION: {t.satisfactionLabel}</span>
                  </div>
                  <blockquote style={{ ...PLAYFAIR, fontSize: 28, lineHeight: "36px", color: C.onSurface, marginBottom: 32 }}>
                    "{t.quote}"
                  </blockquote>
                  <div className="flex gap-6 flex-wrap">
                    {t.location && <span style={{ ...MONO, fontSize: 10, color: C.outlineVariant }}>LOCATION: {t.location}</span>}
                    {t.envData && <span style={{ ...MONO, fontSize: 10, color: C.outlineVariant }}>{t.envData}</span>}
                  </div>
                </div>
              ))}
              {testimonials.slice(1, 2).map(t => (
                <div key={t.id} className="md:col-span-5 md:mt-24" style={{ borderLeft: `1px solid ${C.outlineVariant}`, paddingLeft: 32, paddingTop: 16, paddingBottom: 16 }}>
                  <div className="flex justify-between items-start mb-6 flex-wrap gap-2">
                    <span style={{ ...MONO, fontSize: 10, color: C.outline }}>SUBJECT: {t.subjectCode}</span>
                    <span style={{ ...MONO, fontSize: 10, color: C.primary, fontWeight: 700 }}>LEVEL: {t.satisfactionLabel}</span>
                  </div>
                  <blockquote style={{ ...INTER, fontSize: 18, fontWeight: 300, fontStyle: "italic", color: C.onSurface, marginBottom: 24, lineHeight: 1.6 }}>
                    "{t.quote}"
                  </blockquote>
                  <div className="flex gap-6 flex-wrap">
                    {t.location && <span style={{ ...MONO, fontSize: 10, color: C.outlineVariant }}>LOCATION: {t.location}</span>}
                    {t.envData && <span style={{ ...MONO, fontSize: 10, color: C.outlineVariant }}>{t.envData}</span>}
                  </div>
                </div>
              ))}
              {testimonials.slice(2, 3).map(t => (
                <div key={t.id} className="md:col-span-6 md:col-start-4 mt-12" style={{ borderTop: `1px solid ${C.outlineVariant}`, paddingTop: 32 }}>
                  <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                    <span style={{ ...MONO, fontSize: 10, color: C.outline }}>SUBJECT: {t.subjectCode}</span>
                    <span style={{ ...MONO, fontSize: 10, color: C.primary, fontWeight: 700 }}>SATISFACTION: {t.satisfactionLabel}</span>
                  </div>
                  <blockquote style={{ ...PLAYFAIR, fontSize: 28, lineHeight: "36px", color: C.onSurface, marginBottom: 24 }}>
                    "{t.quote}"
                  </blockquote>
                  <div className="flex gap-6 flex-wrap">
                    {t.location && <span style={{ ...MONO, fontSize: 10, color: C.outlineVariant }}>{t.location}</span>}
                    {t.envData && <span style={{ ...MONO, fontSize: 10, color: C.outlineVariant }}>{t.envData}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <AdBannerSlot banners={adBanners} placement="testimonials" position="bottom" />
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          7. EDITORIAL FOOTER
          ════════════════════════════════════════════════════════════════ */}
      <EditorialFooter footer={navSettings.footer} email={email} onEmailChange={setEmail} />
    </div>
  );
}
