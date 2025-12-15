import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Mail, Phone, Copy, Users, UserCheck, UserX, Clock, Crown, UserPlus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface CustomerWithStats extends User {
  orderCount?: number;
  totalSpent?: number;
  lastOrderDate?: string | null;
}

const segments = [
  { id: "all", label: "All Customers", icon: Users, description: "Complete customer list" },
  { id: "active", label: "Active (30 days)", icon: UserCheck, description: "Ordered in last 30 days" },
  { id: "recent", label: "Recent (7 days)", icon: Clock, description: "Ordered in last 7 days" },
  { id: "high_value", label: "High Value", icon: Crown, description: "Spent over ₹10,000" },
  { id: "new", label: "New Customers", icon: UserPlus, description: "Registered in last 30 days" },
  { id: "inactive", label: "Inactive (90 days)", icon: UserX, description: "No orders in 90 days" },
  { id: "never_purchased", label: "Never Purchased", icon: ShoppingBag, description: "Registered but never ordered" },
];

export default function Marketing() {
  const [activeSegment, setActiveSegment] = useState("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const queryUrl = `/api/admin/marketing/segments?segment=${activeSegment}&search=${encodeURIComponent(search)}`;
  const { data, isLoading } = useQuery<{ customers: CustomerWithStats[]; total: number }>({
    queryKey: [queryUrl],
  });

  const customers = data?.customers || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCustomerData = () => {
    return customers.map(c => ({
      name: c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : "Customer",
      email: c.email || "",
      phone: c.phone || "-",
      orders: c.orderCount || 0,
      totalSpent: c.totalSpent || 0,
      lastOrder: c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : "Never",
      joinedDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "N/A",
    }));
  };

  const copyEmails = () => {
    const emails = customers.filter(c => c.email).map(c => c.email).join(", ");
    navigator.clipboard.writeText(emails);
    toast({ title: `${customers.filter(c => c.email).length} emails copied to clipboard` });
  };

  const copyPhones = () => {
    const phones = customers.filter(c => c.phone).map(c => c.phone).join(", ");
    navigator.clipboard.writeText(phones);
    toast({ title: `${customers.filter(c => c.phone).length} phone numbers copied to clipboard` });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const customerData = getCustomerData();
    const segmentLabel = segments.find(s => s.id === activeSegment)?.label || "All Customers";

    doc.setFontSize(18);
    doc.text(`Marketing - ${segmentLabel}`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Customers: ${customerData.length}`, 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [["Name", "Email", "Phone", "Orders", "Total Spent", "Last Order"]],
      body: customerData.map(c => [
        c.name,
        c.email,
        c.phone,
        c.orders.toString(),
        formatCurrency(c.totalSpent),
        c.lastOrder,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`marketing-${activeSegment}.pdf`);
    toast({ title: "PDF downloaded successfully" });
  };

  const downloadExcel = () => {
    const customerData = getCustomerData();
    const segmentLabel = segments.find(s => s.id === activeSegment)?.label || "All Customers";
    const wsData = [
      [`Marketing - ${segmentLabel}`],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [],
      ["Name", "Email", "Phone", "Orders", "Total Spent", "Last Order"],
      ...customerData.map(c => [
        c.name,
        c.email,
        c.phone,
        c.orders,
        c.totalSpent,
        c.lastOrder,
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
    saveAs(blob, `marketing-${activeSegment}.xlsx`);
    toast({ title: "Excel file downloaded successfully" });
  };

  const downloadTXT = () => {
    const customerData = getCustomerData();
    const segmentLabel = segments.find(s => s.id === activeSegment)?.label || "All Customers";
    let content = `MARKETING - ${segmentLabel.toUpperCase()}\n`;
    content += "=".repeat(50) + "\n\n";
    content += `Generated on: ${new Date().toLocaleDateString()}\n`;
    content += `Total Customers: ${customerData.length}\n\n`;
    content += "-".repeat(100) + "\n";
    content += "Name                     | Email                          | Phone          | Orders | Total Spent  | Last Order\n";
    content += "-".repeat(100) + "\n";

    customerData.forEach(c => {
      content += `${c.name.padEnd(24)} | ${c.email.padEnd(30)} | ${c.phone.padEnd(14)} | ${c.orders.toString().padEnd(6)} | ${formatCurrency(c.totalSpent).padEnd(12)} | ${c.lastOrder}\n`;
    });

    content += "-".repeat(100) + "\n";

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `marketing-${activeSegment}.txt`);
    toast({ title: "Text file downloaded successfully" });
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-marketing-title">Marketing</h1>
            <p className="text-muted-foreground">Customer segments for marketing campaigns</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={copyEmails} data-testid="button-copy-emails">
              <Mail className="h-4 w-4 mr-2" />
              Copy Emails
            </Button>
            <Button variant="outline" onClick={copyPhones} data-testid="button-copy-phones">
              <Phone className="h-4 w-4 mr-2" />
              Copy Phones
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-download-marketing">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={downloadPDF} data-testid="button-download-pdf">
                  PDF Document
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadExcel} data-testid="button-download-excel">
                  Excel Spreadsheet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadTXT} data-testid="button-download-txt">
                  Text File
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Segment Cards */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          {segments.map((segment) => {
            const Icon = segment.icon;
            return (
              <Card 
                key={segment.id}
                className={`cursor-pointer transition-colors hover-elevate ${activeSegment === segment.id ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setActiveSegment(segment.id)}
                data-testid={`card-segment-${segment.id}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {segment.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{segment.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and Customer List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>
                {segments.find(s => s.id === activeSegment)?.label}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {data?.total || 0} customers in this segment
              </p>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-marketing"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No customers found in this segment</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell>
                        <div className="font-medium">
                          {customer.firstName ? `${customer.firstName} ${customer.lastName || ""}`.trim() : "Customer"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.email ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{customer.email}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText(customer.email!);
                                toast({ title: "Email copied" });
                              }}
                              data-testid={`button-copy-email-${customer.id}`}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{customer.phone}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText(customer.phone!);
                                toast({ title: "Phone copied" });
                              }}
                              data-testid={`button-copy-phone-${customer.id}`}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{customer.orderCount || 0}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(customer.totalSpent || 0)}</TableCell>
                      <TableCell>
                        {customer.lastOrderDate 
                          ? new Date(customer.lastOrderDate).toLocaleDateString()
                          : "Never"
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
