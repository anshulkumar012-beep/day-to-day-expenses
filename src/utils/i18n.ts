import { SupportedCurrency, SupportedLanguage } from '../types';

export const CURRENCY_METADATA: Record<SupportedCurrency, { symbol: string; name: string; nativeName: string; locale: string }> = {
  NPR: {
    symbol: 'रु',
    name: 'Nepalese Rupee (NPR)',
    nativeName: 'नेपाली रुपैयाँ',
    locale: 'ne-NP',
  },
  INR: {
    symbol: '₹',
    name: 'Indian Rupee (INR)',
    nativeName: 'भारतीय रुपया',
    locale: 'en-IN',
  },
  USD: {
    symbol: '$',
    name: 'US Dollar (USD)',
    nativeName: 'US Dollar',
    locale: 'en-US',
  },
  EUR: {
    symbol: '€',
    name: 'Euro (EUR)',
    nativeName: 'Euro',
    locale: 'de-DE',
  },
  GBP: {
    symbol: '£',
    name: 'British Pound (GBP)',
    nativeName: 'British Pound',
    locale: 'en-GB',
  },
};

export const translations = {
  en: {
    appName: 'Day to Day Expenses',
    appTagline: 'Simple, Fast & Secure Personal Finance',
    // Navigation
    navDashboard: 'Dashboard',
    navTransactions: 'Transactions',
    navReports: 'Reports',
    navAccounts: 'Accounts',
    navCategories: 'Categories',
    navSettings: 'Settings',

    // Profiles
    profileHome: 'Home',
    profileOffice: 'Office / Business',
    profileAll: 'All Profiles (Combined)',
    currentProfile: 'Current Profile',
    switchProfile: 'Switch Profile',
    manageProfiles: 'Manage Profiles',
    newProfile: 'New Profile',
    profileIsolatedNotice: 'Transactions are isolated to this profile.',

    // Dashboard metrics
    todayIncome: "Today's Income",
    todayExpense: "Today's Expense",
    todayNet: "Today's Net Balance",
    monthIncome: "Month's Total Income",
    monthExpense: "Month's Total Expense",
    monthSavings: 'Net Savings this Month',
    homeSummary: 'Home Finances',
    officeSummary: 'Office / Business Finances',
    recentTransactions: 'Recent Transactions',
    viewAll: 'View All',
    noTransactionsYet: 'No transactions recorded yet.',
    noTransactionsMatch: 'No transactions match your search/filter.',
    quickAddIncome: 'Add Income',
    quickAddExpense: 'Add Expense',
    transferFunds: 'Transfer Funds',

    // Transaction terms
    income: 'Income',
    expense: 'Expense',
    transfer: 'Transfer',
    amount: 'Amount',
    date: 'Date',
    time: 'Time',
    category: 'Category',
    subcategory: 'Subcategory',
    profile: 'Profile',
    paymentAccount: 'Payment Account',
    sourceAccount: 'From Account',
    destinationAccount: 'To Account',
    description: 'Description',
    notes: 'Notes / Remarks',
    referenceNo: 'Ref / Bill Number',
    receiptAttachment: 'Receipt / Bill Photo',
    uploadPhoto: 'Attach Photo',
    removePhoto: 'Remove Photo',
    saveTransaction: 'Save Transaction',
    editTransaction: 'Edit Transaction',
    duplicateTransaction: 'Duplicate',
    deleteTransaction: 'Delete',
    moveToProfile: 'Move to Profile',
    transactionSaved: 'Transaction recorded successfully!',
    transactionUpdated: 'Transaction updated successfully!',
    transactionDeleted: 'Transaction deleted.',
    undo: 'Undo',

    // Categories
    categoriesTitle: 'Expense & Income Categories',
    addCategory: 'Add Category',
    editCategory: 'Edit Category',
    archiveCategory: 'Archive Category',
    categoryName: 'Category Name',
    categoryColor: 'Color Badge',
    categoryIcon: 'Icon',
    expenseCategories: 'Expense Categories',
    incomeCategories: 'Income Categories',

    // Reports
    reportsAnalytics: 'Reports & Analytics',
    periodDaily: 'Daily',
    periodWeekly: 'Weekly',
    periodMonthly: 'Monthly',
    periodQuarterly: 'Quarterly',
    periodYearly: 'Yearly',
    periodFY: 'Financial Year',
    periodCustom: 'Custom Range',
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    netCashFlow: 'Net Cash Flow',
    transactionsCount: 'Transactions Count',
    topSpendingCategories: 'Top Spending Categories',
    spendingTrend: 'Spending Trends',
    categoryProportions: 'Category Breakdown',
    vsPreviousPeriod: 'vs previous period',
    exportReport: 'Export Report',
    exportPDF: 'Export as PDF',
    exportExcel: 'Export as Excel (.xlsx)',
    exportCSV: 'Export as CSV',

    // Accounts
    accountsBalances: 'Accounts & Balances',
    addAccount: 'Add Account',
    cashInHand: 'Cash in Hand',
    bankAccount: 'Bank Account',
    creditCard: 'Credit Card',
    digitalWallet: 'Digital Wallet',
    currentBalance: 'Current Balance',
    initialBalance: 'Opening Balance',
    accountDisclaimer: 'Accurate balances reflect opening balance plus all tracked transactions and transfers.',

    // Settings & Security
    settingsTitle: 'Settings & Preferences',
    languageSetting: 'Language',
    currencySetting: 'Currency',
    themeSetting: 'Theme',
    financialYearSetting: 'Financial Year Start Month',
    fyHint: 'Nepal starts Shrawan (Month 7), India starts April (Month 4)',
    securityPinSetting: 'App Security Lock (PIN)',
    pinEnabled: 'PIN Lock is enabled',
    pinDisabled: 'No PIN set (unlocked)',
    changePin: 'Change PIN',
    setupPin: 'Set 4-Digit PIN',
    biometricUnlock: 'Biometric / Fingerprint Unlock',
    backupRestore: 'Backup & Restore',
    backupDatabase: 'Create Encrypted Backup (JSON)',
    restoreDatabase: 'Restore from Backup File',
    resetAllData: 'Factory Reset All Data',
    resetConfirmTitle: 'Are you absolutely sure?',
    resetConfirmMsg: 'This will erase all transactions, custom categories and accounts. This action cannot be undone.',
    confirmDelete: 'Confirm Deletion',
    cancel: 'Cancel',
    save: 'Save',
    searchPlaceholder: 'Search transactions, bills, notes...',
    allTypes: 'All Types',
    allAccounts: 'All Accounts',
    allCategories: 'All Categories',

    // Device View Mode
    viewMode: 'Display Mode',
    viewModeAndroid: 'Android Phone Preview',
    viewModeResponsive: 'Desktop Full-Width',
  },
  hi: {
    appName: 'Day to Day Expenses',
    appTagline: 'सरल, तेज़ और सुरक्षित व्यक्तिगत वित्त ट्रैकर',
    // Navigation
    navDashboard: 'डैशबोर्ड',
    navTransactions: 'लेन-देन',
    navReports: 'रिपोर्ट्स',
    navAccounts: 'खाते',
    navCategories: 'श्रेणियां',
    navSettings: 'सेटिंग्स',

    // Profiles
    profileHome: 'घर (Home)',
    profileOffice: 'ऑफिस / व्यापार',
    profileAll: 'सभी प्रोफाइल (संयुक्त)',
    currentProfile: 'वर्तमान प्रोफाइल',
    switchProfile: 'प्रोफाइल बदलें',
    manageProfiles: 'प्रोफाइल प्रबंधित करें',
    newProfile: 'नया प्रोफाइल',
    profileIsolatedNotice: 'इस प्रोफाइल का हिसाब अलग सुरक्षित रखा जाता है।',

    // Dashboard metrics
    todayIncome: 'आज की आय',
    todayExpense: 'आज का खर्च',
    todayNet: 'आज का शुद्ध शेष',
    monthIncome: 'इस माह कुल आय',
    monthExpense: 'इस माह कुल खर्च',
    monthSavings: 'इस माह की शुद्ध बचत',
    homeSummary: 'घरेलू खर्च',
    officeSummary: 'कार्यालय / व्यापार खर्च',
    recentTransactions: 'हाल के लेन-देन',
    viewAll: 'सभी देखें',
    noTransactionsYet: 'अभी कोई लेन-देन दर्ज नहीं है।',
    noTransactionsMatch: 'खोज के अनुसार कोई लेन-देन नहीं मिला।',
    quickAddIncome: 'आय जोड़ें',
    quickAddExpense: 'खर्च जोड़ें',
    transferFunds: 'खाता ट्रांसफर',

    // Transaction terms
    income: 'आय',
    expense: 'खर्च',
    transfer: 'ट्रांसफर',
    amount: 'राशि',
    date: 'तारीख',
    time: 'समय',
    category: 'श्रेणी',
    subcategory: 'उप-श्रेणी',
    profile: 'प्रोफाइल',
    paymentAccount: 'भुगतान खाता',
    sourceAccount: 'किस खाते से',
    destinationAccount: 'किस खाते में',
    description: 'विवरण',
    notes: 'टिप्पणी / नोट्स',
    referenceNo: 'बिल / संदर्भ संख्या',
    receiptAttachment: 'रसीद / बिल फोटो',
    uploadPhoto: 'फोटो लगाएं',
    removePhoto: 'फोटो हटाएं',
    saveTransaction: 'लेन-देन सहेजें',
    editTransaction: 'लेन-देन संपादित करें',
    duplicateTransaction: 'प्रतिलिपि बनाएं',
    deleteTransaction: 'हटाएं',
    moveToProfile: 'प्रोफाइल बदलें',
    transactionSaved: 'लेन-देन सफलतापूर्वक सहेजा गया!',
    transactionUpdated: 'लेन-देन अपडेट हो गया!',
    transactionDeleted: 'लेन-देन हटाया गया।',
    undo: 'पूर्ववत करें (Undo)',

    // Categories
    categoriesTitle: 'खर्च और आय की श्रेणियां',
    addCategory: 'श्रेणी जोड़ें',
    editCategory: 'श्रेणी संपादित करें',
    archiveCategory: 'श्रेणी संग्रहीत करें',
    categoryName: 'श्रेणी का नाम',
    categoryColor: 'रंग बैज',
    categoryIcon: 'आइकन',
    expenseCategories: 'खर्च की श्रेणियां',
    incomeCategories: 'आय की श्रेणियां',

    // Reports
    reportsAnalytics: 'रिपोर्ट एवं विश्लेषण',
    periodDaily: 'दैनिक',
    periodWeekly: 'साप्ताहिक',
    periodMonthly: 'मासिक',
    periodQuarterly: 'त्रैमासिक',
    periodYearly: 'वार्षिक',
    periodFY: 'वित्तीय वर्ष',
    periodCustom: 'कस्टम अवधि',
    totalIncome: 'कुल आय',
    totalExpenses: 'कुल खर्च',
    netCashFlow: 'शुद्ध नकदी प्रवाह',
    transactionsCount: 'लेन-देन संख्या',
    topSpendingCategories: 'अधिकतम खर्च वाली श्रेणियां',
    spendingTrend: 'खर्च का रुझान',
    categoryProportions: 'श्रेणीवार विवरण',
    vsPreviousPeriod: 'पिछली अवधि की तुलना में',
    exportReport: 'रिपोर्ट निर्यात करें',
    exportPDF: 'PDF रूप में डाउनलोड करें',
    exportExcel: 'Excel (.xlsx) डाउनलोड करें',
    exportCSV: 'CSV डाउनलोड करें',

    // Accounts
    accountsBalances: 'खाते एवं शेष राशि',
    addAccount: 'खाता जोड़ें',
    cashInHand: 'नकद (Cash)',
    bankAccount: 'बैंक खाता',
    creditCard: 'क्रेडिट कार्ड',
    digitalWallet: 'डिजिटल वॉलेट',
    currentBalance: 'वर्तमान शेष',
    initialBalance: 'प्रारंभिक शेष',
    accountDisclaimer: 'सटीक शेष राशि प्रारंभिक शेष और सभी लेन-देन पर आधारित होती है।',

    // Settings & Security
    settingsTitle: 'सेटिंग्स और प्राथमिकताएं',
    languageSetting: 'भाषा (Language)',
    currencySetting: 'मुद्रा (Currency)',
    themeSetting: 'थीम (Theme)',
    financialYearSetting: 'वित्तीय वर्ष प्रारंभ माह',
    fyHint: 'नेपाल: सावन (माह 7), भारत: अप्रैल (माह 4)',
    securityPinSetting: 'ऐप सुरक्षा लॉक (PIN)',
    pinEnabled: 'पिन लॉक सक्रिय है',
    pinDisabled: 'कोई पिन नहीं (अनलॉक)',
    changePin: 'पिन बदलें',
    setupPin: '4-अंकीय पिन बनाएं',
    biometricUnlock: 'बायोमेट्रिक / फिंगरप्रिंट लॉक',
    backupRestore: 'बैकअप एवं रीस्टोर',
    backupDatabase: 'बैकअप फ़ाइल बनाएं (JSON)',
    restoreDatabase: 'बैकअप फ़ाइल से रीस्टोर करें',
    resetAllData: 'सभी डेटा फ़ैक्टरी रीसेट करें',
    resetConfirmTitle: 'क्या आप पूरी तरह सुनिश्चित हैं?',
    resetConfirmMsg: 'यह सभी लेन-देन, खाते और कस्टम श्रेणियां मिटा देगा। यह क्रिया पूर्ववत नहीं की जा सकती।',
    confirmDelete: 'हटाने की पुष्टि करें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    searchPlaceholder: 'लेन-देन, बिल, विवरण खोजें...',
    allTypes: 'सभी प्रकार',
    allAccounts: 'सभी खाते',
    allCategories: 'सभी श्रेणियां',

    // Device View Mode
    viewMode: 'डिस्प्ले मोड',
    viewModeAndroid: 'एंड्रॉइड फोन प्रीव्यू',
    viewModeResponsive: 'डेस्कटॉप फुल-स्क्रीन',
  },
};

/**
 * Format number in standard English digits with 2 decimals,
 * strictly without any currency symbol (₹, रु) and without +/- signs.
 */
export function formatPlainAmount(amount: number): string {
  const absAmount = Math.abs(Number(amount) || 0);
  return absAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format savings amount in English digits:
 * If negative, strictly prepends '-' e.g. -4,789.00
 * If positive or zero, plain number e.g. 4,789.00
 */
export function formatSavingAmount(amount: number): string {
  const num = Number(amount) || 0;
  const absAmount = Math.abs(num);
  const formatted = absAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `-${formatted}` : formatted;
}

/**
 * Format currency with proper symbol and decimal precision
 */
export function formatCurrency(amount: number, currency: SupportedCurrency = 'NPR'): string {
  const meta = CURRENCY_METADATA[currency] || CURRENCY_METADATA.NPR;
  const absAmount = Math.abs(amount);
  
  // Format with standard locale formatter
  let formattedNumber: string;
  try {
    formattedNumber = absAmount.toLocaleString(meta.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    formattedNumber = absAmount.toFixed(2);
  }

  const sign = amount < 0 ? '-' : '';
  return `${sign}${meta.symbol} ${formattedNumber}`;
}

/**
 * Month names for Financial Year picker
 */
export const MONTHS = [
  { value: 1, en: 'January', hi: 'जनवरी' },
  { value: 2, en: 'February', hi: 'फ़रवरी' },
  { value: 3, en: 'March', hi: 'मार्च' },
  { value: 4, en: 'April (India FY Start)', hi: 'अप्रैल (भारतीय FY)' },
  { value: 5, en: 'May', hi: 'मई' },
  { value: 6, en: 'June', hi: 'जून' },
  { value: 7, en: 'July / Shrawan (Nepal FY Start)', hi: 'जुलाई / सावन (नेपाल FY)' },
  { value: 8, en: 'August', hi: 'अगस्त' },
  { value: 9, en: 'September', hi: 'सितंबर' },
  { value: 10, en: 'October', hi: 'अक्टूबर' },
  { value: 11, en: 'November', hi: 'नवंबर' },
  { value: 12, en: 'December', hi: 'दिसंबर' },
];

/**
 * Format date according to user preference in AppSettings
 */
export function formatCustomDate(
  dateStr: string,
  format: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD MMMM, YYYY' = 'DD MMMM, YYYY',
  lang: 'en' | 'hi' = 'en'
): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const monthObj = MONTHS[month - 1];
  const monthName = lang === 'hi' ? (monthObj?.hi?.split(' ')[0] || '') : (monthObj?.en?.split(' ')[0] || '');

  switch (format) {
    case 'DD/MM/YYYY':
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    case 'MM/DD/YYYY':
      return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    case 'DD MMMM, YYYY':
    default:
      return `${day} ${monthName}, ${year}`;
  }
}
