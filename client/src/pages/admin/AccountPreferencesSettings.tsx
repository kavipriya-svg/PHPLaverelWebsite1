import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ─── Type ─────────────────────────────────────────────────────────────────────
interface ToggleItem { label: string; description: string }

interface AccountPreferencesSettings {
  sidebar: { title: string; version: string; userStatus: string; ctaText: string };
  hero: { tagline: string; heading: string; subheading: string };
  notifications: {
    sectionLabel: string;
    orderUpdates: ToggleItem;
    promoEmails: ToggleItem;
    restockAlerts: ToggleItem;
  };
  delivery: { sectionLabel: string; scheduleLabel: string; scheduleDescription: string };
  privacy: {
    sectionLabel: string;
    twoFa: { title: string; description: string; badge: string };
    loginActivity: { title: string; description: string; badge: string };
  };
  dangerZone: {
    floatingLabel: string;
    signOut: { title: string; description: string; buttonText: string; pendingText: string };
    deleteAccount: { title: string; description: string; buttonText: string };
  };
  payment: {
    sectionLabel: string;
    emptyStateText: string;
    emptyStateNote: string;
    addButtonText: string;
  };
  editorial: {
    tagline: string;
    brandText: string;
    subtitle: string;
    overlayTitle: string;
    overlayBody: string;
    imageUrl: string;
    protocolText: string;
  };
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULTS: AccountPreferencesSettings = {
  sidebar: {
    title: "Account",
    version: "Protocol // v0.19",
    userStatus: "Active Member",
    ctaText: "Upgrade Protocol",
  },
  hero: {
    tagline: "Clinical Logistics Layer // 0.19",
    heading: "ACCOUNT PREFERENCES // PROTOCOL SETTINGS",
    subheading:
      "Security and Communication Logistics. Control the transmission of data between the 19 DOGS laboratory and your primary observation unit.",
  },
  notifications: {
    sectionLabel: "NOTIFICATIONS",
    orderUpdates: { label: "ORDER UPDATES", description: "Get notified about your order status" },
    promoEmails: { label: "PROMOTIONAL EMAILS", description: "Receive offers and discount codes" },
    restockAlerts: { label: "RESTOCK ALERTS", description: "Get notified when wishlist items are back in stock" },
  },
  delivery: {
    sectionLabel: "DELIVERY PREFERENCES",
    scheduleLabel: "DELIVERY SCHEDULE",
    scheduleDescription: "Subscription delivery frequency",
  },
  privacy: {
    sectionLabel: "PRIVACY & SECURITY",
    twoFa: { title: "Two-Factor Authentication", description: "Add an extra layer of security", badge: "COMING SOON" },
    loginActivity: { title: "Login Activity", description: "View your recent login history", badge: "COMING SOON" },
  },
  dangerZone: {
    floatingLabel: "Irreversible Actions",
    signOut: {
      title: "Sign Out",
      description: "Sign out from all devices for security",
      buttonText: "Sign Out",
      pendingText: "SIGNING OUT...",
    },
    deleteAccount: {
      title: "Delete Account",
      description: "Permanently delete your account and data",
      buttonText: "Delete Account",
    },
  },
  payment: {
    sectionLabel: "PAYMENT METHODS",
    emptyStateText: "Manage your saved payment options.",
    emptyStateNote:
      "No payment methods saved. Add a payment method during checkout for faster purchases.",
    addButtonText: "Add Payment Method",
  },
  editorial: {
    tagline: "EDITORIAL // BIO-SERIES",
    brandText: "19 DOGS",
    subtitle: "Biological Wellness System",
    overlayTitle: "Precision in Preference.",
    overlayBody:
      "Your interface settings dictate the biological data sync interval. Optimize for peak awareness.",
    imageUrl: "",
    protocolText: "ENCRYPTED PROTOCOL 204.A",
  },
};

function merge(saved: Partial<AccountPreferencesSettings>): AccountPreferencesSettings {
  return {
    sidebar: { ...DEFAULTS.sidebar, ...saved.sidebar },
    hero: { ...DEFAULTS.hero, ...saved.hero },
    notifications: {
      ...DEFAULTS.notifications,
      ...saved.notifications,
      orderUpdates: { ...DEFAULTS.notifications.orderUpdates, ...saved.notifications?.orderUpdates },
      promoEmails: { ...DEFAULTS.notifications.promoEmails, ...saved.notifications?.promoEmails },
      restockAlerts: { ...DEFAULTS.notifications.restockAlerts, ...saved.notifications?.restockAlerts },
    },
    delivery: { ...DEFAULTS.delivery, ...saved.delivery },
    privacy: {
      ...DEFAULTS.privacy,
      ...saved.privacy,
      twoFa: { ...DEFAULTS.privacy.twoFa, ...saved.privacy?.twoFa },
      loginActivity: { ...DEFAULTS.privacy.loginActivity, ...saved.privacy?.loginActivity },
    },
    dangerZone: {
      ...DEFAULTS.dangerZone,
      ...saved.dangerZone,
      signOut: { ...DEFAULTS.dangerZone.signOut, ...saved.dangerZone?.signOut },
      deleteAccount: { ...DEFAULTS.dangerZone.deleteAccount, ...saved.dangerZone?.deleteAccount },
    },
    payment: { ...DEFAULTS.payment, ...saved.payment },
    editorial: { ...DEFAULTS.editorial, ...saved.editorial },
  };
}

// ─── Reusable field components ─────────────────────────────────────────────────
function Field({
  label, value, onChange, multiline = false, placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="resize-none text-sm"
          rows={3}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-sm"
        />
      )}
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AccountPreferencesSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState<AccountPreferencesSettings>(DEFAULTS);

  const { data, isLoading } = useQuery<{ settings: Partial<AccountPreferencesSettings> }>({
    queryKey: ["/api/settings/account-preferences"],
  });

  useEffect(() => {
    if (data?.settings) setForm(merge(data.settings));
  }, [data]);

  const mutation = useMutation({
    mutationFn: (body: AccountPreferencesSettings) =>
      apiRequest("PUT", "/api/settings/account-preferences", body).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/account-preferences"] });
      toast({ title: "Preferences settings saved" });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  // typed setter helpers
  const set = <K extends keyof AccountPreferencesSettings>(
    section: K,
    patch: Partial<AccountPreferencesSettings[K]>
  ) => setForm((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));

  const setNested = <
    K extends keyof AccountPreferencesSettings,
    NK extends keyof AccountPreferencesSettings[K]
  >(
    section: K, nested: NK,
    patch: Partial<AccountPreferencesSettings[K][NK]>
  ) =>
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nested]: { ...(prev[section][nested] as object), ...patch },
      },
    }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Preferences Page</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control all text, labels and content on the <code className="text-xs bg-muted px-1 py-0.5 rounded">/account/settings</code> customer page.
          </p>
        </div>
        <Button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          data-testid="button-save-account-preferences"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Separator />

      <Tabs defaultValue="sidebar">
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="sidebar">Sidebar</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="editorial">Editorial</TabsTrigger>
        </TabsList>

        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <TabsContent value="sidebar" className="space-y-4 mt-4">
          <SectionCard title="Sidebar Panel" description="Left navigation sidebar on the account settings page.">
            <Field label="Title" value={form.sidebar.title} onChange={(v) => set("sidebar", { title: v })} />
            <Field label="Version / tagline" value={form.sidebar.version} onChange={(v) => set("sidebar", { version: v })} />
            <Field label="User status badge" value={form.sidebar.userStatus} onChange={(v) => set("sidebar", { userStatus: v })} />
            <Field label="CTA button text" value={form.sidebar.ctaText} onChange={(v) => set("sidebar", { ctaText: v })} />
          </SectionCard>
        </TabsContent>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <TabsContent value="hero" className="space-y-4 mt-4">
          <SectionCard title="Hero Header" description="The large header area at the top of the main content.">
            <Field label="Tagline (small text above heading)" value={form.hero.tagline} onChange={(v) => set("hero", { tagline: v })} />
            <Field label="Main heading" value={form.hero.heading} onChange={(v) => set("hero", { heading: v })} />
            <Field label="Subheading / body copy" value={form.hero.subheading} onChange={(v) => set("hero", { subheading: v })} multiline />
          </SectionCard>
        </TabsContent>

        {/* ── NOTIFICATIONS ─────────────────────────────────────────────── */}
        <TabsContent value="notifications" className="space-y-4 mt-4">
          <SectionCard title="Section Header">
            <Field label="Section label" value={form.notifications.sectionLabel} onChange={(v) => set("notifications", { sectionLabel: v })} />
          </SectionCard>
          <SectionCard title="Order Updates Toggle">
            <Field label="Label" value={form.notifications.orderUpdates.label} onChange={(v) => setNested("notifications", "orderUpdates", { label: v })} />
            <Field label="Description" value={form.notifications.orderUpdates.description} onChange={(v) => setNested("notifications", "orderUpdates", { description: v })} />
          </SectionCard>
          <SectionCard title="Promotional Emails Toggle">
            <Field label="Label" value={form.notifications.promoEmails.label} onChange={(v) => setNested("notifications", "promoEmails", { label: v })} />
            <Field label="Description" value={form.notifications.promoEmails.description} onChange={(v) => setNested("notifications", "promoEmails", { description: v })} />
          </SectionCard>
          <SectionCard title="Restock Alerts Toggle">
            <Field label="Label" value={form.notifications.restockAlerts.label} onChange={(v) => setNested("notifications", "restockAlerts", { label: v })} />
            <Field label="Description" value={form.notifications.restockAlerts.description} onChange={(v) => setNested("notifications", "restockAlerts", { description: v })} />
          </SectionCard>
        </TabsContent>

        {/* ── DELIVERY ──────────────────────────────────────────────────── */}
        <TabsContent value="delivery" className="space-y-4 mt-4">
          <SectionCard title="Delivery Preferences Section" description="Only shown to subscription customers.">
            <Field label="Section label" value={form.delivery.sectionLabel} onChange={(v) => set("delivery", { sectionLabel: v })} />
            <Field label="Schedule label" value={form.delivery.scheduleLabel} onChange={(v) => set("delivery", { scheduleLabel: v })} />
            <Field label="Schedule description" value={form.delivery.scheduleDescription} onChange={(v) => set("delivery", { scheduleDescription: v })} />
          </SectionCard>
        </TabsContent>

        {/* ── PRIVACY ───────────────────────────────────────────────────── */}
        <TabsContent value="privacy" className="space-y-4 mt-4">
          <SectionCard title="Section Header">
            <Field label="Section label" value={form.privacy.sectionLabel} onChange={(v) => set("privacy", { sectionLabel: v })} />
          </SectionCard>
          <SectionCard title="Two-Factor Authentication Row">
            <Field label="Title" value={form.privacy.twoFa.title} onChange={(v) => setNested("privacy", "twoFa", { title: v })} />
            <Field label="Description" value={form.privacy.twoFa.description} onChange={(v) => setNested("privacy", "twoFa", { description: v })} />
            <Field label="Badge text" value={form.privacy.twoFa.badge} onChange={(v) => setNested("privacy", "twoFa", { badge: v })} />
          </SectionCard>
          <SectionCard title="Login Activity Row">
            <Field label="Title" value={form.privacy.loginActivity.title} onChange={(v) => setNested("privacy", "loginActivity", { title: v })} />
            <Field label="Description" value={form.privacy.loginActivity.description} onChange={(v) => setNested("privacy", "loginActivity", { description: v })} />
            <Field label="Badge text" value={form.privacy.loginActivity.badge} onChange={(v) => setNested("privacy", "loginActivity", { badge: v })} />
          </SectionCard>
        </TabsContent>

        {/* ── DANGER ZONE ───────────────────────────────────────────────── */}
        <TabsContent value="danger" className="space-y-4 mt-4">
          <SectionCard title="Section Floating Label">
            <Field label="Floating label" value={form.dangerZone.floatingLabel} onChange={(v) => set("dangerZone", { floatingLabel: v })} />
          </SectionCard>
          <SectionCard title="Sign Out">
            <Field label="Title" value={form.dangerZone.signOut.title} onChange={(v) => setNested("dangerZone", "signOut", { title: v })} />
            <Field label="Description" value={form.dangerZone.signOut.description} onChange={(v) => setNested("dangerZone", "signOut", { description: v })} />
            <Field label="Button text" value={form.dangerZone.signOut.buttonText} onChange={(v) => setNested("dangerZone", "signOut", { buttonText: v })} />
            <Field label="Button pending text" value={form.dangerZone.signOut.pendingText} onChange={(v) => setNested("dangerZone", "signOut", { pendingText: v })} />
          </SectionCard>
          <SectionCard title="Delete Account">
            <Field label="Title" value={form.dangerZone.deleteAccount.title} onChange={(v) => setNested("dangerZone", "deleteAccount", { title: v })} />
            <Field label="Description" value={form.dangerZone.deleteAccount.description} onChange={(v) => setNested("dangerZone", "deleteAccount", { description: v })} />
            <Field label="Button text" value={form.dangerZone.deleteAccount.buttonText} onChange={(v) => setNested("dangerZone", "deleteAccount", { buttonText: v })} />
          </SectionCard>
        </TabsContent>

        {/* ── PAYMENT ───────────────────────────────────────────────────── */}
        <TabsContent value="payment" className="space-y-4 mt-4">
          <SectionCard title="Payment Methods Section">
            <Field label="Section label" value={form.payment.sectionLabel} onChange={(v) => set("payment", { sectionLabel: v })} />
            <Field label="Empty state text" value={form.payment.emptyStateText} onChange={(v) => set("payment", { emptyStateText: v })} />
            <Field label="Empty state note (italic)" value={form.payment.emptyStateNote} onChange={(v) => set("payment", { emptyStateNote: v })} multiline />
            <Field label="Add button text" value={form.payment.addButtonText} onChange={(v) => set("payment", { addButtonText: v })} />
          </SectionCard>
        </TabsContent>

        {/* ── EDITORIAL ─────────────────────────────────────────────────── */}
        <TabsContent value="editorial" className="space-y-4 mt-4">
          <SectionCard title="Editorial Collage (Right Column Image Block)">
            <Field label="Top tagline" value={form.editorial.tagline} onChange={(v) => set("editorial", { tagline: v })} />
            <Field label="Brand text" value={form.editorial.brandText} onChange={(v) => set("editorial", { brandText: v })} />
            <Field label="Subtitle" value={form.editorial.subtitle} onChange={(v) => set("editorial", { subtitle: v })} />
            <Field label="Image URL (leave empty for decorative placeholder)" value={form.editorial.imageUrl} onChange={(v) => set("editorial", { imageUrl: v })} placeholder="https://..." />
          </SectionCard>
          <SectionCard title="Overlay Card (bottom-left of image)">
            <Field label="Overlay title" value={form.editorial.overlayTitle} onChange={(v) => set("editorial", { overlayTitle: v })} />
            <Field label="Overlay body text" value={form.editorial.overlayBody} onChange={(v) => set("editorial", { overlayBody: v })} multiline />
          </SectionCard>
          <SectionCard title="Footer Decoration">
            <Field label="Protocol text" value={form.editorial.protocolText} onChange={(v) => set("editorial", { protocolText: v })} />
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Sticky save at bottom */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          data-testid="button-save-account-preferences-bottom"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
