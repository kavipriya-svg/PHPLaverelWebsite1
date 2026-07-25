import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, Plus, Trash2, Image, Type, AlignLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DataRow { label: string; value: string }
interface DogTreatsSettings {
  hero: {
    headline: string;
    subtitle: string;
    bgImageUrl: string;
    ctaText: string;
    ctaHref: string;
    locationTitle: string;
    locationSubtitle: string;
  };
  proteinLibrary: {
    visible: boolean;
    title: string;
    subtitle: string;
    parentCategorySlug: string;
  };
  wolfPrinciple: {
    visible: boolean;
    label: string;
    title: string;
    body: string;
    imageUrl: string;
    quoteSpecimenNo: string;
    quoteText: string;
    dataRows: DataRow[];
  };
  features: {
    visible: boolean;
    title: string;
    subtitle: string;
  };
  productSection: {
    visible: boolean;
    title: string;
    subtitle: string;
    categorySlug: string;
  };
  quoteBanner: {
    visible: boolean;
    text: string;
    subtext: string;
  };
  cta: {
    label: string;
    headline: string;
    body: string;
    ctaText: string;
    ctaHref: string;
  };
}

const DEFAULTS: DogTreatsSettings = {
  hero: {
    headline: "Feed the Wolf.",
    subtitle: "19 DOGS is species-appropriate, human-grade, whole-prey nutrition. Designed for the domestic athlete.",
    bgImageUrl: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=1920",
    ctaText: "Shop Wild & Exotic Range",
    ctaHref: "/shop",
    locationTitle: "Current Expedition",
    locationSubtitle: "Boreal Forest, Canada",
  },
  proteinLibrary: {
    visible: true,
    title: "The Protein Library",
    subtitle: "A comprehensive index of biological fuel sources, categorized by species and nutrient density.",
    parentCategorySlug: "wild-treats",
  },
  wolfPrinciple: {
    visible: true,
    label: "Foundational Biology",
    title: "The Wolf Principle.",
    body: "Despite centuries of domestication, the canine digestive system remains 99.9% genetically identical to its wild ancestor. They aren't designed for starch and processed grains; they demand the nutrient density found only in whole-prey protein.",
    imageUrl: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&q=80&w=900",
    quoteSpecimenNo: "Specimen No. 042",
    quoteText: "Optimal health is a byproduct of biological honesty.",
    dataRows: [
      { label: "Genetic Divergence", value: "0.1% Total" },
      { label: "Protein Bioavailability", value: "High-Grade (Prey)" },
      { label: "Enzymatic Activity", value: "Protease Focused" },
    ],
  },
  features: {
    visible: true,
    title: "What Makes Our Food Different",
    subtitle: "Precision engineering meets raw nature. Every ingredient is selected for its molecular contribution to canine vitality.",
  },
  productSection: {
    visible: true,
    title: "The Wild & Exotic Protein Portfolio",
    subtitle: "A curated collection of dehydrated specimen, preserved at the peak of nutritional integrity.",
    categorySlug: "wild-treats",
  },
  quoteBanner: {
    visible: true,
    text: "No single protein does it all — that's why we don't rely on just one.",
    subtext: "Biological Diversity is Key",
  },
  cta: {
    label: "Join the Movement",
    headline: "Join the Wolf Pet Movement.",
    body: "Ready to transition your dog to biological precision? Start with our introductory specimen pack.",
    ctaText: "Shop Now",
    ctaHref: "/shop",
  },
};

function deepMerge(defaults: any, overrides: any): any {
  if (!overrides || typeof overrides !== "object") return defaults;
  const result = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (key in overrides) {
      if (Array.isArray(defaults[key])) {
        result[key] = overrides[key] ?? defaults[key];
      } else if (typeof defaults[key] === "object" && defaults[key] !== null) {
        result[key] = deepMerge(defaults[key], overrides[key]);
      } else {
        result[key] = overrides[key] ?? defaults[key];
      }
    }
  }
  return result;
}

export default function DogTreatsPageSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<DogTreatsSettings>(DEFAULTS);
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery<{ settings: Partial<DogTreatsSettings> }>({
    queryKey: ["/api/settings/dog-treats-page"],
  });

  // Fetch all categories so we can show child categories live in Protein Library tab
  const { data: allCatsData } = useQuery<{ categories: any[] }>({
    queryKey: ["/api/categories"],
  });

  // The API returns a nested tree — flatten it for easy filtering
  function flattenCatTree(nodes: any[]): any[] {
    const result: any[] = [];
    for (const node of nodes) {
      result.push(node);
      if (node.children?.length) result.push(...flattenCatTree(node.children));
    }
    return result;
  }
  const allCats: any[] = flattenCatTree(allCatsData?.categories ?? []);

  useEffect(() => {
    if (data?.settings) {
      setSettings(deepMerge(DEFAULTS, data.settings) as DogTreatsSettings);
      setDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (s: DogTreatsSettings) => apiRequest("PUT", "/api/settings/dog-treats-page", s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/dog-treats-page"] });
      toast({ title: "Settings saved" });
      setDirty(false);
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  function set<S extends keyof DogTreatsSettings>(section: S, key: keyof DogTreatsSettings[S], value: any) {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
    setDirty(true);
  }

  function setDataRow(idx: number, field: keyof DataRow, value: string) {
    const rows = [...settings.wolfPrinciple.dataRows];
    rows[idx] = { ...rows[idx], [field]: value };
    setSettings(prev => ({ ...prev, wolfPrinciple: { ...prev.wolfPrinciple, dataRows: rows } }));
    setDirty(true);
  }

  function addDataRow() {
    const rows = [...settings.wolfPrinciple.dataRows, { label: "", value: "" }];
    setSettings(prev => ({ ...prev, wolfPrinciple: { ...prev.wolfPrinciple, dataRows: rows } }));
    setDirty(true);
  }

  function removeDataRow(idx: number) {
    const rows = settings.wolfPrinciple.dataRows.filter((_, i) => i !== idx);
    setSettings(prev => ({ ...prev, wolfPrinciple: { ...prev.wolfPrinciple, dataRows: rows } }));
    setDirty(true);
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dog Treats Page Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Control every section of the /dogtreat editorial landing page.
            </p>
          </div>
          <Button
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending || !dirty}
            data-testid="btn-save-settings"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="hero">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="hero" data-testid="tab-hero">Hero</TabsTrigger>
            <TabsTrigger value="protein" data-testid="tab-protein">Protein Library</TabsTrigger>
            <TabsTrigger value="wolf" data-testid="tab-wolf">Wolf Principle</TabsTrigger>
            <TabsTrigger value="features" data-testid="tab-features">Features</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="quote" data-testid="tab-quote">Quote Banner</TabsTrigger>
            <TabsTrigger value="cta" data-testid="tab-cta">CTA Section</TabsTrigger>
          </TabsList>

          {/* ── HERO ──────────────────────────────────────────────────────── */}
          <TabsContent value="hero" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Type className="h-4 w-4" />Hero Section</CardTitle>
                <CardDescription>Full-screen editorial hero banner at the top of the page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Headline</Label>
                  <Input
                    value={settings.hero.headline}
                    onChange={e => set("hero", "headline", e.target.value)}
                    placeholder="Feed the Wolf."
                    data-testid="input-hero-headline"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Subtitle</Label>
                  <Textarea
                    value={settings.hero.subtitle}
                    onChange={e => set("hero", "subtitle", e.target.value)}
                    rows={2}
                    data-testid="input-hero-subtitle"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2"><Image className="h-3.5 w-3.5" />Background Image URL</Label>
                  <Input
                    value={settings.hero.bgImageUrl}
                    onChange={e => set("hero", "bgImageUrl", e.target.value)}
                    placeholder="https://…"
                    data-testid="input-hero-bg"
                  />
                  {settings.hero.bgImageUrl && (
                    <div className="w-full rounded-sm overflow-hidden mt-2" style={{ maxHeight: 140 }}>
                      <img src={settings.hero.bgImageUrl} alt="" className="w-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>CTA Button Text</Label>
                    <Input value={settings.hero.ctaText} onChange={e => set("hero", "ctaText", e.target.value)} data-testid="input-hero-cta-text" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CTA Button Link</Label>
                    <Input value={settings.hero.ctaHref} onChange={e => set("hero", "ctaHref", e.target.value)} placeholder="/shop" data-testid="input-hero-cta-href" />
                  </div>
                </div>
                <Separator />
                <p className="text-sm font-medium">Location Tag (bottom-right corner)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Tag Title</Label>
                    <Input value={settings.hero.locationTitle} onChange={e => set("hero", "locationTitle", e.target.value)} data-testid="input-location-title" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tag Subtitle</Label>
                    <Input value={settings.hero.locationSubtitle} onChange={e => set("hero", "locationSubtitle", e.target.value)} data-testid="input-location-subtitle" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PROTEIN LIBRARY ───────────────────────────────────────────── */}
          <TabsContent value="protein" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlignLeft className="h-4 w-4" />Protein Library Section</CardTitle>
                <CardDescription>The circular specimen grid showing protein sources.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.proteinLibrary.visible}
                    onCheckedChange={v => set("proteinLibrary", "visible", v)}
                    data-testid="switch-protein-visible"
                  />
                  <Label>Show Protein Library section</Label>
                </div>
                <div className="space-y-1.5">
                  <Label>Section Title</Label>
                  <Input value={settings.proteinLibrary.title} onChange={e => set("proteinLibrary", "title", e.target.value)} data-testid="input-protein-title" />
                </div>
                <div className="space-y-1.5">
                  <Label>Section Subtitle</Label>
                  <Textarea value={settings.proteinLibrary.subtitle} onChange={e => set("proteinLibrary", "subtitle", e.target.value)} rows={2} data-testid="input-protein-subtitle" />
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label>Parent Category Slug</Label>
                  <p className="text-xs text-muted-foreground">
                    Child categories of this category will appear as clickable specimen circles. Create sub-categories under this parent in the Categories section.
                  </p>
                  <Input
                    value={settings.proteinLibrary.parentCategorySlug}
                    onChange={e => set("proteinLibrary", "parentCategorySlug", e.target.value)}
                    placeholder="wild-treats"
                    data-testid="input-protein-parent-slug"
                  />
                </div>

                {/* Live preview of detected child categories */}
                {(() => {
                  const parentSlug = settings.proteinLibrary.parentCategorySlug || "wild-treats";
                  const parentCat = allCats.find((c: any) => c.slug === parentSlug);
                  const children = parentCat
                    ? allCats.filter((c: any) => c.parentId === parentCat.id && c.isActive !== false)
                    : [];
                  return (
                    <div className="rounded-md border p-4 space-y-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          Detected Specimen Categories
                          {parentCat ? (
                            <span className="ml-2 text-xs text-muted-foreground font-normal">under "{parentCat.name}"</span>
                          ) : (
                            <span className="ml-2 text-xs text-destructive font-normal">— category "{parentSlug}" not found</span>
                          )}
                        </p>
                        <span className="text-xs text-muted-foreground">{children.length} found</span>
                      </div>
                      {children.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {children.map((c: any) => (
                            <div key={c.id} className="flex items-center gap-3 p-2 rounded-md bg-background border">
                              <div className="w-10 h-10 rounded-full overflow-hidden border flex-shrink-0 bg-muted">
                                {c.imageUrl ? (
                                  <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Image className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{c.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{c.slug}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No child categories found. Go to <strong>Products → Categories</strong> and add categories with the parent set to "{parentSlug}". Each child will appear as a specimen circle with its category image.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── WOLF PRINCIPLE ────────────────────────────────────────────── */}
          <TabsContent value="wolf" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Wolf Principle Section</CardTitle>
                <CardDescription>The editorial split-column biology section with image.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.wolfPrinciple.visible}
                    onCheckedChange={v => set("wolfPrinciple", "visible", v)}
                    data-testid="switch-wolf-visible"
                  />
                  <Label>Show Wolf Principle section</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Section Label (eyebrow)</Label>
                    <Input value={settings.wolfPrinciple.label} onChange={e => set("wolfPrinciple", "label", e.target.value)} data-testid="input-wolf-label" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input value={settings.wolfPrinciple.title} onChange={e => set("wolfPrinciple", "title", e.target.value)} data-testid="input-wolf-title" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Body Text</Label>
                  <Textarea value={settings.wolfPrinciple.body} onChange={e => set("wolfPrinciple", "body", e.target.value)} rows={3} data-testid="input-wolf-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2"><Image className="h-3.5 w-3.5" />Image URL</Label>
                  <Input value={settings.wolfPrinciple.imageUrl} onChange={e => set("wolfPrinciple", "imageUrl", e.target.value)} placeholder="https://…" data-testid="input-wolf-image" />
                  {settings.wolfPrinciple.imageUrl && (
                    <div className="w-40 rounded-sm overflow-hidden mt-2">
                      <img src={settings.wolfPrinciple.imageUrl} alt="" className="w-full object-cover" style={{ aspectRatio: "4/5" }} />
                    </div>
                  )}
                </div>
                <Separator />
                <p className="text-sm font-medium">Pull Quote (overlaid on image)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Specimen Label</Label>
                    <Input value={settings.wolfPrinciple.quoteSpecimenNo} onChange={e => set("wolfPrinciple", "quoteSpecimenNo", e.target.value)} placeholder="Specimen No. 042" data-testid="input-wolf-specimen" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Quote Text</Label>
                    <Input value={settings.wolfPrinciple.quoteText} onChange={e => set("wolfPrinciple", "quoteText", e.target.value)} data-testid="input-wolf-quote" />
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Data Rows</p>
                    <Button type="button" size="sm" variant="outline" onClick={addDataRow} data-testid="btn-add-row">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />Add Row
                    </Button>
                  </div>
                  {settings.wolfPrinciple.dataRows.map((row, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex-1 space-y-1.5">
                        <Input value={row.label} onChange={e => setDataRow(i, "label", e.target.value)} placeholder="Label" data-testid={`input-row-label-${i}`} />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Input value={row.value} onChange={e => setDataRow(i, "value", e.target.value)} placeholder="Value" data-testid={`input-row-value-${i}`} />
                      </div>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeDataRow(i)} className="mt-0.5" data-testid={`btn-remove-row-${i}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── FEATURES ──────────────────────────────────────────────────── */}
          <TabsContent value="features" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Features Section</CardTitle>
                <CardDescription>The 4-card differentiation grid ("What Makes Our Food Different").</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.features.visible}
                    onCheckedChange={v => set("features", "visible", v)}
                    data-testid="switch-features-visible"
                  />
                  <Label>Show Features section</Label>
                </div>
                <div className="space-y-1.5">
                  <Label>Section Title</Label>
                  <Input value={settings.features.title} onChange={e => set("features", "title", e.target.value)} data-testid="input-features-title" />
                </div>
                <div className="space-y-1.5">
                  <Label>Section Subtitle</Label>
                  <Textarea value={settings.features.subtitle} onChange={e => set("features", "subtitle", e.target.value)} rows={2} data-testid="input-features-subtitle" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PRODUCTS ──────────────────────────────────────────────────── */}
          <TabsContent value="products" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Portfolio Section</CardTitle>
                <CardDescription>Products are pulled from the specified category slug (default: wild-treats).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.productSection.visible}
                    onCheckedChange={v => set("productSection", "visible", v)}
                    data-testid="switch-products-visible"
                  />
                  <Label>Show Product Portfolio section</Label>
                </div>
                <div className="space-y-1.5">
                  <Label>Section Title</Label>
                  <Input value={settings.productSection.title} onChange={e => set("productSection", "title", e.target.value)} data-testid="input-products-title" />
                </div>
                <div className="space-y-1.5">
                  <Label>Section Subtitle</Label>
                  <Textarea value={settings.productSection.subtitle} onChange={e => set("productSection", "subtitle", e.target.value)} rows={2} data-testid="input-products-subtitle" />
                </div>
                <div className="space-y-1.5">
                  <Label>Category Slug</Label>
                  <Input
                    value={settings.productSection.categorySlug}
                    onChange={e => set("productSection", "categorySlug", e.target.value)}
                    placeholder="wild-treats"
                    data-testid="input-products-category-slug"
                  />
                  <p className="text-xs text-muted-foreground">Products in this category will automatically appear on the page. Default: <code>wild-treats</code></p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── QUOTE BANNER ──────────────────────────────────────────────── */}
          <TabsContent value="quote" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Quote Banner</CardTitle>
                <CardDescription>Full-width dark green banner with a large italic quote.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.quoteBanner.visible}
                    onCheckedChange={v => set("quoteBanner", "visible", v)}
                    data-testid="switch-quote-visible"
                  />
                  <Label>Show Quote Banner</Label>
                </div>
                <div className="space-y-1.5">
                  <Label>Quote Text</Label>
                  <Textarea value={settings.quoteBanner.text} onChange={e => set("quoteBanner", "text", e.target.value)} rows={2} data-testid="input-quote-text" />
                </div>
                <div className="space-y-1.5">
                  <Label>Subtext (all caps label below)</Label>
                  <Input value={settings.quoteBanner.subtext} onChange={e => set("quoteBanner", "subtext", e.target.value)} data-testid="input-quote-subtext" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── CTA SECTION ───────────────────────────────────────────────── */}
          <TabsContent value="cta" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>CTA / Newsletter Section</CardTitle>
                <CardDescription>The "Join the Pack" section at the bottom of the page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Label (eyebrow)</Label>
                  <Input value={settings.cta.label} onChange={e => set("cta", "label", e.target.value)} data-testid="input-cta-label" />
                </div>
                <div className="space-y-1.5">
                  <Label>Headline</Label>
                  <Input value={settings.cta.headline} onChange={e => set("cta", "headline", e.target.value)} data-testid="input-cta-headline" />
                </div>
                <div className="space-y-1.5">
                  <Label>Body Text</Label>
                  <Textarea value={settings.cta.body} onChange={e => set("cta", "body", e.target.value)} rows={2} data-testid="input-cta-body" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>CTA Button Text</Label>
                    <Input value={settings.cta.ctaText} onChange={e => set("cta", "ctaText", e.target.value)} data-testid="input-cta-btn-text" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CTA Button Link</Label>
                    <Input value={settings.cta.ctaHref} onChange={e => set("cta", "ctaHref", e.target.value)} placeholder="/shop" data-testid="input-cta-btn-href" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending || !dirty}
            data-testid="btn-save-bottom"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
