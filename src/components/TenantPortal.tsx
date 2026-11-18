import React from 'react';
import { CreditCard, CheckCircle, AlertTriangle, Coffee, Utensils, MessageSquare, ShieldCheck } from 'lucide-react';

export const TenantPortal: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      <div className="bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/30 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Resident Active
          </span>
          <h2 className="text-2xl font-black text-white mt-2">Welcome Back, Radha</h2>
          <p className="text-xs text-purple-200">Room 101 • Bed B (Double Sharing) • Laasya PG</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">Monthly Rent</span>
          <span className="text-2xl font-black text-white">₹9,500</span>
          <span className="text-xs text-emerald-400 font-bold block flex items-center justify-end gap-1 mt-0.5">
            <CheckCircle className="w-3.5 h-3.5" /> Rent Cleared
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Meal Tracker */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-purple-400" />
              <span>Today's Dining Schedule</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Veg Menu</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-900/60 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Breakfast (7:30 AM - 9:30 AM)</p>
                <p className="text-[10px] text-slate-400">Idli, Sambar, Fresh Coconut Chutney & Filter Coffee</p>
              </div>
              <span className="text-emerald-400 font-semibold text-[10px]">Served</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Dinner (7:30 PM - 9:30 PM)</p>
                <p className="text-[10px] text-slate-400">Paneer Butter Masala, Phulkas, Steamed Rice & Dal</p>
              </div>
              <span className="text-purple-400 font-semibold text-[10px]">Upcoming</span>
            </div>
          </div>
        </div>

        {/* Maintenance / Support */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Facility Helpdesk</span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Report any electrical, plumbing, Wi-Fi or housekeeping issues directly to the property warden.
          </p>
          <button className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition">
            Raise Maintenance Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

