import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FooterLink {
  label: string;
  url: string;
}

interface FooterSettings {
  storeName: string;
  storeDescription: string;
  logoUrl: string;
  showStoreName: boolean;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  quickLinks: FooterLink[];
  legalLinks: FooterLink[];
  newsletterEnabled: boolean;
  newsletterTitle: string;
  newsletterDescription: string;
  copyrightText: string;
  showSocialLinks: boolean;
  showContactInfo: boolean;
  showQuickLinks: boolean;
  showNewsletter: boolean;
}

const defaultSettings: FooterSettings = {
  storeName: "ShopHub",
  storeDescription: "Your one-stop destination for quality products at great prices.",
  logoUrl: "",
  showStoreName: true,
  socialLinks: {
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: "",
  },
  contactInfo: {
    phone: "1-800-SHOPHUB",
    email: "support@shophub.com",
    address: "123 Commerce Street\nNew York, NY 10001",
  },
  quickLinks: [
    { label: "About Us", url: "/about" },
    { label: "Contact Us", url: "/contact" },
    { label: "FAQ", url: "/faq" },
  ],
  legalLinks: [
    { label: "Privacy Policy", url: "/privacy" },
    { label: "Terms of Service", url: "/terms" },
  ],
  newsletterEnabled: true,
  newsletterTitle: "Newsletter",
  newsletterDescription: "Subscribe for exclusive deals, new arrivals, and more.",
  copyrightText: "All rights reserved.",
  showSocialLinks: true,
  showContactInfo: true,
  showQuickLinks: true,
  showNewsletter: true,
};

export default function FooterSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<FooterSettings>(defaultSettings);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading } = useQuery<{ settings: FooterSettings }>({
    queryKey: ["/api/settings/footer"],
  });

  useEffect(() => {
    if (data?.settings) {
      setSettings({ ...defaultSettings, ...data.settings });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: FooterSettings) => {
      const response = await apiRequest("PUT", "/api/settings/footer", newSettings);
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/footer"] });
      toast({ title: "Footer settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save footer settings", variant: "destructive" });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const presignedResponse = await apiRequest("POST", "/api/upload/presigned-url", {
        filename: file.name,
        contentType: file.type,
        folder: "footer",
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
      
      setSettings(prev => ({ ...prev, logoUrl: finalUrl }));
      toast({ title: "Logo uploaded successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ 
        title: "Failed to upload logo", 
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const updateSocialLink = (key: keyof FooterSettings["socialLinks"], value: string) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }));
  };

  const updateContactInfo = (key: keyof FooterSettings["contactInfo"], value: string) => {
    setSettings(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, [key]: value },
    }));
  };

  const addQuickLink = () => {
    setSettings(prev => ({
      ...prev,
      quickLinks: [...prev.quickLinks, { label: "", url: "" }],
    }));
  };

  const updateQuickLink = (index: number, field: "label" | "url", value: string) => {
    setSettings(prev => ({
      ...prev,
      quickLinks: prev.quickLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const removeQuickLink = (index: number) => {
    setSettings(prev => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((_, i) => i !== index),
    }));
  };

  const addLegalLink = () => {
    setSettings(prev => ({
      ...prev,
      legalLinks: [...prev.legalLinks, { label: "", url: "" }],
    }));
  };

  const updateLegalLink = (index: number, field: "label" | "url", value: string) => {
    setSettings(prev => ({
      ...prev,
      legalLinks: prev.legalLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const removeLegalLink = (index: number) => {
    setSettings(prev => ({
      ...prev,
      legalLinks: prev.legalLinks.filter((_, i) => i !== index),
    }));
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
            <h1 className="text-3xl font-bold">Footer Settings</h1>
            <p className="text-muted-foreground">Customize your store footer content</p>
          </div>
          <Button 
            onClick={() => saveMutation.mutate(settings)} 
            disabled={saveMutation.isPending}
            data-testid="button-save-footer-settings"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="social">Social Links</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
            <TabsTrigger value="links">Quick Links</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>Basic information displayed in the footer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Footer Logo</Label>
                  <div className="flex items-center gap-4">
                    {settings.logoUrl ? (
                      <div className="relative">
                        <img 
                          src={settings.logoUrl} 
                          alt="Footer logo" 
                          className="h-16 w-auto object-contain border rounded"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => setSettings(prev => ({ ...prev, logoUrl: "" }))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-16 w-32 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground text-sm">
                        No logo
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="footer-logo-upload"
                        disabled={isUploading}
                      />
                      <Button asChild variant="outline" disabled={isUploading}>
                        <label htmlFor="footer-logo-upload" className="cursor-pointer">
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Upload Logo
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Store Name</Label>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="show-store-name" className="text-sm text-muted-foreground">
                        Show in footer
                      </Label>
                      <Switch
                        id="show-store-name"
                        checked={settings.showStoreName}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showStoreName: checked }))}
                        data-testid="switch-show-store-name"
                      />
                    </div>
                  </div>
                  <Input
                    value={settings.storeName}
                    onChange={(e) => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
                    placeholder="ShopHub"
                    disabled={!settings.showStoreName}
                    data-testid="input-footer-store-name"
                  />
                  <p className="text-sm text-muted-foreground">
                    {settings.showStoreName ? "Store name will be displayed in the footer" : "Store name is hidden from footer"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Store Description</Label>
                  <Textarea
                    value={settings.storeDescription}
                    onChange={(e) => setSettings(prev => ({ ...prev, storeDescription: e.target.value }))}
                    placeholder="Your one-stop destination for quality products..."
                    rows={3}
                    data-testid="input-footer-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Copyright Text</Label>
                  <Input
                    value={settings.copyrightText}
                    onChange={(e) => setSettings(prev => ({ ...prev, copyrightText: e.target.value }))}
                    placeholder="All rights reserved."
                    data-testid="input-copyright-text"
                  />
                  <p className="text-xs text-muted-foreground">
                    The year and store name are automatically prepended
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>Connect your social media accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Facebook URL</Label>
                    <Input
                      value={settings.socialLinks.facebook}
                      onChange={(e) => updateSocialLink("facebook", e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                      data-testid="input-social-facebook"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Twitter / X URL</Label>
                    <Input
                      value={settings.socialLinks.twitter}
                      onChange={(e) => updateSocialLink("twitter", e.target.value)}
                      placeholder="https://twitter.com/yourhandle"
                      data-testid="input-social-twitter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram URL</Label>
                    <Input
                      value={settings.socialLinks.instagram}
                      onChange={(e) => updateSocialLink("instagram", e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                      data-testid="input-social-instagram"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>YouTube URL</Label>
                    <Input
                      value={settings.socialLinks.youtube}
                      onChange={(e) => updateSocialLink("youtube", e.target.value)}
                      placeholder="https://youtube.com/yourchannel"
                      data-testid="input-social-youtube"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Customer service contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={settings.contactInfo.phone}
                      onChange={(e) => updateContactInfo("phone", e.target.value)}
                      placeholder="1-800-SHOPHUB"
                      data-testid="input-contact-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={settings.contactInfo.email}
                      onChange={(e) => updateContactInfo("email", e.target.value)}
                      placeholder="support@shophub.com"
                      data-testid="input-contact-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Physical Address</Label>
                  <Textarea
                    value={settings.contactInfo.address}
                    onChange={(e) => updateContactInfo("address", e.target.value)}
                    placeholder="123 Commerce Street&#10;New York, NY 10001"
                    rows={3}
                    data-testid="input-contact-address"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>Navigation links shown in the footer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.quickLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={link.label}
                      onChange={(e) => updateQuickLink(index, "label", e.target.value)}
                      placeholder="Link Label"
                      className="flex-1"
                      data-testid={`input-quick-link-label-${index}`}
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => updateQuickLink(index, "url", e.target.value)}
                      placeholder="/page-url"
                      className="flex-1"
                      data-testid={`input-quick-link-url-${index}`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeQuickLink(index)}
                      data-testid={`button-remove-quick-link-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addQuickLink} data-testid="button-add-quick-link">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Quick Link
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Legal Links</CardTitle>
                <CardDescription>Legal and policy links in the footer bottom</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.legalLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={link.label}
                      onChange={(e) => updateLegalLink(index, "label", e.target.value)}
                      placeholder="Link Label"
                      className="flex-1"
                      data-testid={`input-legal-link-label-${index}`}
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => updateLegalLink(index, "url", e.target.value)}
                      placeholder="/page-url"
                      className="flex-1"
                      data-testid={`input-legal-link-url-${index}`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeLegalLink(index)}
                      data-testid={`button-remove-legal-link-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addLegalLink} data-testid="button-add-legal-link">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Legal Link
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="newsletter" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Section</CardTitle>
                <CardDescription>Configure the newsletter signup section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Newsletter Title</Label>
                  <Input
                    value={settings.newsletterTitle}
                    onChange={(e) => setSettings(prev => ({ ...prev, newsletterTitle: e.target.value }))}
                    placeholder="Newsletter"
                    data-testid="input-newsletter-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Newsletter Description</Label>
                  <Textarea
                    value={settings.newsletterDescription}
                    onChange={(e) => setSettings(prev => ({ ...prev, newsletterDescription: e.target.value }))}
                    placeholder="Subscribe for exclusive deals..."
                    rows={2}
                    data-testid="input-newsletter-description"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visibility" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Section Visibility</CardTitle>
                <CardDescription>Control which sections are displayed in the footer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Show Social Links</Label>
                    <p className="text-sm text-muted-foreground">
                      Display social media icons
                    </p>
                  </div>
                  <Switch
                    checked={settings.showSocialLinks}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, showSocialLinks: checked }))
                    }
                    data-testid="switch-show-social-links"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Show Contact Info</Label>
                    <p className="text-sm text-muted-foreground">
                      Display phone, email, and address
                    </p>
                  </div>
                  <Switch
                    checked={settings.showContactInfo}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, showContactInfo: checked }))
                    }
                    data-testid="switch-show-contact-info"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Show Quick Links</Label>
                    <p className="text-sm text-muted-foreground">
                      Display navigation links
                    </p>
                  </div>
                  <Switch
                    checked={settings.showQuickLinks}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, showQuickLinks: checked }))
                    }
                    data-testid="switch-show-quick-links"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Show Newsletter</Label>
                    <p className="text-sm text-muted-foreground">
                      Display newsletter signup form
                    </p>
                  </div>
                  <Switch
                    checked={settings.showNewsletter}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, showNewsletter: checked }))
                    }
                    data-testid="switch-show-newsletter"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
