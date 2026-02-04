import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Loader2,
  PieChart,
  Users,
  Wallet,
  GitCompareArrows,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useCategories } from '@/hooks/useCategories';
import { 
  useReportsAnalytics, 
  getDefaultFilters, 
  applyPeriodPreset,
  ReportFilters,
  PeriodPreset,
} from '@/hooks/useReportsAnalytics';
import { Navigate } from 'react-router-dom';

// Report Components
import { ReportsFiltersPanel } from '@/components/reports/ReportsFiltersPanel';
import { ReportsSummaryCards } from '@/components/reports/ReportsSummaryCards';
import { CashFlowTimelineChart } from '@/components/reports/CashFlowTimelineChart';
import { IncomeVsExpensesChart } from '@/components/reports/IncomeVsExpensesChart';
import { TopCategoriesChart } from '@/components/reports/TopCategoriesChart';
import { TopSuppliersChart } from '@/components/reports/TopSuppliersChart';
import { 
  CategoriesAnalyticsTable, 
  SuppliersAnalyticsTable,
  AccountsAnalyticsTable,
} from '@/components/reports/AnalyticsTables';
import { PeriodComparisonCard } from '@/components/reports/PeriodComparisonCard';
import { TransactionDrilldown } from '@/components/reports/TransactionDrilldown';
import { parseDateString } from '@/lib/dateUtils';
import { isWithinInterval, startOfDay, endOfDay, subDays, differenceInDays } from 'date-fns';

type ReportView = 'overview' | 'categories' | 'suppliers' | 'accounts' | 'comparison';

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  'current-month': 'Mês atual',
  'last-30-days': 'Últimos 30 dias',
  'last-90-days': 'Últimos 90 dias',
  'last-year': 'Último ano',
  'custom': 'Personalizado',
};

const ProfessionalReportsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading: txLoading, updateTransaction, deleteTransaction } = useTransactions();
  const { wallets } = useWallets();
  const { creditCards } = useCreditCards();
  const { categories } = useCategories();
  
  const [activeView, setActiveView] = useState<ReportView>('overview');
  const [filters, setFilters] = useState<ReportFilters>(getDefaultFilters());
  
  // Drill-down state
  const [drilldown, setDrilldown] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    filterFn: (tx: typeof transactions[0]) => boolean;
  }>({ isOpen: false, title: '', filterFn: () => true });

  // Get unique suppliers from transactions
  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Set<string>();
    transactions.forEach(tx => {
      if (tx.supplier) suppliers.add(tx.supplier);
    });
    return Array.from(suppliers).sort();
  }, [transactions]);

  // Analytics hook
  const {
    filteredTransactions,
    periodSummary,
    categoryAnalysis,
    supplierAnalysis,
    accountAnalysis,
    cashFlowData,
    incomeVsExpensesData,
    periodComparison,
  } = useReportsAnalytics(
    transactions,
    filters,
    wallets.map(w => ({ id: w.id, name: w.name })),
    creditCards.map(c => ({ id: c.id, name: c.name }))
  );

  // Period label for display
  const periodLabel = useMemo(() => {
    if (filters.periodPreset === 'custom') {
      return `${format(filters.startDate, 'dd/MM/yy', { locale: ptBR })} - ${format(filters.endDate, 'dd/MM/yy', { locale: ptBR })}`;
    }
    return PERIOD_LABELS[filters.periodPreset];
  }, [filters]);

  // Previous period label
  const previousPeriodLabel = useMemo(() => {
    const periodLength = differenceInDays(filters.endDate, filters.startDate) + 1;
    const prevEnd = subDays(filters.startDate, 1);
    const prevStart = subDays(prevEnd, periodLength - 1);
    return `${format(prevStart, 'dd/MM', { locale: ptBR })} - ${format(prevEnd, 'dd/MM', { locale: ptBR })}`;
  }, [filters]);

  // Drill-down handlers
  const openCategoryDrilldown = useCallback((category: string) => {
    setDrilldown({
      isOpen: true,
      title: t(`transactions.categories.${category}`, category),
      subtitle: `Transações no período: ${periodLabel}`,
      filterFn: (tx) => tx.category === category,
    });
  }, [t, periodLabel]);

  const openSupplierDrilldown = useCallback((supplier: string) => {
    setDrilldown({
      isOpen: true,
      title: supplier,
      subtitle: `Transações no período: ${periodLabel}`,
      filterFn: (tx) => (tx.supplier || tx.description) === supplier,
    });
  }, [periodLabel]);

  const openTypeDrilldown = useCallback((type: 'income' | 'expense' | 'result' | 'average' | 'projection') => {
    if (type === 'income') {
      setDrilldown({
        isOpen: true,
        title: 'Todas as Entradas',
        subtitle: periodLabel,
        filterFn: (tx) => tx.type === 'INCOME',
      });
    } else if (type === 'expense') {
      setDrilldown({
        isOpen: true,
        title: 'Todas as Saídas',
        subtitle: periodLabel,
        filterFn: (tx) => tx.type === 'EXPENSE',
      });
    }
    // Result, average, projection don't have specific drilldowns
  }, [periodLabel]);

  const closeDrilldown = useCallback(() => {
    setDrilldown(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Filtered transactions for drilldown
  const drilldownTransactions = useMemo(() => {
    return filteredTransactions.filter(drilldown.filterFn);
  }, [filteredTransactions, drilldown.filterFn]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppShell fullWidth>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">
            Relatórios
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            {periodLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReportsFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            wallets={wallets}
            cards={creditCards}
            categories={categories}
            suppliers={uniqueSuppliers}
          />
          <Button variant="outline" size="sm" disabled className="gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {txLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <ReportsSummaryCards 
            summary={periodSummary} 
            onCardClick={openTypeDrilldown}
          />

          {/* View Tabs */}
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as ReportView)}>
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="overview" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs">
                <PieChart className="w-4 h-4" />
                <span className="hidden sm:inline">Categorias</span>
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Fornecedores</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs">
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Contas</span>
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs">
                <GitCompareArrows className="w-4 h-4" />
                <span className="hidden sm:inline">Comparar</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CashFlowTimelineChart data={cashFlowData} />
                <IncomeVsExpensesChart data={incomeVsExpensesData} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopCategoriesChart 
                  data={categoryAnalysis} 
                  onCategoryClick={openCategoryDrilldown}
                  limit={8}
                />
                <TopSuppliersChart 
                  data={supplierAnalysis} 
                  onSupplierClick={openSupplierDrilldown}
                  limit={8}
                />
              </div>
              <PeriodComparisonCard
                data={periodComparison}
                currentPeriodLabel={periodLabel}
                previousPeriodLabel={previousPeriodLabel}
              />
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-6 mt-6">
              <TopCategoriesChart 
                data={categoryAnalysis} 
                onCategoryClick={openCategoryDrilldown}
                limit={15}
              />
              <CategoriesAnalyticsTable 
                data={categoryAnalysis}
                onRowClick={openCategoryDrilldown}
              />
            </TabsContent>

            {/* Suppliers Tab */}
            <TabsContent value="suppliers" className="space-y-6 mt-6">
              <TopSuppliersChart 
                data={supplierAnalysis} 
                onSupplierClick={openSupplierDrilldown}
                limit={15}
              />
              <SuppliersAnalyticsTable 
                data={supplierAnalysis}
                onRowClick={openSupplierDrilldown}
              />
            </TabsContent>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="space-y-6 mt-6">
              <AccountsAnalyticsTable 
                data={accountAnalysis}
                onRowClick={(id, type) => {
                  // Navigate to wallet or card detail
                  if (type === 'wallet') {
                    navigate('/wallets/accounts');
                  } else {
                    navigate('/wallets/cards');
                  }
                }}
              />
            </TabsContent>

            {/* Comparison Tab */}
            <TabsContent value="comparison" className="space-y-6 mt-6">
              <PeriodComparisonCard
                data={periodComparison}
                currentPeriodLabel={periodLabel}
                previousPeriodLabel={previousPeriodLabel}
              />
              {categoryAnalysis.length > 0 && (
                <CategoriesAnalyticsTable 
                  data={categoryAnalysis.slice(0, 10)}
                  onRowClick={openCategoryDrilldown}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Transaction Drilldown Sheet */}
      <TransactionDrilldown
        isOpen={drilldown.isOpen}
        onClose={closeDrilldown}
        transactions={drilldownTransactions}
        title={drilldown.title}
        subtitle={drilldown.subtitle}
        onUpdate={updateTransaction}
        onDelete={deleteTransaction}
      />
    </AppShell>
  );
};

export default ProfessionalReportsPage;
