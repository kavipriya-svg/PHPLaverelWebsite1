import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, Truck, CheckCircle, Clock, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Order } from "@shared/schema";

const trackOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  email: z.string().email("Please enter a valid email address"),
});

type TrackOrderForm = z.infer<typeof trackOrderSchema>;

interface TrackingUpdate {
  date: string;
  status: string;
  location?: string;
  description?: string;
}

export function OrderTracker() {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TrackOrderForm>({
    resolver: zodResolver(trackOrderSchema),
    defaultValues: {
      orderNumber: "",
      email: "",
    },
  });

  const trackMutation = useMutation({
    mutationFn: async (data: TrackOrderForm) => {
      const response = await apiRequest("POST", "/api/orders/track", data);
      return response as { order: Order };
    },
    onSuccess: (data) => {
      setOrder(data.order);
      setError(null);
    },
    onError: () => {
      setOrder(null);
      setError("Order not found. Please check your order number and email.");
    },
  });

  const onSubmit = (data: TrackOrderForm) => {
    trackMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5" />;
      case "processing":
        return <Package className="h-5 w-5" />;
      case "shipped":
        return <Truck className="h-5 w-5" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5" />;
      case "cancelled":
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-500";
      case "processing":
        return "text-blue-500";
      case "shipped":
        return "text-purple-500";
      case "delivered":
        return "text-green-500";
      case "cancelled":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const orderStatuses = ["pending", "processing", "shipped", "delivered"];
  const currentStatusIndex = order ? orderStatuses.indexOf(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Track Your Order
          </CardTitle>
          <CardDescription>
            Enter your order number and email to track your order status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., ORD-123456"
                        {...field}
                        data-testid="input-order-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                        data-testid="input-tracking-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={trackMutation.isPending}
                data-testid="button-track-order"
              >
                {trackMutation.isPending ? "Tracking..." : "Track Order"}
              </Button>
            </form>
          </Form>

          {error && (
            <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {order && (
            <div className="mt-8 space-y-6">
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Placed on {new Date(order.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="font-medium capitalize">{order.status}</span>
                  </div>
                </div>

                {order.status !== "cancelled" && (
                  <div className="relative">
                    <div className="flex justify-between mb-2">
                      {orderStatuses.map((status, index) => (
                        <div
                          key={status}
                          className={`flex flex-col items-center ${
                            index <= currentStatusIndex
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              index <= currentStatusIndex
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {index < currentStatusIndex ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              getStatusIcon(status)
                            )}
                          </div>
                          <span className="text-xs mt-1 capitalize">{status}</span>
                        </div>
                      ))}
                    </div>
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted -z-10">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${(currentStatusIndex / (orderStatuses.length - 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {order.trackingNumber && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-2">Tracking Information</h3>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Tracking Number: </span>
                    <span className="font-mono">{order.trackingNumber}</span>
                  </p>
                  {order.trackingStatus && (
                    <p className="text-sm mt-1">
                      <span className="text-muted-foreground">Status: </span>
                      {order.trackingStatus}
                    </p>
                  )}
                </div>
              )}

              {order.trackingUpdates && Array.isArray(order.trackingUpdates) && order.trackingUpdates.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Shipping Updates</h3>
                  <div className="space-y-4">
                    {(order.trackingUpdates as TrackingUpdate[]).map((update, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          {index < (order.trackingUpdates as TrackingUpdate[]).length - 1 && (
                            <div className="w-0.5 flex-1 bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-sm">{update.status}</p>
                          {update.description && (
                            <p className="text-sm text-muted-foreground">{update.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(update.date).toLocaleString()}
                            {update.location && ` • ${update.location}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-2">Order Total</h3>
                <p className="text-2xl font-bold">${parseFloat(order.total as string).toFixed(2)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
