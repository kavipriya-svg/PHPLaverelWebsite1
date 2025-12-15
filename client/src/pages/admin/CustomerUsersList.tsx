import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MoreHorizontal, User as UserIcon, Mail, Phone, ShoppingBag, Download, FileText, FileSpreadsheet, FileType, File } from "lucide-react";
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
} from "@/components/ui/dialog";
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
}

export default function CustomerUsersList() {
  const [search, setSearch] = useState("");
  const [viewCustomer, setViewCustomer] = useState<CustomerWithStats | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ users: CustomerWithStats[]; total: number }>({
    queryKey: ["/api/admin/users/customers", { search }],
  });

  const users = data?.users || [];

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
        <div>
          <h1 className="text-3xl font-bold">Customer Accounts</h1>
          <p className="text-muted-foreground">View and manage customer accounts</p>
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
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
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viewCustomer} onOpenChange={() => setViewCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {viewCustomer && (
            <div className="space-y-6 py-4">
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
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-2xl font-bold">{viewCustomer.orderCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Orders</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{formatCurrency(viewCustomer.totalSpent || 0)}</p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCustomer(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
