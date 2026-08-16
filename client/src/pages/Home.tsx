import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag, Plus, ShieldCheck, FlaskConical, Leaf, Droplets,
  PawPrint, Globe, Camera, PlayCircle, Quote, Menu, X, Search, PackageSearch,
  UserPlus, LogIn, LogOut, User, Heart, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  mergeHomepageSettings,
  HomepageSettings,
  HeroSlide,
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
  const [profileOpen, setProfileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { data: brandingData } = useQuery<{ settings: { logoUrl?: string; storeName?: string } }>({ queryKey: ["/api/settings/branding"] });
  const { user, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    queryClient.clear();
    window.location.href = "/";
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

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
        {brandingData?.settings?.logoUrl ? (
          <img
            src={brandingData.settings.logoUrl}
            alt={brandingData.settings.storeName || "19 DOGS"}
            style={{ height: 56, objectFit: "contain", display: "block" }}
          />
        ) : (
          <span
            className="font-playfair font-bold cursor-pointer select-none"
            style={{ fontSize: 24, letterSpacing: "0.1em", color: C.primary }}
          >
            {brandingData?.settings?.storeName || "19 DOGS"}
          </span>
        )}
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
        {/* Auth section (desktop) */}
        {!searchOpen && (
          isAuthenticated ? (
            /* Logged-in: avatar + dropdown */
            <div className="relative hidden md:block">
              <button
                onClick={() => setProfileOpen(p => !p)}
                className="flex items-center gap-2 transition-opacity hover:opacity-80"
                data-testid="button-profile-menu"
                aria-label="Profile menu"
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold select-none"
                  style={{ backgroundColor: C.secondary, color: C.white }}
                >
                  {getInitials()}
                </span>
                <span className="text-sm font-medium hidden lg:block" style={{ color: C.onSurface }}>
                  {user?.firstName || user?.email?.split("@")[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 hidden lg:block" style={{ color: C.onSurface }} />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-2 w-52 z-50 rounded-md shadow-lg overflow-hidden"
                    style={{ backgroundColor: C.surface, border: `1px solid ${C.outlineVariant}` }}
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor: C.outlineVariant }}>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.primary }}>
                        {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "My Account"}
                      </p>
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: C.outline }}>{user?.email}</p>
                    </div>
                    {[
                      { href: "/account", icon: User, label: "My Account" },
                      { href: "/account/orders", icon: ShoppingBag, label: "My Orders" },
                      { href: "/wishlist", icon: Heart, label: "Wishlist" },
                      { href: "/track-order", icon: PackageSearch, label: "Track Order" },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link key={href} href={href}>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-black/5"
                          style={{ color: C.onSurface }}
                          onClick={() => setProfileOpen(false)}
                          data-testid={`link-profile-${label.toLowerCase().replace(/\s/g, "-")}`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: C.outline }} />
                          {label}
                        </button>
                      </Link>
                    ))}
                    <div className="border-t" style={{ borderColor: C.outlineVariant }} />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-black/5"
                      style={{ color: C.secondary }}
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Guest: Join + Login */
            <>
              <Link href={nav.ctaHref}>
                <button
                  className="hidden md:flex items-center justify-center transition-opacity hover:opacity-60"
                  aria-label={nav.ctaText}
                  title={nav.ctaText}
                  data-testid="button-join-the-pack"
                  style={{ color: C.white, backgroundColor: C.primary, borderRadius: 4, padding: "6px 8px" }}
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/login">
                <button
                  className="hidden md:flex items-center justify-center transition-opacity hover:opacity-60"
                  aria-label="Login"
                  title="Login"
                  data-testid="link-login-header"
                  style={{ color: C.onSurface }}
                >
                  <LogIn className="w-5 h-5" />
                </button>
              </Link>
            </>
          )
        )}

        {/* Track Order icon (desktop) */}
        {!searchOpen && (
          <Link href="/track-order">
            <button
              className="hidden md:flex items-center justify-center transition-opacity hover:opacity-60"
              aria-label="Track Order"
              title="Track Order"
              data-testid="link-track-order-header"
              style={{ color: C.onSurface }}
            >
              <PackageSearch className="w-5 h-5" />
            </button>
          </Link>
        )}

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
          className="absolute top-full left-0 right-0 flex flex-col py-6 px-5 md:px-margin-desktop gap-6"
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
          <Link href="/track-order">
            <span
              className="font-playfair text-headline-md cursor-pointer"
              style={{ color: C.primary }}
              onClick={() => setMenuOpen(false)}
              data-testid="link-track-order-mobile"
            >
              Track Order
            </span>
          </Link>
          {isAuthenticated ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: C.outlineVariant }}>
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold select-none flex-shrink-0"
                  style={{ backgroundColor: C.secondary, color: C.white }}
                >
                  {getInitials()}
                </span>
                <div>
                  <p className="text-sm font-bold" style={{ color: C.primary }}>
                    {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "My Account"}
                  </p>
                  <p className="text-[11px]" style={{ color: C.outline }}>{user?.email}</p>
                </div>
              </div>
              {[
                { href: "/account", label: "My Account" },
                { href: "/account/orders", label: "My Orders" },
                { href: "/wishlist", label: "Wishlist" },
              ].map(({ href, label }) => (
                <Link key={href} href={href}>
                  <span className="font-inter text-sm cursor-pointer" style={{ color: C.onSurface }} onClick={() => setMenuOpen(false)}>
                    {label}
                  </span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="font-inter text-sm text-left w-fit"
                style={{ color: C.secondary }}
                data-testid="button-logout-mobile"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link href={nav.ctaHref}>
              <button
                className="font-inter text-label-caps uppercase tracking-widest px-6 py-3 w-fit cursor-pointer"
                style={{ backgroundColor: C.primary, color: C.white }}
                onClick={() => setMenuOpen(false)}
              >
                {nav.ctaText}
              </button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

// ─── 2. Hero Section (auto-scroll carousel) ────────────────────────
function HeroSlideView({ slide }: { slide: HeroSlide }) {
  const headlineLines = (slide.headline || "").split("\n");
  return (
    <div className="absolute inset-0">
      {/* background */}
      <img className="w-full h-full object-cover" src={slide.bgImageUrl} alt={slide.headline || "Hero"} loading="eager" fetchpriority="high" decoding="async" />
      <div className="absolute inset-0" style={{ backgroundColor: `${C.primary}1A` }} />
      {/* content */}
      {slide.showText !== false && (
        <div className="absolute inset-0 flex items-center justify-start px-6 md:px-margin-desktop mt-20">
          <div className="max-w-4xl">
            {slide.label && (
              <p className="font-inter text-label-caps uppercase mb-4" style={{ color: C.onPrimaryContainer }}>
                {slide.label}
              </p>
            )}
            {slide.headline && (
              <h1 className="font-playfair italic leading-tight mb-6"
                style={{ fontSize: "clamp(40px,8vw,84px)", lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: 700, color: C.primary }}>
                {headlineLines.map((line, i) => (
                  <span key={i}>{line}{i < headlineLines.length - 1 && <br />}</span>
                ))}
              </h1>
            )}
            {slide.subheadline && (
              <p className="font-playfair text-headline-md italic mb-10" style={{ color: C.primaryContainer }}>
                {slide.subheadline}
              </p>
            )}
            {slide.showCta !== false && (
              <div className="flex flex-wrap gap-4">
                {slide.cta1Text && (
                  <Link href={slide.cta1Href || "#"}>
                    <button className="font-inter text-label-caps uppercase tracking-widest px-10 py-4 transition-all duration-200 cursor-pointer"
                      style={{ backgroundColor: C.primary, color: "#fff" }}
                      onMouseOver={e => (e.currentTarget.style.backgroundColor = C.secondary)}
                      onMouseOut={e => (e.currentTarget.style.backgroundColor = C.primary)}>
                      {slide.cta1Text}
                    </button>
                  </Link>
                )}
                {slide.cta2Text && (
                  <Link href={slide.cta2Href || "#"}>
                    <button className="font-inter text-label-caps uppercase tracking-widest px-10 py-4 border transition-all duration-200 cursor-pointer"
                      style={{ borderColor: C.secondary, color: C.secondary, backgroundColor: "transparent" }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = C.secondary; e.currentTarget.style.color = "#fff"; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.secondary; }}>
                      {slide.cta2Text}
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HeroSection({ hero }: { hero: HomepageSettings["hero"] }) {
  const activeSlides = (hero.slides || []).filter(s => s.isActive !== false);

  // Fall back to legacy single-banner when no slides are configured
  const legacySlide: HeroSlide = {
    id: "legacy",
    bgImageUrl: hero.bgImageUrl,
    label: hero.label,
    headline: hero.headline,
    subheadline: hero.subheadline,
    cta1Text: hero.cta1Text,
    cta1Href: hero.cta1Href,
    cta2Text: hero.cta2Text,
    cta2Href: hero.cta2Href,
    showText: true,
    showCta: true,
    isActive: true,
  };
  const slides = activeSlides.length > 0 ? activeSlides : [legacySlide];

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number) => setCurrent((idx + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length, paused]);

  return (
    <section className="relative h-screen w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* slides */}
      {slides.map((slide, i) => (
        <div key={slide.id} className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}>
          <HeroSlideView slide={slide} />
        </div>
      ))}

      {/* prev / next arrows — only when multiple slides */}
      {slides.length > 1 && (
        <>
          <button onClick={() => goTo(current - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: `${C.primary}CC`, color: "#fff" }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => goTo(current + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: `${C.primary}CC`, color: "#fff" }}>
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* dot indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className="transition-all duration-300 rounded-full"
                style={{ width: i === current ? 24 : 8, height: 8, backgroundColor: i === current ? C.secondary : `${C.secondary}66` }} />
            ))}
          </div>
        </>
      )}
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


// ─── Subcategory Panel ────────────────────────────────────────────
// Mapping: subcategory slug → dedicated page route
const CATEGORY_DEDICATED_PAGE: Record<string, string> = {
  "wild-treats": "/treat",
  "dogclothing": "/category/clothing",
  "full-meals": "/full-meals",
  "dogparentclothing": "/category/twinning",
  "gift-services": "/giftseries",
};

// ─── Shared category card grid ────────────────────────────────────
function CategoryCardGrid({
  items,
  selectedId,
  onSelect,
  getHref,
}: {
  items: any[];
  selectedId?: string | null;
  onSelect?: (item: any) => void;
  getHref?: (item: any) => string;
}) {
  return (
    <div
      className="px-margin-desktop gap-5"
      style={{
        display: "grid",
        gridTemplateColumns: items.length === 2 ? "1fr 1fr" : "repeat(3, 1fr)",
      }}
    >
      {items.map((item: any, i: number) => {
        const hasChildren = (item.children || []).filter((c: any) => c.isActive !== false).length > 0;
        const isSelected = selectedId === item.id;
        const imgHeight = items.length === 2 ? 500 : undefined;
        const imgStyle: React.CSSProperties = imgHeight
          ? { height: imgHeight, backgroundColor: C.surfaceContainerHigh }
          : { aspectRatio: "4/3", backgroundColor: C.surfaceContainerHigh };

        const inner = (
          <div
            className="group cursor-pointer relative overflow-hidden hard-shadow"
            style={isSelected ? { outline: `3px solid ${C.primary}` } : {}}
          >
            <div className="relative overflow-hidden" style={imgStyle}>
              {getCategoryImage(item) ? (
                <img
                  src={getCategoryImage(item)}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    const fb = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement | null;
                    if (fb) fb.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="absolute inset-0 items-center justify-center"
                style={{ display: getCategoryImage(item) ? "none" : "flex", backgroundColor: C.surfaceContainerHigh }}
              >
                <span className="font-playfair text-5xl italic" style={{ color: C.primary }}>{item.name[0]}</span>
              </div>
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)" }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="font-playfair text-2xl font-semibold leading-tight" style={{ color: "#fff" }}>
                  {item.name}
                </p>
                <span
                  className="inline-block mt-2 font-inter text-label-caps border-b pb-0.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300"
                  style={{ color: "#fff", borderColor: "#fff" }}
                >
                  {hasChildren ? "EXPLORE" : "SHOP NOW"}
                </span>
              </div>
            </div>
          </div>
        );

        const href = getHref ? getHref(item) : (item.slug ? `/category/${item.slug}` : "/shop");

        return (
          <Reveal key={item.id} delay={i * 60}>
            {hasChildren && onSelect ? (
              <div onClick={() => onSelect(isSelected ? null : item)}>{inner}</div>
            ) : (
              <Link href={href}>{inner}</Link>
            )}
          </Reveal>
        );
      })}
    </div>
  );
}

// ─── Subcategory Panel ────────────────────────────────────────────
function SubcategoryPanel({
  category,
  panelRef,
  selectedSubId,
  onSelectSub,
}: {
  category: any;
  panelRef: React.RefObject<HTMLElement>;
  selectedSubId: string | null;
  onSelectSub: (sub: any) => void;
}) {
  const subs = (category.children || []).filter((c: any) => c.isActive !== false);
  if (!subs.length) return null;

  return (
    <section ref={panelRef as React.RefObject<HTMLElement>} className="py-12" style={{ backgroundColor: C.surfaceContainer }}>
      <div className="px-margin-desktop mb-8">
        <Reveal>
          <p className="font-inter text-label-caps mb-1" style={{ color: C.secondary }}>BROWSE BY TYPE</p>
          <h3 className="font-playfair text-headline-md" style={{ color: C.primary }}>{category.name}</h3>
        </Reveal>
      </div>
      <CategoryCardGrid items={subs} selectedId={selectedSubId} onSelect={onSelectSub} />
    </section>
  );
}

// ─── Child Category Panel ─────────────────────────────────────────
function ChildCategoryPanel({
  category,
  panelRef,
}: {
  category: any;
  panelRef: React.RefObject<HTMLElement>;
}) {
  const children = (category.children || []).filter((c: any) => c.isActive !== false);
  if (!children.length) return null;

  // If this subcategory maps to a dedicated page (e.g. wild-treats → /treat),
  // link child cards there with ?category=slug so the page auto-filters.
  const dedicatedPage = CATEGORY_DEDICATED_PAGE[category.slug];
  const getHref = dedicatedPage
    ? (child: any) => `${dedicatedPage}?category=${child.slug}`
    : (child: any) => child.slug ? `/category/${category.slug}?category=${child.slug}` : "/shop";

  return (
    <section ref={panelRef as React.RefObject<HTMLElement>} className="py-12" style={{ backgroundColor: C.surfaceContainerLow }}>
      <div className="px-margin-desktop mb-8">
        <Reveal>
          <p className="font-inter text-label-caps mb-1" style={{ color: C.secondary }}>BROWSE WITHIN</p>
          <h3 className="font-playfair text-headline-md" style={{ color: C.primary }}>{category.name}</h3>
        </Reveal>
      </div>
      <CategoryCardGrid items={children} getHref={getHref} />
    </section>
  );
}

function CategoryHub({
  categories,
  categoryHub,
  selectedCatId,
  onSelect,
}: {
  categories: any[];
  categoryHub: HomepageSettings["categoryHub"];
  selectedCatId: string | null;
  onSelect: (cat: any) => void;
}) {
  const cats = categories.slice(0, 4);

  const handleSelect = (cat: any) => {
    const subs = (cat?.children || []).filter((c: any) => c.isActive !== false);
    if (subs.length) onSelect(selectedCatId === cat?.id ? null : cat);
    else if (cat?.slug) window.location.href = `/category/${cat.slug}`;
  };

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
              {(cats[0]?.description || categoryHub.cards[0]?.description) && (
                <p
                  className="font-inter text-body-md mb-4 overflow-hidden transition-all duration-500"
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.webkitLineClamp = "unset";
                    (e.currentTarget as HTMLElement).style.overflow = "visible";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.webkitLineClamp = "2";
                    (e.currentTarget as HTMLElement).style.overflow = "hidden";
                  }}
                >
                  {cats[0]?.description || categoryHub.cards[0].description}
                </p>
              )}
              <button onClick={() => handleSelect(cats[0])} className="font-inter text-label-caps border-b border-white pb-1 cursor-pointer bg-transparent" style={{ color: C.white }}>
                EXPLORE {cats[0]?.name?.toUpperCase() || ""}
              </button>
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
              <button onClick={() => handleSelect(cats[1])} className="font-inter text-label-caps mt-2 cursor-pointer bg-transparent border-0 text-left self-start" style={{ color: C.white }}>
                EXPLORE {cats[1]?.name?.toUpperCase() || ""}
              </button>
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
            <div className="absolute inset-0 flex flex-col justify-end p-8" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }}>
              <h3 className="font-playfair text-headline-md" style={{ color: C.white }}>{cats[2]?.name || "High Protein Treats"}</h3>
              <button onClick={() => handleSelect(cats[2])} className="font-inter text-label-caps mt-2 cursor-pointer bg-transparent border-0 text-left self-start" style={{ color: C.white }}>
                EXPLORE {cats[2]?.name?.toUpperCase() || ""}
              </button>
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
              {categoryHub.cards[3]?.badge && (
                <p className="font-inter text-label-caps" style={{ color: C.primary }}>{categoryHub.cards[3].badge}</p>
              )}
              <h3 className="font-playfair text-headline-md" style={{ color: C.primary }}>{cats[3]?.name || "Twinning"}</h3>
              <button onClick={() => handleSelect(cats[3])} className="font-inter text-label-caps mt-2 border-b border-current pb-0.5 cursor-pointer bg-transparent block" style={{ color: C.primary }}>
                EXPLORE {cats[3]?.name?.toUpperCase() || ""}
              </button>
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
            <Link href={p.slug ? `/full-meals/product/${p.slug}` : "#"} className="block group cursor-pointer">
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
                    onClick={(e) => {
                      e.preventDefault();
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
            </Link>
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
            <Link href={p.slug ? `/dogtreat/product/${p.slug}` : "#"} className="block group cursor-pointer">
              <div
                className="relative overflow-hidden mb-4"
                style={{ aspectRatio: "4/5", backgroundColor: C.surfaceContainerLow }}
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
                  <p className="font-inter text-label-caps" style={{ color: C.white, fontSize: 11 }}>
                    {p.label || p.category?.name || fallbacks[i % fallbacks.length].label}
                  </p>
                </div>
                {p.id && (
                  <button
                    className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center transition-colors duration-200"
                    style={{ backgroundColor: C.primary, color: C.white }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = C.secondary)}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = C.primary)}
                    onClick={(e) => {
                      e.preventDefault();
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
            </Link>
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
            className="hidden md:block absolute p-8 border shadow-xl max-w-sm"
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
            <Link href={item.slug ? `/clothing/product/${item.slug}` : "/category/clothing"}>
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
    <section id="gift-sets" className="px-margin-desktop py-stack-lg" style={{ backgroundColor: C.surfaceContainerLow }}>
      <div className="flex justify-between items-end mb-stack-md flex-wrap gap-4">
        <Reveal>
          <p className="font-inter text-label-caps mb-2" style={{ color: C.secondary }}>
            {giftSets.label || "CURATED COLLECTIONS"}
          </p>
          <h2 className="font-playfair text-headline-lg" style={{ color: C.primary }}>
            {giftSets.sectionTitle}
          </h2>
          {giftSets.description && (
            <p className="font-inter mt-3 max-w-xl" style={{ color: C.onSurfaceVariant, fontSize: 16, lineHeight: 1.6 }}>
              {giftSets.description}
            </p>
          )}
        </Reveal>
        <Link href={giftSets.ctaHref || "/gift-series"}>
          <span
            className="font-inter text-label-caps cursor-pointer hover:underline"
            style={{ color: C.secondary }}
          >
            {giftSets.ctaText || "EXPLORE GIFT SERIES"}
          </span>
        </Link>
      </div>

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
        {(communityPack.photos ?? []).map((photo, i) => {
          const delays = [0, 100, 200, 300];
          const aspects = ["aspect-square", "aspect-[3/4] pt-12", "aspect-[4/5]", "aspect-square pt-24"];
          return (
            <Reveal key={i} delay={delays[i]} className={`editorial-img-hover ${aspects[i]}`}>
              <img className="w-full h-full object-cover" src={photo.url} alt={`Community dog ${i + 1}`} loading="lazy" />
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
  const { data: brandingData } = useQuery<{ settings: { logoUrl?: string; storeName?: string } }>({ queryKey: ["/api/settings/branding"] });
  return (
    <footer
      className="border-t pt-stack-lg pb-stack-sm"
      style={{ backgroundColor: C.surfaceContainerLow, borderColor: C.outlineVariant }}
    >
      <div className="grid grid-cols-12 gap-gutter px-margin-desktop mb-stack-lg">
        <div className="col-span-12 md:col-span-4">
          <div className="mb-8">
            {brandingData?.settings?.logoUrl ? (
              <img
                src={brandingData.settings.logoUrl}
                alt={brandingData.settings.storeName || "19 DOGS"}
                style={{ height: 48, objectFit: "contain", display: "block" }}
              />
            ) : (
              <span className="font-playfair font-bold" style={{ fontSize: 40, color: C.primary }}>
                {brandingData?.settings?.storeName || "19 DOGS"}
              </span>
            )}
          </div>
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

  const allCategories = categoriesData?.categories || [];
  // Prefer categories explicitly marked for the hub; fall back to first 4 top-level ones
  const hubMarked = allCategories.filter((c: any) => !c.parentId && c.showInHub);
  const topCategories = hubMarked.length > 0
    ? hubMarked.slice(0, 4)
    : allCategories.filter((c: any) => !c.parentId).slice(0, 4);
  const activeHomeBlocks = (homeBlocksData?.blocks || [])
    .filter((b) => b.isActive)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const panelRef = useRef<HTMLElement>(null);
  const childPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (selectedCat && panelRef.current) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
    // reset child selection when top category changes
    setSelectedSub(null);
  }, [selectedCat]);

  useEffect(() => {
    if (selectedSub && childPanelRef.current) {
      setTimeout(() => {
        childPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [selectedSub]);

  return (
    <div
      className="overflow-x-hidden font-inter"
      style={{ backgroundColor: C.surface, color: C.onSurface }}
    >
      <EditorialHeader nav={s.nav} />
      {s.hero.visible !== false && <HeroSection hero={s.hero} />}
      {s.categoryHub.visible !== false && (
        <CategoryHub
          categories={topCategories}
          categoryHub={s.categoryHub}
          selectedCatId={selectedCat?.id ?? null}
          onSelect={setSelectedCat}
        />
      )}
      {selectedCat && (
        <SubcategoryPanel
          category={selectedCat}
          panelRef={panelRef}
          selectedSubId={selectedSub?.id ?? null}
          onSelectSub={setSelectedSub}
        />
      )}
      {selectedSub && (
        <ChildCategoryPanel category={selectedSub} panelRef={childPanelRef} />
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
