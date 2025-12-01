import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  revenue: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    total: string;
    status: string;
    createdAt: string;
  }[];
  lowStockProducts: {
    id: string;
    title: string;
    stock: number;
  }[];
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<{ stats: DashboardStats }>({
    queryKey: ["/api/admin/dashboard"],
  });

  const stats = data?.stats;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your store admin panel</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={stats?.revenue ? `$${stats.revenue.toLocaleString()}` : "$0"}
            icon={DollarSign}
            description="All time revenue"
            isLoading={isLoading}
          />
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders?.toString() || "0"}
            icon={ShoppingCart}
            description="All orders"
            isLoading={isLoading}
          />
          <StatCard
            title="Products"
            value={stats?.totalProducts?.toString() || "0"}
            icon={Package}
            description="Active products"
            isLoading={isLoading}
          />
          <StatCard
            title="Customers"
            value={stats?.totalUsers?.toString() || "0"}
            icon={Users}
            description="Registered users"
            isLoading={isLoading}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from your store</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/orders">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : stats?.recentOrders?.length ? (
                <div className="space-y-4">
                  {stats.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">${parseFloat(order.total).toFixed(2)}</span>
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No orders yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Low Stock Alert</CardTitle>
                <CardDescription>Products running low on inventory</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/products">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : stats?.lowStockProducts?.length ? (
                <div className="space-y-4">
                  {stats.lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <p className="font-medium truncate max-w-[200px]">{product.title}</p>
                      <Badge variant="destructive">
                        {product.stock} left
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">All products well stocked</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover-elevate cursor-pointer">
            <Link href="/admin/products/new">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Add Product</h3>
                  <p className="text-sm text-muted-foreground">Create a new product</p>
                </div>
              </CardContent>
            </Link>
          </Card>
          <Card className="hover-elevate cursor-pointer">
            <Link href="/admin/orders">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Orders</h3>
                  <p className="text-sm text-muted-foreground">View and update orders</p>
                </div>
              </CardContent>
            </Link>
          </Card>
          <Card className="hover-elevate cursor-pointer">
            <Link href="/admin/coupons/new">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Create Coupon</h3>
                  <p className="text-sm text-muted-foreground">Add discount codes</p>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
}: {
  title: string;
  value: string;
  icon: typeof DollarSign;
  description: string;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "delivered":
      return "default";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}
