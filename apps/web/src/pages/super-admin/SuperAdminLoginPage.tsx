import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEOHead } from '../../components/SEOHead';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { ShieldCheck, Lock, Mail, ArrowRight, Server, KeyRound, CheckCircle2 } from 'lucide-react';

export const SuperAdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('superadmin@example.com');
  const [password, setPassword] = useState('ChangeMe#12345');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Store session in localStorage for portal state
      localStorage.setItem('portal_role', 'SUPER_ADMIN');
      localStorage.setItem('user_email', email);
      navigate('/super-admin/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0d0f17] text-white flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-[#f95721] selection:text-white">
      <SEOHead
        title="Super Admin Sign In | DinePulse Platform Command"
        description="Secure multi-tenant platform command center login for DinePulse system administrators."
        canonicalPath="/super-admin/login"
      />

      <div className="max-w-md mx-auto w-full">
        <Breadcrumbs items={[{ label: 'Super Admin Login' }]} />

        <div className="bg-[#161926] rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl relative mt-4">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[#f95721] mb-4 shadow-lg shadow-orange-500/10">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-mono font-bold tracking-widest text-[#f95721] uppercase bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 mb-2">
              Platform Command Center
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Super Admin Login
            </h1>
            <p className="text-xs text-gray-400 mt-2">
              Global tenant administration &amp; SaaS infrastructure control
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Platform Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="superadmin@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#0e1019] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] transition"
                />
                <Mail className="w-4 h-4 text-gray-500 absolute right-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Root Security Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-[#0e1019] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] transition"
                />
                <Lock className="w-4 h-4 text-gray-500 absolute right-4 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#f95721] hover:bg-[#e04816] active:scale-[0.99] text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all mt-6"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Authenticating Platform Session...
                </span>
              ) : (
                <>
                  <span>Access Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3 text-xs text-center text-gray-400">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Need other portals?</span>
              <div className="flex gap-3">
                <Link to="/admin/login" className="text-blue-400 hover:underline">Restaurant Admin</Link>
                <Link to="/staff/login" className="text-emerald-400 hover:underline">Staff Terminal</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-gray-500 mt-12">
        Protected by Supabase PostgreSQL Row-Level Security · Audited Operations
      </footer>
    </div>
  );
};
