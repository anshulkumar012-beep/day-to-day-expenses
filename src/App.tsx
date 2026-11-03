import React, { useState, useEffect, useMemo } from 'react';
import {
  Account,
  AppSettings,
  Category,
  FinancialSummary,
  Profile,
  SupportedCurrency,
  Transaction,
} from './types';
import { StorageService } from './services/storage';
import { translations, formatCurrency } from './utils/i18n';
import { computeFinancialSummary, filterTransactions } from './utils/calculations';
import { exportToPDF, exportToExcel, exportToCSV } from './utils/exportEngine';

import { DashboardView } from './views/DashboardView';
import { PeriodDashboardView } from './views/PeriodDashboardView';
import { TransactionsView } from './views/TransactionsView';
import { ReportsView } from './views/ReportsView';
import { AccountsView } from './views/AccountsView';
import { CategoriesView } from './views/CategoriesView';
import { SettingsView } from './views/SettingsView';

import { AddTransactionModal } from './components/AddTransactionModal';
import { PinLockScreen } from './components/PinLockScreen';
import { AndroidDocsModal } from './components/AndroidDocsModal';
import { BackupAndExportModal } from './components/BackupAndExportModal';
import { QuickSearchModal } from './components/QuickSearchModal';
import { PdfExportModal } from './components/PdfExportModal';
import { VoiceTransactionModal } from './components/VoiceTransactionModal';
import { InstallAppModal } from './components/InstallAppModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DataMigrationModal } from './components/DataMigrationModal';
import { MaintenanceOverlay } from './components/MaintenanceOverlay';
import { CategoryIcon } from './components/CategoryIcon';
import { AdminPanelView } from './views/AdminPanelView';

import { auth, signInWithGoogle, logOut, testFirestoreConnection } from './services/firebase';
import { CloudStorageService, SUPER_ADMIN_EMAIL, DEFAULT_APP_CONFIG } from './services/cloudStorage';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  CustomerUser,
  GlobalCategory,
  AppConfig,
  PlatformAnnouncement,
} from './types';

import {
  LayoutDashboard,
  ReceiptText,
  BarChart3,
  Wallet,
  Tags,
  Settings,
  Plus,
  Moon,
  Sun,
  Smartphone,
  Monitor,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
  Shield,
  FileCode,
  Search,
  Database,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  FileDown,
  Cloud,
  MoreVertical,
  Mic,
  Home,
  Briefcase,
  Users,
  User,
  ArrowLeft,
  Check,
  Download,
  Pencil,
  Trash2,
  X,
  Calendar,
  Coins,
  FileText,
  Crown,
  Bell,
  AlertTriangle,
  Ban,
} from 'lucide-react';

export default function App() {
  // Load database state
  const [profiles, setProfiles] = useState<Profile[]>(() => StorageService.getProfiles());
  const [categories, setCategories] = useState<Category[]>(() => StorageService.getCategories());
  const [accounts, setAccounts] = useState<Account[]>(() => StorageService.getAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => StorageService.getTransactions());
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'reports' | 'accounts' | 'categories' | 'settings'>('dashboard');
  const [currentProfileId, setCurrentProfileId] = useState<string>('home'); // 'home' | 'office' | 'all' or custom
  const [viewMode, setViewMode] = useState<'mobile' | 'responsive'>('responsive');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => !StorageService.getSettings().isAppLocked);

  // Period Dashboard state synchronization
  const [dashboardPeriod, setDashboardPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [dashboardPeriodInfo, setDashboardPeriodInfo] = useState<{
    selectedDate: string;
    selectedYear: number;
    selectedMonth: number;
    monthPrefix: string;
    monthTransactions: Transaction[];
    yearTransactions: Transaction[];
  }>({
    selectedDate: new Date().toISOString().split('T')[0],
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() + 1,
    monthPrefix: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    monthTransactions: [],
    yearTransactions: [],
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [preselectedType, setPreselectedType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [preselectedDate, setPreselectedDate] = useState<string | undefined>(undefined);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isAndroidDocsOpen, setIsAndroidDocsOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isQuickBackupOpen, setIsQuickBackupOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isTopOverflowOpen, setIsTopOverflowOpen] = useState(false);
  const [isInstallAppModalOpen, setIsInstallAppModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [contextualTx, setContextualTx] = useState<Transaction | null>(null);

  // Firebase Auth & Cloud Firestore Sync State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [currentUserAccount, setCurrentUserAccount] = useState<CustomerUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Platform Global Real-Time States
  const [globalCategories, setGlobalCategories] = useState<GlobalCategory[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [dismissedAnnouncementIds, setDismissedAnnouncementIds] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'customer' | 'admin'>('customer');

  const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL || currentUserAccount?.role === 'admin';

  // 1. Listen to Global Platform Resources (Categories, App Config, Announcements)
  useEffect(() => {
    testFirestoreConnection().catch((err) => console.warn('Firestore test connection:', err));

    const unsubGlobalCats = CloudStorageService.subscribeToGlobalCategories((cats) => {
      setGlobalCategories(cats);
    });

    const unsubConfig = CloudStorageService.subscribeToAppConfig((cfg) => {
      setAppConfig(cfg);
    });

    const unsubAnn = CloudStorageService.subscribeToAnnouncements((anns) => {
      setAnnouncements(anns);
    });

    return () => {
      unsubGlobalCats();
      unsubConfig();
      unsubAnn();
    };
  }, []);

  // 2. Listen to Firebase Auth state changes & register user session
  useEffect(() => {
    let unsubUserAccount: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        // Record login & bootstrap admin if super admin
        try {
          const account = await CloudStorageService.recordUserSession(user);
          setCurrentUserAccount(account);
        } catch (e) {
          console.warn('Could not record user session:', e);
        }

        // Listen to user account changes (e.g. status active / suspended)
        unsubUserAccount = CloudStorageService.subscribeToUserAccount(user.uid, (acc) => {
          if (acc) setCurrentUserAccount(acc);
        });

        // Check if there are local transactions and if cloud has 0 to offer safe migration
        try {
          const localTxs = StorageService.getTransactions();
          const cloudCount = await CloudStorageService.getCloudTransactionCount(user.uid);
          if (localTxs.length > 0 && cloudCount === 0) {
            setIsMigrationModalOpen(true);
          }
        } catch (e) {
          console.warn('Error checking cloud transactions:', e);
        }
      } else {
        setCurrentUserAccount(null);
        if (unsubUserAccount) unsubUserAccount();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserAccount) unsubUserAccount();
    };
  }, []);

  // Listen to Cloud Firestore changes when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setIsCloudSyncing(false);
      return;
    }

    setIsCloudSyncing(true);
    const unsubscribeSync = CloudStorageService.subscribeToUserData(currentUser.uid, {
      onTransactions: (cloudTxs) => {
        if (cloudTxs && cloudTxs.length > 0) {
          setTransactions(cloudTxs);
          try {
            localStorage.setItem('daytoday_transactions', JSON.stringify(cloudTxs));
          } catch {}
        }
        setIsCloudSyncing(false);
      },
      onCategories: (cloudCats) => {
        if (cloudCats && cloudCats.length > 0) {
          setCategories(cloudCats);
          try {
            localStorage.setItem('daytoday_categories', JSON.stringify(cloudCats));
          } catch {}
        }
      },
      onAccounts: (cloudAccs) => {
        if (cloudAccs && cloudAccs.length > 0) {
          setAccounts(cloudAccs);
          try {
            localStorage.setItem('daytoday_accounts', JSON.stringify(cloudAccs));
          } catch {}
        }
      },
      onProfiles: (cloudProfs) => {
        if (cloudProfs && cloudProfs.length > 0) {
          setProfiles(cloudProfs);
          try {
            localStorage.setItem('daytoday_profiles', JSON.stringify(cloudProfs));
          } catch {}
        }
      },
      onSettings: (cloudSettings) => {
        if (cloudSettings) {
          setSettings((prev) => ({ ...prev, ...cloudSettings }));
        }
      },
      onError: (err) => {
        console.warn('Real-time sync error:', err);
        setIsCloudSyncing(false);
      },
    });

    return () => {
      unsubscribeSync();
      setIsCloudSyncing(false);
    };
  }, [currentUser]);

  // PWA Install prompt listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsAppInstalled(!!isStandalone);
    };
    checkInstalled();
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleTriggerInstall = async (): Promise<boolean> => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsAppInstalled(true);
        return true;
      }
    }
    return false;
  };

  // Toast / Undo state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [canUndoDelete, setCanUndoDelete] = useState<boolean>(false);

  const t = translations[settings.language];

  // Refresh helper
  const refreshAllData = () => {
    setProfiles(StorageService.getProfiles());
    setCategories(StorageService.getCategories());
    setAccounts(StorageService.getAccounts());
    setTransactions(StorageService.getTransactions());
    setSettings(StorageService.getSettings());
  };

  // Toast notification helper
  const showToast = (msg: string, allowUndo: boolean = false) => {
    setToastMessage(msg);
    setCanUndoDelete(allowUndo);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
      if (!allowUndo) setCanUndoDelete(false);
    }, 4500);
  };

  // Theme & Contrast class sync
  useEffect(() => {
    const isDarkTheme =
      ['dark', 'midnight', 'forest', 'sunset', 'slate'].includes(settings.theme) ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    document.documentElement.setAttribute('data-theme', settings.theme || 'system');
    document.documentElement.setAttribute('data-contrast', settings.themeContrast || 'normal');
  }, [settings.theme, settings.themeContrast]);

  // Today & Month summaries
  const todayYMD = new Date().toISOString().split('T')[0];
  const thisMonthPrefix = todayYMD.substring(0, 7);

  // Scoped transactions
  const activeScopedTransactions = useMemo(() => {
    return filterTransactions(transactions, currentProfileId);
  }, [transactions, currentProfileId]);

  // Today's summary
  const todaySummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    activeScopedTransactions.forEach((tx) => {
      if (tx.date === todayYMD) {
        if (tx.type === 'income') income += tx.amount;
        if (tx.type === 'expense') expense += tx.amount;
      }
    });
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      net: Math.round((income - expense) * 100) / 100,
    };
  }, [activeScopedTransactions, todayYMD]);

  // Current Month summary
  const monthSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    activeScopedTransactions.forEach((tx) => {
      if (tx.date.startsWith(thisMonthPrefix)) {
        if (tx.type === 'income') income += tx.amount;
        if (tx.type === 'expense') expense += tx.amount;
      }
    });
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      savings: Math.round((income - expense) * 100) / 100,
    };
  }, [activeScopedTransactions, thisMonthPrefix]);

  // Home Quick Summary
  const homeQuickSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((tx) => {
      if (tx.profileId === 'home' && tx.date.startsWith(thisMonthPrefix)) {
        if (tx.type === 'income') income += tx.amount;
        if (tx.type === 'expense') expense += tx.amount;
      }
    });
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      net: Math.round((income - expense) * 100) / 100,
    };
  }, [transactions, thisMonthPrefix]);

  // Office Quick Summary
  const officeQuickSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((tx) => {
      if (tx.profileId === 'office' && tx.date.startsWith(thisMonthPrefix)) {
        if (tx.type === 'income') income += tx.amount;
        if (tx.type === 'expense') expense += tx.amount;
      }
    });
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      net: Math.round((income - expense) * 100) / 100,
    };
  }, [transactions, thisMonthPrefix]);

  // Computed Financial Summary for current scope (current month)
  const currentMonthTransactions = useMemo(() => {
    return activeScopedTransactions.filter((tx) => tx.date.startsWith(thisMonthPrefix));
  }, [activeScopedTransactions, thisMonthPrefix]);

  // Merge platform global categories with local/customer categories
  const effectiveCategories = useMemo(() => {
    const map = new Map<string, Category>();
    // 1. Base / custom categories
    categories.forEach((c) => map.set(c.id, c));
    // 2. Global categories from Super Admin
    globalCategories.forEach((gc) => {
      map.set(gc.id, {
        id: gc.id,
        name: gc.name,
        nameHi: gc.nameHi,
        type: gc.type,
        icon: gc.icon,
        color: gc.color,
        isArchived: gc.isArchived,
        isSystem: true,
        subcategories: [],
      });
    });
    return Array.from(map.values());
  }, [categories, globalCategories]);

  const financialSummary = useMemo(() => {
    return computeFinancialSummary(currentMonthTransactions, effectiveCategories);
  }, [currentMonthTransactions, effectiveCategories]);

  // Helper to check customer suspension
  const verifyCustomerCanMutate = () => {
    if (currentUserAccount?.status === 'suspended') {
      showToast(
        settings.language === 'hi'
          ? 'आपका खाता निलंबित है। परिवर्तन प्रतिबंधित है।'
          : 'Your account has been suspended by administration. Actions are restricted.'
      );
      return false;
    }
    return true;
  };

  // Google Authentication Handlers
  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      showToast(
        settings.language === 'hi'
          ? `स्वागत है, ${user.displayName || user.email || 'उपयोगकर्ता'}!`
          : `Signed in as ${user.displayName || user.email || 'User'}`
      );
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        showToast(
          settings.language === 'hi'
            ? `Google साइन-इन विफल: ${err.message || 'त्रुटि'}`
            : `Google sign-in failed: ${err.message || 'Error'}`
        );
      }
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logOut();
      refreshAllData();
      showToast(settings.language === 'hi' ? 'सफलतापूर्वक लॉगआउट किया गया' : 'Signed out successfully');
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  const handleConfirmMigration = async () => {
    if (!currentUser) return;
    try {
      const localData = {
        transactions: StorageService.getTransactions(),
        categories: StorageService.getCategories(),
        accounts: StorageService.getAccounts(),
        profiles: StorageService.getProfiles(),
        settings: StorageService.getSettings(),
      };
      const res = await CloudStorageService.migrateLocalData(currentUser.uid, localData);
      setIsMigrationModalOpen(false);
      showToast(
        settings.language === 'hi'
          ? `${res.importedCount} लेन-देन आपके Google खाते में सुरक्षित रूप से सिंक हो गए!`
          : `${res.importedCount} transactions safely migrated to your Google Account!`
      );
    } catch (err: any) {
      console.error('Migration failed:', err);
      showToast(
        settings.language === 'hi'
          ? `माइग्रेशन विफल: ${err.message}`
          : `Migration failed: ${err.message}`
      );
    }
  };

  // Handlers for Transaction CRUD
  const handleSaveTransaction = (txData: any) => {
    if (!verifyCustomerCanMutate()) return;
    const saved = StorageService.saveTransaction(txData);
    setTransactions(StorageService.getTransactions());
    if (currentUser) {
      CloudStorageService.saveTransaction(currentUser.uid, saved).catch((e) =>
        console.warn('Cloud save error:', e)
      );
    }
    showToast(t.transactionSaved);
  };

  const handleDeleteTransaction = (id: string) => {
    if (!verifyCustomerCanMutate()) return;
    const res = StorageService.deleteTransaction(id);
    if (res.success) {
      setTransactions(StorageService.getTransactions());
      if (currentUser) {
        CloudStorageService.deleteTransaction(currentUser.uid, id).catch((e) =>
          console.warn('Cloud delete error:', e)
        );
      }
      showToast(t.transactionDeleted, true);
    }
  };

  const handleUndoDelete = () => {
    if (!verifyCustomerCanMutate()) return;
    const restored = StorageService.undoDeleteTransaction();
    if (restored) {
      setTransactions(StorageService.getTransactions());
      if (currentUser) {
        CloudStorageService.saveTransaction(currentUser.uid, restored).catch((e) =>
          console.warn('Cloud restore error:', e)
        );
      }
      setCanUndoDelete(false);
      showToast('Transaction restored successfully!');
    }
  };

  const handleDuplicateTransaction = (id: string) => {
    if (!verifyCustomerCanMutate()) return;
    const copy = StorageService.duplicateTransaction(id);
    if (copy) {
      setTransactions(StorageService.getTransactions());
      if (currentUser) {
        CloudStorageService.saveTransaction(currentUser.uid, copy).catch((e) =>
          console.warn('Cloud duplicate error:', e)
        );
      }
      showToast('Transaction duplicated!');
    }
  };

  const handleMoveTransaction = (id: string, newProfileId: string) => {
    if (!verifyCustomerCanMutate()) return;
    const moved = StorageService.moveTransactionProfile(id, newProfileId);
    if (moved) {
      setTransactions(StorageService.getTransactions());
      if (currentUser) {
        CloudStorageService.saveTransaction(currentUser.uid, moved).catch((e) =>
          console.warn('Cloud move error:', e)
        );
      }
      showToast('Moved to ' + newProfileId);
    }
  };

  // Handlers for Category & Account CRUD
  const handleSaveCategory = (cat: Category) => {
    if (!verifyCustomerCanMutate()) return;
    const updated = StorageService.saveCategory(cat);
    setCategories(updated);
    if (currentUser) {
      CloudStorageService.saveCategory(currentUser.uid, cat).catch(console.warn);
    }
    showToast('Category updated');
  };

  const handleDeleteCategory = (id: string): { success: boolean; message?: string } => {
    if (!verifyCustomerCanMutate()) return { success: false, message: 'Account suspended' };
    const res = StorageService.deleteCategory(id);
    if (res.success) {
      setCategories(StorageService.getCategories());
      if (currentUser) {
        CloudStorageService.deleteCategory(currentUser.uid, id).catch(console.warn);
      }
      showToast('Category removed');
    }
    return res;
  };

  const handleSaveAccount = (acc: Account) => {
    if (!verifyCustomerCanMutate()) return;
    const updated = StorageService.saveAccount(acc);
    setAccounts(updated);
    if (currentUser) {
      CloudStorageService.saveAccount(currentUser.uid, acc).catch(console.warn);
    }
    showToast('Account saved');
  };

  const handleUpdateSettings = (newSet: Partial<AppSettings>) => {
    const updated = StorageService.saveSettings(newSet);
    setSettings(updated);
    if (currentUser) {
      CloudStorageService.saveUserSettings(
        currentUser.uid,
        updated,
        currentUser.email || '',
        currentUser.displayName || ''
      ).catch(console.warn);
    }
    showToast('Preferences updated');
  };

  // Export Trigger Handler
  const handleExport = (
    format: 'pdf' | 'excel' | 'csv',
    customSummary?: FinancialSummary,
    customTransactions?: Transaction[],
    label?: string
  ) => {
    const activeProfObj = profiles.find((p) => p.id === currentProfileId);
    const profileLabel = currentProfileId === 'all' ? 'All Profiles (Combined)' : activeProfObj?.name || currentProfileId;
    const periodLabel = label || `${new Date().toLocaleString(undefined, { month: 'long', year: 'numeric' })}`;

    const exportContext = {
      profileLabel,
      periodLabel,
      settings,
      summary: customSummary || financialSummary,
      transactions: customTransactions || activeScopedTransactions,
      categories,
      accounts,
      profiles,
    };

    if (format === 'pdf') {
      exportToPDF(exportContext);
      showToast('PDF Report generated and downloaded!');
    } else if (format === 'excel') {
      exportToExcel(exportContext);
      showToast('Excel (.xlsx) Workbook generated and downloaded!');
    } else {
      exportToCSV(exportContext);
      showToast('CSV export downloaded!');
    }
  };

  // Handle voice transaction creation
  const handleSaveVoiceTransaction = (txData: {
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    accountId: string;
    description: string;
    date: string;
  }) => {
    if (!verifyCustomerCanMutate()) return;
    const saved = StorageService.saveTransaction({
      type: txData.type,
      amount: txData.amount,
      categoryId: txData.categoryId,
      accountId: txData.accountId,
      currency: settings.currency,
      date: txData.date || dashboardPeriodInfo.selectedDate || new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      description: txData.description,
      profileId: currentProfileId === 'all' ? 'home' : currentProfileId,
    });
    setTransactions(StorageService.getTransactions());
    if (currentUser) {
      CloudStorageService.saveTransaction(currentUser.uid, saved).catch(console.warn);
    }
    showToast(settings.language === 'hi' ? 'आवाज़ द्वारा लेन-देन जोड़ा गया!' : 'Transaction added via voice!');
  };

  // 1. Super Admin Panel View Branch
  if (activeView === 'admin' && isSuperAdmin && currentUser) {
    return (
      <AdminPanelView
        adminUser={currentUser}
        onSwitchToCustomerView={() => setActiveView('customer')}
        onSignOut={handleGoogleSignOut}
        starterCategories={categories}
      />
    );
  }

  // 2. Global System Maintenance Screen (Super Admin is exempt)
  if (appConfig.maintenanceMode?.enabled && currentUser?.email !== SUPER_ADMIN_EMAIL) {
    return (
      <MaintenanceOverlay
        message={appConfig.maintenanceMode.message}
        onRefresh={() => window.location.reload()}
        lang={settings.language}
      />
    );
  }

  // 3. If app is locked, render PIN unlock screen (only if pinLock feature enabled globally)
  if (appConfig.features?.pinLock !== false && !isUnlocked && settings.isAppLocked && settings.securityPin) {
    return (
      <PinLockScreen
        storedPinHash={settings.securityPin}
        biometricEnabled={settings.biometricEnabled}
        onUnlocked={() => setIsUnlocked(true)}
        onUnlockWithGoogle={async () => {
          try {
            await signInWithGoogle();
            setIsUnlocked(true);
          } catch (e) {
            console.error('Unlock with Google failed:', e);
          }
        }}
        lang={settings.language}
      />
    );
  }

  // Active Profile Name & Color
  const activeProfile = profiles.find((p) => p.id === currentProfileId);
  const activeProfileName = currentProfileId === 'all' ? t.profileAll : activeProfile?.name || currentProfileId;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center">
      {/* Top Universal Navbar: Fixed permanently at top ("Top bar ko bhe fix karo sath m") */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2.5 shadow-xs">
        {contextualTx ? (
          /* Contextual Action Toolbar on Long Press:
             "daily m jo data hai us ko phone m long press karne par wo data ko edit karne ka option upar jo day to day ka row hai wo change ho kar wahe par pincal ka icon, Description, Category,Amount, date, mode ka icon aa jaye" */
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Left: Close & Pencil (Edit) */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setContextualTx(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                title="Cancel Selection (चयन हटाएं)"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingTransaction(contextualTx);
                  setIsAddModalOpen(true);
                  setContextualTx(null);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                title="Edit Transaction (संपादित करें)"
              >
                <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden xs:inline">Edit</span>
              </button>
            </div>

            {/* Middle: Horizontal scrollable chips for Description, Category, Amount, Date, Mode */}
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {/* Description */}
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap max-w-[130px] truncate flex-shrink-0"
                title={contextualTx.description || 'No Description'}
              >
                <FileText className="w-3 h-3 text-slate-500 flex-shrink-0" />
                <span className="truncate">{contextualTx.description || 'No Desc'}</span>
              </span>

              {/* Category */}
              {(() => {
                const cat = categories.find((c) => c.id === contextualTx.categoryId);
                return (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap flex-shrink-0"
                    title={cat?.name || 'Category'}
                  >
                    <CategoryIcon name={cat?.icon || 'Tag'} className="w-3 h-3" color={cat?.color || '#10b981'} />
                    <span className="truncate max-w-[90px]">{cat?.name || 'Category'}</span>
                  </span>
                );
              })()}

              {/* Amount */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold whitespace-nowrap flex-shrink-0 ${
                  contextualTx.type === 'income'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
                }`}
              >
                <Coins className="w-3 h-3 flex-shrink-0" />
                <span>
                  {contextualTx.type === 'income' ? '+' : '-'}
                  {settings.currency === 'NPR' ? 'रु' : settings.currency === 'INR' ? '₹' : '$'}{' '}
                  {contextualTx.amount.toLocaleString()}
                </span>
              </span>

              {/* Date */}
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap flex-shrink-0">
                <Calendar className="w-3 h-3 text-sky-500 flex-shrink-0" />
                <span>{contextualTx.date}</span>
              </span>

              {/* Mode / Account */}
              {(() => {
                const acc = accounts.find((a) => a.id === contextualTx.accountId);
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap flex-shrink-0">
                    <Wallet className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    <span>{acc?.name || 'Cash'}</span>
                  </span>
                );
              })()}
            </div>

            {/* Right: Delete button */}
            <div className="flex items-center flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleDeleteTransaction(contextualTx.id);
                  setContextualTx(null);
                }}
                className="p-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                title="Delete Transaction (हटाएं)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {/* Clean App Title without hyphens + Back button when not in Dashboard */}
            <div className="flex items-center gap-2">
              {activeTab !== 'dashboard' && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-1 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Back to Dashboard (मुख्य पृष्ठ पर लौटें)"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                </button>
              )}
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Day to Day Expenses
              </h1>
            </div>

            {/* Top Bar Action Icons: Home, Voice, Backup (Cloud), Search, 3-dots Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Dynamic Profile Toggle Button: Distinct Logo, Badge & Color for Home, Office, All */}
              <button
                onClick={() => {
                  if (activeTab !== 'dashboard') {
                    setActiveTab('dashboard');
                  } else {
                    const nextProfile = currentProfileId === 'home' ? 'office' : currentProfileId === 'office' ? 'all' : 'home';
                    setCurrentProfileId(nextProfile);
                    showToast(`Profile: ${nextProfile === 'home' ? 'Home (घर)' : nextProfile === 'office' ? 'Office / Business (दफ्तर)' : 'All Profiles (सभी)'}`);
                  }
                }}
                className={`px-2 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                  currentProfileId === 'home'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : currentProfileId === 'office'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                    : 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300'
                }`}
                title={`Switch Profile: Currently ${currentProfileId === 'home' ? 'Home' : currentProfileId === 'office' ? 'Office' : 'All Profiles'} (Tap to switch)`}
              >
                {currentProfileId === 'home' ? (
                  <Home className="w-4 h-4 stroke-[2.2] text-emerald-600 dark:text-emerald-400" />
                ) : currentProfileId === 'office' ? (
                  <Briefcase className="w-4 h-4 stroke-[2.2] text-blue-600 dark:text-blue-400" />
                ) : (
                  <Users className="w-4 h-4 stroke-[2.2] text-purple-600 dark:text-purple-400" />
                )}
                <span className="text-[11px] font-extrabold tracking-tight">
                  {currentProfileId === 'home' ? 'Home' : currentProfileId === 'office' ? 'Office' : 'All'}
                </span>
              </button>

              {/* Voice Data Entry Mic Button (guarded by appConfig.features.voiceInput) */}
              {appConfig.features?.voiceInput !== false && (
                <button
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-colors relative"
                  title="Voice Data Entry (बोलकर लेन-देन जोड़ें)"
                >
                  <Mic className="w-5 h-5 stroke-[2.2]" />
                </button>
              )}

              {/* Super Admin Console Button (Only visible to Super Admin) */}
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveView('admin')}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-[11px] flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Super Admin Panel (सुपर एडमिन कंसोल)"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Admin</span>
                </button>
              )}

              {/* Backup Cloud Button ("backup logo sif show karo") */}
              <button
                onClick={() => setIsQuickBackupOpen(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                title="Backup & Restore (Google Drive / JSON)"
              >
                <Cloud className="w-5 h-5 stroke-[2]" />
              </button>

              {/* Search Button ("serch box cembal sif show karo") */}
              <button
                onClick={() => setIsQuickSearchOpen(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                title="Search Transactions (खोजें)"
              >
                <Search className="w-5 h-5 stroke-[2]" />
              </button>

              {/* 3-Dots Overflow Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsTopOverflowOpen((v) => !v)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  title="More Options & Navigation (मेन्यू)"
                >
                  <MoreVertical className="w-5 h-5 stroke-[2]" />
                </button>

                {isTopOverflowOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsTopOverflowOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
                      {/* Super Admin Quick Launch in Menu */}
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveView('admin');
                            setIsTopOverflowOpen(false);
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-amber-950 dark:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border-b border-amber-500/20 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <span>Super Admin Console</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 font-extrabold">ROOT</span>
                        </button>
                      )}
                    {/* Google Account Profile Header Card in Menu */}
                    <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 mb-1.5">
                      {currentUser ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            {currentUser.photoURL ? (
                              <img
                                src={currentUser.photoURL}
                                alt={currentUser.displayName || 'User'}
                                className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                                {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {currentUser.displayName || 'Google Account'}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {currentUser.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Cloud Sync Active
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsTopOverflowOpen(false);
                                handleGoogleSignOut();
                              }}
                              className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                            >
                              Sign Out
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            {settings.language === 'hi' ? 'क्लाउड बैकअप व सुरक्षा' : 'Cloud Backup & Sync'}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsTopOverflowOpen(false);
                              handleGoogleSignIn();
                            }}
                            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                              <path
                                fill="#ffffff"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#ffffff"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#ffffff"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              />
                              <path
                                fill="#ffffff"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              />
                            </svg>
                            <span>{settings.language === 'hi' ? 'Google से लॉगिन करें' : 'Sign In with Google'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Navigation Section */}
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {settings.language === 'hi' ? 'नेविगेशन' : 'Navigation'}
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('dashboard');
                        setIsTopOverflowOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeTab === 'dashboard'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                        <span>{t.navDashboard} (मुख्य पृष्ठ)</span>
                      </div>
                      {activeTab === 'dashboard' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('transactions');
                        setIsTopOverflowOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeTab === 'transactions'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ReceiptText className="w-4 h-4 text-sky-600" />
                        <span>{t.navTransactions} (सभी लेन-देन)</span>
                      </div>
                      {activeTab === 'transactions' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('reports');
                        setIsTopOverflowOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeTab === 'reports'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                        <span>{t.navReports} (रिपोर्ट्स)</span>
                      </div>
                      {activeTab === 'reports' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('accounts');
                        setIsTopOverflowOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeTab === 'accounts'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Wallet className="w-4 h-4 text-amber-600" />
                        <span>{t.navAccounts} (खाते)</span>
                      </div>
                      {activeTab === 'accounts' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('categories');
                        setIsTopOverflowOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeTab === 'categories'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Tags className="w-4 h-4 text-pink-600" />
                        <span>{t.navCategories} (श्रेणियां)</span>
                      </div>
                      {activeTab === 'categories' && <Check className="w-3.5 h-3.5 text-pink-600" />}
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setIsTopOverflowOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeTab === 'settings'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="font-bold">{t.navSettings} (सेटिंग्स)</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {settings.language === 'hi' ? 'टूल्स, बैकअप व प्राथमिकताएं' : 'Tools, Backup & Preferences'}
                          </div>
                        </div>
                      </div>
                      {activeTab === 'settings' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>

                    {/* Phone App Install & Offline Download (guarded by appConfig.features.standaloneDownload) */}
                    {appConfig.features?.standaloneDownload !== false && (
                      <button
                        onClick={() => {
                          setIsInstallAppModalOpen(true);
                          setIsTopOverflowOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                      >
                        <Download className="w-4 h-4 text-emerald-600" />
                        <span>{settings.language === 'hi' ? 'फोन ऐप व डाउनलोड (Offline File)' : 'Phone App & Download'}</span>
                      </button>
                    )}

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                    {/* Quick View Switcher */}
                    <button
                      onClick={() => {
                        setViewMode((v) => (v === 'mobile' ? 'responsive' : 'mobile'));
                        setIsTopOverflowOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                    >
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <span>{viewMode === 'mobile' ? 'Desktop View' : 'Phone Preview'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        )}
      </header>

      {/* Real-Time Platform Broadcast Announcements */}
      {announcements
        .filter((a) => a.isActive && !dismissedAnnouncementIds.includes(a.id))
        .map((ann) => (
          <div
            key={ann.id}
            className={`w-full max-w-5xl mx-auto my-2 px-4 py-3 rounded-2xl flex items-start justify-between gap-3 text-xs shadow-xs border transition-all animate-in fade-in slide-in-from-top-1 ${
              ann.type === 'critical'
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                : ann.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : ann.type === 'update'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200'
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <Bell className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold text-xs">{ann.title}</div>
                <div className="text-[11px] opacity-90 leading-relaxed whitespace-pre-wrap mt-0.5">{ann.message}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissedAnnouncementIds((prev) => [...prev, ann.id])}
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              title="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

      {/* Customer Suspension Warning Alert Banner */}
      {currentUserAccount?.status === 'suspended' && (
        <div className="w-full max-w-5xl mx-auto my-2 px-4 py-3 bg-rose-600 text-white rounded-2xl flex items-center justify-between gap-3 text-xs shadow-lg animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <Ban className="w-4 h-4 flex-shrink-0" />
            <div>
              <span className="font-bold">Account Suspended:</span> Your account has been temporarily restricted by the administration. You can view your financial records, but adding, editing, or deleting transactions is disabled.
            </div>
          </div>
        </div>
      )}

      {/* Mobile Responsive In-App PWA Install Banner */}
      {appConfig.features?.standaloneDownload !== false && (
        <PWAInstallBanner
          isInstalled={isAppInstalled}
          onOpenInstallModal={() => setIsInstallAppModalOpen(true)}
          lang={settings.language}
        />
      )}

      {/* Main Container: Android Phone Mock Frame OR Desktop Responsive */}
      <main
        className={`w-full transition-all duration-300 my-0 sm:my-4 pb-12 ${
          viewMode === 'mobile'
            ? 'max-w-[430px] rounded-[42px] border-[10px] border-slate-900 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 relative min-h-[820px]'
            : 'max-w-5xl px-3 sm:px-6'
        }`}
      >
        {/* If Mobile Frame Mode: Android Status Bar */}
        {viewMode === 'mobile' && (
          <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-between text-[11px] font-mono">
            <span>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="w-20 h-4 bg-black rounded-full mx-auto" />
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Dynamic Tab View Content */}
        <div className="p-3 sm:p-5">
          {activeTab === 'dashboard' && (
            <PeriodDashboardView
              currentProfileId={currentProfileId}
              profiles={profiles}
              settings={settings}
              transactions={transactions}
              categories={effectiveCategories}
              accounts={accounts}
              activePeriod={dashboardPeriod}
              onPeriodChange={(p) => {
                setDashboardPeriod(p);
                setContextualTx(null);
              }}
              onPeriodInfoChange={setDashboardPeriodInfo}
              onLongPressTransaction={(tx) => setContextualTx(tx)}
              selectedContextualTxId={contextualTx?.id}
              onOpenAddModal={(type, defaultDate) => {
                setPreselectedType(type || 'expense');
                setPreselectedDate(defaultDate);
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
              onSelectTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsAddModalOpen(true);
              }}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              categories={effectiveCategories}
              accounts={accounts}
              profiles={profiles}
              currentProfileId={currentProfileId}
              settings={settings}
              selectedCategoryFilter={selectedCategoryFilter}
              onOpenAddModal={() => {
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
              onSelectTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsAddModalOpen(true);
              }}
              onDuplicateTransaction={handleDuplicateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onMoveTransaction={handleMoveTransaction}
              onExport={handleExport}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              categories={effectiveCategories}
              accounts={accounts}
              profiles={profiles}
              currentProfileId={currentProfileId}
              settings={settings}
              onExport={handleExport}
              onSelectCategoryFilter={(catId) => {
                setSelectedCategoryFilter(catId);
                setActiveTab('transactions');
              }}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsView
              accounts={accounts}
              transactions={transactions}
              settings={settings}
              onSaveAccount={handleSaveAccount}
              onOpenTransferModal={() => {
                setPreselectedType('transfer');
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesView
              categories={effectiveCategories}
              transactions={transactions}
              settings={settings}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              profiles={profiles}
              transactions={transactions}
              categories={effectiveCategories}
              accounts={accounts}
              onUpdateSettings={handleUpdateSettings}
              onRefreshData={refreshAllData}
              onOpenAndroidDocs={() => setIsAndroidDocsOpen(true)}
              onOpenBackupModal={() => setIsQuickBackupOpen(true)}
              onOpenInstallModal={() => setIsInstallAppModalOpen(true)}
              onOpenPdfModal={() => setIsPdfModalOpen(true)}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onOpenSearchModal={() => setIsQuickSearchOpen(true)}
              isInstalled={isAppInstalled}
              currentUser={currentUser}
              onSignInWithGoogle={handleGoogleSignIn}
              onSignOut={handleGoogleSignOut}
            />
          )}
        </div>

        {/* Floating Action Button (FAB) - Single PDF Button on Monthly & Yearly, Add Expense (+) on Daily */}
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30 flex flex-col items-end gap-2">
          {activeTab === 'dashboard' && (dashboardPeriod === 'monthly' || dashboardPeriod === 'yearly') ? (
            /* Single PDF Statement Hub Button matching Android styling */
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="w-12 h-12 rounded-2xl bg-[#80efc9] hover:bg-[#68e0bf] text-slate-900 shadow-lg shadow-teal-500/25 flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105"
              title="PDF Statement & Report Generator (स्टेटमेंट रिपोर्ट)"
            >
              <svg
                className="w-6 h-6 text-slate-950"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <text
                  x="6.2"
                  y="17.5"
                  fontSize="6.5"
                  fontWeight="900"
                  fill="currentColor"
                  stroke="none"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  PDF
                </text>
              </svg>
            </button>
          ) : (
            /* + Button: Opens Add Transaction Modal (auto-selects today's local date) */
            <button
              type="button"
              onClick={() => {
                setEditingTransaction(null);
                setPreselectedType('expense');
                const localNow = new Date();
                const localYear = localNow.getFullYear();
                const localMonth = String(localNow.getMonth() + 1).padStart(2, '0');
                const localDay = String(localNow.getDate()).padStart(2, '0');
                const todayStr = `${localYear}-${localMonth}-${localDay}`;
                setPreselectedDate(todayStr);
                setIsAddModalOpen(true);
              }}
              className="w-14 h-14 rounded-2xl bg-[#7fe7c4] hover:bg-[#68ddb6] text-slate-900 shadow-xl shadow-teal-500/25 flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105"
              title="Add Expense"
            >
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </button>
          )}
        </div>
      </main>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        onDuplicate={handleDuplicateTransaction}
        onAddCategory={handleSaveCategory}
        initialTransaction={editingTransaction}
        initialType={preselectedType}
        initialDate={preselectedDate}
        profiles={profiles}
        categories={effectiveCategories}
        accounts={accounts}
        currentProfileId={currentProfileId}
        currency={settings.currency}
        lang={settings.language}
      />

      {/* Quick Search Modal from Top Search Logo */}
      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        transactions={transactions}
        categories={effectiveCategories}
        accounts={accounts}
        profiles={profiles}
        currentProfileId={currentProfileId}
        currency={settings.currency}
        onSelectTransaction={(tx) => {
          setEditingTransaction(tx);
          setIsAddModalOpen(true);
        }}
      />

      {/* Backup and export Screen matching user screenshot Screenshot_20261031_010431_9a831add.jpg */}
      <BackupAndExportModal
        isOpen={isQuickBackupOpen}
        onClose={() => setIsQuickBackupOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        transactions={transactions}
        categories={effectiveCategories}
        accounts={accounts}
        profiles={profiles}
        onRefreshData={refreshAllData}
        showToast={showToast}
      />

      {/* Android Documentation & Kotlin Source Viewer Modal */}
      <AndroidDocsModal
        isOpen={isAndroidDocsOpen}
        onClose={() => setIsAndroidDocsOpen(false)}
      />

      {/* PDF Statement & Report Export Hub Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        transactions={transactions}
        categories={effectiveCategories}
        accounts={accounts}
        profiles={profiles}
        currentProfileId={currentProfileId}
        settings={settings}
        currency={settings.currency}
        lang={settings.language}
        initialPeriod={dashboardPeriod === 'yearly' ? 'yearly' : 'monthly'}
        initialMonth={dashboardPeriodInfo.selectedMonth}
        initialYear={dashboardPeriodInfo.selectedYear}
      />

      {/* Voice Data Entry Modal ("voice se data add karne ka option add karo") */}
      <VoiceTransactionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSaveTransaction={handleSaveVoiceTransaction}
        categories={effectiveCategories}
        accounts={accounts}
        currentProfileId={currentProfileId}
      />

      {/* Standalone Android WebAPK / PWA Phone Installer Modal */}
      <InstallAppModal
        isOpen={isInstallAppModalOpen}
        onClose={() => setIsInstallAppModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onTriggerInstall={handleTriggerInstall}
        isInstalled={isAppInstalled}
      />

      {/* Cloud Data Migration Dialog */}
      <DataMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onConfirm={handleConfirmMigration}
        localTransactionCount={transactions.length}
        userEmail={currentUser?.email || undefined}
        lang={settings.language}
      />

      {/* Toast Notification Banner with Undo */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs border border-slate-700 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
          {canUndoDelete && (
            <button
              onClick={handleUndoDelete}
              className="ml-2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.undo}</span>
            </button>
          )}
        </div>
      )}

      {/* Connectivity & Offline State Indicator */}
      <OfflineIndicator lang={settings.language} />
    </div>
  );
}
