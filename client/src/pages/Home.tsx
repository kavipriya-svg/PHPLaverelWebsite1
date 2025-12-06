import { useQuery } from "@tanstack/react-query";
import { HeroSection } from "@/components/store/HeroSection";
import { HomeBlocks, SpecialOffersSection, NewArrivalsSection, TrendingSection, CategoryShowcase, BlogShowcase } from "@/components/store/HomeBlocks";
import type { HomeBlock } from "@shared/schema";

export default function Home() {
  const { data: blocksData } = useQuery<{ blocks: HomeBlock[] }>({
    queryKey: ["/api/home-blocks"],
  });

  const blocks = blocksData?.blocks?.filter(b => b.isActive) || [];

  return (
    <div className="min-h-screen">
      <HeroSection />
      
      <div className="py-16 space-y-16">
        <CategoryShowcase />
        
        <SpecialOffersSection />
        
        <TrendingSection />
        
        {blocks.length > 0 && <HomeBlocks blocks={blocks} />}
        
        <NewArrivalsSection />

        <section className="w-full px-4">
          <div className="bg-card rounded-lg p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Join Our Newsletter
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Subscribe to get special offers, free giveaways, and exclusive deals.
            </p>
            <form className="flex gap-2 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-md border bg-background"
                data-testid="input-newsletter"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover-elevate"
                data-testid="button-subscribe"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>

        <section className="w-full px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-6 bg-card rounded-lg">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Free Shipping</h3>
                <p className="text-sm text-muted-foreground">On orders over ₹500</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-card rounded-lg">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Easy Returns</h3>
                <p className="text-sm text-muted-foreground">30-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-card rounded-lg">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">100% secure checkout</p>
              </div>
            </div>
          </div>
        </section>

        <BlogShowcase />
      </div>
    </div>
  );
}
