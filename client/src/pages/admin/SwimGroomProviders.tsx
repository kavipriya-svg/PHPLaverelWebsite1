import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Building2, Loader2, MapPin, Star, Calendar, CheckCircle, XCircle, Upload, Image, Video, X, FileText, AlertCircle, IndianRupee, Percent, Clock } from "lucide-react";
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
type SwimGroomLocality = { id: string; name: string; pincode?: string | null; cityId: string; isActive: boolean };
type SwimGroomProviderMedia = { id: string; providerId: string; mediaType: string; mediaUrl: string; title?: string | null; position: number };
type SwimGroomProviderService = { id: string; providerId: string; serviceId: string; price: string; discountType: string; discountValue: string; salePrice?: string | null; duration: number; description?: string | null; notes?: string | null; isActive: boolean; service?: SwimGroomService };
type SwimGroomVerificationDoc = { id: string; providerId: string; verificationType: string; documentLabel: string; documentUrl: string; status: string; reviewNotes?: string | null; uploadedAt: string; };

async function uploadFile(file: File): Promise<string> {
  const uploadRes = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "include",
  });
  if (!uploadRes.ok) throw new Error("Failed to get upload URL");
  const { uploadURL } = await uploadRes.json();
  if (!uploadURL) throw new Error("No upload URL received");
  
  const putRes = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!putRes.ok) throw new Error("Failed to upload file");
  
  const finalizeRes = await fetch("/api/admin/upload/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadURL }),
    credentials: "include",
  });
  if (!finalizeRes.ok) throw new Error("Failed to finalize upload");
  const { objectPath } = await finalizeRes.json();
  return objectPath;
}
type SwimGroomProviderWithDetails = SwimGroomProvider & {
  country?: SwimGroomCountry | null;
  state?: SwimGroomState | null;
  city?: SwimGroomCity | null;
  locality?: SwimGroomLocality | null;
  services?: any[];
  media?: SwimGroomProviderMedia[];
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
  provider: initialProvider,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: SwimGroomProviderWithDetails | null;
}) {
  const { toast } = useToast();
  const [currentProvider, setCurrentProvider] = useState<SwimGroomProviderWithDetails | null>(initialProvider);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [localityId, setLocalityId] = useState("");
  const [pincode, setPincode] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [gstName, setGstName] = useState("");
  const [commissionType, setCommissionType] = useState<"percentage" | "fixed">("percentage");
  const [commissionValue, setCommissionValue] = useState("10");
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<SwimGroomProviderMedia[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [ownerType, setOwnerType] = useState<"individual" | "business">("individual");
  const [ownerVerificationStatus, setOwnerVerificationStatus] = useState("pending");
  const [addressVerificationStatus, setAddressVerificationStatus] = useState("pending");
  const [ownerVerificationNotes, setOwnerVerificationNotes] = useState("");
  const [addressVerificationNotes, setAddressVerificationNotes] = useState("");
  const [verificationDocs, setVerificationDocs] = useState<SwimGroomVerificationDoc[]>([]);
  const [providerServices, setProviderServices] = useState<SwimGroomProviderService[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const ownerDocInputRef = useRef<HTMLInputElement>(null);
  const addressDocInputRef = useRef<HTMLInputElement>(null);
  
  const provider = currentProvider;
  
  useEffect(() => {
    setCurrentProvider(initialProvider);
  }, [initialProvider]);

  const { data: countriesData } = useQuery<{ countries: SwimGroomCountry[] }>({
    queryKey: ["/api/admin/swim-groom/countries"],
  });

  const { data: statesData } = useQuery<{ states: SwimGroomState[] }>({
    queryKey: [`/api/admin/swim-groom/states?countryId=${countryId}`],
    enabled: !!countryId,
  });

  const { data: citiesData } = useQuery<{ cities: SwimGroomCity[] }>({
    queryKey: [`/api/admin/swim-groom/cities?stateId=${stateId}`],
    enabled: !!stateId,
  });

  const { data: localitiesData } = useQuery<{ localities: SwimGroomLocality[] }>({
    queryKey: [`/api/admin/swim-groom/localities?cityId=${cityId}`],
    enabled: !!cityId,
  });

  const { data: allServicesData } = useQuery<{ services: SwimGroomService[] }>({
    queryKey: ["/api/admin/swim-groom/services"],
  });

  const { data: providerServicesData } = useQuery<{ services: SwimGroomProviderService[] }>({
    queryKey: ["/api/admin/swim-groom/providers", provider?.id, "services"],
    enabled: !!provider?.id,
  });

  const { data: verificationDocsData } = useQuery<{ docs: SwimGroomVerificationDoc[] }>({
    queryKey: ["/api/admin/swim-groom/providers", provider?.id, "verification-docs"],
    enabled: !!provider?.id,
  });

  useEffect(() => {
    if (providerServicesData?.services) {
      setProviderServices(providerServicesData.services);
    }
  }, [providerServicesData]);

  useEffect(() => {
    if (verificationDocsData?.docs) {
      setVerificationDocs(verificationDocsData.docs);
    }
  }, [verificationDocsData]);

  const addServiceMutation = useMutation({
    mutationFn: async (data: { serviceId: string; price: string; discountType: string; discountValue: string; duration: number; isActive: boolean }) => {
      return await apiRequest("POST", `/api/admin/swim-groom/providers/${provider?.id}/services`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers", provider?.id, "services"] });
      toast({ title: "Service added" });
    },
    onError: () => {
      toast({ title: "Failed to add service", variant: "destructive" });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ serviceId, data }: { serviceId: string; data: Partial<SwimGroomProviderService> }) => {
      return await apiRequest("PATCH", `/api/admin/swim-groom/providers/${provider?.id}/services/${serviceId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers", provider?.id, "services"] });
    },
    onError: () => {
      toast({ title: "Failed to update service", variant: "destructive" });
    },
  });

  const removeServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return await apiRequest("DELETE", `/api/admin/swim-groom/providers/${provider?.id}/services/${serviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers", provider?.id, "services"] });
      toast({ title: "Service removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove service", variant: "destructive" });
    },
  });

  const addVerificationDocMutation = useMutation({
    mutationFn: async (data: { verificationType: string; documentLabel: string; documentUrl: string; status: string }) => {
      return await apiRequest("POST", `/api/admin/swim-groom/providers/${provider?.id}/verification-docs`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers", provider?.id, "verification-docs"] });
      toast({ title: "Document uploaded" });
    },
    onError: () => {
      toast({ title: "Failed to upload document", variant: "destructive" });
    },
  });

  const deleteVerificationDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      return await apiRequest("DELETE", `/api/admin/swim-groom/verification-docs/${docId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers", provider?.id, "verification-docs"] });
      toast({ title: "Document deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete document", variant: "destructive" });
    },
  });

  const allServices = allServicesData?.services || [];
  const countries = countriesData?.countries || [];
  const states = statesData?.states?.filter(s => !countryId || s.countryId === countryId) || [];
  const cities = citiesData?.cities?.filter(c => !stateId || c.stateId === stateId) || [];
  const localities = localitiesData?.localities?.filter(l => !cityId || l.cityId === cityId) || [];

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
      setLocalityId(provider.localityId || "");
      setPincode(provider.pincode || "");
      setGstNumber(provider.gstNumber || "");
      setGstName(provider.gstName || "");
      setCommissionType((provider.commissionType as "percentage" | "fixed") || "percentage");
      setCommissionValue(provider.commissionValue || "10");
      setIsActive(provider.isActive ?? true);
      setIsVerified(provider.isVerified ?? false);
      setMediaFiles(provider.media || []);
      setOwnerType((provider.ownerType as "individual" | "business") || "individual");
      setOwnerVerificationStatus(provider.ownerVerificationStatus || "pending");
      setAddressVerificationStatus(provider.addressVerificationStatus || "pending");
      setOwnerVerificationNotes(provider.ownerVerificationNotes || "");
      setAddressVerificationNotes(provider.addressVerificationNotes || "");
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
      setLocalityId("");
      setPincode("");
      setGstNumber("");
      setGstName("");
      setCommissionType("percentage");
      setCommissionValue("10");
      setIsActive(true);
      setIsVerified(false);
      setMediaFiles([]);
      setOwnerType("individual");
      setOwnerVerificationStatus("pending");
      setAddressVerificationStatus("pending");
      setOwnerVerificationNotes("");
      setAddressVerificationNotes("");
      setVerificationDocs([]);
      setProviderServices([]);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/swim-groom/providers", data);
      return response.json();
    },
    onSuccess: (createdProvider: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers"] });
      toast({ title: "Provider created successfully. You can now upload images and videos." });
      setCurrentProvider({ ...createdProvider, media: [], services: [] });
      setMediaFiles([]);
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
      localityId: localityId || null,
      pincode: pincode.trim() || null,
      gstNumber: gstNumber.trim() || null,
      gstName: gstName.trim() || null,
      commissionType,
      commissionValue,
      isActive,
      isVerified,
      ownerType,
      ownerVerificationStatus,
      addressVerificationStatus,
      ownerVerificationNotes: ownerVerificationNotes.trim() || null,
      addressVerificationNotes: addressVerificationNotes.trim() || null,
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
              <Select value={countryId || "none"} onValueChange={(v) => { setCountryId(v === "none" ? "" : v); setStateId(""); setCityId(""); setLocalityId(""); setPincode(""); }}>
                <SelectTrigger data-testid="select-provider-country">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not selected</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={stateId || "none"} onValueChange={(v) => { setStateId(v === "none" ? "" : v); setCityId(""); setLocalityId(""); setPincode(""); }} disabled={!countryId}>
                <SelectTrigger data-testid="select-provider-state">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not selected</SelectItem>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Select value={cityId || "none"} onValueChange={(v) => { setCityId(v === "none" ? "" : v); setLocalityId(""); setPincode(""); }} disabled={!stateId}>
                <SelectTrigger data-testid="select-provider-city">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not selected</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Locality / Area</Label>
              <Select 
                value={localityId || "none"} 
                onValueChange={(v) => { 
                  const id = v === "none" ? "" : v;
                  setLocalityId(id);
                  const selectedLocality = localities.find(l => l.id === id);
                  if (selectedLocality?.pincode) {
                    setPincode(selectedLocality.pincode);
                  }
                }} 
                disabled={!cityId}
              >
                <SelectTrigger data-testid="select-provider-locality">
                  <SelectValue placeholder="Select Locality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not selected</SelectItem>
                  {localities.filter(l => l.isActive).map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name} {l.pincode ? `(${l.pincode})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Pincode"
                data-testid="input-provider-pincode"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="e.g., 22AAAAA0000A1Z5"
                data-testid="input-provider-gst-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstName">GST Name</Label>
              <Input
                id="gstName"
                value={gstName}
                onChange={(e) => setGstName(e.target.value)}
                placeholder="Business name as per GST"
                data-testid="input-provider-gst-name"
              />
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

          <div className="space-y-2">
            <Label>Gallery (Images & Videos)</Label>
            {!provider ? (
              <div className="border rounded-md p-4 text-center py-6 text-muted-foreground">
                <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Save the provider first to upload images and videos</p>
              </div>
            ) : (
              <div className="border rounded-md p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      setUploadingMedia(true);
                      try {
                        for (const file of Array.from(files)) {
                          const objectPath = await uploadFile(file);
                          await apiRequest("POST", `/api/admin/swim-groom/providers/${provider.id}/media`, {
                            mediaType: "image",
                            mediaUrl: objectPath,
                            title: file.name,
                            position: mediaFiles.length,
                          });
                        }
                        queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers"] });
                        toast({ title: "Images uploaded successfully" });
                      } catch (err) {
                        console.error("Image upload error:", err);
                        toast({ title: "Failed to upload images", variant: "destructive" });
                      } finally {
                        setUploadingMedia(false);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }
                    }}
                    data-testid="input-provider-images"
                  />
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingMedia(true);
                      try {
                        const objectPath = await uploadFile(file);
                        await apiRequest("POST", `/api/admin/swim-groom/providers/${provider.id}/media`, {
                          mediaType: "video",
                          mediaUrl: objectPath,
                          title: file.name,
                          position: mediaFiles.length,
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers"] });
                        toast({ title: "Video uploaded successfully" });
                      } catch (err) {
                        console.error("Video upload error:", err);
                        toast({ title: "Failed to upload video", variant: "destructive" });
                      } finally {
                        setUploadingMedia(false);
                        if (videoInputRef.current) videoInputRef.current.value = "";
                      }
                    }}
                    data-testid="input-provider-video"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingMedia}
                    data-testid="button-upload-images"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Upload Images
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingMedia}
                    data-testid="button-upload-video"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Upload Video
                  </Button>
                  {uploadingMedia && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {mediaFiles.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {mediaFiles.map((m) => (
                      <div key={m.id} className="relative group">
                        {m.mediaType === "video" ? (
                          <video
                            src={m.mediaUrl}
                            className="w-full h-20 object-cover rounded border"
                          />
                        ) : (
                          <img
                            src={m.mediaUrl}
                            alt={m.title || ""}
                            className="w-full h-20 object-cover rounded border"
                          />
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={async () => {
                            try {
                              await apiRequest("DELETE", `/api/admin/swim-groom/providers/${provider.id}/media/${m.id}`);
                              setMediaFiles(mediaFiles.filter(mf => mf.id !== m.id));
                              queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers"] });
                              toast({ title: "Media deleted" });
                            } catch {
                              toast({ title: "Failed to delete media", variant: "destructive" });
                            }
                          }}
                          data-testid={`button-delete-media-${m.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs">
                          {m.mediaType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No media uploaded yet. Upload images and videos to showcase the provider.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Services Section */}
          <div className="space-y-2">
            <Label>Services & Pricing</Label>
            {!provider ? (
              <div className="border rounded-md p-4 text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Save the provider first to manage services and pricing</p>
              </div>
            ) : (
              <div className="border rounded-md p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Assign services and set custom pricing</p>
                  <Select 
                    value="" 
                    onValueChange={(serviceId) => {
                      if (!serviceId) return;
                      const existingService = providerServices.find(ps => ps.serviceId === serviceId);
                      if (existingService) {
                        toast({ title: "Service already assigned", variant: "destructive" });
                        return;
                      }
                      addServiceMutation.mutate({
                        serviceId,
                        price: "0",
                        discountType: "percentage",
                        discountValue: "0",
                        duration: 60,
                        isActive: true,
                      });
                    }}
                  >
                    <SelectTrigger className="w-48" data-testid="select-add-service">
                      <SelectValue placeholder="Add Service..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allServices.filter(s => s.isActive && !providerServices.find(ps => ps.serviceId === s.id)).map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {providerServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No services assigned yet. Add services from the dropdown above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {providerServices.map((ps) => {
                      const serviceName = allServices.find(s => s.id === ps.serviceId)?.name || "Unknown Service";
                      const basePrice = parseFloat(ps.price) || 0;
                      const discountValue = parseFloat(ps.discountValue) || 0;
                      let salePrice = basePrice;
                      if (ps.discountType === "percentage" && discountValue > 0) {
                        salePrice = basePrice - (basePrice * discountValue / 100);
                      } else if (ps.discountType === "fixed" && discountValue > 0) {
                        salePrice = basePrice - discountValue;
                      }
                      salePrice = Math.max(0, salePrice);

                      return (
                        <div key={ps.id} className="border rounded p-3 space-y-2" data-testid={`provider-service-${ps.id}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={ps.isActive ? "default" : "secondary"}>{serviceName}</Badge>
                              <span className="text-sm text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />{ps.duration} min
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeServiceMutation.mutate(ps.id)}
                              data-testid={`button-remove-service-${ps.id}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <Label className="text-xs">Base Price (₹)</Label>
                              <Input
                                type="number"
                                value={ps.price}
                                onChange={(e) => {
                                  const newPrice = e.target.value;
                                  setProviderServices(prev => prev.map(p => p.id === ps.id ? { ...p, price: newPrice } : p));
                                }}
                                onBlur={() => {
                                  const currentService = providerServices.find(p => p.id === ps.id);
                                  if (currentService) {
                                    updateServiceMutation.mutate({ serviceId: ps.id, data: { price: currentService.price } });
                                  }
                                }}
                                className="h-8"
                                data-testid={`input-price-${ps.id}`}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Discount Type</Label>
                              <Select 
                                value={ps.discountType} 
                                onValueChange={(v) => {
                                  if (v === "percentage" || v === "fixed") {
                                    setProviderServices(prev => prev.map(p => p.id === ps.id ? { ...p, discountType: v } : p));
                                    updateServiceMutation.mutate({ serviceId: ps.id, data: { discountType: v } });
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8" data-testid={`select-discount-type-${ps.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage"><Percent className="h-3 w-3 inline mr-1" />Percentage</SelectItem>
                                  <SelectItem value="fixed"><IndianRupee className="h-3 w-3 inline mr-1" />Fixed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Discount {ps.discountType === "percentage" ? "%" : "₹"}</Label>
                              <Input
                                type="number"
                                value={ps.discountValue}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setProviderServices(prev => prev.map(p => p.id === ps.id ? { ...p, discountValue: newVal } : p));
                                }}
                                onBlur={() => {
                                  const currentService = providerServices.find(p => p.id === ps.id);
                                  if (currentService) {
                                    updateServiceMutation.mutate({ serviceId: ps.id, data: { discountValue: currentService.discountValue } });
                                  }
                                }}
                                className="h-8"
                                data-testid={`input-discount-${ps.id}`}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Sale Price</Label>
                              <div className="h-8 px-3 py-1 border rounded-md bg-muted flex items-center">
                                <span className="text-sm font-medium">₹{salePrice.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Duration (minutes)</Label>
                              <Input
                                type="number"
                                value={ps.duration}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 60;
                                  setProviderServices(prev => prev.map(p => p.id === ps.id ? { ...p, duration: val } : p));
                                }}
                                onBlur={() => {
                                  const currentService = providerServices.find(p => p.id === ps.id);
                                  if (currentService) {
                                    updateServiceMutation.mutate({ serviceId: ps.id, data: { duration: currentService.duration } });
                                  }
                                }}
                                className="h-8"
                                data-testid={`input-duration-${ps.id}`}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Active</Label>
                              <div className="h-8 flex items-center">
                                <Switch 
                                  checked={ps.isActive} 
                                  onCheckedChange={(checked) => {
                                    setProviderServices(prev => prev.map(p => p.id === ps.id ? { ...p, isActive: checked } : p));
                                    updateServiceMutation.mutate({ serviceId: ps.id, data: { isActive: checked } });
                                  }}
                                  data-testid={`switch-service-active-${ps.id}`}
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Notes (optional)</Label>
                            <Textarea
                              value={ps.notes || ""}
                              onChange={(e) => {
                                setProviderServices(prev => prev.map(p => p.id === ps.id ? { ...p, notes: e.target.value } : p));
                              }}
                              onBlur={() => {
                                const currentService = providerServices.find(p => p.id === ps.id);
                                if (currentService) {
                                  updateServiceMutation.mutate({ serviceId: ps.id, data: { notes: currentService.notes || null } });
                                }
                              }}
                              placeholder="Any special notes for this service..."
                              rows={2}
                              data-testid={`input-notes-${ps.id}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Verification Section */}
          <div className="space-y-2">
            <Label>Verification</Label>
            <div className="border rounded-md p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Owner Type</Label>
                  <Select value={ownerType} onValueChange={(v: "individual" | "business") => setOwnerType(v)}>
                    <SelectTrigger data-testid="select-owner-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div />
              </div>

              {/* Owner Verification */}
              <div className="border rounded p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium text-sm">Owner Verification</span>
                    <Badge variant={
                      ownerVerificationStatus === "verified" ? "default" :
                      ownerVerificationStatus === "rejected" ? "destructive" : "secondary"
                    }>
                      {ownerVerificationStatus === "verified" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {ownerVerificationStatus === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                      {ownerVerificationStatus === "pending" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {ownerVerificationStatus}
                    </Badge>
                  </div>
                  <Select value={ownerVerificationStatus} onValueChange={setOwnerVerificationStatus}>
                    <SelectTrigger className="w-32" data-testid="select-owner-verification-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Review Notes</Label>
                  <Textarea
                    value={ownerVerificationNotes}
                    onChange={(e) => setOwnerVerificationNotes(e.target.value)}
                    placeholder="Add notes about the verification..."
                    rows={2}
                    data-testid="input-owner-verification-notes"
                  />
                </div>

                {!provider ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Save provider to upload documents</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={ownerDocInputRef}
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingDoc(true);
                          try {
                            const objectPath = await uploadFile(file);
                            addVerificationDocMutation.mutate({
                              verificationType: "owner",
                              documentLabel: file.name,
                              documentUrl: objectPath,
                              status: "pending",
                            });
                          } catch (err) {
                            console.error("Owner doc upload error:", err);
                            toast({ title: "Failed to upload document", variant: "destructive" });
                          } finally {
                            setUploadingDoc(false);
                            if (ownerDocInputRef.current) ownerDocInputRef.current.value = "";
                          }
                        }}
                        data-testid="input-owner-doc"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => ownerDocInputRef.current?.click()}
                        disabled={uploadingDoc}
                        data-testid="button-upload-owner-doc"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload {ownerType === "business" ? "Business Proof" : "ID Proof"}
                      </Button>
                      {uploadingDoc && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    <div className="space-y-1">
                      {verificationDocs.filter(d => d.verificationType === "owner").map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                            <FileText className="h-3 w-3" />
                            {doc.documentLabel}
                          </a>
                          <div className="flex items-center gap-2">
                            <Badge variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                              {doc.status}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => deleteVerificationDocMutation.mutate(doc.id)}
                              data-testid={`button-delete-owner-doc-${doc.id}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Address Verification */}
              <div className="border rounded p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium text-sm">Address Verification</span>
                    <Badge variant={
                      addressVerificationStatus === "verified" ? "default" :
                      addressVerificationStatus === "rejected" ? "destructive" : "secondary"
                    }>
                      {addressVerificationStatus === "verified" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {addressVerificationStatus === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                      {addressVerificationStatus === "pending" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {addressVerificationStatus}
                    </Badge>
                  </div>
                  <Select value={addressVerificationStatus} onValueChange={setAddressVerificationStatus}>
                    <SelectTrigger className="w-32" data-testid="select-address-verification-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Review Notes</Label>
                  <Textarea
                    value={addressVerificationNotes}
                    onChange={(e) => setAddressVerificationNotes(e.target.value)}
                    placeholder="Add notes about the address verification..."
                    rows={2}
                    data-testid="input-address-verification-notes"
                  />
                </div>

                {!provider ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Save provider to upload documents</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={addressDocInputRef}
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingDoc(true);
                          try {
                            const objectPath = await uploadFile(file);
                            addVerificationDocMutation.mutate({
                              verificationType: "address",
                              documentLabel: file.name,
                              documentUrl: objectPath,
                              status: "pending",
                            });
                          } catch (err) {
                            console.error("Address doc upload error:", err);
                            toast({ title: "Failed to upload document", variant: "destructive" });
                          } finally {
                            setUploadingDoc(false);
                            if (addressDocInputRef.current) addressDocInputRef.current.value = "";
                          }
                        }}
                        data-testid="input-address-doc"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addressDocInputRef.current?.click()}
                        disabled={uploadingDoc}
                        data-testid="button-upload-address-doc"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Address Proof
                      </Button>
                      {uploadingDoc && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    <div className="space-y-1">
                      {verificationDocs.filter(d => d.verificationType === "address").map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                            <FileText className="h-3 w-3" />
                            {doc.documentLabel}
                          </a>
                          <div className="flex items-center gap-2">
                            <Badge variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                              {doc.status}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => deleteVerificationDocMutation.mutate(doc.id)}
                              data-testid={`button-delete-address-doc-${doc.id}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
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
