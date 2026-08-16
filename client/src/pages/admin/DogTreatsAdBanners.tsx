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
  { group: "Listing Page  (/dogtreat)", options: [
    { value: "listing-hero",     label: "Hero Banner" },
    { value: "listing-products", label: "Products Gallery" },
    { value: "listing-wolf",     label: "Wolf Principle Section" },
    { value: "listing-cta",      label: "Final CTA" },
  ]},
  { group: "Product Page  (/dogtreat/product/…)", options: [
    { value: "product-hero",     label: "Product Details" },
    { value: "product-feedback", label: "Customer Feedback" },
  ]},
];

const ALL_SECTION_OPTIONS = SECTION_OPTIONS.flatMap(g => g.options);

const PLACEMENT_LABELS: Record<string, string> = {
  "listing-hero":     "Listing · Hero Banner",
  "listing-products": "Listing · Products Gallery",
  "listing-wolf":     "Listing · Wolf Principle",
  "listing-cta":      "Listing · Final CTA",
  "product-hero":     "Product · Product Details",
  "product-feedback": "Product · Customer Feedback",
};

const POSITION_LABELS: Record<string, string> = {
  top:    "Top (Before Section)",
  bottom: "Bottom (After Section)",
};

export default function DogTreatsAdBanners() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdBanner | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [ytInput, setYtInput] = useState("");
  const [ytError, setYtError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: banners = [], isLoading } = useQuery<AdBanner[]>({
    queryKey: ["/api/admin/dog-treats-ad-banners"],
  });

  const createMutation = useMutation({
    mutationFn: (data: FormState) => apiRequest("POST", "/api/admin/dog-treats-ad-banners", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/dog-treats-ad-banners"] }); toast({ title: "Banner created" }); closeDialog(); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormState> }) => apiRequest("PUT", `/api/admin/dog-treats-ad-banners/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/dog-treats-ad-banners"] }); toast({ title: "Banner updated" }); closeDialog(); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/dog-treats-ad-banners/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/dog-treats-ad-banners"] }); toast({ title: "Banner deleted" }); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setYtInput(""); setYtError("");
    setOpen(true);
  }

  function openEdit(b: AdBanner) {
    setEditing(b);
    setForm({
      title: b.title || "", subtitle: b.subtitle || "",
      ctaText: b.ctaText || "", ctaUrl: b.ctaUrl || "",
      mediaType: b.mediaType, mediaUrl: b.mediaUrl,
      placement: b.placement, position: b.position,
      isActive: b.isActive, sortOrder: b.sortOrder,
    });
    setYtInput(""); setYtError("");
    setOpen(true);
  }

  function closeDialog() { setOpen(false); setEditing(null); }

  function set(k: keyof FormState, v: any) { setForm(f => ({ ...f, [k]: v })); }

  function handleYouTube() {
    const id = getYouTubeId(ytInput.trim());
    if (!id) { setYtError("Invalid YouTube URL"); return; }
    setYtError("");
    set("mediaType", "video");
    set("mediaUrl", `https://www.youtube.com/embed/${id}`);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/file", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (data.url) { set("mediaType", "image"); set("mediaUrl", data.url); }
      else toast({ title: "Upload failed", variant: "destructive" });
    } catch { toast({ title: "Upload error", variant: "destructive" }); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  function handleSubmit() {
    if (!form.mediaUrl) { toast({ title: "Media URL required", variant: "destructive" }); return; }
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  }

  const ytId = form.mediaUrl ? getYouTubeId(form.mediaUrl) : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dog Treats Ad Banners</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage ad banners for the /dogtreat listing page and individual product pages.</p>
          </div>
          <Button onClick={openCreate} data-testid="btn-create-banner"><Plus className="h-4 w-4 mr-2" />Add Banner</Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">Loading…</div>
        ) : banners.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center h-48 gap-4 text-muted-foreground">
            <Layers className="h-10 w-10 opacity-30" />
            <p>No banners yet. Add your first ad banner.</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {banners.map(b => {
              const ytId = b.mediaType === "video" ? getYouTubeId(b.mediaUrl) : null;
              return (
                <Card key={b.id} data-testid={`card-banner-${b.id}`}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="w-20 h-14 rounded-sm overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                      {b.mediaType === "video" && ytId
                        ? <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                        : b.mediaType === "image" && b.mediaUrl
                          ? <img src={b.mediaUrl} alt="" className="w-full h-full object-cover" />
                          : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                      {b.mediaType === "video" && <div className="absolute"><Play className="h-4 w-4 text-white" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{b.title || "(no title)"}</p>
                      {b.subtitle && <p className="text-sm text-muted-foreground truncate">{b.subtitle}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">{PLACEMENT_LABELS[b.placement] || b.placement}</Badge>
                        <Badge variant="secondary">{POSITION_LABELS[b.position] || b.position}</Badge>
                        {b.mediaType === "video" && <Badge variant="outline"><Play className="h-3 w-3 mr-1" />Video</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={b.isActive}
                        data-testid={`switch-active-${b.id}`}
                        onCheckedChange={v => updateMutation.mutate({ id: b.id, data: { isActive: v } })}
                      />
                      <Button size="icon" variant="ghost" onClick={() => openEdit(b)} data-testid={`btn-edit-${b.id}`}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(b.id)} data-testid={`btn-delete-${b.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Banner" : "Add Banner"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Banner headline" data-testid="input-title" />
                </div>
                <div className="space-y-1.5">
                  <Label>CTA Text</Label>
                  <Input value={form.ctaText} onChange={e => set("ctaText", e.target.value)} placeholder="Shop Now" data-testid="input-cta-text" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Subtitle</Label>
                <Textarea value={form.subtitle} onChange={e => set("subtitle", e.target.value)} placeholder="Supporting text" rows={2} data-testid="input-subtitle" />
              </div>
              <div className="space-y-1.5">
                <Label>CTA URL</Label>
                <Input value={form.ctaUrl} onChange={e => set("ctaUrl", e.target.value)} placeholder="/dogtreat" data-testid="input-cta-url" />
              </div>

              <div className="space-y-2">
                <Label>Media</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="btn-upload-image">
                    <Upload className="h-3.5 w-3.5 mr-1.5" />{uploading ? "Uploading…" : "Upload Image"}
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </div>
                <div className="flex gap-2">
                  <Input value={ytInput} onChange={e => setYtInput(e.target.value)} placeholder="YouTube URL…" className="flex-1" data-testid="input-youtube" />
                  <Button type="button" size="sm" variant="outline" onClick={handleYouTube} data-testid="btn-use-youtube">Use YouTube</Button>
                </div>
                {ytError && <p className="text-xs text-destructive">{ytError}</p>}
                <div className="flex gap-2 items-center">
                  <Input value={form.mediaUrl} onChange={e => set("mediaUrl", e.target.value)} placeholder="Or paste direct image URL" className="flex-1" data-testid="input-media-url" />
                  {form.mediaUrl && <Button type="button" size="icon" variant="ghost" onClick={() => { set("mediaUrl", ""); set("mediaType", "image"); }}><X className="h-4 w-4" /></Button>}
                </div>
                {form.mediaUrl && (
                  <div className="w-full rounded-sm overflow-hidden bg-muted" style={{ maxHeight: 160 }}>
                    {ytId
                      ? <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" className="w-full object-cover" />
                      : <img src={form.mediaUrl} alt="" className="w-full object-cover" />}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Placement (Section)</Label>
                  <Select value={form.placement} onValueChange={v => set("placement", v)}>
                    <SelectTrigger data-testid="select-placement"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SECTION_OPTIONS.map(g => (
                        <div key={g.group}>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{g.group}</div>
                          {g.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Position</Label>
                  <Select value={form.position} onValueChange={v => set("position", v)}>
                    <SelectTrigger data-testid="select-position"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top (Before Section)</SelectItem>
                      <SelectItem value="bottom">Bottom (After Section)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sortOrder} onChange={e => set("sortOrder", parseInt(e.target.value) || 0)} data-testid="input-sort-order" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={form.isActive} onCheckedChange={v => set("isActive", v)} data-testid="switch-is-active" />
                  <Label>Active</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={closeDialog} data-testid="btn-cancel">Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="btn-save">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving…" : editing ? "Save Changes" : "Create Banner"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
