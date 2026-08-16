import { Suspense, lazy, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { Loader2 } from "lucide-react";
import { IntegrationScripts } from "@/components/IntegrationScripts";

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
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const DogGiftSeries = lazy(() => import("@/pages/DogGiftSeries"));
const DogGiftSeriesProductDetail = lazy(() => import("@/pages/DogGiftSeriesProductDetail"));
const NotFound = lazy(() => import("@/pages/not-found"));

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
const AdminUsersList = lazy(() => import("@/pages/admin/AdminUsersList"));
const CustomerUsersList = lazy(() => import("@/pages/admin/CustomerUsersList"));
const SubscriptionCustomers = lazy(() => import("@/pages/admin/SubscriptionCustomers"));
const RolesManagement = lazy(() => import("@/pages/admin/RolesManagement"));
const AdminReviews = lazy(() => import("@/pages/admin/Reviews"));
const AdminEmailSettings = lazy(() => import("@/pages/admin/EmailSettings"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminSEOSettings = lazy(() => import("@/pages/admin/SEOSettings"));
const AdminInventory = lazy(() => import("@/pages/admin/Inventory"));
const AdminInvoiceSettings = lazy(() => import("@/pages/admin/InvoiceSettings"));
const AdminFooterSettings = lazy(() => import("@/pages/admin/FooterSettings"));
const AdminBrandingSettings = lazy(() => import("@/pages/admin/BrandingSettings"));
const AdminSpecialOffersSettings = lazy(() => import("@/pages/admin/SpecialOffersSettings"));
const AdminComboOffersSettings = lazy(() => import("@/pages/admin/ComboOffersSettings"));
const AdminOrderThanksSettings = lazy(() => import("@/pages/admin/OrderThanksSettings"));
const AdminShoppingCartSettings = lazy(() => import("@/pages/admin/ShoppingCartSettings"));
const AdminCheckoutSettings = lazy(() => import("@/pages/admin/CheckoutSettings"));
const AdminCategorySectionSettings = lazy(() => import("@/pages/admin/CategorySectionSettings"));
const AdminBlogSettings = lazy(() => import("@/pages/admin/BlogSettings"));
const AdminComboOffers = lazy(() => import("@/pages/admin/ComboOffers"));
const AdminQuickPages = lazy(() => import("@/pages/admin/QuickPages"));
const AdminCommunicationSettings = lazy(() => import("@/pages/admin/CommunicationSettings"));
const AdminMarketing = lazy(() => import("@/pages/admin/Marketing"));
const AdminPOS = lazy(() => import("@/pages/admin/POS"));
const AdminDeliverySettings = lazy(() => import("@/pages/admin/DeliverySettings"));
const QuickPage = lazy(() => import("@/pages/QuickPage"));
const AdminSwimGroomServices = lazy(() => import("@/pages/admin/SwimGroomServices"));
const AdminSwimGroomLocations = lazy(() => import("@/pages/admin/SwimGroomLocations"));
const AdminSwimGroomProviders = lazy(() => import("@/pages/admin/SwimGroomProviders"));
const AdminSwimGroomBookings = lazy(() => import("@/pages/admin/SwimGroomBookings"));
const AdminHomepageSettings = lazy(() => import("@/pages/admin/HomepageSettings"));
const AdminFullMealPageSettings = lazy(() => import("@/pages/admin/FullMealPageSettings"));
const DogParentClothing = lazy(() => import("@/pages/DogParentClothing"));
const AdminFullMealFeedback = lazy(() => import("@/pages/admin/FullMealFeedback"));
const AdminFullMealAdBanners = lazy(() => import("@/pages/admin/FullMealAdBanners"));
const AdminDogTreatsPageSettings = lazy(() => import("@/pages/admin/DogTreatsPageSettings"));
const AdminDogTreatsFeedback = lazy(() => import("@/pages/admin/DogTreatsFeedback"));
const AdminDogTreatsAdBanners = lazy(() => import("@/pages/admin/DogTreatsAdBanners"));
const AdminDogClothingPageSettings = lazy(() => import("@/pages/admin/DogClothingPageSettings"));
const AdminDogClothingTestimonials = lazy(() => import("@/pages/admin/DogClothingTestimonials"));
const AdminDogClothingAdBanners = lazy(() => import("@/pages/admin/DogClothingAdBanners"));
const AdminDogParentClothingPageSettings = lazy(() => import("@/pages/admin/DogParentClothingPageSettings"));
const AdminDogParentClothingTestimonials = lazy(() => import("@/pages/admin/DogParentClothingTestimonials"));
const AdminDogParentClothingAdBanners = lazy(() => import("@/pages/admin/DogParentClothingAdBanners"));
const AdminGiftServicesPageSettings = lazy(() => import("@/pages/admin/GiftServicesPageSettings"));
const AdminAccountDashboardSettings = lazy(() => import("@/pages/admin/AccountDashboardSettings"));
const AdminAccountOrderHistorySettings = lazy(() => import("@/pages/admin/AccountOrderHistorySettings"));
const AdminAddressesSettings = lazy(() => import("@/pages/admin/AddressesSettings"));
const AdminAccountPreferencesSettings = lazy(() => import("@/pages/admin/AccountPreferencesSettings"));
const AdminDogGiftSeriesTestimonials = lazy(() => import("@/pages/admin/DogGiftSeriesTestimonials"));
const AdminDogGiftSeriesAdBanners = lazy(() => import("@/pages/admin/DogGiftSeriesAdBanners"));
const DogParentClothingProductDetail = lazy(() => import("@/pages/DogParentClothingProductDetail"));
const DogTreatProductDetail = lazy(() => import("@/pages/DogTreatProductDetail"));
const DogClothingProductDetail = lazy(() => import("@/pages/DogClothingProductDetail"));
const SwimGroom = lazy(() => import("@/pages/SwimGroom"));
const SwimGroomProvider = lazy(() => import("@/pages/SwimGroomProvider"));
const DogFullMeal = lazy(() => import("@/pages/DogFullMeal"));
const FullMealProductDetail = lazy(() => import("@/pages/FullMealProductDetail"));
const DogTreat = lazy(() => import("@/pages/DogTreat"));
const DogClothing = lazy(() => import("@/pages/DogClothing"));
const ProviderDashboard = lazy(() => import("@/pages/provider/ProviderDashboard"));
const ProviderBookings = lazy(() => import("@/pages/provider/ProviderBookings"));
const ProviderSlots = lazy(() => import("@/pages/provider/ProviderSlots"));
const ProviderProfile = lazy(() => import("@/pages/provider/ProviderProfile"));
const AdminIntegrations = lazy(() => import("@/pages/admin/Integrations"));

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

function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
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
        <HomeLayout>
          <Home />
        </HomeLayout>
      </Route>
      
      <Route path="/product/:slug">
        <StoreLayout>
          <ProductDetail />
        </StoreLayout>
      </Route>
      
      <Route path="/clothing/product/:slug">
        <Suspense fallback={<PageLoader />}>
          <DogClothingProductDetail />
        </Suspense>
      </Route>
      <Route path="/category/clothing">
        <HomeLayout>
          <DogClothing />
        </HomeLayout>
      </Route>

      <Route path="/twinning/product/:slug">
        <Suspense fallback={<PageLoader />}>
          <DogParentClothingProductDetail />
        </Suspense>
      </Route>

      <Route path="/category/twinning">
        <HomeLayout>
          <Suspense fallback={<PageLoader />}>
            <DogParentClothing />
          </Suspense>
        </HomeLayout>
      </Route>

      <Route path="/category/:slug">
        <StoreLayout>
          <CategoryPage />
        </StoreLayout>
      </Route>
      
      <Route path="/cart">
        <HomeLayout>
          <Cart />
        </HomeLayout>
      </Route>
      
      <Route path="/checkout">
        <HomeLayout>
          <Checkout />
        </HomeLayout>
      </Route>
      
      <Route path="/order-confirmation/:orderNumber">
        <HomeLayout>
          <OrderConfirmation />
        </HomeLayout>
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
      
      <Route path="/special-offers">
        <StoreLayout>
          <SpecialOffers />
        </StoreLayout>
      </Route>
      
      <Route path="/sale">
        <StoreLayout>
          <SpecialOffers />
        </StoreLayout>
      </Route>
      
      <Route path="/full-meals/product/:slug">
        <HomeLayout>
          <FullMealProductDetail />
        </HomeLayout>
      </Route>

      <Route path="/full-meals">
        <HomeLayout>
          <DogFullMeal />
        </HomeLayout>
      </Route>

      <Route path="/dogtreat/product/:slug">
        <HomeLayout>
          <DogTreatProductDetail />
        </HomeLayout>
      </Route>

      <Route path="/dogtreat">
        <HomeLayout>
          <DogTreat />
        </HomeLayout>
      </Route>

      <Route path="/treat/product/:slug">
        <HomeLayout>
          <DogTreatProductDetail />
        </HomeLayout>
      </Route>

      <Route path="/treat">
        <HomeLayout>
          <DogTreat />
        </HomeLayout>
      </Route>

      <Route path="/combo-offers">
        <StoreLayout>
          <ComboOffers />
        </StoreLayout>
      </Route>
      
      <Route path="/swim-groom">
        <StoreLayout>
          <SwimGroom />
        </StoreLayout>
      </Route>
      
      <Route path="/swim-groom/provider/:slug">
        <StoreLayout>
          <SwimGroomProvider />
        </StoreLayout>
      </Route>
      
      <Route path="/account">
        <HomeLayout>
          <Account />
        </HomeLayout>
      </Route>
      
      <Route path="/account/orders/:orderNumber">
        <StoreLayout>
          <AccountOrderDetail />
        </StoreLayout>
      </Route>
      
      <Route path="/account/orders">
        <HomeLayout>
          <AccountOrders />
        </HomeLayout>
      </Route>
      
      <Route path="/account/profile">
        <StoreLayout>
          <Profile />
        </StoreLayout>
      </Route>
      
      <Route path="/profile">
        <StoreLayout>
          <Profile />
        </StoreLayout>
      </Route>
      
      <Route path="/account/addresses">
        <HomeLayout>
          <Addresses />
        </HomeLayout>
      </Route>
      
      <Route path="/account/settings">
        <HomeLayout>
          <AccountSettings />
        </HomeLayout>
      </Route>
      
      <Route path="/wishlist">
        <HomeLayout>
          <Wishlist />
        </HomeLayout>
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

      <Route path="/forgot-password">
        <Suspense fallback={<PageLoader />}>
          <ForgotPassword />
        </Suspense>
      </Route>

      <Route path="/blog/:slug">
        <StoreLayout>
          <BlogPost />
        </StoreLayout>
      </Route>

      <Route path="/giftseries/product/:slug">
        <Suspense fallback={<PageLoader />}>
          <DogGiftSeriesProductDetail />
        </Suspense>
      </Route>

      <Route path="/giftseries">
        <Suspense fallback={<PageLoader />}>
          <DogGiftSeries />
        </Suspense>
      </Route>

      <Route path="/admin/login">
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
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
      <Route path="/admin/settings/delivery">
        <AdminLayout>
          <AdminDeliverySettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/users">
        <AdminLayout>
          <AdminUsers />
        </AdminLayout>
      </Route>
      <Route path="/admin/users/admins">
        <AdminLayout>
          <AdminUsersList />
        </AdminLayout>
      </Route>
      <Route path="/admin/users/customers">
        <AdminLayout>
          <CustomerUsersList />
        </AdminLayout>
      </Route>
      <Route path="/admin/users/customers/subscription">
        <AdminLayout>
          <SubscriptionCustomers />
        </AdminLayout>
      </Route>
      <Route path="/admin/users/roles">
        <AdminLayout>
          <RolesManagement />
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
      <Route path="/admin/pos">
        <AdminLayout>
          <AdminPOS />
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
      <Route path="/admin/integrations">
        <AdminLayout>
          <Suspense fallback={<PageLoader />}>
            <AdminIntegrations />
          </Suspense>
        </AdminLayout>
      </Route>
      <Route path="/admin/branding">
        <AdminLayout>
          <AdminBrandingSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/homepage">
        <AdminLayout>
          <AdminHomepageSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/full-meal-page">
        <AdminLayout>
          <AdminFullMealPageSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/full-meal-feedback">
        <AdminLayout>
          <AdminFullMealFeedback />
        </AdminLayout>
      </Route>
      <Route path="/admin/full-meal-ad-banners">
        <AdminLayout>
          <AdminFullMealAdBanners />
        </AdminLayout>
      </Route>
      <Route path="/admin/dog-treats-page">
        <AdminLayout>
          <AdminDogTreatsPageSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/dog-treats-feedback">
        <AdminLayout>
          <AdminDogTreatsFeedback />
        </AdminLayout>
      </Route>
      <Route path="/admin/dog-treats-ad-banners">
        <AdminLayout>
          <AdminDogTreatsAdBanners />
        </AdminLayout>
      </Route>
      <Route path="/admin/dog-clothing-page">
        <AdminLayout>
          <AdminDogClothingPageSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/dog-clothing-testimonials">
        <AdminLayout>
          <AdminDogClothingTestimonials />
        </AdminLayout>
      </Route>
      <Route path="/admin/dog-clothing-ad-banners">
        <AdminLayout>
          <AdminDogClothingAdBanners />
        </AdminLayout>
      </Route>
      <Route path="/admin/dog-parent-clothing-page">
        <AdminLayout>
          <AdminDogParentClothingPageSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/dog-parent-clothing-testimonials">
        <AdminLayout>
          <AdminDogParentClothingTestimonials />
        </AdminLayout>
      </Route>
      <Route path="/admin/dog-parent-clothing-ad-banners">
        <AdminLayout>
          <AdminDogParentClothingAdBanners />
        </AdminLayout>
      </Route>
      <Route path="/admin/gift-services-page-settings">
        <AdminLayout>
          <AdminGiftServicesPageSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/dog-gift-series-testimonials">
        <AdminLayout>
          <AdminDogGiftSeriesTestimonials />
        </AdminLayout>
      </Route>
      <Route path="/admin/dog-gift-series-ad-banners">
        <AdminLayout>
          <AdminDogGiftSeriesAdBanners />
        </AdminLayout>
      </Route>
      <Route path="/admin/special-offers">
        <AdminLayout>
          <AdminSpecialOffersSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/combo-offers-settings">
        <AdminLayout>
          <AdminComboOffersSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/account-dashboard">
        <AdminLayout>
          <AdminAccountDashboardSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/account-order-history">
        <AdminLayout>
          <AdminAccountOrderHistorySettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/account-addresses">
        <AdminLayout>
          <AdminAddressesSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/account-preferences">
        <AdminLayout>
          <AdminAccountPreferencesSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/cart/order-thanks">
        <AdminLayout>
          <AdminOrderThanksSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/cart/shopping-cart">
        <AdminLayout>
          <AdminShoppingCartSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/cart/checkout">
        <AdminLayout>
          <AdminCheckoutSettings />
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
      <Route path="/admin/quick-pages">
        <AdminLayout>
          <AdminQuickPages />
        </AdminLayout>
      </Route>
      <Route path="/admin/communication">
        <AdminLayout>
          <AdminCommunicationSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/marketing">
        <AdminLayout>
          <AdminMarketing />
        </AdminLayout>
      </Route>
      <Route path="/admin/swim-groom/services">
        <AdminLayout>
          <AdminSwimGroomServices />
        </AdminLayout>
      </Route>
      <Route path="/admin/swim-groom/locations">
        <AdminLayout>
          <AdminSwimGroomLocations />
        </AdminLayout>
      </Route>
      <Route path="/admin/swim-groom/providers">
        <AdminLayout>
          <AdminSwimGroomProviders />
        </AdminLayout>
      </Route>
      <Route path="/admin/swim-groom/bookings">
        <AdminLayout>
          <AdminSwimGroomBookings />
        </AdminLayout>
      </Route>

      {/* Provider Portal Routes */}
      <Route path="/provider/login">
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      </Route>
      <Route path="/provider/dashboard">
        <Suspense fallback={<PageLoader />}>
          <ProviderDashboard />
        </Suspense>
      </Route>
      <Route path="/provider/bookings">
        <Suspense fallback={<PageLoader />}>
          <ProviderBookings />
        </Suspense>
      </Route>
      <Route path="/provider/slots">
        <Suspense fallback={<PageLoader />}>
          <ProviderSlots />
        </Suspense>
      </Route>
      <Route path="/provider/profile">
        <Suspense fallback={<PageLoader />}>
          <ProviderProfile />
        </Suspense>
      </Route>

      {/* Public Quick Pages */}
      <Route path="/pages/:slug">
        {(params) => (
          <StoreLayout>
            <QuickPage slug={params.slug} />
          </StoreLayout>
        )}
      </Route>

      <Route>
        <StoreLayout>
          <NotFound />
        </StoreLayout>
      </Route>
    </Switch>
  );
}

function DynamicFavicon() {
  const { data } = useQuery<{ settings: { faviconUrl?: string; logoUrl?: string } }>({
    queryKey: ["/api/settings/branding"],
  });

  useEffect(() => {
    const url = data?.settings?.faviconUrl || data?.settings?.logoUrl;
    if (!url) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [data]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <StoreProvider>
          <TooltipProvider>
            <DynamicFavicon />
            <IntegrationScripts />
            <Router />
            <Toaster />
          </TooltipProvider>
        </StoreProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
