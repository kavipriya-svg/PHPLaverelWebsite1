import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Mail,
  MessageSquare,
  Phone,
  Send,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Bell,
  Save,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { SiWhatsapp, SiTwilio } from "react-icons/si";
import {
  defaultCommunicationSettings,
  type CommunicationSettings as CommunicationSettingsType,
} from "@shared/schema";

export default function CommunicationSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CommunicationSettingsType>(defaultCommunicationSettings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmsToken, setShowSmsToken] = useState(false);
  const [showWaToken, setShowWaToken] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testWhatsapp, setTestWhatsapp] = useState("");

  const { data, isLoading } = useQuery<{ settings: CommunicationSettingsType | null; rawSettings: CommunicationSettingsType | null }>({
    queryKey: ["/api/admin/communication-settings"],
  });

  useEffect(() => {
    if (data?.rawSettings) {
      setSettings(data.rawSettings);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: CommunicationSettingsType) => {
      const response = await apiRequest("POST", "/api/admin/communication-settings", newSettings);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/communication-settings"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save settings", description: error.message, variant: "destructive" });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (toEmail: string) => {
      const response = await apiRequest("POST", "/api/admin/communication-settings/test-email", { toEmail });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Test Email Sent", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send test email", description: error.message, variant: "destructive" });
    },
  });

  const testSmsMutation = useMutation({
    mutationFn: async (toPhone: string) => {
      const response = await apiRequest("POST", "/api/admin/communication-settings/test-sms", { toPhone });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Test SMS Sent", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send test SMS", description: error.message, variant: "destructive" });
    },
  });

  const testWhatsappMutation = useMutation({
    mutationFn: async (toPhone: string) => {
      const response = await apiRequest("POST", "/api/admin/communication-settings/test-whatsapp", { toPhone });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Test WhatsApp Sent", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send WhatsApp", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">
              Communication Settings
            </h1>
            <p className="text-muted-foreground">
              Configure Email, SMS, and WhatsApp notifications
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            data-testid="button-save-settings"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>

        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="email" className="flex items-center gap-2" data-testid="tab-email">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2" data-testid="tab-sms">
              <Phone className="h-4 w-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2" data-testid="tab-whatsapp">
              <SiWhatsapp className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          {/* Email Settings Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Configuration
                    </CardTitle>
                    <CardDescription>Configure your email provider and sender details</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email-enabled">Enabled</Label>
                    <Switch
                      id="email-enabled"
                      checked={settings.email.enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, email: { ...settings.email, enabled: checked } })
                      }
                      data-testid="switch-email-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                      value={settings.email.provider}
                      onValueChange={(value: "resend" | "smtp") =>
                        setSettings({ ...settings, email: { ...settings.email, provider: value } })
                      }
                    >
                      <SelectTrigger data-testid="select-email-provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resend">Resend</SelectItem>
                        <SelectItem value="smtp">SMTP (Coming Soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Resend API Key</Label>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={settings.email.resendApiKey || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, email: { ...settings.email, resendApiKey: e.target.value } })
                        }
                        placeholder="re_..."
                        data-testid="input-resend-api-key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>From Email</Label>
                    <Input
                      type="email"
                      value={settings.email.fromEmail || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, email: { ...settings.email, fromEmail: e.target.value } })
                      }
                      placeholder="noreply@yourdomain.com"
                      data-testid="input-from-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>From Name</Label>
                    <Input
                      value={settings.email.fromName || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, email: { ...settings.email, fromName: e.target.value } })
                      }
                      placeholder="19Dogs Store"
                      data-testid="input-from-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reply-To Email</Label>
                    <Input
                      type="email"
                      value={settings.email.replyTo || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, email: { ...settings.email, replyTo: e.target.value } })
                      }
                      placeholder="support@yourdomain.com"
                      data-testid="input-reply-to"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Email Notifications
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { key: "orderConfirmation", label: "Order Confirmation" },
                      { key: "orderStatusUpdate", label: "Order Status Updates" },
                      { key: "shippingUpdate", label: "Shipping Updates" },
                      { key: "lowStockAlert", label: "Low Stock Alerts (Admin)" },
                      { key: "restockNotification", label: "Restock Notifications" },
                      { key: "welcomeEmail", label: "Welcome Email" },
                      { key: "passwordReset", label: "Password Reset" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">{label}</span>
                        <Switch
                          checked={(settings.email as any)[key] ?? true}
                          onCheckedChange={(checked) =>
                            setSettings({ ...settings, email: { ...settings.email, [key]: checked } })
                          }
                          data-testid={`switch-email-${key}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Test Email
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      data-testid="input-test-email"
                    />
                    <Button
                      onClick={() => testEmailMutation.mutate(testEmail)}
                      disabled={!testEmail || testEmailMutation.isPending}
                      data-testid="button-test-email"
                    >
                      {testEmailMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Send Test"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Settings Tab */}
          <TabsContent value="sms" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <SiTwilio className="h-5 w-5" />
                      SMS Configuration (Twilio)
                    </CardTitle>
                    <CardDescription>Configure Twilio for SMS notifications</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sms-enabled">Enabled</Label>
                    <Switch
                      id="sms-enabled"
                      checked={settings.sms.enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, sms: { ...settings.sms, enabled: checked } })
                      }
                      data-testid="switch-sms-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Twilio Account SID</Label>
                    <Input
                      value={settings.sms.twilioAccountSid || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, sms: { ...settings.sms, twilioAccountSid: e.target.value } })
                      }
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      data-testid="input-twilio-sid"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Twilio Auth Token</Label>
                    <div className="relative">
                      <Input
                        type={showSmsToken ? "text" : "password"}
                        value={settings.sms.twilioAuthToken || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, sms: { ...settings.sms, twilioAuthToken: e.target.value } })
                        }
                        placeholder="Your auth token"
                        data-testid="input-twilio-token"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowSmsToken(!showSmsToken)}
                      >
                        {showSmsToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Twilio Phone Number</Label>
                    <Input
                      value={settings.sms.twilioPhoneNumber || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, sms: { ...settings.sms, twilioPhoneNumber: e.target.value } })
                      }
                      placeholder="+1234567890"
                      data-testid="input-twilio-phone"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your Twilio phone number with country code (e.g., +91 for India)
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    SMS Notifications
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { key: "orderConfirmation", label: "Order Confirmation" },
                      { key: "orderStatusUpdate", label: "Order Status Updates" },
                      { key: "shippingUpdate", label: "Shipping Updates" },
                      { key: "deliveryOtp", label: "Delivery OTP" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">{label}</span>
                        <Switch
                          checked={(settings.sms as any)[key] ?? true}
                          onCheckedChange={(checked) =>
                            setSettings({ ...settings, sms: { ...settings.sms, [key]: checked } })
                          }
                          data-testid={`switch-sms-${key}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Test SMS
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+919876543210"
                      data-testid="input-test-phone"
                    />
                    <Button
                      onClick={() => testSmsMutation.mutate(testPhone)}
                      disabled={!testPhone || testSmsMutation.isPending || !settings.sms.enabled}
                      data-testid="button-test-sms"
                    >
                      {testSmsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Send Test"
                      )}
                    </Button>
                  </div>
                  {!settings.sms.enabled && (
                    <p className="text-xs text-muted-foreground">Enable SMS to send test messages</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Settings Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <SiWhatsapp className="h-5 w-5 text-green-500" />
                      WhatsApp Configuration
                    </CardTitle>
                    <CardDescription>Configure WhatsApp Business messaging via Twilio</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="whatsapp-enabled">Enabled</Label>
                    <Switch
                      id="whatsapp-enabled"
                      checked={settings.whatsapp.enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, whatsapp: { ...settings.whatsapp, enabled: checked } })
                      }
                      data-testid="switch-whatsapp-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Switch
                    checked={settings.whatsapp.useSharedTwilioCredentials ?? true}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        whatsapp: { ...settings.whatsapp, useSharedTwilioCredentials: checked },
                      })
                    }
                    data-testid="switch-shared-credentials"
                  />
                  <span className="text-sm">Use same Twilio credentials as SMS</span>
                </div>

                {!settings.whatsapp.useSharedTwilioCredentials && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Twilio Account SID</Label>
                      <Input
                        value={settings.whatsapp.twilioAccountSid || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            whatsapp: { ...settings.whatsapp, twilioAccountSid: e.target.value },
                          })
                        }
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        data-testid="input-wa-twilio-sid"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Twilio Auth Token</Label>
                      <div className="relative">
                        <Input
                          type={showWaToken ? "text" : "password"}
                          value={settings.whatsapp.twilioAuthToken || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              whatsapp: { ...settings.whatsapp, twilioAuthToken: e.target.value },
                            })
                          }
                          placeholder="Your auth token"
                          data-testid="input-wa-twilio-token"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowWaToken(!showWaToken)}
                        >
                          {showWaToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>WhatsApp-Enabled Phone Number</Label>
                  <Input
                    value={settings.whatsapp.twilioWhatsappNumber || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        whatsapp: { ...settings.whatsapp, twilioWhatsappNumber: e.target.value },
                      })
                    }
                    placeholder="+14155238886"
                    data-testid="input-whatsapp-number"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Twilio WhatsApp-enabled number (for sandbox: +14155238886)
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    WhatsApp Notifications
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { key: "orderConfirmation", label: "Order Confirmation" },
                      { key: "orderStatusUpdate", label: "Order Status Updates" },
                      { key: "shippingUpdate", label: "Shipping Updates" },
                      { key: "promotionalMessages", label: "Promotional Messages" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">{label}</span>
                        <Switch
                          checked={(settings.whatsapp as any)[key] ?? true}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              whatsapp: { ...settings.whatsapp, [key]: checked },
                            })
                          }
                          data-testid={`switch-whatsapp-${key}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Test WhatsApp
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      value={testWhatsapp}
                      onChange={(e) => setTestWhatsapp(e.target.value)}
                      placeholder="+919876543210"
                      data-testid="input-test-whatsapp"
                    />
                    <Button
                      onClick={() => testWhatsappMutation.mutate(testWhatsapp)}
                      disabled={!testWhatsapp || testWhatsappMutation.isPending || !settings.whatsapp.enabled}
                      data-testid="button-test-whatsapp"
                    >
                      {testWhatsappMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Send Test"
                      )}
                    </Button>
                  </div>
                  {!settings.whatsapp.enabled && (
                    <p className="text-xs text-muted-foreground">Enable WhatsApp to send test messages</p>
                  )}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> For Twilio WhatsApp Sandbox, recipients must first send "join &lt;your-sandbox-keyword&gt;" to your WhatsApp number to opt in.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
