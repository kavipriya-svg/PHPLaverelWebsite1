import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// ── Design tokens (matching the HTML exactly) ────────────────────────────────
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

// ── Font helpers ─────────────────────────────────────────────────────────────
const PLAYFAIR = "Playfair Display, serif";
const INTER    = "Inter, sans-serif";
const MONO     = "'JetBrains Mono', monospace";

const monoLabel: React.CSSProperties = {
  fontFamily: MONO,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  fontSize: 10,
  fontWeight: 500,
};

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast }       = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");

  // ── Quote-box parallax (from the HTML script) ────────────────────────────
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

  // ── Preserved login logic (unchanged) ────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/login", { email, password });
      const data     = await response.json();
      if (data.success) {
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.firstName || data.user.email}!`,
        });
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/admin");
      }
    } catch (err: any) {
      let message = "Login failed. Please check your credentials.";
      if (err?.message) {
        try {
          const match = err.message.match(/\{.*\}/);
          if (match) {
            const errorData = JSON.parse(match[0]);
            message = errorData.error || message;
          }
        } catch {
          message = err.message.includes(":")
            ? err.message.split(":").slice(1).join(":").trim()
            : err.message;
        }
      }
      setError(message);
      toast({ title: "Login failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Input focus style helpers ─────────────────────────────────────────────
  const [emailFocus,    setEmailFocus]    = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${focused ? T.secondary : T.outlineVariant}`,
    padding: "12px 0",
    outline: "none",
    fontFamily: INTER,
    fontSize: 16,
    lineHeight: "24px",
    color: T.primary,
    transition: "border-color 0.2s",
  });

  return (
    <div style={{ background: T.surface, color: T.onSurface, minHeight: "100vh", display: "flex", flexDirection: "column", overflowX: "hidden", fontFamily: INTER }}>

      {/* ── Google Fonts ── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />

      {/* ── Header ── */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        width: "100%", padding: "12px 20px",
        position: "fixed", top: 0, zIndex: 50,
        background: "transparent",
      }}
        className="md:px-16"
      >
        <div style={{ fontFamily: PLAYFAIR, fontSize: "clamp(24px,3vw,48px)", lineHeight: 1.1, fontWeight: 600, color: T.primary, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
          19 DOGS
        </div>
        <Link href="/">
          <a style={{ ...monoLabel, color: T.onSurfaceVariant, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, transition: "color 0.3s" }}
            onMouseOver={e => (e.currentTarget.style.color = T.secondary)}
            onMouseOut={e  => (e.currentTarget.style.color = T.onSurfaceVariant)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>arrow_back</span>
            STORE
          </a>
        </Link>
      </header>

      {/* ── Main grid ── */}
      <main style={{ flexGrow: 1, display: "grid", gridTemplateColumns: "1fr", minHeight: "100vh" }} className="md:grid-cols-12-login">
        <style>{`
          @media (min-width: 768px) {
            .login-grid { grid-template-columns: 5fr 7fr !important; }
          }
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
            font-family: 'Material Symbols Outlined';
          }
          .persona-card:hover { background: ${T.surfaceContainerHigh}; border-left-color: ${T.secondary}; }
          .footer-link:hover { color: ${T.secondary}; }
          input::placeholder { font-family: '${INTER}'; font-weight: 300; color: ${T.onSurfaceVariant}; }
          .sign-in-btn:hover { background: ${T.primary}; }
          .sign-in-btn:hover .btn-arrow { transform: translateX(4px); }
          .btn-arrow { transition: transform 0.2s; }
        `}</style>

        <div className="login-grid" style={{ display: "grid", gridTemplateColumns: "1fr", minHeight: "100vh" }}>

          {/* ── LEFT: Form ── */}
          <section style={{
            display: "flex", flexDirection: "column", justifyContent: "center",
            padding: "96px 20px", background: T.surfaceBright, zIndex: 10, position: "relative",
          }}
            className="md:col-span-5 md:px-16"
          >
            <div style={{ maxWidth: 448, width: "100%", marginLeft: 0 }} className="mx-auto md:mx-0">

              {/* Heading */}
              <div style={{ marginBottom: 48 }}>
                <h1 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(36px,4vw,48px)", lineHeight: 1.15, fontWeight: 600, color: T.primary, marginBottom: 8 }}>
                  Welcome Back
                </h1>
                <p style={{ fontFamily: INTER, fontSize: 16, color: T.onSurfaceVariant }}>
                  Sign in to your 19 DOGS account.
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div style={{ marginBottom: 24, padding: "12px 16px", background: "#ffdad6", color: "#93000a", fontFamily: INTER, fontSize: 14 }}>
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>

                {/* Email */}
                <div>
                  <label style={{ ...monoLabel, display: "block", marginBottom: 8, color: T.primary }}>
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
                    style={inputStyle(emailFocus)}
                    required
                    data-testid="input-admin-email"
                  />
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                    <label style={{ ...monoLabel, color: T.primary }}>ACCESS_KEY / PASSWORD</label>
                    <a href="#" style={{ ...monoLabel, color: T.secondary, textDecoration: "none" }}
                      onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseOut={e  => (e.currentTarget.style.textDecoration = "none")}
                    >
                      Forgot_Password?
                    </a>
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
                    style={inputStyle(passwordFocus)}
                    required
                    data-testid="input-admin-password"
                  />
                </div>

                {/* Submit */}
                <div style={{ paddingTop: 24 }}>
                  <button
                    type="submit"
                    disabled={isLoading}
                    data-testid="button-admin-login"
                    className="sign-in-btn"
                    style={{
                      width: "100%", background: T.primaryContainer, color: T.onPrimary,
                      padding: "20px 0", border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                      fontFamily: INTER, fontSize: 14, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.15em",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                      transition: "background 0.3s",
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    {isLoading ? (
                      <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                    ) : null}
                    <span>{isLoading ? "Signing In…" : "Sign In"}</span>
                    {!isLoading && (
                      <span className="material-symbols-outlined btn-arrow" style={{ fontSize: 20 }}>arrow_forward</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Sign up link */}
              <div style={{ marginTop: 32 }}>
                <p style={{ fontFamily: INTER, fontSize: 14, fontWeight: 600, color: T.onSurfaceVariant }}>
                  Don't have an account?{" "}
                  <Link href="/signup">
                    <a style={{ color: T.secondary, fontWeight: 700, textDecoration: "none" }}
                      onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseOut={e  => (e.currentTarget.style.textDecoration = "none")}
                    >
                      Create one
                    </a>
                  </Link>
                </p>
              </div>

              {/* Persona bento */}
              <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { icon: "person",            label: "CUSTOMERS", sub: "SHOP & TRACK"     },
                  { icon: "medical_services",  label: "PROVIDERS", sub: "MANAGE SERVICES"  },
                  { icon: "terminal",          label: "ADMINS",    sub: "FULL CONTROL"     },
                ].map(card => (
                  <div
                    key={card.label}
                    className="persona-card"
                    style={{
                      display: "flex", flexDirection: "column", gap: 8,
                      padding: 16, background: T.surfaceContainerLow, cursor: "pointer",
                      borderLeft: "2px solid transparent", transition: "background 0.2s, border-color 0.2s",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.secondary }}>
                      {card.icon}
                    </span>
                    <div style={{ ...monoLabel, color: T.primary }}>{card.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: T.onSurfaceVariant, opacity: 0.7 }}>{card.sub}</div>
                  </div>
                ))}
              </div>

              {/* Secure badge */}
              <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 8, color: T.onSurfaceVariant, opacity: 0.6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock</span>
                <span style={{ ...monoLabel }}>Secure encrypted sign-in_V4.0</span>
              </div>

            </div>
          </section>

          {/* ── RIGHT: Cinematic panel ── */}
          <section
            className="hidden md:block"
            style={{ position: "relative", height: "100%" }}
          >
            {/* Background image */}
            <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYsP8GnqxhFOxyNBXUmvJD-3jOrE5G7fmxHhwbLjQz8voaI1PpP4IqfXjZo5UzwYmfB47e4buBryvn3yBupaBXesMJB8lgZzNCC6ALki1Jqida_kyUAocar8W_J2OUpcoBl2UjXcMTWDJrvLFecuoDwuQ4xuCBhXe3PbuG0SFqxxW4mLAsVWbLjsa4ELcXfonCWL99eCjijZWf79fZNyVZflnIs6K-KU8hldrF2GgxZX5vMR9XtrjiZ-EDoXCRkAtM9x5wQoQydeOb"
                alt="19 DOGS editorial — Doberman in copper-accented harness"
                loading="lazy"
                onError={e => {
                  const t = e.currentTarget;
                  if (!t.dataset.fb) {
                    t.dataset.fb = "1";
                    t.src = "https://images.unsplash.com/photo-1534361960057-19f073a9dee3?w=1400&auto=format&fit=crop";
                  }
                }}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {/* Left-edge gradient overlay */}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${T.surfaceBright}66, transparent)`, zIndex: 1 }} />

            {/* Quote box */}
            <div style={{ position: "absolute", bottom: 64, left: 64, right: 64, zIndex: 2 }}>
              <div
                ref={quoteRef}
                style={{
                  maxWidth: 512, padding: 32,
                  background: `${T.primaryContainer}cc`,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  borderLeft: `1px solid ${T.secondary}`,
                  transition: "transform 0.1s ease-out",
                }}
              >
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
      <footer style={{
        display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center",
        width: "100%", padding: "32px 20px",
        background: T.surface, borderTop: `1px solid ${T.outlineVariant}`,
        marginTop: "auto",
      }}
        className="md:flex-row md:px-16"
      >
        <div style={{ fontFamily: PLAYFAIR, fontSize: 32, lineHeight: "40px", fontWeight: 400, color: T.primary, marginBottom: 16 }} className="md:mb-0">
          19 DOGS
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24, marginBottom: 16 }} className="md:mb-0">
          {["PRIVACY", "TERMS", "SCIENTIFIC PROTOCOL"].map(lnk => (
            <a key={lnk} href="#" className="footer-link"
              style={{ ...monoLabel, color: T.onSurfaceVariant, textDecoration: "none", transition: "color 0.3s" }}
            >
              {lnk}
            </a>
          ))}
        </div>
        <div style={{ ...monoLabel, color: T.onSurfaceVariant, opacity: 0.8 }}>
          © 2024 19 DOGS. BIOLOGICAL PRESTIGE.
        </div>
      </footer>

      {/* Spin keyframe for loader */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
