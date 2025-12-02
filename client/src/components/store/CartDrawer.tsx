import { Link } from "wouter";
import { ShoppingCart, Minus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/contexts/StoreContext";
import { formatCurrency } from "@/lib/currency";
import { useState } from "react";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { cartItems, cartCount, cartTotal, updateCartItem, removeFromCart, isCartLoading } = useStore();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-cart-drawer">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {cartCount > 99 ? "99+" : cartCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart ({cartCount})
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add some items to get started
            </p>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {cartItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={(quantity) => updateCartItem(item.id, quantity)}
                    onRemove={() => removeFromCart(item.id)}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatCurrency(cartTotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout
              </p>
              <div className="grid gap-2">
                <Button asChild onClick={() => setOpen(false)} data-testid="button-view-cart">
                  <Link href="/cart">View Cart</Link>
                </Button>
                <Button asChild variant="default" onClick={() => setOpen(false)} data-testid="button-checkout">
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface CartItemProps {
  item: {
    id: string;
    quantity: number;
    product: {
      id: string;
      title: string;
      slug: string;
      price: string;
      salePrice?: string | null;
      images?: { url: string; isPrimary?: boolean }[];
    };
    variant?: {
      optionName: string;
      optionValue: string;
      price?: string | null;
    } | null;
  };
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const price = item.variant?.price || item.product.salePrice || item.product.price;
  const imageUrl = item.product.images?.find(img => img.isPrimary)?.url 
    || item.product.images?.[0]?.url
    || "/placeholder-product.jpg";

  return (
    <div className="flex gap-4" data-testid={`cart-item-${item.id}`}>
      <Link href={`/product/${item.product.slug}`} className="shrink-0">
        <img
          src={imageUrl}
          alt={item.product.title}
          className="w-20 h-20 object-cover rounded-md"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/product/${item.product.slug}`}>
          <h4 className="font-medium text-sm line-clamp-2 hover:text-primary">
            {item.product.title}
          </h4>
        </Link>
        {item.variant && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.variant.optionName}: {item.variant.optionValue}
          </p>
        )}
        <p className="font-semibold text-sm mt-1">
          {formatCurrency(price)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
              data-testid={`button-decrease-${item.id}`}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              data-testid={`button-increase-${item.id}`}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={onRemove}
            data-testid={`button-remove-${item.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
