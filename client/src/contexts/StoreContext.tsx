import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CartItemWithProduct, ProductWithDetails } from "@shared/schema";

interface StoreContextType {
  cartItems: CartItemWithProduct[];
  cartCount: number;
  cartTotal: number;
  isCartLoading: boolean;
  addToCart: (productId: string, quantity?: number, variantId?: string, comboOfferId?: string) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  wishlistItems: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cartData, isLoading: isCartLoading } = useQuery<{ items: CartItemWithProduct[] }>({
    queryKey: ["/api/cart"],
  });

  const { data: wishlistData } = useQuery<{ items: { productId: string }[] }>({
    queryKey: ["/api/wishlist"],
  });

  const cartItems = cartData?.items || [];
  const wishlistItems = wishlistData?.items?.map(item => item.productId) || [];

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => {
    const price = item.variant?.price || item.product.salePrice || item.product.price;
    return sum + (parseFloat(price as string) * item.quantity);
  }, 0);

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity, variantId, comboOfferId }: { productId: string; quantity: number; variantId?: string; comboOfferId?: string }) => {
      await apiRequest("POST", "/api/cart", { productId, quantity, variantId, comboOfferId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      await apiRequest("PATCH", `/api/cart/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("DELETE", `/api/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const isInList = wishlistItems.includes(productId);
      if (isInList) {
        await apiRequest("DELETE", `/api/wishlist/${productId}`);
      } else {
        await apiRequest("POST", "/api/wishlist", { productId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    },
  });

  const addToCart = useCallback(async (productId: string, quantity = 1, variantId?: string, comboOfferId?: string) => {
    await addToCartMutation.mutateAsync({ productId, quantity, variantId, comboOfferId });
  }, [addToCartMutation]);

  const updateCartItem = useCallback(async (itemId: string, quantity: number) => {
    await updateCartMutation.mutateAsync({ itemId, quantity });
  }, [updateCartMutation]);

  const removeFromCart = useCallback(async (itemId: string) => {
    await removeFromCartMutation.mutateAsync(itemId);
  }, [removeFromCartMutation]);

  const clearCart = useCallback(async () => {
    await clearCartMutation.mutateAsync();
  }, [clearCartMutation]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.includes(productId);
  }, [wishlistItems]);

  const toggleWishlist = useCallback(async (productId: string) => {
    await toggleWishlistMutation.mutateAsync(productId);
  }, [toggleWishlistMutation]);

  return (
    <StoreContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        isCartLoading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        wishlistItems,
        isInWishlist,
        toggleWishlist,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
