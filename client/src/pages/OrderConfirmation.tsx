import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Truck, MapPin, CreditCard, ShoppingBag, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface OrderItem {
  id: string;
  title: string;
  sku: string;
  price: string;
  quantity: number;
  imageUrl: string;
}

interface Order {
  id: string;
  orderNumber: string;
  subtotal: string;
  discount: string;
  tax: string;
  shippingCost: string;
  total: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  items: OrderItem[];
}

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  const { data, isLoading, error } = useQuery<{ order: Order }>({
    queryKey: ["/api/orders/track", orderNumber],
    enabled: !!orderNumber,
  });

  const order = data?.order;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-16 w-16 mx-auto bg-muted rounded-full mb-4"></div>
          <div className="h-8 w-64 mx-auto bg-muted rounded mb-4"></div>
          <div className="h-4 w-48 mx-auto bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't find an order with that number. Please check your order number and try again.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/track-order">Track Another Order</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
      case "delivered":
        return "default";
      case "processing":
      case "shipped":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 mb-4">
          <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-order-success">
          Thank You for Your Order!
        </h1>
        <p className="text-muted-foreground text-lg">
          Your order has been placed successfully.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-xl">
              Order #{order.orderNumber}
            </CardTitle>
            <Badge variant={getStatusBadgeVariant(order.status)} data-testid="badge-order-status">
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <ShoppingBag className="h-4 w-4" />
                Order Items
              </h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4" data-testid={`order-item-${item.id}`}>
                    <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      <p className="text-sm">
                        {formatCurrency(parseFloat(item.price))} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(parseFloat(item.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4" />
                  Shipping Address
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4" />
                  Payment Details
                </h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Method:</span>{" "}
                    <span className="font-medium">
                      {order.paymentMethod === "cod" ? "Cash on Delivery" : "Card Payment"}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"} className="ml-1">
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(parseFloat(order.subtotal))}</span>
              </div>
              {parseFloat(order.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(parseFloat(order.discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {parseFloat(order.shippingCost) === 0
                    ? "Free"
                    : formatCurrency(parseFloat(order.shippingCost))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(parseFloat(order.tax))}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span data-testid="text-order-total">{formatCurrency(parseFloat(order.total))}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">What's Next?</h3>
              <p className="text-sm text-muted-foreground">
                {order.paymentMethod === "cod"
                  ? "We're preparing your order for shipment. You'll pay when it arrives at your doorstep."
                  : "Your payment has been confirmed. We're now preparing your order for shipment."}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                You can track your order status anytime using your order number.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild size="lg" data-testid="button-continue-shopping">
          <Link href="/">
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild data-testid="button-track-order">
          <Link href="/track-order">Track Your Order</Link>
        </Button>
        <Button variant="outline" size="lg" asChild data-testid="button-view-orders">
          <Link href="/account/orders">View All Orders</Link>
        </Button>
      </div>
    </div>
  );
}
