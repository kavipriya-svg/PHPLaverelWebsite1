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

// ─── Types ────────────────────────────────────────────────────────
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

// ─── Defaults ─────────────────────────────────────────────────────
const DEFAULTS: OrderHistorySettings = {
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

function deepMerge(saved: Partial<OrderHistorySettings>): OrderHistorySettings {
  return {
    header: { ...DEFAULTS.header, ...(saved.header || {}) },
    sidebar: {
      ...DEFAULTS.sidebar,
      ...(saved.sidebar || {}),
      navItems: saved.sidebar?.navItems?.length ? saved.sidebar.navItems : DEFAULTS.sidebar.navItems,
    },
    search: { ...DEFAULTS.search, ...(saved.search || {}) },
    ledger: { ...DEFAULTS.ledger, ...(saved.ledger || {}) },
    statusLabels: { ...DEFAULTS.statusLabels, ...(saved.statusLabels || {}) },
    emptyState: { ...DEFAULTS.emptyState, ...(saved.emptyState || {}) },
    background: { ...DEFAULTS.background, ...(saved.background || {}) },
    footer: { ...DEFAULTS.footer, ...(saved.footer || {}) },
  };
}

// ─── Component ────────────────────────────────────────────────────
export default function AccountOrderHistorySettings() {
  const { toast } = useToast();
  const [form, setForm] = useState<OrderHistorySettings>(DEFAULTS);

  const { data, isLoading } = useQuery<{ settings: Partial<OrderHistorySettings> }>({
    queryKey: ["/api/settings/account-order-history"],
  });

  useEffect(() => {
    if (data?.settings) setForm(deepMerge(data.settings));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (body: OrderHistorySettings) => {
      const res = await apiRequest("PUT", "/api/settings/account-order-history", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/account-order-history"] });
      toast({ title: "Settings saved", description: "Order history page settings updated." });
    },
    onError: () => {
      toast({ title: "Save failed", variant: "destructive" });
    },
  });

  // ── patch helpers ──────────────────────────────────────────────
  function setHeader(patch: Partial<OrderHistorySettings["header"]>) {
    setForm((f) => ({ ...f, header: { ...f.header, ...patch } }));
  }
  function setSidebar(patch: Partial<OrderHistorySettings["sidebar"]>) {
    setForm((f) => ({ ...f, sidebar: { ...f.sidebar, ...patch } }));
  }
  function setSearch(patch: Partial<OrderHistorySettings["search"]>) {
    setForm((f) => ({ ...f, search: { ...f.search, ...patch } }));
  }
  function setLedger(patch: Partial<OrderHistorySettings["ledger"]>) {
    setForm((f) => ({ ...f, ledger: { ...f.ledger, ...patch } }));
  }
  function setStatusLabels(patch: Partial<OrderHistorySettings["statusLabels"]>) {
    setForm((f) => ({ ...f, statusLabels: { ...f.statusLabels, ...patch } }));
  }
  function setEmptyState(patch: Partial<OrderHistorySettings["emptyState"]>) {
    setForm((f) => ({ ...f, emptyState: { ...f.emptyState, ...patch } }));
  }
  function setBackground(patch: Partial<OrderHistorySettings["background"]>) {
    setForm((f) => ({ ...f, background: { ...f.background, ...patch } }));
  }
  function setFooter(patch: Partial<OrderHistorySettings["footer"]>) {
    setForm((f) => ({ ...f, footer: { ...f.footer, ...patch } }));
  }

  // nav item helpers
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
        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Order History Page</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Control all text, labels, and content on the <code className="bg-muted px-1 rounded">/account/orders</code> page.
            </p>
          </div>
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            data-testid="button-save-order-history-settings"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Settings
          </Button>
        </div>

        <Tabs defaultValue="header">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="header">Page Header</TabsTrigger>
            <TabsTrigger value="sidebar">Sidebar</TabsTrigger>
            <TabsTrigger value="search">Search Bar</TabsTrigger>
            <TabsTrigger value="ledger">Ledger Columns</TabsTrigger>
            <TabsTrigger value="status">Status Labels</TabsTrigger>
            <TabsTrigger value="empty">Empty State</TabsTrigger>
            <TabsTrigger value="misc">Misc / Footer</TabsTrigger>
          </TabsList>

          {/* ── Tab: Page Header ───────────────────────────────────── */}
          <TabsContent value="header" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Page Header</CardTitle>
                <CardDescription>The editorial header at the top of the orders page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Secure Badge Text</Label>
                    <Input value={form.header.secureLabel} onChange={(e) => setHeader({ secureLabel: e.target.value })} data-testid="input-secure-label" />
                    <p className="text-xs text-muted-foreground">The dark badge text, e.g. "STATUS: SECURE"</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Page Title</Label>
                    <Input value={form.header.title} onChange={(e) => setHeader({ title: e.target.value })} data-testid="input-header-title" />
                    <p className="text-xs text-muted-foreground">Large italic heading, e.g. "Logistics Archive"</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Input value={form.header.subtitle} onChange={(e) => setHeader({ subtitle: e.target.value })} data-testid="input-header-subtitle" />
                    <p className="text-xs text-muted-foreground">Muted line below the title, e.g. "// Deployment History"</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Integrity Label</Label>
                    <Input value={form.header.integrityLabel} onChange={(e) => setHeader({ integrityLabel: e.target.value })} data-testid="input-integrity-label" />
                    <p className="text-xs text-muted-foreground">Label above the progress bar</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Integrity Subtext</Label>
                    <Input value={form.header.integritySubtext} onChange={(e) => setHeader({ integritySubtext: e.target.value })} data-testid="input-integrity-subtext" />
                    <p className="text-xs text-muted-foreground">Text below the progress bar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Sidebar ───────────────────────────────────────── */}
          <TabsContent value="sidebar" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sidebar Identity</CardTitle>
                <CardDescription>Brand title, version tag, and CTA button on the left sidebar.</CardDescription>
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
                      <Input
                        value={item.icon}
                        onChange={(e) => updateNavItem(i, { icon: e.target.value })}
                        placeholder="biotech"
                        data-testid={`input-nav-icon-${i}`}
                      />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={item.label}
                        onChange={(e) => updateNavItem(i, { label: e.target.value })}
                        placeholder="Nav Item"
                        data-testid={`input-nav-label-${i}`}
                      />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">Link (href)</Label>
                      <Input
                        value={item.href}
                        onChange={(e) => updateNavItem(i, { href: e.target.value })}
                        placeholder="/account"
                        data-testid={`input-nav-href-${i}`}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeNavItem(i)}
                        disabled={form.sidebar.navItems.length <= 1}
                        data-testid={`button-remove-nav-${i}`}
                      >
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

          {/* ── Tab: Search Bar ────────────────────────────────────── */}
          <TabsContent value="search" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Search &amp; Filter Bar</CardTitle>
                <CardDescription>Labels and button texts in the archive search section.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Search Field Label</Label>
                    <Input value={form.search.label} onChange={(e) => setSearch({ label: e.target.value })} data-testid="input-search-label" />
                    <p className="text-xs text-muted-foreground">Small label above the search input</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Search Placeholder</Label>
                    <Input value={form.search.placeholder} onChange={(e) => setSearch({ placeholder: e.target.value })} data-testid="input-search-placeholder" />
                  </div>
                  <div className="space-y-2">
                    <Label>Filter Button Text</Label>
                    <Input value={form.search.filterText} onChange={(e) => setSearch({ filterText: e.target.value })} data-testid="input-filter-text" />
                  </div>
                  <div className="space-y-2">
                    <Label>Export Button Text</Label>
                    <Input value={form.search.exportText} onChange={(e) => setSearch({ exportText: e.target.value })} data-testid="input-export-text" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Ledger Columns ────────────────────────────────── */}
          <TabsContent value="ledger" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Ledger Column Headers</CardTitle>
                <CardDescription>The small label text shown above each column in every order row.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID Column Label</Label>
                    <Input value={form.ledger.idLabel} onChange={(e) => setLedger({ idLabel: e.target.value })} data-testid="input-id-label" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date Column Label</Label>
                    <Input value={form.ledger.dateLabel} onChange={(e) => setLedger({ dateLabel: e.target.value })} data-testid="input-date-label" />
                  </div>
                  <div className="space-y-2">
                    <Label>Status Column Label</Label>
                    <Input value={form.ledger.statusLabel} onChange={(e) => setLedger({ statusLabel: e.target.value })} data-testid="input-status-label" />
                  </div>
                  <div className="space-y-2">
                    <Label>Value Column Label</Label>
                    <Input value={form.ledger.valueLabel} onChange={(e) => setLedger({ valueLabel: e.target.value })} data-testid="input-value-label" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Row Action Texts</CardTitle>
                <CardDescription>Links and button labels inside each order row.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Track Link Text</Label>
                    <Input value={form.ledger.trackText} onChange={(e) => setLedger({ trackText: e.target.value })} data-testid="input-track-text" />
                    <p className="text-xs text-muted-foreground">Small link with location icon</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice Link Text</Label>
                    <Input value={form.ledger.invoiceText} onChange={(e) => setLedger({ invoiceText: e.target.value })} data-testid="input-invoice-text" />
                    <p className="text-xs text-muted-foreground">Small link with download icon</p>
                  </div>
                  <div className="space-y-2">
                    <Label>"Dossier" Button Text</Label>
                    <Input value={form.ledger.dossierText} onChange={(e) => setLedger({ dossierText: e.target.value })} data-testid="input-dossier-text" />
                    <p className="text-xs text-muted-foreground">Dark hover-reveal button on the right</p>
                  </div>
                  <div className="space-y-2">
                    <Label>"Track" Button Text</Label>
                    <Input value={form.ledger.trackBtnText} onChange={(e) => setLedger({ trackBtnText: e.target.value })} data-testid="input-track-btn-text" />
                    <p className="text-xs text-muted-foreground">Outline hover-reveal button on the right</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Status Labels ─────────────────────────────────── */}
          <TabsContent value="status" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Labels</CardTitle>
                <CardDescription>
                  The text shown next to the status dot for each order state. These map to internal order statuses.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "deployed", field: "deployed", internal: "delivered", color: "#264e3c" },
                    { key: "inTransit", field: "inTransit", internal: "shipped", color: "#944923" },
                    { key: "processing", field: "processing", internal: "processing", color: "#944923" },
                    { key: "pending", field: "pending", internal: "pending", color: "#944923" },
                    { key: "cancelled", field: "cancelled", internal: "cancelled", color: "#ba1a1a" },
                    { key: "synchronized", field: "synchronized", internal: "default", color: "#717973" },
                  ].map(({ key, field, internal, color }) => (
                    <div key={key} className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: color }}
                        />
                        {internal === "default" ? "Default / Other" : `"${internal}" orders`}
                      </Label>
                      <Input
                        value={(form.statusLabels as Record<string, string>)[field]}
                        onChange={(e) => setStatusLabels({ [field]: e.target.value } as Partial<OrderHistorySettings["statusLabels"]>)}
                        data-testid={`input-status-${field}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Empty State ───────────────────────────────────── */}
          <TabsContent value="empty" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Empty State</CardTitle>
                <CardDescription>Shown when the customer has no orders, or no results match the search.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.emptyState.title} onChange={(e) => setEmptyState({ title: e.target.value })} data-testid="input-empty-title" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.emptyState.description} onChange={(e) => setEmptyState({ description: e.target.value })} rows={2} data-testid="input-empty-description" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Browse Button Text</Label>
                    <Input value={form.emptyState.browseText} onChange={(e) => setEmptyState({ browseText: e.target.value })} data-testid="input-empty-browse-text" />
                  </div>
                  <div className="space-y-2">
                    <Label>Browse Button Link</Label>
                    <Input value={form.emptyState.browseHref} onChange={(e) => setEmptyState({ browseHref: e.target.value })} data-testid="input-empty-browse-href" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Misc / Footer ─────────────────────────────────── */}
          <TabsContent value="misc" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Decorative Background</CardTitle>
                <CardDescription>The large faded editorial text floating in the background.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label>Decorative Text</Label>
                <Input
                  value={form.background.decorativeText}
                  onChange={(e) => setBackground({ decorativeText: e.target.value })}
                  data-testid="input-decorative-text"
                />
                <p className="text-xs text-muted-foreground">Shown very faintly at bottom-left, e.g. "LE-001"</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Page Footer</CardTitle>
                <CardDescription>The editorial footer at the bottom of the orders page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Brand Name</Label>
                  <Input value={form.footer.brandName} onChange={(e) => setFooter({ brandName: e.target.value })} data-testid="input-footer-brand" />
                </div>
                <div className="space-y-2">
                  <Label>Copyright Text</Label>
                  <Input value={form.footer.copyright} onChange={(e) => setFooter({ copyright: e.target.value })} data-testid="input-footer-copyright" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            size="lg"
            data-testid="button-save-bottom"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
