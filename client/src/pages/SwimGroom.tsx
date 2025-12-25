import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MapPin, Search, Star, Clock, ChevronRight, Waves, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { SwimGroomService, SwimGroomProvider, SwimGroomCountry } from "@shared/schema";

type SwimGroomState = { id: string; name: string; countryId: string };
type SwimGroomCity = { id: string; name: string; stateId: string };
type SwimGroomProviderWithDetails = SwimGroomProvider & {
  city?: SwimGroomCity | null;
  state?: SwimGroomState | null;
  country?: SwimGroomCountry | null;
  services?: any[];
};

export default function SwimGroom() {
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  const { data: servicesData, isLoading: servicesLoading } = useQuery<{ services: SwimGroomService[] }>({
    queryKey: ["/api/swim-groom/services"],
  });

  const { data: providersData, isLoading: providersLoading } = useQuery<{ providers: SwimGroomProviderWithDetails[] }>({
    queryKey: ["/api/swim-groom/providers", selectedService, selectedCity],
  });

  const { data: citiesData } = useQuery<{ cities: SwimGroomCity[] }>({
    queryKey: ["/api/swim-groom/cities"],
  });

  const services = servicesData?.services || [];
  const providers = providersData?.providers || [];
  const cities = citiesData?.cities || [];

  const filteredProviders = providers.filter((p) =>
    search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Swimming & Grooming Services</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Find the best swimming and grooming services for your pets. Browse verified providers near you.
        </p>
      </div>

      {/* Services Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Our Services</h2>
        {servicesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No services available at the moment.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service) => (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all hover-elevate ${
                  selectedService === service.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedService(selectedService === service.id ? "" : service.id)}
              >
                <CardContent className="p-4 text-center">
                  {service.imageUrl ? (
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-16 h-16 mx-auto mb-3 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Waves className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <h3 className="font-medium">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {service.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-swim-groom"
          />
        </div>
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(selectedService || selectedCity) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedService("");
              setSelectedCity("");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Providers Grid */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Service Providers</h2>
        {providersLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : filteredProviders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Waves className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No providers found. Try adjusting your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <Link key={provider.id} href={`/swim-groom/provider/${provider.slug}`}>
                <Card className="h-full hover-elevate cursor-pointer">
                  <div className="aspect-video relative bg-muted">
                    {provider.bannerUrl ? (
                      <img
                        src={provider.bannerUrl}
                        alt={provider.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Waves className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {provider.isVerified && (
                      <Badge className="absolute top-2 right-2 bg-green-500">Verified</Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold line-clamp-1">{provider.name}</h3>
                      {provider.rating && (
                        <div className="flex items-center gap-1 text-sm shrink-0">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>{provider.rating}</span>
                          <span className="text-muted-foreground">
                            ({provider.reviewCount || 0})
                          </span>
                        </div>
                      )}
                    </div>
                    {provider.city && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {provider.city.name}
                          {provider.state && `, ${provider.state.name}`}
                        </span>
                      </div>
                    )}
                    {provider.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {provider.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-primary font-medium">View Details</span>
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
