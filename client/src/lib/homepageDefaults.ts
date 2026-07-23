export interface HomepageSettings {
  nav: {
    links: Array<{ label: string; href: string }>;
    ctaText: string;
    ctaHref: string;
  };
  hero: {
    visible: boolean;
    label: string;
    headline: string;
    subheadline: string;
    cta1Text: string;
    cta1Href: string;
    cta2Text: string;
    cta2Href: string;
    bgImageUrl: string;
  };
  categoryHub: {
    visible: boolean;
    label: string;
    title: string;
  };
  bestSellers: {
    visible: boolean;
    title: string;
    browseText: string;
    browseHref: string;
    categorySlug: string;
    limit: number;
  };
  philosophy: {
    visible: boolean;
    label: string;
    title: string;
    imageUrl: string;
    quote: string;
    quoteAuthor: string;
    principles: Array<{ num: string; title: string; desc: string }>;
  };
  apparel: {
    visible: boolean;
    label: string;
    title: string;
    categorySlug: string;
    limit: number;
  };
  wolfPrinciple: {
    visible: boolean;
    label: string;
    headline: string;
    body: string;
    ctaText: string;
    ctaHref: string;
  };
  founder: {
    visible: boolean;
    label: string;
    title: string;
    quote: string;
    name: string;
    imageUrl: string;
  };
  giftSets: {
    visible: boolean;
    sectionTitle: string;
    items: Array<{ title: string; desc: string; price: string; imageUrl: string }>;
  };
  trustBadges: {
    visible: boolean;
    items: Array<{ label: string }>;
  };
  communityPack: {
    visible: boolean;
    title: string;
    subtitle: string;
    testimonials: Array<{ quote: string; author: string }>;
  };
  newsletter: {
    visible: boolean;
    label: string;
    title: string;
    subtitle: string;
    ctaText: string;
  };
  footer: {
    tagline: string;
    email: string;
    phone: string;
    copyright: string;
  };
}

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  nav: {
    links: [
      { label: "Shop Food", href: "/shop" },
      { label: "Dog Clothing", href: "/category/clothing" },
      { label: "Twinning", href: "/category/twinning" },
      { label: "Our Story", href: "/about" },
    ],
    ctaText: "JOIN THE PACK",
    ctaHref: "/signup",
  },
  hero: {
    visible: true,
    label: "BIOLOGICAL EXCELLENCE",
    headline: "The Modern\nWolf Manual.",
    subheadline: "Issue No. 01 — Biological Wellness",
    cta1Text: "SHOP NUTRITION",
    cta1Href: "/shop",
    cta2Text: "THE COLLECTION",
    cta2Href: "/category/clothing",
    bgImageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBdkohNsQkc6S0JbtaIdAsey35kS83tN7AxGpjRpAEY6S8vlm1OfDJT8e1toInI93OCV6GXmPPSNZcmwQBurGV0Z4jImz7G7Vr83FyIm8xvBZ7Z5yPkk4iE8HFKnljeRThKTYB6WXyFbWEuGGosOCzrONRMOtxipUEyHyAq7qsJ9GOgaYZhxWgmLyjyP4xxxjtwxRdsetLwrdjReF7QRNZLkggMIOtIFhX37a8_jhOmCC4kEangu5Vt6btzNECH7utpQ3frHfld6Z_f",
  },
  categoryHub: {
    visible: true,
    label: "CURATED SELECTIONS",
    title: "The Core Biological Systems",
  },
  bestSellers: {
    visible: true,
    title: "Top Tier Fuel",
    browseText: "BROWSE ALL NUTRITION",
    browseHref: "/shop",
    categorySlug: "wild-treats",
    limit: 4,
  },
  philosophy: {
    visible: true,
    label: "The Philosophy",
    title: "Ancestral Precision",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAUPbA6QLtiVP5qe4diYDj9zfUXu2q50MzPgx4QdZkay0OYtQZDeAZGh-fkPEYOFZC0abgHT4hDnZFzRDjceSyJY5FBzv459HOZcSYjAGL_M8fPcHhPLqFFhNtFP53a9aYakL-ZksBCHjMK0XZapOm1GJASdtfBlbf12iC6DIDgaH_ULQdEuQVMMM9Vm_Fv6QzWsMCRnyOUndrGF2OWm3EEOD4d3y1O2HOENxT2BLUKJ2qb-5uWjQvC7TOjYfegJP4tcXKX357bGI7t",
    quote:
      "Nature does not build in excess; every ingredient must serve the biological blueprint.",
    quoteAuthor: "ARIA VANCE, FOUNDER",
    principles: [
      {
        num: "01",
        title: "Species Appropriate",
        desc: "Mirroring the raw, varied diet of the wild ancestor to ensure optimal metabolic function.",
      },
      {
        num: "02",
        title: "Cellular Integrity",
        desc: "Cold-pressed and air-dried methods that preserve the delicate enzyme and vitamin structures.",
      },
      {
        num: "03",
        title: "Ecological Harmony",
        desc: "Sourcing from regenerative farms that respect the biological cycle of the entire ecosystem.",
      },
    ],
  },
  apparel: {
    visible: true,
    label: "THE WARDROBE",
    title: "Apparel for the Modern Pack",
    categorySlug: "clothing",
    limit: 3,
  },
  wolfPrinciple: {
    visible: true,
    label: "THE BIOLOGICAL CONSTANT",
    headline: "99% DNA Match to Wolves.",
    body: "Treating them like the ancient predators they still are, behind the domestic mask.",
    ctaText: "Read the Whitepaper",
    ctaHref: "/about",
  },
  founder: {
    visible: true,
    label: "OUR PROMISE",
    title: "Engineering a Longer Life.",
    quote:
      "We started 19 DOGS because the standard for canine health was mediocre. We wanted to apply the same rigor of human longevity science to our dogs. Every product is a result of years of biological research and ethical sourcing.",
    name: "Aria Vance",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCT959MkYVXHNXu8tEpfjHyDHaCffizClKWinko31EvcF_ck2vVCRD3dBsHSTD06-dTSeCvn9xnGa1uqf9bwDjlKBGn9Uw6FPdc75WzlGBXdDw1IzBgq2ePwamoP3NTuineTLIQz2HSsi95k-Nfd89ggitlNW4eeWfo72M8dQD8z625TkluKUQDfzKiatqra0XOsNjsEuDN9FoE0u-GOUGdmTdxaAunFGirlkltBmckZla91KlOvOED_M3UsfNW-yHbgbWHCNbUwti7",
  },
  giftSets: {
    visible: true,
    sectionTitle: "The Editorial Gift Series",
    items: [
      {
        title: "The Puppy Foundation",
        desc: "Everything needed for the first 12 months of biological development.",
        price: "$150",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCUFNxzofl3tnaHIeQskcnhNVHDm6VY7_pCm85cyRSJNXyGdaAoNXS0dEcQ_3qD6NCXwNaWh2jbNqZi1LrZkY5NsQqlYQ2u816hRkH71LGy97RtJS1EQUazpulX0bSrTLEtpH871J7Oi-sp8wrtXdl3JClqqZ8NIWit2ybaA8VP9PK-tSiRGO4DJz2uIeyHmJjCgqLgUEDAl8lZqyyUTmvCE4eVbR39Tu3CQ6IERBdXdfA8Vs05PK",
      },
      {
        title: "The Longevity Pack",
        desc: "Our best-selling supplements and foods for the senior canine athlete.",
        price: "$210",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Tfza6Z1fJEYwdzTRyRtcdKfBRqJmxeYo27FXabQRxGaQQpdThOG7WiCbHlOHJiqK802ed2VrRtWk8pZXWjtl18zDiyG3fGiCrGBX61JVqy6CUW4tqKAkWqsFZwE0qCE3WqNcCtwqJQUcF-b1wxFbZGeDpxkiU_DGBL3bVduOvsvDvEEWH0x9c50ibFKJoPa1sTQ-x_sfW-thhhd6EXhFN-dzuxXgkN0I0exkXoyVft71OJuEPjVBF9JRqs2FGGntXNqIWeSIuv1A",
      },
      {
        title: "The Weekend Duo",
        desc: "Matching apparel and travel bowls for the adventurous pair.",
        price: "$125",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuB1WxM1VknR5KblHPXR_XT8x-a0VvIVVIPAI75KhH-D2kR3SXBZmwyb_MxN1PkamYk6cyiTmCLoTmSq2nznoWkXy5la5Qv6KnM1RLxnsvCwSr3WjbZQ6DydGrIe-AQl7R5K4hsjfdAem1Cr6r72Vz7PtMiqc2VG0iH4-9A0_UgZWcleCM52unPMaorMqwKjq0tiOPqx_yLHd_YaluudbQQ8vF1pv_h-9J00_X8cOZ4YBabUDJ8aRMo3wrEk96kVXJeJecg-zhwWXVahY",
      },
    ],
  },
  trustBadges: {
    visible: true,
    items: [
      { label: "HUMAN-GRADE INGREDIENTS" },
      { label: "VET-FORMULATED SCIENCE" },
      { label: "REGENERATIVE SOURCING" },
      { label: "ZERO SYNTHETIC FILLERS" },
    ],
  },
  communityPack: {
    visible: true,
    title: "The Community Pack",
    subtitle: "Sharing the journey of biological wellness.",
    testimonials: [
      {
        quote:
          "Since switching to the Biological Starter Kit, my Shepherd's energy levels have stabilized and her coat has never been shinier. It's more than food; it's a transformation.",
        author: "MARCO S., NEW YORK",
      },
      {
        quote:
          "The technical apparel actually fits! Most brands don't design for the active dog's movement, but 19 DOGS clearly does. The Technical Parka is a masterpiece.",
        author: "ELENA L., OSLO",
      },
    ],
  },
  newsletter: {
    visible: true,
    label: "STAY INFORMED",
    title: "The Dispatch",
    subtitle: "Deep dives into canine biology and exclusive pack access.",
    ctaText: "SUBSCRIBE",
  },
  footer: {
    tagline:
      "Precision in every bowl. High-performance biological wellness for the modern canine.",
    email: "info@19dogs.com",
    phone: "+91 99414 43009",
    copyright: "© 2024 19 DOGS. All rights reserved. Precision in every bowl.",
  },
};

export function mergeHomepageSettings(
  saved: Partial<HomepageSettings>
): HomepageSettings {
  const d = DEFAULT_HOMEPAGE_SETTINGS;
  return {
    nav: { ...d.nav, ...saved.nav },
    hero: { ...d.hero, ...saved.hero },
    categoryHub: { ...d.categoryHub, ...saved.categoryHub },
    bestSellers: { ...d.bestSellers, ...saved.bestSellers },
    philosophy: {
      ...d.philosophy,
      ...saved.philosophy,
      principles: saved.philosophy?.principles ?? d.philosophy.principles,
    },
    apparel: { ...d.apparel, ...saved.apparel },
    wolfPrinciple: { ...d.wolfPrinciple, ...saved.wolfPrinciple },
    founder: { ...d.founder, ...saved.founder },
    giftSets: {
      ...d.giftSets,
      ...saved.giftSets,
      items: saved.giftSets?.items ?? d.giftSets.items,
    },
    trustBadges: {
      ...d.trustBadges,
      ...saved.trustBadges,
      items: saved.trustBadges?.items ?? d.trustBadges.items,
    },
    communityPack: {
      ...d.communityPack,
      ...saved.communityPack,
      testimonials:
        saved.communityPack?.testimonials ?? d.communityPack.testimonials,
    },
    newsletter: { ...d.newsletter, ...saved.newsletter },
    footer: { ...d.footer, ...saved.footer },
  };
}
