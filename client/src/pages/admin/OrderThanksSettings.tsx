import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Upload, Loader2, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface OrderThanksSettings {
  heroHeadline: string;
  heroSubLabel: string;
  heroImageUrl: string;
  whatsNextHeading: string;
  step1Title: string;
  step1Description: string;
  step2Title: string;
  step2Description: string;
  step3Title: string;
  step3Description: string;
  actionsHeading: string;
}

const defaultSettings: OrderThanksSettings = {
  heroHeadline: "Biological Protocol: Synchronization Complete",
  heroSubLabel: "PROTOCOL SYNCHRONIZED // TRANSACTION SUCCESSFUL",
  heroImageUrl: "",
  whatsNextHeading: "What's Next?",
  step1Title: "Preparation for Shipment",
  step1Description:
    "Your order is being queued for cold-chain fulfillment. Biological integrity is maintained through -18°C stable transport.",
  step2Title: "Logistics Initialization",
  step2Description:
    "You will receive a notification via SMS/Email once the subject dossier has been dispatched to our premium courier partner.",
  step3Title: "Biological Payload Received",
  step3Description:
    "Your order arrives. For COD, payment is collected at delivery. Track progress anytime using your order identifier.",
  actionsHeading: "PRIMARY ACTIONS",
};

export default function OrderThanksSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<OrderThanksSettings>(defaultSettings);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
  const heroImageRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const { data, isLoading } = useQuery<{ settings: OrderThanksSettings }>({
    queryKey: ["/api/settings/order-thanks"],
  });

  useEffect(() => {
    if (data?.settings) {
      setSettings({ ...defaultSettings, ...data.settings });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/settings/order-thanks", settingsRef.current);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/order-thanks"] });
      toast({ title: "Saved", description: "Order Thanks page settings updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const handleImageUpload = async (file: File, field: "heroImageUrl") => {
    if (field === "heroImageUrl") setIsUploadingHeroImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      setSettings((prev) => ({ ...prev, [field]: result.url }));
    } catch {
      toast({ title: "Upload failed", description: "Could not upload image.", variant: "destructive" });
    } finally {
      if (field === "heroImageUrl") setIsUploadingHeroImage(false);
    }
  };

  const update = (key: keyof OrderThanksSettings, value: string) => {
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
              <FileText className="h-6 w-6" />
              Order Thanks Page
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Customize the text, image, and process steps shown on the order confirmation page.
            </p>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-order-thanks"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Hero Section */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>
              The large dark-green panel at the top of the confirmation page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heroHeadline">Main Headline</Label>
              <Textarea
                id="heroHeadline"
                value={settings.heroHeadline}
                onChange={(e) => update("heroHeadline", e.target.value)}
                rows={2}
                placeholder="Biological Protocol: Synchronization Complete"
                data-testid="input-hero-headline"
              />
              <p className="text-xs text-muted-foreground">Displayed as large bold text inside the dark green box.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroSubLabel">Sub-Label / Confirmation Text</Label>
              <Input
                id="heroSubLabel"
                value={settings.heroSubLabel}
                onChange={(e) => update("heroSubLabel", e.target.value)}
                placeholder="PROTOCOL SYNCHRONIZED // TRANSACTION SUCCESSFUL"
                data-testid="input-hero-sub-label"
              />
              <p className="text-xs text-muted-foreground">Short mono-style confirmation message below the headline.</p>
            </div>

            <div className="space-y-2">
              <Label>Hero Override Image</Label>
              <p className="text-xs text-muted-foreground">
                Optional. When set, this image overrides the first order item's product image shown on the right side of the hero. Leave blank to use the product image automatically.
              </p>
              {settings.heroImageUrl && (
                <div className="relative w-full max-w-xs aspect-[4/3] rounded-md overflow-hidden border bg-muted">
                  <img
                    src={settings.heroImageUrl}
                    alt="Hero override"
                    className="w-full h-full object-cover"
                  />
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
                  placeholder="https://... or upload below"
                  className="max-w-sm"
                  data-testid="input-hero-image-url"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => heroImageRef.current?.click()}
                  disabled={isUploadingHeroImage}
                  data-testid="button-upload-hero-image"
                >
                  {isUploadingHeroImage ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload
                </Button>
                <input
                  ref={heroImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "heroImageUrl");
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next Section */}
        <Card>
          <CardHeader>
            <CardTitle>What's Next Section</CardTitle>
            <CardDescription>
              The three-step process shown at the bottom of the page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="whatsNextHeading">Section Heading</Label>
              <Input
                id="whatsNextHeading"
                value={settings.whatsNextHeading}
                onChange={(e) => update("whatsNextHeading", e.target.value)}
                placeholder="What's Next?"
                data-testid="input-whats-next-heading"
              />
            </div>

            {/* Step 1 */}
            <div className="border rounded-md p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-mono text-xs font-bold">01</div>
                <span className="font-semibold text-sm">Step 1 — Active (filled circle)</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="step1Title">Title</Label>
                <Input
                  id="step1Title"
                  value={settings.step1Title}
                  onChange={(e) => update("step1Title", e.target.value)}
                  placeholder="Preparation for Shipment"
                  data-testid="input-step1-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="step1Description">Description</Label>
                <Textarea
                  id="step1Description"
                  value={settings.step1Description}
                  onChange={(e) => update("step1Description", e.target.value)}
                  rows={3}
                  placeholder="Your order is being queued..."
                  data-testid="input-step1-description"
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="border rounded-md p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full border border-muted-foreground text-muted-foreground flex items-center justify-center font-mono text-xs font-bold">02</div>
                <span className="font-semibold text-sm">Step 2 — Pending (outline circle)</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="step2Title">Title</Label>
                <Input
                  id="step2Title"
                  value={settings.step2Title}
                  onChange={(e) => update("step2Title", e.target.value)}
                  placeholder="Logistics Initialization"
                  data-testid="input-step2-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="step2Description">Description</Label>
                <Textarea
                  id="step2Description"
                  value={settings.step2Description}
                  onChange={(e) => update("step2Description", e.target.value)}
                  rows={3}
                  placeholder="You will receive a notification..."
                  data-testid="input-step2-description"
                />
              </div>
            </div>

            {/* Step 3 */}
            <div className="border rounded-md p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full border border-muted/40 text-muted-foreground/40 flex items-center justify-center font-mono text-xs font-bold">03</div>
                <span className="font-semibold text-sm">Step 3 — Future (faded circle)</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="step3Title">Title</Label>
                <Input
                  id="step3Title"
                  value={settings.step3Title}
                  onChange={(e) => update("step3Title", e.target.value)}
                  placeholder="Biological Payload Received"
                  data-testid="input-step3-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="step3Description">Description</Label>
                <Textarea
                  id="step3Description"
                  value={settings.step3Description}
                  onChange={(e) => update("step3Description", e.target.value)}
                  rows={3}
                  placeholder="Your order arrives..."
                  data-testid="input-step3-description"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Primary Actions Panel</CardTitle>
            <CardDescription>
              The dark-green panel on the right of the What's Next section.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actionsHeading">Panel Heading</Label>
              <Input
                id="actionsHeading"
                value={settings.actionsHeading}
                onChange={(e) => update("actionsHeading", e.target.value)}
                placeholder="PRIMARY ACTIONS"
                data-testid="input-actions-heading"
              />
              <p className="text-xs text-muted-foreground">Small caps label above the action buttons.</p>
            </div>
          </CardContent>
        </Card>

        {/* Save button at bottom */}
        <div className="flex justify-end pb-8">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            size="lg"
            data-testid="button-save-order-thanks-bottom"
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
