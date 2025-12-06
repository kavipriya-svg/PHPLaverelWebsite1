import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  GripVertical,
  LayoutGrid,
  Package,
  Image,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { HomeBlock, Category } from "@shared/schema";

const blockTypes = [
  { value: "featured_products", label: "Featured Products", icon: Package },
  { value: "category_products", label: "Category Products", icon: LayoutGrid },
  { value: "promo_html", label: "Promo HTML", icon: Code },
  { value: "banner_carousel", label: "Banner Carousel", icon: Image },
  { value: "custom_code", label: "Custom Code", icon: Code },
];

export default function AdminHomeBlocks() {
  const [editBlock, setEditBlock] = useState<HomeBlock | null>(null);
  const [deleteBlock, setDeleteBlock] = useState<HomeBlock | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ blocks: HomeBlock[] }>({
    queryKey: ["/api/admin/home-blocks"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/home-blocks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/home-blocks"] });
      toast({ title: "Block deleted successfully" });
      setDeleteBlock(null);
    },
    onError: () => {
      toast({ title: "Failed to delete block", variant: "destructive" });
    },
  });

  const blocks = data?.blocks?.sort((a, b) => (a.position || 0) - (b.position || 0)) || [];

  const getBlockIcon = (type: string) => {
    const blockType = blockTypes.find((bt) => bt.value === type);
    return blockType?.icon || LayoutGrid;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Home Blocks</h1>
            <p className="text-muted-foreground">Manage homepage sections (drag to reorder)</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-block">
            <Plus className="h-4 w-4 mr-2" />
            Add Block
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : blocks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No home blocks yet. Add sections to customize your homepage.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {blocks.map((block, index) => {
              const Icon = getBlockIcon(block.type);
              return (
                <Card key={block.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-primary/10 rounded">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{block.title || `Block ${index + 1}`}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {block.type.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Position {block.position || 0}</Badge>
                      <Badge variant={block.isActive ? "default" : "outline"}>
                        {block.isActive ? "Active" : "Hidden"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditBlock(block)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteBlock(block)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <HomeBlockDialog
          open={isAddDialogOpen || !!editBlock}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditBlock(null);
            }
          }}
          block={editBlock}
        />

        <AlertDialog open={!!deleteBlock} onOpenChange={() => setDeleteBlock(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Home Block</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this block?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteBlock && deleteMutation.mutate(deleteBlock.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

function HomeBlockDialog({
  open,
  onOpenChange,
  block,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: HomeBlock | null;
}) {
  const [type, setType] = useState(block?.type || "featured_products");
  const [title, setTitle] = useState(block?.title || "");
  const [position, setPosition] = useState(block?.position?.toString() || "0");
  const [isActive, setIsActive] = useState(block?.isActive !== false);
  const [categoryId, setCategoryId] = useState("");
  const [html, setHtml] = useState("");
  const { toast } = useToast();

  // Reset form state when block changes (opening edit dialog or switching blocks)
  useEffect(() => {
    if (open) {
      const payload = block?.payload as { categoryId?: string; html?: string } | null;
      setType(block?.type || "featured_products");
      setTitle(block?.title || "");
      setPosition(block?.position?.toString() || "0");
      setIsActive(block?.isActive !== false);
      setCategoryId(payload?.categoryId || "");
      setHtml(payload?.html || "");
    }
  }, [open, block]);

  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["/api/categories"],
  });

  const categories = categoriesData?.categories || [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      let payload: any = {
        type,
        title,
        position: parseInt(position),
        isActive,
        payload: {},
      };

      if (type === "category_products") {
        payload.payload = { categoryId };
      } else if (type === "promo_html" || type === "custom_code") {
        payload.payload = { html };
      }

      if (block) {
        return await apiRequest("PATCH", `/api/admin/home-blocks/${block.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/admin/home-blocks", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/home-blocks"] });
      toast({ title: `Block ${block ? "updated" : "created"} successfully` });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to save block", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{block ? "Edit Home Block" : "Add Home Block"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {blockTypes.map((bt) => (
                  <SelectItem key={bt.value} value={bt.value}>
                    {bt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Section Title"
            />
          </div>
          <div className="space-y-2">
            <Label>Position</Label>
            <Input
              type="number"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          {type === "category_products" && (
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(type === "promo_html" || type === "custom_code") && (
            <div className="space-y-2">
              <Label>HTML Content</Label>
              <Textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder="<div>Your HTML here</div>"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {block ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
