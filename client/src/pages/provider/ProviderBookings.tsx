import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Calendar, Clock, User, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ProviderLayout } from "./ProviderDashboard";
import { format } from "date-fns";
import type { SwimGroomBooking, SwimGroomProvider } from "@shared/schema";

type BookingWithCustomer = SwimGroomBooking & {
  customer?: { firstName?: string; lastName?: string; email?: string; phone?: string };
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
};

export default function ProviderBookings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<BookingWithCustomer | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [providerNotes, setProviderNotes] = useState("");

  const { data: providerData } = useQuery<{ provider: SwimGroomProvider }>({
    queryKey: ["/api/provider/me"],
  });

  const { data, isLoading, error } = useQuery<{ bookings: BookingWithCustomer[] }>({
    queryKey: ["/api/provider/bookings", statusFilter],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/provider/bookings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/provider/dashboard"] });
      toast({ title: "Booking updated successfully" });
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to update booking", variant: "destructive" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/provider/logout"),
    onSuccess: () => {
      queryClient.clear();
      setLocation("/provider/login");
    },
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">Please log in to access bookings.</p>
            <Button onClick={() => setLocation("/provider/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bookings = data?.bookings || [];
  const filteredBookings = statusFilter
    ? bookings.filter((b) => b.status === statusFilter)
    : bookings;

  const handleConfirm = (booking: BookingWithCustomer) => {
    updateMutation.mutate({ id: booking.id, data: { status: "confirmed" } });
  };

  const handleComplete = (booking: BookingWithCustomer) => {
    updateMutation.mutate({ id: booking.id, data: { status: "completed" } });
  };

  const handleUpdateBooking = () => {
    if (!selectedBooking) return;
    updateMutation.mutate({
      id: selectedBooking.id,
      data: {
        status: newStatus || selectedBooking.status,
        providerNotes: providerNotes.trim() || null,
      },
    });
  };

  return (
    <ProviderLayout provider={providerData?.provider} onLogout={() => logoutMutation.mutate()}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Bookings</h1>
            <p className="text-muted-foreground">Manage your appointments</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bookings found.</p>
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
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
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
                            <div className="text-xs text-muted-foreground">
                              {booking.customer?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {booking.bookingDate &&
                              format(new Date(booking.bookingDate), "dd MMM yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">
                            {booking.startTime} - {booking.endTime}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">₹{booking.price}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[booking.status || "pending"]}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {booking.status === "pending" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleConfirm(booking)}
                              disabled={updateMutation.isPending}
                              title="Confirm"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {booking.status === "confirmed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleComplete(booking)}
                              disabled={updateMutation.isPending}
                              title="Complete"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setNewStatus(booking.status || "pending");
                              setProviderNotes(booking.providerNotes || "");
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Edit Booking Dialog */}
        <Dialog open={!!selectedBooking} onOpenChange={(o) => !o && setSelectedBooking(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Booking</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Booking Number</Label>
                  <p className="font-medium">{selectedBooking.bookingNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Customer</Label>
                  <p className="font-medium">
                    {selectedBooking.customer?.firstName} {selectedBooking.customer?.lastName}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
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
                  <Label htmlFor="providerNotes">Provider Notes</Label>
                  <Textarea
                    id="providerNotes"
                    value={providerNotes}
                    onChange={(e) => setProviderNotes(e.target.value)}
                    placeholder="Add notes about this booking..."
                    rows={3}
                  />
                </div>
                {selectedBooking.customerNotes && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Customer Notes</Label>
                    <p className="text-sm bg-muted p-2 rounded">{selectedBooking.customerNotes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateBooking} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProviderLayout>
  );
}
