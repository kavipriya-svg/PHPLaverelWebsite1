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

// Extract YouTube video ID from various URL formats
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
    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
      style={{ backgroundColor: bg, color: fg }}>
      {initials}
    </div>
  );
}

function MediaPreview({ mediaType, mediaUrl }: { mediaType: string; mediaUrl: string | null }) {
  if (!mediaUrl) return null;
  if (mediaType === "video") {
    const ytId = getYouTubeId(mediaUrl);
    if (ytId) {
      return (
        <div className="relative w-24 h-16 rounded-md overflow-hidden shrink-0 border">
          <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="YouTube thumbnail"
            className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
      );
    }
    return null;
  }
  return (
    <div className="w-24 h-16 rounded-md overflow-hidden shrink-0 border">
      <img src={mediaUrl} alt="Customer photo" className="w-full h-full object-cover" />
    </div>
  );
}

export default function FullMealFeedback() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FeedbackItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [ytInput, setYtInput] = useState("");

  const { data: items = [], isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ["/api/admin/full-meal-feedback"],
  });

  const createMut = useMutation({
    mutationFn: (data: FormState) => apiRequest("POST", "/api/admin/full-meal-feedback", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/full-meal-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/full-meal-feedback"] });
      toast({ title: "Feedback added" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormState }) =>
      apiRequest("PUT", `/api/admin/full-meal-feedback/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/full-meal-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/full-meal-feedback"] });
      toast({ title: "Feedback updated" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/full-meal-feedback/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/full-meal-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/full-meal-feedback"] });
      toast({ title: "Feedback deleted" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PUT", `/api/admin/full-meal-feedback/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/full-meal-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/full-meal-feedback"] });
    },
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setYtInput("");
    setDialogOpen(true);
  }

  function openEdit(item: FeedbackItem) {
    setEditing(item);
    setForm({
      name: item.name,
      role: item.role,
      avatarBg: item.avatarBg,
      avatarFg: item.avatarFg,
      rating: item.rating,
      reviewText: item.reviewText,
      hasMedia: item.hasMedia,
      mediaType: item.mediaType,
      mediaUrl: item.mediaUrl,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setYtInput(item.mediaType === "video" && item.mediaUrl ? item.mediaUrl : "");
    setDialogOpen(true);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/file", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url = data.url || data.fileUrl || "";
      setForm(f => ({ ...f, mediaUrl: url, hasMedia: true, mediaType: "photo" }));
      toast({ title: "Photo uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function applyYouTubeUrl() {
    const trimmed = ytInput.trim();
    if (!trimmed) {
      setForm(f => ({ ...f, mediaUrl: null, hasMedia: false }));
      return;
    }
    const ytId = getYouTubeId(trimmed);
    if (!ytId) {
      toast({ title: "Invalid YouTube URL", description: "Paste a valid youtube.com or youtu.be link.", variant: "destructive" });
      return;
    }
    setForm(f => ({ ...f, mediaUrl: trimmed, hasMedia: true, mediaType: "video" }));
    toast({ title: "YouTube video set" });
  }

  function clearMedia() {
    setForm(f => ({ ...f, mediaUrl: null, hasMedia: false }));
    setYtInput("");
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.reviewText.trim()) {
      toast({ title: "Name and review text are required", variant: "destructive" });
      return;
    }
    if (editing) {
      updateMut.mutate({ id: editing.id, data: form });
    } else {
      createMut.mutate(form);
    }
  }

  const isPending = createMut.isPending || updateMut.isPending;
  const ytId = form.mediaType === "video" && form.mediaUrl ? getYouTubeId(form.mediaUrl) : null;

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Customer Feedback</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage testimonials shown on Full Meal &amp; Biryani product pages. Supports customer photos and YouTube videos.
            </p>
          </div>
          <Button onClick={openNew} data-testid="button-add-feedback">
            <Plus className="h-4 w-4 mr-2" />
            Add Feedback
          </Button>
        </div>

        <Separator />

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16 text-muted-foreground">
              No feedback entries yet. Add the first one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} data-testid={`card-feedback-${item.id}`}>
                <CardContent className="flex items-start gap-4 py-4">
                  <AvatarPreview bg={item.avatarBg} fg={item.avatarFg} name={item.name} />
                  {item.mediaUrl && <MediaPreview mediaType={item.mediaType} mediaUrl={item.mediaUrl} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.role}</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className="w-3 h-3"
                            fill={s <= item.rating ? "currentColor" : "none"}
                            style={{ color: s <= item.rating ? "#ca8a04" : "#d1d5db" }} />
                        ))}
                      </div>
                      {item.hasMedia && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          {item.mediaType === "video" ? "YouTube Video" : "Photo"}
                        </Badge>
                      )}
                      <Badge variant={item.isActive ? "default" : "outline"} className="text-xs">
                        {item.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 italic">
                      "{item.reviewText}"
                    </p>
                    {item.mediaUrl && item.mediaType === "video" && (
                      <p className="text-xs text-blue-500 mt-1 truncate">{item.mediaUrl}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={item.isActive}
                      data-testid={`toggle-active-${item.id}`}
                      onCheckedChange={(v) => toggleMut.mutate({ id: item.id, isActive: v })}
                    />
                    <Button size="icon" variant="ghost" data-testid={`button-edit-${item.id}`}
                      onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" data-testid={`button-delete-${item.id}`}
                      onClick={() => setDeleteId(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Feedback" : "Add Feedback"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">

            {/* Avatar */}
            <div className="flex gap-3 items-center">
              <AvatarPreview bg={form.avatarBg} fg={form.avatarFg} name={form.name} />
              <div className="flex-1">
                <Label className="text-xs mb-1.5 block">Avatar Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_PRESETS.map((p) => (
                    <button key={p.label} title={p.label}
                      onClick={() => setForm(f => ({ ...f, avatarBg: p.bg, avatarFg: p.fg }))}
                      className="w-7 h-7 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: p.bg,
                        borderColor: form.avatarBg === p.bg ? p.fg : "transparent",
                      }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Name + Role */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fb-name" className="text-xs">Customer Name *</Label>
                <Input id="fb-name" data-testid="input-feedback-name"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Priya S." />
              </div>
              <div>
                <Label htmlFor="fb-role" className="text-xs">Role / Label</Label>
                <Input id="fb-role" data-testid="input-feedback-role"
                  value={form.role}
                  onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="Labrador Owner" />
              </div>
            </div>

            {/* Stars */}
            <div>
              <Label className="text-xs mb-2 block">Star Rating</Label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map((s) => (
                  <button key={s} data-testid={`star-${s}`}
                    onClick={() => setForm(f => ({ ...f, rating: s }))}>
                    <Star className="w-6 h-6 transition-colors"
                      fill={s <= form.rating ? "#ca8a04" : "none"}
                      stroke={s <= form.rating ? "#ca8a04" : "#9ca3af"} />
                  </button>
                ))}
              </div>
            </div>

            {/* Review text */}
            <div>
              <Label htmlFor="fb-text" className="text-xs">Review Text *</Label>
              <Textarea id="fb-text" data-testid="input-feedback-text"
                value={form.reviewText}
                onChange={(e) => setForm(f => ({ ...f, reviewText: e.target.value }))}
                placeholder="Write the customer's review here…"
                rows={4} />
            </div>

            {/* ── Media section ── */}
            <div className="space-y-3">
              <Label className="text-xs block">Customer Media (optional)</Label>

              {/* Current media preview */}
              {form.mediaUrl && (
                <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/40">
                  {form.mediaType === "video" && ytId ? (
                    <div className="relative w-20 h-14 rounded overflow-hidden shrink-0">
                      <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                        className="w-full h-full object-cover" alt="thumbnail" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                  ) : form.mediaType === "photo" ? (
                    <div className="w-20 h-14 rounded overflow-hidden shrink-0">
                      <img src={form.mediaUrl} className="w-full h-full object-cover" alt="preview" />
                    </div>
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{form.mediaType === "video" ? "YouTube Video" : "Customer Photo"}</p>
                    <p className="text-xs text-muted-foreground truncate">{form.mediaUrl}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={clearMedia}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}

              {/* Upload photo */}
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Upload Customer Photo
                </p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP — max 10MB</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  data-testid="input-photo-upload" onChange={handlePhotoUpload} />
                <Button variant="outline" size="sm" disabled={uploading}
                  data-testid="button-upload-photo"
                  onClick={() => fileInputRef.current?.click()}>
                  {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</> : "Choose Photo"}
                </Button>
              </div>

              {/* YouTube URL */}
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" /> YouTube Video URL
                </p>
                <p className="text-xs text-muted-foreground">
                  Paste a YouTube link — e.g. https://youtu.be/dQw4w9WgXcQ
                </p>
                <div className="flex gap-2">
                  <Input
                    data-testid="input-youtube-url"
                    value={ytInput}
                    onChange={(e) => setYtInput(e.target.value)}
                    placeholder="https://youtu.be/..."
                    className="flex-1 text-sm" />
                  <Button variant="outline" size="sm"
                    data-testid="button-apply-youtube"
                    onClick={applyYouTubeUrl}>
                    Apply
                  </Button>
                </div>
                {ytInput && !getYouTubeId(ytInput) && (
                  <p className="text-xs text-destructive">Unrecognised YouTube URL format</p>
                )}
              </div>
            </div>

            {/* Sort order + Active */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fb-sort" className="text-xs">Sort Order</Label>
                <Input id="fb-sort" type="number" data-testid="input-sort-order"
                  value={form.sortOrder}
                  onChange={(e) => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-md border">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Show on product pages</p>
                </div>
                <Switch data-testid="toggle-is-active"
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm(f => ({ ...f, isActive: v }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-feedback">
              {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the feedback entry from all product pages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
