import React, { useState } from 'react';
import { Header } from './components/Header';
import { OwnerHub } from './components/OwnerHub';
import { LandingPage } from './components/LandingPage';
import { GuestOnboard } from './components/GuestOnboard';
import { TenantPortal } from './components/TenantPortal';
import { SuperAdmin } from './components/SuperAdmin';
import { SaaSContext } from './types';

export const App: React.FC = () => {
  const [currentContext, setCurrentContext] = useState<SaaSContext>('OWNER');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Header currentContext={currentContext} onContextChange={setCurrentContext} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentContext === 'LANDING' && (
          <LandingPage
            onApplyClick={() => setCurrentContext('GUEST_ONBOARD')}
            onAdminClick={() => setCurrentContext('OWNER')}
          />
        )}

        {(currentContext === 'OWNER' || currentContext === 'MANAGER') && <OwnerHub />}

        {currentContext === 'GUEST_ONBOARD' && <GuestOnboard />}

        {currentContext === 'TENANT' && <TenantPortal />}

        {currentContext === 'SUPER_ADMIN' && <SuperAdmin />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <p>Srinoos Co-Living Operations Hub Node HSR-9467. Developed by Srinoos.</p>
        <p className="text-[10px] text-slate-600 mt-1">
          Connected to live PostgreSQL relational backend on Supabase & deployed on Vercel.
        </p>
      </footer>
    </div>
  );
};

export default App;

