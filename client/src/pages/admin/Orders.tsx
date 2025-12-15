import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  MoreHorizontal,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";
import type { OrderWithItems, InvoiceSettings } from "@shared/schema";
import { defaultInvoiceSettings } from "@shared/schema";

function generateInvoiceHTML(order: OrderWithItems, settings: InvoiceSettings): string {
  const shippingAddress = order.shippingAddress as any || {};
  const billingAddress = order.billingAddress as any || shippingAddress;
  
  // Determine GST type based on seller state vs buyer state
  const sellerState = (settings.sellerState || "").toLowerCase().trim();
  const buyerState = (shippingAddress.state || "").toLowerCase().trim();
  const isInterState = sellerState && buyerState && sellerState !== buyerState;
  const gstType = isInterState ? "IGST" : "CGST+SGST";
  
  // Calculate GST for each item (GST is INCLUDED in price)
  interface ItemGST {
    gstRate: number;
    lineTotal: number;
    taxableAmount: number;
    includedGst: number;
    igst: number;
    cgst: number;
    sgst: number;
  }
  
  const itemGSTData: ItemGST[] = order.items.map((item) => {
    const itemPrice = parseFloat(item.price as string) || 0;
    const lineTotal = itemPrice * item.quantity;
    const gstRate = parseFloat((item as any).gstRate as string) || settings.gstPercentage || 18;
    // GST is included: includedGst = lineTotal * gstRate / (100 + gstRate)
    const includedGst = lineTotal * gstRate / (100 + gstRate);
    const taxableAmount = lineTotal - includedGst; // Base price without GST
    
    return {
      gstRate,
      lineTotal,
      taxableAmount,
      includedGst,
      igst: isInterState ? includedGst : 0,
      cgst: isInterState ? 0 : includedGst / 2,
      sgst: isInterState ? 0 : includedGst / 2,
    };
  });
  
  // Calculate totals
  const totalIGST = itemGSTData.reduce((sum, item) => sum + item.igst, 0);
  const totalCGST = itemGSTData.reduce((sum, item) => sum + item.cgst, 0);
  const totalSGST = itemGSTData.reduce((sum, item) => sum + item.sgst, 0);
  
  // Build items HTML with GST columns (GST is included in price)
  const itemsHTML = order.items.map((item, index) => {
    const gst = itemGSTData[index];
    return `
    <tr>
      <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${item.title}${settings.showSKU ? `<br><span style="color: #6b7280; font-size: 11px;">SKU: ${item.sku || 'N/A'}</span>` : ''}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${CURRENCY_SYMBOL}${parseFloat(item.price as string).toFixed(2)}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${CURRENCY_SYMBOL}${gst.taxableAmount.toFixed(2)}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${gst.gstRate}%</td>
      ${isInterState ? `
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${CURRENCY_SYMBOL}${gst.igst.toFixed(2)}</td>
      ` : `
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${CURRENCY_SYMBOL}${gst.cgst.toFixed(2)}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${CURRENCY_SYMBOL}${gst.sgst.toFixed(2)}</td>
      `}
      <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${CURRENCY_SYMBOL}${gst.lineTotal.toFixed(2)}</td>
    </tr>
  `}).join('');

  const orderDate = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : 'N/A';
  
  const subtotal = parseFloat(order.subtotal as string) || 0;
  const discount = parseFloat(order.discount as string) || 0;
  const tax = parseFloat(order.tax as string) || 0;
  const shipping = parseFloat(order.shippingCost as string) || 0;
  const total = parseFloat(order.total as string) || 0;
  
  const sellerAddressLine = [
    settings.sellerAddress,
    [settings.sellerCity, settings.sellerState, settings.sellerPostalCode].filter(Boolean).join(', '),
    settings.sellerCountry
  ].filter(Boolean).join('<br>');

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
        .company-info p { color: #6b7280; font-size: 13px; }
        .company-logo { max-height: 60px; margin-bottom: 10px; }
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
        .summary-row.discount { color: #16a34a; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
        .gst-note { background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; color: #0369a1; }
        .terms { margin-top: 20px; padding: 12px; background-color: #f9fafb; border-radius: 6px; font-size: 12px; color: #6b7280; }
        .terms h4 { margin-bottom: 8px; color: #374151; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            Print Invoice
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
            Close
          </button>
        </div>

        <div class="header">
          <div class="company-info">
            ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="${settings.sellerName}" class="company-logo" />` : ''}
            <h1>${settings.sellerName || 'Your Store'}</h1>
            ${sellerAddressLine ? `<p>${sellerAddressLine}</p>` : ''}
            ${settings.sellerPhone ? `<p>Phone: ${settings.sellerPhone}</p>` : ''}
            ${settings.sellerEmail ? `<p>Email: ${settings.sellerEmail}</p>` : ''}
            ${settings.gstNumber ? `<p><strong>GSTIN:</strong> ${settings.gstNumber}</p>` : ''}
          </div>
          <div class="invoice-details">
            <h2>TAX INVOICE</h2>
            <p><strong>Invoice #:</strong> ${order.orderNumber}</p>
            <p><strong>Date:</strong> ${orderDate}</p>
            ${settings.showPaymentMethod ? `<p><strong>Payment:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>` : ''}
          </div>
        </div>

        <div class="addresses">
          <div class="address-block">
            <h3>Bill To</h3>
            <p><strong>${billingAddress.name || 'Customer'}</strong></p>
            <p>${billingAddress.line1 || billingAddress.address1 || ''}</p>
            ${billingAddress.line2 || billingAddress.address2 ? `<p>${billingAddress.line2 || billingAddress.address2}</p>` : ''}
            <p>${billingAddress.city || ''}, ${billingAddress.state || ''} ${billingAddress.postalCode || ''}</p>
            <p>${billingAddress.country || ''}</p>
            ${billingAddress.phone ? `<p>${settings.buyerLabelPhone}: ${billingAddress.phone}</p>` : ''}
          </div>
          <div class="address-block">
            <h3>Ship To</h3>
            <p><strong>${shippingAddress.name || 'Customer'}</strong></p>
            <p>${shippingAddress.line1 || shippingAddress.address1 || ''}</p>
            ${shippingAddress.line2 || shippingAddress.address2 ? `<p>${shippingAddress.line2 || shippingAddress.address2}</p>` : ''}
            <p>${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.postalCode || ''}</p>
            <p>${shippingAddress.country || ''}</p>
            ${shippingAddress.phone ? `<p>${settings.buyerLabelPhone}: ${shippingAddress.phone}</p>` : ''}
          </div>
        </div>

        ${settings.showTaxBreakdown && settings.gstNumber ? `
        <div class="gst-note">
          <strong>GST Note:</strong> GST is included in product prices as per Government of India regulations. ${isInterState 
            ? 'This is an inter-state supply (IGST).' 
            : 'This is an intra-state supply (CGST + SGST).'}
          ${settings.gstNumber ? ` Seller GSTIN: ${settings.gstNumber}` : ''}<br>
          <span style="font-size: 11px; color: #64748b;">This is a computer-generated invoice and does not require a signature.</span>
        </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th style="width: 35px; font-size: 12px;">#</th>
              <th style="font-size: 12px;">Item Description</th>
              <th style="width: 50px; font-size: 12px; text-align: center;">Qty</th>
              <th style="width: 80px; font-size: 12px; text-align: right;">Unit Price</th>
              <th style="width: 80px; font-size: 12px; text-align: right;">Taxable</th>
              <th style="width: 50px; font-size: 12px; text-align: center;">GST%</th>
              ${isInterState ? `
                <th style="width: 80px; font-size: 12px; text-align: right;">IGST</th>
              ` : `
                <th style="width: 70px; font-size: 12px; text-align: right;">CGST</th>
                <th style="width: 70px; font-size: 12px; text-align: right;">SGST</th>
              `}
              <th style="width: 90px; font-size: 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-table">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${CURRENCY_SYMBOL}${subtotal.toFixed(2)}</span>
            </div>
            ${settings.showDiscountLine && discount > 0 ? `
            <div class="summary-row discount">
              <span>Discount:</span>
              <span>-${CURRENCY_SYMBOL}${discount.toFixed(2)}</span>
            </div>
            ` : ''}
            ${settings.showShippingCost ? `
            <div class="summary-row">
              <span>Shipping:</span>
              <span>${shipping === 0 ? 'Free' : CURRENCY_SYMBOL + shipping.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="summary-row total">
              <span>Total:</span>
              <span>${CURRENCY_SYMBOL}${total.toFixed(2)}</span>
            </div>
            ${settings.showTaxBreakdown ? `
              <div class="summary-row" style="font-size: 12px; color: #6b7280;">
                <span>Incl. GST${isInterState ? ' (IGST)' : ' (CGST+SGST)'}:</span>
                <span>${CURRENCY_SYMBOL}${(totalIGST + totalCGST + totalSGST).toFixed(2)}</span>
              </div>
            ` : ''}
          </div>
        </div>

        ${settings.termsAndConditions ? `
        <div class="terms">
          <h4>Terms & Conditions</h4>
          <p>${settings.termsAndConditions.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>${settings.footerNote || 'Thank you for your business!'}</p>
          <p style="margin-top: 5px;">${settings.buyerLabelEmail}: ${order.user?.email || order.guestEmail || 'N/A'}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function fetchInvoiceSettings(): Promise<InvoiceSettings> {
  try {
    const response = await fetch('/api/settings/invoice');
    if (response.ok) {
      const data = await response.json();
      return { ...defaultInvoiceSettings, ...data.settings };
    }
  } catch (error) {
    console.error('Failed to fetch invoice settings:', error);
  }
  return defaultInvoiceSettings;
}

async function openInvoice(order: OrderWithItems) {
  const settings = await fetchInvoiceSettings();
  const invoiceHTML = generateInvoiceHTML(order, settings);
  const invoiceWindow = window.open('', '_blank');
  if (invoiceWindow) {
    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
  }
}

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [updateStatusOrder, setUpdateStatusOrder] = useState<OrderWithItems | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ orders: OrderWithItems[]; total: number }>({
    queryKey: ["/api/admin/orders", { search, status: statusFilter !== "all" ? statusFilter : undefined, orderType: orderTypeFilter !== "all" ? orderTypeFilter : undefined }],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, tracking }: { id: string; status: string; tracking?: string }) => {
      await apiRequest("PATCH", `/api/admin/orders/${id}/status`, { status, trackingNumber: tracking });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order status updated" });
      setUpdateStatusOrder(null);
    },
    onError: () => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  const orders = data?.orders || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "delivered":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">View and manage customer orders</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-orders"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-order-type-filter">
              <SelectValue placeholder="All Orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="online">Online Orders</SelectItem>
              <SelectItem value="pos">POS Sales</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <Badge variant={(order as any).orderType === "pos" ? "secondary" : "outline"}>
                        {(order as any).orderType === "pos" ? "POS" : "Online"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(order as any).orderType === "pos" 
                        ? ((order as any).posCustomerName || "Walk-in Customer")
                        : (order.user?.email || order.guestEmail || "Guest")}
                    </TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.paymentStatus === "paid" ? "default" : "outline"}>
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.createdAt!).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openInvoice(order)} data-testid={`button-invoice-${order.id}`}>
                            <FileText className="h-4 w-4 mr-2" />
                            Download Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setUpdateStatusOrder(order);
                            setNewStatus(order.status);
                            setTrackingNumber(order.trackingNumber || "");
                          }}>
                            <Package className="h-4 w-4 mr-2" />
                            Update Status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order {selectedOrder?.orderNumber}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Order Type</h4>
                    <Badge variant={(selectedOrder as any).orderType === "pos" ? "secondary" : "outline"}>
                      {(selectedOrder as any).orderType === "pos" ? "POS Sale" : "Online Order"}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Status</h4>
                    <Badge variant={getStatusVariant(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Customer</h4>
                    <p className="text-sm">
                      {(selectedOrder as any).orderType === "pos" 
                        ? ((selectedOrder as any).posCustomerName || "Walk-in Customer")
                        : (selectedOrder.user?.email || selectedOrder.guestEmail || "Guest")}
                    </p>
                    {(selectedOrder as any).orderType === "pos" && (selectedOrder as any).posCustomerPhone && (
                      <p className="text-xs text-muted-foreground">{(selectedOrder as any).posCustomerPhone}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Payment</h4>
                    <p className="text-sm capitalize">
                      {(selectedOrder as any).orderType === "pos" 
                        ? ((selectedOrder as any).posPaymentType || "cash")
                        : (selectedOrder.paymentMethod || "online")}
                    </p>
                  </div>
                </div>

                {(selectedOrder as any).orderType !== "pos" && (
                  <div>
                    <h4 className="font-medium mb-2">Shipping Address</h4>
                    {selectedOrder.shippingAddress && (
                      <p className="text-sm text-muted-foreground">
                        {String((selectedOrder.shippingAddress as any).address1 || "")}<br />
                        {String((selectedOrder.shippingAddress as any).city || "")}, {String((selectedOrder.shippingAddress as any).state || "")} {String((selectedOrder.shippingAddress as any).postalCode || "")}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <img
                          src={item.imageUrl || "/placeholder-product.jpg"}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(parseFloat(item.price as string) * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={() => openInvoice(selectedOrder)} 
                    className="w-full"
                    data-testid="button-dialog-invoice"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Invoice
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!updateStatusOrder} onOpenChange={() => setUpdateStatusOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger data-testid="select-new-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newStatus === "shipped" && (
                <div className="space-y-2">
                  <Label>Tracking Number</Label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    data-testid="input-tracking-number"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateStatusOrder(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateStatusOrder && updateStatusMutation.mutate({
                  id: updateStatusOrder.id,
                  status: newStatus,
                  tracking: trackingNumber,
                })}
                disabled={updateStatusMutation.isPending}
                data-testid="button-update-status"
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
