import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { HomeEditorialHeader, HomeEditorialFooter } from "@/components/store/HomeEditorialLayout";
import { mergeHomepageSettings, DEFAULT_HOMEPAGE_SETTINGS } from "@/lib/homepageDefaults";
import type { HomepageSettings } from "@/lib/homepageDefaults";
import type { OrderWithItems } from "@shared/schema";

// ─── Design tokens (same as Account.tsx) ─────────────────────────
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
  primaryFixed: "#c0edd4",
  error: "#ba1a1a",
  white: "#ffffff",
};

const PLAYFAIR = { fontFamily: "'Playfair Display', Georgia, serif" } as const;
const INTER = { fontFamily: "Inter, sans-serif" } as const;
const JETBRAINS = { fontFamily: "'JetBrains Mono', 'Courier New', monospace" } as const;
const LABEL_CAPS = { ...INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" as const };

// ─── Account dashboard settings (for sidebar nav) ─────────────────
interface NavItem { icon: string; label: string; href: string }
interface AccountDashboardSettings {
  sidebar: { title: string; version: string; navItems: NavItem[] };
}
const SIDEBAR_DEFAULTS = {
  title: "CANINE BIOMETRIC ID",
  version: "V.01.2024 REV",
  navItems: [
    { icon: "biotech", label: "Bio-Profile", href: "/account" },
    { icon: "history_edu", label: "Order History", href: "/account/orders" },
    { icon: "bookmark", label: "Saved Specimens", href: "/wishlist" },
    { icon: "location_on", label: "Bio. Coordinates", href: "/account/addresses" },
    { icon: "settings", label: "Preferences", href: "/account/settings" },
  ],
};

// ─── Status helpers ────────────────────────────────────────────────
function getStatusConfig(status: string) {
  switch (status) {
    case "delivered":
      return { label: "DEPLOYED", dot: "#264e3c", color: C.primary, pulse: false };
    case "shipped":
      return { label: "IN_TRANSIT", dot: C.secondary, color: C.secondary, pulse: true };
    case "processing":
      return { label: "PROCESSING", dot: C.secondary, color: C.secondary, pulse: true };
    case "pending":
      return { label: "PENDING", dot: "#944923", color: C.secondary, pulse: false };
    case "cancelled":
      return { label: "CANCELLED", dot: C.error, color: C.error, pulse: false };
    default:
      return { label: "SYNCHRONIZED", dot: C.outline, color: C.outline, pulse: false };
  }
}

function formatOrderDate(date: Date | string | null) {
  if (!date) return "—";
  const d = new Date(date as string);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

function formatTimestamp(d: Date) {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `TIMESTAMP // ${y}.${mo}.${day}_${h}:${min}_UTC`;
}

// ─── Ledger Row ────────────────────────────────────────────────────
function LedgerRow({ order }: { order: OrderWithItems }) {
  const [hovered, setHovered] = useState(false);
  const status = getStatusConfig(order.status);
  const visibleItems = order.items.slice(0, 3);
  const extraItems = order.items.length - 3;

  return (
    <article
      className="grid grid-cols-1 lg:grid-cols-12 items-center py-6 border-b px-4 transition-colors"
      style={{
        borderColor: `${C.outlineVariant}50`,
        backgroundColor: hovered ? C.surfaceContainerLow : "transparent",
        gap: 24,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`order-row-${order.orderNumber}`}
    >
      {/* ID */}
      <div className="lg:col-span-2">
        <p className="font-jetbrains text-xs mb-1" style={{ color: C.onSurfaceVariant }}>ID_SEQUENCE</p>
        <p className="font-jetbrains text-base font-bold tracking-tight" style={{ color: C.primary }}>
          {order.orderNumber}
        </p>
      </div>

      {/* Date */}
      <div className="lg:col-span-2">
        <p className="font-jetbrains text-xs mb-1" style={{ color: C.onSurfaceVariant }}>SYNCH_DATE</p>
        <p className="font-inter text-sm uppercase" style={{ color: C.onSurface }}>
          {formatOrderDate(order.createdAt)}
        </p>
      </div>

      {/* Status */}
      <div className="lg:col-span-2">
        <p className="font-jetbrains text-xs mb-1" style={{ color: C.onSurfaceVariant }}>STATUS</p>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${status.pulse ? "animate-pulse" : ""}`}
            style={{ backgroundColor: status.dot }}
          />
          <span
            className="font-jetbrains text-[10px] tracking-widest"
            style={{ color: status.color }}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Product thumbnails */}
      <div className="lg:col-span-3 flex items-center py-2" style={{ marginLeft: -16 }}>
        {visibleItems.map((item, i) => (
          <div
            key={i}
            className="w-12 h-12 border-2 overflow-hidden flex-shrink-0 transition-all cursor-pointer"
            style={{
              borderColor: C.surface,
              marginLeft: i === 0 ? 16 : -8,
              filter: hovered ? "grayscale(0)" : "grayscale(1)",
              transition: "filter 0.3s ease",
            }}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: C.surfaceContainerHigh }}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: C.outline }}>
                  package_2
                </span>
              </div>
            )}
          </div>
        ))}
        {extraItems > 0 && (
          <div
            className="w-12 h-12 flex items-center justify-center flex-shrink-0 border-2 font-jetbrains text-[10px]"
            style={{
              borderColor: C.surface,
              backgroundColor: C.surfaceContainerHigh,
              marginLeft: -8,
              color: C.onSurfaceVariant,
            }}
          >
            +{extraItems}
          </div>
        )}
      </div>

      {/* Value + links */}
      <div className="lg:col-span-1">
        <p className="font-jetbrains text-xs mb-1" style={{ color: C.onSurfaceVariant }}>VALUE</p>
        <p className="font-jetbrains text-sm font-bold" style={{ color: C.onSurface }}>
          {formatCurrency(order.total)}
        </p>
        <div className="mt-2 flex flex-col gap-1">
          <Link href={`/account/orders/${order.orderNumber}`}>
            <a
              className="flex items-center gap-1 transition-colors group"
              style={{ color: C.primary }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = C.secondary)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = C.primary)}
              data-testid={`link-track-${order.orderNumber}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
              <span style={{ ...LABEL_CAPS, fontSize: 9, letterSpacing: "0.15em" }}>Track Deployment</span>
            </a>
          </Link>
          <Link href={`/account/orders/${order.orderNumber}`}>
            <a
              className="flex items-center gap-1 transition-colors"
              style={{ color: C.primary }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = C.secondary)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = C.primary)}
              data-testid={`link-invoice-${order.orderNumber}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
              <span style={{ ...LABEL_CAPS, fontSize: 9, letterSpacing: "0.15em" }}>Download Invoice</span>
            </a>
          </Link>
        </div>
      </div>

      {/* Hover action buttons */}
      <div
        className="lg:col-span-2 flex justify-end gap-2 transition-all duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateX(0)" : "translateX(-10px)",
        }}
      >
        <Link href={`/account/orders/${order.orderNumber}`}>
          <button
            className="px-3 py-1 font-jetbrains text-[9px] tracking-widest uppercase transition-colors"
            style={{ backgroundColor: C.primary, color: C.white }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = C.secondaryContainer;
              (e.currentTarget as HTMLElement).style.color = C.primary;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = C.primary;
              (e.currentTarget as HTMLElement).style.color = C.white;
            }}
            data-testid={`button-dossier-${order.orderNumber}`}
          >
            Dossier
          </button>
        </Link>
        <Link href={`/account/orders/${order.orderNumber}`}>
          <button
            className="px-3 py-1 font-jetbrains text-[9px] tracking-widest uppercase border transition-colors"
            style={{ borderColor: C.primary, color: C.primary, backgroundColor: "transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = C.primary;
              (e.currentTarget as HTMLElement).style.color = C.white;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = C.primary;
            }}
            data-testid={`button-track-${order.orderNumber}`}
          >
            Track
          </button>
        </Link>
      </div>
    </article>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export default function AccountOrders() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [timestamp, setTimestamp] = useState(() => formatTimestamp(new Date()));
  const scrollBgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setTimestamp(formatTimestamp(new Date())), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = () => {
      if (scrollBgRef.current)
        scrollBgRef.current.style.transform = `translateY(${window.scrollY * -0.1}px)`;
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({ title: "Please log in to continue", variant: "destructive" });
      setTimeout(() => setLocation("/login"), 500);
    }
  }, [isAuthenticated, authLoading, toast, setLocation]);

  // Homepage settings for header/footer
  const { data: hpData } = useQuery<{ settings: Partial<HomepageSettings> }>({
    queryKey: ["/api/settings/homepage"],
  });
  const s = hpData ? mergeHomepageSettings(hpData.settings || {}) : DEFAULT_HOMEPAGE_SETTINGS;

  // Account dashboard settings for sidebar
  const { data: acctData } = useQuery<{ settings: Partial<AccountDashboardSettings> }>({
    queryKey: ["/api/settings/account-dashboard"],
  });
  const sidebar = {
    ...SIDEBAR_DEFAULTS,
    ...(acctData?.settings?.sidebar || {}),
    navItems: acctData?.settings?.sidebar?.navItems?.length
      ? acctData.settings.sidebar.navItems
      : SIDEBAR_DEFAULTS.navItems,
  };

  // Orders
  const { data, isLoading } = useQuery<{ orders: OrderWithItems[] }>({
    queryKey: ["/api/account/orders"],
    enabled: isAuthenticated,
  });

  const allOrders = data?.orders || [];
  const orders = search.trim()
    ? allOrders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          o.items.some((i) => i.title.toLowerCase().includes(search.toLowerCase()))
      )
    : allOrders;

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Member";
  const initials = (user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="overflow-x-hidden" style={{ backgroundColor: C.surface, color: C.onSurface }}>
      <HomeEditorialHeader nav={s.nav} />

      {/* ── Floating brutalist background elements ── */}
      <div
        className="fixed pointer-events-none -z-10 rotate-12"
        style={{
          top: "20%", right: "-10%",
          width: "40%", height: "60%",
          border: `0.5px solid ${C.outlineVariant}30`,
        }}
      />
      <div
        ref={scrollBgRef}
        className="fixed pointer-events-none select-none -z-10"
        style={{
          bottom: "10%", left: "5%",
          ...JETBRAINS, fontSize: 180,
          color: `${C.primary}05`,
          lineHeight: 1,
        }}
      >
        LE-001
      </div>

      <div className="flex" style={{ paddingTop: 104, minHeight: "100vh" }}>

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0 self-start sticky"
          style={{
            top: 104,
            width: 256,
            minHeight: "calc(100vh - 104px)",
            backgroundColor: C.surfaceContainerLow,
            boxShadow: "40px 0px 0px 0px rgba(1,45,29,0.05)",
            padding: "32px 24px",
          }}
        >
          {/* Brand */}
          <div className="mb-10">
            <h1 style={{ ...PLAYFAIR, fontSize: 22, fontWeight: 700, color: C.primary }}>
              {sidebar.title}
            </h1>
            <p className="font-jetbrains text-[10px] tracking-widest uppercase opacity-60 mt-1"
               style={{ color: C.onSurfaceVariant }}>
              {sidebar.version}
            </p>
          </div>

          {/* User card */}
          <div
            className="flex items-center gap-3 mb-8 p-2"
            style={{ border: `1px solid ${C.outlineVariant}50` }}
          >
            <div
              className="w-10 h-10 flex items-center justify-center flex-shrink-0 font-jetbrains text-xs"
              style={{ backgroundColor: C.primaryContainer, color: C.primaryFixed }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-inter text-sm font-semibold truncate" style={{ color: C.primary }}>
                {displayName}
              </p>
              <p className="font-jetbrains text-[10px]" style={{ color: C.onSurfaceVariant }}>
                Verified Entity
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 flex-grow">
            {sidebar.navItems.map((item) => {
              const isActive = item.href === "/account/orders";
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isActive ? C.primary : "transparent",
                      color: isActive ? C.white : C.onSurfaceVariant,
                      transform: isActive ? "translateX(4px)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.backgroundColor = C.surfaceContainerHighest;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    }}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 20,
                        fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {item.icon}
                    </span>
                    <span style={{ ...LABEL_CAPS, fontSize: 11 }}>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* CTA bottom */}
          <button
            className="mt-auto py-4 font-jetbrains text-xs tracking-[0.2em] uppercase text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: C.primary, color: C.white }}
            data-testid="button-request-access"
          >
            Request Lab Access
          </button>
        </aside>

        {/* ── Main Content ──────────────────────────────────────── */}
        <main
          className="flex-grow px-5 md:px-[64px] py-[32px]"
          style={{ maxWidth: 1440 - 256 }}
        >

          {/* Editorial Header */}
          <header
            className="flex flex-col md:flex-row justify-between items-end gap-6 mb-20 border-b pb-8"
            style={{ borderColor: C.outlineVariant }}
          >
            <div style={{ maxWidth: 640 }}>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <span
                  className="px-2 py-1 font-jetbrains text-[10px] tracking-tighter"
                  style={{ backgroundColor: C.primary, color: C.white }}
                >
                  STATUS: SECURE
                </span>
                <span
                  className="font-jetbrains text-[10px] uppercase tracking-widest"
                  style={{ color: C.onSurfaceVariant }}
                  data-testid="text-timestamp"
                >
                  {timestamp}
                </span>
              </div>
              <h2
                className="leading-none uppercase tracking-tighter italic"
                style={{ ...PLAYFAIR, fontSize: "clamp(28px,4vw,52px)", color: C.primary }}
              >
                Logistics Archive
              </h2>
              <h3
                className="leading-none uppercase tracking-tighter mt-2"
                style={{ ...PLAYFAIR, fontSize: "clamp(18px,2.5vw,32px)", color: `${C.onSurfaceVariant}60` }}
              >
                // Deployment History
              </h3>
            </div>

            <div className="text-right hidden md:block">
              <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.primary, marginBottom: 4 }}>
                DATA INTEGRITY
              </p>
              <div className="w-48 h-1" style={{ backgroundColor: C.surfaceContainerHighest }}>
                <div className="w-full h-full" style={{ backgroundColor: C.secondaryContainer }} />
              </div>
              <p className="font-jetbrains text-[10px] mt-2 uppercase" style={{ color: C.onSurfaceVariant }}>
                SHA-256 Verified Ledger
              </p>
            </div>
          </header>

          {/* Search & Filter */}
          <section className="mb-8 grid grid-cols-1 md:grid-cols-12 items-center" style={{ gap: 24 }}>
            <div className="md:col-span-8 flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow" style={{ paddingTop: 16 }}>
                <label
                  className="font-jetbrains absolute top-0 left-0 text-[10px] uppercase tracking-widest"
                  style={{ color: C.onSurfaceVariant }}
                >
                  ORD_ID / SPECIMEN_TYPE
                </label>
                <input
                  className="w-full bg-transparent border-b py-2 font-jetbrains text-sm uppercase tracking-widest placeholder:text-outline focus:outline-none transition-colors"
                  style={{ borderColor: C.outlineVariant, color: C.onSurface }}
                  placeholder="SEARCH ARCHIVE..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = C.primary)}
                  onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = C.outlineVariant)}
                  data-testid="input-search-orders"
                />
                <span
                  className="material-symbols-outlined absolute right-2 top-6 opacity-40"
                  style={{ fontSize: 20, color: C.primary }}
                >
                  search
                </span>
              </div>
            </div>
            <div className="md:col-span-4 flex justify-end gap-4 flex-wrap">
              <button
                className="flex items-center gap-2 px-4 py-2 border transition-colors"
                style={{ borderColor: C.outlineVariant, color: C.onSurfaceVariant }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.surfaceContainerHighest)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                data-testid="button-filter"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_list</span>
                <span style={{ ...LABEL_CAPS, fontSize: 10 }}>Filter Parameters</span>
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 border transition-colors"
                style={{ borderColor: C.outlineVariant, color: C.onSurfaceVariant }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.surfaceContainerHighest)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                data-testid="button-export-csv"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                <span style={{ ...LABEL_CAPS, fontSize: 10 }}>Export CSV</span>
              </button>
            </div>
          </section>

          {/* Archive Ledger */}
          <section className="relative">
            {/* Editorial line */}
            <div className="mb-10 relative h-px" style={{ backgroundColor: "#DBDAD5" }}>
              <div className="absolute left-0 top-0 h-px w-10" style={{ backgroundColor: C.primaryContainer }} />
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-sm" style={{ backgroundColor: C.surfaceContainerHigh }} />
                ))}
              </div>
            ) : orders.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <span
                  className="material-symbols-outlined block mb-8"
                  style={{ fontSize: 80, color: C.outlineVariant }}
                >
                  inventory_2
                </span>
                <h4
                  className="uppercase mb-3"
                  style={{ ...PLAYFAIR, fontSize: 28, color: C.primary }}
                >
                  No deployment data found
                </h4>
                <p className="text-sm max-w-sm" style={{ color: C.onSurfaceVariant, ...INTER }}>
                  {search
                    ? "No orders match your search. Try a different query."
                    : "There is no documented biological movement in the current archive segment."}
                </p>
                {!search && (
                  <Link href="/shop">
                    <button
                      className="mt-8 px-8 py-3 font-jetbrains text-xs uppercase tracking-widest transition-opacity hover:opacity-80"
                      style={{ backgroundColor: C.primary, color: C.white }}
                      data-testid="button-browse-shop"
                    >
                      Browse Specimens →
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              <div>
                {orders.map((order) => (
                  <LedgerRow key={order.id} order={order} />
                ))}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer
            className="mt-20 pt-8 border-t"
            style={{ borderColor: C.primary }}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 items-start" style={{ gap: 24 }}>
              <div className="md:col-span-6">
                <h2
                  className="uppercase tracking-tighter mb-4"
                  style={{ ...PLAYFAIR, fontSize: 28, color: C.primary }}
                >
                  19 DOGS
                </h2>
                <p
                  className="font-jetbrains text-[10px] mb-8"
                  style={{ color: C.onSurfaceVariant, letterSpacing: "0.3em" }}
                >
                  © {new Date().getFullYear()} 19 DOGS BIOLOGICAL SYSTEMS. ALL RIGHTS RESERVED.
                </p>
              </div>
              <div className="md:col-span-6 grid grid-cols-2" style={{ gap: 24 }}>
                <ul className="space-y-2">
                  <li>
                    <Link href="/account">
                      <span
                        className="font-jetbrains text-[10px] cursor-pointer transition-colors"
                        style={{ color: C.primary, letterSpacing: "0.15em" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = C.secondaryContainer)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = C.primary)}
                      >
                        Bio-Profile
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/account/addresses">
                      <span
                        className="font-jetbrains text-[10px] cursor-pointer transition-colors"
                        style={{ color: C.primary, letterSpacing: "0.15em" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = C.secondaryContainer)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = C.primary)}
                      >
                        Biological Coordinates
                      </span>
                    </Link>
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li>
                    <Link href="/wishlist">
                      <span
                        className="font-jetbrains text-[10px] cursor-pointer transition-colors"
                        style={{ color: C.primary, letterSpacing: "0.15em" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = C.secondaryContainer)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = C.primary)}
                      >
                        Saved Specimens
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/account/settings">
                      <span
                        className="font-jetbrains text-[10px] cursor-pointer transition-colors"
                        style={{ color: C.primary, letterSpacing: "0.15em" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = C.secondaryContainer)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = C.primary)}
                      >
                        SOP Documentation
                      </span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </footer>

        </main>
      </div>

      {/* Site footer hidden on this editorial page — it has its own footer */}
    </div>
  );
}
