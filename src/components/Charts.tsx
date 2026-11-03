import React, { useState } from 'react';
import { Category, SupportedCurrency } from '../types';
import { formatCurrency } from '../utils/i18n';

interface DonutItem {
  category: Category;
  amount: number;
  count: number;
  percentage: number;
}

interface DonutChartProps {
  items: DonutItem[];
  total: number;
  currency: SupportedCurrency;
  onSelectCategory?: (categoryId: string) => void;
}

export const CategoryDonutChart: React.FC<DonutChartProps> = ({
  items,
  total,
  currency,
  onSelectCategory,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (items.length === 0 || total <= 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center mb-3">
          <span className="text-xl">📊</span>
        </div>
        <p className="text-sm font-medium">No expenses in this period</p>
      </div>
    );
  }

  // Calculate SVG arc paths
  const radius = 64;
  const strokeWidth = 24;
  const center = 90;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG Donut */}
      <div className="relative w-48 h-48 flex-shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 180 180" className="w-full h-full transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />
          {items.map((item, idx) => {
            const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += item.percentage;
            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={item.category.id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.category.color || '#3b82f6'}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSelectCategory?.(item.category.id)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          {hoveredIdx !== null ? (
            <>
              <span className="text-xs font-semibold text-slate-500 truncate max-w-[100px]">
                {items[hoveredIdx].category.name}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(items[hoveredIdx].amount, currency)}
              </span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {items[hoveredIdx].percentage.toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(total, currency)}
              </span>
              <span className="text-[10px] text-slate-400">{items.length} categories</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div
            key={item.category.id}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => onSelectCategory?.(item.category.id)}
            className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
              hoveredIdx === idx
                ? 'bg-slate-100 dark:bg-slate-800 font-semibold'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate pr-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.category.color }}
              />
              <span className="truncate text-slate-800 dark:text-slate-200">{item.category.name}</span>
              <span className="text-[10px] text-slate-400">({item.count})</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(item.amount, currency)}
              </span>
              <span className="text-slate-400 font-mono text-[11px] w-10 text-right">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface CashFlowBarProps {
  income: number;
  expenses: number;
  currency: SupportedCurrency;
}

export const CashFlowBarChart: React.FC<CashFlowBarProps> = ({ income, expenses, currency }) => {
  const max = Math.max(income, expenses, 1);
  const incomePct = (income / max) * 100;
  const expensePct = (expenses / max) * 100;
  const net = income - expenses;

  return (
    <div className="space-y-4">
      {/* Income Bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-slate-600 dark:text-slate-400">Total Income</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(income, currency)}
          </span>
        </div>
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(incomePct, 2)}%` }}
          />
        </div>
      </div>

      {/* Expense Bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-slate-600 dark:text-slate-400">Total Expenses</span>
          <span className="font-bold text-rose-500 dark:text-rose-400">
            {formatCurrency(expenses, currency)}
          </span>
        </div>
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(expensePct, 2)}%` }}
          />
        </div>
      </div>

      {/* Net Summary Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500">Net Balance</span>
        <span
          className={`font-extrabold text-sm ${
            net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {net >= 0 ? '+' : ''}
          {formatCurrency(net, currency)}
        </span>
      </div>
    </div>
  );
};

interface DailyTrendLineProps {
  data: { date: string; income: number; expense: number; net: number }[];
  currency: SupportedCurrency;
}

export const DailyTrendLineChart: React.FC<DailyTrendLineProps> = ({ data, currency }) => {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        No daily records found for this period.
      </div>
    );
  }

  const maxExpense = Math.max(...data.map((d) => d.expense), 10);
  const width = 360;
  const height = 120;
  const padding = 20;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - (d.expense / maxExpense) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 overflow-visible">
        <defs>
          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Baseline */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#cbd5e1"
          strokeDasharray="3 3"
        />

        {/* Shaded Area */}
        <path d={areaD} fill="url(#expenseGradient)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {points.map((p, i) => (
          <g key={p.date} className="group">
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              className="fill-rose-500 stroke-white dark:stroke-slate-900 stroke-2 hover:r-6 transition-all cursor-pointer"
            />
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-2 font-mono">
        <span>{data[0]?.date}</span>
        <span>Peak: {formatCurrency(maxExpense, currency)}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};
