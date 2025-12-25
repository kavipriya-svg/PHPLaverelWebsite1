import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { MapPin, Star, Clock, Calendar, Phone, Mail, CheckCircle, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { format } from "date-fns";
import type { SwimGroomProvider, SwimGroomService } from "@shared/schema";

type SwimGroomSlot = {
  id: string;
  providerId: string;
  serviceId: string;
  service?: SwimGroomService | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  bookedCount: number;
  price: string;
  isActive: boolean;
};

type SwimGroomProviderWithDetails = SwimGroomProvider & {
  city?: { id: string; name: string } | null;
  state?: { id: string; name: string } | null;
  country?: { id: string; name: string } | null;
  services?: any[];
  media?: any[];
  slots?: SwimGroomSlot[];
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SwimGroomProviderPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [selectedSlot, setSelectedSlot] = useState<SwimGroomSlot | null>(null);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const { data, isLoading } = useQuery<SwimGroomProviderWithDetails>({
    queryKey: ["/api/swim-groom/providers", slug],
    enabled: !!slug,
  });

  const bookMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/swim-groom/bookings", data);
    },
    onSuccess: (data) => {
      toast({ title: "Booking created successfully!" });
      setIsBookingOpen(false);
      setSelectedSlot(null);
      setBookingDate(undefined);
      setNotes("");
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to create booking", variant: "destructive" });
    },
  });

  const handleBook = () => {
    if (!isAuthenticated) {
      toast({ title: "Please log in to book", variant: "destructive" });
      return;
    }
    if (!selectedSlot || !bookingDate) {
      toast({ title: "Please select a date and time slot", variant: "destructive" });
      return;
    }

    bookMutation.mutate({
      providerId: data?.id,
      slotId: selectedSlot.id,
      bookingDate: format(bookingDate, "yyyy-MM-dd"),
      customerNotes: notes.trim() || null,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Provider Not Found</h1>
        <p className="text-muted-foreground mb-6">The provider you're looking for doesn't exist.</p>
        <Link href="/swim-groom">
          <Button>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Providers
          </Button>
        </Link>
      </div>
    );
  }

  const slots = data.slots || [];
  const slotsByDay = slots.reduce((acc, slot) => {
    const day = slot.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {} as Record<number, SwimGroomSlot[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/swim-groom">
        <Button variant="ghost" className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Providers
        </Button>
      </Link>

      {/* Hero Section */}
      <div className="relative aspect-[3/1] bg-muted rounded-lg overflow-hidden mb-6">
        {data.bannerUrl ? (
          <img src={data.bannerUrl} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-end gap-4">
            {data.logoUrl && (
              <img
                src={data.logoUrl}
                alt={data.name}
                className="w-20 h-20 rounded-lg border-4 border-white object-cover"
              />
            )}
            <div className="text-white">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold">{data.name}</h1>
                {data.isVerified && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-white/80">
                {data.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span>{data.rating}</span>
                    <span>({data.reviewCount || 0} reviews)</span>
                  </div>
                )}
                {data.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {data.city.name}
                      {data.state && `, ${data.state.name}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {data.description && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{data.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Available Slots */}
          <Card>
            <CardHeader>
              <CardTitle>Available Time Slots</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(slotsByDay).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No time slots available at the moment.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(slotsByDay).map(([day, daySlots]) => (
                    <div key={day}>
                      <h4 className="font-medium mb-2">{dayNames[parseInt(day)]}</h4>
                      <div className="flex flex-wrap gap-2">
                        {daySlots.map((slot) => {
                          const available = slot.maxCapacity - slot.bookedCount;
                          return (
                            <Button
                              key={slot.id}
                              variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                              size="sm"
                              disabled={available <= 0}
                              onClick={() => {
                                setSelectedSlot(slot);
                                setIsBookingOpen(true);
                              }}
                              data-testid={`button-slot-${slot.id}`}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {slot.startTime} - {slot.endTime}
                              <span className="ml-2 text-xs opacity-70">₹{slot.price}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Gallery */}
          {data.media && data.media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {data.media.map((item: any, index: number) => (
                    <img
                      key={item.id || index}
                      src={item.url}
                      alt={`Gallery ${index + 1}`}
                      className="w-full aspect-square rounded object-cover"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{data.phone}</span>
                </div>
              )}
              {data.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{data.email}</span>
                </div>
              )}
              {data.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <span className="text-sm">{data.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={() => setIsBookingOpen(true)}
            data-testid="button-book-now"
          >
            Book Now
          </Button>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {bookingDate ? format(bookingDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={bookingDate}
                    onSelect={setBookingDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Select Time Slot</Label>
              <Select
                value={selectedSlot?.id || ""}
                onValueChange={(v) => setSelectedSlot(slots.find((s) => s.id === v) || null)}
              >
                <SelectTrigger data-testid="select-time-slot">
                  <SelectValue placeholder="Choose a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {slots.filter(s => s.isActive && s.maxCapacity - s.bookedCount > 0).map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {dayNames[slot.dayOfWeek]} {slot.startTime} - {slot.endTime} (₹{slot.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSlot && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Service Price</span>
                  <span className="font-medium">₹{selectedSlot.price}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Special Requests (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements..."
                rows={3}
                data-testid="input-booking-notes"
              />
            </div>

            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground text-center">
                Please <Link href="/login" className="text-primary underline">log in</Link> to book.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBook}
              disabled={bookMutation.isPending || !isAuthenticated || !selectedSlot || !bookingDate}
              data-testid="button-confirm-booking"
            >
              {bookMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
