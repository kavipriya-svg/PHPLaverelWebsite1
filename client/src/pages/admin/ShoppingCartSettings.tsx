import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Upload, Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ShoppingCartPageSettings {
  pageTitle: string;
  pageSubLabel: string;
  emptyCartTitle: string;
  emptyCartButtonText: string;
  integrityBadgeTitle: string;
  integrityBadgeDescription: string;
  showIntegrityBadge: boolean;
  relatedSectionLabel: string;
  relatedSectionTitle: string;
  relatedSectionDescription: string;
  showRelatedSection: boolean;
  orderSummaryTitle: string;
  checkoutButtonText: string;
  trustBadge1: string;
  trustBadge2Text: string;
  heroImageUrl: string;
  showHeroImage: boolean;
}

const defaultSettings: ShoppingCartPageSettings = {
  pageTitle: "Biological Protocol: Shopping Cart",
  pageSubLabel: "Inventory Verification Stage 1/3",
  emptyCartTitle: "Your dossier is empty.",
  emptyCartButtonText: "Begin Protocol",
  integrityBadgeTitle: "Biological Integrity Guaranteed",
  integrityBadgeDescription:
    "Every protocol item undergoes rigorous clinical sanitization and veterinary inspection prior to dispatch from our 19 DOGS biological logistics center.",
  showIntegrityBadge: true,
  relatedSectionLabel: "Related Dossiers",
  relatedSectionTitle: "Complete the biological set.",
  relatedSectionDescription:
    "Our atelier designs products that work in synergy — engineered to enhance the biomechanics of active canine movement during high-intensity intervals.",
  showRelatedSection: true,
  orderSummaryTitle: "Order Summary",
  checkoutButtonText: "Proceed to Checkout",
  trustBadge1: "Secure Encrypted Connection",
  trustBadge2Text: "Free Shipping on Orders Over",
  heroImageUrl: "",
  showHeroImage: false,
};

export default function ShoppingCartSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ShoppingCartPageSettings>(defaultSettings);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const { data, isLoading } = useQuery<{ settings: ShoppingCartPageSettings }>({
    queryKey: ["/api/settings/shopping-cart"],
  });

  useEffect(() => {
    if (data?.settings) {
      setSettings({ ...defaultSettings, ...data.settings });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => apiRequest("PUT", "/api/settings/shopping-cart", settingsRef.current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/shopping-cart"] });
      toast({ title: "Saved", description: "Shopping Cart page settings updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const handleImageUpload = async (file: File) => {
    setIsUploadingHero(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload/file", { method: "POST", body: formData, credentials: "include" });
      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      update("heroImageUrl", result.url);
    } catch {
      toast({ title: "Upload failed", description: "Could not upload image.", variant: "destructive" });
    } finally {
      setIsUploadingHero(false);
    }
  };

  const update = (key: keyof ShoppingCartPageSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Shopping Cart Page
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Control the text, image, and sections displayed on the /cart page.
            </p>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-shopping-cart"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Page Header */}
        <Card>
          <CardHeader>
            <CardTitle>Page Header</CardTitle>
            <CardDescription>The title and sub-label shown at the top of the cart page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pageTitle">Page Title</Label>
              <Input
                id="pageTitle"
                value={settings.pageTitle}
                onChange={(e) => update("pageTitle", e.target.value)}
                placeholder="Biological Protocol: Shopping Cart"
                data-testid="input-page-title"
              />
              <p className="text-xs text-muted-foreground">Large italic heading at the top of the cart.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageSubLabel">Sub-Label</Label>
              <Input
                id="pageSubLabel"
                value={settings.pageSubLabel}
                onChange={(e) => update("pageSubLabel", e.target.value)}
                placeholder="Inventory Verification Stage 1/3"
                data-testid="input-page-sub-label"
              />
              <p className="text-xs text-muted-foreground">Small caps text below the title.</p>
            </div>
          </CardContent>
        </Card>

        {/* Hero Image */}
        <Card>
          <CardHeader>
            <CardTitle>Hero / Banner Image</CardTitle>
            <CardDescription>
              Optional full-width image shown below the page header. Toggle off to hide.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="showHeroImage"
                checked={settings.showHeroImage}
                onCheckedChange={(v) => update("showHeroImage", v)}
                data-testid="switch-show-hero-image"
              />
              <Label htmlFor="showHeroImage">Show Hero Image</Label>
            </div>
            {settings.showHeroImage && (
              <>
                {settings.heroImageUrl && (
                  <div className="relative w-full max-h-40 overflow-hidden rounded-md border bg-muted">
                    <img src={settings.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                    <button
                      onClick={() => update("heroImageUrl", "")}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs hover:opacity-90"
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Input
                    value={settings.heroImageUrl}
                    onChange={(e) => update("heroImageUrl", e.target.value)}
                    placeholder="https://... or upload"
                    className="max-w-sm"
                    data-testid="input-hero-image-url"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => heroFileRef.current?.click()}
                    disabled={isUploadingHero}
                    data-testid="button-upload-hero-image"
                  >
                    {isUploadingHero ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                  <input
                    ref={heroFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Recommended: 1920×600px, JPG/PNG/WebP, max 10MB</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Empty Cart State */}
        <Card>
          <CardHeader>
            <CardTitle>Empty Cart State</CardTitle>
            <CardDescription>Text shown when the cart has no items.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emptyCartTitle">Empty Cart Message</Label>
              <Input
                id="emptyCartTitle"
                value={settings.emptyCartTitle}
                onChange={(e) => update("emptyCartTitle", e.target.value)}
                placeholder="Your dossier is empty."
                data-testid="input-empty-cart-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emptyCartButtonText">CTA Button Text</Label>
              <Input
                id="emptyCartButtonText"
                value={settings.emptyCartButtonText}
                onChange={(e) => update("emptyCartButtonText", e.target.value)}
                placeholder="Begin Protocol"
                data-testid="input-empty-cart-button"
              />
            </div>
          </CardContent>
        </Card>

        {/* Biological Integrity Badge */}
        <Card>
          <CardHeader>
            <CardTitle>Biological Integrity Badge</CardTitle>
            <CardDescription>
              The dark-bordered quality assurance notice shown below the cart items.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="showIntegrityBadge"
                checked={settings.showIntegrityBadge}
                onCheckedChange={(v) => update("showIntegrityBadge", v)}
                data-testid="switch-show-integrity-badge"
              />
              <Label htmlFor="showIntegrityBadge">Show Integrity Badge</Label>
            </div>
            {settings.showIntegrityBadge && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="integrityBadgeTitle">Badge Title</Label>
                  <Input
                    id="integrityBadgeTitle"
                    value={settings.integrityBadgeTitle}
                    onChange={(e) => update("integrityBadgeTitle", e.target.value)}
                    placeholder="Biological Integrity Guaranteed"
                    data-testid="input-integrity-badge-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="integrityBadgeDescription">Badge Description</Label>
                  <Textarea
                    id="integrityBadgeDescription"
                    value={settings.integrityBadgeDescription}
                    onChange={(e) => update("integrityBadgeDescription", e.target.value)}
                    rows={3}
                    placeholder="Every protocol item undergoes..."
                    data-testid="input-integrity-badge-description"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Order Summary Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary Panel</CardTitle>
            <CardDescription>The right-side summary and checkout panel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderSummaryTitle">Panel Title</Label>
              <Input
                id="orderSummaryTitle"
                value={settings.orderSummaryTitle}
                onChange={(e) => update("orderSummaryTitle", e.target.value)}
                placeholder="Order Summary"
                data-testid="input-order-summary-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkoutButtonText">Checkout Button Text</Label>
              <Input
                id="checkoutButtonText"
                value={settings.checkoutButtonText}
                onChange={(e) => update("checkoutButtonText", e.target.value)}
                placeholder="Proceed to Checkout"
                data-testid="input-checkout-button-text"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trustBadge1">Trust Badge 1 (Security)</Label>
              <Input
                id="trustBadge1"
                value={settings.trustBadge1}
                onChange={(e) => update("trustBadge1", e.target.value)}
                placeholder="Secure Encrypted Connection"
                data-testid="input-trust-badge-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trustBadge2Text">Trust Badge 2 (Shipping)</Label>
              <Input
                id="trustBadge2Text"
                value={settings.trustBadge2Text}
                onChange={(e) => update("trustBadge2Text", e.target.value)}
                placeholder="Free Shipping on Orders Over"
                data-testid="input-trust-badge-2"
              />
              <p className="text-xs text-muted-foreground">
                The currency threshold is appended automatically (e.g. "₹500").
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Related Products Section */}
        <Card>
          <CardHeader>
            <CardTitle>Related Products Section</CardTitle>
            <CardDescription>
              The "Related Dossiers" strip at the bottom of the cart page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="showRelatedSection"
                checked={settings.showRelatedSection}
                onCheckedChange={(v) => update("showRelatedSection", v)}
                data-testid="switch-show-related-section"
              />
              <Label htmlFor="showRelatedSection">Show Related Products Section</Label>
            </div>
            {settings.showRelatedSection && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="relatedSectionLabel">Section Label (small caps italic)</Label>
                  <Input
                    id="relatedSectionLabel"
                    value={settings.relatedSectionLabel}
                    onChange={(e) => update("relatedSectionLabel", e.target.value)}
                    placeholder="Related Dossiers"
                    data-testid="input-related-section-label"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relatedSectionTitle">Section Title</Label>
                  <Input
                    id="relatedSectionTitle"
                    value={settings.relatedSectionTitle}
                    onChange={(e) => update("relatedSectionTitle", e.target.value)}
                    placeholder="Complete the biological set."
                    data-testid="input-related-section-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relatedSectionDescription">Section Description</Label>
                  <Textarea
                    id="relatedSectionDescription"
                    value={settings.relatedSectionDescription}
                    onChange={(e) => update("relatedSectionDescription", e.target.value)}
                    rows={3}
                    placeholder="Our atelier designs products..."
                    data-testid="input-related-section-description"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Save bottom */}
        <div className="flex justify-end pb-8">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            size="lg"
            data-testid="button-save-shopping-cart-bottom"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
