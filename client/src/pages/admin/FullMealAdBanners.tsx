import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, X, Play, Image as ImageIcon, LayoutList, Layers } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

type AdBanner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  mediaType: string;
  mediaUrl: string;
  placement: string;
  position: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

type FormState = {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  mediaType: string;
  mediaUrl: string;
  placement: string;
  position: string;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_FORM: FormState = {
  title: "",
  subtitle: "",
  ctaText: "",
  ctaUrl: "",
  mediaType: "image",
  mediaUrl: "",
  placement: "both",
  position: "bottom",
  isActive: true,
  sortOrder: 0,
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const SECTION_OPTIONS = [
  { group: "Listing Page  (/full-meals)", options: [
    { value: "listing-hero",     label: "Hero Banner" },
    { value: "listing-products", label: "Products Gallery" },
    { value: "listing-biryani",  label: "Biryani Section" },
    { value: "listing-cta",      label: "Final CTA" },
  ]},
  { group: "Product Page  (/full-meals/product/…)", options: [
    { value: "product-hero",     label: "Product Details" },
    { value: "product-feedback", label: "Customer Feedback" },
  ]},
];

const ALL_SECTION_OPTIONS = SECTION_OPTIONS.flatMap(g => g.options);

const PLACEMENT_LABELS: Record<string, string> = {
  "listing-hero":     "Listing · Hero Banner",
  "listing-products": "Listing · Products Gallery",
  "listing-biryani":  "Listing · Biryani Section",
  "listing-cta":      "Listing · Final CTA",
  "product-hero":     "Product · Product Details",
  "product-feedback": "Product · Customer Feedback",
};

const POSITION_LABELS: Record<string, string> = {
  top:    "Top (Before Section)",
  bottom: "Bottom (After Section)",
};

export default function FullMealAdBanners() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdBanner | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [ytInput, setYtInput] = useState("");
  const [ytError, setYtError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: banners = [], isLoading } = useQuery<AdBanner[]>({
    queryKey: ["/api/admin/full-meal-ad-banners"],
  });

  const createMut = useMutation({
    mutationFn: (data: FormState) => apiRequest("POST", "/api/admin/full-meal-ad-banners", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/full-meal-ad-banners"] }); toast({ title: "Banner created" }); setOpen(false); },
    onError: () => toast({ title: "Failed to create banner", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormState> }) => apiRequest("PUT", `/api/admin/full-meal-ad-banners/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/full-meal-ad-banners"] }); toast({ title: "Banner updated" }); setOpen(false); },
    onError: () => toast({ title: "Failed to update banner", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/full-meal-ad-banners/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/full-meal-ad-banners"] }); toast({ title: "Banner deleted" }); },
    onError: () => toast({ title: "Failed to delete banner", variant: "destructive" }),
  });

  const toggleActive = (banner: AdBanner) => {
    updateMut.mutate({ id: banner.id, data: { isActive: !banner.isActive } });
  };

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setYtInput("");
    setYtError("");
    setOpen(true);
  }

  function openEdit(b: AdBanner) {
    setEditing(b);
    setForm({
      title: b.title ?? "",
      subtitle: b.subtitle ?? "",
      ctaText: b.ctaText ?? "",
      ctaUrl: b.ctaUrl ?? "",
      mediaType: b.mediaType,
      mediaUrl: b.mediaUrl,
      placement: b.placement,
      position: b.position,
      isActive: b.isActive,
      sortOrder: b.sortOrder,
    });
    setYtInput(b.mediaType === "youtube" ? b.mediaUrl : "");
    setYtError("");
    setOpen(true);
  }

  function handleSave() {
    if (!form.mediaUrl) {
      toast({ title: "Please add an image or YouTube URL", variant: "destructive" });
      return;
    }
    if (editing) {
      updateMut.mutate({ id: editing.id, data: form });
    } else {
      createMut.mutate(form);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/file", { method: "POST", body: fd });
      const data = await res.json();
      const url = data.url || data.fileUrl;
      if (!url) throw new Error("No URL returned");
      setForm(f => ({ ...f, mediaType: "image", mediaUrl: url }));
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function applyYt() {
    setYtError("");
    const id = getYouTubeId(ytInput.trim());
    if (!id) { setYtError("Invalid YouTube URL"); return; }
    setForm(f => ({ ...f, mediaType: "youtube", mediaUrl: ytInput.trim() }));
  }

  function clearMedia() {
    setForm(f => ({ ...f, mediaType: "image", mediaUrl: "" }));
    setYtInput("");
    setYtError("");
  }

  const ytPreviewId = form.mediaType === "youtube" ? getYouTubeId(form.mediaUrl) : null;

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Full Meal Ad Banners</h1>
            <p className="text-sm text-muted-foreground mt-1">Image or YouTube video ads for the Full Meal listing and product pages.</p>
          </div>
          <Button onClick={openCreate} data-testid="button-add-banner">
            <Plus className="w-4 h-4 mr-2" /> Add Banner
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-md bg-muted" />)}
          </div>
        ) : banners.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <Layers className="w-10 h-10 opacity-30" />
              <p className="text-sm">No ad banners yet. Click "Add Banner" to create one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {banners.map(b => {
              const ytId = b.mediaType === "youtube" ? getYouTubeId(b.mediaUrl) : null;
              return (
                <Card key={b.id} data-testid={`card-banner-${b.id}`}>
                  <CardContent className="flex items-center gap-4 py-4">
                    {/* Thumbnail */}
                    <div className="w-24 h-16 rounded overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                      {b.mediaType === "youtube" && ytId ? (
                        <div className="relative w-full h-full">
                          <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="yt" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ) : b.mediaType === "image" && b.mediaUrl ? (
                        <img src={b.mediaUrl} alt={b.title ?? "banner"} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{b.title || "Untitled Banner"}</span>
                        <Badge variant="outline" className="text-xs">{PLACEMENT_LABELS[b.placement] ?? b.placement}</Badge>
                        <Badge variant="outline" className="text-xs">{POSITION_LABELS[b.position] ?? b.position}</Badge>
                        <Badge variant={b.mediaType === "youtube" ? "secondary" : "outline"} className="text-xs capitalize">{b.mediaType}</Badge>
                      </div>
                      {b.subtitle && <p className="text-xs text-muted-foreground truncate">{b.subtitle}</p>}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Switch
                        checked={b.isActive}
                        onCheckedChange={() => toggleActive(b)}
                        data-testid={`switch-banner-active-${b.id}`}
                      />
                      <Button size="icon" variant="ghost" onClick={() => openEdit(b)} data-testid={`button-edit-banner-${b.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this banner?")) deleteMut.mutate(b.id); }} data-testid={`button-delete-banner-${b.id}`}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Banner" : "Add Ad Banner"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Media upload */}
            <div className="space-y-3">
              <Label>Banner Media</Label>

              {/* Image upload */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Upload an image (JPG / PNG / WEBP)</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="button-upload-image">
                    <Upload className="w-3 h-3 mr-1" />
                    {uploading ? "Uploading…" : "Choose Image"}
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* YouTube URL */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Paste a YouTube video URL</p>
                <div className="flex gap-2">
                  <Input
                    value={ytInput}
                    onChange={e => { setYtInput(e.target.value); setYtError(""); }}
                    placeholder="https://youtube.com/watch?v=…"
                    data-testid="input-youtube-url"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={applyYt} data-testid="button-apply-youtube">
                    Apply
                  </Button>
                </div>
                {ytError && <p className="text-xs text-destructive mt-1">{ytError}</p>}
              </div>

              {/* Preview */}
              {form.mediaUrl && (
                <div className="relative">
                  {ytPreviewId ? (
                    <div className="relative w-full rounded overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <img src={`https://img.youtube.com/vi/${ytPreviewId}/mqdefault.jpg`} alt="yt preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-10 h-10 text-white" />
                      </div>
                    </div>
                  ) : form.mediaType === "image" ? (
                    <img src={form.mediaUrl} alt="preview" className="w-full rounded object-cover" style={{ maxHeight: 200 }} />
                  ) : null}
                  <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 bg-background/80"
                    onClick={clearMedia} data-testid="button-clear-media">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="banner-title">Title <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="banner-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. 50% off this week" data-testid="input-banner-title" />
            </div>

            {/* Subtitle */}
            <div className="space-y-1.5">
              <Label htmlFor="banner-subtitle">Subtitle <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea id="banner-subtitle" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Supporting text shown below the title" rows={2} data-testid="input-banner-subtitle" />
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>CTA Button Text <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} placeholder="e.g. Shop Now" data-testid="input-cta-text" />
              </div>
              <div className="space-y-1.5">
                <Label>CTA Link <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={form.ctaUrl} onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))} placeholder="/full-meals" data-testid="input-cta-url" />
              </div>
            </div>

            {/* Placement */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Show on — Section</Label>
                <Select value={form.placement} onValueChange={v => setForm(f => ({ ...f, placement: v }))}>
                  <SelectTrigger data-testid="select-placement">
                    <SelectValue placeholder="Pick a section…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_OPTIONS.map(group => (
                      <div key={group.group}>
                        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {group.group}
                        </div>
                        {group.options.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Select value={form.position} onValueChange={v => setForm(f => ({ ...f, position: v }))}>
                  <SelectTrigger data-testid="select-position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top (Before Section)</SelectItem>
                    <SelectItem value="bottom">Bottom (After Section)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sort + Active */}
            <div className="flex items-center gap-6">
              <div className="space-y-1.5 flex-1">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} data-testid="input-sort-order" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} data-testid="switch-is-active" />
                <Label>Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} data-testid="button-save-banner">
                {editing ? "Save Changes" : "Create Banner"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
