import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  GripVertical,
  Image,
  Video,
  Upload,
  X,
  Loader2,
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
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Banner, HomeBlock } from "@shared/schema";

export default function AdminBanners() {
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [deleteBanner, setDeleteBanner] = useState<Banner | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ banners: Banner[] }>({
    queryKey: ["/api/admin/banners"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/banners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({ title: "Banner deleted successfully" });
      setDeleteBanner(null);
    },
    onError: () => {
      toast({ title: "Failed to delete banner", variant: "destructive" });
    },
  });

  const banners = data?.banners || [];
  const heroBanners = banners.filter((b) => b.type === "hero");
  const sectionBanners = banners.filter((b) => b.type === "section");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Banners</h1>
            <p className="text-muted-foreground">Manage hero and promotional banners</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-banner">
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Hero Banners</h2>
            {heroBanners.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hero banners yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {heroBanners.map((banner) => (
                  <BannerCard
                    key={banner.id}
                    banner={banner}
                    onEdit={setEditBanner}
                    onDelete={setDeleteBanner}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Section Banners</h2>
            {sectionBanners.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No section banners yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionBanners.map((banner) => (
                  <BannerCard
                    key={banner.id}
                    banner={banner}
                    onEdit={setEditBanner}
                    onDelete={setDeleteBanner}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <BannerDialog
          open={isAddDialogOpen || !!editBanner}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditBanner(null);
            }
          }}
          banner={editBanner}
        />

        <AlertDialog open={!!deleteBanner} onOpenChange={() => setDeleteBanner(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Banner</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this banner?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteBanner && deleteMutation.mutate(deleteBanner.id)}
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

function BannerCard({
  banner,
  onEdit,
  onDelete,
  compact = false,
}: {
  banner: Banner;
  onEdit: (b: Banner) => void;
  onDelete: (b: Banner) => void;
  compact?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <div className={`relative ${compact ? "aspect-video" : "aspect-[21/9]"}`}>
        {banner.mediaType === "video" && banner.videoUrl ? (
          <video
            src={banner.videoUrl}
            className="w-full h-full object-cover"
            muted
            loop
          />
        ) : banner.mediaUrl ? (
          <img
            src={banner.mediaUrl}
            alt={banner.title || "Banner"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Image className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge variant={banner.isActive ? "default" : "outline"}>
            {banner.isActive ? "Active" : "Hidden"}
          </Badge>
          <Badge variant="secondary">
            {banner.mediaType === "video" ? <Video className="h-3 w-3 mr-1" /> : <Image className="h-3 w-3 mr-1" />}
            {banner.mediaType || "image"}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(banner)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(banner)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium">{banner.title || "Untitled"}</h3>
        {banner.subtitle && (
          <p className="text-sm text-muted-foreground line-clamp-1">{banner.subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function BannerDialog({
  open,
  onOpenChange,
  banner,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: Banner | null;
}) {
  const [type, setType] = useState(banner?.type || "hero");
  const [title, setTitle] = useState(banner?.title || "");
  const [subtitle, setSubtitle] = useState(banner?.subtitle || "");
  const [mediaUrl, setMediaUrl] = useState(banner?.mediaUrl || "");
  const [videoUrl, setVideoUrl] = useState(banner?.videoUrl || "");
  const [mediaType, setMediaType] = useState(banner?.mediaType || "image");
  const [ctaText, setCtaText] = useState(banner?.ctaText || "");
  const [ctaLink, setCtaLink] = useState(banner?.ctaLink || "");
  const [isActive, setIsActive] = useState(banner?.isActive !== false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Section banner placement options
  const [targetBlockId, setTargetBlockId] = useState(banner?.targetBlockId || "");
  const [relativePlacement, setRelativePlacement] = useState(banner?.relativePlacement || "below");
  const [displayWidth, setDisplayWidth] = useState(banner?.displayWidth?.toString() || "100");
  const [alignment, setAlignment] = useState(banner?.alignment || "center");
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Reset state when banner changes or dialog opens
  useEffect(() => {
    if (open) {
      setType(banner?.type || "hero");
      setTitle(banner?.title || "");
      setSubtitle(banner?.subtitle || "");
      setMediaUrl(banner?.mediaUrl || "");
      setVideoUrl(banner?.videoUrl || "");
      setMediaType(banner?.mediaType || "image");
      setCtaText(banner?.ctaText || "");
      setCtaLink(banner?.ctaLink || "");
      setIsActive(banner?.isActive !== false);
      setTargetBlockId(banner?.targetBlockId || "");
      setRelativePlacement(banner?.relativePlacement || "below");
      setDisplayWidth(banner?.displayWidth?.toString() || "100");
      setAlignment(banner?.alignment || "center");
    }
  }, [open, banner]);
  
  // Fetch home blocks for the dropdown
  const { data: homeBlocksData } = useQuery<{ blocks: HomeBlock[] }>({
    queryKey: ["/api/admin/home-blocks"],
  });
  const homeBlocks = homeBlocksData?.blocks || [];

  // Handle file upload to object storage
  const handleFileUpload = async (file: File, uploadType: "image" | "video") => {
    setIsUploading(true);
    try {
      // Get presigned URL for upload
      const presignedResponse = await apiRequest("POST", "/api/upload/presigned-url", {
        filename: file.name,
        contentType: file.type,
        folder: "banners",
      });
      
      // Check if we got an unauthorized response
      if (presignedResponse.status === 401) {
        toast({ 
          title: "Session expired", 
          description: "Please log in again to upload files.",
          variant: "destructive" 
        });
        return;
      }
      
      if (!presignedResponse.ok) {
        throw new Error("Failed to get upload URL");
      }
      
      const { presignedUrl, objectPath } = await presignedResponse.json();

      // Upload file directly to storage
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage");
      }

      // Finalize upload to set ACL policy for public access
      const finalizeResponse = await apiRequest("POST", "/api/admin/upload/finalize", {
        uploadURL: presignedUrl,
      });
      
      if (finalizeResponse.status === 401) {
        toast({ 
          title: "Session expired", 
          description: "Please log in again to complete the upload.",
          variant: "destructive" 
        });
        return;
      }
      
      if (!finalizeResponse.ok) {
        throw new Error("Failed to finalize upload");
      }
      
      const finalizedResult = await finalizeResponse.json();

      // Set the URL based on upload type
      const finalUrl = finalizedResult.objectPath || `/objects/${objectPath}`;
      if (uploadType === "image") {
        setMediaUrl(finalUrl);
      } else {
        setVideoUrl(finalUrl);
      }
      toast({ title: `${uploadType === "video" ? "Video" : "Image"} uploaded successfully` });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ 
        title: "Upload failed", 
        description: error instanceof Error ? error.message : "Please try again or check your connection.",
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        type,
        title,
        subtitle,
        mediaUrl,
        videoUrl,
        mediaType,
        ctaText,
        ctaLink,
        isActive,
        // Always include placement fields - they'll only be used for section banners
        // but including them prevents data loss when temporarily switching types
        targetBlockId: type === "section" ? (targetBlockId || null) : null,
        relativePlacement: type === "section" ? relativePlacement : "below",
        displayWidth: type === "section" ? parseInt(displayWidth) : 100,
        alignment: type === "section" ? alignment : "center",
      };
      
      if (banner) {
        return await apiRequest("PATCH", `/api/admin/banners/${banner.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/admin/banners", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({ title: `Banner ${banner ? "updated" : "created"} successfully` });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to save banner", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{banner ? "Edit Banner" : "Add Banner"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-banner-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Media Type</Label>
              <Select value={mediaType} onValueChange={(value) => {
                setMediaType(value);
                // Clear the other media type when switching
                if (value === "image") {
                  setVideoUrl("");
                } else {
                  setMediaUrl("");
                }
              }}>
                <SelectTrigger data-testid="select-media-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Section Banner Placement Options */}
          {type === "section" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm">Placement Options</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position Relative To</Label>
                  <Select 
                    value={targetBlockId || "_none"} 
                    onValueChange={(val) => setTargetBlockId(val === "_none" ? "" : val)}
                  >
                    <SelectTrigger data-testid="select-target-block">
                      <SelectValue placeholder="Select a Home Block" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Top of Page</SelectItem>
                      {homeBlocks
                        .filter(b => b.isActive)
                        .sort((a, b) => (a.position || 0) - (b.position || 0))
                        .map((block) => (
                          <SelectItem key={block.id} value={block.id}>
                            {block.title || `${block.type} Block`} (Position {block.position})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Show Banner</Label>
                  <Select value={relativePlacement} onValueChange={setRelativePlacement}>
                    <SelectTrigger data-testid="select-relative-placement">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above Block</SelectItem>
                      <SelectItem value="below">Below Block</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Width</Label>
                  <Select value={displayWidth} onValueChange={setDisplayWidth}>
                    <SelectTrigger data-testid="select-display-width">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                      <SelectItem value="75">75%</SelectItem>
                      <SelectItem value="100">100%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alignment</Label>
                  <Select value={alignment} onValueChange={setAlignment}>
                    <SelectTrigger data-testid="select-alignment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          
          {/* Media Upload Section */}
          {mediaType === "image" ? (
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Recommended size: 1920 x 600 pixels (Hero) or 800 x 400 pixels (Section). Max 5MB. Formats: JPG, PNG, WebP
              </p>
              <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast({ title: "Image must be less than 5MB", variant: "destructive" });
                      return;
                    }
                    handleFileUpload(file, "image");
                  }
                }}
              />
              {mediaUrl ? (
                <div className="relative rounded-lg overflow-hidden border">
                  <img
                    src={mediaUrl}
                    alt="Banner preview"
                    className="w-full h-32 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setMediaUrl("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => !isUploading && imageInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload image</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Banner Video</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Recommended size: 1920 x 600 pixels. Max 50MB. Formats: MP4, WebM. Keep videos under 15 seconds for best performance.
              </p>
              <input
                type="file"
                ref={videoInputRef}
                className="hidden"
                accept="video/mp4,video/webm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 50 * 1024 * 1024) {
                      toast({ title: "Video must be less than 50MB", variant: "destructive" });
                      return;
                    }
                    handleFileUpload(file, "video");
                  }
                }}
              />
              {videoUrl ? (
                <div className="relative rounded-lg overflow-hidden border">
                  <video
                    src={videoUrl}
                    className="w-full h-32 object-cover"
                    muted
                    loop
                    autoPlay
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setVideoUrl("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => !isUploading && videoInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Video className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload video</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CTA Text</Label>
              <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Shop Now" />
            </div>
            <div className="space-y-2">
              <Label>CTA Link</Label>
              <Input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="/shop" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isUploading}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              banner ? "Update" : "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
