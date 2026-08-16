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
import { Plus, Pencil, Trash2, Upload, X, Play, Image as ImageIcon, Layers } from "lucide-react";
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
  title: "", subtitle: "", ctaText: "", ctaUrl: "",
  mediaType: "image", mediaUrl: "",
  placement: "hero", position: "bottom",
  isActive: true, sortOrder: 0,
};

const SECTION_OPTIONS = [
  { value: "hero",           label: "① Hero — Biological Synchronization (top of page)" },
  { value: "products-1",     label: "③ Series 02 — Product Grid Block 1 (first grid)" },
  { value: "molecular",      label: "④ Molecular Precision (editorial break section)" },
  { value: "field-logs",     label: "⑤ Field Logs — Testimonial Archive" },
  { value: "neural-bridge",  label: "⑥ Neural Bridge Highlight (dark section)" },
  { value: "products-2",     label: "⑦ Series 03 — Product Grid Block 2 (second grid)" },
  { value: "both",           label: "All Sections (appears on all product grids)" },
];

const PLACEMENT_LABELS: Record<string, string> = {
  "hero":          "Hero Section",
  "products-1":    "Series 02 Grid — Block 1",
  "molecular":     "Molecular Precision",
  "field-logs":    "Field Logs / Testimonials",
  "neural-bridge": "Neural Bridge Highlight",
  "products-2":    "Series 03 Grid — Block 2",
  "both":          "All Sections",
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]{11})/);
  return m ? m[1] : null;
}

export default function DogParentClothingAdBanners() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdBanner | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useQuery<AdBanner[]>({
    queryKey: ["/api/admin/dog-parent-clothing-ad-banners"],
  });

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (b: AdBanner) => {
    setEditing(b);
    setForm({
      title: b.title ?? "", subtitle: b.subtitle ?? "",
      ctaText: b.ctaText ?? "", ctaUrl: b.ctaUrl ?? "",
      mediaType: b.mediaType, mediaUrl: b.mediaUrl,
      placement: b.placement, position: b.position,
      isActive: b.isActive, sortOrder: b.sortOrder,
    });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? apiRequest("PUT", `/api/admin/dog-parent-clothing-ad-banners/${editing.id}`, form)
        : apiRequest("POST", "/api/admin/dog-parent-clothing-ad-banners", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dog-parent-clothing-ad-banners"] });
      toast({ title: editing ? "Banner updated" : "Banner created" });
      setOpen(false);
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/dog-parent-clothing-ad-banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dog-parent-clothing-ad-banners"] });
      toast({ title: "Deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/file", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (data.url) setForm(f => ({ ...f, mediaUrl: data.url }));
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const ytId = form.mediaType === "video" ? getYouTubeId(form.mediaUrl) : null;

  const grouped = SECTION_OPTIONS.map(opt => ({
    ...opt,
    banners: items.filter(b => b.placement === opt.value),
  }));

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">Dog Parent Clothing — Ad Banners</h1>
            <p className="text-muted-foreground text-sm mt-1">Promotional banners placed in specific sections of the <code>/category/twinning</code> page</p>
          </div>
          <Button onClick={openNew} data-testid="button-add-banner">
            <Plus className="h-4 w-4 mr-2" /> Add Banner
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No ad banners yet. Click "Add Banner" to create one.</CardContent></Card>
        ) : (
          <div className="space-y-6">
            {grouped.filter(g => g.banners.length > 0).map(group => (
              <div key={group.value}>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{group.label}</p>
                <div className="space-y-2">
                  {group.banners.map(b => (
                    <Card key={b.id} data-testid={`card-banner-${b.id}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-16 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {b.mediaType === "video" ? (
                            <div className="w-full h-full flex items-center justify-center bg-black">
                              <Play className="h-5 w-5 text-white" />
                            </div>
                          ) : (
                            <img src={b.mediaUrl} alt="thumb" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm truncate">{b.title || "(no title)"}</span>
                            <Badge variant={b.isActive ? "default" : "secondary"}>{b.isActive ? "Active" : "Inactive"}</Badge>
                            <Badge variant="outline">{PLACEMENT_LABELS[b.placement] ?? b.placement}</Badge>
                          </div>
                          {b.subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{b.subtitle}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(b)} data-testid={`button-edit-${b.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(b.id)} data-testid={`button-delete-${b.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Ad Banner" : "New Ad Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Page Section</Label>
              <Select value={form.placement} onValueChange={v => setForm(f => ({ ...f, placement: v }))}>
                <SelectTrigger data-testid="select-placement"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Banner Position</Label>
              <Select value={form.position} onValueChange={v => setForm(f => ({ ...f, position: v }))}>
                <SelectTrigger data-testid="select-position"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top of section</SelectItem>
                  <SelectItem value="bottom">Bottom of section</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Optional headline…" data-testid="input-title" />
            </div>
            <div className="space-y-1">
              <Label>Subtitle</Label>
              <Textarea value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} rows={2} placeholder="Optional subtitle…" data-testid="input-subtitle" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>CTA Text</Label>
                <Input value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} placeholder="Shop Now" data-testid="input-cta-text" />
              </div>
              <div className="space-y-1">
                <Label>CTA URL</Label>
                <Input value={form.ctaUrl} onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))} placeholder="/category/twinning" data-testid="input-cta-url" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Media Type</Label>
              <Select value={form.mediaType} onValueChange={v => setForm(f => ({ ...f, mediaType: v, mediaUrl: "" }))}>
                <SelectTrigger data-testid="select-media-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video (YouTube URL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.mediaType === "image" && (
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex gap-2">
                  <Input value={form.mediaUrl} onChange={e => setForm(f => ({ ...f, mediaUrl: e.target.value }))} placeholder="https://… or upload" data-testid="input-media-url" />
                  <Button type="button" size="icon" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="button-upload">
                    {uploading ? <span className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                {form.mediaUrl && (
                  <div className="relative w-full h-28 rounded-md overflow-hidden bg-muted">
                    <img src={form.mediaUrl} alt="preview" className="w-full h-full object-cover" />
                    <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-6 w-6" onClick={() => setForm(f => ({ ...f, mediaUrl: "" }))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            {form.mediaType === "video" && (
              <div className="space-y-2">
                <Label>YouTube URL</Label>
                <Input value={form.mediaUrl} onChange={e => setForm(f => ({ ...f, mediaUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=…" data-testid="input-video-url" />
                {ytId && (
                  <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
                    <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="thumb" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-10 w-10 text-white drop-shadow" />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} data-testid="input-sort-order" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} data-testid="switch-active" />
                <Label>Active</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.mediaUrl.trim()} className="flex-1" data-testid="button-save">
                {saveMutation.isPending ? "Saving…" : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
