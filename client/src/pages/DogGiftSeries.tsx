import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ShoppingCart, ArrowRight, Star } from "lucide-react";
import {
  HomeEditorialHeader as EditorialHeader,
  HomeEditorialFooter as EditorialFooter,
} from "@/components/store/HomeEditorialLayout";
import { DEFAULT_HOMEPAGE_SETTINGS, mergeHomepageSettings } from "@/lib/homepageDefaults";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:                "#00160c",
  secondary:              "#944923",
  white:                  "#ffffff",
  surface:                "#f9faf6",
  surfaceContainerLow:    "#f3f4f0",
  surfaceContainer:       "#eeeeeb",
  surfaceContainerHigh:   "#e8e8e5",
  surfaceContainerHighest:"#e2e3e0",
  surfaceContainerLowest: "#ffffff",
  surfaceDim:             "#dadad7",
  secondaryFixed:         "#ffdbcc",
  outlineVariant:         "#c1c8c2",
  outline:                "#717973",
  onSurface:              "#1a1c1a",
  onSurfaceVariant:       "#414844",
};

const PLAYFAIR: React.CSSProperties  = { fontFamily: "Playfair Display, serif" };
const INTER: React.CSSProperties     = { fontFamily: "Inter, sans-serif" };
const MONO: React.CSSProperties      = { fontFamily: "monospace" };
const LABEL_CAPS: React.CSSProperties = { ...INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" };

// ─── Dossier data ──────────────────────────────────────────────────────────────
interface Spec { label: string; value: string; }
interface Dossier {
  id: string;
  title: string;
  desc: string;
  image: string;
  fallback: string;
  imageRight: boolean;
  bg: string;
  dark: boolean;
  ctaStyle: "solid" | "outline" | "light";
  specs: Spec[];
  slug: string;
}

const DOSSIERS: Dossier[] = [
  {
    id: "001", title: "The Wolf Diet Bundle",
    desc: "A scientifically curated nutritional protocol designed to reactivate ancestral metabolic pathways. Features vacuum-sealed, high-protein formulations and hand-thrown obsidian ceramic vessels.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDACcchjf_TUJFeGg9kuL1gtSddIuwiD1UgqgLms_qFGw-P5g6AYk-m_4_lsrNlAQYAQhMTmZLnqsy_YoXrPTj6oQu9RvAf2DnL7_ZrRBwQtRXUvMFu1vFguIYX3j9TUXkB26jxL2DfJKHVZv3RWsDyIGaQqmVdxY16yjPsJZNOaxbCiJ-BqYU9M5bbHsNFH8nj5kAlZcVvFzYcMs9RLWQErLhrWKMC8B1WaaK50Xmcw4eWADPSXvnaQBMXiUzHgs6P6l8vuZKzpUXG",
    fallback: "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=900&auto=format&fit=crop",
    imageRight: false, bg: C.surfaceContainerLow, dark: false, ctaStyle: "solid",
    slug: "raw-chicken-rice-complete-meal",
    specs: [
      { label: "Biometric Match", value: "High-Activity Canines" },
      { label: "Thermal Sync Rate", value: "92.4% Bio-Efficiency" },
      { label: "Content Spec", value: "12kg Protein Core / 3x Ceramics" },
    ],
  },
  {
    id: "002", title: "The Twinning Protocol",
    desc: "High-fashion aesthetic alignment between guardian and hound. Featuring cashmere-blend knitwear for humans and matching weatherproof structural shells for canines.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLsRfwcpjH6qO-b6GYKgBe8c2KuDT57gwsLLmkfOjFsHzW_8YT3meAisgUEg1RxkGGUzVhNhO9DQPXzotcyoHlOWYgLFXcNUZGqCYMg2r2ZDSnD5Jw4Y_OtUh4rg3AI3hx227evuVbOkrGwLfjftZHYQQBViqPk9egCiEPX5Uf-SU0WHFydJr3H_wAneKtxBzK5iXyE2MyPLcPk5UmQcsq33eFKkO-br_Qv9AhRdsE32b9qpIlQtMNDJIx7Xbl9SD_AShBcuHJLiqA",
    fallback: "https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=900&auto=format&fit=crop",
    imageRight: true, bg: C.surfaceContainerHighest, dark: false, ctaStyle: "outline",
    slug: "adventure-hoodie-set",
    specs: [
      { label: "Biometric Match", value: "Sighthound Standard" },
      { label: "Thermal Sync Rate", value: "88.1% Insulation Match" },
      { label: "Content Spec", value: "2-Piece Ensemble / ID Tags" },
    ],
  },
  {
    id: "003", title: "Neon Kinetic Kit",
    desc: "High-visibility performance gear for low-light exploration. Constructed from laser-cut ballistic nylon and radioactive-dye webbing for maximum chromatic presence.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBWWUH-UjApLt9IGQgUuWiQxrJR6z_W0AxevIWU095aPJinzU1W-Ygdgw1JKltmk4x4Itk436tP_iAk3PyK5ne2rnwE2Gv45e0N1zzy-qvRMChbutaSZpfs2R_lOmZ9rGPseAlezghqQ6N8yXe8HXuX0U8OU852GEaiiZSj6It36Jx5zNAjqe3Zg2iNJglGvUFz0goV58XMzQ6tvjCwGN-0HgNEogz9mRr2psQ3hr0tyg4GISXK_kF3T4bnv4DFD5GjnUmWgOS0oP5I",
    fallback: "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=900&auto=format&fit=crop",
    imageRight: false, bg: C.surface, dark: false, ctaStyle: "solid",
    slug: "athletic-performance-tee",
    specs: [
      { label: "Biometric Match", value: "Urban Trail Runners" },
      { label: "Thermal Sync Rate", value: "Zero Breathability Loss" },
      { label: "Content Spec", value: "Harness / Leash / Beams" },
    ],
  },
  {
    id: "004", title: "The Somatic Cradle",
    desc: "A structural recovery environment utilizing phase-change memory foam and an architectural aluminum base. Engineered for total skeletal decompression during REM cycles.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC86Gt2HJRrkwTHZlWHHjXgz7w2biFdYdtQ7-_8EIspuM52UQOrXFUXqtFAHpxTl-S-IuzqWarVHxNZsvO9Z1fYuSp0iKzduFswdMzb4QIe9kfVSenSVfxiWvHsd0BZPO_HrxffFoBhL2d5sd5Ya3SimsBFKQN-NNCjgia_qXzyz7zPwu2z0thEGnxgUX_7qVziLdR-0XHNYsGQKI6mz4J6hFfw6leGzMEWvxg1sj5w1CdLIMr1FIcY09LUWwdFV_lgXwVMGIqeV_GQ",
    fallback: "https://images.unsplash.com/photo-1534361960057-19f073a9dee3?w=900&auto=format&fit=crop",
    imageRight: true, bg: C.surfaceContainerHigh, dark: false, ctaStyle: "solid",
    slug: "wild-duck-protein-bowl",
    specs: [
      { label: "Biometric Match", value: "All Skeletal Frameworks" },
      { label: "Thermal Sync Rate", value: "Constant 22°C Regulation" },
      { label: "Content Spec", value: "Structural Cradle / Weighted Lid" },
    ],
  },
  {
    id: "005", title: "Dermal Integrity Set",
    desc: "Biological topical treatments focusing on the canine lipid barrier. Cold-pressed botanical extracts in UV-protected violet glass maintain maximum nutrient potency.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGtfw4Ks0weY1ozUpzlHY-QPQlrMA6IfOoBj61y6XuhlnV4iYHIKgm5cIF8RkW8y-Z9dxsExdklBcIa1EimlYNyD4nA7IbezSY3Ohg8zImifUGg7XRi2tnB-cs4EPt9xGKHCEF32WUPj4eJt5df03DXWABy4x-cKPyC6AphouzReN7dEk6TDCqFiScscirQQ1q5xSKZq0K180WYm8nGY1sqTGK3OECrrLUSZkewbV3Ydxnr9Z6WWDlBA-BzvzF6hg8OB1F12wAeqex",
    fallback: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=900&auto=format&fit=crop",
    imageRight: false, bg: C.surfaceContainerLow, dark: false, ctaStyle: "solid",
    slug: "air-dried-chicken-liver-bites",
    specs: [
      { label: "Biometric Match", value: "Sensitive Coats / Senior Care" },
      { label: "Thermal Sync Rate", value: "Anti-Inflammatory Optimized" },
      { label: "Content Spec", value: "3x Oils / 1x Solid Balm" },
    ],
  },
  {
    id: "006", title: "Cognitive Stimuli Pack",
    desc: "A suite of problem-solving modules designed to engage high-intelligence breeds. These vibrant, tactile artifacts demand complex neural processing and motor skills.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdnQP4-QtXfYsArtkb8t2gmKQst1UcG0PWu3PVyQR9mb_clldXKPF8qdSjGtU0cwEEyl2gy2p_tNrvmt7XPelaFwii9ifQrSHjn0QIhh_Gyr9OoucLZz3V0EFyax9dsdEsMHIpggFutYzkWm-ILehoXTXYT-Lh5NXGi8hQ95MQwYVJ9eW7gqPZ5pu91fssOMhSv2in9VCOu_226qgG4akrKCRTVy3_VuqAGd9Wf8juernCBee7G5VHyWzLhvt1LUzfjPxWVuZ0-OgI",
    fallback: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&auto=format&fit=crop",
    imageRight: true, bg: C.primary, dark: true, ctaStyle: "light",
    slug: "freeze-dried-duck-jerky-strips",
    specs: [
      { label: "Biometric Match", value: "Shepherds / Collies / Poodles" },
      { label: "Thermal Sync Rate", value: "Neural Output Max" },
      { label: "Content Spec", value: "4x Progressive Modules" },
    ],
  },
  {
    id: "007", title: "The Nomad Module",
    desc: "Integrated mobility system for the modern expeditionary. Lightweight, collapsible, and finished in high-saturation technical dyes for ease of identification in the field.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfmEvDYPIeS58dVDEZe4wo8TsEvHoJfoMsOtkJDuv-ENxzPV3Oax2m_kzOwMeHE4etAdoS1-9af1KVZKOB47ExJocObiWM_2T8Ea51yn-K53MuozQDPFLAdw1rfg3VmaHmGhOEd35ReArGA1__mrcX7YS15QaqMW0go7EcwBxSC3O1sy1x_20l8XWyZOEvlVFIRVde_7a--rKaaow2X0wnZQLWKB_8N0tapz_KoBXBxSTvhHrxXosN0Fq-tazdQzdaJA9zrj30IkTB",
    fallback: "https://images.unsplash.com/photo-1564150292913-7fc9e7700474?w=900&auto=format&fit=crop",
    imageRight: false, bg: C.surface, dark: false, ctaStyle: "solid",
    slug: "trail-proof-shorts",
    specs: [
      { label: "Biometric Match", value: "All Active Sizes" },
      { label: "Thermal Sync Rate", value: "Breathable Mesh Tech" },
      { label: "Content Spec", value: "Bowl / Mat / Storage Pod" },
    ],
  },
  {
    id: "008", title: "Micro-Nutrient Elixir",
    desc: "A liquid supplement focusing on cellular longevity. Formulated with vibrant antioxidant concentrates and suspended in pharmaceutical-grade hydration bases.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKWRmdULLMArAfUvsExBhs7Xiwd7eQvJqoy33dBr1TwxLtpetNH3wWpbmCAZIlo6Ek50qaLsOWXaW_Lq1kUtDnHAonynu7oENgvC1o9ggMv7NI1rwf6zFBmJEVpRlp6TFD4tN1tKyUaPISs3AiRwbjqy-29B1X6DGKEzoxt2r2j2ZDLSoR3l_yyhmQUmDoMqryZsZyCD3zmXpaI5Ctaq6ppddgwGLsfwSLjRrQNgRjwGjKELxZMxj8rmem4DQFAGtMYAkA_Kc4RiVd",
    fallback: "https://images.unsplash.com/photo-1612257998531-70a3d40a2af5?w=900&auto=format&fit=crop",
    imageRight: true, bg: C.surfaceContainerLowest, dark: false, ctaStyle: "solid",
    slug: "goat-liver-power-meal",
    specs: [
      { label: "Biometric Match", value: "All Genetic Baselines" },
      { label: "Thermal Sync Rate", value: "100% Bio-Absorption" },
      { label: "Content Spec", value: "30-Day Supply Vials" },
    ],
  },
  {
    id: "009", title: "The Identity Link",
    desc: "Encrypted identification jewelry. A marriage of cryptographic safety and brutalist jewelry design. Milled from single-billet aerospace titanium.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjGEqRI3A8GXsuCWdjkLlyEYiVvpYZUXPhfu_O9VrWHxhWu5v6fMc2AxJ1bRrIq8GL6XFjQtnLGKQYDiWyIWd8LdP64c9EaIkuIvn-6-wTkXzxnZ5AnNAaWTFG9s3tHttIMLkzklSuT9reLZaBu-I-7I408JGgSlUSIBC4qpKvSIAdwnhnCYpprogF808IcHXS0LoiBvyOTRrh5TiQEsZ50IFSHMoFGuXC_iuDbKQKRKnWa0UUDT5jhKLWpQkENUsvVeTsXxtkwRgU",
    fallback: "https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=900&auto=format&fit=crop",
    imageRight: false, bg: C.surfaceContainerLow, dark: false, ctaStyle: "outline",
    slug: "the-19dogs-technical-parka",
    specs: [
      { label: "Biometric Match", value: "Permanent Pairing" },
      { label: "Thermal Sync Rate", value: "Skin-Safe Anodization" },
      { label: "Content Spec", value: "Collar / Tag / App Access" },
    ],
  },
  {
    id: "010", title: "Arctic Shield Shell",
    desc: "The pinnacle of canine thermal protection. High-loft synthetic insulation encased in a vibrant electric-blue ripstop shell. Designed for sub-zero synchronization.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAg-OC8oTbqpP-GYsu99zE4ju8jE9QBaGHWzHPb4lpiOhyy3iRipqa-wfJyLh-n5sHhDZDsnh8KcHAwbrLV_B8bJFs5KoCz05cVF1QZDLn7f4C1BCkuS93058pizdG49kRLIXJGU1BUfEA4uDz33Fsb6yGbZ6hgShO-imRz3pTa37HeMFul6APmuGDVSVoxUpplJFptL9-X3AKhwzhv83ColKTG0ErYGTJHA9oAnqO1DGWSn8cgfKDD_p8_AU-R72MTtO1ZWMpUEc-",
    fallback: "https://images.unsplash.com/photo-1534289692691-b7e6e7df74c7?w=900&auto=format&fit=crop",
    imageRight: true, bg: C.surfaceDim, dark: false, ctaStyle: "solid",
    slug: "natural-rabbit-ear-chews",
    specs: [
      { label: "Biometric Match", value: "Cold-Weather Primaries" },
      { label: "Thermal Sync Rate", value: "-30°C Integrity" },
      { label: "Content Spec", value: "Insulated Shell / Boots" },
    ],
  },
];

// ─── Static testimonials ───────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Priya R.",
    location: "Mumbai",
    rating: 5,
    avatar: "PR",
    text: "The Twinning Protocol bundle was the most thoughtful gift I've ever given — or received. My Doberman and I have never looked more synchronized.",
  },
  {
    name: "Arjun K.",
    location: "Bengaluru",
    rating: 5,
    avatar: "AK",
    text: "I ordered the Wolf Diet Bundle for my Labrador and the packaging alone felt like opening a luxury artifact. The food quality is unmatched — she's visibly more energetic.",
  },
  {
    name: "Sneha M.",
    location: "Delhi",
    rating: 5,
    avatar: "SM",
    text: "The Arctic Shield Shell is worth every rupee. My Husky absolutely refused to take it off during our Himalayan trip. Functional and cinematic.",
  },
  {
    name: "Rohan T.",
    location: "Pune",
    rating: 4,
    avatar: "RT",
    text: "Gifted the Cognitive Stimuli Pack to my friend's Border Collie. The dog solved the Level 4 module in under two hours. It's almost unsettling how good this is.",
  },
];

// ─── Scroll-reveal hook ────────────────────────────────────────────────────────
function useReveal<T extends HTMLElement>(): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ─── FilledStar ───────────────────────────────────────────────────────────────
function FilledStar({ dark = false }: { dark?: boolean }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill={dark ? C.secondaryFixed : C.secondary} stroke="none">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

// ─── Dossier section ──────────────────────────────────────────────────────────
function DossierSection({ d }: { d: Dossier }) {
  const [imgRef, imgVisible] = useReveal<HTMLDivElement>();
  const [textRef, textVisible] = useReveal<HTMLDivElement>();
  const [imgHovered, setImgHovered] = useState(false);
  const [cartPending, setCartPending] = useState(false);

  const { addToCart } = useStore();
  const { toast } = useToast();

  const { data: productData } = useQuery<{ product: any }>({
    queryKey: [`/api/products/${d.slug}`],
    enabled: !!d.slug,
  });
  const product = productData?.product;
  const price = product?.salePrice || product?.price;
  const originalPrice = product?.price;
  const onSale = price && originalPrice && parseFloat(String(price)) < parseFloat(String(originalPrice));

  const handleAddToCart = async () => {
    if (!product?.id) return;
    setCartPending(true);
    try {
      await addToCart(product.id, 1, undefined);
      toast({ title: `${d.title} added to cart` });
    } catch {
      toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" });
    } finally {
      setCartPending(false);
    }
  };

  const isAlt = d.imageRight;

  const imgCol = (
    <div
      ref={imgRef}
      className={isAlt ? "order-1 md:order-2" : "order-1"}
      style={{
        opacity: imgVisible ? 1 : 0,
        transform: imgVisible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 1s cubic-bezier(0.2,1,0.3,1), transform 1s cubic-bezier(0.2,1,0.3,1)",
        transitionDelay: "0.1s",
        height: "80vh",
        minHeight: 500,
        overflow: "hidden",
      }}
    >
      <img
        src={d.image}
        alt={d.title}
        onError={e => { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb = "1"; t.src = d.fallback; } }}
        onMouseEnter={() => setImgHovered(true)}
        onMouseLeave={() => setImgHovered(false)}
        style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          filter: imgHovered ? "grayscale(0%)" : "grayscale(100%)",
          transition: "filter 0.6s ease",
        }}
      />
    </div>
  );

  const ctaBg    = d.ctaStyle === "solid"   ? C.primary   : d.ctaStyle === "light" ? C.secondaryFixed : "transparent";
  const ctaColor = d.ctaStyle === "solid"   ? C.white     : d.ctaStyle === "light" ? C.primary        : d.dark ? C.white : C.primary;
  const ctaBorder = d.ctaStyle === "outline" ? `2px solid ${d.dark ? C.white : C.primary}` : "2px solid transparent";

  const textCol = (
    <div
      ref={textRef}
      className={`${isAlt ? "order-2 md:order-1" : "order-2"} px-8 md:px-16`}
      style={{
        opacity: textVisible ? 1 : 0,
        transform: textVisible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 1s cubic-bezier(0.2,1,0.3,1), transform 1s cubic-bezier(0.2,1,0.3,1)",
        transitionDelay: "0.25s",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <span style={{ ...MONO, color: C.secondary, fontWeight: 700, fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>
        Protocol // {d.id}
      </span>
      <h2 style={{ ...PLAYFAIR, fontSize: "clamp(32px,4vw,48px)", lineHeight: "1.15", fontWeight: 600, color: d.dark ? C.white : C.primary, marginBottom: 20 }}>
        {d.title}
      </h2>
      <p style={{ ...INTER, fontSize: 16, lineHeight: "26px", color: d.dark ? "rgba(255,255,255,0.7)" : C.onSurfaceVariant, marginBottom: 32 }}>
        {d.desc}
      </p>

      <div style={{ borderLeft: `1px solid ${d.dark ? "rgba(255,255,255,0.2)" : "rgba(0,22,12,0.2)"}`, paddingLeft: 24, marginBottom: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        {d.specs.map(s => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ ...MONO, fontSize: 10, color: d.dark ? "rgba(255,255,255,0.4)" : C.outline, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              {s.label}
            </span>
            <span style={{ ...INTER, fontSize: 14, fontWeight: 600, color: d.dark ? C.white : C.primary }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Price */}
      {price && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 28 }}>
          {onSale && (
            <span style={{ ...INTER, fontSize: 15, color: d.dark ? "rgba(255,255,255,0.4)" : C.outline, textDecoration: "line-through" }}>
              {formatCurrency(originalPrice)}
            </span>
          )}
          <span style={{ ...PLAYFAIR, fontSize: 28, fontWeight: 400, color: d.dark ? C.white : C.primary }}>
            {formatCurrency(price)}
          </span>
          {onSale && (
            <span style={{ ...LABEL_CAPS, fontSize: 10, backgroundColor: C.secondary, color: C.white, padding: "3px 8px" }}>
              SALE
            </span>
          )}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <button
          onClick={handleAddToCart}
          disabled={cartPending || !product}
          data-testid={`button-add-to-cart-${d.id}`}
          style={{
            ...INTER,
            backgroundColor: ctaBg,
            color: ctaColor,
            border: ctaBorder,
            padding: "16px 28px",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase",
            cursor: (!product || cartPending) ? "not-allowed" : "pointer",
            opacity: (!product || cartPending) ? 0.6 : 1,
            display: "flex", alignItems: "center", gap: 8,
            transition: "opacity 0.2s",
          }}
        >
          <ShoppingCart size={14} />
          {cartPending ? "Adding…" : "Add to Cart"}
        </button>

        <Link href={`/giftseries/product/${d.slug}`}>
          <button
            data-testid={`button-view-specimen-${d.id}`}
            style={{
              ...INTER,
              backgroundColor: "transparent",
              color: d.dark ? C.white : C.primary,
              border: `2px solid ${d.dark ? "rgba(255,255,255,0.4)" : "rgba(0,22,12,0.3)"}`,
              padding: "16px 28px",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              transition: "opacity 0.2s",
            }}
            onMouseOver={e => { e.currentTarget.style.opacity = "0.7"; }}
            onMouseOut={e => { e.currentTarget.style.opacity = "1"; }}
          >
            View Specimen <ArrowRight size={14} />
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <section
      style={{
        borderBottom: `1px solid ${C.outlineVariant}33`,
        backgroundColor: d.bg,
        padding: "80px 0",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 items-center">
        {isAlt ? <>{textCol}{imgCol}</> : <>{imgCol}{textCol}</>}
      </div>
    </section>
  );
}

// ─── Testimonials section ─────────────────────────────────────────────────────
function TestimonialsSection() {
  const [ref, visible] = useReveal<HTMLDivElement>();
  return (
    <section ref={ref} style={{
      backgroundColor: C.primary,
      padding: "96px 64px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(40px)",
      transition: "opacity 0.9s ease, transform 0.9s ease",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <span style={{ ...LABEL_CAPS, color: C.secondaryFixed, display: "block", marginBottom: 16 }}>
            Field Reports
          </span>
          <h2 style={{ ...PLAYFAIR, fontSize: "clamp(32px,4vw,48px)", color: C.white, fontWeight: 600 }}>
            Verified Transmissions
          </h2>
          <div style={{ height: 1, width: 64, backgroundColor: C.secondary, margin: "24px auto 0" }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              padding: 40,
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.04)",
            }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} style={{ opacity: s <= t.rating ? 1 : 0.2 }}><FilledStar dark /></span>
                ))}
              </div>
              <p style={{ ...INTER, fontSize: 16, lineHeight: "26px", color: "rgba(255,255,255,0.8)", fontStyle: "italic", marginBottom: 28 }}>
                "{t.text}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  backgroundColor: C.secondary,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  ...LABEL_CAPS, color: C.white, fontSize: 12,
                }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ ...INTER, fontWeight: 700, color: C.white, fontSize: 14 }}>{t.name}</div>
                  <div style={{ ...MONO, fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Related products from Dog Parent Clothing ────────────────────────────────
const TWINNING_CATEGORY_ID = "90bfbd9f-a163-4612-88d5-79dc1e782591";

function RelatedProductsSection() {
  const [ref, visible] = useReveal<HTMLDivElement>();

  const { data } = useQuery<{ products: any[] }>({
    queryKey: ["/api/products", `categoryId=${TWINNING_CATEGORY_ID}&limit=4`],
    queryFn: async () => {
      const r = await fetch(`/api/products?categoryId=${TWINNING_CATEGORY_ID}&limit=4`);
      return r.json();
    },
  });
  const products = data?.products || [];

  if (!products.length) return null;

  return (
    <section ref={ref} style={{
      backgroundColor: C.surfaceContainerLow,
      padding: "96px 64px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(40px)",
      transition: "opacity 0.9s ease, transform 0.9s ease",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <span style={{ ...LABEL_CAPS, color: C.secondary, display: "block", marginBottom: 16 }}>
            Dog Parent Clothing
          </span>
          <h2 style={{ ...PLAYFAIR, fontSize: "clamp(32px,4vw,48px)", color: C.primary, fontWeight: 600 }}>
            Synchronize Your Style
          </h2>
          <div style={{ height: 1, width: 64, backgroundColor: C.secondary, margin: "24px auto 0" }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(p => {
            const img = p.images?.[0]?.url || p.images?.[0]?.imageUrl || p.imageUrl;
            const price = p.salePrice || p.price;
            const isOnSale = p.salePrice && parseFloat(p.salePrice) < parseFloat(p.price);
            return (
              <Link key={p.id} href={`/giftseries/product/${p.slug}`}>
                <div
                  data-testid={`card-related-${p.id}`}
                  style={{ cursor: "pointer", backgroundColor: C.white }}
                  className="group"
                >
                  <div style={{ overflow: "hidden", aspectRatio: "4/5" }}>
                    <img
                      src={img}
                      alt={p.title}
                      onError={e => { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb = "1"; t.src = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&auto=format&fit=crop"; } }}
                      style={{
                        width: "100%", height: "100%", objectFit: "cover",
                        filter: "grayscale(60%)",
                        transition: "filter 0.5s ease, transform 0.5s ease",
                      }}
                      className="group-hover:grayscale-0 group-hover:scale-105"
                    />
                  </div>
                  <div style={{ padding: "20px 16px" }}>
                    <p style={{ ...MONO, fontSize: 10, color: C.outline, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      Dog Parent Clothing
                    </p>
                    <h3 style={{ ...PLAYFAIR, fontSize: 18, color: C.primary, fontWeight: 600, marginBottom: 10 }}>
                      {p.title}
                    </h3>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      {isOnSale && (
                        <span style={{ ...INTER, fontSize: 13, color: C.outline, textDecoration: "line-through" }}>
                          {formatCurrency(p.price)}
                        </span>
                      )}
                      <span style={{ ...PLAYFAIR, fontSize: 20, fontWeight: 400, color: C.primary }}>
                        {formatCurrency(price)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link href="/category/twinning">
            <button
              data-testid="button-view-all-twinning"
              style={{
                ...LABEL_CAPS,
                backgroundColor: C.primary,
                color: C.white,
                border: "none",
                padding: "20px 48px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                transition: "opacity 0.2s",
              }}
              onMouseOver={e => { e.currentTarget.style.opacity = "0.8"; }}
              onMouseOut={e => { e.currentTarget.style.opacity = "1"; }}
            >
              Explore All Dog Parent Clothing <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function DogGiftSeries() {
  const { data: rawSettings } = useQuery<{ settings: Record<string, string> }>({
    queryKey: ["/api/homepage-settings"],
  });
  const settings = rawSettings ? mergeHomepageSettings(rawSettings.settings || {}) : DEFAULT_HOMEPAGE_SETTINGS;

  // Custom cursor
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + "px";
        cursorRef.current.style.top  = e.clientY  + "px";
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // Hero parallax
  const heroImgRef = useRef<HTMLImageElement>(null);
  const [heroError, setHeroError] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      if (heroImgRef.current) {
        heroImgRef.current.style.transform = `scale(1.05) translateY(${window.scrollY * 0.25}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ backgroundColor: C.surface, color: C.onSurface, overflowX: "hidden" }}>
      {/* Custom cursor */}
      <div
        ref={cursorRef}
        className="hidden md:block"
        style={{
          position: "fixed", width: 20, height: 20,
          border: `1px solid ${C.secondaryFixed}`,
          borderRadius: "50%", pointerEvents: "none", zIndex: 9999,
          transition: "transform 0.1s ease", left: 0, top: 0,
          transform: "translate(-50%, -50%)",
        }}
      />

      <EditorialHeader nav={settings.nav} />

      {/* ─── Hero ─── */}
      <section style={{ position: "relative", height: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 1 }} />
          <img
            ref={heroImgRef}
            src={heroError
              ? "https://images.unsplash.com/photo-1534361960057-19f073a9dee3?w=1600&auto=format&fit=crop"
              : "https://lh3.googleusercontent.com/aida-public/AB6AXuCYsP8GnqxhFOxyNBXUmvJD-3jOrE5G7fmxHhwbLjQz8voaI1PpP4IqfXjZo5UzwYmfB47e4buBryvn3yBupaBXesMJB8lgZzNCC6ALki1Jqida_kyUAocar8W_J2OUpcoBl2UjXcMTWDJrvLFecuoDwuQ4xuCBhXe3PbuG0SFqxxW4mLAsVWbLjsa4ELcXfonCWL99eCjijZWf79fZNyVZflnIs6K-KU8hldrF2GgxZX5vMR9XtrjiZ-EDoXCRkAtM9x5wQoQydeOb"
            }
            onError={() => setHeroError(true)}
            alt="The Synchronization Vault"
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.05)", transformOrigin: "center center" }}
          />
        </div>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 20px" }}>
          <span style={{ ...LABEL_CAPS, color: C.secondaryFixed, display: "block", marginBottom: 16 }}>
            GIFTING SERVICES
          </span>
          <h1 style={{
            ...PLAYFAIR, fontWeight: 700, color: C.white,
            fontSize: "clamp(48px, 7vw, 84px)", lineHeight: "1.1",
            textShadow: "0 4px 12px rgba(0,0,0,0.5)",
            maxWidth: 900, margin: "0 auto 32px",
          }}>
            The Synchronization Vault
          </h1>
          <div style={{ height: 1, width: 96, backgroundColor: C.secondaryFixed, margin: "0 auto 32px" }} />
          <p style={{ ...INTER, fontSize: 18, lineHeight: "28px", fontWeight: 300, color: "rgba(255,255,255,0.8)", maxWidth: 480, margin: "0 auto", fontStyle: "italic" }}>
            Precision biological alignment. Aesthetic harmony. The ultimate canine-human gift protocols.
          </p>
        </div>
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 2, color: C.white, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ ...LABEL_CAPS, fontSize: 10 }}>SCROLL TO ACCESS DOSSIERS</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>
      </section>

      {/* ─── Dossiers ─── */}
      <div>
        {DOSSIERS.map(d => <DossierSection key={d.id} d={d} />)}
      </div>

      {/* ─── Testimonials ─── */}
      <TestimonialsSection />

      {/* ─── Related Products ─── */}
      <RelatedProductsSection />

      <EditorialFooter footer={settings.footer} />
    </div>
  );
}
