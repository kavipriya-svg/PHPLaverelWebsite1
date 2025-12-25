import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ProviderLayout } from "./ProviderDashboard";
import type { SwimGroomProvider } from "@shared/schema";

export default function ProviderProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data, isLoading, error } = useQuery<{ provider: SwimGroomProvider }>({
    queryKey: ["/api/provider/me"],
  });

  const provider = data?.provider;

  useEffect(() => {
    if (provider) {
      setName(provider.name);
      setPhone(provider.phone || "");
      setDescription(provider.description || "");
      setAddress(provider.address || "");
      setLogoUrl(provider.logoUrl || "");
      setBannerUrl(provider.bannerUrl || "");
    }
  }, [provider]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", "/api/provider/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/me"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to update profile", variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/provider/change-password", data);
    },
    onSuccess: () => {
      toast({ title: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to change password", variant: "destructive" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/provider/logout"),
    onSuccess: () => {
      queryClient.clear();
      setLocation("/provider/login");
    },
  });

  const handleUpdateProfile = () => {
    updateMutation.mutate({
      name: name.trim(),
      phone: phone.trim() || null,
      description: description.trim() || null,
      address: address.trim() || null,
      logoUrl: logoUrl.trim() || null,
      bannerUrl: bannerUrl.trim() || null,
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      toast({ title: "Please fill in all password fields", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    passwordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">Please log in to view profile.</p>
            <Button onClick={() => setLocation("/provider/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <ProviderLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout provider={provider} onLogout={() => logoutMutation.mutate()}>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your business profile</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Update your public profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-profile-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                data-testid="input-profile-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers about your business..."
                rows={4}
                data-testid="input-profile-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full business address..."
                rows={2}
                data-testid="input-profile-address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  data-testid="input-profile-logo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bannerUrl">Banner URL</Label>
                <Input
                  id="bannerUrl"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://..."
                  data-testid="input-profile-banner"
                />
              </div>
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={updateMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                data-testid="input-current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-password"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={passwordMutation.isPending}
              data-testid="button-change-password"
            >
              {passwordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Change Password
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Details managed by admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{provider?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commission</span>
              <span className="font-medium">
                {provider?.commissionType === "percentage"
                  ? `${provider.commissionValue}%`
                  : `₹${provider?.commissionValue}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verification Status</span>
              <span className={`font-medium ${provider?.isVerified ? "text-green-600" : "text-yellow-600"}`}>
                {provider?.isVerified ? "Verified" : "Pending Verification"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rating</span>
              <span className="font-medium">{provider?.rating || "0.0"} ({provider?.reviewCount || 0} reviews)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProviderLayout>
  );
}
