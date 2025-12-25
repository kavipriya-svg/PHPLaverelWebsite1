import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Calendar, Clock, DollarSign, Users, Star, Settings, LogOut, Building2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { SwimGroomProvider, SwimGroomBooking } from "@shared/schema";

type ProviderDashboardData = {
  provider: SwimGroomProvider;
  stats: {
    totalBookings: number;
    pendingBookings: number;
    todayBookings: number;
    revenue: number;
  };
  recentBookings: (SwimGroomBooking & { customer?: { firstName?: string; lastName?: string; email?: string } })[];
};

export default function ProviderDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<ProviderDashboardData>({
    queryKey: ["/api/provider/dashboard"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/provider/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/provider/dashboard"] });
      toast({ title: "Logged out successfully" });
      setLocation("/provider/login");
    },
  });

  if (isLoading) {
    return (
      <ProviderLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </ProviderLayout>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">Please log in to access the dashboard.</p>
            <Button onClick={() => setLocation("/provider/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { provider, stats, recentBookings } = data;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <ProviderLayout provider={provider} onLogout={() => logoutMutation.mutate()}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {provider.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today's Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayBookings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{stats.revenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Rating */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xl font-bold">{provider.rating || "0.0"}</span>
                </div>
                <span className="text-muted-foreground">
                  Based on {provider.reviewCount || 0} reviews
                </span>
              </div>
              {provider.isVerified ? (
                <Badge className="bg-green-100 text-green-800">Verified Provider</Badge>
              ) : (
                <Badge variant="outline">Pending Verification</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Link href="/provider/bookings">
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">
                        {booking.customer?.firstName} {booking.customer?.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.bookingDate && format(new Date(booking.bookingDate), "dd MMM yyyy")} • {booking.startTime}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">₹{booking.price}</span>
                      <Badge className={statusColors[booking.status || "pending"]}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProviderLayout>
  );
}

function ProviderLayout({ 
  children, 
  provider, 
  onLogout 
}: { 
  children: React.ReactNode;
  provider?: SwimGroomProvider;
  onLogout?: () => void;
}) {
  const [location] = useLocation();
  
  const navItems = [
    { href: "/provider/dashboard", label: "Dashboard", icon: Building2 },
    { href: "/provider/bookings", label: "Bookings", icon: Calendar },
    { href: "/provider/slots", label: "Time Slots", icon: Clock },
    { href: "/provider/profile", label: "Profile", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/provider/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold">Provider Portal</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={location === item.href ? "secondary" : "ghost"}
                    size="sm"
                    data-testid={`link-provider-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          {provider && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  {provider.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/provider/profile">
                    <Settings className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

export { ProviderLayout };
