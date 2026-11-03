import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Check,
  Shapes,
  MessageSquare,
  Delete,
  X,
  Search,
} from 'lucide-react';
import { Account, Category, SupportedCurrency } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface QuickAddCalculatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction?: (txData: {
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    accountId: string;
    description: string;
    date: string;
  }) => void;
  onApplyAmountOnly?: (amount: string) => void;
  categories: Category[];
  accounts: Account[];
  currentProfileId: string;
  currency: SupportedCurrency;
  initialType?: 'income' | 'expense';
  initialDate?: string;
  initialAmount?: string;
  initialDescription?: string;
  initialCategoryId?: string;
}

export const QuickAddCalculatorDrawer: React.FC<QuickAddCalculatorDrawerProps> = ({
  isOpen,
  onClose,
  onSaveTransaction,
  onApplyAmountOnly,
  categories,
  accounts,
  currentProfileId,
  currency,
  initialType = 'expense',
  initialDate,
  initialAmount = '',
  initialDescription = '',
  initialCategoryId = '',
}) => {
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [expression, setExpression] = useState<string>(initialAmount && initialAmount !== '0' ? initialAmount : '');
  const [description, setDescription] = useState<string>(initialDescription);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial values on open
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setExpression(initialAmount && initialAmount !== '0' ? initialAmount : '');
      setDescription(initialDescription);
      setSelectedCategoryId(initialCategoryId);
      setIsCategoryPickerOpen(false);
      setCategorySearch('');
      setErrorMsg(null);
    }
  }, [isOpen, initialType, initialAmount, initialDescription, initialCategoryId]);

  if (!isOpen) return null;

  // Filter categories by type
  const availableCategories = categories.filter((c) => c.type === type && !c.isArchived);
  const selectedCategoryObj = categories.find((c) => c.id === selectedCategoryId) || availableCategories[0];

  // Safe arithmetic evaluator supporting +, -, ×, ÷, %
  const evaluateExpression = (expr: string): number | null => {
    try {
      if (!expr.trim()) return null;
      const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
      if (!/^[\d\.\+\-\*\/\(\)\s\%]+$/.test(sanitized)) return null;

      // Handle simple percentage: e.g., 500*10% or 500% -> 500/100
      let evalStr = sanitized.replace(/[\+\-\*\/]+$/, '').trim();
      if (!evalStr) return null;
      if (evalStr.includes('%')) {
        evalStr = evalStr.replace(/(\d+(\.\d+)?)%/g, '($1/100)');
      }

      // eslint-disable-next-line no-new-func
      const result = new Function(`'use strict'; return (${evalStr})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Math.round(result * 100) / 100;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Keypad actions
  const handleDigit = (val: string) => {
    setErrorMsg(null);
    setExpression((prev) => {
      // Prevent multiple consecutive dots
      if (val === '.') {
        const parts = prev.split(/[\+\-\×\÷]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) return prev;
        if (!lastPart) return prev + '0.';
      }
      return prev + val;
    });
  };

  const handleOperator = (op: string) => {
    setErrorMsg(null);
    if (!expression) {
      if (op === '-') setExpression('-');
      return;
    }
    const lastChar = expression.slice(-1);
    if (['+', '-', '×', '÷'].includes(lastChar)) {
      setExpression((prev) => prev.slice(0, -1) + op);
    } else {
      setExpression((prev) => prev + op);
    }
  };

  const handleClearAll = () => {
    setExpression('');
    setErrorMsg(null);
  };

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleEquals = () => {
    const res = evaluateExpression(expression);
    if (res !== null) {
      setExpression(res.toString());
    }
  };

  const handlePercentage = () => {
    if (!expression) return;
    const res = evaluateExpression(expression);
    if (res !== null) {
      const pct = Math.round((res / 100) * 100) / 100;
      setExpression(pct.toString());
    }
  };

  // Submit / Confirm transaction
  const handleDone = () => {
    let finalAmount = 0;
    const evaluated = evaluateExpression(expression);
    if (evaluated !== null && evaluated > 0) {
      finalAmount = evaluated;
    } else if (parseFloat(expression) > 0) {
      finalAmount = parseFloat(expression);
    }

    if (isNaN(finalAmount) || finalAmount <= 0) {
      setErrorMsg('Please enter an amount greater than 0');
      return;
    }

    // If caller just wants the amount (e.g. from AddTransactionModal)
    if (onApplyAmountOnly) {
      onApplyAmountOnly(finalAmount.toString());
      onClose();
      return;
    }

    // Full save transaction
    if (onSaveTransaction) {
      const catId = selectedCategoryObj?.id || availableCategories[0]?.id || 'cat_general';
      const defaultAccount = accounts[0]?.id || 'cash';
      const cleanDesc = description.trim() || selectedCategoryObj?.name || (type === 'income' ? 'Income' : 'Expense');
      const targetDate = initialDate || new Date().toISOString().split('T')[0];

      onSaveTransaction({
        type,
        amount: finalAmount,
        categoryId: catId,
        accountId: defaultAccount,
        description: cleanDesc,
        date: targetDate,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Bottom Sheet Drawer matching Screenshot_20261031_012809_c064ba33.jpg */}
      <div className="w-full max-w-lg mx-auto bg-[#dce9df] dark:bg-[#1a2620] rounded-t-[32px] sm:rounded-t-[36px] shadow-2xl border-t border-slate-300/60 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 select-none">
        {/* Top Center Drag / Close handle */}
        <div className="pt-2.5 pb-1 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#3d4f44] text-white flex items-center justify-center hover:bg-[#2c3a32] active:scale-90 transition-transform"
            title="Close Drawer"
          >
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* If onApplyAmountOnly is true: PURE CALCULATOR MODE (Only Calculator Display & Keypad) */}
        {onApplyAmountOnly ? (
          <div className="px-5 pt-2 pb-2 space-y-2">
            {/* Expression & Calculation Display */}
            <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-3 border-2 border-[#0d6e5a]/30 dark:border-emerald-500/30 shadow-inner flex flex-col items-end justify-center min-h-[72px]">
              {/* Active Equation */}
              <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide overflow-x-auto w-full text-right truncate">
                {expression || '0'}
              </div>

              {/* Evaluated Total */}
              <div className="flex items-baseline gap-1.5 text-[#0d6e5a] dark:text-teal-300 font-black text-2xl sm:text-3xl tracking-tight overflow-x-auto w-full justify-end">
                <span className="text-lg opacity-70">
                  {currency === 'NPR' ? 'रु' : currency === 'INR' ? '₹' : '$'}
                </span>
                <span>
                  {evaluateExpression(expression) !== null
                    ? evaluateExpression(expression)?.toLocaleString()
                    : expression || '0.00'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Full transaction drawer if ever called elsewhere without onApplyAmountOnly */
          <>
            {/* Header Tabs: Income (Credit) | Expense (Debit) */}
            <div className="px-4 py-2 flex justify-center">
              <div className="inline-flex rounded-full border border-slate-400/50 dark:border-slate-600/50 overflow-hidden text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    setSelectedCategoryId('');
                  }}
                  className={`px-5 py-2 transition-all flex items-center gap-1.5 ${
                    type === 'income'
                      ? 'bg-[#c2dfcd] dark:bg-[#254231] text-slate-900 dark:text-emerald-300 font-bold shadow-2xs'
                      : 'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200/40'
                  }`}
                >
                  {type === 'income' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>Income (Credit)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    setSelectedCategoryId('');
                  }}
                  className={`px-5 py-2 transition-all flex items-center gap-1.5 ${
                    type === 'expense'
                      ? 'bg-[#c2dfcd] dark:bg-[#254231] text-slate-900 dark:text-emerald-300 font-bold shadow-2xs'
                      : 'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200/40'
                  }`}
                >
                  {type === 'expense' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>Expense (Debit)</span>
                </button>
              </div>
            </div>

            {/* Input Row 1: [Shapes Icon] [Enter Text / Category]  [Amount Input]  [Green Circle Checkmark] */}
            <div className="px-5 py-2.5 flex items-end gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                  className="text-[#3d4f44] dark:text-emerald-400 p-1 rounded-lg hover:bg-slate-200/50 transition-colors flex-shrink-0"
                  title="Select Category"
                >
                  <Shapes className="w-5 h-5" />
                </button>

                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    readOnly
                    onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                    value={selectedCategoryObj?.name || ''}
                    placeholder="Enter Text"
                    className="w-full pb-1 text-sm font-semibold text-slate-800 dark:text-white bg-transparent border-b border-slate-500/50 dark:border-slate-500 focus:outline-hidden placeholder:text-slate-500 cursor-pointer truncate"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0 relative">
                <div className="w-full pb-1 border-b-2 border-[#0d6e5a] dark:border-teal-400 flex items-center justify-start text-slate-900 dark:text-white font-black text-lg sm:text-xl tracking-tight overflow-x-auto">
                  <span className="truncate">
                    {expression || (
                      <span className="text-slate-400 dark:text-slate-500 font-normal text-sm sm:text-base">
                        Amount
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDone}
                className="w-10 h-10 rounded-full bg-[#0d6e5a] hover:bg-[#0a5c4b] active:scale-90 text-white flex items-center justify-center shadow-md transition-all flex-shrink-0"
                title="Save / Apply"
              >
                <Check className="w-5 h-5 stroke-[2.8]" />
              </button>
            </div>

            {/* Category Picker Popup Dropdown */}
            {isCategoryPickerOpen && (
              <div className="mx-5 my-1 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150 z-20 space-y-2">
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search category..."
                    className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-hidden"
                    autoFocus
                  />
                </div>

                <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-1.5 pr-1">
                  {availableCategories
                    .filter((c) => (categorySearch ? c.name.toLowerCase().includes(categorySearch.toLowerCase()) : true))
                    .map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          setIsCategoryPickerOpen(false);
                          setCategorySearch('');
                        }}
                        className={`p-2 rounded-xl text-left flex items-center gap-2 text-xs font-semibold transition-colors ${
                          selectedCategoryObj?.id === cat.id
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${cat.color}25` }}
                        >
                          <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" color={cat.color} />
                        </div>
                        <span className="truncate">{cat.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Input Row 2: [Message/Note Icon] [Description Input] */}
            <div className="px-5 py-2 flex items-center gap-3">
              <div className="text-[#3d4f44] dark:text-emerald-400 p-1 flex-shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full pb-1 text-sm font-semibold text-slate-800 dark:text-white bg-transparent border-b border-slate-500/50 dark:border-slate-500 focus:outline-hidden placeholder:text-slate-500 truncate"
                />
              </div>
            </div>
          </>
        )}

        {/* Error message banner if any */}
        {errorMsg && (
          <div className="px-5 py-1 text-xs text-rose-600 font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Keypad Section: 5 Columns × 4 Rows - Exact Colors matching Screenshot_20261031_012809_c064ba33.jpg */}
        <div className="bg-[#edf4ef] dark:bg-[#121c16] px-3 py-3 border-t border-slate-300/40 dark:border-slate-800">
          <div className="grid grid-cols-5 gap-y-1 gap-x-2 text-center">
            {/* ROW 1: 7 | 8 | 9 | ÷ | AC */}
            <button
              type="button"
              onClick={() => handleDigit('7')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => handleDigit('8')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => handleDigit('9')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => handleOperator('÷')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              ÷
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              AC
            </button>

            {/* ROW 2: 4 | 5 | 6 | × | ⌫ */}
            <button
              type="button"
              onClick={() => handleDigit('4')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => handleDigit('5')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => handleDigit('6')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => handleOperator('×')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              ×
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
              title="Backspace"
            >
              <Delete className="w-6 h-6 stroke-[2.2]" />
            </button>

            {/* ROW 3: 1 | 2 | 3 | - | = */}
            <button
              type="button"
              onClick={() => handleDigit('1')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => handleDigit('2')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => handleDigit('3')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => handleOperator('-')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              -
            </button>
            <button
              type="button"
              onClick={handleEquals}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              =
            </button>

            {/* ROW 4: % | 0 | . | + | ✓ */}
            <button
              type="button"
              onClick={handlePercentage}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              %
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleDigit('.')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              .
            </button>
            <button
              type="button"
              onClick={() => handleOperator('+')}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="h-13 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-[#0d6e5a] dark:text-[#2dd4bf] active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-colors"
              title="Apply & Save"
            >
              <Check className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
