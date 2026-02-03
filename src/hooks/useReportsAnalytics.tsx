import { useMemo } from 'react';
import { Transaction, SupportedCurrency } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseDateString } from '@/lib/dateUtils';
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths,
  differenceInDays,
  isWithinInterval,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  endOfWeek,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type PeriodPreset = 'current-month' | 'last-30-days' | 'last-90-days' | 'last-year' | 'custom';
export type AggregationType = 'daily' | 'weekly' | 'monthly';

export interface ReportFilters {
  periodPreset: PeriodPreset;
  startDate: Date;
  endDate: Date;
  transactionType: 'all' | 'INCOME' | 'EXPENSE';
  walletIds: string[];
  cardIds: string[];
  categoryIds: string[];
  supplierIds: string[];
  searchText: string;
  minAmount: number | null;
  maxAmount: number | null;
  includeFuture: boolean;
  includeTransfers: boolean;
  includeAdjustments: boolean;
}

export interface CategoryAnalysis {
  category: string;
  total: number;
  percentage: number;
  count: number;
  avgTicket: number;
  variation: number | null; // % change vs previous period
  previousTotal: number;
}

export interface SupplierAnalysis {
  supplier: string;
  total: number;
  count: number;
  avgTicket: number;
  variation: number | null;
  previousTotal: number;
}

export interface AccountAnalysis {
  id: string;
  name: string;
  type: 'wallet' | 'card';
  income: number;
  expenses: number;
  netBalance: number;
  count: number;
}

export interface CashFlowDataPoint {
  date: string;
  periodStart: Date;
  income: number;
  expenses: number;
  netFlow: number;
  cumulativeBalance: number;
}

export interface PeriodSummary {
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  dailyAvgExpense: number;
  endOfMonthProjection: number | null;
  transactionCount: number;
  daysInPeriod: number;
}

export interface ComparisonData {
  period1: PeriodSummary;
  period2: PeriodSummary;
  incomeChange: number;
  expenseChange: number;
  resultChange: number;
  topCategoriesComparison: Array<{
    category: string;
    period1Total: number;
    period2Total: number;
    change: number;
  }>;
}

const TRANSFER_SUBTYPES = ['transfer_out', 'transfer_in', 'card_payment'];
const ADJUSTMENT_SUBTYPES = ['cash_adjustment'];

export const useReportsAnalytics = (
  transactions: Transaction[],
  filters: ReportFilters,
  wallets: Array<{ id: string; name: string }> = [],
  cards: Array<{ id: string; name: string }> = []
) => {
  const { convertToUserCurrency } = useCurrency();

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    
    return transactions.filter(tx => {
      const txDate = parseDateString(tx.date);
      
      // Date range filter
      if (!isWithinInterval(txDate, { start: startOfDay(filters.startDate), end: endOfDay(filters.endDate) })) {
        return false;
      }
      
      // Exclude future transactions unless explicitly included
      if (!filters.includeFuture && txDate > today) {
        return false;
      }
      
      // Exclude transfers by default (internal movements)
      if (!filters.includeTransfers && tx.transaction_subtype && TRANSFER_SUBTYPES.includes(tx.transaction_subtype)) {
        return false;
      }
      
      // Exclude cash adjustments if filter is off
      if (!filters.includeAdjustments && tx.transaction_subtype && ADJUSTMENT_SUBTYPES.includes(tx.transaction_subtype)) {
        return false;
      }
      
      // Transaction type filter
      if (filters.transactionType !== 'all' && tx.type !== filters.transactionType) {
        return false;
      }
      
      // Wallet filter
      if (filters.walletIds.length > 0 && tx.wallet_id && !filters.walletIds.includes(tx.wallet_id)) {
        return false;
      }
      
      // Card filter
      if (filters.cardIds.length > 0 && tx.credit_card_id && !filters.cardIds.includes(tx.credit_card_id)) {
        return false;
      }
      
      // Category filter
      if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(tx.category)) {
        return false;
      }
      
      // Supplier filter
      if (filters.supplierIds.length > 0) {
        const txSupplier = tx.supplier || tx.description;
        if (!filters.supplierIds.includes(txSupplier)) {
          return false;
        }
      }
      
      // Text search
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchDescription = tx.description.toLowerCase().includes(searchLower);
        const matchCategory = tx.category.toLowerCase().includes(searchLower);
        const matchSupplier = tx.supplier?.toLowerCase().includes(searchLower);
        if (!matchDescription && !matchCategory && !matchSupplier) {
          return false;
        }
      }
      
      // Amount range
      if (filters.minAmount !== null && tx.amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== null && tx.amount > filters.maxAmount) {
        return false;
      }
      
      return true;
    });
  }, [transactions, filters]);

  // Calculate period summary
  const periodSummary = useMemo((): PeriodSummary => {
    const daysInPeriod = differenceInDays(filters.endDate, filters.startDate) + 1;
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    filteredTransactions.forEach(tx => {
      const amount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
      if (tx.type === 'INCOME') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }
    });
    
    const netResult = totalIncome - totalExpenses;
    const dailyAvgExpense = daysInPeriod > 0 ? totalExpenses / daysInPeriod : 0;
    
    // End of month projection (only if current month)
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    let endOfMonthProjection: number | null = null;
    
    if (filters.periodPreset === 'current-month') {
      const daysPassed = differenceInDays(now, currentMonthStart) + 1;
      const totalDaysInMonth = differenceInDays(currentMonthEnd, currentMonthStart) + 1;
      if (daysPassed > 0) {
        const projectedExpenses = (totalExpenses / daysPassed) * totalDaysInMonth;
        endOfMonthProjection = totalIncome - projectedExpenses;
      }
    }
    
    return {
      totalIncome,
      totalExpenses,
      netResult,
      dailyAvgExpense,
      endOfMonthProjection,
      transactionCount: filteredTransactions.length,
      daysInPeriod,
    };
  }, [filteredTransactions, filters, convertToUserCurrency]);

  // Get previous period for comparison
  const getPreviousPeriodBounds = () => {
    const periodLength = differenceInDays(filters.endDate, filters.startDate) + 1;
    const prevEnd = subDays(filters.startDate, 1);
    const prevStart = subDays(prevEnd, periodLength - 1);
    return { prevStart, prevEnd };
  };

  // Calculate category analysis
  const categoryAnalysis = useMemo((): CategoryAnalysis[] => {
    const { prevStart, prevEnd } = getPreviousPeriodBounds();
    
    const categoryMap = new Map<string, { total: number; count: number }>();
    const prevCategoryMap = new Map<string, number>();
    
    // Current period
    filteredTransactions
      .filter(tx => tx.type === 'EXPENSE')
      .forEach(tx => {
        const amount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
        const current = categoryMap.get(tx.category) || { total: 0, count: 0 };
        categoryMap.set(tx.category, { 
          total: current.total + amount, 
          count: current.count + 1 
        });
      });
    
    // Previous period (from original transactions)
    transactions
      .filter(tx => {
        const txDate = parseDateString(tx.date);
        return tx.type === 'EXPENSE' && isWithinInterval(txDate, { start: prevStart, end: prevEnd });
      })
      .forEach(tx => {
        const amount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
        prevCategoryMap.set(tx.category, (prevCategoryMap.get(tx.category) || 0) + amount);
      });
    
    const totalExpenses = Array.from(categoryMap.values()).reduce((sum, v) => sum + v.total, 0);
    
    return Array.from(categoryMap.entries())
      .map(([category, data]) => {
        const previousTotal = prevCategoryMap.get(category) || 0;
        const variation = previousTotal > 0 
          ? ((data.total - previousTotal) / previousTotal) * 100 
          : data.total > 0 ? 100 : null;
        
        return {
          category,
          total: data.total,
          percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
          count: data.count,
          avgTicket: data.count > 0 ? data.total / data.count : 0,
          variation,
          previousTotal,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions, transactions, filters, convertToUserCurrency]);

  // Calculate supplier analysis
  const supplierAnalysis = useMemo((): SupplierAnalysis[] => {
    const { prevStart, prevEnd } = getPreviousPeriodBounds();
    
    const supplierMap = new Map<string, { total: number; count: number }>();
    const prevSupplierMap = new Map<string, number>();
    
    // Current period
    filteredTransactions
      .filter(tx => tx.type === 'EXPENSE')
      .forEach(tx => {
        const supplier = tx.supplier || tx.description;
        const amount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
        const current = supplierMap.get(supplier) || { total: 0, count: 0 };
        supplierMap.set(supplier, { 
          total: current.total + amount, 
          count: current.count + 1 
        });
      });
    
    // Previous period
    transactions
      .filter(tx => {
        const txDate = parseDateString(tx.date);
        return tx.type === 'EXPENSE' && isWithinInterval(txDate, { start: prevStart, end: prevEnd });
      })
      .forEach(tx => {
        const supplier = tx.supplier || tx.description;
        const amount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
        prevSupplierMap.set(supplier, (prevSupplierMap.get(supplier) || 0) + amount);
      });
    
    return Array.from(supplierMap.entries())
      .map(([supplier, data]) => {
        const previousTotal = prevSupplierMap.get(supplier) || 0;
        const variation = previousTotal > 0 
          ? ((data.total - previousTotal) / previousTotal) * 100 
          : data.total > 0 ? 100 : null;
        
        return {
          supplier,
          total: data.total,
          count: data.count,
          avgTicket: data.count > 0 ? data.total / data.count : 0,
          variation,
          previousTotal,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions, transactions, filters, convertToUserCurrency]);

  // Calculate account analysis
  const accountAnalysis = useMemo((): AccountAnalysis[] => {
    const accountMap = new Map<string, { income: number; expenses: number; count: number; name: string; type: 'wallet' | 'card' }>();
    
    // Initialize wallets
    wallets.forEach(w => {
      accountMap.set(`wallet_${w.id}`, { income: 0, expenses: 0, count: 0, name: w.name, type: 'wallet' });
    });
    
    // Initialize cards
    cards.forEach(c => {
      accountMap.set(`card_${c.id}`, { income: 0, expenses: 0, count: 0, name: c.name, type: 'card' });
    });
    
    filteredTransactions.forEach(tx => {
      const amount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
      
      let key: string | null = null;
      if (tx.wallet_id) {
        key = `wallet_${tx.wallet_id}`;
      } else if (tx.credit_card_id) {
        key = `card_${tx.credit_card_id}`;
      }
      
      if (key && accountMap.has(key)) {
        const current = accountMap.get(key)!;
        if (tx.type === 'INCOME') {
          current.income += amount;
        } else {
          current.expenses += amount;
        }
        current.count += 1;
      }
    });
    
    return Array.from(accountMap.entries())
      .map(([key, data]) => ({
        id: key.replace('wallet_', '').replace('card_', ''),
        name: data.name,
        type: data.type,
        income: data.income,
        expenses: data.expenses,
        netBalance: data.income - data.expenses,
        count: data.count,
      }))
      .filter(a => a.count > 0)
      .sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));
  }, [filteredTransactions, wallets, cards, convertToUserCurrency]);

  // Calculate cash flow data for charts
  const cashFlowData = useMemo(() => {
    const daysInPeriod = differenceInDays(filters.endDate, filters.startDate) + 1;
    
    // Determine aggregation type based on period length
    let aggregation: AggregationType = 'daily';
    if (daysInPeriod > 90) {
      aggregation = 'monthly';
    } else if (daysInPeriod > 31) {
      aggregation = 'weekly';
    }
    
    let periods: Date[];
    if (aggregation === 'monthly') {
      periods = eachMonthOfInterval({ start: filters.startDate, end: filters.endDate });
    } else if (aggregation === 'weekly') {
      periods = eachWeekOfInterval({ start: filters.startDate, end: filters.endDate }, { weekStartsOn: 1 });
    } else {
      periods = eachDayOfInterval({ start: filters.startDate, end: filters.endDate });
    }
    
    let cumulativeBalance = 0;
    
    return periods.map((periodStart): CashFlowDataPoint => {
      let periodEnd: Date;
      let dateLabel: string;
      
      if (aggregation === 'monthly') {
        periodEnd = endOfMonth(periodStart);
        dateLabel = format(periodStart, 'MMM yy', { locale: ptBR });
      } else if (aggregation === 'weekly') {
        periodEnd = endOfWeek(periodStart, { weekStartsOn: 1 });
        dateLabel = format(periodStart, 'dd/MM', { locale: ptBR });
      } else {
        periodEnd = endOfDay(periodStart);
        dateLabel = format(periodStart, 'dd/MM', { locale: ptBR });
      }
      
      const periodTxs = filteredTransactions.filter(tx => {
        const txDate = parseDateString(tx.date);
        return isWithinInterval(txDate, { start: startOfDay(periodStart), end: endOfDay(periodEnd) });
      });
      
      let income = 0;
      let expenses = 0;
      
      periodTxs.forEach(tx => {
        const amount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
        if (tx.type === 'INCOME') {
          income += amount;
        } else {
          expenses += amount;
        }
      });
      
      const netFlow = income - expenses;
      cumulativeBalance += netFlow;
      
      return {
        date: dateLabel,
        periodStart,
        income,
        expenses,
        netFlow,
        cumulativeBalance,
      };
    });
  }, [filteredTransactions, filters, convertToUserCurrency]);

  // Income vs Expenses comparison data
  const incomeVsExpensesData = useMemo(() => {
    const daysInPeriod = differenceInDays(filters.endDate, filters.startDate) + 1;
    
    let aggregation: AggregationType = 'weekly';
    if (daysInPeriod > 180) {
      aggregation = 'monthly';
    } else if (daysInPeriod <= 14) {
      aggregation = 'daily';
    }
    
    let periods: Date[];
    if (aggregation === 'monthly') {
      periods = eachMonthOfInterval({ start: filters.startDate, end: filters.endDate });
    } else if (aggregation === 'weekly') {
      periods = eachWeekOfInterval({ start: filters.startDate, end: filters.endDate }, { weekStartsOn: 1 });
    } else {
      periods = eachDayOfInterval({ start: filters.startDate, end: filters.endDate });
    }
    
    return periods.map(periodStart => {
      let periodEnd: Date;
      let dateLabel: string;
      
      if (aggregation === 'monthly') {
        periodEnd = endOfMonth(periodStart);
        dateLabel = format(periodStart, 'MMM', { locale: ptBR });
      } else if (aggregation === 'weekly') {
        periodEnd = endOfWeek(periodStart, { weekStartsOn: 1 });
        dateLabel = `Sem ${format(periodStart, 'dd/MM', { locale: ptBR })}`;
      } else {
        periodEnd = endOfDay(periodStart);
        dateLabel = format(periodStart, 'dd', { locale: ptBR });
      }
      
      const periodTxs = filteredTransactions.filter(tx => {
        const txDate = parseDateString(tx.date);
        return isWithinInterval(txDate, { start: startOfDay(periodStart), end: endOfDay(periodEnd) });
      });
      
      let income = 0;
      let expenses = 0;
      
      periodTxs.forEach(tx => {
        const amount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
        if (tx.type === 'INCOME') {
          income += amount;
        } else {
          expenses += amount;
        }
      });
      
      return {
        period: dateLabel,
        income,
        expenses,
      };
    });
  }, [filteredTransactions, filters, convertToUserCurrency]);

  // Period comparison
  const periodComparison = useMemo((): ComparisonData | null => {
    const { prevStart, prevEnd } = getPreviousPeriodBounds();
    
    // Get previous period transactions
    const prevTransactions = transactions.filter(tx => {
      const txDate = parseDateString(tx.date);
      return isWithinInterval(txDate, { start: prevStart, end: prevEnd }) &&
        !(tx.transaction_subtype && TRANSFER_SUBTYPES.includes(tx.transaction_subtype));
    });
    
    if (prevTransactions.length === 0 && filteredTransactions.length === 0) {
      return null;
    }
    
    const prevDays = differenceInDays(prevEnd, prevStart) + 1;
    
    let prevIncome = 0;
    let prevExpenses = 0;
    
    prevTransactions.forEach(tx => {
      const amount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
      if (tx.type === 'INCOME') {
        prevIncome += amount;
      } else {
        prevExpenses += amount;
      }
    });
    
    const period2: PeriodSummary = {
      totalIncome: prevIncome,
      totalExpenses: prevExpenses,
      netResult: prevIncome - prevExpenses,
      dailyAvgExpense: prevDays > 0 ? prevExpenses / prevDays : 0,
      endOfMonthProjection: null,
      transactionCount: prevTransactions.length,
      daysInPeriod: prevDays,
    };
    
    const incomeChange = period2.totalIncome > 0 
      ? ((periodSummary.totalIncome - period2.totalIncome) / period2.totalIncome) * 100 
      : periodSummary.totalIncome > 0 ? 100 : 0;
    
    const expenseChange = period2.totalExpenses > 0 
      ? ((periodSummary.totalExpenses - period2.totalExpenses) / period2.totalExpenses) * 100 
      : periodSummary.totalExpenses > 0 ? 100 : 0;
    
    const resultChange = period2.netResult !== 0 
      ? ((periodSummary.netResult - period2.netResult) / Math.abs(period2.netResult)) * 100 
      : periodSummary.netResult !== 0 ? 100 : 0;
    
    // Top categories comparison
    const currentCategories = categoryAnalysis.slice(0, 5);
    const topCategoriesComparison = currentCategories.map(cat => ({
      category: cat.category,
      period1Total: cat.total,
      period2Total: cat.previousTotal,
      change: cat.variation || 0,
    }));
    
    return {
      period1: periodSummary,
      period2,
      incomeChange,
      expenseChange,
      resultChange,
      topCategoriesComparison,
    };
  }, [filteredTransactions, transactions, periodSummary, categoryAnalysis, filters, convertToUserCurrency]);

  return {
    filteredTransactions,
    periodSummary,
    categoryAnalysis,
    supplierAnalysis,
    accountAnalysis,
    cashFlowData,
    incomeVsExpensesData,
    periodComparison,
  };
};

// Helper to get default filters
export const getDefaultFilters = (): ReportFilters => {
  const now = new Date();
  return {
    periodPreset: 'current-month',
    startDate: startOfMonth(now),
    endDate: endOfMonth(now),
    transactionType: 'all',
    walletIds: [],
    cardIds: [],
    categoryIds: [],
    supplierIds: [],
    searchText: '',
    minAmount: null,
    maxAmount: null,
    includeFuture: false,
    includeTransfers: false,
    includeAdjustments: true, // Include cash adjustments by default
  };
};

// Helper to apply period preset
export const applyPeriodPreset = (preset: PeriodPreset, customStart?: Date, customEnd?: Date): { startDate: Date; endDate: Date } => {
  const now = new Date();
  
  switch (preset) {
    case 'current-month':
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    case 'last-30-days':
      return { startDate: subDays(now, 29), endDate: now };
    case 'last-90-days':
      return { startDate: subDays(now, 89), endDate: now };
    case 'last-year':
      return { startDate: subMonths(now, 12), endDate: now };
    case 'custom':
      return { 
        startDate: customStart || subDays(now, 29), 
        endDate: customEnd || now 
      };
    default:
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
  }
};
