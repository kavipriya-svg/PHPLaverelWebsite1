import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag, Plus, ShieldCheck, FlaskConical, Leaf, Droplets,
  PawPrint, Globe, Camera, PlayCircle, Quote, Menu, X, Search,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  mergeHomepageSettings,
  HomepageSettings,
} from "@/lib/homepageDefaults";
import type { HomeBlock } from "@shared/schema";

// ─── Editorial Color Palette ───────────────────────────────────────
const C = {
  primary: "#00160c",
  secondary: "#944923",
  surface: "#f9faf6",
  surfaceContainer: "#eeeeeb",
  surfaceContainerLow: "#f3f4f0",
  onSurface: "#1a1c1a",
  onSurfaceVariant: "#414844",
  outline: "#717973",
  outlineVariant: "#c1c8c2",
  primaryContainer: "#012d1d",
  onPrimaryContainer: "#6d9681",
  primaryFixed: "#c0edd4",
  white: "#ffffff",
} as const;

// ─── Scroll-Reveal Component ───────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.8s ease-out ${delay}ms, transform 0.8s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Image helpers ─────────────────────────────────────────────────
function getProductImage(product: any): string {
  if (!product) return "";
  const imgs = product.images || product.productImages || [];
  const primary = imgs.find((i: any) => i.isPrimary) || imgs[0];
  return primary?.url || primary?.imageUrl || product.imageUrl || product.image || "";
}

function getCategoryImage(category: any): string {
  if (!category) return "";
  return category.bannerUrl || category.iconUrl || category.imageUrl || "";
}

// ─── 1. Editorial Header ───────────────────────────────────────────
function EditorialHeader({ nav }: { nav: HomepageSettings["nav"] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const handleSearchOpen = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery("");
    navigate(`/shop?search=${encodeURIComponent(q)}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-margin-desktop py-6"
      style={{ backgroundColor: `${C.surface}F2`, backdropFilter: "blur(12px)" }}
    >
      <Link href="/">
        <span
          className="font-playfair font-bold cursor-pointer select-none"
          style={{ fontSize: 24, letterSpacing: "0.1em", color: C.primary }}
        >
          19 DOGS
        </span>
      </Link>

      {/* Desktop nav — hidden when search is expanded */}
      {!searchOpen && (
        <nav className="hidden md:flex items-center gap-8">
          {nav.links.map((link) => (
            <Link key={link.href + link.label} href={link.href}>
              <span
                className="font-inter text-body-sm cursor-pointer transition-opacity hover:opacity-60"
                style={{ color: C.onSurface }}
              >
                {link.label}
              </span>
            </Link>
          ))}
        </nav>
      )}

      {/* Expanding search bar (desktop) */}
      {searchOpen && (
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 items-center mx-8 border-b"
          style={{ borderColor: C.primary }}
        >
          <Search className="w-4 h-4 mr-3 flex-shrink-0" style={{ color: C.outline }} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search products…"
            className="flex-1 bg-transparent font-inter text-body-md outline-none py-1"
            style={{ color: C.onSurface }}
            data-testid="input-search-header"
          />
          <button
            type="button"
            onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
            className="ml-3 flex-shrink-0 transition-opacity hover:opacity-60"
            style={{ color: C.outline }}
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      <div className="flex items-center gap-4">
        <Link href={nav.ctaHref}>
          <button
            className="hidden md:block font-inter text-label-caps uppercase tracking-widest px-6 py-3 transition-all duration-200 cursor-pointer"
            style={{ backgroundColor: C.primary, color: C.white }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = C.secondary)}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = C.primary)}
            data-testid="button-join-the-pack"
          >
            {nav.ctaText}
          </button>
        </Link>

        {/* Search icon (desktop) */}
        {!searchOpen && (
          <button
            className="hidden md:flex items-center justify-center transition-opacity hover:opacity-60"
            onClick={handleSearchOpen}
            aria-label="Search"
            data-testid="button-search-open"
            style={{ color: C.onSurface }}
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        <Link href="/cart">
          <ShoppingBag
            className="w-6 h-6 cursor-pointer transition-opacity hover:opacity-60"
            style={{ color: C.onSurface }}
            data-testid="icon-cart-header"
          />
        </Link>
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          data-testid="button-mobile-menu"
          style={{ color: C.onSurface }}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {menuOpen && (
        <div
          className="absolute top-full left-0 right-0 flex flex-col py-6 px-margin-desktop gap-6"
          style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.outlineVariant}` }}
        >
          {/* Mobile search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center border-b pb-4" style={{ borderColor: C.outlineVariant }}>
            <Search className="w-4 h-4 mr-3 flex-shrink-0" style={{ color: C.outline }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products…"
              className="flex-1 bg-transparent font-inter text-body-md outline-none"
              style={{ color: C.onSurface }}
              data-testid="input-search-mobile"
            />
          </form>

          {nav.links.map((link) => (
            <Link key={link.href + link.label} href={link.href}>
              <span
                className="font-playfair text-headline-md cursor-pointer"
                style={{ color: C.primary }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </span>
            </Link>
          ))}
          <Link href={nav.ctaHref}>
            <button
              className="font-inter text-label-caps uppercase tracking-widest px-6 py-3 w-fit cursor-pointer"
              style={{ backgroundColor: C.primary, color: C.white }}
              onClick={() => setMenuOpen(false)}
            >
              {nav.ctaText}
            </button>
          </Link>
        </div>
      )}
    </header>
  );
}

// ─── 2. Hero Section ───────────────────────────────────────────────
function HeroSection({ hero }: { hero: HomepageSettings["hero"] }) {
  const headlineLines = hero.headline.split("\n");
  return (
    <section className="relative h-screen w-full flex items-center justify-start overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover"
          src={hero.bgImageUrl}
          alt="19 Dogs editorial hero"
          loading="eager"
        />
        <div className="absolute inset-0" style={{ backgroundColor: `${C.primary}1A` }} />
      </div>
      <div className="relative z-10 px-margin-desktop mt-20 max-w-4xl">
        <p
          className="font-inter text-label-caps uppercase mb-4"
          style={{ color: C.onPrimaryContainer }}
        >
          {hero.label}
        </p>
        <h1
          className="font-playfair italic leading-tight mb-6"
          style={{ fontSize: "clamp(48px,8vw,84px)", lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: 700, color: C.primary }}
        >
          {headlineLines.map((line, i) => (
            <span key={i}>{line}{i < headlineLines.length - 1 && <br />}</span>
          ))}
        </h1>
        <p
          className="font-playfair text-headline-md italic mb-10"
          style={{ color: C.primaryContainer }}
        >
          {hero.subheadline}
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href={hero.cta1Href}>
            <button
              className="font-inter text-label-caps uppercase tracking-widest px-10 py-4 transition-all duration-200 cursor-pointer"
              style={{ backgroundColor: C.primary, color: C.white }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = C.secondary)}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = C.primary)}
            >
              {hero.cta1Text}
            </button>
          </Link>
          <Link href={hero.cta2Href}>
            <button
              className="font-inter text-label-caps uppercase tracking-widest px-10 py-4 border transition-all duration-200 cursor-pointer"
              style={{ borderColor: C.secondary, color: C.secondary, backgroundColor: "transparent" }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = C.secondary; e.currentTarget.style.color = C.white; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.secondary; }}
            >
              {hero.cta2Text}
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── 3. Category Hub ───────────────────────────────────────────────
const CATEGORY_FALLBACK_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD_hXasSEKk8hmcQOZGd4ggdnSJIg4qplSEBX9mvvRyQF2q9SEFl-1rqn1fk74EKSwIrmzyTZ4Dxtv1Jje92SdridvnqHCBbPOxjF9L9F4Q8qWgZXkKdfLQ1c0Phv7eGwPiot5-TBUVnf8epSVIjh40zsh1qxPWGjajB8IxAF6uUqtw4g7sz6FgmOoWip3Kkih_Ibq5EEvnfwC9iytFBJgNfJTa2IlmmWU5Mvw0R2M_6SC5BS6XtnkkJezu5zWh2ywkmZQftOX5Gqsv",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAfwiCVkAPqHg1ySjuYK0VtiK3i_CmkQrxJHNIqk1yPDx7WiqzemXvfaJzo4Qo963LsuIEyzCOGqPefsiyj3D7nyqKD1Cld6GrIduu-D2cVNXNP_hL2xK53PKjX6KIq8Be_bgF2--WMOj3h_NZ-YDQP2In7Bjbfm7EYbOuY_QWMc9zhxa8BsnOzXxDgpeHT-TEGJvWp_5M2TRc3h0yE_TCqPyziXDIINmgvKrte2685KkTmwNcBQbzreUM-djlWYEtNQFssp-SITnrp",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAHW_A5xnUOSgtg7KfSKR4qCS5IPsEaIxWBIR9ZT_lHGf9uYcdZ32oEo4BRckh7wsQB0K4rtrsYTeVziQz4hZivRJur-cf2BOBj4EREkMr_Lr5HQ20H-yknxWHC5VSiU71jbCN-xyPgagcvYjT4xfOLnid0c2D1mhFg_rWJtPQSSdi9QTPX8mZ2cTgjnGLs994OrC0BbkXnslrZAFBNykwz5118RF1AFdmWyOB2IDTUrlwKZtlRvoQrWbWnkjQPShhuNhrTUnj4gi-3",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAhnR0MUApTUHKiliF37T8XkidY5NqkyVv8QrNwTv9lwlk3lAmWK7bgPAnQ9SOqWOoBQaf26WN412-Mpq1aqLJ-dCjc_q-ulgR8SDt3-Jwq5jBTeQSg6hvPOiR8iiYq2QepSDXbqzhjzt19tRpj4hpqjln3rwm3sJWZUpBwAr7CvmSa7_eo37nuTZFjDuS867jyf-05-l9OQ89mdoLB94KA4eB3t_FYa5jGhcZ3TokkhBBldkHtlRqt2Wo_SWvvPBPAv69qYCpYQjk0",
];

const CATEGORY_CTAS = ["EXPLORE DIETS", "VIEW CLOTHING", "SHOP TREATS", "VIEW ALL"];

function CategoryHub({
  categories,
  categoryHub,
}: {
  categories: any[];
  categoryHub: HomepageSettings["categoryHub"];
}) {
  const cats = categories.slice(0, 4);

  return (
    <section className="px-margin-desktop py-stack-lg" style={{ backgroundColor: C.surface }}>
      <div className="grid grid-cols-12 gap-gutter items-end mb-stack-md">
        <Reveal className="col-span-12 md:col-span-7">
          <p className="font-inter text-label-caps mb-2" style={{ color: C.secondary }}>
            {categoryHub.label}
          </p>
          <h2 className="font-playfair text-headline-lg mb-8" style={{ color: C.primary }}>
            {categoryHub.title}
          </h2>
        </Reveal>
      </div>
      <div className="grid grid-cols-12 gap-gutter">
        {/* Large card */}
        <Reveal className="col-span-12 md:col-span-7 relative group">
          <div className="hard-shadow overflow-hidden relative" style={{ height: 600, backgroundColor: C.surfaceContainer }}>
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              src={getCategoryImage(cats[0]) || CATEGORY_FALLBACK_IMAGES[0]}
              alt={cats[0]?.name || "Biological Food"}
              loading="lazy"
              onError={(e) => { e.currentTarget.src = CATEGORY_FALLBACK_IMAGES[0]; }}
            />
            <div className="absolute bottom-10 left-10 p-8 max-w-sm" style={{ backgroundColor: C.primary, color: C.white }}>
              <h3 className="font-playfair text-headline-md mb-2">{cats[0]?.name || "Biological Food"}</h3>
              <p className="font-inter text-body-md mb-4">Precision nutrition designed for the canine predator.</p>
              <Link href={cats[0]?.slug ? `/category/${cats[0].slug}` : "/shop"}>
                <span className="font-inter text-label-caps border-b border-white pb-1 cursor-pointer">
                  {CATEGORY_CTAS[0]}
                </span>
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Offset small card */}
        <Reveal className="col-span-12 md:col-span-4 md:col-start-9 mt-stack-md md:mt-24" delay={100}>
          <div className="hard-shadow overflow-hidden relative group" style={{ height: 450, backgroundColor: C.surfaceContainer }}>
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              src={getCategoryImage(cats[1]) || CATEGORY_FALLBACK_IMAGES[1]}
              alt={cats[1]?.name || "Modern Apparel"}
              loading="lazy"
              onError={(e) => { e.currentTarget.src = CATEGORY_FALLBACK_IMAGES[1]; }}
            />
            <div className="absolute inset-0 flex flex-col justify-end p-8" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)" }}>
              <h3 className="font-playfair text-headline-md" style={{ color: C.white }}>{cats[1]?.name || "Modern Apparel"}</h3>
              <Link href={cats[1]?.slug ? `/category/${cats[1].slug}` : "/category/clothing"}>
                <span className="font-inter text-label-caps mt-2 cursor-pointer" style={{ color: C.white }}>{CATEGORY_CTAS[1]}</span>
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Secondary card 1 */}
        <Reveal className="col-span-12 md:col-span-5" delay={150}>
          <div className="hard-shadow overflow-hidden relative group mt-12" style={{ height: 400, backgroundColor: C.surfaceContainer }}>
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              src={getCategoryImage(cats[2]) || CATEGORY_FALLBACK_IMAGES[2]}
              alt={cats[2]?.name || "High Protein Treats"}
              loading="lazy"
              onError={(e) => { e.currentTarget.src = CATEGORY_FALLBACK_IMAGES[2]; }}
            />
            <div
              className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: `${C.primary}33` }}
            >
              <h3 className="font-playfair text-headline-md" style={{ color: C.white }}>{cats[2]?.name || "High Protein Treats"}</h3>
              <Link href={cats[2]?.slug ? `/category/${cats[2].slug}` : "/shop"}>
                <button className="mt-4 font-inter text-label-caps px-6 py-2 cursor-pointer" style={{ backgroundColor: C.white, color: C.primary }}>
                  {CATEGORY_CTAS[2]}
                </button>
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Secondary card 2 */}
        <Reveal className="col-span-12 md:col-span-6 md:col-start-7" delay={200}>
          <div className="hard-shadow overflow-hidden relative group mt-6" style={{ height: 400, backgroundColor: C.surfaceContainer }}>
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              src={getCategoryImage(cats[3]) || CATEGORY_FALLBACK_IMAGES[3]}
              alt={cats[3]?.name || "Twinning"}
              loading="lazy"
              onError={(e) => { e.currentTarget.src = CATEGORY_FALLBACK_IMAGES[3]; }}
            />
            <div className="absolute top-8 right-8 p-4" style={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}>
              <p className="font-inter text-label-caps" style={{ color: C.primary }}>NEW ARRIVAL</p>
              <h3 className="font-playfair text-headline-md" style={{ color: C.primary }}>{cats[3]?.name || "Twinning"}</h3>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── 4. Best Sellers ───────────────────────────────────────────────
function BestSellersSection({
  products,
  bestSellers,
}: {
  products: any[];
  bestSellers: HomepageSettings["bestSellers"];
}) {
  const { addToCart } = useStore();
  const { toast } = useToast();

  const fallbackProducts = [
    { title: "Ancestral Beef & Organ", label: "RAW REVOLUTION", price: "84.00" },
    { title: "Wild Caught Omega-3", label: "BIOME BOOST", price: "42.00" },
    { title: "Air-Dried Bison Heart", label: "THE HUNT SERIES", price: "28.00" },
    { title: "The Biological Starter Kit", label: "TRIAL PACK", price: "55.00" },
  ];

  const items = products.length > 0 ? products : fallbackProducts;
  const fallbackImgs = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBPcYcHlncUNn6qI9gIWdccIu-HWBHYSopDGUki5XiRWhdx0ijxQdFsGnkwfjYUQ5bkXlmu524LIeCzE8u4jOmmjFSAg8qImjz-ykysFBK2py4c6Szog0vBV941Wv-BH7-WPEsjLwKACVEc7Rg_jNiwxmhJdxX8iY4Xm-16cnznQPs8-3frzVTRYGCmPAxzOzyst3xbd7nChvkh36hiVPzynrdktOHdtBbLc-ewjkvDGpjmfpBYZYhFb2MO8OuXTphQXcCRTOkCCNQa",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDm0XP20ShWtMUi4wczdFCRqzjg0uL0svm_F69UAye4Ds9jP-g_56o4_OmnMntVjkH91MwrDL6BE4FxUeZYFIkMznQv_PRqxhAAeRED0pF8A5uizgIbSkckr3yp8OAuYt-WuAZc0BJRvJqEnI2F9a9Y5uhhwAUEkxbKR72OGhEmENO_RnctjHYInr6yUfFa1o_Wv4q_HIhHED22iSZBDmjr9uaJqz1sFw-zJImQsOwv2s7RlE5VXdSRikBN0mqAN0jGJlVCbxjlP39n",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCQND1L00AfgJDdPBsX9N92IzkSmyii1ccMikeNgTv_jqUZWiZIbK83IRGpr87P9KqLCCOwkp69A5JXXnKgmpkfSoqGastzLhvKE0j5MHN6WQdhzHsT9wLVd0l4jFi1iE8cZcTUzv6-zAB6HW9gclBijAhKzg7kCpGwywGlNHqvH0gjR6UcJjH0Z7FMUveeQ0cJSFakWzxWcfU1-L2dvl4Q_4U3PHEYtKCgWnaxjzO3CMWZKe9mkXhNxY49Uphqwkl4l9MxSFE5adjd",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAOTM01jJkzk10_4FxikakQi0AhXe2qc_xCreZN4IahYMGr3rHF1jpV2I0IVz3uNmJati-t5vg0lXATDFAhaJ-AbFe7kcb79iuTHUsIBpAuyt-JTs9kAxnxLvaIpEYWe8vZ_FnpziMbrbNaHWUTklouLeY8cqQTrNYqS2BrT5q66dl6QXWGGszX8vfoJBBCfscGpewrMPHL7gXrDDChxE4q6e8QjtOhMocCa-Lt5nvpvkPXwwqPvGZnbQmjqwSdWbicnPkTbLJW6PqW",
  ];

  return (
    <section className="px-margin-desktop py-stack-lg" style={{ backgroundColor: C.surfaceContainerLow }}>
      <div className="flex justify-between items-baseline mb-stack-md flex-wrap gap-4">
        <Reveal>
          <h2 className="font-playfair text-headline-lg" style={{ color: C.primary }}>{bestSellers.title}</h2>
        </Reveal>
        <Link href={bestSellers.browseHref}>
          <span
            className="font-inter text-label-caps cursor-pointer hover:underline"
            style={{ color: C.secondary }}
          >
            {bestSellers.browseText}
          </span>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        {items.slice(0, bestSellers.limit).map((p: any, i: number) => (
          <Reveal key={p.id || i} delay={i * 100}>
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden mb-4" style={{ aspectRatio: "4/5", backgroundColor: C.white }}>
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  src={getProductImage(p) || fallbackImgs[i % fallbackImgs.length]}
                  alt={p.title}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = fallbackImgs[i % fallbackImgs.length]; }}
                />
                {p.id && (
                  <button
                    className="absolute bottom-4 right-4 w-12 h-12 flex items-center justify-center transition-colors duration-200"
                    style={{ backgroundColor: C.primary, color: C.white }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = C.secondary)}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = C.primary)}
                    onClick={() => {
                      addToCart(p.id);
                      toast({ title: "Added to cart", description: p.title });
                    }}
                    aria-label={`Add ${p.title} to cart`}
                    data-testid={`button-add-to-cart-${p.id}`}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="font-inter text-label-caps mb-1" style={{ color: C.outline }}>
                {p.label || p.category?.name || "FEATURED"}
              </p>
              <h4
                className="font-playfair mb-2"
                style={{ fontSize: 24, color: C.primary }}
              >
                {p.title}
              </h4>
              <p className="font-inter font-bold" style={{ color: C.secondary }}>
                {p.price ? `₹${parseFloat(p.salePrice || p.price).toFixed(2)}` : `$${p.price}`}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── 5. Treats Section ────────────────────────────────────────────
function TreatsSection({
  products,
  treats,
}: {
  products: any[];
  treats: HomepageSettings["treats"];
}) {
  const { addToCart } = useStore();
  const { toast } = useToast();

  const fallbacks = [
    { title: "Wild Salmon Bites", label: "SINGLE PROTEIN", price: "18.00", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDm0XP20ShWtMUi4wczdFCRqzjg0uL0svm_F69UAye4Ds9jP-g_56o4_OmnMntVjkH91MwrDL6BE4FxUeZYFIkMznQv_PRqxhAAeRED0pF8A5uizgIbSkckr3yp8OAuYt-WuAZc0BJRvJqEnI2F9a9Y5uhhwAUEkxbKR72OGhEmENO_RnctjHYInr6yUfFa1o_Wv4q_HIhHED22iSZBDmjr9uaJqz1sFw-zJImQsOwv2s7RlE5VXdSRikBN0mqAN0jGJlVCbxjlP39n" },
    { title: "Freeze-Dried Liver Cubes", label: "TRAINING FUEL", price: "22.00", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQND1L00AfgJDdPBsX9N92IzkSmyii1ccMikeNgTv_jqUZWiZIbK83IRGpr87P9KqLCCOwkp69A5JXXnKgmpkfSoqGastzLhvKE0j5MHN6WQdhzHsT9wLVd0l4jFi1iE8cZcTUzv6-zAB6HW9gclBijAhKzg7kCpGwywGlNHqvH0gjR6UcJjH0Z7FMUveeQ0cJSFakWzxWcfU1-L2dvl4Q_4U3PHEYtKCgWnaxjzO3CMWZKe9mkXhNxY49Uphqwkl4l9MxSFE5adjd" },
    { title: "Air-Dried Bison Strips", label: "THE HUNT SERIES", price: "26.00", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPcYcHlncUNn6qI9gIWdccIu-HWBHYSopDGUki5XiRWhdx0ijxQdFsGnkwfjYUQ5bkXlmu524LIeCzE8u4jOmmjFSAg8qImjz-ykysFBK2py4c6Szog0vBV941Wv-BH7-WPEsjLwKACVEc7Rg_jNiwxmhJdxX8iY4Xm-16cnznQPs8-3frzVTRYGCmPAxzOzyst3xbd7nChvkh36hiVPzynrdktOHdtBbLc-ewjkvDGpjmfpBYZYhFb2MO8OuXTphQXcCRTOkCCNQa" },
    { title: "Kelp & Coconut Chews", label: "SUPERFOOD BLEND", price: "19.00", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOTM01jJkzk10_4FxikakQi0AhXe2qc_xCreZN4IahYMGr3rHF1jpV2I0IVz3uNmJati-t5vg0lXATDFAhaJ-AbFe7kcb79iuTHUsIBpAuyt-JTs9kAxnxLvaIpEYWe8vZ_FnpziMbrbNaHWUTklouLeY8cqQTrNYqS2BrT5q66dl6QXWGGszX8vfoJBBCfscGpewrMPHL7gXrDDChxE4q6e8QjtOhMocCa-Lt5nvpvkPXwwqPvGZnbQmjqwSdWbicnPkTbLJW6PqW" },
  ];

  const items = products.length > 0 ? products : fallbacks;

  return (
    <section className="px-margin-desktop py-stack-lg" style={{ backgroundColor: C.white }}>
      <div className="flex justify-between items-baseline mb-stack-md flex-wrap gap-4">
        <Reveal>
          <p className="font-inter text-label-caps mb-2" style={{ color: C.secondary }}>
            {treats.label}
          </p>
          <h2 className="font-playfair text-headline-lg" style={{ color: C.primary }}>
            {treats.title}
          </h2>
        </Reveal>
        <Link href={treats.browseHref}>
          <span
            className="font-inter text-label-caps cursor-pointer hover:underline"
            style={{ color: C.secondary }}
          >
            {treats.browseText}
          </span>
        </Link>
      </div>

      {/* Horizontal strip layout — wide cards with landscape images */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        {items.slice(0, treats.limit).map((p: any, i: number) => (
          <Reveal key={p.id || i} delay={i * 80}>
            <div className="group cursor-pointer">
              <div
                className="relative overflow-hidden mb-4"
                style={{ aspectRatio: "1/1", backgroundColor: C.surfaceContainerLow }}
              >
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  src={getProductImage(p) || p.img || fallbacks[i % fallbacks.length].img}
                  alt={p.title}
                  loading="lazy"
                  onError={(e) => {
                    const fb = fallbacks[i % fallbacks.length];
                    if (fb?.img) e.currentTarget.src = fb.img;
                  }}
                />
                {/* Treat badge */}
                <div
                  className="absolute top-3 left-3 px-3 py-1"
                  style={{ backgroundColor: C.secondary }}
                >
                  <p className="font-inter text-label-caps" style={{ color: C.white, fontSize: 9 }}>
                    {p.label || p.category?.name || fallbacks[i % fallbacks.length].label}
                  </p>
                </div>
                {p.id && (
                  <button
                    className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center transition-colors duration-200"
                    style={{ backgroundColor: C.primary, color: C.white }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = C.secondary)}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = C.primary)}
                    onClick={() => {
                      addToCart(p.id);
                      toast({ title: "Added to cart", description: p.title });
                    }}
                    aria-label={`Add ${p.title} to cart`}
                    data-testid={`button-add-to-cart-treats-${p.id}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h4
                className="font-playfair mb-1"
                style={{ fontSize: 18, color: C.primary, lineHeight: 1.2 }}
              >
                {p.title}
              </h4>
              <p className="font-inter font-bold text-sm" style={{ color: C.secondary }}>
                {p.price
                  ? `₹${parseFloat(p.salePrice || p.price).toFixed(2)}`
                  : `$${fallbacks[i % fallbacks.length].price}`}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── 6. Ancestral Philosophy ───────────────────────────────────────
function AncestralPhilosophySection({
  philosophy,
}: {
  philosophy: HomepageSettings["philosophy"];
}) {
  return (
    <section className="py-stack-lg px-margin-desktop overflow-hidden">
      <div className="grid grid-cols-12 gap-gutter items-center">
        <Reveal className="col-span-12 md:col-span-6 relative">
          <div className="hard-shadow">
            <img
              className="w-full object-cover"
              style={{ aspectRatio: "1/1" }}
              src={philosophy.imageUrl}
              alt="Ancestral precision philosophy"
              loading="lazy"
            />
          </div>
          <div
            className="absolute p-10 border shadow-xl max-w-sm"
            style={{
              bottom: -40, right: -40,
              backgroundColor: C.surface,
              borderColor: C.outlineVariant,
            }}
          >
            <Quote className="w-8 h-8 mb-4" style={{ color: C.secondary }} />
            <p
              className="font-playfair text-headline-md italic leading-snug"
              style={{ color: C.primary }}
            >
              "{philosophy.quote}"
            </p>
            <p className="font-inter text-label-caps mt-6" style={{ color: C.onSurfaceVariant }}>
              — {philosophy.quoteAuthor}
            </p>
          </div>
        </Reveal>

        <Reveal className="col-span-12 md:col-span-5 md:col-start-8 mt-24 md:mt-0" delay={150}>
          <p className="font-inter text-label-caps uppercase mb-4" style={{ color: C.secondary }}>
            {philosophy.label}
          </p>
          <h2 className="font-playfair text-headline-lg mb-8" style={{ color: C.primary }}>
            {philosophy.title}
          </h2>
          <ul className="space-y-8">
            {philosophy.principles.map(p => (
              <li key={p.num} className="flex gap-4">
                <span className="font-playfair text-headline-md shrink-0" style={{ color: C.secondary }}>{p.num}</span>
                <div>
                  <h4 className="font-inter text-label-md uppercase mb-2" style={{ color: C.primary }}>{p.title}</h4>
                  <p className="font-inter text-body-md" style={{ color: C.onSurfaceVariant }}>{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

// ─── 6. Trending Apparel ───────────────────────────────────────────
function TrendingApparelSection({
  products,
  apparel,
}: {
  products: any[];
  apparel: HomepageSettings["apparel"];
}) {
  const fallbacks = [
    { title: "Technical Parka 01", price: "120.00", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4p5wMd6nWLiWwi9q7jgBakAQautr8BBMcalRpDV3Kq_AIBBidaaRXlBGZGRyurX4DplAp0Lw7gdHzuLmBZwVay8ICPVRDdUHvO9PEuopxKGaiJz_8Lf1nFG6vt1AG1fXjbEDhThYlS17A2vcxBJmjFkI1FesS721EF0wH3qTcAkSZFnez2McqUpyMQecby7evNyc72V2qX1VmxxAiejtHf2cC8YW8MVK1kb-rtMdmDlsn2uXDwgEhTd6nOPJ4GDLs-l7BkowafE_j" },
    { title: "Heritage Knit", price: "95.00", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXSi19gYrwB0gDOYdWXbQFZT10xU34XZyt_hDm8VS0erwto6In5iXvY1Lz-pqBANPYK0Co8Hkk60govuOx3zSMnk4ri6LpyfeQiW4oXG3FMRdRAxuMVxs5mGIBOZb4E7dlIjZgjqDwOqzgHZcBWruV87m_L0mMhfSIbyQW7wxi0ITuYQMhenW7dqwgo2KxCNf6ktWBtmj83rUGZ_pyeWIo32pYDvCEzANF4a26FTGU0CemOMoq9Koj7_MKQho_8FdJjWd3KwbNpPO" },
    { title: "Field Harness Pro", price: "78.00", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2gmiXeEW4z_y8Z0AP6XMHKsyxu0_lqz3PR9Vbxsgh2VF0-QfeRjdEucit3cI27xGy1MIIHBHyGhuTAuuK3YehOB7Ojl83MgydgpxS4T-PjU-JHivP5S4HQBRCYX8ECdLucSVM9g4KQ1rCzweSHfAGW_2GDV84fK_5KLA3evaJ7x_oe_1g974K--dnQdP5Y0WpF7rTDWgdNN2ls-0yXF7kDGVMiZf6oFlEJcWur3lSVJyOzH-SxfpFRy2WQRA-OWoQanxrXNcVwT" },
  ];

  const items = products.length > 0 ? products.slice(0, apparel.limit) : fallbacks.slice(0, apparel.limit);

  return (
    <section className="px-margin-desktop py-stack-lg" style={{ backgroundColor: C.white }}>
      <Reveal className="text-center mb-stack-md">
        <p className="font-inter text-label-caps mb-2" style={{ color: C.outline }}>{apparel.label}</p>
        <h2 className="font-playfair text-headline-lg" style={{ color: C.primary }}>{apparel.title}</h2>
      </Reveal>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {items.map((item: any, i: number) => (
          <Reveal key={item.id || i} delay={i * 100}>
            <Link href={item.slug ? `/product/${item.slug}` : "/category/clothing"}>
              <div className="cursor-pointer group">
                <div className="relative overflow-hidden mb-4" style={{ aspectRatio: "3/4" }}>
                  <img
                    className="w-full h-full object-cover"
                    src={getProductImage(item) || item.img}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => { if (item.img) e.currentTarget.src = item.img; }}
                  />
                  <div className="absolute bottom-6 left-6 flex gap-2">
                    <button className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: C.primary }} aria-label="Color option 1" />
                    <button className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: C.secondary }} aria-label="Color option 2" />
                    <button className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: C.outline }} aria-label="Color option 3" />
                  </div>
                </div>
                <h4 className="font-playfair" style={{ fontSize: 24, color: C.onSurface }}>{item.title}</h4>
                <p className="font-inter text-body-md" style={{ color: C.onSurfaceVariant }}>
                  {item.price ? `₹${parseFloat(item.salePrice || item.price).toFixed(2)}` : `$${item.price}`}
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── 7. Wolf Principle ─────────────────────────────────────────────
function WolfPrincipleSection({
  wolfPrinciple,
}: {
  wolfPrinciple: HomepageSettings["wolfPrinciple"];
}) {
  return (
    <section className="py-32 relative overflow-hidden" style={{ backgroundColor: C.primary }}>
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
        <PawPrint style={{ width: 600, height: 600, color: C.white }} />
      </div>
      <div className="relative z-10 px-margin-desktop text-center max-w-4xl mx-auto">
        <Reveal>
          <p className="font-inter text-label-caps tracking-widest mb-6" style={{ color: C.onPrimaryContainer }}>
            {wolfPrinciple.label}
          </p>
          <h2
            className="font-playfair italic mb-10"
            style={{ fontSize: "clamp(40px,6vw,84px)", lineHeight: "1.05", fontWeight: 700, color: C.white }}
          >
            {wolfPrinciple.headline}
          </h2>
          <p
            className="font-playfair text-headline-md italic mb-12"
            style={{ color: C.primaryFixed }}
          >
            {wolfPrinciple.body}
          </p>
          <Link href={wolfPrinciple.ctaHref}>
            <button
              className="font-inter text-label-caps tracking-widest uppercase px-12 py-5 transition-all duration-200 cursor-pointer"
              style={{ backgroundColor: C.white, color: C.primary }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = C.secondary; e.currentTarget.style.color = C.white; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = C.white; e.currentTarget.style.color = C.primary; }}
            >
              {wolfPrinciple.ctaText}
            </button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

// ─── 8. Founder's Mission ──────────────────────────────────────────
function FounderMissionSection({
  founder,
}: {
  founder: HomepageSettings["founder"];
}) {
  return (
    <section className="px-margin-desktop py-stack-lg" style={{ backgroundColor: C.surface }}>
      <div className="grid grid-cols-12 gap-gutter items-center">
        <Reveal className="col-span-12 md:col-span-5">
          <p className="font-inter text-label-caps mb-4" style={{ color: C.secondary }}>{founder.label}</p>
          <h2 className="font-playfair text-headline-lg mb-8" style={{ color: C.primary }}>{founder.title}</h2>
          <p className="font-inter text-body-lg mb-10" style={{ color: C.onSurfaceVariant }}>
            "{founder.quote}"
          </p>
          <div className="flex items-center gap-4">
            <div className="w-16 h-px" style={{ backgroundColor: C.primary }} />
            <p className="font-playfair text-headline-md italic" style={{ color: C.onSurface }}>{founder.name}</p>
          </div>
        </Reveal>
        <Reveal className="col-span-12 md:col-span-6 md:col-start-7" delay={150}>
          <div className="hard-shadow">
            <img
              className="w-full object-cover"
              style={{ aspectRatio: "4/5" }}
              src={founder.imageUrl}
              alt={`${founder.name}, Founder of 19 DOGS`}
              loading="lazy"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── 9. Gift Sets ──────────────────────────────────────────────────
function GiftSetsSection({
  giftSets,
}: {
  giftSets: HomepageSettings["giftSets"];
}) {
  const { data: comboData } = useQuery<{ offers: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    comboPrice: string;
    originalPrice: string;
    discountPercentage: string | null;
    isFeatured: boolean | null;
  }> }>({
    queryKey: ["/api/combo-offers", { featured: true }],
    queryFn: () => fetch("/api/combo-offers?featured=true&active=true").then(r => r.json()),
  });

  const featuredCombos = comboData?.offers ?? [];
  const hasCombos = featuredCombos.length > 0;

  return (
    <section className="px-margin-desktop py-stack-lg" style={{ backgroundColor: C.surfaceContainerLow }}>
      <Reveal>
        <h2 className="font-playfair text-headline-lg text-center mb-stack-md" style={{ color: C.primary }}>
          {giftSets.sectionTitle}
        </h2>
      </Reveal>

      {hasCombos ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {featuredCombos.map((combo, i) => (
            <Reveal key={combo.id} delay={i * 100}>
              <Link href={`/combo-offers/${combo.slug}`}>
                <div
                  className="border flex flex-col justify-between p-8 h-full cursor-pointer transition-shadow duration-200 hover:shadow-md"
                  style={{ backgroundColor: C.white, borderColor: C.outlineVariant }}
                >
                  <div>
                    <h3 className="font-playfair text-headline-md mb-4" style={{ color: C.onSurface }}>{combo.name}</h3>
                    {combo.description && (
                      <p className="font-inter text-body-md mb-8" style={{ color: C.onSurfaceVariant }}>{combo.description}</p>
                    )}
                  </div>
                  <div className="mt-auto">
                    {combo.imageUrl && (
                      <img
                        className="w-full object-cover mb-6"
                        style={{ aspectRatio: "16/9" }}
                        src={combo.imageUrl}
                        alt={combo.name}
                        loading="lazy"
                      />
                    )}
                    <button
                      className="w-full py-4 border font-inter text-label-caps uppercase transition-all duration-200"
                      style={{ borderColor: C.primary, color: C.primary, backgroundColor: "transparent" }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.color = C.white; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.primary; }}
                    >
                      Shop Kit — ₹{parseFloat(combo.comboPrice).toLocaleString()}
                    </button>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {giftSets.items.map((g, i) => (
            <Reveal key={g.title || i} delay={i * 100}>
              <div
                className="border flex flex-col justify-between p-8 h-full"
                style={{ backgroundColor: C.white, borderColor: C.outlineVariant }}
              >
                <div>
                  <h3 className="font-playfair text-headline-md mb-4" style={{ color: C.onSurface }}>{g.title}</h3>
                  <p className="font-inter text-body-md mb-8" style={{ color: C.onSurfaceVariant }}>{g.desc}</p>
                </div>
                <div className="mt-auto">
                  <img
                    className="w-full object-cover mb-6"
                    style={{ aspectRatio: "16/9" }}
                    src={g.imageUrl}
                    alt={g.title}
                    loading="lazy"
                  />
                  <button
                    className="w-full py-4 border font-inter text-label-caps uppercase transition-all duration-200"
                    style={{ borderColor: C.primary, color: C.primary, backgroundColor: "transparent" }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.color = C.white; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.primary; }}
                  >
                    Shop Kit — {g.price}
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── 10. Trust Badges ─────────────────────────────────────────────
const TRUST_ICONS = [ShieldCheck, FlaskConical, Leaf, Droplets, PawPrint, Globe];

function TrustBadgesSection({
  trustBadges,
}: {
  trustBadges: HomepageSettings["trustBadges"];
}) {
  return (
    <section
      className="py-16 border-y"
      style={{ backgroundColor: C.surface, borderColor: `${C.outlineVariant}4D` }}
    >
      <Reveal>
        <div className="px-margin-desktop flex flex-wrap justify-center md:justify-between gap-12">
          {trustBadges.items.map(({ label }, i) => {
            const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
            return (
              <div key={label || i} className="flex flex-col items-center text-center max-w-[200px]">
                <Icon className="w-10 h-10 mb-4" style={{ color: C.primary }} />
                <p className="font-inter text-label-caps" style={{ color: C.primary }}>{label}</p>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}

// ─── 11. Community Pack ────────────────────────────────────────────
const COMMUNITY_IMGS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC6N0ilLgFZ2pfWx5oB1ZzkMo-iWwAQv_pvxL0Ho6Qd4YUq4dB6NIo9AmntMUB9OSXuDXbPNyct2iAja1gMXb_h-PGVUGZECuAII5ypzCJQVMQa1-E-QLfgf4Kbm4YH0ks0s_6kDGlTMoG158cGcR42CYflkPkmmV1BOuY9N1FZ2Kc5LaHtRoAQsmJ7peujRNHJpEvVKXchcKZlGoqOiNnp6sg1NLD_rSbfzOUCzdQ_QqXJ9aSJ9Fg53Gs99a8r0Q2GLYTpIuhZpxW_",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOFQi7i7OKf2n03685JClNUwEOfJDAA2EtYsHH4ZkGTMM0DWm9Z9mlLlScl3DKvK9mJhzSUU2hCnbIVyePhGiU83VPln-03GpRjbNcvHe6hZhFiLHgcGsk_6r2L_240jfuPXlHfKp8wWmLEMwL-EbWnTflYz8FfbTzrlwKtdwTGU0p6kJXTGJRi7hSJCy8XXDBhKAFE2KDqqc6-mOUL9x3pTcrTFG8agt7zez0BG9o57YIU1qznIcwdh2nRYZ6kQG83otrB1RN8HZR",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAJaEuWpIkZ_zxluR44EP7n7QCe1h2nRGwiby6kpsneUrQcunmLZWqGUPEkRyR9nz6Hvs6MUV4wOaY0VMpXn22aqdoeZTMD2cizeHUjZG6P3xVk_ChVHcKio9gWJScQ_SVzbOwrJmT6wm4QCZE0avG6IHPCNBqE7FFRF3chOz2-ROSIJ4CXH7l6MxEEIU03Z9eGXTYhfB5PncD4B_DsddzxEySNMkFJUvGNEZUgQfwsnAjbMVi98snLBRg1Z3L4vg6z1q5Z",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD0YHPA_9H7hPEaLMsFgaZHgkk0BlCTRRpNMMn1GTJlZlVyLgW950Rqj9Wzw0ttbwpZf1XL1NNnl_sz1dqhQO-UTAK5JJAtk6mv5cOzGIgOojtaJvWLM012b3cWCfQUSXw5_mLff9E_lFXhl_S8YPTHyXvrJP0XU1OIsPShPplo1-Qo__YLR8_n-k0z4wjB3pfVTWF",
];

function CommunityPackSection({
  reviews,
  communityPack,
}: {
  reviews: any[];
  communityPack: HomepageSettings["communityPack"];
}) {
  const testimonials = reviews.length > 0
    ? reviews.slice(0, 2).map((r: any) => ({
        quote: r.content || r.review,
        author: `${r.user?.firstName || "Customer"} ${r.user?.lastName?.[0] || ""}., ${r.product?.title || "Verified Purchase"}`.toUpperCase(),
      }))
    : communityPack.testimonials;

  return (
    <section className="px-margin-desktop py-stack-lg">
      <Reveal className="text-center mb-16">
        <h2 className="font-playfair text-headline-lg" style={{ color: C.primary }}>{communityPack.title}</h2>
        <p className="font-inter text-body-lg mt-2" style={{ color: C.onSurfaceVariant }}>{communityPack.subtitle}</p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-20">
        {COMMUNITY_IMGS.map((src, i) => {
          const delays = [0, 100, 200, 300];
          const aspects = ["aspect-square", "aspect-[3/4] pt-12", "aspect-[4/5]", "aspect-square pt-24"];
          return (
            <Reveal key={i} delay={delays[i]} className={`editorial-img-hover ${aspects[i]}`}>
              <img className="w-full h-full object-cover" src={src} alt={`Community dog ${i + 1}`} loading="lazy" />
            </Reveal>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {testimonials.map((t, i) => (
          <Reveal key={i} delay={i * 100}>
            <div className="p-12" style={{ backgroundColor: C.surfaceContainer }}>
              <p className="font-inter text-body-lg italic mb-6" style={{ color: C.primary }}>"{t.quote}"</p>
              <p className="font-inter text-label-caps" style={{ color: C.secondary }}>— {t.author}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── 12. Newsletter ────────────────────────────────────────────────
function NewsletterSection({
  newsletter,
}: {
  newsletter: HomepageSettings["newsletter"];
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubmitted(true);
        toast({ title: "Welcome to the Pack!", description: "You've been added to our dispatch." });
      } else {
        toast({ variant: "destructive", title: "Could not subscribe", description: "Please try again later." });
      }
    } catch {
      setSubmitted(true);
      toast({ title: "Welcome to the Pack!", description: "You've been added to our dispatch." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-stack-lg px-margin-desktop" style={{ backgroundColor: C.primaryContainer }}>
      <Reveal className="max-w-4xl mx-auto text-center">
        <p className="font-inter text-label-caps tracking-[0.2em] mb-6" style={{ color: C.onPrimaryContainer }}>
          {newsletter.label}
        </p>
        <h2
          className="font-playfair italic leading-none mb-10"
          style={{ fontSize: "clamp(40px,6vw,64px)", color: C.white }}
        >
          {newsletter.title}
        </h2>
        <p className="font-playfair text-headline-md italic mb-12" style={{ color: C.primaryFixed }}>
          {newsletter.subtitle}
        </p>
        {submitted ? (
          <p className="font-inter text-label-caps" style={{ color: C.primaryFixed }}>
            YOU'RE IN — WELCOME TO THE PACK
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col md:flex-row gap-6 items-end max-w-2xl mx-auto"
          >
            <div className="flex-1 w-full text-left">
              <label
                htmlFor="newsletter-email"
                className="font-inter text-label-caps block mb-2"
                style={{ color: C.primaryFixed }}
              >
                EMAIL ADDRESS
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="JOIN@THEPACK.COM"
                className="border-b-only w-full py-4 bg-transparent font-inter text-body-md"
                style={{ color: C.white }}
                data-testid="input-newsletter-email"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="font-inter text-label-caps tracking-widest px-12 py-4 transition-all duration-200 w-full md:w-auto"
              style={{ backgroundColor: C.white, color: C.primary }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = "#fe9e71"; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = C.white; }}
              data-testid="button-newsletter-subscribe"
            >
              {loading ? "SUBSCRIBING..." : newsletter.ctaText}
            </button>
          </form>
        )}
        <p className="font-inter text-label-caps mt-10" style={{ color: `${C.primaryFixed}80` }}>
          WELCOME TO THE PACK
        </p>
      </Reveal>
    </section>
  );
}

// ─── 13. Editorial Footer ──────────────────────────────────────────
function EditorialFooter({ footer }: { footer: HomepageSettings["footer"] }) {
  return (
    <footer
      className="border-t pt-stack-lg pb-stack-sm"
      style={{ backgroundColor: C.surfaceContainerLow, borderColor: C.outlineVariant }}
    >
      <div className="grid grid-cols-12 gap-gutter px-margin-desktop mb-stack-lg">
        <div className="col-span-12 md:col-span-4">
          <div className="font-playfair font-bold mb-8" style={{ fontSize: 40, color: C.primary }}>19 DOGS</div>
          <p className="font-inter text-body-md max-w-xs" style={{ color: C.onSurfaceVariant }}>
            {footer.tagline}
          </p>
        </div>

        <div className="col-span-6 md:col-span-2">
          <h5 className="font-inter text-label-caps mb-6" style={{ color: C.primary }}>SHOP</h5>
          <ul className="space-y-4" style={{ color: C.onSurfaceVariant }}>
            {[{ l: "Nutrition", h: "/shop" }, { l: "Apparel", h: "/category/clothing" }, { l: "Gift Sets", h: "/shop" }, { l: "The Pantry", h: "/shop" }].map(({ l, h }) => (
              <li key={l}>
                <Link href={h}>
                  <span
                    className="font-inter text-body-md cursor-pointer transition-colors duration-200 hover:opacity-70"
                    style={{ color: C.onSurfaceVariant }}
                  >
                    {l}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-6 md:col-span-2">
          <h5 className="font-inter text-label-caps mb-6" style={{ color: C.primary }}>DISCOVER</h5>
          <ul className="space-y-4">
            {[{ l: "The Science", h: "/about" }, { l: "Whitepapers", h: "/about" }, { l: "Blog", h: "/blog" }, { l: "Our Story", h: "/about" }].map(({ l, h }) => (
              <li key={l}>
                <Link href={h}>
                  <span
                    className="font-inter text-body-md cursor-pointer transition-colors duration-200 hover:opacity-70"
                    style={{ color: C.onSurfaceVariant }}
                  >
                    {l}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-12 md:col-span-4">
          <h5 className="font-inter text-label-caps mb-6" style={{ color: C.primary }}>CONNECT</h5>
          <div className="font-inter text-body-md mb-6" style={{ color: C.onSurfaceVariant }}>
            <p>{footer.email}</p>
            <p>{footer.phone}</p>
          </div>
          <div className="flex gap-4" style={{ color: C.outline }}>
            <Globe className="w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity" />
            <Camera className="w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity" />
            <PlayCircle className="w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity" />
          </div>
        </div>
      </div>

      <div
        className="px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-6 border-t pt-8"
        style={{ borderColor: `${C.outlineVariant}4D` }}
      >
        <p className="font-inter text-body-md" style={{ color: C.onSurfaceVariant }}>
          {footer.copyright}
        </p>
        <div className="flex gap-8 flex-wrap">
          {[{ l: "Privacy Policy", h: "/privacy" }, { l: "Terms of Service", h: "/terms" }, { l: "Accessibility", h: "/" }].map(({ l, h }) => (
            <Link key={l} href={h}>
              <span
                className="font-inter text-body-md underline cursor-pointer transition-colors duration-200 hover:opacity-70"
                style={{ color: C.onSurfaceVariant }}
              >
                {l}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── Dynamic Home Block (editorial styled) ─────────────────────────
function EditorialDynamicBlock({ block }: { block: HomeBlock }) {
  const { addToCart } = useStore();
  const { toast } = useToast();

  const payload = (block.payload || {}) as {
    categoryId?: string;
    categorySlug?: string;
    featuredOnly?: boolean;
    limit?: number;
    html?: string;
  };

  const limit = payload.limit || 4;
  const featuredOnly = payload.featuredOnly ?? false;

  const productQuery =
    block.type === "featured_products"
      ? `/api/products?featured=true&limit=${limit}`
      : payload.categorySlug
      ? `/api/products?categorySlug=${payload.categorySlug}&limit=${limit}${featuredOnly ? "&featured=true" : ""}`
      : payload.categoryId
      ? `/api/products?categoryId=${payload.categoryId}&limit=${limit}${featuredOnly ? "&featured=true" : ""}`
      : null;

  const { data: productsData } = useQuery<{ products: any[] }>({
    queryKey: [productQuery],
    enabled:
      !!productQuery &&
      (block.type === "featured_products" || block.type === "category_products"),
  });

  const products = productsData?.products || [];
  const sectionTitle = block.title || "Products";

  if (block.type === "featured_products" || block.type === "category_products") {
    if (!products.length) return null;
    return (
      <section className="px-margin-desktop py-stack-lg" style={{ backgroundColor: C.white }}>
        <div className="flex justify-between items-baseline mb-stack-md flex-wrap gap-4">
          <Reveal>
            <h2 className="font-playfair text-headline-lg" style={{ color: C.primary }}>
              {sectionTitle}
            </h2>
          </Reveal>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          {products.slice(0, limit).map((p: any, i: number) => (
            <Reveal key={p.id || i} delay={i * 80}>
              <div className="group cursor-pointer">
                <div
                  className="relative overflow-hidden mb-4"
                  style={{ aspectRatio: "1/1", backgroundColor: C.surfaceContainerLow }}
                >
                  <img
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    src={getProductImage(p)}
                    alt={p.title || p.name}
                    loading="lazy"
                  />
                  {p.id && (
                    <button
                      className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center transition-colors duration-200"
                      style={{ backgroundColor: C.primary, color: C.white }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = C.secondary)}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
                      onClick={() => {
                        addToCart(p.id);
                        toast({ title: "Added to cart", description: p.title || p.name });
                      }}
                      aria-label={`Add ${p.title || p.name} to cart`}
                      data-testid={`button-add-to-cart-block-${p.id}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="font-inter text-label-caps mb-1" style={{ color: C.outline }}>
                  {p.category?.name || "FEATURED"}
                </p>
                <h4
                  className="font-playfair mb-1"
                  style={{ fontSize: 20, color: C.primary, lineHeight: 1.2 }}
                >
                  {p.title || p.name}
                </h4>
                <p className="font-inter font-bold text-sm" style={{ color: C.secondary }}>
                  {p.price ? `₹${parseFloat(p.salePrice || p.price).toFixed(2)}` : ""}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "promo_html" && payload.html) {
    return (
      <section
        className="px-margin-desktop py-stack-lg"
        style={{ backgroundColor: C.primaryContainer }}
      >
        <div
          className="prose max-w-none"
          style={{ color: C.onPrimaryContainer }}
          dangerouslySetInnerHTML={{ __html: payload.html }}
        />
      </section>
    );
  }

  if (block.type === "custom_code" && payload.html) {
    return <div dangerouslySetInnerHTML={{ __html: payload.html }} />;
  }

  return null;
}

// ─── Main Home Page ────────────────────────────────────────────────
export default function Home() {
  const { data: settingsData } = useQuery<{ settings: Partial<HomepageSettings> }>({
    queryKey: ["/api/settings/homepage"],
  });

  const s = settingsData
    ? mergeHomepageSettings(settingsData.settings || {})
    : DEFAULT_HOMEPAGE_SETTINGS;

  const bestSellersQuery = `/api/products?categorySlug=${s.bestSellers.categorySlug}&limit=${s.bestSellers.limit}${s.bestSellers.featuredOnly ? "&featured=true" : ""}`;
  const { data: treatsData } = useQuery<{ products: any[] }>({
    queryKey: [bestSellersQuery],
  });

  const apparelQuery = `/api/products?categorySlug=${s.apparel.categorySlug}&limit=${s.apparel.limit}${s.apparel.featuredOnly ? "&featured=true" : ""}`;
  const { data: clothingData } = useQuery<{ products: any[] }>({
    queryKey: [apparelQuery],
  });

  const treatsQuery = `/api/products?categorySlug=${s.treats.categorySlug}&limit=${s.treats.limit}${s.treats.featuredOnly ? "&featured=true" : ""}`;
  const { data: treatsProductData } = useQuery<{ products: any[] }>({
    queryKey: [treatsQuery],
  });

  const { data: categoriesData } = useQuery<{ categories: any[] }>({
    queryKey: ["/api/categories"],
  });

  const { data: reviewsData } = useQuery<{ reviews: any[] }>({
    queryKey: ["/api/reviews/approved?limit=2"],
  });

  const { data: homeBlocksData } = useQuery<{ blocks: HomeBlock[] }>({
    queryKey: ["/api/home-blocks"],
  });

  const topCategories = (categoriesData?.categories || []).filter((c: any) => !c.parentId).slice(0, 4);
  const activeHomeBlocks = (homeBlocksData?.blocks || [])
    .filter((b) => b.isActive)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  return (
    <div
      className="overflow-x-hidden font-inter"
      style={{ backgroundColor: C.surface, color: C.onSurface }}
    >
      <EditorialHeader nav={s.nav} />
      {s.hero.visible !== false && <HeroSection hero={s.hero} />}
      {s.categoryHub.visible !== false && (
        <CategoryHub categories={topCategories} categoryHub={s.categoryHub} />
      )}
      {s.bestSellers.visible !== false && (
        <BestSellersSection products={treatsData?.products || []} bestSellers={s.bestSellers} />
      )}
      {s.treats.visible !== false && (
        <TreatsSection products={treatsProductData?.products || []} treats={s.treats} />
      )}
      {activeHomeBlocks.map((block) => (
        <EditorialDynamicBlock key={block.id} block={block} />
      ))}
      {s.philosophy.visible !== false && (
        <AncestralPhilosophySection philosophy={s.philosophy} />
      )}
      {s.apparel.visible !== false && (
        <TrendingApparelSection products={clothingData?.products || []} apparel={s.apparel} />
      )}
      {s.wolfPrinciple.visible !== false && (
        <WolfPrincipleSection wolfPrinciple={s.wolfPrinciple} />
      )}
      {s.founder.visible !== false && (
        <FounderMissionSection founder={s.founder} />
      )}
      {s.giftSets.visible !== false && (
        <GiftSetsSection giftSets={s.giftSets} />
      )}
      {s.trustBadges.visible !== false && (
        <TrustBadgesSection trustBadges={s.trustBadges} />
      )}
      {s.communityPack.visible !== false && (
        <CommunityPackSection reviews={reviewsData?.reviews || []} communityPack={s.communityPack} />
      )}
      {s.newsletter.visible !== false && (
        <NewsletterSection newsletter={s.newsletter} />
      )}
      <EditorialFooter footer={s.footer} />
    </div>
  );
}
