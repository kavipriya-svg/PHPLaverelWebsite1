import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface SalesTrendData {
  date: string;
  revenue: number;
  orders: number;
}

interface OrderStatus {
  status: string;
  count: number;
}

interface MostReviewedProduct {
  id: string;
  title: string;
  reviewCount: number;
  price: number;
  stock: number;
}

interface AnalyticsData {
  salesTrend: SalesTrendData[];
  ordersByStatus: OrderStatus[];
  mostReviewedProducts: MostReviewedProduct[];
  summary: {
    periodRevenue: number;
    periodOrders: number;
    avgOrderValue: number;
    revenueGrowth: number | null;
  };
}

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#ef4444",
  refunded: "#6b7280",
};

export default function AdminAnalytics() {
  const [period, setPeriod] = useState("30days");

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics", { period }],
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track your store performance and insights</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]" data-testid="select-period">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Period Revenue"
            value={formatCurrency(data?.summary?.periodRevenue || 0)}
            icon={DollarSign}
            trend={data?.summary?.revenueGrowth}
            isLoading={isLoading}
          />
          <SummaryCard
            title="Total Orders"
            value={data?.summary?.periodOrders?.toString() || "0"}
            icon={ShoppingCart}
            isLoading={isLoading}
          />
          <SummaryCard
            title="Avg Order Value"
            value={formatCurrency(data?.summary?.avgOrderValue || 0)}
            icon={BarChart3}
            isLoading={isLoading}
          />
          <SummaryCard
            title="Growth Rate"
            value={data?.summary?.revenueGrowth !== null && data?.summary?.revenueGrowth !== undefined
              ? `${data.summary.revenueGrowth}%`
              : "N/A"}
            icon={data?.summary?.revenueGrowth && data.summary.revenueGrowth >= 0 ? TrendingUp : TrendingDown}
            trend={data?.summary?.revenueGrowth}
            isLoading={isLoading}
          />
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue Trend</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">Order Status</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">Top Products</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>Daily revenue and order count for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.salesTrend || []}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tickFormatter={(value) => `₹${value}`}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === "revenue" ? formatCurrency(value) : value,
                            name === "revenue" ? "Revenue" : "Orders",
                          ]}
                          labelFormatter={formatDate}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--primary))"
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          strokeWidth={2}
                          name="Revenue"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders Per Day</CardTitle>
                <CardDescription>Number of orders placed each day</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.salesTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <Tooltip
                          labelFormatter={formatDate}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="orders"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                          name="Orders"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Orders by Status</CardTitle>
                  <CardDescription>Distribution of orders across different statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data?.ordersByStatus || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="count"
                            nameKey="status"
                            label={({ status, count }) => `${status}: ${count}`}
                          >
                            {(data?.ordersByStatus || []).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={STATUS_COLORS[entry.status] || "#6b7280"}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Breakdown</CardTitle>
                  <CardDescription>Detailed view of order statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-12" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(data?.ordersByStatus || []).map((status) => {
                        const total = data?.ordersByStatus?.reduce((sum, s) => sum + s.count, 0) || 1;
                        const percentage = Math.round((status.count / total) * 100);
                        return (
                          <div key={status.status} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: STATUS_COLORS[status.status] || "#6b7280" }}
                                />
                                <span className="font-medium capitalize">{status.status}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{status.count} orders</span>
                                <Badge variant="secondary">{percentage}%</Badge>
                              </div>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: STATUS_COLORS[status.status] || "#6b7280",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Most Reviewed Products</CardTitle>
                <CardDescription>Products ranked by customer engagement (review count)</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(data?.mostReviewedProducts || []).map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`product-row-${product.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{product.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.reviewCount} reviews | Stock: {product.stock}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(product.price)}</p>
                          <p className="text-sm text-muted-foreground">unit price</p>
                        </div>
                      </div>
                    ))}
                    {(!data?.mostReviewedProducts || data.mostReviewedProducts.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">No product data available</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Engagement</CardTitle>
                <CardDescription>Visual comparison of product review counts</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(data?.mostReviewedProducts || []).slice(0, 8)}
                        layout="vertical"
                        margin={{ left: 100 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="title"
                          tick={{ fontSize: 11 }}
                          width={90}
                          tickFormatter={(value) =>
                            value.length > 15 ? value.substring(0, 15) + "..." : value
                          }
                        />
                        <Tooltip
                          formatter={(value: number) => [value, "Reviews"]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="reviewCount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Reviews" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  trend,
  isLoading,
}: {
  title: string;
  value: string;
  icon: typeof DollarSign;
  trend?: number | null;
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
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{value}</div>
            {trend !== undefined && trend !== null && (
              <Badge variant={trend >= 0 ? "default" : "destructive"} className="text-xs">
                {trend >= 0 ? "+" : ""}
                {trend}%
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
