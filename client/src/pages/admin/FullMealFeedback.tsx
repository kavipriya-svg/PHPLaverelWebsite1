import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Star, Image, Film, Eye, EyeOff } from "lucide-react";
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
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const AVATAR_PRESETS = [
  { label: "Green", bg: "#a5d0b8", fg: "#264e3c" },
  { label: "Peach", bg: "#ffb695", fg: "#76330d" },
  { label: "Mint", bg: "#c0edd4", fg: "#012d1d" },
  { label: "Blush", bg: "#ffdbcc", fg: "#471800" },
  { label: "Sky", bg: "#b3d9f7", fg: "#0a3d62" },
  { label: "Lavender", bg: "#d4c5f9", fg: "#3b1f8c" },
];

const EMPTY: Omit<FeedbackItem, "id" | "createdAt"> = {
  name: "",
  role: "Verified Buyer",
  avatarBg: "#a5d0b8",
  avatarFg: "#264e3c",
  rating: 5,
  reviewText: "",
  hasMedia: false,
  mediaType: "photo",
  isActive: true,
  sortOrder: 0,
};

function AvatarPreview({ bg, fg, name }: { bg: string; fg: string; name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "??";
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
      style={{ backgroundColor: bg, color: fg }}>
      {initials}
    </div>
  );
}

export default function FullMealFeedback() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FeedbackItem | null>(null);
  const [form, setForm] = useState<Omit<FeedbackItem, "id" | "createdAt">>(EMPTY);

  const { data: items = [], isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ["/api/admin/full-meal-feedback"],
  });

  const createMut = useMutation({
    mutationFn: (data: typeof EMPTY) => apiRequest("POST", "/api/admin/full-meal-feedback", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/full-meal-feedback"] });
      toast({ title: "Feedback added" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY }) =>
      apiRequest("PUT", `/api/admin/full-meal-feedback/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/full-meal-feedback"] });
      toast({ title: "Feedback updated" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/full-meal-feedback/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/full-meal-feedback"] });
      toast({ title: "Feedback deleted" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PUT", `/api/admin/full-meal-feedback/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/full-meal-feedback"] }),
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
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
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setDialogOpen(true);
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

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Customer Feedback</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage testimonials shown on Full Meal &amp; Biryani product pages.
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
                          {item.mediaType === "video" ? <Film className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                          {item.mediaType}
                        </Badge>
                      )}
                      <Badge variant={item.isActive ? "default" : "outline"} className="text-xs">
                        {item.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 italic">
                      "{item.reviewText}"
                    </p>
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
          <div className="space-y-4 py-2">
            <div className="flex gap-3 items-center">
              <AvatarPreview bg={form.avatarBg} fg={form.avatarFg} name={form.name} />
              <div className="flex-1">
                <Label className="text-xs mb-1 block">Avatar Color</Label>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name" className="text-xs">Customer Name *</Label>
                <Input id="name" data-testid="input-feedback-name"
                  value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Priya S." />
              </div>
              <div>
                <Label htmlFor="role" className="text-xs">Role / Label</Label>
                <Input id="role" data-testid="input-feedback-role"
                  value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="Labrador Owner" />
              </div>
            </div>

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

            <div>
              <Label htmlFor="reviewText" className="text-xs">Review Text *</Label>
              <Textarea id="reviewText" data-testid="input-feedback-text"
                value={form.reviewText}
                onChange={(e) => setForm(f => ({ ...f, reviewText: e.target.value }))}
                placeholder="Write the customer's review here…"
                rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-md border">
                <div>
                  <p className="text-sm font-medium">Has Media</p>
                  <p className="text-xs text-muted-foreground">Shows photo/video badge</p>
                </div>
                <Switch data-testid="toggle-has-media"
                  checked={form.hasMedia}
                  onCheckedChange={(v) => setForm(f => ({ ...f, hasMedia: v }))} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Media Type</Label>
                <Select value={form.mediaType}
                  onValueChange={(v) => setForm(f => ({ ...f, mediaType: v }))}>
                  <SelectTrigger data-testid="select-media-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sortOrder" className="text-xs">Sort Order</Label>
                <Input id="sortOrder" type="number" data-testid="input-sort-order"
                  value={form.sortOrder}
                  onChange={(e) => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-md border">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Show on product page</p>
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
              {isPending ? "Saving…" : "Save"}
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
              This will permanently remove the feedback entry from the product pages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
