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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Mail,
  MessageSquare,
  Phone,
  Send,
  CheckCircle2,
  Settings,
  Bell,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Key,
  Shield,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import {
  defaultCommunicationSettings,
  type CommunicationSettings as CommunicationSettingsType,
} from "@shared/schema";

export default function CommunicationSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CommunicationSettingsType>(defaultCommunicationSettings);
  const [showAuthKey, setShowAuthKey] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testWhatsapp, setTestWhatsapp] = useState("");
  const [testOtpPhone, setTestOtpPhone] = useState("");

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

  const testOtpMutation = useMutation({
    mutationFn: async (toPhone: string) => {
      const response = await apiRequest("POST", "/api/admin/communication-settings/test-otp", { toPhone });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Test OTP Sent", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 4) + "****" + key.substring(key.length - 4);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Communication Settings</h1>
            <p className="text-muted-foreground">
              Configure MSG91 for Email, SMS, WhatsApp, and OTP services
            </p>
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-settings">
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              MSG91 API Configuration
            </CardTitle>
            <CardDescription>
              Enter your MSG91 AuthKey and Sender ID. Get your AuthKey from{" "}
              <a href="https://control.msg91.com/user/api-key" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                MSG91 Dashboard
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="authKey">AuthKey *</Label>
                <div className="relative">
                  <Input
                    id="authKey"
                    type={showAuthKey ? "text" : "password"}
                    value={settings.msg91?.authKey || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        msg91: { ...settings.msg91, authKey: e.target.value },
                      })
                    }
                    placeholder="Enter your MSG91 AuthKey"
                    data-testid="input-authkey"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowAuthKey(!showAuthKey)}
                  >
                    {showAuthKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your API authentication key from MSG91
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderId">Sender ID</Label>
                <Input
                  id="senderId"
                  value={settings.msg91?.senderId || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      msg91: { ...settings.msg91, senderId: e.target.value },
                    })
                  }
                  placeholder="e.g., 19DOGS"
                  maxLength={6}
                  data-testid="input-sender-id"
                />
                <p className="text-xs text-muted-foreground">
                  6-character Sender ID for SMS (DLT registered)
                </p>
              </div>
            </div>
            {settings.msg91?.authKey && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  MSG91 AuthKey configured: {maskApiKey(settings.msg91.authKey)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="email" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="email" className="flex items-center gap-2" data-testid="tab-email">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2" data-testid="tab-sms">
              <MessageSquare className="h-4 w-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2" data-testid="tab-whatsapp">
              <SiWhatsapp className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="otp" className="flex items-center gap-2" data-testid="tab-otp">
              <Shield className="h-4 w-4" />
              OTP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Settings
                    </CardTitle>
                    <CardDescription>Configure MSG91 email service</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email-enabled">Enabled</Label>
                    <Switch
                      id="email-enabled"
                      checked={settings.email?.enabled || false}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, enabled: checked },
                        })
                      }
                      data-testid="switch-email-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-template">Template ID</Label>
                    <Input
                      id="email-template"
                      value={settings.email?.templateId || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, templateId: e.target.value },
                        })
                      }
                      placeholder="MSG91 Email Template ID"
                      data-testid="input-email-template"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-domain">Domain</Label>
                    <Input
                      id="email-domain"
                      value={settings.email?.domain || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, domain: e.target.value },
                        })
                      }
                      placeholder="your-verified-domain.com"
                      data-testid="input-email-domain"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-email">From Email</Label>
                    <Input
                      id="from-email"
                      type="email"
                      value={settings.email?.fromEmail || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, fromEmail: e.target.value },
                        })
                      }
                      placeholder="noreply@yourdomain.com"
                      data-testid="input-from-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-name">From Name</Label>
                    <Input
                      id="from-name"
                      value={settings.email?.fromName || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, fromName: e.target.value },
                        })
                      }
                      placeholder="19Dogs Store"
                      data-testid="input-from-name"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Email Notifications
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { key: "orderConfirmation", label: "Order Confirmation" },
                      { key: "orderStatusUpdate", label: "Order Status Updates" },
                      { key: "shippingUpdate", label: "Shipping Updates" },
                      { key: "lowStockAlert", label: "Low Stock Alerts" },
                      { key: "restockNotification", label: "Restock Notifications" },
                      { key: "welcomeEmail", label: "Welcome Email" },
                      { key: "passwordReset", label: "Password Reset" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between p-2 border rounded-lg">
                        <Label htmlFor={`email-${key}`} className="text-sm">{label}</Label>
                        <Switch
                          id={`email-${key}`}
                          checked={(settings.email as any)?.[key] ?? true}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, [key]: checked },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Test Email</Label>
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
                      disabled={!testEmail || testEmailMutation.isPending || !settings.email?.enabled}
                      data-testid="button-test-email"
                    >
                      {testEmailMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sms">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      SMS Settings
                    </CardTitle>
                    <CardDescription>Configure MSG91 SMS service (DLT compliant for India)</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sms-enabled">Enabled</Label>
                    <Switch
                      id="sms-enabled"
                      checked={settings.sms?.enabled || false}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          sms: { ...settings.sms, enabled: checked },
                        })
                      }
                      data-testid="switch-sms-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sms-template">SMS Template ID *</Label>
                  <Input
                    id="sms-template"
                    value={settings.sms?.templateId || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sms: { ...settings.sms, templateId: e.target.value },
                      })
                    }
                    placeholder="DLT registered template ID from MSG91"
                    data-testid="input-sms-template"
                  />
                  <p className="text-xs text-muted-foreground">
                    Create templates in MSG91 dashboard. Templates must be DLT registered for India.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> For Indian SMS, templates must be registered with DLT (Distributed Ledger Technology). Create templates in MSG91 dashboard first.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    SMS Notifications
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: "orderConfirmation", label: "Order Confirmation" },
                      { key: "orderStatusUpdate", label: "Order Status Updates" },
                      { key: "shippingUpdate", label: "Shipping Updates" },
                      { key: "deliveryOtp", label: "Delivery OTP" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between p-2 border rounded-lg">
                        <Label htmlFor={`sms-${key}`} className="text-sm">{label}</Label>
                        <Switch
                          id={`sms-${key}`}
                          checked={(settings.sms as any)?.[key] ?? true}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              sms: { ...settings.sms, [key]: checked },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Test SMS</Label>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="919876543210 (with country code)"
                      data-testid="input-test-sms"
                    />
                    <Button
                      onClick={() => testSmsMutation.mutate(testPhone)}
                      disabled={!testPhone || testSmsMutation.isPending || !settings.sms?.enabled}
                      data-testid="button-test-sms"
                    >
                      {testSmsMutation.isPending ? (
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

          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <SiWhatsapp className="h-5 w-5 text-green-500" />
                      WhatsApp Settings
                    </CardTitle>
                    <CardDescription>Configure MSG91 WhatsApp Business API</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="whatsapp-enabled">Enabled</Label>
                    <Switch
                      id="whatsapp-enabled"
                      checked={settings.whatsapp?.enabled || false}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          whatsapp: { ...settings.whatsapp, enabled: checked },
                        })
                      }
                      data-testid="switch-whatsapp-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wa-number">WhatsApp Business Number</Label>
                    <Input
                      id="wa-number"
                      value={settings.whatsapp?.integratedNumber || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          whatsapp: { ...settings.whatsapp, integratedNumber: e.target.value },
                        })
                      }
                      placeholder="919876543210"
                      data-testid="input-whatsapp-number"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your MSG91 integrated WhatsApp number
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wa-template">Template Name</Label>
                    <Input
                      id="wa-template"
                      value={settings.whatsapp?.templateName || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          whatsapp: { ...settings.whatsapp, templateName: e.target.value },
                        })
                      }
                      placeholder="order_confirmation"
                      data-testid="input-whatsapp-template"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    WhatsApp Notifications
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: "orderConfirmation", label: "Order Confirmation" },
                      { key: "orderStatusUpdate", label: "Order Status Updates" },
                      { key: "shippingUpdate", label: "Shipping Updates" },
                      { key: "promotionalMessages", label: "Promotional Messages" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between p-2 border rounded-lg">
                        <Label htmlFor={`wa-${key}`} className="text-sm">{label}</Label>
                        <Switch
                          id={`wa-${key}`}
                          checked={(settings.whatsapp as any)?.[key] ?? true}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              whatsapp: { ...settings.whatsapp, [key]: checked },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Test WhatsApp</Label>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      value={testWhatsapp}
                      onChange={(e) => setTestWhatsapp(e.target.value)}
                      placeholder="919876543210 (with country code)"
                      data-testid="input-test-whatsapp"
                    />
                    <Button
                      onClick={() => testWhatsappMutation.mutate(testWhatsapp)}
                      disabled={!testWhatsapp || testWhatsappMutation.isPending || !settings.whatsapp?.enabled}
                      data-testid="button-test-whatsapp"
                    >
                      {testWhatsappMutation.isPending ? (
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

          <TabsContent value="otp">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-500" />
                      OTP Settings
                    </CardTitle>
                    <CardDescription>Configure MSG91 OTP verification service</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="otp-enabled">Enabled</Label>
                    <Switch
                      id="otp-enabled"
                      checked={settings.otp?.enabled || false}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          otp: { ...settings.otp, enabled: checked },
                        })
                      }
                      data-testid="switch-otp-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-template">OTP Template ID</Label>
                    <Input
                      id="otp-template"
                      value={settings.otp?.templateId || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          otp: { ...settings.otp, templateId: e.target.value },
                        })
                      }
                      placeholder="MSG91 OTP Template ID"
                      data-testid="input-otp-template"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp-length">OTP Length</Label>
                    <Input
                      id="otp-length"
                      type="number"
                      min={4}
                      max={8}
                      value={settings.otp?.otpLength || 6}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          otp: { ...settings.otp, otpLength: parseInt(e.target.value) || 6 },
                        })
                      }
                      data-testid="input-otp-length"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp-expiry">OTP Expiry (minutes)</Label>
                    <Input
                      id="otp-expiry"
                      type="number"
                      min={1}
                      max={30}
                      value={settings.otp?.otpExpiry || 5}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          otp: { ...settings.otp, otpExpiry: parseInt(e.target.value) || 5 },
                        })
                      }
                      data-testid="input-otp-expiry"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label htmlFor="otp-email-fallback">Email Fallback</Label>
                    <p className="text-xs text-muted-foreground">Send OTP via email if SMS fails</p>
                  </div>
                  <Switch
                    id="otp-email-fallback"
                    checked={settings.otp?.emailFallback ?? true}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        otp: { ...settings.otp, emailFallback: checked },
                      })
                    }
                    data-testid="switch-otp-email-fallback"
                  />
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Use Cases:</strong> Phone verification, order delivery confirmation, account security, two-factor authentication
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Test OTP</Label>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      value={testOtpPhone}
                      onChange={(e) => setTestOtpPhone(e.target.value)}
                      placeholder="919876543210 (with country code)"
                      data-testid="input-test-otp"
                    />
                    <Button
                      onClick={() => testOtpMutation.mutate(testOtpPhone)}
                      disabled={!testOtpPhone || testOtpMutation.isPending || !settings.otp?.enabled}
                      data-testid="button-test-otp"
                    >
                      {testOtpMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Send Test OTP"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
