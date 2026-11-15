import React, { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LayoutDashboard, LogIn, ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'dashboard'>('login');

  return (
    <div className="relative min-h-screen">
      {/* Floating Demo View Switcher Header (discreet, top-center) */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-[#16171b]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2">
        <button
          onClick={() => setCurrentView('login')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
            currentView === 'login'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          Login Portal (Image 1)
        </button>

        <span className="text-gray-600 text-xs">|</span>

        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
            currentView === 'dashboard'
              ? 'bg-[#df7e26] text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Warm Dashboard (Image 2)
        </button>
      </div>

      {/* Render Selected View */}
      {currentView === 'login' ? (
        <LoginPage onLoginSuccess={() => setCurrentView('dashboard')} />
      ) : (
        <DashboardPage onLogout={() => setCurrentView('login')} />
      )}
    </div>
  );
};

export default App;
