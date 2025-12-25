import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Eye, Clock, Calendar, User, Building2, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SwimGroomBooking, SwimGroomProvider, User as UserType } from "@shared/schema";
import { format } from "date-fns";

type SwimGroomBookingWithDetails = SwimGroomBooking & {
  customer?: UserType | null;
  provider?: SwimGroomProvider | null;
  slot?: any;
  service?: any;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
};

const paymentColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  refunded: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
};

export default function AdminSwimGroomBookings() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewBooking, setViewBooking] = useState<SwimGroomBookingWithDetails | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ bookings: SwimGroomBookingWithDetails[]; total: number }>({
    queryKey: ["/api/admin/swim-groom/bookings", search, statusFilter],
  });

  const bookings = data?.bookings || [];
  const filteredBookings = statusFilter && statusFilter !== "all"
    ? bookings.filter(b => b.status === statusFilter)
    : bookings;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage swimming & grooming service bookings</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by booking number, customer, provider..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-bookings"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {bookings.filter(b => b.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {bookings.filter(b => b.status === "confirmed").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === "completed").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-0">
              <div className="space-y-4 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No bookings found.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="font-medium">{booking.bookingNumber}</div>
                        <div className="text-xs text-muted-foreground">{booking.serviceName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm">
                              {booking.customer?.firstName} {booking.customer?.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{booking.customer?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{booking.providerName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {booking.bookingDate && format(new Date(booking.bookingDate), "dd MMM yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{booking.startTime} - {booking.endTime}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">₹{booking.price}</div>
                        {booking.commissionAmount && (
                          <div className="text-xs text-muted-foreground">
                            Commission: ₹{booking.commissionAmount}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[booking.status || "pending"]}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentColors[booking.paymentStatus || "pending"]}>
                          {booking.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setViewBooking(booking)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <BookingDetailDialog
          open={!!viewBooking}
          onOpenChange={(o) => !o && setViewBooking(null)}
          booking={viewBooking}
        />
      </div>
    </AdminLayout>
  );
}

function BookingDetailDialog({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  booking: SwimGroomBookingWithDetails | null;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState(booking?.status || "pending");
  const [paymentStatus, setPaymentStatus] = useState(booking?.paymentStatus || "pending");
  const [adminNotes, setAdminNotes] = useState(booking?.adminNotes || "");

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/admin/swim-groom/bookings/${booking?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/bookings"] });
      toast({ title: "Booking updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update booking", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      status,
      paymentStatus,
      adminNotes: adminNotes.trim() || null,
    });
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Booking Details - {booking.bookingNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Service</Label>
              <p className="font-medium">{booking.serviceName || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Provider</Label>
              <p className="font-medium">{booking.providerName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Date</Label>
              <p className="font-medium">
                {booking.bookingDate && format(new Date(booking.bookingDate), "dd MMM yyyy")}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Time</Label>
              <p className="font-medium">{booking.startTime} - {booking.endTime}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Customer</Label>
              <p className="font-medium">
                {booking.customer?.firstName} {booking.customer?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{booking.customer?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Price</Label>
              <p className="font-medium">₹{booking.price}</p>
              {booking.commissionAmount && (
                <p className="text-sm text-muted-foreground">Commission: ₹{booking.commissionAmount}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-booking-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger data-testid="select-payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {booking.customerNotes && (
            <div>
              <Label className="text-muted-foreground text-sm">Customer Notes</Label>
              <p className="text-sm bg-muted p-2 rounded">{booking.customerNotes}</p>
            </div>
          )}

          {booking.providerNotes && (
            <div>
              <Label className="text-muted-foreground text-sm">Provider Notes</Label>
              <p className="text-sm bg-muted p-2 rounded">{booking.providerNotes}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="adminNotes">Admin Notes</Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes..."
              rows={2}
              data-testid="input-admin-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-booking">
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
