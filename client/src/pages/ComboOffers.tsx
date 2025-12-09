import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Package, Percent, ChevronRight, ShoppingCart, Calendar, ArrowRight, Gift, AlertCircle, RefreshCw, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import type { ProductWithDetails } from "@shared/schema";

interface ComboOffer {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  mediaUrls: string[] | null;
  productIds: string[];
  originalPrice: string;
  comboPrice: string;
  discountPercentage: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean | null;
  position: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  products: ProductWithDetails[];
}

interface ComboOffersPageSettings {
  bannerUrl: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerCtaText: string;
  bannerCtaLink: string;
  showBanner: boolean;
  sectionImageUrl: string;
  sectionTitle: string;
  sectionDescription: string;
  showSectionImage: boolean;
  sectionImageTargetRow: number;
  sectionImagePlacement: "before" | "after";
  sectionImageWidth: "25" | "50" | "75" | "100";
  sectionImageAlignment: "left" | "center" | "right";
}

export default function ComboOffers() {
  const { data, isLoading, isError, refetch } = useQuery<{ offers: ComboOffer[] }>({
    queryKey: ["/api/combo-offers", { active: "true" }],
  });

  const { data: settingsData } = useQuery<{ settings: ComboOffersPageSettings }>({
    queryKey: ["/api/settings/combo-offers"],
  });

  const settings = settingsData?.settings;
  const offers = data?.offers || [];

  return (
    <div>
      {settings?.showBanner && settings?.bannerUrl && (
        <div className="relative overflow-hidden">
          <img 
            src={settings.bannerUrl} 
            alt={settings.bannerTitle || "Combo Offers"} 
            className="w-full h-48 md:h-64 lg:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-lg text-white">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3" data-testid="text-combo-banner-title">
                  {settings.bannerTitle || "Combo Offers"}
                </h1>
                <p className="text-lg text-white/90 mb-6" data-testid="text-combo-banner-subtitle">
                  {settings.bannerSubtitle || "Save more when you buy together!"}
                </p>
                {settings.bannerCtaText && settings.bannerCtaLink && (
                  <Link href={settings.bannerCtaLink}>
                    <Button size="lg" variant="secondary" data-testid="button-combo-banner-cta">
                      {settings.bannerCtaText}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {(!settings?.showBanner || !settings?.bannerUrl) && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold" data-testid="text-combo-page-title">Combo Offers</h1>
            </div>
            <p className="text-muted-foreground">
              Save more when you buy together! Check out our specially curated product bundles.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-48" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-semibold mb-2">Failed to Load Offers</h2>
            <p className="text-muted-foreground mb-6">
              Something went wrong while loading combo offers. Please try again.
            </p>
            <Button onClick={() => refetch()} data-testid="button-retry-combo-offers">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No Combo Offers Available</h2>
            <p className="text-muted-foreground mb-6">
              Check back soon for exciting product bundles!
            </p>
            <Button asChild>
              <Link href="/">
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <SectionImageOfferGrid 
            offers={offers}
            settings={settings}
          />
        )}
      </div>
    </div>
  );
}

function SectionImageBanner({ 
  settings,
  className 
}: { 
  settings: ComboOffersPageSettings | undefined;
  className?: string;
}) {
  if (!settings?.showSectionImage || !settings?.sectionImageUrl) return null;

  const width = String(settings.sectionImageWidth || "100");
  const alignment = String(settings.sectionImageAlignment || "left");

  const widthClass = {
    "25": "w-full md:w-1/4",
    "50": "w-full md:w-1/2",
    "75": "w-full md:w-3/4",
    "100": "w-full",
  }[width] || "w-full";

  const alignmentClass = {
    "left": "justify-start",
    "center": "justify-center",
    "right": "justify-end",
  }[alignment] || "justify-start";

  return (
    <div 
      className={`flex ${alignmentClass} ${className || ""}`} 
      data-testid="combo-section-image-container"
      data-width={width}
      data-alignment={alignment}
    >
      <div className={`${widthClass} relative overflow-hidden rounded-xl`}>
        <img 
          src={settings.sectionImageUrl} 
          alt={settings.sectionTitle || "Bundle & Save"} 
          className="w-full h-40 md:h-48 object-cover"
          data-testid="img-combo-section"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent flex items-center">
          <div className="p-6 text-white max-w-lg">
            <h2 className="text-xl md:text-2xl font-bold mb-2" data-testid="text-combo-section-title">
              {settings.sectionTitle || "Bundle & Save"}
            </h2>
            <p className="text-sm md:text-base text-white/90" data-testid="text-combo-section-description">
              {settings.sectionDescription || "Get the best value with our specially curated bundles"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionImageOfferGrid({ 
  offers, 
  settings 
}: { 
  offers: ComboOffer[];
  settings: ComboOffersPageSettings | undefined;
}) {
  const itemsPerRow = 3;
  const targetRow = settings?.sectionImageTargetRow || 1;
  const placement = settings?.sectionImagePlacement || "before";
  const showSectionImage = settings?.showSectionImage && settings?.sectionImageUrl;

  const insertIndex = placement === "before" 
    ? (targetRow - 1) * itemsPerRow 
    : targetRow * itemsPerRow;

  const clampedInsertIndex = Math.min(insertIndex, offers.length);

  const beforeOffers = offers.slice(0, clampedInsertIndex);
  const afterOffers = offers.slice(clampedInsertIndex);

  return (
    <div className="space-y-6">
      {beforeOffers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beforeOffers.map((offer) => (
            <ComboOfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}

      {showSectionImage && (
        <SectionImageBanner settings={settings} className="my-6" />
      )}

      {afterOffers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {afterOffers.map((offer) => (
            <ComboOfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}

function ComboOfferCard({ offer }: { offer: ComboOffer }) {
  const { addToCart } = useStore();
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);

  const savings = parseFloat(offer.originalPrice) - parseFloat(offer.comboPrice);
  const discountPercent = offer.discountPercentage 
    ? parseFloat(offer.discountPercentage).toFixed(0) 
    : ((savings / parseFloat(offer.originalPrice)) * 100).toFixed(0);

  const hasEnded = offer.endDate && new Date(offer.endDate) < new Date();
  const timeRemaining = offer.endDate ? getTimeRemaining(new Date(offer.endDate)) : null;

  const isVideoUrl = (url: string) => {
    return /\.(mp4|webm|ogg|mov|avi)$/i.test(url) || url.includes('video');
  };

  const getProductPrimaryImage = (product: ProductWithDetails) => {
    const primaryImg = product.images?.find(img => img.isPrimary);
    return primaryImg?.url || product.images?.[0]?.url || null;
  };

  const uploadedMedia = offer.mediaUrls?.filter(url => url) || [];
  const productImages = offer.products
    .map(product => getProductPrimaryImage(product))
    .filter((url): url is string => url !== null);

  const mediaItems = uploadedMedia.length > 0 ? uploadedMedia : productImages;
  const hasMedia = mediaItems.length > 0;
  const isProductImages = uploadedMedia.length === 0 && productImages.length > 0;

  useEffect(() => {
    if (hasMedia && mediaItems.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % mediaItems.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [hasMedia, mediaItems.length]);

  const handleAddComboToCart = async () => {
    try {
      for (const product of offer.products) {
        await addToCart(product.id, 1);
      }
      toast({
        title: "Combo added to cart!",
        description: `${offer.name} - All ${offer.products.length} items added`,
      });
    } catch (error) {
      toast({
        title: "Failed to add combo",
        variant: "destructive",
      });
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrev = () => {
    setCurrentSlide(prev => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const goToNext = () => {
    setCurrentSlide(prev => (prev + 1) % mediaItems.length);
  };

  return (
    <Card className="overflow-hidden group" data-testid={`card-combo-${offer.id}`}>
      <div className="relative aspect-square overflow-hidden">
        {hasMedia ? (
          <>
            <div 
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {mediaItems.map((url, idx) => (
                <div key={idx} className="w-full flex-shrink-0 h-full relative">
                  {isVideoUrl(url) ? (
                    <video
                      src={url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`${offer.name} - ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {isProductImages && offer.products[idx] && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <span className="text-white text-sm font-medium line-clamp-1">
                        {offer.products[idx].title}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {mediaItems.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80"
                  onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                  data-testid="button-carousel-prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80"
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  data-testid="button-carousel-next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {mediaItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentSlide 
                          ? 'bg-white scale-110' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      data-testid={`button-carousel-dot-${idx}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : offer.imageUrl ? (
          <img
            src={offer.imageUrl}
            alt={offer.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-2 p-4">
              {offer.products.slice(0, 4).map((product, idx) => (
                <div key={idx} className="relative">
                  <div className="aspect-square w-20 rounded bg-muted flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Badge className="absolute top-3 left-3 bg-green-600 z-10">
          <Percent className="h-3 w-3 mr-1" />
          {discountPercent}% OFF
        </Badge>

        {timeRemaining && !hasEnded && (
          <Badge variant="secondary" className="absolute top-3 right-3 z-10">
            <Calendar className="h-3 w-3 mr-1" />
            {timeRemaining}
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-xl line-clamp-1">{offer.name}</CardTitle>
        {offer.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {offer.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pb-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1 max-h-20 overflow-hidden">
            {offer.products.slice(0, 4).map((product) => (
              <Link key={product.id} href={`/product/${product.slug}`}>
                <Badge variant="outline" className="text-xs hover-elevate cursor-pointer">
                  {product.title.length > 20 ? product.title.substring(0, 20) + '...' : product.title}
                </Badge>
              </Link>
            ))}
            {offer.products.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{offer.products.length - 4} more
              </Badge>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(parseFloat(offer.comboPrice))}
            </span>
            <span className="text-lg text-muted-foreground line-through">
              {formatCurrency(parseFloat(offer.originalPrice))}
            </span>
          </div>

          <p className="text-sm text-green-600 font-medium">
            You save {formatCurrency(savings)}!
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button 
          className="w-full" 
          onClick={handleAddComboToCart}
          disabled={!!hasEnded}
          data-testid={`button-add-combo-${offer.id}`}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {hasEnded ? 'Offer Ended' : 'Add Combo to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function getTimeRemaining(endDate: Date): string | null {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return null;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 7) return `${days} days left`;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m left`;
}
