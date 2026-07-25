import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu, X, Search, Globe, Camera, PlayCircle } from "lucide-react";
import type { HomepageSettings } from "@/lib/homepageDefaults";

const C = {
  primary:            "#00160c",
  secondary:          "#944923",
  surface:            "#f9faf6",
  surfaceContainerLow:"#f3f4f0",
  onSurface:          "#1a1c1a",
  onSurfaceVariant:   "#414844",
  outline:            "#717973",
  outlineVariant:     "#c1c8c2",
  white:              "#ffffff",
} as const;

export function HomeEditorialHeader({ nav }: { nav: HomepageSettings["nav"] }) {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [, navigate]   = useLocation();

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
    if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
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

export function HomeEditorialFooter({ footer }: { footer: HomepageSettings["footer"] }) {
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
          <ul className="space-y-4">
            {[
              { l: "Nutrition",  h: "/shop" },
              { l: "Apparel",    h: "/category/clothing" },
              { l: "Gift Sets",  h: "/shop" },
              { l: "The Pantry", h: "/shop" },
            ].map(({ l, h }) => (
              <li key={l}>
                <Link href={h}>
                  <span
                    className="font-inter text-body-md cursor-pointer transition-opacity hover:opacity-70"
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
            {[
              { l: "The Science", h: "/about" },
              { l: "Whitepapers", h: "/about" },
              { l: "Blog",        h: "/blog" },
              { l: "Our Story",   h: "/about" },
            ].map(({ l, h }) => (
              <li key={l}>
                <Link href={h}>
                  <span
                    className="font-inter text-body-md cursor-pointer transition-opacity hover:opacity-70"
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
            <Globe    className="w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity" />
            <Camera   className="w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity" />
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
          {[
            { l: "Privacy Policy",  h: "/privacy" },
            { l: "Terms of Service", h: "/terms" },
            { l: "Accessibility",   h: "/" },
          ].map(({ l, h }) => (
            <Link key={l} href={h}>
              <span
                className="font-inter text-body-md underline cursor-pointer transition-opacity hover:opacity-70"
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
