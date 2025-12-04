import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Menu, 
  X, 
  ChevronDown,
  Package,
  LogIn,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/contexts/StoreContext";
import { useQuery } from "@tanstack/react-query";
import type { CategoryWithChildren } from "@shared/schema";

interface BrandingSettings {
  logoUrl: string;
  storeName: string;
  faviconUrl: string;
  topBarText: string;
  showTopBar: boolean;
}

const defaultBranding: BrandingSettings = {
  logoUrl: "",
  storeName: "ShopHub",
  faviconUrl: "",
  topBarText: "Free shipping on orders over ₹500 | Shop Now",
  showTopBar: true,
};

export function Header() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { cartCount, searchQuery, setSearchQuery } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData } = useQuery<{ categories: CategoryWithChildren[] }>({
    queryKey: ["/api/categories/menu"],
  });

  const { data: brandingData } = useQuery<{ settings: BrandingSettings }>({
    queryKey: ["/api/settings/branding"],
  });

  const categories = categoriesData?.categories || [];
  const branding = brandingData?.settings ? { ...defaultBranding, ...brandingData.settings } : defaultBranding;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setActiveCategory(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {branding.showTopBar && branding.topBarText && (
        <div className="bg-primary text-primary-foreground py-1.5 text-center text-sm" data-testid="text-top-bar">
          {branding.topBarText}
        </div>
      )}
      
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-2">
                  {categories.map((category) => (
                    <MobileCategoryItem 
                      key={category.id} 
                      category={category} 
                      onNavigate={() => setMobileMenuOpen(false)}
                    />
                  ))}
                  <div className="my-4 border-t pt-4">
                    <Link 
                      href="/track-order" 
                      className="flex items-center gap-2 px-2 py-2 text-sm hover-elevate rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Package className="h-4 w-4" />
                      Track Order
                    </Link>
                    <Link 
                      href="/special-offers" 
                      className="flex items-center gap-2 px-2 py-2 text-sm hover-elevate rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Special Offers
                    </Link>
                    <Link 
                      href="/featured" 
                      className="flex items-center gap-2 px-2 py-2 text-sm hover-elevate rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Featured Products
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
            
            <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
              {branding.logoUrl ? (
                <img 
                  src={branding.logoUrl} 
                  alt={branding.storeName} 
                  className="h-9 w-auto object-contain"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-lg">
                  {branding.storeName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden font-bold text-xl sm:inline-block">{branding.storeName}</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1" ref={megaMenuRef}>
            {categories.slice(0, 6).map((category) => (
              <div
                key={category.id}
                className="relative"
                onMouseEnter={() => setActiveCategory(category.id)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <Link
                  href={`/category/${category.slug}`}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium hover-elevate rounded-md"
                  data-testid={`link-category-${category.slug}`}
                >
                  {category.name}
                  {category.children && category.children.length > 0 && (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Link>
                
                {activeCategory === category.id && category.children && category.children.length > 0 && (
                  <MegaMenu category={category} onClose={() => setActiveCategory(null)} />
                )}
              </div>
            ))}
            <Link
              href="/special-offers"
              className="px-3 py-2 text-sm font-medium text-destructive hover-elevate rounded-md"
              data-testid="link-special-offers"
            >
              Sale
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="relative flex items-center">
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 sm:w-64 pr-8"
                  autoFocus
                  data-testid="input-search"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                data-testid="button-search"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            <Link href="/track-order" className="hidden sm:block">
              <Button variant="ghost" size="icon" data-testid="button-track-order">
                <Package className="h-5 w-5" />
              </Button>
            </Link>

            <ThemeToggle />

            {isAuthenticated && (
              <Link href="/wishlist">
                <Button variant="ghost" size="icon" data-testid="button-wishlist">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
            )}

            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon" data-testid="button-cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    data-testid="badge-cart-count"
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-account">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isAuthenticated ? (
                  <>
                    <div className="px-2 py-1.5 text-sm font-medium">
                      {user?.firstName || user?.email || "Account"}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="w-full cursor-pointer" data-testid="link-account">
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/orders" className="w-full cursor-pointer" data-testid="link-orders">
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wishlist" className="w-full cursor-pointer" data-testid="link-wishlist">
                        Wishlist
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="w-full cursor-pointer" data-testid="link-admin">
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/api/logout" className="w-full cursor-pointer flex items-center gap-2" data-testid="link-logout">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </a>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <a href="/api/login" className="w-full cursor-pointer flex items-center gap-2" data-testid="link-login">
                        <LogIn className="h-4 w-4" />
                        Sign In
                      </a>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

function MegaMenu({ 
  category, 
  onClose 
}: { 
  category: CategoryWithChildren; 
  onClose: () => void;
}) {
  return (
    <div className="absolute left-0 top-full pt-2 z-50">
      <div className="bg-popover border rounded-md shadow-lg p-6 min-w-[600px]">
        <div className="grid grid-cols-3 gap-6">
          {category.children?.map((subCategory) => (
            <div key={subCategory.id}>
              <Link
                href={`/category/${subCategory.slug}`}
                className="font-semibold text-sm hover:text-primary mb-2 flex items-center gap-2 group"
                onClick={onClose}
                data-testid={`link-subcategory-${subCategory.slug}`}
              >
                {subCategory.iconUrl && (
                  <img 
                    src={subCategory.iconUrl} 
                    alt="" 
                    className="w-5 h-5 object-contain rounded transition-transform duration-150 ease-out group-hover:scale-150 group-focus-visible:scale-150"
                  />
                )}
                {subCategory.name}
              </Link>
              {subCategory.children && subCategory.children.length > 0 && (
                <ul className="space-y-1">
                  {subCategory.children.map((childCategory) => (
                    <li key={childCategory.id}>
                      <Link
                        href={`/category/${childCategory.slug}`}
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 group"
                        onClick={onClose}
                        data-testid={`link-childcategory-${childCategory.slug}`}
                      >
                        {childCategory.iconUrl && (
                          <img 
                            src={childCategory.iconUrl} 
                            alt="" 
                            className="w-4 h-4 object-contain rounded transition-transform duration-150 ease-out group-hover:scale-150 group-focus-visible:scale-150"
                          />
                        )}
                        {childCategory.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Link
            href={`/category/${category.slug}`}
            className="text-sm text-primary hover:underline"
            onClick={onClose}
          >
            View all in {category.name}
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileCategoryItem({ 
  category, 
  onNavigate,
  depth = 0 
}: { 
  category: CategoryWithChildren; 
  onNavigate: () => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="flex flex-col">
      <div 
        className="flex items-center justify-between py-2 hover-elevate rounded-md"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <Link
          href={`/category/${category.slug}`}
          className="flex-1 text-sm font-medium flex items-center gap-2 group"
          onClick={onNavigate}
        >
          {category.iconUrl && (
            <img 
              src={category.iconUrl} 
              alt="" 
              className="w-5 h-5 object-contain rounded transition-transform duration-150 ease-out group-hover:scale-150 group-focus-visible:scale-150"
            />
          )}
          {category.name}
        </Link>
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </Button>
        )}
      </div>
      {expanded && hasChildren && (
        <div className="flex flex-col">
          {category.children?.map((child) => (
            <MobileCategoryItem
              key={child.id}
              category={child}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
