import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  GripVertical,
  Image,
  Video,
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
import type { Banner } from "@shared/schema";

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
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        type,
        title,
        subtitle,
        mediaUrl,
        videoUrl,
        mediaType,
        ctaText,
        ctaLink,
        isActive,
      };
      if (banner) {
        return await apiRequest("PATCH", `/api/admin/banners/${banner.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/admin/banners", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
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
                <SelectTrigger>
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
              <Select value={mediaType} onValueChange={setMediaType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          {mediaType === "image" ? (
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Video URL</Label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
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
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {banner ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
