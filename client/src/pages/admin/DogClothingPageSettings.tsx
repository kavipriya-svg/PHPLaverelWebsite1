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
import { Save, Loader2, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";

// ─── Settings shape ───────────────────────────────────────────────────────────
interface DogClothingSettings {
  hero: {
    collectionTag: string;
    headline: string;
    subtitle: string;
    bgImageUrl: string;
    cta1Text: string;
    cta1Href: string;
    cta2Text: string;
    cta2Href: string;
  };
  productSection: {
    visible: boolean;
    categorySlug: string;
    productsPerGrid: number;
  };
  bioAdvantage: {
    visible: boolean;
    label: string;
    headline: string;
    body: string;
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
    stat3Value: string;
    stat3Label: string;
    labQuote: string;
    labRef: string;
  };
  testimonials: {
    visible: boolean;
    sectionLabel: string;
  };
}

const DEFAULTS: DogClothingSettings = {
  hero: {
    collectionTag: "THE TWINNING COLLECTION // SERIES 02",
    headline: "CLINICAL SYNC:\nSERIES 02",
    subtitle: "Biological precision engineered for the modern urban environment. An intersection of high-fashion and veterinary-grade textile science.",
    bgImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVK1uXW2CxSKwmil4f_r_viweyqyByCV6tHPfJM5PdzCnZUYGWkqlS3j10VzcQreKbB9M4RoEHqENmZyEU9FjggvpJYMQ1x89bq5TdSTXpkubarXbQtHRpXRut_dyZyOrZsOpShXbkJ4wvzLkjG4hidGFP_23X6PgxJSK59fecSzHDhksuD5D_rQF5u_kY7Tv25SGW-j_Gm9ZMrCZDfjg7_WBso6tRiZ-KRExwPSwy3Ypb4s1YmUMS5I7tb9qZt7QwIEJvnEiEbnYu",
    cta1Text: "Explore Dossier",
    cta1Href: "#collection",
    cta2Text: "Technical Specs",
    cta2Href: "#",
  },
  productSection: {
    visible: true,
    categorySlug: "clothing",
    productsPerGrid: 3,
  },
  bioAdvantage: {
    visible: true,
    label: "BIOLOGICAL ADVANTAGE // DATA LOG 04",
    headline: "GRAPHENE-INFUSED HEAT DISTRIBUTION",
    body: "Traditional canine textiles fail at regulating micro-climates. Our patented Graphene-Sync technology utilises hexagonal carbon lattices to redistribute excess heat from the core to the extremities, maintaining a clinical 38.5°C homeostasis even in sub-zero urban environments.",
    stat1Value: "22%",
    stat1Label: "CORE STABILITY INCREASE",
    stat2Value: "0.4mm",
    stat2Label: "MATERIAL THICKNESS",
    stat3Value: "38.5°C",
    stat3Label: "TARGET HOMEOSTASIS",
    labQuote: "\"The specimen showed no signs of thermal stress during the 60-minute exposure to wind chill factor -12. Textile integrity remains 100% after modular attachment cycles.\"",
    labRef: "REF: VET-TECH-S2",
  },
  testimonials: {
    visible: true,
    sectionLabel: "TESTIMONIAL ARCHIVE // SUBJECT FEEDBACK",
  },
};

function deepMerge(base: any, overrides: any): any {
  if (!overrides) return base;
  const result = { ...base };
  for (const key in overrides) {
    if (overrides[key] !== null && typeof overrides[key] === "object" && !Array.isArray(overrides[key]) && typeof base[key] === "object") {
      result[key] = deepMerge(base[key], overrides[key]);
    } else if (overrides[key] !== undefined) {
      result[key] = overrides[key];
    }
  }
  return result;
}

export default function DogClothingPageSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<DogClothingSettings>(DEFAULTS);
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery<{ settings: any }>({
    queryKey: ["/api/settings/dog-clothing-page"],
  });

  useEffect(() => {
    if (data?.settings) {
      setSettings(deepMerge(DEFAULTS, data.settings));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (s: DogClothingSettings) => apiRequest("PUT", "/api/settings/dog-clothing-page", s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/dog-clothing-page"] });
      toast({ title: "Settings saved" });
      setDirty(false);
    },
    onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
  });

  function set<S extends keyof DogClothingSettings>(section: S, field: keyof DogClothingSettings[S], value: any) {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
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
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dog Clothing Page</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Control every section of the <code className="text-xs bg-muted px-1 py-0.5 rounded">/category/clothing</code> editorial page.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/category/clothing" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Preview Page
              </Button>
            </a>
            <Button
              onClick={() => saveMutation.mutate(settings)}
              disabled={saveMutation.isPending || !dirty}
              data-testid="btn-save-settings"
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="hero">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="hero">Hero Banner</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="bio">Bio Advantage</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          </TabsList>

          {/* ── HERO ── */}
          <TabsContent value="hero" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Hero Banner</CardTitle>
                <CardDescription>Full-screen editorial hero at the top of the page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Collection Tag <span className="text-muted-foreground font-normal text-xs">(small text above headline)</span></Label>
                  <Input value={settings.hero.collectionTag} onChange={e => set("hero","collectionTag",e.target.value)} data-testid="input-collection-tag" />
                </div>
                <div className="space-y-1.5">
                  <Label>Headline</Label>
                  <Textarea value={settings.hero.headline} onChange={e => set("hero","headline",e.target.value)} rows={2} data-testid="input-headline" />
                </div>
                <div className="space-y-1.5">
                  <Label>Subtitle</Label>
                  <Textarea value={settings.hero.subtitle} onChange={e => set("hero","subtitle",e.target.value)} rows={2} data-testid="input-subtitle" />
                </div>
                <div className="space-y-1.5">
                  <Label>Background Image URL</Label>
                  <Input value={settings.hero.bgImageUrl} onChange={e => set("hero","bgImageUrl",e.target.value)} placeholder="https://…" data-testid="input-bg-image" />
                  {settings.hero.bgImageUrl && (
                    <img src={settings.hero.bgImageUrl} alt="hero preview" className="mt-2 w-full max-h-40 object-cover rounded-md" />
                  )}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>CTA 1 Text</Label>
                    <Input value={settings.hero.cta1Text} onChange={e => set("hero","cta1Text",e.target.value)} data-testid="input-cta1-text" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CTA 1 Link</Label>
                    <Input value={settings.hero.cta1Href} onChange={e => set("hero","cta1Href",e.target.value)} data-testid="input-cta1-href" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CTA 2 Text</Label>
                    <Input value={settings.hero.cta2Text} onChange={e => set("hero","cta2Text",e.target.value)} data-testid="input-cta2-text" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CTA 2 Link</Label>
                    <Input value={settings.hero.cta2Href} onChange={e => set("hero","cta2Href",e.target.value)} data-testid="input-cta2-href" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PRODUCTS ── */}
          <TabsContent value="products" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Section</CardTitle>
                <CardDescription>
                  Products are automatically pulled from the category you specify. Upload products in the Products module and assign them to that category.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.productSection.visible}
                    onCheckedChange={v => set("productSection","visible",v)}
                    data-testid="switch-products-visible"
                  />
                  <Label>Show product grids</Label>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label>Category Slug</Label>
                  <Input
                    value={settings.productSection.categorySlug}
                    onChange={e => set("productSection","categorySlug",e.target.value)}
                    placeholder="clothing"
                    data-testid="input-category-slug"
                  />
                  <p className="text-xs text-muted-foreground">
                    Any product assigned to this category (or its sub-categories) will appear on this page. Default: <code className="text-xs">clothing</code>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Products per grid row <span className="text-muted-foreground font-normal text-xs">(max 3 per grid section)</span></Label>
                  <Input
                    type="number"
                    min={1} max={6}
                    value={settings.productSection.productsPerGrid}
                    onChange={e => set("productSection","productsPerGrid",parseInt(e.target.value)||3)}
                    data-testid="input-products-per-grid"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── BIO ADVANTAGE ── */}
          <TabsContent value="bio" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Biological Advantage Section</CardTitle>
                <CardDescription>Dark green editorial break section between the two product grids.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.bioAdvantage.visible}
                    onCheckedChange={v => set("bioAdvantage","visible",v)}
                    data-testid="switch-bio-visible"
                  />
                  <Label>Show this section</Label>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label>Section Label <span className="text-muted-foreground font-normal text-xs">(small caps text)</span></Label>
                  <Input value={settings.bioAdvantage.label} onChange={e => set("bioAdvantage","label",e.target.value)} data-testid="input-bio-label" />
                </div>
                <div className="space-y-1.5">
                  <Label>Headline</Label>
                  <Input value={settings.bioAdvantage.headline} onChange={e => set("bioAdvantage","headline",e.target.value)} data-testid="input-bio-headline" />
                </div>
                <div className="space-y-1.5">
                  <Label>Body Text</Label>
                  <Textarea value={settings.bioAdvantage.body} onChange={e => set("bioAdvantage","body",e.target.value)} rows={4} data-testid="input-bio-body" />
                </div>
                <Separator />
                <p className="text-sm font-medium">Stats (3 key figures)</p>
                <div className="grid grid-cols-3 gap-4">
                  {(["1","2","3"] as const).map(n => (
                    <div key={n} className="space-y-2">
                      <Label className="text-xs">Stat {n} Value</Label>
                      <Input value={(settings.bioAdvantage as any)[`stat${n}Value`]} onChange={e => set("bioAdvantage",`stat${n}Value` as any,e.target.value)} data-testid={`input-stat${n}-value`} />
                      <Label className="text-xs">Stat {n} Label</Label>
                      <Input value={(settings.bioAdvantage as any)[`stat${n}Label`]} onChange={e => set("bioAdvantage",`stat${n}Label` as any,e.target.value)} data-testid={`input-stat${n}-label`} />
                    </div>
                  ))}
                </div>
                <Separator />
                <p className="text-sm font-medium">Lab Notes Card</p>
                <div className="space-y-1.5">
                  <Label>Lab Quote</Label>
                  <Textarea value={settings.bioAdvantage.labQuote} onChange={e => set("bioAdvantage","labQuote",e.target.value)} rows={3} data-testid="input-lab-quote" />
                </div>
                <div className="space-y-1.5">
                  <Label>Lab Reference</Label>
                  <Input value={settings.bioAdvantage.labRef} onChange={e => set("bioAdvantage","labRef",e.target.value)} placeholder="REF: VET-TECH-S2" data-testid="input-lab-ref" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TESTIMONIALS ── */}
          <TabsContent value="testimonials" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Testimonials Section</CardTitle>
                <CardDescription>
                  Editorial subject testimonials shown below the second product grid. Manage individual entries in{" "}
                  <a href="/admin/dog-clothing-testimonials" className="underline text-primary">Dog Clothing → Testimonials</a>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.testimonials.visible}
                    onCheckedChange={v => set("testimonials","visible",v)}
                    data-testid="switch-testimonials-visible"
                  />
                  <Label>Show testimonials section</Label>
                </div>
                <div className="space-y-1.5">
                  <Label>Section Label</Label>
                  <Input value={settings.testimonials.sectionLabel} onChange={e => set("testimonials","sectionLabel",e.target.value)} data-testid="input-testimonials-label" />
                </div>
                <div className="pt-2">
                  <a href="/admin/dog-clothing-testimonials">
                    <Button variant="outline" size="sm" data-testid="btn-manage-testimonials">
                      Manage Testimonials →
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
