import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Edit, Trash2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ProviderLayout } from "./ProviderDashboard";
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

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ProviderSlots() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editSlot, setEditSlot] = useState<SwimGroomSlot | null>(null);
  const [deleteSlot, setDeleteSlot] = useState<SwimGroomSlot | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: providerData } = useQuery<{ provider: SwimGroomProvider }>({
    queryKey: ["/api/provider/me"],
  });

  const { data, isLoading, error } = useQuery<{ slots: SwimGroomSlot[] }>({
    queryKey: ["/api/provider/slots"],
  });

  const { data: servicesData } = useQuery<{ services: SwimGroomService[] }>({
    queryKey: ["/api/swim-groom/services"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/provider/slots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/slots"] });
      toast({ title: "Slot deleted successfully" });
      setDeleteSlot(null);
    },
    onError: () => {
      toast({ title: "Failed to delete slot", variant: "destructive" });
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
            <p className="text-muted-foreground mb-4">Please log in to manage slots.</p>
            <Button onClick={() => setLocation("/provider/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const slots = data?.slots || [];
  const services = servicesData?.services || [];

  const slotsByDay = slots.reduce((acc, slot) => {
    const day = slot.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {} as Record<number, SwimGroomSlot[]>);

  return (
    <ProviderLayout provider={providerData?.provider} onLogout={() => logoutMutation.mutate()}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Time Slots</h1>
            <p className="text-muted-foreground">Manage your availability</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-slot">
            <Plus className="h-4 w-4 mr-2" />
            Add Slot
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : Object.keys(slotsByDay).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No time slots created yet.</p>
              <p className="text-sm">Add your first slot to start accepting bookings.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(slotsByDay)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([day, daySlots]) => (
                <Card key={day}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-lg">{dayNames[parseInt(day)]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="font-medium">
                                {slot.startTime} - {slot.endTime}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {slot.service?.name || "Service not specified"}
                              </div>
                            </div>
                            <Badge variant="outline">
                              {slot.bookedCount}/{slot.maxCapacity} booked
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">₹{slot.price}</span>
                            <Badge variant={slot.isActive ? "default" : "outline"}>
                              {slot.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditSlot(slot)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteSlot(slot)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        <SlotDialog
          open={isAddDialogOpen || !!editSlot}
          onOpenChange={(o) => {
            if (!o) {
              setIsAddDialogOpen(false);
              setEditSlot(null);
            }
          }}
          slot={editSlot}
          services={services}
        />

        <AlertDialog open={!!deleteSlot} onOpenChange={() => setDeleteSlot(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Slot</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this time slot? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteSlot && deleteMutation.mutate(deleteSlot.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProviderLayout>
  );
}

function SlotDialog({
  open,
  onOpenChange,
  slot,
  services,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  slot: SwimGroomSlot | null;
  services: SwimGroomService[];
}) {
  const { toast } = useToast();
  const [serviceId, setServiceId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [maxCapacity, setMaxCapacity] = useState("5");
  const [price, setPrice] = useState("500");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    if (slot) {
      setServiceId(slot.serviceId);
      setDayOfWeek(slot.dayOfWeek.toString());
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
      setMaxCapacity(slot.maxCapacity.toString());
      setPrice(slot.price);
      setIsActive(slot.isActive);
    } else {
      setServiceId(services[0]?.id || "");
      setDayOfWeek("1");
      setStartTime("09:00");
      setEndTime("10:00");
      setMaxCapacity("5");
      setPrice("500");
      setIsActive(true);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/provider/slots", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/slots"] });
      toast({ title: "Slot created successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to create slot", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/provider/slots/${slot?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/slots"] });
      toast({ title: "Slot updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update slot", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!serviceId) {
      toast({ title: "Please select a service", variant: "destructive" });
      return;
    }

    const data = {
      serviceId,
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
      maxCapacity: parseInt(maxCapacity),
      price,
      isActive,
    };

    if (slot) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
        else resetForm();
      }}
    >
      <DialogContent onOpenAutoFocus={() => resetForm()}>
        <DialogHeader>
          <DialogTitle>{slot ? "Edit Slot" : "Add Time Slot"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Service</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Day of Week</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayNames.map((day, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxCapacity">Max Capacity</Label>
              <Input
                id="maxCapacity"
                type="number"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {slot ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
