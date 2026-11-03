import React from 'react';
import { Account, AppSettings, Category, FinancialSummary, Profile, Transaction } from '../types';
import { translations, formatCurrency } from '../utils/i18n';
import { CategoryIcon } from '../components/CategoryIcon';
import { CategoryDonutChart } from '../components/Charts';
import { Plus, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, TrendingUp, TrendingDown, PiggyBank, Calendar, ChevronRight, Search } from 'lucide-react';

interface DashboardViewProps {
  currentProfileId: string;
  profiles: Profile[];
  settings: AppSettings;
  todaySummary: { income: number; expense: number; net: number };
  monthSummary: { income: number; expense: number; savings: number };
  homeQuickSummary: { income: number; expense: number; net: number };
  officeQuickSummary: { income: number; expense: number; net: number };
  recentTransactions: Transaction[];
  financialSummary: FinancialSummary;
  categories: Category[];
  accounts: Account[];
  onOpenAddModal: (type?: 'income' | 'expense' | 'transfer') => void;
  onSelectTransaction: (tx: Transaction) => void;
  onNavigateTab: (tab: string) => void;
  onSelectCategoryFilter: (catId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentProfileId,
  profiles,
  settings,
  todaySummary,
  monthSummary,
  homeQuickSummary,
  officeQuickSummary,
  recentTransactions,
  financialSummary,
  categories,
  accounts,
  onOpenAddModal,
  onSelectTransaction,
  onNavigateTab,
  onSelectCategoryFilter,
}) => {
  const t = translations[settings.language];
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));
  const profMap = new Map(profiles.map((p) => [p.id, p]));

  const currentProfile = profiles.find((p) => p.id === currentProfileId);
  const profileName = currentProfileId === 'all' ? t.profileAll : currentProfile?.name || currentProfileId;

  return (
    <div className="space-y-5 pb-20">
      {/* Scope Indicator Banner */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner"
            style={{ backgroundColor: currentProfile?.color || '#10b981' }}
          >
            {currentProfileId === 'home' ? '🏠' : currentProfileId === 'office' ? '💼' : '🌐'}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">Active Scope</div>
            <div className="text-base font-extrabold">{profileName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 font-mono font-semibold">
            {settings.currency}
          </span>
        </div>
      </div>

      {/* TODAY'S METRICS CARDS */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Today's Financial Pulse
          </h3>
          <span className="text-[11px] font-medium text-slate-400">
            {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Today Income */}
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span className="truncate">{t.todayIncome}</span>
            </div>
            <div className="text-sm sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
              {formatCurrency(todaySummary.income, settings.currency)}
            </div>
          </div>

          {/* Today Expense */}
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 text-xs font-semibold mb-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="truncate">{t.todayExpense}</span>
            </div>
            <div className="text-sm sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
              {formatCurrency(todaySummary.expense, settings.currency)}
            </div>
          </div>

          {/* Today Net */}
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
              <PiggyBank className="w-3.5 h-3.5 text-indigo-500" />
              <span className="truncate">{t.todayNet}</span>
            </div>
            <div
              className={`text-sm sm:text-lg font-extrabold truncate ${
                todaySummary.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
              }`}
            >
              {todaySummary.net >= 0 ? '+' : ''}
              {formatCurrency(todaySummary.net, settings.currency)}
            </div>
          </div>
        </div>
      </div>

      {/* CURRENT MONTH OVERVIEW HERO */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-100">
              {new Date().toLocaleString(undefined, { month: 'long', year: 'numeric' })} Summary
            </span>
            <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-semibold">
              {profileName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-emerald-100/90">{t.monthIncome}</div>
              <div className="text-xl sm:text-2xl font-black mt-0.5">
                {formatCurrency(monthSummary.income, settings.currency)}
              </div>
            </div>
            <div>
              <div className="text-xs text-emerald-100/90">{t.monthExpense}</div>
              <div className="text-xl sm:text-2xl font-black mt-0.5 text-rose-200">
                {formatCurrency(monthSummary.expense, settings.currency)}
              </div>
            </div>
            <div>
              <div className="text-xs text-emerald-100/90">{t.monthSavings}</div>
              <div className="text-xl sm:text-2xl font-black mt-0.5">
                {formatCurrency(monthSummary.savings, settings.currency)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK SUMMARY CARDS: HOME & OFFICE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Home Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-lg">
              🏠
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-white">Home Profile</div>
              <div className="text-[11px] text-slate-500">
                Income: {formatCurrency(homeQuickSummary.income, settings.currency)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-rose-500">
              Exp: {formatCurrency(homeQuickSummary.expense, settings.currency)}
            </div>
            <div
              className={`text-xs font-bold ${
                homeQuickSummary.net >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              Net: {formatCurrency(homeQuickSummary.net, settings.currency)}
            </div>
          </div>
        </div>

        {/* Office Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center text-lg">
              💼
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-white">Office / Business</div>
              <div className="text-[11px] text-slate-500">
                Income: {formatCurrency(officeQuickSummary.income, settings.currency)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-rose-500">
              Exp: {formatCurrency(officeQuickSummary.expense, settings.currency)}
            </div>
            <div
              className={`text-xs font-bold ${
                officeQuickSummary.net >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              Net: {formatCurrency(officeQuickSummary.net, settings.currency)}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTION BUTTONS */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onOpenAddModal('expense')}
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-all border border-rose-200 dark:border-rose-900/50"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>{t.quickAddExpense}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenAddModal('income')}
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-all border border-emerald-200 dark:border-emerald-900/50"
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>{t.quickAddIncome}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenAddModal('transfer')}
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-all border border-indigo-200 dark:border-indigo-900/50"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>{t.transferFunds}</span>
        </button>
      </div>

      {/* CATEGORY-WISE EXPENSE OVERVIEW */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.topSpendingCategories}
            </h3>
            <p className="text-xs text-slate-400">Expense breakdown for {profileName}</p>
          </div>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
          >
            Detailed Analytics <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <CategoryDonutChart
          items={financialSummary.categoryBreakdown}
          total={financialSummary.totalExpenses}
          currency={settings.currency}
          onSelectCategory={(catId) => {
            onSelectCategoryFilter(catId);
            onNavigateTab('transactions');
          }}
        />
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.recentTransactions}</h3>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
          >
            {t.viewAll} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {t.noTransactionsYet}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.slice(0, 6).map((tx) => {
              const cat = catMap.get(tx.categoryId);
              const acc = accMap.get(tx.accountId);
              const prof = profMap.get(tx.profileId);
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isTransfer
                          ? '#6366f1'
                          : isIncome
                          ? '#10b98120'
                          : `${cat?.color || '#ef4444'}20`,
                      }}
                    >
                      {isTransfer ? (
                        <ArrowRightLeft className="w-5 h-5 text-white" />
                      ) : (
                        <CategoryIcon
                          name={cat?.icon || 'HelpCircle'}
                          className="w-5 h-5"
                          color={isIncome ? '#10b981' : cat?.color || '#ef4444'}
                        />
                      )}
                    </div>

                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tx.description}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span className="truncate">{cat?.name || (isTransfer ? 'Transfer' : '')}</span>
                        {currentProfileId === 'all' && prof && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-slate-500">{prof.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-xs font-extrabold ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isTransfer
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-rose-500'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '' : '-'}
                      {formatCurrency(tx.amount, settings.currency)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{acc?.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
