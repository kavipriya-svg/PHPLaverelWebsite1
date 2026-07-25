import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, FlaskConical, Award, Ban, Leaf } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { HomeEditorialHeader as EditorialHeader, HomeEditorialFooter as EditorialFooter } from "@/components/store/HomeEditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";

// ─── Color tokens ────────────────────────────────────────────────────
const C = {
  primary:            "#012d1d",
  secondary:          "#944923",
  white:              "#ffffff",
  surface:            "#f9faf6",
  surfaceContainerLow:"#f3f4f0",
  surfaceContainer:   "#eeeeeb",
  surfaceContainerHigh:"#e8e8e5",
  outlineVariant:     "#c1c8c2",
  outline:            "#717973",
  onSurface:          "#1a1c1a",
  onSurfaceVariant:   "#414844",
  mint:               "#a5d0b8",
  primaryFixed:       "#c0edd4",
};

// ─── Typography shortcuts ────────────────────────────────────────────
const PLAYFAIR: React.CSSProperties = { fontFamily: "Playfair Display, serif" };
const INTER: React.CSSProperties    = { fontFamily: "Inter, sans-serif" };
const LABEL_CAPS: React.CSSProperties = {
  ...INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase",
};

// ─── Hard-paper shadow ───────────────────────────────────────────────
const HARD_SHADOW = "40px 40px 0px 0px rgba(1,45,29,0.15)";

// ─── Protein Specimens (static catalogue) ───────────────────────────
const SPECIMENS = [
  { id: 1, name: "CHICKEN",  img: "https://images.unsplash.com/photo-1587593810167-a84920ea084d?auto=format&fit=crop&q=80&w=400", alt: "Chicken Specimen" },
  { id: 2, name: "DUCK",     img: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=400", alt: "Duck Specimen" },
  { id: 3, name: "TURKEY",   img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&q=80&w=400", alt: "Turkey Specimen" },
  { id: 4, name: "RABBIT",   img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=400", alt: "Rabbit Specimen" },
  { id: 5, name: "MUTTON",   img: "https://images.unsplash.com/photo-1602491951780-030597db7a27?auto=format&fit=crop&q=80&w=400", alt: "Mutton Specimen" },
  { id: 6, name: "FISH",     img: "https://images.unsplash.com/photo-1534604973900-c41ab4c5e636?auto=format&fit=crop&q=80&w=400", alt: "Fish Specimen" },
  { id: 7, name: "SQUID",    img: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=400", alt: "Squid Specimen" },
  { id: 8, name: "QUAIL",    img: "https://images.unsplash.com/photo-1612170153139-6f881ff067e0?auto=format&fit=crop&q=80&w=400", alt: "Quail Specimen" },
];

// ─── Differentiation features ────────────────────────────────────────
const FEATURES = [
  { icon: <Leaf size={32} />,        title: "Exotic Whole-Prey",         body: "Rare proteins sourced from ethical habitats to prevent allergen development." },
  { icon: <FlaskConical size={32} />, title: "Ancient Formula",           body: "Replicating the exact macronutrient ratios of the wild canine diet." },
  { icon: <Award size={32} />,        title: "Human-Grade",               body: "Sourced and prepared in facilities that meet human consumption standards." },
  { icon: <Ban size={32} />,          title: "No Fillers",                body: "Zero starch, zero grain, zero synthetics. Pure biological fuel for movement." },
];

// ─── Editorial product data (used when live API products are absent) ─
const FALLBACK_PRODUCTS = [
  {
    id: -1, name: "Dehydrated Chicken", tag: "Low fat, high protein", taxClass: "Aves",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWKA-c9gG1nPikBxyUUzziMVSDmxwcfNB1L8kP9mXoe4d00fUsLzWGwcuCWmDpcQ8J4nvFk9egVQ-S5-P9_JJ1-1d70MHmzSboTog1L97YeVHayCTzRKBEpULSArwXcmhzK_mH8mJOHTvd1wkySJeTvxsHFkZHPBor4cx4M2Pc3q46dVwzpOTlyFVAybMKQod3jKVF-a-FtVspsNLJDa02CO_Z4lGBQ7sJeElI0A_ts-8-LhmgescBUOvWiyQlozXb0rhrrn2Qgq7w",
    price: 2400, nutrients: [{ k: "IRON", v: "0.8mg/100g" }, { k: "COPPER", v: "0.1mg/100g" }, { k: "OMEGA-3", v: "0.2g/100g" }],
  },
  {
    id: -2, name: "Dehydrated Duck", tag: "Anti-inflammatory fuel", taxClass: "Anseriformes",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDp78tpMZTw7bHudNJUve6NRqyu3XmoqQPq2Z7WSf3hYszUfOXISRUFc7fPWH8Z0PAwxJZ8nA2NRmCD648YQzcrA-HVpmeHKsrBAUTNyqaGcFC4y-IZ--TX4LcWhI64SQvETDMposMZAlGUz6su9vVj-Bl20n_ssfA1BlBBs-Sdl16kZFZwaDsNDcCW3PBbyQgelz0lye3PVf3E_N0I6PKTgG7_bWCiSOOyCTrx4NIcPW_oa-CeOV8HZAvbTR4xg3zHRTObfbh68Ruj",
    price: 2800, nutrients: [{ k: "IRON", v: "2.4mg/100g" }, { k: "COPPER", v: "0.4mg/100g" }, { k: "OMEGA-3", v: "0.6g/100g" }],
  },
  {
    id: -3, name: "Dehydrated Rabbit", tag: "Hypoallergenic Lean", taxClass: "Mammalia",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEHcwHcqmwOWww-Wgyzyusk46msqKLhYunFbtUHbyYDS_CoOc-n4dwqODNQFG32iMTbrKeq8dDOi9YkDaNsWIZEoTxq2XhJiRbR_iIEwGhQ40SZqPsuOIsLcQRmROHH-57V3Lngsuqzp6Ku_h77qUdkKFKs6x8Ow1cLdYiTz8OJzwmF6JffZQVrQtXKrfjnME4HTKOLCiMRO2sJUhN7DXUn4C73_S0GZZ9p2mz0-FpogwKJiRshwuTVGkcAGP-uqVSj2S8Ds3Oyn6Z",
    price: 3400, nutrients: [{ k: "IRON", v: "3.2mg/100g" }, { k: "ZINC", v: "1.8mg/100g" }, { k: "OMEGA-3", v: "0.4g/100g" }],
  },
  {
    id: -4, name: "Dehydrated Squid", tag: "Amino Acid Powerhouse", taxClass: "Cephalopoda",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQGHBO4XptAxG7GyzYAIRe-gN5M5_zom2ammwipQ3CzUTtaPNAzdKQ9ymS7zjMK9pwsqBunPzL7Tbmc8bgR-z_rrLbzCT4z2nbgtGeqiF5M-qkQJwNuGFhojC7Txgfrb-iZHKEYO39YKLh1dnxgWG_pW4gSnCkJv5UHVFaYluRlru9il0j3MVw1a9GIHjvUfsZetfEOTB4spqHYUe4MARRaadWApLwzGTG2z3VngmG1YhbhqgJAqTKi9n4AR23sNpJFfkLEvqbucsEqc",
    price: 3200, nutrients: [{ k: "TAURINE", v: "High Potency" }, { k: "VIT B12", v: "4.2μg/100g" }, { k: "OMEGA-3", v: "1.1g/100g" }],
  },
];

// ─── Wolf Principle image ─────────────────────────────────────────────
const WOLF_PRINCIPLE_IMG = "https://lh3.googleusercontent.com/aida-public/AB6AXuBgBY6X9hMEmx-6cY9l1HHMcjYd1ySVobZbXvhSq0SS059zVSRB_1Ih2QD0vypAGRyFyPRiF6bdLe4NkKTPWrCSkg17FhS6vBIqp9Mvb3jez5qCj2FkL6k_CO-LvKEttNoryCnHXAhoKuTnZ_XWpg_V0dFNsTbyDVDEYx007D5TiN37LXMRfzGZpVCMvcPpLLIN09uUKXTyp-GU4ACT-ntk3luDBcZG6TqHUkLpw0h77LqGuyImWMfZ27SEKrcAsKh-gM2Xi7jmn9qU";
const HERO_BG = "https://lh3.googleusercontent.com/aida-public/AB6AXuAUn_hVD3r5envYKatWZHyrXqmRGMXgWos-rZ9CIEUd7by6LWTyz6m_eVlwa-OAqECopq1jr5cL6OUvY_08xnsTLYqm22Xt3yMB0QOk25LtvmNUIzaDiYeAbBVWDCnSxhA-CofyJU5AGOoTD52eE_2oCAwqdZOEngqew2WIbXsPTCUCDwOj8bZxNT7g08YiEUF5hArQ_Sx8UrH3LffDWJoy3WmJbeh4ErpoOv3ndVA3CYbPxqTfNDzQo5LMFlwOYdrXEUYvhNlUiAfZ";

// ─── Format currency ─────────────────────────────────────────────────
function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

// ─── Specimen circle ─────────────────────────────────────────────────
function SpecimenCircle({ specimen, index }: { specimen: typeof SPECIMENS[0]; index: number }) {
  return (
    <div className="flex flex-col items-center group cursor-pointer">
      <div
        className="w-full aspect-square rounded-full overflow-hidden mb-4 transition-all duration-500"
        style={{
          border: `1px solid ${C.outlineVariant}`,
          transition: "border-color 0.5s, transform 0.5s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = C.primary;
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1.05)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = C.outlineVariant;
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
        }}
      >
        <img
          src={specimen.img}
          alt={specimen.alt}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ filter: "grayscale(100%)", transition: "filter 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)" }}
          onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.filter = "grayscale(0%)"}
          onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.filter = "grayscale(100%)"}
        />
      </div>
      <span style={{ ...LABEL_CAPS, fontSize: 10, color: C.outline, display: "block", marginBottom: 4 }}>
        SPECIMEN {String(index + 1).padStart(2, "0")}
      </span>
      <span style={{ ...LABEL_CAPS, color: C.primary, letterSpacing: "0.15em" }}>{specimen.name}</span>
    </div>
  );
}

// ─── Feature card ────────────────────────────────────────────────────
function FeatureCard({ feature }: { feature: typeof FEATURES[0] }) {
  return (
    <div
      className="bg-white p-10 transition-transform duration-500 hover:-translate-y-2"
      style={{ boxShadow: HARD_SHADOW, color: C.onSurface }}
    >
      <div style={{ color: C.primary, marginBottom: 24 }}>{feature.icon}</div>
      <h3 style={{ ...PLAYFAIR, fontSize: 24, fontWeight: 600, color: C.onSurface, marginBottom: 16 }}>
        {feature.title}
      </h3>
      <p style={{ ...INTER, fontSize: 16, color: C.onSurfaceVariant, lineHeight: 1.6 }}>{feature.body}</p>
    </div>
  );
}

// ─── Editorial product card ──────────────────────────────────────────
interface EditorialProduct {
  id: number;
  name: string;
  tag: string;
  taxClass: string;
  img: string;
  price: number;
  slug?: string;
  nutrients: { k: string; v: string }[];
}

function EditorialProductCard({
  product,
  onAddToCart,
}: {
  product: EditorialProduct;
  onAddToCart: (id: number) => void;
}) {
  const [, navigate] = useLocation();
  return (
    <div className="grid items-stretch group" style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 24 }}>
      {/* Image */}
      <div className="overflow-hidden relative" style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1)" }}
          onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.1)"}
          onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"}
        />
        <div
          className="absolute top-4 left-4 px-3 py-1"
          style={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", ...LABEL_CAPS, fontSize: 10, color: C.primary }}
        >
          Class: {product.taxClass}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between py-4">
        <div>
          <h3 style={{ ...PLAYFAIR, fontSize: 28, fontWeight: 600, color: C.onSurface, marginBottom: 8 }}>
            {product.name}
          </h3>
          <p style={{ ...LABEL_CAPS, color: C.secondary, marginBottom: 16 }}>{product.tag}</p>

          {/* Biological profile */}
          <div
            className="mb-6 p-4"
            style={{ backgroundColor: C.surfaceContainer, borderLeft: `2px solid ${C.primary}` }}
          >
            <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.outline, marginBottom: 8 }}>Biological Profile</p>
            <ul className="space-y-1">
              {product.nutrients.map(n => (
                <li key={n.k} className="flex justify-between" style={{ fontSize: 11, fontWeight: 700, ...INTER }}>
                  <span style={{ color: C.onSurfaceVariant }}>{n.k}</span>
                  <span style={{ color: C.onSurface }}>{n.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          {product.id > 0 ? (
            <button
              onClick={() => onAddToCart(product.id)}
              className="w-full py-4 transition-all"
              style={{ backgroundColor: C.primary, color: C.white, ...LABEL_CAPS }}
              data-testid={`btn-add-to-cart-${product.id}`}
            >
              Add to Cart — {fmt(product.price)}
            </button>
          ) : (
            <button
              className="w-full py-4 transition-all"
              style={{ backgroundColor: C.primary, color: C.white, ...LABEL_CAPS }}
            >
              Add to Cart — {fmt(product.price)}
            </button>
          )}
          <button
            onClick={() => product.slug && navigate(`/product/${product.slug}`)}
            className="w-full py-4 transition-all"
            style={{
              border: `1px solid ${C.primary}`, color: C.primary, backgroundColor: "transparent",
              ...LABEL_CAPS,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primary;
              (e.currentTarget as HTMLButtonElement).style.color = C.white;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = C.primary;
            }}
          >
            View Specimen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function DogTreat() {
  const { toast } = useToast();
  const { addToCart } = useStore();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const heroBgRef = useRef<HTMLDivElement>(null);

  // ── Fetch settings (nav + footer) ──────────────────────────────
  const { data: rawSettings } = useQuery<any>({
    queryKey: ["/api/settings/homepage"],
  });
  const settings = mergeHomepageSettings(rawSettings ?? {});
  const nav    = (settings as any).nav    ?? DEFAULT_HOMEPAGE_SETTINGS.nav;
  const footer = (settings as any).footer ?? DEFAULT_HOMEPAGE_SETTINGS.footer;

  // ── Fetch treat products from API ──────────────────────────────
  const { data: apiProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products", { limit: 8 }],
    queryFn: () => fetch("/api/products?limit=8").then(r => r.json()),
  });

  // ── Parallax hero on scroll ────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      if (heroBgRef.current) {
        heroBgRef.current.style.transform = `translateY(${window.scrollY * 0.4}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Map API products → editorial format ────────────────────────
  const mapProduct = (p: any, idx: number): EditorialProduct => {
    const imgs = p.images ?? [];
    const img  = imgs.find((i: any) => i.isPrimary)?.imageUrl ?? imgs[0]?.imageUrl ?? FALLBACK_PRODUCTS[idx % 4].img;
    return {
      id:        p.id,
      name:      p.name,
      tag:       p.shortDescription ?? p.category?.name ?? "Single-source protein",
      taxClass:  p.category?.name ?? "Specimen",
      img,
      price:     Number(p.salePrice || p.price) * 100,
      slug:      p.slug,
      nutrients: [
        { k: "PROTEIN",  v: p.protein  ? `${p.protein}g/100g`  : "High" },
        { k: "FAT",      v: p.fat      ? `${p.fat}g/100g`      : "Low"  },
        { k: "MOISTURE", v: p.moisture ? `${p.moisture}%`      : "<12%" },
      ],
    };
  };

  const displayProducts: EditorialProduct[] = apiProducts.length >= 4
    ? apiProducts.slice(0, 4).map(mapProduct)
    : FALLBACK_PRODUCTS;

  // ── Add to cart ────────────────────────────────────────────────
  const handleAddToCart = (productId: number) => {
    if (productId < 0) return;
    addToCart(productId, 1);
    toast({ title: "Added to cart", description: "Item added to your cart." });
  };

  return (
    <div style={{ backgroundColor: C.surface, color: C.onSurface, fontFamily: "Inter, sans-serif" }}>
      <EditorialHeader nav={nav} />

      {/* ══════════════════════════════════════════════════════════
          1. HERO
         ══════════════════════════════════════════════════════════ */}
      <section className="relative flex items-center overflow-hidden" style={{ height: "100vh" }}>
        {/* Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0 z-10"
            style={{ backgroundColor: "rgba(1,45,29,0.40)" }}
          />
          <div
            ref={heroBgRef}
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${HERO_BG}')`, willChange: "transform" }}
          />
        </div>

        {/* Headline */}
        <div className="relative z-20 px-[64px] max-w-4xl">
          <h1
            style={{
              ...PLAYFAIR,
              fontSize: "clamp(56px,9vw,84px)",
              fontWeight: 700,
              color: C.surface,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 24,
            }}
          >
            Feed the Wolf.
          </h1>
          <p
            style={{
              ...INTER,
              fontSize: 18,
              fontWeight: 300,
              color: "rgba(249,250,246,0.9)",
              marginBottom: 40,
              maxWidth: 560,
              lineHeight: 1.6,
            }}
          >
            19 DOGS is species-appropriate, human-grade, whole-prey nutrition. Designed for the domestic athlete.
          </p>
          <div className="flex gap-6 flex-wrap">
            <button
              onClick={() => navigate("/shop")}
              className="transition-all"
              style={{ backgroundColor: C.primary, color: C.white, ...LABEL_CAPS, padding: "20px 40px" }}
              data-testid="btn-hero-shop"
            >
              Shop Wild &amp; Exotic Range
            </button>
            <button
              className="transition-all"
              style={{ border: `1px solid ${C.white}`, color: C.white, ...LABEL_CAPS, padding: "20px 40px" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}
            >
              Our Science
            </button>
          </div>
        </div>

        {/* Location tag */}
        <div
          className="absolute z-20"
          style={{ bottom: 64, right: 64, color: C.surface, borderLeft: "1px solid rgba(255,255,255,0.3)", paddingLeft: 24, paddingTop: 8, paddingBottom: 8 }}
        >
          <p style={{ ...LABEL_CAPS, opacity: 0.6, marginBottom: 4 }}>Current Expedition</p>
          <p style={{ ...PLAYFAIR, fontSize: 18, color: C.surface }}>Boreal Forest, Canada</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          2. PROTEIN LIBRARY
         ══════════════════════════════════════════════════════════ */}
      <section
        className="border-b"
        style={{ backgroundColor: C.surface, borderColor: C.outlineVariant, padding: "80px 64px" }}
      >
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ ...PLAYFAIR, fontSize: "clamp(36px,5vw,48px)", fontWeight: 600, color: C.onSurface, marginBottom: 16 }}>
            The Protein Library
          </h2>
          <p style={{ ...INTER, fontSize: 16, color: C.onSurfaceVariant, maxWidth: 480 }}>
            A comprehensive index of biological fuel sources, categorized by species and nutrient density.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8">
          {SPECIMENS.map((specimen, i) => (
            <SpecimenCircle key={specimen.id} specimen={specimen} index={i} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. WOLF PRINCIPLE (editorial split)
         ══════════════════════════════════════════════════════════ */}
      <section
        className="grid grid-cols-12 gap-6 items-center"
        style={{ padding: "80px 64px" }}
      >
        {/* Left: text */}
        <div className="col-span-12 lg:col-span-5">
          <span style={{ ...LABEL_CAPS, color: C.secondary, display: "block", marginBottom: 16 }}>
            Foundational Biology
          </span>
          <h2 style={{ ...PLAYFAIR, fontSize: "clamp(36px,5vw,48px)", fontWeight: 600, color: C.onSurface, marginBottom: 32, lineHeight: 1.2 }}>
            The Wolf Principle.
          </h2>
          <p style={{ ...INTER, fontSize: 18, fontWeight: 300, color: C.onSurfaceVariant, marginBottom: 24, lineHeight: 1.7 }}>
            Despite centuries of domestication, the canine digestive system remains 99.9% genetically identical to its wild ancestor. They aren't designed for starch and processed grains; they demand the nutrient density found only in whole-prey protein.
          </p>

          {/* Data rows */}
          <div className="space-y-4">
            {[
              ["Genetic Divergence",    "0.1% Total"],
              ["Protein Bioavailability","High-Grade (Prey)"],
              ["Enzymatic Activity",    "Protease Focused"],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-end pb-2" style={{ borderBottom: `1px solid ${C.outlineVariant}` }}>
                <span style={{ ...LABEL_CAPS, color: C.outline }}>{label}</span>
                <span style={{ ...LABEL_CAPS, color: C.primary }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: editorial image */}
        <div className="col-span-12 lg:col-span-6 lg:col-start-7">
          <div className="relative" style={{ cursor: "default" }}>
            <div
              className="overflow-hidden"
              style={{ aspectRatio: "4/5", boxShadow: HARD_SHADOW }}
              onMouseEnter={e => {
                const img = (e.currentTarget as HTMLDivElement).querySelector("img");
                if (img) { img.style.filter = "grayscale(0%)"; img.style.transform = "scale(1.05)"; }
              }}
              onMouseLeave={e => {
                const img = (e.currentTarget as HTMLDivElement).querySelector("img");
                if (img) { img.style.filter = "grayscale(100%)"; img.style.transform = "scale(1)"; }
              }}
            >
              <img
                src={WOLF_PRINCIPLE_IMG}
                alt="Species-appropriate nutrition"
                className="w-full h-full object-cover"
                loading="lazy"
                style={{ filter: "grayscale(100%)", transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)" }}
              />
            </div>
            {/* Pull quote */}
            <div
              className="absolute p-8 max-w-xs"
              style={{ bottom: -32, right: -32, backgroundColor: C.primary, color: C.white }}
            >
              <p style={{ ...LABEL_CAPS, opacity: 0.6, marginBottom: 8 }}>Specimen No. 042</p>
              <p style={{ ...INTER, fontStyle: "italic", fontSize: 14 }}>
                "Optimal health is a byproduct of biological honesty."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          4. WHAT MAKES OUR FOOD DIFFERENT
         ══════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: C.surfaceContainerHigh, padding: "80px 64px" }}>
        <div className="flex justify-between items-end mb-16 flex-wrap gap-6">
          <div>
            <h2 style={{ ...PLAYFAIR, fontSize: "clamp(32px,4vw,48px)", fontWeight: 600, color: C.onSurface, marginBottom: 16 }}>
              What Makes Our Food Different
            </h2>
            <p style={{ ...INTER, fontSize: 16, color: C.onSurfaceVariant, maxWidth: 480 }}>
              Precision engineering meets raw nature. Every ingredient is selected for its molecular contribution to canine vitality.
            </p>
          </div>
          <div className="hidden lg:block" style={{ height: 1, width: "33%", backgroundColor: C.outlineVariant, marginBottom: 24 }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(f => (
            <FeatureCard key={f.title} feature={f} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5. PRODUCT PORTFOLIO
         ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 64px" }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-20 flex-wrap">
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ ...PLAYFAIR, fontSize: "clamp(32px,4vw,48px)", fontWeight: 600, color: C.onSurface, marginBottom: 16 }}>
              The Wild &amp; Exotic Protein Portfolio
            </h2>
            <p style={{ ...INTER, fontSize: 18, fontWeight: 300, color: C.onSurfaceVariant }}>
              A curated collection of dehydrated specimen, preserved at the peak of nutritional integrity.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              className="transition-all"
              style={{ border: `1px solid ${C.outline}`, backgroundColor: C.white, ...LABEL_CAPS, padding: "8px 24px" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.surfaceContainer}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.white}
            >
              Filter by Bio-Type
            </button>
            <button
              onClick={() => navigate("/shop")}
              className="transition-all"
              style={{ backgroundColor: C.primary, color: C.white, ...LABEL_CAPS, padding: "8px 24px" }}
              data-testid="btn-sort-potency"
            >
              Sort by Potency
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-24">
          {displayProducts.map(product => (
            <EditorialProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>

        <div className="mt-24 text-center">
          <button
            onClick={() => navigate("/shop")}
            className="transition-all"
            style={{ ...LABEL_CAPS, color: C.primary, borderBottom: `1px solid ${C.primary}`, paddingBottom: 4 }}
            data-testid="btn-load-more"
          >
            Load Full Specimen Library (Goat, Quail, Prawn, Octopus...)
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          6. QUOTE BANNER
         ══════════════════════════════════════════════════════════ */}
      <section
        className="flex items-center justify-center overflow-hidden relative"
        style={{ minHeight: "60vh", backgroundColor: C.primary, padding: "80px 20px" }}
      >
        <div className="relative z-10 text-center">
          <h2
            style={{
              ...PLAYFAIR,
              fontSize: "clamp(28px,5vw,64px)",
              fontWeight: 700,
              fontStyle: "italic",
              color: C.white,
              maxWidth: 900,
              margin: "0 auto",
              lineHeight: 1.2,
            }}
          >
            "No single protein does it all — that's why we don't rely on just one."
          </h2>
          <p style={{ ...LABEL_CAPS, color: C.mint, marginTop: 32, letterSpacing: "0.4em" }}>
            Biological Diversity is Key
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7. JOIN THE PACK / CTA
         ══════════════════════════════════════════════════════════ */}
      <section
        className="flex flex-col items-center text-center"
        style={{ backgroundColor: C.surface, padding: "80px 64px" }}
      >
        <span style={{ ...LABEL_CAPS, color: C.secondary, marginBottom: 24 }}>Join the Movement</span>
        <h2
          style={{
            ...PLAYFAIR,
            fontSize: "clamp(40px,7vw,84px)",
            fontWeight: 700,
            color: C.onSurface,
            marginBottom: 48,
            maxWidth: 800,
            lineHeight: 1.1,
          }}
        >
          Join the Wolf Pet Movement.
        </h2>
        <p style={{ ...INTER, fontSize: 18, fontWeight: 300, color: C.onSurfaceVariant, marginBottom: 64, maxWidth: 520, lineHeight: 1.7 }}>
          Ready to transition your dog to biological precision? Start with our introductory specimen pack.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-grow bg-transparent px-4 py-4 focus:outline-none transition-all"
            style={{ borderBottom: `2px solid ${C.outlineVariant}`, ...INTER, fontSize: 16 }}
            onFocus={e => (e.currentTarget as HTMLInputElement).style.borderBottomColor = C.primary}
            onBlur={e => (e.currentTarget as HTMLInputElement).style.borderBottomColor = C.outlineVariant}
            data-testid="input-newsletter-email"
          />
          <button
            onClick={() => navigate("/shop")}
            className="whitespace-nowrap transition-all"
            style={{ backgroundColor: C.primary, color: C.white, ...LABEL_CAPS, padding: "16px 40px" }}
            data-testid="btn-newsletter-shop"
          >
            Shop Now
          </button>
        </div>

        <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.outline, marginTop: 32 }}>
          Exclusive access to rare protein drops and veterinary white papers.
        </p>
      </section>

      <EditorialFooter footer={footer} />
    </div>
  );
}
