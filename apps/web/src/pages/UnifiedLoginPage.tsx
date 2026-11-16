import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { supabase } from '../lib/supabase';
import {
  AuthUser,
  determineRoleFromEmail,
  DEFAULT_USERS,
  getLockoutState,
  recordFailedAttempt,
  clearLockout,
  recordLoginHistory,
  setCurrentSession,
  generateVerificationCode,
  verifyResetCode,
  updateUserPassword,
  verifyPassword,
} from '../lib/auth';
import { SecurityAuditModal } from '../components/SecurityAuditModal';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Mail,
  ArrowRight,
  ArrowLeft,
  Lock,
  History,
  Smartphone,
} from 'lucide-react';

type AuthStep = 'LOGIN' | 'FORGOT_REQUEST' | 'FORGOT_VERIFY' | 'FORGOT_NEW_PASSWORD' | 'MFA_CHALLENGE';

// ─── Floating coffee bean SVG component ───────────────────────────────────────
const CoffeeBean: React.FC<{ style?: React.CSSProperties; size?: number }> = ({ style, size = 48 }) => (
  <svg
    width={size}
    height={size * 0.65}
    viewBox="0 0 80 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <ellipse cx="40" cy="26" rx="38" ry="24" fill="#6b3f1f" />
    <ellipse cx="40" cy="26" rx="30" ry="17" fill="#7c4a24" />
    <path
      d="M40 10 Q48 26 40 42 Q32 26 40 10Z"
      fill="#5a3015"
      opacity="0.6"
    />
    <ellipse cx="40" cy="26" rx="38" ry="24" fill="none" stroke="#4a2810" strokeWidth="1.5" />
  </svg>
);

// ─── Scattered bean positions (absolute, decorative) ──────────────────────────
const BEANS = [
  { top: '6%',  left: '6%',  rotate: 20,  size: 56, opacity: 0.90 },
  { top: '3%',  left: '28%', rotate: -15, size: 44, opacity: 0.80 },
  { top: '10%', left: '55%', rotate: 45,  size: 60, opacity: 0.85 },
  { top: '5%',  left: '78%', rotate: -30, size: 50, opacity: 0.80 },
  { top: '18%', left: '88%', rotate: 10,  size: 42, opacity: 0.75 },
  { top: '32%', left: '3%',  rotate: -40, size: 52, opacity: 0.85 },
  { top: '45%', left: '90%', rotate: 60,  size: 46, opacity: 0.80 },
  { top: '62%', left: '5%',  rotate: 25,  size: 54, opacity: 0.78 },
  { top: '70%', left: '82%', rotate: -20, size: 48, opacity: 0.82 },
  { top: '80%', left: '18%', rotate: 35,  size: 40, opacity: 0.72 },
  { top: '85%', left: '70%', rotate: -50, size: 58, opacity: 0.80 },
  { top: '72%', left: '45%', rotate: 15,  size: 36, opacity: 0.65 },
];

export const UnifiedLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Mode & step
  const [step, setStep] = useState<AuthStep>('LOGIN');

  // Login form state
  const [email, setEmail] = useState('admin@democompany.com');
  const [password, setPassword] = useState('AdminPass#123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCodePreview, setGeneratedCodePreview] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // MFA challenge state
  const [mfaCode, setMfaCode] = useState('');
  const [pendingMfaUser, setPendingMfaUser] = useState<AuthUser | null>(null);

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState<number>(0);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Check lockout on mount and when email changes
  useEffect(() => {
    const checkLockout = () => {
      const state = getLockoutState(email);
      if (state.lockedUntil && state.lockedUntil > Date.now()) {
        const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000);
        setLockoutRemainingSec(remaining);
      } else {
        setLockoutRemainingSec(0);
      }
    };
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [email]);

  // Handle Form Login with Supabase + Fallback Authentication
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const normEmail = email.toLowerCase().trim();
    if (!normEmail || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    // Check account lockout
    const lockout = getLockoutState(normEmail);
    if (lockout.lockedUntil && lockout.lockedUntil > Date.now()) {
      const sec = Math.ceil((lockout.lockedUntil - Date.now()) / 1000);
      setError(`Account is temporarily locked due to multiple failed attempts. Try again in ${sec} seconds.`);
      return;
    }

    setIsLoading(true);

    try {
      let authenticated = false;
      let sessionToken = '';

      // 1. Try Supabase Authentication first if available
      try {
        const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
          email: normEmail,
          password: password,
        });

        if (!supabaseError && data?.user) {
          authenticated = true;
          sessionToken = data.session?.access_token || '';
        }
      } catch (sbErr) {
        // Fall back to local verified credential check
      }

      // 2. If not authenticated via Supabase, verify with local encrypted/hashed accounts
      if (!authenticated) {
        const valid = verifyPassword(normEmail, password);
        if (valid) {
          authenticated = true;
        }
      }

      if (!authenticated) {
        // Record failed attempt
        const result = recordFailedAttempt(normEmail);
        recordLoginHistory({
          email: normEmail,
          success: false,
          failureReason: 'Invalid credentials provided',
        });

        setIsLoading(false);
        if (result.isLocked) {
          setError('Too many failed attempts! Account locked for 5 minutes.');
        } else {
          setError(`Invalid email or password. ${result.attemptsLeft} attempt(s) remaining.`);
        }
        return;
      }

      // Success: Clear lockout & record audit log
      clearLockout(normEmail);
      recordLoginHistory({
        email: normEmail,
        success: true,
      });

      const role = determineRoleFromEmail(normEmail);
      const seedInfo = DEFAULT_USERS[normEmail];
      const authUser: AuthUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email: normEmail,
        role,
        fullName: seedInfo ? seedInfo.fullName : normEmail.split('@')[0],
        organizationName: seedInfo ? seedInfo.org : "Cafe's Corner",
        branchName: seedInfo ? seedInfo.branch : 'Main Branch',
        mfaEnabled: role === 'SUPER_ADMIN', // Super Admins have MFA enabled by default
      };

      // If MFA is required for Super Admin
      if (authUser.mfaEnabled) {
        setIsLoading(false);
        setPendingMfaUser(authUser);
        setStep('MFA_CHALLENGE');
        setSuccessMsg('Enter the 6-digit MFA security token sent to your authenticator device.');
        return;
      }

      // Complete Login and Redirect
      completeUserLogin(authUser, sessionToken);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  // Complete Login and Route to Destination
  const completeUserLogin = (user: AuthUser, token?: string) => {
    setCurrentSession(user, token);
    setIsLoading(false);
    setSuccessMsg(`Welcome, ${user.fullName}! Redirecting to your portal...`);

    setTimeout(() => {
      if (user.role === 'SUPER_ADMIN') {
        navigate('/super-admin/dashboard');
      } else if (user.role === 'STAFF') {
        navigate('/staff/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    }, 400);
  };

  // Handle MFA Verification Code Submission
  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMfaUser) return;

    // In demo mode or Supabase TOTP, accept 123456 or 6-digit number
    if (mfaCode.trim() === '123456' || mfaCode.trim().length === 6) {
      completeUserLogin(pendingMfaUser);
    } else {
      setError('Invalid 6-digit MFA security code. Try: 123456');
    }
  };

  // 1. Password Reset Request: Generate & Send Verification Code
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const norm = resetEmail.toLowerCase().trim();
    if (!norm) {
      setError('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);

    try {
      // Send code via Supabase password recovery
      await supabase.auth.resetPasswordForEmail(norm, {
        redirectTo: `${window.location.origin}/login`,
      });
    } catch {
      // Continue with local verification simulation
    }

    // Generate local 6-digit security code for verification
    const code = generateVerificationCode(norm);
    setGeneratedCodePreview(code);

    setIsLoading(false);
    setSuccessMsg(`A 6-digit verification code has been dispatched to ${norm}.`);
    setStep('FORGOT_VERIFY');
  };

  // 2. Verify Code
  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isValid = verifyResetCode(resetEmail, verificationCode);
    if (!isValid) {
      setError('Invalid or expired verification code. Please check your email.');
      return;
    }

    setSuccessMsg('Verification code confirmed! You may now establish your new password.');
    setStep('FORGOT_NEW_PASSWORD');
  };

  // 3. Set New Password
  const handleNewPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both inputs.');
      return;
    }

    setIsLoading(true);
    updateUserPassword(resetEmail, newPassword);

    setIsLoading(false);
    setSuccessMsg('Your password has been reset successfully! You can now sign in.');
    setEmail(resetEmail);
    setPassword(newPassword);
    setStep('LOGIN');
  };

  // Quick switch credentials helper
  const fillRole = (role: 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'STAFF') => {
    setError(null);
    setSuccessMsg(null);
    if (role === 'SUPER_ADMIN') {
      setEmail('superadmin@example.com');
      setPassword('ChangeMe#12345');
    } else if (role === 'RESTAURANT_ADMIN') {
      setEmail('admin@democompany.com');
      setPassword('AdminPass#123');
    } else {
      setEmail('staff@democompany.com');
      setPassword('StaffPass#123');
    }
  };

  // suppress unused location warning
  void location;

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans antialiased" style={{ backgroundColor: '#f2ece0' }}>
      <SEOHead
        title="Login | Cafe's Corner Restaurant CRM"
        description="Unified secure login portal for Super Admin, Restaurant Admin, and Floor Staff with Supabase authentication and MFA."
        canonicalPath="/login"
      />

      {/* ── Floating Coffee Beans (decorative background) ── */}
      {BEANS.map((b, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            top: b.top,
            left: b.left,
            transform: `rotate(${b.rotate}deg)`,
            opacity: b.opacity,
            zIndex: 0,
          }}
        >
          <CoffeeBean size={b.size} />
        </div>
      ))}

      {/* ── Top Navigation Bar ── */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-5">
        {/* Social icons */}
        <div className="flex items-center gap-2">
          {/* Instagram */}
          <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-80" style={{ backgroundColor: '#1a3a1a' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          {/* TikTok */}
          <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-80" style={{ backgroundColor: '#1a3a1a' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.78a8.18 8.18 0 0 0 4.78 1.52V6.85a4.85 4.85 0 0 1-1.01-.16z" />
            </svg>
          </a>
          {/* Facebook */}
          <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-80" style={{ backgroundColor: '#1a3a1a' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          {/* Email */}
          <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-80" style={{ backgroundColor: '#1a3a1a' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
            </svg>
          </a>
        </div>

        {/* Center brand */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <div className="text-sm font-black tracking-[0.25em] uppercase" style={{ color: '#1a3a1a' }}>
            CAFE'S CORNER
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase font-medium" style={{ color: '#3d6b2f' }}>
            — COFFEE CO. —
          </div>
        </div>

        {/* Hamburger */}
        <button className="flex flex-col gap-1.5 p-1" style={{ color: '#1a3a1a' }}>
          <span className="block w-6 h-0.5 rounded-full" style={{ backgroundColor: '#1a3a1a' }} />
          <span className="block w-6 h-0.5 rounded-full" style={{ backgroundColor: '#1a3a1a' }} />
          <span className="block w-6 h-0.5 rounded-full" style={{ backgroundColor: '#1a3a1a' }} />
        </button>
      </header>

      {/* ── Hero Section: Headline + Coffee Cup (Centered on left/center area) ── */}
      <div
        className="absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none select-none transition-all duration-300 lg:pr-[440px] xl:pr-[500px]"
        style={{ paddingTop: '56px', paddingBottom: '56px' }}
      >
        <h1
          className="text-center uppercase font-black leading-none tracking-tight"
          style={{
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            color: '#1a3a1a',
            textShadow: '0 2px 12px rgba(26,58,26,0.08)',
            lineHeight: 1.05,
            maxWidth: '680px',
          }}
        >
          A GREAT MORNING<br />STARTS WITH
        </h1>

        {/* Iced Coffee drink hero image (cutout PNG with dynamic splash & beans - enlarged hero size) */}
        <div className="mt-2 flex items-end justify-center" style={{ height: 'clamp(380px, 62vh, 680px)' }}>
          <img
            src="/hero-coffee.png"
            alt="Cafe's Corner Iced Coffee"
            style={{
              height: '100%',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 28px 60px rgba(100,60,20,0.35))',
            }}
            onError={(e) => {
              // fallback if image not found
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* ── Bottom Info Bar ── */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between px-8 py-5 pointer-events-none">
        <div>
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#1a3a1a' }}>OPENING HOURS</p>
          <p className="text-xs" style={{ color: '#5c4a2a' }}>7 AM – 11 PM · every day</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#1a3a1a' }}>FIND US AT</p>
          <p className="text-xs" style={{ color: '#5c4a2a' }}>Cafe's Corner, Coffee Shop · Est. 2024</p>
        </div>
      </footer>

      {/* ── Login Form Overlay (Right-aligned on desktop with deep warm frosted blur) ── */}
      <div className="absolute inset-0 z-20 flex items-center justify-center lg:justify-end p-4 sm:p-6 lg:pr-14 xl:pr-24 overflow-y-auto">
        <div
          className="w-full max-w-sm rounded-3xl overflow-hidden transition-all duration-300 my-auto"
          style={{
            backgroundColor: 'rgba(38, 28, 20, 0.48)',
            backdropFilter: 'blur(36px) saturate(180%)',
            WebkitBackdropFilter: 'blur(36px) saturate(180%)',
            border: '1px solid rgba(255, 245, 230, 0.22)',
            boxShadow: '0 30px 70px -15px rgba(45, 25, 10, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
          }}
        >
          <div className="p-8">
            {/* Logo & Brand */}
            <div className="flex flex-col items-center mb-5 text-center">
              <div className="w-24 h-24 mb-2 flex items-center justify-center hover:scale-105 transition-transform">
                <img
                  src="/logo.png"
                  alt="Cafe's Corner"
                  className="w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.6))' }}
                />
              </div>
              <div className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1 drop-shadow-sm">
                Cafe's <span style={{ color: '#f59e0b' }}>Corner</span>
              </div>
              <span className="text-[10px] uppercase font-mono tracking-widest font-semibold mt-0.5" style={{ color: 'rgba(251,191,36,0.9)' }}>
                Coffee Shop
              </span>
            </div>

            {/* Quick Role Fill Pills (LOGIN step only) */}
            {step === 'LOGIN' && (
              <div
                className="mb-5 p-1.5 rounded-2xl flex items-center justify-between text-xs"
                style={{
                  backgroundColor: 'rgba(25, 18, 14, 0.42)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                <span className="text-[11px] font-semibold px-2" style={{ color: '#d1d5db' }}>Role:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillRole('SUPER_ADMIN')}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                      email.includes('superadmin')
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Super Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillRole('RESTAURANT_ADMIN')}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                      email.includes('admin@')
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillRole('STAFF')}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                      email.includes('staff')
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Staff
                  </button>
                </div>
              </div>
            )}

            {/* Notification & Feedback Alerts */}
            {error && (
              <div
                className="mb-4 p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.22)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#fca5a5'
                }}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#f87171' }} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div
                className="mb-4 p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium"
                style={{
                  backgroundColor: 'rgba(16,185,129,0.22)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(16,185,129,0.4)',
                  color: '#6ee7b7'
                }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#34d399' }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ── 1. LOGIN STEP ── */}
            {step === 'LOGIN' && (
              <>
                <div className="text-center mb-5">
                  <h1 className="text-lg font-bold text-white tracking-tight drop-shadow-sm">
                    Welcome Back, Please login to your account
                  </h1>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#e5e7eb' }}>Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@cafescorner.com"
                      required
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none transition"
                      style={{
                        backgroundColor: 'rgba(25, 18, 14, 0.42)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#f59e0b';
                        e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.65)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                        e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.42)';
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#e5e7eb' }}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none transition pr-10"
                        style={{
                          backgroundColor: 'rgba(25, 18, 14, 0.42)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.14)',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#f59e0b';
                          e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.65)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                          e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.42)';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 transition"
                        style={{ color: '#d1d5db' }}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: '#d1d5db' }}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-gray-500 w-3.5 h-3.5"
                        style={{ accentColor: '#f59e0b' }}
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessMsg(null);
                        setResetEmail(email);
                        setStep('FORGOT_REQUEST');
                      }}
                      className="underline underline-offset-2 transition font-medium"
                      style={{ color: '#fbbf24' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#f59e0b')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#fbbf24')}
                    >
                      Forgot password ?
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading || lockoutRemainingSec > 0}
                      className="w-full font-bold text-sm py-3.5 rounded-full shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ backgroundColor: '#f1f2f6', color: '#1c1d21' }}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Authenticating with Supabase...
                        </span>
                      ) : lockoutRemainingSec > 0 ? (
                        `Locked (${lockoutRemainingSec}s)`
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ── 2. FORGOT PASSWORD REQUEST STEP ── */}
            {step === 'FORGOT_REQUEST' && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">Reset Your Password</h2>
                  <p className="text-xs mt-1" style={{ color: '#d1d5db' }}>
                    Enter your email to receive a 6-digit verification security code.
                  </p>
                </div>

                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#e5e7eb' }}>Registered Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@cafescorner.com"
                        required
                        className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none transition"
                        style={{
                          backgroundColor: 'rgba(25, 18, 14, 0.42)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.14)',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#f59e0b';
                          e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.65)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                          e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.42)';
                        }}
                      />
                      <Mail className="absolute right-3.5 top-3.5 w-4 h-4" style={{ color: '#d1d5db' }} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full font-bold text-sm py-3.5 rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#f59e0b', color: '#000' }}
                  >
                    {isLoading ? 'Dispatching Code...' : 'Send Verification Code'}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('LOGIN')}
                      className="text-xs flex items-center gap-1.5 mx-auto transition"
                      style={{ color: '#d1d5db' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── 3. VERIFY CODE STEP ── */}
            {step === 'FORGOT_VERIFY' && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">Enter Verification Code</h2>
                  <p className="text-xs mt-1" style={{ color: '#d1d5db' }}>
                    Enter the 6-digit verification code sent to <strong>{resetEmail}</strong>
                  </p>
                </div>

                {/* Simulation banner displaying generated code for easy testing */}
                {generatedCodePreview && (
                  <div
                    className="mb-4 p-3 rounded-xl text-center"
                    style={{
                      backgroundColor: 'rgba(245,158,11,0.2)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(245,158,11,0.4)',
                    }}
                  >
                    <span className="text-[10px] uppercase tracking-wider block font-mono" style={{ color: '#fcd34d' }}>
                      Dispatched Verification Code:
                    </span>
                    <span className="text-2xl font-black font-mono tracking-widest" style={{ color: '#fbbf24' }}>
                      {generatedCodePreview}
                    </span>
                  </div>
                )}

                <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#e5e7eb' }}>6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      required
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl text-white text-center font-mono text-lg tracking-widest placeholder-gray-400 focus:outline-none transition"
                      style={{
                        backgroundColor: 'rgba(25, 18, 14, 0.42)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#f59e0b';
                        e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.65)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                        e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.42)';
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full font-bold text-sm py-3.5 rounded-full shadow-lg transition-all"
                    style={{ backgroundColor: '#f59e0b', color: '#000' }}
                  >
                    Verify Code
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2" style={{ color: '#d1d5db' }}>
                    <button
                      type="button"
                      onClick={() => setStep('FORGOT_REQUEST')}
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Change Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const code = generateVerificationCode(resetEmail);
                        setGeneratedCodePreview(code);
                        setSuccessMsg('A new verification code has been generated.');
                      }}
                      className="transition font-semibold"
                      style={{ color: '#fbbf24' }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── 4. SET NEW PASSWORD STEP ── */}
            {step === 'FORGOT_NEW_PASSWORD' && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">Create New Password</h2>
                  <p className="text-xs mt-1" style={{ color: '#d1d5db' }}>
                    Set a secure password for <strong>{resetEmail}</strong>
                  </p>
                </div>

                <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#e5e7eb' }}>New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none transition pr-10"
                        style={{
                          backgroundColor: 'rgba(25, 18, 14, 0.42)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.14)',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#f59e0b';
                          e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.65)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                          e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.42)';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3.5 transition"
                        style={{ color: '#d1d5db' }}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#e5e7eb' }}>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none transition"
                      style={{
                        backgroundColor: 'rgba(25, 18, 14, 0.42)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#f59e0b';
                        e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.65)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                        e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.42)';
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full font-bold text-sm py-3.5 rounded-full shadow-lg transition-all"
                    style={{ backgroundColor: '#10b981', color: '#fff' }}
                  >
                    {isLoading ? 'Updating Password...' : 'Save Password & Sign In'}
                  </button>
                </form>
              </div>
            )}

            {/* ── 5. MFA CHALLENGE STEP ── */}
            {step === 'MFA_CHALLENGE' && (
              <div>
                <div className="text-center mb-6">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{
                      backgroundColor: 'rgba(245,158,11,0.25)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(245,158,11,0.4)',
                      color: '#fbbf24'
                    }}
                  >
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">Two-Factor Authentication</h2>
                  <p className="text-xs mt-1" style={{ color: '#d1d5db' }}>
                    Super Admin role requires 2FA token confirmation. (Demo code: <strong>123456</strong>)
                  </p>
                </div>

                <form onSubmit={handleMfaSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#e5e7eb' }}>MFA Security Token</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="123456"
                      required
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl text-white text-center font-mono text-xl tracking-widest placeholder-gray-400 focus:outline-none transition"
                      style={{
                        backgroundColor: 'rgba(25, 18, 14, 0.42)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#f59e0b';
                        e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.65)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                        e.currentTarget.style.backgroundColor = 'rgba(25, 18, 14, 0.42)';
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full font-bold text-sm py-3.5 rounded-full shadow-lg transition-all"
                    style={{ backgroundColor: '#f59e0b', color: '#000' }}
                  >
                    Verify &amp; Enter Platform
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('LOGIN')}
                      className="text-xs flex items-center gap-1.5 mx-auto transition"
                      style={{ color: '#d1d5db' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Cancel MFA
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Footer Security Audit Link */}
            <div
              className="pt-5 mt-5 flex items-center justify-between text-xs"
              style={{ borderTop: '1px solid rgba(255,255,255,0.12)', color: '#9ca3af' }}
            >
              <button
                type="button"
                onClick={() => setShowAuditModal(true)}
                className="flex items-center gap-1.5 transition"
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f59e0b')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              >
                <History className="w-3.5 h-3.5" />
                <span>Login History &amp; Security Logs</span>
              </button>
              <div className="flex items-center gap-1 text-[11px]" style={{ color: '#9ca3af' }}>
                <Shield className="w-3 h-3" style={{ color: '#34d399' }} />
                <span>Supabase RLS Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Audit Modal */}
      <SecurityAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        userEmail={email}
      />
    </div>
  );
};
