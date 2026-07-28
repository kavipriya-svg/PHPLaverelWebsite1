import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Upload, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CheckoutPageSettings {
  headerLogoText: string;
  protocolStatusText: string;
  emptyCartTitle: string;
  emptyCartMessage: string;
  emptyCartButtonText: string;
  dossierTitle: string;
  dossierBadge: string;
  totalLabel: string;
  currencyNote: string;
  securityBadgeTitle: string;
  securityBadgeDescription: string;
  supportLink1Text: string;
  supportLink2Text: string;
  placeOrderButtonText: string;
  processingButtonText: string;
  termsText: string;
  footerBrandName: string;
  footerCopyright: string;
  footerLink1Text: string;
  footerLink1Href: string;
  footerLink2Text: string;
  footerLink2Href: string;
  footerLink3Text: string;
  footerLink3Href: string;
  heroImageUrl: string;
  showHeroImage: boolean;
}

const defaultSettings: CheckoutPageSettings = {
  headerLogoText: "19 Dogs",
  protocolStatusText: "Protocol Status / Stage 2/3: Finalization",
  emptyCartTitle: "Your Cart Is Empty",
  emptyCartMessage: "No items to finalize. Return to the catalog.",
  emptyCartButtonText: "Return to Catalog",
  dossierTitle: "Protocol Dossier",
  dossierBadge: "V.01-REV",
  totalLabel: "Total_Allocation",
  currencyNote: "INR (SECURE)",
  securityBadgeTitle: "19 Dogs Quantum Encryption",
  securityBadgeDescription:
    "Biometric and financial data handled under ISO-9001 biological security standards.",
  supportLink1Text: "Technical Assistance",
  supportLink2Text: "Protocol Archive",
  placeOrderButtonText: "Place Order",
  processingButtonText: "Processing Protocol...",
  termsText: "By placing this order, you agree to our Terms of Service and Privacy Policy.",
  footerBrandName: "19 Dogs",
  footerCopyright:
    "© 19 Dogs Biological Wellness. All rights reserved. For scientific use only. Proprietary equipment and logistics systems.",
  footerLink1Text: "Biological Compliance",
  footerLink1Href: "/pages/terms",
  footerLink2Text: "Privacy Protocols",
  footerLink2Href: "/pages/privacy",
  footerLink3Text: "System Contact",
  footerLink3Href: "/contact",
  heroImageUrl: "",
  showHeroImage: false,
};

export default function CheckoutSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CheckoutPageSettings>(defaultSettings);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef(settings);

  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const { data, isLoading } = useQuery<{ settings: CheckoutPageSettings }>({
    queryKey: ["/api/settings/checkout-page"],
  });

  useEffect(() => {
    if (data?.settings) setSettings({ ...defaultSettings, ...data.settings });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => apiRequest("PUT", "/api/settings/checkout-page", settingsRef.current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/checkout-page"] });
      toast({ title: "Saved", description: "Checkout page settings updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" }),
  });

  const handleImageUpload = async (file: File) => {
    setIsUploadingHero(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      update("heroImageUrl", result.url);
    } catch {
      toast({ title: "Upload failed", description: "Could not upload image.", variant: "destructive" });
    } finally {
      setIsUploadingHero(false);
    }
  };

  const update = (key: keyof CheckoutPageSettings, value: string | boolean) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const SaveButton = ({ bottom }: { bottom?: boolean }) => (
    <Button
      onClick={() => saveMutation.mutate()}
      disabled={saveMutation.isPending}
      size={bottom ? "lg" : "default"}
      data-testid={bottom ? "button-save-checkout-bottom" : "button-save-checkout"}
    >
      {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
      Save Changes
    </Button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Checkout Page
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Control every static text, image, and section on the /checkout page.
          </p>
        </div>
        <SaveButton />
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Page Header</CardTitle>
          <CardDescription>The top bar shown during checkout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Logo / Brand Text</Label>
            <Input value={settings.headerLogoText} onChange={(e) => update("headerLogoText", e.target.value)} placeholder="19 Dogs" data-testid="input-header-logo" />
            <p className="text-xs text-muted-foreground">The clickable logo text in the checkout header.</p>
          </div>
          <div className="space-y-2">
            <Label>Protocol Status Text</Label>
            <Input value={settings.protocolStatusText} onChange={(e) => update("protocolStatusText", e.target.value)} placeholder="Protocol Status / Stage 2/3: Finalization" data-testid="input-protocol-status" />
            <p className="text-xs text-muted-foreground">Small label above the progress bar.</p>
          </div>
        </CardContent>
      </Card>

      {/* Hero Image */}
      <Card>
        <CardHeader>
          <CardTitle>Hero / Banner Image</CardTitle>
          <CardDescription>Optional banner shown at the top of the checkout form area.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch id="showHeroImage" checked={settings.showHeroImage} onCheckedChange={(v) => update("showHeroImage", v)} data-testid="switch-show-hero-image" />
            <Label htmlFor="showHeroImage">Show Hero Image</Label>
          </div>
          {settings.showHeroImage && (
            <>
              {settings.heroImageUrl && (
                <div className="relative w-full max-h-40 overflow-hidden rounded-md border bg-muted">
                  <img src={settings.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                  <button onClick={() => update("heroImageUrl", "")} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs" type="button">×</button>
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <Input value={settings.heroImageUrl} onChange={(e) => update("heroImageUrl", e.target.value)} placeholder="https://... or upload" className="max-w-sm" data-testid="input-hero-image-url" />
                <Button type="button" variant="outline" onClick={() => heroFileRef.current?.click()} disabled={isUploadingHero} data-testid="button-upload-hero">
                  {isUploadingHero ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}Upload
                </Button>
                <input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Empty Cart */}
      <Card>
        <CardHeader>
          <CardTitle>Empty Cart State</CardTitle>
          <CardDescription>Text shown when navigating to checkout with an empty cart.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={settings.emptyCartTitle} onChange={(e) => update("emptyCartTitle", e.target.value)} placeholder="Your Cart Is Empty" data-testid="input-empty-cart-title" />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Input value={settings.emptyCartMessage} onChange={(e) => update("emptyCartMessage", e.target.value)} placeholder="No items to finalize. Return to the catalog." data-testid="input-empty-cart-message" />
          </div>
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input value={settings.emptyCartButtonText} onChange={(e) => update("emptyCartButtonText", e.target.value)} placeholder="Return to Catalog" data-testid="input-empty-cart-button" />
          </div>
        </CardContent>
      </Card>

      {/* Protocol Dossier Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Dossier Panel</CardTitle>
          <CardDescription>The right-side order summary panel during checkout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Panel Title</Label>
              <Input value={settings.dossierTitle} onChange={(e) => update("dossierTitle", e.target.value)} placeholder="Protocol Dossier" data-testid="input-dossier-title" />
            </div>
            <div className="space-y-2">
              <Label>Version Badge</Label>
              <Input value={settings.dossierBadge} onChange={(e) => update("dossierBadge", e.target.value)} placeholder="V.01-REV" data-testid="input-dossier-badge" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Label</Label>
              <Input value={settings.totalLabel} onChange={(e) => update("totalLabel", e.target.value)} placeholder="Total_Allocation" data-testid="input-total-label" />
            </div>
            <div className="space-y-2">
              <Label>Currency Note</Label>
              <Input value={settings.currencyNote} onChange={(e) => update("currencyNote", e.target.value)} placeholder="INR (SECURE)" data-testid="input-currency-note" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Badge */}
      <Card>
        <CardHeader>
          <CardTitle>Security Badge</CardTitle>
          <CardDescription>The trust/security notice below the order total.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Badge Title</Label>
            <Input value={settings.securityBadgeTitle} onChange={(e) => update("securityBadgeTitle", e.target.value)} placeholder="19 Dogs Quantum Encryption" data-testid="input-security-badge-title" />
          </div>
          <div className="space-y-2">
            <Label>Badge Description</Label>
            <Textarea value={settings.securityBadgeDescription} onChange={(e) => update("securityBadgeDescription", e.target.value)} rows={2} placeholder="Biometric and financial data..." data-testid="input-security-badge-desc" />
          </div>
        </CardContent>
      </Card>

      {/* Support Links */}
      <Card>
        <CardHeader>
          <CardTitle>Support Links</CardTitle>
          <CardDescription>Two links below the dossier panel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Link 1 Text</Label>
              <Input value={settings.supportLink1Text} onChange={(e) => update("supportLink1Text", e.target.value)} placeholder="Technical Assistance" data-testid="input-support-link-1" />
            </div>
            <div className="space-y-2">
              <Label>Link 2 Text</Label>
              <Input value={settings.supportLink2Text} onChange={(e) => update("supportLink2Text", e.target.value)} placeholder="Protocol Archive" data-testid="input-support-link-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Place Order Button */}
      <Card>
        <CardHeader>
          <CardTitle>Order Submission</CardTitle>
          <CardDescription>The submit button and disclaimer text at the bottom of the form.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input value={settings.placeOrderButtonText} onChange={(e) => update("placeOrderButtonText", e.target.value)} placeholder="Place Order" data-testid="input-place-order-btn" />
            </div>
            <div className="space-y-2">
              <Label>Processing Text</Label>
              <Input value={settings.processingButtonText} onChange={(e) => update("processingButtonText", e.target.value)} placeholder="Processing Protocol..." data-testid="input-processing-btn" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Terms Disclaimer</Label>
            <Textarea value={settings.termsText} onChange={(e) => update("termsText", e.target.value)} rows={2} placeholder="By placing this order, you agree to our Terms of Service and Privacy Policy." data-testid="input-terms-text" />
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card>
        <CardHeader>
          <CardTitle>Checkout Footer</CardTitle>
          <CardDescription>The dark footer shown at the bottom of the checkout page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand Name</Label>
              <Input value={settings.footerBrandName} onChange={(e) => update("footerBrandName", e.target.value)} placeholder="19 Dogs" data-testid="input-footer-brand" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Copyright Text</Label>
            <Textarea value={settings.footerCopyright} onChange={(e) => update("footerCopyright", e.target.value)} rows={2} placeholder="© 19 Dogs Biological Wellness..." data-testid="input-footer-copyright" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Footer Link 1 Text</Label>
              <Input value={settings.footerLink1Text} onChange={(e) => update("footerLink1Text", e.target.value)} placeholder="Biological Compliance" data-testid="input-footer-link-1-text" />
            </div>
            <div className="space-y-2">
              <Label>Footer Link 1 URL</Label>
              <Input value={settings.footerLink1Href} onChange={(e) => update("footerLink1Href", e.target.value)} placeholder="/pages/terms" data-testid="input-footer-link-1-href" />
            </div>
            <div className="space-y-2">
              <Label>Footer Link 2 Text</Label>
              <Input value={settings.footerLink2Text} onChange={(e) => update("footerLink2Text", e.target.value)} placeholder="Privacy Protocols" data-testid="input-footer-link-2-text" />
            </div>
            <div className="space-y-2">
              <Label>Footer Link 2 URL</Label>
              <Input value={settings.footerLink2Href} onChange={(e) => update("footerLink2Href", e.target.value)} placeholder="/pages/privacy" data-testid="input-footer-link-2-href" />
            </div>
            <div className="space-y-2">
              <Label>Footer Link 3 Text</Label>
              <Input value={settings.footerLink3Text} onChange={(e) => update("footerLink3Text", e.target.value)} placeholder="System Contact" data-testid="input-footer-link-3-text" />
            </div>
            <div className="space-y-2">
              <Label>Footer Link 3 URL</Label>
              <Input value={settings.footerLink3Href} onChange={(e) => update("footerLink3Href", e.target.value)} placeholder="/contact" data-testid="input-footer-link-3-href" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <SaveButton bottom />
      </div>
    </div>
  );
}
