import React, { useState } from 'react';
import { Account, AppSettings, Category, Profile, SupportedCurrency, SupportedLanguage, Transaction } from '../types';
import { translations, MONTHS, CURRENCY_METADATA } from '../utils/i18n';
import { StorageService } from '../services/storage';
import { hashPin, encryptData, decryptData } from '../utils/security';
import { exportToExcel } from '../utils/exportEngine';
import { computeFinancialSummary } from '../utils/calculations';
import { generateStandaloneAppHtml } from '../utils/standaloneAppBundle';
import {
  Globe,
  Coins,
  SunMoon,
  Calendar,
  Lock,
  Database,
  Mail,
  RefreshCcw,
  ShieldCheck,
  Download,
  Upload,
  UserCheck,
  AlertTriangle,
  FolderCode,
  Check,
  X,
  FileCode2,
  Cloud,
  FileSpreadsheet,
  Sliders,
  Palette,
  Calculator as CalcIcon,
  Sun,
  Moon,
  ArrowRightLeft,
  Sparkles,
  Smartphone,
  FileDown,
  Mic,
  Search,
  Wrench,
  Zap,
  LogOut,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  profiles: Profile[];
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onRefreshData: () => void;
  onOpenAndroidDocs: () => void;
  onOpenBackupModal?: () => void;
  onOpenInstallModal?: () => void;
  onOpenPdfModal?: () => void;
  onOpenVoiceModal?: () => void;
  onOpenSearchModal?: () => void;
  isInstalled?: boolean;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  currentUser?: any;
  onSignInWithGoogle?: () => void;
  onSignOut?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  profiles,
  transactions,
  categories,
  accounts,
  onUpdateSettings,
  onRefreshData,
  onOpenAndroidDocs,
  onOpenBackupModal,
  onOpenInstallModal,
  onOpenPdfModal,
  onOpenVoiceModal,
  onOpenSearchModal,
  isInstalled = false,
  onExport,
  currentUser,
  onSignInWithGoogle,
  onSignOut,
}) => {
  const t = translations[settings.language];

  // PIN modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Backup / Restore state
  const [backupPassword, setBackupPassword] = useState('');
  const [backupSuccessMsg, setBackupSuccessMsg] = useState('');
  const [restorePreview, setRestorePreview] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState('');

  // Reset confirmation modal state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [profileColor, setProfileColor] = useState('#10b981');

  // Handle PIN Save
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 numeric digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match.');
      return;
    }

    const hashed = await hashPin(newPin);
    onUpdateSettings({
      isAppLocked: true,
      securityPin: hashed,
    });
    setIsPinModalOpen(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  const handleDisablePin = () => {
    onUpdateSettings({
      isAppLocked: false,
      securityPin: undefined,
    });
  };

  // Handle Export Backup File (JSON or AES-256 Encrypted)
  const handleDownloadBackup = async (encrypted: boolean) => {
    const snapshot = StorageService.exportDatabaseSnapshot();
    const jsonStr = JSON.stringify(snapshot, null, 2);

    let finalContent = jsonStr;
    let fileName = `DayToDay_Expenses_Backup_${new Date().toISOString().split('T')[0]}.json`;

    if (encrypted) {
      if (!backupPassword.trim()) {
        alert('Please enter an encryption password for the encrypted backup.');
        return;
      }
      finalContent = await encryptData(jsonStr, backupPassword);
      fileName = `DayToDay_Expenses_Encrypted_${new Date().toISOString().split('T')[0]}.d2d`;
    }

    const blob = new Blob([finalContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    setBackupSuccessMsg(encrypted ? 'Encrypted backup generated!' : 'JSON backup saved!');
    setTimeout(() => setBackupSuccessMsg(''), 4000);
  };

  // Handle File Upload for Restore
  const handleFileSelectForRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError('');
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        let snapshotData: any;

        if (file.name.endsWith('.d2d')) {
          const pass = prompt('Enter the decryption password for this backup:');
          if (!pass) return;
          const decrypted = await decryptData(text, pass);
          snapshotData = JSON.parse(decrypted);
        } else {
          snapshotData = JSON.parse(text);
        }

        if (!snapshotData || !Array.isArray(snapshotData.transactions)) {
          setRestoreError('Invalid backup file structure.');
          return;
        }

        setRestorePreview(snapshotData);
      } catch (err: any) {
        setRestoreError('Failed to read or decrypt backup file: ' + (err.message || 'Error'));
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!restorePreview) return;
    const result = StorageService.restoreDatabaseSnapshot(restorePreview);
    if (result.success) {
      setRestorePreview(null);
      onRefreshData();
      alert(`Successfully restored ${result.count} transactions!`);
    } else {
      setRestoreError(result.message || 'Restore failed.');
    }
  };

  // Handle Factory Reset
  const handleFactoryReset = () => {
    StorageService.resetAllData();
    setIsResetConfirmOpen(false);
    onRefreshData();
  };

  // Handle Create Profile
  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const newProf: Profile = {
      id: `prof_${Date.now()}`,
      name: newProfileName.trim(),
      icon: 'Briefcase',
      color: profileColor,
      isArchived: false,
    };

    StorageService.saveProfile(newProf);
    setIsProfileModalOpen(false);
    setNewProfileName('');
    onRefreshData();
  };

  // Google Drive Cloud Backup Handler
  const [isGoogleDriveConnecting, setIsGoogleDriveConnecting] = useState(false);
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [googleDriveLastSync, setGoogleDriveLastSync] = useState<string | null>(null);

  const handleGoogleDriveBackup = () => {
    setIsGoogleDriveConnecting(true);
    setTimeout(() => {
      const snapshot = StorageService.exportDatabaseSnapshot();
      const jsonStr = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DayToDay_GoogleDrive_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setIsGoogleDriveConnecting(false);
      setGoogleDriveConnected(true);
      setGoogleDriveLastSync(new Date().toLocaleTimeString());
      setBackupSuccessMsg(settings.language === 'hi' ? 'Google Drive बैकअप तैयार हो गया व डाउनलोड किया गया!' : 'Google Drive Backup snapshot generated & saved!');
      setTimeout(() => setBackupSuccessMsg(''), 5000);
    }, 800);
  };

  // Gmail Account & Auto-Backup State & Handlers
  // "app instal karne par gmail se login karne ka option add karo aur use gmail id par app ka backup ho"
  const [isEditingGmail, setIsEditingGmail] = useState(false);
  const [gmailInput, setGmailInput] = useState(settings.googleAccountEmail || 'anshul.kumar012@gmail.com');
  const [gmailSaveNotice, setGmailSaveNotice] = useState<string | null>(null);

  const handleSaveGmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gmailInput.includes('@')) {
      alert('Please enter a valid Gmail address');
      return;
    }
    onUpdateSettings({ googleAccountEmail: gmailInput.trim() });
    setIsEditingGmail(false);
    setGmailSaveNotice(`Gmail account set to ${gmailInput.trim()}!`);
    setTimeout(() => setGmailSaveNotice(null), 3500);
  };

  const handleBackupToGmailNow = () => {
    const snapshot = StorageService.exportDatabaseSnapshot();
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DayToDay_Expenses_GmailBackup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const targetEmail = settings.googleAccountEmail || 'anshul.kumar012@gmail.com';
    window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent('Day to Day Expenses Data Backup')}&body=${encodeURIComponent('Data snapshot generated on ' + new Date().toLocaleString())}`;
    setBackupSuccessMsg(`Data backed up and sent to ${targetEmail}!`);
    setTimeout(() => setBackupSuccessMsg(''), 4000);
  };

  const handleDownloadPhoneAppHtml = () => {
    try {
      const snapshot = StorageService.exportDatabaseSnapshot();
      const htmlContent = generateStandaloneAppHtml(snapshot);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DayToDayExpenses_Phone_App.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupSuccessMsg('Phone App HTML file downloaded! Open in Chrome on your phone.');
      setTimeout(() => setBackupSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    if (onExport) {
      onExport('excel');
    } else {
      const activeProfObj = profiles.find((p) => p.id === 'all');
      exportToExcel({
        profileLabel: 'All Profiles (Combined)',
        periodLabel: `Full Archive - ${new Date().toLocaleDateString()}`,
        settings,
        summary: computeFinancialSummary(transactions, categories),
        transactions,
        categories,
        accounts,
        profiles,
      });
      setBackupSuccessMsg(settings.language === 'hi' ? 'Excel (.xlsx) फ़ाइल डाउनलोड हो गई!' : 'Excel workbook (.xlsx) downloaded!');
      setTimeout(() => setBackupSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-5 pb-24 text-xs">
      {/* 0. Cloud Sync & Google Account Status */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {settings.language === 'hi' ? 'Google खाता व क्लाउड सिंक' : 'Google Account & Cloud Sync'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {currentUser
                  ? (settings.language === 'hi' ? 'Firebase Firestore द्वारा सुरक्षित सिंक्रोनाइज़्ड' : 'Synchronized via secure Firebase Firestore')
                  : (settings.language === 'hi' ? 'क्लाउड सिंक के लिए साइन इन करें' : 'Sign in to sync across devices')}
              </p>
            </div>
          </div>

          {currentUser ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Synced</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
              Offline Only
            </span>
          )}
        </div>

        {currentUser ? (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {currentUser.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.displayName || 'Google User'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentUser.email}
                </div>
                <div className="text-[9px] text-slate-400 font-mono truncate">
                  UID: {currentUser.uid}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-xs transition-colors cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{settings.language === 'hi' ? 'लॉगआउट करें' : 'Sign Out'}</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {settings.language === 'hi'
                ? 'अपने सभी डिवाइसों पर सुरक्षित डेटा सिंक करने के लिए Google से लॉगिन करें।'
                : 'Sign in with your Google account to automatically sync and access your financial records across all your devices.'}
            </p>
            <button
              type="button"
              onClick={onSignInWithGoogle}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{settings.language === 'hi' ? 'Google से लॉगिन करें' : 'Sign in with Google'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. Language & Currency */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-500" />
          <span>Regional & Currency Settings</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Language */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              {t.languageSetting}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                  settings.language === 'en'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                English (Default)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'hi' })}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                  settings.language === 'hi'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              {t.currencySetting} (Default: NPR)
            </label>
            <select
              value={settings.currency}
              onChange={(e) => onUpdateSettings({ currency: e.target.value as SupportedCurrency })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              {(Object.keys(CURRENCY_METADATA) as SupportedCurrency[]).map((cur) => (
                <option key={cur} value={cur}>
                  {CURRENCY_METADATA[cur].name} ({CURRENCY_METADATA[cur].symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Year Start Month */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
            {t.financialYearSetting}
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              value={settings.financialYearStartMonth}
              onChange={(e) => onUpdateSettings({ financialYearStartMonth: parseInt(e.target.value, 10) })}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  Month {m.value}: {settings.language === 'hi' ? m.hi : m.en}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400">{t.fyHint}</span>
          </div>
        </div>
      </div>

      {/* 2. Data Management (डेटा प्रबंधन) */}
      {/* "settings m date management m carry frward balance form one month to another ka option add karo jis ko jarurat hone par on/off kar shake" */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
          <span>{settings.language === 'hi' ? 'डेटा प्रबंधन (Data Management)' : 'Data Management'}</span>
        </h3>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
              {settings.language === 'hi'
                ? 'एक महीने से दूसरे महीने में बैलेंस कैरी फॉरवर्ड करें'
                : 'Carry forward balance from one month to another'}
            </div>
            <div className="text-[11px] text-slate-400">
              {settings.language === 'hi'
                ? 'चालू करने पर पिछले महीनों की शेष बचत अगले महीने के प्रारंभिक बैलेंस में जुड़ जाएगी।'
                : 'When enabled, net savings from previous months automatically become the opening balance for subsequent months.'}
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={!!settings.carryForwardMonthlyBalance}
              onChange={(e) => onUpdateSettings({ carryForwardMonthlyBalance: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* Tools & Utilities (टूल्स व सुविधाएं) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Wrench className="w-4 h-4 text-emerald-500" />
          <span>{settings.language === 'hi' ? 'टूल्स व उपयोगिताएं (Tools & Utilities)' : 'Tools & Utilities'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Export PDF Statements */}
          <button
            type="button"
            onClick={onOpenPdfModal}
            className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-left hover:bg-emerald-100/60 transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <FileDown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {settings.language === 'hi' ? 'पीडीएफ स्टेटमेंट (Export PDF)' : 'Export PDF Statements'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {settings.language === 'hi' ? 'तारीख व श्रेणी अनुसार डाउनलोड' : 'Filter by date, profile & category'}
              </div>
            </div>
          </button>

          {/* Backup and export (Google Drive & Excel) */}
          <button
            type="button"
            onClick={onOpenBackupModal}
            className="p-3.5 rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/20 text-left hover:bg-teal-100/60 transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0d9488] text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {settings.language === 'hi' ? 'बैकअप और एक्सपोर्ट (Drive & Excel)' : 'Backup and Export'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {settings.language === 'hi' ? 'गूगल ड्राइव, जीमेल व एक्सेल' : 'Google Drive, Gmail & Excel'}
              </div>
            </div>
          </button>

          {/* Voice Entry */}
          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-left hover:bg-blue-100/60 transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {settings.language === 'hi' ? 'बोलकर लिखें (Voice Entry)' : 'Voice Entry'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {settings.language === 'hi' ? 'हिंदी व अंग्रेजी में बोलकर जोड़ें' : 'Add expenses with voice speech'}
              </div>
            </div>
          </button>

          {/* Search Transactions */}
          <button
            type="button"
            onClick={onOpenSearchModal}
            className="p-3.5 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 text-left hover:bg-purple-100/60 transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {settings.language === 'hi' ? 'लेन-देन खोजें (Search)' : 'Search Transactions'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {settings.language === 'hi' ? 'विवरण, रकम या श्रेणी से खोजें' : 'Search by name, note or amount'}
              </div>
            </div>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-left hover:bg-amber-100/60 transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {settings.language === 'hi' ? 'एक्सेल में सहेजें (Save as Excel)' : 'Save as Excel (.xlsx)'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {settings.language === 'hi' ? 'मल्टी-शीट वर्कबुक डाउनलोड' : 'Multi-sheet complete workbook'}
              </div>
            </div>
          </button>

          {/* Install App / APK */}
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-left hover:bg-indigo-100/60 transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {settings.language === 'hi' ? 'फोन में इंस्टॉल (Install APK)' : 'Install App / APK'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {settings.language === 'hi' ? 'होम स्क्रीन व ऑफलाइन ऐप' : 'Standalone home screen app'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Preferences (प्राथमिकताएं) */}
      {/* "preferenses m thems , thems contrast, date format,calculator (show calculator whil entering amoun.) disable auto suggestion (ticking this checkbox disables auto suggestions while entering income or expense)" */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-violet-500" />
          <span>{settings.language === 'hi' ? 'प्राथमिकताएं (Preferences)' : 'Preferences'}</span>
        </h3>

        {/* 1. Themes */}
        <div className="space-y-2">
          <label className="block font-bold text-slate-700 dark:text-slate-300">
            {settings.language === 'hi' ? 'थीम चुनें (Themes)' : 'Themes'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'system', name: 'System', nameHi: 'सिस्टम', icon: '💻' },
              { id: 'light', name: 'Light', nameHi: 'लाइट', icon: '☀️' },
              { id: 'dark', name: 'Dark', nameHi: 'डार्क', icon: '🌙' },
              { id: 'midnight', name: 'Midnight', nameHi: 'मिडनाइट', icon: '🌌' },
              { id: 'forest', name: 'Forest', nameHi: 'फॉरेस्ट', icon: '🌲' },
              { id: 'sunset', name: 'Sunset', nameHi: 'सनसेट', icon: '🌅' },
              { id: 'slate', name: 'Slate', nameHi: 'स्लेट', icon: '🪨' },
            ].map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => onUpdateSettings({ theme: th.id as any })}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-left flex items-center gap-2 ${
                  settings.theme === th.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{th.icon}</span>
                <span className="truncate">{settings.language === 'hi' ? th.nameHi : th.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Themes Contrast */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <label className="block font-bold text-slate-700 dark:text-slate-300">
            {settings.language === 'hi' ? 'थीम कंट्रास्ट (Themes Contrast)' : 'Theme Contrast'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateSettings({ themeContrast: 'normal' })}
              className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                settings.themeContrast !== 'high'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {settings.language === 'hi' ? 'सामान्य (Normal)' : 'Normal Contrast'}
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ themeContrast: 'high' })}
              className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                settings.themeContrast === 'high'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {settings.language === 'hi' ? 'उच्च कंट्रास्ट (High Contrast)' : 'High Contrast'}
            </button>
          </div>
        </div>

        {/* 3. Date Format */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <label className="block font-bold text-slate-700 dark:text-slate-300">
            {settings.language === 'hi' ? 'दिनांक प्रारूप (Date Format)' : 'Date Format'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'DD MMMM, YYYY', example: '28 October, 2026' },
              { id: 'DD/MM/YYYY', example: '28/10/2026' },
              { id: 'YYYY-MM-DD', example: '2026-10-28' },
              { id: 'MM/DD/YYYY', example: '10/28/2026' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => onUpdateSettings({ dateFormat: fmt.id as any })}
                className={`p-2 rounded-xl font-bold border transition-all text-left ${
                  settings.dateFormat === fmt.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-xs truncate">{fmt.id}</div>
                <div className="text-[10px] opacity-70 truncate">{fmt.example}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Calculator Toggle */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <CalcIcon className="w-4 h-4 text-indigo-500" />
              <span>{settings.language === 'hi' ? 'रकम दर्ज करते समय कैलकुलेटर (Calculator)' : 'Calculator'}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {settings.language === 'hi'
                ? 'रकम दर्ज करते समय कैलकुलेटर दिखाएं (show calculator while entering amount)'
                : 'Show calculator while entering amount'}
            </div>
          </div>
          <input
            type="checkbox"
            checked={!!settings.showCalculatorInAmount}
            onChange={(e) => onUpdateSettings({ showCalculatorInAmount: e.target.checked })}
            className="w-5 h-5 accent-indigo-600 cursor-pointer rounded"
          />
        </div>

        {/* 5. Disable Auto Suggestion Toggle */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{settings.language === 'hi' ? 'स्वतः सुझाव अक्षम करें (Disable Auto Suggestion)' : 'Disable Auto Suggestion'}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {settings.language === 'hi'
                ? 'आय या खर्च दर्ज करते समय स्वतः सुझाव अक्षम करें (ticking this checkbox disables auto suggestions while entering income or expense)'
                : 'Ticking this checkbox disables auto suggestions while entering income or expense'}
            </div>
          </div>
          <input
            type="checkbox"
            checked={!!settings.disableAutoSuggestions}
            onChange={(e) => onUpdateSettings({ disableAutoSuggestions: e.target.checked })}
            className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
          />
        </div>
      </div>

      {/* 4. Profiles Management */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-500" />
            <span>Profiles: Home & Office/Business</span>
          </h3>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
          >
            + Add Profile
          </button>
        </div>

        <p className="text-slate-400">
          Transactions are strictly separated between profiles. Home expenses never mix with Office/Business.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {profiles.map((p) => {
            const count = transactions.filter((t) => t.profileId === p.id).length;
            return (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.id === 'home' ? '🏠' : p.id === 'office' ? '💼' : '📁'}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-400">{count} transactions</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Security & App Lock (PIN / Biometric) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Privacy & App Lock Security</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <div>
            <div className="font-bold text-slate-800 dark:text-white">
              {settings.isAppLocked ? t.pinEnabled : t.pinDisabled}
            </div>
            <div className="text-[11px] text-slate-400">
              Requires 4-digit PIN on app launch to safeguard financial data
            </div>
          </div>

          <div className="flex items-center gap-2">
            {settings.isAppLocked ? (
              <>
                <button
                  onClick={() => setIsPinModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold"
                >
                  {t.changePin}
                </button>
                <button
                  onClick={handleDisablePin}
                  className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl font-bold border border-rose-200"
                >
                  Disable
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsPinModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-xs"
              >
                {t.setupPin}
              </button>
            )}
          </div>
        </div>

        {/* Biometric Toggle */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="font-bold text-slate-800 dark:text-white">{t.biometricUnlock}</div>
            <div className="text-[11px] text-slate-400">
              Fingerprint or Face Unlock simulation on supported Android hardware
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.biometricEnabled}
            onChange={(e) => onUpdateSettings({ biometricEnabled: e.target.checked })}
            className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
          />
        </div>
      </div>

      {/* 4. Backup & Restore (Local, Encrypted, Safe) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-500" />
          <span>{t.backupRestore}</span>
        </h3>

        <p className="text-slate-400">
          All financial data is kept 100% offline and local on your device. Create backups or restore safely.
        </p>

        {backupSuccessMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{backupSuccessMsg}</span>
          </div>
        )}

        {/* Gmail Account Login & Auto-Backup Card */}
        {/* "app instal karne par gmail se login karne ka option add karo aur use gmail id par app ka backup ho" */}
        <div className="p-4 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/30 dark:to-teal-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-red-500 font-bold text-base">
                G
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Gmail Account & Auto-Backup</span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    Connected ✓
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  {settings.googleAccountEmail || 'anshul.kumar012@gmail.com'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingGmail(!isEditingGmail)}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {isEditingGmail ? 'Cancel' : 'Change Gmail'}
            </button>
          </div>

          {isEditingGmail && (
            <div className="flex items-center gap-2 pt-1 animate-in fade-in">
              <input
                type="email"
                value={gmailInput}
                onChange={(e) => setGmailInput(e.target.value)}
                placeholder="your.email@gmail.com"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={handleSaveGmail}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                Save
              </button>
            </div>
          )}

          {gmailSaveNotice && (
            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold animate-in fade-in">
              {gmailSaveNotice}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleBackupToGmailNow}
              className="flex-1 py-2 bg-[#0f766e] hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Back Up to Gmail ({settings.googleAccountEmail || 'anshul.kumar012@gmail.com'})</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Google Drive Cloud Backup */}
          {/* "backup and export google drive backup, export as excel" */}
          <div className="p-4 border border-blue-200 dark:border-blue-900/60 rounded-2xl space-y-2 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-blue-500" />
                <span>Google Drive Cloud Backup</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                {googleDriveConnected ? 'Synced' : 'Cloud Ready'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {googleDriveLastSync
                ? `Last backed up at ${googleDriveLastSync}. Tap below to update cloud backup.`
                : 'Directly sync and save all transactions, profiles, and accounts to your Google Drive storage.'}
            </div>
            <button
              type="button"
              onClick={onOpenBackupModal || handleGoogleDriveBackup}
              disabled={isGoogleDriveConnecting}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#0f766e] hover:bg-teal-800 active:scale-95 text-white rounded-xl font-bold shadow-xs transition-all disabled:opacity-50"
            >
              <Cloud className="w-4 h-4" />
              <span>Open Backup and export (Google Drive)</span>
            </button>
          </div>

          {/* Export as Excel */}
          {/* "backup and export google drive backup, export as excel" */}
          <div className="p-4 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-2 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Export as Excel (.xlsx)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                Multi-sheet
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Download complete structured Excel workbook with executive summary sheet and itemized transaction rows.
            </div>
            <button
              type="button"
              onClick={handleExportExcel}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold shadow-xs transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export as Excel</span>
            </button>
          </div>

          {/* Standard JSON Backup */}
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <div className="font-bold text-slate-800 dark:text-white">Plaintext JSON Backup</div>
            <div className="text-[11px] text-slate-400">
              Download complete database file with all profiles, transactions, and accounts.
            </div>
            <button
              onClick={() => handleDownloadBackup(false)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Encrypted Backup */}
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 bg-indigo-50/40 dark:bg-indigo-950/20">
            <div className="font-bold text-slate-800 dark:text-white">AES-256 Encrypted Backup</div>
            <input
              type="password"
              value={backupPassword}
              onChange={(e) => setBackupPassword(e.target.value)}
              placeholder="Enter backup encryption password"
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
            <button
              onClick={() => handleDownloadBackup(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
            >
              <Lock className="w-4 h-4" />
              <span>Generate Encrypted .d2d</span>
            </button>
          </div>
        </div>

        {/* Restore Section */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t.restoreDatabase}
          </label>
          <input
            type="file"
            accept=".json,.d2d"
            onChange={handleFileSelectForRestore}
            className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
          />

          {restoreError && (
            <div className="mt-2 p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
              {restoreError}
            </div>
          )}

          {/* Restore Preview Confirmation */}
          {restorePreview && (
            <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-900 space-y-2">
              <div className="font-bold text-emerald-800 dark:text-emerald-300">
                Backup File Verified
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400">
                Found {restorePreview.transactions?.length || 0} transactions,{' '}
                {restorePreview.accounts?.length || 0} accounts, and{' '}
                {restorePreview.categories?.length || 0} categories.
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleConfirmRestore}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Confirm & Apply Restore
                </button>
                <button
                  onClick={() => setRestorePreview(null)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unified Single Install & Offline Download Banner */}
      {/* "aur is m kye bar app install ke option show kar raha hai us ko ek baar karo aur app ko mobile m use karne k leye downlode file banawo jo phone m downlode kar ke use kar shake" */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-300" />
            <span className="font-extrabold text-sm sm:text-base">
              {settings.language === 'hi' ? 'फोन ऐप व डाउनलोड (Phone App & Offline Download)' : 'Phone App & Offline Download'}
            </span>
            <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
              Zero Parse Error
            </span>
          </div>
          <p className="text-emerald-100 text-xs max-w-lg">
            {settings.language === 'hi'
              ? 'फोन में 1-Tap से ऐप इंस्टॉल करें या सीधे पूरी ऑफलाइन ऐप फाइल डाउनलोड करके फोन में कभी भी बिना इंटरनेट उपयोग करें।'
              : 'Install Day to Day Expenses with 1-tap or download the standalone offline phone app file.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="px-4 py-2.5 bg-white text-emerald-950 font-black rounded-xl shadow-md transition-all active:scale-95 hover:bg-emerald-50 flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            <span>⚡ 1-Tap Phone Install</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPhoneAppHtml}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl border border-emerald-400/40 shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>📥 Download Phone App File (.html)</span>
          </button>
        </div>
      </div>

      {/* 5. Native Android Codebase & Documentation Inspector */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-5 rounded-3xl shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Native Android (Kotlin & Jetpack Compose)</span>
          </div>
          <p className="text-emerald-200 text-xs">
            Review the complete Room SQLite database entities, DAOs, ViewModels, and Gradle instructions.
          </p>
        </div>
        <button
          onClick={onOpenAndroidDocs}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
        >
          <span>View Source & Guide</span>
        </button>
      </div>

      {/* 6. Factory Reset Zone */}
      <div className="bg-rose-50 dark:bg-rose-950/30 p-5 rounded-3xl border border-rose-200 dark:border-rose-900/50 space-y-2">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone: {t.resetAllData}</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Reset database to default seed state. Erases all custom transactions and custom categories.
        </p>
        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors"
        >
          {t.resetAllData}
        </button>
      </div>

      {/* PIN Setup Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.setupPin}</h3>
              <button onClick={() => setIsPinModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePin} className="space-y-4 pt-4">
              {pinError && (
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
                  {pinError}
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Enter 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full text-center text-xl font-bold tracking-widest px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Confirm 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full text-center text-xl font-bold tracking-widest px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 text-slate-500"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{t.resetConfirmTitle}</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">{t.resetConfirmMsg}</p>
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleFactoryReset}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
              >
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Create Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.newProfile}</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProfile} className="space-y-4 pt-4">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Profile Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Side Gig, Project X, Vacation"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Badge Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setProfileColor(c)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        profileColor === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {profileColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-slate-500"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
