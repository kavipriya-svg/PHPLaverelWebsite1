import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import ProductDetail from "@/pages/ProductDetail";
import CategoryPage from "@/pages/CategoryPage";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import TrackOrder from "@/pages/TrackOrder";
import SearchResults from "@/pages/SearchResults";
import SpecialOffers from "@/pages/SpecialOffers";
import Account from "@/pages/Account";
import AccountOrders from "@/pages/AccountOrders";
import Wishlist from "@/pages/Wishlist";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/Products";
import AdminProductForm from "@/pages/admin/ProductForm";
import AdminCategories from "@/pages/admin/Categories";
import AdminOrders from "@/pages/admin/Orders";
import AdminBanners from "@/pages/admin/Banners";
import AdminCoupons from "@/pages/admin/Coupons";
import AdminBrands from "@/pages/admin/Brands";
import AdminHomeBlocks from "@/pages/admin/HomeBlocks";
import AdminSettings from "@/pages/admin/Settings";
import AdminUsers from "@/pages/admin/Users";

function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
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
      
      <Route path="/track-order">
        <StoreLayout>
          <TrackOrder />
        </StoreLayout>
      </Route>
      
      <Route path="/search">
        <StoreLayout>
          <SearchResults />
        </StoreLayout>
      </Route>
      
      <Route path="/special-offers">
        <StoreLayout>
          <SpecialOffers />
        </StoreLayout>
      </Route>
      
      <Route path="/account">
        <StoreLayout>
          <Account />
        </StoreLayout>
      </Route>
      
      <Route path="/account/orders">
        <StoreLayout>
          <AccountOrders />
        </StoreLayout>
      </Route>
      
      <Route path="/wishlist">
        <StoreLayout>
          <Wishlist />
        </StoreLayout>
      </Route>

      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/products/:id" component={AdminProductForm} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/banners" component={AdminBanners} />
      <Route path="/admin/coupons" component={AdminCoupons} />
      <Route path="/admin/brands" component={AdminBrands} />
      <Route path="/admin/home-blocks" component={AdminHomeBlocks} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/users" component={AdminUsers} />

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
