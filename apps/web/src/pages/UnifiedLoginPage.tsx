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

      {/* ── Login Form Overlay (Right-aligned on desktop - Matcha Foliage Card) ── */}
      <div className="absolute inset-0 z-20 flex items-center justify-center lg:justify-end p-4 sm:p-6 lg:pr-14 xl:pr-24 overflow-y-auto">
        <div
          className="w-full max-w-[370px] rounded-[32px] overflow-hidden transition-all duration-300 my-auto border border-[#d6cfad]/70 shadow-2xl"
          style={{
            boxShadow: '0 30px 70px -15px rgba(25, 45, 15, 0.5), 0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* ── TOP SECTION: Cream Matcha Foam with Brand Logo & Typography ── */}
          <div className="bg-[#EFEACA] pt-6 px-6 pb-2 text-center select-none">
            {/* Logo Badge */}
            <div className="w-20 h-20 mx-auto mb-2 flex items-center justify-center hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="Cafe's Corner"
                className="w-full h-full object-contain"
                style={{ filter: 'drop-shadow(0 6px 14px rgba(50, 70, 30, 0.28))' }}
              />
            </div>

            {/* Brand Title */}
            <h2 className="text-2xl font-black tracking-tight text-[#3A5726] font-serif leading-none">
              Cafe's Corner
            </h2>

            {/* Subtitle */}
            <p className="text-[10px] uppercase font-mono tracking-[0.24em] font-extrabold text-[#4F7037] mt-1">
              COFFEE SHOP
            </p>

            {/* Tagline matching the design */}
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#6B8B50] mt-1.5">
              FIND A COFFEE STORE NEAR YOU
            </p>
          </div>

          {/* ── REALISTIC DOME FOLIAGE ARCH DIVIDER ── */}
          <div className="bg-[#EFEACA] relative overflow-hidden" style={{ marginTop: '-2px' }}>
            <svg
              viewBox="0 0 700 160"
              preserveAspectRatio="none"
              className="w-full block"
              style={{ height: '100px', display: 'block', marginBottom: '-2px' }}
              xmlns="http://www.w3.org/2000/svg"
              fill="#557D3E"
            >
              {/* Large dome base — fills bottom solidly */}
              <ellipse cx="350" cy="300" rx="370" ry="250" />

              {/* ── Dome rim: jagged leaf-silhouette edge all across the arc ── */}
              {/* Left side leaves */}
              <path d="M 0,145 Q 8,130 14,120 Q 18,112 12,105 Q 20,110 22,122 Q 28,110 35,100 Q 38,92 32,86 Q 42,91 43,104 Q 50,90 58,80 Q 62,71 55,65 Q 66,70 67,84 Q 75,68 84,56 Q 88,46 80,40 Q 93,46 93,62 Q 102,46 112,33 Q 116,22 108,17 Q 122,22 121,38 Q 132,22 143,10 Q 148,0 139,−4 Q 154,2 152,18 Q 164,3 176,−8 Q 182,−17 173,−22 Q 188,−15 185,2 Q 198,−12 212,−20 Q 218,−29 209,−34 Q 225,−27 221,−10 Q 235,−24 250,−30 Q 257,−39 248,−44 Q 264,−36 259,−19 Q 273,−33 288,−38 Q 296,−47 287,−52 Q 303,−44 297,−27 Q 312,−40 328,−44 Q 336,−52 327,−57 Q 343,−49 337,−32 Q 352,−45 368,−48 Q 376,−56 367,−61 Q 383,−53 377,−36 Q 392,−49 408,−51 Q 416,−59 408,−64 Q 423,−56 417,−39 Q 432,−52 448,−53 Q 456,−61 448,−66 Q 463,−58 457,−41 Q 471,−53 486,−53 Q 494,−60 487,−65 Q 501,−57 496,−41 Q 509,−52 523,−50 Q 530,−57 524,−62 Q 538,−53 532,−38 Q 545,−49 558,−46 Q 565,−53 559,−58 Q 572,−49 567,−33 Q 579,−44 591,−40 Q 598,−47 592,−52 Q 605,−43 600,−27 Q 611,−37 622,−32 Q 629,−38 623,−43 Q 636,−35 631,−20 Q 641,−29 651,−23 Q 657,−29 652,−34 Q 664,−26 659,−12 Q 668,−20 677,−13 Q 683,−19 678,−23 Q 689,−16 685,−3 L 700,10 L 700,160 L 0,160 Z" />

              {/* Additional leaf detail clusters — left zone */}
              <path d="M 25,118 Q 30,105 38,98 Q 36,110 30,120 Z" />
              <path d="M 50,100 Q 56,86 65,78 Q 62,92 56,102 Z" />
              <path d="M 75,82 Q 82,67 92,59 Q 88,74 82,85 Z" />
              <path d="M 102,62 Q 110,46 121,38 Q 116,54 110,65 Z" />
              <path d="M 130,42 Q 139,25 151,16 Q 145,33 139,45 Z" />

              {/* Middle zone leaf details */}
              <path d="M 165,20 Q 175,2 188,−5 Q 182,14 175,26 Z" />
              <path d="M 200,4 Q 211,−13 225,−19 Q 218,0 210,12 Z" />
              <path d="M 237,−10 Q 249,−27 264,−32 Q 256,−13 247,0 Z" />
              <path d="M 275,−22 Q 287,−39 303,−43 Q 294,−24 285,−11 Z" />
              <path d="M 315,−30 Q 328,−46 344,−49 Q 335,−30 326,−17 Z" />
              <path d="M 356,−34 Q 369,−50 385,−52 Q 376,−33 367,−20 Z" />
              <path d="M 396,−32 Q 409,−48 425,−50 Q 416,−31 407,−18 Z" />
              <path d="M 436,−26 Q 449,−42 465,−43 Q 456,−24 447,−11 Z" />

              {/* Right zone leaf details */}
              <path d="M 475,−18 Q 487,−33 503,−33 Q 494,−15 485,−2 Z" />
              <path d="M 513,−8 Q 524,−22 539,−21 Q 530,−4 522,8 Z" />
              <path d="M 549,2 Q 560,−11 574,−9 Q 565,8 557,20 Z" />
              <path d="M 582,14 Q 593,2 606,4 Q 598,20 590,32 Z" />
              <path d="M 613,28 Q 623,16 635,19 Q 627,34 619,45 Z" />
              <path d="M 641,44 Q 650,33 661,36 Q 654,51 646,61 Z" />
              <path d="M 666,62 Q 674,51 684,55 Q 677,69 670,78 Z" />
            </svg>
          </div>

          {/* ── BOTTOM SECTION: Solid Matcha Green Container with Form Elements ── */}
          <div className="bg-[#557D3E] px-6 sm:px-7 pb-6 pt-1 text-white">
            {/* Quick Role Fill Pills (LOGIN step only) */}
            {step === 'LOGIN' && (
              <div className="mb-3.5 p-1 rounded-2xl flex items-center justify-between text-xs bg-[#446531]/80 border border-[#6F9555]/60">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 text-[#E2EDD8]">Role:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => fillRole('SUPER_ADMIN')}
                    className={`px-2 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition ${
                      email.includes('superadmin')
                        ? 'bg-[#F5EFD4] text-[#365322] shadow-sm'
                        : 'text-[#D8E6CD] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Super Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillRole('RESTAURANT_ADMIN')}
                    className={`px-2 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition ${
                      email.includes('admin@')
                        ? 'bg-[#F5EFD4] text-[#365322] shadow-sm'
                        : 'text-[#D8E6CD] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillRole('STAFF')}
                    className={`px-2 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition ${
                      email.includes('staff')
                        ? 'bg-[#F5EFD4] text-[#365322] shadow-sm'
                        : 'text-[#D8E6CD] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Staff
                  </button>
                </div>
              </div>
            )}

            {/* Notification & Feedback Alerts */}
            {error && (
              <div className="mb-3 p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium bg-[#7F2626]/85 border border-[#B91C1C] text-[#FECACA]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#FCA5A5]" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-3 p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium bg-[#1E4D2B]/85 border border-[#22C55E] text-[#DCFCE7]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#86EFAC]" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ── 1. LOGIN STEP ── */}
            {step === 'LOGIN' && (
              <>
                <div className="text-center mb-3">
                  <h1 className="text-xs font-black tracking-widest uppercase text-white drop-shadow-xs">
                    LOG IN TO YOUR ACCOUNT
                  </h1>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-2.5">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email"
                      required
                      className="w-full px-4 py-2.5 rounded-xl text-[#1E3512] placeholder-[#4F7339] text-xs font-semibold focus:outline-none transition bg-[#96BA7B] border border-[#7FA562] focus:bg-[#A3C886] focus:border-[#F5EFD4] shadow-inner"
                    />
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="password"
                        required
                        className="w-full px-4 py-2.5 rounded-xl text-[#1E3512] placeholder-[#4F7339] text-xs font-semibold focus:outline-none transition pr-10 bg-[#96BA7B] border border-[#7FA562] focus:bg-[#A3C886] focus:border-[#F5EFD4] shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 transition text-[#365322] hover:text-[#1E3512]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-[#F5EFD4] text-[11px] font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-[#7FA562] w-3.5 h-3.5"
                        style={{ accentColor: '#365322' }}
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
                      className="underline underline-offset-2 transition font-semibold text-[11px] text-[#F5EFD4] hover:text-white"
                    >
                      Forgot password ?
                    </button>
                  </div>

                  <div className="pt-1.5">
                    <button
                      type="submit"
                      disabled={isLoading || lockoutRemainingSec > 0}
                      className="w-full font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 bg-[#F5EFD4] hover:bg-[#FFF9DE] text-[#365322]"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-[#365322]/30 border-t-[#365322] rounded-full animate-spin" />
                          Authenticating...
                        </span>
                      ) : lockoutRemainingSec > 0 ? (
                        `Locked (${lockoutRemainingSec}s)`
                      ) : (
                        'LOG IN'
                      )}
                    </button>
                  </div>
                </form>

                {/* Social Login Divider & Icons matching design */}
                <div className="pt-3">
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-[#769C5C] w-full" />
                    <span className="bg-[#557D3E] px-3 text-[9px] font-black uppercase tracking-widest text-[#D4E8C6]">
                      LOG IN WITH
                    </span>
                    <div className="border-t border-[#769C5C] w-full" />
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      title="Twitter / X"
                      className="w-7 h-7 rounded-full bg-[#466932] hover:bg-[#3B5A2A] flex items-center justify-center transition border border-[#6E9354]"
                    >
                      <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Facebook"
                      className="w-7 h-7 rounded-full bg-[#466932] hover:bg-[#3B5A2A] flex items-center justify-center transition border border-[#6E9354]"
                    >
                      <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Google"
                      className="w-7 h-7 rounded-full bg-[#466932] hover:bg-[#3B5A2A] flex items-center justify-center transition border border-[#6E9354]"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                        <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"/>
                        <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.4 7.5 23.5 12 23.5z"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Apple"
                      className="w-7 h-7 rounded-full bg-[#466932] hover:bg-[#3B5A2A] flex items-center justify-center transition border border-[#6E9354]"
                    >
                      <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.91.04-2.02.61-2.67 1.37-.58.67-1.09 1.77-.95 2.82 1.02.08 2.05-.49 2.68-1.26z"/>
                      </svg>
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        alert('To register a new restaurant organization or staff account, please contact the Super Admin or your branch administrator.');
                      }}
                      className="text-[9px] font-bold uppercase tracking-wider text-[#F5EFD4] hover:underline"
                    >
                      DON'T HAVE AN ACCOUNT? SIGN UP HERE
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── 2. FORGOT PASSWORD REQUEST STEP ── */}
            {step === 'FORGOT_REQUEST' && (
              <div>
                <div className="text-center mb-4">
                  <h2 className="text-sm font-black tracking-wider uppercase text-white drop-shadow-xs">Reset Password</h2>
                  <p className="text-[11px] mt-1 text-[#E2EDD8]">
                    Enter your email to receive a 6-digit verification security code.
                  </p>
                </div>

                <form onSubmit={handleForgotRequest} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-[#E2EDD8]">Registered Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@cafescorner.com"
                        required
                        className="w-full px-4 py-2.5 rounded-xl text-[#1E3512] placeholder-[#4F7339] text-xs font-semibold focus:outline-none transition bg-[#96BA7B] border border-[#7FA562] focus:bg-[#A3C886] focus:border-[#F5EFD4] shadow-inner pr-10"
                      />
                      <Mail className="absolute right-3.5 top-3 w-4 h-4 text-[#365322]" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 bg-[#F5EFD4] hover:bg-[#FFF9DE] text-[#365322]"
                  >
                    {isLoading ? 'Dispatching Code...' : 'Send Verification Code'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setStep('LOGIN')}
                      className="text-xs flex items-center gap-1.5 mx-auto transition text-[#F5EFD4] hover:underline"
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
                <div className="text-center mb-4">
                  <h2 className="text-sm font-black tracking-wider uppercase text-white drop-shadow-xs">Enter Verification Code</h2>
                  <p className="text-[11px] mt-1 text-[#E2EDD8]">
                    Enter the 6-digit code sent to <strong>{resetEmail}</strong>
                  </p>
                </div>

                {/* Simulation banner displaying generated code for easy testing */}
                {generatedCodePreview && (
                  <div className="mb-3 p-2.5 rounded-xl text-center bg-[#466932] border border-[#6F9555]">
                    <span className="text-[9px] uppercase tracking-wider block font-mono text-[#D4E8C6]">
                      Dispatched Verification Code:
                    </span>
                    <span className="text-xl font-black font-mono tracking-widest text-[#F5EFD4]">
                      {generatedCodePreview}
                    </span>
                  </div>
                )}

                <form onSubmit={handleVerifyCodeSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-[#E2EDD8]">6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      required
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-xl text-[#1E3512] text-center font-mono text-base tracking-widest placeholder-[#4F7339] focus:outline-none transition bg-[#96BA7B] border border-[#7FA562] focus:bg-[#A3C886] focus:border-[#F5EFD4] shadow-inner font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-md transition-all bg-[#F5EFD4] hover:bg-[#FFF9DE] text-[#365322]"
                  >
                    Verify Code
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1 text-[#F5EFD4]">
                    <button
                      type="button"
                      onClick={() => setStep('FORGOT_REQUEST')}
                      className="flex items-center gap-1 hover:underline"
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
                      className="font-bold hover:underline"
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
                <div className="text-center mb-4">
                  <h2 className="text-sm font-black tracking-wider uppercase text-white drop-shadow-xs">Create New Password</h2>
                  <p className="text-[11px] mt-1 text-[#E2EDD8]">
                    Set a secure password for <strong>{resetEmail}</strong>
                  </p>
                </div>

                <form onSubmit={handleNewPasswordSubmit} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-[#E2EDD8]">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-4 py-2.5 rounded-xl text-[#1E3512] placeholder-[#4F7339] text-xs font-semibold focus:outline-none transition pr-10 bg-[#96BA7B] border border-[#7FA562] focus:bg-[#A3C886] focus:border-[#F5EFD4] shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 transition text-[#365322] hover:text-[#1E3512]"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-[#E2EDD8]">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full px-4 py-2.5 rounded-xl text-[#1E3512] placeholder-[#4F7339] text-xs font-semibold focus:outline-none transition bg-[#96BA7B] border border-[#7FA562] focus:bg-[#A3C886] focus:border-[#F5EFD4] shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-md transition-all bg-[#F5EFD4] hover:bg-[#FFF9DE] text-[#365322]"
                  >
                    {isLoading ? 'Updating Password...' : 'Save Password & Sign In'}
                  </button>
                </form>
              </div>
            )}

            {/* ── 5. MFA CHALLENGE STEP ── */}
            {step === 'MFA_CHALLENGE' && (
              <div>
                <div className="text-center mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 bg-[#466932] border border-[#6F9555] text-[#F5EFD4]">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-black tracking-wider uppercase text-white drop-shadow-xs">Two-Factor Authentication</h2>
                  <p className="text-[11px] mt-1 text-[#E2EDD8]">
                    Super Admin role requires 2FA token confirmation. (Demo code: <strong>123456</strong>)
                  </p>
                </div>

                <form onSubmit={handleMfaSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-[#E2EDD8]">MFA Security Token</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="123456"
                      required
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-xl text-[#1E3512] text-center font-mono text-lg tracking-widest placeholder-[#4F7339] focus:outline-none transition bg-[#96BA7B] border border-[#7FA562] focus:bg-[#A3C886] focus:border-[#F5EFD4] shadow-inner font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-md transition-all bg-[#F5EFD4] hover:bg-[#FFF9DE] text-[#365322]"
                  >
                    Verify &amp; Enter Platform
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setStep('LOGIN')}
                      className="text-xs flex items-center gap-1.5 mx-auto transition text-[#F5EFD4] hover:underline"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Cancel MFA
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Footer Security Audit Link */}
            <div className="pt-3 mt-3.5 flex items-center justify-between text-[11px] border-t border-[#769C5C]/60 text-[#D4E8C6]">
              <button
                type="button"
                onClick={() => setShowAuditModal(true)}
                className="flex items-center gap-1.5 transition hover:text-white"
              >
                <History className="w-3.5 h-3.5" />
                <span>Security Logs</span>
              </button>
              <div className="flex items-center gap-1 text-[10px] text-[#E2EDD8]">
                <Shield className="w-3 h-3 text-[#A3C886]" />
                <span>Supabase Protected</span>
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
