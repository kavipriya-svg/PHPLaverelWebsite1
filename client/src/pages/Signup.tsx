import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UserPlus, ShoppingBag, Heart, Gift, Truck, Shield, Loader2, Eye, EyeOff, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BrandingSettings {
  logoUrl: string;
  storeName: string;
  showStoreName: boolean;
}

const defaultBranding: BrandingSettings = {
  logoUrl: "",
  storeName: "ShopHub",
  showStoreName: true,
};

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { data: brandingData } = useQuery<{ settings: BrandingSettings }>({
    queryKey: ["/api/settings/branding"],
  });

  const branding = brandingData?.settings ? { ...defaultBranding, ...brandingData.settings } : defaultBranding;

  const signupMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
      const response = await apiRequest("POST", "/api/auth/signup", userData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Account Created!",
          description: "Welcome to " + branding.storeName + "! You are now signed in.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
  ];

  const allRequirementsMet = passwordRequirements.every(req => req.met);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (!allRequirementsMet) {
      toast({
        title: "Password Too Weak",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive",
      });
      return;
    }
    if (!passwordsMatch) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    signupMutation.mutate({ email, password, firstName, lastName });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              {branding.logoUrl ? (
                <div className="h-16 w-16 overflow-hidden rounded-lg">
                  <img 
                    src={branding.logoUrl} 
                    alt={branding.storeName} 
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-2xl">
                  {branding.storeName.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
            <h1 className="text-3xl font-bold" data-testid="text-signup-title">
              Welcome to {branding.storeName}
            </h1>
            <p className="text-muted-foreground mt-2">
              Create an account to unlock exclusive features
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle>Create Account</CardTitle>
              <CardDescription>
                Fill in your details to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={signupMutation.isPending}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={signupMutation.isPending}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={signupMutation.isPending}
                    required
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={signupMutation.isPending}
                      required
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {passwordRequirements.map((req, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center gap-2 text-xs ${req.met ? 'text-green-600' : 'text-muted-foreground'}`}
                        >
                          <Check className={`h-3 w-3 ${req.met ? 'opacity-100' : 'opacity-30'}`} />
                          {req.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={signupMutation.isPending}
                    required
                    data-testid="input-confirm-password"
                  />
                  {confirmPassword.length > 0 && (
                    <div className={`flex items-center gap-2 text-xs ${passwordsMatch ? 'text-green-600' : 'text-destructive'}`}>
                      <Check className={`h-3 w-3 ${passwordsMatch ? 'opacity-100' : 'opacity-30'}`} />
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </div>
                  )}
                </div>
                <Button 
                  type="submit"
                  size="lg" 
                  className="w-full"
                  disabled={signupMutation.isPending || !allRequirementsMet || !passwordsMatch}
                  data-testid="button-signup"
                >
                  {signupMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <span>Already have an account? </span>
                  <Link 
                    href="/login" 
                    className="text-primary hover:underline"
                    data-testid="link-signin"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Easy Shopping</h3>
                  <p className="text-xs text-muted-foreground">Quick checkout</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Wishlist</h3>
                  <p className="text-xs text-muted-foreground">Save favorites</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Gift Registry</h3>
                  <p className="text-xs text-muted-foreground">Share lists</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Order Tracking</h3>
                  <p className="text-xs text-muted-foreground">Real-time updates</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <Shield className="w-4 h-4" />
              <span>Secure encrypted sign-up</span>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="link-back-home">
                Back to Store
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
