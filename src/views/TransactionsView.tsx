import React, { useState, useMemo } from 'react';
import { Account, AppSettings, Category, Profile, Transaction, TransactionType } from '../types';
import { translations, formatCurrency } from '../utils/i18n';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  Trash2,
  Copy,
  ArrowRight,
  ArrowRightLeft,
  Calendar,
  X,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  profiles: Profile[];
  currentProfileId: string;
  settings: AppSettings;
  selectedCategoryFilter?: string;
  onOpenAddModal: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onDuplicateTransaction: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
  onMoveTransaction: (id: string, targetProfileId: string) => void;
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  accounts,
  profiles,
  currentProfileId,
  settings,
  selectedCategoryFilter,
  onOpenAddModal,
  onSelectTransaction,
  onDuplicateTransaction,
  onDeleteTransaction,
  onMoveTransaction,
  onExport,
}) => {
  const t = translations[settings.language];

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));
  const profMap = new Map(profiles.map((p) => [p.id, p]));

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>(selectedCategoryFilter || 'all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Filtered & sorted list
  const filteredList = useMemo(() => {
    let result = transactions.filter((tx) => {
      // Profile isolation
      if (currentProfileId !== 'all' && tx.profileId !== currentProfileId) {
        return false;
      }
      // Type
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }
      // Category
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) {
        return false;
      }
      // Account
      if (accountFilter !== 'all') {
        if (tx.accountId !== accountFilter && tx.toAccountId !== accountFilter) return false;
      }
      // Date bounds
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const catName = catMap.get(tx.categoryId)?.name.toLowerCase() || '';
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchNotes = (tx.notes || '').toLowerCase().includes(q);
        const matchRef = (tx.referenceNo || '').toLowerCase().includes(q);
        const matchAmt = tx.amount.toString().includes(q);
        const matchCat = catName.includes(q);
        if (!matchDesc && !matchNotes && !matchRef && !matchAmt && !matchCat) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        const cmp = b.date.localeCompare(a.date);
        return cmp !== 0 ? cmp : (b.time || '').localeCompare(a.time || '');
      }
      if (sortBy === 'date_asc') {
        const cmp = a.date.localeCompare(b.date);
        return cmp !== 0 ? cmp : (a.time || '').localeCompare(b.time || '');
      }
      if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [
    transactions,
    currentProfileId,
    typeFilter,
    categoryFilter,
    accountFilter,
    startDate,
    endDate,
    searchQuery,
    sortBy,
  ]);

  // Paginated view
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedTransactions = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetAllFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setAccountFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    accountFilter !== 'all' ||
    startDate !== '' ||
    endDate !== '' ||
    searchQuery !== '';

  return (
    <div className="space-y-4 pb-20">
      {/* Top Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Quick Export Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onExport('pdf')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition-colors"
              title={t.exportPDF}
            >
              <FileText className="w-4 h-4 text-rose-500" />
            </button>
            <button
              onClick={() => onExport('excel')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors"
              title={t.exportExcel}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Tray */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
            {/* Type selector */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {['all', 'expense', 'income', 'transfer'].map((tp) => (
                <button
                  key={tp}
                  onClick={() => {
                    setTypeFilter(tp);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    typeFilter === tp
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tp === 'all'
                    ? t.allTypes
                    : tp === 'expense'
                    ? t.expense
                    : tp === 'income'
                    ? t.income
                    : t.transfer}
                </button>
              ))}
            </div>

            {/* Category & Account Selectors */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">{t.category}</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">{t.allCategories}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">{t.paymentAccount}</label>
                <select
                  value={accountFilter}
                  onChange={(e) => {
                    setAccountFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">{t.allAccounts}</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Bounds */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Sort & Reset */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="date_desc">Newest Date First</option>
                  <option value="date_asc">Oldest Date First</option>
                  <option value="amount_desc">Highest Amount First</option>
                  <option value="amount_asc">Lowest Amount First</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile Indicator (Count removed) */}
      {currentProfileId !== 'all' && (
        <div className="flex justify-end items-center px-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Profile: {profMap.get(currentProfileId)?.name}
          </span>
        </div>
      )}

      {/* Transactions List */}
      {paginatedTransactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-xl">
            🔍
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {hasActiveFilters ? t.noTransactionsMatch : t.noTransactionsYet}
          </div>
          {hasActiveFilters ? (
            <button
              onClick={resetAllFilters}
              className="text-xs text-emerald-600 font-semibold hover:underline"
            >
              Reset filters
            </button>
          ) : (
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Record First Transaction
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {paginatedTransactions.map((tx) => {
            const cat = catMap.get(tx.categoryId);
            const acc = accMap.get(tx.accountId);
            const destAcc = tx.toAccountId ? accMap.get(tx.toAccountId) : null;
            const prof = profMap.get(tx.profileId);
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';

            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isTransfer
                        ? '#6366f1'
                        : isIncome
                        ? '#10b98125'
                        : `${cat?.color || '#ef4444'}25`,
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
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {tx.description}
                      </span>
                      {tx.receiptImage && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                          📎 Bill
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <span className="font-medium text-slate-500">{tx.date}</span>
                      <span>•</span>
                      <span className="truncate">
                        {isTransfer ? `Transfer (${acc?.name} ➔ ${destAcc?.name})` : cat?.name}
                      </span>
                      {tx.subCategory && (
                        <span className="text-slate-400 italic">({tx.subCategory})</span>
                      )}
                      {currentProfileId === 'all' && prof && (
                        <>
                          <span>•</span>
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] font-semibold text-white"
                            style={{ backgroundColor: prof.color }}
                          >
                            {prof.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div
                    className={`text-sm font-extrabold ${
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
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {isTransfer ? 'Internal' : acc?.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 font-semibold"
          >
            Previous
          </button>
          <span className="text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 font-semibold"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
