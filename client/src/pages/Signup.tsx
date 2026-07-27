import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BrandingSettings { logoUrl: string; storeName: string; showStoreName: boolean; }
const defaultBranding: BrandingSettings = { logoUrl: "", storeName: "19 DOGS", showStoreName: true };
type SignupStep = "details" | "otp";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  primary:              "#00160c",
  primaryContainer:     "#012d1d",
  onPrimary:            "#ffffff",
  secondary:            "#944923",
  surface:              "#f9faf6",
  surfaceContainerLow:  "#f3f4f0",
  onSurface:            "#1a1c1a",
  onSurfaceVariant:     "#414844",
  onPrimaryContainer:   "#6d9681",
  outlineVariant:       "#c1c8c2",
  outline:              "#717973",
  error:                "#ba1a1a",
};
const PLAYFAIR = "Playfair Display, serif";
const INTER    = "Inter, sans-serif";
const MONO     = "'JetBrains Mono', monospace";

const capLabel: React.CSSProperties = {
  fontFamily: INTER, fontSize: 11, lineHeight: "16px",
  letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase",
  color: T.outline,
};

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast }       = useToast();

  // ── State (preserved) ─────────────────────────────────────────────────────
  const [step,            setStep]            = useState<SignupStep>("details");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName,       setFirstName]       = useState("");
  const [lastName,        setLastName]        = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [otpCode,         setOtpCode]         = useState("");
  const [otpExpiresIn,    setOtpExpiresIn]    = useState(0);
  const [devOtp,          setDevOtp]          = useState<string | null>(null);

  // focus states for border animation
  const [focus, setFocus] = useState<Record<string, boolean>>({});
  const setF = (k: string, v: boolean) => setFocus(p => ({ ...p, [k]: v }));

  // ── Branding ──────────────────────────────────────────────────────────────
  const { data: brandingData } = useQuery<{ settings: BrandingSettings }>({
    queryKey: ["/api/settings/branding"],
  });
  const branding  = brandingData?.settings ? { ...defaultBranding, ...brandingData.settings } : defaultBranding;
  const storeName = branding.showStoreName ? branding.storeName : "19 DOGS";

  // ── OTP countdown (preserved) ─────────────────────────────────────────────
  useEffect(() => {
    if (otpExpiresIn > 0) {
      const t = setTimeout(() => setOtpExpiresIn(n => n - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpExpiresIn]);
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Mutations (preserved exactly) ─────────────────────────────────────────
  const sendOtpMutation = useMutation({
    mutationFn: async (data: { email: string; purpose: string }) => {
      const res = await apiRequest("POST", "/api/auth/send-otp", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setStep("otp");
        setOtpExpiresIn(data.expiresIn || 300);
        if (data.devOtp) setDevOtp(data.devOtp);
        toast({
          title: "Verification Code Sent",
          description: data.emailSent
            ? "We've sent a verification code to your email."
            : "Enter the verification code to continue.",
        });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Send Code", description: error.message || "Could not send verification code.", variant: "destructive" });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; firstName: string; lastName: string; otpCode: string }) => {
      const res = await apiRequest("POST", "/api/auth/signup-with-otp", userData);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Account Created!", description: `Welcome to ${storeName}! You are now signed in.` });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
    },
  });

  // ── Password validation (preserved) ───────────────────────────────────────
  const passwordRequirements = [
    { label: "At least 8 characters",       met: password.length >= 8 },
    { label: "Contains a number",           met: /\d/.test(password) },
    { label: "Contains uppercase letter",   met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter",   met: /[a-z]/.test(password) },
  ];
  const allRequirementsMet = passwordRequirements.every(r => r.met);
  const passwordsMatch     = password === confirmPassword && password.length > 0;

  // ── Handlers (preserved) ──────────────────────────────────────────────────
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (!allRequirementsMet) {
      toast({ title: "Password Too Weak", description: "Please ensure your password meets all requirements.", variant: "destructive" });
      return;
    }
    if (!passwordsMatch) {
      toast({ title: "Passwords Don't Match", description: "Please make sure your passwords match.", variant: "destructive" });
      return;
    }
    sendOtpMutation.mutate({ email, purpose: "signup" });
  };

  const handleVerifyAndSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast({ title: "Invalid Code", description: "Please enter the 6-digit verification code.", variant: "destructive" });
      return;
    }
    signupMutation.mutate({ email, password, firstName, lastName, otpCode });
  };

  const handleResendOtp = () => {
    setOtpCode("");
    setDevOtp(null);
    sendOtpMutation.mutate({ email, purpose: "signup" });
  };

  // ── Shared input style ────────────────────────────────────────────────────
  const inputSt = (key: string): React.CSSProperties => ({
    width: "100%", background: "transparent", border: "none",
    borderBottom: `${focus[key] ? 2 : 1}px solid ${focus[key] ? T.primary : "#DBDAD5"}`,
    padding: "12px 0", outline: "none",
    fontFamily: INTER, fontSize: 16, lineHeight: "24px", color: T.primary,
    transition: "border-color 0.3s ease, border-width 0.1s ease",
    boxShadow: "none",
  });

  return (
    <div style={{ background: T.surface, minHeight: "100vh", overflowX: "hidden", fontFamily: INTER, color: T.primary }}>

      {/* ── Fonts & Material Symbols ── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #f9faf6; }
        ::-webkit-scrollbar-thumb { background: #012d1d; }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          font-family: 'Material Symbols Outlined';
        }
        .grayscale-to-color { filter: grayscale(100%); transition: filter 0.5s ease-in-out, transform 0.5s ease-in-out; }
        .grayscale-to-color:hover { filter: grayscale(0%); transform: scale(1.02); }
        .signup-grid { display: flex; flex-direction: column; min-height: 100vh; width: 100%; }
        @media (min-width: 768px) { .signup-grid { flex-direction: row; } }
        .left-panel { width: 100%; height: 512px; position: relative; overflow: hidden; background: ${T.primaryContainer}; }
        @media (min-width: 768px) { .left-panel { width: 50%; height: auto; min-height: 100vh; } }
        .right-panel { width: 100%; display: flex; flex-direction: column; justify-content: center; padding: 80px 20px; background: ${T.surface}; position: relative; }
        @media (min-width: 768px) { .right-panel { width: 50%; padding: 80px 64px; } }
        .role-btn { border: 1px solid ${T.outlineVariant}; padding: 16px 8px; text-align: center; background: transparent; cursor: pointer; transition: all 0.2s; }
        .role-btn:hover, .role-btn.active { border-color: ${T.primary}; background: ${T.primaryContainer}; color: ${T.onPrimaryContainer}; }
        .role-btn.active span { color: ${T.onPrimaryContainer}; }
        .init-btn { width: 100%; background: ${T.primaryContainer}; color: white; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; border: none; cursor: pointer; transition: background 0.3s; }
        .init-btn:hover:not(:disabled) { background: ${T.primary}; }
        .init-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .init-btn .btn-arrow { transition: transform 0.3s; }
        .init-btn:hover:not(:disabled) .btn-arrow { transform: translateX(8px); }
        .req-met { color: #16a34a; }
        .req-unmet { color: ${T.onSurfaceVariant}; opacity: 0.6; }
        .signin-link { color: ${T.secondary}; font-family: ${INTER}; font-size: 11px; letter-spacing: 0.15em; font-weight: 700; text-transform: uppercase; text-decoration: none; transition: color 0.2s; }
        .signin-link:hover { color: #77330e; }
        .back-link { color: ${T.onSurfaceVariant}; font-family: ${MONO}; font-size: 10px; letter-spacing: 0.1em; font-weight: 500; text-transform: uppercase; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: color 0.2s; }
        .back-link:hover { color: ${T.secondary}; }
        input::placeholder { font-family: ${INTER}; font-weight: 300; color: ${T.outline}; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .otp-timer { font-family: ${MONO}; font-size: 13px; font-weight: 500; color: ${T.onSurfaceVariant}; }
        .dev-otp-box { background: ${T.surfaceContainerLow}; padding: 8px 12px; font-family: ${MONO}; font-size: 12px; color: ${T.onSurfaceVariant}; border-left: 2px solid ${T.secondary}; }
      `}</style>

      <main className="signup-grid">

        {/* ── LEFT: Editorial/Visual panel ── */}
        <section className="left-panel">
          {/* Cinematic image */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <img
              className="grayscale-to-color"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYsP8GnqxhFOxyNBXUmvJD-3jOrE5G7fmxHhwbLjQz8voaI1PpP4IqfXjZo5UzwYmfB47e4buBryvn3yBupaBXesMJB8lgZzNCC6ALki1Jqida_kyUAocar8W_J2OUpcoBl2UjXcMTWDJrvLFecuoDwuQ4xuCBhXe3PbuG0SFqxxW4mLAsVWbLjsa4ELcXfonCWL99eCjijZWf79fZNyVZflnIs6K-KU8hldrF2GgxZX5vMR9XtrjiZ-EDoXCRkAtM9x5wQoQydeOb"
              alt="19 DOGS editorial — handler and Doberman in futuristic laboratory"
              loading="lazy"
              onError={e => {
                const t = e.currentTarget;
                if (!t.dataset.fb) { t.dataset.fb = "1"; t.src = "https://images.unsplash.com/photo-1534361960057-19f073a9dee3?w=1200&auto=format&fit=crop"; }
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
            />
          </div>

          {/* Editorial text overlay */}
          <div style={{ position: "absolute", bottom: 0, left: 0, padding: "20px", zIndex: 10, maxWidth: 560 }} className="md-padding-desktop">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ height: 1, width: 48, background: T.onPrimaryContainer }} />
              <span style={{ ...capLabel, color: T.onPrimaryContainer, letterSpacing: "0.15em" }}>BIOLOGICAL_PROTOCOL_V2</span>
            </div>
            <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(28px,4vw,48px)", lineHeight: 1.15, fontWeight: 600, fontStyle: "italic", color: "#ffffff", marginBottom: 12 }}>
              Biological prestige is a shared journey.
            </h2>
            <p style={{ fontFamily: INTER, fontSize: 18, lineHeight: "28px", fontWeight: 300, color: T.onPrimaryContainer, opacity: 0.9, maxWidth: 448 }}>
              Synchronize your life with the {storeName} standard. Excellence is not a baseline; it is our biological mandate.
            </p>
          </div>
        </section>

        {/* ── RIGHT: Form panel ── */}
        <section className="right-panel">
          {/* Mobile brand anchor */}
          <div style={{ display: "block", position: "absolute", top: 32, left: 20 }} className="md-hidden">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={storeName} style={{ height: 36, objectFit: "contain", display: "block" }} />
            ) : (
              <span style={{ fontFamily: PLAYFAIR, fontSize: 32, lineHeight: "40px", color: T.primary, letterSpacing: "-0.02em" }}>
                {storeName}
              </span>
            )}
          </div>

          <div style={{ maxWidth: 448, width: "100%", marginLeft: 0 }} className="mx-auto md-mx-0">

            {/* ── STEP 1: Details ── */}
            {step === "details" && (
              <>
                <header style={{ marginBottom: 32 }}>
                  <h1 data-testid="text-signup-title" style={{ fontFamily: PLAYFAIR, fontSize: "clamp(32px,4vw,48px)", lineHeight: 1.15, fontWeight: 600, color: T.primary, letterSpacing: "-0.01em", marginBottom: 8 }}>
                    Initialize Profile
                  </h1>
                  <p style={{ fontFamily: INTER, fontSize: 16, lineHeight: "24px", color: T.onSurfaceVariant, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.secondary, display: "inline-block", flexShrink: 0 }} />
                    Begin your synchronization with the {storeName} ecosystem.
                  </p>
                </header>

                <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 32 }}>

                  {/* Name: first + last side by side */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div>
                      <label htmlFor="firstName" style={{ ...capLabel, display: "block", marginBottom: 4 }}>FIRST_NAME</label>
                      <input
                        id="firstName"
                        type="text"
                        placeholder="FIRST NAME"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        onFocus={() => setF("firstName", true)}
                        onBlur={() => setF("firstName", false)}
                        disabled={sendOtpMutation.isPending}
                        style={inputSt("firstName")}
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" style={{ ...capLabel, display: "block", marginBottom: 4 }}>LAST_NAME</label>
                      <input
                        id="lastName"
                        type="text"
                        placeholder="LAST NAME"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        onFocus={() => setF("lastName", true)}
                        onBlur={() => setF("lastName", false)}
                        disabled={sendOtpMutation.isPending}
                        style={inputSt("lastName")}
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>

                  {/* Email — BIOLOGICAL_ID */}
                  <div>
                    <label htmlFor="email" style={{ ...capLabel, display: "block", marginBottom: 4 }}>BIOLOGICAL_ID / EMAIL</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="ACCESS_ENDPOINT@19DOGS.COM"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setF("email", true)}
                      onBlur={() => setF("email", false)}
                      disabled={sendOtpMutation.isPending}
                      required
                      style={inputSt("email")}
                      data-testid="input-email"
                      autoComplete="email"
                    />
                  </div>

                  {/* Password — ACCESS_KEY */}
                  <div>
                    <label htmlFor="password" style={{ ...capLabel, display: "block", marginBottom: 4 }}>ACCESS_KEY / PASSWORD</label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={() => setF("password", true)}
                        onBlur={() => setF("password", false)}
                        disabled={sendOtpMutation.isPending}
                        required
                        style={{ ...inputSt("password"), paddingRight: 36 }}
                        data-testid="input-password"
                        autoComplete="new-password"
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
                    {/* Password requirements */}
                    {password.length > 0 && (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                        {passwordRequirements.map((req, i) => (
                          <div key={i} className={req.met ? "req-met" : "req-unmet"} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 10, letterSpacing: "0.05em" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: req.met ? "'FILL' 1" : "'FILL' 0" }}>
                              {req.met ? "check_circle" : "radio_button_unchecked"}
                            </span>
                            {req.label.toUpperCase()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label htmlFor="confirmPassword" style={{ ...capLabel, display: "block", marginBottom: 4 }}>CONFIRM_ACCESS_KEY</label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      onFocus={() => setF("confirm", true)}
                      onBlur={() => setF("confirm", false)}
                      disabled={sendOtpMutation.isPending}
                      required
                      style={inputSt("confirm")}
                      data-testid="input-confirm-password"
                      autoComplete="new-password"
                    />
                    {confirmPassword.length > 0 && (
                      <div className={passwordsMatch ? "req-met" : ""} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontFamily: MONO, fontSize: 10, letterSpacing: "0.05em", color: passwordsMatch ? "#16a34a" : T.error }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: passwordsMatch ? "'FILL' 1" : "'FILL' 0" }}>
                          {passwordsMatch ? "check_circle" : "cancel"}
                        </span>
                        {passwordsMatch ? "PASSWORDS_MATCH" : "PASSWORDS_DO_NOT_MATCH"}
                      </div>
                    )}
                  </div>

                  {/* Role selection (visual, customer is the signup role) */}
                  <div style={{ paddingTop: 12 }}>
                    <label style={{ ...capLabel, display: "block", marginBottom: 12 }}>PROTOCOL_ROLE_SELECTION</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {["CUSTOMER", "PROVIDER", "ADMIN"].map(role => (
                        <div key={role} className={`role-btn${role === "CUSTOMER" ? " active" : ""}`} style={{ pointerEvents: role !== "CUSTOMER" ? "none" : "auto", opacity: role !== "CUSTOMER" ? 0.45 : 1 }}>
                          <span style={{ ...capLabel, color: role === "CUSTOMER" ? T.onPrimaryContainer : T.onSurfaceVariant }}>{role}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", color: T.outline, marginTop: 8, opacity: 0.7 }}>
                      PUBLIC REGISTRATION IS FOR CUSTOMERS ONLY
                    </p>
                  </div>

                  {/* Submit */}
                  <div style={{ paddingTop: 0 }}>
                    <button
                      type="submit"
                      disabled={sendOtpMutation.isPending || !allRequirementsMet || !passwordsMatch}
                      data-testid="button-continue"
                      className="init-btn"
                    >
                      <span style={{ fontFamily: INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" }}>
                        {sendOtpMutation.isPending ? "SENDING CODE…" : "INITIALIZE SESSION"}
                      </span>
                      {sendOtpMutation.isPending ? (
                        <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
                      ) : (
                        <span className="material-symbols-outlined btn-arrow" style={{ fontSize: 22 }}>arrow_forward</span>
                      )}
                    </button>
                  </div>

                  {/* Sign in link */}
                  <div style={{ textAlign: "center" }}>
                    <Link href="/login" className="signin-link" data-testid="link-signin">
                      Already a subject? Sign In
                    </Link>
                  </div>
                </form>
              </>
            )}

            {/* ── STEP 2: OTP Verification ── */}
            {step === "otp" && (
              <>
                <header style={{ marginBottom: 32 }}>
                  <h1 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(32px,4vw,48px)", lineHeight: 1.15, fontWeight: 600, color: T.primary, letterSpacing: "-0.01em", marginBottom: 8 }}>
                    Verify Access
                  </h1>
                  <p style={{ fontFamily: INTER, fontSize: 16, lineHeight: "24px", color: T.onSurfaceVariant, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.secondary, display: "inline-block", flexShrink: 0 }} />
                    Verification code dispatched to <strong style={{ color: T.primary }}>&nbsp;{email}</strong>
                  </p>
                </header>

                {/* Dev OTP hint */}
                {devOtp && (
                  <div className="dev-otp-box" style={{ marginBottom: 24 }}>
                    DEV_MODE — CODE: <strong>{devOtp}</strong>
                  </div>
                )}

                <form onSubmit={handleVerifyAndSignup} style={{ display: "flex", flexDirection: "column", gap: 32 }}>

                  {/* OTP input */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16 }}>
                    <label style={{ ...capLabel }}>VERIFICATION_CODE</label>
                    <div data-testid="input-otp">
                      <InputOTP
                        maxLength={6}
                        value={otpCode}
                        onChange={setOtpCode}
                        disabled={signupMutation.isPending}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {otpExpiresIn > 0 && (
                      <p className="otp-timer">CODE_EXPIRES: {formatTime(otpExpiresIn)}</p>
                    )}
                    {otpExpiresIn === 0 && (
                      <p style={{ fontFamily: MONO, fontSize: 11, color: T.error, letterSpacing: "0.08em" }}>CODE_EXPIRED — RESEND TO CONTINUE</p>
                    )}
                  </div>

                  {/* Verify submit */}
                  <button
                    type="submit"
                    disabled={signupMutation.isPending || otpCode.length !== 6}
                    data-testid="button-verify-signup"
                    className="init-btn"
                  >
                    <span style={{ fontFamily: INTER, fontSize: 11, letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" }}>
                      {signupMutation.isPending ? "CREATING ACCOUNT…" : "AUTHENTICATE & CREATE"}
                    </span>
                    {signupMutation.isPending ? (
                      <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
                    ) : (
                      <span className="material-symbols-outlined btn-arrow" style={{ fontSize: 22 }}>arrow_forward</span>
                    )}
                  </button>

                  {/* Back / Resend */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                      type="button"
                      data-testid="button-back"
                      disabled={signupMutation.isPending}
                      onClick={() => { setStep("details"); setOtpCode(""); setDevOtp(null); }}
                      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", fontWeight: 500, textTransform: "uppercase", color: T.onSurfaceVariant }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                      BACK
                    </button>
                    <button
                      type="button"
                      data-testid="button-resend-otp"
                      disabled={sendOtpMutation.isPending || signupMutation.isPending}
                      onClick={handleResendOtp}
                      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", fontWeight: 500, textTransform: "uppercase", color: T.secondary }}
                    >
                      {sendOtpMutation.isPending
                        ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                        : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                      }
                      RESEND_CODE
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ── Security footer ── */}
            <footer style={{ marginTop: 80, borderTop: `1px solid ${T.outlineVariant}`, paddingTop: 32, display: "flex", flexDirection: "column", gap: 12, opacity: 0.6 }} className="md-footer-row">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>lock</span>
                <span style={{ ...capLabel, color: T.onSurface }}>SECURE ENCRYPTED REGISTRATION_V1.0</span>
              </div>
              <div style={{ ...capLabel, color: T.onSurface }}>© 2024 19 DOGS. BIOLOGICAL PRESTIGE.</div>
            </footer>

          </div>

          {/* Decorative copper line */}
          <div style={{ position: "absolute", top: "50%", right: 0, width: 96, height: 1, background: "#fe9e71", opacity: 0.2, transform: "translateY(96px) rotate(90deg)" }} className="hidden lg-block" />
        </section>

      </main>
    </div>
  );
}
