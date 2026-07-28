import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  ShoppingCart,
  Store,
  Image,
  LayoutGrid,
  Ticket,
  Settings,
  Users,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
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
  Layers,
  Percent,
  MessageSquare,
  Shield,
  UserCircle,
  Key,
  Megaphone,
  Waves,
  Dog,
  MapPin,
  Building2,
  Calendar,
  CreditCard,
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ReactNode, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

const overviewItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
];

const catalogItems = [
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/categories", icon: FolderTree, label: "Categories" },
  { href: "/admin/brands", icon: Tag, label: "Brands" },
  { href: "/admin/inventory", icon: Warehouse, label: "Inventory" },
];

const salesItems = [
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/admin/pos", icon: Store, label: "POS" },
  { href: "/admin/coupons", icon: Ticket, label: "Coupons" },
  { href: "/admin/combo-offers", icon: Gift, label: "Combo Offers" },
];

const homePageItems = [
  { href: "/admin/homepage", icon: LayoutGrid, label: "Homepage" },
  { href: "/admin/home-blocks", icon: Grid3X3, label: "Home Blocks" },
];

const otherContentItems = [
  { href: "/admin/blog", icon: BookOpen, label: "Blog" },
  { href: "/admin/quick-pages", icon: FileText, label: "Quick Pages" },
  { href: "/admin/banners", icon: Image, label: "Banners" },
  { href: "/admin/category-section", icon: Grid3X3, label: "Category Section" },
  { href: "/admin/special-offers", icon: Percent, label: "Special Offers Page" },
  { href: "/admin/combo-offers-settings", icon: Gift, label: "Combo Offers Page" },
];

const userSubMenuItems = [
  { href: "/admin/users/admins", icon: Shield, label: "Admin Users" },
  { href: "/admin/users/customers", icon: UserCircle, label: "All Customers" },
  { href: "/admin/users/customers/regular", icon: UserCircle, label: "Regular Customers" },
  { href: "/admin/users/customers/subscription", icon: UserCircle, label: "Subscription" },
  { href: "/admin/users/customers/retailer", icon: UserCircle, label: "Retailers" },
  { href: "/admin/users/customers/distributor", icon: UserCircle, label: "Distributors" },
  { href: "/admin/users/customers/self-employed", icon: UserCircle, label: "Self Employed" },
  { href: "/admin/users/roles", icon: Key, label: "Roles & Permissions" },
];

const swimGroomSubMenuItems = [
  { href: "/admin/swim-groom/services", icon: Waves, label: "Services" },
  { href: "/admin/swim-groom/locations", icon: MapPin, label: "Locations" },
  { href: "/admin/swim-groom/providers", icon: Building2, label: "Providers" },
  { href: "/admin/swim-groom/bookings", icon: Calendar, label: "Bookings" },
];

const marketingItems = [
  { href: "/admin/reviews", icon: Star, label: "Reviews" },
  { href: "/admin/communication", icon: MessageSquare, label: "Communication" },
  { href: "/admin/marketing", icon: Megaphone, label: "Marketing" },
  { href: "/admin/seo", icon: Search, label: "SEO" },
];

const configItems = [
  { href: "/admin/branding", icon: Paintbrush, label: "Branding" },
  { href: "/admin/invoice", icon: FileText, label: "Invoice" },
  { href: "/admin/footer", icon: PanelBottom, label: "Footer" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const [usersOpen, setUsersOpen] = useState(location.startsWith("/admin/users"));
  const [swimGroomOpen, setSwimGroomOpen] = useState(location.startsWith("/admin/swim-groom"));

  const { data: brandingData } = useQuery<{ settings: { faviconUrl?: string } }>({
    queryKey: ["/api/settings/branding"],
  });

  useEffect(() => {
    const faviconUrl = brandingData?.settings?.faviconUrl;
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
      link.type = faviconUrl.endsWith(".svg") ? "image/svg+xml" :
                  faviconUrl.endsWith(".ico") ? "image/x-icon" : "image/png";
    }
  }, [brandingData?.settings?.faviconUrl]);

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
              <SidebarGroupLabel>Overview</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {overviewItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={location === item.href}>
                        <Link href={item.href} data-testid={`link-admin-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Catalog</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {catalogItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={location === item.href}>
                        <Link href={item.href} data-testid={`link-admin-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Sales</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {salesItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={location === item.href}>
                        <Link href={item.href} data-testid={`link-admin-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Content</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <p className="px-2 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Home Page
                    </p>
                  </SidebarMenuItem>
                  {homePageItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={location === item.href}>
                        <Link href={item.href} data-testid={`link-admin-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <p className="px-2 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Full Meal
                    </p>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/full-meal-page"}>
                      <Link href="/admin/full-meal-page" data-testid="link-admin-full-meal-page">
                        <Dog className="h-4 w-4" />
                        <span>Full Meal Page</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/full-meal-feedback"}>
                      <Link href="/admin/full-meal-feedback" data-testid="link-admin-full-meal-feedback">
                        <Star className="h-4 w-4" />
                        <span>Customer Feedback</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/full-meal-ad-banners"}>
                      <Link href="/admin/full-meal-ad-banners" data-testid="link-admin-full-meal-ad-banners">
                        <Layers className="h-4 w-4" />
                        <span>Ad Banners</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <p className="px-2 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Dog Treats
                    </p>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/dog-treats-page"}>
                      <Link href="/admin/dog-treats-page" data-testid="link-admin-dog-treats-page">
                        <Dog className="h-4 w-4" />
                        <span>Dog Treats Page</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/dog-treats-feedback"}>
                      <Link href="/admin/dog-treats-feedback" data-testid="link-admin-dog-treats-feedback">
                        <Star className="h-4 w-4" />
                        <span>Customer Feedback</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/dog-treats-ad-banners"}>
                      <Link href="/admin/dog-treats-ad-banners" data-testid="link-admin-dog-treats-ad-banners">
                        <Layers className="h-4 w-4" />
                        <span>Ad Banners</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <p className="px-2 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Dog Clothing
                    </p>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/dog-clothing-page"}>
                      <Link href="/admin/dog-clothing-page" data-testid="link-admin-dog-clothing-page">
                        <Dog className="h-4 w-4" />
                        <span>Dog Clothing Page</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/dog-clothing-testimonials"}>
                      <Link href="/admin/dog-clothing-testimonials" data-testid="link-admin-dog-clothing-testimonials">
                        <Star className="h-4 w-4" />
                        <span>Testimonials</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/dog-clothing-ad-banners"}>
                      <Link href="/admin/dog-clothing-ad-banners" data-testid="link-admin-dog-clothing-ad-banners">
                        <Layers className="h-4 w-4" />
                        <span>Ad Banners</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <p className="px-2 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Dog Parent Clothing
                    </p>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/dog-parent-clothing-page"}>
                      <Link href="/admin/dog-parent-clothing-page" data-testid="link-admin-dog-parent-clothing-page">
                        <Dog className="h-4 w-4" />
                        <span>Page Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/dog-parent-clothing-testimonials"}>
                      <Link href="/admin/dog-parent-clothing-testimonials" data-testid="link-admin-dog-parent-clothing-testimonials">
                        <Star className="h-4 w-4" />
                        <span>Testimonials</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/dog-parent-clothing-ad-banners"}>
                      <Link href="/admin/dog-parent-clothing-ad-banners" data-testid="link-admin-dog-parent-clothing-ad-banners">
                        <Layers className="h-4 w-4" />
                        <span>Ad Banners</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <p className="px-2 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Gift Services
                    </p>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/gift-services-page-settings"}>
                      <Link href="/admin/gift-services-page-settings" data-testid="link-admin-gift-services-page-settings">
                        <Settings className="h-4 w-4" />
                        <span>Page Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/dog-gift-series-testimonials"}>
                      <Link href="/admin/dog-gift-series-testimonials" data-testid="link-admin-dog-gift-series-testimonials">
                        <Star className="h-4 w-4" />
                        <span>Testimonials</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/dog-gift-series-ad-banners"}>
                      <Link href="/admin/dog-gift-series-ad-banners" data-testid="link-admin-dog-gift-series-ad-banners">
                        <Layers className="h-4 w-4" />
                        <span>Ad Banners</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <p className="px-2 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Cart
                    </p>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/cart/order-thanks"}>
                      <Link href="/admin/cart/order-thanks" data-testid="link-admin-cart-order-thanks">
                        <FileText className="h-4 w-4" />
                        <span>Order Thanks</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/cart/shopping-cart"}>
                      <Link href="/admin/cart/shopping-cart" data-testid="link-admin-cart-shopping-cart">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Shopping Cart</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/admin/cart/checkout"}>
                      <Link href="/admin/cart/checkout" data-testid="link-admin-cart-checkout">
                        <CreditCard className="h-4 w-4" />
                        <span>Checkout</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <p className="px-2 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Others
                    </p>
                  </SidebarMenuItem>
                  {otherContentItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={location === item.href}>
                        <Link href={item.href} data-testid={`link-admin-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>People</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <Collapsible open={usersOpen} onOpenChange={setUsersOpen} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          isActive={location.startsWith("/admin/users")}
                          data-testid="link-admin-users"
                        >
                          <Users className="h-4 w-4" />
                          <span>Users</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {userSubMenuItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={location === item.href}>
                                <Link href={item.href} data-testid={`link-admin-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Services</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <Collapsible open={swimGroomOpen} onOpenChange={setSwimGroomOpen} className="group/collapsible-sg">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          isActive={location.startsWith("/admin/swim-groom")}
                          data-testid="link-admin-swim-groom"
                        >
                          <Dog className="h-4 w-4" />
                          <span>Swimming & Grooming</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible-sg:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {swimGroomSubMenuItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={location === item.href}>
                                <Link href={item.href} data-testid={`link-admin-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Marketing</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {marketingItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={location === item.href}>
                        <Link href={item.href} data-testid={`link-admin-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Configuration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {configItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={location === item.href}>
                        <Link href={item.href} data-testid={`link-admin-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
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
