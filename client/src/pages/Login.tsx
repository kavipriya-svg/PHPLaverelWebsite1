import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LogIn, ShoppingBag, Heart, Package, Shield, Loader2, Eye, EyeOff, Users, Briefcase, Store } from "lucide-react";
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

interface UnifiedLoginResponse {
  success: boolean;
  userType: "admin" | "customer" | "provider";
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
  provider?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { data: brandingData } = useQuery<{ settings: BrandingSettings }>({
    queryKey: ["/api/settings/branding"],
  });

  const branding = brandingData?.settings ? { ...defaultBranding, ...brandingData.settings } : defaultBranding;

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/unified-login", credentials);
      return response.json() as Promise<UnifiedLoginResponse>;
    },
    onSuccess: (data) => {
      if (data.success) {
        // Redirect based on user type
        switch (data.userType) {
          case "admin":
            toast({
              title: "Welcome back, Admin!",
              description: "Redirecting to admin dashboard...",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            setLocation("/admin");
            break;
          case "provider":
            toast({
              title: `Welcome back, ${data.provider?.name || "Provider"}!`,
              description: "Redirecting to your provider portal...",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/provider/me"] });
            setLocation("/provider/dashboard");
            break;
          case "customer":
          default:
            toast({
              title: "Welcome back!",
              description: "You have successfully signed in.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            setLocation("/");
            break;
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ email, password });
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
            <h1 className="text-3xl font-bold" data-testid="text-login-title">
              Welcome Back
            </h1>
            <p className="text-muted-foreground mt-2">
              Sign in to your {branding.storeName} account
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Customers, providers, and admins can all sign in here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loginMutation.isPending}
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loginMutation.isPending}
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
                </div>
                <Button 
                  type="submit"
                  size="lg" 
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                    data-testid="link-forgot-password"
                  >
                    Forgot your password?
                  </Link>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <span>Don't have an account? </span>
                  <Link 
                    href="/signup" 
                    className="text-primary hover:underline"
                    data-testid="link-signup"
                  >
                    Create one
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="p-4" data-testid="card-feature-customers">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Customers</h3>
                  <p className="text-xs text-muted-foreground">Shop & track</p>
                </div>
              </div>
            </Card>
            <Card className="p-4" data-testid="card-feature-providers">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Providers</h3>
                  <p className="text-xs text-muted-foreground">Manage services</p>
                </div>
              </div>
            </Card>
            <Card className="p-4" data-testid="card-feature-admins">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Admins</h3>
                  <p className="text-xs text-muted-foreground">Full control</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <Shield className="w-4 h-4" />
              <span>Secure encrypted sign-in</span>
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
