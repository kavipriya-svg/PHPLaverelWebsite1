import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, FileText, Building2, Receipt, Eye, Palette, Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { invoiceSettingsSchema, defaultInvoiceSettings, type InvoiceSettings } from "@shared/schema";

export default function InvoiceSettingsPage() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<{ settings: InvoiceSettings }>({
    queryKey: ["/api/settings/invoice"],
  });

  const form = useForm<InvoiceSettings>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: defaultInvoiceSettings,
  });

  useEffect(() => {
    if (data?.settings) {
      form.reset(data.settings);
    }
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: InvoiceSettings) => {
      const response = await apiRequest("PUT", "/api/settings/invoice", values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/invoice"] });
      toast({ title: "Invoice settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save invoice settings", variant: "destructive" });
    },
  });

  const onSubmit = (values: InvoiceSettings) => {
    saveMutation.mutate(values);
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Get presigned URL for upload
      const presignedResponse = await apiRequest("POST", "/api/upload/presigned-url", {
        filename: file.name,
        contentType: file.type,
        folder: "invoice-logos",
      });
      
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
      const finalUrl = finalizedResult.objectPath || `/objects/${objectPath}`;
      
      // Update the form with the new logo URL
      form.setValue("logoUrl", finalUrl);
      toast({ title: "Logo uploaded successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ 
        title: "Upload failed", 
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    form.setValue("logoUrl", "");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">Invoice Template</h1>
              <p className="text-muted-foreground">Customize your invoice template settings</p>
            </div>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="h-48 bg-muted rounded-lg"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">Invoice Template</h1>
              <p className="text-muted-foreground">Customize your invoice template settings</p>
            </div>
            <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-invoice-settings">
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Seller Details
                </CardTitle>
                <CardDescription>Your business information that appears on invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="sellerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your Store Name" data-testid="input-seller-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123 Business Street" data-testid="input-seller-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sellerCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Mumbai" data-testid="input-seller-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sellerState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Maharashtra" data-testid="input-seller-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sellerPostalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="400001" data-testid="input-seller-postal" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sellerCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="India" data-testid="input-seller-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sellerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+91 98765 43210" data-testid="input-seller-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sellerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="billing@store.com" data-testid="input-seller-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  GST Settings
                </CardTitle>
                <CardDescription>Tax configuration for your invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number (GSTIN)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="22AAAAA0000A1Z5" data-testid="input-gst-number" />
                      </FormControl>
                      <FormDescription>Your 15-digit GST identification number</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gstPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Percentage (%)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-gst-percentage" 
                        />
                      </FormControl>
                      <FormDescription>Default GST rate applied to invoices (e.g., 18 for 18%)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Buyer Labels
                </CardTitle>
                <CardDescription>Customize labels for customer information section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="buyerLabelName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name Label</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Customer Name" data-testid="input-buyer-label-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="buyerLabelAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Label</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Address" data-testid="input-buyer-label-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="buyerLabelPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Label</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Phone" data-testid="input-buyer-label-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="buyerLabelEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Label</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Email" data-testid="input-buyer-label-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Display Options
                </CardTitle>
                <CardDescription>Control what information appears on invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="showDiscountLine"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Show Discount Line</FormLabel>
                        <FormDescription>Display discount amount on invoice</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-discount" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="showTaxBreakdown"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Show Tax Breakdown</FormLabel>
                        <FormDescription>Display GST details separately</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-tax" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="showShippingCost"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Show Shipping Cost</FormLabel>
                        <FormDescription>Display shipping charges on invoice</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-shipping" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="showPaymentMethod"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Show Payment Method</FormLabel>
                        <FormDescription>Display payment type (COD, Online, etc.)</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-payment" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="showSKU"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Show Product SKU</FormLabel>
                        <FormDescription>Display SKU codes for products</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-sku" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Branding & Footer
                </CardTitle>
                <CardDescription>Customize the branding and footer of your invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Logo</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {field.value ? (
                            <div className="relative inline-block">
                              <img 
                                src={field.value} 
                                alt="Business logo" 
                                className="h-20 max-w-[200px] object-contain border rounded-md p-2"
                                data-testid="img-logo-preview"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 p-1"
                                onClick={handleRemoveLogo}
                                data-testid="button-remove-logo"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover-elevate"
                              onClick={() => logoInputRef.current?.click()}
                              data-testid="dropzone-logo"
                            >
                              <Image className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">Click to upload your business logo</p>
                              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or WebP (max 2MB)</p>
                            </div>
                          )}
                          <input
                            type="file"
                            ref={logoInputRef}
                            className="hidden"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  toast({ title: "Logo must be less than 2MB", variant: "destructive" });
                                  return;
                                }
                                handleLogoUpload(file);
                              }
                            }}
                            data-testid="input-logo-file"
                          />
                          {!field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => logoInputRef.current?.click()}
                              disabled={isUploading}
                              data-testid="button-upload-logo"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploading ? "Uploading..." : "Upload Logo"}
                            </Button>
                          )}
                          {field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => logoInputRef.current?.click()}
                              disabled={isUploading}
                              size="sm"
                              data-testid="button-change-logo"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploading ? "Uploading..." : "Change Logo"}
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>Your business logo will appear on invoice headers</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="footerNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer Note</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Thank you for your business!" 
                          rows={2}
                          data-testid="input-footer-note" 
                        />
                      </FormControl>
                      <FormDescription>A thank you message or note at the bottom of the invoice</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="termsAndConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terms & Conditions</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="1. All sales are final. 2. Returns within 7 days. 3. ..." 
                          rows={4}
                          data-testid="input-terms" 
                        />
                      </FormControl>
                      <FormDescription>Terms and conditions to display on the invoice (optional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </AdminLayout>
  );
}
