import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthLayout = () => {
  const { user, authChecking } = useAuth();

  // If already authenticated, bypass login and redirect straight to dashboard
  if (!authChecking && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen w-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Decorative Neon Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-indigo/15 rounded-full filter blur-3xl pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full filter blur-3xl pointer-events-none animate-pulse duration-3000"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent-indigo to-accent-cyan flex items-center justify-center shadow-lg shadow-accent-indigo/35 mb-3">
            <span className="text-xl font-bold text-white tracking-wider">F</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Finance
          </h1>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-semibold">
            Smart Wealth Manager
          </p>
        </div>

        {/* Child Router Viewlet */}
        <div className="glass-panel rounded-2xl shadow-2xl p-6 md:p-8 animate-slide-up border border-white/5">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
