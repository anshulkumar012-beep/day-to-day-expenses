import React, { useState } from 'react';
import { X, Delete, Check, Calculator as CalcIcon } from 'lucide-react';
import { SupportedCurrency } from '../types';
import { formatCurrency } from '../utils/i18n';

interface CalculatorModalProps {
  isOpen: boolean;
  initialValue?: string;
  currency: SupportedCurrency;
  onApply: (calculatedAmount: string) => void;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  initialValue = '',
  currency,
  onApply,
  onClose,
}) => {
  const [expression, setExpression] = useState<string>(initialValue && initialValue !== '0' ? initialValue : '');
  const [history, setHistory] = useState<string>('');

  if (!isOpen) return null;

  // Safe arithmetic evaluator supporting +, -, *, /, %, parenthesis
  const evaluateExpression = (expr: string): number | null => {
    try {
      if (!expr.trim()) return null;
      // Sanitize: allow only numbers and basic operators
      const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
      if (!/^[\d\.\+\-\*\/\(\)\s\%]+$/.test(sanitized)) return null;

      // Safe evaluation using Function with strict mode
      // eslint-disable-next-line no-new-func
      const result = new Function(`'use strict'; return (${sanitized})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Math.round(result * 100) / 100;
      }
      return null;
    } catch {
      return null;
    }
  };

  const previewResult = evaluateExpression(expression);

  const handleInput = (val: string) => {
    // If operator clicked and expression is empty, allow '-' for negative
    if (['+', '×', '÷'].includes(val) && !expression) return;
    setExpression((prev) => prev + val);
  };

  const handleClear = () => {
    setExpression('');
    setHistory('');
  };

  const handleDelete = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    const res = evaluateExpression(expression);
    if (res !== null) {
      setHistory(expression + ' =');
      setExpression(res.toString());
    }
  };

  const handleApply = () => {
    const res = evaluateExpression(expression);
    if (res !== null && res > 0) {
      onApply(res.toString());
      onClose();
    } else if (parseFloat(expression) > 0) {
      onApply(parseFloat(expression).toString());
      onClose();
    } else {
      onClose();
    }
  };

  const buttons = [
    { label: 'C', action: handleClear, className: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold' },
    { label: '(', action: () => handleInput('('), className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold' },
    { label: ')', action: () => handleInput(')'), className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold' },
    { label: '÷', action: () => handleInput('÷'), className: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-lg' },

    { label: '7', action: () => handleInput('7'), className: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base' },
    { label: '8', action: () => handleInput('8'), className: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base' },
    { label: '9', action: () => handleInput('9'), className: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base' },
    { label: '×', action: () => handleInput('×'), className: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-lg' },

    { label: '4', action: () => handleInput('4'), className: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base' },
    { label: '5', action: () => handleInput('5'), className: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base' },
    { label: '6', action: () => handleInput('6'), className: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base' },
    { label: '-', action: () => handleInput('-'), className: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-lg' },

    { label: '1', action: () => handleInput('1'), className: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base' },
    { label: '2', action: () => handleInput('2'), className: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base' },
    { label: '3', action: () => handleInput('3'), className: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base' },
    { label: '+', action: () => handleInput('+'), className: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-lg' },

    { label: '0', action: () => handleInput('0'), className: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base' },
    { label: '.', action: () => handleInput('.'), className: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base' },
    { label: '⌫', action: handleDelete, className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold' },
    { label: '=', action: handleCalculate, className: 'bg-emerald-600 text-white font-extrabold text-xl shadow-md' },
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <CalcIcon className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white">Amount Calculator</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display Screen */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-right space-y-1">
          <div className="text-xs text-slate-400 font-mono min-h-[16px]">{history}</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono min-h-[32px] overflow-x-auto">
            {expression || '0'}
          </div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {previewResult !== null && expression.length > 0 ? (
              <span>= {formatCurrency(previewResult, currency)}</span>
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
        </div>

        {/* Keypad Grid */}
        <div className="p-4 grid grid-cols-4 gap-2 bg-slate-100/50 dark:bg-slate-900">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              onClick={btn.action}
              className={`h-12 rounded-2xl flex items-center justify-center shadow-xs border border-slate-200/50 dark:border-slate-800 active:scale-95 transition-all ${btn.className}`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Action Button: Apply to Amount */}
        <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Amount ({previewResult !== null ? previewResult : expression || '0'})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
