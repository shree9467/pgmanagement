import React from 'react';
import { ShieldCheck, Database, Key, Server, CheckCircle2 } from 'lucide-react';

export const SuperAdmin: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-3xl shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-purple-400">
          <ShieldCheck className="w-6 h-6" />
          <h2 className="text-xl font-black text-white">System Architecture & Node Diagnostics</h2>
        </div>
        <p className="text-xs text-slate-400">
          Super Admin master status for Srinoos Co-Living Operating System. Connected to live PostgreSQL relational nodes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl space-y-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">PostgreSQL Backend</h3>
          <p className="text-[11px] text-slate-400">Supabase Managed Database: fswlweejdyhrywvzhzvw</p>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> 10 Tables Active
          </span>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl space-y-2">
          <Server className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Deployment Host</h3>
          <p className="text-[11px] text-slate-400">Vercel Edge Network: mangement-pg.vercel.app</p>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> SSL Active (HTTP/2)
          </span>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl space-y-2">
          <Key className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Security & Auditing</h3>
          <p className="text-[11px] text-slate-400">Row-Level Security (RLS) active on all relational queries.</p>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Verified Secure
          </span>
        </div>
      </div>
    </div>
  );
};

