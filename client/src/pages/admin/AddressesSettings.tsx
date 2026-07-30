import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface NavItem { icon: string; label: string; href: string }

interface AddressesSettings {
  header: {
    secureLabel: string;
    timestampPrefix: string;
    title: string;
    subtitle: string;
    progressLabel: string;
    maxCoordinates: number;
  };
  sidebar: {
    title: string;
    version: string;
    userStatus: string;
    ctaText: string;
    navItems: NavItem[];
  };
  actionBar: {
    label: string;
    description: string;
    addButtonText: string;
    addTileText: string;
  };
  emptyState: {
    loadingText: string;
    title: string;
    description: string;
    addButtonText: string;
  };
  cards: {
    shippingBadge: string;
    billingBadge: string;
    defaultBadge: string;
    setDefaultText: string;
  };
  dialog: {
    addModeLabel: string;
    editModeLabel: string;
    addTitle: string;
    editTitle: string;
  };
  background: {
    decorativeText: string;
  };
  footerNote: string;
}

const DEFAULTS: AddressesSettings = {
  header: {
    secureLabel: "STATUS: SECURE",
    timestampPrefix: "SECURE_SYNC:",
    title: "Biological Coordinates",
    subtitle: "// Delivery Nodes",
    progressLabel: "COORDINATES LOGGED",
    maxCoordinates: 5,
  },
  sidebar: {
    title: "CANINE BIOMETRIC ID",
    version: "V.01.2024 REV",
    userStatus: "Verified Entity",
    ctaText: "Request Lab Access",
    navItems: [
      { icon: "biotech",     label: "Bio-Profile",      href: "/account" },
      { icon: "history_edu", label: "Order History",    href: "/account/orders" },
      { icon: "bookmark",    label: "Saved Specimens",  href: "/wishlist" },
      { icon: "location_on", label: "Bio. Coordinates", href: "/account/addresses" },
      { icon: "settings",    label: "Preferences",      href: "/account/settings" },
    ],
  },
  actionBar: {
    label: "Dossier Access // Internal Use Only",
    description: "Registered receiving locations for delicate biological transports.",
    addButtonText: "REGISTER COORDINATE",
    addTileText: "Register New Coordinate",
  },
  emptyState: {
    loadingText: "SCANNING COORDINATES...",
    title: "No Coordinates Registered",
    description: "There are no registered biological coordinates in the current dossier. Register a delivery node to begin receiving specimens.",
    addButtonText: "Register First Coordinate",
  },
  cards: {
    shippingBadge: "SHIPPING_COORD",
    billingBadge: "BILLING_COORD",
    defaultBadge: "DEFAULT",
    setDefaultText: "SET DEFAULT",
  },
  dialog: {
    addModeLabel: "REGISTER // NEW COORDINATE",
    editModeLabel: "MODIFY // COORDINATE",
    addTitle: "New Biological Coordinate",
    editTitle: "Edit Biological Coordinate",
  },
  background: {
    decorativeText: "BC-001",
  },
  footerNote: "Coordinate data managed by 19 DOGS Secure Encryption Systems. All location data is strictly confidential and encrypted at rest using AES-256 standards for biological compliance.",
};

function deepMerge(saved: Partial<AddressesSettings>): AddressesSettings {
  return {
    header:     { ...DEFAULTS.header,     ...(saved.header     || {}) },
    sidebar: {
      ...DEFAULTS.sidebar,
      ...(saved.sidebar || {}),
      navItems: saved.sidebar?.navItems?.length ? saved.sidebar.navItems : DEFAULTS.sidebar.navItems,
    },
    actionBar:  { ...DEFAULTS.actionBar,  ...(saved.actionBar  || {}) },
    emptyState: { ...DEFAULTS.emptyState, ...(saved.emptyState || {}) },
    cards:      { ...DEFAULTS.cards,      ...(saved.cards      || {}) },
    dialog:     { ...DEFAULTS.dialog,     ...(saved.dialog     || {}) },
    background: { ...DEFAULTS.background, ...(saved.background || {}) },
    footerNote: saved.footerNote ?? DEFAULTS.footerNote,
  };
}

export default function AddressesSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState<AddressesSettings>(DEFAULTS);

  const { data, isLoading } = useQuery<{ settings: Partial<AddressesSettings> }>({
    queryKey: ["/api/settings/account-addresses"],
  });

  useEffect(() => {
    if (data?.settings) setForm(deepMerge(data.settings));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (body: AddressesSettings) => {
      const res = await apiRequest("PUT", "/api/settings/account-addresses", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/account-addresses"] });
      toast({ title: "Settings saved", description: "Addresses page settings updated." });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  function setHeader(patch: Partial<AddressesSettings["header"]>) {
    setForm((f) => ({ ...f, header: { ...f.header, ...patch } }));
  }
  function setSidebar(patch: Partial<AddressesSettings["sidebar"]>) {
    setForm((f) => ({ ...f, sidebar: { ...f.sidebar, ...patch } }));
  }
  function setActionBar(patch: Partial<AddressesSettings["actionBar"]>) {
    setForm((f) => ({ ...f, actionBar: { ...f.actionBar, ...patch } }));
  }
  function setEmptyState(patch: Partial<AddressesSettings["emptyState"]>) {
    setForm((f) => ({ ...f, emptyState: { ...f.emptyState, ...patch } }));
  }
  function setCards(patch: Partial<AddressesSettings["cards"]>) {
    setForm((f) => ({ ...f, cards: { ...f.cards, ...patch } }));
  }
  function setDialog(patch: Partial<AddressesSettings["dialog"]>) {
    setForm((f) => ({ ...f, dialog: { ...f.dialog, ...patch } }));
  }
  function setBackground(patch: Partial<AddressesSettings["background"]>) {
    setForm((f) => ({ ...f, background: { ...f.background, ...patch } }));
  }

  function updateNavItem(i: number, patch: Partial<NavItem>) {
    const items = [...form.sidebar.navItems];
    items[i] = { ...items[i], ...patch };
    setSidebar({ navItems: items });
  }
  function addNavItem() {
    setSidebar({ navItems: [...form.sidebar.navItems, { icon: "link", label: "New Link", href: "/" }] });
  }
  function removeNavItem(i: number) {
    setSidebar({ navItems: form.sidebar.navItems.filter((_, idx) => idx !== i) });
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Addresses Page</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Control all text, labels, and content on the{" "}
              <code className="bg-muted px-1 rounded">/account/addresses</code> page.
            </p>
          </div>
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            data-testid="button-save-addresses-settings"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Settings
          </Button>
        </div>

        <Tabs defaultValue="header">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="header">Page Header</TabsTrigger>
            <TabsTrigger value="sidebar">Sidebar</TabsTrigger>
            <TabsTrigger value="action">Action Bar</TabsTrigger>
            <TabsTrigger value="empty">Empty State</TabsTrigger>
            <TabsTrigger value="cards">Cards &amp; Badges</TabsTrigger>
            <TabsTrigger value="dialog">Dialog</TabsTrigger>
            <TabsTrigger value="misc">Misc</TabsTrigger>
          </TabsList>

          {/* ── Page Header ─────────────────────────────────────────── */}
          <TabsContent value="header" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Page Header</CardTitle>
                <CardDescription>The editorial header at the top of the addresses page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Secure Badge Text</Label>
                    <Input
                      value={form.header.secureLabel}
                      onChange={(e) => setHeader({ secureLabel: e.target.value })}
                      data-testid="input-secure-label"
                    />
                    <p className="text-xs text-muted-foreground">Dark badge, e.g. "STATUS: SECURE"</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Timestamp Prefix</Label>
                    <Input
                      value={form.header.timestampPrefix}
                      onChange={(e) => setHeader({ timestampPrefix: e.target.value })}
                      data-testid="input-timestamp-prefix"
                    />
                    <p className="text-xs text-muted-foreground">Label before the live clock, e.g. "SECURE_SYNC:"</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Page Title</Label>
                    <Input
                      value={form.header.title}
                      onChange={(e) => setHeader({ title: e.target.value })}
                      data-testid="input-header-title"
                    />
                    <p className="text-xs text-muted-foreground">Large italic heading</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Input
                      value={form.header.subtitle}
                      onChange={(e) => setHeader({ subtitle: e.target.value })}
                      data-testid="input-header-subtitle"
                    />
                    <p className="text-xs text-muted-foreground">Muted line below the title</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Progress Bar Label</Label>
                    <Input
                      value={form.header.progressLabel}
                      onChange={(e) => setHeader({ progressLabel: e.target.value })}
                      data-testid="input-progress-label"
                    />
                    <p className="text-xs text-muted-foreground">Label above the progress bar, e.g. "COORDINATES LOGGED"</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Coordinates (progress bar cap)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={form.header.maxCoordinates}
                      onChange={(e) => setHeader({ maxCoordinates: Number(e.target.value) })}
                      data-testid="input-max-coordinates"
                    />
                    <p className="text-xs text-muted-foreground">Denominator shown as "n / X REGISTERED"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <TabsContent value="sidebar" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sidebar Identity</CardTitle>
                <CardDescription>Brand title, version tag, user status, and CTA button.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sidebar Title</Label>
                    <Input value={form.sidebar.title} onChange={(e) => setSidebar({ title: e.target.value })} data-testid="input-sidebar-title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Version Tag</Label>
                    <Input value={form.sidebar.version} onChange={(e) => setSidebar({ version: e.target.value })} data-testid="input-sidebar-version" />
                  </div>
                  <div className="space-y-2">
                    <Label>User Status Label</Label>
                    <Input value={form.sidebar.userStatus} onChange={(e) => setSidebar({ userStatus: e.target.value })} data-testid="input-user-status" />
                    <p className="text-xs text-muted-foreground">Small text below the user's name, e.g. "Verified Entity"</p>
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Button Text</Label>
                    <Input value={form.sidebar.ctaText} onChange={(e) => setSidebar({ ctaText: e.target.value })} data-testid="input-sidebar-cta" />
                    <p className="text-xs text-muted-foreground">The bottom dark button in the sidebar</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Navigation Items</CardTitle>
                <CardDescription>
                  Sidebar nav links. Use any{" "}
                  <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer" className="underline text-primary">
                    Material Symbol
                  </a>{" "}
                  icon name for the icon field.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {form.sidebar.navItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Icon</Label>
                      <Input value={item.icon} onChange={(e) => updateNavItem(i, { icon: e.target.value })} placeholder="biotech" data-testid={`input-nav-icon-${i}`} />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input value={item.label} onChange={(e) => updateNavItem(i, { label: e.target.value })} placeholder="Nav Item" data-testid={`input-nav-label-${i}`} />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">Link (href)</Label>
                      <Input value={item.href} onChange={(e) => updateNavItem(i, { href: e.target.value })} placeholder="/account" data-testid={`input-nav-href-${i}`} />
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="icon" onClick={() => removeNavItem(i)} disabled={form.sidebar.navItems.length <= 1} data-testid={`button-remove-nav-${i}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Separator />
                <Button variant="outline" size="sm" onClick={addNavItem} data-testid="button-add-nav-item">
                  <Plus className="h-4 w-4 mr-2" /> Add Nav Item
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Action Bar ──────────────────────────────────────────── */}
          <TabsContent value="action" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Action Bar</CardTitle>
                <CardDescription>The bar above the address grid with a description and the add button.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Label / Eyebrow</Label>
                    <Input value={form.actionBar.label} onChange={(e) => setActionBar({ label: e.target.value })} data-testid="input-actionbar-label" />
                    <p className="text-xs text-muted-foreground">Small uppercase label, e.g. "Dossier Access // Internal Use Only"</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Add Button Text</Label>
                    <Input value={form.actionBar.addButtonText} onChange={(e) => setActionBar({ addButtonText: e.target.value })} data-testid="input-add-button-text" />
                    <p className="text-xs text-muted-foreground">Dark CTA button on the right</p>
                  </div>
                  <div className="col-span-full space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.actionBar.description} onChange={(e) => setActionBar({ description: e.target.value })} data-testid="input-actionbar-description" rows={2} />
                    <p className="text-xs text-muted-foreground">Muted subtitle below the label</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Add Tile Text</Label>
                    <Input value={form.actionBar.addTileText} onChange={(e) => setActionBar({ addTileText: e.target.value })} data-testid="input-add-tile-text" />
                    <p className="text-xs text-muted-foreground">Text on the dashed "+" card in the grid</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Empty State ─────────────────────────────────────────── */}
          <TabsContent value="empty" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Empty &amp; Loading States</CardTitle>
                <CardDescription>What the user sees when there are no addresses or the page is loading.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loading Text</Label>
                    <Input value={form.emptyState.loadingText} onChange={(e) => setEmptyState({ loadingText: e.target.value })} data-testid="input-loading-text" />
                    <p className="text-xs text-muted-foreground">Shown while addresses are fetching</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Empty State Title</Label>
                    <Input value={form.emptyState.title} onChange={(e) => setEmptyState({ title: e.target.value })} data-testid="input-empty-title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Empty State Button Text</Label>
                    <Input value={form.emptyState.addButtonText} onChange={(e) => setEmptyState({ addButtonText: e.target.value })} data-testid="input-empty-button" />
                  </div>
                  <div className="col-span-full space-y-2">
                    <Label>Empty State Description</Label>
                    <Textarea value={form.emptyState.description} onChange={(e) => setEmptyState({ description: e.target.value })} data-testid="input-empty-description" rows={3} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Cards & Badges ──────────────────────────────────────── */}
          <TabsContent value="cards" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Address Card Badges</CardTitle>
                <CardDescription>Badge text on each address card.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shipping Badge</Label>
                    <Input value={form.cards.shippingBadge} onChange={(e) => setCards({ shippingBadge: e.target.value })} data-testid="input-shipping-badge" />
                    <p className="text-xs text-muted-foreground">Dark badge on shipping addresses</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Badge</Label>
                    <Input value={form.cards.billingBadge} onChange={(e) => setCards({ billingBadge: e.target.value })} data-testid="input-billing-badge" />
                    <p className="text-xs text-muted-foreground">Muted badge on billing addresses</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Badge</Label>
                    <Input value={form.cards.defaultBadge} onChange={(e) => setCards({ defaultBadge: e.target.value })} data-testid="input-default-badge" />
                    <p className="text-xs text-muted-foreground">Amber badge shown on the primary address</p>
                  </div>
                  <div className="space-y-2">
                    <Label>"Set Default" Button Text</Label>
                    <Input value={form.cards.setDefaultText} onChange={(e) => setCards({ setDefaultText: e.target.value })} data-testid="input-set-default-text" />
                    <p className="text-xs text-muted-foreground">Outline button on non-default cards</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Dialog ──────────────────────────────────────────────── */}
          <TabsContent value="dialog" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Add / Edit Dialog</CardTitle>
                <CardDescription>Text inside the modal that opens when adding or editing an address.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Add Mode — Eyebrow Label</Label>
                    <Input value={form.dialog.addModeLabel} onChange={(e) => setDialog({ addModeLabel: e.target.value })} data-testid="input-dialog-add-mode-label" />
                    <p className="text-xs text-muted-foreground">Small monospace label at the top when adding</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Edit Mode — Eyebrow Label</Label>
                    <Input value={form.dialog.editModeLabel} onChange={(e) => setDialog({ editModeLabel: e.target.value })} data-testid="input-dialog-edit-mode-label" />
                    <p className="text-xs text-muted-foreground">Small monospace label at the top when editing</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Add Mode — Dialog Title</Label>
                    <Input value={form.dialog.addTitle} onChange={(e) => setDialog({ addTitle: e.target.value })} data-testid="input-dialog-add-title" />
                    <p className="text-xs text-muted-foreground">Large serif italic heading when adding</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Edit Mode — Dialog Title</Label>
                    <Input value={form.dialog.editTitle} onChange={(e) => setDialog({ editTitle: e.target.value })} data-testid="input-dialog-edit-title" />
                    <p className="text-xs text-muted-foreground">Large serif italic heading when editing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Misc ────────────────────────────────────────────────── */}
          <TabsContent value="misc" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Decorative &amp; Footer</CardTitle>
                <CardDescription>Background watermark text and the legal footer note at the bottom of the page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Decorative Background Text</Label>
                  <Input value={form.background.decorativeText} onChange={(e) => setBackground({ decorativeText: e.target.value })} data-testid="input-decorative-text" />
                  <p className="text-xs text-muted-foreground">Giant faint watermark at the bottom-left of the page, e.g. "BC-001"</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Footer Note</Label>
                  <Textarea value={form.footerNote} onChange={(e) => setForm((f) => ({ ...f, footerNote: e.target.value }))} rows={3} data-testid="input-footer-note" />
                  <p className="text-xs text-muted-foreground">Italic disclaimer text at the very bottom of the page content</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
