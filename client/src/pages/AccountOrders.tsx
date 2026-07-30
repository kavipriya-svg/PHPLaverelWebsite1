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
  primaryFixed: "#c0edd4",
  error: "#ba1a1a",
  white: "#ffffff",
};

const PLAYFAIR = { fontFamily: "'Playfair Display', Georgia, serif" } as const;
const INTER = { fontFamily: "Inter, sans-serif" } as const;
const JETBRAINS = { fontFamily: "'JetBrains Mono', 'Courier New', monospace" } as const;
const LABEL_CAPS = { ...INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" as const };

// ─── Settings types ───────────────────────────────────────────────
interface NavItem { icon: string; label: string; href: string }

interface OrderHistorySettings {
  header: {
    secureLabel: string;
    title: string;
    subtitle: string;
    integrityLabel: string;
    integritySubtext: string;
  };
  sidebar: {
    title: string;
    version: string;
    ctaText: string;
    navItems: NavItem[];
  };
  search: {
    label: string;
    placeholder: string;
    filterText: string;
    exportText: string;
  };
  ledger: {
    idLabel: string;
    dateLabel: string;
    statusLabel: string;
    valueLabel: string;
    trackText: string;
    invoiceText: string;
    dossierText: string;
    trackBtnText: string;
  };
  statusLabels: {
    deployed: string;
    inTransit: string;
    processing: string;
    pending: string;
    cancelled: string;
    synchronized: string;
  };
  emptyState: {
    title: string;
    description: string;
    browseText: string;
    browseHref: string;
  };
  background: {
    decorativeText: string;
  };
  footer: {
    brandName: string;
    copyright: string;
  };
}

const SETTINGS_DEFAULTS: OrderHistorySettings = {
  header: {
    secureLabel: "STATUS: SECURE",
    title: "Logistics Archive",
    subtitle: "// Deployment History",
    integrityLabel: "DATA INTEGRITY",
    integritySubtext: "SHA-256 Verified Ledger",
  },
  sidebar: {
    title: "CANINE BIOMETRIC ID",
    version: "V.01.2024 REV",
    ctaText: "Request Lab Access",
    navItems: [
      { icon: "biotech", label: "Bio-Profile", href: "/account" },
      { icon: "history_edu", label: "Order History", href: "/account/orders" },
      { icon: "bookmark", label: "Saved Specimens", href: "/wishlist" },
      { icon: "location_on", label: "Bio. Coordinates", href: "/account/addresses" },
      { icon: "settings", label: "Preferences", href: "/account/settings" },
    ],
  },
  search: {
    label: "ORD_ID / SPECIMEN_TYPE",
    placeholder: "SEARCH ARCHIVE...",
    filterText: "Filter Parameters",
    exportText: "Export CSV",
  },
  ledger: {
    idLabel: "ID_SEQUENCE",
    dateLabel: "SYNCH_DATE",
    statusLabel: "STATUS",
    valueLabel: "VALUE",
    trackText: "Track Deployment",
    invoiceText: "Download Invoice",
    dossierText: "Dossier",
    trackBtnText: "Track",
  },
  statusLabels: {
    deployed: "DEPLOYED",
    inTransit: "IN_TRANSIT",
    processing: "PROCESSING",
    pending: "PENDING",
    cancelled: "CANCELLED",
    synchronized: "SYNCHRONIZED",
  },
  emptyState: {
    title: "No deployment data found",
    description: "There is no documented biological movement in the current archive segment.",
    browseText: "Browse Specimens →",
    browseHref: "/shop",
  },
  background: {
    decorativeText: "LE-001",
  },
  footer: {
    brandName: "19 DOGS",
    copyright: `© ${new Date().getFullYear()} 19 DOGS BIOLOGICAL SYSTEMS. ALL RIGHTS RESERVED.`,
  },
};

function mergeSettings(saved: Partial<OrderHistorySettings>): OrderHistorySettings {
  return {
    header: { ...SETTINGS_DEFAULTS.header, ...(saved.header || {}) },
    sidebar: {
      ...SETTINGS_DEFAULTS.sidebar,
      ...(saved.sidebar || {}),
      navItems: saved.sidebar?.navItems?.length
        ? saved.sidebar.navItems
        : SETTINGS_DEFAULTS.sidebar.navItems,
    },
    search: { ...SETTINGS_DEFAULTS.search, ...(saved.search || {}) },
    ledger: { ...SETTINGS_DEFAULTS.ledger, ...(saved.ledger || {}) },
    statusLabels: { ...SETTINGS_DEFAULTS.statusLabels, ...(saved.statusLabels || {}) },
    emptyState: { ...SETTINGS_DEFAULTS.emptyState, ...(saved.emptyState || {}) },
    background: { ...SETTINGS_DEFAULTS.background, ...(saved.background || {}) },
    footer: { ...SETTINGS_DEFAULTS.footer, ...(saved.footer || {}) },
  };
}

// ─── Status helpers ────────────────────────────────────────────────
function getStatusConfig(status: string, labels: OrderHistorySettings["statusLabels"]) {
  switch (status) {
    case "delivered":
      return { label: labels.deployed, dot: "#264e3c", color: C.primary, pulse: false };
    case "shipped":
      return { label: labels.inTransit, dot: C.secondary, color: C.secondary, pulse: true };
    case "processing":
      return { label: labels.processing, dot: C.secondary, color: C.secondary, pulse: true };
    case "pending":
      return { label: labels.pending, dot: "#944923", color: C.secondary, pulse: false };
    case "cancelled":
      return { label: labels.cancelled, dot: C.error, color: C.error, pulse: false };
    default:
      return { label: labels.synchronized, dot: C.outline, color: C.outline, pulse: false };
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
function LedgerRow({
  order,
  ledger,
  statusLabels,
}: {
  order: OrderWithItems;
  ledger: OrderHistorySettings["ledger"];
  statusLabels: OrderHistorySettings["statusLabels"];
}) {
  const [hovered, setHovered] = useState(false);
  const status = getStatusConfig(order.status, statusLabels);
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
        <p className="font-jetbrains text-xs mb-1" style={{ color: C.onSurfaceVariant }}>{ledger.idLabel}</p>
        <p className="font-jetbrains text-base font-bold tracking-tight" style={{ color: C.primary }}>
          {order.orderNumber}
        </p>
      </div>

      {/* Date */}
      <div className="lg:col-span-2">
        <p className="font-jetbrains text-xs mb-1" style={{ color: C.onSurfaceVariant }}>{ledger.dateLabel}</p>
        <p className="font-inter text-sm uppercase" style={{ color: C.onSurface }}>
          {formatOrderDate(order.createdAt)}
        </p>
      </div>

      {/* Status */}
      <div className="lg:col-span-2">
        <p className="font-jetbrains text-xs mb-1" style={{ color: C.onSurfaceVariant }}>{ledger.statusLabel}</p>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${status.pulse ? "animate-pulse" : ""}`}
            style={{ backgroundColor: status.dot }}
          />
          <span className="font-jetbrains text-[10px] tracking-widest" style={{ color: status.color }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Product thumbnails */}
      <div className="lg:col-span-3 flex items-center py-2" style={{ marginLeft: -16 }}>
        {visibleItems.map((item, i) => (
          <div
            key={i}
            className="w-12 h-12 border-2 overflow-hidden flex-shrink-0 cursor-pointer"
            style={{
              borderColor: C.surface,
              marginLeft: i === 0 ? 16 : -8,
              filter: hovered ? "grayscale(0)" : "grayscale(1)",
              transition: "filter 0.3s ease",
            }}
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: C.surfaceContainerHigh }}>
                <span className="material-symbols-outlined text-sm" style={{ color: C.outline }}>package_2</span>
              </div>
            )}
          </div>
        ))}
        {extraItems > 0 && (
          <div
            className="w-12 h-12 flex items-center justify-center flex-shrink-0 border-2 font-jetbrains text-[10px]"
            style={{ borderColor: C.surface, backgroundColor: C.surfaceContainerHigh, marginLeft: -8, color: C.onSurfaceVariant }}
          >
            +{extraItems}
          </div>
        )}
      </div>

      {/* Value + links */}
      <div className="lg:col-span-1">
        <p className="font-jetbrains text-xs mb-1" style={{ color: C.onSurfaceVariant }}>{ledger.valueLabel}</p>
        <p className="font-jetbrains text-sm font-bold" style={{ color: C.onSurface }}>
          {formatCurrency(order.total)}
        </p>
        <div className="mt-2 flex flex-col gap-1">
          <Link
            href={`/account/orders/${order.orderNumber}`}
            className="flex items-center gap-1 transition-colors"
            style={{ color: C.primary }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = C.secondary)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = C.primary)}
            data-testid={`link-track-${order.orderNumber}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
            <span style={{ ...LABEL_CAPS, fontSize: 9, letterSpacing: "0.15em" }}>{ledger.trackText}</span>
          </Link>
          <Link
            href={`/account/orders/${order.orderNumber}`}
            className="flex items-center gap-1 transition-colors"
            style={{ color: C.primary }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = C.secondary)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = C.primary)}
            data-testid={`link-invoice-${order.orderNumber}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
            <span style={{ ...LABEL_CAPS, fontSize: 9, letterSpacing: "0.15em" }}>{ledger.invoiceText}</span>
          </Link>
        </div>
      </div>

      {/* Hover action buttons */}
      <div
        className="lg:col-span-2 flex justify-end gap-2 transition-all duration-300"
        style={{ opacity: hovered ? 1 : 0, transform: hovered ? "translateX(0)" : "translateX(-10px)" }}
      >
        <Link
          href={`/account/orders/${order.orderNumber}`}
          className="px-3 py-1 font-jetbrains text-[9px] tracking-widest uppercase transition-colors"
          style={{ backgroundColor: C.primary, color: C.white }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = C.secondaryContainer; (e.currentTarget as HTMLElement).style.color = C.primary; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = C.primary; (e.currentTarget as HTMLElement).style.color = C.white; }}
          data-testid={`button-dossier-${order.orderNumber}`}
        >
          {ledger.dossierText}
        </Link>
        <Link
          href={`/account/orders/${order.orderNumber}`}
          className="px-3 py-1 font-jetbrains text-[9px] tracking-widest uppercase border transition-colors"
          style={{ borderColor: C.primary, color: C.primary, backgroundColor: "transparent" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = C.primary; (e.currentTarget as HTMLElement).style.color = C.white; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = C.primary; }}
          data-testid={`button-track-${order.orderNumber}`}
        >
          {ledger.trackBtnText}
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

  // Order History page settings
  const { data: ohData } = useQuery<{ settings: Partial<OrderHistorySettings> }>({
    queryKey: ["/api/settings/account-order-history"],
  });
  const cfg = ohData ? mergeSettings(ohData.settings || {}) : SETTINGS_DEFAULTS;

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

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Member";
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
        style={{ top: "20%", right: "-10%", width: "40%", height: "60%", border: `0.5px solid ${C.outlineVariant}30` }}
      />
      <div
        ref={scrollBgRef}
        className="fixed pointer-events-none select-none -z-10"
        style={{ bottom: "10%", left: "5%", ...JETBRAINS, fontSize: 180, color: `${C.primary}05`, lineHeight: 1 }}
      >
        {cfg.background.decorativeText}
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
              {cfg.sidebar.title}
            </h1>
            <p className="font-jetbrains text-[10px] tracking-widest uppercase opacity-60 mt-1" style={{ color: C.onSurfaceVariant }}>
              {cfg.sidebar.version}
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
              <p className="font-inter text-sm font-semibold truncate" style={{ color: C.primary }}>{displayName}</p>
              <p className="font-jetbrains text-[10px]" style={{ color: C.onSurfaceVariant }}>Verified Entity</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 flex-grow">
            {cfg.sidebar.navItems.map((item) => {
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
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = C.surfaceContainerHighest;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    }}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 20, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                    <span style={{ ...LABEL_CAPS, fontSize: 11 }}>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* CTA */}
          <button
            className="mt-auto py-4 font-jetbrains text-xs tracking-[0.2em] uppercase text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: C.primary, color: C.white }}
            data-testid="button-sidebar-cta"
          >
            {cfg.sidebar.ctaText}
          </button>
        </aside>

        {/* ── Main Content ──────────────────────────────────────── */}
        <main className="flex-grow px-5 md:px-[64px] py-[32px]" style={{ maxWidth: 1440 - 256 }}>

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
                  data-testid="badge-secure"
                >
                  {cfg.header.secureLabel}
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
                data-testid="heading-title"
              >
                {cfg.header.title}
              </h2>
              <h3
                className="leading-none uppercase tracking-tighter mt-2"
                style={{ ...PLAYFAIR, fontSize: "clamp(18px,2.5vw,32px)", color: `${C.onSurfaceVariant}60` }}
                data-testid="heading-subtitle"
              >
                {cfg.header.subtitle}
              </h3>
            </div>

            <div className="text-right hidden md:block">
              <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.primary, marginBottom: 4 }}>{cfg.header.integrityLabel}</p>
              <div className="w-48 h-1" style={{ backgroundColor: C.surfaceContainerHighest }}>
                <div className="w-full h-full" style={{ backgroundColor: C.secondaryContainer }} />
              </div>
              <p className="font-jetbrains text-[10px] mt-2 uppercase" style={{ color: C.onSurfaceVariant }}>
                {cfg.header.integritySubtext}
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
                  {cfg.search.label}
                </label>
                <input
                  className="w-full bg-transparent border-b py-2 font-jetbrains text-sm uppercase tracking-widest placeholder:text-outline focus:outline-none transition-colors"
                  style={{ borderColor: C.outlineVariant, color: C.onSurface }}
                  placeholder={cfg.search.placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = C.primary)}
                  onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = C.outlineVariant)}
                  data-testid="input-search-orders"
                />
                <span className="material-symbols-outlined absolute right-2 top-6 opacity-40" style={{ fontSize: 20, color: C.primary }}>
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
                <span style={{ ...LABEL_CAPS, fontSize: 10 }}>{cfg.search.filterText}</span>
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 border transition-colors"
                style={{ borderColor: C.outlineVariant, color: C.onSurfaceVariant }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.surfaceContainerHighest)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                data-testid="button-export-csv"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                <span style={{ ...LABEL_CAPS, fontSize: 10 }}>{cfg.search.exportText}</span>
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
              <div className="flex flex-col items-center justify-center py-32 text-center" data-testid="empty-state">
                <span className="material-symbols-outlined block mb-8" style={{ fontSize: 80, color: C.outlineVariant }}>
                  inventory_2
                </span>
                <h4 className="uppercase mb-3" style={{ ...PLAYFAIR, fontSize: 28, color: C.primary }} data-testid="text-empty-title">
                  {cfg.emptyState.title}
                </h4>
                <p className="text-sm max-w-sm" style={{ color: C.onSurfaceVariant, ...INTER }} data-testid="text-empty-description">
                  {search ? "No orders match your search. Try a different query." : cfg.emptyState.description}
                </p>
                {!search && (
                  <Link href={cfg.emptyState.browseHref}>
                    <button
                      className="mt-8 px-8 py-3 font-jetbrains text-xs uppercase tracking-widest transition-opacity hover:opacity-80"
                      style={{ backgroundColor: C.primary, color: C.white }}
                      data-testid="button-browse-shop"
                    >
                      {cfg.emptyState.browseText}
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              <div>
                {orders.map((order) => (
                  <LedgerRow
                    key={order.id}
                    order={order}
                    ledger={cfg.ledger}
                    statusLabels={cfg.statusLabels}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="mt-20 pt-8 border-t" style={{ borderColor: C.primary }}>
            <div className="grid grid-cols-1 md:grid-cols-12 items-start" style={{ gap: 24 }}>
              <div className="md:col-span-6">
                <h2
                  className="uppercase tracking-tighter mb-4"
                  style={{ ...PLAYFAIR, fontSize: 28, color: C.primary }}
                  data-testid="text-footer-brand"
                >
                  {cfg.footer.brandName}
                </h2>
                <p
                  className="font-jetbrains text-[10px] mb-8"
                  style={{ color: C.onSurfaceVariant, letterSpacing: "0.3em" }}
                  data-testid="text-footer-copyright"
                >
                  {cfg.footer.copyright}
                </p>
              </div>
              <div className="md:col-span-6 grid grid-cols-2" style={{ gap: 24 }}>
                <ul className="space-y-2">
                  <li>
                    <Link href="/account">
                      <span className="font-jetbrains text-[10px] cursor-pointer transition-colors" style={{ color: C.primary, letterSpacing: "0.15em" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = C.secondaryContainer)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = C.primary)}>
                        Bio-Profile
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/account/addresses">
                      <span className="font-jetbrains text-[10px] cursor-pointer transition-colors" style={{ color: C.primary, letterSpacing: "0.15em" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = C.secondaryContainer)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = C.primary)}>
                        Biological Coordinates
                      </span>
                    </Link>
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li>
                    <Link href="/wishlist">
                      <span className="font-jetbrains text-[10px] cursor-pointer transition-colors" style={{ color: C.primary, letterSpacing: "0.15em" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = C.secondaryContainer)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = C.primary)}>
                        Saved Specimens
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/account/settings">
                      <span className="font-jetbrains text-[10px] cursor-pointer transition-colors" style={{ color: C.primary, letterSpacing: "0.15em" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = C.secondaryContainer)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = C.primary)}>
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
    </div>
  );
}
