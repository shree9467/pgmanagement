import React, { useState } from 'react';
import { SaaSContext } from '../types';
import { 
  Building2, 
  Home, 
  UserCheck, 
  Users, 
  ShieldCheck, 
  Layers, 
  ChevronDown, 
  Sparkles,
  PhoneCall
} from 'lucide-react';

interface HeaderProps {
  currentContext: SaaSContext;
  onContextChange: (ctx: SaaSContext) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentContext, onContextChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const contextOptions: { role: SaaSContext; label: string; desc: string; icon: any }[] = [
    { role: 'LANDING', label: 'Platform Home', desc: 'Promotional startpage & admissions', icon: Home },
    { role: 'OWNER', label: 'PG Owner Hub', desc: 'Proprietor operational command center', icon: Building2 },
    { role: 'MANAGER', label: 'Manager Desk', desc: 'Restricted operations & billing check', icon: Users },
    { role: 'TENANT', label: 'Resident Portal', desc: 'Rent checkout & menu feedback', icon: UserCheck },
    { role: 'GUEST_ONBOARD', label: 'Guest Onboarding', desc: 'Aadhaar multi-step digital check-in', icon: Layers },
    { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Platform-wide controls & subscriptions', icon: ShieldCheck },
  ];

  const currentOption = contextOptions.find((c) => c.role === currentContext) || contextOptions[1];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">Srinoos</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
                AI PG OS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Smart Co-Living Operations</p>
          </div>
        </div>

        {/* Right actions & SaaS Context Switcher */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-white text-xs font-semibold border border-slate-700 transition shadow-sm"
            >
              <currentOption.icon className="w-4 h-4 text-purple-400" />
              <span>{currentOption.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-purple-400 border-b border-slate-700/60 mb-1">
                    Select Context View
                  </div>
                  <div className="space-y-1">
                    {contextOptions.map((opt) => {
                      const Icon = opt.icon;
                      const active = currentContext === opt.role;
                      return (
                        <button
                          key={opt.role}
                          onClick={() => {
                            onContextChange(opt.role);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-3 ${
                            active
                              ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                              : 'hover:bg-slate-700/50 text-slate-300'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mt-0.5 ${active ? 'text-purple-400' : 'text-slate-400'}`} />
                          <div>
                            <p className="text-xs font-bold">{opt.label}</p>
                            <p className="text-[10px] text-slate-400">{opt.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

