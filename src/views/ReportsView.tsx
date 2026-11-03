import React, { useState, useMemo } from 'react';
import { Account, AppSettings, Category, FinancialSummary, PeriodType, Profile, Transaction } from '../types';
import { translations, formatCurrency } from '../utils/i18n';
import { getDateRange, computeFinancialSummary, filterTransactions } from '../utils/calculations';
import { CategoryDonutChart, CashFlowBarChart, DailyTrendLineChart } from '../components/Charts';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  FileSpreadsheet,
  FileText,
  FileCode,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  profiles: Profile[];
  currentProfileId: string;
  settings: AppSettings;
  onExport: (format: 'pdf' | 'excel' | 'csv', customSummary?: FinancialSummary, customTransactions?: Transaction[], label?: string) => void;
  onSelectCategoryFilter?: (catId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  categories,
  accounts,
  profiles,
  currentProfileId,
  settings,
  onExport,
  onSelectCategoryFilter,
}) => {
  const t = translations[settings.language];

  // Selected period
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [refDate, setRefDate] = useState<Date>(new Date());
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [catSortOrder, setCatSortOrder] = useState<'highest' | 'lowest' | 'alpha'>('highest');

  // Compute date range
  const dateRange = useMemo(() => {
    return getDateRange(
      periodType,
      refDate,
      settings.financialYearStartMonth,
      customStart && customEnd ? { startDate: customStart, endDate: customEnd } : undefined
    );
  }, [periodType, refDate, settings.financialYearStartMonth, customStart, customEnd]);

  // Current period transactions & summary
  const currentScopedTransactions = useMemo(() => {
    return filterTransactions(
      transactions,
      currentProfileId,
      dateRange.startDate,
      dateRange.endDate
    );
  }, [transactions, currentProfileId, dateRange.startDate, dateRange.endDate]);

  const currentSummary = useMemo(() => {
    return computeFinancialSummary(currentScopedTransactions, categories);
  }, [currentScopedTransactions, categories]);

  // Previous period transactions & summary for comparison
  const prevScopedTransactions = useMemo(() => {
    return filterTransactions(
      transactions,
      currentProfileId,
      dateRange.prevStartDate,
      dateRange.prevEndDate
    );
  }, [transactions, currentProfileId, dateRange.prevStartDate, dateRange.prevEndDate]);

  const prevSummary = useMemo(() => {
    return computeFinancialSummary(prevScopedTransactions, categories);
  }, [prevScopedTransactions, categories]);

  // Period shifting helpers
  const handleShiftPeriod = (direction: -1 | 1) => {
    const next = new Date(refDate);
    if (periodType === 'daily') {
      next.setDate(next.getDate() + direction);
    } else if (periodType === 'weekly') {
      next.setDate(next.getDate() + direction * 7);
    } else if (periodType === 'monthly') {
      next.setMonth(next.getMonth() + direction);
    } else if (periodType === 'quarterly') {
      next.setMonth(next.getMonth() + direction * 3);
    } else if (periodType === 'yearly' || periodType === 'financial_year') {
      next.setFullYear(next.getFullYear() + direction);
    }
    setRefDate(next);
  };

  // Sorted categories
  const sortedCategoryBreakdown = useMemo(() => {
    const list = [...currentSummary.categoryBreakdown];
    if (catSortOrder === 'highest') {
      return list.sort((a, b) => b.amount - a.amount);
    }
    if (catSortOrder === 'lowest') {
      return list.sort((a, b) => a.amount - b.amount);
    }
    return list.sort((a, b) => a.category.name.localeCompare(b.category.name));
  }, [currentSummary.categoryBreakdown, catSortOrder]);

  // Comparisons
  const expenseChangeDelta = currentSummary.totalExpenses - prevSummary.totalExpenses;
  const expenseChangePercent =
    prevSummary.totalExpenses > 0
      ? (expenseChangeDelta / prevSummary.totalExpenses) * 100
      : 0;

  const currentProfileObj = profiles.find((p) => p.id === currentProfileId);
  const profileLabel = currentProfileId === 'all' ? t.profileAll : currentProfileObj?.name || currentProfileId;

  return (
    <div className="space-y-5 pb-20">
      {/* Period Selection Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 text-xs">
          {[
            { id: 'daily', label: t.periodDaily },
            { id: 'monthly', label: t.periodMonthly },
            { id: 'yearly', label: t.periodYearly },
            { id: 'financial_year', label: t.periodFY },
            { id: 'custom', label: t.periodCustom },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriodType(item.id as PeriodType)}
              className={`py-2 px-1 rounded-xl font-bold transition-all truncate text-center ${
                periodType === item.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        {periodType !== 'custom' ? (
          <>
            <button
              onClick={() => handleShiftPeriod(-1)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>{dateRange.label}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {dateRange.startDate} to {dateRange.endDate}
              </div>
            </div>

            <button
              onClick={() => handleShiftPeriod(1)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-medium text-slate-500">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-medium text-slate-500">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        )}
      </div>

      {/* Export Toolbar */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          Export Scope: {profileLabel} ({dateRange.label})
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExport('pdf', currentSummary, currentScopedTransactions, dateRange.label)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => onExport('excel', currentSummary, currentScopedTransactions, dateRange.label)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => onExport('csv', currentSummary, currentScopedTransactions, dateRange.label)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Income */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.totalIncome}</div>
          <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(currentSummary.totalIncome, settings.currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {currentSummary.incomeBreakdown.length} income sources
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.totalExpenses}</div>
          <div className="text-base sm:text-lg font-black text-rose-500 mt-1">
            {formatCurrency(currentSummary.totalExpenses, settings.currency)}
          </div>
          {prevSummary.totalExpenses > 0 && (
            <div
              className={`text-[10px] mt-1 font-semibold flex items-center gap-0.5 ${
                expenseChangeDelta > 0 ? 'text-rose-500' : 'text-emerald-600'
              }`}
            >
              {expenseChangeDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(expenseChangePercent).toFixed(1)}% {t.vsPreviousPeriod}</span>
            </div>
          )}
        </div>

        {/* Net Cash Flow */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.netCashFlow}</div>
          <div
            className={`text-base sm:text-lg font-black mt-1 ${
              currentSummary.netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
            }`}
          >
            {currentSummary.netSavings >= 0 ? '+' : ''}
            {formatCurrency(currentSummary.netSavings, settings.currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Savings / Margin
          </div>
        </div>

        {/* Count */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.transactionsCount}</div>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
            {currentSummary.transactionCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Total records
          </div>
        </div>
      </div>

      {/* Visual Analytics: Income vs Expense & Trend Line */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cash Flow Proportions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Income vs Expense Comparison
          </h4>
          <CashFlowBarChart
            income={currentSummary.totalIncome}
            expenses={currentSummary.totalExpenses}
            currency={settings.currency}
          />
        </div>

        {/* Spending Trend Line */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            {t.spendingTrend}
          </h4>
          <DailyTrendLineChart
            data={currentSummary.dailyBreakdown}
            currency={settings.currency}
          />
        </div>
      </div>

      {/* Category Proportions Donut Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          {t.categoryProportions}
        </h4>
        <CategoryDonutChart
          items={currentSummary.categoryBreakdown}
          total={currentSummary.totalExpenses}
          currency={settings.currency}
          onSelectCategory={(catId) => onSelectCategoryFilter?.(catId)}
        />
      </div>

      {/* Category Detailed Table & Breakdown */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Category Spending Breakdown
            </h4>
            <p className="text-xs text-slate-400">
              {currentSummary.categoryBreakdown.length} active categories in this period
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={catSortOrder}
              onChange={(e) => setCatSortOrder(e.target.value as any)}
              className="px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="highest">Highest Spending</option>
              <option value="lowest">Lowest Spending</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>
        </div>

        {sortedCategoryBreakdown.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No expenses recorded for this period.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedCategoryBreakdown.map((item) => (
              <div
                key={item.category.id}
                onClick={() => onSelectCategoryFilter?.(item.category.id)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.category.color}20` }}
                  >
                    <CategoryIcon
                      name={item.category.icon}
                      className="w-5 h-5"
                      color={item.category.color}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.category.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {item.count} transaction{item.count === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    {formatCurrency(item.amount, settings.currency)}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
