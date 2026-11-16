import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEOHead } from '../../components/SEOHead';
import { ArrowRight, Lock, Mail, Shield, Zap } from 'lucide-react';

export const StaffLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('staff@democompany.com');
  const [password, setPassword] = useState('StaffPass#123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (step === 'email') {
      if (!email) { setError('Please enter your email address'); return; }
      setStep('password');
    } else {
      if (!password) { setError('Please enter your password'); return; }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        localStorage.setItem('portal_role', 'STAFF');
        localStorage.setItem('user_email', email);
        navigate('/staff/dashboard');
      }, 600);
    }
  };

  return (
    <div className="min-h-screen w-full flex" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <SEOHead
        title="Staff Service Terminal | DinePulse CRM"
        description="Staff login for restaurant floor operations — manage reservations, tables, orders and guest check-ins."
        canonicalPath="/staff/login"
      />

      {/* Left Panel — Form */}
      <div className="w-full lg:w-[420px] xl:w-[480px] flex flex-col justify-between bg-[#fdfaf6] border-r border-amber-100 p-10 min-h-screen">
        {/* Logo */}
        <div>
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-900/20">
              <span className="text-white font-black text-sm">DP</span>
            </div>
            <div>
              <span className="font-bold text-base text-gray-900 block leading-none">DinePulse</span>
              <span className="text-[10px] font-mono text-amber-600">Staff Terminal</span>
            </div>
          </Link>

          {/* Heading */}
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight mb-2">
              Staff Terminal Login
            </h1>
            <p className="text-sm text-gray-500">
              Your daily command centre for tables, guests & orders.
            </p>
          </div>

          {/* Quick Status Badges */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {['Floor Active', '12 Tables Open', '3 Pending'].map((tag, i) => (
              <span key={i} className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                {tag}
              </span>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {step === 'email' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Staff Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@restaurant.com"
                    required
                    autoFocus
                    className="w-full px-5 py-3.5 pr-12 rounded-2xl border border-amber-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-sm"
                  />
                  <Mail className="absolute right-4 top-3.5 w-4 h-4 text-gray-400" />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-600">Password</label>
                  <button type="button" onClick={() => setStep('email')} className="text-xs text-amber-600 hover:underline">
                    Change email
                  </button>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs text-amber-700 mb-3">
                  Signing in as <strong>{email}</strong>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoFocus
                    className="w-full px-5 py-3.5 pr-12 rounded-2xl border border-amber-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-sm"
                  />
                  <Lock className="absolute right-4 top-3.5 w-4 h-4 text-gray-400" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-bold text-sm tracking-wide py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Clocking in...
                </span>
              ) : (
                <>
                  {step === 'email' ? 'Continue' : 'Clock In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {step === 'password' && (
              <div className="text-center">
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Contact your restaurant admin to reset your password.'); }} className="text-xs text-gray-400 hover:text-amber-600 underline underline-offset-4 transition">
                  Forgot password? Contact Admin
                </a>
              </div>
            )}
          </form>
        </div>

        {/* Footer nav */}
        <div className="pt-8 border-t border-amber-100 text-xs text-gray-400 flex items-center justify-between">
          <Link to="/admin/login" className="text-blue-500 hover:underline">Admin Portal →</Link>
          <Link to="/super-admin/login" className="text-orange-500 hover:underline">Super Admin →</Link>
        </div>
      </div>

      {/* Right Panel — Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-amber-800 via-amber-700 to-orange-900 relative overflow-hidden items-center justify-center p-16">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Quick Action Cards — matching warm Purrweb theme */}
        <div className="relative z-10 w-full max-w-lg space-y-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-amber-200 uppercase tracking-widest">Today's Shift</span>
              <span className="bg-green-400/20 text-green-300 text-xs font-bold px-3 py-1 rounded-full border border-green-400/30">● Active</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[{ label: 'Tables', val: '12', sub: '3 available' }, { label: 'Covers', val: '47', sub: 'today' }, { label: 'Orders', val: '89', sub: 'served' }].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-black">{s.val}</div>
                  <div className="text-xs text-amber-200 font-semibold">{s.label}</div>
                  <div className="text-xs text-white/50">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🪑', label: 'Seat Guest', color: 'from-amber-500 to-orange-500' },
              { icon: '📋', label: 'New Order', color: 'from-orange-600 to-red-600' },
              { icon: '📅', label: 'Reserve', color: 'from-yellow-500 to-amber-500' },
            ].map((btn) => (
              <div key={btn.label} className={`bg-gradient-to-br ${btn.color} rounded-2xl p-4 text-center text-white shadow-lg cursor-pointer hover:scale-105 transition-transform`}>
                <div className="text-2xl mb-1">{btn.icon}</div>
                <div className="text-xs font-bold">{btn.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-200" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Floor is Hot Tonight 🔥</div>
                <div className="text-xs text-amber-200">Peak hours: 7 PM – 10 PM</div>
              </div>
            </div>
            <div className="flex gap-2">
              {['Dine-in', 'Pick-up', 'Delivery'].map((t) => (
                <span key={t} className="bg-white/10 text-white text-xs px-3 py-1 rounded-full border border-white/20">{t}</span>
              ))}
            </div>
          </div>

          <div className="text-center pt-2">
            <div className="flex items-center justify-center gap-2 text-white/60 text-xs">
              <Shield className="w-3.5 h-3.5" />
              Secured by DinePulse · Role-based access
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
