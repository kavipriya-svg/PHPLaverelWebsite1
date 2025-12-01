import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, Send, AlertTriangle, CheckCircle2, Settings, Package } from "lucide-react";

export default function EmailSettings() {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("");
  const [stockThreshold, setStockThreshold] = useState("10");

  const { data: emailStatus } = useQuery<{ configured: boolean; provider: string }>({
    queryKey: ["/api/admin/email/status"],
  });

  const sendTestMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/admin/email/test", { email });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Email Sent",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkStockMutation = useMutation({
    mutationFn: async ({ threshold }: { threshold: number }) => {
      const response = await apiRequest("POST", "/api/admin/inventory/check-low-stock", { threshold });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.message,
        description: data.emailSent
          ? "Low stock alert email has been sent."
          : data.lowStockProducts?.length > 0
            ? "Email not sent (email service not configured)"
            : undefined,
        variant: data.lowStockProducts?.length > 0 ? "default" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Check Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Email Settings</h1>
        <p className="text-muted-foreground">Configure email notifications and alerts</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Service Status
            </CardTitle>
            <CardDescription>Current email service configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Provider</span>
              <Badge variant="secondary">{emailStatus?.provider || "Resend"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              {emailStatus?.configured ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>
            
            {!emailStatus?.configured && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  To enable email notifications, add the <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">RESEND_API_KEY</code> environment variable.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Test Email
            </CardTitle>
            <CardDescription>Send a test order confirmation email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Recipient Email</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                data-testid="input-test-email"
              />
            </div>
            <Button
              onClick={() => sendTestMutation.mutate(testEmail)}
              disabled={!emailStatus?.configured || sendTestMutation.isPending}
              className="w-full"
              data-testid="button-send-test"
            >
              {sendTestMutation.isPending ? "Sending..." : "Send Test Email"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Check inventory and send low stock alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock-threshold">Stock Threshold</Label>
              <Input
                id="stock-threshold"
                type="number"
                min="1"
                placeholder="10"
                value={stockThreshold}
                onChange={(e) => setStockThreshold(e.target.value)}
                data-testid="input-stock-threshold"
              />
              <p className="text-xs text-muted-foreground">
                Products with stock at or below this number will be flagged
              </p>
            </div>
            <Button
              onClick={() => checkStockMutation.mutate({ threshold: parseInt(stockThreshold) || 10 })}
              disabled={checkStockMutation.isPending}
              variant="outline"
              className="w-full"
              data-testid="button-check-stock"
            >
              {checkStockMutation.isPending ? "Checking..." : "Check Low Stock"}
            </Button>
            
            {checkStockMutation.data?.lowStockProducts?.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  Low Stock Products:
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {checkStockMutation.data.lowStockProducts.map((p: any) => (
                    <li key={p.id}>
                      {p.title} ({p.sku}) - <strong>{p.currentStock}</strong> in stock
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Email Templates
            </CardTitle>
            <CardDescription>Automatic email notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Order Confirmation</p>
                  <p className="text-xs text-muted-foreground">Sent when order is placed</p>
                </div>
                <Badge variant="secondary">Automatic</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Status Updates</p>
                  <p className="text-xs text-muted-foreground">Sent when order status changes</p>
                </div>
                <Badge variant="secondary">Automatic</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Shipping Notification</p>
                  <p className="text-xs text-muted-foreground">Sent with tracking info</p>
                </div>
                <Badge variant="secondary">Automatic</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Low Stock Alert</p>
                  <p className="text-xs text-muted-foreground">Sent to admin on low inventory</p>
                </div>
                <Badge variant="outline">Manual Trigger</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
