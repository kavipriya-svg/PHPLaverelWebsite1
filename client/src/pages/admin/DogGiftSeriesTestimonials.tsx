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
import { Plus, Pencil, Trash2, Upload, X, Play } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

type Testimonial = {
  id: string;
  subjectCode: string;
  satisfactionLabel: string;
  quote: string;
  location: string | null;
  envData: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  isActive: boolean;
  sortOrder: number;
};

type FormState = {
  subjectCode: string;
  satisfactionLabel: string;
  quote: string;
  location: string;
  envData: string;
  mediaType: string;
  mediaUrl: string;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY: FormState = {
  subjectCode: "GS-001",
  satisfactionLabel: "5/5",
  quote: "",
  location: "",
  envData: "",
  mediaType: "none",
  mediaUrl: "",
  isActive: true,
  sortOrder: 0,
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]{11})/);
  return m ? m[1] : null;
}

export default function DogGiftSeriesTestimonials() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/dog-gift-series-testimonials"],
  });

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({
      subjectCode: t.subjectCode,
      satisfactionLabel: t.satisfactionLabel,
      quote: t.quote,
      location: t.location ?? "",
      envData: t.envData ?? "",
      mediaType: t.mediaType ?? "none",
      mediaUrl: t.mediaUrl ?? "",
      isActive: t.isActive,
      sortOrder: t.sortOrder,
    });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, mediaType: form.mediaType === "none" ? null : form.mediaType, mediaUrl: form.mediaType === "none" ? null : form.mediaUrl };
      return editing
        ? apiRequest("PUT", `/api/admin/dog-gift-series-testimonials/${editing.id}`, payload)
        : apiRequest("POST", "/api/admin/dog-gift-series-testimonials", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dog-gift-series-testimonials"] });
      toast({ title: editing ? "Testimonial updated" : "Testimonial created" });
      setOpen(false);
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/dog-gift-series-testimonials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dog-gift-series-testimonials"] });
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
      if (data.url) setForm(f => ({ ...f, mediaUrl: data.url, mediaType: "image" }));
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const ytId = form.mediaType === "youtube" ? getYouTubeId(form.mediaUrl) : null;

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">Gift Services — Testimonials</h1>
            <p className="text-muted-foreground text-sm mt-1">Customer testimonial cards shown in the testimonials section of the /giftseries page</p>
          </div>
          <Button onClick={openNew} data-testid="button-add-testimonial">
            <Plus className="h-4 w-4 mr-2" /> Add Testimonial
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No testimonials yet. Click "Add Testimonial" to create one.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {items.map(t => (
              <Card key={t.id} data-testid={`card-testimonial-${t.id}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  {t.mediaType && t.mediaType !== "none" && t.mediaUrl && (
                    <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                      {t.mediaType === "youtube" ? (
                        <img src={`https://img.youtube.com/vi/${getYouTubeId(t.mediaUrl)}/mqdefault.jpg`} alt="thumb" className="w-full h-full object-cover" />
                      ) : (
                        <img src={t.mediaUrl} alt="media" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-bold">{t.subjectCode}</span>
                      <Badge variant={t.isActive ? "default" : "secondary"}>{t.isActive ? "Active" : "Inactive"}</Badge>
                      <Badge variant="outline">{t.satisfactionLabel}</Badge>
                      {t.mediaType && t.mediaType !== "none" && (
                        <Badge variant="outline">{t.mediaType === "youtube" ? "YouTube" : "Image"}</Badge>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2 text-muted-foreground">"{t.quote}"</p>
                    {t.location && <p className="text-xs text-muted-foreground mt-1">{t.location}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(t)} data-testid={`button-edit-${t.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(t.id)} data-testid={`button-delete-${t.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Testimonial" : "New Testimonial"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Subject Code</Label>
                <Input value={form.subjectCode} onChange={e => setForm(f => ({ ...f, subjectCode: e.target.value }))} placeholder="GS-001" data-testid="input-subject-code" />
              </div>
              <div className="space-y-1">
                <Label>Satisfaction Label</Label>
                <Input value={form.satisfactionLabel} onChange={e => setForm(f => ({ ...f, satisfactionLabel: e.target.value }))} placeholder="5/5" data-testid="input-satisfaction" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Quote</Label>
              <Textarea value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} rows={3} placeholder="Customer feedback…" data-testid="input-quote" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Mumbai, India" data-testid="input-location" />
              </div>
              <div className="space-y-1">
                <Label>Env Data</Label>
                <Input value={form.envData} onChange={e => setForm(f => ({ ...f, envData: e.target.value }))} placeholder="ENV: 28°C / 72% RH" data-testid="input-env-data" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Media Type</Label>
              <Select value={form.mediaType} onValueChange={v => setForm(f => ({ ...f, mediaType: v, mediaUrl: "" }))}>
                <SelectTrigger data-testid="select-media-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="youtube">YouTube Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.mediaType === "image" && (
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex gap-2">
                  <Input value={form.mediaUrl} onChange={e => setForm(f => ({ ...f, mediaUrl: e.target.value }))} placeholder="https://… or upload below" data-testid="input-image-url" />
                  <Button type="button" size="icon" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="button-upload">
                    {uploading ? <span className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                {form.mediaUrl && (
                  <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted">
                    <img src={form.mediaUrl} alt="preview" className="w-full h-full object-cover" />
                    <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-6 w-6" onClick={() => setForm(f => ({ ...f, mediaUrl: "" }))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            {form.mediaType === "youtube" && (
              <div className="space-y-2">
                <Label>YouTube URL</Label>
                <Input value={form.mediaUrl} onChange={e => setForm(f => ({ ...f, mediaUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=…" data-testid="input-youtube-url" />
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
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.quote.trim()} className="flex-1" data-testid="button-save">
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
