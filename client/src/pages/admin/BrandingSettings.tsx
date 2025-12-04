import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Upload, Trash2, Loader2, Image, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BrandingSettings {
  logoUrl: string;
  storeName: string;
  showStoreName: boolean;
  faviconUrl: string;
  topBarText: string;
  showTopBar: boolean;
}

const defaultSettings: BrandingSettings = {
  logoUrl: "",
  storeName: "ShopHub",
  showStoreName: true,
  faviconUrl: "",
  topBarText: "Free shipping on orders over ₹500 | Shop Now",
  showTopBar: true,
};

export default function BrandingSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BrandingSettings>(defaultSettings);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

  const { data, isLoading } = useQuery<{ settings: BrandingSettings }>({
    queryKey: ["/api/settings/branding"],
  });

  useEffect(() => {
    if (data?.settings) {
      setSettings({ ...defaultSettings, ...data.settings });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: BrandingSettings) => {
      const response = await apiRequest("PUT", "/api/settings/branding", newSettings);
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/branding"] });
      toast({ title: "Branding settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save branding settings", variant: "destructive" });
    },
  });

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "favicon"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = type === "logo" ? setIsUploadingLogo : setIsUploadingFavicon;
    setUploading(true);

    try {
      // Get presigned URL for upload
      const presignedResponse = await apiRequest("POST", "/api/upload/presigned-url", {
        filename: file.name,
        contentType: file.type,
        folder: "branding",
      });
      
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
      
      if (!finalizeResponse.ok) {
        throw new Error("Failed to finalize upload");
      }
      
      const finalizedResult = await finalizeResponse.json();
      const finalUrl = finalizedResult.objectPath || `/objects/${objectPath}`;
      
      if (type === "logo") {
        setSettings(prev => ({ ...prev, logoUrl: finalUrl }));
      } else {
        setSettings(prev => ({ ...prev, faviconUrl: finalUrl }));
      }
      
      toast({ title: `${type === "logo" ? "Logo" : "Favicon"} uploaded successfully` });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ 
        title: `Failed to upload ${type}`, 
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
            <h1 className="text-3xl font-bold">Site Branding</h1>
            <p className="text-muted-foreground">Customize your store logo and branding</p>
          </div>
          <Button 
            onClick={() => saveMutation.mutate(settings)} 
            disabled={saveMutation.isPending}
            data-testid="button-save-branding"
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
                Header Logo
              </CardTitle>
              <CardDescription>
                Upload your store logo to display in the header navigation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-6">
                <div className="space-y-2">
                  <Label>Current Logo</Label>
                  {settings.logoUrl ? (
                    <div className="relative inline-block">
                      <img 
                        src={settings.logoUrl} 
                        alt="Store logo" 
                        className="h-20 w-auto object-contain border rounded bg-background p-2"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => setSettings(prev => ({ ...prev, logoUrl: "" }))}
                        data-testid="button-remove-logo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-20 w-40 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Image className="h-8 w-8 mx-auto mb-1 opacity-50" />
                        <span className="text-xs">No logo uploaded</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "logo")}
                      className="hidden"
                      id="header-logo-upload"
                      disabled={isUploadingLogo}
                    />
                    <Button asChild variant="outline" disabled={isUploadingLogo}>
                      <label htmlFor="header-logo-upload" className="cursor-pointer">
                        {isUploadingLogo ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload Logo
                      </label>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended size: 200x50 pixels. Supports PNG, JPG, SVG.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-base">Preview</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  How your logo will appear in the header
                </p>
                <div className="bg-background border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    {settings.logoUrl ? (
                      <img 
                        src={settings.logoUrl} 
                        alt="Logo preview" 
                        className="h-9 w-auto object-contain"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-lg">
                        {settings.storeName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {settings.showStoreName && (
                      <span className="font-bold text-xl">{settings.storeName}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Store Name
              </CardTitle>
              <CardDescription>
                The name displayed next to your logo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Show Store Name</Label>
                  <p className="text-sm text-muted-foreground">
                    Display the store name next to the logo in the header
                  </p>
                </div>
                <Switch
                  checked={settings.showStoreName}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, showStoreName: checked }))
                  }
                  data-testid="switch-show-store-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Store Name</Label>
                <Input
                  value={settings.storeName}
                  onChange={(e) => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
                  placeholder="ShopHub"
                  data-testid="input-store-name"
                />
                <p className="text-xs text-muted-foreground">
                  This name appears in the header and footer
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Announcement Bar</CardTitle>
              <CardDescription>
                The promotional message displayed at the top of your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Show Announcement Bar</Label>
                  <p className="text-sm text-muted-foreground">
                    Display the promotional bar at the top
                  </p>
                </div>
                <Switch
                  checked={settings.showTopBar}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, showTopBar: checked }))
                  }
                  data-testid="switch-show-top-bar"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Announcement Text</Label>
                <Input
                  value={settings.topBarText}
                  onChange={(e) => setSettings(prev => ({ ...prev, topBarText: e.target.value }))}
                  placeholder="Free shipping on orders over ₹500 | Shop Now"
                  data-testid="input-top-bar-text"
                />
              </div>

              {settings.showTopBar && (
                <div className="pt-4 border-t">
                  <Label className="text-base">Preview</Label>
                  <div className="mt-2 bg-primary text-primary-foreground py-1.5 text-center text-sm rounded">
                    {settings.topBarText || "Your announcement here"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Favicon</CardTitle>
              <CardDescription>
                The small icon shown in browser tabs (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {settings.faviconUrl ? (
                  <div className="relative">
                    <img 
                      src={settings.faviconUrl} 
                      alt="Favicon" 
                      className="h-8 w-8 object-contain border rounded"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5"
                      onClick={() => setSettings(prev => ({ ...prev, faviconUrl: "" }))}
                      data-testid="button-remove-favicon"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-8 w-8 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground text-xs">
                    ICO
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*,.ico"
                    onChange={(e) => handleImageUpload(e, "favicon")}
                    className="hidden"
                    id="favicon-upload"
                    disabled={isUploadingFavicon}
                  />
                  <Button asChild variant="outline" size="sm" disabled={isUploadingFavicon}>
                    <label htmlFor="favicon-upload" className="cursor-pointer">
                      {isUploadingFavicon ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload Favicon
                    </label>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    32x32 pixels recommended
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
