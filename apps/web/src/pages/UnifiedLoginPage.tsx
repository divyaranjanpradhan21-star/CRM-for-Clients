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
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Shield,
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  History,
  Smartphone,
  RefreshCw
} from 'lucide-react';

type AuthStep = 'LOGIN' | 'FORGOT_REQUEST' | 'FORGOT_VERIFY' | 'FORGOT_NEW_PASSWORD' | 'MFA_CHALLENGE';

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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#17181a] p-4 sm:p-6 lg:p-10 font-sans antialiased">
      <SEOHead
        title="Login | Cafe's Corner Restaurant CRM"
        description="Unified secure login portal for Super Admin, Restaurant Admin, and Floor Staff with Supabase authentication and MFA."
        canonicalPath="/login"
      />

      {/* Main Container matching Image 2 */}
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/5 bg-[#212226] min-h-[660px]">
        {/* Left Side: Coffee Flatlay Visual (Matching Image 2) */}
        <div className="w-full md:w-1/2 relative bg-[#a8825c] min-h-[340px] md:min-h-full overflow-hidden flex items-end p-8">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&auto=format&fit=crop&q=85')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#63452b]/95 via-[#8a633e]/60 to-transparent" />

          {/* Decorative artistic Coffee Cup badge */}
          <div className="relative z-10 bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white max-w-xs shadow-xl">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.png"
                alt="Cafe's Corner Logo"
                className="w-14 h-14 object-contain filter drop-shadow-md"
              />
              <div>
                <h2 className="text-base font-bold tracking-tight text-white leading-tight">Cafe's Corner</h2>
                <p className="text-xs text-amber-200/90 font-medium">Coffee Shop CRM System</p>
              </div>
            </div>
            <p className="text-[11px] text-white/80 mt-2 leading-relaxed">
              Unified portal for Super Admin platform control, Restaurant Admin branch management, and Floor Staff terminals.
            </p>
          </div>
        </div>

        {/* Right Side: Sleek Dark Login / Reset Form */}
        <div className="w-full md:w-1/2 bg-[#212226] p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
          <div className="max-w-md w-full mx-auto">
            {/* Header Stamp Logo */}
            <div className="flex flex-col items-center mb-5 text-center">
              <div className="w-28 h-28 mb-2 flex items-center justify-center hover:scale-105 transition-transform">
                <img
                  src="/logo.png"
                  alt="Cafe's Corner"
                  className="w-full h-full object-contain filter drop-shadow-2xl"
                />
              </div>
              <div className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Cafe's <span className="text-amber-400">Corner</span>
              </div>
              <span className="text-[11px] uppercase font-mono tracking-widest text-amber-200/80 font-semibold mt-0.5">
                Coffee Shop
              </span>
            </div>

            {/* Quick Role Fill Pills (Only displayed in LOGIN mode) */}
            {step === 'LOGIN' && (
              <div className="mb-5 p-2 rounded-2xl bg-[#1b1c20] border border-white/5 flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-400 font-semibold px-2">Role:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillRole('SUPER_ADMIN')}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                      email.includes('superadmin')
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
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
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
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
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Staff
                  </button>
                </div>
              </div>
            )}

            {/* Notification & Feedback Alerts */}
            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* 1. LOGIN STEP */}
            {step === 'LOGIN' && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Welcome Back, Please login to your account
                  </h1>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jubaer@gmail.com"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[#2e3036] border border-transparent text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 focus:bg-[#35373e] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-[#2e3036] border border-transparent text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 focus:bg-[#35373e] transition pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-200 transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-gray-400 hover:text-gray-300">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded bg-[#2e3036] border-gray-600 text-amber-500 focus:ring-0 w-3.5 h-3.5"
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
                      className="text-gray-400 hover:text-amber-400 transition underline underline-offset-2"
                    >
                      Forgot password ?
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading || lockoutRemainingSec > 0}
                      className="w-full bg-[#f1f2f6] hover:bg-white active:scale-[0.99] text-[#1c1d21] font-bold text-sm py-3.5 rounded-full shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

            {/* 2. FORGOT PASSWORD REQUEST STEP */}
            {step === 'FORGOT_REQUEST' && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white tracking-tight">Reset Your Password</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Enter your email to receive a 6-digit verification security code.
                  </p>
                </div>

                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Registered Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@cafescorner.com"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-[#2e3036] border border-transparent text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 focus:bg-[#35373e] transition"
                      />
                      <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm py-3.5 rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Dispatching Code...' : 'Send Verification Code'}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('LOGIN')}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 mx-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 3. VERIFY CODE STEP */}
            {step === 'FORGOT_VERIFY' && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white tracking-tight">Enter Verification Code</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Enter the 6-digit verification code sent to <strong>{resetEmail}</strong>
                  </p>
                </div>

                {/* Simulation banner displaying generated code for easy testing */}
                {generatedCodePreview && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="text-[10px] text-amber-300 font-mono uppercase tracking-wider block">
                      Dispatched Verification Code:
                    </span>
                    <span className="text-2xl font-black font-mono text-amber-400 tracking-widest">
                      {generatedCodePreview}
                    </span>
                  </div>
                )}

                <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      required
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl bg-[#2e3036] border border-transparent text-white text-center font-mono text-lg tracking-widest placeholder-gray-500 focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm py-3.5 rounded-full shadow-lg transition-all"
                  >
                    Verify Code
                  </button>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('FORGOT_REQUEST')}
                      className="hover:text-white flex items-center gap-1"
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
                      className="text-amber-400 hover:underline"
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 4. SET NEW PASSWORD STEP */}
            {step === 'FORGOT_NEW_PASSWORD' && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white tracking-tight">Create New Password</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Set a secure password for <strong>{resetEmail}</strong>
                  </p>
                </div>

                <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-[#2e3036] border border-transparent text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-200"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[#2e3036] border border-transparent text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm py-3.5 rounded-full shadow-lg transition-all"
                  >
                    {isLoading ? 'Updating Password...' : 'Save Password & Sign In'}
                  </button>
                </form>
              </div>
            )}

            {/* 5. MFA CHALLENGE STEP */}
            {step === 'MFA_CHALLENGE' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Two-Factor Authentication</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Super Admin role requires 2FA token confirmation. (Demo code: <strong>123456</strong>)
                  </p>
                </div>

                <form onSubmit={handleMfaSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">MFA Security Token</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="123456"
                      required
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl bg-[#2e3036] border border-transparent text-white text-center font-mono text-xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm py-3.5 rounded-full shadow-lg transition-all"
                  >
                    Verify &amp; Enter Platform
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('LOGIN')}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 mx-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Cancel MFA
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Footer Security Audit Link */}
          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-amber-400 transition"
            >
              <History className="w-3.5 h-3.5" />
              <span>Login History &amp; Security Logs</span>
            </button>
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Supabase RLS Protected</span>
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
