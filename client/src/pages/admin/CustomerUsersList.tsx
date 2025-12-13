import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, MoreHorizontal, User as UserIcon, Mail, Phone, MapPin, ShoppingBag, Loader2, ArrowLeft, Download, FileSpreadsheet, FileText, File } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, TextRun, WidthType, BorderStyle, HeadingLevel } from "docx";
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

  const formatCurrencyPlain = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getExportData = () => {
    return users.map(user => ({
      Name: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Customer",
      Email: user.email || "",
      Phone: user.phone || "-",
      Orders: user.orderCount || 0,
      "Total Spent": formatCurrencyPlain(user.totalSpent || 0),
      "Joined Date": user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : "N/A",
    }));
  };

  const exportToExcel = () => {
    try {
      const exportData = getExportData();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
      
      const colWidths = [
        { wch: 25 },
        { wch: 30 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
      ];
      worksheet["!cols"] = colWidths;
      
      XLSX.writeFile(workbook, `customers_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast({ title: "Exported to Excel successfully" });
    } catch (error) {
      toast({ title: "Failed to export to Excel", variant: "destructive" });
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text("Customer Accounts", 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);
      doc.text(`Total Customers: ${users.length}`, 14, 36);

      const tableData = users.map(user => [
        user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Customer",
        user.email || "",
        user.phone || "-",
        String(user.orderCount || 0),
        formatCurrencyPlain(user.totalSpent || 0),
        user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : "N/A",
      ]);

      autoTable(doc, {
        head: [["Name", "Email", "Phone", "Orders", "Total Spent", "Joined"]],
        body: tableData,
        startY: 42,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save(`customers_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Exported to PDF successfully" });
    } catch (error) {
      toast({ title: "Failed to export to PDF", variant: "destructive" });
    }
  };

  const exportToWord = async () => {
    try {
      const tableRows = [
        new DocxTableRow({
          children: [
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Email", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Phone", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Orders", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Spent", bold: true })] })] }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Joined", bold: true })] })] }),
          ],
        }),
        ...users.map(user => 
          new DocxTableRow({
            children: [
              new DocxTableCell({ children: [new Paragraph(user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Customer")] }),
              new DocxTableCell({ children: [new Paragraph(user.email || "")] }),
              new DocxTableCell({ children: [new Paragraph(user.phone || "-")] }),
              new DocxTableCell({ children: [new Paragraph(String(user.orderCount || 0))] }),
              new DocxTableCell({ children: [new Paragraph(formatCurrencyPlain(user.totalSpent || 0))] }),
              new DocxTableCell({ children: [new Paragraph(user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : "N/A")] }),
            ],
          })
        ),
      ];

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: "Customer Accounts",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: `Generated on: ${new Date().toLocaleDateString('en-IN')} | Total Customers: ${users.length}`,
            }),
            new Paragraph({ text: "" }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `customers_${new Date().toISOString().split('T')[0]}.docx`);
      toast({ title: "Exported to Word successfully" });
    } catch (error) {
      toast({ title: "Failed to export to Word", variant: "destructive" });
    }
  };

  const exportToText = () => {
    try {
      let content = "CUSTOMER ACCOUNTS\n";
      content += "=".repeat(80) + "\n";
      content += `Generated on: ${new Date().toLocaleDateString('en-IN')}\n`;
      content += `Total Customers: ${users.length}\n`;
      content += "=".repeat(80) + "\n\n";

      users.forEach((user, index) => {
        content += `${index + 1}. ${user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Customer"}\n`;
        content += `   Email: ${user.email || "-"}\n`;
        content += `   Phone: ${user.phone || "-"}\n`;
        content += `   Orders: ${user.orderCount || 0}\n`;
        content += `   Total Spent: ${formatCurrencyPlain(user.totalSpent || 0)}\n`;
        content += `   Joined: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : "N/A"}\n`;
        content += "-".repeat(40) + "\n";
      });

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      saveAs(blob, `customers_${new Date().toISOString().split('T')[0]}.txt`);
      toast({ title: "Exported to Text successfully" });
    } catch (error) {
      toast({ title: "Failed to export to Text", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon" data-testid="button-back-to-admin">
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
            <Button variant="outline" data-testid="button-export-customers">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={exportToExcel} data-testid="export-excel">
              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
              Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToPDF} data-testid="export-pdf">
              <File className="h-4 w-4 mr-2 text-red-600" />
              PDF (.pdf)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToWord} data-testid="export-word">
              <FileText className="h-4 w-4 mr-2 text-blue-600" />
              Word (.docx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToText} data-testid="export-text">
              <FileText className="h-4 w-4 mr-2 text-gray-600" />
              Text (.txt)
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
