import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Building2, Loader2, MapPin, Star, Calendar, CheckCircle, XCircle } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import type { SwimGroomProvider, SwimGroomCountry, SwimGroomService } from "@shared/schema";

type SwimGroomState = { id: string; name: string; countryId: string; country?: SwimGroomCountry | null };
type SwimGroomCity = { id: string; name: string; stateId: string; state?: SwimGroomState | null };
type SwimGroomProviderWithDetails = SwimGroomProvider & {
  country?: SwimGroomCountry | null;
  state?: SwimGroomState | null;
  city?: SwimGroomCity | null;
  services?: any[];
  media?: any[];
};

export default function AdminSwimGroomProviders() {
  const [search, setSearch] = useState("");
  const [editProvider, setEditProvider] = useState<SwimGroomProviderWithDetails | null>(null);
  const [deleteProvider, setDeleteProvider] = useState<SwimGroomProviderWithDetails | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ providers: SwimGroomProviderWithDetails[]; total: number }>({
    queryKey: ["/api/admin/swim-groom/providers", search],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/swim-groom/providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers"] });
      toast({ title: "Provider deleted successfully" });
      setDeleteProvider(null);
    },
    onError: () => {
      toast({ title: "Failed to delete provider", variant: "destructive" });
    },
  });

  const providers = data?.providers || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Service Providers</h1>
            <p className="text-muted-foreground">Manage swimming & grooming service providers</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-provider">
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            data-testid="input-search-providers"
          />
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
        ) : providers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No providers yet. Add your first service provider.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {provider.logoUrl ? (
                            <img src={provider.logoUrl} alt={provider.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{provider.name}</div>
                            <div className="text-sm text-muted-foreground">{provider.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {provider.city?.name || provider.state?.name || provider.country?.name || "Not set"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>{provider.rating || "0.0"}</span>
                          <span className="text-muted-foreground text-sm">({provider.reviewCount || 0})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={provider.isActive ? "default" : "outline"}>
                            {provider.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {provider.isVerified ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {provider.commissionType === "percentage" 
                            ? `${provider.commissionValue}%` 
                            : `₹${provider.commissionValue}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditProvider(provider)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/swim-groom/providers/${provider.slug}`, "_blank")}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Page
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteProvider(provider)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <ProviderDialog
          open={isAddDialogOpen || !!editProvider}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditProvider(null);
            }
          }}
          provider={editProvider}
        />

        <AlertDialog open={!!deleteProvider} onOpenChange={() => setDeleteProvider(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Provider</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteProvider?.name}"? This will also delete all their slots and bookings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteProvider && deleteMutation.mutate(deleteProvider.id)}
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

function ProviderDialog({
  open,
  onOpenChange,
  provider,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: SwimGroomProviderWithDetails | null;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [commissionType, setCommissionType] = useState<"percentage" | "fixed">("percentage");
  const [commissionValue, setCommissionValue] = useState("10");
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const { data: countriesData } = useQuery<{ countries: SwimGroomCountry[] }>({
    queryKey: ["/api/admin/swim-groom/countries"],
  });

  const { data: statesData } = useQuery<{ states: SwimGroomState[] }>({
    queryKey: ["/api/admin/swim-groom/states", countryId],
    enabled: !!countryId,
  });

  const { data: citiesData } = useQuery<{ cities: SwimGroomCity[] }>({
    queryKey: ["/api/admin/swim-groom/cities", stateId],
    enabled: !!stateId,
  });

  const countries = countriesData?.countries || [];
  const states = statesData?.states?.filter(s => !countryId || s.countryId === countryId) || [];
  const cities = citiesData?.cities?.filter(c => !stateId || c.stateId === stateId) || [];

  const resetForm = () => {
    if (provider) {
      setName(provider.name);
      setEmail(provider.email || "");
      setPassword("");
      setPhone(provider.phone || "");
      setDescription(provider.description || "");
      setAddress(provider.address || "");
      setCountryId(provider.countryId || "");
      setStateId(provider.stateId || "");
      setCityId(provider.cityId || "");
      setCommissionType((provider.commissionType as "percentage" | "fixed") || "percentage");
      setCommissionValue(provider.commissionValue || "10");
      setIsActive(provider.isActive ?? true);
      setIsVerified(provider.isVerified ?? false);
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setDescription("");
      setAddress("");
      setCountryId(countries[0]?.id || "");
      setStateId("");
      setCityId("");
      setCommissionType("percentage");
      setCommissionValue("10");
      setIsActive(true);
      setIsVerified(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/swim-groom/providers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers"] });
      toast({ title: "Provider created successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to create provider", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/admin/swim-groom/providers/${provider?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers"] });
      toast({ title: "Provider updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update provider", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Provider name is required", variant: "destructive" });
      return;
    }
    if (!email.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    if (!provider && !password) {
      toast({ title: "Password is required for new providers", variant: "destructive" });
      return;
    }

    const data: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
      description: description.trim() || null,
      address: address.trim() || null,
      countryId: countryId || null,
      stateId: stateId || null,
      cityId: cityId || null,
      commissionType,
      commissionValue,
      isActive,
      isVerified,
    };

    if (password) {
      data.password = password;
    }

    if (provider) {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={() => resetForm()}>
        <DialogHeader>
          <DialogTitle>{provider ? "Edit Provider" : "Add Provider"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Provider Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Pet Paradise"
                data-testid="input-provider-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="provider@example.com"
                data-testid="input-provider-email"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password {provider && "(leave blank to keep current)"}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={provider ? "Leave blank to keep current" : "Enter password"}
                data-testid="input-provider-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                data-testid="input-provider-phone"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="About the provider..."
              rows={3}
              data-testid="input-provider-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address..."
              rows={2}
              data-testid="input-provider-address"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={countryId} onValueChange={(v) => { setCountryId(v); setStateId(""); setCityId(""); }}>
                <SelectTrigger data-testid="select-provider-country">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not selected</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={stateId} onValueChange={(v) => { setStateId(v); setCityId(""); }} disabled={!countryId}>
                <SelectTrigger data-testid="select-provider-state">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not selected</SelectItem>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Select value={cityId} onValueChange={setCityId} disabled={!stateId}>
                <SelectTrigger data-testid="select-provider-city">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not selected</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Commission Type</Label>
              <Select value={commissionType} onValueChange={(v: "percentage" | "fixed") => setCommissionType(v)}>
                <SelectTrigger data-testid="select-commission-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionValue">Commission Value</Label>
              <Input
                id="commissionValue"
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                placeholder={commissionType === "percentage" ? "e.g., 10" : "e.g., 100"}
                data-testid="input-commission-value"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} data-testid="switch-provider-active" />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="isVerified" checked={isVerified} onCheckedChange={setIsVerified} data-testid="switch-provider-verified" />
              <Label htmlFor="isVerified">Verified</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} data-testid="button-save-provider">
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {provider ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
