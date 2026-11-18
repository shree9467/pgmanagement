import React from 'react';
import { Building2, ShieldCheck, Sparkles, Wifi, Utensils, Zap, Coffee, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onApplyClick: () => void;
  onAdminClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onApplyClick, onAdminClick }) => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold tracking-wide animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Next-Generation AI Co-Living & Hostels</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Modern Living Spaces Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">Visionaries</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Experience premium co-living with automated biometric check-ins, chef-crafted hygienic dining, high-speed fiber internet, and 24/7 security surveillance.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={onApplyClick}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition transform hover:-translate-y-0.5"
          >
            <span>Apply for Room Admission</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onAdminClick}
            className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition"
          >
            Proprietor Hub
          </button>
        </div>
      </section>

      {/* Amenities Grid */}
      <section className="max-w-6xl mx-auto">
        <h2 className="text-center text-xs font-black uppercase tracking-widest text-purple-400 mb-8">
          Curated Amenities Included
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Gigabit Fiber Wi-Fi', desc: 'Seamless streaming & work', icon: Wifi },
            { title: 'Nutritious 3X Meals', desc: 'Vegetarian & homestyle cooking', icon: Utensils },
            { title: '24/7 Power Backup', desc: 'Uninterrupted power & inverter', icon: Zap },
            { title: 'Housekeeping & Care', desc: 'Daily sanitized deep-cleans', icon: Coffee },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-purple-500/40 transition text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-[11px] text-slate-400">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

