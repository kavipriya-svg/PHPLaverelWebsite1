import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// ── Types (unchanged) ─────────────────────────────────────────────────────────
interface BrandingSettings { logoUrl: string; storeName: string; showStoreName: boolean; }
const defaultBranding: BrandingSettings = { logoUrl: "", storeName: "19 DOGS", showStoreName: true };
interface UnifiedLoginResponse {
  success: boolean;
  userType: "admin" | "customer" | "provider";
  user?: { id: string; email: string; firstName: string | null; lastName: string | null; role: string };
  provider?: { id: string; name: string; email: string };
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  primary:              "#00160c",
  primaryContainer:     "#012d1d",
  onPrimary:            "#ffffff",
  secondary:            "#944923",
  surface:              "#f9faf6",
  surfaceBright:        "#f9faf6",
  surfaceContainerLow:  "#f3f4f0",
  surfaceContainerHigh: "#e8e8e5",
  onSurface:            "#1a1c1a",
  onSurfaceVariant:     "#414844",
  outlineVariant:       "#c1c8c2",
};
const PLAYFAIR = "Playfair Display, serif";
const INTER    = "Inter, sans-serif";
const MONO     = "'JetBrains Mono', monospace";
const monoLabel: React.CSSProperties = {
  fontFamily: MONO, textTransform: "uppercase",
  letterSpacing: "0.1em", fontSize: 10, fontWeight: 500,
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast }       = useToast();
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocus,   setEmailFocus]   = useState(false);
  const [passFocus,    setPassFocus]    = useState(false);

  // ── Branding (preserved) ──────────────────────────────────────────────────
  const { data: brandingData } = useQuery<{ settings: BrandingSettings }>({
    queryKey: ["/api/settings/branding"],
  });
  const branding = brandingData?.settings ? { ...defaultBranding, ...brandingData.settings } : defaultBranding;
  const storeName = branding.showStoreName ? branding.storeName : "19 DOGS";

  // ── Unified login mutation (preserved exactly) ────────────────────────────
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/unified-login", credentials);
      return response.json() as Promise<UnifiedLoginResponse>;
    },
    onSuccess: (data) => {
      if (data.success) {
        switch (data.userType) {
          case "admin":
            toast({ title: "Welcome back, Admin!", description: "Redirecting to admin dashboard..." });
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            setLocation("/admin");
            break;
          case "provider":
            toast({ title: `Welcome back, ${data.provider?.name || "Provider"}!`, description: "Redirecting to your provider portal..." });
            queryClient.invalidateQueries({ queryKey: ["/api/provider/me"] });
            setLocation("/provider/dashboard");
            break;
          case "customer":
          default:
            toast({ title: "Welcome back!", description: "You have successfully signed in." });
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            setLocation("/");
            break;
        }
      }
    },
    onError: (error: Error) => {
      toast({ title: "Login Failed", description: error.message || "Invalid email or password", variant: "destructive" });
    },
  });

  // ── Submit handler (preserved) ────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing Fields", description: "Please enter both email and password.", variant: "destructive" });
      return;
    }
    loginMutation.mutate({ email, password });
  };

  // ── Quote-box parallax ────────────────────────────────────────────────────
  const quoteRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!quoteRef.current) return;
      const x = (e.clientX / window.innerWidth  - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      quoteRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%", background: "transparent", border: "none",
    borderBottom: `1px solid ${focused ? T.secondary : T.outlineVariant}`,
    padding: "12px 0", outline: "none",
    fontFamily: INTER, fontSize: 16, lineHeight: "24px", color: T.primary,
    transition: "border-color 0.2s",
  });

  return (
    <div style={{ background: T.surface, color: T.onSurface, minHeight: "100vh", display: "flex", flexDirection: "column", overflowX: "hidden", fontFamily: INTER }}>

      {/* Fonts + Material Icons */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />

      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          font-family: 'Material Symbols Outlined';
        }
        .persona-card { transition: background 0.2s, border-color 0.2s; }
        .persona-card:hover { background: ${T.surfaceContainerHigh} !important; border-left-color: ${T.secondary} !important; }
        .sign-in-btn { transition: background 0.3s; }
        .sign-in-btn:hover:not(:disabled) { background: ${T.primary} !important; }
        .sign-in-btn:hover .btn-arrow { transform: translateX(4px); }
        .btn-arrow { transition: transform 0.2s; display: inline-block; }
        .nav-store-link { color: ${T.onSurfaceVariant}; text-decoration: none; display: flex; align-items: center; gap: 8px; font-family: ${MONO}; text-transform: uppercase; letter-spacing: 0.1em; font-size: 10px; font-weight: 500; transition: color 0.3s; }
        .nav-store-link:hover { color: ${T.secondary}; }
        .footer-link { color: ${T.onSurfaceVariant}; text-decoration: none; transition: color 0.3s; font-family: ${MONO}; text-transform: uppercase; letter-spacing: 0.1em; font-size: 10px; font-weight: 500; }
        .footer-link:hover { color: ${T.secondary}; }
        .copper-link { color: ${T.secondary}; font-weight: 700; text-decoration: none; }
        .copper-link:hover { text-decoration: underline; }
        .mono-link { color: ${T.onSurfaceVariant}; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; font-family: ${MONO}; text-transform: uppercase; letter-spacing: 0.1em; font-size: 10px; font-weight: 500; transition: color 0.3s; }
        .mono-link:hover { color: ${T.secondary}; }
        .forgot-link { color: ${T.secondary}; text-decoration: none; font-family: ${MONO}; text-transform: uppercase; letter-spacing: 0.1em; font-size: 10px; font-weight: 500; }
        .forgot-link:hover { text-decoration: underline; }
        input::placeholder { font-family: ${INTER}; font-weight: 300; color: ${T.onSurfaceVariant}; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .login-grid { display: grid; grid-template-columns: 1fr; min-height: 100vh; }
        @media (min-width: 768px) { .login-grid { grid-template-columns: 5fr 7fr; } }
        .right-panel { display: none; }
        @media (min-width: 768px) { .right-panel { display: block; } }
        .h-padding { padding-left: 20px; padding-right: 20px; }
        @media (min-width: 768px) { .h-padding { padding-left: 64px; padding-right: 64px; } }
        .footer-row { flex-direction: column; align-items: center; }
        @media (min-width: 768px) { .footer-row { flex-direction: row; } }
        .footer-mb { margin-bottom: 16px; }
        @media (min-width: 768px) { .footer-mb { margin-bottom: 0; } }
      `}</style>

      {/* ── Header ── */}
      <header className="h-padding" style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        width: "100%", paddingTop: 12, paddingBottom: 12,
        position: "fixed", top: 0, zIndex: 50, background: "transparent",
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={storeName} style={{ height: 56, objectFit: "contain", display: "block" }} />
          ) : (
            <span style={{ fontFamily: PLAYFAIR, fontSize: "clamp(24px,3vw,48px)", lineHeight: 1.1, fontWeight: 600, color: T.primary, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
              {storeName}
            </span>
          )}
        </div>
        <Link href="/" className="nav-store-link">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          STORE
        </Link>
      </header>

      {/* ── Main split layout ── */}
      <main style={{ flexGrow: 1 }}>
        <div className="login-grid">

          {/* ── LEFT: Form panel ── */}
          <section className="h-padding" style={{
            display: "flex", flexDirection: "column", justifyContent: "center",
            paddingTop: 96, paddingBottom: 96, background: T.surfaceBright, zIndex: 10, position: "relative",
          }}>
            <div style={{ maxWidth: 448, width: "100%" }}>

              {/* Heading */}
              <div style={{ marginBottom: 48 }}>
                <h1 data-testid="text-login-title" style={{ fontFamily: PLAYFAIR, fontSize: "clamp(36px,4vw,48px)", lineHeight: 1.15, fontWeight: 600, color: T.primary, marginBottom: 8 }}>
                  Welcome Back
                </h1>
                <p style={{ fontFamily: INTER, fontSize: 16, color: T.onSurfaceVariant }}>
                  Sign in to your {storeName} account.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>

                {/* Email */}
                <div>
                  <label htmlFor="email" style={{ ...monoLabel, display: "block", marginBottom: 8, color: T.primary }}>
                    Biological_ID / Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="identifier@19dogs.lab"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                    disabled={loginMutation.isPending}
                    style={inputStyle(emailFocus)}
                    data-testid="input-email"
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                    <label htmlFor="password" style={{ ...monoLabel, color: T.primary }}>ACCESS_KEY / Password</label>
                    <Link href="/forgot-password" className="forgot-link" data-testid="link-forgot-password">
                      Forgot_Password?
                    </Link>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setPassFocus(true)}
                      onBlur={() => setPassFocus(false)}
                      disabled={loginMutation.isPending}
                      style={{ ...inputStyle(passFocus), paddingRight: 36 }}
                      data-testid="input-password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      data-testid="button-toggle-password"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.onSurfaceVariant, padding: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div style={{ paddingTop: 24 }}>
                  <button
                    type="submit"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                    className="sign-in-btn"
                    style={{
                      width: "100%", background: T.primaryContainer, color: T.onPrimary,
                      padding: "20px 0", border: "none", cursor: loginMutation.isPending ? "not-allowed" : "pointer",
                      fontFamily: INTER, fontSize: 14, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.15em",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                      opacity: loginMutation.isPending ? 0.7 : 1,
                    }}
                  >
                    {loginMutation.isPending && (
                      <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                    )}
                    <span>{loginMutation.isPending ? "Signing In…" : "Sign In"}</span>
                    {!loginMutation.isPending && (
                      <span className="material-symbols-outlined btn-arrow" style={{ fontSize: 20 }}>arrow_forward</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Sign-up link */}
              <div style={{ marginTop: 32 }}>
                <p style={{ fontFamily: INTER, fontSize: 14, fontWeight: 600, color: T.onSurfaceVariant }}>
                  Don't have an account?{" "}
                  <Link href="/signup" className="copper-link" data-testid="link-signup">
                    Create one
                  </Link>
                </p>
              </div>

              {/* Persona bento cards */}
              <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { icon: "person",           label: "CUSTOMERS", sub: "SHOP & TRACK",    testid: "card-feature-customers"  },
                  { icon: "medical_services", label: "PROVIDERS", sub: "MANAGE SERVICES", testid: "card-feature-providers"  },
                  { icon: "terminal",         label: "ADMINS",    sub: "FULL CONTROL",    testid: "card-feature-admins"     },
                ].map(c => (
                  <div key={c.label} data-testid={c.testid} className="persona-card"
                    style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16, background: T.surfaceContainerLow, cursor: "pointer", borderLeft: "2px solid transparent" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.secondary }}>{c.icon}</span>
                    <div style={{ ...monoLabel, color: T.primary }}>{c.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: T.onSurfaceVariant, opacity: 0.7 }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* Secure badge */}
              <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 8, color: T.onSurfaceVariant, opacity: 0.6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock</span>
                <span style={{ ...monoLabel }}>Secure encrypted sign-in_V4.0</span>
              </div>

              {/* Back to store */}
              <div style={{ marginTop: 24 }}>
                <Link href="/" className="mono-link" data-testid="link-back-home">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>store</span>
                  Back to Store
                </Link>
              </div>

            </div>
          </section>

          {/* ── RIGHT: Cinematic panel ── */}
          <section className="right-panel" style={{ position: "relative", height: "100%" }}>
            <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYsP8GnqxhFOxyNBXUmvJD-3jOrE5G7fmxHhwbLjQz8voaI1PpP4IqfXjZo5UzwYmfB47e4buBryvn3yBupaBXesMJB8lgZzNCC6ALki1Jqida_kyUAocar8W_J2OUpcoBl2UjXcMTWDJrvLFecuoDwuQ4xuCBhXe3PbuG0SFqxxW4mLAsVWbLjsa4ELcXfonCWL99eCjijZWf79fZNyVZflnIs6K-KU8hldrF2GgxZX5vMR9XtrjiZ-EDoXCRkAtM9x5wQoQydeOb"
                alt="19 DOGS editorial — Doberman in copper-accented harness"
                loading="lazy"
                onError={e => {
                  const t = e.currentTarget;
                  if (!t.dataset.fb) { t.dataset.fb = "1"; t.src = "https://images.unsplash.com/photo-1534361960057-19f073a9dee3?w=1400&auto=format&fit=crop"; }
                }}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${T.surfaceBright}66, transparent)`, zIndex: 1 }} />
            <div style={{ position: "absolute", bottom: 64, left: 64, right: 64, zIndex: 2 }}>
              <div ref={quoteRef} style={{ maxWidth: 512, padding: 32, background: `${T.primaryContainer}cc`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderLeft: `1px solid ${T.secondary}`, transition: "transform 0.1s ease-out" }}>
                <div style={{ ...monoLabel, color: T.secondary, marginBottom: 16 }}>PROTOCOL_019</div>
                <p style={{ fontFamily: PLAYFAIR, fontSize: 32, lineHeight: "40px", fontWeight: 400, fontStyle: "italic", color: T.onPrimary, marginBottom: 16 }}>
                  "Biological prestige is not inherited; it is engineered through rigorous scientific devotion."
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 48, height: 1, background: T.secondary }} />
                  <span style={{ fontFamily: INTER, fontSize: 10, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase", color: T.onPrimary }}>
                    THE NEURAL BRIDGE PROJECT
                  </span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="h-padding footer-row" style={{ display: "flex", justifyContent: "space-between", width: "100%", paddingTop: 32, paddingBottom: 32, background: T.surface, borderTop: `1px solid ${T.outlineVariant}`, marginTop: "auto" }}>
        <div className="footer-mb" style={{ display: "flex", alignItems: "center" }}>
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={storeName} style={{ height: 36, objectFit: "contain", display: "block" }} />
          ) : (
            <span style={{ fontFamily: PLAYFAIR, fontSize: 32, lineHeight: "40px", fontWeight: 400, color: T.primary }}>
              {storeName}
            </span>
          )}
        </div>
        <div className="footer-mb" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
          {["PRIVACY", "TERMS", "SCIENTIFIC PROTOCOL"].map(lnk => (
            <a key={lnk} href="#" className="footer-link">{lnk}</a>
          ))}
        </div>
        <div style={{ ...monoLabel, color: T.onSurfaceVariant, opacity: 0.8 }}>© 2024 19 DOGS. BIOLOGICAL PRESTIGE.</div>
      </footer>

    </div>
  );
}
