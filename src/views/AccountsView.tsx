import React, { useState } from 'react';
import { Account, AppSettings, Transaction } from '../types';
import { translations, formatCurrency } from '../utils/i18n';
import { calculateAccountBalances } from '../utils/calculations';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  Plus,
  ArrowRightLeft,
  Info,
  CreditCard,
  Landmark,
  Banknote,
  Smartphone,
  Wallet,
  X,
  Check,
} from 'lucide-react';

interface AccountsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  settings: AppSettings;
  onSaveAccount: (acc: Account) => void;
  onOpenTransferModal: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  transactions,
  settings,
  onSaveAccount,
  onOpenTransferModal,
}) => {
  const t = translations[settings.language];
  const balances = calculateAccountBalances(accounts, transactions);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('Landmark');
  const [accountNumberMasked, setAccountNumberMasked] = useState('');

  const handleOpenAdd = (acc?: Account) => {
    if (acc) {
      setEditingAccount(acc);
      setName(acc.name);
      setType(acc.type);
      setInitialBalance(acc.initialBalance.toString());
      setColor(acc.color);
      setIcon(acc.icon);
      setAccountNumberMasked(acc.accountNumberMasked || '');
    } else {
      setEditingAccount(null);
      setName('');
      setType('bank');
      setInitialBalance('0');
      setColor('#3b82f6');
      setIcon('Landmark');
      setAccountNumberMasked('');
    }
    setIsAddOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedInit = parseFloat(initialBalance) || 0;
    const newAcc: Account = {
      id: editingAccount ? editingAccount.id : `acc_${Date.now()}`,
      name: name.trim(),
      type,
      initialBalance: parsedInit,
      color,
      icon,
      accountNumberMasked: accountNumberMasked.trim() || undefined,
    };

    onSaveAccount(newAcc);
    setIsAddOpen(false);
  };

  // Compute total consolidated liquid balance
  let totalConsolidatedBalance = 0;
  accounts.forEach((a) => {
    const b = balances.get(a.id)?.currentBalance || 0;
    totalConsolidatedBalance += b;
  });

  return (
    <div className="space-y-5 pb-20">
      {/* Consolidated Net Worth / Balances Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold">
              Consolidated Net Liquidity
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-1">
              {formatCurrency(totalConsolidatedBalance, settings.currency)}
            </div>
            <div className="text-xs text-indigo-200 mt-1">
              Sum of Cash, Bank accounts & Wallets
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTransferModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{t.transferFunds}</span>
            </button>
            <button
              onClick={() => handleOpenAdd()}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={t.addAccount}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Accuracy Ledger Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
        <p>{t.accountDisclaimer}</p>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accounts.map((acc) => {
          const accData = balances.get(acc.id) || {
            currentBalance: acc.initialBalance,
            incomeTotal: 0,
            expenseTotal: 0,
            transferNet: 0,
          };

          return (
            <div
              key={acc.id}
              onClick={() => handleOpenAdd(acc)}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                    style={{ backgroundColor: acc.color }}
                  >
                    <CategoryIcon name={acc.icon} className="w-5 h-5" color="#fff" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      {acc.name}
                    </div>
                    <div className="text-[11px] text-slate-400 capitalize">
                      {acc.type.replace('_', ' ')}
                      {acc.accountNumberMasked ? ` • ${acc.accountNumberMasked}` : ''}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-base font-black ${
                      accData.currentBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'
                    }`}
                  >
                    {formatCurrency(accData.currentBalance, settings.currency)}
                  </div>
                  <div className="text-[10px] text-slate-400">Current Balance</div>
                </div>
              </div>

              {/* Sub ledger details */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-1 text-[11px] text-slate-500">
                <div>
                  <span className="block text-[10px] text-slate-400">Opening</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(acc.initialBalance, settings.currency)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-emerald-600">Inflows</span>
                  <span className="font-semibold text-emerald-600">
                    +{formatCurrency(accData.incomeTotal, settings.currency)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-rose-500">Outflows</span>
                  <span className="font-semibold text-rose-500">
                    -{formatCurrency(accData.expenseTotal, settings.currency)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Account Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAccount ? 'Edit Account' : t.addAccount}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nabil Bank Savings / eSewa Wallet"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Account Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="wallet">Digital Wallet</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="custom">Other Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.initialBalance} ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Card / Account Number (Optional Masked)
                </label>
                <input
                  type="text"
                  value={accountNumberMasked}
                  onChange={(e) => setAccountNumberMasked(e.target.value)}
                  placeholder="e.g. •••• 9210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Color badges */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Badge Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
