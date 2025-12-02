import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Truck, MapPin, CreditCard, ShoppingBag, ArrowRight, FileText, Download } from "lucide-react";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";

const GST_PERCENTAGE = 8;

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

function generateInvoiceHTML(order: Order): string {
  const itemsHTML = order.items.map((item, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.title}<br><span style="color: #6b7280; font-size: 12px;">SKU: ${item.sku}</span></td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${CURRENCY_SYMBOL}${parseFloat(item.price).toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${CURRENCY_SYMBOL}${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${order.orderNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.5; }
        .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
        .company-info h1 { font-size: 28px; color: #2563eb; margin-bottom: 5px; }
        .invoice-details { text-align: right; }
        .invoice-details h2 { font-size: 24px; color: #1f2937; margin-bottom: 10px; }
        .invoice-details p { color: #6b7280; font-size: 14px; }
        .addresses { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .address-block { width: 45%; }
        .address-block h3 { font-size: 14px; color: #6b7280; text-transform: uppercase; margin-bottom: 10px; }
        .address-block p { font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        thead { background-color: #f3f4f6; }
        th { padding: 12px; text-align: left; font-weight: 600; font-size: 14px; color: #374151; }
        th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: right; }
        th:nth-child(3) { text-align: center; }
        .summary { display: flex; justify-content: flex-end; }
        .summary-table { width: 300px; }
        .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .summary-row.total { border-top: 2px solid #1f2937; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
        .gst-note { background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; color: #0369a1; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .invoice { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <div class="company-info">
            <h1>ShopHub</h1>
            <p style="color: #6b7280; font-size: 14px;">Your One-Stop Shopping Destination</p>
          </div>
          <div class="invoice-details">
            <h2>TAX INVOICE</h2>
            <p><strong>Invoice No:</strong> ${order.orderNumber}</p>
            <p><strong>Date:</strong> ${orderDate}</p>
            <p><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
          </div>
        </div>

        <div class="addresses">
          <div class="address-block">
            <h3>Bill To / Ship To</h3>
            <p><strong>${order.shippingAddress.name}</strong></p>
            <p>${order.shippingAddress.line1}</p>
            ${order.shippingAddress.line2 ? `<p>${order.shippingAddress.line2}</p>` : ''}
            <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
            <p>${order.shippingAddress.country}</p>
          </div>
          <div class="address-block">
            <h3>Payment Information</h3>
            <p><strong>Method:</strong> ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Card Payment"}</p>
            <p><strong>Payment Status:</strong> ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Item Description</th>
              <th style="width: 80px; text-align: center;">Qty</th>
              <th style="width: 120px; text-align: right;">Unit Price</th>
              <th style="width: 120px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="gst-note">
          <strong>GST Note:</strong> GST @ ${GST_PERCENTAGE}% is included in the total amount as per Government of India regulations.
        </div>

        <div class="summary">
          <div class="summary-table">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${CURRENCY_SYMBOL}${parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            ${parseFloat(order.discount) > 0 ? `
              <div class="summary-row" style="color: #16a34a;">
                <span>Discount</span>
                <span>-${CURRENCY_SYMBOL}${parseFloat(order.discount).toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="summary-row">
              <span>Shipping</span>
              <span>${parseFloat(order.shippingCost) === 0 ? 'Free' : `${CURRENCY_SYMBOL}${parseFloat(order.shippingCost).toFixed(2)}`}</span>
            </div>
            <div class="summary-row">
              <span>GST (${GST_PERCENTAGE}%)</span>
              <span>${CURRENCY_SYMBOL}${parseFloat(order.tax).toFixed(2)}</span>
            </div>
            <div class="summary-row total">
              <span>Total</span>
              <span>${CURRENCY_SYMBOL}${parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for shopping with ShopHub!</p>
          <p style="margin-top: 5px;">This is a computer-generated invoice and does not require a signature.</p>
          <p style="margin-top: 10px;">For any queries, please contact support@shophub.com</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="background-color: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-right: 10px;">
            Print Invoice
          </button>
          <button onclick="window.close()" style="background-color: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
            Close
          </button>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  const { data, isLoading, error } = useQuery<{ order: Order }>({
    queryKey: ["/api/orders/track", orderNumber],
    enabled: !!orderNumber,
  });

  const order = data?.order;

  const handleExportInvoice = () => {
    if (!order) return;
    
    const invoiceHTML = generateInvoiceHTML(order);
    const invoiceWindow = window.open('', '_blank');
    if (invoiceWindow) {
      invoiceWindow.document.write(invoiceHTML);
      invoiceWindow.document.close();
    }
  };

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
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(order.status)} data-testid="badge-order-status">
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportInvoice}
                data-testid="button-export-invoice"
              >
                <FileText className="h-4 w-4 mr-1" />
                Invoice
              </Button>
            </div>
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
                <span className="text-muted-foreground">GST ({GST_PERCENTAGE}%)</span>
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

      <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
        <Button onClick={handleExportInvoice} size="lg" variant="outline" data-testid="button-download-invoice">
          <Download className="mr-2 h-4 w-4" />
          Download Invoice
        </Button>
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
