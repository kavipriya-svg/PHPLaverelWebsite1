import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Upload, Trash2, Loader2, Image, Percent, Link as LinkIcon, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SpecialOffersPageSettings {
  bannerUrl: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerCtaText: string;
  bannerCtaLink: string;
  showBanner: boolean;
  sectionImageUrl: string;
  sectionTitle: string;
  sectionDescription: string;
  showSectionImage: boolean;
  sectionImageTargetRow: number;
  sectionImagePlacement: "before" | "after";
  sectionImageWidth: "25" | "50" | "75" | "100";
  sectionImageAlignment: "left" | "center" | "right";
}

const defaultSettings: SpecialOffersPageSettings = {
  bannerUrl: "",
  bannerTitle: "Special Offers",
  bannerSubtitle: "Don't miss out on these amazing deals!",
  bannerCtaText: "Shop Now",
  bannerCtaLink: "/special-offers",
  showBanner: true,
  sectionImageUrl: "",
  sectionTitle: "Hot Deals",
  sectionDescription: "Limited time offers on your favorite products",
  showSectionImage: true,
  sectionImageTargetRow: 1,
  sectionImagePlacement: "before",
  sectionImageWidth: "100",
  sectionImageAlignment: "left",
};

export default function SpecialOffersSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SpecialOffersPageSettings>(defaultSettings);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingSectionImage, setIsUploadingSectionImage] = useState(false);
  
  // Use a ref to always have access to the latest settings for save
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const { data, isLoading } = useQuery<{ settings: SpecialOffersPageSettings }>({
    queryKey: ["/api/settings/special-offers"],
  });

  useEffect(() => {
    if (data?.settings) {
      setSettings({ ...defaultSettings, ...data.settings });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Always use the ref to get the latest settings
      const currentSettings = settingsRef.current;
      console.log("[Save] Saving settings:", currentSettings);
      const response = await apiRequest("PUT", "/api/settings/special-offers", currentSettings);
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/special-offers"] });
      toast({ title: "Special offers page settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "banner" | "section"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = type === "banner" ? setIsUploadingBanner : setIsUploadingSectionImage;
    setUploading(true);

    try {
      const presignedResponse = await apiRequest("POST", "/api/upload/presigned-url", {
        filename: file.name,
        contentType: file.type,
        folder: "special-offers",
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
        throw new Error("Failed to upload file to storage");
      }

      const finalizeResponse = await apiRequest("POST", "/api/admin/upload/finalize", {
        uploadURL: presignedUrl,
      });
      
      if (!finalizeResponse.ok) {
        throw new Error("Failed to finalize upload");
      }
      
      const finalizedResult = await finalizeResponse.json();
      const finalUrl = finalizedResult.objectPath || `/objects/${objectPath}`;
      
      if (type === "banner") {
        setSettings(prev => ({ ...prev, bannerUrl: finalUrl }));
      } else {
        setSettings(prev => ({ ...prev, sectionImageUrl: finalUrl }));
      }
      
      toast({ title: `${type === "banner" ? "Banner" : "Section image"} uploaded successfully` });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ 
        title: `Failed to upload ${type === "banner" ? "banner" : "section image"}`, 
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Special Offers Page</h1>
            <p className="text-muted-foreground">Customize the banner and images on the special offers page</p>
          </div>
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending}
            data-testid="button-save-special-offers"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Page Banner
              </CardTitle>
              <CardDescription>
                A large banner displayed at the top of the special offers page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-banner">Show Banner</Label>
                <Switch
                  id="show-banner"
                  checked={settings.showBanner}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showBanner: checked }))}
                  data-testid="switch-show-banner"
                />
              </div>

              <div className="space-y-4">
                <Label>Banner Image</Label>
                <div className="flex items-start gap-6">
                  {settings.bannerUrl ? (
                    <div className="relative inline-block">
                      <img 
                        src={settings.bannerUrl} 
                        alt="Banner" 
                        className="h-32 w-auto max-w-md object-cover border rounded"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => setSettings(prev => ({ ...prev, bannerUrl: "" }))}
                        data-testid="button-remove-banner"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-32 w-64 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Image className="h-8 w-8 mx-auto mb-1 opacity-50" />
                        <span className="text-xs">No banner uploaded</span>
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "banner")}
                      className="hidden"
                      id="banner-upload"
                      disabled={isUploadingBanner}
                    />
                    <Button asChild variant="outline" disabled={isUploadingBanner}>
                      <label htmlFor="banner-upload" className="cursor-pointer">
                        {isUploadingBanner ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload Banner
                      </label>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended size: 1920x400 pixels. Supports PNG, JPG.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="banner-title">Banner Title</Label>
                  <Input
                    id="banner-title"
                    value={settings.bannerTitle}
                    onChange={(e) => setSettings(prev => ({ ...prev, bannerTitle: e.target.value }))}
                    placeholder="Special Offers"
                    data-testid="input-banner-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-subtitle">Banner Subtitle</Label>
                  <Input
                    id="banner-subtitle"
                    value={settings.bannerSubtitle}
                    onChange={(e) => setSettings(prev => ({ ...prev, bannerSubtitle: e.target.value }))}
                    placeholder="Don't miss out on these amazing deals!"
                    data-testid="input-banner-subtitle"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="banner-cta-text">CTA Button Text</Label>
                  <Input
                    id="banner-cta-text"
                    value={settings.bannerCtaText}
                    onChange={(e) => setSettings(prev => ({ ...prev, bannerCtaText: e.target.value }))}
                    placeholder="Shop Now"
                    data-testid="input-banner-cta-text"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-cta-link">CTA Button Link</Label>
                  <Input
                    id="banner-cta-link"
                    value={settings.bannerCtaLink}
                    onChange={(e) => setSettings(prev => ({ ...prev, bannerCtaLink: e.target.value }))}
                    placeholder="/special-offers"
                    data-testid="input-banner-cta-link"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Section Image
              </CardTitle>
              <CardDescription>
                A decorative image displayed alongside the page header
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-section-image">Show Section Image</Label>
                <Switch
                  id="show-section-image"
                  checked={settings.showSectionImage}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showSectionImage: checked }))}
                  data-testid="switch-show-section-image"
                />
              </div>

              <div className="space-y-4">
                <Label>Section Image</Label>
                <div className="flex items-start gap-6">
                  {settings.sectionImageUrl ? (
                    <div className="relative inline-block">
                      <img 
                        src={settings.sectionImageUrl} 
                        alt="Section" 
                        className="h-24 w-auto max-w-xs object-cover border rounded"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => setSettings(prev => ({ ...prev, sectionImageUrl: "" }))}
                        data-testid="button-remove-section-image"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-24 w-40 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Image className="h-6 w-6 mx-auto mb-1 opacity-50" />
                        <span className="text-xs">No image</span>
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "section")}
                      className="hidden"
                      id="section-image-upload"
                      disabled={isUploadingSectionImage}
                    />
                    <Button asChild variant="outline" disabled={isUploadingSectionImage}>
                      <label htmlFor="section-image-upload" className="cursor-pointer">
                        {isUploadingSectionImage ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload Image
                      </label>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended size: 400x300 pixels. Supports PNG, JPG.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 mb-4">
                  <LayoutGrid className="h-4 w-4" />
                  <Label className="font-medium">Placement & Size</Label>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="section-target-row">Target Row</Label>
                    <Select
                      value={settings.sectionImageTargetRow.toString()}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, sectionImageTargetRow: parseInt(value) }))}
                    >
                      <SelectTrigger data-testid="select-section-target-row">
                        <SelectValue placeholder="Select row" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Row 1</SelectItem>
                        <SelectItem value="2">Row 2</SelectItem>
                        <SelectItem value="3">Row 3</SelectItem>
                        <SelectItem value="4">Row 4</SelectItem>
                        <SelectItem value="5">Row 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section-placement">Position</Label>
                    <Select
                      value={settings.sectionImagePlacement}
                      onValueChange={(value: "before" | "after") => setSettings(prev => ({ ...prev, sectionImagePlacement: value }))}
                    >
                      <SelectTrigger data-testid="select-section-placement">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before">Before Row</SelectItem>
                        <SelectItem value="after">After Row</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section-width">Width</Label>
                    <Select
                      value={settings.sectionImageWidth}
                      onValueChange={(value: "25" | "50" | "75" | "100") => setSettings(prev => ({ ...prev, sectionImageWidth: value }))}
                    >
                      <SelectTrigger data-testid="select-section-width">
                        <SelectValue placeholder="Select width" />
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
                    <Label htmlFor="section-alignment">Alignment</Label>
                    <Select
                      value={settings.sectionImageAlignment}
                      onValueChange={(value: "left" | "center" | "right") => setSettings(prev => ({ ...prev, sectionImageAlignment: value }))}
                    >
                      <SelectTrigger data-testid="select-section-alignment">
                        <SelectValue placeholder="Select alignment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Position the section image relative to product rows. Each row displays 4 products on desktop.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="section-title">Section Title</Label>
                  <Input
                    id="section-title"
                    value={settings.sectionTitle}
                    onChange={(e) => setSettings(prev => ({ ...prev, sectionTitle: e.target.value }))}
                    placeholder="Hot Deals"
                    data-testid="input-section-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section-description">Section Description</Label>
                  <Textarea
                    id="section-description"
                    value={settings.sectionDescription}
                    onChange={(e) => setSettings(prev => ({ ...prev, sectionDescription: e.target.value }))}
                    placeholder="Limited time offers on your favorite products"
                    rows={2}
                    data-testid="input-section-description"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Preview
              </CardTitle>
              <CardDescription>
                Preview how the banner will appear on the page
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settings.showBanner && settings.bannerUrl ? (
                <div className="relative overflow-hidden rounded-lg">
                  <img 
                    src={settings.bannerUrl} 
                    alt="Banner preview" 
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                    <div className="p-6 text-white max-w-lg">
                      <h2 className="text-2xl font-bold mb-2">{settings.bannerTitle || "Special Offers"}</h2>
                      <p className="text-white/80 mb-4">{settings.bannerSubtitle || "Don't miss out on these amazing deals!"}</p>
                      {settings.bannerCtaText && (
                        <Button variant="secondary" size="sm">
                          {settings.bannerCtaText}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-r from-destructive/20 to-destructive/5 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Percent className="h-12 w-12 mx-auto mb-2 text-destructive/50" />
                    <p className="text-muted-foreground">Upload a banner image to see preview</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
