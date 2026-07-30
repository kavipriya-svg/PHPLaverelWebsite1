import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { HomeEditorialHeader, HomeEditorialFooter } from "@/components/store/HomeEditorialLayout";
import { mergeHomepageSettings, DEFAULT_HOMEPAGE_SETTINGS } from "@/lib/homepageDefaults";
import type { HomepageSettings } from "@/lib/homepageDefaults";
import type { Address } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
  outline:                "#717973",
  outlineVariant:         "#c1c8c2",
  onSurface:              "#1a1c1a",
  onSurfaceVariant:       "#414844",
  primaryFixed:           "#c0edd4",
  error:                  "#ba1a1a",
  white:                  "#ffffff",
};

const PLAYFAIR  = { fontFamily: "'Playfair Display', Georgia, serif" } as const;
const INTER     = { fontFamily: "Inter, sans-serif" } as const;
const JETBRAINS = { fontFamily: "'JetBrains Mono', 'Courier New', monospace" } as const;
const LABEL_CAPS = { ...INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" as const };

// ─── Sidebar nav ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "biotech",     label: "Bio-Profile",      href: "/account" },
  { icon: "history_edu", label: "Order History",    href: "/account/orders" },
  { icon: "bookmark",    label: "Saved Specimens",  href: "/wishlist" },
  { icon: "location_on", label: "Bio. Coordinates", href: "/account/addresses" },
  { icon: "settings",    label: "Preferences",      href: "/account/settings" },
];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi",
  "Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

// ─── Form schema ──────────────────────────────────────────────────
const addressSchema = z.object({
  firstName:  z.string().min(1, "Required"),
  lastName:   z.string().min(1, "Required"),
  company:    z.string().optional(),
  address1:   z.string().min(1, "Required"),
  address2:   z.string().optional(),
  city:       z.string().min(1, "Required"),
  state:      z.string().optional(),
  postalCode: z.string().min(1, "Required"),
  country:    z.string().min(1, "Required"),
  phone:      z.string().optional(),
  type:       z.enum(["shipping", "billing"]).default("shipping"),
});
type AddressForm = z.infer<typeof addressSchema>;

// ─── Live timestamp ───────────────────────────────────────────────
function useLiveTimestamp() {
  const [ts, setTs] = useState("");
  useEffect(() => {
    const tick = () => setTs(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return ts;
}

// ─── Address Form Dialog ───────────────────────────────────────────
function AddressDialog({
  open, onClose, editing,
}: { open: boolean; onClose: () => void; editing: Address | null }) {
  const { toast } = useToast();

  const form = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: "", lastName: "", company: "", address1: "", address2: "",
      city: "", state: "", postalCode: "", country: "India", phone: "", type: "shipping",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(editing ? {
        firstName:  editing.firstName,
        lastName:   editing.lastName,
        company:    editing.company   || "",
        address1:   editing.address1,
        address2:   editing.address2  || "",
        city:       editing.city,
        state:      editing.state     || "",
        postalCode: editing.postalCode,
        country:    editing.country,
        phone:      editing.phone     || "",
        type:       (editing.type as "shipping" | "billing") || "shipping",
      } : {
        firstName: "", lastName: "", company: "", address1: "", address2: "",
        city: "", state: "", postalCode: "", country: "India", phone: "", type: "shipping",
      });
    }
  }, [editing, open]);

  const create = useMutation({
    mutationFn: (data: AddressForm) => apiRequest("POST", "/api/addresses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Coordinate registered" });
      onClose();
    },
    onError: () => toast({ title: "Failed to register coordinate", variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: (data: AddressForm) => apiRequest("PUT", `/api/addresses/${editing!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Coordinate updated" });
      onClose();
    },
    onError: () => toast({ title: "Failed to update coordinate", variant: "destructive" }),
  });

  const isPending = create.isPending || update.isPending;
  const onSubmit  = (data: AddressForm) => editing ? update.mutate(data) : create.mutate(data);

  const labelStyle: React.CSSProperties = { ...LABEL_CAPS, fontSize: 10, color: C.onSurfaceVariant, marginBottom: 6, display: "block" };
  const inputStyle: React.CSSProperties = { ...INTER, fontSize: 14, backgroundColor: C.surface, border: `1px solid ${C.outlineVariant}`, borderRadius: 0 };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: C.surface, borderRadius: 0 }}
      >
        <DialogHeader>
          <DialogTitle>
            <span style={{ ...JETBRAINS, fontSize: 10, color: C.secondary, display: "block", marginBottom: 6, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 400 }}>
              {editing ? "MODIFY // COORDINATE" : "REGISTER // NEW COORDINATE"}
            </span>
            <span style={{ ...PLAYFAIR, fontSize: 24, fontWeight: 700, color: C.primary, fontStyle: "italic", display: "block" }}>
              {editing ? "Edit Biological Coordinate" : "New Biological Coordinate"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div style={{ height: 2, background: `linear-gradient(90deg, ${C.secondaryContainer} 0%, transparent 100%)`, margin: "8px 0 24px" }} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Row: name */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel style={labelStyle}>First Name</FormLabel>
                  <FormControl><Input {...field} style={inputStyle} data-testid="input-first-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel style={labelStyle}>Last Name</FormLabel>
                  <FormControl><Input {...field} style={inputStyle} data-testid="input-last-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Row: company + phone */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="company" render={({ field }) => (
                <FormItem>
                  <FormLabel style={labelStyle}>Company / Unit</FormLabel>
                  <FormControl><Input {...field} placeholder="Optional" style={inputStyle} data-testid="input-company" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel style={labelStyle}>Contact Relay</FormLabel>
                  <FormControl><Input {...field} placeholder="+91 ..." style={inputStyle} data-testid="input-phone" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="address1" render={({ field }) => (
              <FormItem>
                <FormLabel style={labelStyle}>Address Line 1</FormLabel>
                <FormControl><Input {...field} style={inputStyle} data-testid="input-address1" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="address2" render={({ field }) => (
              <FormItem>
                <FormLabel style={labelStyle}>Address Line 2</FormLabel>
                <FormControl><Input {...field} placeholder="Apt / Floor / Landmark" style={inputStyle} data-testid="input-address2" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel style={labelStyle}>City</FormLabel>
                  <FormControl><Input {...field} style={inputStyle} data-testid="input-city" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem>
                  <FormLabel style={labelStyle}>State / Region</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger style={{ ...inputStyle, borderRadius: 0 }} data-testid="select-state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INDIAN_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="postalCode" render={({ field }) => (
                <FormItem>
                  <FormLabel style={labelStyle}>Postal Code</FormLabel>
                  <FormControl><Input {...field} style={inputStyle} data-testid="input-postal-code" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem>
                  <FormLabel style={labelStyle}>Country</FormLabel>
                  <FormControl><Input {...field} style={inputStyle} data-testid="input-country" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel style={labelStyle}>Coordinate Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger style={{ ...inputStyle, borderRadius: 0 }} data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="shipping">Shipping Coordinate</SelectItem>
                    <SelectItem value="billing">Billing Coordinate</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                style={{ ...LABEL_CAPS, padding: "12px 24px", border: `1px solid ${C.outlineVariant}`, color: C.onSurfaceVariant, background: "transparent" }}
                data-testid="button-cancel"
              >
                ABORT
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{ ...LABEL_CAPS, padding: "12px 32px", backgroundColor: C.primary, color: C.white, opacity: isPending ? 0.7 : 1 }}
                data-testid="button-save"
              >
                {isPending ? "PROCESSING..." : editing ? "UPDATE COORDINATE" : "REGISTER COORDINATE"}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Address Card ─────────────────────────────────────────────────
function AddressCard({
  address, onEdit, onDelete, onSetDefault,
}: {
  address: Address;
  onEdit: (a: Address) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  return (
    <div
      style={{
        border: `1px solid ${address.isDefault ? C.secondary : C.outlineVariant}`,
        backgroundColor: C.surface,
        boxShadow: address.isDefault ? `4px 4px 0px 0px ${C.secondaryContainer}50` : "none",
        padding: "28px",
        position: "relative",
        transition: "box-shadow 0.2s ease",
      }}
      data-testid={`card-address-${address.id}`}
    >
      {/* Top row: badges + actions */}
      <div className="flex items-start justify-between mb-5 gap-2 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            style={{ ...JETBRAINS, fontSize: 9, letterSpacing: "0.12em", padding: "3px 10px",
              backgroundColor: address.type === "billing" ? C.primaryContainer : C.primary,
              color: C.white, textTransform: "uppercase" }}
            data-testid={`badge-type-${address.id}`}
          >
            {address.type === "billing" ? "BILLING_COORD" : "SHIPPING_COORD"}
          </span>
          {address.isDefault && (
            <span
              style={{ ...JETBRAINS, fontSize: 9, letterSpacing: "0.12em", padding: "3px 10px",
                backgroundColor: C.secondaryContainer, color: C.primary, textTransform: "uppercase" }}
              data-testid={`badge-default-${address.id}`}
            >
              DEFAULT
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!address.isDefault && (
            <button
              onClick={() => onSetDefault(address.id)}
              style={{ ...JETBRAINS, fontSize: 9, letterSpacing: "0.1em", color: C.onSurfaceVariant,
                border: `1px solid ${C.outlineVariant}`, padding: "4px 10px", background: "transparent",
                textTransform: "uppercase" }}
              data-testid={`button-set-default-${address.id}`}
            >
              SET DEFAULT
            </button>
          )}
          <button
            onClick={() => onEdit(address)}
            className="material-symbols-outlined transition-colors"
            style={{ fontSize: 20, color: C.onSurfaceVariant }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.onSurfaceVariant)}
            title="Edit coordinate"
            data-testid={`button-edit-${address.id}`}
          >
            edit
          </button>
          <button
            onClick={() => onDelete(address.id)}
            className="material-symbols-outlined transition-colors"
            style={{ fontSize: 20, color: C.onSurfaceVariant }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.error)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.onSurfaceVariant)}
            title="Remove coordinate"
            data-testid={`button-delete-${address.id}`}
          >
            delete
          </button>
        </div>
      </div>

      {/* Protocol line */}
      <div style={{ height: 1, background: `linear-gradient(90deg, ${address.isDefault ? C.secondaryContainer : C.outlineVariant}80 0%, transparent 70%)`, marginBottom: 20 }} />

      {/* Address body */}
      <p style={{ ...INTER, fontSize: 15, fontWeight: 600, color: C.onSurface, marginBottom: 6 }}
         data-testid={`text-name-${address.id}`}>
        {address.firstName} {address.lastName}
        {address.company && (
          <span style={{ fontWeight: 400, color: C.onSurfaceVariant }}> — {address.company}</span>
        )}
      </p>
      <p style={{ ...JETBRAINS, fontSize: 12, color: C.onSurfaceVariant, lineHeight: 1.8 }}
         data-testid={`text-address-${address.id}`}>
        {address.address1}
        {address.address2 && `, ${address.address2}`}<br />
        {address.city}{address.state && `, ${address.state}`} — {address.postalCode}<br />
        {address.country}
      </p>
      {address.phone && (
        <p style={{ ...JETBRAINS, fontSize: 11, color: C.outline, marginTop: 8 }}
           data-testid={`text-phone-${address.id}`}>
          RELAY: {address.phone}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function Addresses() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast }      = useToast();
  const [, setLocation] = useLocation();
  const timestamp       = useLiveTimestamp();
  const scrollBgRef     = useRef<HTMLDivElement>(null);

  const [dialogOpen,     setDialogOpen]     = useState(false);
  const [editing,        setEditing]        = useState<Address | null>(null);
  const [deleteConfirm,  setDeleteConfirm]  = useState<string | null>(null);

  // Parallax bg
  useEffect(() => {
    const handler = () => {
      if (scrollBgRef.current)
        scrollBgRef.current.style.transform = `translateY(${window.scrollY * -0.1}px)`;
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Auth guard
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

  // Addresses
  const { data, isLoading } = useQuery<{ addresses: Address[] }>({
    queryKey: ["/api/addresses"],
    enabled: isAuthenticated,
  });
  const addresses = data?.addresses || [];

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Coordinate removed" });
      setDeleteConfirm(null);
    },
    onError: () => toast({ title: "Failed to remove coordinate", variant: "destructive" }),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/addresses/${id}/default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Default coordinate updated" });
    },
    onError: () => toast({ title: "Failed to update default", variant: "destructive" }),
  });

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Member";
  const initials    = (user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase();

  // Loading state
  if (authLoading) {
    return (
      <div style={{ backgroundColor: C.surface, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: C.primary }} />
          <p style={{ ...JETBRAINS, fontSize: 11, letterSpacing: "0.2em", color: C.onSurfaceVariant, textTransform: "uppercase" }}>
            Loading Coordinates...
          </p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="overflow-x-hidden" style={{ backgroundColor: C.surface, color: C.onSurface }}>
      {/* ── Global editorial header ───────────────────────────── */}
      <HomeEditorialHeader nav={s.nav} />

      {/* ── Decorative floating elements ─────────────────────── */}
      <div
        className="fixed pointer-events-none -z-10 rotate-12"
        style={{ top: "20%", right: "-10%", width: "40%", height: "60%", border: `0.5px solid ${C.outlineVariant}30` }}
      />
      <div
        ref={scrollBgRef}
        className="fixed pointer-events-none select-none -z-10"
        style={{ bottom: "10%", left: "5%", ...JETBRAINS, fontSize: 180, color: `${C.primary}05`, lineHeight: 1 }}
      >
        BC-001
      </div>

      <div style={{ display: "flex", paddingTop: 104, minHeight: "100vh" }}>

        {/* ── Sidebar ─────────────────────────────────────────── */}
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
          {/* Brand tag */}
          <div className="mb-10">
            <h1 style={{ ...PLAYFAIR, fontSize: 22, fontWeight: 700, color: C.primary }}>
              CANINE BIOMETRIC ID
            </h1>
            <p style={{ ...JETBRAINS, fontSize: 10, letterSpacing: "0.15em", color: C.onSurfaceVariant, opacity: 0.6, marginTop: 4, textTransform: "uppercase" }}>
              V.01.2024 REV
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
              <p style={{ ...JETBRAINS, fontSize: 10, color: C.onSurfaceVariant }}>Verified Entity</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1 flex-grow">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === "/account/addresses";
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
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = C.surfaceContainerHigh;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    }}
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
            Request Lab Access
          </button>
        </aside>

        {/* ── Main content ────────────────────────────────────── */}
        <main className="flex-grow px-5 md:px-[64px] py-[32px]">

          {/* Editorial header */}
          <header
            className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16 border-b pb-8"
            style={{ borderColor: C.outlineVariant }}
          >
            <div style={{ maxWidth: 640 }}>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <span
                  style={{ ...JETBRAINS, fontSize: 10, letterSpacing: "0.1em", padding: "3px 10px",
                    backgroundColor: C.primary, color: C.white, textTransform: "uppercase" }}
                  data-testid="badge-secure"
                >
                  STATUS: SECURE
                </span>
                <span
                  style={{ ...JETBRAINS, fontSize: 10, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em" }}
                  data-testid="text-timestamp"
                >
                  SECURE_SYNC: {timestamp}
                </span>
              </div>
              <h2
                className="leading-none uppercase tracking-tighter italic"
                style={{ ...PLAYFAIR, fontSize: "clamp(28px,4vw,52px)", color: C.primary }}
                data-testid="heading-title"
              >
                Biological Coordinates
              </h2>
              <h3
                className="leading-none uppercase tracking-tighter mt-2"
                style={{ ...PLAYFAIR, fontSize: "clamp(18px,2.5vw,32px)", color: `${C.onSurfaceVariant}60` }}
                data-testid="heading-subtitle"
              >
                // Delivery Nodes
              </h3>
            </div>

            {/* Progress meter */}
            <div className="text-right hidden md:block">
              <p style={{ ...LABEL_CAPS, fontSize: 10, color: C.primary, marginBottom: 6 }}>COORDINATES LOGGED</p>
              <div style={{ width: 192, height: 4, backgroundColor: C.surfaceContainerHighest }}>
                <div
                  style={{
                    width: addresses.length > 0 ? `${Math.min((addresses.length / 5) * 100, 100)}%` : "2%",
                    height: "100%",
                    backgroundColor: C.secondaryContainer,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <p style={{ ...JETBRAINS, fontSize: 10, color: C.onSurfaceVariant, marginTop: 8, textTransform: "uppercase" }}>
                {addresses.length} / 5 REGISTERED
              </p>
            </div>
          </header>

          {/* Action bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <p style={{ ...JETBRAINS, fontSize: 11, letterSpacing: "0.1em", color: C.secondary, textTransform: "uppercase", marginBottom: 4 }}>
                Dossier Access // Internal Use Only
              </p>
              <p style={{ ...INTER, fontSize: 14, color: C.onSurfaceVariant }}>
                Registered receiving locations for delicate biological transports.
              </p>
            </div>
            <button
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              className="flex items-center gap-2 transition-opacity hover:opacity-80 flex-shrink-0"
              style={{ ...LABEL_CAPS, backgroundColor: C.primary, color: C.white, padding: "12px 24px" }}
              data-testid="button-add-address"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_location</span>
              REGISTER COORDINATE
            </button>
          </div>

          {/* Content: loading / empty / grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mb-4" style={{ borderColor: C.primary }} />
              <p style={{ ...JETBRAINS, fontSize: 11, letterSpacing: "0.2em", color: C.onSurfaceVariant, textTransform: "uppercase" }}>
                SCANNING COORDINATES...
              </p>
            </div>
          ) : addresses.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-24 text-center"
              style={{ border: `1px dashed ${C.outlineVariant}`, backgroundColor: `${C.surfaceContainerLow}80` }}
              data-testid="empty-state"
            >
              <span className="material-symbols-outlined mb-6" style={{ fontSize: 56, color: C.outlineVariant }}>
                location_off
              </span>
              <p style={{ ...PLAYFAIR, fontSize: 22, fontWeight: 700, color: C.primary, marginBottom: 8, fontStyle: "italic" }}>
                No Coordinates Registered
              </p>
              <p style={{ ...INTER, fontSize: 14, color: C.onSurfaceVariant, maxWidth: 360, marginBottom: 28, lineHeight: 1.6 }}>
                There are no registered biological coordinates in the current dossier. Register a delivery node to begin receiving specimens.
              </p>
              <button
                onClick={() => { setEditing(null); setDialogOpen(true); }}
                style={{ ...LABEL_CAPS, backgroundColor: C.primary, color: C.white, padding: "12px 28px" }}
                data-testid="button-empty-add"
              >
                Register First Coordinate
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="addresses-grid">
              {addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  onEdit={(a) => { setEditing(a); setDialogOpen(true); }}
                  onDelete={(id) => setDeleteConfirm(id)}
                  onSetDefault={(id) => setDefaultMutation.mutate(id)}
                />
              ))}

              {/* Add new tile */}
              <button
                onClick={() => { setEditing(null); setDialogOpen(true); }}
                className="flex flex-col items-center justify-center gap-4 min-h-[180px] transition-all"
                style={{ border: `1px dashed ${C.outlineVariant}`, color: C.onSurfaceVariant }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = C.surfaceContainerLow; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                data-testid="button-add-tile"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: C.outlineVariant }}>
                  add_location_alt
                </span>
                <span style={{ ...LABEL_CAPS, fontSize: 11 }}>Register New Coordinate</span>
              </button>
            </div>
          )}

          {/* Technical footer note */}
          <div
            className="mt-16 pt-8 italic text-xs"
            style={{ borderTop: `1px solid ${C.outlineVariant}30`, color: C.onSurfaceVariant, ...INTER, lineHeight: 1.6 }}
          >
            Coordinate data managed by 19 DOGS Secure Encryption Systems. All location data is strictly confidential and encrypted at rest using AES-256 standards for biological compliance.
          </div>
        </main>
      </div>

      {/* ── Global editorial footer ───────────────────────────── */}
      <HomeEditorialFooter footer={s.footer} />

      {/* ── Add / Edit Dialog — only mounted when open ────────── */}
      {dialogOpen && (
        <AddressDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditing(null); }}
          editing={editing}
        />
      )}

      {/* ── Delete Confirm — only mounted when a target is set ── */}
      {deleteConfirm && (
        <Dialog open onOpenChange={(v) => { if (!v) setDeleteConfirm(null); }}>
          <DialogContent style={{ backgroundColor: C.surface, borderRadius: 0, maxWidth: 420 }}>
            <DialogHeader>
              <DialogTitle>
                <span style={{ ...PLAYFAIR, fontSize: 22, fontWeight: 700, color: C.primary, display: "block" }}>
                  Remove Coordinate
                </span>
              </DialogTitle>
            </DialogHeader>
            <div style={{ height: 2, background: `linear-gradient(90deg, ${C.error}60 0%, transparent 100%)`, margin: "8px 0 20px" }} />
            <p style={{ ...INTER, fontSize: 14, color: C.onSurfaceVariant, marginBottom: 28, lineHeight: 1.6 }}>
              This will permanently remove the coordinate from your dossier. This action cannot be reversed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ ...LABEL_CAPS, padding: "10px 20px", border: `1px solid ${C.outlineVariant}`, color: C.onSurfaceVariant, background: "transparent" }}
                data-testid="button-delete-cancel"
              >
                ABORT
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                style={{ ...LABEL_CAPS, padding: "10px 24px", backgroundColor: C.error, color: C.white, opacity: deleteMutation.isPending ? 0.7 : 1 }}
                data-testid="button-delete-confirm"
              >
                {deleteMutation.isPending ? "REMOVING..." : "CONFIRM REMOVAL"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
