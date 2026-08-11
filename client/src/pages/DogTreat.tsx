import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, FlaskConical, Award, Ban, Leaf, ChevronDown } from "lucide-react";
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
const MONO: React.CSSProperties     = { fontFamily: "'Courier New', Courier, monospace" };
const LABEL_CAPS: React.CSSProperties = {
  ...INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase",
};

// ─── Hard-paper shadow ───────────────────────────────────────────────
const HARD_SHADOW = "40px 40px 0px 0px rgba(1,45,29,0.15)";

function specimenNo(id: string | number) {
  const n = parseInt(String(id), 10);
  return String(isNaN(n) ? 42 : (n % 900) + 42).padStart(3, "0");
}

// ─── Protein Specimens (static catalogue) ───────────────────────────
const SPECIMENS = [
  { id: 1, name: "CHICKEN",  img: "https://images.unsplash.com/photo-1587593810167-a84920ea084d?auto=format&fit=crop&q=80&w=400", alt: "Chicken Specimen" },
  { id: 2, name: "DUCK",     img: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=400", alt: "Duck Specimen" },
  { id: 3, name: "TURKEY",   img: "https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?auto=format&fit=crop&q=80&w=400", alt: "Turkey Specimen" },
  { id: 4, name: "RABBIT",   img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=400", alt: "Rabbit Specimen" },
  { id: 5, name: "MUTTON",   img: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=400", alt: "Mutton Specimen" },
  { id: 6, name: "FISH",     img: "https://images.unsplash.com/photo-1534604973900-c41ab4c5e636?auto=format&fit=crop&q=80&w=400", alt: "Fish Specimen" },
  { id: 7, name: "SQUID",    img: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=400", alt: "Squid Specimen" },
  { id: 8, name: "QUAIL",    img: "https://images.unsplash.com/photo-1559715541-5daf8a0296d0?auto=format&fit=crop&q=80&w=400", alt: "Quail Specimen" },
];

// ─── Differentiation features ────────────────────────────────────────
const FEATURES = [
  { icon: <Leaf size={32} />,        title: "Exotic Whole-Prey",         body: "Rare proteins sourced from ethical habitats to prevent allergen development." },
  { icon: <FlaskConical size={32} />, title: "Ancient Formula",           body: "Replicating the exact macronutrient ratios of the wild canine diet." },
  { icon: <Award size={32} />,        title: "Human-Grade",               body: "Sourced and prepared in facilities that meet human consumption standards." },
  { icon: <Ban size={32} />,          title: "No Fillers",                body: "Zero starch, zero grain, zero synthetics. Pure biological fuel for movement." },
];

// ─── Fallback products ───────────────────────────────────────────────
const FALLBACK_PRODUCTS = [
  {
    id: -1, name: "Dehydrated Chicken", tag: "Low fat, high protein", taxClass: "Aves",
    img: "https://images.unsplash.com/photo-1604908177453-7462950a6a3b?auto=format&fit=crop&q=80&w=700",
    price: 2400, slug: undefined,
    nutrients: [{ k: "IRON", v: "0.8mg/100g" }, { k: "COPPER", v: "0.1mg/100g" }, { k: "OMEGA-3", v: "0.2g/100g" }],
  },
  {
    id: -2, name: "Dehydrated Duck", tag: "Anti-inflammatory fuel", taxClass: "Anseriformes",
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=700",
    price: 2800, slug: undefined,
    nutrients: [{ k: "IRON", v: "2.4mg/100g" }, { k: "COPPER", v: "0.4mg/100g" }, { k: "OMEGA-3", v: "0.6g/100g" }],
  },
  {
    id: -3, name: "Dehydrated Rabbit", tag: "Hypoallergenic Lean", taxClass: "Mammalia",
    img: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&q=80&w=700",
    price: 3400, slug: undefined,
    nutrients: [{ k: "IRON", v: "3.2mg/100g" }, { k: "ZINC", v: "1.8mg/100g" }, { k: "OMEGA-3", v: "0.4g/100g" }],
  },
  {
    id: -4, name: "Dehydrated Squid", tag: "Amino Acid Powerhouse", taxClass: "Cephalopoda",
    img: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&q=80&w=700",
    price: 3200, slug: undefined,
    nutrients: [{ k: "TAURINE", v: "High Potency" }, { k: "VIT B12", v: "4.2μg/100g" }, { k: "OMEGA-3", v: "1.1g/100g" }],
  },
];

// ─── Default Dog Treats settings ────────────────────────────────────
interface DataRow { label: string; value: string }
interface DogTreatsSettings {
  hero: { headline: string; subtitle: string; bgImageUrl: string; ctaText: string; ctaHref: string; locationTitle: string; locationSubtitle: string };
  proteinLibrary: { visible: boolean; title: string; subtitle: string; parentCategorySlug: string };
  wolfPrinciple: { visible: boolean; label: string; title: string; body: string; imageUrl: string; quoteSpecimenNo: string; quoteText: string; dataRows: DataRow[] };
  features: { visible: boolean; title: string; subtitle: string };
  productSection: { visible: boolean; title: string; subtitle: string; categorySlug: string };
  quoteBanner: { visible: boolean; text: string; subtext: string };
  cta: { label: string; headline: string; body: string; ctaText: string; ctaHref: string };
}

const DEFAULT_DT: DogTreatsSettings = {
  hero: {
    headline: "Feed the Wolf.",
    subtitle: "19 DOGS is species-appropriate, human-grade, whole-prey nutrition. Designed for the domestic athlete.",
    bgImageUrl: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=1920",
    ctaText: "Shop Wild & Exotic Range",
    ctaHref: "/shop",
    locationTitle: "Current Expedition",
    locationSubtitle: "Boreal Forest, Canada",
  },
  proteinLibrary: { visible: true, title: "The Protein Library", subtitle: "A comprehensive index of biological fuel sources, categorized by species and nutrient density.", parentCategorySlug: "wild-treats" },
  wolfPrinciple: {
    visible: true,
    label: "Foundational Biology",
    title: "The Wolf Principle.",
    body: "Despite centuries of domestication, the canine digestive system remains 99.9% genetically identical to its wild ancestor. They aren't designed for starch and processed grains; they demand the nutrient density found only in whole-prey protein.",
    imageUrl: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&q=80&w=900",
    quoteSpecimenNo: "Specimen No. 042",
    quoteText: "Optimal health is a byproduct of biological honesty.",
    dataRows: [
      { label: "Genetic Divergence", value: "0.1% Total" },
      { label: "Protein Bioavailability", value: "High-Grade (Prey)" },
      { label: "Enzymatic Activity", value: "Protease Focused" },
    ],
  },
  features: { visible: true, title: "What Makes Our Food Different", subtitle: "Precision engineering meets raw nature. Every ingredient is selected for its molecular contribution to canine vitality." },
  productSection: { visible: true, title: "The Wild & Exotic Protein Portfolio", subtitle: "A curated collection of dehydrated specimen, preserved at the peak of nutritional integrity.", categorySlug: "wild-treats" },
  quoteBanner: { visible: true, text: "No single protein does it all — that's why we don't rely on just one.", subtext: "Biological Diversity is Key" },
  cta: { label: "Join the Movement", headline: "Join the Wolf Pet Movement.", body: "Ready to transition your dog to biological precision? Start with our introductory specimen pack.", ctaText: "Shop Now", ctaHref: "/shop" },
};

function deepMerge(defaults: any, overrides: any): any {
  if (!overrides || typeof overrides !== "object") return defaults;
  const result = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (key in overrides) {
      if (Array.isArray(defaults[key])) {
        result[key] = Array.isArray(overrides[key]) ? overrides[key] : defaults[key];
      } else if (typeof defaults[key] === "object" && defaults[key] !== null) {
        result[key] = deepMerge(defaults[key], overrides[key]);
      } else {
        result[key] = overrides[key] !== undefined && overrides[key] !== null ? overrides[key] : defaults[key];
      }
    }
  }
  return result;
}

// ─── Format currency ─────────────────────────────────────────────────
function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

// ─── Specimen circle (dynamic — driven by child categories) ──────────
interface SpecimenCat { id: string; name: string; slug: string; imageUrl: string | null }
function SpecimenCircle({ cat, index, isSelected, onClick }: { cat: SpecimenCat; index: number; isSelected: boolean; onClick: () => void }) {
  const fallbackImg = SPECIMENS[index % SPECIMENS.length]?.img ?? "";
  const src = cat.imageUrl || fallbackImg;
  return (
    <div
      className="flex flex-col items-center group cursor-pointer"
      onClick={onClick}
      data-testid={`specimen-circle-${cat.slug}`}
    >
      <div
        className="w-full aspect-square rounded-full overflow-hidden mb-4"
        style={{
          border: isSelected ? `2px solid ${C.primary}` : `1px solid ${C.outlineVariant}`,
          transition: "border-color 0.4s, transform 0.4s",
          boxShadow: isSelected ? `0 0 0 4px ${C.primaryFixed}` : "none",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.primary; (e.currentTarget as HTMLDivElement).style.transform = "scale(1.05)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = isSelected ? C.primary : C.outlineVariant; (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; }}
      >
        <img src={src} alt={cat.name} loading="lazy" className="w-full h-full object-cover"
          style={{ filter: isSelected ? "grayscale(0%)" : "grayscale(100%)", transition: "filter 0.7s cubic-bezier(0.16,1,0.3,1)" }}
          onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.filter = "grayscale(0%)"}
          onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.filter = isSelected ? "grayscale(0%)" : "grayscale(100%)"} />
      </div>
      <span style={{ ...LABEL_CAPS, fontSize: 10, color: C.outline, display: "block", marginBottom: 4 }}>SPECIMEN {String(index + 1).padStart(2, "0")}</span>
      <span style={{ ...LABEL_CAPS, color: isSelected ? C.secondary : C.primary, letterSpacing: "0.15em" }}>{cat.name.toUpperCase()}</span>
    </div>
  );
}

// ─── Feature card ────────────────────────────────────────────────────
function FeatureCard({ feature }: { feature: typeof FEATURES[0] }) {
  return (
    <div className="bg-white p-10 transition-transform duration-500 hover:-translate-y-2" style={{ boxShadow: HARD_SHADOW, color: C.onSurface }}>
      <div style={{ color: C.primary, marginBottom: 24 }}>{feature.icon}</div>
      <h3 style={{ ...PLAYFAIR, fontSize: 24, fontWeight: 600, color: C.onSurface, marginBottom: 16 }}>{feature.title}</h3>
      <p style={{ ...INTER, fontSize: 16, color: C.onSurfaceVariant, lineHeight: 1.6 }}>{feature.body}</p>
    </div>
  );
}

// ─── Editorial product card ──────────────────────────────────────────
interface EditorialProduct {
  id: string | number;
  name: string;
  tag: string;
  shortDesc?: string;
  taxClass: string;
  img: string;
  price: number;
  originalPrice?: number;
  slug?: string;
  weight?: string | number;
  isOnSale?: boolean;
  discountPct?: number;
  nutrients: { k: string; v: string }[];
  feedingGuidelines?: string;
  storageInstructions?: string;
  variants?: any[];
}

function EditorialProductCard({ product, onAddToCart, allCoupons = [] }: {
  product: EditorialProduct;
  onAddToCart: (id: string | number) => void;
  allCoupons?: any[];
}) {
  const [, navigate] = useLocation();
  const [hovered, setHovered] = useState(false);

  const variantsRaw: any[] = product.variants ?? [];

  const baseWeightGrams = product.weight
    ? (parseFloat(String(product.weight)) >= 10 ? parseFloat(String(product.weight)) : parseFloat(String(product.weight)) * 1000)
    : null;

  // Build weight options with their respective prices
  type WeightOption = { weight: string; price: number; isSale: boolean };
  const weightOptions: WeightOption[] = [];
  if (baseWeightGrams) {
    weightOptions.push({ weight: `${baseWeightGrams}g`, price: product.price, isSale: product.isOnSale ?? false });
  }
  for (const v of variantsRaw) {
    if (weightOptions.length >= 4) break;
    const val = v.optionValue || v.option_value;
    if (!val) continue;
    const label = `${val}g`;
    if (weightOptions.some(w => w.weight === label)) continue;
    const rawSale = v.salePrice ? Number(v.salePrice) : null;
    const rawPrice = Number(v.price);
    const isSale = !!(rawSale && rawSale < rawPrice);
    const effectivePrice = (isSale ? rawSale! : rawPrice) * 100;
    weightOptions.push({ weight: label, price: effectivePrice, isSale });
  }

  const relevantCoupons = allCoupons
    .filter(c => {
      if (!c.isActive) return false;
      if (c.applicableTo === "specific" && Array.isArray(c.productIds) && !c.productIds.includes(String(product.id))) return false;
      return true;
    })
    .slice(0, 2);

  const isReal = typeof product.id === "string" || (product.id as number) > 0;

  return (
    /* Vertical card — 4:5 image on top, details below (full-meals style) */
    <div
      style={{ cursor: "default" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── 4:5 Image ── */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: hovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
        {/* Specimen badge top-left — class name only */}
        <div className="absolute top-6 left-6 z-10 font-mono text-[11px] px-4 py-2"
          style={{ backgroundColor: C.primary, color: C.white, letterSpacing: "0.1em" }}>
          {product.taxClass}
        </div>
        {/* Sale badge top-right */}
        {product.isOnSale && product.discountPct && product.discountPct > 0 && (
          <div className="absolute top-6 right-6 z-10 font-mono text-[11px] px-3 py-2"
            style={{ backgroundColor: C.secondary, color: C.white, letterSpacing: "0.08em" }}>
            &minus;{product.discountPct}%
          </div>
        )}
      </div>

      {/* ── Details below image — exact full-meals card style ── */}
      <div className="space-y-6 pt-6">

        {/* Name + price + italic quote — bordered like full-meals */}
        <div className="border-l-4 pl-8" style={{ borderColor: C.secondary }}>
          <h3 className="font-playfair mb-4"
            style={{ fontSize: "clamp(28px,3.5vw,48px)", fontWeight: 600, color: C.primary, lineHeight: 1.2 }}>
            {product.name}
          </h3>

          {/* Price line */}
          {weightOptions.length > 0 ? (
            <p className="font-inter text-base mb-3"
              style={{ color: C.secondary, fontWeight: 600, letterSpacing: "0.05em" }}>
              {weightOptions.slice(0, 2).map(o => `${o.weight} — ${fmt(o.price)}`).join("  ·  ")}
            </p>
          ) : (
            <p className="font-inter text-base mb-3"
              style={{ color: C.secondary, fontWeight: 600, letterSpacing: "0.05em" }}>
              {fmt(product.price)}
            </p>
          )}

          {/* Italic quote/description */}
          <p className="font-playfair text-xl italic leading-relaxed"
            style={{ color: C.onSurfaceVariant }}>
            {product.shortDesc
              ? `"${product.shortDesc}"`
              : `"${product.tag}"`}
          </p>
        </div>

        {/* Biometric / nutrition panel — matches full-meals data table */}
        {product.nutrients && product.nutrients.length > 0 && (
          <div className="p-8 border" style={{ backgroundColor: C.surfaceContainerLow, borderColor: C.outlineVariant }}>
            <p className="font-inter mb-4"
              style={{ fontSize: "10px", letterSpacing: "0.3em", color: `${C.primary}80`, textTransform: "uppercase", fontWeight: 700 }}>
              Nutritional Profile
            </p>
            {product.nutrients.slice(0, 2).map((n, i) => (
              <div key={n.k}
                className={`flex justify-between py-2 ${i < product.nutrients.slice(0, 2).length - 1 ? "border-b" : ""}`}
                style={{ borderColor: C.outlineVariant }}>
                <span className="font-inter text-xs uppercase tracking-widest" style={{ color: C.onSurface }}>{n.k}</span>
                <span className="font-mono text-xs" style={{ color: C.primary }}>{n.v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Coupon codes */}
        {relevantCoupons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {relevantCoupons.map(c => (
              <span key={c.id} className="font-mono"
                style={{ fontSize: 11, color: C.primary, border: `1px dashed ${C.primary}70`, padding: "3px 8px" }}>
                {c.code} — {c.discountType === "percentage" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
              </span>
            ))}
          </div>
        )}

        {/* Buttons — exact full-meals order and style */}
        <div className="flex flex-wrap gap-4">
          <button
            className="font-inter text-xs uppercase tracking-widest px-12 py-4 transition-all duration-300 cursor-pointer"
            style={{ backgroundColor: C.primary, color: C.white, opacity: product.slug ? 1 : 0.5 }}
            onClick={() => product.slug && navigate(`/dogtreat/product/${product.slug}`)}
            onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.secondary}
            onMouseOut={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primary}
            data-testid={`btn-view-specimen-${product.id}`}
          >
            View Specimen
          </button>
          <button
            className="font-inter text-xs uppercase tracking-widest px-12 py-4 border transition-all duration-300 cursor-pointer flex items-center gap-2"
            style={{ borderColor: C.primary, color: C.primary, backgroundColor: "transparent", opacity: isReal ? 1 : 0.6 }}
            onClick={() => isReal && onAddToCart(product.id)}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primary; (e.currentTarget as HTMLButtonElement).style.color = C.white; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = C.primary; }}
            data-testid={`btn-add-to-cart-${product.id}`}
          >
            <ShoppingCart className="w-4 h-4" /> Add to Cart
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);

  // ── Fetch nav/footer settings ──────────────────────────────────────
  const { data: rawSettings } = useQuery<{ settings: any }>({ queryKey: ["/api/settings/homepage"] });
  const settings = rawSettings ? mergeHomepageSettings(rawSettings.settings || {}) : DEFAULT_HOMEPAGE_SETTINGS;
  const nav    = settings.nav;
  const footer = settings.footer;

  // ── Fetch Dog Treats page settings ────────────────────────────────
  const { data: dtRaw } = useQuery<{ settings: Partial<DogTreatsSettings> }>({
    queryKey: ["/api/settings/dog-treats-page"],
  });
  const dt: DogTreatsSettings = dtRaw?.settings
    ? deepMerge(DEFAULT_DT, dtRaw.settings) as DogTreatsSettings
    : DEFAULT_DT;

  // ── Fetch all categories to build the Protein Library dynamically ──
  const { data: allCatsData } = useQuery<{ categories: any[] }>({
    queryKey: ["/api/categories"],
  });

  // The API returns a nested tree — flatten it so we can filter by parentId
  function flattenCatTree(nodes: any[]): any[] {
    const result: any[] = [];
    for (const node of nodes) {
      result.push(node);
      if (node.children?.length) result.push(...flattenCatTree(node.children));
    }
    return result;
  }
  const allCats: any[] = flattenCatTree(allCatsData?.categories ?? []);

  // Find the parent category whose children become specimen circles
  const parentSlug = dt.proteinLibrary.parentCategorySlug || "wild-treats";
  const parentCat = allCats.find((c: any) => c.slug === parentSlug);
  const specimenCats: SpecimenCat[] = parentCat
    ? allCats.filter((c: any) => c.parentId === parentCat.id && c.isActive !== false)
      .map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, imageUrl: c.imageUrl ?? null }))
    : [];

  // Toggle selection: click same to deselect, click different to select
  const handleSpecimenClick = useCallback((catId: string) => {
    setSelectedCategoryId(prev => prev === catId ? null : catId);
  }, []);

  // ── Fetch products (filtered by selected category if any) ──────────
  const categorySlug = dt.productSection.categorySlug || "wild-treats";
  const { data: categoryProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products", { categoryId: selectedCategoryId, categorySlug, limit: 50 }],
    queryFn: () => {
      if (selectedCategoryId) {
        return fetch(`/api/products?categoryId=${encodeURIComponent(selectedCategoryId)}&limit=50`)
          .then(r => r.json()).then(d => Array.isArray(d) ? d : (d.products ?? []));
      }
      return fetch(`/api/products?categorySlug=${encodeURIComponent(categorySlug)}&limit=50`)
        .then(r => r.json()).then(d => Array.isArray(d) ? d : (d.products ?? []));
    },
  });

  // If no products found in that category, fall back to general products (always have slugs)
  const { data: fallbackApiProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products", { limit: 50 }],
    queryFn: () => fetch(`/api/products?limit=50`)
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : (d.products ?? [])),
    enabled: categoryProducts.length === 0 && !selectedCategoryId,
  });

  const apiProducts: any[] = categoryProducts.length > 0 ? categoryProducts : fallbackApiProducts;

  // ── Parallax hero on scroll ────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      if (heroBgRef.current) heroBgRef.current.style.transform = `translateY(${window.scrollY * 0.4}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Map API products → editorial format ───────────────────────────
  const mapProduct = (p: any, idx: number): EditorialProduct => {
    const imgs = p.images ?? [];
    const img  = imgs.find((i: any) => i.isPrimary)?.url ?? imgs[0]?.url ?? FALLBACK_PRODUCTS[idx % 4].img;
    const originalPrice = Number(p.price);
    const salePrice = p.salePrice ? Number(p.salePrice) : null;
    const isOnSale = !!(p.isOnSale && salePrice && salePrice < originalPrice);
    const discountPct = isOnSale ? Math.round(((originalPrice - salePrice!) / originalPrice) * 100) : 0;
    return {
      id:           p.id,
      name:         p.title ?? p.name,
      tag:          p.shortDesc ?? p.category?.name ?? "Single-source protein",
      shortDesc:    p.shortDesc || undefined,
      taxClass:     p.category?.name ?? "Specimen",
      img,
      price:        (salePrice && isOnSale ? salePrice : originalPrice) * 100,
      originalPrice: originalPrice * 100,
      slug:         p.slug,
      weight:       p.weight ?? undefined,
      variants:     p.variants ?? [],
      isOnSale,
      discountPct,
      nutrients: [
        { k: "PROTEIN",  v: p.protein  ? `${p.protein}g/100g`  : "High" },
        { k: "FAT",      v: p.fat      ? `${p.fat}g/100g`      : "Low"  },
        { k: "MOISTURE", v: p.moisture ? `${p.moisture}%`      : "<12%" },
      ],
      feedingGuidelines: p.feedingGuidelines || undefined,
      storageInstructions: p.storageInstructions || undefined,
    };
  };

  const displayProducts: EditorialProduct[] = apiProducts.map(mapProduct);

  // ── Fetch active coupons for display on product cards ─────────────
  const { data: couponsData } = useQuery<any>({
    queryKey: ["/api/coupons"],
    queryFn: () => fetch("/api/coupons").then(r => r.ok ? r.json() : { coupons: [] }),
  });
  const allCoupons: any[] = Array.isArray(couponsData) ? couponsData : (couponsData?.coupons ?? []);

  // ── Add to cart ───────────────────────────────────────────────────
  const handleAddToCart = (productId: string | number) => {
    if (typeof productId === 'number' && productId < 0) return;
    addToCart(String(productId), 1);
    toast({ title: "Added to cart", description: "Item added to your cart." });
  };

  return (
    <div style={{ backgroundColor: C.surface, color: C.onSurface, fontFamily: "Inter, sans-serif", overflowX: "hidden" }}>
      <EditorialHeader nav={nav} />

      {/* ══════════════ 1. HERO ══════════════ */}
      <section className="relative flex items-center overflow-hidden" style={{ height: "100vh" }}>
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 z-10" style={{ backgroundColor: "rgba(1,45,29,0.40)" }} />
          <div ref={heroBgRef} className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${dt.hero.bgImageUrl}')`, willChange: "transform" }} />
        </div>
        <div className="relative z-20 px-5 md:px-[64px] max-w-4xl">
          <h1 style={{ ...PLAYFAIR, fontSize: "clamp(56px,9vw,84px)", fontWeight: 700, color: C.surface, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 24 }}>
            {dt.hero.headline}
          </h1>
          <p style={{ ...PLAYFAIR, fontStyle: "italic", fontSize: "clamp(18px,3vw,30px)", fontWeight: 300, color: "rgba(249,250,246,0.9)", marginBottom: 40, maxWidth: 600, lineHeight: 1.5 }}>
            {dt.hero.subtitle}
          </p>
          <div className="flex gap-6 flex-wrap">
            <button className="transition-all" style={{ backgroundColor: C.primary, color: C.white, ...LABEL_CAPS, padding: "20px 40px" }} data-testid="btn-hero-shop"
              onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>
              {dt.hero.ctaText}
            </button>
            <button className="transition-all"
              style={{ border: `1px solid ${C.white}`, color: C.white, ...LABEL_CAPS, padding: "20px 40px" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}>
              Our Science
            </button>
          </div>
        </div>
        <div className="absolute z-20 hidden md:block"
          style={{ bottom: 64, right: 64, color: C.surface, borderLeft: "1px solid rgba(255,255,255,0.3)", paddingLeft: 24, paddingTop: 8, paddingBottom: 8 }}>
          <p style={{ ...LABEL_CAPS, opacity: 0.6, marginBottom: 4 }}>{dt.hero.locationTitle}</p>
          <p style={{ ...PLAYFAIR, fontSize: 18, color: C.surface }}>{dt.hero.locationSubtitle}</p>
        </div>
        {/* Scroll-down indicator */}
        <button
          onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
          className="absolute z-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer"
          style={{ bottom: 32, color: "rgba(255,255,255,0.7)", background: "none", border: "none", ...LABEL_CAPS, fontSize: 9 }}
          data-testid="btn-scroll-to-products"
        >
          <span>SHOP NOW</span>
          <ChevronDown size={20} style={{ animation: "bounce 2s infinite" }} />
        </button>
      </section>

      {/* ══════════════ 2. PROTEIN LIBRARY ══════════════ */}
      {dt.proteinLibrary.visible && (
        <section className="border-b" style={{ backgroundColor: C.surface, borderColor: C.outlineVariant, padding: "clamp(40px,8vw,80px) clamp(20px,5vw,64px)" }}>
          <div style={{ marginBottom: 48 }}>
            <h2 className="font-playfair" style={{ fontSize: "clamp(40px,6vw,72px)", fontWeight: 700, color: C.primary, marginBottom: 16 }}>
              {dt.proteinLibrary.title}
            </h2>
            <p style={{ ...INTER, fontSize: "clamp(16px,2vw,20px)", fontWeight: 300, color: C.onSurfaceVariant, maxWidth: 560, lineHeight: 1.7 }}>
              {dt.proteinLibrary.subtitle}
            </p>
          </div>
          {specimenCats.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8">
              {specimenCats.map((cat, i) => (
                <SpecimenCircle
                  key={cat.id}
                  cat={cat}
                  index={i}
                  isSelected={selectedCategoryId === cat.id}
                  onClick={() => handleSpecimenClick(cat.id)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8">
              {SPECIMENS.map((specimen, i) => {
                const staticCat: SpecimenCat = { id: String(specimen.id), name: specimen.name, slug: specimen.name.toLowerCase(), imageUrl: specimen.img };
                return (
                  <SpecimenCircle
                    key={specimen.id}
                    cat={staticCat}
                    index={i}
                    isSelected={false}
                    onClick={() => {}}
                  />
                );
              })}
            </div>
          )}
          {selectedCategoryId && (
            <div className="mt-8 flex items-center gap-3">
              <span style={{ ...LABEL_CAPS, color: C.outline }}>Filtering by:</span>
              <span style={{ ...LABEL_CAPS, color: C.secondary }}>
                {specimenCats.find(c => c.id === selectedCategoryId)?.name.toUpperCase()}
              </span>
              <button
                onClick={() => setSelectedCategoryId(null)}
                style={{ ...LABEL_CAPS, fontSize: 11, color: C.outline, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: "10px 8px", minHeight: 44, display: "inline-flex", alignItems: "center" }}
                data-testid="btn-clear-filter"
              >
                CLEAR
              </button>
            </div>
          )}
        </section>
      )}

      {/* ══════════════ 3. WOLF PRINCIPLE ══════════════ */}
      {dt.wolfPrinciple.visible && (
        <section className="grid grid-cols-12 gap-6 items-center" style={{ padding: "clamp(40px,8vw,80px) clamp(20px,5vw,64px)" }}>
          <div className="col-span-12 lg:col-span-5">
            <span style={{ ...LABEL_CAPS, color: C.secondary, display: "block", marginBottom: 16 }}>{dt.wolfPrinciple.label}</span>
            <h2 className="font-playfair" style={{ fontSize: "clamp(40px,6vw,72px)", fontWeight: 700, color: C.primary, marginBottom: 32, lineHeight: 1.15 }}>
              {dt.wolfPrinciple.title}
            </h2>
            <p style={{ ...INTER, fontSize: "clamp(16px,2vw,20px)", fontWeight: 300, color: C.onSurfaceVariant, marginBottom: 24, lineHeight: 1.7 }}>
              {dt.wolfPrinciple.body}
            </p>
            <div className="space-y-4">
              {dt.wolfPrinciple.dataRows.map((row) => (
                <div key={row.label} className="flex justify-between items-end pb-2" style={{ borderBottom: `1px solid ${C.outlineVariant}` }}>
                  <span style={{ ...LABEL_CAPS, color: C.outline }}>{row.label}</span>
                  <span style={{ ...LABEL_CAPS, color: C.primary }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <div className="relative" style={{ cursor: "default" }}>
              <div className="overflow-hidden" style={{ aspectRatio: "4/5", boxShadow: HARD_SHADOW }}
                onMouseEnter={e => { const img = (e.currentTarget as HTMLDivElement).querySelector("img"); if (img) { img.style.filter = "grayscale(0%)"; img.style.transform = "scale(1.05)"; } }}
                onMouseLeave={e => { const img = (e.currentTarget as HTMLDivElement).querySelector("img"); if (img) { img.style.filter = "grayscale(100%)"; img.style.transform = "scale(1)"; } }}>
                <img src={dt.wolfPrinciple.imageUrl} alt="Species-appropriate nutrition" className="w-full h-full object-cover" loading="lazy"
                  style={{ filter: "grayscale(100%)", transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
              </div>
              <div className="absolute p-6 max-w-xs hidden md:block" style={{ bottom: -32, right: -32, backgroundColor: C.primary, color: C.white }}>
                <p style={{ ...LABEL_CAPS, opacity: 0.6, marginBottom: 8 }}>{dt.wolfPrinciple.quoteSpecimenNo}</p>
                <p style={{ ...INTER, fontStyle: "italic", fontSize: 14 }}>"{dt.wolfPrinciple.quoteText}"</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ 4. FEATURES ══════════════ */}
      {dt.features.visible && (
        <section style={{ backgroundColor: C.surfaceContainerHigh, padding: "clamp(40px,8vw,80px) clamp(20px,5vw,64px)" }}>
          <div className="flex justify-between items-end mb-16 flex-wrap gap-6">
            <div>
              <h2 className="font-playfair" style={{ fontSize: "clamp(40px,6vw,72px)", fontWeight: 700, color: C.primary, marginBottom: 16 }}>
                {dt.features.title}
              </h2>
              <p style={{ ...INTER, fontSize: "clamp(16px,2vw,20px)", fontWeight: 300, color: C.onSurfaceVariant, maxWidth: 560, lineHeight: 1.7 }}>{dt.features.subtitle}</p>
            </div>
            <div className="hidden lg:block" style={{ height: 1, width: "33%", backgroundColor: C.outlineVariant, marginBottom: 24 }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => <FeatureCard key={f.title} feature={f} />)}
          </div>
        </section>
      )}

      {/* ══════════════ 5. PRODUCT PORTFOLIO ══════════════ */}
      {dt.productSection.visible && (
        <section id="products" style={{ padding: "clamp(40px,8vw,80px) clamp(20px,5vw,64px)" }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-20 flex-wrap">
            <div style={{ maxWidth: 560 }}>
              <h2 className="font-playfair" style={{ fontSize: "clamp(40px,6vw,72px)", fontWeight: 700, color: C.primary, marginBottom: 16 }}>
                {dt.productSection.title}
              </h2>
              <p style={{ ...INTER, fontSize: "clamp(16px,2vw,20px)", fontWeight: 300, color: C.onSurfaceVariant, lineHeight: 1.7 }}>{dt.productSection.subtitle}</p>
            </div>
            <div className="flex gap-4">
              <button className="transition-all"
                style={{ border: `1px solid ${C.outline}`, backgroundColor: C.white, ...LABEL_CAPS, padding: "8px 24px" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.surfaceContainer}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.white}>
                Filter by Bio-Type
              </button>
              <button onClick={() => navigate("/shop")} className="transition-all"
                style={{ backgroundColor: C.primary, color: C.white, ...LABEL_CAPS, padding: "8px 24px" }}
                data-testid="btn-sort-potency">
                Sort by Potency
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {displayProducts.map(product => (
              <EditorialProductCard key={product.id} product={product} onAddToCart={handleAddToCart} allCoupons={allCoupons} />
            ))}
          </div>
          <div className="mt-24 text-center">
            <button onClick={() => navigate("/shop")} className="transition-all"
              style={{ ...LABEL_CAPS, color: C.primary, borderBottom: `1px solid ${C.primary}`, paddingBottom: 4 }}
              data-testid="btn-load-more">
              Load Full Specimen Library (Goat, Quail, Prawn, Octopus...)
            </button>
          </div>
        </section>
      )}

      {/* ══════════════ 6. QUOTE BANNER ══════════════ */}
      {dt.quoteBanner.visible && (
        <section className="flex items-center justify-center overflow-hidden relative"
          style={{ minHeight: "60vh", backgroundColor: C.primary, padding: "80px 20px" }}>
          <div className="relative z-10 text-center">
            <h2 style={{ ...PLAYFAIR, fontSize: "clamp(28px,5vw,64px)", fontWeight: 700, fontStyle: "italic", color: C.white, maxWidth: 900, margin: "0 auto", lineHeight: 1.2 }}>
              "{dt.quoteBanner.text}"
            </h2>
            <p style={{ ...LABEL_CAPS, color: C.mint, marginTop: 32, letterSpacing: "0.4em" }}>
              {dt.quoteBanner.subtext}
            </p>
          </div>
        </section>
      )}

      {/* ══════════════ 7. CTA ══════════════ */}
      <section className="flex flex-col items-center text-center" style={{ backgroundColor: C.surface, padding: "clamp(40px,8vw,80px) clamp(20px,5vw,64px)" }}>
        <span style={{ ...LABEL_CAPS, color: C.secondary, marginBottom: 24 }}>{dt.cta.label}</span>
        <h2 className="font-playfair" style={{ fontSize: "clamp(48px,7vw,84px)", fontWeight: 700, color: C.primary, marginBottom: 48, maxWidth: 800, lineHeight: 1.1 }}>
          {dt.cta.headline}
        </h2>
        <p style={{ ...INTER, fontSize: 18, fontWeight: 300, color: C.onSurfaceVariant, marginBottom: 64, maxWidth: 520, lineHeight: 1.7 }}>
          {dt.cta.body}
        </p>
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
            className="flex-grow bg-transparent px-4 py-4 focus:outline-none transition-all"
            style={{ borderBottom: `2px solid ${C.outlineVariant}`, ...INTER, fontSize: 16 }}
            onFocus={e => (e.currentTarget as HTMLInputElement).style.borderBottomColor = C.primary}
            onBlur={e => (e.currentTarget as HTMLInputElement).style.borderBottomColor = C.outlineVariant}
            data-testid="input-newsletter-email" />
          <Link href={dt.cta.ctaHref || "/shop"}>
            <button className="whitespace-nowrap transition-all"
              style={{ backgroundColor: C.primary, color: C.white, ...LABEL_CAPS, padding: "16px 40px" }}
              data-testid="btn-newsletter-shop">
              {dt.cta.ctaText}
            </button>
          </Link>
        </div>
        <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.outline, marginTop: 32 }}>
          Exclusive access to rare protein drops and veterinary white papers.
        </p>
      </section>

      <EditorialFooter footer={footer} />
    </div>
  );
}
