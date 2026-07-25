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
import {
  Save, Loader2, GripVertical, Plus, Trash2, Eye, EyeOff,
  Image, Type, AlignLeft, List, Film, Tag
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────
interface Check { title: string; desc: string }
interface BiryaniProduct { title: string; label: string; desc: string; imageUrl: string; ctaHref: string }
interface Spice { name: string; desc: string }

interface FullMealSettings {
  hero: { headline: string; subheadline: string; caption: string; ctaText: string; imageUrl: string };
  whyTheWolf: { visible: boolean; label: string; title: string; body: string; checks: Check[] };
  video1: { visible: boolean; label: string; title: string; imageUrl: string };
  wetFood: { title: string; subtitle: string };
  interstitialBanner: { visible: boolean; label: string; title: string; titleItalic: string; body: string; imageUrl: string };
  biryaniSection: { visible: boolean; title: string; body: string; spices: Spice[]; products: BiryaniProduct[] };
  video2: { visible: boolean; label: string; title: string; imageUrl: string };
  cta: { headline: string; headlineItalic: string; cta1Text: string; cta1Href: string; cta2Text: string; cta2Href: string };
  ticker: { items: string[] };
  productOrder: string[];
}

const DEFAULTS: FullMealSettings = {
  hero: {
    headline: "Every dog is a wolf at heart.",
    subheadline: "We cook for the wolf your dog still is — not the pet it's become.",
    caption: "Real meat. Real organs. Real meals.",
    ctaText: "Explore the Archive →",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFlghEMvULN5PqfyPTpkSOBINq1VXFIjwF8X6WEnfuJvmxmFCHIrIo2WMSkUgGh9vY_yUgzrbmFSkLrytAZcUqYk4M9tVUQmYv9bRv2yg9qdJosc3MC9DTyHzJYWJm2KmDEuDqOCAbMB_whlwjRiP-8MtzB6HwRlTmzeeo_HHBELbgFHFgh42aIMojv4maBbqmmPBqNba6Do5SuwSyX4fKSJhBJNj1eHVa8n_ZzZWL_MAQBhtGK6PtaS-4ohFDsw4mQx2XOvCkBgpk",
  },
  whyTheWolf: {
    visible: true, label: "BIOLOGICAL ANALYSIS", title: "Why the Wolf",
    body: "99% wolf DNA. Same teeth. Same short, acidic gut built for meat, not fillers. We just never stopped feeding it that way.",
    checks: [
      { title: "Whole meat + organ", desc: "Foundational biological nutrition in every recipe" },
      { title: "No synthetic fillers", desc: "Zero corn, wheat, or soy interference" },
      { title: "Absolute Purity", desc: "No artificial anything. Pure evolutionary fuel." },
      { title: "Precision Cooking", desc: "Gently cooked to preserve molecular integrity" },
    ],
  },
  video1: {
    visible: true, label: "CINEMATIC DOCUMENTARY", title: "The Wolf Inside: A Biological Study",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLvuz6wDqgllbWA8p2EssqY0zKgRvqveFpY7LpxnyUHP1_Dt00EhP_FEhvVaWckxcpAW40u8gA4jmYG0S_xU9rnoIJRK-aKucgmTABg-hPaa6AHQM9LmWFf_LqH7v9Lvb2Gy3BnohXYa6__3E9Q-DlM1geDw3gGOQiH7GCryB99H5pCA9jOGSwj5YIsGbnzBr_PtELQ0yOhXcM3Gohw7lGXGMM3lq1207s7yvRtukGXfUIe1hQhZZJbbA9hy",
  },
  wetFood: { title: "Wet Food Meals", subtitle: "Whole-animal meals. One protein. Nothing hiding in it." },
  interstitialBanner: {
    visible: true, label: "SPECIMEN ANALYSIS", title: "The Ancestral", titleItalic: "Plate",
    body: "Precisely balanced components. Every ingredient serves a biological imperative. No filler. No compromise.",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLuyl5EViKkGxOfraqcvJ1eWgvnPxiEm3nSPhnlSxEKqEV5f-Lp55MknwoBjO4CfGnFKvqrpIqfM2uXUdv5wxRz-A4NSQVGFnuDIqoEREa18FveczKF7kxE-cTJNnr__4qWn5_kmFAv0UFbS2ksV27z9hvvy167eRI948LUjIvmHwsTSCIDV6M8M2UgZYlo-7KLwZIT2SSOA6XDdO3QSQZk-XShiLJm_gXXNwnUOyf2Y_XBJOGXFdSM0cBuh",
  },
  biryaniSection: {
    visible: true, title: "The Biryani Collection",
    body: "Layered with the herbs and fats a wolf's diet was always missing. Every biryani is a synthesis of ancient spice and biological precision.",
    spices: [
      { name: "Turmeric", desc: "Anti-inflammatory synthesis for joint preservation and recovery." },
      { name: "Ashwagandha", desc: "Biological adaptogen for neural balance and stress mediation." },
      { name: "Coconut Oil", desc: "Molecular fat carrier for maximum botanical bioavailability." },
    ],
    products: [
      { title: "Mutton Biryani", label: "PREMIUM SELECTION", desc: "Rich, iron-dense, the closest thing to a wild feast.", imageUrl: "", ctaHref: "/shop" },
      { title: "Chicken Biryani", label: "DAILY FOUNDATION", desc: "Daily protein, feast-day flavor. Balanced nutrition meeting evolutionary cravings.", imageUrl: "", ctaHref: "/shop" },
    ],
  },
  video2: {
    visible: true, label: "LABORATORY INSIGHTS", title: "The Science of Synthesis",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnhcrOXDz9EYkl-E0ilJajSa-UkjCqCcZau4jufEeLe-_gqFN1vmeXvp9woooDLDjFWWBYqhXzoghABWWGQJxCq4EOazoanZ-Jhvrrh9oyx41es-1qNIo4rHwW3L_ysOyByfW9iC3G_EmYtQnemO5ufGpIJ28qN5Q_NEfD_K-rO3qp0xAydnfXOMOyPMXC087Bi_zXmCYL1hCMQeotQNOv0Xr7hzM6l1iVzm8eaUyZ5GezCZWwYreW8vsDde4jxCSWQP3hVyJt00K9",
  },
  cta: {
    headline: "Feed the Wolf", headlineItalic: "Inside Your Dog",
    cta1Text: "WET MEALS ARCHIVE →", cta1Href: "/shop",
    cta2Text: "BIRYANI COLLECTION →", cta2Href: "/shop",
  },
  ticker: {
    items: ["Biological Precision: 100% Traceable", "99% Wolf DNA Alignment", "Batch ID: #WOLF-2024-DELTA", "No Fillers. No Grains.", "Gently Cooked Synthesis", "Human-Grade Ingredients", "Vet-Formulated Recipes"],
  },
  productOrder: [],
};

function deepMerge(defaults: FullMealSettings, saved: Partial<FullMealSettings>): FullMealSettings {
  return {
    hero: { ...defaults.hero, ...(saved.hero || {}) },
    whyTheWolf: {
      ...defaults.whyTheWolf, ...(saved.whyTheWolf || {}),
      checks: saved.whyTheWolf?.checks?.length ? saved.whyTheWolf.checks : defaults.whyTheWolf.checks,
    },
    video1: { ...defaults.video1, ...(saved.video1 || {}) },
    wetFood: { ...defaults.wetFood, ...(saved.wetFood || {}) },
    interstitialBanner: { ...defaults.interstitialBanner, ...(saved.interstitialBanner || {}) },
    biryaniSection: {
      ...defaults.biryaniSection, ...(saved.biryaniSection || {}),
      spices: saved.biryaniSection?.spices?.length ? saved.biryaniSection.spices : defaults.biryaniSection.spices,
      products: saved.biryaniSection?.products?.length ? saved.biryaniSection.products : defaults.biryaniSection.products,
    },
    video2: { ...defaults.video2, ...(saved.video2 || {}) },
    cta: { ...defaults.cta, ...(saved.cta || {}) },
    ticker: { items: saved.ticker?.items?.length ? saved.ticker.items : defaults.ticker.items },
    productOrder: saved.productOrder || [],
  };
}

// ─── Drag-reorder list ────────────────────────────────────────────
function DraggableList<T>({
  items, renderItem, onReorder, keyFn,
}: {
  items: T[];
  renderItem: (item: T, i: number) => React.ReactNode;
  onReorder: (items: T[]) => void;
  keyFn: (item: T, i: number) => string;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  function handleDragStart(i: number) { setDragging(i); }
  function handleDragOver(e: React.DragEvent, i: number) { e.preventDefault(); setOver(i); }
  function handleDrop(i: number) {
    if (dragging === null || dragging === i) { setDragging(null); setOver(null); return; }
    const next = [...items];
    const [moved] = next.splice(dragging, 1);
    next.splice(i, 0, moved);
    onReorder(next);
    setDragging(null); setOver(null);
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={keyFn(item, i)}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDrop={() => handleDrop(i)}
          onDragEnd={() => { setDragging(null); setOver(null); }}
          className={`flex items-center gap-3 rounded-md border bg-card p-3 transition-all ${
            over === i ? "ring-2 ring-primary" : ""
          } ${dragging === i ? "opacity-50" : ""}`}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab" />
          <Badge variant="outline" className="text-xs font-mono w-8 flex-shrink-0 justify-center">
            {i + 1}
          </Badge>
          {renderItem(item, i)}
        </div>
      ))}
    </div>
  );
}

// ─── Section field helper ─────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Visibility toggle card ───────────────────────────────────────
function VisibilityCard({ label, visible, onToggle }: { label: string; visible: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-md border bg-card">
      <div className="flex items-center gap-3">
        {visible ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Switch checked={visible} onCheckedChange={onToggle} />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export default function FullMealPageSettings() {
  const { toast } = useToast();
  const [s, setS] = useState<FullMealSettings>(DEFAULTS);

  const { data, isLoading } = useQuery<{ settings: Partial<FullMealSettings> }>({
    queryKey: ["/api/settings/full-meal-page"],
  });

  const { data: productsData, isLoading: productsLoading } = useQuery<{ products: any[] }>({
    queryKey: ["/api/products?categorySlug=full-meals&limit=50"],
  });

  const fullMealsProducts = productsData?.products ?? [];

  useEffect(() => {
    if (data?.settings) setS(deepMerge(DEFAULTS, data.settings));
  }, [data]);

  // Sorted products for display — productOrder first, then the rest
  const orderedProducts = (() => {
    if (!fullMealsProducts.length) return [];
    const order = s.productOrder;
    if (!order.length) return fullMealsProducts;
    const map = new Map(fullMealsProducts.map((p) => [p.id, p]));
    const sorted = order.map((id) => map.get(id)).filter(Boolean) as any[];
    const rest = fullMealsProducts.filter((p) => !order.includes(p.id));
    return [...sorted, ...rest];
  })();

  const saveMutation = useMutation({
    mutationFn: async (settings: FullMealSettings) => {
      const res = await apiRequest("PUT", "/api/settings/full-meal-page", settings);
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/full-meal-page"] });
      toast({ title: "Full Meal page saved successfully" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  function patch<K extends keyof FullMealSettings>(key: K, val: Partial<FullMealSettings[K]>) {
    setS((prev) => ({ ...prev, [key]: { ...(prev[key] as object), ...val } }));
  }

  function handleProductReorder(products: any[]) {
    setS((prev) => ({ ...prev, productOrder: products.map((p) => p.id) }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Full Meal Page</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Control every section of the /full-meals editorial page.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <a href="/full-meals" target="_blank" rel="noopener noreferrer">Preview Page</a>
            </Button>
            <Button onClick={() => saveMutation.mutate(s)} disabled={saveMutation.isPending} data-testid="button-save-full-meal">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="flex-wrap h-auto gap-1 mb-2">
            <TabsTrigger value="products">Product Order</TabsTrigger>
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="biryani">Biryani</TabsTrigger>
            <TabsTrigger value="videos">Videos & Ticker</TabsTrigger>
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
          </TabsList>

          {/* ── Product Order Tab ─────────────────────────────── */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <List className="h-4 w-4" /> Product Position Tracker
                </CardTitle>
                <CardDescription>
                  Drag products to change their display order on the Full Meal page. Products from the
                  <strong> "Full Meals"</strong> sub-category appear here automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="flex items-center gap-2 py-4 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading products…
                  </div>
                ) : orderedProducts.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center border rounded-md bg-muted/30">
                    No products found in the "Full Meals" category.<br />
                    Add products and assign them to the "Full Meals" sub-category.
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-4">
                      {orderedProducts.length} product{orderedProducts.length !== 1 ? "s" : ""} · Drag to reorder
                    </p>
                    <DraggableList
                      items={orderedProducts}
                      keyFn={(p) => p.id}
                      onReorder={handleProductReorder}
                      renderItem={(product) => {
                        const imgs = product.images || product.productImages || [];
                        const primary = imgs.find((i: any) => i.isPrimary) || imgs[0];
                        const imgUrl = primary?.url || "";
                        return (
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded border bg-muted flex-shrink-0 overflow-hidden">
                              {imgUrl ? (
                                <img src={imgUrl} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center text-[10px] text-muted-foreground">IMG</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{product.title}</p>
                              <p className="text-xs text-muted-foreground">SKU: {product.sku} · ₹{product.salePrice || product.price}</p>
                            </div>
                            <Badge variant={product.isActive ? "default" : "secondary"} className="flex-shrink-0 text-xs">
                              {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        );
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-4">
                      Save to apply the new order to the live page.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Hero Tab ──────────────────────────────────────── */}
          <TabsContent value="hero" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Type className="h-4 w-4" /> Hero Banner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Headline">
                  <Input value={s.hero.headline} onChange={(e) => patch("hero", { headline: e.target.value })} placeholder="Every dog is a wolf at heart." />
                </Field>
                <Field label="Sub-headline">
                  <Textarea value={s.hero.subheadline} onChange={(e) => patch("hero", { subheadline: e.target.value })} rows={2} />
                </Field>
                <Field label="Caption (small text below sub-headline)">
                  <Input value={s.hero.caption} onChange={(e) => patch("hero", { caption: e.target.value })} />
                </Field>
                <Field label="CTA Button Text">
                  <Input value={s.hero.ctaText} onChange={(e) => patch("hero", { ctaText: e.target.value })} />
                </Field>
                <Field label="Background Image URL" hint="Use a full URL to a large landscape photo (min 1400px wide)">
                  <Input value={s.hero.imageUrl} onChange={(e) => patch("hero", { imageUrl: e.target.value })} placeholder="https://..." />
                  {s.hero.imageUrl && (
                    <img src={s.hero.imageUrl} alt="Hero preview" className="mt-2 h-28 w-full object-cover rounded border" />
                  )}
                </Field>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Sections Tab ──────────────────────────────────── */}
          <TabsContent value="sections" className="space-y-4">
            {/* Why the Wolf */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><AlignLeft className="h-4 w-4" /> "Why the Wolf" Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Section Label (small caps above title)">
                  <Input value={s.whyTheWolf.label} onChange={(e) => patch("whyTheWolf", { label: e.target.value })} />
                </Field>
                <Field label="Title">
                  <Input value={s.whyTheWolf.title} onChange={(e) => patch("whyTheWolf", { title: e.target.value })} />
                </Field>
                <Field label="Body Text">
                  <Textarea value={s.whyTheWolf.body} onChange={(e) => patch("whyTheWolf", { body: e.target.value })} rows={3} />
                </Field>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Checklist Items</Label>
                  <div className="space-y-3">
                    {s.whyTheWolf.checks.map((check, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start p-3 border rounded-md">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Title</Label>
                          <Input
                            value={check.title}
                            onChange={(e) => {
                              const checks = [...s.whyTheWolf.checks];
                              checks[i] = { ...checks[i], title: e.target.value };
                              patch("whyTheWolf", { checks });
                            }}
                            placeholder="Feature title"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
                          <Input
                            value={check.desc}
                            onChange={(e) => {
                              const checks = [...s.whyTheWolf.checks];
                              checks[i] = { ...checks[i], desc: e.target.value };
                              patch("whyTheWolf", { checks });
                            }}
                            placeholder="Short description"
                          />
                        </div>
                        <Button
                          size="icon" variant="ghost"
                          className="mt-5"
                          onClick={() => {
                            const checks = s.whyTheWolf.checks.filter((_, j) => j !== i);
                            patch("whyTheWolf", { checks });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline" size="sm"
                      onClick={() => patch("whyTheWolf", { checks: [...s.whyTheWolf.checks, { title: "", desc: "" }] })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Checklist Item
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wet Food section heading */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Wet Food Gallery Heading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Section Title">
                  <Input value={s.wetFood.title} onChange={(e) => patch("wetFood", { title: e.target.value })} />
                </Field>
                <Field label="Subtitle">
                  <Input value={s.wetFood.subtitle} onChange={(e) => patch("wetFood", { subtitle: e.target.value })} />
                </Field>
              </CardContent>
            </Card>

            {/* Interstitial Banner */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Image className="h-4 w-4" /> Interstitial Banner ("The Ancestral Plate")</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Label (small caps)">
                  <Input value={s.interstitialBanner.label} onChange={(e) => patch("interstitialBanner", { label: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Main Title">
                    <Input value={s.interstitialBanner.title} onChange={(e) => patch("interstitialBanner", { title: e.target.value })} />
                  </Field>
                  <Field label="Italic Word (2nd line)">
                    <Input value={s.interstitialBanner.titleItalic} onChange={(e) => patch("interstitialBanner", { titleItalic: e.target.value })} />
                  </Field>
                </div>
                <Field label="Body Text">
                  <Textarea value={s.interstitialBanner.body} onChange={(e) => patch("interstitialBanner", { body: e.target.value })} rows={2} />
                </Field>
                <Field label="Background Image URL">
                  <Input value={s.interstitialBanner.imageUrl} onChange={(e) => patch("interstitialBanner", { imageUrl: e.target.value })} placeholder="https://..." />
                  {s.interstitialBanner.imageUrl && (
                    <img src={s.interstitialBanner.imageUrl} alt="preview" className="mt-2 h-24 w-full object-cover rounded border" />
                  )}
                </Field>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <Card>
              <CardHeader><CardTitle className="text-base">Final CTA Section</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Main Headline">
                    <Input value={s.cta.headline} onChange={(e) => patch("cta", { headline: e.target.value })} />
                  </Field>
                  <Field label="Italic Sub-headline">
                    <Input value={s.cta.headlineItalic} onChange={(e) => patch("cta", { headlineItalic: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Button 1 Text">
                    <Input value={s.cta.cta1Text} onChange={(e) => patch("cta", { cta1Text: e.target.value })} />
                  </Field>
                  <Field label="Button 1 Link">
                    <Input value={s.cta.cta1Href} onChange={(e) => patch("cta", { cta1Href: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Button 2 Text">
                    <Input value={s.cta.cta2Text} onChange={(e) => patch("cta", { cta2Text: e.target.value })} />
                  </Field>
                  <Field label="Button 2 Link">
                    <Input value={s.cta.cta2Href} onChange={(e) => patch("cta", { cta2Href: e.target.value })} />
                  </Field>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Biryani Tab ───────────────────────────────────── */}
          <TabsContent value="biryani" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Biryani Collection Heading</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Section Title">
                  <Input value={s.biryaniSection.title} onChange={(e) => patch("biryaniSection", { title: e.target.value })} />
                </Field>
                <Field label="Section Body">
                  <Textarea value={s.biryaniSection.body} onChange={(e) => patch("biryaniSection", { body: e.target.value })} rows={3} />
                </Field>
              </CardContent>
            </Card>

            {/* Spice pillars */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Spice Feature Pillars</CardTitle>
                <CardDescription>Three info cards shown at the top of the dark green section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.biryaniSection.spices.map((spice, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1.5fr_auto] gap-2 items-start p-3 border rounded-md">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Name</Label>
                      <Input value={spice.name} onChange={(e) => {
                        const spices = [...s.biryaniSection.spices];
                        spices[i] = { ...spices[i], name: e.target.value };
                        patch("biryaniSection", { spices });
                      }} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
                      <Input value={spice.desc} onChange={(e) => {
                        const spices = [...s.biryaniSection.spices];
                        spices[i] = { ...spices[i], desc: e.target.value };
                        patch("biryaniSection", { spices });
                      }} />
                    </div>
                    <Button size="icon" variant="ghost" className="mt-5" onClick={() => {
                      patch("biryaniSection", { spices: s.biryaniSection.spices.filter((_, j) => j !== i) });
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => patch("biryaniSection", { spices: [...s.biryaniSection.spices, { name: "", desc: "" }] })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Spice
                </Button>
              </CardContent>
            </Card>

            {/* Biryani products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Biryani Products</CardTitle>
                <CardDescription>Showcase products in the dark editorial alternating layout</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {s.biryaniSection.products.map((prod, i) => (
                  <div key={i} className="p-4 border rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-xs">Product {i + 1}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => {
                        patch("biryaniSection", { products: s.biryaniSection.products.filter((_, j) => j !== i) });
                      }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Product Name">
                        <Input value={prod.title} onChange={(e) => {
                          const products = [...s.biryaniSection.products];
                          products[i] = { ...products[i], title: e.target.value };
                          patch("biryaniSection", { products });
                        }} />
                      </Field>
                      <Field label="Label (e.g. PREMIUM SELECTION)">
                        <Input value={prod.label} onChange={(e) => {
                          const products = [...s.biryaniSection.products];
                          products[i] = { ...products[i], label: e.target.value };
                          patch("biryaniSection", { products });
                        }} />
                      </Field>
                    </div>
                    <Field label="Description Quote">
                      <Textarea value={prod.desc} rows={2} onChange={(e) => {
                        const products = [...s.biryaniSection.products];
                        products[i] = { ...products[i], desc: e.target.value };
                        patch("biryaniSection", { products });
                      }} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Product Image URL">
                        <Input value={prod.imageUrl} onChange={(e) => {
                          const products = [...s.biryaniSection.products];
                          products[i] = { ...products[i], imageUrl: e.target.value };
                          patch("biryaniSection", { products });
                        }} placeholder="https://..." />
                        {prod.imageUrl && (
                          <img src={prod.imageUrl} alt="preview" className="mt-1 h-16 w-20 object-cover rounded border" />
                        )}
                      </Field>
                      <Field label="CTA Link">
                        <Input value={prod.ctaHref} onChange={(e) => {
                          const products = [...s.biryaniSection.products];
                          products[i] = { ...products[i], ctaHref: e.target.value };
                          patch("biryaniSection", { products });
                        }} placeholder="/product/..." />
                      </Field>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => patch("biryaniSection", {
                  products: [...s.biryaniSection.products, { title: "", label: "", desc: "", imageUrl: "", ctaHref: "/shop" }],
                })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Biryani Product
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Videos & Ticker Tab ───────────────────────────── */}
          <TabsContent value="videos" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Film className="h-4 w-4" /> Video Section 1</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Label (small caps)">
                  <Input value={s.video1.label} onChange={(e) => patch("video1", { label: e.target.value })} />
                </Field>
                <Field label="Title">
                  <Input value={s.video1.title} onChange={(e) => patch("video1", { title: e.target.value })} />
                </Field>
                <Field label="Background Image URL" hint="Shown as the cinematic background behind the play button">
                  <Input value={s.video1.imageUrl} onChange={(e) => patch("video1", { imageUrl: e.target.value })} placeholder="https://..." />
                  {s.video1.imageUrl && (
                    <img src={s.video1.imageUrl} alt="preview" className="mt-2 h-24 w-full object-cover rounded border" />
                  )}
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Film className="h-4 w-4" /> Video Section 2</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Label (small caps)">
                  <Input value={s.video2.label} onChange={(e) => patch("video2", { label: e.target.value })} />
                </Field>
                <Field label="Title">
                  <Input value={s.video2.title} onChange={(e) => patch("video2", { title: e.target.value })} />
                </Field>
                <Field label="Background Image URL">
                  <Input value={s.video2.imageUrl} onChange={(e) => patch("video2", { imageUrl: e.target.value })} placeholder="https://..." />
                  {s.video2.imageUrl && (
                    <img src={s.video2.imageUrl} alt="preview" className="mt-2 h-24 w-full object-cover rounded border" />
                  )}
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Tag className="h-4 w-4" /> Ticker Band</CardTitle>
                <CardDescription>Scrolling marquee at the bottom of the page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.ticker.items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const items = [...s.ticker.items];
                        items[i] = e.target.value;
                        patch("ticker", { items });
                      }}
                      className="flex-1"
                    />
                    <Button size="icon" variant="ghost" onClick={() => {
                      patch("ticker", { items: s.ticker.items.filter((_, j) => j !== i) });
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => patch("ticker", { items: [...s.ticker.items, ""] })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Ticker Item
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Visibility Tab ────────────────────────────────── */}
          <TabsContent value="visibility" className="space-y-3">
            <p className="text-sm text-muted-foreground">Toggle sections on or off. Hidden sections won't appear on the live page.</p>
            <VisibilityCard label="Why the Wolf Section" visible={s.whyTheWolf.visible} onToggle={() => patch("whyTheWolf", { visible: !s.whyTheWolf.visible })} />
            <VisibilityCard label="Video Section 1 (Cinematic Documentary)" visible={s.video1.visible} onToggle={() => patch("video1", { visible: !s.video1.visible })} />
            <VisibilityCard label="Interstitial Banner (The Ancestral Plate)" visible={s.interstitialBanner.visible} onToggle={() => patch("interstitialBanner", { visible: !s.interstitialBanner.visible })} />
            <VisibilityCard label="Biryani Collection Section" visible={s.biryaniSection.visible} onToggle={() => patch("biryaniSection", { visible: !s.biryaniSection.visible })} />
            <VisibilityCard label="Video Section 2 (Science of Synthesis)" visible={s.video2.visible} onToggle={() => patch("video2", { visible: !s.video2.visible })} />
            <Separator />
            <div className="flex justify-end">
              <Button onClick={() => saveMutation.mutate(s)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}
