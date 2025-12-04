import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface FooterLink {
  label: string;
  url: string;
}

interface FooterSettings {
  storeName: string;
  storeDescription: string;
  logoUrl: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  quickLinks: FooterLink[];
  legalLinks: FooterLink[];
  newsletterEnabled: boolean;
  newsletterTitle: string;
  newsletterDescription: string;
  copyrightText: string;
  showSocialLinks: boolean;
  showContactInfo: boolean;
  showQuickLinks: boolean;
  showNewsletter: boolean;
}

const defaultSettings: FooterSettings = {
  storeName: "ShopHub",
  storeDescription: "Your one-stop destination for quality products at great prices. Shop with confidence.",
  logoUrl: "",
  socialLinks: {
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: "",
  },
  contactInfo: {
    phone: "1-800-SHOPHUB",
    email: "support@shophub.com",
    address: "123 Commerce Street\nNew York, NY 10001",
  },
  quickLinks: [
    { label: "About Us", url: "/about" },
    { label: "Contact Us", url: "/contact" },
    { label: "FAQ", url: "/faq" },
    { label: "Track Order", url: "/track-order" },
    { label: "Shipping Info", url: "/shipping" },
    { label: "Returns & Exchanges", url: "/returns" },
  ],
  legalLinks: [
    { label: "Privacy Policy", url: "/privacy" },
    { label: "Terms of Service", url: "/terms" },
  ],
  newsletterEnabled: true,
  newsletterTitle: "Newsletter",
  newsletterDescription: "Subscribe for exclusive deals, new arrivals, and more.",
  copyrightText: "All rights reserved.",
  showSocialLinks: true,
  showContactInfo: true,
  showQuickLinks: true,
  showNewsletter: true,
};

export function Footer() {
  const { data } = useQuery<{ settings: FooterSettings }>({
    queryKey: ["/api/settings/footer"],
  });

  const settings = data?.settings ? { ...defaultSettings, ...data.settings } : defaultSettings;

  const hasSocialLinks = settings.socialLinks.facebook || 
    settings.socialLinks.twitter || 
    settings.socialLinks.instagram || 
    settings.socialLinks.youtube;

  return (
    <footer className="bg-card border-t mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.storeName} 
                  className="h-9 w-auto object-contain"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-lg">
                  {settings.storeName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-bold text-xl">{settings.storeName}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {settings.storeDescription}
            </p>
            {settings.showSocialLinks && hasSocialLinks && (
              <div className="flex gap-3">
                {settings.socialLinks.facebook && (
                  <a 
                    href={settings.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 flex items-center justify-center rounded-full bg-muted hover-elevate"
                    aria-label="Facebook"
                    data-testid="link-social-facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {settings.socialLinks.twitter && (
                  <a 
                    href={settings.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 flex items-center justify-center rounded-full bg-muted hover-elevate"
                    aria-label="Twitter"
                    data-testid="link-social-twitter"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {settings.socialLinks.instagram && (
                  <a 
                    href={settings.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 flex items-center justify-center rounded-full bg-muted hover-elevate"
                    aria-label="Instagram"
                    data-testid="link-social-instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {settings.socialLinks.youtube && (
                  <a 
                    href={settings.socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 flex items-center justify-center rounded-full bg-muted hover-elevate"
                    aria-label="Youtube"
                    data-testid="link-social-youtube"
                  >
                    <Youtube className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {settings.showQuickLinks && settings.quickLinks.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                {settings.quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.url} 
                      className="text-muted-foreground hover:text-foreground"
                      data-testid={`link-quick-${index}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {settings.showContactInfo && (
            <div>
              <h3 className="font-semibold mb-4">Customer Service</h3>
              <ul className="space-y-3 text-sm">
                {settings.contactInfo.phone && (
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span data-testid="text-contact-phone">{settings.contactInfo.phone}</span>
                  </li>
                )}
                {settings.contactInfo.email && (
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span data-testid="text-contact-email">{settings.contactInfo.email}</span>
                  </li>
                )}
                {settings.contactInfo.address && (
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span 
                      data-testid="text-contact-address"
                      dangerouslySetInnerHTML={{ 
                        __html: settings.contactInfo.address.replace(/\n/g, '<br />') 
                      }}
                    />
                  </li>
                )}
              </ul>
            </div>
          )}

          {settings.showNewsletter && (
            <div>
              <h3 className="font-semibold mb-4">{settings.newsletterTitle}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {settings.newsletterDescription}
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1"
                  data-testid="input-newsletter-email"
                />
                <Button type="submit" data-testid="button-newsletter-subscribe">
                  Subscribe
                </Button>
              </form>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground" data-testid="text-copyright">
              &copy; {new Date().getFullYear()} {settings.storeName}. {settings.copyrightText}
            </p>
            {settings.legalLinks.length > 0 && (
              <div className="flex gap-4 text-sm text-muted-foreground">
                {settings.legalLinks.map((link, index) => (
                  <Link 
                    key={index}
                    href={link.url} 
                    className="hover:text-foreground"
                    data-testid={`link-legal-${index}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
