import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Check, Copy, Mail } from "lucide-react";
import { SiFacebook, SiX, SiPinterest, SiWhatsapp, SiLinkedin, SiTelegram } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  className?: string;
  triggerClassName?: string;
  compact?: boolean;
}

export function ShareButtons({
  title,
  description = "",
  url,
  imageUrl,
  className = "",
  triggerClassName = "",
  compact = false,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedImage = imageUrl ? encodeURIComponent(imageUrl) : "";

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400,noopener,noreferrer");
  };

  const socialButtons = [
    { key: "facebook", icon: SiFacebook, label: "Facebook", color: "hover:bg-[#1877F2] hover:text-white" },
    { key: "x", icon: SiX, label: "X (Twitter)", color: "hover:bg-black hover:text-white" },
    { key: "pinterest", icon: SiPinterest, label: "Pinterest", color: "hover:bg-[#E60023] hover:text-white" },
    { key: "whatsapp", icon: SiWhatsapp, label: "WhatsApp", color: "hover:bg-[#25D366] hover:text-white" },
    { key: "linkedin", icon: SiLinkedin, label: "LinkedIn", color: "hover:bg-[#0A66C2] hover:text-white" },
    { key: "telegram", icon: SiTelegram, label: "Telegram", color: "hover:bg-[#0088CC] hover:text-white" },
  ];

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {socialButtons.slice(0, 4).map((social) => (
          <Button
            key={social.key}
            variant="ghost"
            size="icon"
            onClick={() => handleShare(social.key as keyof typeof shareLinks)}
            className={`h-8 w-8 ${social.color}`}
            data-testid={`button-share-${social.key}`}
          >
            <social.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className={triggerClassName} data-testid="button-share">
          <Share2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {socialButtons.map((social) => (
              <Button
                key={social.key}
                variant="outline"
                onClick={() => handleShare(social.key as keyof typeof shareLinks)}
                className={`flex flex-col items-center gap-2 h-auto py-3 ${social.color}`}
                data-testid={`button-share-${social.key}`}
              >
                <social.icon className="h-5 w-5" />
                <span className="text-xs">{social.label}</span>
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            onClick={() => handleShare("email")}
            className="w-full flex items-center gap-2 hover:bg-muted"
            data-testid="button-share-email"
          >
            <Mail className="h-4 w-4" />
            Share via Email
          </Button>

          <div className="flex items-center gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
              data-testid="input-share-url"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              data-testid="button-copy-link"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
