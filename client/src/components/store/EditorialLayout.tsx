import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag, Search, X, Menu, Globe, Camera, PlayCircle,
  ChevronDown, User, Heart, PackageSearch, LogOut, LogIn, UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { HomepageSettings } from "@/lib/homepageDefaults";

export const C = {
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

export function EditorialHeader({ nav }: { nav: HomepageSettings["nav"] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { data: brandingData } = useQuery<{ settings: { logoUrl?: string; storeName?: string } }>({
    queryKey: ["/api/settings/branding"],
  });
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
      {/* Logo */}
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

      {/* Desktop nav */}
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

      {/* Mobile menu */}
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

export function EditorialFooter({ footer }: { footer: HomepageSettings["footer"] }) {
  const { data: brandingData } = useQuery<{ settings: { logoUrl?: string; storeName?: string } }>({
    queryKey: ["/api/settings/branding"],
  });

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
