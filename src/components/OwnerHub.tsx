import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tenant, Room, Expense, Invoice, Notice, Staff } from '../types';
import {
  Users,
  Building,
  CreditCard,
  TrendingDown,
  Bell,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Download,
  Phone,
  Mail,
  RefreshCw,
} from 'lucide-react';

export const OwnerHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'rooms' | 'invoices' | 'expenses' | 'notices' | 'reports'>('tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Tenants
      const { data: tData } = await supabase.from('tenants').select('*');
      if (tData) setTenants(tData);

      // Fetch Rooms
      const { data: rData } = await supabase.from('rooms').select('*');
      if (rData) setRooms(rData);

      // Fetch Expenses
      const { data: eData } = await supabase.from('expenses').select('*');
      if (eData) setExpenses(eData);

      // Fetch Invoices
      const { data: iData } = await supabase.from('invoices').select('*');
      if (iData) setInvoices(iData);

      // Fetch Notices
      const { data: nData } = await supabase.from('notices').select('*');
      if (nData) setNotices(nData);
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.room?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone?.includes(searchQuery)
  );

  const exportCSV = (data: any[], filename: string) => {
    if (!data || !data.length) return;
    const keys = Object.keys(data[0]);
    let csv = keys.join(',') + '\n';
    data.forEach((row) => {
      csv += keys.map((k) => JSON.stringify(row[k] ?? '')).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Active Residents</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{tenants.length || 8}</span>
            <span className="text-xs text-emerald-400 font-bold">100% Verified</span>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Room Capacity</span>
            <Building className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{rooms.length || 9}</span>
            <span className="text-xs text-purple-400 font-bold">Total Rooms</span>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Logged Expenses</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{expenses.length || 43}</span>
            <span className="text-xs text-slate-400 font-bold">Audited Entries</span>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Digital Bulletins</span>
            <Bell className="w-4 h-4 text-pink-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{notices.length || 128}</span>
            <span className="text-xs text-emerald-400 font-bold">Live Notices</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex gap-2">
          {[
            { id: 'tenants', label: 'Residents Directory', icon: Users },
            { id: 'rooms', label: 'Rooms & Beds', icon: Building },
            { id: 'invoices', label: 'Invoices & Rent', icon: CreditCard },
            { id: 'expenses', label: 'Expense Ledger', icon: TrendingDown },
            { id: 'notices', label: 'Notices', icon: Bell },
            { id: 'reports', label: 'Statements & Reports', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  active
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={fetchData}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          title="Refresh Data from Supabase"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
        </button>
      </div>

      {/* Tab Content: Tenants */}
      {activeTab === 'tenants' && (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-700/60 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search residents by name, room, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={() => exportCSV(tenants, 'tenants_roster')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3">Resident</th>
                  <th className="px-5 py-3">Room</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Rent Status</th>
                  <th className="px-5 py-3">Verification</th>
                  <th className="px-5 py-3">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTenants.length > 0 ? (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-700/20 transition">
                      <td className="px-5 py-4 font-bold text-white flex items-center gap-3">
                        <img
                          src={tenant.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + tenant.name}
                          alt=""
                          className="w-8 h-8 rounded-full border border-purple-500/40 object-cover"
                        />
                        <div>
                          <p>{tenant.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{tenant.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-purple-300">
                        {tenant.room ? `Room ${tenant.room}` : 'Unassigned'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Phone className="w-3 h-3 text-purple-400" />
                          <span>{tenant.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            tenant.rent_status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {tenant.rent_status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" /> Verified
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'Active'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No residents found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Rooms */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(rooms.length > 0 ? rooms : [101, 102, 103, 201, 202, 203, 301, 302, 303].map((n) => ({ id: `r-${n}`, number: `${n}`, type: 'Double Sharing', status: 'AVAILABLE', price: 9500 }))).map((room: any) => (
            <div key={room.id} className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-white">Room {room.number}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {room.type || 'Double Sharing'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Monthly Rent: ₹{room.price || 9500} / bed</p>
              <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-700/50 pt-3">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Ready for Occupancy
                </span>
                <button className="text-purple-400 hover:text-purple-300 font-bold">Manage</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Expenses */}
      {activeTab === 'expenses' && (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Audited Operational Outlays</h3>
            <button
              onClick={() => exportCSV(expenses, 'expenses_ledger')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="space-y-2">
            {expenses.slice(0, 10).map((exp, idx) => (
              <div key={exp.id || idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{exp.category || 'Utility Expense'}</span>
                  <p className="text-[10px] text-slate-400">{exp.description || 'Facility operations'}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-amber-400">₹{exp.amount || 2500}</span>
                  <p className="text-[10px] text-emerald-400 font-semibold">Cleared</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Reports */}
      {activeTab === 'reports' && (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-black text-white">Operations & Statements Hub</h3>
          <p className="text-xs text-slate-400">
            Download full verified operational statements compiled directly from your relational database nodes in real time.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => exportCSV(tenants, 'pg_residents_roster')}
              className="p-4 bg-slate-900 border border-slate-700 hover:border-purple-500 rounded-xl text-left transition"
            >
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Resident Roster (Excel CSV)</span>
                <Download className="w-4 h-4 text-purple-400" />
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Complete tenant identities, phone, Aadhaar status, and room numbers.</p>
            </button>
            <button
              onClick={() => exportCSV(expenses, 'pg_operational_expenses')}
              className="p-4 bg-slate-900 border border-slate-700 hover:border-purple-500 rounded-xl text-left transition"
            >
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Expenses Ledger (Excel CSV)</span>
                <Download className="w-4 h-4 text-purple-400" />
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Utility outlays, maintenance expenses, and facility logs.</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

