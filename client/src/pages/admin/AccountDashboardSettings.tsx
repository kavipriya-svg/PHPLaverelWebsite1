import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface NavItem { icon: string; label: string; href: string }
interface GridCard { icon: string; label: string; desc: string; href: string }

interface AccountDashboardSettings {
  header: {
    accessLabel: string;
    pageTitle: string;
    nodeInfo: string;
  };
  sidebar: {
    title: string;
    version: string;
    showUpgradeButton: boolean;
    upgradeButtonText: string;
    navItems: NavItem[];
  };
  bioCard: {
    watermarkText: string;
    designationLabel: string;
    emailLabel: string;
    validityLabel: string;
    validityPercent: number;
  };
  technicalSummary: {
    title: string;
    memberSinceLabel: string;
    accountTypeLabel: string;
    activeProtocolsLabel: string;
    savedSpecimensLabel: string;
    coordinatesLabel: string;
  };
  activeProtocols: {
    title: string;
    trackText: string;
    emptyText: string;
    browseText: string;
    browseHref: string;
  };
  gridCards: GridCard[];
  compliance: {
    text: string;
  };
}

const DEFAULTS: AccountDashboardSettings = {
  header: {
    accessLabel: "Dossier Access // Internal Use Only",
    pageTitle: "Subject Profile // Account Dossier",
    nodeInfo: "NODE_09 // FRANKFURT_DC",
  },
  sidebar: {
    title: "CANINE BIOMETRIC ID",
    version: "V.01.2024 REV",
    showUpgradeButton: true,
    upgradeButtonText: "UPGRADE PLAN",
    navItems: [
      { icon: "biotech", label: "Bio-Profile", href: "/account" },
      { icon: "history_edu", label: "Order History", href: "/account/orders" },
      { icon: "bookmark", label: "Saved Specimens", href: "/wishlist" },
      { icon: "location_on", label: "Bio. Coordinates", href: "/account/addresses" },
      { icon: "settings", label: "Preferences", href: "/account/settings" },
    ],
  },
  bioCard: {
    watermarkText: "DNA_VERIFIED_IDENTITY",
    designationLabel: "DESIGNATION",
    emailLabel: "COMMUNICATION_RELAY",
    validityLabel: "BIOLOGICAL_VALIDITY",
    validityPercent: 98.4,
  },
  technicalSummary: {
    title: "Technical Summary",
    memberSinceLabel: "Member Since:",
    accountTypeLabel: "Account Type:",
    activeProtocolsLabel: "Active Protocols:",
    savedSpecimensLabel: "Saved Specimens:",
    coordinatesLabel: "Coordinates Filed:",
  },
  activeProtocols: {
    title: "Active Protocols",
    trackText: "TRACK_SPECIMEN →",
    emptyText: "NO ACTIVE PROTOCOLS FOUND",
    browseText: "BROWSE SPECIMENS →",
    browseHref: "/shop",
  },
  gridCards: [
    { icon: "history_edu", label: "Logistics Archive", desc: "Complete historical record of biological acquisitions and deployments.", href: "/account/orders" },
    { icon: "bookmark", label: "Saved Specimens", desc: "Curation of research-grade products earmarked for future acquisition.", href: "/wishlist" },
    { icon: "location_on", label: "Biological Coordinates", desc: "Registered receiving locations for delicate biological transports.", href: "/account/addresses" },
    { icon: "tune", label: "Account Preferences", desc: "Update protocol settings, communication relays, and security keys.", href: "/account/settings" },
  ],
  compliance: {
    text: "Identity verification managed by 19 DOGS Secure Encryption Systems. All data points are strictly confidential and encrypted at rest using AES-256 standards for biological compliance.",
  },
};

function deepMerge(saved: Partial<AccountDashboardSettings>): AccountDashboardSettings {
  return {
    header: { ...DEFAULTS.header, ...(saved.header || {}) },
    sidebar: {
      ...DEFAULTS.sidebar,
      ...(saved.sidebar || {}),
      navItems: saved.sidebar?.navItems?.length ? saved.sidebar.navItems : DEFAULTS.sidebar.navItems,
    },
    bioCard: { ...DEFAULTS.bioCard, ...(saved.bioCard || {}) },
    technicalSummary: { ...DEFAULTS.technicalSummary, ...(saved.technicalSummary || {}) },
    activeProtocols: { ...DEFAULTS.activeProtocols, ...(saved.activeProtocols || {}) },
    gridCards: saved.gridCards?.length ? saved.gridCards : DEFAULTS.gridCards,
    compliance: { ...DEFAULTS.compliance, ...(saved.compliance || {}) },
  };
}

export default function AccountDashboardSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState<AccountDashboardSettings>(DEFAULTS);

  const { data, isLoading } = useQuery<{ settings: Partial<AccountDashboardSettings> }>({
    queryKey: ["/api/settings/account-dashboard"],
  });

  useEffect(() => {
    if (data?.settings) setForm(deepMerge(data.settings));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (body: AccountDashboardSettings) => {
      const res = await apiRequest("PUT", "/api/settings/account-dashboard", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/account-dashboard"] });
      toast({ title: "Settings saved", description: "Account dashboard settings updated." });
    },
    onError: () => {
      toast({ title: "Save failed", variant: "destructive" });
    },
  });

  function setHeader(patch: Partial<AccountDashboardSettings["header"]>) {
    setForm((f) => ({ ...f, header: { ...f.header, ...patch } }));
  }
  function setSidebar(patch: Partial<AccountDashboardSettings["sidebar"]>) {
    setForm((f) => ({ ...f, sidebar: { ...f.sidebar, ...patch } }));
  }
  function setBioCard(patch: Partial<AccountDashboardSettings["bioCard"]>) {
    setForm((f) => ({ ...f, bioCard: { ...f.bioCard, ...patch } }));
  }
  function setTechSummary(patch: Partial<AccountDashboardSettings["technicalSummary"]>) {
    setForm((f) => ({ ...f, technicalSummary: { ...f.technicalSummary, ...patch } }));
  }
  function setActiveProto(patch: Partial<AccountDashboardSettings["activeProtocols"]>) {
    setForm((f) => ({ ...f, activeProtocols: { ...f.activeProtocols, ...patch } }));
  }
  function setCompliance(text: string) {
    setForm((f) => ({ ...f, compliance: { text } }));
  }

  function updateNavItem(i: number, patch: Partial<NavItem>) {
    const next = form.sidebar.navItems.map((it, idx) => idx === i ? { ...it, ...patch } : it);
    setSidebar({ navItems: next });
  }
  function addNavItem() {
    setSidebar({ navItems: [...form.sidebar.navItems, { icon: "link", label: "New Link", href: "/" }] });
  }
  function removeNavItem(i: number) {
    setSidebar({ navItems: form.sidebar.navItems.filter((_, idx) => idx !== i) });
  }

  function updateGridCard(i: number, patch: Partial<GridCard>) {
    const next = form.gridCards.map((c, idx) => idx === i ? { ...c, ...patch } : c);
    setForm((f) => ({ ...f, gridCards: next }));
  }
  function addGridCard() {
    setForm((f) => ({ ...f, gridCards: [...f.gridCards, { icon: "link", label: "New Card", desc: "", href: "/" }] }));
  }
  function removeGridCard(i: number) {
    setForm((f) => ({ ...f, gridCards: f.gridCards.filter((_, idx) => idx !== i) }));
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Customer Account — Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Control all text, labels, menus, and cards displayed on the <code>/account</code> page.
            </p>
          </div>
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            data-testid="button-save-settings"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="header">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="header">Page Header</TabsTrigger>
            <TabsTrigger value="sidebar">Sidebar</TabsTrigger>
            <TabsTrigger value="biocard">Bio Card</TabsTrigger>
            <TabsTrigger value="techsummary">Tech Summary</TabsTrigger>
            <TabsTrigger value="protocols">Active Protocols</TabsTrigger>
            <TabsTrigger value="gridcards">Grid Cards</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          {/* ── Page Header ─────────────────────────────────── */}
          <TabsContent value="header">
            <Card>
              <CardHeader>
                <CardTitle>Page Header</CardTitle>
                <CardDescription>The editorial headline section at the top of the account page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Access Label <Badge variant="outline" className="ml-2 text-xs">small tag above title</Badge></Label>
                  <Input
                    value={form.header.accessLabel}
                    onChange={(e) => setHeader({ accessLabel: e.target.value })}
                    data-testid="input-header-accesslabel"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Page Title <Badge variant="outline" className="ml-2 text-xs">large heading</Badge></Label>
                  <Input
                    value={form.header.pageTitle}
                    onChange={(e) => setHeader({ pageTitle: e.target.value })}
                    data-testid="input-header-pagetitle"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Node Info <Badge variant="outline" className="ml-2 text-xs">top-right monospace line</Badge></Label>
                  <Input
                    value={form.header.nodeInfo}
                    onChange={(e) => setHeader({ nodeInfo: e.target.value })}
                    data-testid="input-header-nodeinfo"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Sidebar ─────────────────────────────────────── */}
          <TabsContent value="sidebar">
            <Card>
              <CardHeader>
                <CardTitle>Sidebar</CardTitle>
                <CardDescription>Left navigation panel shown on desktop.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sidebar Title</Label>
                    <Input
                      value={form.sidebar.title}
                      onChange={(e) => setSidebar({ title: e.target.value })}
                      data-testid="input-sidebar-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Version / Sub-label</Label>
                    <Input
                      value={form.sidebar.version}
                      onChange={(e) => setSidebar({ version: e.target.value })}
                      data-testid="input-sidebar-version"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.sidebar.showUpgradeButton}
                    onCheckedChange={(v) => setSidebar({ showUpgradeButton: v })}
                    data-testid="switch-upgrade-button"
                  />
                  <Label>Show Upgrade Button</Label>
                </div>
                {form.sidebar.showUpgradeButton && (
                  <div className="space-y-2">
                    <Label>Upgrade Button Text</Label>
                    <Input
                      value={form.sidebar.upgradeButtonText}
                      onChange={(e) => setSidebar({ upgradeButtonText: e.target.value })}
                      data-testid="input-upgrade-text"
                    />
                  </div>
                )}

                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Navigation Items</Label>
                    <Button size="sm" variant="outline" onClick={addNavItem} data-testid="button-add-nav-item">
                      <Plus className="h-3 w-3 mr-1" /> Add Item
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Icon names come from <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer" className="underline">Material Symbols</a>.</p>
                  {form.sidebar.navItems.map((item, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 p-3 border rounded-md">
                      <div className="space-y-1">
                        <Label className="text-xs">Icon</Label>
                        <Input
                          value={item.icon}
                          onChange={(e) => updateNavItem(i, { icon: e.target.value })}
                          placeholder="e.g. home"
                          data-testid={`input-nav-icon-${i}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={item.label}
                          onChange={(e) => updateNavItem(i, { label: e.target.value })}
                          data-testid={`input-nav-label-${i}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Link (href)</Label>
                        <div className="flex gap-1">
                          <Input
                            value={item.href}
                            onChange={(e) => updateNavItem(i, { href: e.target.value })}
                            data-testid={`input-nav-href-${i}`}
                          />
                          <Button size="icon" variant="ghost" onClick={() => removeNavItem(i)} data-testid={`button-remove-nav-${i}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Bio Card ─────────────────────────────────────── */}
          <TabsContent value="biocard">
            <Card>
              <CardHeader>
                <CardTitle>Bio Card</CardTitle>
                <CardDescription>The user identity card showing avatar, name, and email.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Watermark Text <Badge variant="outline" className="ml-2 text-xs">rotated background text</Badge></Label>
                  <Input
                    value={form.bioCard.watermarkText}
                    onChange={(e) => setBioCard({ watermarkText: e.target.value })}
                    data-testid="input-biocard-watermark"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Designation Label</Label>
                    <Input
                      value={form.bioCard.designationLabel}
                      onChange={(e) => setBioCard({ designationLabel: e.target.value })}
                      data-testid="input-biocard-designation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Label</Label>
                    <Input
                      value={form.bioCard.emailLabel}
                      onChange={(e) => setBioCard({ emailLabel: e.target.value })}
                      data-testid="input-biocard-email-label"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Validity Label</Label>
                    <Input
                      value={form.bioCard.validityLabel}
                      onChange={(e) => setBioCard({ validityLabel: e.target.value })}
                      data-testid="input-biocard-validity-label"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Validity Percentage <Badge variant="outline" className="ml-2 text-xs">progress bar fill %</Badge></Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={form.bioCard.validityPercent}
                      onChange={(e) => setBioCard({ validityPercent: parseFloat(e.target.value) || 0 })}
                      data-testid="input-biocard-validity-percent"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Technical Summary ────────────────────────────── */}
          <TabsContent value="techsummary">
            <Card>
              <CardHeader>
                <CardTitle>Technical Summary</CardTitle>
                <CardDescription>Row labels in the stats panel below the bio card.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={form.technicalSummary.title}
                    onChange={(e) => setTechSummary({ title: e.target.value })}
                    data-testid="input-techsummary-title"
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(
                    [
                      ["memberSinceLabel", "Member Since Label"],
                      ["accountTypeLabel", "Account Type Label"],
                      ["activeProtocolsLabel", "Active Protocols Label"],
                      ["savedSpecimensLabel", "Saved Specimens Label"],
                      ["coordinatesLabel", "Coordinates Filed Label"],
                    ] as const
                  ).map(([key, lbl]) => (
                    <div key={key} className="space-y-2">
                      <Label>{lbl}</Label>
                      <Input
                        value={form.technicalSummary[key]}
                        onChange={(e) => setTechSummary({ [key]: e.target.value })}
                        data-testid={`input-tech-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Active Protocols ─────────────────────────────── */}
          <TabsContent value="protocols">
            <Card>
              <CardHeader>
                <CardTitle>Active Protocols</CardTitle>
                <CardDescription>The latest order card — title and text strings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Card Title</Label>
                  <Input
                    value={form.activeProtocols.title}
                    onChange={(e) => setActiveProto({ title: e.target.value })}
                    data-testid="input-protocols-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Track Order Link Text</Label>
                  <Input
                    value={form.activeProtocols.trackText}
                    onChange={(e) => setActiveProto({ trackText: e.target.value })}
                    data-testid="input-protocols-tracktext"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Empty State Text <Badge variant="outline" className="ml-2 text-xs">when no orders</Badge></Label>
                  <Input
                    value={form.activeProtocols.emptyText}
                    onChange={(e) => setActiveProto({ emptyText: e.target.value })}
                    data-testid="input-protocols-emptytext"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Browse Link Text</Label>
                    <Input
                      value={form.activeProtocols.browseText}
                      onChange={(e) => setActiveProto({ browseText: e.target.value })}
                      data-testid="input-protocols-browsetext"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Browse Link Href</Label>
                    <Input
                      value={form.activeProtocols.browseHref}
                      onChange={(e) => setActiveProto({ browseHref: e.target.value })}
                      data-testid="input-protocols-browsehref"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Grid Cards ───────────────────────────────────── */}
          <TabsContent value="gridcards">
            <Card>
              <CardHeader>
                <CardTitle>Grid Cards</CardTitle>
                <CardDescription>The 2-column shortcut cards below the order card. Icon names from Material Symbols.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={addGridCard} data-testid="button-add-grid-card">
                    <Plus className="h-3 w-3 mr-1" /> Add Card
                  </Button>
                </div>
                {form.gridCards.map((card, i) => (
                  <div key={i} className="p-4 border rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Card {i + 1}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => removeGridCard(i)} data-testid={`button-remove-card-${i}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Icon</Label>
                        <Input
                          value={card.icon}
                          onChange={(e) => updateGridCard(i, { icon: e.target.value })}
                          placeholder="e.g. history_edu"
                          data-testid={`input-card-icon-${i}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={card.label}
                          onChange={(e) => updateGridCard(i, { label: e.target.value })}
                          data-testid={`input-card-label-${i}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Link (href)</Label>
                        <Input
                          value={card.href}
                          onChange={(e) => updateGridCard(i, { href: e.target.value })}
                          data-testid={`input-card-href-${i}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={card.desc}
                          onChange={(e) => updateGridCard(i, { desc: e.target.value })}
                          data-testid={`input-card-desc-${i}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Compliance ───────────────────────────────────── */}
          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Note</CardTitle>
                <CardDescription>Small italic disclaimer shown at the bottom of the account page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label>Compliance Text</Label>
                <Textarea
                  rows={4}
                  value={form.compliance.text}
                  onChange={(e) => setCompliance(e.target.value)}
                  data-testid="textarea-compliance-text"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            size="lg"
            data-testid="button-save-settings-bottom"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
