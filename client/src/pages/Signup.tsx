import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LogIn, ShoppingBag, Heart, Gift, Truck, Shield } from "lucide-react";

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
  const { data: brandingData } = useQuery<{ settings: BrandingSettings }>({
    queryKey: ["/api/settings/branding"],
  });

  const branding = brandingData?.settings ? { ...defaultBranding, ...brandingData.settings } : defaultBranding;

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
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>
                Use your Replit account to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                asChild 
                size="lg" 
                className="w-full"
                data-testid="button-signup-replit"
              >
                <a href="/api/login" className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Continue with Replit
                </a>
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
              <span>Secure sign-up with Replit Auth</span>
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
