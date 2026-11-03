import React, { useState, useMemo } from 'react';
import { X, Search, ArrowRightLeft } from 'lucide-react';
import { Account, AppSettings, Category, Profile, Transaction } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../utils/i18n';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  profiles: Profile[];
  currentProfileId: string;
  currency: AppSettings['currency'];
  onSelectTransaction: (tx: Transaction) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  accounts,
  profiles,
  currentProfileId,
  currency,
  onSelectTransaction,
}) => {
  const [query, setQuery] = useState('');

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const profMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    return transactions
      .filter((tx) => {
        if (currentProfileId !== 'all' && tx.profileId !== currentProfileId) return false;
        const cat = catMap.get(tx.categoryId);
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchNotes = (tx.notes || '').toLowerCase().includes(q);
        const matchRef = (tx.referenceNo || '').toLowerCase().includes(q);
        const matchAmt = tx.amount.toString().includes(q);
        const matchCat = cat?.name.toLowerCase().includes(q) || false;
        return matchDesc || matchNotes || matchRef || matchAmt || matchCat;
      })
      .slice(0, 30);
  }, [query, transactions, currentProfileId, catMap]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 pt-12 sm:pt-20">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-in slide-in-from-top-4 duration-200">
        {/* Search input header */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions, milk, petrol, bill, amount..."
            className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {!query.trim() ? (
            <div className="p-8 text-center text-slate-400 space-y-1">
              <Search className="w-6 h-6 mx-auto text-slate-300" />
              <p>Type keywords to search your transactions</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No matching transactions found for "{query}"
            </div>
          ) : (
            searchResults.map((tx) => {
              const cat = catMap.get(tx.categoryId);
              const acc = accMap.get(tx.accountId);
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  onClick={() => {
                    onSelectTransaction(tx);
                    onClose();
                  }}
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isTransfer ? '#6366f1' : isIncome ? '#10b98125' : `${cat?.color || '#ef4444'}25`,
                      }}
                    >
                      {isTransfer ? (
                        <ArrowRightLeft className="w-4 h-4 text-white" />
                      ) : (
                        <CategoryIcon name={cat?.icon || 'HelpCircle'} className="w-4 h-4" color={isIncome ? '#10b981' : cat?.color} />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{tx.description}</div>
                      <div className="text-[10px] text-slate-400">{tx.date} • {cat?.name || 'Transfer'}</div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={`font-black ${
                        isIncome ? 'text-emerald-600' : isTransfer ? 'text-indigo-600' : 'text-rose-500'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </div>
                    <div className="text-[9px] text-slate-400">{acc?.name}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
