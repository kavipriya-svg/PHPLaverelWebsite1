import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, ArrowLeft, Loader2, KeyRound, Check, Eye, EyeOff, RefreshCw, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface BrandingSettings {
  logoUrl: string;
  storeName: string;
  showStoreName: boolean;
}

const defaultBranding: BrandingSettings = {
  logoUrl: "",
  storeName: "ShopHub",
  showStoreName: true,
};

type ResetStep = 'email' | 'otp' | 'newPassword' | 'success';

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const { data: brandingData } = useQuery<{ settings: BrandingSettings }>({
    queryKey: ["/api/settings/branding"],
  });

  const branding = brandingData?.settings ? { ...defaultBranding, ...brandingData.settings } : defaultBranding;

  // Countdown timer
  useEffect(() => {
    if (otpExpiresIn > 0) {
      const timer = setTimeout(() => setOtpExpiresIn(otpExpiresIn - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpExpiresIn]);

  // Send forgot password OTP
  const sendOtpMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setStep('otp');
        setOtpExpiresIn(data.expiresIn || 300);
        if (data.devOtp) {
          setDevOtp(data.devOtp);
        }
        toast({
          title: "Reset Code Sent",
          description: data.emailSent 
            ? "We've sent a reset code to your email." 
            : "Enter the reset code to continue.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed",
        description: error.message || "Could not process request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Verify OTP
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { email: string; code: string; purpose: string }) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setStep('newPassword');
        toast({
          title: "Code Verified",
          description: "Now enter your new password.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid Code",
        description: error.message || "The code is invalid or has expired.",
        variant: "destructive",
      });
    },
  });

  // Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { email: string; otpCode: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setStep('success');
        toast({
          title: "Password Reset",
          description: "Your password has been updated successfully.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Could not reset password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const passwordRequirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "Contains a number", met: /\d/.test(newPassword) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(newPassword) },
  ];

  const allRequirementsMet = passwordRequirements.every(req => req.met);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    sendOtpMutation.mutate({ email });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }
    verifyOtpMutation.mutate({ email, code: otpCode, purpose: 'forgot_password' });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRequirementsMet) {
      toast({
        title: "Password Too Weak",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive",
      });
      return;
    }
    if (!passwordsMatch) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate({ email, otpCode, newPassword });
  };

  const handleResendOtp = () => {
    setOtpCode("");
    setDevOtp(null);
    sendOtpMutation.mutate({ email });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              {branding.logoUrl ? (
                <div className="h-16 w-16 overflow-hidden rounded-lg">
                  <img 
                    src={branding.logoUrl} 
                    alt={branding.storeName} 
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-2xl">
                  {branding.storeName.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
            <h1 className="text-3xl font-bold" data-testid="text-forgot-password-title">
              Reset Password
            </h1>
            <p className="text-muted-foreground mt-2">
              {step === 'email' && "Enter your email to receive a reset code"}
              {step === 'otp' && "Enter the verification code sent to your email"}
              {step === 'newPassword' && "Create your new password"}
              {step === 'success' && "Your password has been updated"}
            </p>
          </div>

          {step === 'email' && (
            <Card className="mb-6">
              <CardHeader className="text-center">
                <CardTitle>Forgot Password?</CardTitle>
                <CardDescription>
                  We'll send you a code to reset your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={sendOtpMutation.isPending}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <Button 
                    type="submit"
                    size="lg" 
                    className="w-full"
                    disabled={sendOtpMutation.isPending || !email}
                    data-testid="button-send-code"
                  >
                    {sendOtpMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-2" />
                        Send Reset Code
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <Link 
                      href="/login" 
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      data-testid="link-back-login"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'otp' && (
            <Card className="mb-6">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5" />
                  Enter Reset Code
                </CardTitle>
                <CardDescription>
                  We've sent a 6-digit code to <strong>{email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(value) => setOtpCode(value)}
                      disabled={verifyOtpMutation.isPending}
                      data-testid="input-otp"
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

                    {devOtp && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                        Dev mode: <code className="font-mono font-bold">{devOtp}</code>
                      </div>
                    )}

                    {otpExpiresIn > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Code expires in <span className="font-mono font-medium">{formatTime(otpExpiresIn)}</span>
                      </p>
                    )}

                    {otpExpiresIn === 0 && (
                      <p className="text-sm text-destructive">Code has expired</p>
                    )}
                  </div>

                  <Button 
                    type="submit"
                    size="lg" 
                    className="w-full"
                    disabled={verifyOtpMutation.isPending || otpCode.length !== 6}
                    data-testid="button-verify-code"
                  >
                    {verifyOtpMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Verify Code
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStep('email');
                        setOtpCode("");
                        setDevOtp(null);
                      }}
                      disabled={verifyOtpMutation.isPending}
                      data-testid="button-back"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResendOtp}
                      disabled={sendOtpMutation.isPending || verifyOtpMutation.isPending}
                      data-testid="button-resend-otp"
                    >
                      {sendOtpMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      Resend Code
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'newPassword' && (
            <Card className="mb-6">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  Create New Password
                </CardTitle>
                <CardDescription>
                  Enter a strong new password for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={resetPasswordMutation.isPending}
                        required
                        data-testid="input-new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {newPassword.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {passwordRequirements.map((req, index) => (
                          <div 
                            key={index} 
                            className={`flex items-center gap-2 text-xs ${req.met ? 'text-green-600' : 'text-muted-foreground'}`}
                          >
                            <Check className={`h-3 w-3 ${req.met ? 'opacity-100' : 'opacity-30'}`} />
                            {req.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={resetPasswordMutation.isPending}
                      required
                      data-testid="input-confirm-password"
                    />
                    {confirmPassword.length > 0 && (
                      <div className={`flex items-center gap-2 text-xs ${passwordsMatch ? 'text-green-600' : 'text-destructive'}`}>
                        <Check className={`h-3 w-3 ${passwordsMatch ? 'opacity-100' : 'opacity-30'}`} />
                        {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                      </div>
                    )}
                  </div>
                  <Button 
                    type="submit"
                    size="lg" 
                    className="w-full"
                    disabled={resetPasswordMutation.isPending || !allRequirementsMet || !passwordsMatch}
                    data-testid="button-reset-password"
                  >
                    {resetPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-5 h-5 mr-2" />
                        Reset Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'success' && (
            <Card className="mb-6">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <CardTitle>Password Reset Successfully</CardTitle>
                <CardDescription>
                  Your password has been updated. You can now sign in with your new password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button size="lg" className="w-full" data-testid="button-goto-login">
                    Sign In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="link-back-home">
                Back to Store
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
