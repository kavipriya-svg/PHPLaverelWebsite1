import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Trash2,
  GripVertical,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CategoryWithChildren } from "@shared/schema";

export default function AdminCategories() {
  const [editCategory, setEditCategory] = useState<CategoryWithChildren | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<CategoryWithChildren | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ categories: CategoryWithChildren[] }>({
    queryKey: ["/api/admin/categories"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "Category deleted successfully" });
      setDeleteCategory(null);
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  const categories = data?.categories || [];

  const rootCategories = categories.filter((c) => !c.parentId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Categories</h1>
            <p className="text-muted-foreground">Manage your 3-level category hierarchy</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-category">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading categories...
              </CardContent>
            </Card>
          ) : rootCategories.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No categories yet. Create your first category.
              </CardContent>
            </Card>
          ) : (
            rootCategories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                allCategories={categories}
                onEdit={setEditCategory}
                onDelete={setDeleteCategory}
                level={0}
              />
            ))
          )}
        </div>

        <CategoryDialog
          open={isAddDialogOpen || !!editCategory}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditCategory(null);
            }
          }}
          category={editCategory}
          categories={categories}
        />

        <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteCategory?.name}"?
                {deleteCategory?.children && deleteCategory.children.length > 0 && (
                  <span className="block mt-2 text-destructive">
                    This category has {deleteCategory.children.length} subcategories that will also be deleted.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCategory && deleteMutation.mutate(deleteCategory.id)}
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

function CategoryItem({
  category,
  allCategories,
  onEdit,
  onDelete,
  level,
}: {
  category: CategoryWithChildren;
  allCategories: CategoryWithChildren[];
  onEdit: (cat: CategoryWithChildren) => void;
  onDelete: (cat: CategoryWithChildren) => void;
  level: number;
}) {
  const [expanded, setExpanded] = useState(level < 1);

  // Use nested children from the category object (tree structure from API)
  const children = category.children || [];
  const hasChildren = children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 p-3 border rounded-lg bg-card hover-elevate"
        style={{ marginLeft: `${level * 24}px` }}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}

        {category.imageUrl && (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-8 h-8 rounded object-cover"
          />
        )}

        <div className="flex-1">
          <p className="font-medium">{category.name}</p>
          <p className="text-xs text-muted-foreground">/{category.slug}</p>
        </div>

        <Badge variant={category.isActive ? "default" : "outline"}>
          {category.isActive ? "Active" : "Hidden"}
        </Badge>

        <Badge variant="secondary">Level {level + 1}</Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && hasChildren && (
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              allCategories={allCategories}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryDialog({
  open,
  onOpenChange,
  category,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryWithChildren | null;
  categories: CategoryWithChildren[];
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("none");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [iconUrl, setIconUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setSlug(category.slug || "");
      setParentId(category.parentId || "none");
      setDescription(category.description || "");
      setIsActive(category.isActive !== false);
      setIconUrl((category as any).iconUrl || "");
      setBannerUrl((category as any).bannerUrl || "");
    } else {
      setName("");
      setSlug("");
      setParentId("none");
      setDescription("");
      setIsActive(true);
      setIconUrl("");
      setBannerUrl("");
    }
  }, [category, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        slug,
        parentId: parentId === "none" ? null : parentId,
        description,
        isActive,
        iconUrl: iconUrl || null,
        bannerUrl: bannerUrl || null,
      };
      if (category) {
        return await apiRequest("PATCH", `/api/admin/categories/${category.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/admin/categories", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: `Category ${category ? "updated" : "created"} successfully` });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to save category", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setSlug("");
    setParentId("none");
    setDescription("");
    setIsActive(true);
    setIconUrl("");
    setBannerUrl("");
  };

  const generateSlug = (n: string) => {
    return n
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleImageUpload = async (
    file: File,
    setUrl: (url: string) => void,
    setUploading: (uploading: boolean) => void
  ) => {
    setUploading(true);
    try {
      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
      });
      
      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error("Upload URL error:", errorText);
        throw new Error("Failed to get upload URL");
      }
      const uploadData = await uploadRes.json();
      const uploadURL = uploadData.uploadURL;
      
      if (!uploadURL) {
        throw new Error("No upload URL received");
      }
      
      const putRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });
      
      if (!putRes.ok) {
        console.error("PUT to storage failed:", putRes.status, putRes.statusText);
        throw new Error("Failed to upload file to storage");
      }

      const finalizeRes = await fetch("/api/admin/upload/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadURL }),
        credentials: "include",
      });
      
      if (!finalizeRes.ok) {
        const errorText = await finalizeRes.text();
        console.error("Finalize error:", errorText);
        throw new Error("Failed to finalize upload");
      }
      const finalizeData = await finalizeRes.json();
      const objectPath = finalizeData.objectPath;
      
      setUrl(objectPath);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setUrl: (url: string) => void,
    setUploading: (uploading: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Please select an image file", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Image must be less than 5MB", variant: "destructive" });
        return;
      }
      handleImageUpload(file, setUrl, setUploading);
    }
  };

  const flatCategories = flattenCategories(categories);
  
  const eligibleParents = flatCategories.filter((c) => {
    if (category && c.id === category.id) return false;
    const depth = getDepth(c, flatCategories);
    return depth < 2;
  });

  const isSubOrChildCategory = parentId !== "none";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!category) {
                    setSlug(generateSlug(e.target.value));
                  }
                }}
                data-testid="input-category-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} data-testid="input-category-slug" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Parent Category</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger data-testid="select-category-parent">
                <SelectValue placeholder="None (Top Level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Top Level)</SelectItem>
                {eligibleParents.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {isSubOrChildCategory && (
            <>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Category Images</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icon Image (for menu)</Label>
                    <div className="flex flex-col gap-2">
                      {iconUrl && (
                        <div className="relative w-16 h-16 border rounded overflow-hidden">
                          <img src={iconUrl} alt="Icon" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setIconUrl("")}
                            className="absolute top-0 right-0 bg-destructive text-destructive-foreground w-5 h-5 flex items-center justify-center text-xs"
                          >
                            X
                          </button>
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setIconUrl, setIsUploadingIcon)}
                          className="hidden"
                          id="icon-upload"
                          disabled={isUploadingIcon}
                        />
                        <label htmlFor="icon-upload">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploadingIcon}
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploadingIcon ? "Uploading..." : "Upload Icon"}
                            </span>
                          </Button>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">Recommended: 64x64px</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Banner Image (for category page)</Label>
                    <div className="flex flex-col gap-2">
                      {bannerUrl && (
                        <div className="relative w-full h-20 border rounded overflow-hidden">
                          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setBannerUrl("")}
                            className="absolute top-0 right-0 bg-destructive text-destructive-foreground w-5 h-5 flex items-center justify-center text-xs"
                          >
                            X
                          </button>
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setBannerUrl, setIsUploadingBanner)}
                          className="hidden"
                          id="banner-upload"
                          disabled={isUploadingBanner}
                        />
                        <label htmlFor="banner-upload">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploadingBanner}
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploadingBanner ? "Uploading..." : "Upload Banner"}
                            </span>
                          </Button>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">Recommended: 1200x300px</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending || isUploadingIcon || isUploadingBanner} 
            data-testid="button-save-category"
          >
            {category ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getDepth(category: CategoryWithChildren, all: CategoryWithChildren[]): number {
  if (!category.parentId) return 0;
  const parent = all.find((c) => c.id === category.parentId);
  if (!parent) return 0;
  return 1 + getDepth(parent, all);
}

// Flatten tree structure to flat array for dropdown and depth calculations
function flattenCategories(categories: CategoryWithChildren[]): CategoryWithChildren[] {
  const result: CategoryWithChildren[] = [];
  const flatten = (cats: CategoryWithChildren[]) => {
    for (const cat of cats) {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        flatten(cat.children);
      }
    }
  };
  flatten(categories);
  return result;
}
