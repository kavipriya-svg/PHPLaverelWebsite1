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
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  {
    value: "featured_products",
    label: "Featured Products Grid",
    description: "Auto-pulls products marked as Featured in the store",
    icon: Package,
  },
  {
    value: "category_products",
    label: "Category Product Grid",
    description: "Show products from a specific category by slug or selection",
    icon: LayoutGrid,
  },
  {
    value: "promo_html",
    label: "Promo / Rich Text Block",
    description: "Custom HTML rendered inside an editorial card",
    icon: Code,
  },
  {
    value: "banner_carousel",
    label: "Banner Carousel",
    description: "A row of promotional banners from your banner library",
    icon: Image,
  },
  {
    value: "custom_code",
    label: "Custom HTML (Raw)",
    description: "Inject raw HTML directly onto the page",
    icon: Code,
  },
];

const HOMEPAGE_LAYOUT = [
  { num: "1",  name: "Hero Banner — "The Modern Wolf Manual."", admin: "Homepage → Hero Banner tab" },
  { num: "2",  name: "Category Hub — "The Core Biological Systems"", admin: "Homepage → Product Sections tab" },
  { num: "3",  name: "Top Tier Fuel", admin: "Homepage → Product Sections tab" },
  { num: "4",  name: "Treats", admin: "Homepage → Product Sections tab" },
  { num: "★",  name: "Home Blocks (this page)", admin: "Position 0 = first, higher = lower on page", highlight: true },
  { num: "5",  name: "Ancestral Precision", admin: "Homepage → Brand Story tab" },
  { num: "6",  name: "Apparel for the Modern Pack", admin: "Homepage → Product Sections tab" },
  { num: "7",  name: "Wolf Principle — "99% DNA Match to Wolves."", admin: "Homepage → Brand Story tab" },
  { num: "8",  name: "Founder's Mission — "Engineering a Longer Life."", admin: "Homepage → Brand Story tab" },
  { num: "9",  name: "Gift Sets", admin: "Homepage → Gift Sets & Footer tab" },
  { num: "10", name: "Trust Badges", admin: "Homepage → Community tab" },
  { num: "11", name: "The Community Pack", admin: "Homepage → Community tab" },
  { num: "12", name: "Newsletter — "The Dispatch"", admin: "Homepage → Community tab" },
];

export default function AdminHomeBlocks() {
  const [editBlock, setEditBlock] = useState<HomeBlock | null>(null);
  const [deleteBlock, setDeleteBlock] = useState<HomeBlock | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showLayoutGuide, setShowLayoutGuide] = useState(false);
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

  const getBlockLabel = (type: string) => {
    const blockType = blockTypes.find((bt) => bt.value === type);
    return blockType?.label || type.replace(/_/g, " ");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Home Blocks</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Dynamic sections inserted between "Treats" and "Ancestral Precision" on the homepage. Drag to reorder.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLayoutGuide((v) => !v)}
              data-testid="button-toggle-layout-guide"
            >
              <Info className="h-4 w-4 mr-2" />
              Homepage Layout
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-block">
              <Plus className="h-4 w-4 mr-2" />
              Add Block
            </Button>
          </div>
        </div>

        {showLayoutGuide && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Homepage Section Order</CardTitle>
              <CardDescription>
                Home Blocks from this page appear between the Treats Grid (4) and Ancestral Philosophy (5). Use the Position field to order multiple blocks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {HOMEPAGE_LAYOUT.map((row) => (
                  <div
                    key={row.num}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                      row.highlight
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted/40"
                    }`}
                  >
                    <span className="w-6 text-center font-mono shrink-0">{row.num}</span>
                    <span className="flex-1 font-medium">{row.name}</span>
                    <span className={`text-xs ${row.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {row.admin}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                          <p className="text-sm text-muted-foreground">
                            {getBlockLabel(block.type)}
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
                Are you sure you want to delete this block? It will immediately disappear from the homepage.
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
  const [categorySlug, setCategorySlug] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [limit, setLimit] = useState("4");
  const [html, setHtml] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const payload = block?.payload as {
        categoryId?: string;
        categorySlug?: string;
        featuredOnly?: boolean;
        limit?: number;
        html?: string;
      } | null;
      setType(block?.type || "featured_products");
      setTitle(block?.title || "");
      setPosition(block?.position?.toString() || "0");
      setIsActive(block?.isActive !== false);
      setCategoryId(payload?.categoryId || "");
      setCategorySlug(payload?.categorySlug || "");
      setFeaturedOnly(payload?.featuredOnly ?? false);
      setLimit(String(payload?.limit || 4));
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
        payload.payload = {
          categoryId: categoryId || undefined,
          categorySlug: categorySlug || undefined,
          featuredOnly,
          limit: parseInt(limit) || 4,
        };
      } else if (type === "featured_products") {
        payload.payload = {
          featuredOnly: true,
          limit: parseInt(limit) || 4,
        };
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
      queryClient.invalidateQueries({ queryKey: ["/api/home-blocks"] });
      toast({ title: `Block ${block ? "updated" : "created"} successfully` });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to save block", variant: "destructive" });
    },
  });

  const selectedTypeInfo = blockTypes.find((bt) => bt.value === type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{block ? "Edit Home Block" : "Add Home Block"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Block Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger data-testid="select-block-type">
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
            {selectedTypeInfo && (
              <p className="text-xs text-muted-foreground">{selectedTypeInfo.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "featured_products"
                  ? "e.g. Staff Picks"
                  : type === "category_products"
                  ? "e.g. Top Tier Fuel"
                  : "Section Title"
              }
              data-testid="input-block-title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Position</Label>
              <Input
                type="number"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                min={0}
                data-testid="input-block-position"
              />
              <p className="text-xs text-muted-foreground">Lower = appears first</p>
            </div>
            {(type === "featured_products" || type === "category_products") && (
              <div className="space-y-2">
                <Label>Number of Products</Label>
                <Input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  min={1}
                  max={8}
                  data-testid="input-block-limit"
                />
              </div>
            )}
          </div>

          {type === "category_products" && (
            <>
              <div className="space-y-2">
                <Label>Category Slug</Label>
                <Input
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  placeholder="e.g. full-meals, wild-treats, clothing"
                  data-testid="input-category-slug"
                />
                <p className="text-xs text-muted-foreground">Preferred. Find the slug in Admin → Categories.</p>
              </div>
              <div className="space-y-2">
                <Label>Or Select Category</Label>
                <Select
                  value={categoryId}
                  onValueChange={(v) => {
                    setCategoryId(v);
                    const cat = categories.find((c) => c.id === v);
                    if (cat?.slug) setCategorySlug(cat.slug);
                  }}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Pick from list" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                        {cat.slug ? ` (${cat.slug})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <Label className="text-sm font-medium">Featured products only</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Only show products with the Featured flag enabled.
                  </p>
                </div>
                <Switch
                  checked={featuredOnly}
                  onCheckedChange={setFeaturedOnly}
                  data-testid="toggle-featured-only"
                />
              </div>
            </>
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
                data-testid="textarea-html-content"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-md border">
            <div>
              <Label className="text-sm font-medium">Active</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Hidden blocks won't appear on the homepage.</p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              data-testid="toggle-block-active"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-block"
          >
            {block ? "Update Block" : "Create Block"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
