import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OwnerHub } from './components/OwnerHub';
import { LandingPage } from './components/LandingPage';
import { GuestOnboard } from './components/GuestOnboard';
import { TenantPortal } from './components/TenantPortal';
import { SuperAdmin } from './components/SuperAdmin';
import { SaaSContext } from './types';

function parseContextFromUrl(): SaaSContext | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.toLowerCase().replace('#', '').trim();
  const params = new URLSearchParams(window.location.search);
  const view = (params.get('view') || params.get('context') || hash).toLowerCase();

  if (view.includes('superadmin') || view.includes('admin') || view === 'super_admin') {
    return 'SUPER_ADMIN';
  }
  if (view.includes('tenant') || view.includes('resident')) {
    return 'TENANT';
  }
  if (view.includes('guest') || view.includes('onboard') || view.includes('checkin')) {
    return 'GUEST_ONBOARD';
  }
  if (view.includes('landing') || view === 'home' || view === 'start') {
    return 'LANDING';
  }
  if (view.includes('manager')) {
    return 'MANAGER';
  }
  if (view.includes('owner') || view.includes('hub')) {
    return 'OWNER';
  }
  return null;
}

export const App: React.FC = () => {
  const [currentContext, setCurrentContext] = useState<SaaSContext>(() => {
    const fromUrl = parseContextFromUrl();
    if (fromUrl) return fromUrl;
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('saas_context') as SaaSContext;
      if (stored && ['OWNER', 'MANAGER', 'TENANT', 'GUEST_ONBOARD', 'SUPER_ADMIN', 'LANDING'].includes(stored)) {
        return stored;
      }
    }
    return 'OWNER';
  });

  const handleContextChange = (ctx: SaaSContext) => {
    setCurrentContext(ctx);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('saas_context', ctx);
    }
    const hashMap: Record<SaaSContext, string> = {
      OWNER: 'owner',
      SUPER_ADMIN: 'superadmin',
      TENANT: 'tenant',
      GUEST_ONBOARD: 'guest-onboard',
      LANDING: 'landing',
      MANAGER: 'manager'
    };
    if (typeof window !== 'undefined' && hashMap[ctx]) {
      window.location.hash = hashMap[ctx];
    }
  };

  useEffect(() => {
    const onHashChange = () => {
      const ctx = parseContextFromUrl();
      if (ctx && ctx !== currentContext) {
        setCurrentContext(ctx);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [currentContext]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Header currentContext={currentContext} onContextChange={handleContextChange} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentContext === 'LANDING' && (
          <LandingPage
            onApplyClick={() => handleContextChange('GUEST_ONBOARD')}
            onAdminClick={() => handleContextChange('OWNER')}
          />
        )}

        {(currentContext === 'OWNER' || currentContext === 'MANAGER') && <OwnerHub />}

        {currentContext === 'GUEST_ONBOARD' && <GuestOnboard />}

        {currentContext === 'TENANT' && <TenantPortal />}

        {currentContext === 'SUPER_ADMIN' && <SuperAdmin />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-4 mb-2 text-xs text-slate-400">
          <button onClick={() => handleContextChange('OWNER')} className="hover:text-purple-400 transition">🏢 PG Owner Hub</button>
          <span>•</span>
          <button onClick={() => handleContextChange('SUPER_ADMIN')} className="hover:text-purple-400 transition">🛡️ Super Admin</button>
          <span>•</span>
          <button onClick={() => handleContextChange('TENANT')} className="hover:text-purple-400 transition">👥 Resident Portal</button>
          <span>•</span>
          <button onClick={() => handleContextChange('GUEST_ONBOARD')} className="hover:text-purple-400 transition">📋 Guest Onboarding</button>
          <span>•</span>
          <button onClick={() => handleContextChange('LANDING')} className="hover:text-purple-400 transition">🏠 Platform Home</button>
        </div>
        <p>Srinoos Co-Living Operations Hub Node HSR-9467. Developed by Srinoos.</p>
        <p className="text-[10px] text-slate-600 mt-1">
          Connected to live PostgreSQL relational backend on Supabase & deployed on Vercel.
        </p>
      </footer>
    </div>
  );
};

export default App;
