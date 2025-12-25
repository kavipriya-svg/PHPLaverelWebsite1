import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Building2, Loader2, MapPin, Star, Calendar, CheckCircle, XCircle, Upload, Image, Video, X } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const { data: localitiesData } = useQuery<{ localities: SwimGroomLocality[] }>({
    queryKey: ["/api/admin/swim-groom/localities", cityId],
    enabled: !!cityId,
  });

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
      localityId: localityId || null,
      pincode: pincode.trim() || null,
      gstNumber: gstNumber.trim() || null,
      gstName: gstName.trim() || null,
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

          {provider && (
            <div className="space-y-2">
              <Label>Gallery (Images & Videos)</Label>
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
                          const formData = new FormData();
                          formData.append("file", file);
                          const res = await fetch("/api/admin/upload", {
                            method: "POST",
                            body: formData,
                          });
                          if (res.ok) {
                            const { url } = await res.json();
                            await apiRequest("POST", `/api/admin/swim-groom/providers/${provider.id}/media`, {
                              mediaType: "image",
                              mediaUrl: url,
                              title: file.name,
                              position: mediaFiles.length,
                            });
                          }
                        }
                        queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers"] });
                        toast({ title: "Images uploaded successfully" });
                      } catch (err) {
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
                        const formData = new FormData();
                        formData.append("file", file);
                        const res = await fetch("/api/admin/upload", {
                          method: "POST",
                          body: formData,
                        });
                        if (res.ok) {
                          const { url } = await res.json();
                          await apiRequest("POST", `/api/admin/swim-groom/providers/${provider.id}/media`, {
                            mediaType: "video",
                            mediaUrl: url,
                            title: file.name,
                            position: mediaFiles.length,
                          });
                          queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/providers"] });
                          toast({ title: "Video uploaded successfully" });
                        }
                      } catch (err) {
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
            </div>
          )}

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
