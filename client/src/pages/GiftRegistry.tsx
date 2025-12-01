import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Gift, Plus, Trash2, ExternalLink, Edit, Calendar, Users, PartyPopper, Baby, Home, Cake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { GiftRegistry } from "@shared/schema";

const eventTypeLabels: Record<string, { label: string; icon: typeof Gift }> = {
  wedding: { label: "Wedding", icon: Users },
  baby_shower: { label: "Baby Shower", icon: Baby },
  birthday: { label: "Birthday", icon: Cake },
  housewarming: { label: "Housewarming", icon: Home },
  other: { label: "Other", icon: PartyPopper },
};

export default function GiftRegistryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editRegistry, setEditRegistry] = useState<GiftRegistry | null>(null);
  
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("wedding");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [registrantName, setRegistrantName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showPurchased, setShowPurchased] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data, isLoading } = useQuery<{ registries: GiftRegistry[] }>({
    queryKey: ["/api/gift-registries"],
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/gift-registries", {
        title,
        eventType,
        eventDate: eventDate || null,
        description,
        registrantName,
        partnerName,
        isPublic,
        showPurchased,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-registries"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Registry created",
        description: "Your gift registry has been created!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create gift registry",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PUT", `/api/gift-registries/${id}`, {
        title,
        eventType,
        eventDate: eventDate || null,
        description,
        registrantName,
        partnerName,
        isPublic,
        showPurchased,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-registries"] });
      setEditRegistry(null);
      resetForm();
      toast({
        title: "Registry updated",
        description: "Your gift registry has been updated!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update gift registry",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/gift-registries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-registries"] });
      toast({
        title: "Registry deleted",
        description: "Your gift registry has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete gift registry",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setEventType("wedding");
    setEventDate("");
    setDescription("");
    setRegistrantName("");
    setPartnerName("");
    setIsPublic(true);
    setShowPurchased(false);
  };

  const openEditDialog = (registry: GiftRegistry) => {
    setEditRegistry(registry);
    setTitle(registry.title);
    setEventType(registry.eventType);
    setEventDate(registry.eventDate ? format(new Date(registry.eventDate), "yyyy-MM-dd") : "");
    setDescription(registry.description || "");
    setRegistrantName(registry.registrantName || "");
    setPartnerName(registry.partnerName || "");
    setIsPublic(registry.isPublic ?? true);
    setShowPurchased(registry.showPurchased ?? false);
  };

  const registries = data?.registries || [];

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const RegistryForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Registry Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Our Wedding Registry"
            data-testid="input-registry-title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-type">Event Type *</Label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger data-testid="select-event-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(eventTypeLabels).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="registrant-name">Your Name</Label>
          <Input
            id="registrant-name"
            value={registrantName}
            onChange={(e) => setRegistrantName(e.target.value)}
            placeholder="Your name"
            data-testid="input-registrant-name"
          />
        </div>
        {eventType === "wedding" && (
          <div className="space-y-2">
            <Label htmlFor="partner-name">Partner's Name</Label>
            <Input
              id="partner-name"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Partner's name"
              data-testid="input-partner-name"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="event-date">Event Date</Label>
          <Input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            data-testid="input-event-date"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell guests about your celebration..."
          className="resize-none"
          data-testid="input-registry-description"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is-public">Make registry public</Label>
        <Switch
          id="is-public"
          checked={isPublic}
          onCheckedChange={setIsPublic}
          data-testid="switch-registry-public"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="show-purchased">Show purchased items to guests</Label>
        <Switch
          id="show-purchased"
          checked={showPurchased}
          onCheckedChange={setShowPurchased}
          data-testid="switch-show-purchased"
        />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6" />
            Gift Registries
          </h1>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-registry">
                <Plus className="h-4 w-4 mr-2" />
                Create Registry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Gift Registry</DialogTitle>
              </DialogHeader>
              <RegistryForm />
              <DialogFooter>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!title || createMutation.isPending}
                  data-testid="button-save-registry"
                >
                  Create Registry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {registries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No gift registries yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Create a registry for your wedding, baby shower, birthday, or any special occasion.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Registry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {registries.map((registry) => {
              const eventConfig = eventTypeLabels[registry.eventType] || eventTypeLabels.other;
              const Icon = eventConfig.icon;
              
              return (
                <Card key={registry.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{registry.title}</CardTitle>
                          <CardDescription>
                            {eventConfig.label}
                            {registry.eventDate && (
                              <span className="ml-2">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {format(new Date(registry.eventDate), "MMMM d, yyyy")}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={registry.isPublic ? "default" : "secondary"}>
                          {registry.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {registry.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {registry.description}
                      </p>
                    )}
                    {(registry.registrantName || registry.partnerName) && (
                      <p className="text-sm mb-4">
                        <Users className="h-4 w-4 inline mr-2 text-muted-foreground" />
                        {[registry.registrantName, registry.partnerName].filter(Boolean).join(" & ")}
                      </p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Button asChild size="sm">
                        <Link href={`/gift-registry/${registry.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Manage Items
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/registry/${registry.shareCode}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Public Page
                        </Link>
                      </Button>
                      <Dialog open={editRegistry?.id === registry.id} onOpenChange={(open) => {
                        if (!open) setEditRegistry(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(registry)}
                            data-testid={`button-edit-registry-${registry.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Edit Gift Registry</DialogTitle>
                          </DialogHeader>
                          <RegistryForm isEdit />
                          <DialogFooter>
                            <Button
                              onClick={() => editRegistry && updateMutation.mutate(editRegistry.id)}
                              disabled={!title || updateMutation.isPending}
                            >
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-delete-registry-${registry.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Registry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{registry.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(registry.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
