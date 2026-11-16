import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Eye, EyeOff, Coffee, Check, ShieldCheck, Sparkles } from 'lucide-react';

export const UnifiedLoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@democompany.com');
  const [password, setPassword] = useState('AdminPass#123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Login and route to respective dashboard
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const lowerEmail = email.toLowerCase().trim();

      if (lowerEmail.includes('superadmin') || lowerEmail.includes('super-admin')) {
        // Super Admin
        localStorage.setItem('portal_role', 'SUPER_ADMIN');
        localStorage.setItem('user_email', email);
        navigate('/super-admin/dashboard');
      } else if (lowerEmail.includes('staff')) {
        // Staff Member
        localStorage.setItem('portal_role', 'STAFF');
        localStorage.setItem('user_email', email);
        navigate('/staff/dashboard');
      } else {
        // Restaurant Admin (Default)
        localStorage.setItem('portal_role', 'RESTAURANT_ADMIN');
        localStorage.setItem('user_email', email);
        navigate('/admin/dashboard');
      }
    }, 600);
  };

  // Quick switch credentials helper for convenience
  const fillRole = (role: 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'STAFF') => {
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
        title="Login | Cafe & Restaurant CRM Portal"
        description="Single secure login portal for Super Admin, Restaurant Administrators, and Staff team members."
        canonicalPath="/login"
      />

      {/* Main Container matching Image 2 */}
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/5 bg-[#212226] min-h-[640px]">
        {/* Left Side: Coffee Flatlay Visual (Matching Image 2) */}
        <div className="w-full md:w-1/2 relative bg-[#a8825c] min-h-[340px] md:min-h-full overflow-hidden flex items-end p-8">
          {/* Coffee Photo Background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&auto=format&fit=crop&q=85')`,
            }}
          />

          {/* Warm overlay gradient for authentic kraft & coffee tone */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#63452b]/90 via-[#8a633e]/50 to-transparent" />

          {/* Decorative artistic Coffee Cup badge in bottom corner */}
          <div className="relative z-10 bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white max-w-xs shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#df7e26] flex items-center justify-center text-white shadow-md">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-white leading-tight">Cafe &amp; Restaurant CRM</h2>
                <p className="text-[11px] text-amber-200/90 font-medium">All-in-one unified portal</p>
              </div>
            </div>
            <p className="text-[11px] text-white/80 mt-2 leading-relaxed">
              One login handles Super Admin platform control, Restaurant Admin branch management, and Floor Staff terminals.
            </p>
          </div>
        </div>

        {/* Right Side: Sleek Dark Login Form (Matching Image 2) */}
        <div className="w-full md:w-1/2 bg-[#212226] p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
          <div className="max-w-md w-full mx-auto">
            {/* Logo matching Cafe Beans design */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#2e3036] border border-white/10 flex items-center justify-center text-white shadow-inner mb-2">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-3.5 h-1.5 border-t-2 border-r-2 border-amber-400 rounded-tr-full mb-0.5"></div>
                  <Coffee className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1">
                Cafe <span className="text-amber-400">Beans</span>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Welcome Back, Please login to your account
              </h1>
            </div>

            {/* Quick Role Fill Pills */}
            <div className="mb-6 p-2 rounded-2xl bg-[#1b1c20] border border-white/5 flex items-center justify-between text-xs">
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

            {/* Error Message if any */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Address */}
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

              {/* Password */}
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

              {/* Remember me & Forgot Password */}
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
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset link sent to your email.');
                  }}
                  className="text-gray-400 hover:text-amber-400 transition"
                >
                  Forgot password ?
                </a>
              </div>

              {/* Sign In Button (White pill button matching Image 2) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#f1f2f6] hover:bg-white active:scale-[0.99] text-[#1c1d21] font-bold text-sm py-3.5 rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>

              {/* Or Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="h-[1px] bg-white/10 flex-1" />
                <span className="text-[11px] text-gray-400 font-medium">Or</span>
                <div className="h-[1px] bg-white/10 flex-1" />
              </div>

              {/* Sign in with Google */}
              <button
                type="button"
                onClick={() => alert('Google Single Sign-On is configured for enterprise domains.')}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-gray-300 hover:text-white py-2 rounded-xl transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Sign in with google
              </button>
            </form>
          </div>

          {/* Footer note */}
          <div className="text-center text-xs text-gray-400 mt-6">
            Don't have an account?{' '}
            <a
              href="#signup"
              onClick={(e) => {
                e.preventDefault();
                alert('Please contact your restaurant organization owner for staff invitations.');
              }}
              className="text-white font-bold hover:underline"
            >
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
