import React, { useState, useMemo } from 'react';
import { Account, AppSettings, Category, Profile, SupportedCurrency, Transaction } from '../types';
import { formatCurrency } from '../utils/i18n';
import { computeFinancialSummary } from '../utils/calculations';
import { exportToPDF } from '../utils/exportEngine';
import {
  X,
  FileDown,
  Share2,
  Calendar,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  ChevronDown,
  ReceiptText,
} from 'lucide-react';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  profiles: Profile[];
  currentProfileId: string;
  settings: AppSettings;
  currency: SupportedCurrency;
  lang: 'en' | 'hi';
  initialPeriod?: 'all' | 'monthly' | 'yearly' | 'custom';
  initialMonth?: number;
  initialYear?: number;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  accounts,
  profiles,
  currentProfileId,
  settings,
  currency,
  lang,
  initialPeriod = 'monthly',
  initialMonth = new Date().getMonth() + 1,
  initialYear = new Date().getFullYear(),
}) => {
  // 1st Row Filter: Time Period ('all' | 'monthly' | 'yearly' | 'custom')
  const [periodFilter, setPeriodFilter] = useState<'all' | 'monthly' | 'yearly' | 'custom'>(initialPeriod);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // 2nd Row Filter: Transaction Type ('all' | 'expense' | 'income')
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');

  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Months list for dropdown
  const months = [
    { value: 1, nameEn: 'January', nameHi: 'जनवरी' },
    { value: 2, nameEn: 'February', nameHi: 'फ़रवरी' },
    { value: 3, nameEn: 'March', nameHi: 'मार्च' },
    { value: 4, nameEn: 'April', nameHi: 'अप्रैल' },
    { value: 5, nameEn: 'May', nameHi: 'मई' },
    { value: 6, nameEn: 'June', nameHi: 'जून' },
    { value: 7, nameEn: 'July', nameHi: 'जुलाई' },
    { value: 8, nameEn: 'August', nameHi: 'अगस्त' },
    { value: 9, nameEn: 'September', nameHi: 'सितंबर' },
    { value: 10, nameEn: 'October', nameHi: 'अक्टूबर' },
    { value: 11, nameEn: 'November', nameHi: 'नवंबर' },
    { value: 12, nameEn: 'December', nameHi: 'दिसंबर' },
  ];

  // Available years from transactions
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());
    transactions.forEach((tx) => {
      const y = parseInt(tx.date.substring(0, 4), 10);
      if (!isNaN(y)) yearsSet.add(y);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions]);

  // Filter Transactions by Profile + Time + Type
  const filteredData = useMemo(() => {
    // 1. Profile filter
    let list = transactions.filter((tx) => {
      if (currentProfileId === 'all') return true;
      return tx.profileId === currentProfileId;
    });

    // 2. 1st Row Time Period Filter
    if (periodFilter === 'monthly') {
      const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      list = list.filter((tx) => tx.date.startsWith(monthPrefix));
    } else if (periodFilter === 'yearly') {
      const yearPrefix = `${selectedYear}-`;
      list = list.filter((tx) => tx.date.startsWith(yearPrefix));
    } else if (periodFilter === 'custom') {
      list = list.filter((tx) => {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
        return true;
      });
    }

    // 3. 2nd Row Transaction Type Filter
    if (typeFilter === 'income') {
      list = list.filter((tx) => tx.type === 'income');
    } else if (typeFilter === 'expense') {
      list = list.filter((tx) => tx.type === 'expense');
    }

    // Sort by date descending
    list.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

    // Summary
    const summary = computeFinancialSummary(list, categories);

    return { list, summary };
  }, [
    transactions,
    currentProfileId,
    periodFilter,
    selectedMonth,
    selectedYear,
    customStartDate,
    customEndDate,
    typeFilter,
    categories,
  ]);

  if (!isOpen) return null;

  // Active profile label
  const activeProf = profiles.find((p) => p.id === currentProfileId);
  const profileName = currentProfileId === 'all' ? 'All Profiles' : activeProf?.name || currentProfileId;

  // Period label for export filename and report header
  let periodLabel = 'All Time';
  if (periodFilter === 'monthly') {
    const mObj = months.find((m) => m.value === selectedMonth);
    periodLabel = `${mObj?.nameEn || 'Month'} ${selectedYear}`;
  } else if (periodFilter === 'yearly') {
    periodLabel = `Year ${selectedYear}`;
  } else if (periodFilter === 'custom') {
    periodLabel = `${customStartDate} to ${customEndDate}`;
  }

  const typeLabel =
    typeFilter === 'income'
      ? lang === 'hi' ? 'केवल आय' : 'Income Only'
      : typeFilter === 'expense'
      ? lang === 'hi' ? 'केवल खर्च' : 'Expense Only'
      : lang === 'hi' ? 'आय व खर्च' : 'All Transactions';

  // Handle PDF Download
  const handleDownloadPdf = () => {
    exportToPDF({
      profileLabel: `${profileName} (${typeLabel})`,
      periodLabel,
      settings,
      summary: filteredData.summary,
      transactions: filteredData.list,
      categories,
      accounts,
      profiles,
    });
  };

  // Handle Share Statement
  const handleShareStatement = async () => {
    const mObj = months.find((m) => m.value === selectedMonth);
    const summaryText =
      `*Day-to-day Expenses Statement*\n` +
      `Profile: ${profileName}\n` +
      `Period: ${periodLabel}\n` +
      `Filter: ${typeLabel}\n` +
      `Entries: ${filteredData.list.length}\n` +
      `Total Income: +${formatCurrency(filteredData.summary.totalIncome, currency)}\n` +
      `Total Expense: -${formatCurrency(filteredData.summary.totalExpenses, currency)}\n` +
      `Net Savings: ${filteredData.summary.netSavings >= 0 ? '+' : ''}${formatCurrency(
        filteredData.summary.netSavings,
        currency
      )}\n` +
      `Generated on ${new Date().toLocaleDateString()}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Statement - ${periodLabel}`,
          text: summaryText,
        });
        setShareSuccess(lang === 'hi' ? 'सफलतापूर्वक शेयर किया गया!' : 'Statement shared successfully!');
        setTimeout(() => setShareSuccess(null), 3000);
      } catch (err) {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(summaryText);
        setShareSuccess(lang === 'hi' ? 'स्टेटमेंट कॉपी हो गया!' : 'Statement copied to clipboard!');
        setTimeout(() => setShareSuccess(null), 3000);
      }
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(summaryText);
      setShareSuccess(lang === 'hi' ? 'स्टेटमेंट कॉपी हो गया!' : 'Statement summary copied to clipboard!');
      setTimeout(() => setShareSuccess(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
              <FileDown className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-900 dark:text-white truncate">
                {lang === 'hi' ? 'पीडीएफ स्टेटमेंट रिपोर्ट' : 'PDF Statement & Report'}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {profileName} • {currency}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* ========================================================= */}
          {/* 1ST ROW: TIME PERIOD FILTER (4 BOXES) */}
          {/* "1st row m ek box all time, 2nd box m monthly name wise,next year wise, nest custom date range" */}
          {/* ========================================================= */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {lang === 'hi' ? '1. समय अवधि चुनें (Time Period)' : '1. Select Time Period'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Box 1: All Time */}
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  periodFilter === 'all'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400 font-black shadow-xs ring-2 ring-rose-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100'
                }`}
              >
                <div className="text-xs">{lang === 'hi' ? 'पूरा समय' : 'All Time'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Lifetime</div>
              </button>

              {/* Box 2: Monthly Name Wise */}
              <button
                type="button"
                onClick={() => setPeriodFilter('monthly')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  periodFilter === 'monthly'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400 font-black shadow-xs ring-2 ring-rose-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100'
                }`}
              >
                <div className="text-xs">{lang === 'hi' ? 'माहवार' : 'Monthly'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Name Wise</div>
              </button>

              {/* Box 3: Year Wise */}
              <button
                type="button"
                onClick={() => setPeriodFilter('yearly')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  periodFilter === 'yearly'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400 font-black shadow-xs ring-2 ring-rose-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100'
                }`}
              >
                <div className="text-xs">{lang === 'hi' ? 'सालवार' : 'Year Wise'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Annual</div>
              </button>

              {/* Box 4: Custom Date Range */}
              <button
                type="button"
                onClick={() => setPeriodFilter('custom')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  periodFilter === 'custom'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400 font-black shadow-xs ring-2 ring-rose-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100'
                }`}
              >
                <div className="text-xs">{lang === 'hi' ? 'कस्टम तारीख' : 'Custom Range'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Date Range</div>
              </button>
            </div>

            {/* Sub-inputs for Monthly / Yearly / Custom Range */}
            {periodFilter === 'monthly' && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[130px]">
                  <span className="block text-[10px] font-bold text-slate-400 mb-1">
                    {lang === 'hi' ? 'महीना चुनें' : 'Select Month'}
                  </span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full p-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {lang === 'hi' ? m.nameHi : m.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <span className="block text-[10px] font-bold text-slate-400 mb-1">
                    {lang === 'hi' ? 'वर्ष चुनें' : 'Select Year'}
                  </span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full p-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {periodFilter === 'yearly' && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] font-bold text-slate-400 mb-1">
                  {lang === 'hi' ? 'वर्ष चुनें' : 'Select Year'}
                </span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full p-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {periodFilter === 'custom' && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 mb-1">
                    {lang === 'hi' ? 'शुरुआती तारीख' : 'Start Date'}
                  </span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full p-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                  </input>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 mb-1">
                    {lang === 'hi' ? 'अंतिम तारीख' : 'End Date'}
                  </span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full p-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                  </input>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 2ND ROW: TRANSACTION TYPE FILTER (3 BOXES) */}
          {/* "2nd row m ek box all, nest expense nest income se data filter ho" */}
          {/* ========================================================= */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {lang === 'hi' ? '2. डेटा प्रकार चुनें (Data Type)' : '2. Select Data Type'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Box 1: All */}
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  typeFilter === 'all'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 font-black shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100'
                }`}
              >
                <div className="text-xs">{lang === 'hi' ? 'सभी (All)' : 'All'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Income & Expense</div>
              </button>

              {/* Box 2: Expense */}
              <button
                type="button"
                onClick={() => setTypeFilter('expense')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  typeFilter === 'expense'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400 font-black shadow-xs ring-2 ring-rose-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100'
                }`}
              >
                <div className="text-xs">{lang === 'hi' ? 'केवल खर्च' : 'Expense'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Expense Only</div>
              </button>

              {/* Box 3: Income */}
              <button
                type="button"
                onClick={() => setTypeFilter('income')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  typeFilter === 'income'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100'
                }`}
              >
                <div className="text-xs">{lang === 'hi' ? 'केवल आय' : 'Income'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Income Only</div>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* FILTERED SUMMARY PREVIEW */}
          {/* ========================================================= */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>{lang === 'hi' ? 'फिल्टर सारांश' : 'Filtered Summary'}</span>
              <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full text-[10px] font-black text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {filteredData.list.length} {lang === 'hi' ? 'रिकॉर्ड्स' : 'records'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 min-w-0">
                <span className="block text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase truncate">
                  Income
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block truncate">
                  +{formatCurrency(filteredData.summary.totalIncome, currency)}
                </span>
              </div>

              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 min-w-0">
                <span className="block text-[9px] font-bold text-rose-500 uppercase truncate">
                  Expense
                </span>
                <span className="text-xs font-black text-rose-500 block truncate">
                  -{formatCurrency(filteredData.summary.totalExpenses, currency)}
                </span>
              </div>

              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 min-w-0">
                <span className="block text-[9px] font-bold text-slate-500 uppercase truncate">
                  Saving
                </span>
                <span
                  className={`text-xs font-black block truncate ${
                    filteredData.summary.netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                  }`}
                >
                  {filteredData.summary.netSavings >= 0 ? '+' : ''}
                  {formatCurrency(filteredData.summary.netSavings, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Notification if share or copied */}
          {shareSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{shareSuccess}</span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* BOTTOM ACTION BAR: DOWNLOAD & SHARE LOGOS */}
        {/* "jo niche download aur shear karne ka logo show kare" */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center gap-3">
          {/* Download PDF Logo Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
            title="Download PDF Statement"
          >
            <FileDown className="w-4 h-4 stroke-[2.3]" />
            <span>{lang === 'hi' ? 'पीडीएफ डाउनलोड करें' : 'Download PDF'}</span>
          </button>

          {/* Share Statement Logo Button */}
          <button
            type="button"
            onClick={handleShareStatement}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            title="Share Statement"
          >
            <Share2 className="w-4 h-4 stroke-[2.3]" />
            <span>{lang === 'hi' ? 'शेयर करें' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
