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

interface GiftServicesSettings {
  hero: {
    tag: string;
    headline: string;
    subtitle: string;
    bgImageUrl: string;
    scrollCta: string;
    showCta1: boolean;
    cta1Text: string;
    cta1Href: string;
    showCta2: boolean;
    cta2Text: string;
    cta2Href: string;
  };
  dossiers: {
    visible: boolean;
    sectionLabel: string;
  };
  testimonials: {
    visible: boolean;
    tag: string;
    headline: string;
  };
  relatedProducts: {
    visible: boolean;
    tag: string;
    headline: string;
    ctaText: string;
    ctaHref: string;
  };
}

const DEFAULTS: GiftServicesSettings = {
  hero: {
    tag: "GIFTING SERVICES",
    headline: "The Synchronization Vault",
    subtitle: "Precision biological alignment. Aesthetic harmony. The ultimate canine-human gift protocols.",
    bgImageUrl: "",
    scrollCta: "SCROLL TO ACCESS DOSSIERS",
    showCta1: false,
    cta1Text: "Explore Gifts",
    cta1Href: "#",
    showCta2: false,
    cta2Text: "Learn More",
    cta2Href: "#",
  },
  dossiers: {
    visible: true,
    sectionLabel: "Protocol",
  },
  testimonials: {
    visible: true,
    tag: "Field Reports",
    headline: "Verified Transmissions",
  },
  relatedProducts: {
    visible: true,
    tag: "Gift Services",
    headline: "More From the Vault",
    ctaText: "Explore All Gift Services",
    ctaHref: "/category/gift-services",
  },
};

function deepMerge(defaults: any, overrides: any): any {
  const result = { ...defaults };
  for (const key of Object.keys(overrides ?? {})) {
    if (
      typeof defaults[key] === "object" &&
      defaults[key] !== null &&
      !Array.isArray(defaults[key]) &&
      overrides[key]
    ) {
      result[key] = deepMerge(defaults[key], overrides[key]);
    } else if (overrides[key] !== undefined) {
      result[key] = overrides[key];
    }
  }
  return result;
}

export default function GiftServicesPageSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState<GiftServicesSettings>(DEFAULTS);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["/api/settings/gift-services-page"],
  });

  useEffect(() => {
    if (raw && typeof raw === "object") {
      setForm(deepMerge(DEFAULTS, raw));
    }
  }, [raw]);

  const set = (section: keyof GiftServicesSettings, field: string, value: any) => {
    setForm(prev => ({ ...prev, [section]: { ...(prev[section] as any), [field]: value } }));
  };

  const mutation = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/settings/gift-services-page", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/gift-services-page"] });
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
            <h1 className="text-2xl font-bold">Gift Services — Page Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Controls all content sections of the <code>/giftseries</code> storefront page
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/giftseries" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" /> Preview Page
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
            <TabsTrigger value="hero">Hero Banner</TabsTrigger>
            <TabsTrigger value="dossiers">Dossiers</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="related">Related Products</TabsTrigger>
          </TabsList>

          {/* ── Hero ── */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Hero Banner</CardTitle>
                <CardDescription>Full-screen opening section of the Gift Services page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tag / Eyebrow Text</Label>
                  <Input
                    value={form.hero.tag}
                    onChange={e => set("hero", "tag", e.target.value)}
                    placeholder="GIFTING SERVICES"
                    data-testid="input-hero-tag"
                  />
                  <p className="text-xs text-muted-foreground">Small label shown above the headline (all-caps display)</p>
                </div>
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Textarea
                    value={form.hero.headline}
                    onChange={e => set("hero", "headline", e.target.value)}
                    rows={2}
                    placeholder="The Synchronization Vault"
                    data-testid="input-hero-headline"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle / Tagline</Label>
                  <Textarea
                    value={form.hero.subtitle}
                    onChange={e => set("hero", "subtitle", e.target.value)}
                    rows={2}
                    placeholder="Precision biological alignment…"
                    data-testid="input-hero-subtitle"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Background Image URL</Label>
                  <Input
                    value={form.hero.bgImageUrl}
                    onChange={e => set("hero", "bgImageUrl", e.target.value)}
                    placeholder="https://... (leave blank to use default)"
                    data-testid="input-hero-bg"
                  />
                  <p className="text-xs text-muted-foreground">Upload an image via the Media library and paste the URL here. Leave blank to use the default hero image.</p>
                </div>
                <div className="space-y-2">
                  <Label>Scroll Prompt Text</Label>
                  <Input
                    value={form.hero.scrollCta}
                    onChange={e => set("hero", "scrollCta", e.target.value)}
                    placeholder="SCROLL TO ACCESS DOSSIERS"
                    data-testid="input-hero-scroll-cta"
                  />
                </div>
                <Separator />
                <p className="text-sm font-semibold">Call-to-Action Buttons (optional)</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.hero.showCta1} onCheckedChange={v => set("hero", "showCta1", v)} data-testid="switch-cta1" />
                    <Label>Show Button 1</Label>
                  </div>
                  {form.hero.showCta1 && (
                    <div className="grid grid-cols-2 gap-4 pl-4">
                      <div className="space-y-2">
                        <Label>Button 1 Text</Label>
                        <Input value={form.hero.cta1Text} onChange={e => set("hero", "cta1Text", e.target.value)} data-testid="input-cta1-text" />
                      </div>
                      <div className="space-y-2">
                        <Label>Button 1 URL</Label>
                        <Input value={form.hero.cta1Href} onChange={e => set("hero", "cta1Href", e.target.value)} data-testid="input-cta1-href" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.hero.showCta2} onCheckedChange={v => set("hero", "showCta2", v)} data-testid="switch-cta2" />
                    <Label>Show Button 2</Label>
                  </div>
                  {form.hero.showCta2 && (
                    <div className="grid grid-cols-2 gap-4 pl-4">
                      <div className="space-y-2">
                        <Label>Button 2 Text</Label>
                        <Input value={form.hero.cta2Text} onChange={e => set("hero", "cta2Text", e.target.value)} data-testid="input-cta2-text" />
                      </div>
                      <div className="space-y-2">
                        <Label>Button 2 URL</Label>
                        <Input value={form.hero.cta2Href} onChange={e => set("hero", "cta2Href", e.target.value)} data-testid="input-cta2-href" />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Dossiers ── */}
          <TabsContent value="dossiers">
            <Card>
              <CardHeader>
                <CardTitle>Product Dossiers</CardTitle>
                <CardDescription>
                  Each product in the <strong>Gift Services</strong> category appears as a dossier section.
                  Manage the products themselves from <strong>Products</strong> in the sidebar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch checked={form.dossiers.visible} onCheckedChange={v => set("dossiers", "visible", v)} data-testid="switch-dossiers-visible" />
                  <Label>Show dossier sections</Label>
                </div>
                <div className="space-y-2">
                  <Label>Protocol Label Prefix</Label>
                  <Input
                    value={form.dossiers.sectionLabel}
                    onChange={e => set("dossiers", "sectionLabel", e.target.value)}
                    placeholder="Protocol"
                    data-testid="input-dossiers-label"
                  />
                  <p className="text-xs text-muted-foreground">Shown above each product title as e.g. "Protocol // 001"</p>
                </div>
                <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                  To add or remove products from this section, go to <strong>Products</strong> and set the category to <strong>Gift Services</strong>.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Testimonials ── */}
          <TabsContent value="testimonials">
            <Card>
              <CardHeader>
                <CardTitle>Testimonials Section</CardTitle>
                <CardDescription>Dark full-width section with customer testimonials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch checked={form.testimonials.visible} onCheckedChange={v => set("testimonials", "visible", v)} data-testid="switch-testimonials-visible" />
                  <Label>Show testimonials section</Label>
                </div>
                <div className="space-y-2">
                  <Label>Section Tag</Label>
                  <Input
                    value={form.testimonials.tag}
                    onChange={e => set("testimonials", "tag", e.target.value)}
                    placeholder="Field Reports"
                    data-testid="input-testimonials-tag"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section Headline</Label>
                  <Input
                    value={form.testimonials.headline}
                    onChange={e => set("testimonials", "headline", e.target.value)}
                    placeholder="Verified Transmissions"
                    data-testid="input-testimonials-headline"
                  />
                </div>
                <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                  Individual testimonial cards are managed under <strong>Gift Services &gt; Testimonials</strong> in the sidebar.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Related Products ── */}
          <TabsContent value="related">
            <Card>
              <CardHeader>
                <CardTitle>Related Products Section</CardTitle>
                <CardDescription>Product grid shown below the testimonials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch checked={form.relatedProducts.visible} onCheckedChange={v => set("relatedProducts", "visible", v)} data-testid="switch-related-visible" />
                  <Label>Show related products section</Label>
                </div>
                <div className="space-y-2">
                  <Label>Section Tag</Label>
                  <Input
                    value={form.relatedProducts.tag}
                    onChange={e => set("relatedProducts", "tag", e.target.value)}
                    placeholder="Gift Services"
                    data-testid="input-related-tag"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section Headline</Label>
                  <Input
                    value={form.relatedProducts.headline}
                    onChange={e => set("relatedProducts", "headline", e.target.value)}
                    placeholder="More From the Vault"
                    data-testid="input-related-headline"
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>View All Button Text</Label>
                    <Input
                      value={form.relatedProducts.ctaText}
                      onChange={e => set("relatedProducts", "ctaText", e.target.value)}
                      data-testid="input-related-cta-text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>View All Button URL</Label>
                    <Input
                      value={form.relatedProducts.ctaHref}
                      onChange={e => set("relatedProducts", "ctaHref", e.target.value)}
                      data-testid="input-related-cta-href"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
