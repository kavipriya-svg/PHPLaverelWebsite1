import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { HomeEditorialHeader, HomeEditorialFooter } from "@/components/store/HomeEditorialLayout";
import { mergeHomepageSettings, DEFAULT_HOMEPAGE_SETTINGS } from "@/lib/homepageDefaults";
import type { HomepageSettings } from "@/lib/homepageDefaults";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
};

type WishlistData = { items: unknown[] };
type AddressData = unknown[];

const C = {
  primary: "#00160c",
  primaryContainer: "#012d1d",
  secondary: "#944923",
  secondaryContainer: "#fe9e71",
  surface: "#f9faf6",
  surfaceContainer: "#eeeeeb",
  surfaceContainerHigh: "#e8e8e5",
  outline: "#717973",
  outlineVariant: "#c1c8c2",
  onSurface: "#1a1c1a",
  onSurfaceVariant: "#414844",
  error: "#ba1a1a",
  primaryFixed: "#c0edd4",
  white: "#ffffff",
};

const PLAYFAIR = { fontFamily: "'Playfair Display', Georgia, serif" } as const;
const INTER = { fontFamily: "Inter, sans-serif" } as const;
const JETBRAINS = { fontFamily: "'JetBrains Mono', 'Courier New', monospace" } as const;
const LABEL_CAPS = { ...INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" as const };

const NAV_ITEMS = [
  { icon: "biotech", label: "Bio-Profile", href: "/account" },
  { icon: "history_edu", label: "Order History", href: "/account/orders" },
  { icon: "bookmark", label: "Saved Specimens", href: "/wishlist" },
  { icon: "location_on", label: "Bio. Coordinates", href: "/account/addresses" },
  { icon: "settings", label: "Preferences", href: "/account/settings" },
];

const GRID_CARDS = [
  {
    icon: "history_edu",
    label: "Logistics Archive",
    desc: "Complete historical record of biological acquisitions and deployments.",
    href: "/account/orders",
  },
  {
    icon: "bookmark",
    label: "Saved Specimens",
    desc: "Curation of research-grade products earmarked for future acquisition.",
    href: "/wishlist",
  },
  {
    icon: "location_on",
    label: "Biological Coordinates",
    desc: "Registered receiving locations for delicate biological transports.",
    href: "/account/addresses",
  },
  {
    icon: "tune",
    label: "Account Preferences",
    desc: "Update protocol settings, communication relays, and security keys.",
    href: "/account/settings",
  },
];

export default function Account() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const gridRef = useRef<HTMLDivElement>(null);
  const [timestamp, setTimestamp] = useState("--:--:--");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimestamp(now.toLocaleTimeString("en-GB", { hour12: false }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!gridRef.current) return;
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      gridRef.current.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({ title: "Please log in to continue", variant: "destructive" });
      setTimeout(() => setLocation("/login"), 500);
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  const { data: settingsData } = useQuery<{ settings: Partial<HomepageSettings> }>({
    queryKey: ["/api/settings/homepage"],
  });
  const s = settingsData
    ? mergeHomepageSettings(settingsData.settings || {})
    : DEFAULT_HOMEPAGE_SETTINGS;

  const { data: ordersData } = useQuery<{ orders: Order[] }>({
    queryKey: ["/api/account/orders"],
    enabled: isAuthenticated,
  });
  const { data: wishlistData } = useQuery<WishlistData>({
    queryKey: ["/api/wishlist"],
    enabled: isAuthenticated,
  });
  const { data: addressesData } = useQuery<AddressData>({
    queryKey: ["/api/addresses"],
    enabled: isAuthenticated,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const orders = ordersData?.orders ?? [];
  const wishlistCount = wishlistData?.items?.length ?? 0;
  const addressCount = Array.isArray(addressesData) ? (addressesData as unknown[]).length : 0;
  const latestOrder = orders[0] ?? null;
  const activeOrderCount = orders.filter((o) =>
    ["pending", "processing", "shipped"].includes(o.status)
  ).length;

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Member";
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toISOString().slice(0, 10)
    : "—";
  const initials = (
    user?.firstName?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase();

  return (
    <div className="overflow-x-hidden" style={{ backgroundColor: C.surface, color: C.onSurface }}>
      <HomeEditorialHeader nav={s.nav} />
    <div
      className="flex relative"
      style={{ minHeight: "100vh", overflowX: "hidden", paddingTop: 104 }}
    >
      {/* Animated dot-grid background */}
      <div
        ref={gridRef}
        className="grid-pattern absolute inset-0 pointer-events-none"
      />

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 self-start sticky top-0 border-r py-8 px-6 z-40"
        style={{
          width: 288,
          minHeight: "100vh",
          backgroundColor: C.surfaceContainer,
          borderColor: C.outlineVariant,
        }}
      >
        <div className="mb-10">
          <h3
            className="mb-1"
            style={{ ...PLAYFAIR, fontSize: 22, fontWeight: 700, color: C.primary }}
          >
            CANINE BIOMETRIC ID
          </h3>
          <p
            className="font-jetbrains text-xs opacity-60"
            style={{ color: C.onSurfaceVariant }}
          >
            V.01.2024 REV
          </p>
        </div>

        <nav className="flex flex-col gap-1 flex-grow">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/account";
            return (
              <Link key={item.href} href={item.href}>
                <div
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex items-center gap-3 py-4 cursor-pointer transition-all"
                  style={{
                    color: isActive ? C.primary : C.onSurfaceVariant,
                    fontWeight: isActive ? 700 : 400,
                    paddingLeft: isActive ? 16 : 20,
                    borderLeft: isActive ? `4px solid ${C.secondary}` : "4px solid transparent",
                    backgroundColor: isActive ? `${C.surfaceContainerHigh}80` : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.backgroundColor = C.surfaceContainerHigh;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20, color: isActive ? C.primary : C.onSurfaceVariant }}
                  >
                    {item.icon}
                  </span>
                  <span style={LABEL_CAPS}>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div
          className="pt-8 mt-auto border-t"
          style={{ borderColor: C.outlineVariant }}
        >
          <button
            className="w-full py-4 mb-4 hover:opacity-90 transition-opacity"
            style={{
              ...LABEL_CAPS,
              backgroundColor: C.primary,
              color: C.white,
              letterSpacing: "0.18em",
            }}
            data-testid="button-upgrade"
          >
            UPGRADE PLAN
          </button>
          <button
            className="flex items-center gap-3 py-4 transition-colors w-full"
            style={{ color: C.onSurfaceVariant }}
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = C.error)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = C.onSurfaceVariant)
            }
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            <span style={LABEL_CAPS}>
              {logoutMutation.isPending ? "Syncing…" : "De-synchronize"}
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-grow px-5 md:px-[64px] py-12 relative z-10">
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>

          {/* Editorial Header */}
          <section className="mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div
              className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b"
              style={{ borderColor: C.outlineVariant }}
            >
              <div>
                <span
                  className="font-jetbrains text-xs uppercase tracking-widest block mb-2"
                  style={{ color: C.secondary }}
                >
                  Dossier Access // Internal Use Only
                </span>
                <h1
                  style={{
                    ...PLAYFAIR,
                    fontSize: "clamp(32px,5.5vw,64px)",
                    fontWeight: 600,
                    lineHeight: 1.1,
                    color: C.primary,
                  }}
                  data-testid="text-page-title"
                >
                  Subject Profile // Account Dossier
                </h1>
              </div>
              <div className="text-right">
                <p
                  className="font-jetbrains text-sm"
                  style={{ color: C.onSurfaceVariant }}
                >
                  NODE_09 // FRANKFURT_DC
                </p>
                <p
                  className="font-jetbrains text-sm"
                  style={{ color: C.onSurfaceVariant }}
                  data-testid="text-timestamp"
                >
                  SECURE_SYNC: {timestamp}
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* ── Subject Identity Column ─────────────────────── */}
            <div className="md:col-span-5 space-y-10">

              {/* Bio card */}
              <div
                className="hard-shadow p-8 relative overflow-hidden"
                style={{ backgroundColor: C.surface }}
              >
                <div
                  className="absolute top-0 right-0 p-4 font-jetbrains text-[10px] opacity-20"
                  style={{
                    transform: "rotate(90deg)",
                    transformOrigin: "top right",
                    color: C.onSurface,
                  }}
                >
                  DNA_VERIFIED_IDENTITY
                </div>

                <div className="flex flex-col items-center md:items-start gap-8">
                  {/* Avatar square */}
                  <div className="relative group flex-shrink-0">
                    <div
                      className="w-48 h-48 overflow-hidden p-1 flex items-center justify-center"
                      style={{
                        backgroundColor: C.surfaceContainerHigh,
                        border: `1px solid ${C.outlineVariant}`,
                      }}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center select-none"
                        style={{
                          backgroundColor: C.primaryContainer,
                          color: C.primaryFixed,
                          ...PLAYFAIR,
                          fontSize: 64,
                          fontWeight: 700,
                        }}
                        data-testid="avatar-initials"
                      >
                        {initials}
                      </div>
                    </div>
                    {/* Scan-line animation */}
                    <div
                      className="absolute top-0 left-0 w-full h-0.5 animate-bounce mt-4 opacity-50 group-hover:opacity-100 transition-opacity"
                      style={{
                        backgroundColor: C.secondaryContainer,
                        boxShadow: "0 0 15px rgba(254,158,113,0.8)",
                      }}
                    />
                  </div>

                  <div className="space-y-4 w-full">
                    <div>
                      <span
                        className="font-jetbrains text-[10px] uppercase tracking-widest block mb-1"
                        style={{ color: C.onSurfaceVariant }}
                      >
                        DESIGNATION
                      </span>
                      <h2
                        style={{
                          ...PLAYFAIR,
                          fontSize: 26,
                          fontWeight: 700,
                          color: C.primary,
                        }}
                        data-testid="text-username"
                      >
                        {displayName}
                      </h2>
                    </div>

                    <div>
                      <span
                        className="font-jetbrains text-[10px] uppercase tracking-widest block mb-1"
                        style={{ color: C.onSurfaceVariant }}
                      >
                        COMMUNICATION_RELAY
                      </span>
                      <p
                        className="font-jetbrains"
                        style={{ color: C.onSurface }}
                        data-testid="text-user-email"
                      >
                        {user?.email}
                      </p>
                    </div>

                    <div
                      className="pt-4 border-t"
                      style={{ borderColor: `${C.outlineVariant}50` }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className="font-jetbrains text-[10px] uppercase tracking-widest"
                          style={{ color: C.onSurfaceVariant }}
                        >
                          BIOLOGICAL_VALIDITY
                        </span>
                        <span
                          className="font-jetbrains text-[10px]"
                          style={{ color: C.secondary }}
                        >
                          98.4%
                        </span>
                      </div>
                      <div
                        className="w-full h-0.5"
                        style={{ backgroundColor: C.surfaceContainerHigh }}
                      >
                        <div
                          className="h-full"
                          style={{ width: "98.4%", backgroundColor: C.secondaryContainer }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Summary */}
              <div
                className="p-6 space-y-4 border"
                style={{ borderColor: C.outlineVariant }}
              >
                <h4
                  className="pb-2 border-b"
                  style={{
                    ...LABEL_CAPS,
                    color: C.primary,
                    borderColor: C.outlineVariant,
                  }}
                >
                  Technical Summary
                </h4>
                <div
                  className="grid grid-cols-2 gap-4 font-jetbrains text-[11px]"
                  style={{ color: C.onSurfaceVariant }}
                >
                  <div>Member Since:</div>
                  <div style={{ color: C.onSurface }}>{memberSince}</div>
                  <div>Account Type:</div>
                  <div style={{ color: C.onSurface }} className="uppercase">
                    {user?.customerType ?? "Regular"}
                  </div>
                  <div>Active Protocols:</div>
                  <div style={{ color: C.onSurface }}>
                    {String(activeOrderCount).padStart(2, "0")}
                  </div>
                  <div>Saved Specimens:</div>
                  <div style={{ color: C.onSurface }}>
                    {String(wishlistCount).padStart(2, "0")}
                  </div>
                  <div>Coordinates Filed:</div>
                  <div style={{ color: C.onSurface }}>
                    {String(addressCount).padStart(2, "0")}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Main Dossier Content ────────────────────────── */}
            <div className="md:col-span-7 space-y-6">

              {/* Active Protocols card */}
              <div
                className="p-8 hard-shadow relative"
                style={{ backgroundColor: C.primaryContainer, color: C.white }}
              >
                <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
                  <h3
                    style={{
                      ...PLAYFAIR,
                      fontStyle: "italic",
                      fontSize: 28,
                      color: C.primaryFixed,
                    }}
                  >
                    Active Protocols
                  </h3>
                  {latestOrder ? (
                    <span
                      className="font-jetbrains text-[10px] px-3 py-1 uppercase"
                      style={{ backgroundColor: C.secondary, color: C.white }}
                    >
                      {latestOrder.status.replace(/_/g, " ")}
                    </span>
                  ) : (
                    <span
                      className="font-jetbrains text-[10px] px-3 py-1"
                      style={{ backgroundColor: C.onSurfaceVariant, color: C.white }}
                    >
                      NO_ACTIVE
                    </span>
                  )}
                </div>

                {latestOrder ? (
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div
                        className="w-20 h-20 flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: C.surfaceContainerHigh }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 40, color: C.onSurfaceVariant }}
                        >
                          package_2
                        </span>
                      </div>
                      <div className="flex-grow">
                        <p
                          className="font-jetbrains text-xs mb-1 opacity-60"
                        >
                          REF: {latestOrder.orderNumber}
                        </p>
                        <h4
                          className="font-bold mb-1"
                          style={{ fontSize: 18 }}
                        >
                          Order #{latestOrder.orderNumber}
                        </h4>
                        <p className="opacity-80 text-sm italic">
                          Total: ₹{parseFloat(latestOrder.total).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="protocol-line" />
                    <div
                      className="flex justify-between items-center font-jetbrains text-[10px] opacity-70"
                    >
                      <span>OR_ID: {latestOrder.id.slice(0, 8).toUpperCase()}</span>
                      <Link href={`/account/orders/${latestOrder.orderNumber}`}>
                        <span
                          className="underline cursor-pointer"
                          style={{ transition: "color 0.2s" }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.color = C.secondaryContainer)
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.color = "")
                          }
                          data-testid="link-track-order"
                        >
                          TRACK_SPECIMEN →
                        </span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center opacity-60">
                    <span
                      className="material-symbols-outlined block mb-2"
                      style={{ fontSize: 48 }}
                    >
                      inbox
                    </span>
                    <p className="font-jetbrains text-xs">
                      NO ACTIVE PROTOCOLS FOUND
                    </p>
                    <Link href="/shop">
                      <span
                        className="font-jetbrains text-[10px] uppercase tracking-widest underline cursor-pointer mt-3 block"
                        style={{ color: C.secondaryContainer }}
                      >
                        BROWSE SPECIMENS →
                      </span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Technical Grid Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GRID_CARDS.map((card) => (
                  <Link key={card.href} href={card.href}>
                    <div
                      className="group border p-6 cursor-pointer block"
                      style={{
                        borderColor: C.outlineVariant,
                        transition: "background-color 0.2s",
                      }}
                      data-testid={`card-${card.label.toLowerCase().replace(/\s+/g, "-")}`}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.backgroundColor = C.surfaceContainerHigh)
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
                      }
                    >
                      <div className="flex justify-between mb-4">
                        <span
                          className="material-symbols-outlined"
                          style={{ color: C.secondary }}
                        >
                          {card.icon}
                        </span>
                        <span
                          className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: C.onSurface }}
                        >
                          arrow_forward
                        </span>
                      </div>
                      <h5 className="mb-2" style={{ ...LABEL_CAPS, color: C.primary }}>
                        {card.label}
                      </h5>
                      <p className="text-xs" style={{ color: C.onSurfaceVariant }}>
                        {card.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Mobile logout (visible below sidebar on mobile) */}
              <div
                className="md:hidden flex flex-col gap-3 pt-6 border-t"
                style={{ borderColor: C.outlineVariant }}
              >
                <Link href="/account/orders">
                  <div
                    className="flex items-center gap-3 py-3"
                    style={{ color: C.onSurfaceVariant }}
                    data-testid="mobile-nav-orders"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>history_edu</span>
                    <span style={LABEL_CAPS}>Order History</span>
                  </div>
                </Link>
                <Link href="/account/settings">
                  <div
                    className="flex items-center gap-3 py-3"
                    style={{ color: C.onSurfaceVariant }}
                    data-testid="mobile-nav-settings"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>
                    <span style={LABEL_CAPS}>Preferences</span>
                  </div>
                </Link>
                <button
                  className="flex items-center gap-3 py-3"
                  style={{ color: C.error }}
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  data-testid="mobile-button-logout"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
                  <span style={LABEL_CAPS}>De-synchronize</span>
                </button>
              </div>

              {/* Compliance note */}
              <div
                className="mt-8 pt-8 border-t italic text-xs"
                style={{
                  borderColor: `${C.outlineVariant}50`,
                  color: C.onSurfaceVariant,
                  ...INTER,
                }}
              >
                Identity verification managed by 19 DOGS Secure Encryption Systems. All data points are strictly confidential and encrypted at rest using AES-256 standards for biological compliance.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
      <HomeEditorialFooter footer={s.footer} />
    </div>
  );
}
