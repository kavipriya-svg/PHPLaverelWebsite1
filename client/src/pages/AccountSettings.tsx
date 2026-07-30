import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Design tokens ────────────────────────────────────────────────
const C = {
  primary:                "#00160c",
  primaryContainer:       "#012d1d",
  secondary:              "#944923",
  secondaryContainer:     "#fe9e71",
  surface:                "#f9faf6",
  surfaceContainerLow:    "#f3f4f0",
  surfaceContainerHigh:   "#e8e8e5",
  surfaceContainerHighest:"#e2e3e0",
  surfaceContainer:       "#eeeeeb",
  outline:                "#717973",
  outlineVariant:         "#c1c8c2",
  onSurface:              "#1a1c1a",
  onSurfaceVariant:       "#414844",
  primaryFixed:           "#c0edd4",
  error:                  "#ba1a1a",
  white:                  "#ffffff",
};

const PLAYFAIR   = { fontFamily: "'Playfair Display', Georgia, serif" } as const;
const INTER      = { fontFamily: "Inter, sans-serif" } as const;
const JETBRAINS  = { fontFamily: "'JetBrains Mono', 'Courier New', monospace" } as const;
const LABEL_CAPS = { ...INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" as const };

// ─── Sidebar nav items ────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "clinical_notes", label: "Subject Profile",        href: "/account" },
  { icon: "inventory_2",    label: "Logistics Archive",      href: "/account/orders" },
  { icon: "science",        label: "Saved Specimens",        href: "/wishlist" },
  { icon: "my_location",    label: "Biological Coordinates", href: "/account/addresses" },
  { icon: "settings",       label: "Account Preferences",   href: "/account/settings" },
];

// ─── Toggle switch component ──────────────────────────────────────
function ToggleSwitch({
  checked, onChange, testId,
}: { checked: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      data-testid={testId}
      style={{
        width: 44,
        height: 22,
        borderRadius: 9999,
        padding: 2,
        backgroundColor: checked ? C.primaryContainer : C.surfaceContainerHighest,
        border: `1px solid ${C.outlineVariant}`,
        cursor: "pointer",
        position: "relative",
        transition: "background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 9999,
          backgroundColor: checked ? C.white : C.outline,
          transform: checked ? "translateX(20px)" : "translateX(0)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

// ─── Section header helper ────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <h3
      className="flex items-center gap-3 mb-8"
      style={{ ...LABEL_CAPS, fontSize: 11, color: C.primary }}
    >
      <span style={{ display: "block", width: 16, height: 1, backgroundColor: C.primary, flexShrink: 0 }} />
      {label}
    </h3>
  );
}

// ─── Main page ────────────────────────────────────────────────────
export default function AccountSettings() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast }        = useToast();
  const [, setLocation]  = useLocation();

  // Notification toggles (local state — extend with API if endpoints added)
  const [orderUpdates,      setOrderUpdates]      = useState(true);
  const [promoEmails,       setPromoEmails]        = useState(false);
  const [restockAlerts,     setRestockAlerts]      = useState(true);

  // Delivery schedule (subscription users only)
  const [deliverySchedule,  setDeliverySchedule]  = useState(
    user?.subscriptionDeliverySchedule || "weekly"
  );
  useEffect(() => {
    if (user?.subscriptionDeliverySchedule) setDeliverySchedule(user.subscriptionDeliverySchedule);
  }, [user?.subscriptionDeliverySchedule]);

  // Delivery schedule mutation
  const schedMutation = useMutation({
    mutationFn: async (schedule: string) => {
      const r = await apiRequest("PATCH", "/api/account/delivery-schedule", { schedule });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Delivery schedule updated" });
    },
    onError: () => toast({ title: "Could not update schedule", variant: "destructive" }),
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/auth/logout");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: () => toast({ title: "Sign-out failed", variant: "destructive" }),
  });

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({ title: "Please sign in", variant: "destructive" });
      setTimeout(() => setLocation("/login"), 500);
    }
  }, [isAuthenticated, authLoading]);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Member";
  const initials    = (user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase();

  if (authLoading) {
    return (
      <div style={{ backgroundColor: C.surface, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...JETBRAINS, fontSize: 11, color: C.onSurfaceVariant, letterSpacing: "0.2em", textTransform: "uppercase", textAlign: "center" }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: C.primary }} />
          Authenticating...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="overflow-x-hidden" style={{ backgroundColor: C.surface, color: C.onSurface }}>

      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0 self-start sticky"
          style={{
            top: 0,
            width: 256,
            minHeight: "100vh",
            backgroundColor: C.surfaceContainerLow,
            boxShadow: "40px 0px 0px 0px rgba(1,45,29,0.05)",
            padding: "32px 24px",
          }}
        >
          {/* Brand tag */}
          <div className="mb-10">
            <h1 style={{ ...PLAYFAIR, fontSize: 22, fontWeight: 700, color: C.primary }}>
              Account
            </h1>
            <p style={{ ...JETBRAINS, fontSize: 10, letterSpacing: "0.15em", color: C.onSurfaceVariant, opacity: 0.6, marginTop: 4, textTransform: "uppercase" }}>
              Protocol // v0.19
            </p>
          </div>

          {/* User pill */}
          <div
            className="flex items-center gap-3 mb-8 p-2"
            style={{ border: `1px solid ${C.outlineVariant}50` }}
          >
            <div
              className="w-10 h-10 flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: C.primaryContainer, color: C.primaryFixed, ...JETBRAINS, fontSize: 13 }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p style={{ ...INTER, fontSize: 14, fontWeight: 600, color: C.primary }} className="truncate">{displayName}</p>
              <p style={{ ...JETBRAINS, fontSize: 10, color: C.onSurfaceVariant }}>Active Member</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1 flex-grow">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === "/account/settings";
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isActive ? C.primary : "transparent",
                      color: isActive ? C.white : C.onSurfaceVariant,
                      transform: isActive ? "translateX(4px)" : "none",
                      transition: "background-color 0.15s, transform 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = C.surfaceContainerHigh; }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                    data-testid={`nav-${item.label.toLowerCase().replace(/[\s.]+/g, "-")}`}
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

          {/* Bottom CTA */}
          <button
            className="mt-auto py-4 transition-opacity hover:opacity-90"
            style={{ ...LABEL_CAPS, backgroundColor: C.primary, color: C.white, letterSpacing: "0.2em" }}
            data-testid="button-sidebar-cta"
          >
            Upgrade Protocol
          </button>
        </aside>

        {/* ── Main content ─────────────────────────────────────── */}
        <main className="flex-grow px-5 md:px-[64px] py-[32px]">

        {/* Hero header */}
        <header style={{ marginBottom: 80, maxWidth: 896 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, backgroundColor: C.secondary, borderRadius: 9999, display: "inline-block", flexShrink: 0 }} />
            <span style={{ ...JETBRAINS, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: C.outline }}>
              Clinical Logistics Layer // 0.19
            </span>
          </div>
          <h2
            style={{ ...PLAYFAIR, fontSize: 48, fontWeight: 600, color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 16 }}
            data-testid="heading-settings"
          >
            ACCOUNT PREFERENCES // PROTOCOL SETTINGS
          </h2>
          <p style={{ ...INTER, fontSize: 18, fontWeight: 300, color: C.onSurfaceVariant, maxWidth: 672, lineHeight: 1.6 }}>
            Security and Communication Logistics. Control the transmission of data between the 19 DOGS laboratory and your primary observation unit.
          </p>
        </header>

        {/* Asymmetric 12-column grid */}
        <div className="grid grid-cols-12 gap-6">

          {/* ── Left column 7/12 ────────────────────────────── */}
          <div className="col-span-12 lg:col-span-7" style={{ display: "flex", flexDirection: "column", gap: 32 }}>

            {/* Notifications module */}
            <section
              style={{ backgroundColor: "#ffffff", padding: 32, border: `1px solid ${C.outlineVariant}`, position: "relative", overflow: "hidden" }}
            >
              {/* Background icon decoration */}
              <div style={{ position: "absolute", top: 0, right: 0, opacity: 0.05, pointerEvents: "none", lineHeight: 1 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 80 }}>notifications</span>
              </div>

              <SectionHeader label="NOTIFICATIONS" />

              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {/* Order Updates */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ maxWidth: "70%" }}>
                    <p style={{ ...JETBRAINS, fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 4 }}>ORDER UPDATES</p>
                    <p style={{ ...INTER, fontSize: 14, color: C.onSurfaceVariant }}>Get notified about your order status</p>
                  </div>
                  <ToggleSwitch
                    checked={orderUpdates}
                    onChange={setOrderUpdates}
                    testId="toggle-order-updates"
                  />
                </div>

                {/* Promotional Emails */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ maxWidth: "70%" }}>
                    <p style={{ ...JETBRAINS, fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 4 }}>PROMOTIONAL EMAILS</p>
                    <p style={{ ...INTER, fontSize: 14, color: C.onSurfaceVariant }}>Receive offers and discount codes</p>
                  </div>
                  <ToggleSwitch
                    checked={promoEmails}
                    onChange={setPromoEmails}
                    testId="toggle-promo-emails"
                  />
                </div>

                {/* Restock Alerts */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ maxWidth: "70%" }}>
                    <p style={{ ...JETBRAINS, fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 4 }}>RESTOCK ALERTS</p>
                    <p style={{ ...INTER, fontSize: 14, color: C.onSurfaceVariant }}>Get notified when wishlist items are back in stock</p>
                  </div>
                  <ToggleSwitch
                    checked={restockAlerts}
                    onChange={setRestockAlerts}
                    testId="toggle-restock-alerts"
                  />
                </div>
              </div>
            </section>

            {/* Delivery Preferences (subscription users only) */}
            {user?.customerType === "subscription" && (
              <section style={{ backgroundColor: "#ffffff", padding: 32, border: `1px solid ${C.outlineVariant}` }}>
                <SectionHeader label="DELIVERY PREFERENCES" />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <p style={{ ...JETBRAINS, fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 4 }}>DELIVERY SCHEDULE</p>
                    <p style={{ ...INTER, fontSize: 14, color: C.onSurfaceVariant }}>
                      Subscription delivery frequency
                    </p>
                    {user.subscriptionStartDate && (
                      <p style={{ ...JETBRAINS, fontSize: 11, color: C.outline, marginTop: 8, textTransform: "uppercase" }}>
                        Active since: {new Date(user.subscriptionStartDate).toLocaleDateString()}
                        {user.subscriptionEndDate && ` · Until ${new Date(user.subscriptionEndDate).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                  <Select
                    value={deliverySchedule}
                    onValueChange={(v) => { setDeliverySchedule(v); schedMutation.mutate(v); }}
                    disabled={schedMutation.isPending}
                  >
                    <SelectTrigger
                      style={{ ...INTER, fontSize: 13, width: 160, borderRadius: 0, border: `1px solid ${C.outlineVariant}`, backgroundColor: C.surfaceContainerLow }}
                      data-testid="select-delivery-schedule"
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </section>
            )}

            {/* Privacy & Security module */}
            <section style={{ backgroundColor: "#ffffff", padding: 32, border: `1px solid ${C.outlineVariant}` }}>
              <SectionHeader label="PRIVACY & SECURITY" />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* 2FA */}
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, border: `1px dashed ${C.outlineVariant}`, flexWrap: "wrap", gap: 12 }}
                >
                  <div>
                    <p style={{ ...JETBRAINS, fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 4, textTransform: "uppercase" }}>
                      Two-Factor Authentication
                    </p>
                    <p style={{ ...INTER, fontSize: 14, color: C.onSurfaceVariant }}>Add an extra layer of security</p>
                  </div>
                  <span
                    style={{ ...JETBRAINS, fontSize: 10, letterSpacing: "0.15em", padding: "4px 12px", backgroundColor: C.surfaceContainer, color: C.outlineVariant, border: `1px solid ${C.outlineVariant}`, textTransform: "uppercase", whiteSpace: "nowrap" }}
                    data-testid="badge-2fa-coming-soon"
                  >
                    COMING SOON
                  </span>
                </div>

                {/* Login Activity */}
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, border: `1px dashed ${C.outlineVariant}`, flexWrap: "wrap", gap: 12 }}
                >
                  <div>
                    <p style={{ ...JETBRAINS, fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 4, textTransform: "uppercase" }}>
                      Login Activity
                    </p>
                    <p style={{ ...INTER, fontSize: 14, color: C.onSurfaceVariant }}>View your recent login history</p>
                  </div>
                  <span
                    style={{ ...JETBRAINS, fontSize: 10, letterSpacing: "0.15em", padding: "4px 12px", backgroundColor: C.surfaceContainer, color: C.outlineVariant, border: `1px solid ${C.outlineVariant}`, textTransform: "uppercase", whiteSpace: "nowrap" }}
                    data-testid="badge-activity-coming-soon"
                  >
                    COMING SOON
                  </span>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section
              style={{ backgroundColor: "#ffffff", padding: 32, border: `2px solid ${C.secondary}33`, position: "relative" }}
            >
              {/* Floating label */}
              <div style={{ position: "absolute", top: -1, left: 32, padding: "0 16px", backgroundColor: C.surface }}>
                <span style={{ ...JETBRAINS, fontSize: 10, color: C.secondary, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  Irreversible Actions
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ marginTop: 16 }}>
                {/* Sign Out */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <p style={{ ...JETBRAINS, fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 4, textTransform: "uppercase" }}>Sign Out</p>
                    <p style={{ ...INTER, fontSize: 12, color: C.onSurfaceVariant }}>Sign out from all devices for security</p>
                  </div>
                  <button
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    style={{ ...LABEL_CAPS, padding: "8px 24px", border: `1px solid ${C.primary}`, color: C.primary, background: "transparent", cursor: "pointer", transition: "all 0.15s", alignSelf: "flex-start", opacity: logoutMutation.isPending ? 0.6 : 1 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primary; (e.currentTarget as HTMLButtonElement).style.color = C.white; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = C.primary; }}
                    data-testid="button-logout"
                  >
                    {logoutMutation.isPending ? "SIGNING OUT..." : "Sign Out"}
                  </button>
                </div>

                {/* Delete Account */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <p style={{ ...JETBRAINS, fontSize: 13, fontWeight: 700, color: C.secondary, marginBottom: 4, textTransform: "uppercase" }}>Delete Account</p>
                    <p style={{ ...INTER, fontSize: 12, color: C.onSurfaceVariant }}>Permanently delete your account and data</p>
                  </div>
                  <button
                    disabled
                    style={{ ...LABEL_CAPS, padding: "8px 24px", backgroundColor: C.secondary, color: C.white, cursor: "not-allowed", opacity: 0.6, alignSelf: "flex-start" }}
                    data-testid="button-delete-account"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </section>

          </div>

          {/* ── Right column 5/12 ───────────────────────────── */}
          <div className="col-span-12 lg:col-span-5" style={{ display: "flex", flexDirection: "column", gap: 32 }}>

            {/* Payment Methods — hard paper shadow */}
            <section
              style={{
                backgroundColor: C.surface,
                padding: 32,
                border: `1px solid ${C.primary}`,
                boxShadow: `40px 40px 0px 0px rgba(1, 45, 29, 0.15)`,
                transition: "transform 0.5s",
                cursor: "default",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translate(4px, 4px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              <SectionHeader label="PAYMENT METHODS" />

              <div
                style={{
                  minHeight: 200,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  textAlign: "center", padding: 32,
                  backgroundColor: C.surfaceContainerLow,
                  border: `1px dotted ${C.outlineVariant}`,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: C.outlineVariant, marginBottom: 16, display: "block" }}>
                  credit_card_off
                </span>
                <p style={{ ...INTER, fontSize: 14, color: C.onSurfaceVariant, marginBottom: 24, lineHeight: 1.6 }}>
                  Manage your saved payment options.{" "}
                  <em style={{ opacity: 0.6 }}>No payment methods saved. Add a payment method during checkout for faster purchases.</em>
                </p>
                <button
                  style={{
                    ...LABEL_CAPS, fontSize: 11, padding: "12px 32px",
                    border: `1px solid ${C.secondary}`, color: C.secondary, background: "transparent",
                    borderRadius: 9999, cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.secondary; (e.currentTarget as HTMLButtonElement).style.color = C.white; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = C.secondary; }}
                  data-testid="button-add-payment"
                >
                  Add Payment Method
                </button>
              </div>
            </section>

            {/* Editorial collage */}
            <div style={{ position: "relative", paddingTop: 48 }} className="group">
              {/* Image container */}
              <div
                style={{
                  position: "relative", zIndex: 10,
                  width: "100%", aspectRatio: "4/5",
                  overflow: "hidden",
                  backgroundColor: C.primaryContainer,
                  border: `1px solid ${C.outlineVariant}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {/* Atmospheric decorative interior */}
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${C.primaryContainer} 0%, #02140e 50%, #030f09 100%)` }} />
                <div style={{ position: "absolute", inset: 0, opacity: 0.07, display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2, padding: 16 }}>
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} style={{ height: 1, backgroundColor: C.primaryFixed }} />
                  ))}
                </div>
                <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                  <p style={{ ...JETBRAINS, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: `${C.primaryFixed}60`, marginBottom: 16 }}>
                    EDITORIAL // BIO-SERIES
                  </p>
                  <p style={{ ...PLAYFAIR, fontSize: 28, fontWeight: 700, color: C.primaryFixed, fontStyle: "italic", lineHeight: 1.2 }}>
                    19 DOGS
                  </p>
                  <p style={{ ...JETBRAINS, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: `${C.primaryFixed}50`, marginTop: 12 }}>
                    Biological Wellness System
                  </p>
                </div>
              </div>

              {/* Text overlay card */}
              <div
                style={{
                  position: "absolute", bottom: -24, left: -24, zIndex: 20,
                  backgroundColor: C.primary, padding: 24, maxWidth: 240,
                }}
              >
                <h4 style={{ ...PLAYFAIR, fontSize: 22, fontWeight: 600, color: C.white, lineHeight: 1.2, marginBottom: 8, letterSpacing: "-0.02em" }}>
                  Precision in Preference.
                </h4>
                <p style={{ ...JETBRAINS, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.primaryFixed, lineHeight: 1.6 }}>
                  Your interface settings dictate the biological data sync interval. Optimize for peak awareness.
                </p>
              </div>
            </div>

            {/* Technical footer decoration */}
            <div style={{ paddingTop: 96, opacity: 0.3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
                <div style={{ height: 1, flexGrow: 1, backgroundColor: C.outlineVariant }} />
                <span style={{ ...JETBRAINS, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  ENCRYPTED PROTOCOL 204.A
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                <div style={{ height: 4, backgroundColor: C.primary }} />
                <div style={{ height: 4, backgroundColor: C.outline }} />
                <div style={{ height: 4, backgroundColor: C.secondary }} />
                <div style={{ height: 4, backgroundColor: C.outlineVariant }} />
              </div>
            </div>

          </div>
        </div>
        </main>

      </div>{/* ── end flex layout ── */}

    </div>
  );
}
