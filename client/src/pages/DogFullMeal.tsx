import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Play, ShoppingCart, CheckCircle2, PawPrint } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";

// ─── Brand color tokens ────────────────────────────────────────────
const C = {
  primary: "#012d1d",
  secondary: "#944923",
  white: "#ffffff",
  surface: "#f9faf6",
  surfaceContainerLow: "#f3f4f0",
  surfaceContainerHighest: "#e2e3e0",
  outlineVariant: "#c1c8c2",
  onSurfaceVariant: "#414844",
  onSurface: "#1a1c1a",
  onPrimaryContainer: "#c0edd4",
  secondaryContainer: "#fe9e71",
};

function getProductImage(product: any): string {
  if (!product) return "";
  const imgs = product.images || product.productImages || [];
  const primary = imgs.find((i: any) => i.isPrimary) || imgs[0];
  return primary?.url || primary?.imageUrl || product.imageUrl || product.image || "";
}

// Biometric data cycling per product index for visual variety
const BIOMETRIC_DATA = [
  { label1: "PROTEIN DENSITY", val1: "HIGH_REF_88%", label2: "VITAMIN PROFILE", val2: "A_B12_FOLATE", title: "BIOMETRIC DATA" },
  { label1: "AMINO ARCHIVE", val1: "COMPLETE_L_SYNTH", label2: "DIGESTION RATING", val2: "OPTIMAL_0.98", title: "NUTRIENT ASSAY" },
  { label1: "EPA / DHA", val1: "3.2_RATIO_MAX", label2: "INFLAMMATION CTL", val2: "ACTIVE_SUPP", title: "MOLECULAR PROFILE" },
  { label1: "IRON DENSITY", val1: "WILD_CLASS_A", label2: "COLLAGEN YIELD", val2: "JOINT_SUPP", title: "SPECIMEN ASSAY" },
];

const SPECIMEN_LABELS = ["ARCHIVE_SPECIMEN.01", "ARCHIVE_SPECIMEN.02", "ARCHIVE_SPECIMEN.03", "ARCHIVE_SPECIMEN.04", "ARCHIVE_SPECIMEN.05", "ARCHIVE_SPECIMEN.06"];

const WHY_CHECKS = [
  { title: "Whole meat + organ", desc: "Foundational biological nutrition in every recipe" },
  { title: "No synthetic fillers", desc: "Zero corn, wheat, or soy interference" },
  { title: "Absolute Purity", desc: "No artificial anything. Pure evolutionary fuel." },
  { title: "Precision Cooking", desc: "Gently cooked to preserve molecular integrity" },
];

const TICKER_ITEMS = [
  "Biological Precision: 100% Traceable",
  "99% Wolf DNA Alignment",
  "Batch ID: #WOLF-2024-DELTA",
  "No Fillers. No Grains.",
  "Gently Cooked Synthesis",
  "Human-Grade Ingredients",
  "Vet-Formulated Recipes",
];

// ─── Ticker Band ──────────────────────────────────────────────────
function TickerBand() {
  const repeated = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div
      className="overflow-hidden border-y py-5"
      style={{ backgroundColor: C.primary, borderColor: `${C.white}22` }}
    >
      <style>{`
        @keyframes dfm-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .dfm-ticker { animation: dfm-ticker 40s linear infinite; white-space: nowrap; display: inline-block; }
      `}</style>
      <div className="dfm-ticker">
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-8 mx-8">
            <span
              className="uppercase text-[11px] tracking-[0.25em] font-bold"
              style={{ color: C.onPrimaryContainer, fontFamily: "Inter, sans-serif" }}
            >
              {item}
            </span>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: C.secondaryContainer }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Product Card (alternating layout) ───────────────────────────
function EditorialProductCard({
  product,
  index,
  onAddToCart,
}: {
  product: any;
  index: number;
  onAddToCart: (p: any) => void;
}) {
  const isReversed = index % 2 === 1;
  const bio = BIOMETRIC_DATA[index % BIOMETRIC_DATA.length];
  const specimen = SPECIMEN_LABELS[index % SPECIMEN_LABELS.length];
  const imgSrc = getProductImage(product);
  const price = product.salePrice || product.price;

  const quote = product.description
    ? `"${product.description.slice(0, 120).replace(/<[^>]+>/g, "")}…"`
    : `"Precision-formulated nutrition. Biologically appropriate for the modern canine predator."`;

  return (
    <div
      className={`flex flex-col ${isReversed ? "md:flex-row-reverse" : "md:flex-row"} items-center px-[64px] gap-20`}
    >
      {/* Image */}
      <div className="w-full md:w-3/5 relative flex-shrink-0">
        <div
          className={`absolute z-10 font-mono text-[11px] px-4 py-2 ${
            isReversed ? "top-8 right-8" : "top-8 left-8"
          }`}
          style={{ backgroundColor: C.primary, color: C.white, letterSpacing: "0.1em" }}
        >
          {specimen}
        </div>
        <div style={{ boxShadow: `40px 40px 0px 0px ${C.primary}E6` }}>
          <img
            src={imgSrc || `https://lh3.googleusercontent.com/aida-public/AB6AXuBuSXNg5gvRs9dZPHpSss6HNpcziyEP3I4J0RKLwMqFtXo9k9KZBhlsJPFhciIxBj2YIj0CLcwbKZ02wmydQySE3Z6NrtNMmaW-bPLWZno5aGhTYVuL1x8c6QOSPgnmk2BfdOq15qg_iEMi1KUguDcIHyXbnqSssYOTzwZ-u59lirB_sQorVD-B_VBnbCNtV24c5RiTTtGiIgy18PjH8KUVrCZzsEYjLAjrowiUkSFTNUZxUZ2ZBAds1FN1I79GiG2QculMT_E7JTUw`}
            alt={product.title}
            className="w-full object-cover"
            style={{ aspectRatio: "4/5" }}
            loading="lazy"
          />
        </div>
      </div>

      {/* Text */}
      <div className="w-full md:w-2/5 space-y-8 flex flex-col gap-4">
        {/* Title + quote */}
        <div
          className={`${isReversed ? "border-r-4 pr-8 md:text-right" : "border-l-4 pl-8"}`}
          style={{ borderColor: isReversed ? C.primary : C.secondary }}
        >
          <h3
            className="font-playfair mb-4"
            style={{ fontSize: "clamp(36px,5vw,52px)", fontWeight: 600, color: C.primary }}
          >
            {product.title}
          </h3>
          {price && (
            <p
              className="font-inter text-base mb-3"
              style={{ color: C.secondary, fontWeight: 600, letterSpacing: "0.05em" }}
            >
              ₹{parseFloat(price).toFixed(2)}
            </p>
          )}
          <p
            className="font-playfair text-xl italic leading-relaxed"
            style={{ color: C.onSurfaceVariant }}
          >
            {quote}
          </p>
        </div>

        {/* Biometric data panel */}
        <div
          className="p-8 border"
          style={{ backgroundColor: C.surfaceContainerLow, borderColor: C.outlineVariant }}
        >
          <p
            className="font-inter mb-4"
            style={{ fontSize: "10px", letterSpacing: "0.3em", color: `${C.primary}80`, textTransform: "uppercase", fontWeight: 700 }}
          >
            {bio.title}
          </p>
          <div
            className="flex justify-between border-b py-2"
            style={{ borderColor: C.outlineVariant }}
          >
            <span className="font-inter text-xs uppercase tracking-widest" style={{ color: C.onSurface }}>{bio.label1}</span>
            <span className="font-mono text-xs" style={{ color: C.primary }}>{bio.val1}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="font-inter text-xs uppercase tracking-widest" style={{ color: C.onSurface }}>{bio.label2}</span>
            <span className="font-mono text-xs" style={{ color: C.primary }}>{bio.val2}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className={`flex flex-wrap gap-4 ${isReversed ? "md:justify-end" : ""}`}>
          <Link href={`/product/${product.slug}`}>
            <button
              className="font-inter text-xs uppercase tracking-widest px-12 py-4 transition-all duration-300 cursor-pointer"
              style={{ backgroundColor: C.primary, color: C.white }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = C.secondary)}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = C.primary)}
            >
              VIEW SPECIMEN
            </button>
          </Link>
          <button
            onClick={() => onAddToCart(product)}
            className="font-inter text-xs uppercase tracking-widest px-12 py-4 border transition-all duration-300 cursor-pointer flex items-center gap-2"
            style={{ borderColor: C.primary, color: C.primary, backgroundColor: "transparent" }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primary;
              (e.currentTarget as HTMLButtonElement).style.color = C.white;
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = C.primary;
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            ADD TO CART
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cinematic play section ───────────────────────────────────────
function VideoSection({
  imgSrc,
  label,
  title,
  dark = false,
}: {
  imgSrc: string;
  label: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <section className="relative w-full overflow-hidden" style={{ height: "70vh" }}>
      <img
        src={imgSrc}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
        style={dark ? { filter: "grayscale(1) brightness(0.6)" } : { opacity: 0.6 }}
        loading="lazy"
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: dark ? `${C.primary}66` : `${C.primary}22` }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
        {/* Play button */}
        <button
          className="w-24 h-24 rounded-full flex items-center justify-center mb-8 transition-all duration-400"
          style={{ backgroundColor: `${C.primary}CC`, backdropFilter: "blur(4px)" }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = `${C.secondary}E6`)}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = `${C.primary}CC`)}
          aria-label="Play video"
        >
          <Play className="w-12 h-12 fill-current" style={{ color: C.white }} />
        </button>
        <p
          className="font-inter text-xs uppercase mb-3"
          style={{ letterSpacing: "0.5em", color: `${C.white}B3` }}
        >
          {label}
        </p>
        <h2
          className="font-playfair"
          style={{ fontSize: "clamp(28px,5vw,48px)", color: C.white, fontWeight: 600 }}
        >
          {title}
        </h2>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function DogFullMeal() {
  const { addToCart } = useStore();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: productsData, isLoading } = useQuery<{ products: any[] }>({
    queryKey: ["/api/products?categorySlug=full-meals&limit=12"],
  });

  const products = productsData?.products ?? [];

  const handleAddToCart = async (product: any) => {
    try {
      await addToCart(product.id, 1);
      toast({ title: `${product.title} added to cart` });
    } catch {
      toast({ variant: "destructive", title: "Could not add to cart" });
    }
  };

  return (
    <div style={{ backgroundColor: C.surface, color: C.onSurface, fontFamily: "Inter, sans-serif" }}>

      {/* ── 1. Hero Banner ────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ height: "90vh" }}>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFlghEMvULN5PqfyPTpkSOBINq1VXFIjwF8X6WEnfuJvmxmFCHIrIo2WMSkUgGh9vY_yUgzrbmFSkLrytAZcUqYk4M9tVUQmYv9bRv2yg9qdJosc3MC9DTyHzJYWJm2KmDEuDqOCAbMB_whlwjRiP-8MtzB6HwRlTmzeeo_HHBELbgFHFgh42aIMojv4maBbqmmPBqNba6Do5SuwSyX4fKSJhBJNj1eHVa8n_ZzZWL_MAQBhtGK6PtaS-4ohFDsw4mQx2XOvCkBgpk"
          alt="Dog Full Meal Hero"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scale(1.05)" }}
          loading="eager"
        />
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          style={{ backgroundColor: `${C.primary}4D` }}
        >
          <h1
            className="font-playfair leading-none mb-6 max-w-6xl"
            style={{ fontSize: "clamp(52px,10vw,120px)", fontWeight: 700, color: C.white, letterSpacing: "-0.02em" }}
          >
            Every dog is a{" "}
            <i className="italic" style={{ fontFamily: "Playfair Display, serif" }}>
              wolf
            </i>{" "}
            at heart.
          </h1>
          <p
            className="font-playfair italic mb-4 max-w-4xl"
            style={{ fontSize: "clamp(18px,3vw,30px)", color: C.white, fontWeight: 300 }}
          >
            We cook for the wolf your dog still is — not the pet it's become.
          </p>
          <p
            className="font-inter uppercase mb-12"
            style={{ fontSize: "11px", letterSpacing: "0.6em", color: `${C.white}E6`, fontWeight: 700 }}
          >
            Real meat. Real organs. Real meals.
          </p>
          <button
            onClick={() => {
              const el = document.getElementById("dfm-meals");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="font-inter uppercase px-14 py-5 transition-all duration-500 cursor-pointer"
            style={{
              fontSize: "11px",
              letterSpacing: "0.15em",
              fontWeight: 700,
              backgroundColor: C.white,
              color: C.primary,
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primary;
              (e.currentTarget as HTMLButtonElement).style.color = C.white;
              (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${C.white}`;
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.white;
              (e.currentTarget as HTMLButtonElement).style.color = C.primary;
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid transparent";
            }}
          >
            Explore the Archive →
          </button>
        </div>
      </section>

      {/* ── 2. Why the Wolf ───────────────────────────────── */}
      <section
        className="border-y py-[80px] flex flex-col md:flex-row items-center justify-between gap-12 px-[64px]"
        style={{ borderColor: C.outlineVariant, backgroundColor: C.surfaceContainerLow }}
      >
        <div className="flex-1">
          <span
            className="font-inter block mb-4"
            style={{ fontSize: "11px", letterSpacing: "0.3em", color: C.secondary, fontWeight: 700, textTransform: "uppercase" }}
          >
            BIOLOGICAL ANALYSIS
          </span>
          <h2
            className="font-playfair mb-6"
            style={{ fontSize: "clamp(40px,6vw,72px)", fontWeight: 700, color: C.primary }}
          >
            Why the Wolf
          </h2>
          <p
            className="font-inter mb-8 max-w-xl"
            style={{ fontSize: "clamp(16px,2vw,20px)", color: C.onSurfaceVariant, fontWeight: 300, lineHeight: 1.7 }}
          >
            99% wolf DNA. Same teeth. Same short, acidic gut built for meat, not fillers. We just
            never stopped feeding it that way.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            {WHY_CHECKS.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: C.primary }} />
                <div>
                  <p
                    className="font-inter text-xs uppercase font-bold mb-1"
                    style={{ color: C.primary, letterSpacing: "0.1em" }}
                  >
                    {item.title}
                  </p>
                  <p className="text-xs" style={{ color: C.onSurfaceVariant }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Concentric circles diagram */}
        <div className="relative w-80 h-80 flex-shrink-0 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full border flex items-center justify-center"
            style={{ borderColor: `${C.primary}1A` }}
          >
            <div
              className="w-56 h-56 rounded-full border flex items-center justify-center"
              style={{ borderColor: `${C.primary}4D` }}
            >
              <div
                className="w-36 h-36 rounded-full border flex items-center justify-center"
                style={{ borderColor: `${C.primary}99`, backgroundColor: `${C.primary}0D` }}
              >
                <PawPrint className="w-14 h-14" style={{ color: C.primary }} />
              </div>
            </div>
          </div>
          <div
            className="absolute font-mono text-[11px] tracking-widest"
            style={{
              top: -16,
              right: -16,
              color: C.primary,
              transform: "rotate(90deg)",
              transformOrigin: "left center",
              letterSpacing: "0.3em",
            }}
          >
            CANIS_LUPUS_REF_99
          </div>
        </div>
      </section>

      {/* ── Video Section 1 ───────────────────────────────── */}
      <VideoSection
        imgSrc="https://lh3.googleusercontent.com/aida/AP1WRLvuz6wDqgllbWA8p2EssqY0zKgRvqveFpY7LpxnyUHP1_Dt00EhP_FEhvVaWckxcpAW40u8gA4jmYG0S_xU9rnoIJRK-aKucgmTABg-hPaa6AHQM9LmWFf_LqH7v9Lvb2Gy3BnohXYa6__3E9Q-DlM1geDw3gGOQiH7GCryB99H5pCA9jOGSwj5YIsGbnzBr_PtELQ0yOhXcM3Gohw7lGXGMM3lq1207s7yvRtukGXfUIe1hQhZZJbbA9hy"
        label="CINEMATIC DOCUMENTARY"
        title="The Wolf Inside: A Biological Study"
        dark
      />

      {/* ── 3. Products Gallery ───────────────────────────── */}
      <main id="dfm-meals" className="py-[80px] overflow-hidden" style={{ backgroundColor: C.surface }}>
        <div className="px-[64px] mb-[80px]">
          <h2
            className="font-playfair mb-4"
            style={{ fontSize: "clamp(48px,7vw,84px)", fontWeight: 700, color: C.primary }}
          >
            Wet Food Meals
          </h2>
          <p
            className="font-inter max-w-3xl"
            style={{ fontSize: "clamp(16px,2vw,24px)", color: C.onSurfaceVariant, fontWeight: 300, lineHeight: 1.7 }}
          >
            Whole-animal meals. One protein. Nothing hiding in it.
          </p>
        </div>

        {isLoading ? (
          <div className="px-[64px] grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded" style={{ backgroundColor: C.surfaceContainerLow }} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="space-y-40">
            {products.map((product, i) => (
              <EditorialProductCard
                key={product.id}
                product={product}
                index={i}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          /* Fallback specimen cards when no API products */
          <div className="space-y-40">
            {[
              {
                id: "fallback-1",
                slug: "shop",
                title: "Chicken Liver",
                description: "Nature's multivitamin. The first thing a wolf eats at every kill. Concentrated vitality for the modern predator.",
                price: "499",
                images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBuSXNg5gvRs9dZPHpSss6HNpcziyEP3I4J0RKLwMqFtXo9k9KZBhlsJPFhciIxBj2YIj0CLcwbKZ02wmydQySE3Z6NrtNMmaW-bPLWZno5aGhTYVuL1x8c6QOSPgnmk2BfdOq15qg_iEMi1KUguDcIHyXbnqSssYOTzwZ-u59lirB_sQorVD-B_VBnbCNtV24c5RiTTtGiIgy18PjH8KUVrCZzsEYjLAjrowiUkSFTNUZxUZ2ZBAds1FN1I79GiG2QculMT_E7JTUw", isPrimary: true }] },
              {
                id: "fallback-2",
                slug: "shop",
                title: "Pure Chicken",
                description: "Lean, everyday protein. The pack's daily staple. Clean energy for sustained biological performance.",
                price: "449",
                images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDASp98o3P0FgYgy5Hilex9YhhCLmUjcFfgvFoSCdWtcbC9pi9D1EeNbEmagN8-c70V8VIJh7bGd7pKyOZ9bP81o947HNbQdD79_efbu-TATrHUjDap9Lrr44uu-6qln-DZ-WMmTTu1YsVOtR4Yti6Du_DFxAcK6aVulOTfjtjmC2RvyLTGsIUIaTBc3tkinU3NBmyvWLsjlUQRJ8oNsiLpdV7ErPfjG9KwVGVd8MbxgEbEzeiz0f3e1b7hioMVDLJ5KUaNgob", isPrimary: true }] },
              {
                id: "fallback-3",
                slug: "shop",
                title: "Omega Fish",
                description: "Omega-rich. For coat, joints, and brain. The crystalline energy of the deep, harvested for canine cognitive health.",
                price: "549",
                images: [{ url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAeMN5mdW7jRDF8rEtwJgRIxt9V4q2uyRXFYfp7Sabgr3gkUdiTtTvK6Jymo2zPGYRLw74UtpKMPqTkcU4jvQSZB2N-I4Tn-8Mq5ico5ONGP1AZouqgByGMUGHucM-NVbIgkJD3SK2cOa7EvTx3mkKYHV9utTy-Du1hDv6-bJHt3sPVgk-nX-8HMaI40RIU2pXY5NdbJgCaWZI6nYSeyT41YDTxXO3CJKmjTHR7YsOJ0aAwVkUdyRMfGn19VzaiZGxlE0AGxIQ9QmS", isPrimary: true }] },
            ].map((product, i) => (
              <EditorialProductCard
                key={product.id}
                product={product}
                index={i}
                onAddToCart={() => navigate("/shop")}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Interstitial Banner ───────────────────────────── */}
      <section
        className="relative w-full flex items-center justify-start overflow-hidden"
        style={{ height: "80vh" }}
      >
        <img
          src="https://lh3.googleusercontent.com/aida/AP1WRLuyl5EViKkGxOfraqcvJ1eWgvnPxiEm3nSPhnlSxEKqEV5f-Lp55MknwoBjO4CfGnFKvqrpIqfM2uXUdv5wxRz-A4NSQVGFnuDIqoEREa18FveczKF7kxE-cTJNnr__4qWn5_kmFAv0UFbS2ksV27z9hvvy167eRI948LUjIvmHwsTSCIDV6M8M2UgZYlo-7KLwZIT2SSOA6XDdO3QSQZk-XShiLJm_gXXNwnUOyf2Y_XBJOGXFdSM0cBuh"
          alt="The Ancestral Plate"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
        <div className="relative z-10 w-full px-[64px] text-left">
          <span
            className="font-inter block mb-4"
            style={{ fontSize: "18px", letterSpacing: "0.8em", color: C.primary, fontWeight: 700, textTransform: "uppercase" }}
          >
            SPECIMEN ANALYSIS
          </span>
          <h2
            className="font-playfair leading-tight"
            style={{ fontSize: "clamp(48px,8vw,96px)", color: C.primary, fontWeight: 700 }}
          >
            The Ancestral{" "}
            <br />
            <i className="italic" style={{ fontFamily: "Playfair Display, serif" }}>
              Plate
            </i>
          </h2>
          <div className="mt-12 flex gap-12 items-start">
            <div className="w-px h-24" style={{ backgroundColor: `${C.primary}4D` }} />
            <p
              className="font-inter max-w-md"
              style={{ fontSize: "20px", color: C.primary, fontWeight: 300, lineHeight: 1.7 }}
            >
              Precisely balanced components. Every ingredient serves a biological imperative. No
              filler. No compromise.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. Biryani Collection ─────────────────────────── */}
      <section
        className="py-[80px] overflow-hidden relative"
        style={{ backgroundColor: C.primary }}
      >
        <div className="px-[64px] mb-[80px] relative z-10">
          <h2
            className="font-playfair mb-6"
            style={{ fontSize: "clamp(48px,7vw,84px)", fontWeight: 700, color: C.white }}
          >
            The Biryani Collection
          </h2>
          <p
            className="font-inter max-w-4xl mb-12"
            style={{ fontSize: "clamp(16px,2vw,24px)", color: `${C.white}CC`, fontWeight: 300, lineHeight: 1.7 }}
          >
            Layered with the herbs and fats a wolf's diet was always missing. Every biryani is a
            synthesis of ancient spice and biological precision.
          </p>

          {/* Spice pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {[
              { name: "Turmeric", desc: "Anti-inflammatory synthesis for joint preservation and recovery." },
              { name: "Ashwagandha", desc: "Biological adaptogen for neural balance and stress mediation." },
              { name: "Coconut Oil", desc: "Molecular fat carrier for maximum botanical bioavailability." },
            ].map((spice) => (
              <div
                key={spice.name}
                className="p-10 border"
                style={{ backgroundColor: `${C.white}0D`, borderColor: `${C.white}1A` }}
              >
                <h4
                  className="font-inter mb-4 uppercase"
                  style={{ fontSize: "18px", letterSpacing: "0.3em", color: C.secondaryContainer, fontWeight: 700 }}
                >
                  {spice.name}
                </h4>
                <p className="font-inter" style={{ color: `${C.white}B3`, fontWeight: 300, lineHeight: 1.7 }}>
                  {spice.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Biryani product cards */}
        <div className="space-y-48 px-[64px] relative z-10">
          {[
            {
              title: "Mutton Biryani",
              label: "PREMIUM SELECTION",
              desc: "Rich, iron-dense, the closest thing to a wild feast. A celebration of big-game proteins and traditional synthesis.",
              img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAeMN5mdW7jRDF8rEtwJgRIxt9V4q2uyRXFYfp7Sabgr3gkUdiTtTvK6Jymo2zPGYRLw74UtpKMPqTkcU4jvQSZB2N-I4Tn-8Mq5ico5ONGP1AZouqgByGMUGHucM-NVbIgkJD3SK2cOa7EvTx3mkKYHV9utTy-Du1hDv6-bJHt3sPVgk-nX-8HMaI40RIU2pXY5NdbJgCaWZI6nYSeyT41YDTxXO3CJKmjTHR7YsOJ0aAwVkUdyRMfGn19VzaiZGxlE0AGxIQ9QmS",
              reversed: true,
            },
            {
              title: "Chicken Biryani",
              label: "DAILY FOUNDATION",
              desc: "Daily protein, feast-day flavor. Balanced nutrition meeting evolutionary cravings for complex texture.",
              img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBuSXNg5gvRs9dZPHpSss6HNpcziyEP3I4J0RKLwMqFtXo9k9KZBhlsJPFhciIxBj2YIj0CLcwbKZ02wmydQySE3Z6NrtNMmaW-bPLWZno5aGhTYVuL1x8c6QOSPgnmk2BfdOq15qg_iEMi1KUguDcIHyXbnqSssYOTzwZ-u59lirB_sQorVD-B_VBnbCNtV24c5RiTTtGiIgy18PjH8KUVrCZzsEYjLAjrowiUkSFTNUZxUZ2ZBAds1FN1I79GiG2QculMT_E7JTUw",
              reversed: false,
            },
          ].map((item) => (
            <div
              key={item.title}
              className={`flex flex-col ${item.reversed ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-24`}
            >
              <div className="w-full md:w-3/5">
                <div
                  className="p-4"
                  style={{
                    backgroundColor: C.white,
                    boxShadow: `40px 40px 0px 0px ${C.secondary}99`,
                  }}
                >
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full object-cover"
                    style={{ aspectRatio: "4/5" }}
                    loading="lazy"
                  />
                </div>
              </div>
              <div className={`w-full md:w-2/5 space-y-10 ${item.reversed ? "md:text-right" : ""}`}>
                <div>
                  <span
                    className="font-inter block mb-4"
                    style={{ fontSize: "11px", letterSpacing: "0.5em", color: C.secondaryContainer, fontWeight: 700, textTransform: "uppercase" }}
                  >
                    {item.label}
                  </span>
                  <h3
                    className="font-playfair mb-6 uppercase"
                    style={{ fontSize: "clamp(40px,5vw,64px)", color: C.white, fontWeight: 700 }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="font-playfair italic"
                    style={{ fontSize: "clamp(18px,2vw,24px)", color: `${C.white}B3`, lineHeight: 1.6 }}
                  >
                    "{item.desc}"
                  </p>
                </div>
                <div className={`flex flex-wrap gap-6 pt-10 ${item.reversed ? "md:justify-end" : ""}`}>
                  <button
                    className="font-inter uppercase px-16 py-5 transition-all cursor-pointer"
                    style={{ fontSize: "13px", letterSpacing: "0.1em", fontWeight: 700, backgroundColor: C.secondary, color: C.white }}
                    onMouseOver={e => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.white;
                      (e.currentTarget as HTMLButtonElement).style.color = C.primary;
                    }}
                    onMouseOut={e => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.secondary;
                      (e.currentTarget as HTMLButtonElement).style.color = C.white;
                    }}
                    onClick={() => navigate("/shop")}
                  >
                    ACQUIRE SPECIMEN
                  </button>
                  <button
                    className="font-inter uppercase px-16 py-5 border transition-all cursor-pointer flex items-center justify-center gap-2"
                    style={{ fontSize: "13px", letterSpacing: "0.1em", fontWeight: 700, borderColor: C.white, color: C.white, backgroundColor: "transparent" }}
                    onMouseOver={e => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.white;
                      (e.currentTarget as HTMLButtonElement).style.color = C.primary;
                    }}
                    onMouseOut={e => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = C.white;
                    }}
                    onClick={() => navigate("/shop")}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    ADD TO CART
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Video Section 2 ───────────────────────────────── */}
      <VideoSection
        imgSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuDnhcrOXDz9EYkl-E0ilJajSa-UkjCqCcZau4jufEeLe-_gqFN1vmeXvp9woooDLDjFWWBYqhXzoghABWWGQJxCq4EOazoanZ-Jhvrrh9oyx41es-1qNIo4rHwW3L_ysOyByfW9iC3G_EmYtQnemO5ufGpIJ28qN5Q_NEfD_K-rO3qp0xAydnfXOMOyPMXC087Bi_zXmCYL1hCMQeotQNOv0Xr7hzM6l1iVzm8eaUyZ5GezCZWwYreW8vsDde4jxCSWQP3hVyJt00K9"
        label="LABORATORY INSIGHTS"
        title="The Science of Synthesis"
      />

      {/* ── 5. Final CTA ──────────────────────────────────── */}
      <section
        className="py-[80px] flex flex-col items-center text-center px-6 border-b"
        style={{ backgroundColor: "#f9faf6", borderColor: C.outlineVariant }}
      >
        <h2
          className="font-playfair mb-16 leading-tight"
          style={{ fontSize: "clamp(56px,9vw,100px)", color: C.primary, fontWeight: 700 }}
        >
          Feed the Wolf{" "}
          <br />
          <i className="italic" style={{ fontFamily: "Playfair Display, serif" }}>
            Inside Your Dog
          </i>
        </h2>
        <div className="flex flex-col sm:flex-row gap-10">
          <button
            onClick={() => navigate("/shop")}
            className="font-inter uppercase px-16 py-6 transition-all cursor-pointer"
            style={{ fontSize: "11px", letterSpacing: "0.15em", fontWeight: 700, backgroundColor: C.primary, color: C.white }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = C.secondary)}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = C.primary)}
          >
            WET MEALS ARCHIVE →
          </button>
          <button
            onClick={() => navigate("/shop")}
            className="font-inter uppercase px-16 py-6 border transition-all cursor-pointer"
            style={{ fontSize: "11px", letterSpacing: "0.15em", fontWeight: 700, borderColor: C.primary, color: C.primary, backgroundColor: "transparent" }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primary;
              (e.currentTarget as HTMLButtonElement).style.color = C.white;
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = C.primary;
            }}
          >
            BIRYANI COLLECTION →
          </button>
        </div>
      </section>

      {/* ── Ticker Band ───────────────────────────────────── */}
      <TickerBand />

    </div>
  );
}
