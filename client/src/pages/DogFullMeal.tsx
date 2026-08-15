import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Play, ShoppingCart, CheckCircle2, PawPrint } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { EditorialHeader, EditorialFooter } from "@/components/store/EditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";
import type { HomepageSettings } from "@/lib/homepageDefaults";

// ─── Brand color tokens ────────────────────────────────────────────
const C = {
  primary: "#012d1d",
  secondary: "#944923",
  white: "#ffffff",
  surface: "#f9faf6",
  surfaceContainerLow: "#f3f4f0",
  surfaceContainerHighest: "#e2e3e0",
  outlineVariant: "#c1c8c2",
  onSurfaceVariant: "#414844",
  onSurface: "#1a1c1a",
  onPrimaryContainer: "#c0edd4",
  secondaryContainer: "#fe9e71",
};

// ─── Settings types ────────────────────────────────────────────────
interface Check { title: string; desc: string }
interface BiryaniProduct { title: string; label: string; desc: string; imageUrl: string; ctaHref: string }
interface Spice { name: string; desc: string }

interface FullMealSettings {
  hero: { headline: string; subheadline: string; caption: string; ctaText: string; imageUrl: string };
  whyTheWolf: { visible: boolean; label: string; title: string; body: string; checks: Check[] };
  video1: { visible: boolean; label: string; title: string; imageUrl: string };
  wetFood: { title: string; subtitle: string };
  interstitialBanner: { visible: boolean; label: string; title: string; titleItalic: string; body: string; imageUrl: string };
  biryaniSection: { visible: boolean; title: string; body: string; spices: Spice[]; products: BiryaniProduct[] };
  video2: { visible: boolean; label: string; title: string; imageUrl: string };
  cta: { headline: string; headlineItalic: string; cta1Text: string; cta1Href: string; cta2Text: string; cta2Href: string };
  ticker: { items: string[] };
  productOrder: string[];
}

const DEFAULTS: FullMealSettings = {
  hero: {
    headline: "Every dog is a wolf at heart.",
    subheadline: "We cook for the wolf your dog still is — not the pet it's become.",
    caption: "Real meat. Real organs. Real meals.",
    ctaText: "Explore the Archive →",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFlghEMvULN5PqfyPTpkSOBINq1VXFIjwF8X6WEnfuJvmxmFCHIrIo2WMSkUgGh9vY_yUgzrbmFSkLrytAZcUqYk4M9tVUQmYv9bRv2yg9qdJosc3MC9DTyHzJYWJm2KmDEuDqOCAbMB_whlwjRiP-8MtzB6HwRlTmzeeo_HHBELbgFHFgh42aIMojv4maBbqmmPBqNba6Do5SuwSyX4fKSJhBJNj1eHVa8n_ZzZWL_MAQBhtGK6PtaS-4ohFDsw4mQx2XOvCkBgpk",
  },
  whyTheWolf: {
    visible: true, label: "BIOLOGICAL ANALYSIS", title: "Why the Wolf",
    body: "99% wolf DNA. Same teeth. Same short, acidic gut built for meat, not fillers. We just never stopped feeding it that way.",
    checks: [
      { title: "Whole meat + organ", desc: "Foundational biological nutrition in every recipe" },
      { title: "No synthetic fillers", desc: "Zero corn, wheat, or soy interference" },
      { title: "Absolute Purity", desc: "No artificial anything. Pure evolutionary fuel." },
      { title: "Precision Cooking", desc: "Gently cooked to preserve molecular integrity" },
    ],
  },
  video1: {
    visible: true, label: "CINEMATIC DOCUMENTARY", title: "The Wolf Inside: A Biological Study",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLvuz6wDqgllbWA8p2EssqY0zKgRvqveFpY7LpxnyUHP1_Dt00EhP_FEhvVaWckxcpAW40u8gA4jmYG0S_xU9rnoIJRK-aKucgmTABg-hPaa6AHQM9LmWFf_LqH7v9Lvb2Gy3BnohXYa6__3E9Q-DlM1geDw3gGOQiH7GCryB99H5pCA9jOGSwj5YIsGbnzBr_PtELQ0yOhXcM3Gohw7lGXGMM3lq1207s7yvRtukGXfUIe1hQhZZJbbA9hy",
  },
  wetFood: { title: "Wet Food Meals", subtitle: "Whole-animal meals. One protein. Nothing hiding in it." },
  interstitialBanner: {
    visible: true, label: "SPECIMEN ANALYSIS", title: "The Ancestral", titleItalic: "Plate",
    body: "Precisely balanced components. Every ingredient serves a biological imperative. No filler. No compromise.",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLuyl5EViKkGxOfraqcvJ1eWgvnPxiEm3nSPhnlSxEKqEV5f-Lp55MknwoBjO4CfGnFKvqrpIqfM2uXUdv5wxRz-A4NSQVGFnuDIqoEREa18FveczKF7kxE-cTJNnr__4qWn5_kmFAv0UFbS2ksV27z9hvvy167eRI948LUjIvmHwsTSCIDV6M8M2UgZYlo-7KLwZIT2SSOA6XDdO3QSQZk-XShiLJm_gXXNwnUOyf2Y_XBJOGXFdSM0cBuh",
  },
  biryaniSection: {
    visible: true, title: "The Biryani Collection",
    body: "Layered with the herbs and fats a wolf's diet was always missing. Every biryani is a synthesis of ancient spice and biological precision.",
    spices: [
      { name: "Turmeric", desc: "Anti-inflammatory synthesis for joint preservation and recovery." },
      { name: "Ashwagandha", desc: "Biological adaptogen for neural balance and stress mediation." },
      { name: "Coconut Oil", desc: "Molecular fat carrier for maximum botanical bioavailability." },
    ],
    products: [
      { title: "Mutton Biryani", label: "PREMIUM SELECTION", desc: "Rich, iron-dense, the closest thing to a wild feast. A celebration of big-game proteins and traditional synthesis.", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAeMN5mdW7jRDF8rEtwJgRIxt9V4q2uyRXFYfp7Sabgr3gkUdiTtTvK6Jymo2zPGYRLw74UtpKMPqTkcU4jvQSZB2N-I4Tn-8Mq5ico5ONGP1AZouqgByGMUGHucM-NVbIgkJD3SK2cOa7EvTx3mkKYHV9utTy-Du1hDv6-bJHt3sPVgk-nX-8HMaI40RIU2pXY5NdbJgCaWZI6nYSeyT41YDTxXO3CJKmjTHR7YsOJ0aAwVkUdyRMfGn19VzaiZGxlE0AGxIQ9QmS", ctaHref: "/shop" },
      { title: "Chicken Biryani", label: "DAILY FOUNDATION", desc: "Daily protein, feast-day flavor. Balanced nutrition meeting evolutionary cravings for complex texture.", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBuSXNg5gvRs9dZPHpSss6HNpcziyEP3I4J0RKLwMqFtXo9k9KZBhlsJPFhciIxBj2YIj0CLcwbKZ02wmydQySE3Z6NrtNMmaW-bPLWZno5aGhTYVuL1x8c6QOSPgnmk2BfdOq15qg_iEMi1KUguDcIHyXbnqSssYOTzwZ-u59lirB_sQorVD-B_VBnbCNtV24c5RiTTtGiIgy18PjH8KUVrCZzsEYjLAjrowiUkSFTNUZxUZ2ZBAds1FN1I79GiG2QculMT_E7JTUw", ctaHref: "/shop" },
    ],
  },
  video2: {
    visible: true, label: "LABORATORY INSIGHTS", title: "The Science of Synthesis",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnhcrOXDz9EYkl-E0ilJajSa-UkjCqCcZau4jufEeLe-_gqFN1vmeXvp9woooDLDjFWWBYqhXzoghABWWGQJxCq4EOazoanZ-Jhvrrh9oyx41es-1qNIo4rHwW3L_ysOyByfW9iC3G_EmYtQnemO5ufGpIJ28qN5Q_NEfD_K-rO3qp0xAydnfXOMOyPMXC087Bi_zXmCYL1hCMQeotQNOv0Xr7hzM6l1iVzm8eaUyZ5GezCZWwYreW8vsDde4jxCSWQP3hVyJt00K9",
  },
  cta: {
    headline: "Feed the Wolf", headlineItalic: "Inside Your Dog",
    cta1Text: "WET MEALS ARCHIVE →", cta1Href: "/shop",
    cta2Text: "BIRYANI COLLECTION →", cta2Href: "/shop",
  },
  ticker: {
    items: ["Biological Precision: 100% Traceable", "99% Wolf DNA Alignment", "Batch ID: #WOLF-2024-DELTA", "No Fillers. No Grains.", "Gently Cooked Synthesis", "Human-Grade Ingredients", "Vet-Formulated Recipes"],
  },
  productOrder: [],
};

function deepMerge(defaults: FullMealSettings, saved: Partial<FullMealSettings>): FullMealSettings {
  return {
    hero: { ...defaults.hero, ...(saved.hero || {}) },
    whyTheWolf: {
      ...defaults.whyTheWolf, ...(saved.whyTheWolf || {}),
      checks: saved.whyTheWolf?.checks?.length ? saved.whyTheWolf.checks : defaults.whyTheWolf.checks,
    },
    video1: { ...defaults.video1, ...(saved.video1 || {}) },
    wetFood: { ...defaults.wetFood, ...(saved.wetFood || {}) },
    interstitialBanner: { ...defaults.interstitialBanner, ...(saved.interstitialBanner || {}) },
    biryaniSection: {
      ...defaults.biryaniSection, ...(saved.biryaniSection || {}),
      spices: saved.biryaniSection?.spices?.length ? saved.biryaniSection.spices : defaults.biryaniSection.spices,
      products: saved.biryaniSection?.products?.length ? saved.biryaniSection.products : defaults.biryaniSection.products,
    },
    video2: { ...defaults.video2, ...(saved.video2 || {}) },
    cta: { ...defaults.cta, ...(saved.cta || {}) },
    ticker: { items: saved.ticker?.items?.length ? saved.ticker.items : defaults.ticker.items },
    productOrder: saved.productOrder || [],
  };
}

function getProductImage(product: any): string {
  if (!product) return "";
  const imgs = product.images || product.productImages || [];
  const primary = imgs.find((i: any) => i.isPrimary) || imgs[0];
  return primary?.url || primary?.imageUrl || product.imageUrl || product.image || "";
}

const BIOMETRIC_DATA = [
  { label1: "PROTEIN DENSITY", val1: "HIGH_REF_88%", label2: "VITAMIN PROFILE", val2: "A_B12_FOLATE", title: "BIOMETRIC DATA" },
  { label1: "AMINO ARCHIVE", val1: "COMPLETE_L_SYNTH", label2: "DIGESTION RATING", val2: "OPTIMAL_0.98", title: "NUTRIENT ASSAY" },
  { label1: "EPA / DHA", val1: "3.2_RATIO_MAX", label2: "INFLAMMATION CTL", val2: "ACTIVE_SUPP", title: "MOLECULAR PROFILE" },
  { label1: "IRON DENSITY", val1: "WILD_CLASS_A", label2: "COLLAGEN YIELD", val2: "JOINT_SUPP", title: "SPECIMEN ASSAY" },
];

const SPECIMEN_LABELS = ["ARCHIVE_SPECIMEN.01", "ARCHIVE_SPECIMEN.02", "ARCHIVE_SPECIMEN.03", "ARCHIVE_SPECIMEN.04", "ARCHIVE_SPECIMEN.05", "ARCHIVE_SPECIMEN.06"];

// ─── Ticker Band ──────────────────────────────────────────────────
function TickerBand({ items }: { items: string[] }) {
  const repeated = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y py-5" style={{ backgroundColor: C.primary, borderColor: `${C.white}22` }}>
      <style>{`
        @keyframes dfm-ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
        .dfm-ticker { animation: dfm-ticker 40s linear infinite; white-space: nowrap; display: inline-block; }
      `}</style>
      <div className="dfm-ticker">
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-8 mx-8">
            <span className="uppercase text-[11px] tracking-[0.25em] font-bold" style={{ color: C.onPrimaryContainer, fontFamily: "Inter, sans-serif" }}>
              {item}
            </span>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: C.secondaryContainer }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Product Card (alternating layout) ───────────────────────────
function EditorialProductCard({ product, index, onAddToCart }: { product: any; index: number; onAddToCart: (p: any) => void }) {
  const isReversed = index % 2 === 1;
  const bio = BIOMETRIC_DATA[index % BIOMETRIC_DATA.length];
  const specimen = SPECIMEN_LABELS[index % SPECIMEN_LABELS.length];
  const imgSrc = getProductImage(product);
  const price = product.salePrice || product.price;
  const quote = product.description
    ? `"${product.description.slice(0, 120).replace(/<[^>]+>/g, "")}…"`
    : `"Precision-formulated nutrition. Biologically appropriate for the modern canine predator."`;

  return (
    <div className={`flex flex-col ${isReversed ? "md:flex-row-reverse" : "md:flex-row"} items-center px-5 md:px-[64px] gap-8 md:gap-20`}>
      {/* Image */}
      <div className="w-full md:w-3/5 relative flex-shrink-0">
        <div className={`absolute z-10 font-mono text-[11px] px-4 py-2 ${isReversed ? "top-8 right-8" : "top-8 left-8"}`}
          style={{ backgroundColor: C.primary, color: C.white, letterSpacing: "0.1em" }}>
          {specimen}
        </div>
        <div style={{ boxShadow: `40px 40px 0px 0px ${C.primary}E6` }}>
          <img
            src={imgSrc || "https://lh3.googleusercontent.com/aida-public/AB6AXuBuSXNg5gvRs9dZPHpSss6HNpcziyEP3I4J0RKLwMqFtXo9k9KZBhlsJPFhciIxBj2YIj0CLcwbKZ02wmydQySE3Z6NrtNMmaW-bPLWZno5aGhTYVuL1x8c6QOSPgnmk2BfdOq15qg_iEMi1KUguDcIHyXbnqSssYOTzwZ-u59lirB_sQorVD-B_VBnbCNtV24c5RiTTtGiIgy18PjH8KUVrCZzsEYjLAjrowiUkSFTNUZxUZ2ZBAds1FN1I79GiG2QculMT_E7JTUw"}
            alt={product.title}
            className="w-full object-cover"
            style={{ aspectRatio: "4/5" }}
            loading="lazy"
          />
        </div>
      </div>
      {/* Text */}
      <div className="w-full md:w-2/5 space-y-8 flex flex-col gap-4">
        <div className={`${isReversed ? "border-r-4 pr-8 md:text-right" : "border-l-4 pl-8"}`}
          style={{ borderColor: isReversed ? C.primary : C.secondary }}>
          <h3 className="font-playfair mb-4" style={{ fontSize: "clamp(36px,5vw,52px)", fontWeight: 600, color: C.primary }}>
            {product.title}
          </h3>
          {price && (
            <p className="font-inter text-base mb-3" style={{ color: C.secondary, fontWeight: 600, letterSpacing: "0.05em" }}>
              ₹{parseFloat(price).toFixed(2)}
            </p>
          )}
          <p className="font-playfair text-xl italic leading-relaxed" style={{ color: C.onSurfaceVariant }}>
            {quote}
          </p>
        </div>
        {/* Biometric data */}
        <div className="p-8 border" style={{ backgroundColor: C.surfaceContainerLow, borderColor: C.outlineVariant }}>
          <p className="font-inter mb-4" style={{ fontSize: "10px", letterSpacing: "0.3em", color: `${C.primary}80`, textTransform: "uppercase", fontWeight: 700 }}>
            {bio.title}
          </p>
          <div className="flex justify-between border-b py-2" style={{ borderColor: C.outlineVariant }}>
            <span className="font-inter text-xs uppercase tracking-widest" style={{ color: C.onSurface }}>{bio.label1}</span>
            <span className="font-mono text-xs" style={{ color: C.primary }}>{bio.val1}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="font-inter text-xs uppercase tracking-widest" style={{ color: C.onSurface }}>{bio.label2}</span>
            <span className="font-mono text-xs" style={{ color: C.primary }}>{bio.val2}</span>
          </div>
        </div>
        {/* Buttons */}
        <div className={`flex flex-wrap gap-4 ${isReversed ? "md:justify-end" : ""}`}>
          <Link href={`/full-meals/product/${product.slug || product.id}`}>
            <button
              className="font-inter text-xs uppercase tracking-widest px-12 py-4 transition-all duration-300 cursor-pointer"
              style={{ backgroundColor: C.primary, color: C.white }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = C.secondary)}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = C.primary)}
            >
              VIEW SPECIMEN
            </button>
          </Link>
          <button
            onClick={() => onAddToCart(product)}
            className="font-inter text-xs uppercase tracking-widest px-12 py-4 border transition-all duration-300 cursor-pointer flex items-center gap-2"
            style={{ borderColor: C.primary, color: C.primary, backgroundColor: "transparent" }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primary; (e.currentTarget as HTMLButtonElement).style.color = C.white; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = C.primary; }}
          >
            <ShoppingCart className="w-4 h-4" /> ADD TO CART
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cinematic Video Section ──────────────────────────────────────
function VideoSection({ imgSrc, label, title, dark = false }: { imgSrc: string; label: string; title: string; dark?: boolean }) {
  return (
    <section className="relative w-full overflow-hidden" style={{ height: "70vh" }}>
      <img src={imgSrc} alt={title} className="absolute inset-0 w-full h-full object-cover"
        style={dark ? { filter: "grayscale(1) brightness(0.6)" } : { opacity: 0.6 }} loading="lazy" />
      <div className="absolute inset-0" style={{ backgroundColor: dark ? `${C.primary}66` : `${C.primary}22` }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
        <button
          className="w-24 h-24 rounded-full flex items-center justify-center mb-8 transition-all duration-400"
          style={{ backgroundColor: `${C.primary}CC`, backdropFilter: "blur(4px)" }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = `${C.secondary}E6`)}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = `${C.primary}CC`)}
          aria-label="Play video"
        >
          <Play className="w-12 h-12 fill-current" style={{ color: C.white }} />
        </button>
        <p className="font-inter text-xs uppercase mb-3" style={{ letterSpacing: "0.5em", color: `${C.white}B3` }}>{label}</p>
        <h2 className="font-playfair" style={{ fontSize: "clamp(28px,5vw,48px)", color: C.white, fontWeight: 600 }}>{title}</h2>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function DogFullMeal() {
  const { addToCart } = useStore();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [s, setS] = useState<FullMealSettings>(DEFAULTS);
  const [sortBy, setSortBy] = useState("featured");
  const [priceFilter, setPriceFilter] = useState("all");
  const [activeCategory, setActiveCategory] = useState<string>(
    () => new URLSearchParams(window.location.search).get("category") ?? ""
  );

  // Load page settings
  const { data: settingsData } = useQuery<{ settings: Partial<FullMealSettings> }>({
    queryKey: ["/api/settings/full-meal-page"],
  });

  // Load homepage settings for shared header/footer
  const { data: homepageData } = useQuery<{ settings: Partial<HomepageSettings> }>({
    queryKey: ["/api/settings/homepage"],
  });
  const nav = homepageData ? mergeHomepageSettings(homepageData.settings || {}).nav : DEFAULT_HOMEPAGE_SETTINGS.nav;
  const footer = homepageData ? mergeHomepageSettings(homepageData.settings || {}).footer : DEFAULT_HOMEPAGE_SETTINGS.footer;

  useEffect(() => {
    if (settingsData?.settings) setS(deepMerge(DEFAULTS, settingsData.settings));
  }, [settingsData]);

  // Fetch child categories of full-meals for the filter bar
  const { data: allCatsData } = useQuery<{ categories: any[] }>({ queryKey: ["/api/categories"] });
  const fullMealChildCats: any[] = (() => {
    const flat = (ns: any[]): any[] => ns.flatMap((n: any) => [n, ...flat(n.children || [])]);
    const all = flat(allCatsData?.categories ?? []);
    const parent = all.find((c: any) => c.slug === "full-meals");
    return parent ? all.filter((c: any) => c.parentId === parent.id && c.isActive !== false) : [];
  })();

  // Scroll to products section if a category was pre-selected via URL param
  useEffect(() => {
    if (activeCategory) {
      setTimeout(() => {
        document.getElementById("dfm-meals")?.scrollIntoView({ behavior: "smooth" });
      }, 600);
    }
  }, []); // only on mount

  // Load Full Meals products — re-fetch when activeCategory changes
  const { data: productsData, isLoading } = useQuery<{ products: any[] }>({
    queryKey: ["/api/products", { categorySlug: activeCategory || "full-meals" }],
    queryFn: () =>
      fetch(`/api/products?categorySlug=${activeCategory || "full-meals"}&limit=50`)
        .then(r => r.json()),
  });

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("category", slug);
    else url.searchParams.delete("category");
    window.history.replaceState(null, "", url.toString());
  };

  // Load Biryani products (child category)
  const { data: biryaniData } = useQuery<{ products: any[] }>({
    queryKey: ["/api/products?categorySlug=biryani&limit=50"],
  });

  // Load ad banners for listing page
  const { data: adBanners = [] } = useQuery<any[]>({
    queryKey: ["/api/full-meal-ad-banners?placement=listing"],
  });
  const bs = (section: string, pos: string) =>
    adBanners.filter((b: any) => b.placement === section && b.position === pos);
  const biryaniProducts = (() => {
    const raw = biryaniData?.products ?? [];
    const order: string[] = s.biryaniProductOrder || [];
    if (!order.length) return raw;
    const map = new Map(raw.map((p: any) => [String(p.id), p]));
    const sorted = order.map((id) => map.get(String(id))).filter(Boolean) as any[];
    const rest = raw.filter((p: any) => !order.includes(String(p.id)));
    return [...sorted, ...rest];
  })();

  // Sort products by productOrder from settings
  const products = (() => {
    const raw = productsData?.products ?? [];
    if (!s.productOrder.length) return raw;
    const map = new Map(raw.map((p) => [String(p.id), p]));
    const sorted = s.productOrder.map((id) => map.get(String(id))).filter(Boolean) as any[];
    const rest = raw.filter((p) => !s.productOrder.includes(String(p.id)));
    return [...sorted, ...rest];
  })();

  const filteredProducts = (() => {
    let list = [...products];
    // Price filter
    if (priceFilter !== "all") {
      list = list.filter((p) => {
        const price = parseFloat(p.salePrice || p.price || "0");
        if (priceFilter === "under500") return price < 500;
        if (priceFilter === "500to800") return price >= 500 && price <= 800;
        if (priceFilter === "above800") return price > 800;
        return true;
      });
    }
    // Sort
    if (sortBy === "price_asc") list.sort((a, b) => parseFloat(a.salePrice || a.price || "0") - parseFloat(b.salePrice || b.price || "0"));
    if (sortBy === "price_desc") list.sort((a, b) => parseFloat(b.salePrice || b.price || "0") - parseFloat(a.salePrice || a.price || "0"));
    if (sortBy === "name_az") list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return list;
  })();

  const handleAddToCart = async (product: any) => {
    try {
      await addToCart(product.id, 1);
      toast({ title: `${product.title} added to cart` });
    } catch {
      toast({ variant: "destructive", title: "Could not add to cart" });
    }
  };

  function getYtId(url: string): string | null {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function AdBannerStrip({ banners }: { banners: any[] }) {
    if (!banners.length) return null;
    return (
      <div className="space-y-0">
        {banners.map((b: any) => {
          const ytId = b.mediaType === "youtube" ? getYtId(b.mediaUrl) : null;
          return (
            <div key={b.id} className="relative w-full overflow-hidden" style={{ backgroundColor: C.primary }}>
              {ytId ? (
                <div className="relative w-full" style={{ aspectRatio: "16/6" }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=0&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1`}
                    className="w-full h-full border-0 absolute inset-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={b.title || "Ad Banner"}
                  />
                  {(b.title || b.ctaText) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none" style={{ background: "rgba(1,45,29,0.45)" }}>
                      {b.title && <h3 className="font-playfair text-white mb-2" style={{ fontSize: "clamp(28px,4vw,56px)", fontWeight: 700 }}>{b.title}</h3>}
                      {b.subtitle && <p className="font-inter text-white/80 mb-6 max-w-xl" style={{ fontSize: "clamp(14px,1.5vw,18px)" }}>{b.subtitle}</p>}
                      {b.ctaText && b.ctaUrl && (
                        <a href={b.ctaUrl} className="pointer-events-auto font-inter uppercase px-10 py-4 transition-all" style={{ fontSize: "11px", letterSpacing: "0.15em", fontWeight: 700, backgroundColor: "#fff", color: C.primary }}>
                          {b.ctaText}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full" style={{ minHeight: 200 }}>
                  <img src={b.mediaUrl} alt={b.title || "Banner"} className="w-full object-cover" style={{ maxHeight: 480 }} />
                  {(b.title || b.ctaText) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8" style={{ background: "rgba(1,45,29,0.4)" }}>
                      {b.title && <h3 className="font-playfair text-white mb-2" style={{ fontSize: "clamp(28px,4vw,56px)", fontWeight: 700 }}>{b.title}</h3>}
                      {b.subtitle && <p className="font-inter text-white/80 mb-6 max-w-xl" style={{ fontSize: "clamp(14px,1.5vw,18px)" }}>{b.subtitle}</p>}
                      {b.ctaText && b.ctaUrl && (
                        <a href={b.ctaUrl} className="font-inter uppercase px-10 py-4 transition-all" style={{ fontSize: "11px", letterSpacing: "0.15em", fontWeight: 700, backgroundColor: "#fff", color: C.primary }}>
                          {b.ctaText}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: C.surface, color: C.onSurface, fontFamily: "Inter, sans-serif" }}>
      <EditorialHeader nav={nav} />

      {/* ── Ads: listing-hero top (Before Hero) ───────────── */}
      <AdBannerStrip banners={bs("listing-hero", "top")} />

      {/* ── 1. Hero Banner ────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ height: "90vh" }}>
        <img
          src={s.hero.imageUrl}
          alt="Dog Full Meal Hero"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scale(1.05)" }}
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          style={{ backgroundColor: `${C.primary}4D` }}
        >
          <h1
            className="font-playfair leading-none mb-6 max-w-6xl"
            style={{ fontSize: "clamp(52px,10vw,120px)", fontWeight: 700, color: C.white, letterSpacing: "-0.02em" }}
          >
            {s.hero.headline}
          </h1>
          <p
            className="font-playfair italic mb-4 max-w-4xl"
            style={{ fontSize: "clamp(18px,3vw,30px)", color: C.white, fontWeight: 300 }}
          >
            {s.hero.subheadline}
          </p>
          <p
            className="font-inter uppercase mb-12"
            style={{ fontSize: "11px", letterSpacing: "0.6em", color: `${C.white}E6`, fontWeight: 700 }}
          >
            {s.hero.caption}
          </p>
          <button
            onClick={() => document.getElementById("dfm-meals")?.scrollIntoView({ behavior: "smooth" })}
            className="font-inter uppercase px-14 py-5 transition-all duration-500 cursor-pointer"
            style={{ fontSize: "11px", letterSpacing: "0.15em", fontWeight: 700, backgroundColor: C.white, color: C.primary }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primary; (e.currentTarget as HTMLButtonElement).style.color = C.white; (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${C.white}`; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.white; (e.currentTarget as HTMLButtonElement).style.color = C.primary; (e.currentTarget as HTMLButtonElement).style.border = "1px solid transparent"; }}
          >
            {s.hero.ctaText}
          </button>
        </div>
      </section>

      {/* ── Ads: listing-hero bottom (After Hero) ─────────── */}
      <AdBannerStrip banners={bs("listing-hero", "bottom")} />

      {/* ── 2. Why the Wolf ───────────────────────────────── */}
      {s.whyTheWolf.visible && (
        <section
          className="border-y py-[80px] flex flex-col md:flex-row items-center justify-between gap-12 px-5 md:px-[64px]"
          style={{ borderColor: C.outlineVariant, backgroundColor: C.surfaceContainerLow }}
        >
          <div className="flex-1">
            <span className="font-inter block mb-4" style={{ fontSize: "11px", letterSpacing: "0.3em", color: C.secondary, fontWeight: 700, textTransform: "uppercase" }}>
              {s.whyTheWolf.label}
            </span>
            <h2 className="font-playfair mb-6" style={{ fontSize: "clamp(40px,6vw,72px)", fontWeight: 700, color: C.primary }}>
              {s.whyTheWolf.title}
            </h2>
            <p className="font-inter mb-8 max-w-xl" style={{ fontSize: "clamp(16px,2vw,20px)", color: C.onSurfaceVariant, fontWeight: 300, lineHeight: 1.7 }}>
              {s.whyTheWolf.body}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              {s.whyTheWolf.checks.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: C.primary }} />
                  <div>
                    <p className="font-inter text-xs uppercase font-bold mb-1" style={{ color: C.primary, letterSpacing: "0.1em" }}>{item.title}</p>
                    <p className="text-xs" style={{ color: C.onSurfaceVariant }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Concentric circles diagram */}
          <div className="relative w-80 h-80 flex-shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border flex items-center justify-center" style={{ borderColor: `${C.primary}1A` }}>
              <div className="w-56 h-56 rounded-full border flex items-center justify-center" style={{ borderColor: `${C.primary}4D` }}>
                <div className="w-36 h-36 rounded-full border flex items-center justify-center" style={{ borderColor: `${C.primary}99`, backgroundColor: `${C.primary}0D` }}>
                  <PawPrint className="w-14 h-14" style={{ color: C.primary }} />
                </div>
              </div>
            </div>
            <div className="absolute font-mono text-[11px] tracking-widest" style={{ top: -16, right: -16, color: C.primary, transform: "rotate(90deg)", transformOrigin: "left center", letterSpacing: "0.3em" }}>
              CANIS_LUPUS_REF_99
            </div>
          </div>
        </section>
      )}

      {/* ── Video Section 1 ───────────────────────────────── */}
      {s.video1.visible && (
        <VideoSection imgSrc={s.video1.imageUrl} label={s.video1.label} title={s.video1.title} dark />
      )}

      {/* ── Ads: listing-products top (Before Products Gallery) ── */}
      <AdBannerStrip banners={bs("listing-products", "top")} />

      {/* ── 3. Products Gallery ───────────────────────────── */}
      <main id="dfm-meals" className="py-[80px] overflow-hidden" style={{ backgroundColor: C.surface }}>
        <div className="px-5 md:px-[64px] mb-[56px]">
          <h2 className="font-playfair mb-4" style={{ fontSize: "clamp(48px,7vw,84px)", fontWeight: 700, color: C.primary }}>
            {s.wetFood.title}
          </h2>
          <p className="font-inter max-w-3xl" style={{ fontSize: "clamp(16px,2vw,24px)", color: C.onSurfaceVariant, fontWeight: 300, lineHeight: 1.7 }}>
            {s.wetFood.subtitle}
          </p>
        </div>

        {/* ── Filter Bar ─────────────────────────────────── */}
        <div
          className="px-5 md:px-[64px] mb-[64px] border-y py-6 flex flex-wrap items-center gap-8"
          style={{ borderColor: C.outlineVariant }}
        >
          {/* Category */}
          {fullMealChildCats.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="font-inter text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: `${C.primary}80` }}>
                Category
              </span>
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  onClick={() => handleCategoryChange("")}
                  className="font-inter text-[10px] uppercase tracking-widest px-4 py-2 transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: !activeCategory ? C.primary : "transparent",
                    color: !activeCategory ? C.white : C.onSurfaceVariant,
                    border: `1px solid ${!activeCategory ? C.primary : C.outlineVariant}`,
                    letterSpacing: "0.12em",
                  }}
                >
                  All
                </button>
                {fullMealChildCats.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className="font-inter text-[10px] uppercase tracking-widest px-4 py-2 transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor: activeCategory === cat.slug ? C.primary : "transparent",
                      color: activeCategory === cat.slug ? C.white : C.onSurfaceVariant,
                      border: `1px solid ${activeCategory === cat.slug ? C.primary : C.outlineVariant}`,
                      letterSpacing: "0.12em",
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {fullMealChildCats.length > 0 && <div className="hidden md:block w-px h-8" style={{ backgroundColor: C.outlineVariant }} />}

          {/* Sort */}
          <div className="flex items-center gap-4">
            <span className="font-inter text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: `${C.primary}80` }}>
              Sort
            </span>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "Featured", value: "featured" },
                { label: "Price ↑", value: "price_asc" },
                { label: "Price ↓", value: "price_desc" },
                { label: "A → Z", value: "name_az" },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setSortBy(value)}
                  className="font-inter text-[10px] uppercase tracking-widest px-4 py-2 transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: sortBy === value ? C.primary : "transparent",
                    color: sortBy === value ? C.white : C.onSurfaceVariant,
                    border: `1px solid ${sortBy === value ? C.primary : C.outlineVariant}`,
                    letterSpacing: "0.12em",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-8" style={{ backgroundColor: C.outlineVariant }} />

          {/* Price */}
          <div className="flex items-center gap-4">
            <span className="font-inter text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: `${C.primary}80` }}>
              Price
            </span>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "All", value: "all" },
                { label: "Under ₹500", value: "under500" },
                { label: "₹500 – ₹800", value: "500to800" },
                { label: "₹800+", value: "above800" },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setPriceFilter(value)}
                  className="font-inter text-[10px] uppercase tracking-widest px-4 py-2 transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: priceFilter === value ? C.secondary : "transparent",
                    color: priceFilter === value ? C.white : C.onSurfaceVariant,
                    border: `1px solid ${priceFilter === value ? C.secondary : C.outlineVariant}`,
                    letterSpacing: "0.12em",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className="ml-auto font-mono text-[11px]" style={{ color: C.outline }}>
            {isLoading ? "—" : `${filteredProducts.length} specimen${filteredProducts.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        {isLoading ? (
          <div className="px-5 md:px-[64px] space-y-8">
            {[1, 2, 3].map((i) => <div key={i} className="h-96 animate-pulse rounded" style={{ backgroundColor: C.surfaceContainerLow }} />)}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="space-y-40">
            {filteredProducts.map((product, i) => (
              <EditorialProductCard key={product.id} product={product} index={i} onAddToCart={handleAddToCart} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="px-5 md:px-[64px] py-24 text-center">
            <p className="font-inter text-sm uppercase tracking-widest mb-4" style={{ color: C.outline, letterSpacing: "0.25em" }}>
              No specimens match
            </p>
            <button
              onClick={() => { setSortBy("featured"); setPriceFilter("all"); }}
              className="font-inter text-xs uppercase tracking-widest px-8 py-3 border transition-all duration-200 cursor-pointer"
              style={{ borderColor: C.primary, color: C.primary }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Fallback specimen cards when no API products */
          <div className="space-y-40">
            {[
              { id: "f1", slug: "shop", title: "Chicken Liver", description: "Nature's multivitamin. The first thing a wolf eats at every kill.", price: "499", images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBuSXNg5gvRs9dZPHpSss6HNpcziyEP3I4J0RKLwMqFtXo9k9KZBhlsJPFhciIxBj2YIj0CLcwbKZ02wmydQySE3Z6NrtNMmaW-bPLWZno5aGhTYVuL1x8c6QOSPgnmk2BfdOq15qg_iEMi1KUguDcIHyXbnqSssYOTzwZ-u59lirB_sQorVD-B_VBnbCNtV24c5RiTTtGiIgy18PjH8KUVrCZzsEYjLAjrowiUkSFTNUZxUZ2ZBAds1FN1I79GiG2QculMT_E7JTUw", isPrimary: true }] },
              { id: "f2", slug: "shop", title: "Pure Chicken", description: "Lean, everyday protein. The pack's daily staple.", price: "449", images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDASp98o3P0FgYgy5Hilex9YhhCLmUjcFfgvFoSCdWtcbC9pi9D1EeNbEmagN8-c70V8VIJh7bGd7pKyOZ9bP81o947HNbQdD79_efbu-TATrHUjDap9Lrr44uu-6qln-DZ-WMmTTu1YsVOtR4Yti6Du_DFxAcK6aVulOTfjtjmC2RvyLTGsIUIaTBc3tkinU3NBmyvWLsjlUQRJ8oNsiLpdV7ErPfjG9KwVGVd8MbxgEbEzeiz0f3e1b7hioMVDLJ5KUaNgob", isPrimary: true }] },
              { id: "f3", slug: "shop", title: "Omega Fish", description: "Omega-rich. For coat, joints, and brain.", price: "549", images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAeMN5mdW7jRDF8rEtwJgRIxt9V4q2uyRXFYfp7Sabgr3gkUdiTtTvK6Jymo2zPGYRLw74UtpKMPqTkcU4jvQSZB2N-I4Tn-8Mq5ico5ONGP1AZouqgByGMUGHucM-NVbIgkJD3SK2cOa7EvTx3mkKYHV9utTy-Du1hDv6-bJHt3sPVgk-nX-8HMaI40RIU2pXY5NdbJgCaWZI6nYSeyT41YDTxXO3CJKmjTHR7YsOJ0aAwVkUdyRMfGn19VzaiZGxlE0AGxIQ9QmS", isPrimary: true }] },
            ].map((product, i) => (
              <EditorialProductCard key={product.id} product={product} index={i} onAddToCart={() => navigate("/shop")} />
            ))}
          </div>
        )}
      </main>

      {/* ── Ads: listing-products bottom (After Products Gallery) ── */}
      <AdBannerStrip banners={bs("listing-products", "bottom")} />

      {/* ── Interstitial Banner ───────────────────────────── */}
      {s.interstitialBanner.visible && (
        <section className="relative w-full flex items-center justify-start overflow-hidden" style={{ height: "80vh" }}>
          <img src={s.interstitialBanner.imageUrl} alt="Interstitial" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
          <div className="relative z-10 w-full px-5 md:px-[64px] text-left">
            <span className="font-inter block mb-4" style={{ fontSize: "18px", letterSpacing: "0.8em", color: C.primary, fontWeight: 700, textTransform: "uppercase" }}>
              {s.interstitialBanner.label}
            </span>
            <h2 className="font-playfair leading-tight" style={{ fontSize: "clamp(48px,8vw,96px)", color: C.primary, fontWeight: 700 }}>
              {s.interstitialBanner.title}{" "}<br />
              <i className="italic" style={{ fontFamily: "Playfair Display, serif" }}>{s.interstitialBanner.titleItalic}</i>
            </h2>
            <div className="mt-12 flex gap-12 items-start">
              <div className="w-px h-24" style={{ backgroundColor: `${C.primary}4D` }} />
              <p className="font-inter max-w-md" style={{ fontSize: "20px", color: C.primary, fontWeight: 300, lineHeight: 1.7 }}>
                {s.interstitialBanner.body}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Ads: listing-biryani top (Before Biryani Section) ── */}
      <AdBannerStrip banners={bs("listing-biryani", "top")} />

      {/* ── 4. Biryani Collection ─────────────────────────── */}
      {s.biryaniSection.visible && (
        <section className="py-[80px] overflow-hidden relative" style={{ backgroundColor: C.primary }}>
          <div className="px-5 md:px-[64px] mb-[80px] relative z-10">
            <h2 className="font-playfair mb-6" style={{ fontSize: "clamp(48px,7vw,84px)", fontWeight: 700, color: C.white }}>
              {s.biryaniSection.title}
            </h2>
            <p className="font-inter max-w-4xl mb-12" style={{ fontSize: "clamp(16px,2vw,24px)", color: `${C.white}CC`, fontWeight: 300, lineHeight: 1.7 }}>
              {s.biryaniSection.body}
            </p>

            {/* Spice pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
              {s.biryaniSection.spices.map((spice, i) => (
                <div key={i} className="p-10 border" style={{ backgroundColor: `${C.white}0D`, borderColor: `${C.white}1A` }}>
                  <h4 className="font-inter mb-4 uppercase" style={{ fontSize: "18px", letterSpacing: "0.3em", color: C.secondaryContainer, fontWeight: 700 }}>
                    {spice.name}
                  </h4>
                  <p className="font-inter" style={{ color: `${C.white}B3`, fontWeight: 300, lineHeight: 1.7 }}>{spice.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Biryani product cards — live API products when available, static fallback otherwise */}
          {(() => {
            const liveItems = biryaniProducts.map((p: any) => ({
              _isLive: true,
              _product: p,
              imageUrl: getProductImage(p),
              title: p.title,
              label: "Biryani Collection",
              desc: p.description
                ? p.description.replace(/<[^>]+>/g, "").slice(0, 140)
                : "A masterclass in spice and tradition — crafted for the wolf within.",
              ctaHref: `/product/${p.slug || "shop"}`,
              price: p.salePrice || p.price,
            }));
            const displayItems = liveItems.length > 0 ? liveItems : s.biryaniSection.products.map((x: any) => ({ ...x, _isLive: false }));
            return (
              <div className="space-y-16 md:space-y-48 px-5 md:px-[64px] relative z-10">
                {displayItems.map((item: any, i: number) => {
                  const reversed = i % 2 === 0;
                  return (
                    <div key={i} className={`flex flex-col ${reversed ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-24`}>
                      <div className="w-full md:w-3/5">
                        <div className="p-4" style={{ backgroundColor: C.white, boxShadow: `40px 40px 0px 0px ${C.secondary}99` }}>
                          <img src={item.imageUrl} alt={item.title} className="w-full object-cover" style={{ aspectRatio: "4/5" }} loading="lazy" />
                        </div>
                      </div>
                      <div className={`w-full md:w-2/5 space-y-10 ${reversed ? "md:text-right" : ""}`}>
                        <div>
                          <span className="font-inter block mb-4" style={{ fontSize: "11px", letterSpacing: "0.5em", color: C.secondaryContainer, fontWeight: 700, textTransform: "uppercase" }}>
                            {item.label}
                          </span>
                          <h3 className="font-playfair mb-6 uppercase" style={{ fontSize: "clamp(40px,5vw,64px)", color: C.white, fontWeight: 700 }}>
                            {item.title}
                          </h3>
                          {item._isLive && item.price && (
                            <p className="font-inter mb-4" style={{ fontSize: "20px", color: C.secondaryContainer, fontWeight: 600 }}>
                              ₹{parseFloat(item.price).toFixed(2)}
                            </p>
                          )}
                          <p className="font-playfair italic" style={{ fontSize: "clamp(18px,2vw,24px)", color: `${C.white}B3`, lineHeight: 1.6 }}>
                            "{item.desc}"
                          </p>
                        </div>
                        <div className={`flex flex-wrap gap-6 pt-10 ${reversed ? "md:justify-end" : ""}`}>
                          <button
                            className="font-inter uppercase px-16 py-5 transition-all cursor-pointer"
                            style={{ fontSize: "13px", letterSpacing: "0.1em", fontWeight: 700, backgroundColor: C.secondary, color: C.white }}
                            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.white; (e.currentTarget as HTMLButtonElement).style.color = C.primary; }}
                            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.secondary; (e.currentTarget as HTMLButtonElement).style.color = C.white; }}
                            onClick={() => navigate(item.ctaHref || "/shop")}
                          >
                            ACQUIRE SPECIMEN
                          </button>
                          {item._isLive && (
                            <button
                              className="font-inter uppercase px-16 py-5 border transition-all cursor-pointer flex items-center justify-center gap-2"
                              style={{ fontSize: "13px", letterSpacing: "0.1em", fontWeight: 700, borderColor: C.white, color: C.white, backgroundColor: "transparent" }}
                              onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.white; (e.currentTarget as HTMLButtonElement).style.color = C.primary; }}
                              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = C.white; }}
                              onClick={() => handleAddToCart(item._product)}
                            >
                              <ShoppingCart className="w-4 h-4" /> ADD TO CART
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>
      )}

      {/* ── Ads: listing-biryani bottom (After Biryani Section) ── */}
      <AdBannerStrip banners={bs("listing-biryani", "bottom")} />

      {/* ── Video Section 2 ───────────────────────────────── */}
      {s.video2.visible && (
        <VideoSection imgSrc={s.video2.imageUrl} label={s.video2.label} title={s.video2.title} />
      )}

      {/* ── Ads: listing-cta top (Before Final CTA) ───────── */}
      <AdBannerStrip banners={bs("listing-cta", "top")} />

      {/* ── 5. Final CTA ──────────────────────────────────── */}
      <section className="py-[80px] flex flex-col items-center text-center px-6 border-b" style={{ backgroundColor: "#f9faf6", borderColor: C.outlineVariant }}>
        <h2 className="font-playfair mb-16 leading-tight" style={{ fontSize: "clamp(56px,9vw,100px)", color: C.primary, fontWeight: 700 }}>
          {s.cta.headline}{" "}<br />
          <i className="italic" style={{ fontFamily: "Playfair Display, serif" }}>{s.cta.headlineItalic}</i>
        </h2>
        <div className="flex flex-col sm:flex-row gap-10">
          <button
            onClick={() => navigate(s.cta.cta1Href || "/shop")}
            className="font-inter uppercase px-16 py-6 transition-all cursor-pointer"
            style={{ fontSize: "11px", letterSpacing: "0.15em", fontWeight: 700, backgroundColor: C.primary, color: C.white }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = C.secondary)}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = C.primary)}
          >
            {s.cta.cta1Text}
          </button>
          <button
            onClick={() => navigate(s.cta.cta2Href || "/shop")}
            className="font-inter uppercase px-16 py-6 border transition-all cursor-pointer"
            style={{ fontSize: "11px", letterSpacing: "0.15em", fontWeight: 700, borderColor: C.primary, color: C.primary, backgroundColor: "transparent" }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primary; (e.currentTarget as HTMLButtonElement).style.color = C.white; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = C.primary; }}
          >
            {s.cta.cta2Text}
          </button>
        </div>
      </section>

      {/* ── Ticker Band ───────────────────────────────────── */}
      <TickerBand items={s.ticker.items} />

      <EditorialFooter footer={footer} />
    </div>
  );
}
