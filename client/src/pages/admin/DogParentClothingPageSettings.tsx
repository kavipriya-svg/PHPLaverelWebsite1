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

interface DogParentClothingSettings {
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
  molecularSection: {
    visible: boolean;
    label: string;
    headline: string;
    body: string;
    feature1Title: string;
    feature1Body: string;
    feature2Title: string;
    feature2Body: string;
    feature3Title: string;
    feature3Body: string;
    imageUrl: string;
  };
  fieldLogs: {
    visible: boolean;
    sectionLabel: string;
  };
  neuralBridge: {
    visible: boolean;
    label: string;
    headline: string;
    body: string;
    ctaText: string;
    ctaHref: string;
    imageUrl: string;
  };
}

const DEFAULTS: DogParentClothingSettings = {
  hero: {
    collectionTag: "THE TWINNING COLLECTION // SERIES 02",
    headline: "BIOLOGICAL\nSYNCHRONIZATION",
    subtitle: "Precision-engineered twinning wear for you and your dog. Where human fashion meets veterinary textile science.",
    bgImageUrl: "",
    cta1Text: "Explore Collection",
    cta1Href: "#collection",
    cta2Text: "View Data Sheet",
    cta2Href: "#",
  },
  productSection: {
    visible: true,
    categorySlug: "dog-parent-clothing",
    productsPerGrid: 4,
  },
  molecularSection: {
    visible: true,
    label: "MOLECULAR PRECISION // DATA LOG 07",
    headline: "ENGINEERED FOR PERFECT SYNC",
    body: "Every fibre calibrated for dual-species compatibility. Our BioSync technology analyses the micro-climate between human and canine body heat to produce textiles that perform identically across species.",
    feature1Title: "Thermal Equilibrium",
    feature1Body: "Dual-layered carbon lattice distributes heat symmetrically across both specimens.",
    feature2Title: "Movement Sync",
    feature2Body: "4-directional stretch matrix adapts to bipedal and quadrupedal locomotion patterns.",
    feature3Title: "Chromatic Bonding",
    feature3Body: "Colourfast nano-dye process ensures identical hue rendering across both garments.",
    imageUrl: "",
  },
  fieldLogs: {
    visible: true,
    sectionLabel: "FIELD LOGS // SUBJECT FEEDBACK",
  },
  neuralBridge: {
    visible: true,
    label: "NEURAL BRIDGE // SERIES 03",
    headline: "THE BOND IS THE UNIFORM",
    body: "When two species share identical textile infrastructure, the psychological synchronisation is measurable. Neural Bridge Series 03 — the apex of the Twinning Collection.",
    ctaText: "Apply for Field Access",
    ctaHref: "#",
    imageUrl: "",
  },
};

function deepMerge(defaults: any, overrides: any): any {
  const result = { ...defaults };
  for (const key of Object.keys(overrides ?? {})) {
    if (typeof defaults[key] === "object" && !Array.isArray(defaults[key]) && overrides[key]) {
      result[key] = deepMerge(defaults[key], overrides[key]);
    } else if (overrides[key] !== undefined) {
      result[key] = overrides[key];
    }
  }
  return result;
}

export default function DogParentClothingPageSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState<DogParentClothingSettings>(DEFAULTS);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["/api/settings/dog-parent-clothing-page"],
  });

  useEffect(() => {
    if (raw && typeof raw === "object") {
      setForm(deepMerge(DEFAULTS, raw));
    }
  }, [raw]);

  const set = (section: keyof DogParentClothingSettings, field: string, value: any) => {
    setForm(prev => ({ ...prev, [section]: { ...(prev[section] as any), [field]: value } }));
  };

  const mutation = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/settings/dog-parent-clothing-page", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/dog-parent-clothing-page"] });
      toast({ title: "Settings saved" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  if (isLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">Dog Parent Clothing Page Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Controls the <code>/category/twinning</code> storefront page
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/category/twinning" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" /> Preview
              </a>
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} data-testid="button-save-settings">
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
          </div>
        </div>

        <Tabs defaultValue="hero">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="molecular">Molecular</TabsTrigger>
            <TabsTrigger value="fieldlogs">Field Logs</TabsTrigger>
            <TabsTrigger value="neural">Neural Bridge</TabsTrigger>
          </TabsList>

          {/* ── Hero ── */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Top full-bleed banner — Series 02 opener</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Collection Tag</Label>
                  <Input value={form.hero.collectionTag} onChange={e => set("hero", "collectionTag", e.target.value)} placeholder="THE TWINNING COLLECTION // SERIES 02" data-testid="input-hero-tag" />
                </div>
                <div className="space-y-2">
                  <Label>Headline (use \n for line break)</Label>
                  <Textarea value={form.hero.headline} onChange={e => set("hero", "headline", e.target.value)} rows={3} data-testid="input-hero-headline" />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Textarea value={form.hero.subtitle} onChange={e => set("hero", "subtitle", e.target.value)} rows={2} data-testid="input-hero-subtitle" />
                </div>
                <div className="space-y-2">
                  <Label>Background Image URL</Label>
                  <Input value={form.hero.bgImageUrl} onChange={e => set("hero", "bgImageUrl", e.target.value)} placeholder="https://..." data-testid="input-hero-bg" />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CTA 1 Text</Label>
                    <Input value={form.hero.cta1Text} onChange={e => set("hero", "cta1Text", e.target.value)} data-testid="input-cta1-text" />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA 1 URL</Label>
                    <Input value={form.hero.cta1Href} onChange={e => set("hero", "cta1Href", e.target.value)} data-testid="input-cta1-href" />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA 2 Text</Label>
                    <Input value={form.hero.cta2Text} onChange={e => set("hero", "cta2Text", e.target.value)} data-testid="input-cta2-text" />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA 2 URL</Label>
                    <Input value={form.hero.cta2Href} onChange={e => set("hero", "cta2Href", e.target.value)} data-testid="input-cta2-href" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Products ── */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Product Sections</CardTitle>
                <CardDescription>Controls the Series 02 &amp; Series 03 product grids</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch checked={form.productSection.visible} onCheckedChange={v => set("productSection", "visible", v)} data-testid="switch-products-visible" />
                  <Label>Show product grids</Label>
                </div>
                <div className="space-y-2">
                  <Label>Category Slug (filters products on this page)</Label>
                  <Input value={form.productSection.categorySlug} onChange={e => set("productSection", "categorySlug", e.target.value)} placeholder="dog-parent-clothing" data-testid="input-category-slug" />
                  <p className="text-xs text-muted-foreground">Products must have this sub-category slug to appear on the twinning page.</p>
                </div>
                <div className="space-y-2">
                  <Label>Products per grid (each grid)</Label>
                  <Input type="number" min={1} max={12} value={form.productSection.productsPerGrid} onChange={e => set("productSection", "productsPerGrid", Number(e.target.value))} data-testid="input-products-per-grid" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Molecular ── */}
          <TabsContent value="molecular">
            <Card>
              <CardHeader>
                <CardTitle>Molecular Precision Section</CardTitle>
                <CardDescription>Editorial break between the two product grids</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch checked={form.molecularSection.visible} onCheckedChange={v => set("molecularSection", "visible", v)} data-testid="switch-molecular-visible" />
                  <Label>Show section</Label>
                </div>
                <div className="space-y-2">
                  <Label>Section Label</Label>
                  <Input value={form.molecularSection.label} onChange={e => set("molecularSection", "label", e.target.value)} data-testid="input-molecular-label" />
                </div>
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input value={form.molecularSection.headline} onChange={e => set("molecularSection", "headline", e.target.value)} data-testid="input-molecular-headline" />
                </div>
                <div className="space-y-2">
                  <Label>Body Text</Label>
                  <Textarea value={form.molecularSection.body} onChange={e => set("molecularSection", "body", e.target.value)} rows={3} data-testid="input-molecular-body" />
                </div>
                <Separator />
                <p className="text-sm font-medium">Three Feature Points</p>
                {([1, 2, 3] as const).map(n => (
                  <div key={n} className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Feature {n} Title</Label>
                      <Input value={(form.molecularSection as any)[`feature${n}Title`]} onChange={e => set("molecularSection", `feature${n}Title`, e.target.value)} data-testid={`input-feature${n}-title`} />
                    </div>
                    <div className="space-y-1">
                      <Label>Feature {n} Body</Label>
                      <Input value={(form.molecularSection as any)[`feature${n}Body`]} onChange={e => set("molecularSection", `feature${n}Body`, e.target.value)} data-testid={`input-feature${n}-body`} />
                    </div>
                  </div>
                ))}
                <div className="space-y-2">
                  <Label>Section Image URL</Label>
                  <Input value={form.molecularSection.imageUrl} onChange={e => set("molecularSection", "imageUrl", e.target.value)} placeholder="https://..." data-testid="input-molecular-image" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Field Logs ── */}
          <TabsContent value="fieldlogs">
            <Card>
              <CardHeader>
                <CardTitle>Field Logs (Testimonials)</CardTitle>
                <CardDescription>Manage testimonial cards from the Testimonials admin page. Control section visibility here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch checked={form.fieldLogs.visible} onCheckedChange={v => set("fieldLogs", "visible", v)} data-testid="switch-fieldlogs-visible" />
                  <Label>Show Field Logs section</Label>
                </div>
                <div className="space-y-2">
                  <Label>Section Label</Label>
                  <Input value={form.fieldLogs.sectionLabel} onChange={e => set("fieldLogs", "sectionLabel", e.target.value)} data-testid="input-fieldlogs-label" />
                </div>
                <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                  Individual testimonial cards are managed under <strong>Dog Parent Clothing &gt; Testimonials</strong> in the sidebar.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Neural Bridge ── */}
          <TabsContent value="neural">
            <Card>
              <CardHeader>
                <CardTitle>Neural Bridge Highlight</CardTitle>
                <CardDescription>Dark full-width editorial feature section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch checked={form.neuralBridge.visible} onCheckedChange={v => set("neuralBridge", "visible", v)} data-testid="switch-neural-visible" />
                  <Label>Show section</Label>
                </div>
                <div className="space-y-2">
                  <Label>Section Label</Label>
                  <Input value={form.neuralBridge.label} onChange={e => set("neuralBridge", "label", e.target.value)} data-testid="input-neural-label" />
                </div>
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input value={form.neuralBridge.headline} onChange={e => set("neuralBridge", "headline", e.target.value)} data-testid="input-neural-headline" />
                </div>
                <div className="space-y-2">
                  <Label>Body Text</Label>
                  <Textarea value={form.neuralBridge.body} onChange={e => set("neuralBridge", "body", e.target.value)} rows={3} data-testid="input-neural-body" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CTA Text</Label>
                    <Input value={form.neuralBridge.ctaText} onChange={e => set("neuralBridge", "ctaText", e.target.value)} data-testid="input-neural-cta-text" />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA URL</Label>
                    <Input value={form.neuralBridge.ctaHref} onChange={e => set("neuralBridge", "ctaHref", e.target.value)} data-testid="input-neural-cta-href" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Section Image URL</Label>
                  <Input value={form.neuralBridge.imageUrl} onChange={e => set("neuralBridge", "imageUrl", e.target.value)} placeholder="https://..." data-testid="input-neural-image" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
