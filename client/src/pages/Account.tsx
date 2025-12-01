import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { User, Package, Heart, MapPin, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Account() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

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

  const menuItems = [
    { href: "/account", icon: User, label: "Profile", description: "Manage your personal information" },
    { href: "/account/orders", icon: Package, label: "Orders", description: "View your order history" },
    { href: "/wishlist", icon: Heart, label: "Wishlist", description: "Products you've saved" },
    { href: "/account/addresses", icon: MapPin, label: "Addresses", description: "Manage shipping addresses" },
    { href: "/account/settings", icon: Settings, label: "Settings", description: "Account preferences" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-lg">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "My Account"}
            </h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover-elevate cursor-pointer h-full">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <a href="/api/logout">
            <Button variant="outline" className="w-full sm:w-auto">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
