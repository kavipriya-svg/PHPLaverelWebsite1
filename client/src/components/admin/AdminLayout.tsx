import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  ShoppingCart,
  Image,
  LayoutGrid,
  Ticket,
  Settings,
  Users,
  ChevronLeft,
  Menu,
  Star,
  Mail,
  BarChart3,
  Search,
  Warehouse,
  FileText,
  Paintbrush,
  PanelBottom,
  Grid3X3,
  BookOpen,
  Gift,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ReactNode } from "react";

const adminMenuItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/categories", icon: FolderTree, label: "Categories" },
  { href: "/admin/brands", icon: Tag, label: "Brands" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/admin/inventory", icon: Warehouse, label: "Inventory" },
  { href: "/admin/reviews", icon: Star, label: "Reviews" },
  { href: "/admin/banners", icon: Image, label: "Banners" },
  { href: "/admin/home-blocks", icon: LayoutGrid, label: "Home Blocks" },
  { href: "/admin/category-section", icon: Grid3X3, label: "Category Section" },
  { href: "/admin/blog", icon: BookOpen, label: "Blog" },
  { href: "/admin/coupons", icon: Ticket, label: "Coupons" },
  { href: "/admin/combo-offers", icon: Gift, label: "Combo Offers" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/email", icon: Mail, label: "Email" },
  { href: "/admin/seo", icon: Search, label: "SEO" },
  { href: "/admin/invoice", icon: FileText, label: "Invoice" },
  { href: "/admin/branding", icon: Paintbrush, label: "Branding" },
  { href: "/admin/special-offers", icon: Percent, label: "Special Offers Page" },
  { href: "/admin/combo-offers-settings", icon: Gift, label: "Combo Offers Page" },
  { href: "/admin/footer", icon: PanelBottom, label: "Footer" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 p-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-2xl">
          A
        </div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Please sign in with your Replit account to access the admin panel.
        </p>
        <Button asChild size="lg" data-testid="button-admin-login">
          <a href="/api/login">Sign in with Replit</a>
        </Button>
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Store
          </Button>
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 p-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-md bg-destructive text-destructive-foreground font-bold text-2xl">
          !
        </div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to access the admin panel. Please contact an administrator if you believe this is an error.
        </p>
        <Link href="/">
          <Button variant="outline" size="lg">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Store
          </Button>
        </Link>
      </div>
    );
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                A
              </div>
              <span className="font-bold">Admin Panel</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMenuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={location === item.href}>
                        <Link href={item.href} data-testid={`link-admin-${item.label.toLowerCase()}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-4 border-b bg-background">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Store
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">
                {user?.firstName || user?.email}
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <ScrollArea className="h-full">
              <div className="p-6">
                {children}
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
