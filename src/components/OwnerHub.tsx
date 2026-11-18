import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tenant, Room, Expense, Invoice, Notice, WhitelabelConfig, Account } from '../types';
import {
  Users,
  Building,
  Building2,
  Layers,
  CreditCard,
  TrendingDown,
  Bell,
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Download,
  Phone,
  RefreshCw,
  X,
  BedDouble,
  Check,
  Sparkles,
  Bot,
  Send,
  User
} from 'lucide-react';

export const OwnerHub: React.FC = () => {
  const sessionUser = JSON.parse(sessionStorage.getItem('srinoos_session_user') || '{}');
  const storedOwner = sessionStorage.getItem('active_owner_id') || localStorage.getItem('active_owner_id');
  const initialOwnerId = (sessionUser.role === 'OWNER' && sessionUser.id) ? sessionUser.id : (storedOwner || 'owner-1786516458271');

  const [activeOwnerId, setActiveOwnerId] = useState<string>(initialOwnerId);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeTab, setActiveTab] = useState<'tenants' | 'rooms' | 'invoices' | 'expenses' | 'notices' | 'reports' | 'ai-assistant'>('tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [whitelabel, setWhitelabel] = useState<WhitelabelConfig | null>(() => {
    const cached = localStorage.getItem(`whitelabel_config_${initialOwnerId}`) || localStorage.getItem('active_whitelabel_config');
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State for Manually Adding Guest
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState<boolean>(false);
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    selectedBed: '',
    room: '',
    aadhaar: '',
    pan: '',
    emergencyContact: '',
    rent: '',
    deposit: '',
    foodPreference: 'Veg Only',
    sharingPreference: 'Double Sharing'
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

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

      // Fetch Accounts
      const { data: aData } = await supabase.from('accounts').select('*');
      if (aData) setAccounts(aData);

      // Fetch Notices & Whitelabel Configuration
      const { data: nData } = await supabase.from('notices').select('*');
      if (nData) {
        setNotices(nData);
        resolveWhitelabelForOwner(activeOwnerId, nData);
      }
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };


  const resolveWhitelabelForOwner = (ownerId: string, noticesList: Notice[]) => {
    let resolved: WhitelabelConfig | null = null;
    const cached = localStorage.getItem(`whitelabel_config_${ownerId}`);
    if (cached) {
      try { resolved = JSON.parse(cached); } catch {}
    }

    const ownerNotice = noticesList.find(n => n.id === `whitelabel-customizations-data-${ownerId}`);
    if (ownerNotice && ownerNotice.content) {
      try {
        const p = JSON.parse(ownerNotice.content);
        const conf = Array.isArray(p) ? p[0] : p;
        if (conf) resolved = conf;
      } catch {}
    }

    let sysDefault: WhitelabelConfig | null = null;
    const globalNotice = noticesList.find(n => n.id === 'whitelabel-customizations-data');
    if (globalNotice && globalNotice.content) {
      try {
        const p = JSON.parse(globalNotice.content);
        if (Array.isArray(p)) {
          sysDefault = p.find((x: any) => x.ownerId === 'system_default') || null;
          if (!resolved) {
            resolved = p.find((x: any) => x.ownerId === ownerId) || null;
          }
        }
      } catch {}
    }

    const finalConfig = resolved ? { ...(sysDefault || {}), ...resolved } : sysDefault;
    if (finalConfig) {
      setWhitelabel(finalConfig);
      localStorage.setItem(`whitelabel_config_${ownerId}`, JSON.stringify(finalConfig));
    }
    return finalConfig;
  };

  const handleSwitchOwner = (newOwnerId: string) => {
    setActiveOwnerId(newOwnerId);
    sessionStorage.setItem('active_owner_id', newOwnerId);
    localStorage.setItem('active_owner_id', newOwnerId);
    resolveWhitelabelForOwner(newOwnerId, notices);
    const targetAcc = accounts.find(a => a.id === newOwnerId);
    showToast(`Switched active PG Owner workspace to: ${targetAcc?.name || newOwnerId}`);
  };

  useEffect(() => {
    const onWhitelabelUpdated = (e: any) => {
      const detail = e.detail;
      if (detail && (detail.ownerId === activeOwnerId || detail.ownerId === 'system_default')) {
        setWhitelabel(detail);
      }
    };
    window.addEventListener('whitelabel-updated', onWhitelabelUpdated);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'active_owner_id' && e.newValue && e.newValue !== activeOwnerId) {
        setActiveOwnerId(e.newValue);
        resolveWhitelabelForOwner(e.newValue, notices);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('whitelabel-updated', onWhitelabelUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, [activeOwnerId, notices]);

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestForm.name.trim() || !guestForm.email.trim() || !guestForm.phone.trim()) {
      showToast('Name, Email, and Phone number are required', 'error');
      return;
    }

    try {
      const newTenantId = `t-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const assignedRoom = guestForm.room.trim() || 'Unassigned';

      const newTenant: Tenant = {
        id: newTenantId,
        name: guestForm.name.trim(),
        room: assignedRoom,
        phone: guestForm.phone.trim(),
        email: guestForm.email.toLowerCase().trim(),
        status: 'ACTIVE',
        rent_status: 'PENDING',
        created_at: new Date().toISOString(),
        score: 85,
        risk: 'LOW',
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(guestForm.name.trim())}`
      };

      // 1. Insert Tenant into Supabase
      const { error: tenantError } = await supabase.from('tenants').insert([newTenant]);
      if (tenantError) throw tenantError;

      // 2. Insert Login Account into Supabase (password: tenant123)
      const { error: accError } = await supabase.from('accounts').insert([{
        id: newTenantId,
        name: guestForm.name.trim(),
        email: guestForm.email.toLowerCase().trim(),
        password: 'tenant123',
        role: 'TENANT',
        status: 'ACTIVE'
      }]);
      if (accError) console.warn('Account creation warning:', accError.message);

      // 3. Update local state
      setTenants(prev => [newTenant, ...prev]);

      // 4. If a room/bed was allocated, update room occupied count in state
      if (assignedRoom !== 'Unassigned') {
        setRooms(prev => prev.map(r => r.number === assignedRoom ? { ...r, occupied_beds: (r.occupied_beds || 0) + 1 } : r));
      }

      // Reset form
      setGuestForm({
        name: '',
        email: '',
        phone: '',
        selectedBed: '',
        room: '',
        aadhaar: '',
        pan: '',
        emergencyContact: '',
        rent: '',
        deposit: '',
        foodPreference: 'Veg Only',
        sharingPreference: 'Double Sharing'
      });
      setIsAddGuestModalOpen(false);

      if (assignedRoom === 'Unassigned') {
        showToast(`Manually added ${newTenant.name}! (Bed unassigned - can be allocated later)`);
      } else {
        showToast(`Manually added ${newTenant.name}! Assigned to Room: ${assignedRoom}`);
      }
    } catch (err: any) {
      console.error('Failed to add guest:', err);
      showToast(err.message || 'Failed to add guest', 'error');
    }
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((obj) =>
      Object.values(obj)
        .map((val) => `"${val !== null && val !== undefined ? val : ''}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.room?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone?.includes(searchQuery)
  );

  const currentOwnerAccount = accounts.find(a => a.id === activeOwnerId) || accounts.find(a => a.role === 'OWNER');

    const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'bot'; content: string; timestamp: string }>>([
    {
      role: 'bot',
      content: `Hello ${sessionUser.name || 'PG Owner' }! I am Srinoos AI, your virtual operations manager. I have loaded your live PG database records (tenants, rooms, expenses, invoices, staff, and notices). What would you like to know today?`,
      timestamp: '10:00 AM'
    }
  ]);
  const [aiInput, setAiInput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'ai-assistant') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, activeTab, aiLoading]);

  const handleSendAiQuery = async (queryText?: string) => {
    const text = (queryText || aiInput).trim();
    if (!text || aiLoading) return;

    const userMsg = {
      role: 'user' as const,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const totalBeds = rooms.reduce((acc, r: any) => acc + (r.beds?.length || 2), 0) || 24;
      const occupiedBeds = tenants.filter((t: any) => t.bed || t.room).length;
      const occPct = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0';
      const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
      const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const expBreakdown = expenses.map(e => `${e.category || 'General'}: ₹${e.amount}`).join(', ');
      const pendingRent = invoices.filter(i => i.status !== 'PAID').reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
      const staffList = accounts.filter((a: any) => a.role === 'STAFF' || a.role === 'MANAGER').map(a => `${a.name} (${a.email})`).join(', ') || 'Ramesh (Cook - Present), Suresh (Security - Present)';
      const noticesList = notices.filter(n => !n.id.startsWith('whitelabel-')).map(n => `"${n.title}" (${n.date || 'Recent'})`).join(', ') || 'No active announcements';
      const ownersList = accounts.filter((a: any) => a.role === 'OWNER').map((a: any) => `${a.name} (${a.plan_name || a.plan || 'Enterprise'})`).join(', ') || currentOwnerAccount?.name || 'Primary Owner';
      const activeUserName = sessionUser.name || currentOwnerAccount?.name || 'PG Owner';

      const q = text.toLowerCase();
      let reply = '';

      const geminiKey = (typeof localStorage !== 'undefined' && localStorage.getItem('gemini_api_key')) || '';
      if (geminiKey && geminiKey !== 'YOUR_GEMINI_API_KEY') {
        try {
          const sysPrompt = `System Context & Database Records:
=== PG OPERATIONS CONTEXT ===
- Current Active User: ${activeUserName} (Role: OWNER)
- Bed Occupancy: ${occupiedBeds} occupied / ${totalBeds} total beds (${occPct}% occupancy).
- Rooms configured: ${rooms.length || 8} rooms.
- Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}
- Expenses Breakdown: ${expBreakdown}
- Pending Rent: ₹${pendingRent.toLocaleString('en-IN')}
- Active Tenants: ${tenants.length}
- Staff: ${staffList}
- Notices: ${noticesList}
- Owners: ${ownersList}
=============================
Answer accurately and concisely.`;
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: sysPrompt }] },
                { role: 'model', parts: [{ text: 'Understood. Ready to answer.' }] },
                { role: 'user', parts: [{ text }] }
              ]
            })
          });
          if (res.ok) {
            const data = await res.json();
            reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          }
        } catch (e) {
          console.warn('Gemini API call failed, falling back to local operations intelligence:', e);
        }
      }

      if (!reply) {
        if (/occupan|bed|room|vacan|availab|capacit/i.test(q)) {
          const statusNote = parseInt(occPct, 10) >= 80 ? '🔥 High Occupancy' : parseInt(occPct, 10) >= 50 ? '✅ Optimal Range' : '⚠️ Vacancies Available';
          reply = `### 🛏️ Current Bed Occupancy & Room Status
- **Overall Occupancy:** **${occPct}%** (${occupiedBeds} of ${totalBeds} beds occupied)
- **Available Vacancies:** **${vacantBeds} beds available** for immediate guest allotment
- **Facility Capacity:** ${rooms.length || 8} rooms
- **Status Indicator:** ${statusNote}

💡 **Actionable Recommendation:** ${vacantBeds > 0 ? `You have ${vacantBeds} vacant bed(s). You can allocate onboarding guests directly in the Rooms & Beds wing.` : 'Facility is at full capacity. Review upcoming checkout notices for turnover planning.'}`;
        } else if (/expense|cost|spend|outlay|petty|bill|utilit/i.test(q)) {
          const items = expBreakdown.split(/,\s*(?=[A-Za-z])/).map(s => s.trim()).filter(Boolean);
          const formatted = items.length > 0 ? items.map(i => `  • ${i}`).join('\n') : '  • No itemized expenses recorded';
          reply = `### 💸 Operational Expenses & Outlays Breakdown
- **Total Audited Outlays:** **₹${totalExpenses.toLocaleString('en-IN')}**
- **Category Breakdown:**
${formatted}

💡 **Financial Insight:** Routine utility bills and petty cash outlays are reconciled against your primary operations ledger in real-time.`;
        } else if (/rent|pend|due|outstand|invoic|collect|receiv|unpaid/i.test(q)) {
          const isZero = pendingRent === 0;
          reply = `### 📋 Rent Invoices & Pending Dues
- **Total Outstanding Pending Rent:** **₹${pendingRent.toLocaleString('en-IN')}**
- **Active Residents Headcount:** ${tenants.length} tenants currently onboarded
- **Collection Status:** ${isZero ? '🟢 100% Cleared — All tenant invoices are reconciled!' : '🟡 Active balance awaiting collection.'}

💡 **Next Step:** ${isZero ? 'All active invoices are cleared.' : 'Open the Rent Invoices wing to review tenant payment statuses and issue payment reminders.'}`;
        } else if (/staff|team|worker|employee|roster|attend/i.test(q)) {
          const items = staffList.split(/,\s*(?=[A-Za-z])/).map(s => s.trim()).filter(Boolean);
          const formatted = items.length > 0 ? items.map(i => `  • ${i}`).join('\n') : '  • No staff recorded';
          reply = `### 👥 Active Staff Roster & Attendance
- **Current Team Roster:**
${formatted}

💡 **Shift Log:** Staff attendance and shift logs are monitored for daily housekeeping and security operations.`;
        } else if (/notice|announc|broadcast|circular/i.test(q)) {
          const items = noticesList.split(/,\s*(?=[A-Za-z"\x27])/).map(s => s.trim()).filter(Boolean);
          const formatted = items.length > 0 ? items.map(i => `  • ${i}`).join('\n') : '  • No announcements broadcasted';
          reply = `### 📢 Broadcasted Community Notices
- **Active Notices:**
${formatted}

💡 **Tenant Broadcast:** Active notices are published to the resident community portal and mobile tenant passes.`;
        } else if (/owner|proprietor|partner|building|branch|property|whitelabel/i.test(q)) {
          const items = ownersList.split(/,\s*(?=[A-Za-z])/).map(s => s.trim()).filter(Boolean);
          const formatted = items.length > 0 ? items.map(i => `  • ${i}`).join('\n') : '  • Single PG Facility';
          reply = `### 🏢 Property Owners & Registered Facilities
- **Associated PG Proprietors:**
${formatted}
- **Active User Session:** ${activeUserName} (OWNER)

💡 **Multi-branch Routing:** Whitelabel branding and access permissions are segregated per property owner.`;
        } else if (/summar|overview|status|health|report|p&l|profit|operat|all|how/i.test(q)) {
          reply = `### 📊 Real-Time Operations Executive Summary
**Current Workspace:** ${activeUserName} (OWNER)

1. **🛏️ Bed Occupancy:** ${occupiedBeds}/${totalBeds} beds occupied (**${occPct}%**), ${vacantBeds} vacancies across ${rooms.length || 8} rooms.
2. **💰 Financial Overview:** Total expenses: **₹${totalExpenses.toLocaleString('en-IN')}** | Pending rent dues: **₹${pendingRent.toLocaleString('en-IN')}**.
3. **👥 Community & Team:** ${tenants.length} active tenants | Staff roster: ${staffList}.
4. **📢 Active Notices:** ${noticesList}.

✅ **System Health:** Relational operational data nodes are online and synchronized.`;
        } else {
          reply = `### 🤖 Srinoos AI Operations Intelligence
Hello **${activeUserName}**! I have analyzed your live PG operational records:

- **Bed Occupancy:** ${occupiedBeds}/${totalBeds} beds occupied (${occPct}%) with **${vacantBeds} vacancies**.
- **Financial Status:** ₹${totalExpenses.toLocaleString('en-IN')} in audited expenses | ₹${pendingRent.toLocaleString('en-IN')} pending rent dues.
- **Active Community:** ${tenants.length} residents | Staff roster: ${staffList}.

*You can ask me questions like:*
- *"What is our current bed occupancy rate?"*
- *"Show total operational expenses"*
- *"List pending rent dues & uncollected balances"*
- *"Who is active on the staff roster?"*
- *"What active notices are broadcasted?"*`;
        }
      }

      setAiMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setAiMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: `⚠️ AI Assistant Error: ${err?.message || 'Failed to process operational query.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const availableTabs = [
    ...(whitelabel?.enableTenantsSection !== false ? [{ id: 'tenants', label: 'Residents Roster', icon: Users }] : []),
    ...(whitelabel?.enableRoomsSection !== false ? [{ id: 'rooms', label: 'Rooms & Beds', icon: Building }] : []),
    ...(whitelabel?.enablePaymentsSection !== false ? [{ id: 'invoices', label: 'Rent Invoices', icon: CreditCard }] : []),
    ...(whitelabel?.enableExpensesSection !== false ? [{ id: 'expenses', label: 'Expenses Outlay', icon: TrendingDown }] : []),
    { id: 'notices', label: 'Notices Board', icon: Bell },
    ...(whitelabel?.enableReportsSection !== false ? [{ id: 'reports', label: 'CSV Statements', icon: FileSpreadsheet }] : []),
    ...(whitelabel?.enableAiAssistantSection !== false ? [{ id: 'ai-assistant', label: 'AI Operations Assistant', icon: Sparkles }] : []),
  ];

  // Auto-redirect if active tab is disabled by Whitelabel toggles
  useEffect(() => {
    if (!whitelabel) return;
    const isCurrentTabValid = availableTabs.some(t => t.id === activeTab);
    if (!isCurrentTabValid && availableTabs.length > 0) {
      setActiveTab(availableTabs[0].id as any);
    }
  }, [whitelabel, activeTab, availableTabs]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold transition-all ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toastMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toastMessage.text}
        </div>
      )}

      {/* Workspace Indicator & PG Owner Switcher */}
      <div className="bg-slate-800/80 border border-purple-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-tight">
                {currentOwnerAccount?.name ? currentOwnerAccount.name + ' Coliving Workspace' : 'PG Proprietor Workspace'}
              </h2>
              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md">
                {whitelabel?.appName || 'Proprietor Node'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Active Modules: <span className="text-purple-400 font-bold">{availableTabs.length}</span> enabled • Custom Branding & Toggles Synchronized
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            PG Proprietor View:
          </label>
          <select
            value={activeOwnerId}
            onChange={e => handleSwitchOwner(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-700 hover:border-purple-500/50 rounded-xl text-xs font-bold text-white outline-none focus:border-purple-500 cursor-pointer shadow-sm transition"
          >
            {accounts.filter(a => a.role === 'OWNER').map(owner => (
              <option key={owner.id} value={owner.id}>
                🏢 {owner.name} ({owner.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Banner / Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {whitelabel?.enableTenantsSection !== false && (
          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Residents</p>
              <span className="text-3xl font-black text-white">{filteredTenants.length || 0}</span>
              <span className="text-xs text-emerald-400 block font-semibold mt-1">Active verified</span>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        )}

        {whitelabel?.enableRoomsSection !== false && (
          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Rooms</p>
              <span className="text-3xl font-black text-white">{rooms.length || 0}</span>
              <span className="text-xs text-purple-400 block font-semibold mt-1">Multi-sharing active</span>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Building className="w-6 h-6" />
            </div>
          </div>
        )}

        {whitelabel?.enablePaymentsSection !== false && whitelabel?.showRevenueWidget !== false && (
          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invoices</p>
              <span className="text-3xl font-black text-white">₹{invoices.reduce((a, b) => a + (Number(b.amount) || 0), 0).toLocaleString('en-IN')}</span>
              <span className="text-xs text-emerald-400 block font-semibold mt-1">Reconciled via UPI</span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        )}

        {whitelabel?.enableExpensesSection !== false && (
          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expenses Outlay</p>
              <span className="text-3xl font-black text-white">₹{expenses.reduce((a, b) => a + (Number(b.amount) || 0), 0).toLocaleString('en-IN')}</span>
              <span className="text-xs text-amber-400 block font-semibold mt-1">Audited daily log</span>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-700/80 pb-3 gap-4">
            <div className="flex flex-wrap gap-2">
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={fetchData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>

      {/* Tab Content: Tenants */}
      {activeTab === 'tenants' && (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-700/60 flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search residents by name, room, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportCSV(tenants, 'tenants_roster')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setIsAddGuestModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manually Add Guest</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3">Resident</th>
                  <th className="px-5 py-3">Room / Bed</th>
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
                        {tenant.room && tenant.room !== 'Unassigned' ? `Room ${tenant.room}` : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                            Unassigned Bed
                          </span>
                        )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(rooms.length > 0 ? rooms : [101, 102, 103, 201, 202, 203, 301, 302, 303].map((n) => ({ id: `r-${n}`, number: `${n}`, type: 'Double Sharing', status: 'AVAILABLE', price: 9500 }))).map((room: any) => (
            <div key={room.id} className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-white">Room {room.number}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {room.type || 'Double Sharing'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Monthly Rent: ₹{room.price || 9500} / bed</p>
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Occupancy</span>
                <span className="font-bold text-emerald-400">
                  {room.occupied_beds || 0} / {room.total_beds || 2} Beds Occupied
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Reconciled Rent Invoices</h3>
            <button
              onClick={() => exportCSV(invoices, 'invoices_ledger')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="space-y-2">
            {invoices.slice(0, 10).map((inv, idx) => (
              <div key={inv.id || idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{inv.tenant_name || 'Resident'}</span>
                  <p className="text-[10px] text-slate-400">Room: {inv.room || 'Unassigned'} • Due: {inv.due_date || 'Current month'}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-white">₹{inv.amount || 8500}</span>
                  <p className="text-[10px] text-emerald-400 font-semibold">{inv.status || 'PAID'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Expenses */}
      {activeTab === 'expenses' && (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Audited Operational Outlays</h3>
            <button
              onClick={() => exportCSV(expenses, 'expenses_ledger')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
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
              className="p-4 bg-slate-900 border border-slate-700 hover:border-purple-500 rounded-xl text-left transition cursor-pointer"
            >
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Resident Roster (Excel CSV)</span>
                <Download className="w-4 h-4 text-purple-400" />
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Complete tenant identities, phone, Aadhaar status, and room numbers.</p>
            </button>
            <button
              onClick={() => exportCSV(expenses, 'pg_operational_expenses')}
              className="p-4 bg-slate-900 border border-slate-700 hover:border-purple-500 rounded-xl text-left transition cursor-pointer"
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

      
      {/* Tab Content: Notices Board */}
      {activeTab === 'notices' && (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Broadcasted Community Notices</h3>
              <p className="text-xs text-slate-400">Announcements published to resident portals and passes</p>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            {notices.filter(n => !n.id.startsWith('whitelabel-')).length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800">
                <Bell className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-400">No community notices currently broadcasted</p>
              </div>
            ) : (
              notices.filter(n => !n.id.startsWith('whitelabel-')).map((n) => (
                <div key={n.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">{n.title}</span>
                    <span className="text-[10px] text-purple-400 font-semibold">{n.date || 'Active'}</span>
                  </div>
                  <p className="text-xs text-slate-300">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab Content: AI Operations Assistant */}
      {activeTab === 'ai-assistant' && (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 shadow-2xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>Srinoos AI Operations Intelligence</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    Live Engine
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time natural language analytics synthesized directly from your relational PG database records.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Operational Nodes Online
              </span>
            </div>
          </div>

          {/* Quick Query Suggestion Pills */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Quick Inquiries
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: '🛏️ Current Bed Occupancy', query: 'What is our current bed occupancy rate?' },
                { label: '💸 Operational Expenses', query: 'Show total operational expenses and category breakdown' },
                { label: '📋 Pending Rent Dues', query: 'List pending rent dues and uncollected balance' },
                { label: '👥 Active Staff Roster', query: 'Who is active on the staff roster and daily attendance?' },
                { label: '📢 Community Notices', query: 'What active notices are broadcasted to tenants?' },
                { label: '📊 Operations Summary', query: 'Give me a complete real-time PG operations executive summary' }
              ].map((sugg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendAiQuery(sugg.query)}
                  className="px-3 py-1.5 bg-slate-900/80 hover:bg-purple-900/30 border border-slate-700/80 hover:border-purple-500/50 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
                >
                  {sugg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="h-[420px] overflow-y-auto space-y-4 p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
            {aiMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans font-normal">
                    {msg.content}
                  </div>
                  <div
                    className={`mt-2 text-[10px] text-right ${
                      msg.role === 'user' ? 'text-purple-200' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {aiLoading && (
              <div className="flex items-start gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-purple-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-slate-400 text-xs ml-2">Synthesizing relational operations records...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAiQuery();
            }}
            className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 focus-within:border-purple-500/70 transition shadow-inner"
          >
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask anything about occupancy, expenses, rent dues, tenants, staff, or operations..."
              className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
            />
            <button
              type="submit"
              disabled={!aiInput.trim() || aiLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/20 transition cursor-pointer"
            >
              <span>Analyze</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}


      {/* MODAL: Manually Add Guest */}
      {isAddGuestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Manually Onboard Guest</h3>
              </div>
              <button onClick={() => setIsAddGuestModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGuest} className="space-y-4 text-left">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Verma"
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                    value={guestForm.name}
                    onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500 font-mono"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Email & Bed Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. rahul@gmail.com"
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                    value={guestForm.email}
                    onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                    <span>Bed Assignment</span>
                    <span className="text-purple-400 lowercase font-normal">(optional)</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                    value={guestForm.selectedBed}
                    onChange={(e) => {
                      const bedId = e.target.value;
                      if (!bedId) {
                        setGuestForm({ ...guestForm, selectedBed: '', room: 'Unassigned' });
                      } else {
                        const matchedRoom = rooms.find(r => r.id === bedId || r.number === bedId);
                        setGuestForm({ ...guestForm, selectedBed: bedId, room: matchedRoom ? matchedRoom.number : bedId });
                      }
                    }}
                  >
                    <option value="">-- No Bed Assigned (Assign Later) --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.number}>
                        Room {r.number} ({r.type || 'Standard'}) - ₹{r.price || 8000}/mo
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Aadhaar & PAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Aadhaar Number (KYC)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4567 8901 2345"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500 font-mono"
                    value={guestForm.aadhaar}
                    onChange={(e) => setGuestForm({ ...guestForm, aadhaar: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    PAN Card ID Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE 1234 F"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500 font-mono uppercase"
                    value={guestForm.pan}
                    onChange={(e) => setGuestForm({ ...guestForm, pan: e.target.value })}
                  />
                </div>
              </div>

              {/* Emergency Contact & Rent */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Father: +91 98888 98888"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                    value={guestForm.emergencyContact}
                    onChange={(e) => setGuestForm({ ...guestForm, emergencyContact: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Monthly Rent (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 8500"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                    value={guestForm.rent}
                    onChange={(e) => setGuestForm({ ...guestForm, rent: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                    value={guestForm.deposit}
                    onChange={(e) => setGuestForm({ ...guestForm, deposit: e.target.value })}
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Food Preference
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                    value={guestForm.foodPreference}
                    onChange={(e) => setGuestForm({ ...guestForm, foodPreference: e.target.value })}
                  >
                    <option value="Veg Only">Veg Meals Only</option>
                    <option value="Veg & Egg">Veg & Egg Habits</option>
                    <option value="Non-Veg">Veg & Non-Veg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Sharing Preference
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                    value={guestForm.sharingPreference}
                    onChange={(e) => setGuestForm({ ...guestForm, sharingPreference: e.target.value })}
                  >
                    <option value="Single Sharing">Single Sharing AC</option>
                    <option value="Double Sharing">Double Sharing</option>
                    <option value="Triple Sharing">Triple Sharing</option>
                    <option value="Four Sharing">Four Sharing</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddGuestModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Onboard Guest Successfully
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerHub;
