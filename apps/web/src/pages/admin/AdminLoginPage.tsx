import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEOHead } from '../../components/SEOHead';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { ArrowRight, Lock, Mail, Store, Sparkles } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('admin@democompany.com');
  const [password, setPassword] = useState('AdminPass#123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'email') {
      if (!email) return;
      setStep('password');
    } else {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        localStorage.setItem('portal_role', 'RESTAURANT_ADMIN');
        localStorage.setItem('user_email', email);
        navigate('/admin/dashboard');
      }, 500);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0d0e12] text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      <SEOHead
        title="Restaurant Admin Portal | DinePulse CRM"
        description="Restaurant Administrator login for branch management, floor plans, menu engineering, and POS orders."
        canonicalPath="/admin/login"
      />

      {/* Background SVG Food Doodle Pattern (Image 1) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] z-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="food-icons-admin" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M 20 30 Q 35 15 50 30 Q 35 32 20 30 Z M 20 34 H 50 M 20 38 Q 35 42 50 38" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M 80 20 L 75 50 L 95 50 L 90 20 Z M 85 10 L 85 20 M 70 20 H 100" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="35" cy="85" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="35" cy="85" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M 75 85 Q 90 65 105 85 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#food-icons-admin)" />
        </svg>
      </div>

      {/* Sweeping Blue Wave Background Accent */}
      <div className="absolute bottom-0 left-0 w-full h-[55vh] pointer-events-none z-0">
        <svg
          viewBox="0 0 1440 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
        >
          <path
            d="M -100 450 C 250 550 400 250 850 380 C 1150 460 1350 320 1600 350 L 1600 700 L -100 700 Z"
            fill="#2257e8"
            className="opacity-95"
          />
          <path
            d="M -50 520 C 300 580 500 380 900 440 C 1200 480 1350 400 1550 420 L 1550 700 L -50 700 Z"
            fill="#1c47c7"
            className="opacity-80"
          />
        </svg>
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-8 pt-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-500 flex items-center justify-center shadow-lg shadow-rose-900/40">
            <div className="relative">
              <div className="w-4 h-4 bg-white/90 rounded-full"></div>
              <div className="absolute -top-1.5 right-0 w-2.5 h-1.5 bg-emerald-400 rounded-full rotate-45"></div>
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white block">DinePulse Admin</span>
            <span className="text-[10px] font-mono text-gray-400">Restaurant Operations</span>
          </div>
        </Link>

        {/* Top-Right Capsule Switcher */}
        <div className="bg-[#1b1c21]/90 backdrop-blur-md p-1 rounded-full border border-white/5 flex items-center shadow-2xl">
          <button
            onClick={() => setActiveTab('login')}
            className={`px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'login'
                ? 'bg-[#2b66ff] text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            login
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'signup'
                ? 'bg-[#2b66ff] text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            signup
          </button>
        </div>
      </header>

      {/* Center Layout: Card + Hero Typography */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-8 py-12 flex-1 flex flex-col md:flex-row items-center justify-center gap-16 lg:gap-24">
        {/* Left Side: Modern Dark Glass Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-[#18191e]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80">
            {/* Logo in Center of Card */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-xl shadow-rose-600/30 mb-5 relative group">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                <div className="absolute -top-1 right-2 flex gap-0.5">
                  <div className="w-3.5 h-2 bg-emerald-400 rounded-full rotate-45 transform origin-bottom-left"></div>
                  <div className="w-3 h-1.5 bg-emerald-500 rounded-full -rotate-12 transform origin-bottom-left"></div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
              <p className="text-xs text-gray-400 mt-1.5">Sign in to manage restaurant outlets, orders &amp; staff</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 'email' ? (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Restaurant Admin Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@democompany.com"
                      required
                      className="w-full px-5 py-3.5 rounded-full bg-[#111216] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    />
                    <Mail className="absolute right-4 top-3.5 w-4 h-4 text-gray-500" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-gray-400">Password</label>
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Change email
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full px-5 py-3.5 rounded-full bg-[#111216] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    />
                    <Lock className="absolute right-4 top-3.5 w-4 h-4 text-gray-500" />
                  </div>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#2b66ff] hover:bg-blue-600 active:scale-[0.98] text-white font-semibold text-xs tracking-wide px-7 py-3 rounded-full flex items-center gap-1.5 shadow-lg shadow-blue-600/40 transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Signing in...
                    </span>
                  ) : (
                    <>
                      {step === 'email' ? 'Next' : 'Enter'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset instructions sent to administrator email.');
                  }}
                  className="text-xs text-gray-400 hover:text-white underline underline-offset-4 transition"
                >
                  forgot password
                </a>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
              <Link to="/staff/login" className="text-emerald-400 hover:underline">
                Staff Terminal →
              </Link>
              <Link to="/super-admin/login" className="text-orange-400 hover:underline">
                Super Admin →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side: Hero Typography */}
        <div className="flex-1 flex flex-col items-start justify-center">
          <span className="text-sm font-semibold tracking-wide text-gray-300 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Restaurant &amp; Cafe Operations
          </span>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-8">
            Admin Portal
          </h2>

          <div className="bg-[#1f222b]/80 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3.5 flex items-center gap-4 shadow-xl">
            <span className="text-xl font-bold text-white tracking-wide">Trending now</span>
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/15">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="text-xs font-mono text-gray-300">Outlets &amp; POS Live</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-8 pb-6 flex items-center justify-between text-xs text-gray-400">
        <span>© 2026 DinePulse Restaurant SaaS</span>
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-white">Portal Switcher</Link>
          <Link to="/staff/login" className="hover:text-white">Staff Login</Link>
          <Link to="/super-admin/login" className="hover:text-white">Super Admin</Link>
        </div>
      </footer>
    </div>
  );
};
