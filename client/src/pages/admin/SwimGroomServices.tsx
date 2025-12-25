import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Edit, Trash2, Waves, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SwimGroomService } from "@shared/schema";

export default function AdminSwimGroomServices() {
  const [editService, setEditService] = useState<SwimGroomService | null>(null);
  const [deleteService, setDeleteService] = useState<SwimGroomService | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ services: SwimGroomService[] }>({
    queryKey: ["/api/admin/swim-groom/services"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/swim-groom/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/swim-groom/services"] });
      toast({ title: "Service deleted successfully" });
      setDeleteService(null);
    },
    onError: () => {
      toast({ title: "Failed to delete service", variant: "destructive" });
    },
  });

  const services = data?.services || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Swimming & Grooming Services</h1>
            <p className="text-muted-foreground">Manage available services</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-service">
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No services yet. Create your first service.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card key={service.id} className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {service.iconUrl ? (
                        <img
                          src={service.iconUrl}
                          alt={service.name}
                          className="w-12 h-12 object-contain rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Waves className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">/{service.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={service.isActive ? "default" : "outline"}>
                        {service.isActive ? "Active" : "Hidden"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditService(service)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteService(service)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <ServiceDialog
          open={isAddDialogOpen || !!editService}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditService(null);
            }
          }}
          service={editService}
        />

        <AlertDialog open={!!deleteService} onOpenChange={() => setDeleteService(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Service</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteService?.name}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteService && deleteMutation.mutate(deleteService.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

function ServiceDialog({
  open,
  onOpenChange,
  service,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: SwimGroomService | null;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    if (service) {
      setName(service.name);
      setSlug(service.slug);
      setDescription(service.description || "");
      setIconUrl(service.iconUrl || "");
      setImageUrl(service.imageUrl || "");
      setIsActive(service.isActive ?? true);
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setIconUrl("");
      setImageUrl("");
      setIsActive(true);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/swim-groom/services", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/swim-groom/services"] });
      toast({ title: "Service created successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to create service", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/admin/swim-groom/services/${service?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/swim-groom/services"] });
      toast({ title: "Service updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update service", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Service name is required", variant: "destructive" });
      return;
    }

    const generatedSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const data = {
      name: name.trim(),
      slug: generatedSlug,
      description: description.trim() || null,
      iconUrl: iconUrl.trim() || null,
      imageUrl: imageUrl.trim() || null,
      isActive,
    };

    if (service) {
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
          <DialogTitle>{service ? "Edit Service" : "Add Service"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Service Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Swimming Pool"
              data-testid="input-service-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL-friendly name)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Auto-generated from name if empty"
              data-testid="input-service-slug"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Service description..."
              rows={3}
              data-testid="input-service-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iconUrl">Icon URL</Label>
              <Input
                id="iconUrl"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                placeholder="https://..."
                data-testid="input-service-icon"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                data-testid="input-service-image"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              data-testid="switch-service-active"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} data-testid="button-save-service">
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {service ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
