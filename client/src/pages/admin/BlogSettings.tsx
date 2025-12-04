import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Save, 
  Upload, 
  Trash2, 
  Loader2, 
  Plus,
  Eye,
  EyeOff,
  Image,
  Edit,
  GripVertical,
  Calendar,
  User,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BlogSection, BlogPost } from "@shared/schema";

const defaultSettings: BlogSection = {
  title: "From Our Blog",
  subtitle: "Latest news and updates",
  isVisible: true,
  position: 0,
  posts: [],
};

const defaultPost: Omit<BlogPost, "id"> = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  imageUrl: "",
  author: "",
  readTime: "5 min read",
  publishedAt: new Date().toISOString().split("T")[0],
  position: 0,
  isVisible: true,
};

export default function BlogSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BlogSection>(defaultSettings);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postForm, setPostForm] = useState<Omit<BlogPost, "id"> & { id?: string }>(defaultPost);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { data, isLoading } = useQuery<{ settings: BlogSection }>({
    queryKey: ["/api/settings/blog-section"],
  });

  useEffect(() => {
    if (data?.settings) {
      setSettings({ ...defaultSettings, ...data.settings });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: BlogSection) => {
      const response = await apiRequest("PUT", "/api/settings/blog-section", newSettings);
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/blog-section"] });
      toast({ title: "Blog section saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save blog section", variant: "destructive" });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);

    try {
      const presignedResponse = await apiRequest("POST", "/api/upload/presigned-url", {
        filename: file.name,
        contentType: file.type,
        folder: "blog",
      });
      
      if (!presignedResponse.ok) {
        throw new Error("Failed to get upload URL");
      }
      
      const { presignedUrl, objectPath } = await presignedResponse.json();

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const finalizeResponse = await apiRequest("POST", "/api/admin/upload/finalize", {
        uploadURL: presignedUrl,
      });
      
      if (!finalizeResponse.ok) {
        throw new Error("Failed to finalize upload");
      }
      
      const finalizedResult = await finalizeResponse.json();
      const finalUrl = finalizedResult.objectPath || `/objects/${objectPath}`;
      
      setPostForm(prev => ({ ...prev, imageUrl: finalUrl }));
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ 
        title: "Failed to upload image", 
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const openNewPostDialog = () => {
    setEditingPost(null);
    setPostForm({
      ...defaultPost,
      position: settings.posts.length,
      publishedAt: new Date().toISOString().split("T")[0],
    });
    setIsDialogOpen(true);
  };

  const openEditPostDialog = (post: BlogPost) => {
    setEditingPost(post);
    setPostForm(post);
    setIsDialogOpen(true);
  };

  const savePost = () => {
    if (!postForm.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    const slug = postForm.slug || generateSlug(postForm.title);
    const newPost: BlogPost = {
      ...postForm,
      id: editingPost?.id || crypto.randomUUID(),
      slug,
    };

    if (editingPost) {
      setSettings(prev => ({
        ...prev,
        posts: prev.posts.map(p => p.id === editingPost.id ? newPost : p)
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        posts: [...prev.posts, newPost]
      }));
    }

    setIsDialogOpen(false);
    toast({ title: editingPost ? "Post updated" : "Post added" });
  };

  const deletePost = (postId: string) => {
    setSettings(prev => ({
      ...prev,
      posts: prev.posts
        .filter(p => p.id !== postId)
        .map((p, idx) => ({ ...p, position: idx }))
    }));
    toast({ title: "Post removed" });
  };

  const togglePostVisibility = (postId: string) => {
    setSettings(prev => ({
      ...prev,
      posts: prev.posts.map(p => 
        p.id === postId ? { ...p, isVisible: !p.isVisible } : p
      )
    }));
  };

  const movePost = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= settings.posts.length) return;

    const newPosts = [...settings.posts];
    [newPosts[index], newPosts[newIndex]] = [newPosts[newIndex], newPosts[index]];
    newPosts.forEach((p, idx) => p.position = idx);

    setSettings(prev => ({ ...prev, posts: newPosts }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Blog Section</h1>
            <p className="text-muted-foreground">
              Manage blog posts displayed above the footer
            </p>
          </div>
          <Button 
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending}
            data-testid="button-save-blog-section"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Section Settings</CardTitle>
              <CardDescription>
                Configure the visibility and title of the blog section
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Section</Label>
                  <p className="text-sm text-muted-foreground">
                    Display the blog section above footer
                  </p>
                </div>
                <Switch
                  checked={settings.isVisible}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, isVisible: checked }))
                  }
                  data-testid="switch-blog-visibility"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blog-title">Section Title</Label>
                <Input
                  id="blog-title"
                  value={settings.title}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="From Our Blog"
                  data-testid="input-blog-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blog-subtitle">Subtitle</Label>
                <Input
                  id="blog-subtitle"
                  value={settings.subtitle}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, subtitle: e.target.value }))
                  }
                  placeholder="Latest news and updates"
                  data-testid="input-blog-subtitle"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Blog Posts</CardTitle>
                <CardDescription>
                  Create and manage your blog posts
                </CardDescription>
              </div>
              <Button onClick={openNewPostDialog} data-testid="button-add-post">
                <Plus className="w-4 h-4 mr-2" />
                Add Post
              </Button>
            </CardHeader>
            <CardContent>
              {settings.posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No blog posts yet</p>
                  <p className="text-sm">Click "Add Post" to create your first blog post</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {settings.posts
                    .sort((a, b) => a.position - b.position)
                    .map((post, index) => (
                      <div 
                        key={post.id}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                        data-testid={`blog-post-${post.id}`}
                      >
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => movePost(index, "up")}
                            disabled={index === 0}
                          >
                            <GripVertical className="w-4 h-4 rotate-90" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => movePost(index, "down")}
                            disabled={index === settings.posts.length - 1}
                          >
                            <GripVertical className="w-4 h-4 rotate-90" />
                          </Button>
                        </div>

                        <div className="w-20 h-14 bg-muted rounded-md overflow-hidden flex-shrink-0">
                          {post.imageUrl ? (
                            <img 
                              src={post.imageUrl} 
                              alt={post.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{post.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {post.author && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {post.author}
                              </span>
                            )}
                            {post.publishedAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {post.publishedAt}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {post.readTime}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePostVisibility(post.id)}
                            data-testid={`button-toggle-post-${post.id}`}
                          >
                            {post.isVisible ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditPostDialog(post)}
                            data-testid={`button-edit-post-${post.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletePost(post.id)}
                            data-testid={`button-delete-post-${post.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                How the blog section will appear on your site
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!settings.isVisible ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                  <EyeOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Section is currently hidden</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold">{settings.title || "From Our Blog"}</h3>
                    {settings.subtitle && (
                      <p className="text-muted-foreground mt-1">{settings.subtitle}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {settings.posts
                      .filter(p => p.isVisible)
                      .sort((a, b) => a.position - b.position)
                      .slice(0, 3)
                      .map((post) => (
                        <div 
                          key={post.id}
                          className="rounded-lg overflow-hidden border bg-card"
                        >
                          <div className="aspect-video bg-muted">
                            {post.imageUrl ? (
                              <img 
                                src={post.imageUrl} 
                                alt={post.title} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              {post.publishedAt && <span>{post.publishedAt}</span>}
                              <span>•</span>
                              <span>{post.readTime}</span>
                            </div>
                            <h4 className="font-semibold mb-2 line-clamp-2">{post.title}</h4>
                            {post.excerpt && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {post.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                  {settings.posts.filter(p => p.isVisible).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No visible posts to display</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? "Edit Blog Post" : "New Blog Post"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="post-title">Title *</Label>
              <Input
                id="post-title"
                value={postForm.title}
                onChange={(e) => {
                  setPostForm(prev => ({ 
                    ...prev, 
                    title: e.target.value,
                    slug: prev.slug || generateSlug(e.target.value)
                  }));
                }}
                placeholder="Enter post title"
                data-testid="input-post-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-slug">URL Slug</Label>
              <Input
                id="post-slug"
                value={postForm.slug}
                onChange={(e) => setPostForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="post-url-slug"
                data-testid="input-post-slug"
              />
            </div>

            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  {postForm.imageUrl ? (
                    <img 
                      src={postForm.imageUrl} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="post-image" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        {isUploadingImage ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Upload Image
                      </span>
                    </Button>
                    <input
                      id="post-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                  </Label>
                  {postForm.imageUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPostForm(prev => ({ ...prev, imageUrl: "" }))}
                    >
                      Remove Image
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-excerpt">Excerpt</Label>
              <Textarea
                id="post-excerpt"
                value={postForm.excerpt}
                onChange={(e) => setPostForm(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief description of the post"
                rows={3}
                data-testid="input-post-excerpt"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-content">Content</Label>
              <Textarea
                id="post-content"
                value={postForm.content}
                onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Full post content"
                rows={6}
                data-testid="input-post-content"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="post-author">Author</Label>
                <Input
                  id="post-author"
                  value={postForm.author}
                  onChange={(e) => setPostForm(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Author name"
                  data-testid="input-post-author"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-read-time">Read Time</Label>
                <Input
                  id="post-read-time"
                  value={postForm.readTime}
                  onChange={(e) => setPostForm(prev => ({ ...prev, readTime: e.target.value }))}
                  placeholder="5 min read"
                  data-testid="input-post-read-time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-date">Published Date</Label>
              <Input
                id="post-date"
                type="date"
                value={postForm.publishedAt}
                onChange={(e) => setPostForm(prev => ({ ...prev, publishedAt: e.target.value }))}
                data-testid="input-post-date"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Visible</Label>
                <p className="text-sm text-muted-foreground">
                  Show this post on the site
                </p>
              </div>
              <Switch
                checked={postForm.isVisible}
                onCheckedChange={(checked) => 
                  setPostForm(prev => ({ ...prev, isVisible: checked }))
                }
                data-testid="switch-post-visibility"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePost} data-testid="button-save-post">
              {editingPost ? "Update Post" : "Add Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
