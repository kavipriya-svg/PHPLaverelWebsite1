import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Loader2, Upload, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
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
  HeroSlide,
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

// ─── Hero Slide Card ───────────────────────────────────────────────
function HeroSlideCard({
  slide, index, total, onChange, onDelete, onMove,
}: {
  slide: HeroSlide;
  index: number;
  total: number;
  onChange: (s: HeroSlide) => void;
  onDelete: () => void;
  onMove: (dir: number) => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const set = (patch: Partial<HeroSlide>) => onChange({ ...slide, ...patch });

  return (
    <Card className={slide.isActive ? "" : "opacity-60"}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          {/* order arrows */}
          <div className="flex flex-col shrink-0">
            <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="p-0.5 disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="p-0.5 disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
          </div>
          {/* thumbnail */}
          {slide.bgImageUrl && <img src={slide.bgImageUrl} alt="" className="h-10 w-16 object-cover rounded shrink-0" />}
          {/* title */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{slide.headline || `Slide ${index + 1}`}</p>
            <p className="text-xs text-muted-foreground">{slide.isActive ? "Active" : "Inactive"}</p>
          </div>
          {/* controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* active toggle */}
            <button type="button" onClick={() => set({ isActive: !slide.isActive })}
              className="px-2 py-1 rounded text-xs font-semibold transition-colors"
              style={{ backgroundColor: slide.isActive ? "#16a34a" : "#e5e7eb", color: slide.isActive ? "#fff" : "#374151" }}>
              {slide.isActive ? "Active" : "Inactive"}
            </button>
            <button type="button" onClick={() => setOpen(o => !o)} className="p-1 rounded hover:bg-muted">
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button type="button" onClick={onDelete} className="p-1 rounded hover:bg-destructive/10 text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4 pt-0">
          <Separator />
          {/* Text / CTA visibility toggles */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">Text Content</span>
              <button type="button" onClick={() => set({ showText: !slide.showText })}
                className="px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                style={{ backgroundColor: slide.showText ? "#16a34a" : "#e5e7eb", color: slide.showText ? "#fff" : "#374151" }}>
                {slide.showText ? "Visible" : "Hidden"}
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">CTA Buttons</span>
              <button type="button" onClick={() => set({ showCta: !slide.showCta })}
                className="px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                style={{ backgroundColor: slide.showCta ? "#16a34a" : "#e5e7eb", color: slide.showCta ? "#fff" : "#374151" }}>
                {slide.showCta ? "Visible" : "Hidden"}
              </button>
            </div>
          </div>
          <Separator />
          <ImageUploadField label="Background Image" value={slide.bgImageUrl} onChange={(url) => set({ bgImageUrl: url })} hint="Full-screen background image for this slide." />
          {slide.showText && (
            <>
              <FieldRow label="Eyebrow Label" hint="Small caps text above the headline.">
                <Input value={slide.label} onChange={e => set({ label: e.target.value })} placeholder="BIOLOGICAL EXCELLENCE" />
              </FieldRow>
              <FieldRow label="Headline" hint="Use \n for a line break.">
                <Textarea value={slide.headline} onChange={e => set({ headline: e.target.value })} rows={2} placeholder="The Modern\nWolf Manual." />
              </FieldRow>
              <FieldRow label="Sub-headline">
                <Input value={slide.subheadline} onChange={e => set({ subheadline: e.target.value })} placeholder="Issue No. 01 — Biological Wellness" />
              </FieldRow>
            </>
          )}
          {slide.showCta && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldRow label="Primary CTA Text"><Input value={slide.cta1Text} onChange={e => set({ cta1Text: e.target.value })} placeholder="SHOP NUTRITION" /></FieldRow>
              <FieldRow label="Primary CTA Link"><Input value={slide.cta1Href} onChange={e => set({ cta1Href: e.target.value })} placeholder="/shop" /></FieldRow>
              <FieldRow label="Secondary CTA Text"><Input value={slide.cta2Text} onChange={e => set({ cta2Text: e.target.value })} placeholder="THE COLLECTION" /></FieldRow>
              <FieldRow label="Secondary CTA Link"><Input value={slide.cta2Href} onChange={e => set({ cta2Href: e.target.value })} placeholder="/category/clothing" /></FieldRow>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Drag-to-Reorder Navigation Links Editor ───────────────────────
function NavLinksEditor({
  links,
  onChange,
}: {
  links: Array<{ label: string; href: string }>;
  onChange: (links: Array<{ label: string; href: string }>) => void;
}) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const updateLink = (i: number, field: "label" | "href", value: string) => {
    const next = [...links];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  const removeLink = (i: number) => {
    onChange(links.filter((_, j) => j !== i));
  };

  const handleDragStart = (i: number) => {
    dragIndexRef.current = i;
  };

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOver(i);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOver(null);
      return;
    }
    const next = [...links];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, moved);
    dragIndexRef.current = null;
    setDragOver(null);
    onChange(next);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOver(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Navigation Links</Label>
        <span className="text-xs text-muted-foreground">Drag to reorder</span>
      </div>

      <div className="space-y-2">
        {links.map((link, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            className={`flex gap-2 items-center rounded-md transition-all duration-150 ${
              dragOver === i ? "ring-2 ring-primary ring-offset-1 bg-accent/40" : ""
            }`}
          >
            <div
              className="cursor-grab active:cursor-grabbing flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              title="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <Input
              value={link.label}
              onChange={(e) => updateLink(i, "label", e.target.value)}
              placeholder="Label"
              className="w-40"
            />
            <Input
              value={link.href}
              onChange={(e) => updateLink(i, "href", e.target.value)}
              placeholder="/path"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeLink(i)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...links, { label: "", href: "/" }])}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add Link
      </Button>
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
            {/* Global visibility */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Hero Banner</CardTitle>
                    <CardDescription>Full-screen carousel at the top of the homepage. Add multiple slides — they auto-scroll every 5 seconds.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Label className="text-sm text-muted-foreground">{settings.hero.visible ? "Visible" : "Hidden"}</Label>
                    <Switch checked={settings.hero.visible ?? true} onCheckedChange={(v) => update("hero", { visible: v })} />
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Slide list */}
            <div className="space-y-3">
              {(settings.hero.slides || []).map((slide, idx) => (
                <HeroSlideCard
                  key={slide.id}
                  slide={slide}
                  index={idx}
                  total={(settings.hero.slides || []).length}
                  onChange={(updated) => {
                    const slides = [...(settings.hero.slides || [])];
                    slides[idx] = updated;
                    update("hero", { slides });
                  }}
                  onDelete={() => {
                    const slides = (settings.hero.slides || []).filter((_, i) => i !== idx);
                    update("hero", { slides });
                  }}
                  onMove={(dir) => {
                    const slides = [...(settings.hero.slides || [])];
                    const to = idx + dir;
                    if (to < 0 || to >= slides.length) return;
                    [slides[idx], slides[to]] = [slides[to], slides[idx]];
                    update("hero", { slides });
                  }}
                />
              ))}
              {(settings.hero.slides || []).length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4">No slides yet. Add your first banner below.</p>
              )}
              <Button type="button" variant="outline" className="w-full" onClick={() => {
                const newSlide: HeroSlide = {
                  id: Math.random().toString(36).slice(2),
                  bgImageUrl: "",
                  label: "",
                  headline: "",
                  subheadline: "",
                  cta1Text: "SHOP NOW",
                  cta1Href: "/shop",
                  cta2Text: "",
                  cta2Href: "",
                  showText: true,
                  showCta: true,
                  isActive: true,
                };
                update("hero", { slides: [...(settings.hero.slides || []), newSlide] });
              }}>
                <Plus className="h-4 w-4 mr-2" /> Add Banner Slide
              </Button>
            </div>
          </TabsContent>

          {/* ── NAVIGATION TAB ── */}
          <TabsContent value="navigation" className="space-y-4">
            <SectionCard title="Header Navigation" description="Top navigation links and call-to-action button.">
              <NavLinksEditor
                links={settings.nav.links}
                onChange={(links) => update("nav", { links })}
              />
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
              <Separator />
              <Label className="text-sm font-medium">Category Card Labels</Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Card images and names come from your top-level categories. Customize the CTA button text, description, and badge for each card below.
              </p>
              {["Card 1 (Large — top-left)", "Card 2 (Small — top-right)", "Card 3 (Bottom-left)", "Card 4 (Bottom-right)"].map((label, i) => (
                <div key={i} className="p-4 border rounded-md space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FieldRow label="CTA Button Text">
                      <Input
                        value={settings.categoryHub.cards[i]?.ctaText ?? ""}
                        onChange={(e) => {
                          const cards = [...settings.categoryHub.cards];
                          cards[i] = { ...cards[i], ctaText: e.target.value };
                          update("categoryHub", { cards });
                        }}
                        placeholder="EXPLORE"
                      />
                    </FieldRow>
                    {i === 0 && (
                      <FieldRow label="Description (Card 1 only)">
                        <Input
                          value={settings.categoryHub.cards[0]?.description ?? ""}
                          onChange={(e) => {
                            const cards = [...settings.categoryHub.cards];
                            cards[0] = { ...cards[0], description: e.target.value };
                            update("categoryHub", { cards });
                          }}
                          placeholder="Precision nutrition for the canine predator."
                        />
                      </FieldRow>
                    )}
                    {i === 3 && (
                      <FieldRow label="Badge Text (Card 4 only)">
                        <Input
                          value={settings.categoryHub.cards[3]?.badge ?? ""}
                          onChange={(e) => {
                            const cards = [...settings.categoryHub.cards];
                            cards[3] = { ...cards[3], badge: e.target.value };
                            update("categoryHub", { cards });
                          }}
                          placeholder="NEW ARRIVAL"
                        />
                      </FieldRow>
                    )}
                  </div>
                </div>
              ))}
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
              <Label className="text-sm font-medium">Community Photo Grid</Label>
              <p className="text-xs text-muted-foreground -mt-1">Four photos displayed in the editorial mosaic above testimonials.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(settings.communityPack.photos ?? []).map((photo, i) => (
                  <ImageUploadField
                    key={i}
                    label={`Photo ${i + 1}`}
                    value={photo.url}
                    onChange={(url) => {
                      const photos = [...(settings.communityPack.photos ?? [])];
                      photos[i] = { url };
                      update("communityPack", { photos });
                    }}
                  />
                ))}
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
