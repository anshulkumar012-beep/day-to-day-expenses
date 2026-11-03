/**
 * Core Domain Models for Day-to-day Expenses
 */

export type TransactionType = 'income' | 'expense' | 'transfer';

export type AccountType = 'cash' | 'bank' | 'credit_card' | 'wallet' | 'custom';

export type SupportedCurrency = 'NPR' | 'INR' | 'USD' | 'EUR' | 'GBP';

export type SupportedLanguage = 'en' | 'hi';

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'financial_year' | 'custom';

export interface Profile {
  id: string; // 'home' | 'office' | custom UUID
  name: string;
  nameHi?: string;
  icon: string;
  color: string;
  isArchived: boolean;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameHi?: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isArchived: boolean;
  subcategories: string[];
  isSystem: boolean;
}

export interface Account {
  id: string;
  name: string;
  nameHi?: string;
  type: AccountType;
  initialBalance: number; // in standard currency units
  color: string;
  icon: string;
  accountNumberMasked?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // Positive number, accurate to 2 decimals
  currency: SupportedCurrency;
  date: string; // ISO format 'YYYY-MM-DD'
  time: string; // 'HH:MM'
  profileId: string; // references Profile.id
  categoryId: string; // references Category.id
  subCategory?: string;
  accountId: string; // source account references Account.id
  toAccountId?: string; // destination account for 'transfer' type
  description: string;
  notes?: string;
  referenceNo?: string;
  receiptImage?: string; // base64 or URL
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  language: SupportedLanguage;
  currency: SupportedCurrency;
  financialYearStartMonth: number; // 1 to 12 (Default 7 for Nepal Shrawan, 4 for India April)
  theme: 'system' | 'light' | 'dark' | 'midnight' | 'forest' | 'sunset' | 'slate';
  themeContrast?: 'normal' | 'high';
  defaultProfileId: string;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD MMMM, YYYY';
  isAppLocked: boolean;
  securityPin?: string;
  biometricEnabled: boolean;
  autoLockMinutes: number;
  carryForwardMonthlyBalance?: boolean;
  showCalculatorInAmount?: boolean;
  disableAutoSuggestions?: boolean;
  googleAccountEmail?: string;
  lastBackupTimestamp?: string;
  lastBackupSize?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  transactionCount: number;
  categoryBreakdown: {
    category: Category;
    amount: number;
    count: number;
    percentage: number;
  }[];
  incomeBreakdown: {
    category: Category;
    amount: number;
    count: number;
    percentage: number;
  }[];
  dailyBreakdown: {
    date: string;
    income: number;
    expense: number;
    net: number;
  }[];
}

export interface CustomerUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  status: 'active' | 'suspended';
  role: 'customer' | 'admin';
  createdAt: string;
  lastLoginAt: string;
  updatedAt?: string;
  transactionCount?: number;
}

export interface GlobalCategory {
  id: string;
  name: string;
  nameHi?: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isArchived: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppConfig {
  appName: string;
  appLogo?: string;
  maintenanceMode: {
    enabled: boolean;
    message: string;
    startedAt?: string;
  };
  features: {
    voiceInput: boolean;
    standaloneDownload: boolean;
    pinLock: boolean;
    pdfExport: boolean;
    excelExport: boolean;
    customCategories: boolean;
  };
  supportedCurrencies: SupportedCurrency[];
  supportedLanguages: SupportedLanguage[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'update' | 'critical';
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface AdminLog {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

