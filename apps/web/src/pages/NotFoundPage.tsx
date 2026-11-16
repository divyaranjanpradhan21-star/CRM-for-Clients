import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ShieldAlert, ArrowLeft, Store, Users, ShieldCheck } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col justify-between p-6 sm:p-12 font-sans">
      <SEOHead
        title="404 - Page Not Found | DinePulse Cafe & Restaurant CRM"
        description="The requested restaurant terminal page or portal slug does not exist on DinePulse."
        canonicalPath="/404"
      />

      <div className="max-w-4xl mx-auto w-full">
        <Breadcrumbs items={[{ label: '404 Page Not Found' }]} />

        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-gray-200/80 shadow-xl text-center flex flex-col items-center mt-6">
          {/* Branded Vector Illustration Icon */}
          <div className="w-24 h-24 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#f95721] mb-6 shadow-inner">
            <ShieldAlert className="w-12 h-12" />
          </div>

          <span className="text-xs font-mono font-bold tracking-widest text-[#f95721] uppercase bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-200 mb-3">
            Error 404 · Unresolved Slug
          </span>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Portal Route Not Found
          </h1>

          <p className="text-sm sm:text-base text-gray-500 max-w-lg mb-8 leading-relaxed">
            The page or terminal you are attempting to access does not exist or may have been restricted by organizational access policy.
          </p>

          {/* Quick Portal Switcher Cards (Internal Links) */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8">
            <Link
              to="/super-admin/login"
              className="p-5 rounded-2xl border border-gray-200 hover:border-[#f95721] hover:shadow-md transition-all group bg-gray-50/50"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#f95721] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 group-hover:text-[#f95721] transition-colors">
                Super Admin Portal
              </h3>
              <p className="text-xs text-gray-500 mt-1">Platform management &amp; tenant control</p>
            </Link>

            <Link
              to="/admin/login"
              className="p-5 rounded-2xl border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all group bg-gray-50/50"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Store className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                Restaurant Admin
              </h3>
              <p className="text-xs text-gray-500 mt-1">Outlet operations, orders &amp; staff</p>
            </Link>

            <Link
              to="/staff/login"
              className="p-5 rounded-2xl border border-gray-200 hover:border-emerald-600 hover:shadow-md transition-all group bg-gray-50/50"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 group-hover:text-emerald-600 transition-colors">
                Staff Service Portal
              </h3>
              <p className="text-xs text-gray-500 mt-1">Floor terminal, tables &amp; reservations</p>
            </Link>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#f95721] hover:bg-[#e04816] text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Gateway</span>
          </Link>
        </div>
      </div>

      <footer className="text-center text-xs text-gray-400 mt-10">
        © 2026 DinePulse Hospitality Platform. All rights reserved.
      </footer>
    </div>
  );
};
