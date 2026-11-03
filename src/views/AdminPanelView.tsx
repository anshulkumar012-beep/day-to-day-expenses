import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Layers,
  Settings,
  Bell,
  Activity,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Ban,
  RotateCcw,
  Plus,
  Pencil,
  Archive,
  Trash2,
  RefreshCw,
  LogOut,
  Sparkles,
  Database,
  Radio,
  ExternalLink,
  ChevronRight,
  Sliders,
  DollarSign,
  Tag,
  Check,
  X,
  FileText,
  Clock,
  Info,
} from 'lucide-react';
import {
  CustomerUser,
  GlobalCategory,
  AppConfig,
  PlatformAnnouncement,
  AdminLog,
  Category,
  SupportedCurrency,
  SupportedLanguage,
} from '../types';
import { CloudStorageService, SUPER_ADMIN_EMAIL, DEFAULT_APP_CONFIG } from '../services/cloudStorage';
import { CategoryIcon } from '../components/CategoryIcon';
import { User as FirebaseUser } from 'firebase/auth';

interface AdminPanelViewProps {
  adminUser: FirebaseUser;
  onSwitchToCustomerView: () => void;
  onSignOut: () => void;
  starterCategories: Category[];
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  adminUser,
  onSwitchToCustomerView,
  onSignOut,
  starterCategories,
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'customers' | 'categories' | 'config' | 'announcements' | 'logs'
  >('dashboard');

  // Real-time Platform States
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [globalCategories, setGlobalCategories] = useState<GlobalCategory[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);

  // Local UI States
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Category Modals & Filters
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<'expense' | 'income'>('expense');
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GlobalCategory | null>(null);
  const [catFormName, setCatFormName] = useState('');
  const [catFormNameHi, setCatFormNameHi] = useState('');
  const [catFormType, setCatFormType] = useState<'expense' | 'income'>('expense');
  const [catFormIcon, setCatFormIcon] = useState('Tag');
  const [catFormColor, setCatFormColor] = useState('#10b981');

  // Announcement Modal
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annType, setAnnType] = useState<'info' | 'warning' | 'update' | 'critical'>('info');

  // Customer Action Modal
  const [actionCustomer, setActionCustomer] = useState<CustomerUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // 1. Initial Listeners Setup
  useEffect(() => {
    // Subscribe to Global Categories
    const unsubCats = CloudStorageService.subscribeToGlobalCategories((cats) => {
      setGlobalCategories(cats);
    });

    // Subscribe to App Config
    const unsubConfig = CloudStorageService.subscribeToAppConfig((cfg) => {
      setAppConfig(cfg);
    });

    // Subscribe to Announcements
    const unsubAnn = CloudStorageService.subscribeToAnnouncements((anns) => {
      setAnnouncements(anns);
    });

    // Subscribe to Admin Logs
    const unsubLogs = CloudStorageService.subscribeToAdminLogs((logs) => {
      setAdminLogs(logs);
    });

    // Fetch Customers
    loadCustomers();

    return () => {
      unsubCats();
      unsubConfig();
      unsubAnn();
      unsubLogs();
    };
  }, []);

  const loadCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const users = await CloudStorageService.fetchCustomers();
      setCustomers(users);
    } catch (e: any) {
      console.warn('Failed to load customers:', e);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Seed default categories if none exist
  const handleSeedCategories = async () => {
    try {
      const count = await CloudStorageService.seedStarterGlobalCategories(adminUser, starterCategories);
      if (count > 0) {
        showToast(`Successfully seeded ${count} global categories across all customers!`);
      } else {
        showToast('Global categories already exist.');
      }
    } catch (e: any) {
      showToast('Seeding error: ' + e.message);
    }
  };

  // Toggle Customer Suspension
  const handleConfirmCustomerStatusChange = async () => {
    if (!actionCustomer) return;
    const newStatus = actionCustomer.status === 'active' ? 'suspended' : 'active';
    try {
      await CloudStorageService.setUserStatus(
        adminUser,
        actionCustomer.uid,
        actionCustomer.email,
        newStatus,
        suspendReason
      );
      setActionCustomer(null);
      setSuspendReason('');
      await loadCustomers();
      showToast(`Customer account successfully ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}`);
    } catch (e: any) {
      showToast('Error changing customer status: ' + e.message);
    }
  };

  // Save / Update Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormName.trim()) return;

    const catId = editingCategory ? editingCategory.id : `cat_glob_${Date.now()}`;
    const payload: GlobalCategory = {
      id: catId,
      name: catFormName.trim(),
      nameHi: catFormNameHi.trim() || undefined,
      type: catFormType,
      icon: catFormIcon,
      color: catFormColor,
      isArchived: editingCategory ? editingCategory.isArchived : false,
      order: editingCategory?.order ?? globalCategories.length,
    };

    try {
      await CloudStorageService.saveGlobalCategory(adminUser, payload);
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCatFormName('');
      setCatFormNameHi('');
      showToast('Global category saved and propagated to all customer applications!');
    } catch (e: any) {
      showToast('Error saving category: ' + e.message);
    }
  };

  const handleToggleArchiveCategory = async (cat: GlobalCategory) => {
    try {
      await CloudStorageService.toggleArchiveGlobalCategory(
        adminUser,
        cat.id,
        cat.name,
        !cat.isArchived
      );
      showToast(
        cat.isArchived
          ? `Category [${cat.name}] restored to customer choices`
          : `Category [${cat.name}] archived (Historical customer data remains safe)`
      );
    } catch (e: any) {
      showToast('Error: ' + e.message);
    }
  };

  const handleDeleteCategory = async (cat: GlobalCategory) => {
    if (!window.confirm(`Permanently delete category definition "${cat.name}"? (Past customer records will keep their existing values).`)) {
      return;
    }
    try {
      await CloudStorageService.deleteGlobalCategory(adminUser, cat.id, cat.name);
      showToast(`Category [${cat.name}] definition deleted`);
    } catch (e: any) {
      showToast('Error: ' + e.message);
    }
  };

  // App Config Handlers
  const handleToggleMaintenance = async () => {
    const nextState = !appConfig.maintenanceMode.enabled;
    const updated: AppConfig = {
      ...appConfig,
      maintenanceMode: {
        ...appConfig.maintenanceMode,
        enabled: nextState,
        startedAt: nextState ? new Date().toISOString() : undefined,
      },
    };
    try {
      await CloudStorageService.saveAppConfig(adminUser, updated);
      showToast(
        nextState
          ? 'Maintenance mode ACTIVATED: Customers see maintenance screen'
          : 'Maintenance mode DEACTIVATED: Customers have full app access'
      );
    } catch (e: any) {
      showToast('Config error: ' + e.message);
    }
  };

  const handleUpdateFeature = async (featureKey: keyof AppConfig['features'], value: boolean) => {
    const updated: AppConfig = {
      ...appConfig,
      features: {
        ...appConfig.features,
        [featureKey]: value,
      },
    };
    try {
      await CloudStorageService.saveAppConfig(adminUser, updated);
      showToast(`Feature [${String(featureKey)}] ${value ? 'enabled' : 'disabled'} globally`);
    } catch (e: any) {
      showToast('Config error: ' + e.message);
    }
  };

  // Announcement Handlers
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    const payload: PlatformAnnouncement = {
      id: `ann_${Date.now()}`,
      title: annTitle.trim(),
      message: annMessage.trim(),
      type: annType,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await CloudStorageService.saveAnnouncement(adminUser, payload);
      setIsAnnouncementModalOpen(false);
      setAnnTitle('');
      setAnnMessage('');
      showToast('Announcement broadcasted to all customer applications!');
    } catch (e: any) {
      showToast('Broadcast error: ' + e.message);
    }
  };

  const handleDeleteAnnouncement = async (ann: PlatformAnnouncement) => {
    try {
      await CloudStorageService.deleteAnnouncement(adminUser, ann.id, ann.title);
      showToast('Announcement removed');
    } catch (e: any) {
      showToast('Error: ' + e.message);
    }
  };

  // Metrics Calculations
  const totalCustomers = customers.length;
  const activeCustomersCount = customers.filter((c) => c.status !== 'suspended').length;
  const suspendedCustomersCount = customers.filter((c) => c.status === 'suspended').length;
  const activeAnnouncementsCount = announcements.filter((a) => a.isActive).length;
  const activeGlobalCategoriesCount = globalCategories.filter((c) => !c.isArchived).length;
  const archivedGlobalCategoriesCount = globalCategories.filter((c) => c.isArchived).length;

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.displayName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.uid.toLowerCase().includes(customerSearch.toLowerCase());
    const matchesStatus =
      customerStatusFilter === 'all' ||
      (customerStatusFilter === 'active' && c.status !== 'suspended') ||
      (customerStatusFilter === 'suspended' && c.status === 'suspended');
    return matchesSearch && matchesStatus;
  });

  const filteredCategories = globalCategories.filter((c) => {
    const matchesType = c.type === categoryTypeFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      (c.nameHi && c.nameHi.toLowerCase().includes(categorySearch.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Super Admin Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Shield className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Super Admin Console
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Root Admin
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>{adminUser.email}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-400 font-medium">Firestore Live</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions: Switch to Customer App & Sign Out */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchToCustomerView}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Open Customer Expense Tracker View"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Customer App View</span>
            </button>

            <button
              onClick={onSignOut}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-6 p-4 sm:p-6">
        {/* Sidebar Nav */}
        <nav className="w-full md:w-64 flex-shrink-0 flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 flex-shrink-0" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>Customer Accounts</span>
            <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {totalCustomers}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 flex-shrink-0" />
            <span>Global Categories</span>
            <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {globalCategories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'config'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 flex-shrink-0" />
            <span>App Config & Maintenance</span>
            {appConfig.maintenanceMode.enabled && (
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-auto animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Bell className="w-4 h-4 flex-shrink-0" />
            <span>Announcements</span>
            {activeAnnouncementsCount > 0 && (
              <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/20 text-sky-300">
                {activeAnnouncementsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>Audit Activity Logs</span>
          </button>

          {/* Quick Maintenance Status Box in Sidebar */}
          <div className="mt-auto hidden md:block pt-4 border-t border-slate-800/80">
            <div className={`p-3 rounded-2xl border text-xs ${
              appConfig.maintenanceMode.enabled
                ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <div className="font-bold flex items-center justify-between">
                <span>Maintenance Mode</span>
                <span className={`w-2 h-2 rounded-full ${appConfig.maintenanceMode.enabled ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
              </div>
              <p className="text-[11px] mt-1 text-slate-400">
                {appConfig.maintenanceMode.enabled ? 'Active (Restricted)' : 'Inactive (Normal)'}
              </p>
              <button
                onClick={handleToggleMaintenance}
                className="mt-2 w-full py-1.5 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer"
              >
                {appConfig.maintenanceMode.enabled ? 'Disable Maintenance' : 'Enable Maintenance'}
              </button>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Total Customers</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{totalCustomers}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Google accounts registered</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Active Accounts</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400">{activeCustomersCount}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Full platform access</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Suspended</span>
                    <Ban className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-rose-400">{suspendedCustomersCount}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Mutations blocked by rules</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Global Categories</span>
                    <Layers className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-2xl font-black text-teal-300">
                    {activeGlobalCategoriesCount}
                    <span className="text-xs font-normal text-slate-500 ml-1">
                      ({archivedGlobalCategoriesCount} archived)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Auto-synced to all apps</div>
                </div>
              </div>

              {/* System State Banner */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-white">System Security & Database Operational</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Multi-user isolation active under <code className="text-emerald-400 text-[11px]">users/{'{uid}'}</code>. Server-side security rules enforced.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {globalCategories.length === 0 && (
                    <button
                      onClick={handleSeedCategories}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Seed Global Categories</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('announcements')}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-sky-400" />
                    <span>Post Announcement</span>
                  </button>
                </div>
              </div>

              {/* Recent Customers Overview */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Recent Customer Registrations</h3>
                    <p className="text-xs text-slate-400">Latest Google accounts accessing the platform</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('customers')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all customers</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {customers.slice(0, 5).map((cust) => (
                    <div key={cust.uid} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {cust.photoURL ? (
                          <img
                            src={cust.photoURL}
                            alt={cust.displayName}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0">
                            {cust.displayName[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-200 truncate flex items-center gap-2">
                            <span>{cust.displayName}</span>
                            {cust.email === SUPER_ADMIN_EMAIL && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Super Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{cust.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cust.status === 'suspended'
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                              : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {cust.status === 'suspended' ? 'Suspended' : 'Active'}
                        </span>
                        <span className="text-[11px] text-slate-500 hidden sm:inline">
                          {cust.lastLoginAt ? new Date(cust.lastLoginAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {customers.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No customer accounts loaded yet. When users sign in, they will appear here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMER MANAGEMENT */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">Customer Account Directory</h2>
                  <p className="text-xs text-slate-400">
                    Manage active customer accounts, review UID ownership, and enforce suspensions
                  </p>
                </div>
                <button
                  onClick={loadCustomers}
                  disabled={isLoadingCustomers}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCustomers ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Refresh List</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name, email, or UID..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  {(['all', 'active', 'suspended'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setCustomerStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                        customerStatusFilter === st
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Firebase UID</th>
                        <th className="py-3 px-4">Registered</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredCustomers.map((cust) => (
                        <tr key={cust.uid} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {cust.photoURL ? (
                                <img
                                  src={cust.photoURL}
                                  alt={cust.displayName}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0">
                                  {cust.displayName[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                                  <span>{cust.displayName}</span>
                                  {cust.email === SUPER_ADMIN_EMAIL && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">{cust.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                            <span className="truncate max-w-[120px] inline-block" title={cust.uid}>
                              {cust.uid}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : 'N/A'}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                cust.status === 'suspended'
                                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  cust.status === 'suspended' ? 'bg-rose-400' : 'bg-emerald-400'
                                }`}
                              />
                              {cust.status === 'suspended' ? 'Suspended' : 'Active'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            {cust.email !== SUPER_ADMIN_EMAIL ? (
                              <button
                                onClick={() => setActionCustomer(cust)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  cust.status === 'suspended'
                                    ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-600/30'
                                    : 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-600/30'
                                }`}
                              >
                                {cust.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">Immune (Root)</span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {filteredCustomers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                            No customers match the current search or status filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GLOBAL CATEGORY MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">Global Categories</h2>
                  <p className="text-xs text-slate-400">
                    Categories automatically broadcast to all customer apps. Archiving preserves all historical customer data.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {globalCategories.length === 0 && (
                    <button
                      onClick={handleSeedCategories}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Seed Defaults</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCatFormName('');
                      setCatFormNameHi('');
                      setCatFormType(categoryTypeFilter);
                      setCatFormIcon('Tag');
                      setCatFormColor('#10b981');
                      setIsCategoryModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Create Category</span>
                  </button>
                </div>
              </div>

              {/* Type Switcher & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setCategoryTypeFilter('expense')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      categoryTypeFilter === 'expense'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Expense Categories ({globalCategories.filter((c) => c.type === 'expense').length})
                  </button>
                  <button
                    onClick={() => setCategoryTypeFilter('income')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      categoryTypeFilter === 'income'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Income Categories ({globalCategories.filter((c) => c.type === 'income').length})
                  </button>
                </div>

                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search global categories..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      cat.isArchived
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                        : 'bg-slate-900 border-slate-800 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          <CategoryIcon name={cat.icon} className="w-5 h-5" color={cat.color} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                            <span>{cat.name}</span>
                            {cat.isArchived && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-400">
                                Archived
                              </span>
                            )}
                          </div>
                          {cat.nameHi && <div className="text-[11px] text-slate-400">{cat.nameHi}</div>}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCatFormName(cat.name);
                            setCatFormNameHi(cat.nameHi || '');
                            setCatFormType(cat.type);
                            setCatFormIcon(cat.icon);
                            setCatFormColor(cat.color);
                            setIsCategoryModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleArchiveCategory(cat)}
                          className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ${
                            cat.isArchived ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'
                          }`}
                          title={cat.isArchived ? 'Unarchive (Restore to customer dropdowns)' : 'Archive (Hide from new customer transactions)'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 rounded-lg hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredCategories.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                    No categories found. Click "Create Category" or "Seed Defaults" to add platform categories.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: APP CONFIG & MAINTENANCE */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">Platform Settings & Maintenance</h2>
                <p className="text-xs text-slate-400">
                  Global app configuration, feature flags, and emergency maintenance controller
                </p>
              </div>

              {/* Maintenance Mode Controller */}
              <div className={`p-5 rounded-3xl border transition-all ${
                appConfig.maintenanceMode.enabled
                  ? 'bg-amber-950/30 border-amber-800/80 shadow-lg shadow-amber-950/20'
                  : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-5 h-5 ${appConfig.maintenanceMode.enabled ? 'text-amber-400' : 'text-slate-500'}`} />
                      <h3 className="text-sm font-bold text-white">System Maintenance Mode</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      When enabled, all customer applications display the maintenance screen and restrict modifications safely. Super Admin remains fully operational.
                    </p>
                  </div>

                  <button
                    onClick={handleToggleMaintenance}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95 ${
                      appConfig.maintenanceMode.enabled
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    <Radio className={`w-4 h-4 ${appConfig.maintenanceMode.enabled ? 'animate-pulse' : ''}`} />
                    <span>{appConfig.maintenanceMode.enabled ? 'Deactivate Maintenance' : 'Activate Maintenance Mode'}</span>
                  </button>
                </div>

                {/* Maintenance Notice Message Editor */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                  <label className="text-xs font-bold text-slate-300">Customer Maintenance Notice:</label>
                  <textarea
                    rows={2}
                    value={appConfig.maintenanceMode.message}
                    onChange={(e) => {
                      const msg = e.target.value;
                      setAppConfig((prev) => ({
                        ...prev,
                        maintenanceMode: { ...prev.maintenanceMode, message: msg },
                      }));
                    }}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Preset templates:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const msg = 'We are currently performing scheduled maintenance to upgrade services. Please check back shortly.';
                          setAppConfig((prev) => ({ ...prev, maintenanceMode: { ...prev.maintenanceMode, message: msg } }));
                        }}
                        className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                      >
                        Scheduled Upgrade
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const msg = 'Security and performance enhancements are currently underway. Back shortly!';
                          setAppConfig((prev) => ({ ...prev, maintenanceMode: { ...prev.maintenanceMode, message: msg } }));
                        }}
                        className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                      >
                        Performance Tuning
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      CloudStorageService.saveAppConfig(adminUser, appConfig);
                      showToast('Maintenance message updated!');
                    }}
                    className="mt-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 cursor-pointer"
                  >
                    Save Notice Text
                  </button>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Global Feature Flags</h3>
                  <p className="text-xs text-slate-400">
                    Enable or disable specific features dynamically across all customer applications
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      key: 'voiceInput' as const,
                      title: 'Voice Transaction Input',
                      desc: 'Microphone voice entry in header and add modals',
                    },
                    {
                      key: 'standaloneDownload' as const,
                      title: 'Standalone Offline HTML File',
                      desc: 'Single-file offline runner download for mobile & PC',
                    },
                    {
                      key: 'pinLock' as const,
                      title: 'PIN & Biometric Lock',
                      desc: 'Customer security passcode screen & settings',
                    },
                    {
                      key: 'pdfExport' as const,
                      title: 'PDF Statement Engine',
                      desc: 'Official bank-style ledger export with tables',
                    },
                    {
                      key: 'excelExport' as const,
                      title: 'Excel & CSV Export',
                      desc: 'Raw spreadsheet ledger export (.xlsx / .csv)',
                    },
                    {
                      key: 'customCategories' as const,
                      title: 'Customer Custom Categories',
                      desc: 'Allows customers to add private personalized categories',
                    },
                  ].map((feat) => {
                    const isEnabled = appConfig.features[feat.key];
                    return (
                      <div
                        key={feat.key}
                        className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-200">{feat.title}</div>
                          <div className="text-[11px] text-slate-500">{feat.desc}</div>
                        </div>
                        <button
                          onClick={() => handleUpdateFeature(feat.key, !isEnabled)}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            isEnabled ? 'bg-emerald-600' : 'bg-slate-800'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                              isEnabled ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">Broadcast Announcements</h2>
                  <p className="text-xs text-slate-400">
                    Publish platform notices, release updates, or alerts seen immediately by online customers
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAnnTitle('');
                    setAnnMessage('');
                    setAnnType('info');
                    setIsAnnouncementModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create Announcement</span>
                </button>
              </div>

              {/* Announcements List */}
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            ann.type === 'critical'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                              : ann.type === 'warning'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                              : ann.type === 'update'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : 'bg-sky-950/80 text-sky-300 border border-sky-800'
                          }`}
                        >
                          {ann.type}
                        </span>
                        <h4 className="text-xs font-bold text-white">{ann.title}</h4>
                      </div>
                      <p className="text-xs text-slate-300">{ann.message}</p>
                      <div className="text-[10px] text-slate-500 pt-1">
                        Posted {new Date(ann.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(ann)}
                      className="p-1.5 rounded-lg hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {announcements.length === 0 && (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No announcements published yet. Click "Create Announcement" to send a notice to all customers.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT ACTIVITY LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Administrative Audit Trail</h2>
                <p className="text-xs text-slate-400">
                  Immutable record of all administrative actions, customer suspensions, category changes, and configuration updates
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Details</th>
                        <th className="py-3 px-4">Admin Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono">
                      {adminLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-emerald-400 text-[11px]">
                            {log.action}
                          </td>
                          <td className="py-2.5 px-4 text-slate-200 text-xs font-sans">
                            {log.details}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                            {log.adminEmail}
                          </td>
                        </tr>
                      ))}

                      {adminLogs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 text-xs font-sans">
                            No administrative logs recorded yet. All changes you make will be recorded here automatically.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: Create / Edit Global Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {editingCategory ? 'Edit Global Category' : 'Create Global Category'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Category Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCatFormType('expense')}
                    className={`py-2 rounded-xl font-bold text-xs transition-all ${
                      catFormType === 'expense'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatFormType('income')}
                    className={`py-2 rounded-xl font-bold text-xs transition-all ${
                      catFormType === 'income'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Category Name (English)</label>
                <input
                  type="text"
                  required
                  value={catFormName}
                  onChange={(e) => setCatFormName(e.target.value)}
                  placeholder="e.g. Groceries, Consulting, Office Rent"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Category Name (Hindi / Optional)</label>
                <input
                  type="text"
                  value={catFormNameHi}
                  onChange={(e) => setCatFormNameHi(e.target.value)}
                  placeholder="e.g. राशन, परामर्श, किराया"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Select Icon</label>
                <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                  {[
                    'ShoppingCart', 'Utensils', 'Car', 'Home', 'Fuel', 'HeartPulse',
                    'GraduationCap', 'Plane', 'Smartphone', 'Film', 'Gift', 'Briefcase',
                    'BadgePercent', 'Coins', 'Building', 'Zap', 'Coffee', 'Tag',
                  ].map((ico) => (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setCatFormIcon(ico)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                        catFormIcon === ico ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <CategoryIcon name={ico} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Color Accent</label>
                <div className="flex items-center gap-2">
                  {['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#64748b'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setCatFormColor(col)}
                      className={`w-7 h-7 rounded-full transition-transform ${catFormColor === col ? 'scale-110 ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Broadcast Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Broadcast Announcement</h3>
              <button
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Announcement Priority</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['info', 'update', 'warning', 'critical'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAnnType(t)}
                      className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        annType === t
                          ? t === 'critical' ? 'bg-rose-600 text-white' : t === 'warning' ? 'bg-amber-600 text-white' : t === 'update' ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. New Statement PDF Export Available"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Message Body</label>
                <textarea
                  rows={3}
                  required
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  placeholder="Message broadcasted to all customer home screens..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md"
                >
                  Broadcast to Customers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Suspend / Reactivate Confirmation Modal */}
      {actionCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                actionCustomer.status === 'active' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {actionCustomer.status === 'active' ? <Ban className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {actionCustomer.status === 'active' ? 'Suspend Customer Account' : 'Reactivate Customer Account'}
                </h3>
                <p className="text-[11px] text-slate-400">{actionCustomer.email}</p>
              </div>
            </div>

            <p className="text-slate-300 text-xs">
              {actionCustomer.status === 'active'
                ? 'Suspending this customer will restrict all mutation operations (creating, editing, deleting transactions). Their existing records will remain safely preserved.'
                : 'Reactivating this customer will restore their full normal access to record expenses, transfer funds, and synchronize records.'}
            </p>

            {actionCustomer.status === 'active' && (
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Reason (Optional for Audit Log):</label>
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Terms violation or user request"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden"
                />
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionCustomer(null);
                  setSuspendReason('');
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCustomerStatusChange}
                className={`px-4 py-2 rounded-xl font-bold text-white shadow-md cursor-pointer transition-all ${
                  actionCustomer.status === 'active' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {actionCustomer.status === 'active' ? 'Confirm Suspension' : 'Confirm Reactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs border border-emerald-400/40 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
