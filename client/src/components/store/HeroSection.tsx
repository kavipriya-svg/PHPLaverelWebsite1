import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Banner } from "@shared/schema";

export function HeroSection() {
  const { data: bannersData, isLoading } = useQuery<{ banners: Banner[] }>({
    queryKey: ["/api/banners"],
  });

  const banners = bannersData?.banners?.filter(b => b.type === "hero" && b.isActive) || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentBanner = banners[currentIndex];

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  // Hero banner dimensions: 1920x600 = 31.25% aspect ratio
  const heroHeight = "h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]";

  if (isLoading) {
    return (
      <section className={`relative w-full ${heroHeight}`}>
        <Skeleton className="w-full h-full" />
      </section>
    );
  }

  if (!banners.length) {
    return (
      <section className={`relative w-full ${heroHeight} bg-gradient-to-br from-primary/20 via-background to-accent/20`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
              Welcome to ShopHub
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover amazing products at unbeatable prices
            </p>
            <Button size="lg" asChild>
              <Link href="/shop" data-testid="button-shop-now">
                Shop Now
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const isVideo = currentBanner.mediaType === "video" && currentBanner.videoUrl;

  return (
    <section className={`relative w-full ${heroHeight} overflow-hidden`} data-testid="section-hero">
      {isVideo ? (
        <video
          ref={videoRef}
          src={currentBanner.videoUrl || ""}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay={currentBanner.autoplay !== false}
          loop
          muted={isMuted}
          playsInline
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: currentBanner.mediaUrl
              ? `url(${currentBanner.mediaUrl})`
              : "linear-gradient(to bottom right, hsl(var(--primary) / 0.2), hsl(var(--background)), hsl(var(--accent) / 0.2))",
          }}
        />
      )}

      {(currentBanner.title || currentBanner.subtitle || (currentBanner.ctaText && currentBanner.ctaLink)) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4 max-w-4xl">
            {currentBanner.title && (
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
                {currentBanner.title}
              </h1>
            )}
            {currentBanner.subtitle && (
              <p className="text-base md:text-lg lg:text-xl text-white mb-8 max-w-2xl mx-auto drop-shadow-md">
                {currentBanner.subtitle}
              </p>
            )}
            {currentBanner.ctaText && currentBanner.ctaLink && (
              <Button 
                size="lg" 
                asChild 
                className="bg-white text-black hover:bg-white/90"
              >
                <Link href={currentBanner.ctaLink} data-testid="button-hero-cta">
                  {currentBanner.ctaText}
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {isVideo && (
        <div className="absolute bottom-6 right-6 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-black/50 border-white/20 text-white hover:bg-black/70"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-black/50 border-white/20 text-white hover:bg-black/70"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {banners.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 border-white/20 text-white hover:bg-black/70"
            onClick={goToPrevious}
            data-testid="button-hero-prev"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 border-white/20 text-white hover:bg-black/70"
            onClick={goToNext}
            data-testid="button-hero-next"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/70"
                }`}
                onClick={() => setCurrentIndex(index)}
                data-testid={`button-hero-dot-${index}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
