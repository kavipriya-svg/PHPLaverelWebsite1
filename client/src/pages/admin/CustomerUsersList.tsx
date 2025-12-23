import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, MoreHorizontal, User as UserIcon, Mail, Phone, ShoppingBag, Download, FileText, FileSpreadsheet, FileType, File, ArrowLeft, MapPin, Receipt, ChevronDown, ChevronUp, Package, Truck, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { User, Address, OrderWithItems, InvoiceSettings } from "@shared/schema";
import { defaultInvoiceSettings } from "@shared/schema";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface CustomerWithStats extends User {
  orderCount?: number;
  totalSpent?: number;
}

interface CustomerDetailsResponse {
  customer: User;
  orders: OrderWithItems[];
  addresses: Address[];
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

function generateInvoiceHTML(order: OrderWithItems, settings: InvoiceSettings): string {
  const shippingAddress = order.shippingAddress as any || {};
  const billingAddress = order.billingAddress as any || shippingAddress;
  
  const sellerState = (settings.sellerState || "").toLowerCase().trim();
  const buyerState = (shippingAddress.state || "").toLowerCase().trim();
  const isInterState = sellerState && buyerState && sellerState !== buyerState;
  
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
    const includedGst = lineTotal * gstRate / (100 + gstRate);
    const taxableAmount = lineTotal - includedGst;
    
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
  
  const totalIGST = itemGSTData.reduce((sum, item) => sum + item.igst, 0);
  const totalCGST = itemGSTData.reduce((sum, item) => sum + item.cgst, 0);
  const totalSGST = itemGSTData.reduce((sum, item) => sum + item.sgst, 0);
  
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
        .summary { display: flex; justify-content: flex-end; }
        .summary-table { width: 300px; }
        .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .summary-row.total { border-top: 2px solid #1f2937; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: bold; }
        .summary-row.discount { color: #16a34a; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
        .gst-note { background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; color: #0369a1; }
        .terms { margin-top: 20px; padding: 12px; background-color: #f9fafb; border-radius: 6px; font-size: 12px; color: #6b7280; }
        .terms h4 { margin-bottom: 8px; color: #374151; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } .no-print { display: none !important; } }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Print Invoice</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Close</button>
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
            ${billingAddress.phone ? `<p>Phone: ${billingAddress.phone}</p>` : ''}
          </div>
          <div class="address-block">
            <h3>Ship To</h3>
            <p><strong>${shippingAddress.name || 'Customer'}</strong></p>
            <p>${shippingAddress.line1 || shippingAddress.address1 || ''}</p>
            ${shippingAddress.line2 || shippingAddress.address2 ? `<p>${shippingAddress.line2 || shippingAddress.address2}</p>` : ''}
            <p>${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.postalCode || ''}</p>
            <p>${shippingAddress.country || ''}</p>
            ${shippingAddress.phone ? `<p>Phone: ${shippingAddress.phone}</p>` : ''}
          </div>
        </div>
        ${settings.showTaxBreakdown && settings.gstNumber ? `
        <div class="gst-note">
          <strong>GST Note:</strong> GST is included in product prices. ${isInterState ? 'This is an inter-state supply (IGST).' : 'This is an intra-state supply (CGST + SGST).'}
          ${settings.gstNumber ? ` Seller GSTIN: ${settings.gstNumber}` : ''}
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
              ${isInterState ? `<th style="width: 80px; font-size: 12px; text-align: right;">IGST</th>` : `<th style="width: 70px; font-size: 12px; text-align: right;">CGST</th><th style="width: 70px; font-size: 12px; text-align: right;">SGST</th>`}
              <th style="width: 90px; font-size: 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <div class="summary">
          <div class="summary-table">
            <div class="summary-row"><span>Subtotal:</span><span>${CURRENCY_SYMBOL}${subtotal.toFixed(2)}</span></div>
            ${settings.showDiscountLine && discount > 0 ? `<div class="summary-row discount"><span>Discount:</span><span>-${CURRENCY_SYMBOL}${discount.toFixed(2)}</span></div>` : ''}
            ${settings.showShippingCost ? `<div class="summary-row"><span>Shipping:</span><span>${shipping === 0 ? 'Free' : CURRENCY_SYMBOL + shipping.toFixed(2)}</span></div>` : ''}
            <div class="summary-row total"><span>Total:</span><span>${CURRENCY_SYMBOL}${total.toFixed(2)}</span></div>
            ${settings.showTaxBreakdown ? `<div class="summary-row" style="font-size: 12px; color: #6b7280;"><span>Incl. GST${isInterState ? ' (IGST)' : ' (CGST+SGST)'}:</span><span>${CURRENCY_SYMBOL}${(totalIGST + totalCGST + totalSGST).toFixed(2)}</span></div>` : ''}
          </div>
        </div>
        ${settings.termsAndConditions ? `<div class="terms"><h4>Terms & Conditions</h4><p>${settings.termsAndConditions.replace(/\n/g, '<br>')}</p></div>` : ''}
        <div class="footer">
          <p>${settings.footerNote || 'Thank you for your business!'}</p>
          <p style="margin-top: 5px;">Email: ${order.user?.email || order.guestEmail || 'N/A'}</p>
        </div>
      </div>
    </body>
    </html>
  `;
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

const CUSTOMER_TYPES = [
  { value: "regular", label: "Regular Customer" },
  { value: "subscription", label: "Subscription Customer" },
  { value: "retailer", label: "Retailer" },
  { value: "distributor", label: "Distributor" },
  { value: "self_employed", label: "Self Employed" },
];

const getCustomerTypeLabel = (type: string): string => {
  return CUSTOMER_TYPES.find(t => t.value === type)?.label || "Regular Customer";
};

const getCustomerTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
  switch (type) {
    case "subscription":
      return "default";
    case "retailer":
    case "distributor":
      return "secondary";
    default:
      return "outline";
  }
};

export default function CustomerUsersList() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [viewCustomer, setViewCustomer] = useState<CustomerWithStats | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editTypeCustomer, setEditTypeCustomer] = useState<CustomerWithStats | null>(null);
  const [newCustomerType, setNewCustomerType] = useState("");
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ users: CustomerWithStats[]; total: number; typeCounts: Record<string, number> }>({
    queryKey: ["/api/admin/users/customers", { search, customerType: selectedType }],
  });

  const customerId = viewCustomer?.id;
  const { data: customerDetails, isLoading: detailsLoading } = useQuery<CustomerDetailsResponse>({
    queryKey: ['/api/admin/users/customers', customerId, 'details'],
    enabled: !!customerId,
    staleTime: 0,
  });

  const users = data?.users || [];

  const updateCustomerTypeMutation = useMutation({
    mutationFn: async ({ id, customerType }: { id: string; customerType: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/customer-type`, { customerType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/customers"] });
      toast({ title: "Customer type updated successfully" });
      setEditTypeCustomer(null);
      setNewCustomerType("");
    },
    onError: () => {
      toast({ title: "Failed to update customer type", variant: "destructive" });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCustomerData = () => {
    return users.map(user => ({
      name: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Customer",
      email: user.email || "",
      phone: user.phone || "-",
      orders: user.orderCount || 0,
      totalSpent: user.totalSpent || 0,
      joinedDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A",
    }));
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const customerData = getCustomerData();

    doc.setFontSize(18);
    doc.text("Customer Accounts Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Customers: ${customerData.length}`, 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [["Name", "Email", "Phone", "Orders", "Total Spent", "Joined"]],
      body: customerData.map(c => [
        c.name,
        c.email,
        c.phone,
        c.orders.toString(),
        formatCurrency(c.totalSpent),
        c.joinedDate,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save("customers.pdf");
    toast({ title: "PDF downloaded successfully" });
  };

  const downloadExcel = () => {
    const customerData = getCustomerData();
    const wsData = [
      ["Customer Accounts Report"],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [],
      ["Name", "Email", "Phone", "Orders", "Total Spent", "Joined Date"],
      ...customerData.map(c => [
        c.name,
        c.email,
        c.phone,
        c.orders,
        c.totalSpent,
        c.joinedDate,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");

    ws["!cols"] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
    ];

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "customers.xlsx");
    toast({ title: "Excel file downloaded successfully" });
  };

  const downloadTXT = () => {
    const customerData = getCustomerData();
    let content = "CUSTOMER ACCOUNTS REPORT\n";
    content += "========================\n\n";
    content += `Generated on: ${new Date().toLocaleDateString()}\n`;
    content += `Total Customers: ${customerData.length}\n\n`;
    content += "-----------------------------------------------------------\n";
    content += "Name                     | Email                          | Phone          | Orders | Total Spent  | Joined\n";
    content += "-----------------------------------------------------------\n";

    customerData.forEach(c => {
      content += `${c.name.padEnd(24)} | ${c.email.padEnd(30)} | ${c.phone.padEnd(14)} | ${c.orders.toString().padEnd(6)} | ${formatCurrency(c.totalSpent).padEnd(12)} | ${c.joinedDate}\n`;
    });

    content += "-----------------------------------------------------------\n";

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "customers.txt");
    toast({ title: "Text file downloaded successfully" });
  };

  const downloadWord = () => {
    const customerData = getCustomerData();
    let content = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Customer Accounts Report</title></head>
      <body>
        <h1 style="font-family: Arial, sans-serif; color: #333;">Customer Accounts Report</h1>
        <p style="font-family: Arial, sans-serif; color: #666;">Generated on: ${new Date().toLocaleDateString()}</p>
        <p style="font-family: Arial, sans-serif; color: #666;">Total Customers: ${customerData.length}</p>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-family: Arial, sans-serif; width: 100%;">
          <thead>
            <tr style="background-color: #3b82f6; color: white;">
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
    `;

    customerData.forEach((c, i) => {
      const bgColor = i % 2 === 0 ? "#f9fafb" : "#ffffff";
      content += `
        <tr style="background-color: ${bgColor};">
          <td>${c.name}</td>
          <td>${c.email}</td>
          <td>${c.phone}</td>
          <td style="text-align: center;">${c.orders}</td>
          <td style="text-align: right;">${formatCurrency(c.totalSpent)}</td>
          <td>${c.joinedDate}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([content], { type: "application/msword" });
    saveAs(blob, "customers.doc");
    toast({ title: "Word document downloaded successfully" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Customer Accounts</h1>
            <p className="text-muted-foreground">View and manage customer accounts</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="button-download-customers">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={downloadPDF} data-testid="button-download-pdf">
              <FileText className="h-4 w-4 mr-2 text-red-500" />
              PDF Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadExcel} data-testid="button-download-excel">
              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
              Excel Spreadsheet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadTXT} data-testid="button-download-txt">
              <FileType className="h-4 w-4 mr-2 text-gray-500" />
              Text File (TXT)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadWord} data-testid="button-download-word">
              <File className="h-4 w-4 mr-2 text-blue-500" />
              Word Document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-customers"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          {data?.total || 0} Customers
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2" data-testid="customer-type-filters">
        <Button
          variant={selectedType === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedType("all")}
          data-testid="filter-type-all"
        >
          All Customers
          <Badge variant="secondary" className="ml-2 text-xs">
            {data?.typeCounts?.all || 0}
          </Badge>
        </Button>
        <Button
          variant={selectedType === "regular" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedType("regular")}
          data-testid="filter-type-regular"
        >
          Regular
          <Badge variant="secondary" className="ml-2 text-xs">
            {data?.typeCounts?.regular || 0}
          </Badge>
        </Button>
        <Button
          variant={selectedType === "subscription" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedType("subscription")}
          data-testid="filter-type-subscription"
        >
          Subscription
          <Badge variant="secondary" className="ml-2 text-xs">
            {data?.typeCounts?.subscription || 0}
          </Badge>
        </Button>
        <Button
          variant={selectedType === "retailer" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedType("retailer")}
          data-testid="filter-type-retailer"
        >
          Retailer
          <Badge variant="secondary" className="ml-2 text-xs">
            {data?.typeCounts?.retailer || 0}
          </Badge>
        </Button>
        <Button
          variant={selectedType === "distributor" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedType("distributor")}
          data-testid="filter-type-distributor"
        >
          Distributor
          <Badge variant="secondary" className="ml-2 text-xs">
            {data?.typeCounts?.distributor || 0}
          </Badge>
        </Button>
        <Button
          variant={selectedType === "self_employed" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedType("self_employed")}
          data-testid="filter-type-self-employed"
        >
          Self Employed
          <Badge variant="secondary" className="ml-2 text-xs">
            {data?.typeCounts?.self_employed || 0}
          </Badge>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} data-testid={`row-customer-${user.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {user.firstName ? `${user.firstName} ${user.lastName || ""}` : "Customer"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.phone ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {user.phone}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getCustomerTypeBadgeVariant(user.customerType || "regular")}
                      className="text-xs"
                    >
                      {getCustomerTypeLabel(user.customerType || "regular")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <ShoppingBag className="h-3 w-3 mr-1" />
                      {user.orderCount || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(user.totalSpent || 0)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-customer-actions-${user.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewCustomer(user)}>
                          <UserIcon className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setEditTypeCustomer(user);
                          setNewCustomerType(user.customerType || "regular");
                        }}>
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Change Customer Type
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

      <Dialog open={!!viewCustomer} onOpenChange={() => { setViewCustomer(null); setActiveTab("overview"); }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {viewCustomer && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" data-testid="tab-overview">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="orders" data-testid="tab-orders">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="addresses" data-testid="tab-addresses">
                  <MapPin className="h-4 w-4 mr-2" />
                  Addresses
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={viewCustomer.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xl">
                      {viewCustomer.firstName?.[0] || viewCustomer.email?.[0]?.toUpperCase() || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {viewCustomer.firstName ? `${viewCustomer.firstName} ${viewCustomer.lastName || ""}` : "Customer"}
                    </h3>
                    <p className="text-sm text-muted-foreground">Customer Account</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{viewCustomer.email}</p>
                    </div>
                  </div>

                  {viewCustomer.phone && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{viewCustomer.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className="p-3 bg-muted/50 rounded-lg text-center cursor-pointer hover-elevate"
                      onClick={() => setActiveTab("orders")}
                      data-testid="card-total-orders"
                    >
                      <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-2xl font-bold">{viewCustomer.orderCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                      <p className="text-xs text-primary mt-1">Click to view</p>
                    </div>
                    <div 
                      className="p-3 bg-muted/50 rounded-lg text-center cursor-pointer hover-elevate"
                      onClick={() => setActiveTab("orders")}
                      data-testid="card-total-spent"
                    >
                      <Receipt className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-2xl font-bold">{formatCurrency(viewCustomer.totalSpent || 0)}</p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                      <p className="text-xs text-primary mt-1">Click to view</p>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Member since: {viewCustomer.createdAt ? new Date(viewCustomer.createdAt).toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : "N/A"}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orders" className="py-4">
                <ScrollArea className="h-[400px]">
                  {detailsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : customerDetails?.orders && customerDetails.orders.length > 0 ? (
                    <div className="space-y-3">
                      {customerDetails.orders.map((order) => {
                        const isExpanded = expandedOrderId === String(order.id);
                        const shippingAddr = order.shippingAddress as any;
                        return (
                          <div key={order.id} className="border rounded-lg overflow-hidden" data-testid={`order-${order.id}`}>
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium">#{order.orderNumber}</div>
                                <Badge variant={
                                  order.status === "delivered" ? "default" :
                                  order.status === "cancelled" ? "destructive" :
                                  "secondary"
                                }>
                                  {order.status}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}</span>
                                <span className="font-medium text-foreground">{formatCurrency(Number(order.total))}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Package className="h-3 w-3" />
                                <span>{order.items?.length || 0} items</span>
                                <span className="mx-1">•</span>
                                <CreditCard className="h-3 w-3" />
                                <span>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
                              </div>
                              <div className="mt-3 flex gap-2 flex-wrap">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setExpandedOrderId(isExpanded ? null : String(order.id))}
                                  data-testid={`button-toggle-order-${order.id}`}
                                >
                                  {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                                  {isExpanded ? 'Hide Details' : 'View Details'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openInvoice(order)}
                                  data-testid={`button-invoice-${order.id}`}
                                >
                                  <Receipt className="h-4 w-4 mr-1" />
                                  Invoice
                                </Button>
                                <Link href={`/admin/orders?search=${order.orderNumber}`}>
                                  <Button variant="outline" size="sm" data-testid={`button-view-order-${order.id}`} onClick={() => setViewCustomer(null)}>
                                    Go to Order
                                  </Button>
                                </Link>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="border-t bg-muted/30 p-4 space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Order Items
                                  </h4>
                                  <div className="space-y-2">
                                    {order.items?.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-3 p-2 bg-background rounded-md">
                                        {item.image ? (
                                          <img 
                                            src={item.image} 
                                            alt={item.title} 
                                            className="w-12 h-12 object-cover rounded"
                                          />
                                        ) : (
                                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                            <Package className="h-5 w-5 text-muted-foreground" />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">{item.title}</p>
                                          {item.variantName && (
                                            <p className="text-xs text-muted-foreground">{item.variantName}</p>
                                          )}
                                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-sm font-medium">
                                          {formatCurrency(Number(item.price) * item.quantity)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {shippingAddr && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <Truck className="h-4 w-4" />
                                      Shipping Address
                                    </h4>
                                    <div className="text-sm text-muted-foreground bg-background rounded-md p-3">
                                      <p className="font-medium text-foreground">{shippingAddr.name || shippingAddr.firstName}</p>
                                      <p>{shippingAddr.line1 || shippingAddr.address1}</p>
                                      {(shippingAddr.line2 || shippingAddr.address2) && (
                                        <p>{shippingAddr.line2 || shippingAddr.address2}</p>
                                      )}
                                      <p>{shippingAddr.city}, {shippingAddr.state} {shippingAddr.postalCode}</p>
                                      <p>{shippingAddr.country}</p>
                                      {shippingAddr.phone && <p className="mt-1">Phone: {shippingAddr.phone}</p>}
                                    </div>
                                  </div>
                                )}

                                <Separator />
                                
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Subtotal</span>
                                  <span>{formatCurrency(Number(order.subtotal))}</span>
                                </div>
                                {Number(order.discount) > 0 && (
                                  <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(Number(order.discount))}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Shipping</span>
                                  <span>{Number(order.shippingCost) === 0 ? 'Free' : formatCurrency(Number(order.shippingCost))}</span>
                                </div>
                                <div className="flex justify-between font-medium pt-2 border-t">
                                  <span>Total</span>
                                  <span>{formatCurrency(Number(order.total))}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No orders found</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="addresses" className="py-4">
                <ScrollArea className="h-[400px]">
                  {detailsLoading ? (
                    <div className="space-y-2">
                      {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                    </div>
                  ) : customerDetails?.addresses && customerDetails.addresses.length > 0 ? (
                    <div className="space-y-3">
                      {customerDetails.addresses.map((address) => (
                        <div key={address.id} className="p-4 border rounded-lg" data-testid={`address-${address.id}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{address.firstName} {address.lastName}</span>
                            </div>
                            <div className="flex gap-2">
                              {address.isDefault && <Badge variant="default">Default</Badge>}
                              <Badge variant="outline">{address.type}</Badge>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>{address.address1}</p>
                            {address.address2 && <p>{address.address2}</p>}
                            <p>{address.city}, {address.state} {address.postalCode}</p>
                            <p>{address.country}</p>
                            {address.phone && (
                              <p className="flex items-center gap-1 mt-2">
                                <Phone className="h-3 w-3" />
                                {address.phone}
                              </p>
                            )}
                            {address.gstNumber && (
                              <p className="text-xs">GST: {address.gstNumber}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No addresses found</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setViewCustomer(null); setActiveTab("overview"); setExpandedOrderId(null); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Type Dialog */}
      <Dialog open={!!editTypeCustomer} onOpenChange={() => { setEditTypeCustomer(null); setNewCustomerType(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Customer Type</DialogTitle>
            <DialogDescription>
              Update the customer type for {editTypeCustomer?.firstName} {editTypeCustomer?.lastName || editTypeCustomer?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Customer Type</Label>
              <Select value={newCustomerType} onValueChange={setNewCustomerType}>
                <SelectTrigger data-testid="select-customer-type">
                  <SelectValue placeholder="Select customer type" />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditTypeCustomer(null); setNewCustomerType(""); }}>
              Cancel
            </Button>
            <Button 
              onClick={() => editTypeCustomer && newCustomerType && updateCustomerTypeMutation.mutate({ 
                id: editTypeCustomer.id, 
                customerType: newCustomerType 
              })}
              disabled={updateCustomerTypeMutation.isPending || !newCustomerType}
              data-testid="button-save-customer-type"
            >
              {updateCustomerTypeMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
