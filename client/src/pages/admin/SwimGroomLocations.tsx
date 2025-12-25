import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Edit, Trash2, MapPin, Loader2, ChevronRight } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SwimGroomCountry, SwimGroomState, SwimGroomCity, SwimGroomLocality } from "@shared/schema";

type SwimGroomStateWithCountry = SwimGroomState & { country?: SwimGroomCountry | null };
type SwimGroomCityWithState = SwimGroomCity & { state?: SwimGroomStateWithCountry | null };
type SwimGroomLocalityWithCity = SwimGroomLocality & { city?: SwimGroomCityWithState | null };

export default function AdminSwimGroomLocations() {
  const [activeTab, setActiveTab] = useState("countries");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Location Management</h1>
          <p className="text-muted-foreground">Manage countries, states, cities, and localities for service providers</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="countries" data-testid="tab-countries">Countries</TabsTrigger>
            <TabsTrigger value="states" data-testid="tab-states">States</TabsTrigger>
            <TabsTrigger value="cities" data-testid="tab-cities">Cities</TabsTrigger>
            <TabsTrigger value="localities" data-testid="tab-localities">Localities/Areas</TabsTrigger>
          </TabsList>

          <TabsContent value="countries" className="mt-4">
            <CountriesTab />
          </TabsContent>
          <TabsContent value="states" className="mt-4">
            <StatesTab />
          </TabsContent>
          <TabsContent value="cities" className="mt-4">
            <CitiesTab />
          </TabsContent>
          <TabsContent value="localities" className="mt-4">
            <LocalitiesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function CountriesTab() {
  const [editItem, setEditItem] = useState<SwimGroomCountry | null>(null);
  const [deleteItem, setDeleteItem] = useState<SwimGroomCountry | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ countries: SwimGroomCountry[] }>({
    queryKey: ["/api/admin/swim-groom/countries"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/swim-groom/countries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/countries"] });
      toast({ title: "Country deleted successfully" });
      setDeleteItem(null);
    },
    onError: () => {
      toast({ title: "Failed to delete country", variant: "destructive" });
    },
  });

  const countries = data?.countries || [];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{countries.length} Countries</h2>
        <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-country">
          <Plus className="h-4 w-4 mr-2" />
          Add Country
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : countries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No countries yet. Add your first country.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {countries.map((country) => (
            <Card key={country.id} className="hover-elevate">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{country.name}</span>
                  {country.code && (
                    <Badge variant="outline" className="text-xs">{country.code}</Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditItem(country)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteItem(country)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CountryDialog
        open={isAddOpen || !!editItem}
        onOpenChange={(o) => { setIsAddOpen(false); setEditItem(null); }}
        country={editItem}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Country</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will also delete all states and cities in this country.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CountryDialog({ open, onOpenChange, country }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  country: SwimGroomCountry | null;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    if (country) {
      setName(country.name);
      setCode(country.code || "");
      setIsActive(country.isActive ?? true);
    } else {
      setName("");
      setCode("");
      setIsActive(true);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/swim-groom/countries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/countries"] });
      toast({ title: "Country created successfully" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to create country", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/admin/swim-groom/countries/${country?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/countries"] });
      toast({ title: "Country updated successfully" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to update country", variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    const data = { name: name.trim(), code: code.trim() || null, isActive };
    country ? updateMutation.mutate(data) : createMutation.mutate(data);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false); else resetForm(); }}>
      <DialogContent onOpenAutoFocus={resetForm}>
        <DialogHeader>
          <DialogTitle>{country ? "Edit Country" : "Add Country"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Country Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., India" data-testid="input-country-name" />
          </div>
          <div className="space-y-2">
            <Label>Country Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., IN" data-testid="input-country-code" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading} data-testid="button-save-country">
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {country ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatesTab() {
  const [editItem, setEditItem] = useState<SwimGroomStateWithCountry | null>(null);
  const [deleteItem, setDeleteItem] = useState<SwimGroomStateWithCountry | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const { toast } = useToast();

  const { data: countriesData } = useQuery<{ countries: SwimGroomCountry[] }>({
    queryKey: ["/api/admin/swim-groom/countries"],
  });

  const { data, isLoading } = useQuery<{ states: SwimGroomStateWithCountry[] }>({
    queryKey: ["/api/admin/swim-groom/states"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/swim-groom/states/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/states"] });
      toast({ title: "State deleted successfully" });
      setDeleteItem(null);
    },
    onError: () => {
      toast({ title: "Failed to delete state", variant: "destructive" });
    },
  });

  const countries = countriesData?.countries || [];
  const states = data?.states || [];
  const filteredStates = filterCountry && filterCountry !== "all" ? states.filter(s => s.countryId === filterCountry) : states;

  return (
    <>
      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{filteredStates.length} States</h2>
          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-state">
          <Plus className="h-4 w-4 mr-2" />
          Add State
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : filteredStates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No states yet. Add your first state.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredStates.map((state) => (
            <Card key={state.id} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{state.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      {state.country?.name} <ChevronRight className="h-3 w-3" /> {state.name}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditItem(state)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteItem(state)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <StateDialog
        open={isAddOpen || !!editItem}
        onOpenChange={(o) => { setIsAddOpen(false); setEditItem(null); }}
        state={editItem}
        countries={countries}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete State</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will also delete all cities in this state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StateDialog({ open, onOpenChange, state, countries }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  state: SwimGroomStateWithCountry | null;
  countries: SwimGroomCountry[];
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [countryId, setCountryId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    if (state) {
      setName(state.name);
      setCountryId(state.countryId);
      setIsActive(state.isActive ?? true);
    } else {
      setName("");
      setCountryId(countries[0]?.id || "");
      setIsActive(true);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/swim-groom/states", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/states"] });
      toast({ title: "State created successfully" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to create state", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/admin/swim-groom/states/${state?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/states"] });
      toast({ title: "State updated successfully" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to update state", variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    if (!countryId) return toast({ title: "Country is required", variant: "destructive" });
    const data = { name: name.trim(), countryId, isActive };
    state ? updateMutation.mutate(data) : createMutation.mutate(data);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false); else resetForm(); }}>
      <DialogContent onOpenAutoFocus={resetForm}>
        <DialogHeader>
          <DialogTitle>{state ? "Edit State" : "Add State"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Country</Label>
            <Select value={countryId} onValueChange={setCountryId}>
              <SelectTrigger data-testid="select-state-country">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>State Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Tamil Nadu" data-testid="input-state-name" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading} data-testid="button-save-state">
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {state ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CitiesTab() {
  const [editItem, setEditItem] = useState<SwimGroomCityWithState | null>(null);
  const [deleteItem, setDeleteItem] = useState<SwimGroomCityWithState | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filterState, setFilterState] = useState<string>("all");
  const { toast } = useToast();

  const { data: statesData } = useQuery<{ states: SwimGroomStateWithCountry[] }>({
    queryKey: ["/api/admin/swim-groom/states"],
  });

  const { data, isLoading } = useQuery<{ cities: SwimGroomCityWithState[] }>({
    queryKey: ["/api/admin/swim-groom/cities"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/swim-groom/cities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/cities"] });
      toast({ title: "City deleted successfully" });
      setDeleteItem(null);
    },
    onError: () => {
      toast({ title: "Failed to delete city", variant: "destructive" });
    },
  });

  const states = statesData?.states || [];
  const cities = data?.cities || [];
  const filteredCities = filterState && filterState !== "all" ? cities.filter(c => c.stateId === filterState) : cities;

  return (
    <>
      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{filteredCities.length} Cities</h2>
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-city">
          <Plus className="h-4 w-4 mr-2" />
          Add City
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : filteredCities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No cities yet. Add your first city.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCities.map((city) => (
            <Card key={city.id} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{city.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {city.state?.country?.name} <ChevronRight className="h-3 w-3 inline" /> {city.state?.name}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditItem(city)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteItem(city)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CityDialog
        open={isAddOpen || !!editItem}
        onOpenChange={(o) => { setIsAddOpen(false); setEditItem(null); }}
        city={editItem}
        states={states}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this city?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CityDialog({ open, onOpenChange, city, states }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  city: SwimGroomCityWithState | null;
  states: SwimGroomStateWithCountry[];
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [stateId, setStateId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    if (city) {
      setName(city.name);
      setStateId(city.stateId);
      setIsActive(city.isActive ?? true);
    } else {
      setName("");
      setStateId(states[0]?.id || "");
      setIsActive(true);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/swim-groom/cities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/cities"] });
      toast({ title: "City created successfully" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to create city", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/admin/swim-groom/cities/${city?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/cities"] });
      toast({ title: "City updated successfully" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to update city", variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    if (!stateId) return toast({ title: "State is required", variant: "destructive" });
    const data = { name: name.trim(), stateId, isActive };
    city ? updateMutation.mutate(data) : createMutation.mutate(data);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false); else resetForm(); }}>
      <DialogContent onOpenAutoFocus={resetForm}>
        <DialogHeader>
          <DialogTitle>{city ? "Edit City" : "Add City"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>State</Label>
            <Select value={stateId} onValueChange={setStateId}>
              <SelectTrigger data-testid="select-city-state">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.country?.name} - {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>City Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Chennai" data-testid="input-city-name" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading} data-testid="button-save-city">
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {city ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LocalitiesTab() {
  const [editItem, setEditItem] = useState<SwimGroomLocalityWithCity | null>(null);
  const [deleteItem, setDeleteItem] = useState<SwimGroomLocalityWithCity | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filterCity, setFilterCity] = useState<string>("all");
  const { toast } = useToast();

  const { data: citiesData } = useQuery<{ cities: SwimGroomCityWithState[] }>({
    queryKey: ["/api/admin/swim-groom/cities"],
  });

  const { data, isLoading } = useQuery<{ localities: SwimGroomLocalityWithCity[] }>({
    queryKey: ["/api/admin/swim-groom/localities"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/swim-groom/localities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/localities"] });
      toast({ title: "Locality deleted successfully" });
      setDeleteItem(null);
    },
    onError: () => {
      toast({ title: "Failed to delete locality", variant: "destructive" });
    },
  });

  const cities = citiesData?.cities || [];
  const localities = data?.localities || [];
  const filteredLocalities = filterCity && filterCity !== "all" ? localities.filter(l => l.cityId === filterCity) : localities;

  return (
    <>
      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{filteredLocalities.length} Localities</h2>
          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger className="w-48" data-testid="select-filter-city">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-locality">
          <Plus className="h-4 w-4 mr-2" />
          Add Locality
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filteredLocalities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No localities yet. Add your first locality.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredLocalities.map((locality) => (
            <Card key={locality.id} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{locality.name}</div>
                    {locality.pincode && (
                      <Badge variant="outline" className="text-xs mt-1">{locality.pincode}</Badge>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {locality.city?.state?.country?.name} <ChevronRight className="h-3 w-3 inline" /> {locality.city?.state?.name} <ChevronRight className="h-3 w-3 inline" /> {locality.city?.name}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditItem(locality)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteItem(locality)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LocalityDialog
        open={isAddOpen || !!editItem}
        onOpenChange={(o) => { setIsAddOpen(false); setEditItem(null); }}
        locality={editItem}
        cities={cities}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Locality</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this locality?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function LocalityDialog({ open, onOpenChange, locality, cities }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  locality: SwimGroomLocalityWithCity | null;
  cities: SwimGroomCityWithState[];
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [cityId, setCityId] = useState("");
  const [pincode, setPincode] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    if (locality) {
      setName(locality.name);
      setCityId(locality.cityId);
      setPincode(locality.pincode || "");
      setIsActive(locality.isActive ?? true);
    } else {
      setName("");
      setCityId("");
      setPincode("");
      setIsActive(true);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/swim-groom/localities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/localities"] });
      toast({ title: "Locality created successfully" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to create locality", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/admin/swim-groom/localities/${locality?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/swim-groom/localities"] });
      toast({ title: "Locality updated successfully" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to update locality", variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    if (!cityId) return toast({ title: "City is required", variant: "destructive" });
    const data = { name: name.trim(), cityId, pincode: pincode.trim() || null, isActive };
    locality ? updateMutation.mutate(data) : createMutation.mutate(data);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false); else resetForm(); }}>
      <DialogContent onOpenAutoFocus={resetForm}>
        <DialogHeader>
          <DialogTitle>{locality ? "Edit Locality" : "Add Locality"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>City</Label>
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger data-testid="select-locality-city">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.state?.country?.name} - {c.state?.name} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Locality/Area Name</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g., T. Nagar, Anna Nagar" 
              data-testid="input-locality-name" 
            />
          </div>
          <div className="space-y-2">
            <Label>Pincode</Label>
            <Input 
              value={pincode} 
              onChange={(e) => setPincode(e.target.value)} 
              placeholder="e.g., 600017" 
              data-testid="input-locality-pincode" 
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading} data-testid="button-save-locality">
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {locality ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
