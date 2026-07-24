import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Loader2, Upload, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  mergeHomepageSettings,
  HomepageSettings,
} from "@/lib/homepageDefaults";

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  visible,
  onToggle,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  visible?: boolean;
  onToggle?: (v: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-0.5">{description}</CardDescription>
            )}
          </div>
          {onToggle !== undefined && (
            <div className="flex items-center gap-2 shrink-0">
              <Label className="text-sm text-muted-foreground">
                {visible ? "Visible" : "Hidden"}
              </Label>
              <Switch
                checked={visible ?? true}
                onCheckedChange={onToggle}
                data-testid={`toggle-section-${title.toLowerCase().replace(/\s+/g, "-")}`}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/file", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.url || data.fileUrl || "");
      toast({ title: "Image uploaded successfully" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex gap-2 items-center flex-wrap">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste image URL or upload"
          className="flex-1 min-w-0"
        />
        <label>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={uploading}
            className="cursor-pointer"
          >
            <span>
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span className="ml-1.5">{uploading ? "Uploading..." : "Upload"}</span>
            </span>
          </Button>
        </label>
      </div>
      {value && (
        <img
          src={value}
          alt="preview"
          className="h-24 w-auto rounded-md border object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}

export default function HomepageSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS);

  const { data, isLoading } = useQuery<{ settings: Partial<HomepageSettings> }>({
    queryKey: ["/api/settings/homepage"],
  });

  useEffect(() => {
    if (data?.settings) {
      setSettings(mergeHomepageSettings(data.settings));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (s: HomepageSettings) => {
      const res = await apiRequest("PUT", "/api/settings/homepage", s);
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/homepage"] });
      toast({ title: "Homepage settings saved" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  function update<K extends keyof HomepageSettings>(
    section: K,
    patch: Partial<HomepageSettings[K]>
  ) {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as object), ...patch },
    }));
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Homepage Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Control every section of the 19 DOGS editorial homepage.
            </p>
          </div>
          <Button
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending}
            data-testid="button-save-homepage-settings"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="visibility">
          <TabsList className="flex-wrap h-auto gap-1 mb-2">
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
            <TabsTrigger value="hero">Hero Banner</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="products">Product Sections</TabsTrigger>
            <TabsTrigger value="story">Brand Story</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="misc">Gift Sets & Footer</TabsTrigger>
          </TabsList>

          {/* ── VISIBILITY TAB ── */}
          <TabsContent value="visibility" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Section Visibility</CardTitle>
                <CardDescription>
                  Toggle sections on or off without deleting their content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(
                    [
                      ["hero", "1. Hero Banner"],
                      ["categoryHub", "2. Category Hub"],
                      ["bestSellers", "3. Top Tier Fuel (Food Grid)"],
                      ["treats", "4. Treats Grid"],
                      ["philosophy", "5. Ancestral Philosophy"],
                      ["apparel", "6. Apparel for the Modern Pack"],
                      ["wolfPrinciple", "7. Wolf Principle (Dark Banner)"],
                      ["founder", "8. Founder's Mission"],
                      ["giftSets", "9. Gift Sets"],
                      ["trustBadges", "10. Trust Badges"],
                      ["communityPack", "11. Community Pack"],
                      ["newsletter", "12. Newsletter"],
                    ] as [keyof HomepageSettings, string][]
                  ).map(([key, label]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <Label className="text-sm font-medium">{label}</Label>
                      <Switch
                        checked={(settings[key] as { visible: boolean }).visible ?? true}
                        onCheckedChange={(v) => update(key, { visible: v } as any)}
                        data-testid={`toggle-visibility-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── HERO TAB ── */}
          <TabsContent value="hero" className="space-y-4">
            <SectionCard
              title="Hero Section"
              description="The full-screen hero banner at the top of the homepage."
              visible={settings.hero.visible}
              onToggle={(v) => update("hero", { visible: v })}
            >
              <FieldRow label="Eyebrow Label" hint="Small caps text above the headline.">
                <Input
                  value={settings.hero.label}
                  onChange={(e) => update("hero", { label: e.target.value })}
                  placeholder="BIOLOGICAL EXCELLENCE"
                />
              </FieldRow>
              <FieldRow label="Headline" hint="Main heading. Use \n for a line break.">
                <Textarea
                  value={settings.hero.headline}
                  onChange={(e) => update("hero", { headline: e.target.value })}
                  rows={3}
                  placeholder="The Modern\nWolf Manual."
                />
              </FieldRow>
              <FieldRow label="Sub-headline">
                <Input
                  value={settings.hero.subheadline}
                  onChange={(e) => update("hero", { subheadline: e.target.value })}
                  placeholder="Issue No. 01 — Biological Wellness"
                />
              </FieldRow>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="Primary CTA Text">
                  <Input
                    value={settings.hero.cta1Text}
                    onChange={(e) => update("hero", { cta1Text: e.target.value })}
                    placeholder="SHOP NUTRITION"
                  />
                </FieldRow>
                <FieldRow label="Primary CTA Link">
                  <Input
                    value={settings.hero.cta1Href}
                    onChange={(e) => update("hero", { cta1Href: e.target.value })}
                    placeholder="/shop"
                  />
                </FieldRow>
                <FieldRow label="Secondary CTA Text">
                  <Input
                    value={settings.hero.cta2Text}
                    onChange={(e) => update("hero", { cta2Text: e.target.value })}
                    placeholder="THE COLLECTION"
                  />
                </FieldRow>
                <FieldRow label="Secondary CTA Link">
                  <Input
                    value={settings.hero.cta2Href}
                    onChange={(e) => update("hero", { cta2Href: e.target.value })}
                    placeholder="/category/clothing"
                  />
                </FieldRow>
              </div>
              <Separator />
              <ImageUploadField
                label="Background Image"
                value={settings.hero.bgImageUrl}
                onChange={(url) => update("hero", { bgImageUrl: url })}
                hint="Full-screen background image for the hero section."
              />
            </SectionCard>
          </TabsContent>

          {/* ── NAVIGATION TAB ── */}
          <TabsContent value="navigation" className="space-y-4">
            <SectionCard title="Header Navigation" description="Top navigation links and call-to-action button.">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Navigation Links</Label>
                {settings.nav.links.map((link, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={link.label}
                      onChange={(e) => {
                        const links = [...settings.nav.links];
                        links[i] = { ...links[i], label: e.target.value };
                        update("nav", { links });
                      }}
                      placeholder="Label"
                      className="w-40"
                    />
                    <Input
                      value={link.href}
                      onChange={(e) => {
                        const links = [...settings.nav.links];
                        links[i] = { ...links[i], href: e.target.value };
                        update("nav", { links });
                      }}
                      placeholder="/path"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const links = settings.nav.links.filter((_, j) => j !== i);
                        update("nav", { links });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    update("nav", {
                      links: [...settings.nav.links, { label: "", href: "/" }],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Link
                </Button>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="CTA Button Text">
                  <Input
                    value={settings.nav.ctaText}
                    onChange={(e) => update("nav", { ctaText: e.target.value })}
                    placeholder="JOIN THE PACK"
                  />
                </FieldRow>
                <FieldRow label="CTA Button Link">
                  <Input
                    value={settings.nav.ctaHref}
                    onChange={(e) => update("nav", { ctaHref: e.target.value })}
                    placeholder="/signup"
                  />
                </FieldRow>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── PRODUCTS TAB ── */}
          <TabsContent value="products" className="space-y-4">
            <SectionCard
              title="Top Tier Fuel — Food Section"
              description="Headline product grid pulled from a category (appears 4th on homepage)."
              visible={settings.bestSellers.visible}
              onToggle={(v) => update("bestSellers", { visible: v })}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="Section Title">
                  <Input
                    value={settings.bestSellers.title}
                    onChange={(e) => update("bestSellers", { title: e.target.value })}
                    placeholder="Top Tier Fuel"
                  />
                </FieldRow>
                <FieldRow label="Category Slug" hint="Pull products from this category.">
                  <Input
                    value={settings.bestSellers.categorySlug}
                    onChange={(e) =>
                      update("bestSellers", { categorySlug: e.target.value })
                    }
                    placeholder="wild-treats"
                  />
                </FieldRow>
                <FieldRow label="Number of Products">
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={settings.bestSellers.limit}
                    onChange={(e) =>
                      update("bestSellers", { limit: parseInt(e.target.value) || 4 })
                    }
                  />
                </FieldRow>
                <FieldRow label="Browse Link Text">
                  <Input
                    value={settings.bestSellers.browseText}
                    onChange={(e) => update("bestSellers", { browseText: e.target.value })}
                    placeholder="BROWSE ALL NUTRITION"
                  />
                </FieldRow>
                <FieldRow label="Browse Link URL">
                  <Input
                    value={settings.bestSellers.browseHref}
                    onChange={(e) => update("bestSellers", { browseHref: e.target.value })}
                    placeholder="/shop"
                  />
                </FieldRow>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <Label className="text-sm font-medium">Featured products only</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Only show products with the "Featured" flag enabled in their product settings.
                  </p>
                </div>
                <Switch
                  checked={settings.bestSellers.featuredOnly ?? true}
                  onCheckedChange={(v) => update("bestSellers", { featuredOnly: v })}
                  data-testid="toggle-bestSellers-featuredOnly"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Treats Section"
              description="Product grid shown below Top Tier Fuel."
              visible={settings.treats.visible}
              onToggle={(v) => update("treats", { visible: v })}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="Eyebrow Label">
                  <Input
                    value={settings.treats.label}
                    onChange={(e) => update("treats", { label: e.target.value })}
                    placeholder="REWARD & TRAIN"
                  />
                </FieldRow>
                <FieldRow label="Section Title">
                  <Input
                    value={settings.treats.title}
                    onChange={(e) => update("treats", { title: e.target.value })}
                    placeholder="Treats"
                  />
                </FieldRow>
                <FieldRow label="Category Slug" hint="Pull products from this category.">
                  <Input
                    value={settings.treats.categorySlug}
                    onChange={(e) => update("treats", { categorySlug: e.target.value })}
                    placeholder="treats"
                  />
                </FieldRow>
                <FieldRow label="Number of Products">
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={settings.treats.limit}
                    onChange={(e) =>
                      update("treats", { limit: parseInt(e.target.value) || 4 })
                    }
                  />
                </FieldRow>
                <FieldRow label="Browse Link Text">
                  <Input
                    value={settings.treats.browseText}
                    onChange={(e) => update("treats", { browseText: e.target.value })}
                    placeholder="BROWSE ALL TREATS"
                  />
                </FieldRow>
                <FieldRow label="Browse Link URL">
                  <Input
                    value={settings.treats.browseHref}
                    onChange={(e) => update("treats", { browseHref: e.target.value })}
                    placeholder="/shop"
                  />
                </FieldRow>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <Label className="text-sm font-medium">Featured products only</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Only show products with the "Featured" flag enabled in their product settings.
                  </p>
                </div>
                <Switch
                  checked={settings.treats.featuredOnly ?? true}
                  onCheckedChange={(v) => update("treats", { featuredOnly: v })}
                  data-testid="toggle-treats-featuredOnly"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Apparel for the Modern Pack"
              description="Three-column clothing product grid (appears 7th on homepage)."
              visible={settings.apparel.visible}
              onToggle={(v) => update("apparel", { visible: v })}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="Eyebrow Label">
                  <Input
                    value={settings.apparel.label}
                    onChange={(e) => update("apparel", { label: e.target.value })}
                    placeholder="THE WARDROBE"
                  />
                </FieldRow>
                <FieldRow label="Section Title">
                  <Input
                    value={settings.apparel.title}
                    onChange={(e) => update("apparel", { title: e.target.value })}
                    placeholder="Apparel for the Modern Pack"
                  />
                </FieldRow>
                <FieldRow label="Category Slug">
                  <Input
                    value={settings.apparel.categorySlug}
                    onChange={(e) => update("apparel", { categorySlug: e.target.value })}
                    placeholder="clothing"
                  />
                </FieldRow>
                <FieldRow label="Number of Products">
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={settings.apparel.limit}
                    onChange={(e) =>
                      update("apparel", { limit: parseInt(e.target.value) || 3 })
                    }
                  />
                </FieldRow>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <Label className="text-sm font-medium">Featured products only</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Only show products with the "Featured" flag enabled in their product settings.
                  </p>
                </div>
                <Switch
                  checked={settings.apparel.featuredOnly ?? true}
                  onCheckedChange={(v) => update("apparel", { featuredOnly: v })}
                  data-testid="toggle-apparel-featuredOnly"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Category Hub"
              description="Four editorial category showcase cards."
              visible={settings.categoryHub.visible}
              onToggle={(v) => update("categoryHub", { visible: v })}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="Eyebrow Label">
                  <Input
                    value={settings.categoryHub.label}
                    onChange={(e) => update("categoryHub", { label: e.target.value })}
                    placeholder="CURATED SELECTIONS"
                  />
                </FieldRow>
                <FieldRow label="Section Title">
                  <Input
                    value={settings.categoryHub.title}
                    onChange={(e) => update("categoryHub", { title: e.target.value })}
                    placeholder="The Core Biological Systems"
                  />
                </FieldRow>
              </div>
              <p className="text-xs text-muted-foreground">
                Category cards are populated from your top-level categories in the admin. Manage them under <strong>Categories</strong>.
              </p>
            </SectionCard>
          </TabsContent>

          {/* ── STORY TAB ── */}
          <TabsContent value="story" className="space-y-4">
            <SectionCard
              title="Ancestral Philosophy"
              description="Split image + principles section."
              visible={settings.philosophy.visible}
              onToggle={(v) => update("philosophy", { visible: v })}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="Eyebrow Label">
                  <Input
                    value={settings.philosophy.label}
                    onChange={(e) => update("philosophy", { label: e.target.value })}
                    placeholder="The Philosophy"
                  />
                </FieldRow>
                <FieldRow label="Section Title">
                  <Input
                    value={settings.philosophy.title}
                    onChange={(e) => update("philosophy", { title: e.target.value })}
                    placeholder="Ancestral Precision"
                  />
                </FieldRow>
              </div>
              <FieldRow label="Pull Quote">
                <Textarea
                  value={settings.philosophy.quote}
                  onChange={(e) => update("philosophy", { quote: e.target.value })}
                  rows={2}
                />
              </FieldRow>
              <FieldRow label="Quote Attribution">
                <Input
                  value={settings.philosophy.quoteAuthor}
                  onChange={(e) => update("philosophy", { quoteAuthor: e.target.value })}
                  placeholder="ARIA VANCE, FOUNDER"
                />
              </FieldRow>
              <ImageUploadField
                label="Section Image"
                value={settings.philosophy.imageUrl}
                onChange={(url) => update("philosophy", { imageUrl: url })}
              />
              <Separator />
              <Label className="text-sm font-medium">Principles</Label>
              {settings.philosophy.principles.map((p, i) => (
                <div key={i} className="space-y-2 p-3 border rounded-md">
                  <div className="flex gap-2">
                    <Input
                      value={p.num}
                      onChange={(e) => {
                        const principles = [...settings.philosophy.principles];
                        principles[i] = { ...principles[i], num: e.target.value };
                        update("philosophy", { principles });
                      }}
                      className="w-16"
                      placeholder="01"
                    />
                    <Input
                      value={p.title}
                      onChange={(e) => {
                        const principles = [...settings.philosophy.principles];
                        principles[i] = { ...principles[i], title: e.target.value };
                        update("philosophy", { principles });
                      }}
                      placeholder="Principle Title"
                      className="flex-1"
                    />
                  </div>
                  <Textarea
                    value={p.desc}
                    onChange={(e) => {
                      const principles = [...settings.philosophy.principles];
                      principles[i] = { ...principles[i], desc: e.target.value };
                      update("philosophy", { principles });
                    }}
                    rows={2}
                    placeholder="Description"
                  />
                </div>
              ))}
            </SectionCard>

            <SectionCard
              title="Wolf Principle"
              description="Full-width dark statement section."
              visible={settings.wolfPrinciple.visible}
              onToggle={(v) => update("wolfPrinciple", { visible: v })}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="Eyebrow Label">
                  <Input
                    value={settings.wolfPrinciple.label}
                    onChange={(e) => update("wolfPrinciple", { label: e.target.value })}
                    placeholder="THE BIOLOGICAL CONSTANT"
                  />
                </FieldRow>
                <FieldRow label="Headline">
                  <Input
                    value={settings.wolfPrinciple.headline}
                    onChange={(e) =>
                      update("wolfPrinciple", { headline: e.target.value })
                    }
                    placeholder="99% DNA Match to Wolves."
                  />
                </FieldRow>
              </div>
              <FieldRow label="Body Text">
                <Textarea
                  value={settings.wolfPrinciple.body}
                  onChange={(e) => update("wolfPrinciple", { body: e.target.value })}
                  rows={2}
                />
              </FieldRow>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="CTA Button Text">
                  <Input
                    value={settings.wolfPrinciple.ctaText}
                    onChange={(e) => update("wolfPrinciple", { ctaText: e.target.value })}
                    placeholder="Read the Whitepaper"
                  />
                </FieldRow>
                <FieldRow label="CTA Button Link">
                  <Input
                    value={settings.wolfPrinciple.ctaHref}
                    onChange={(e) => update("wolfPrinciple", { ctaHref: e.target.value })}
                    placeholder="/about"
                  />
                </FieldRow>
              </div>
            </SectionCard>

            <SectionCard
              title="Founder's Mission"
              description="Founder quote and portrait."
              visible={settings.founder.visible}
              onToggle={(v) => update("founder", { visible: v })}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="Eyebrow Label">
                  <Input
                    value={settings.founder.label}
                    onChange={(e) => update("founder", { label: e.target.value })}
                    placeholder="OUR PROMISE"
                  />
                </FieldRow>
                <FieldRow label="Section Title">
                  <Input
                    value={settings.founder.title}
                    onChange={(e) => update("founder", { title: e.target.value })}
                    placeholder="Engineering a Longer Life."
                  />
                </FieldRow>
                <FieldRow label="Founder Name">
                  <Input
                    value={settings.founder.name}
                    onChange={(e) => update("founder", { name: e.target.value })}
                    placeholder="Aria Vance"
                  />
                </FieldRow>
              </div>
              <FieldRow label="Founder Quote">
                <Textarea
                  value={settings.founder.quote}
                  onChange={(e) => update("founder", { quote: e.target.value })}
                  rows={4}
                />
              </FieldRow>
              <ImageUploadField
                label="Founder Portrait"
                value={settings.founder.imageUrl}
                onChange={(url) => update("founder", { imageUrl: url })}
              />
            </SectionCard>
          </TabsContent>

          {/* ── COMMUNITY TAB ── */}
          <TabsContent value="community" className="space-y-4">
            <SectionCard
              title="Community Pack"
              description="Photo grid and customer testimonials."
              visible={settings.communityPack.visible}
              onToggle={(v) => update("communityPack", { visible: v })}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="Section Title">
                  <Input
                    value={settings.communityPack.title}
                    onChange={(e) => update("communityPack", { title: e.target.value })}
                    placeholder="The Community Pack"
                  />
                </FieldRow>
                <FieldRow label="Subtitle">
                  <Input
                    value={settings.communityPack.subtitle}
                    onChange={(e) =>
                      update("communityPack", { subtitle: e.target.value })
                    }
                    placeholder="Sharing the journey of biological wellness."
                  />
                </FieldRow>
              </div>
              <Separator />
              <Label className="text-sm font-medium">
                Fallback Testimonials{" "}
                <span className="font-normal text-muted-foreground">
                  (shown when no approved reviews exist)
                </span>
              </Label>
              {settings.communityPack.testimonials.map((t, i) => (
                <div key={i} className="space-y-2 p-3 border rounded-md">
                  <Textarea
                    value={t.quote}
                    onChange={(e) => {
                      const testimonials = [...settings.communityPack.testimonials];
                      testimonials[i] = { ...testimonials[i], quote: e.target.value };
                      update("communityPack", { testimonials });
                    }}
                    rows={3}
                    placeholder="Customer quote"
                  />
                  <Input
                    value={t.author}
                    onChange={(e) => {
                      const testimonials = [...settings.communityPack.testimonials];
                      testimonials[i] = { ...testimonials[i], author: e.target.value };
                      update("communityPack", { testimonials });
                    }}
                    placeholder="CUSTOMER NAME, CITY"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  update("communityPack", {
                    testimonials: [
                      ...settings.communityPack.testimonials,
                      { quote: "", author: "" },
                    ],
                  })
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Testimonial
              </Button>
            </SectionCard>

            <SectionCard
              title="Newsletter Section"
              description="Email subscription block."
              visible={settings.newsletter.visible}
              onToggle={(v) => update("newsletter", { visible: v })}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="Eyebrow Label">
                  <Input
                    value={settings.newsletter.label}
                    onChange={(e) => update("newsletter", { label: e.target.value })}
                    placeholder="STAY INFORMED"
                  />
                </FieldRow>
                <FieldRow label="Heading">
                  <Input
                    value={settings.newsletter.title}
                    onChange={(e) => update("newsletter", { title: e.target.value })}
                    placeholder="The Dispatch"
                  />
                </FieldRow>
                <FieldRow label="CTA Button Text">
                  <Input
                    value={settings.newsletter.ctaText}
                    onChange={(e) => update("newsletter", { ctaText: e.target.value })}
                    placeholder="SUBSCRIBE"
                  />
                </FieldRow>
              </div>
              <FieldRow label="Subtitle">
                <Textarea
                  value={settings.newsletter.subtitle}
                  onChange={(e) => update("newsletter", { subtitle: e.target.value })}
                  rows={2}
                  placeholder="Deep dives into canine biology and exclusive pack access."
                />
              </FieldRow>
            </SectionCard>

            <SectionCard
              title="Trust Badges"
              description="Icon + label badges strip."
              visible={settings.trustBadges.visible}
              onToggle={(v) => update("trustBadges", { visible: v })}
            >
              <div className="space-y-2">
                {settings.trustBadges.items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={item.label}
                      onChange={(e) => {
                        const items = [...settings.trustBadges.items];
                        items[i] = { label: e.target.value };
                        update("trustBadges", { items });
                      }}
                      placeholder="BADGE LABEL"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const items = settings.trustBadges.items.filter((_, j) => j !== i);
                        update("trustBadges", { items });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    update("trustBadges", {
                      items: [...settings.trustBadges.items, { label: "" }],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Badge
                </Button>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── MISC TAB ── */}
          <TabsContent value="misc" className="space-y-4">
            <SectionCard
              title="Gift Sets Section"
              description="Three editorial gift set cards."
              visible={settings.giftSets.visible}
              onToggle={(v) => update("giftSets", { visible: v })}
            >
              <FieldRow label="Section Title">
                <Input
                  value={settings.giftSets.sectionTitle}
                  onChange={(e) => update("giftSets", { sectionTitle: e.target.value })}
                  placeholder="The Editorial Gift Series"
                />
              </FieldRow>
              <Separator />
              {settings.giftSets.items.map((item, i) => (
                <div key={i} className="space-y-3 p-4 border rounded-md">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Gift Set {i + 1}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FieldRow label="Title">
                      <Input
                        value={item.title}
                        onChange={(e) => {
                          const items = [...settings.giftSets.items];
                          items[i] = { ...items[i], title: e.target.value };
                          update("giftSets", { items });
                        }}
                      />
                    </FieldRow>
                    <FieldRow label="Price (displayed as-is)">
                      <Input
                        value={item.price}
                        onChange={(e) => {
                          const items = [...settings.giftSets.items];
                          items[i] = { ...items[i], price: e.target.value };
                          update("giftSets", { items });
                        }}
                        placeholder="$150"
                      />
                    </FieldRow>
                  </div>
                  <FieldRow label="Description">
                    <Textarea
                      value={item.desc}
                      onChange={(e) => {
                        const items = [...settings.giftSets.items];
                        items[i] = { ...items[i], desc: e.target.value };
                        update("giftSets", { items });
                      }}
                      rows={2}
                    />
                  </FieldRow>
                  <ImageUploadField
                    label="Image"
                    value={item.imageUrl}
                    onChange={(url) => {
                      const items = [...settings.giftSets.items];
                      items[i] = { ...items[i], imageUrl: url };
                      update("giftSets", { items });
                    }}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  update("giftSets", {
                    items: [
                      ...settings.giftSets.items,
                      { title: "", desc: "", price: "", imageUrl: "" },
                    ],
                  })
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Gift Set
              </Button>
            </SectionCard>

            <Card>
              <CardHeader>
                <CardTitle>Editorial Footer</CardTitle>
                <CardDescription>
                  Contact info and copyright line in the homepage footer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldRow label="Brand Tagline">
                  <Textarea
                    value={settings.footer.tagline}
                    onChange={(e) => update("footer", { tagline: e.target.value })}
                    rows={2}
                  />
                </FieldRow>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldRow label="Email">
                    <Input
                      value={settings.footer.email}
                      onChange={(e) => update("footer", { email: e.target.value })}
                      placeholder="info@19dogs.com"
                    />
                  </FieldRow>
                  <FieldRow label="Phone">
                    <Input
                      value={settings.footer.phone}
                      onChange={(e) => update("footer", { phone: e.target.value })}
                      placeholder="+91 99414 43009"
                    />
                  </FieldRow>
                </div>
                <FieldRow label="Copyright Line">
                  <Input
                    value={settings.footer.copyright}
                    onChange={(e) => update("footer", { copyright: e.target.value })}
                    placeholder="© 2024 19 DOGS. All rights reserved."
                  />
                </FieldRow>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
