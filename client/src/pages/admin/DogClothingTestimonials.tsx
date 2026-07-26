import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Quote } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Testimonial {
  id: string;
  subjectCode: string;
  satisfactionLabel: string;
  quote: string;
  location: string | null;
  envData: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

type FormState = Omit<Testimonial, "id" | "createdAt">;

const EMPTY: FormState = {
  subjectCode: "ALPHA-01",
  satisfactionLabel: "5/5",
  quote: "",
  location: "",
  envData: "",
  isActive: true,
  sortOrder: 0,
};

export default function DogClothingTestimonials() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data: items = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/dog-clothing-testimonials"],
  });

  const createMut = useMutation({
    mutationFn: (d: FormState) => apiRequest("POST", "/api/admin/dog-clothing-testimonials", d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/dog-clothing-testimonials"] }); toast({ title: "Testimonial created" }); closeDialog(); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormState> }) => apiRequest("PUT", `/api/admin/dog-clothing-testimonials/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/dog-clothing-testimonials"] }); toast({ title: "Testimonial updated" }); closeDialog(); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/dog-clothing-testimonials/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/dog-clothing-testimonials"] }); toast({ title: "Testimonial deleted" }); setDeleteId(null); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function openCreate() { setEditing(null); setForm(EMPTY); setOpen(true); }

  function openEdit(item: Testimonial) {
    setEditing(item);
    setForm({
      subjectCode: item.subjectCode,
      satisfactionLabel: item.satisfactionLabel,
      quote: item.quote,
      location: item.location ?? "",
      envData: item.envData ?? "",
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setOpen(true);
  }

  function closeDialog() { setOpen(false); setEditing(null); }

  function handleSubmit() {
    if (!form.quote.trim()) { toast({ title: "Quote text is required", variant: "destructive" }); return; }
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dog Clothing — Testimonials</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Editorial subject testimonials shown in the Testimonial Archive section of the Dog Clothing page.
            </p>
          </div>
          <Button onClick={openCreate} data-testid="btn-add-testimonial">
            <Plus className="h-4 w-4 mr-2" /> Add Testimonial
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <Quote className="h-10 w-10 opacity-30" />
              <p>No testimonials yet. Add your first one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {items.map(item => (
              <Card key={item.id} data-testid={`card-testimonial-${item.id}`}>
                <CardContent className="flex items-start gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-semibold bg-muted px-2 py-0.5 rounded">SUBJECT: {item.subjectCode}</span>
                      <Badge variant="outline" className="text-xs font-mono">SATISFACTION: {item.satisfactionLabel}</Badge>
                      {item.location && <Badge variant="outline" className="text-xs font-mono">{item.location}</Badge>}
                      {!item.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 italic">"{item.quote}"</p>
                    {item.envData && <p className="text-xs text-muted-foreground mt-1 font-mono">{item.envData}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={item.isActive}
                      data-testid={`switch-active-${item.id}`}
                      onCheckedChange={v => updateMut.mutate({ id: item.id, data: { isActive: v } })}
                    />
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)} data-testid={`btn-edit-${item.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(item.id)} data-testid={`btn-delete-${item.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create / Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Subject Code *</Label>
                  <Input value={form.subjectCode} onChange={e => set("subjectCode", e.target.value)} placeholder="ALPHA-09" data-testid="input-subject-code" />
                  <p className="text-xs text-muted-foreground">Shown as: SUBJECT: ALPHA-09</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Satisfaction Rating</Label>
                  <Input value={form.satisfactionLabel} onChange={e => set("satisfactionLabel", e.target.value)} placeholder="5/5 or OPTIMAL" data-testid="input-satisfaction" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Quote Text *</Label>
                <Textarea
                  value={form.quote}
                  onChange={e => set("quote", e.target.value)}
                  placeholder="The customer's testimonial in their own words…"
                  rows={3}
                  data-testid="input-quote"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Location <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                  <Input value={form.location ?? ""} onChange={e => set("location", e.target.value)} placeholder="SECTOR 7" data-testid="input-location" />
                </div>
                <div className="space-y-1.5">
                  <Label>Environmental Data <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                  <Input value={form.envData ?? ""} onChange={e => set("envData", e.target.value)} placeholder="TEMP: -12°C" data-testid="input-env-data" />
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
            </div>
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={closeDialog} data-testid="btn-cancel">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} data-testid="btn-save">
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
              <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)} data-testid="btn-confirm-delete">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
