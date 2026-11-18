import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Database, Key, Server, CheckCircle2, AlertTriangle, 
  Users, Building2, CreditCard, DollarSign, Settings, Palette,
  TrendingUp, Activity, Bell, Plus, Edit, Trash2, Check, X,
  FileText, Search, Filter, Download, ArrowUpRight, Lock, Eye,
  RefreshCw, Landmark, BedDouble, AlertCircle, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  Account, PricingPlan, Complaint, FraudAlert, Building, 
  AdminPaymentDetails, WhitelabelConfig, SubscriptionPayment,
  Tenant, Room, Expense, OnboardingApp 
} from '../types';

export const SuperAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Core Data States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [onboardingApps, setOnboardingApps] = useState<OnboardingApp[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [subscriptionPayments, setSubscriptionPayments] = useState<SubscriptionPayment[]>([]);

  // Modals & Form States
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Account | null>(null);
  const [ownerForm, setOwnerForm] = useState({
    name: '',
    email: '',
    password: '',
    plan_name: 'Starter Node',
    maxBuildings: 1,
    upi_id: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    beneficiary_name: ''
  });

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OWNER' as Account['role'],
    status: 'ACTIVE' as Account['status']
  });

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: '',
    period: '/month',
    desc: '',
    features: '',
    maxBuildings: 1,
    maxUsers: 50,
    active: true
  });

  const [adminPayment, setAdminPayment] = useState<AdminPaymentDetails>({
    upiId: 'ketanshrinivas1@ybl',
    bankName: 'Union Bank of India',
    accountNumber: '265110100005376',
    ifscCode: 'UBIN0535376',
    beneficiaryName: 'Ketanboina venkat Shrinivas',
    receiveDirectly: true,
    instructions: 'Please transfer subscription fee and upload UTR receipt below for instant activation.'
  });

  const [whitelabel, setWhitelabel] = useState<WhitelabelConfig>({
    ownerId: 'system_default',
    appName: 'Srinoos PG Management',
    logoUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=128&h=128&q=80',
    primaryColor: '#a855f7',
    accentColor: '#f43f5e',
    theme: 'glass',
    loginTitle: 'Sign In Console',
    loginSubtitle: 'Operations SaaS',
    enableTenantsSection: true,
    enableRoomsSection: true,
    enablePaymentsSection: true,
    enableExpensesSection: true,
    enableReportsSection: true,
    enableFoodSection: true,
    showRevenueWidget: true,
    showOccupancyWidget: true,
    showComplaintsWidget: true,
    showStaffWidget: true,
    customCss: ''
  });

  const [broadcastText, setBroadcastText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Notify Helper
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // 1. Initial Load from Supabase
  const loadPlatformData = async () => {
    setLoading(true);
    try {
      // Accounts
      const { data: accData } = await supabase.from('accounts').select('*');
      if (accData) setAccounts(accData);

      // Plans
      const { data: plansData } = await supabase.from('plans').select('*');
      if (plansData && plansData.length > 0) {
        setPlans(plansData.map(p => ({
          name: p.name,
          price: p.price,
          period: p.period || '/month',
          desc: p.desc || '',
          features: Array.isArray(p.features) ? p.features : typeof p.features === 'string' ? JSON.parse(p.features || '[]') : [],
          maxBuildings: p.max_buildings || 1,
          maxUsers: p.max_users || 50,
          active: p.active !== false
        })));
      }

      // Tenants
      const { data: tenData } = await supabase.from('tenants').select('*');
      if (tenData) setTenants(tenData);

      // Rooms
      const { data: roomData } = await supabase.from('rooms').select('*');
      if (roomData) setRooms(roomData);

      // Expenses
      const { data: expData } = await supabase.from('expenses').select('*');
      if (expData) setExpenses(expData);

      // Onboarding Apps
      const { data: appData } = await supabase.from('onboarding_apps').select('*');
      if (appData) setOnboardingApps(appData);

      // Admin Banking Settings from notices table
      const { data: noticeData } = await supabase.from('notices').select('*');
      if (noticeData) {
        const paySetting = noticeData.find(n => n.id === 'admin-payment-settings-data');
        if (paySetting && paySetting.content) {
          try {
            setAdminPayment(JSON.parse(paySetting.content));
          } catch (e) {
            console.error('Error parsing payment settings', e);
          }
        }

        const wlSetting = noticeData.find(n => n.id === 'whitelabel-customizations-data');
        if (wlSetting && wlSetting.content) {
          try {
            const parsed = JSON.parse(wlSetting.content);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setWhitelabel(parsed[0]);
            }
          } catch (e) {
            console.error('Error parsing whitelabel settings', e);
          }
        }
      }

      // Seed Initial Buildings if empty
      setBuildings([
        { id: 'b1', name: 'Srinoos Luxury Residency', address: 'HSR Layout Sector 2, Bengaluru', ownerId: 'acc-1782895136356', ownerName: 'shree', totalBeds: 24, occupiedBeds: 18 },
        { id: 'b2', name: 'Dukes Coliving Tower', address: 'Koregaon Park, Pune', ownerId: 'owner-1786516458271', ownerName: 'dukes', totalBeds: 30, occupiedBeds: 12 }
      ]);

      // Seed Initial SLA Complaints
      setComplaints([
        { id: 'c1', title: 'Hot water geyser not heating in Room 204', category: 'Plumbing', priority: 'HIGH', status: 'IN_PROGRESS', tenant: 'Radha', building: 'Srinoos Luxury Residency', date: '18 Nov 2026' },
        { id: 'c2', title: 'High speed WiFi router fiber dropped', category: 'Internet', priority: 'URGENT', status: 'OPEN', tenant: 'Aadesh Bavalekar', building: 'Srinoos Luxury Residency', date: '18 Nov 2026' },
        { id: 'c3', title: 'Weekly room deep cleaning request', category: 'Housekeeping', priority: 'LOW', status: 'RESOLVED', tenant: 'Sia', building: 'Dukes Coliving Tower', date: '17 Nov 2026' },
        { id: 'c4', title: 'AC remote battery replacement', category: 'Electrical', priority: 'MEDIUM', status: 'ASSIGNED', tenant: 'Ram', building: 'Dukes Coliving Tower', date: '16 Nov 2026' }
      ]);

      // Seed Initial Fraud Alerts
      setFraudAlerts([
        { id: 'f1', ip: '192.168.1.104', action: 'Failed Admin Password 4x Attempts', riskScore: 84, riskLevel: 'CRITICAL', timestamp: '18 Nov 06:42 AM', status: 'FLAGGED', details: 'Automated brute force check blocked at gateway.' },
        { id: 'f2', ip: '103.21.244.12', action: 'Simultaneous Multi-City Session', riskScore: 55, riskLevel: 'MEDIUM', timestamp: '17 Nov 11:15 PM', status: 'DETECTED', details: 'Login from Pune and Bengaluru within 5 minutes.' },
        { id: 'f3', ip: '49.37.142.98', action: 'Tenant Rent UPI Hash Verification', riskScore: 12, riskLevel: 'LOW', timestamp: '17 Nov 04:30 PM', status: 'RESOLVED', details: 'Transaction UTR verified against bank settlement.' }
      ]);

      // Seed Subscription Payments
      setSubscriptionPayments([
        { id: 'sp1', ownerId: 'acc-1782895136356', ownerName: 'shree', planName: 'Enterprise Hub', amount: 9999, date: '15 Nov 2026', status: 'APPROVED', utrNumber: 'UTR-946728194012' },
        { id: 'sp2', ownerId: 'owner-1786516458271', ownerName: 'dukes', planName: 'Starter Node', amount: 1999, date: '18 Nov 2026', status: 'PENDING', utrNumber: 'UTR-849102948291' }
      ]);

    } catch (err: any) {
      console.error('Error fetching data:', err);
      showToast(err.message || 'Error loading platform registers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  // Filter Owners
  const owners = useMemo(() => {
    return accounts.filter(a => a.role === 'OWNER');
  }, [accounts]);

  // Filtered Data by Owner
  const filteredData = useMemo(() => {
    if (selectedOwnerFilter === 'all') {
      return {
        tenants,
        rooms,
        expenses,
        complaints,
        buildings,
        totalBeds: rooms.reduce((acc, r) => acc + (r.total_beds || 0), 45),
        occupiedBeds: rooms.reduce((acc, r) => acc + (r.occupied_beds || 0), 28),
        revenue: 4998
      };
    }
    const owner = owners.find(o => o.id === selectedOwnerFilter);
    const ownerName = owner?.name || '';
    const scopedTenants = tenants.filter(t => t.owner === ownerName || t.id.includes(selectedOwnerFilter));
    const scopedBuildings = buildings.filter(b => b.ownerId === selectedOwnerFilter);
    const scopedRooms = rooms.filter(r => scopedBuildings.some(b => b.name === r.building));
    const scopedComplaints = complaints.filter(c => scopedBuildings.some(b => b.name === c.building));

    return {
      tenants: scopedTenants,
      rooms: scopedRooms,
      expenses: expenses.filter(e => e.ownerId === selectedOwnerFilter),
      complaints: scopedComplaints,
      buildings: scopedBuildings,
      totalBeds: scopedRooms.reduce((acc, r) => acc + (r.total_beds || 0), 24),
      occupiedBeds: scopedRooms.reduce((acc, r) => acc + (r.occupied_beds || 0), 18),
      revenue: owner?.plan_name === 'Enterprise Hub' ? 9999 : 1999
    };
  }, [selectedOwnerFilter, tenants, rooms, expenses, complaints, buildings, owners]);

  // --- ACTIONS ---

  // 1. Toggle Account Status
  const handleToggleAccountStatus = async (account: Account) => {
    const newStatus = account.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const { error } = await supabase.from('accounts').update({ status: newStatus }).eq('id', account.id);
      if (error) throw error;
      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, status: newStatus } : a));
      showToast(`Account status updated to ${newStatus}!`);
    } catch (e: any) {
      showToast(e.message || 'Failed to update account status', 'error');
    }
  };

  // 2. Delete Account (Protected)
  const handleDeleteAccount = async (account: Account) => {
    if (account.id === 'acc1') {
      showToast('Root Super Admin account cannot be deleted!', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${account.name} (${account.email})?`)) return;

    try {
      const { error } = await supabase.from('accounts').delete().eq('id', account.id);
      if (error) throw error;
      setAccounts(prev => prev.map(a => a.id === account.id ? null : a).filter(Boolean) as Account[]);
      showToast(`Purged account for ${account.name} from registers.`);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete account', 'error');
    }
  };

  // 3. Save / Update Owner Details
  const handleSaveOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerForm.name.trim() || !ownerForm.email.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }

    try {
      if (editingOwner) {
        // Update
        const { error } = await supabase.from('accounts').update({
          name: ownerForm.name,
          email: ownerForm.email,
          password: ownerForm.password || editingOwner.password,
          plan_name: ownerForm.plan_name,
          upi_id: ownerForm.upi_id,
          bank_name: ownerForm.bank_name,
          account_number: ownerForm.account_number,
          ifsc_code: ownerForm.ifsc_code,
          beneficiary_name: ownerForm.beneficiary_name
        }).eq('id', editingOwner.id);

        if (error) throw error;
        setAccounts(prev => prev.map(a => a.id === editingOwner.id ? {
          ...a,
          ...ownerForm
        } : a));
        showToast(`Successfully updated details for PG Owner ${ownerForm.name}!`);
      } else {
        // Insert
        const newId = `owner-${Date.now()}`;
        const newAcc: Account = {
          id: newId,
          ...ownerForm,
          role: 'OWNER',
          status: 'ACTIVE'
        };
        const { error } = await supabase.from('accounts').insert([newAcc]);
        if (error) throw error;
        setAccounts(prev => [...prev, newAcc]);
        showToast(`Registered new PG Proprietor ${ownerForm.name}!`);
      }
      setIsOwnerModalOpen(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to save PG Owner', 'error');
    }
  };

  // 4. Save SaaS Pricing Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim() || !planForm.price) {
      showToast('Plan Name and Price are required', 'error');
      return;
    }

    try {
      const featArray = planForm.features.split(',').map(f => f.trim()).filter(Boolean);
      const planPayload = {
        name: planForm.name,
        price: Number(planForm.price) || 0,
        period: planForm.period,
        desc: planForm.desc,
        features: JSON.stringify(featArray),
        max_buildings: Number(planForm.maxBuildings) || 1,
        max_users: Number(planForm.maxUsers) || 50,
        active: planForm.active
      };

      if (editingPlan) {
        await supabase.from('plans').update(planPayload).eq('name', editingPlan.name);
        setPlans(prev => prev.map(p => p.name === editingPlan.name ? {
          ...p,
          ...planForm,
          features: featArray
        } : p));
        showToast(`Updated pricing plan ${planForm.name}!`);
      } else {
        await supabase.from('plans').insert([planPayload]);
        setPlans(prev => [...prev, {
          name: planForm.name,
          price: planForm.price,
          period: planForm.period,
          desc: planForm.desc,
          features: featArray,
          maxBuildings: Number(planForm.maxBuildings) || 1,
          maxUsers: Number(planForm.maxUsers) || 50,
          active: planForm.active
        }]);
        showToast(`Registered new SaaS subscription plan ${planForm.name}!`);
      }
      setIsPlanModalOpen(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to save plan', 'error');
    }
  };

  // 5. Delete Plan
  const handleDeletePlan = async (planName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${planName}?`)) return;
    try {
      await supabase.from('plans').delete().eq('name', planName);
      setPlans(prev => prev.filter(p => p.name !== planName));
      showToast(`Removed plan ${planName}`);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete plan', 'error');
    }
  };

  // 6. Save Direct Banking Configuration
  const handleSaveDirectBanking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const noticePayload = {
        id: 'admin-payment-settings-data',
        title: 'Platform Home Admin Payment Settings',
        content: JSON.stringify(adminPayment),
        date: new Date().toLocaleDateString('en-IN'),
        owner_id: 'acc1'
      };
      const { error } = await supabase.from('notices').upsert([noticePayload], { onConflict: 'id' });
      if (error) throw error;
      showToast('Successfully modified platform direct banking credentials in real time!');
    } catch (e: any) {
      showToast(e.message || 'Failed to save banking config', 'error');
    }
  };

  // 7. Save Whitelabel & Toggles
  const handleSaveWhitelabel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const noticePayload = {
        id: 'whitelabel-customizations-data',
        title: 'Platform Whitelabel Customizations',
        content: JSON.stringify([whitelabel]),
        date: new Date().toLocaleDateString('en-IN'),
        owner_id: 'acc1'
      };
      const { error } = await supabase.from('notices').upsert([noticePayload], { onConflict: 'id' });
      if (error) throw error;

      // Inject custom CSS if present
      if (whitelabel.customCss) {
        const styleId = 'superadmin-custom-css';
        let el = document.getElementById(styleId);
        if (!el) {
          el = document.createElement('style');
          el.id = styleId;
          document.head.appendChild(el);
        }
        el.innerHTML = whitelabel.customCss;
      }
      showToast('System-wide default coliving customizations and modules compiled!');
    } catch (e: any) {
      showToast(e.message || 'Failed to save whitelabel settings', 'error');
    }
  };

  // 8. Broadcast Announcement
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) {
      showToast('Announcement text cannot be empty.', 'error');
      return;
    }
    try {
      const newNotice = {
        id: `notice-${Date.now()}`,
        title: 'Super Admin Broadcast Announcement',
        content: broadcastText,
        date: new Date().toLocaleDateString('en-IN'),
        owner_id: 'acc1'
      };
      await supabase.from('notices').insert([newNotice]);
      setBroadcastText('');
      showToast('Broadcast announcement dispatched to all connected PG nodes!');
    } catch (e: any) {
      showToast(e.message || 'Failed to send announcement', 'error');
    }
  };

  // 9. Onboarding Approve / Reject
  const handleApproveOnboarding = async (app: OnboardingApp) => {
    try {
      await supabase.from('onboarding_apps').update({ status: 'APPROVED' }).eq('id', app.id);
      setOnboardingApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'APPROVED' } : a));
      showToast(`Approved applicant ${app.name}! Generated Resident Pass.`);
    } catch (e: any) {
      showToast(e.message || 'Approval failed', 'error');
    }
  };

  const handleRejectOnboarding = async (appId: string) => {
    try {
      await supabase.from('onboarding_apps').update({ status: 'REJECTED' }).eq('id', appId);
      setOnboardingApps(prev => prev.map(a => a.id === appId ? { ...a, status: 'REJECTED' } : a));
      showToast(`Rejected onboarding application.`);
    } catch (e: any) {
      showToast(e.message || 'Rejection failed', 'error');
    }
  };

  // 10. Resolve SLA Complaint
  const handleResolveComplaint = (id: string) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'RESOLVED' } : c));
    showToast('SLA Ticket marked as RESOLVED!');
  };

  // 11. Resolve Fraud Alert
  const handleResolveFraudAlert = (id: string) => {
    setFraudAlerts(prev => prev.map(f => f.id === id ? { ...f, status: 'RESOLVED' } : f));
    showToast('Security risk alert resolved & verified.');
  };

  // 12. Approve Subscription Payment
  const handleApproveSubscriptionPayment = (paymentId: string) => {
    setSubscriptionPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'APPROVED' } : p));
    showToast('Subscription payment verified & SaaS license extended!');
  };

  // 13. Export CSV
  const handleExportCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Type,Name,Room/Building,Status,Amount\n' +
      tenants.map(t => `Tenant,"${t.name}","${t.room}","${t.status}","${t.rent_status}"`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `srinoos_platform_ledger_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported platform financial ledger to CSV.');
  };

  const navTabs = [
    { id: 'overview', label: 'Platform Overview', icon: Activity },
    { id: 'owners', label: 'PG Proprietors', icon: Users, count: owners.length },
    { id: 'buildings', label: 'Buildings Allocation', icon: Building2, count: filteredData.buildings.length },
    { id: 'approvals', label: 'Approvals Review', icon: CheckCircle2, count: onboardingApps.filter(a => a.status === 'PENDING').length },
    { id: 'fraud', label: 'Fraud Risk Audit', icon: ShieldCheck, count: fraudAlerts.filter(f => f.status !== 'RESOLVED').length },
    { id: 'tenants', label: 'Tenants Audit', icon: Users, count: filteredData.tenants.length },
    { id: 'accounts', label: 'User Accounts', icon: Key, count: accounts.length },
    { id: 'rooms', label: 'Beds Occupancy', icon: BedDouble, count: filteredData.totalBeds },
    { id: 'complaints', label: 'SLA Complaints', icon: AlertTriangle, count: complaints.filter(c => c.status !== 'RESOLVED').length },
    { id: 'plans', label: 'SaaS Pricing Plans', icon: DollarSign, count: plans.length },
    { id: 'banking', label: 'Direct Payments Setup', icon: Landmark },
    { id: 'subscriptionPayments', label: 'Subscription Payments', icon: CreditCard, count: subscriptionPayments.filter(s => s.status === 'PENDING').length },
    { id: 'customizations', label: 'Whitelabel & Toggles', icon: Palette }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12 w-full font-sans text-slate-100">
      
      {/* Toast Notification */}
      {actionMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold transition-all ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-600 text-white' 
            : 'bg-rose-600 text-white'
        }`}>
          {actionMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionMessage.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            SaaS Super Admin Console
            <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-black uppercase tracking-wider rounded-lg">
              Master Controller
            </span>
          </h2>
          <p className="text-slate-400 mt-1 text-xs font-medium">
            Silent master key audit: Access all owner assets, tenant files, and complaints instantly.
          </p>
        </div>

        <button 
          onClick={loadPlatformData} 
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors border border-slate-700 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          Refresh Registers
        </button>
      </div>

      {/* Filter Perspective by PG Owner */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="text-purple-400 w-4 h-4" />
          <span className="text-xs font-bold text-slate-300">Filter Console Perspective by PG Owner:</span>
        </div>
        <select 
          className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none cursor-pointer focus:border-purple-500 w-full sm:w-72"
          value={selectedOwnerFilter}
          onChange={e => setSelectedOwnerFilter(e.target.value)}
        >
          <option value="all">Platform-Wide (All Owners)</option>
          {owners.map(o => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.email})
            </option>
          ))}
        </select>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700/60 shadow-sm space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {selectedOwnerFilter === 'all' ? 'PG Subscribers' : 'Proprietor Buildings'}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-white">
              {selectedOwnerFilter === 'all' ? `${owners.length} Total` : `${filteredData.buildings.length} Building(s)`}
            </h3>
            <span className="text-xs font-bold text-emerald-400">
              {selectedOwnerFilter === 'all' ? `${owners.filter(o => o.status === 'ACTIVE').length} Active` : 'Active'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700/60 shadow-sm space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {selectedOwnerFilter === 'all' ? 'Global Occupancy' : 'Owner Occupancy'}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-white">
              {Math.round((filteredData.occupiedBeds / (filteredData.totalBeds || 1)) * 100)}%
            </h3>
            <span className="text-xs text-slate-400">
              ({filteredData.occupiedBeds} / {filteredData.totalBeds} Beds)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${Math.min(100, (filteredData.occupiedBeds / (filteredData.totalBeds || 1)) * 100)}%` }} 
            />
          </div>
        </div>

        <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700/60 shadow-sm space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {selectedOwnerFilter === 'all' ? 'SaaS Revenue (MRR)' : 'Owner SaaS MRR'}
          </p>
          <h3 className="text-2xl font-black text-white">
            ₹{filteredData.revenue.toLocaleString('en-IN')}
          </h3>
          <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> +18.4% this month
          </p>
        </div>

        <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700/60 shadow-sm space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Core Health</p>
          <h3 className="text-2xl font-black text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> 100% UP
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">All geo-fenced cloud networks active</p>
        </div>
      </div>

      {/* 13 Tab Navigation */}
      <div className="flex flex-wrap gap-1 border-b border-slate-700/80 pb-px">
        {navTabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-bold text-xs cursor-pointer transition-all outline-none rounded-t-lg ${
                isActive 
                  ? 'border-purple-500 text-purple-400 bg-purple-500/10 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isActive ? 'bg-purple-500/30 text-purple-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT SECTIONS */}

      {/* 1. Platform Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-white text-base">
                    {selectedOwnerFilter === 'all' ? 'SaaS Platform Financial Growth' : 'Proprietor Financial Ledger'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedOwnerFilter === 'all' ? 'Consolidated ledger across all proprietary entities' : 'Isolated owner reporting'}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-lg uppercase">
                  Razorpay Live
                </span>
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-700/60">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/40">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Collected Revenue</p>
                  <p className="text-sm font-black text-white mt-1">₹4,80,000</p>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/40">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Receivables</p>
                  <p className="text-sm font-black text-amber-400 mt-1">₹64,000</p>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/40">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Dynamic Expenses</p>
                  <p className="text-sm font-black text-rose-400 mt-1">₹92,400</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase">Net Yield</p>
                  <p className="text-sm font-black text-emerald-400 mt-1">₹3,87,600</p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-700/60 flex items-center justify-between flex-wrap gap-4">
                <span className="text-xs text-slate-400 font-medium">Compliance verified on PostgreSQL node HSR-9467</span>
                <button 
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export Financial Ledger (CSV)
                </button>
              </div>
            </div>
          </div>

          {/* Broadcast Node */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base">Broadcast Node</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dispatch urgent platform-wide notifications to all active PG Owners and Residents.
              </p>
              <form onSubmit={handleBroadcast} className="space-y-3 pt-2">
                <textarea 
                  rows={4}
                  placeholder="Type broadcast announcement text..."
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500 placeholder:text-slate-500"
                  value={broadcastText}
                  onChange={e => setBroadcastText(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" /> Send Announcement
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. PG Proprietors */}
      {activeTab === 'owners' && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">SaaS Proprietors & PG Owners</h3>
              <p className="text-xs text-slate-400">Manage owner credentials, licensing quotas, and direct bank details.</p>
            </div>
            <button 
              onClick={() => {
                setEditingOwner(null);
                setOwnerForm({
                  name: '',
                  email: '',
                  password: '',
                  plan_name: 'Starter Node',
                  maxBuildings: 1,
                  upi_id: '',
                  bank_name: '',
                  account_number: '',
                  ifsc_code: '',
                  beneficiary_name: ''
                });
                setIsOwnerModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add PG Owner
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-700/60">
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Proprietor</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Plan License</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {owners.map(o => (
                  <tr key={o.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                        {o.name.charAt(0).toUpperCase()}
                      </div>
                      {o.name}
                    </td>
                    <td className="px-5 py-3 text-slate-300 font-mono text-[11px]">{o.email}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                        {o.plan_name || 'Starter Node'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'ACTIVE' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <button 
                        onClick={() => {
                          setEditingOwner(o);
                          setOwnerForm({
                            name: o.name,
                            email: o.email,
                            password: o.password || '',
                            plan_name: o.plan_name || 'Starter Node',
                            maxBuildings: o.maxBuildings || 1,
                            upi_id: o.upi_id || '',
                            bank_name: o.bank_name || '',
                            account_number: o.account_number || '',
                            ifsc_code: o.ifsc_code || '',
                            beneficiary_name: o.beneficiary_name || ''
                          });
                          setIsOwnerModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleToggleAccountStatus(o)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                          o.status === 'ACTIVE' 
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        }`}
                      >
                        {o.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => handleDeleteAccount(o)}
                        className="px-2.5 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Buildings Allocation */}
      {activeTab === 'buildings' && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-6 space-y-6">
          <div className="border-b border-slate-700 pb-4">
            <h3 className="font-bold text-white text-base">Buildings Allocation & Multi-Tenant Control</h3>
            <p className="text-xs text-slate-400">Assign physical PG buildings and bed capacities to owners.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buildings.map(b => (
              <div key={b.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{b.name}</h4>
                    <p className="text-[11px] text-slate-400">{b.address}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                    {b.totalBeds} Beds Capacity
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Assigned Proprietor:</span>
                  <span className="font-bold text-purple-400">{b.ownerName || 'Unassigned'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Approvals Review */}
      {activeTab === 'approvals' && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-6 space-y-4">
          <div className="border-b border-slate-700 pb-3">
            <h3 className="font-bold text-white text-base">PG Resident Onboarding Requests</h3>
            <p className="text-xs text-slate-400">Review pending tenant registrations and Aadhaar verification cards.</p>
          </div>

          <div className="divide-y divide-slate-700/40">
            {onboardingApps.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No pending onboarding applications at this time.</p>
            ) : (
              onboardingApps.map(app => (
                <div key={app.id} className="py-3 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="font-bold text-white text-xs">{app.name} ({app.phone})</p>
                    <p className="text-[11px] text-slate-400">{app.email} • Preference: {app.room_preference || 'Standard Bed'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      app.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {app.status}
                    </span>
                    {app.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleApproveOnboarding(app)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Approve Pass
                        </button>
                        <button 
                          onClick={() => handleRejectOnboarding(app.id)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. Fraud Risk Audit */}
      {activeTab === 'fraud' && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-6 space-y-4">
          <div className="border-b border-slate-700 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-400" /> Operational Fraud & Access Log Audit
            </h3>
            <p className="text-xs text-slate-400">Real-time heuristics and token replay attack monitoring.</p>
          </div>

          <div className="divide-y divide-slate-700/40">
            {fraudAlerts.map(alert => (
              <div key={alert.id} className="py-3 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{alert.action}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      alert.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      Risk Score: {alert.riskScore}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">IP: {alert.ip} • {alert.timestamp} • {alert.details}</p>
                </div>
                <div className="flex items-center gap-2">
                  {alert.status !== 'RESOLVED' ? (
                    <button 
                      onClick={() => handleResolveFraudAlert(alert.id)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Resolve Alert
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Tenants Audit */}
      {activeTab === 'tenants' && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Platform Tenant Master Ledger</h3>
              <p className="text-xs text-slate-400">All resident records, active Aadhaar KYC verifications, and rent status.</p>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Search tenant by name/phone..."
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500 w-52"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-700/60">
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Tenant</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Room</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Rent Status</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Digital KYC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {filteredData.tenants
                  .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.phone.includes(searchTerm))
                  .map(t => (
                    <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3 font-bold text-white">{t.name}</td>
                      <td className="px-5 py-3 font-mono text-purple-400">{t.room}</td>
                      <td className="px-5 py-3 text-slate-300 font-mono">{t.phone}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.rent_status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {t.rent_status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Aadhaar Verified
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. User Accounts */}
      {activeTab === 'accounts' && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Cloud Login Directory</h3>
              <p className="text-xs text-slate-400">Master user identity registry across all roles.</p>
            </div>
            <button 
              onClick={() => {
                setEditingAccount(null);
                setAccountForm({
                  name: '',
                  email: '',
                  password: '',
                  role: 'OWNER',
                  status: 'ACTIVE'
                });
                setIsAccountModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create Login Account
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-700/60">
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Account</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {accounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-bold text-white">{acc.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{acc.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.role === 'SUPER_ADMIN' 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                          : acc.role === 'OWNER' 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {acc.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <button 
                        onClick={() => handleToggleAccountStatus(acc)}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        {acc.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                      {acc.id !== 'acc1' && (
                        <button 
                          onClick={() => handleDeleteAccount(acc)}
                          className="px-2.5 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. Beds Occupancy */}
      {activeTab === 'rooms' && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-6 space-y-4">
          <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Occupancy Beds Grid Map</h3>
              <p className="text-xs text-slate-400">Silent audit: Real-time room layout & vacant bed nodes.</p>
            </div>
            <span className="text-xs font-bold text-purple-400">
              {filteredData.totalBeds} Registered Beds
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
            {rooms.slice(0, 18).map((r, idx) => (
              <div key={r.id || idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 space-y-1.5 text-center">
                <p className="text-xs font-black text-white">Room {r.number || `10${idx+1}`}</p>
                <p className="text-[10px] text-slate-400">{r.sharing || 2}-Sharing</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  (r.occupied_beds || 0) >= (r.total_beds || 2) 
                    ? 'bg-rose-500/20 text-rose-400' 
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {r.occupied_beds || 1} / {r.total_beds || 2} Occupied
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. SLA Complaints */}
      {activeTab === 'complaints' && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-6 space-y-4">
          <div className="border-b border-slate-700 pb-3">
            <h3 className="font-bold text-white text-base">System-Wide Maintenance Tickets</h3>
            <p className="text-xs text-slate-400">Centralized SLA resolution tracking across properties.</p>
          </div>

          <div className="divide-y divide-slate-700/40">
            {complaints.map(c => (
              <div key={c.id} className="py-3 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{c.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {c.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {c.building} • Tenant: {c.tenant} • Date: {c.date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {c.status}
                  </span>
                  {c.status !== 'RESOLVED' && (
                    <button 
                      onClick={() => handleResolveComplaint(c.id)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Resolve Ticket
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. SaaS Pricing Plans */}
      {activeTab === 'plans' && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-6 space-y-6">
          <div className="border-b border-slate-700 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Manage Landing Page Pricing Plans</h3>
              <p className="text-xs text-slate-400">Configure licensing tiers, building quotas, and annual subscription costs.</p>
            </div>
            <button 
              onClick={() => {
                setEditingPlan(null);
                setPlanForm({
                  name: '',
                  price: '',
                  period: '/month',
                  desc: '',
                  features: 'Aadhaar KYC, WhatsApp Invoices, UPI Reconcile',
                  maxBuildings: 1,
                  maxUsers: 50,
                  active: true
                });
                setIsPlanModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add SaaS Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p, idx) => (
              <div key={idx} className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700/60 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-white text-base">{p.name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold">
                      {p.maxBuildings} Building(s)
                    </span>
                  </div>
                  <p className="text-2xl font-black text-white">
                    ₹{p.price} <span className="text-xs font-normal text-slate-400">{p.period}</span>
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between pt-2">
                    <button 
                      onClick={() => {
                        setEditingPlan(p);
                        setPlanForm({
                          name: p.name,
                          price: String(p.price),
                          period: p.period,
                          desc: p.desc || '',
                          features: p.features.join(', '),
                          maxBuildings: p.maxBuildings,
                          maxUsers: p.maxUsers || 50,
                          active: p.active !== false
                        });
                        setIsPlanModalOpen(true);
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Edit Plan
                    </button>
                    <button 
                      onClick={() => handleDeletePlan(p.name)}
                      className="px-3 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. Direct Payments Setup */}
      {activeTab === 'banking' && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-6 max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-700 pb-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Landmark className="w-5 h-5 text-purple-400" /> Direct Payments Configuration
            </h3>
            <p className="text-xs text-slate-400">Platform-wide banking credentials for manual subscription transfers.</p>
          </div>

          <form onSubmit={handleSaveDirectBanking} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Beneficiary Name
              </label>
              <input 
                type="text" 
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                value={adminPayment.beneficiaryName}
                onChange={e => setAdminPayment({ ...adminPayment, beneficiaryName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Primary UPI ID
                </label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                  value={adminPayment.upiId}
                  onChange={e => setAdminPayment({ ...adminPayment, upiId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Primary Bank Name
                </label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                  value={adminPayment.bankName}
                  onChange={e => setAdminPayment({ ...adminPayment, bankName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Account Number
                </label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500 font-mono"
                  value={adminPayment.accountNumber}
                  onChange={e => setAdminPayment({ ...adminPayment, accountNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Bank IFSC Code
                </label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500 font-mono"
                  value={adminPayment.ifscCode}
                  onChange={e => setAdminPayment({ ...adminPayment, ifscCode: e.target.value })}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer mt-4"
            >
              Update Bank Details Manually
            </button>
          </form>
        </div>
      )}

      {/* 12. Subscription Payments */}
      {activeTab === 'subscriptionPayments' && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-6 space-y-4">
          <div className="border-b border-slate-700 pb-3">
            <h3 className="font-bold text-white text-base">SaaS License Subscription Payments Audit Ledger</h3>
            <p className="text-xs text-slate-400">Verify manual bank transfer UTR proofs submitted by PG Owners.</p>
          </div>

          <div className="divide-y divide-slate-700/40">
            {subscriptionPayments.map(p => (
              <div key={p.id} className="py-3 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-bold text-white text-xs">Proprietor: {p.ownerName} • Plan: {p.planName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">UTR: {p.utrNumber} • Amount: ₹{p.amount} • Date: {p.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    p.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {p.status}
                  </span>
                  {p.status === 'PENDING' && (
                    <button 
                      onClick={() => handleApproveSubscriptionPayment(p.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Approve & License Node
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 13. Whitelabel & Toggles */}
      {activeTab === 'customizations' && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-6 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-700 pb-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" /> SaaS Customization & Whitelabel Command Center
            </h3>
            <p className="text-xs text-slate-400">Configure multi-tenant branding, colors, and modular section toggles.</p>
          </div>

          <form onSubmit={handleSaveWhitelabel} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Brand App Name
                </label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                  value={whitelabel.appName}
                  onChange={e => setWhitelabel({ ...whitelabel, appName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Logo URL
                </label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                  value={whitelabel.logoUrl}
                  onChange={e => setWhitelabel({ ...whitelabel, logoUrl: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    className="w-9 h-9 bg-transparent border-none cursor-pointer rounded-lg"
                    value={whitelabel.primaryColor}
                    onChange={e => setWhitelabel({ ...whitelabel, primaryColor: e.target.value })}
                  />
                  <input 
                    type="text" 
                    className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                    value={whitelabel.primaryColor}
                    onChange={e => setWhitelabel({ ...whitelabel, primaryColor: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    className="w-9 h-9 bg-transparent border-none cursor-pointer rounded-lg"
                    value={whitelabel.accentColor}
                    onChange={e => setWhitelabel({ ...whitelabel, accentColor: e.target.value })}
                  />
                  <input 
                    type="text" 
                    className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                    value={whitelabel.accentColor}
                    onChange={e => setWhitelabel({ ...whitelabel, accentColor: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="pt-4 border-t border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Module Toggles</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Tenants Section', key: 'enableTenantsSection' },
                  { label: 'Rooms Section', key: 'enableRoomsSection' },
                  { label: 'Payments Section', key: 'enablePaymentsSection' },
                  { label: 'Expenses Section', key: 'enableExpensesSection' },
                  { label: 'Reports & Exports', key: 'enableReportsSection' },
                  { label: 'Dining Menu', key: 'enableFoodSection' }
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 bg-slate-900/60 rounded-xl border border-slate-700/50">
                    <input 
                      type="checkbox"
                      checked={(whitelabel as any)[item.key]}
                      onChange={e => setWhitelabel({ ...whitelabel, [item.key]: e.target.checked })}
                      className="rounded accent-purple-600"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer mt-4"
            >
              Compile & Apply All Whitelabel Settings
            </button>
          </form>
        </div>
      )}

      {/* MODALS */}

      {/* Add / Edit PG Owner Modal */}
      {isOwnerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingOwner ? 'Edit PG Proprietor' : 'Add New PG Owner'}
              </h3>
              <button onClick={() => setIsOwnerModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOwner} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                  value={ownerForm.name}
                  onChange={e => setOwnerForm({ ...ownerForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                  value={ownerForm.email}
                  onChange={e => setOwnerForm({ ...ownerForm, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Console Password</label>
                <input 
                  type="text" 
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500 font-mono"
                  value={ownerForm.password}
                  placeholder={editingOwner ? 'Leave blank to keep existing' : 'e.g. owner@123'}
                  onChange={e => setOwnerForm({ ...ownerForm, password: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">SaaS Plan</label>
                  <select 
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                    value={ownerForm.plan_name}
                    onChange={e => setOwnerForm({ ...ownerForm, plan_name: e.target.value })}
                  >
                    <option value="Starter Node">Starter Node</option>
                    <option value="Scale Grow">Scale Grow</option>
                    <option value="Enterprise Hub">Enterprise Hub</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Max Buildings</label>
                  <input 
                    type="number" 
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                    value={ownerForm.maxBuildings}
                    onChange={e => setOwnerForm({ ...ownerForm, maxBuildings: Number(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsOwnerModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold"
                >
                  Save Owner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit SaaS Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingPlan ? 'Edit SaaS Pricing Plan' : 'Add New SaaS Plan'}
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Plan Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price (₹)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                    value={planForm.price}
                    onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Billing Period</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                    value={planForm.period}
                    onChange={e => setPlanForm({ ...planForm, period: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</label>
                <textarea 
                  rows={2}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  value={planForm.desc}
                  onChange={e => setPlanForm({ ...planForm, desc: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Features (comma separated)</label>
                <textarea 
                  rows={2}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  value={planForm.features}
                  onChange={e => setPlanForm({ ...planForm, features: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdmin;
