import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col justify-between p-6 sm:p-12 font-sans">
      <SEOHead
        title="404 - Page Not Found | Cafe & Restaurant CRM"
        description="The requested restaurant terminal page or portal slug does not exist."
        canonicalPath="/404"
      />

      <div className="max-w-xl mx-auto w-full my-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-gray-200/80 shadow-xl text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#f95721] mb-6 shadow-inner">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <span className="text-xs font-mono font-bold tracking-widest text-[#f95721] uppercase bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-200 mb-3">
            Error 404 · Unresolved Slug
          </span>

          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
            Page Not Found
          </h1>

          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            The page or terminal you are attempting to access does not exist or may have moved.
          </p>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#f95721] hover:bg-[#e04816] text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Return to Login Portal</span>
          </Link>
        </div>
      </div>

      <footer className="text-center text-xs text-gray-400 mt-6">
        © 2026 Cafe Beans & DinePulse Platform. All rights reserved.
      </footer>
    </div>
  );
};
