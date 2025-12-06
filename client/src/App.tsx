import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { Loader2 } from "lucide-react";

const Home = lazy(() => import("@/pages/Home"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const TrackOrder = lazy(() => import("@/pages/TrackOrder"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const SpecialOffers = lazy(() => import("@/pages/SpecialOffers"));
const Account = lazy(() => import("@/pages/Account"));
const AccountOrders = lazy(() => import("@/pages/AccountOrders"));
const AccountOrderDetail = lazy(() => import("@/pages/AccountOrderDetail"));
const Profile = lazy(() => import("@/pages/Profile"));
const Addresses = lazy(() => import("@/pages/Addresses"));
const AccountSettings = lazy(() => import("@/pages/AccountSettings"));
const Wishlist = lazy(() => import("@/pages/Wishlist"));
const ComboOffers = lazy(() => import("@/pages/ComboOffers"));
const GiftRegistry = lazy(() => import("@/pages/GiftRegistry"));
const GiftRegistryDetail = lazy(() => import("@/pages/GiftRegistryDetail"));
const PublicRegistry = lazy(() => import("@/pages/PublicRegistry"));
const SharedWishlist = lazy(() => import("@/pages/SharedWishlist"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const Signup = lazy(() => import("@/pages/Signup"));
const Login = lazy(() => import("@/pages/Login"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const NotFound = lazy(() => import("@/pages/not-found"));

const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/Products"));
const AdminProductForm = lazy(() => import("@/pages/admin/ProductForm"));
const AdminCategories = lazy(() => import("@/pages/admin/Categories"));
const AdminOrders = lazy(() => import("@/pages/admin/Orders"));
const AdminBanners = lazy(() => import("@/pages/admin/Banners"));
const AdminCoupons = lazy(() => import("@/pages/admin/Coupons"));
const AdminBrands = lazy(() => import("@/pages/admin/Brands"));
const AdminHomeBlocks = lazy(() => import("@/pages/admin/HomeBlocks"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminReviews = lazy(() => import("@/pages/admin/Reviews"));
const AdminEmailSettings = lazy(() => import("@/pages/admin/EmailSettings"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminSEOSettings = lazy(() => import("@/pages/admin/SEOSettings"));
const AdminInventory = lazy(() => import("@/pages/admin/Inventory"));
const AdminInvoiceSettings = lazy(() => import("@/pages/admin/InvoiceSettings"));
const AdminFooterSettings = lazy(() => import("@/pages/admin/FooterSettings"));
const AdminBrandingSettings = lazy(() => import("@/pages/admin/BrandingSettings"));
const AdminCategorySectionSettings = lazy(() => import("@/pages/admin/CategorySectionSettings"));
const AdminBlogSettings = lazy(() => import("@/pages/admin/BlogSettings"));
const AdminComboOffers = lazy(() => import("@/pages/admin/ComboOffers"));

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <StoreLayout>
          <Home />
        </StoreLayout>
      </Route>
      
      <Route path="/product/:slug">
        <StoreLayout>
          <ProductDetail />
        </StoreLayout>
      </Route>
      
      <Route path="/category/:slug">
        <StoreLayout>
          <CategoryPage />
        </StoreLayout>
      </Route>
      
      <Route path="/cart">
        <StoreLayout>
          <Cart />
        </StoreLayout>
      </Route>
      
      <Route path="/checkout">
        <StoreLayout>
          <Checkout />
        </StoreLayout>
      </Route>
      
      <Route path="/order-confirmation/:orderNumber">
        <StoreLayout>
          <OrderConfirmation />
        </StoreLayout>
      </Route>
      
      <Route path="/track-order">
        <StoreLayout>
          <TrackOrder />
        </StoreLayout>
      </Route>
      
      <Route path="/track-order/:orderNumber">
        <StoreLayout>
          <TrackOrder />
        </StoreLayout>
      </Route>
      
      <Route path="/search">
        <StoreLayout>
          <SearchResults />
        </StoreLayout>
      </Route>
      
      <Route path="/offers">
        <StoreLayout>
          <SpecialOffers />
        </StoreLayout>
      </Route>
      
      <Route path="/combo-offers">
        <StoreLayout>
          <ComboOffers />
        </StoreLayout>
      </Route>
      
      <Route path="/account">
        <StoreLayout>
          <Account />
        </StoreLayout>
      </Route>
      
      <Route path="/account/orders/:orderNumber">
        <StoreLayout>
          <AccountOrderDetail />
        </StoreLayout>
      </Route>
      
      <Route path="/account/orders">
        <StoreLayout>
          <AccountOrders />
        </StoreLayout>
      </Route>
      
      <Route path="/account/profile">
        <StoreLayout>
          <Profile />
        </StoreLayout>
      </Route>
      
      <Route path="/account/addresses">
        <StoreLayout>
          <Addresses />
        </StoreLayout>
      </Route>
      
      <Route path="/account/settings">
        <StoreLayout>
          <AccountSettings />
        </StoreLayout>
      </Route>
      
      <Route path="/wishlist">
        <StoreLayout>
          <Wishlist />
        </StoreLayout>
      </Route>
      
      <Route path="/gift-registry">
        <StoreLayout>
          <GiftRegistry />
        </StoreLayout>
      </Route>
      
      <Route path="/gift-registry/:id">
        <StoreLayout>
          <GiftRegistryDetail />
        </StoreLayout>
      </Route>
      
      <Route path="/registry/:shareCode">
        <StoreLayout>
          <PublicRegistry />
        </StoreLayout>
      </Route>
      
      <Route path="/shared-wishlist/:shareCode">
        <StoreLayout>
          <SharedWishlist />
        </StoreLayout>
      </Route>

      <Route path="/signup">
        <Suspense fallback={<PageLoader />}>
          <Signup />
        </Suspense>
      </Route>
      
      <Route path="/login">
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      </Route>

      <Route path="/blog/:slug">
        <StoreLayout>
          <BlogPost />
        </StoreLayout>
      </Route>

      <Route path="/admin/login">
        <AdminLayout>
          <AdminLogin />
        </AdminLayout>
      </Route>
      <Route path="/admin">
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </Route>
      <Route path="/admin/products">
        <AdminLayout>
          <AdminProducts />
        </AdminLayout>
      </Route>
      <Route path="/admin/products/:id">
        <AdminLayout>
          <AdminProductForm />
        </AdminLayout>
      </Route>
      <Route path="/admin/categories">
        <AdminLayout>
          <AdminCategories />
        </AdminLayout>
      </Route>
      <Route path="/admin/orders">
        <AdminLayout>
          <AdminOrders />
        </AdminLayout>
      </Route>
      <Route path="/admin/banners">
        <AdminLayout>
          <AdminBanners />
        </AdminLayout>
      </Route>
      <Route path="/admin/coupons">
        <AdminLayout>
          <AdminCoupons />
        </AdminLayout>
      </Route>
      <Route path="/admin/brands">
        <AdminLayout>
          <AdminBrands />
        </AdminLayout>
      </Route>
      <Route path="/admin/home-blocks">
        <AdminLayout>
          <AdminHomeBlocks />
        </AdminLayout>
      </Route>
      <Route path="/admin/settings">
        <AdminLayout>
          <AdminSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/users">
        <AdminLayout>
          <AdminUsers />
        </AdminLayout>
      </Route>
      <Route path="/admin/reviews">
        <AdminLayout>
          <AdminReviews />
        </AdminLayout>
      </Route>
      <Route path="/admin/email">
        <AdminLayout>
          <AdminEmailSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/analytics">
        <AdminLayout>
          <AdminAnalytics />
        </AdminLayout>
      </Route>
      <Route path="/admin/seo">
        <AdminLayout>
          <AdminSEOSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/inventory">
        <AdminLayout>
          <AdminInventory />
        </AdminLayout>
      </Route>
      <Route path="/admin/invoice">
        <AdminLayout>
          <AdminInvoiceSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/footer">
        <AdminLayout>
          <AdminFooterSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/branding">
        <AdminLayout>
          <AdminBrandingSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/category-section">
        <AdminLayout>
          <AdminCategorySectionSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/blog">
        <AdminLayout>
          <AdminBlogSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/combo-offers">
        <AdminLayout>
          <AdminComboOffers />
        </AdminLayout>
      </Route>

      <Route>
        <StoreLayout>
          <NotFound />
        </StoreLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <StoreProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </StoreProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
