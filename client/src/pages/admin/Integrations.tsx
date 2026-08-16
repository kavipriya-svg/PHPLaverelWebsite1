import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard, Mail, MessageSquare, Bot, LogIn, BarChart3, Search, Truck,
  Settings2, CheckCircle2, Circle, ExternalLink, Eye, EyeOff, Trash2,
  ChevronRight, Info, Plug, Grid3X3, Save, Loader2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert, AlertDescription,
} from "@/components/ui/alert";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Types ───────────────────────────────────────────────────────────────────

type FieldType = "text" | "secret" | "select" | "textarea";

interface IntegrationField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
}

interface Integration {
  id: string;
  category: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  color: string;
  fields: IntegrationField[];
  docsUrl?: string;
  scriptInjectable?: boolean;
  serverSide?: boolean;
}

// ── Category definitions ─────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",      label: "All",              icon: Grid3X3 },
  { id: "payment",  label: "Payment",          icon: CreditCard },
  { id: "email",    label: "Email",            icon: Mail },
  { id: "sms",      label: "SMS & WhatsApp",   icon: MessageSquare },
  { id: "chatbot",  label: "Chatbot",          icon: Bot },
  { id: "login",    label: "Social Login",     icon: LogIn },
  { id: "analytics",label: "Analytics",        icon: BarChart3 },
  { id: "seo",      label: "SEO & Tracking",   icon: Search },
  { id: "shipping", label: "Shipping",         icon: Truck },
];

// ── Integration definitions ──────────────────────────────────────────────────

const INTEGRATIONS: Integration[] = [
  // ─── PAYMENT ───
  {
    id: "razorpay", category: "payment",
    name: "Razorpay", tagline: "Accept UPI, cards, wallets & netbanking",
    description: "India's leading payment gateway with UPI, cards, netbanking, wallets, EMI, and buy-now-pay-later options.",
    logo: "🔷", color: "blue",
    serverSide: true,
    fields: [
      { key: "keyId",         label: "Key ID",          type: "text",   placeholder: "rzp_live_XXXXXXXXXXXX" },
      { key: "keySecret",     label: "Key Secret",       type: "secret", placeholder: "Your Razorpay secret key", hint: "Never share this publicly" },
      { key: "webhookSecret", label: "Webhook Secret",   type: "secret", placeholder: "Webhook signing secret" },
      { key: "mode",          label: "Mode",             type: "select", options: [{ value: "test", label: "Test (development)" }, { value: "live", label: "Live (production)" }] },
    ],
    docsUrl: "https://razorpay.com/docs/payment-gateway/web-integration/",
  },
  {
    id: "stripe", category: "payment",
    name: "Stripe", tagline: "Global payments for internet businesses",
    description: "Accept payments globally with cards, Apple Pay, Google Pay, and 135+ currencies.",
    logo: "💳", color: "purple",
    serverSide: true,
    fields: [
      { key: "publishableKey", label: "Publishable Key", type: "text",   placeholder: "pk_live_XXXXXXXXXXXX" },
      { key: "secretKey",      label: "Secret Key",      type: "secret", placeholder: "sk_live_XXXXXXXXXXXX" },
      { key: "webhookSecret",  label: "Webhook Secret",  type: "secret", placeholder: "whsec_XXXXXXXXXXXX" },
      { key: "mode",           label: "Mode",            type: "select", options: [{ value: "test", label: "Test" }, { value: "live", label: "Live" }] },
    ],
    docsUrl: "https://stripe.com/docs/api",
  },
  {
    id: "paypal", category: "payment",
    name: "PayPal", tagline: "Trusted by 400 million+ users worldwide",
    description: "Let customers pay with their PayPal account, credit, or debit card.",
    logo: "🅿️", color: "yellow",
    serverSide: true,
    fields: [
      { key: "clientId",     label: "Client ID",     type: "text",   placeholder: "AxxXXXXXXXXXXXXXXXXX" },
      { key: "clientSecret", label: "Client Secret", type: "secret", placeholder: "Your PayPal client secret" },
      { key: "mode",         label: "Mode",          type: "select", options: [{ value: "sandbox", label: "Sandbox" }, { value: "live", label: "Live" }] },
    ],
    docsUrl: "https://developer.paypal.com/docs/",
  },

  // ─── EMAIL ───
  {
    id: "smtp", category: "email",
    name: "SMTP", tagline: "Any email server via SMTP",
    description: "Send transactional emails using your own SMTP server — Gmail, Zoho, Office 365, and more.",
    logo: "📮", color: "gray",
    serverSide: true,
    fields: [
      { key: "host",      label: "SMTP Host",           type: "text",   placeholder: "smtp.gmail.com" },
      { key: "port",      label: "Port",                type: "text",   placeholder: "587" },
      { key: "username",  label: "Username / Email",    type: "text",   placeholder: "you@domain.com" },
      { key: "password",  label: "Password",            type: "secret", placeholder: "App password or SMTP password" },
      { key: "fromEmail", label: "From Email",          type: "text",   placeholder: "noreply@yourstore.com" },
      { key: "fromName",  label: "From Name",           type: "text",   placeholder: "19 DOGS Store" },
      { key: "secure",    label: "Encryption",          type: "select", options: [{ value: "tls", label: "TLS — port 587 (recommended)" }, { value: "ssl", label: "SSL — port 465" }, { value: "none", label: "None — port 25" }] },
    ],
  },
  {
    id: "sendgrid", category: "email",
    name: "SendGrid", tagline: "Reliable transactional & marketing email",
    description: "Send transactional and marketing emails at scale with detailed delivery analytics.",
    logo: "📧", color: "blue",
    serverSide: true,
    fields: [
      { key: "apiKey",    label: "API Key",    type: "secret", placeholder: "SG.XXXXXXXXXXXXXXXXXXXX" },
      { key: "fromEmail", label: "From Email", type: "text",   placeholder: "noreply@yourstore.com" },
      { key: "fromName",  label: "From Name",  type: "text",   placeholder: "19 DOGS Store" },
    ],
    docsUrl: "https://docs.sendgrid.com/",
  },
  {
    id: "mailgun", category: "email",
    name: "Mailgun", tagline: "Email API built for developers",
    description: "Powerful email API to send, receive, and track emails at scale.",
    logo: "🔫", color: "red",
    serverSide: true,
    fields: [
      { key: "apiKey",    label: "API Key",   type: "secret", placeholder: "key-XXXXXXXXXXXX" },
      { key: "domain",    label: "Domain",    type: "text",   placeholder: "mg.yourstore.com" },
      { key: "region",    label: "Region",    type: "select", options: [{ value: "us", label: "US (api.mailgun.net)" }, { value: "eu", label: "EU (api.eu.mailgun.net)" }] },
      { key: "fromEmail", label: "From Email",type: "text",   placeholder: "noreply@yourstore.com" },
      { key: "fromName",  label: "From Name", type: "text",   placeholder: "19 DOGS Store" },
    ],
    docsUrl: "https://documentation.mailgun.com/",
  },
  {
    id: "mailchimp", category: "email",
    name: "Mailchimp", tagline: "Bulk email & audience management",
    description: "Build your audience and send marketing campaigns to subscribers.",
    logo: "🐵", color: "yellow",
    serverSide: true,
    fields: [
      { key: "apiKey",       label: "API Key",      type: "secret", placeholder: "XXXXXXXXXXXX-us14" },
      { key: "serverPrefix", label: "Server Prefix",type: "text",   placeholder: "us14", hint: "The last part of your API key (e.g. us14)" },
      { key: "listId",       label: "Audience ID",  type: "text",   placeholder: "abc123def4" },
    ],
    docsUrl: "https://mailchimp.com/developer/",
  },
  {
    id: "brevo", category: "email",
    name: "Brevo (Sendinblue)", tagline: "Email, SMS & marketing platform",
    description: "All-in-one platform for transactional email, marketing campaigns, and SMS.",
    logo: "🟦", color: "cyan",
    serverSide: true,
    fields: [
      { key: "apiKey",    label: "API Key",         type: "secret", placeholder: "xkeysib-XXXXXXXXXXXX" },
      { key: "fromEmail", label: "From Email",      type: "text",   placeholder: "noreply@yourstore.com" },
      { key: "fromName",  label: "From Name",       type: "text",   placeholder: "19 DOGS Store" },
      { key: "listId",    label: "Contact List ID", type: "text",   placeholder: "3" },
    ],
    docsUrl: "https://developers.brevo.com/",
  },

  // ─── SMS & WHATSAPP ───
  {
    id: "twilio_sms", category: "sms",
    name: "Twilio SMS", tagline: "Programmable SMS messaging",
    description: "Send order confirmations, OTPs, and alerts via SMS globally using Twilio.",
    logo: "📱", color: "red",
    serverSide: true,
    fields: [
      { key: "accountSid", label: "Account SID",  type: "text",   placeholder: "ACxxxxxxxxxxxxxxxxxxxx" },
      { key: "authToken",  label: "Auth Token",   type: "secret", placeholder: "Your Twilio auth token" },
      { key: "fromNumber", label: "From Number",  type: "text",   placeholder: "+1234567890" },
    ],
    docsUrl: "https://www.twilio.com/docs/sms",
  },
  {
    id: "msg91", category: "sms",
    name: "MSG91", tagline: "India's leading SMS gateway",
    description: "Send transactional and promotional SMS to Indian mobile numbers with DLT compliance.",
    logo: "🇮🇳", color: "orange",
    serverSide: true,
    fields: [
      { key: "authKey",   label: "Auth Key",           type: "secret", placeholder: "Your MSG91 auth key" },
      { key: "senderId",  label: "Sender ID",          type: "text",   placeholder: "MSGIND", hint: "6-character DLT-approved sender ID" },
      { key: "route",     label: "Route",              type: "select", options: [{ value: "4", label: "Transactional (Route 4)" }, { value: "1", label: "Promotional (Route 1)" }] },
      { key: "dlt_te_id", label: "DLT Template ID",   type: "text",   placeholder: "DLT registered template ID", hint: "Required for Indian telecom compliance (TRAI)" },
    ],
    docsUrl: "https://docs.msg91.com/",
  },
  {
    id: "whatsapp_twilio", category: "sms",
    name: "WhatsApp via Twilio", tagline: "WhatsApp messaging via Twilio",
    description: "Send transactional WhatsApp messages using Twilio's WhatsApp Business API.",
    logo: "💬", color: "green",
    serverSide: true,
    fields: [
      { key: "accountSid", label: "Account SID",       type: "text",   placeholder: "ACxxxxxxxxxxxxxxxxxxxx" },
      { key: "authToken",  label: "Auth Token",        type: "secret", placeholder: "Your Twilio auth token" },
      { key: "fromNumber", label: "WhatsApp Number",   type: "text",   placeholder: "whatsapp:+14155238886" },
    ],
    docsUrl: "https://www.twilio.com/docs/whatsapp",
  },
  {
    id: "whatsapp_business", category: "sms",
    name: "WhatsApp Business API", tagline: "Meta's official WhatsApp Cloud API",
    description: "Send messages via Meta's official WhatsApp Business Cloud API — no third-party needed.",
    logo: "🟢", color: "emerald",
    serverSide: true,
    fields: [
      { key: "phoneNumberId",      label: "Phone Number ID",       type: "text",   placeholder: "Your WhatsApp Phone Number ID" },
      { key: "businessAccountId",  label: "Business Account ID",  type: "text",   placeholder: "Your WhatsApp Business Account ID" },
      { key: "accessToken",        label: "Access Token",          type: "secret", placeholder: "Your permanent system user access token" },
      { key: "webhookVerifyToken", label: "Webhook Verify Token",  type: "secret", placeholder: "Your webhook verification token" },
    ],
    docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
  },

  // ─── CHATBOT ───
  {
    id: "tawkto", category: "chatbot",
    name: "Tawk.to", tagline: "Free live chat for your website",
    description: "Add a live chat widget to your store. 100% free with unlimited agents and chat history.",
    logo: "🗨️", color: "green",
    scriptInjectable: true,
    fields: [
      { key: "propertyId", label: "Property ID", type: "text", placeholder: "5f1234abc1234567890", hint: "Administration → Chat Widget → Direct Chat Link" },
      { key: "widgetId",   label: "Widget ID",   type: "text", placeholder: "default", hint: "Usually 'default' for the primary widget" },
    ],
    docsUrl: "https://help.tawk.to/article/getting-started",
  },
  {
    id: "crisp", category: "chatbot",
    name: "Crisp", tagline: "Modern customer messaging platform",
    description: "Live chat, email inbox, and knowledge base in one place. Free plan for 2 agents.",
    logo: "💙", color: "blue",
    scriptInjectable: true,
    fields: [
      { key: "websiteId", label: "Website ID", type: "text", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", hint: "Settings → Website Settings → Setup Instructions" },
    ],
    docsUrl: "https://docs.crisp.chat/guides/chatbox-sdks/web/javascript/",
  },
  {
    id: "tidio", category: "chatbot",
    name: "Tidio", tagline: "Live chat + AI chatbot automation",
    description: "Combine live chat with AI chatbots to handle support automatically 24/7.",
    logo: "🤖", color: "violet",
    scriptInjectable: true,
    fields: [
      { key: "publicKey", label: "Public Key", type: "text", placeholder: "Your Tidio public key", hint: "Settings → Developer → Public Key" },
    ],
    docsUrl: "https://tidio.com/developer/",
  },
  {
    id: "intercom", category: "chatbot",
    name: "Intercom", tagline: "Customer messaging & support suite",
    description: "Engage customers with in-app messaging, product tours, and automated support workflows.",
    logo: "💬", color: "blue",
    scriptInjectable: true,
    fields: [
      { key: "appId", label: "App ID", type: "text", placeholder: "abc12345", hint: "Settings → Installation → Your App ID" },
    ],
    docsUrl: "https://developers.intercom.com/installing-intercom/web/",
  },
  {
    id: "freshchat", category: "chatbot",
    name: "Freshchat", tagline: "Modern omnichannel messaging",
    description: "Support customers across web, mobile, WhatsApp, and social channels from one inbox.",
    logo: "🌿", color: "teal",
    scriptInjectable: true,
    fields: [
      { key: "token", label: "Token", type: "text",   placeholder: "Your Freshchat widget token" },
      { key: "host",  label: "Host",  type: "text",   placeholder: "https://wchat.freshchat.com" },
    ],
    docsUrl: "https://support.freshchat.com/support/solutions/articles/229137",
  },

  // ─── SOCIAL LOGIN ───
  {
    id: "google_oauth", category: "login",
    name: "Google Sign-In", tagline: "One-tap login with Google",
    description: "Let customers sign in with their Google account — no password required.",
    logo: "🔵", color: "blue",
    serverSide: true,
    fields: [
      { key: "clientId",     label: "Client ID",                type: "text",   placeholder: "XXXXXXXXXXXX.apps.googleusercontent.com" },
      { key: "clientSecret", label: "Client Secret",            type: "secret", placeholder: "GOCSPX-XXXXXXXXXXXX" },
      { key: "callbackUrl",  label: "Authorized Redirect URI",  type: "text",   placeholder: "https://yourstore.com/api/auth/google/callback", hint: "Add this exact URL in Google Cloud Console → Credentials → OAuth 2.0" },
    ],
    docsUrl: "https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid",
  },
  {
    id: "facebook_login", category: "login",
    name: "Facebook Login", tagline: "Sign in with Facebook",
    description: "Enable social login with Facebook accounts to reduce signup friction.",
    logo: "🔷", color: "indigo",
    serverSide: true,
    fields: [
      { key: "appId",       label: "App ID",                  type: "text",   placeholder: "Your Facebook App ID" },
      { key: "appSecret",   label: "App Secret",              type: "secret", placeholder: "Your Facebook App Secret" },
      { key: "callbackUrl", label: "Valid OAuth Redirect URI", type: "text",   placeholder: "https://yourstore.com/api/auth/facebook/callback" },
    ],
    docsUrl: "https://developers.facebook.com/docs/facebook-login",
  },

  // ─── ANALYTICS ───
  {
    id: "google_analytics", category: "analytics",
    name: "Google Analytics 4", tagline: "Understand your customers & traffic",
    description: "Track website traffic, user behaviour, conversions, and e-commerce revenue.",
    logo: "📊", color: "orange",
    scriptInjectable: true,
    fields: [
      { key: "measurementId", label: "Measurement ID", type: "text", placeholder: "G-XXXXXXXXXX", hint: "GA4 Admin → Data Streams → your stream → Measurement ID" },
    ],
    docsUrl: "https://support.google.com/analytics/answer/9304153",
  },
  {
    id: "meta_pixel", category: "analytics",
    name: "Meta Pixel", tagline: "Track conversions & retargeting",
    description: "Measure ad effectiveness and build custom audiences for Facebook & Instagram ads.",
    logo: "📘", color: "blue",
    scriptInjectable: true,
    fields: [
      { key: "pixelId", label: "Pixel ID", type: "text", placeholder: "1234567890123456", hint: "Meta Business Manager → Events Manager → your Pixel ID" },
    ],
    docsUrl: "https://www.facebook.com/business/help/952192354843755",
  },
  {
    id: "hotjar", category: "analytics",
    name: "Hotjar", tagline: "Heatmaps, recordings & feedback surveys",
    description: "Understand how users interact with your store using heatmaps and session recordings.",
    logo: "🔥", color: "red",
    scriptInjectable: true,
    fields: [
      { key: "siteId", label: "Site ID", type: "text", placeholder: "1234567", hint: "Hotjar → Settings → Tracking Code" },
    ],
    docsUrl: "https://help.hotjar.com/hc/en-us/articles/115011789248",
  },
  {
    id: "ms_clarity", category: "analytics",
    name: "Microsoft Clarity", tagline: "Free heatmaps & session recordings",
    description: "See exactly how visitors navigate your store — completely free with no data limits.",
    logo: "🌐", color: "sky",
    scriptInjectable: true,
    fields: [
      { key: "projectId", label: "Project ID", type: "text", placeholder: "abcde12345", hint: "Clarity Dashboard → Settings → Setup" },
    ],
    docsUrl: "https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup",
  },

  // ─── SEO & TRACKING ───
  {
    id: "google_tag_manager", category: "seo",
    name: "Google Tag Manager", tagline: "Manage all tracking tags in one place",
    description: "Deploy GA4, Meta Pixel, and hundreds of other tags without touching code.",
    logo: "🏷️", color: "blue",
    scriptInjectable: true,
    fields: [
      { key: "containerId", label: "Container ID", type: "text", placeholder: "GTM-XXXXXXX", hint: "GTM Admin → Container Settings → Container ID" },
    ],
    docsUrl: "https://support.google.com/tagmanager/answer/6103696",
  },
  {
    id: "google_search_console", category: "seo",
    name: "Google Search Console", tagline: "Monitor your search performance",
    description: "Verify site ownership and monitor how your store appears in Google Search.",
    logo: "🔍", color: "green",
    scriptInjectable: true,
    fields: [
      { key: "verificationCode", label: "Verification Code", type: "text", placeholder: "google-site-verification=XXXXXXXXXXXX", hint: "In Search Console → choose HTML tag method → copy the content attribute value" },
    ],
    docsUrl: "https://support.google.com/webmasters/answer/9008080",
  },

  // ─── SHIPPING ───
  {
    id: "shiprocket", category: "shipping",
    name: "Shiprocket", tagline: "India's largest eCommerce shipping",
    description: "Ship orders across 220+ countries with 17+ courier partners at discounted rates.",
    logo: "🚀", color: "orange",
    serverSide: true,
    fields: [
      { key: "email",     label: "Account Email", type: "text",   placeholder: "your@email.com" },
      { key: "password",  label: "Password",      type: "secret", placeholder: "Your Shiprocket password" },
      { key: "channelId", label: "Channel ID",    type: "text",   placeholder: "12345", hint: "Optional: your Shiprocket channel / store ID" },
    ],
    docsUrl: "https://apidocs.shiprocket.in/",
  },
  {
    id: "delhivery", category: "shipping",
    name: "Delhivery", tagline: "Fast & reliable logistics across India",
    description: "Reliable courier with 2800+ cities coverage across India.",
    logo: "📦", color: "red",
    serverSide: true,
    fields: [
      { key: "apiToken",       label: "API Token",       type: "secret", placeholder: "Your Delhivery API token" },
      { key: "warehouseName",  label: "Warehouse Name",  type: "text",   placeholder: "Your registered warehouse name" },
    ],
    docsUrl: "https://www.delhivery.com/docs/api/",
  },
];

// ── Color map ────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  blue:    "bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900",
  purple:  "bg-purple-50 border-purple-100 dark:bg-purple-950/30 dark:border-purple-900",
  yellow:  "bg-yellow-50 border-yellow-100 dark:bg-yellow-950/30 dark:border-yellow-900",
  gray:    "bg-gray-50 border-gray-200 dark:bg-gray-800/30 dark:border-gray-700",
  red:     "bg-red-50 border-red-100 dark:bg-red-950/30 dark:border-red-900",
  orange:  "bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900",
  cyan:    "bg-cyan-50 border-cyan-100 dark:bg-cyan-950/30 dark:border-cyan-900",
  green:   "bg-green-50 border-green-100 dark:bg-green-950/30 dark:border-green-900",
  emerald: "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900",
  violet:  "bg-violet-50 border-violet-100 dark:bg-violet-950/30 dark:border-violet-900",
  teal:    "bg-teal-50 border-teal-100 dark:bg-teal-950/30 dark:border-teal-900",
  indigo:  "bg-indigo-50 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900",
  sky:     "bg-sky-50 border-sky-100 dark:bg-sky-950/30 dark:border-sky-900",
};

// ── Helper: is integration configured? ──────────────────────────────────────

function isConfigured(intg: Integration, configs: Record<string, Record<string, string>>) {
  const cfg = configs[intg.id] ?? {};
  const firstRequiredField = intg.fields[0];
  return firstRequiredField ? !!cfg[firstRequiredField.key] : false;
}

// ── Secret field component ───────────────────────────────────────────────────

function SecretInput({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 font-mono text-sm"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Configure Sheet ──────────────────────────────────────────────────────────

function ConfigureSheet({
  integration,
  savedConfig,
  open,
  onClose,
  onSave,
  onDisconnect,
  saving,
}: {
  integration: Integration | null;
  savedConfig: Record<string, string>;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: Record<string, string>) => void;
  onDisconnect: (id: string) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (integration) {
      const initial: Record<string, string> = {};
      integration.fields.forEach(f => { initial[f.key] = savedConfig[f.key] ?? ""; });
      setForm(initial);
    }
  }, [integration, savedConfig]);

  if (!integration) return null;

  const configured = !!savedConfig[integration.fields[0]?.key ?? ""];

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{integration.logo}</span>
            <div>
              <SheetTitle className="text-xl">{integration.name}</SheetTitle>
              <SheetDescription className="text-sm mt-0.5">{integration.tagline}</SheetDescription>
            </div>
          </div>
          {configured && (
            <Badge variant="outline" className="w-fit mt-2 border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
            </Badge>
          )}
        </SheetHeader>

        <p className="text-sm text-muted-foreground mb-5">{integration.description}</p>

        {integration.scriptInjectable && !integration.serverSide && (
          <Alert className="mb-5 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
              This integration is <strong>plug-and-play</strong> — after saving, the script is automatically injected into every page of your store.
            </AlertDescription>
          </Alert>
        )}

        {integration.serverSide && (
          <Alert className="mb-5 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-700 dark:text-amber-300">
              Your credentials are saved securely on the server. The development team uses these to activate {integration.name} in the checkout and notification flows.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 mb-8">
          {integration.fields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium">{field.label}</Label>
                {field.type === "secret" && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">secret</Badge>
                )}
                {field.hint && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">{field.hint}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {field.type === "select" ? (
                <Select value={form[field.key] ?? ""} onValueChange={v => setForm(f => ({ ...f, [field.key]: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}…`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "secret" ? (
                <SecretInput
                  value={form[field.key] ?? ""}
                  onChange={v => setForm(f => ({ ...f, [field.key]: v }))}
                  placeholder={field.placeholder}
                />
              ) : (
                <Input
                  value={form[field.key] ?? ""}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="font-mono text-sm"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => onSave(integration.id, form)}
            disabled={saving}
            className="w-full"
          >
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Save className="h-4 w-4 mr-2" />Save Configuration</>}
          </Button>

          {configured && (
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onDisconnect(integration.id)}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Disconnect
            </Button>
          )}

          {integration.docsUrl && (
            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <ExternalLink className="h-3 w-3" /> View documentation
            </a>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  configured,
  onConfigure,
}: {
  integration: Integration;
  configured: boolean;
  onConfigure: () => void;
}) {
  const colorClass = COLOR_MAP[integration.color] ?? COLOR_MAP.gray;

  return (
    <div className={`relative flex flex-col border rounded-xl p-5 transition-all hover:shadow-md bg-card ${configured ? "ring-1 ring-green-400 dark:ring-green-600" : ""}`}>
      {/* Status dot */}
      <div className="absolute top-3 right-3">
        {configured ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground/30" />
        )}
      </div>

      {/* Logo */}
      <div className={`w-12 h-12 rounded-lg border flex items-center justify-center text-2xl mb-4 ${colorClass}`}>
        {integration.logo}
      </div>

      {/* Name + badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-1">
        <h3 className="font-semibold text-sm leading-tight">{integration.name}</h3>
        {integration.scriptInjectable && !integration.serverSide && (
          <Badge variant="outline" className="text-xs px-1.5 h-4 border-green-400 text-green-600">auto-inject</Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-1 font-medium">{integration.tagline}</p>
      <p className="text-xs text-muted-foreground/80 leading-relaxed mb-4 line-clamp-2 flex-1">{integration.description}</p>

      <Button
        size="sm"
        variant={configured ? "outline" : "default"}
        className="w-full mt-auto"
        onClick={onConfigure}
      >
        {configured ? (
          <><Settings2 className="h-3.5 w-3.5 mr-1.5" />Edit Config</>
        ) : (
          <><Plug className="h-3.5 w-3.5 mr-1.5" />Connect</>
        )}
        <ChevronRight className="h-3.5 w-3.5 ml-auto" />
      </Button>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Integrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeIntegration, setActiveIntegration] = useState<Integration | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all integration configs
  const { data, isLoading } = useQuery<{ configs: Record<string, Record<string, string>> }>({
    queryKey: ["/api/admin/integrations"],
  });
  const configs = data?.configs ?? {};

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ id, config }: { id: string; config: Record<string, string> }) => {
      const res = await fetch(`/api/admin/integrations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ config }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/public"] });
      toast({ title: "Integration saved", description: "Configuration updated successfully." });
      setSheetOpen(false);
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/integrations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/public"] });
      toast({ title: "Integration disconnected" });
      setSheetOpen(false);
    },
    onError: () => toast({ title: "Failed to disconnect", variant: "destructive" }),
  });

  // Filtered integrations
  const filtered = INTEGRATIONS.filter(i => {
    const matchCat = activeCategory === "all" || i.category === activeCategory;
    const matchSearch = !searchQuery || [i.name, i.tagline, i.description].some(
      s => s.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchCat && matchSearch;
  });

  // Stats
  const connectedCount = INTEGRATIONS.filter(i => isConfigured(i, configs)).length;

  const openConfigure = (intg: Integration) => {
    setActiveIntegration(intg);
    setSheetOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect third-party services to your store. {connectedCount} of {INTEGRATIONS.length} connected.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500" />
            {connectedCount} Connected
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            {INTEGRATIONS.length - connectedCount} Available
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 max-w-sm"
          placeholder="Search integrations…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = cat.id === "all"
              ? INTEGRATIONS.filter(i => isConfigured(i, configs)).length
              : INTEGRATIONS.filter(i => i.category === cat.id && isConfigured(i, configs)).length;
            return (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs gap-1.5 data-[state=active]:bg-background">
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
                {count > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-xs ml-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-500" />Connected</span>
        <span className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-xs px-1.5 h-4 border-green-400 text-green-600 py-0">auto-inject</Badge>
          Script injected automatically on save
        </span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <Plug className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No integrations found</p>
          <p className="text-sm">Try adjusting your search or category filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(intg => (
            <IntegrationCard
              key={intg.id}
              integration={intg}
              configured={isConfigured(intg, configs)}
              onConfigure={() => openConfigure(intg)}
            />
          ))}
        </div>
      )}

      {/* Configure Sheet */}
      <ConfigureSheet
        integration={activeIntegration}
        savedConfig={activeIntegration ? (configs[activeIntegration.id] ?? {}) : {}}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={(id, config) => saveMutation.mutate({ id, config })}
        onDisconnect={id => disconnectMutation.mutate(id)}
        saving={saveMutation.isPending || disconnectMutation.isPending}
      />
    </div>
  );
}
