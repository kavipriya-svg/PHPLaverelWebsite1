import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface QuickPage {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  status: string;
  showInFooter: boolean | null;
  footerSection: string | null;
  position: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

const footerSections = [
  { value: "quick_links", label: "Quick Links" },
  { value: "customer_service", label: "Customer Service" },
  { value: "about", label: "About Us" },
];

export default function AdminQuickPages() {
  const [editPage, setEditPage] = useState<QuickPage | null>(null);
  const [deletePage, setDeletePage] = useState<QuickPage | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ pages: QuickPage[] }>({
    queryKey: ["/api/admin/quick-pages"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/quick-pages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quick-pages"] });
      toast({ title: "Page deleted successfully" });
      setDeletePage(null);
    },
    onError: () => {
      toast({ title: "Failed to delete page", variant: "destructive" });
    },
  });

  const pages = data?.pages || [];

  const getSectionLabel = (section: string | null) => {
    const found = footerSections.find(s => s.value === section);
    return found?.label || "Quick Links";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Quick Links & Pages</h1>
            <p className="text-muted-foreground">
              Create dynamic pages like About Us, Terms & Conditions, Privacy Policy
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-page">
            <Plus className="h-4 w-4 mr-2" />
            Add Page
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Footer Section</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>In Footer</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No pages yet. Create one to add dynamic content to your store!
                  </TableCell>
                </TableRow>
              ) : (
                pages.map((page) => (
                  <TableRow key={page.id} data-testid={`row-page-${page.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{page.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        /pages/{page.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getSectionLabel(page.footerSection)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={page.status === "published" ? "default" : "secondary"}>
                        {page.status === "published" ? (
                          <><Eye className="h-3 w-3 mr-1" />Published</>
                        ) : (
                          <><EyeOff className="h-3 w-3 mr-1" />Draft</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {page.showInFooter ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600">
                          <Globe className="h-3 w-3 mr-1" />Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-menu-${page.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditPage(page)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {page.status === "published" && (
                            <DropdownMenuItem asChild>
                              <a href={`/pages/${page.slug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Page
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setDeletePage(page)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <PageDialog
        open={isAddDialogOpen || !!editPage}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditPage(null);
          }
        }}
        page={editPage}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePage} onOpenChange={(open) => !open && setDeletePage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletePage?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePage && deleteMutation.mutate(deletePage.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

interface PageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: QuickPage | null;
}

function PageDialog({ open, onOpenChange, page }: PageDialogProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState("draft");
  const [showInFooter, setShowInFooter] = useState(true);
  const [footerSection, setFooterSection] = useState("quick_links");
  const [position, setPosition] = useState(0);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const { toast } = useToast();

  // Load page data when editing
  useState(() => {
    if (page) {
      setTitle(page.title || "");
      setSlug(page.slug || "");
      setContent(page.content || "");
      setExcerpt(page.excerpt || "");
      setStatus(page.status || "draft");
      setShowInFooter(page.showInFooter ?? true);
      setFooterSection(page.footerSection || "quick_links");
      setPosition(page.position || 0);
      setMetaTitle(page.metaTitle || "");
      setMetaDescription(page.metaDescription || "");
      setMetaKeywords(page.metaKeywords || "");
    } else {
      resetForm();
    }
  });

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setContent("");
    setExcerpt("");
    setStatus("draft");
    setShowInFooter(true);
    setFooterSection("quick_links");
    setPosition(0);
    setMetaTitle("");
    setMetaDescription("");
    setMetaKeywords("");
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/quick-pages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quick-pages"] });
      toast({ title: "Page created successfully" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create page",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/admin/quick-pages/${page?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quick-pages"] });
      toast({ title: "Page updated successfully" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update page",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!page) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !slug.trim()) {
      toast({ title: "Title and slug are required", variant: "destructive" });
      return;
    }

    const data = {
      title,
      slug,
      content,
      excerpt,
      status,
      showInFooter,
      footerSection,
      position,
      metaTitle: metaTitle || title,
      metaDescription,
      metaKeywords,
    };

    if (page) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Reset form when page changes
  if (open && page) {
    if (title !== page.title) {
      setTitle(page.title || "");
      setSlug(page.slug || "");
      setContent(page.content || "");
      setExcerpt(page.excerpt || "");
      setStatus(page.status || "draft");
      setShowInFooter(page.showInFooter ?? true);
      setFooterSection(page.footerSection || "quick_links");
      setPosition(page.position || 0);
      setMetaTitle(page.metaTitle || "");
      setMetaDescription(page.metaDescription || "");
      setMetaKeywords(page.metaKeywords || "");
    }
  } else if (open && !page && title) {
    // New page mode but form has old data
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{page ? "Edit Page" : "Create New Page"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Page Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., About Us, Privacy Policy"
                  data-testid="input-title"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">/pages/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="about-us"
                    data-testid="input-slug"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="excerpt">Short Description</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of the page content"
                  rows={2}
                  data-testid="input-excerpt"
                />
              </div>

              <div className="grid gap-2">
                <Label>Page Content</Label>
                <div className="border rounded-md">
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Write your page content here..."
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Show in Footer</Label>
                  <p className="text-sm text-muted-foreground">
                    Display this page link in the footer navigation
                  </p>
                </div>
                <Switch
                  checked={showInFooter}
                  onCheckedChange={setShowInFooter}
                  data-testid="switch-footer"
                />
              </div>

              {showInFooter && (
                <div className="grid gap-2">
                  <Label>Footer Section</Label>
                  <Select value={footerSection} onValueChange={setFooterSection}>
                    <SelectTrigger data-testid="select-section">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {footerSections.map((section) => (
                        <SelectItem key={section.value} value={section.value}>
                          {section.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="position">Display Order</Label>
                <Input
                  id="position"
                  type="number"
                  value={position}
                  onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  data-testid="input-position"
                />
                <p className="text-sm text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="SEO title (defaults to page title)"
                  data-testid="input-meta-title"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Description for search engines"
                  rows={3}
                  data-testid="input-meta-description"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metaKeywords">Keywords</Label>
                <Input
                  id="metaKeywords"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                  data-testid="input-meta-keywords"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save">
            {isPending ? "Saving..." : page ? "Update Page" : "Create Page"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
