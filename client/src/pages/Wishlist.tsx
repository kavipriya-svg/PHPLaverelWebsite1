import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { HomeEditorialHeader, HomeEditorialFooter } from "@/components/store/HomeEditorialLayout";
import { mergeHomepageSettings, DEFAULT_HOMEPAGE_SETTINGS } from "@/lib/homepageDefaults";
import type { ProductWithDetails } from "@shared/schema";

// ─── Design tokens ────────────────────────────────────────────────
const C = {
  primary: "#00160c",
  primaryContainer: "#012d1d",
  secondary: "#944923",
  secondaryContainer: "#fe9e71",
  surface: "#f9faf6",
  surfaceContainer: "#eeeeeb",
  surfaceContainerLow: "#f3f4f0",
  surfaceContainerHigh: "#e8e8e5",
  surfaceContainerHighest: "#e2e3e0",
  outline: "#717973",
  outlineVariant: "#c1c8c2",
  onSurface: "#1a1c1a",
  onSurfaceVariant: "#414844",
  error: "#ba1a1a",
  white: "#ffffff",
};
const PLAYFAIR = { fontFamily: "'Playfair Display', Georgia, serif" } as const;
const INTER = { fontFamily: "Inter, sans-serif" } as const;
const JETBRAINS = { fontFamily: "'JetBrains Mono', 'Courier New', monospace" } as const;
const LABEL_CAPS = { ...INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" as const };

// ─── Sidebar nav items ─────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "biotech", label: "Bio-Profile", href: "/account" },
  { icon: "history_edu", label: "Order History", href: "/account/orders" },
  { icon: "bookmark", label: "Saved Specimens", href: "/wishlist", active: true },
  { icon: "location_on", label: "Bio. Coordinates", href: "/account/addresses" },
  { icon: "settings", label: "Preferences", href: "/account/settings" },
];

// ─── Specimen Card ─────────────────────────────────────────────────
function SpecimenCard({
  product,
  index,
  onAddToCart,
  onRemove,
  offset,
}: {
  product: ProductWithDetails;
  index: number;
  onAddToCart: (product: ProductWithDetails) => Promise<void>;
  onRemove: (productId: string) => Promise<void>;
  offset?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    "";

  const currentPrice = product.salePrice || product.price;
  const reId = String(index + 1).padStart(3, "0");
  const categoryName = (product as any).categoryName || "";

  const handleSync = async () => {
    setSyncing(true);
    await onAddToCart(product);
    setSynced(true);
    setSyncing(false);
    setTimeout(() => setSynced(false), 2000);
  };

  return (
    <div
      className={`col-span-12 lg:col-span-4 group${offset ? " lg:mt-[80px]" : ""}`}
      data-testid={`card-specimen-${product.id}`}
    >
      {/* Image wrapper */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundColor: C.surfaceContainer,
          boxShadow: "40px 40px 0px 0px rgba(1,45,29,0.15)",
          aspectRatio: "3/4",
          transition: "transform 0.5s",
          transform: hovered ? "translateY(-8px)" : "translateY(0)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Product image */}
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transition: "transform 0.7s, filter 0.4s",
              transform: hovered ? "scale(1.05)" : "scale(1)",
              filter: hovered ? "grayscale(0%)" : "grayscale(40%)",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: C.surfaceContainerHigh }}>
            <span className="material-symbols-outlined" style={{ fontSize: 64, color: C.outlineVariant }}>pets</span>
          </div>
        )}

        {/* RE-ID badge */}
        <div className="absolute top-4 left-4 px-3 py-1" style={{ backgroundColor: C.primary }}>
          <span style={{ ...JETBRAINS, fontSize: 10, color: C.white }}>RE-ID: {reId}</span>
        </div>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-4 transition-opacity duration-300"
          style={{
            backgroundColor: `${C.primary}33`,
            opacity: hovered ? 1 : 0,
            pointerEvents: hovered ? "auto" : "none",
          }}
        >
          <button
            onClick={handleSync}
            disabled={product.stock === 0}
            className="flex items-center justify-center rounded-full transition-colors active:scale-90"
            style={{ width: 52, height: 52, backgroundColor: C.white, color: C.primary }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = C.primary; (e.currentTarget as HTMLElement).style.color = C.white; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = C.white; (e.currentTarget as HTMLElement).style.color = C.primary; }}
            data-testid={`button-hover-cart-${product.id}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>add_shopping_cart</span>
          </button>
          <button
            onClick={() => onRemove(product.id)}
            className="flex items-center justify-center rounded-full transition-colors active:scale-90"
            style={{ width: 52, height: 52, backgroundColor: C.white, color: C.error }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = C.error; (e.currentTarget as HTMLElement).style.color = C.white; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = C.white; (e.currentTarget as HTMLElement).style.color = C.error; }}
            data-testid={`button-hover-remove-${product.id}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>delete</span>
          </button>
        </div>
      </div>

      {/* Card info */}
      <div className="mt-12 space-y-3 pr-10">
        <Link href={`/product/${product.slug}`}>
          <h3
            className="tracking-tight uppercase transition-opacity hover:opacity-70"
            style={{ ...PLAYFAIR, fontSize: 20, fontWeight: 600, color: C.primary, lineHeight: 1.2 }}
            data-testid={`text-title-${product.id}`}
          >
            {`Specimen No. ${reId}:`}<br />{product.title}
          </h3>
        </Link>

        <div className="flex justify-between items-center">
          {categoryName && (
            <span
              className="px-2 py-0.5"
              style={{
                ...LABEL_CAPS,
                fontSize: 9,
                color: C.secondary,
                backgroundColor: `${C.secondary}1a`,
              }}
            >
              {categoryName}
            </span>
          )}
          <span style={{ ...JETBRAINS, fontSize: 14, color: C.onSurface, marginLeft: "auto" }}>
            {formatCurrency(currentPrice)}
          </span>
        </div>

        <div style={{ height: 1, backgroundColor: C.outlineVariant, opacity: 0.3 }} />

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSync}
            disabled={product.stock === 0 || syncing}
            className="flex-1 py-3 transition-colors"
            style={{
              ...LABEL_CAPS,
              backgroundColor: synced ? C.secondary : C.primary,
              color: C.white,
              opacity: syncing ? 0.5 : 1,
              cursor: product.stock === 0 ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => { if (!syncing && product.stock !== 0) (e.currentTarget as HTMLElement).style.backgroundColor = C.primaryContainer; }}
            onMouseLeave={(e) => { if (!syncing && !synced) (e.currentTarget as HTMLElement).style.backgroundColor = C.primary; }}
            data-testid={`button-sync-cart-${product.id}`}
          >
            {product.stock === 0 ? "OUT OF STOCK" : syncing ? "SYNCHRONIZING..." : synced ? "DATA UPLOADED" : "Synchronize to Cart"}
          </button>
          <button
            onClick={() => onRemove(product.id)}
            className="px-4 flex items-center justify-center border transition-colors"
            style={{ borderColor: C.outline, color: C.primary, backgroundColor: "transparent" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = C.surfaceContainerHigh; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            data-testid={`button-remove-${product.id}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function Wishlist() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addToCart, toggleWishlist } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [now, setNow] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  // Wishlist data (with products)
  const { data, isLoading } = useQuery<{ items: { product: ProductWithDetails }[] }>({
    queryKey: ["/api/wishlist"],
    enabled: isAuthenticated,
  });

  // Homepage settings for header/footer
  const { data: hpSettings } = useQuery<any>({
    queryKey: ["/api/settings/homepage"],
  });
  const homepageSettings = hpSettings ? mergeHomepageSettings(hpSettings) : DEFAULT_HOMEPAGE_SETTINGS;

  const items = data?.items || [];

  const handleAddToCart = async (product: ProductWithDetails) => {
    try {
      await addToCart(product.id);
      toast({ title: "Added to cart", description: `${product.title} added to cart.` });
    } catch {
      toast({ title: "Error", description: "Failed to add item to cart.", variant: "destructive" });
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await toggleWishlist(productId);
      toast({ title: "Removed", description: "Item removed from your archive." });
    } catch {
      toast({ title: "Error", description: "Failed to remove item.", variant: "destructive" });
    }
  };

  // Format timestamp
  const ts = (() => {
    const y = now.getUTCFullYear();
    const mo = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");
    const h = String(now.getUTCHours()).padStart(2, "0");
    const mi = String(now.getUTCMinutes()).padStart(2, "0");
    const s = String(now.getUTCSeconds()).padStart(2, "0");
    return `${y}.${mo}.${d} // ${h}:${mi}:${s} UTC`;
  })();

  if (authLoading) {
    return (
      <div style={{ backgroundColor: C.surface, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: C.primary, animation: "spin 1s linear infinite" }}>autorenew</span>
          <p style={{ ...JETBRAINS, fontSize: 11, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 16 }}>Loading Archive...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="overflow-x-hidden" style={{ backgroundColor: C.surface, color: C.onSurface }}>
      {/* Editorial global header */}
      <HomeEditorialHeader nav={homepageSettings.nav} />

      {/* Brutalist background text */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          bottom: -40,
          right: -40,
          ...PLAYFAIR,
          fontSize: 220,
          fontWeight: 700,
          color: C.primaryContainer,
          opacity: 0.04,
          userSelect: "none",
          pointerEvents: "none",
          lineHeight: 1,
          zIndex: 0,
          letterSpacing: "-0.05em",
        }}
      >
        WL-001
      </div>

      <div style={{ display: "flex", paddingTop: 104, minHeight: "100vh" }}>
        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <aside
          style={{
            width: 320,
            minHeight: "calc(100vh - 104px)",
            backgroundColor: C.surfaceContainerLow,
            boxShadow: "40px 0 0 0 rgba(1,45,29,0.15)",
            position: "sticky",
            top: 104,
            display: "flex",
            flexDirection: "column",
            padding: "32px 0",
            flexShrink: 0,
            zIndex: 10,
            alignSelf: "flex-start",
            height: "calc(100vh - 104px)",
          }}
        >
          {/* Brand + ID */}
          <div style={{ padding: "0 32px", marginBottom: 48 }}>
            <h1 style={{ ...PLAYFAIR, fontSize: 22, fontWeight: 700, color: C.primary, letterSpacing: "-0.04em", textTransform: "uppercase" }}>
              CANINE SYSTEM
            </h1>
            <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, backgroundColor: C.primaryContainer, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: "#6d9681", fontSize: 24 }}>fingerprint</span>
              </div>
              <div>
                <p style={{ ...LABEL_CAPS, fontSize: 9, color: C.primary }}>System Access</p>
                <p style={{ ...INTER, fontSize: 12, color: C.onSurfaceVariant, marginTop: 2 }}>Biological ID: 882-04</p>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: item.active ? "12px 16px 12px 20px" : "12px 16px 12px 20px",
                  color: item.active ? C.primary : C.onSurfaceVariant,
                  fontWeight: item.active ? 700 : 400,
                  borderLeft: item.active ? `4px solid ${C.primary}` : "none",
                  paddingLeft: item.active ? 16 : 20,
                  backgroundColor: item.active ? C.surfaceContainerHigh : "transparent",
                  textDecoration: "none",
                  transition: "background-color 0.15s",
                }}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: item.active ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                <span style={{ ...LABEL_CAPS, fontSize: 10, letterSpacing: "0.18em" }}>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div style={{ padding: "0 32px", marginBottom: 32 }}>
            <Link
              href="/shop"
              style={{
                display: "block",
                width: "100%",
                backgroundColor: C.primary,
                color: C.white,
                padding: "16px",
                textAlign: "center",
                ...LABEL_CAPS,
                letterSpacing: "0.18em",
                textDecoration: "none",
              }}
              data-testid="button-browse-registry"
            >
              Browse Registry
            </Link>
          </div>

          {/* Footer links */}
          <div style={{ borderTop: `1px solid ${C.outlineVariant}`, paddingTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href="/account/settings" style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 20px", color: C.onSurfaceVariant, textDecoration: "none" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
              <span style={{ ...LABEL_CAPS, fontSize: 10 }}>Settings</span>
            </Link>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 20px", color: C.onSurfaceVariant, textDecoration: "none" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>help_center</span>
              <span style={{ ...LABEL_CAPS, fontSize: 10 }}>Support</span>
            </Link>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────────────── */}
        <main className="flex-grow px-5 md:px-[64px] py-[32px]" style={{ position: "relative", zIndex: 1 }}>

          {/* Editorial Header */}
          <header style={{ marginBottom: 80 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
              <div style={{ maxWidth: 640 }}>
                <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.secondary, marginBottom: 16, letterSpacing: "0.3em" }}>
                  Institutional Repository
                </p>
                <h2 style={{ ...PLAYFAIR, fontSize: 56, fontWeight: 700, lineHeight: 1.05, color: C.primary }}>
                  Saved Specimens<br />
                  <span style={{ fontStyle: "italic", fontWeight: 400, opacity: 0.7 }}>// Research Archive</span>
                </h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: C.secondary, display: "inline-block", animation: "pulse 2s infinite" }} />
                  <span style={{ ...JETBRAINS, fontSize: 12, color: C.onSurfaceVariant, textTransform: "uppercase" }}>Archive Status: Secure</span>
                </div>
                <p style={{ ...JETBRAINS, fontSize: 12, color: C.onSurfaceVariant, textTransform: "uppercase" }}>
                  Specimens Earmarked: {isLoading ? "—" : items.length}
                </p>
                <div style={{ height: 1, width: 128, backgroundColor: C.outlineVariant, marginTop: 8 }} />
              </div>
            </div>
            <div style={{ height: 1, backgroundColor: "#DBDAD5" }} />
          </header>

          {/* Loading */}
          {isLoading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ backgroundColor: C.surfaceContainer, aspectRatio: "3/4", animation: "pulse 2s infinite" }} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && items.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 72, color: C.outlineVariant, marginBottom: 24 }}>inventory</span>
              <h4 style={{ ...PLAYFAIR, fontSize: 28, fontWeight: 600, color: C.primary, marginBottom: 12 }}>
                No specimens currently earmarked for research
              </h4>
              <p style={{ ...INTER, fontSize: 16, color: C.onSurfaceVariant, maxWidth: 480, margin: "0 auto" }}>
                Your archive is currently devoid of biological data. Return to the Science Registry to begin categorization.
              </p>
              <Link
                href="/shop"
                style={{
                  marginTop: 32,
                  borderBottom: `2px solid ${C.primary}`,
                  paddingBottom: 4,
                  ...LABEL_CAPS,
                  color: C.primary,
                  textDecoration: "none",
                }}
                data-testid="link-return-registry"
              >
                Return to Registry
              </Link>
            </div>
          )}

          {/* Specimen Grid */}
          {!isLoading && items.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: 24,
              }}
            >
              {items.map(({ product }, index) => (
                <SpecimenCard
                  key={product.id}
                  product={product}
                  index={index}
                  onAddToCart={handleAddToCart}
                  onRemove={handleRemove}
                  offset={index % 3 === 1}
                />
              ))}
            </div>
          )}

          {/* Archive Footer */}
          <footer
            style={{
              marginTop: 80,
              paddingTop: 32,
              borderTop: `1px solid ${C.outlineVariant}`,
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 24,
              paddingBottom: 48,
            }}
          >
            <div style={{ gridColumn: "span 4" }}>
              <p style={{ ...JETBRAINS, fontSize: 11, color: C.outline, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Authentication Log: {ts}
              </p>
            </div>
            <div style={{ gridColumn: "span 8", display: "flex", justifyContent: "flex-end", gap: 48 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.outline, marginBottom: 4 }}>Archive Integrity</p>
                <div style={{ width: 128, height: 4, backgroundColor: C.surfaceContainerHighest, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "80%", backgroundColor: C.secondaryContainer }} />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.outline, marginBottom: 4 }}>Encryption Protocol</p>
                <p style={{ ...JETBRAINS, fontSize: 11, color: C.primary }}>AES-256-BIT-CANINE</p>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Editorial footer */}
      <HomeEditorialFooter footer={homepageSettings.footer} />
    </div>
  );
}
