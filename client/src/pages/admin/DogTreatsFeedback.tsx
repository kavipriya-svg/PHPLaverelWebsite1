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
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Star, Upload, Link, X, Loader2, Play } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface FeedbackItem {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  avatarFg: string;
  rating: number;
  reviewText: string;
  hasMedia: boolean;
  mediaType: string;
  mediaUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const AVATAR_PRESETS = [
  { label: "Green",    bg: "#a5d0b8", fg: "#264e3c" },
  { label: "Peach",    bg: "#ffb695", fg: "#76330d" },
  { label: "Mint",     bg: "#c0edd4", fg: "#012d1d" },
  { label: "Blush",    bg: "#ffdbcc", fg: "#471800" },
  { label: "Sky",      bg: "#b3d9f7", fg: "#0a3d62" },
  { label: "Lavender", bg: "#d4c5f9", fg: "#3b1f8c" },
];

type FormState = Omit<FeedbackItem, "id" | "createdAt">;

const EMPTY: FormState = {
  name: "",
  role: "Verified Buyer",
  avatarBg: "#a5d0b8",
  avatarFg: "#264e3c",
  rating: 5,
  reviewText: "",
  hasMedia: false,
  mediaType: "photo",
  mediaUrl: null,
  isActive: true,
  sortOrder: 0,
};

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function AvatarPreview({ bg, fg, name }: { bg: string; fg: string; name: string }) {
  const initials = name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??";
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
      style={{ backgroundColor: bg, color: fg }}
    >
      {initials}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} data-testid={`star-${s}`}>
          <Star className={`h-5 w-5 ${s <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

export default function DogTreatsFeedback() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FeedbackItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [mediaInputMode, setMediaInputMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ["/api/admin/dog-treats-feedback"],
  });

  const createMutation = useMutation({
    mutationFn: (data: FormState) => apiRequest("POST", "/api/admin/dog-treats-feedback", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/dog-treats-feedback"] }); toast({ title: "Feedback created" }); closeDialog(); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormState> }) => apiRequest("PUT", `/api/admin/dog-treats-feedback/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/dog-treats-feedback"] }); toast({ title: "Feedback updated" }); closeDialog(); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/dog-treats-feedback/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/dog-treats-feedback"] }); toast({ title: "Feedback deleted" }); setDeleteId(null); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setUrlInput("");
    setOpen(true);
  }

  function openEdit(item: FeedbackItem) {
    setEditing(item);
    setForm({
      name: item.name, role: item.role,
      avatarBg: item.avatarBg, avatarFg: item.avatarFg,
      rating: item.rating, reviewText: item.reviewText,
      hasMedia: item.hasMedia, mediaType: item.mediaType,
      mediaUrl: item.mediaUrl, isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setUrlInput(item.mediaUrl || "");
    setOpen(true);
  }

  function closeDialog() { setOpen(false); setEditing(null); }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/file", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (data.url) { set("mediaUrl", data.url); set("mediaType", "photo"); }
      else toast({ title: "Upload failed", variant: "destructive" });
    } catch { toast({ title: "Upload error", variant: "destructive" }); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  function applyUrlInput() {
    const url = urlInput.trim();
    if (!url) return;
    const ytId = getYouTubeId(url);
    if (ytId) { set("mediaType", "video"); set("mediaUrl", `https://www.youtube.com/embed/${ytId}`); }
    else { set("mediaType", "photo"); set("mediaUrl", url); }
  }

  function handleSubmit() {
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    if (!form.reviewText.trim()) { toast({ title: "Review text is required", variant: "destructive" }); return; }
    const payload = { ...form, mediaUrl: form.hasMedia ? form.mediaUrl : null };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  }

  const ytPreviewId = form.mediaUrl ? getYouTubeId(form.mediaUrl) : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dog Treats Customer Feedback</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage editorial testimonials shown on the Dog Treats product pages.
            </p>
          </div>
          <Button onClick={openCreate} data-testid="btn-add-feedback">
            <Plus className="h-4 w-4 mr-2" />Add Testimonial
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <Star className="h-10 w-10 opacity-30" />
              <p>No testimonials yet. Add your first one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => {
              const ytId = item.mediaType === "video" && item.mediaUrl ? getYouTubeId(item.mediaUrl) : null;
              return (
                <Card key={item.id} data-testid={`card-feedback-${item.id}`}>
                  <CardContent className="flex items-start gap-4 py-4">
                    <AvatarPreview bg={item.avatarBg} fg={item.avatarFg} name={item.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{item.name}</span>
                        <Badge variant="outline" className="text-xs">{item.role}</Badge>
                        {!item.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                      </div>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= item.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.reviewText}</p>
                      {item.hasMedia && (
                        <div className="mt-2">
                          {ytId
                            ? <div className="flex items-center gap-1 text-xs text-muted-foreground"><Play className="h-3 w-3" />YouTube video attached</div>
                            : item.mediaUrl
                              ? <img src={item.mediaUrl} alt="" className="h-12 w-20 object-cover rounded-sm" />
                              : null}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={item.isActive}
                        data-testid={`switch-active-${item.id}`}
                        onCheckedChange={v => updateMutation.mutate({ id: item.id, data: { isActive: v } })}
                      />
                      <Button size="icon" variant="ghost" onClick={() => openEdit(item)} data-testid={`btn-edit-${item.id}`}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(item.id)} data-testid={`btn-delete-${item.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create / Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              {/* Avatar + Name + Role row */}
              <div className="flex items-start gap-4">
                <AvatarPreview bg={form.avatarBg} fg={form.avatarFg} name={form.name} />
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Name *</Label>
                      <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Priya S." data-testid="input-name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Role / Tag</Label>
                      <Input value={form.role} onChange={e => set("role", e.target.value)} placeholder="Verified Buyer" data-testid="input-role" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Avatar colour preset</Label>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_PRESETS.map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => { set("avatarBg", p.bg); set("avatarFg", p.fg); }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all ${form.avatarBg === p.bg ? "border-primary" : "border-transparent"}`}
                          style={{ backgroundColor: p.bg, color: p.fg }}
                          data-testid={`btn-avatar-preset-${p.label.toLowerCase()}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Rating */}
              <div className="space-y-1.5">
                <Label>Rating</Label>
                <StarRating value={form.rating} onChange={v => set("rating", v)} />
              </div>

              {/* Review Text */}
              <div className="space-y-1.5">
                <Label>Review Text *</Label>
                <Textarea
                  value={form.reviewText}
                  onChange={e => set("reviewText", e.target.value)}
                  placeholder="What the customer said about the treats…"
                  rows={3}
                  data-testid="input-review-text"
                />
              </div>

              <Separator />

              {/* Media toggle */}
              <div className="flex items-center gap-3">
                <Switch checked={form.hasMedia} onCheckedChange={v => set("hasMedia", v)} data-testid="switch-has-media" />
                <Label>Attach media (photo / video)</Label>
              </div>

              {form.hasMedia && (
                <div className="space-y-3 pl-2">
                  <div className="flex gap-2">
                    <Button
                      type="button" size="sm"
                      variant={mediaInputMode === "upload" ? "default" : "outline"}
                      onClick={() => setMediaInputMode("upload")}
                      data-testid="btn-mode-upload"
                    ><Upload className="h-3.5 w-3.5 mr-1.5" />Upload</Button>
                    <Button
                      type="button" size="sm"
                      variant={mediaInputMode === "url" ? "default" : "outline"}
                      onClick={() => setMediaInputMode("url")}
                      data-testid="btn-mode-url"
                    ><Link className="h-3.5 w-3.5 mr-1.5" />URL / YouTube</Button>
                  </div>

                  {mediaInputMode === "upload" && (
                    <div className="space-y-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="btn-upload-file">
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                        {uploading ? "Uploading…" : "Choose file"}
                      </Button>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      <p className="text-xs text-muted-foreground">Recommended: 400×400px, JPG/PNG/WebP, max 5MB</p>
                    </div>
                  )}

                  {mediaInputMode === "url" && (
                    <div className="flex gap-2">
                      <Input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="Image URL or YouTube link" className="flex-1" data-testid="input-media-url" />
                      <Button type="button" size="sm" onClick={applyUrlInput} data-testid="btn-apply-url">Apply</Button>
                    </div>
                  )}

                  {form.mediaUrl && (
                    <div className="relative rounded-sm overflow-hidden bg-muted" style={{ maxHeight: 160 }}>
                      {ytPreviewId
                        ? <img src={`https://img.youtube.com/vi/${ytPreviewId}/mqdefault.jpg`} alt="" className="w-full object-cover" />
                        : <img src={form.mediaUrl} alt="" className="w-full object-cover" />}
                      <Button
                        type="button" size="icon" variant="ghost"
                        className="absolute top-1 right-1 bg-black/40 hover:bg-black/60 text-white"
                        onClick={() => { set("mediaUrl", null); setUrlInput(""); }}
                        data-testid="btn-remove-media"
                      ><X className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              )}

              <Separator />

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
            </div>
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={closeDialog} data-testid="btn-cancel">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="btn-save">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? "Save Changes" : "Add Testimonial"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete testimonial?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="btn-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} data-testid="btn-confirm-delete">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
