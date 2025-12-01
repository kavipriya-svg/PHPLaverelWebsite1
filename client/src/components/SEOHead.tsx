import { useEffect, useRef } from "react";

interface SEOHeadProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "product" | "article";
  price?: string;
  currency?: string;
  availability?: "in stock" | "out of stock";
  brand?: string;
  siteName?: string;
}

export function SEOHead({
  title,
  description = "",
  image,
  url,
  type = "website",
  price,
  currency = "USD",
  availability,
  brand,
  siteName = "ShopEase",
}: SEOHeadProps) {
  const originalTitle = useRef<string | null>(null);
  const createdMetas = useRef<HTMLMetaElement[]>([]);

  useEffect(() => {
    const currentUrl = url || window.location.href;
    
    if (originalTitle.current === null) {
      originalTitle.current = document.title;
    }
    document.title = title ? `${title} | ${siteName}` : siteName;

    createdMetas.current.forEach(meta => meta.remove());
    createdMetas.current = [];

    const setMetaTag = (property: string, content: string, isOg = true) => {
      if (!content) return;
      const attrName = isOg ? "property" : "name";
      const meta = document.createElement("meta");
      meta.setAttribute(attrName, property);
      meta.content = content;
      document.head.appendChild(meta);
      createdMetas.current.push(meta);
    };

    setMetaTag("description", description, false);

    setMetaTag("og:title", title);
    setMetaTag("og:description", description);
    setMetaTag("og:type", type === "product" ? "product" : "website");
    setMetaTag("og:url", currentUrl);
    setMetaTag("og:site_name", siteName);

    if (image) {
      setMetaTag("og:image", image);
      setMetaTag("og:image:alt", title);
    }

    setMetaTag("twitter:card", "summary_large_image", false);
    setMetaTag("twitter:title", title, false);
    setMetaTag("twitter:description", description, false);
    if (image) {
      setMetaTag("twitter:image", image, false);
    }

    if (type === "product") {
      if (price) {
        setMetaTag("product:price:amount", price);
        setMetaTag("product:price:currency", currency);
      }
      if (availability) {
        setMetaTag("product:availability", availability);
      }
      if (brand) {
        setMetaTag("product:brand", brand);
      }
    }

    return () => {
      if (originalTitle.current !== null) {
        document.title = originalTitle.current;
      }
      createdMetas.current.forEach(meta => meta.remove());
      createdMetas.current = [];
    };
  }, [title, description, image, url, type, price, currency, availability, brand, siteName]);

  return null;
}
