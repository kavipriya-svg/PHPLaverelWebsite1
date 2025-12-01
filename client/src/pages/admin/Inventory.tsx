import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Package, Bell, Send, RefreshCw, Search, Mail } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductWithDetails } from "@shared/schema";

export default function AdminInventory() {
  const { toast } = useToast();
  const [threshold, setThreshold] = useState("10");
  const [adminEmail, setAdminEmail] = useState("");

  const { data: lowStockData, isLoading, refetch } = useQuery<{ products: ProductWithDetails[] }>({
    queryKey: ["/api/admin/inventory/low-stock", { threshold: parseInt(threshold) || 10 }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/inventory/low-stock?threshold=${threshold}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery<{ notifications: any[] }>({
    queryKey: ["/api/admin/inventory/notifications"],
  });

  const sendAlertMutation = useMutation({
    mutationFn: async (productIds?: string[]) => {
      return apiRequest("POST", "/api/admin/inventory/send-low-stock-alerts", {
        productIds,
        adminEmail: adminEmail || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Alert sent",
        description: "Low stock alert has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send low stock alert.",
        variant: "destructive",
      });
    },
  });

  const processRestockMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest("POST", "/api/admin/inventory/process-restock-notifications", {
        productId,
      });
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory/notifications"] });
      toast({
        title: "Notifications sent",
        description: "Restock notifications have been sent to subscribers.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send restock notifications.",
        variant: "destructive",
      });
    },
  });

  const lowStockProducts = lowStockData?.products || [];
  const notifications = notificationsData?.notifications || [];

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    } else if (stock <= threshold / 2) {
      return { label: "Critical", variant: "destructive" as const };
    } else if (stock <= threshold) {
      return { label: "Low", variant: "secondary" as const };
    }
    return { label: "OK", variant: "outline" as const };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Monitor stock levels and manage restock notifications</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold">
                  {isLoading ? "..." : lowStockProducts.length}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">
                  {isLoading ? "..." : lowStockProducts.filter(p => p.stock === 0).length}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">
                  {notificationsLoading ? "..." : notifications.filter((n: any) => !n.stock_notifications?.isNotified).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Low Stock Products</CardTitle>
                <CardDescription>
                  Products that are below their stock threshold or out of stock
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="threshold" className="whitespace-nowrap">Threshold:</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-20"
                    min="1"
                    data-testid="input-threshold"
                  />
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No low stock products found</p>
                <p className="text-sm">All products are above the threshold</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="adminEmail">Alert Email:</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-64"
                      data-testid="input-admin-email"
                    />
                  </div>
                  <Button
                    onClick={() => sendAlertMutation.mutate()}
                    disabled={sendAlertMutation.isPending}
                    data-testid="button-send-alerts"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send All Alerts
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead className="text-center">Threshold</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Restock Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockProducts.map((product) => {
                      const status = getStockStatus(product.stock || 0, product.lowStockThreshold || 10);
                      const pendingNotifications = notifications.filter(
                        (n: any) => n.stock_notifications?.productId === product.id && !n.stock_notifications?.isNotified
                      ).length;
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.images?.[0]?.url && (
                                <img
                                  src={product.images[0].url}
                                  alt={product.title}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <div className="font-medium line-clamp-1">{product.title}</div>
                                {product.brand?.name && (
                                  <div className="text-sm text-muted-foreground">{product.brand.name}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-bold ${product.stock === 0 ? "text-red-600" : product.stock! <= 5 ? "text-amber-600" : ""}`}>
                              {product.stock}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {product.lowStockThreshold || 10}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {product.warehouseLocation || "-"}
                          </TableCell>
                          <TableCell>
                            {product.restockDate 
                              ? new Date(product.restockDate).toLocaleDateString()
                              : "-"
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {product.stock && product.stock > 0 && pendingNotifications > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => processRestockMutation.mutate(product.id)}
                                  disabled={processRestockMutation.isPending}
                                  title={`${pendingNotifications} pending notification(s)`}
                                >
                                  <Mail className="h-4 w-4 mr-1" />
                                  Notify ({pendingNotifications})
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => sendAlertMutation.mutate([product.id])}
                                disabled={sendAlertMutation.isPending}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backorder Products</CardTitle>
            <CardDescription>
              Products configured to accept orders even when out of stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              (() => {
                const backorderProducts = lowStockProducts.filter(p => p.allowBackorder && p.stock === 0);
                if (backorderProducts.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No backorder products</p>
                    </div>
                  );
                }
                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead>Expected Restock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backorderProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.images?.[0]?.url && (
                                <img
                                  src={product.images[0].url}
                                  alt={product.title}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <span className="font-medium">{product.title}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Backorder Enabled
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {product.restockDate 
                              ? new Date(product.restockDate).toLocaleDateString()
                              : "Not scheduled"
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );
              })()
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
