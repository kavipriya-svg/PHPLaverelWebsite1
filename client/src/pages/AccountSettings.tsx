import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Bell, Shield, CreditCard, LogOut, Truck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AccountSettings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [deliverySchedule, setDeliverySchedule] = useState(user?.subscriptionDeliverySchedule || "weekly");

  // Update local state when user data loads
  useEffect(() => {
    if (user?.subscriptionDeliverySchedule) {
      setDeliverySchedule(user.subscriptionDeliverySchedule);
    }
  }, [user?.subscriptionDeliverySchedule]);

  const deliveryScheduleMutation = useMutation({
    mutationFn: async (schedule: string) => {
      const response = await apiRequest("PATCH", "/api/account/delivery-schedule", { schedule });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Delivery schedule updated",
        description: "Your preferred delivery schedule has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update",
        description: "Could not update your delivery schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeliveryScheduleChange = (value: string) => {
    setDeliverySchedule(value);
    deliveryScheduleMutation.mutate(value);
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/login");
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/account">
          <Button variant="ghost" className="mb-6" data-testid="button-back-account">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Account
          </Button>
        </Link>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <CardDescription>Manage your notification preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Order Updates</Label>
                  <p className="text-sm text-muted-foreground">Get notified about your order status</p>
                </div>
                <Switch defaultChecked data-testid="switch-order-updates" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Promotional Emails</Label>
                  <p className="text-sm text-muted-foreground">Receive offers and discount codes</p>
                </div>
                <Switch data-testid="switch-promotional-emails" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Restock Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when wishlist items are back in stock</p>
                </div>
                <Switch defaultChecked data-testid="switch-restock-alerts" />
              </div>
            </CardContent>
          </Card>

          {user?.customerType === "subscription" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">Delivery Preferences</CardTitle>
                    <CardDescription>Manage your subscription delivery settings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-0.5">
                    <Label>Delivery Schedule</Label>
                    <p className="text-sm text-muted-foreground">
                      How often would you like to receive your subscription deliveries?
                    </p>
                  </div>
                  <Select
                    value={deliverySchedule}
                    onValueChange={handleDeliveryScheduleChange}
                    disabled={deliveryScheduleMutation.isPending}
                  >
                    <SelectTrigger className="w-40" data-testid="select-delivery-schedule">
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {user.subscriptionStartDate && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Subscription active since: {new Date(user.subscriptionStartDate).toLocaleDateString()}
                        {user.subscriptionEndDate && (
                          <> until {new Date(user.subscriptionEndDate).toLocaleDateString()}</>
                        )}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Privacy & Security</CardTitle>
                  <CardDescription>Manage your account security settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm" disabled data-testid="button-setup-2fa">
                  Coming Soon
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Login Activity</Label>
                  <p className="text-sm text-muted-foreground">View your recent login history</p>
                </div>
                <Button variant="outline" size="sm" disabled data-testid="button-view-activity">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Payment Methods</CardTitle>
                  <CardDescription>Manage your saved payment options</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <CreditCard className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4" data-testid="text-no-payment-methods">
                  No payment methods saved. Add a payment method during checkout for faster purchases.
                </p>
                <Button variant="outline" disabled data-testid="button-add-payment">
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-0.5">
                  <Label>Sign Out</Label>
                  <p className="text-sm text-muted-foreground">Sign out from all devices</p>
                </div>
                <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-0.5">
                  <Label>Delete Account</Label>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
                </div>
                <Button variant="destructive" disabled data-testid="button-delete-account">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
