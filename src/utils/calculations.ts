import { Account, Category, FinancialSummary, PeriodType, Transaction } from '../types';

/**
 * Monetary precision helper: rounds accurately to 2 decimal places to avoid IEEE-754 floating point drift
 */
export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate Date Range boundaries for any PeriodType and optional target date/financial year
 */
export function getDateRange(
  periodType: PeriodType,
  refDate: Date = new Date(),
  financialYearStartMonth: number = 7,
  customRange?: { startDate: string; endDate: string }
): { startDate: string; endDate: string; label: string; prevStartDate: string; prevEndDate: string } {
  const y = refDate.getFullYear();
  const m = refDate.getMonth(); // 0-indexed
  const d = refDate.getDate();

  const toYMD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (periodType === 'daily') {
    const start = new Date(y, m, d);
    const prev = new Date(y, m, d - 1);
    const startStr = toYMD(start);
    return {
      startDate: startStr,
      endDate: startStr,
      label: start.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
      prevStartDate: toYMD(prev),
      prevEndDate: toYMD(prev),
    };
  }

  if (periodType === 'weekly') {
    // Current week (Monday to Sunday)
    const dayOfWeek = refDate.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(y, m, d - distanceToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const prevSunday = new Date(sunday);
    prevSunday.setDate(sunday.getDate() - 7);

    return {
      startDate: toYMD(monday),
      endDate: toYMD(sunday),
      label: `${toYMD(monday)} to ${toYMD(sunday)}`,
      prevStartDate: toYMD(prevMonday),
      prevEndDate: toYMD(prevSunday),
    };
  }

  if (periodType === 'monthly') {
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);

    const prevStart = new Date(y, m - 1, 1);
    const prevEnd = new Date(y, m, 0);

    const monthName = start.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    return {
      startDate: toYMD(start),
      endDate: toYMD(end),
      label: monthName,
      prevStartDate: toYMD(prevStart),
      prevEndDate: toYMD(prevEnd),
    };
  }

  if (periodType === 'quarterly') {
    // Determine Quarter (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
    const qIndex = Math.floor(m / 3);
    const start = new Date(y, qIndex * 3, 1);
    const end = new Date(y, (qIndex + 1) * 3, 0);

    const prevStart = new Date(y, (qIndex - 1) * 3, 1);
    const prevEnd = new Date(y, qIndex * 3, 0);

    return {
      startDate: toYMD(start),
      endDate: toYMD(end),
      label: `Q${qIndex + 1} ${y} (${start.toLocaleString(undefined, { month: 'short' })} - ${end.toLocaleString(undefined, { month: 'short' })})`,
      prevStartDate: toYMD(prevStart),
      prevEndDate: toYMD(prevEnd),
    };
  }

  if (periodType === 'yearly') {
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31);
    const prevStart = new Date(y - 1, 0, 1);
    const prevEnd = new Date(y - 1, 11, 31);

    return {
      startDate: toYMD(start),
      endDate: toYMD(end),
      label: `Calendar Year ${y}`,
      prevStartDate: toYMD(prevStart),
      prevEndDate: toYMD(prevEnd),
    };
  }

  if (periodType === 'financial_year') {
    // 1-indexed start month: 7 = July (Nepal Shrawan), 4 = April (India)
    const fyStartMonthIndex = financialYearStartMonth - 1;
    let fyStartYear = y;
    if (m < fyStartMonthIndex) {
      fyStartYear = y - 1;
    }
    const fyEndYear = fyStartYear + 1;
    const start = new Date(fyStartYear, fyStartMonthIndex, 1);
    const end = new Date(fyEndYear, fyStartMonthIndex, 0);

    const prevStart = new Date(fyStartYear - 1, fyStartMonthIndex, 1);
    const prevEnd = new Date(fyEndYear - 1, fyStartMonthIndex, 0);

    return {
      startDate: toYMD(start),
      endDate: toYMD(end),
      label: `FY ${fyStartYear}/${fyEndYear.toString().slice(-2)}`,
      prevStartDate: toYMD(prevStart),
      prevEndDate: toYMD(prevEnd),
    };
  }

  // Custom
  if (customRange && customRange.startDate && customRange.endDate) {
    const start = new Date(customRange.startDate);
    const end = new Date(customRange.endDate);
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    const prevEnd = new Date(start);
    prevEnd.setDate(start.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - diffDays + 1);

    return {
      startDate: customRange.startDate,
      endDate: customRange.endDate,
      label: `${customRange.startDate} to ${customRange.endDate}`,
      prevStartDate: toYMD(prevStart),
      prevEndDate: toYMD(prevEnd),
    };
  }

  // Fallback to this month
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  return {
    startDate: toYMD(start),
    endDate: toYMD(end),
    label: 'Current Month',
    prevStartDate: toYMD(new Date(y, m - 1, 1)),
    prevEndDate: toYMD(new Date(y, m, 0)),
  };
}

/**
 * Filter transactions strictly according to Profile and Date Range
 */
export function filterTransactions(
  transactions: Transaction[],
  profileId: string, // 'all' or specific profile id
  startDate?: string,
  endDate?: string,
  typeFilter?: string, // 'all' | 'income' | 'expense' | 'transfer'
  categoryFilter?: string,
  accountFilter?: string,
  searchQuery?: string
): Transaction[] {
  return transactions.filter((tx) => {
    // Profile isolation: if not 'all', transaction must match selected profile exactly
    if (profileId !== 'all' && tx.profileId !== profileId) {
      return false;
    }

    // Date range filter
    if (startDate && tx.date < startDate) return false;
    if (endDate && tx.date > endDate) return false;

    // Type filter
    if (typeFilter && typeFilter !== 'all' && tx.type !== typeFilter) return false;

    // Category filter
    if (categoryFilter && categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;

    // Account filter: for income/expense source accountId; for transfers, either accountId or toAccountId
    if (accountFilter && accountFilter !== 'all') {
      if (tx.accountId !== accountFilter && tx.toAccountId !== accountFilter) return false;
    }

    // Search query
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchNotes = (tx.notes || '').toLowerCase().includes(q);
      const matchRef = (tx.referenceNo || '').toLowerCase().includes(q);
      const matchAmt = tx.amount.toString().includes(q);
      const matchSub = (tx.subCategory || '').toLowerCase().includes(q);
      if (!matchDesc && !matchNotes && !matchRef && !matchAmt && !matchSub) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Computes financial totals, category distributions and daily breakdown
 */
export function computeFinancialSummary(
  filteredTransactions: Transaction[],
  categories: Category[]
): FinancialSummary {
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryExpenseMap = new Map<string, { amount: number; count: number }>();
  const categoryIncomeMap = new Map<string, { amount: number; count: number }>();
  const dailyMap = new Map<string, { income: number; expense: number }>();

  filteredTransactions.forEach((tx) => {
    // Transfers are strictly excluded from income and expenses calculations!
    if (tx.type === 'transfer') {
      return;
    }

    const amt = roundCurrency(tx.amount);
    const day = tx.date;
    const currentDaily = dailyMap.get(day) || { income: 0, expense: 0 };

    if (tx.type === 'income') {
      totalIncome = roundCurrency(totalIncome + amt);
      const curr = categoryIncomeMap.get(tx.categoryId) || { amount: 0, count: 0 };
      categoryIncomeMap.set(tx.categoryId, {
        amount: roundCurrency(curr.amount + amt),
        count: curr.count + 1,
      });
      currentDaily.income = roundCurrency(currentDaily.income + amt);
    } else if (tx.type === 'expense') {
      totalExpenses = roundCurrency(totalExpenses + amt);
      const curr = categoryExpenseMap.get(tx.categoryId) || { amount: 0, count: 0 };
      categoryExpenseMap.set(tx.categoryId, {
        amount: roundCurrency(curr.amount + amt),
        count: curr.count + 1,
      });
      currentDaily.expense = roundCurrency(currentDaily.expense + amt);
    }

    dailyMap.set(day, currentDaily);
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Expense breakdown
  const categoryBreakdown = Array.from(categoryExpenseMap.entries())
    .map(([catId, data]) => {
      const cat = categoryMap.get(catId) || {
        id: catId,
        name: 'Unknown Category',
        type: 'expense' as const,
        icon: 'HelpCircle',
        color: '#94a3b8',
        isArchived: false,
        subcategories: [],
        isSystem: false,
      };
      const percentage = totalExpenses > 0 ? roundCurrency((data.amount / totalExpenses) * 100) : 0;
      return {
        category: cat,
        amount: data.amount,
        count: data.count,
        percentage,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Income breakdown
  const incomeBreakdown = Array.from(categoryIncomeMap.entries())
    .map(([catId, data]) => {
      const cat = categoryMap.get(catId) || {
        id: catId,
        name: 'Unknown Category',
        type: 'income' as const,
        icon: 'TrendingUp',
        color: '#10b981',
        isArchived: false,
        subcategories: [],
        isSystem: false,
      };
      const percentage = totalIncome > 0 ? roundCurrency((data.amount / totalIncome) * 100) : 0;
      return {
        category: cat,
        amount: data.amount,
        count: data.count,
        percentage,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Daily breakdown sorted by date ascending
  const dailyBreakdown = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      income: data.income,
      expense: data.expense,
      net: roundCurrency(data.income - data.expense),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalIncome: roundCurrency(totalIncome),
    totalExpenses: roundCurrency(totalExpenses),
    netSavings: roundCurrency(totalIncome - totalExpenses),
    transactionCount: filteredTransactions.length,
    categoryBreakdown,
    incomeBreakdown,
    dailyBreakdown,
  };
}

/**
 * Compute real-time balances for all accounts by replaying opening balances + transactions + transfers
 */
export function calculateAccountBalances(
  accounts: Account[],
  allTransactions: Transaction[]
): Map<string, { currentBalance: number; incomeTotal: number; expenseTotal: number; transferNet: number }> {
  const result = new Map<string, { currentBalance: number; incomeTotal: number; expenseTotal: number; transferNet: number }>();

  accounts.forEach((acc) => {
    result.set(acc.id, {
      currentBalance: roundCurrency(acc.initialBalance),
      incomeTotal: 0,
      expenseTotal: 0,
      transferNet: 0,
    });
  });

  allTransactions.forEach((tx) => {
    const amt = roundCurrency(tx.amount);

    if (tx.type === 'income') {
      const accData = result.get(tx.accountId);
      if (accData) {
        accData.incomeTotal = roundCurrency(accData.incomeTotal + amt);
        accData.currentBalance = roundCurrency(accData.currentBalance + amt);
      }
    } else if (tx.type === 'expense') {
      const accData = result.get(tx.accountId);
      if (accData) {
        accData.expenseTotal = roundCurrency(accData.expenseTotal + amt);
        accData.currentBalance = roundCurrency(accData.currentBalance - amt);
      }
    } else if (tx.type === 'transfer') {
      // Outgoing from source account
      const fromAcc = result.get(tx.accountId);
      if (fromAcc) {
        fromAcc.transferNet = roundCurrency(fromAcc.transferNet - amt);
        fromAcc.currentBalance = roundCurrency(fromAcc.currentBalance - amt);
      }
      // Incoming to destination account
      if (tx.toAccountId) {
        const toAcc = result.get(tx.toAccountId);
        if (toAcc) {
          toAcc.transferNet = roundCurrency(toAcc.transferNet + amt);
          toAcc.currentBalance = roundCurrency(toAcc.currentBalance + amt);
        }
      }
    }
  });

  return result;
}
