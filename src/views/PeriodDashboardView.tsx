import React, { useState, useMemo, useEffect } from 'react';
import { Account, AppSettings, Category, Profile, SupportedCurrency, Transaction } from '../types';
import { translations, formatCurrency, formatPlainAmount, formatSavingAmount, CURRENCY_METADATA } from '../utils/i18n';
import { CategoryIcon } from '../components/CategoryIcon';
import { exportToPDF } from '../utils/exportEngine';
import { computeFinancialSummary } from '../utils/calculations';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  FileDown,
  Table,
  Pencil,
  FileText,
  Edit2,
  Wallet,
  Briefcase,
  Home,
} from 'lucide-react';

interface PeriodDashboardViewProps {
  currentProfileId: string;
  profiles: Profile[];
  settings: AppSettings;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onOpenAddModal: (type?: 'income' | 'expense' | 'transfer', defaultDate?: string) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onLongPressTransaction?: (tx: Transaction) => void;
  selectedContextualTxId?: string | null;
  activePeriod?: 'daily' | 'monthly' | 'yearly';
  onPeriodChange?: (period: 'daily' | 'monthly' | 'yearly') => void;
  onPeriodInfoChange?: (info: {
    selectedDate: string;
    selectedYear: number;
    selectedMonth: number;
    monthPrefix: string;
    monthTransactions: Transaction[];
    yearTransactions: Transaction[];
  }) => void;
}

export const PeriodDashboardView: React.FC<PeriodDashboardViewProps> = ({
  currentProfileId,
  profiles,
  settings,
  transactions,
  categories,
  accounts,
  onOpenAddModal,
  onSelectTransaction,
  onLongPressTransaction,
  selectedContextualTxId,
  activePeriod: externalActivePeriod,
  onPeriodChange,
  onPeriodInfoChange,
}) => {
  const t = translations[settings.language];
  const currency = settings.currency;

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Selected / Expanded transaction ID for showing details on row click
  // "us row par clike karne par details show karo"
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Mobile Long-press gesture handling for contextual editing
  // "daily m jo data hai us ko phone m long press karne par wo data ko edit karne ka option..."
  const itemLongPressTimerRef = React.useRef<any>(null);
  const handleItemTouchStart = (tx: Transaction) => {
    itemLongPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(60);
        } catch {
          // ignore
        }
      }
      onLongPressTransaction?.(tx);
    }, 450);
  };
  const handleItemTouchEnd = () => {
    if (itemLongPressTimerRef.current) {
      clearTimeout(itemLongPressTimerRef.current);
      itemLongPressTimerRef.current = null;
    }
  };

  // Tab: 'daily' | 'monthly' | 'yearly'
  const [internalActivePeriod, setInternalActivePeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const activePeriod = externalActivePeriod || internalActivePeriod;

  const handlePeriodTabClick = (p: 'daily' | 'monthly' | 'yearly') => {
    setInternalActivePeriod(p);
    onPeriodChange?.(p);
  };

  // Robust swipe gesture support between Daily, Monthly, and Yearly views
  // "Mobile screen par ungli se Left / Right slide (swipe) karke aap aasaani se switch kar sakte hain:
  // Daily se Left swipe ➔ Monthly
  // Monthly se Left swipe ➔ Yearly
  // Yearly se Right swipe ➔ Monthly
  // Monthly se Right swipe ➔ Daily"
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const touchLastRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      touchLastRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchLastRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const processSwipeGesture = (endX: number, endY: number) => {
    if (!touchStartRef.current) return;
    const deltaX = endX - touchStartRef.current.x;
    const deltaY = endY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;
    touchLastRef.current = null;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Highly responsive horizontal swipe detection on mobile devices
    const isHorizontalSwipe =
      (absX >= 28 && absX > absY * 0.55) ||
      (elapsed < 450 && absX >= 20 && absX > absY * 0.4) ||
      absX >= 45;

    if (isHorizontalSwipe) {
      if (deltaX < 0) {
        // Swiped Left ➔ Daily -> Monthly -> Yearly
        if (activePeriod === 'daily') {
          handlePeriodTabClick('monthly');
        } else if (activePeriod === 'monthly') {
          handlePeriodTabClick('yearly');
        }
      } else {
        // Swiped Right ➔ Yearly -> Monthly -> Daily
        if (activePeriod === 'yearly') {
          handlePeriodTabClick('monthly');
        } else if (activePeriod === 'monthly') {
          handlePeriodTabClick('daily');
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0]?.clientX ?? touchLastRef.current?.x;
    const endY = e.changedTouches[0]?.clientY ?? touchLastRef.current?.y;
    if (endX !== undefined && endY !== undefined) {
      processSwipeGesture(endX, endY);
    }
  };

  const handleTouchCancel = () => {
    if (touchLastRef.current) {
      processSwipeGesture(touchLastRef.current.x, touchLastRef.current.y);
    } else {
      touchStartRef.current = null;
      touchLastRef.current = null;
    }
  };

  // Selected date references
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [yearlyMode, setYearlyMode] = useState<'fy' | 'calendar'>('fy'); // 'fy' = Financial Year (Apr-Mar), 'calendar' = Jan-Dec
  const [showYearlySummaryTable, setShowYearlySummaryTable] = useState<boolean>(false);

  // Quick + popup toggle for Daily view
  const [isDailyAddMenuOpen, setIsDailyAddMenuOpen] = useState(false);

  // Filter transactions by Profile
  const profileScopedTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (currentProfileId === 'all') return true;
      return tx.profileId === currentProfileId;
    });
  }, [transactions, currentProfileId]);

  // --- 1. DAILY DATA CALCULATIONS ---
  const dailyTransactions = useMemo(() => {
    return profileScopedTransactions.filter((tx) => tx.date === selectedDate);
  }, [profileScopedTransactions, selectedDate]);

  const dailyIncomes = useMemo(() => {
    return dailyTransactions.filter((tx) => tx.type === 'income');
  }, [dailyTransactions]);

  const dailyExpenses = useMemo(() => {
    return dailyTransactions.filter((tx) => tx.type === 'expense');
  }, [dailyTransactions]);

  const dailyTransfers = useMemo(() => {
    return dailyTransactions.filter((tx) => tx.type === 'transfer');
  }, [dailyTransactions]);

  const dailyTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    dailyTransactions.forEach((tx) => {
      if (tx.type === 'income') income += tx.amount;
      else if (tx.type === 'expense') expense += tx.amount;
    });
    const net = Math.round((income - expense) * 100) / 100;
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      net,
      saving: net, // income - expense = saving
    };
  }, [dailyTransactions]);

  const handleShiftDay = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Format selected date: e.g. dayNum 30, monthAndYear "October, 2026", dayName "Friday"
  const selectedDateParts = useMemo(() => {
    const parts = selectedDate.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const dObj = new Date(y, m - 1, d);
    const monthName = dObj.toLocaleString('en-US', { month: 'long' });
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
    return {
      dayNum: d,
      monthAndYear: `${monthName}, ${y}`,
      formattedDate: `${d} ${monthName}, ${y}`,
      dayName,
    };
  }, [selectedDate]);

  // --- 2. MONTHLY DATA (DATE-WISE BREAKDOWN) ---
  const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const monthlyTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    profileScopedTransactions.forEach((tx) => {
      if (tx.date.startsWith(monthPrefix)) {
        if (tx.type === 'income') income += tx.amount;
        else if (tx.type === 'expense') expense += tx.amount;
      }
    });
    const savings = Math.round((income - expense) * 100) / 100;
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      savings,
    };
  }, [profileScopedTransactions, monthPrefix]);

  // Cumulative carried forward balance from previous months before current month
  // "settings m date management m carry frward balance form one month to another ka option add karo"
  const carriedForwardBalance = useMemo(() => {
    if (!settings.carryForwardMonthlyBalance) return 0;
    let balance = 0;
    profileScopedTransactions.forEach((tx) => {
      if (tx.date < `${monthPrefix}-01`) {
        if (tx.type === 'income') balance += tx.amount;
        else if (tx.type === 'expense') balance -= tx.amount;
      }
    });
    return Math.round(balance * 100) / 100;
  }, [profileScopedTransactions, monthPrefix, settings.carryForwardMonthlyBalance]);

  // Generate Date-wise Cards for the month with full transaction entries
  // "aru jo month m date ka box bana hi us m date wise income ko ek side aur expense ko ek side likho aur us date ke pure entry so karo"
  const dateWiseCards = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; count: number; transactions: Transaction[] }>();
    profileScopedTransactions.forEach((tx) => {
      if (tx.date.startsWith(monthPrefix)) {
        const cur = map.get(tx.date) || { income: 0, expense: 0, count: 0, transactions: [] };
        if (tx.type === 'income') cur.income += tx.amount;
        else if (tx.type === 'expense') cur.expense += tx.amount;
        cur.count += 1;
        cur.transactions.push(tx);
        map.set(tx.date, cur);
      }
    });

    const cards = [];
    for (let day = daysInMonth; day >= 1; day--) {
      const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
      const data = map.get(dateStr);
      // "monthly aur yearly m jis din kye entry nahe wo show nahe karo sif jis din entry hai wahe show karo"
      if (data && data.count > 0) {
        const dObj = new Date(selectedYear, selectedMonth - 1, day);
        const dayName = dObj.toLocaleDateString(undefined, { weekday: 'long' });
        const monthName = dObj.toLocaleString('en-US', { month: 'long' });
        const saving = Math.round((data.income - data.expense) * 100) / 100;

        cards.push({
          dateStr,
          dayNumber: day,
          dayName,
          displayDate: `${day} ${monthName}, ${selectedYear}`,
          income: Math.round(data.income * 100) / 100,
          expense: Math.round(data.expense * 100) / 100,
          saving,
          count: data.count,
          transactions: data.transactions,
        });
      }
    }
    return cards;
  }, [profileScopedTransactions, monthPrefix, daysInMonth, selectedYear, selectedMonth]);

  const handleShiftMonth = (direction: -1 | 1) => {
    let m = selectedMonth + direction;
    let y = selectedYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  // --- 3. YEARLY DATA (WITH F.Y. & CALENDAR SUPPORT) ---
  // "yearly m f.y. se data add karo"
  const monthWiseRows = useMemo(() => {
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthShortEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesHi = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

    const monthList: { monthNumber: number; yearNumber: number; name: string; shortName: string; prefix: string }[] = [];

    // Financial Year start month: settings.financialYearStartMonth || (currency === 'NPR' ? 7 : 4)
    const fyStart = settings.financialYearStartMonth || (settings.currency === 'NPR' ? 7 : 4);

    if (yearlyMode === 'fy') {
      if (fyStart === 1) {
        // Starts in January (standard 1 to 12)
        for (let m = 1; m <= 12; m++) {
          monthList.push({
            monthNumber: m,
            yearNumber: selectedYear,
            name: settings.language === 'hi' ? monthNamesHi[m - 1] : monthNamesEn[m - 1],
            shortName: monthShortEn[m - 1],
            prefix: `${selectedYear}-${String(m).padStart(2, '0')}`,
          });
        }
      } else {
        // First part: fyStart to December of selectedYear
        for (let m = fyStart; m <= 12; m++) {
          monthList.push({
            monthNumber: m,
            yearNumber: selectedYear,
            name: settings.language === 'hi' ? monthNamesHi[m - 1] : monthNamesEn[m - 1],
            shortName: monthShortEn[m - 1],
            prefix: `${selectedYear}-${String(m).padStart(2, '0')}`,
          });
        }
        // Second part: January to fyStart - 1 of selectedYear + 1
        for (let m = 1; m < fyStart; m++) {
          monthList.push({
            monthNumber: m,
            yearNumber: selectedYear + 1,
            name: settings.language === 'hi' ? monthNamesHi[m - 1] : monthNamesEn[m - 1],
            shortName: monthShortEn[m - 1],
            prefix: `${selectedYear + 1}-${String(m).padStart(2, '0')}`,
          });
        }
      }
    } else {
      // Calendar Year (Jan to Dec of selectedYear)
      for (let m = 1; m <= 12; m++) {
        monthList.push({
          monthNumber: m,
          yearNumber: selectedYear,
          name: settings.language === 'hi' ? monthNamesHi[m - 1] : monthNamesEn[m - 1],
          shortName: monthShortEn[m - 1],
          prefix: `${selectedYear}-${String(m).padStart(2, '0')}`,
        });
      }
    }

    const rows = monthList.map((item) => {
      let mIncome = 0;
      let mExpense = 0;
      let mCount = 0;
      const mTransactions: Transaction[] = [];

      profileScopedTransactions.forEach((tx) => {
        if (tx.date.startsWith(item.prefix)) {
          if (tx.type === 'income') mIncome += tx.amount;
          else if (tx.type === 'expense') mExpense += tx.amount;
          mCount += 1;
          mTransactions.push(tx);
        }
      });

      return {
        monthNumber: item.monthNumber,
        yearNumber: item.yearNumber,
        prefix: item.prefix,
        name: item.name,
        shortName: item.shortName,
        income: Math.round(mIncome * 100) / 100,
        expense: Math.round(mExpense * 100) / 100,
        saving: Math.round((mIncome - mExpense) * 100) / 100,
        count: mCount,
        transactions: mTransactions,
      };
    });

    return rows;
  }, [profileScopedTransactions, selectedYear, yearlyMode, settings.financialYearStartMonth, settings.currency, settings.language]);

  // Filter out months with zero entries
  // "monthly aur yearly m jis din kye entry nahe wo show nahe karo sif jis din entry hai wahe show karo"
  const activeMonthWiseRows = useMemo(() => {
    return monthWiseRows.filter((m) => m.count > 0);
  }, [monthWiseRows]);

  const yearlyTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    monthWiseRows.forEach((row) => {
      income += row.income;
      expense += row.expense;
    });
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      savings: Math.round((income - expense) * 100) / 100,
    };
  }, [monthWiseRows]);

  // Formatting helper for standard Indian/International ledger numbers with 2 decimals
  const formatNumberWithDecimals = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const currencySymbol = CURRENCY_METADATA[currency]?.symbol || (currency === 'NPR' ? 'रु' : '₹');

  // Memoized transactions for month and year
  const monthTransactions = useMemo(() => {
    return profileScopedTransactions.filter((tx) => tx.date.startsWith(monthPrefix));
  }, [profileScopedTransactions, monthPrefix]);

  const yearTransactions = useMemo(() => {
    return monthWiseRows.flatMap((row) => row.transactions);
  }, [monthWiseRows]);

  // Synchronize period state and date info with parent
  useEffect(() => {
    onPeriodInfoChange?.({
      selectedDate,
      selectedYear,
      selectedMonth,
      monthPrefix,
      monthTransactions,
      yearTransactions,
    });
  }, [selectedDate, selectedYear, selectedMonth, monthPrefix, monthTransactions, yearTransactions, onPeriodInfoChange]);

  // PDF Export Handlers
  const exportMonthPdf = () => {
    const activeProfObj = profiles.find((p) => p.id === currentProfileId);
    const profileLabel = currentProfileId === 'all' ? 'All Profiles (Combined)' : activeProfObj?.name || currentProfileId;
    const summary = computeFinancialSummary(monthTransactions, categories);
    const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
    exportToPDF({
      profileLabel,
      periodLabel: `Monthly Statement - ${monthName}`,
      settings,
      summary,
      transactions: monthTransactions,
      categories,
      accounts,
      profiles,
    });
  };

  const exportYearPdf = () => {
    const activeProfObj = profiles.find((p) => p.id === currentProfileId);
    const profileLabel = currentProfileId === 'all' ? 'All Profiles (Combined)' : activeProfObj?.name || currentProfileId;
    const summary = computeFinancialSummary(yearTransactions, categories);
    const periodLabel = yearlyMode === 'fy'
      ? `Financial Year Statement - FY ${selectedYear}-${String(selectedYear + 1).slice(2)}`
      : `Annual Statement - Year ${selectedYear}`;
    exportToPDF({
      profileLabel,
      periodLabel,
      settings,
      summary,
      transactions: yearTransactions,
      categories,
      accounts,
      profiles,
    });
  };

  return (
    <div
      className="space-y-4 pb-20 touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* ========================================================= */}
      {/* UNIFIED FROZEN (STICKY) TOP HEADER:
          "daily, monthly,yearly,us k niche jo date ya month hai us k niche income,expense,saving tak frezz karo" */}
      {/* ========================================================= */}
      <div className="sticky top-[56px] sm:top-[60px] z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md pt-2 pb-2 space-y-2 -mx-1 px-1">
        {/* ROW 1: TAB SELECTOR MATCHING SCREENSHOT: [Pencil icon] Daily | Monthly | Yearly with bottom green underline indicator */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 rounded-xl px-1">
          <button
            type="button"
            onClick={() => onOpenAddModal('expense')}
            className="p-2.5 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex-shrink-0"
            title={settings.language === 'hi' ? 'लेन-देन जोड़ें' : 'Add Transaction'}
          >
            <Pencil className="w-4 h-4 -rotate-12 stroke-[2.2]" />
          </button>
          <button
            type="button"
            onClick={() => handlePeriodTabClick('daily')}
            className={`flex-1 py-2.5 text-center text-xs sm:text-sm transition-all ${
              activePeriod === 'daily'
                ? 'text-slate-950 dark:text-white border-b-2 border-emerald-900 dark:border-emerald-400 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 font-semibold'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => handlePeriodTabClick('monthly')}
            className={`flex-1 py-2.5 text-center text-xs sm:text-sm transition-all ${
              activePeriod === 'monthly'
                ? 'text-slate-950 dark:text-white border-b-2 border-emerald-900 dark:border-emerald-400 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 font-semibold'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => handlePeriodTabClick('yearly')}
            className={`flex-1 py-2.5 text-center text-xs sm:text-sm transition-all ${
              activePeriod === 'yearly'
                ? 'text-slate-950 dark:text-white border-b-2 border-emerald-900 dark:border-emerald-400 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 font-semibold'
            }`}
          >
            Yearly
          </button>
        </div>

        {/* ROW 2: FOR DAILY - Exact match to Screenshot_20261030_205700_0295f45b.jpg */}
        {activePeriod === 'daily' && (
          <div className="bg-[#d8f3e5] dark:bg-emerald-950/50 px-3 py-2 border border-emerald-200/70 dark:border-emerald-800/50 rounded-sm sm:rounded-md flex items-center justify-between gap-2 text-slate-800 dark:text-emerald-100 shadow-xs">
            <button
              type="button"
              onClick={() => handleShiftDay(-1)}
              className="p-1 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-white transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative border-2 border-slate-700 dark:border-slate-300 rounded px-2 py-0.5 font-bold text-base bg-white/50 dark:bg-slate-900/50 flex items-center justify-center">
                <span>{selectedDateParts.dayNum}</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Change Date"
                />
              </div>

              <div className="text-left leading-tight min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {selectedDateParts.monthAndYear}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  {selectedDateParts.dayName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <div className="text-right leading-tight">
                <div className="text-[11px] text-slate-600 dark:text-slate-400">Savings</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatSavingAmount(dailyTotals.saving)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleShiftDay(1)}
                className="p-1 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-white transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>
        )}

        {/* ROW 2 & ROW 3: FOR MONTHLY - Exact match to Screenshot_20261030_205658_041a7fc8.jpg */}
        {activePeriod === 'monthly' && (
          <div className="space-y-2">
            {/* Month Navigator */}
            <div className="bg-transparent py-1 px-2 flex items-center justify-between text-slate-800 dark:text-slate-200">
              <button
                type="button"
                onClick={() => handleShiftMonth(-1)}
                className="p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
              </button>

              <div className="flex items-center justify-center text-center min-w-0">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleShiftMonth(1)}
                className="p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>

            {/* Monthly Summary Header: Solid light mint/sage box matching screenshot */}
            <div className="bg-[#c2ebd8] dark:bg-emerald-950/60 p-3.5 rounded-xl border border-emerald-300/60 dark:border-emerald-800/40 text-slate-900 dark:text-emerald-100 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-emerald-300">Total Income (Credit)</div>
                  <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatPlainAmount(monthlyTotals.income)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-emerald-300">Total Expense (Debit)</div>
                  <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatPlainAmount(monthlyTotals.expense)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-emerald-300/40 dark:border-emerald-800/40">
                {settings.carryForwardMonthlyBalance && (
                  <div className="text-left">
                    <span className="text-[10px] text-slate-600 dark:text-emerald-400 block">Carried Balance</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {formatPlainAmount(carriedForwardBalance)}
                    </span>
                  </div>
                )}
                <div className="text-right ml-auto">
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-emerald-300">Savings</div>
                  <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatSavingAmount(monthlyTotals.savings + (settings.carryForwardMonthlyBalance ? carriedForwardBalance : 0))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROW 2: FOR YEARLY: Minimalist Year Navigator matching screenshot */}
        {activePeriod === 'yearly' && (
          <div className="flex items-center justify-between py-2 px-6 sm:px-12 bg-white/60 dark:bg-slate-900/60 rounded-xl text-slate-800 dark:text-slate-200">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Previous Year"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
            </button>

            <button
              type="button"
              onClick={() => setYearlyMode((m) => (m === 'fy' ? 'calendar' : 'fy'))}
              className="text-center font-bold text-sm sm:text-base tracking-wide text-slate-900 dark:text-white select-none hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              title="Click to toggle between F.Y. and Calendar Year"
            >
              {yearlyMode === 'fy'
                ? `F.Y. ${selectedYear} - ${String(selectedYear + 1).slice(2)}`
                : `${selectedYear}`}
            </button>

            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Next Year"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. DAILY VIEW BODY */}
      {/* ========================================================= */}
      {activePeriod === 'daily' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* --- 1. INCOME (CREDIT) SECTION --- */}
          <div className="bg-white/60 dark:bg-slate-900/60 rounded-sm overflow-hidden">
            <div className="bg-[#e9eee9] dark:bg-slate-800 px-3.5 py-2.5 flex items-center justify-between rounded-sm">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Income (Credit)</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                {formatPlainAmount(dailyTotals.income)}
              </span>
            </div>

            {dailyIncomes.length === 0 ? (
              <div className="px-3.5 py-3 text-xs text-slate-600 dark:text-slate-400">
                Tap on '+' to add new item and long press an entry to edit.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {dailyIncomes.map((tx) => {
                  const cat = catMap.get(tx.categoryId);
                  const acc = accMap.get(tx.accountId);
                  const isExpanded = expandedTxId === tx.id;
                  const hasNoteOrDesc = Boolean(tx.description || tx.notes);

                  return (
                    <div key={tx.id} className="transition-colors">
                      {/* Main Collapsed Row: Icon + Category + (small note icon) | Amount only */}
                      <div
                        onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                        onTouchStart={() => handleItemTouchStart(tx)}
                        onTouchEnd={handleItemTouchEnd}
                        onTouchMove={handleItemTouchEnd}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onLongPressTransaction?.(tx);
                        }}
                        className={`p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          selectedContextualTxId === tx.id
                            ? 'ring-2 ring-emerald-500 bg-emerald-100/70 dark:bg-emerald-950/60 rounded-xl'
                            : isExpanded
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                            : ''
                        }`}
                        title="Click to view details, long-press to edit in top bar"
                      >
                        <div className="flex items-center gap-3 truncate min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                            <CategoryIcon
                              name={cat?.icon || 'TrendingUp'}
                              className="w-4 h-4"
                              color="#10b981"
                            />
                          </div>
                          <div className="truncate min-w-0 flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {cat?.name || 'Income'}
                            </span>
                            {tx.subCategory && (
                              <span className="text-[10px] text-slate-400 font-normal truncate">
                                • {tx.subCategory}
                              </span>
                            )}
                            {hasNoteOrDesc && (
                              <span title={tx.description || tx.notes} className="inline-flex">
                                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount only (Payment mode hidden in collapsed view) */}
                        <div className="text-right flex-shrink-0 flex items-center gap-2">
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                            {formatPlainAmount(tx.amount)}
                          </div>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-180 text-emerald-600' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Expanded Details Panel: Labels removed, only values shown cleanly */}
                      {isExpanded && (
                        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800/80 text-xs space-y-2 animate-in fade-in duration-150">
                          {/* Description text only */}
                          {tx.description && (
                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                              {tx.description}
                            </div>
                          )}

                          {/* Values only (Payment mode, Notes) - Profile & Date removed per user request */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            {/* Payment mode value only */}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
                              <Wallet className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              <span>{acc?.name || 'Cash'}</span>
                            </span>

                            {tx.notes && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                                <span>{tx.notes}</span>
                              </span>
                            )}
                          </div>

                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTransaction(tx);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit Transaction (संपादित करें)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* --- 2. EXPENSE (DEBIT) SECTION --- */}
          <div className="bg-white/60 dark:bg-slate-900/60 rounded-sm overflow-hidden">
            <div className="bg-[#e9eee9] dark:bg-slate-800 px-3.5 py-2.5 flex items-center justify-between rounded-sm">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Expense (Debit)</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                {formatPlainAmount(dailyTotals.expense)}
              </span>
            </div>

            {dailyExpenses.length === 0 ? (
              <div className="px-3.5 py-3 text-xs text-slate-600 dark:text-slate-400">
                Tap on '+' to add new item and long press an entry to edit.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {dailyExpenses.map((tx) => {
                  const cat = catMap.get(tx.categoryId);
                  const acc = accMap.get(tx.accountId);
                  const isExpanded = expandedTxId === tx.id;
                  const hasNoteOrDesc = Boolean(tx.description || tx.notes);

                  return (
                    <div key={tx.id} className="transition-colors">
                      {/* Main Collapsed Row: Category Icon + Category Name + (small note icon) | Amount only */}
                      <div
                        onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                        onTouchStart={() => handleItemTouchStart(tx)}
                        onTouchEnd={handleItemTouchEnd}
                        onTouchMove={handleItemTouchEnd}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onLongPressTransaction?.(tx);
                        }}
                        className={`p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          selectedContextualTxId === tx.id
                            ? 'ring-2 ring-rose-500 bg-rose-100/70 dark:bg-rose-950/60 rounded-xl'
                            : isExpanded
                            ? 'bg-rose-50/50 dark:bg-rose-950/20'
                            : ''
                        }`}
                        title="Click to view details, long-press to edit in top bar"
                      >
                        <div className="flex items-center gap-3 truncate min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: `${cat?.color || '#ef4444'}20`,
                            }}
                          >
                            <CategoryIcon
                              name={cat?.icon || 'HelpCircle'}
                              className="w-4 h-4"
                              color={cat?.color || '#ef4444'}
                            />
                          </div>
                          <div className="truncate min-w-0 flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {cat?.name || 'Expense'}
                            </span>
                            {tx.subCategory && (
                              <span className="text-[10px] text-slate-400 font-normal truncate">
                                • {tx.subCategory}
                              </span>
                            )}
                            {hasNoteOrDesc && (
                              <span title={tx.description || tx.notes} className="inline-flex">
                                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount only (Payment mode hidden in collapsed view) */}
                        <div className="text-right flex-shrink-0 flex items-center gap-2">
                          <div className="text-xs font-bold text-rose-500 whitespace-nowrap tabular-nums">
                            {formatPlainAmount(tx.amount)}
                          </div>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-180 text-rose-500' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Expanded Details Panel: Labels removed, only values shown cleanly */}
                      {isExpanded && (
                        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800/80 text-xs space-y-2 animate-in fade-in duration-150">
                          {/* Description text only */}
                          {tx.description && (
                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                              {tx.description}
                            </div>
                          )}

                          {/* Values only (Payment mode, Notes) - Profile & Date removed per user request */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            {/* Payment mode value only */}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
                              <Wallet className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              <span>{acc?.name || 'Cash'}</span>
                            </span>

                            {tx.notes && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                                <span>{tx.notes}</span>
                              </span>
                            )}
                          </div>

                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTransaction(tx);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit Transaction (संपादित करें)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* --- 3. TRANSFERS SECTION (if any) --- */}
          {dailyTransfers.length > 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-sm overflow-hidden">
              <div className="bg-[#e9eee9] dark:bg-slate-800 px-3.5 py-2.5 flex items-center justify-between rounded-sm">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Transfer</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                  {formatPlainAmount(dailyTransfers.reduce((acc, t) => acc + t.amount, 0))}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {dailyTransfers.map((tx) => {
                  const acc = accMap.get(tx.accountId);
                  const toAcc = accMap.get(tx.toAccountId || '');
                  const isExpanded = expandedTxId === tx.id;
                  const hasNoteOrDesc = Boolean(tx.description || tx.notes);

                  return (
                    <div key={tx.id} className="transition-colors">
                      <div
                        onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                        onTouchStart={() => handleItemTouchStart(tx)}
                        onTouchEnd={handleItemTouchEnd}
                        onTouchMove={handleItemTouchEnd}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onLongPressTransaction?.(tx);
                        }}
                        className={`p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          selectedContextualTxId === tx.id
                            ? 'ring-2 ring-indigo-500 bg-indigo-100/70 dark:bg-indigo-950/60 rounded-xl'
                            : isExpanded
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/20'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <ArrowRightLeft className="w-4 h-4" />
                          </div>
                          <div className="truncate min-w-0 flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              Transfer: {acc?.name || 'Account'} → {toAcc?.name || 'Account'}
                            </span>
                            {hasNoteOrDesc && (
                              <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 flex items-center gap-2">
                          <div className="text-xs font-bold text-indigo-600 whitespace-nowrap tabular-nums">
                            {formatPlainAmount(tx.amount)}
                          </div>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-180 text-indigo-600' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800/80 text-xs space-y-2 animate-in fade-in duration-150">
                          {tx.description && (
                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                              {tx.description}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 text-xs shadow-2xs">
                              {acc?.name} → {toAcc?.name}
                            </span>
                            {tx.notes && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                                <span>{tx.notes}</span>
                              </span>
                            )}
                          </div>
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTransaction(tx);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit Transaction (संपादित करें)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MONTHLY VIEW BODY */}
      {/* ========================================================= */}
      {activePeriod === 'monthly' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* DAY BOXES LIST */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase px-1">
              {settings.language === 'hi' ? 'दैनिक विवरण (Daily Breakdown)' : 'Daily Breakdown'}
            </div>

            {dateWiseCards.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
                {settings.language === 'hi' ? 'इस महीने में कोई लेन-देन दर्ज नहीं है।' : 'No transactions recorded for this month.'}
              </div>
            ) : (
              dateWiseCards.map((dayCard) => {
                const dayIncomes = dayCard.transactions.filter((t) => t.type === 'income');
                const dayExpenses = dayCard.transactions.filter((t) => t.type !== 'income');

                return (
                  <div
                    key={dayCard.dateStr}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs space-y-3"
                  >
                    {/* TOP: Date with Day (CENTERED - Single date matching Thu, 29 Oct in Screenshot_20261030_205658_041a7fc8.jpg) */}
                    <div className="pb-2 border-b border-slate-100 dark:border-slate-800 text-center">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {dayCard.dayName.slice(0, 3)}, {dayCard.displayDate}
                      </span>
                    </div>

                    {/* TWO COLUMNS: Income (Credit) on Left, Expense (Debit) on Right */}
                    <div className="grid grid-cols-2 gap-3 divide-x divide-slate-100 dark:divide-slate-800">
                      {/* LEFT COLUMN: INCOME */}
                      <div className="min-w-0 pr-1">
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 pb-1.5 border-b border-slate-100 dark:border-slate-800 text-center">
                          Income (Credit)
                        </div>

                        <div className="mt-1.5 space-y-1">
                          {dayIncomes.length === 0 ? (
                            <div className="text-[10px] text-slate-400 py-1.5 italic text-center">—</div>
                          ) : (
                            dayIncomes.map((tx) => {
                              const cat = categories.find((c) => c.id === tx.categoryId);
                              return (
                                <div
                                  key={tx.id}
                                  onClick={() => onSelectTransaction(tx)}
                                  className="p-1 sm:p-1.5 rounded-lg hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between gap-1.5 min-w-0 text-left"
                                  title={`${cat?.name || 'Income'}${tx.description ? ` (${tx.description})` : ''}`}
                                >
                                  <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {cat?.name || tx.description || 'Income'}
                                  </span>
                                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0 whitespace-nowrap text-right tabular-nums">
                                    {formatPlainAmount(tx.amount)}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* RIGHT COLUMN: EXPENSE */}
                      <div className="min-w-0 pl-2">
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 pb-1.5 border-b border-slate-100 dark:border-slate-800 text-center">
                          Expense (Debit)
                        </div>

                        <div className="mt-1.5 space-y-1">
                          {dayExpenses.length === 0 ? (
                            <div className="text-[10px] text-slate-400 py-1.5 italic text-center">—</div>
                          ) : (
                            dayExpenses.map((tx) => {
                              const cat = categories.find((c) => c.id === tx.categoryId);
                              return (
                                <div
                                  key={tx.id}
                                  onClick={() => onSelectTransaction(tx)}
                                  className="p-1 sm:p-1.5 rounded-lg hover:bg-rose-50/50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between gap-1.5 min-w-0 text-left"
                                  title={`${cat?.name || 'Expense'}${tx.description ? ` (${tx.description})` : ''}`}
                                >
                                  <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {cat?.name || tx.description || 'Expense'}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 flex-shrink-0 whitespace-nowrap text-right tabular-nums">
                                    {formatPlainAmount(tx.amount)}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Total Red Expense below items matching screenshot */}
                        {dayExpenses.length > 0 && (
                          <div className="pt-1.5 text-right">
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                              {formatPlainAmount(dayCard.expense)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* BOTTOM RIGHT: Savings - Negative in Red (-), Positive in Green (+) only in monthly day-by-day */}
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center">
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                          Savings
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-bold tabular-nums ${
                            dayCard.saving < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {formatSavingAmount(dayCard.saving)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. YEARLY VIEW */}
      {/* ========================================================= */}
      {/* 3. YEARLY VIEW BODY: SINGLE-LINE TABLE MATCHING USER SCREENSHOT */}
      {/* ========================================================= */}
      {activePeriod === 'yearly' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-transparent overflow-x-auto -mx-1 px-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <th className="py-2 px-2 text-left w-12 sm:w-16 font-medium"></th>
                  <th className="py-2 px-2 sm:px-4 text-right font-semibold whitespace-nowrap">
                    Income (Credit)
                  </th>
                  <th className="py-2 px-2 sm:px-4 text-right font-semibold whitespace-nowrap">
                    Expense (Debit)
                  </th>
                  <th className="py-2 px-2 sm:px-4 text-right font-semibold whitespace-nowrap">
                    Savings
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {activeMonthWiseRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-xs text-slate-400">
                      {settings.language === 'hi'
                        ? 'इस वर्ष में कोई लेन-देन दर्ज नहीं है।'
                        : 'No transactions recorded for this year.'}
                    </td>
                  </tr>
                ) : (
                  activeMonthWiseRows.map((mRow) => (
                    <tr
                      key={mRow.prefix}
                      onClick={() => {
                        setSelectedYear(mRow.yearNumber);
                        setSelectedMonth(mRow.monthNumber);
                        handlePeriodTabClick('monthly');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:bg-slate-100/60 dark:hover:bg-slate-800/50 cursor-pointer transition-colors text-slate-800 dark:text-slate-200"
                      title={
                        settings.language === 'hi'
                          ? `${mRow.name} देखने के लिए क्लिक करें`
                          : `Click to view ${mRow.name} statement`
                      }
                    >
                      <td className="py-2.5 px-2 text-left font-normal text-slate-900 dark:text-slate-100">
                        {mRow.shortName}
                      </td>
                      <td className="py-2.5 px-2 sm:px-4 text-right font-normal tabular-nums text-slate-900 dark:text-slate-100">
                        {formatPlainAmount(mRow.income)}
                      </td>
                      <td className="py-2.5 px-2 sm:px-4 text-right font-normal tabular-nums text-slate-900 dark:text-slate-100">
                        {formatPlainAmount(mRow.expense)}
                      </td>
                      <td className="py-2.5 px-2 sm:px-4 text-right font-normal tabular-nums text-slate-900 dark:text-slate-100">
                        {formatSavingAmount(mRow.saving)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {activeMonthWiseRows.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-extrabold text-slate-950 dark:text-white">
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2 sm:px-4 text-right tabular-nums">
                      {formatPlainAmount(yearlyTotals.income)}
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-right tabular-nums">
                      {formatPlainAmount(yearlyTotals.expense)}
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-right tabular-nums">
                      {formatSavingAmount(yearlyTotals.savings)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
