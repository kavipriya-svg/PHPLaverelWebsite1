import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Save, Store, Truck, CreditCard, Mail, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { Setting } from "@shared/schema";

// Currency options with symbols
const CURRENCY_OPTIONS = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
];

export default function AdminSettings() {
  const { toast } = useToast();
  
  const { data, isLoading } = useQuery<{ settings: Setting[] }>({
    queryKey: ["/api/admin/settings"],
  });

  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data?.settings) {
      const obj: Record<string, string> = {};
      data.settings.forEach((s) => {
        obj[s.key] = s.value || "";
      });
      setSettings(obj);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: Record<string, string>) => {
      await apiRequest("POST", "/api/admin/settings", { settings: newSettings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Configure your store settings</p>
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-settings">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Store Information
                </CardTitle>
                <CardDescription>Basic information about your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Store Name</Label>
                    <Input
                      value={settings.store_name || ""}
                      onChange={(e) => updateSetting("store_name", e.target.value)}
                      placeholder="My Store"
                      data-testid="input-store-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Store Email</Label>
                    <Input
                      type="email"
                      value={settings.store_email || ""}
                      onChange={(e) => updateSetting("store_email", e.target.value)}
                      placeholder="contact@store.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Store Description</Label>
                  <Textarea
                    value={settings.store_description || ""}
                    onChange={(e) => updateSetting("store_description", e.target.value)}
                    placeholder="A brief description of your store"
                    rows={3}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={settings.store_phone || ""}
                      onChange={(e) => updateSetting("store_phone", e.target.value)}
                      placeholder="1-800-STORE"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={settings.currency || "INR"}
                      onValueChange={(value) => updateSetting("currency", value)}
                    >
                      <SelectTrigger data-testid="select-currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.name} ({curr.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={settings.store_address || ""}
                    onChange={(e) => updateSetting("store_address", e.target.value)}
                    placeholder="123 Commerce Street, City, State ZIP"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Settings
                </CardTitle>
                <CardDescription>Configure shipping options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Free Shipping Threshold</Label>
                    <Input
                      type="number"
                      value={settings.free_shipping_threshold || "50"}
                      onChange={(e) => updateSetting("free_shipping_threshold", e.target.value)}
                      placeholder="50.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Standard Shipping Rate</Label>
                    <Input
                      type="number"
                      value={settings.shipping_rate || "9.99"}
                      onChange={(e) => updateSetting("shipping_rate", e.target.value)}
                      placeholder="9.99"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Enable Free Shipping</Label>
                    <p className="text-sm text-muted-foreground">
                      Offer free shipping on orders above threshold
                    </p>
                  </div>
                  <Switch
                    checked={settings.enable_free_shipping === "true"}
                    onCheckedChange={(checked) =>
                      updateSetting("enable_free_shipping", checked ? "true" : "false")
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Subscription Delivery Settings
                </CardTitle>
                <CardDescription>
                  Configure weight-based delivery fees for subscription customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/settings/delivery">
                  <Button variant="outline" className="w-full justify-between" data-testid="button-delivery-settings">
                    Manage Delivery Tiers
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Settings
                </CardTitle>
                <CardDescription>Configure payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Stripe Payments</Label>
                    <p className="text-sm text-muted-foreground">
                      Accept credit card payments via Stripe
                    </p>
                  </div>
                  <Switch
                    checked={settings.enable_stripe === "true"}
                    onCheckedChange={(checked) =>
                      updateSetting("enable_stripe", checked ? "true" : "false")
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Cash on Delivery</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow customers to pay on delivery
                    </p>
                  </div>
                  <Switch
                    checked={settings.enable_cod !== "false"}
                    onCheckedChange={(checked) =>
                      updateSetting("enable_cod", checked ? "true" : "false")
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={settings.tax_rate || "0"}
                    onChange={(e) => updateSetting("tax_rate", e.target.value)}
                    placeholder="8.25"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Razorpay Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Razorpay Payment Gateway
                </CardTitle>
                <CardDescription>
                  Configure Razorpay for UPI, cards, net banking, and wallet payments (Popular in India)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Enable Razorpay</Label>
                    <p className="text-sm text-muted-foreground">
                      Accept payments via Razorpay (UPI, Cards, Net Banking, Wallets)
                    </p>
                  </div>
                  <Switch
                    checked={settings.enable_razorpay === "true"}
                    onCheckedChange={(checked) =>
                      updateSetting("enable_razorpay", checked ? "true" : "false")
                    }
                    data-testid="switch-enable-razorpay"
                  />
                </div>
                
                {settings.enable_razorpay === "true" && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Label>Razorpay Key ID</Label>
                      <Input
                        value={settings.razorpay_key_id || ""}
                        onChange={(e) => updateSetting("razorpay_key_id", e.target.value)}
                        placeholder="rzp_test_xxxxxxxxxxxx"
                        data-testid="input-razorpay-key-id"
                      />
                      <p className="text-xs text-muted-foreground">
                        Get your Key ID from Razorpay Dashboard → Settings → API Keys
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Razorpay Key Secret</Label>
                      <Input
                        type="password"
                        value={settings.razorpay_key_secret || ""}
                        onChange={(e) => updateSetting("razorpay_key_secret", e.target.value)}
                        placeholder="••••••••••••••••"
                        data-testid="input-razorpay-key-secret"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your secret key (never share this publicly)
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
                      <div>
                        <Label>Test Mode</Label>
                        <p className="text-xs text-muted-foreground">
                          Use test keys for sandbox environment
                        </p>
                      </div>
                      <Switch
                        checked={settings.razorpay_test_mode !== "false"}
                        onCheckedChange={(checked) =>
                          updateSetting("razorpay_test_mode", checked ? "true" : "false")
                        }
                        data-testid="switch-razorpay-test-mode"
                      />
                    </div>

                    <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20 text-sm">
                      <p className="font-medium text-blue-800 dark:text-blue-200">Setup Instructions:</p>
                      <ol className="list-decimal list-inside mt-2 space-y-1 text-blue-700 dark:text-blue-300">
                        <li>Sign up at <a href="https://dashboard.razorpay.com/signup" target="_blank" rel="noopener noreferrer" className="underline">dashboard.razorpay.com</a></li>
                        <li>Go to Settings → API Keys</li>
                        <li>Generate new key pair (use Test keys for testing)</li>
                        <li>Copy Key ID and Key Secret above</li>
                        <li>Enable Razorpay toggle and save settings</li>
                      </ol>
                    </div>

                    <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/20 text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-200">Supported Payment Methods:</p>
                      <ul className="mt-2 grid grid-cols-2 gap-1 text-amber-700 dark:text-amber-300">
                        <li>• UPI (GPay, PhonePe, etc.)</li>
                        <li>• Credit/Debit Cards</li>
                        <li>• Net Banking</li>
                        <li>• Digital Wallets</li>
                        <li>• EMI Options</li>
                        <li>• PayLater</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Settings
                </CardTitle>
                <CardDescription>Configure email notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Order Confirmation Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email when order is placed
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_order_confirmation !== "false"}
                    onCheckedChange={(checked) =>
                      updateSetting("email_order_confirmation", checked ? "true" : "false")
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Shipping Notification</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email when order ships
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_shipping !== "false"}
                    onCheckedChange={(checked) =>
                      updateSetting("email_shipping", checked ? "true" : "false")
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Admin Notification Email</Label>
                  <Input
                    type="email"
                    value={settings.admin_email || ""}
                    onChange={(e) => updateSetting("admin_email", e.target.value)}
                    placeholder="admin@store.com"
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
