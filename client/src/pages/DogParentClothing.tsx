import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import {
  HomeEditorialHeader as EditorialHeader,
  HomeEditorialFooter as EditorialFooter,
} from "@/components/store/HomeEditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";
import { ArrowRight, SlidersHorizontal } from "lucide-react";

// ─── Color tokens (matches design system) ────────────────────────────────────
const C = {
  primary:             "#012d1d",
  secondary:           "#944923",
  white:               "#ffffff",
  surface:             "#f9faf6",
  surfaceContainer:    "#eeeeeb",
  surfaceContainerLow: "#f3f4f0",
  surfaceContainerHigh:"#e8e8e5",
  surfaceContainerLowest:"#ffffff",
  outlineVariant:      "#c1c8c2",
  outline:             "#717973",
  onSurface:           "#1a1c1a",
  onSurfaceVariant:    "#414844",
  primaryContainer:    "#012d1d",
  secondaryContainer:  "#fe9e71",
  secondaryFixed:      "#ffdbcc",
  primaryFixed:        "#c0edd4",
  primaryFixedDim:     "#a5d0b8",
};

const PLAYFAIR: React.CSSProperties = { fontFamily: "Playfair Display, serif" };
const INTER: React.CSSProperties    = { fontFamily: "Inter, sans-serif" };
const MONO: React.CSSProperties     = { fontFamily: "'Courier New', Courier, monospace" };
const LABEL_CAPS: React.CSSProperties = {
  ...INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase",
};
const HARD_SHADOW = "40px 40px 0px 0px rgba(1, 45, 29, 0.15)";

// ─── Static editorial images (from design) ────────────────────────────────────
const HERO_IMG = "https://lh3.googleusercontent.com/aida-public/AB6AXuCkZL5GN_QMWkxCmU1G9UeEGZcfXS4gd_xQnFb-u2U1UhgFOqTq6sGhlk0W8a2YiP_9n5W-6VCj-sBF3RJKQ-MQo5C5yC8HsZmJhwWuMPmjuNXaGKrWbvBJgI1hP-L9Zd3AomCiJYiItmFV8kFEP14MvFBbPi-3v0_1YuDqRb9p4PCDQ3xdq20L1bY-7Fce50rSNKjjd_K-KzFsHyR1Mky-P8QKrYe6j7TwuPdPHHGHEKnkxwJxNcT0jMtI_iOMwW_rP0lFlasb";

const SERIES02_PRODUCTS = [
  {
    id: "APEX-TS-001",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4aCtkjWSxvyBKnAcgA3H2941kOkjgUSbVsY_C8Xnk6iWfvda414DeQJoc7gLQ_fIudHKBBtTu6XJC9YO9W-rl7AM-tDk7WZ8e8vBVNzgYDdtazRqtWbOHhqAYjUW2Zh98rozWzQUWzzcOh2XtrJ3FY6lQ48cLCQMDNoTKNqgEldeXm5P8dyPCZhgJ0wLE6KVCt292sLZ2ZeGbmkxFO6w-d76J2r6nXTF7gD3QTon5cHXF6oW4wKebEci3e4NJN9DYZfyPOi_HjJeI",
    name: "Apex Sync T-Shirt Set",
    price: "$840.00",
    tag: "CANINE + HUMAN DUAL SYSTEM",
    biometric: 92,
    thermal: 75,
    slug: null,
  },
  {
    id: "LATT-PL-014",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeCDRtZ2u4qEfuWze3m1w_WzsnY2HroHWVS-BuQaZfN1v8zs9WxmySwuhtGzhNUfFz45bUxbVg_y8yLeBNGrS_y8aQpExhuAKs6W-biLstm5q04l-tISfrH02VnEBPA_i9EaMRv7xrsPMTrqO6rHphm_OYF9hOrFKPTxIo85LgFEytDQQl0aS-Upw5tE1G8blzYbYp3YwRxnsSRCPPwCL3ssqz9hopgd-r5tugVWzgQO51waAbri7NePn8Ow6zzzXb9fJIoeRyOBq4",
    name: "Thermal Lattice Polo",
    price: "$1,120.00",
    tag: "ADVANCED ENVIRONMENTAL SHIELD",
    biometric: 88,
    thermal: 98,
    slug: null,
  },
  {
    id: "GRPH-TK-092",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlXVsJra3pdkpz1qhQF0Hsg58KRWBX8d-XgECBgfqpbPrKzyWCcOZG1bm7MwbF7pOoFPeMlnJ8lIlGAK_iAo0gNlASTa152XjvudpB4t1HiLfH-3d2hNkPQQOu6vyigaRS5lLxCgH5i2sXnPuUclCqin6oNjX05b7g_KsP8PuDPHfZWhxdKLWIRyZWTHg4DM9IQ-5C8YpKmAwjfSO0XNRsPp6AfN-aWrCK7AQuEAqMa8BFRTg6pRJIs9mNlPCboKlcvDrQAKh1_myT",
    name: "Graphene Urban Tank",
    price: "$650.00",
    tag: "TACTICAL CITY PROTECTION",
    biometric: 65,
    thermal: 82,
    slug: null,
  },
  {
    id: "K9-SYN-SH-004",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkgJ93TAi4nqacsHYV6TQDlGtRJHIcsv0fw6x9W35hDyxoBYTnhv1BvZ02qge1bGBOuC5Ad_vi3SGeRsKvf57CoezGNnbX6eNS-AQy__6mBFOuIz_Mn2zFZQG4bKWoA9udBvliPpMtnQtw6W_kC1qMNUEv83ydcFDUPhM86bHXW8Ei1xnJhHmIiyd0jSTpZphMBmuIqKirhm8rVM3EMuGyTufJCxuasDeZ0KuNU8gv-C5pI2_JYunWmRddgudzoeqGtNwAj5k3PHTk",
    name: "Synergy Field Shirt",
    price: "$920.00",
    tag: "REINFORCED EXTERIOR SHELL",
    biometric: 85,
    thermal: 90,
    slug: null,
  },
];

const SERIES03_PRODUCTS = [
  {
    id: "OB-NEX-DR-007",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFESqhEP2Zayq6cEZYferDV66JULFvqcOuuTO9sXUu-rkLwsDKTGv1FlLAFnkOah05OfZ5eKkAgN0JANMr7uGOL_jHyApihpOVBvg6ZebvPvMdz-sba5iP4wa1I6HY2tkB2USTueExGMpcWnr9CH_efH6Ak7k3WicCXLcgP9-7coHHF_PRR0C4s11LnlkL_stTtU-SGuokHqjVcFZXqFQ1QnqABtbUP1oZZgyNTF8w_LW9ws3Mjiv9CDT6H7D3fVdEI5ZByR0OKFtd",
    name: "Obsidian Nexus Dress",
    price: "$1,250.00",
    tag: "HIGH-ALTITUDE ENVIRONMENTAL ARMOR",
    biometric: 95,
    thermal: 85,
  },
  {
    id: "CRB-PLS-SK-012",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8AvznrObxilYdLKXzWG90TGkCIgn3d5h8e8mW_OtqImJFVdTT7M6vmHB7tBGRs-W7t0ckzXqpXqrXb7nBhbMx8nKn9fImvdRz2CMZF1h8sHJz_7_dRnFqAH9j_IqB_kL0V3JNXV-7MfYE2BUGjxjZ-VvUH4_mW8d0-xsK1E0Fvvp0pL8vSQ1E4Ql6FajSVGWz-1bJW1H3I5n9ZiCBVF2VjTN0W9DJl1Kv6zC53HsNe3hAaHLEo-q2-nFqe1AhfU6V_NJq0H",
    name: "Carbon Pulse Skirt",
    price: "$890.00",
    tag: "REACTIVE HAPTIC SYNCHRONIZATION",
    biometric: 88,
    thermal: 50,
  },
  {
    id: "CBLT-SHD-RM-003",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCBtaEQYQOCNiXA3X2nb6SQ2EyapYw4IL-Rk4BTL9v7SB0zK2HKFWFzSsYYr_ZyBTMXdpAQiwHMciH4oxoueTR7fKT5g6387191lFGpDUNyxYbBsgarZUVBH_Tl7wH7k7n_oSYn8qK2e1UMMsJurd41wWKUg-xFNp9j7AEONUoyj_8eg_4nWvaZyhs27Nawl_qrzwmkxi3ieZX3vUsQrZCX8a6aVqi0khXKPoKQtv1jHzrQS9TOUtHgNwZeWjlnc0NuAfitqUWiDvnj",
    name: "Cobalt Shield Romper",
    price: "$1,400.00",
    tag: "ARCTIC GRADE TACTICAL INSULATION",
    biometric: 92,
    thermal: 100,
  },
  {
    id: "NRL-BRDG-JS-001",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDztCyq5Qy0KuHK0i--Qtnh7QrVy-gKvx_3GZAhRtomMYSK0yb55M03d4_b2hIp6gg6PeKs43a9_Nl7LCmptwrjhiJAUAYtcLb-lUgeh5tLKF326tQCM__gZaufiXriJ_njcWXvwBWZ8AsI6fywtISKbA43K84bdAKjKnz49TdvwOaVH27nyUNs_PACJS6mfOJbbyBuosojC4-1vYhGCARfIMClCj2lQntc9atAp5LGUnHi98ihCtcDv-T8HGs9mwzjGhnaPky2sWqF",
    name: "Neural Bridge Jumpsuit",
    price: "$1,650.00",
    tag: "ULTIMATE SYNC PLATFORM",
    biometric: 100,
    thermal: 95,
  },
];

const FIELD_LOGS = [
  {
    coord: "64.1265° N, 21.8174° W",
    loc: "REYKJAVÍK PERIPHERY",
    status: "OPTIMAL",
    accentColor: C.primary,
    quote: "Testing the Thermal Lattice Shell during a sub-zero coastal patrol. Syncing with my Malinois was instantaneous.",
    name: "COMMANDER ELIAS V.",
    role: "TACTICAL HANDLER // K9 UNIT",
  },
  {
    coord: "34.0522° N, 118.2437° W",
    loc: "L.A. INDUSTRIAL ZONE",
    status: "STABLE",
    accentColor: C.secondary,
    quote: "The Urban Armor breathes unexpectedly well in smoggy, high-humidity corridors.",
    name: "SARAH J. KANE",
    role: "URBAN ATHLETICS DIR.",
  },
  {
    coord: "45.8326° N, 6.8650° E",
    loc: "MONT BLANC SUMMIT LINE",
    status: "CRITICAL SYNC",
    accentColor: C.primary,
    quote: "Ascending at 4000m. The Apex set provided the necessary shield against biting winds.",
    name: "DR. MARCUS THOREN",
    role: "VET-PHYSIOLOGIST",
  },
];

// ─── Metric bar component ────────────────────────────────────────────────────
function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: C.onSurface }}>{label}</span>
      <div className="relative flex-shrink-0" style={{ width: 96, height: 2, backgroundColor: C.outlineVariant }}>
        <div
          className="absolute left-0 top-0 h-full"
          style={{ width: `${value}%`, backgroundColor: C.secondaryContainer }}
        />
      </div>
    </div>
  );
}

// ─── Editorial product card ──────────────────────────────────────────────────
function ProductCard({
  id, img, name, price, tag, biometric, thermal, onAdd,
}: {
  id: string; img: string; name: string; price: string; tag: string;
  biometric: number; thermal: number; onAdd?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="flex flex-col group">
      <div
        className="relative overflow-visible mb-8 transition-transform duration-500"
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
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url('${img}')` }}
        />
        <div
          className="absolute top-4 left-4 px-3 py-1"
          style={{ backgroundColor: C.primary, color: C.white, ...MONO, fontSize: 10, letterSpacing: "0.1em" }}
        >
          ID: {id}
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3
            className="uppercase leading-tight"
            style={{ ...PLAYFAIR, fontSize: 20, fontWeight: 600, color: C.primary }}
          >
            {name}
          </h3>
          <span className="shrink-0" style={{ ...INTER, fontSize: 14, fontWeight: 600, color: C.secondary }}>
            {price}
          </span>
        </div>
        <p
          className="mb-4 tracking-widest"
          style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: C.onSurfaceVariant }}
        >
          {tag}
        </p>
        <div className="space-y-3 mb-6">
          <MetricBar label="BIOMETRIC SYNC" value={biometric} />
          <MetricBar label="THERMAL LEVEL" value={thermal} />
        </div>
        <button
          onClick={onAdd}
          data-testid={`btn-procure-${id}`}
          className="w-full flex justify-between items-center px-6 py-4 transition-all duration-200"
          style={{
            border: `1px solid ${C.primary}`,
            ...LABEL_CAPS,
            color: C.primary,
            backgroundColor: "transparent",
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
          <span>PROCURE SET</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function DogParentClothing() {
  const { toast } = useToast();
  const { addToCart } = useStore();

  // Filter state
  const [specimenType, setSpecimenType] = useState("ALL GENOTYPES");
  const [syncLevel, setSyncLevel] = useState("LEVEL 01: THERMAL");
  const [environment, setEnvironment] = useState("ARCTIC GRADE");

  // Collage hover state
  const [collageHover, setCollageHover] = useState(false);

  // Newsletter email state
  const [email, setEmail] = useState("");

  // Fetch settings for nav/footer
  const { data: rawSettings } = useQuery<any>({
    queryKey: ["/api/settings/homepage"],
  });
  const navSettings = rawSettings
    ? mergeHomepageSettings(rawSettings.settings || {})
    : DEFAULT_HOMEPAGE_SETTINGS;

  // Fetch real products for the twinning/parent-clothing category
  const { data: productsData } = useQuery<any>({
    queryKey: ["/api/products", { categorySlug: "dog-parent-clothing" }],
    queryFn: () =>
      fetch("/api/products?categorySlug=dog-parent-clothing&limit=8").then(r => r.json()),
  });
  const apiProducts: any[] = productsData?.products || [];

  function handleAddToCart(name: string) {
    toast({ title: `${name} added to cart` });
  }

  // Build products shown in Series 02 grid: API products first, then fill with editorial
  const series02Grid = apiProducts.length > 0
    ? apiProducts.slice(0, 4).map((p: any) => ({
        id: p.sku || p.id,
        img: p.images?.[0]?.url || SERIES02_PRODUCTS[0].img,
        name: p.title,
        price: `$${parseFloat(p.price).toFixed(2)}`,
        tag: p.shortDesc || "CANINE + HUMAN DUAL SYSTEM",
        biometric: 80,
        thermal: 80,
        slug: p.slug,
      }))
    : SERIES02_PRODUCTS;

  const selectStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    padding: 0,
    ...INTER,
    fontSize: 14,
    fontWeight: 600,
    color: C.onSurface,
    cursor: "pointer",
    outline: "none",
  };

  return (
    <div style={{ backgroundColor: C.surface, color: C.onSurface, overflowX: "hidden" }}>
      <EditorialHeader nav={navSettings.nav} />

      {/* ════════════════════════════════════════════════════════════════
          1. HERO
          ════════════════════════════════════════════════════════════════ */}
      <section
        className="relative w-full flex items-center overflow-hidden"
        style={{ height: "90vh", paddingLeft: 64, paddingRight: 64, paddingTop: 96 }}
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('${HERO_IMG}')`,
              filter: "grayscale(100%) brightness(0.55)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(1,45,29,0.7) 40%, transparent)" }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl">
          <p style={{ ...MONO, fontSize: 11, letterSpacing: "0.3em", color: C.primaryFixed, marginBottom: 16 }}>
            SERIES 02 / BIOLOGICAL PRESTIGE
          </p>
          <h1
            className="uppercase leading-none mb-6"
            style={{ ...PLAYFAIR, fontSize: "clamp(56px, 8vw, 84px)", fontWeight: 700, color: C.white, letterSpacing: "-0.02em" }}
          >
            Biological<br />Synchronization
          </h1>
          <p style={{ ...INTER, fontSize: 18, fontWeight: 300, lineHeight: "28px", color: "rgba(255,255,255,0.8)", maxWidth: 520, marginBottom: 32 }}>
            Engineering tactical harmony between human and canine biology. High-performance textiles infused with Graphene and biometric sensors for unified thermal regulation and environmental shielding.
          </p>
          <div className="flex gap-6 flex-wrap">
            <a href="#series02">
              <button
                className="transition-colors duration-200 px-8 py-4"
                style={{ backgroundColor: C.white, color: C.primary, ...LABEL_CAPS }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.primaryFixed)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.white)}
              >
                Explore Collection
              </button>
            </a>
            <button
              className="transition-colors duration-200 px-8 py-4"
              style={{ border: `1px solid ${C.white}`, color: C.white, ...LABEL_CAPS, background: "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              View Data Sheet
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          2. FILTER BAR
          ════════════════════════════════════════════════════════════════ */}
      <section
        className="sticky z-40 flex flex-wrap items-center gap-6"
        style={{
          top: 72,
          backgroundColor: C.surfaceContainer,
          borderBottom: `1px solid ${C.outlineVariant}`,
          padding: "32px 64px",
        }}
      >
        <div className="flex items-center gap-2 pr-8" style={{ borderRight: `1px solid ${C.outlineVariant}` }}>
          <SlidersHorizontal size={18} style={{ color: C.primary }} />
          <span style={{ ...LABEL_CAPS, color: C.onSurface }}>FILTERS</span>
        </div>

        <div className="flex flex-1 gap-8 overflow-x-auto py-1 flex-wrap">
          {/* Specimen Type */}
          <div className="group cursor-pointer">
            <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: C.onSurfaceVariant, marginBottom: 4 }}>
              SPECIMEN TYPE
            </p>
            <select value={specimenType} onChange={e => setSpecimenType(e.target.value)} style={selectStyle} data-testid="select-specimen-type">
              <option>ALL GENOTYPES</option>
              <option>WORKING GROUP</option>
              <option>SPORTING GROUP</option>
            </select>
          </div>

          {/* Sync Level */}
          <div className="cursor-pointer">
            <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: C.onSurfaceVariant, marginBottom: 4 }}>
              SYNC LEVEL
            </p>
            <select value={syncLevel} onChange={e => setSyncLevel(e.target.value)} style={selectStyle} data-testid="select-sync-level">
              <option>LEVEL 01: THERMAL</option>
              <option>LEVEL 02: BIOMETRIC</option>
              <option>LEVEL 03: FULL NEURAL</option>
            </select>
          </div>

          {/* Environment */}
          <div className="cursor-pointer">
            <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: C.onSurfaceVariant, marginBottom: 4 }}>
              ENVIRONMENT SHIELD
            </p>
            <select value={environment} onChange={e => setEnvironment(e.target.value)} style={selectStyle} data-testid="select-environment">
              <option>ARCTIC GRADE</option>
              <option>URBAN ARMOR</option>
              <option>AMPHIBIOUS</option>
            </select>
          </div>
        </div>

        <span style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", color: C.onSurfaceVariant }}>
          SHOWING {series02Grid.length}/48 SETS
        </span>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          3. SERIES 02 PRODUCT GRID
          ════════════════════════════════════════════════════════════════ */}
      <section id="series02" style={{ padding: "80px 64px", backgroundColor: C.surface }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {series02Grid.map((p, i) => (
            <ProductCard
              key={p.id || i}
              id={p.id}
              img={p.img}
              name={p.name}
              price={p.price}
              tag={p.tag}
              biometric={p.biometric}
              thermal={p.thermal}
              onAdd={() => handleAddToCart(p.name)}
            />
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          4. EDITORIAL INTERSTITIAL: MOLECULAR PRECISION
          ════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 0", backgroundColor: C.surfaceContainerLowest, overflow: "hidden" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center" style={{ padding: "0 64px" }}>
          {/* Text col */}
          <div className="lg:col-span-5 relative z-10" style={{ gridColumn: "span 5 / span 5" }}>
            <p style={{ ...LABEL_CAPS, color: C.secondary, marginBottom: 24 }}>LAB REPORT: FABRIC TECH</p>
            <h2
              className="leading-tight"
              style={{ ...PLAYFAIR, fontSize: 48, fontWeight: 600, color: C.primary, marginBottom: 32 }}
            >
              Molecular<br />Precision
            </h2>
            <p style={{ ...INTER, fontSize: 18, fontWeight: 300, lineHeight: "28px", color: C.onSurfaceVariant, marginBottom: 40 }}>
              Our Series 02 textiles utilize graphene-infused monofilament weaves. This isn't just clothing; it's a conductive mesh that equilibrates heat between the human torso and the canine thorax. By aligning biological heat signatures, we reduce fatigue and enhance long-range environmental tolerance.
            </p>
            <ul className="space-y-6">
              {[
                { num: "01", title: "Thermal Conductive Grid", desc: "Redistributes excess body heat across a wider surface area for rapid cooling." },
                { num: "02", title: "Antimicrobial Barrier", desc: "Silver-ion threads woven into the lining to neutralize biological scent signatures." },
              ].map(item => (
                <li key={item.num} className="flex items-start gap-4">
                  <span
                    style={{
                      ...LABEL_CAPS, color: C.primary, border: `1px solid ${C.primary}`,
                      padding: "8px", flexShrink: 0,
                    }}
                  >
                    {item.num}
                  </span>
                  <div>
                    <h4 className="uppercase" style={{ ...INTER, fontSize: 14, fontWeight: 600, color: C.primary, marginBottom: 4 }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: 14, color: C.onSurfaceVariant }}>{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Image collage col */}
          <div
            className="lg:col-span-7 mt-12 lg:mt-0 relative cursor-pointer"
            style={{ gridColumn: "span 7 / span 7" }}
            onMouseEnter={() => setCollageHover(true)}
            onMouseLeave={() => setCollageHover(false)}
          >
            {/* Corner decoration */}
            <div
              className="absolute top-0 right-0 w-full h-full -z-10"
              style={{
                border: `1px solid ${C.outlineVariant}`,
                borderBottom: "none", borderLeft: "none",
                transform: "translate(48px, -48px)",
              }}
            />
            <div className="relative" style={{ aspectRatio: "16/9" }}>
              {/* Grayscale base */}
              <div
                className="w-full h-full bg-cover bg-center absolute inset-0"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCaPf5QPY87EewytkqmAZ2opXXpZQP2_Iz-owwWoUFxeAGSvN9OM-XPNGqVsImCDjAkouCInfrjgy0K0VT2OOWfdhCTmfkgJ9wMU3YZHMl1p7DAfGZCqexjUNcNd6zKpRcLOgq5VD8GG87B1SNk63Ki1cMMMT-wt8374ZWx4C0zJY63QSckTI2EYTyP4pUmbo8rXse5JRM8RK-anaPIO1D6CxrPMTI17084wdbM7iZFG6-s8SBhtSfAzrXCuSEfequ4-89RGsss3LIe')`,
                  filter: "grayscale(100%) contrast(1.25)",
                }}
              />
              {/* Color overlay — revealed on hover */}
              <div
                className="w-full h-full bg-cover bg-center absolute inset-0"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB_8VseQTWBjJDc4C6PmTDYdBiZhFmrxAJBYIXK19tYrlWa9U-xjxpotOGnq-QtRk7CtCXQNZ1PPUvw4UP7Mrw2tskqenin5t8I19CxB0PcPhzCL1xH6PeU3WVTfAt96Ygwq2SmN1a0mdCCrkXsr6r9sHp5WjL5olotwDWVJKEUwOEVtK9nCl51Jw1e6sP9jVQBZC7OA_V4Cpq1uYfbw3T6StKQwZjqDSXHFR24zXz6aA4c27sJ3IAvNS50x2p65jtIr3XM70t5-nyw')`,
                  opacity: collageHover ? 1 : 0,
                  transition: "opacity 0.5s ease-in-out",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          5. SYNCHRONIZATION FIELD LOGS
          ════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 64px", backgroundColor: C.surface }}>
        <div
          className="flex flex-col md:flex-row justify-between items-baseline flex-wrap gap-4"
          style={{ borderBottom: `1px solid ${C.outlineVariant}`, paddingBottom: 24, marginBottom: 32 }}
        >
          <h2 className="uppercase" style={{ ...PLAYFAIR, fontSize: 32, fontWeight: 400, color: C.primary }}>
            Synchronization Field Logs
          </h2>
          <p style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", color: C.onSurfaceVariant }}>
            FIELD INTEL // ACTIVE OPS
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FIELD_LOGS.map((log, i) => (
            <div
              key={i}
              className="p-8 transition-colors duration-200 cursor-default"
              style={{
                backgroundColor: C.surfaceContainer,
                borderLeft: `4px solid ${log.accentColor}`,
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.surfaceContainerHigh)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.surfaceContainer)}
            >
              <div className="flex justify-between mb-8 flex-wrap gap-2">
                <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", color: C.onSurfaceVariant, lineHeight: "18px" }}>
                  COORD: {log.coord}<br />LOC: {log.loc}
                </div>
                <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", color: C.secondary }}>
                  STATUS: {log.status}
                </span>
              </div>
              <p className="italic mb-8" style={{ ...INTER, fontSize: 16, lineHeight: "24px", color: C.primary }}>
                "{log.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div style={{ width: 40, height: 40, backgroundColor: C.primaryContainer, flexShrink: 0 }} />
                <div>
                  <p style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", color: C.primary, fontWeight: 700 }}>
                    {log.name}
                  </p>
                  <p style={{ fontSize: 10, color: C.onSurfaceVariant, ...MONO }}>{log.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          6. NEURAL BRIDGE HIGHLIGHT (dark primary bg)
          ════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 0", backgroundColor: C.primary, color: C.white }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center" style={{ padding: "0 64px" }}>
          {/* Image */}
          <div className="lg:col-span-6 order-2 lg:order-1" style={{ gridColumn: "span 6 / span 6" }}>
            <div
              className="w-full bg-cover bg-center"
              style={{
                aspectRatio: "1/1",
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDeJLNpYssyX0hfZ0sgQhoBnK_m_gTu4Qo2ItZBKil6pqbykDT35GXklutOcjulMed9wPMOKbSK44pr9ysO7Q3n6xvXUy91wBeLHXsxgjPEF4bZrXKwGi5bH1iXbdV2wG79YEh_BuVnTAQKeTwR0KyqlfA_IEp5zj2XimTcjNVrLXrHgpkg64Os1x_xmou0rvYo4mqRDuAtonCZ5DrfNb3tyrKxK_KwfbBqKKXS0ptlFuxlAc2N6YJEFPJjNPjwEgOZ1X_n5ZdIJKgk')`,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
          </div>
          {/* Text */}
          <div className="lg:col-span-6 order-1 lg:order-2 mb-12 lg:mb-0" style={{ gridColumn: "span 6 / span 6" }}>
            <h2
              className="uppercase leading-tight mb-8"
              style={{ ...PLAYFAIR, fontSize: 48, fontWeight: 600, color: C.white }}
            >
              Sync Level 03:<br />Neural Bridge
            </h2>
            <p style={{ ...INTER, fontSize: 18, fontWeight: 300, lineHeight: "28px", color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
              The ultimate realization of 19 DOGS research. Series 02 allows for integrated haptic feedback, transmitting subtle biological cues between species for intuitive non-verbal communication in high-stakes environments.
            </p>
            <button
              className="px-10 py-5 transition-colors duration-200"
              style={{ backgroundColor: C.secondaryContainer, color: "#77330e", ...LABEL_CAPS }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.secondaryFixed)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.secondaryContainer)}
              data-testid="btn-field-access"
            >
              Apply for Field Access
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          7. SERIES 03 ARCHIVE EXPANSION
          ════════════════════════════════════════════════════════════════ */}
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
          {SERIES03_PRODUCTS.map((p, i) => (
            <ProductCard
              key={p.id}
              id={p.id}
              img={p.img}
              name={p.name}
              price={p.price}
              tag={p.tag}
              biometric={p.biometric}
              thermal={p.thermal}
              onAdd={() => handleAddToCart(p.name)}
            />
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          8. EDITORIAL FOOTER
          ════════════════════════════════════════════════════════════════ */}
      <EditorialFooter footer={navSettings.footer} email={email} onEmailChange={setEmail} />
    </div>
  );
}
