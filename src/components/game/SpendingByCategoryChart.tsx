import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon, Filter, Lock, CreditCard, Wallet } from 'lucide-react';
import { Transaction, SupportedCurrency } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseDateString } from '@/lib/dateUtils';
import { getCategoryTranslationKey } from '@/lib/gameLogic';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface SpendingByCategoryChartProps {
  transactions: Transaction[];
}

type SourceFilter = 'all' | 'bank' | 'card';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(262, 80%, 50%)',
  'hsl(199, 89%, 48%)',
  'hsl(43, 96%, 56%)',
];

export const SpendingByCategoryChart = ({ transactions }: SpendingByCategoryChartProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency, convertToUserCurrency } = useCurrency();
  const { isPremium } = useSubscription();
  
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Filter only expenses from current month (including credit card expenses)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyExpenses = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = parseDateString(tx.date);
      return (
        tx.type === 'EXPENSE' &&
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    });
  }, [transactions, currentMonth, currentYear]);

  // Get unique categories for filter
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    monthlyExpenses.forEach(tx => cats.add(tx.category || 'Outros'));
    return Array.from(cats).sort();
  }, [monthlyExpenses]);

  // Apply filters
  const filteredExpenses = useMemo(() => {
    let filtered = monthlyExpenses;

    // Source filter (bank vs card)
    if (sourceFilter === 'bank') {
      filtered = filtered.filter(tx => tx.source_type !== 'card' && !tx.credit_card_id);
    } else if (sourceFilter === 'card') {
      filtered = filtered.filter(tx => tx.source_type === 'card' || tx.credit_card_id);
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(tx => selectedCategories.includes(tx.category || 'Outros'));
    }

    return filtered;
  }, [monthlyExpenses, sourceFilter, selectedCategories]);

  // Group by category with currency conversion
  const categoryTotals = useMemo(() => {
    return filteredExpenses.reduce((acc, tx) => {
      const category = tx.category || 'Outros';
      const convertedAmount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
      acc[category] = (acc[category] || 0) + convertedAmount;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredExpenses, convertToUserCurrency]);

  const chartData = useMemo(() => {
    return Object.entries(categoryTotals)
      .map(([name, value]) => {
        const translationKey = getCategoryTranslationKey(name, 'EXPENSE');
        const displayName = translationKey ? t(`transactions.categories.${translationKey}`) : name;
        return { name: displayName, originalName: name, value };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [categoryTotals, t]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const handleFilterClick = (action: () => void) => {
    if (!isPremium) {
      toast.error(t('premium.filterLocked'), {
        description: t('premium.upgradeToFilter'),
        action: {
          label: t('premium.upgrade'),
          onClick: () => navigate('/upgrade'),
        },
      });
      return;
    }
    action();
  };

  const handleSourceChange = (source: SourceFilter) => {
    handleFilterClick(() => setSourceFilter(source));
  };

  const handleCategoryToggle = (category: string) => {
    handleFilterClick(() => {
      setSelectedCategories(prev => 
        prev.includes(category) 
          ? prev.filter(c => c !== category)
          : [...prev, category]
      );
    });
  };

  const hasActiveFilters = sourceFilter !== 'all' || selectedCategories.length > 0;

  if (chartData.length === 0 && !hasActiveFilters) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <PieChartIcon className="w-4 h-4" />
            {t('dashboard.spendingByCategory')}
          </CardTitle>
          
          {/* Filter Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 gap-1 text-xs"
              >
                <Filter className="w-3 h-3" />
                {hasActiveFilters && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    {(sourceFilter !== 'all' ? 1 : 0) + selectedCategories.length}
                  </Badge>
                )}
                {!isPremium && <Lock className="w-3 h-3 text-muted-foreground" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                {t('common.filters')}
                {!isPremium && (
                  <Badge variant="outline" className="text-[10px] h-4 gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Premium
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Source Filter */}
              <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                {t('transactions.source')}
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={sourceFilter === 'all'}
                onCheckedChange={() => handleSourceChange('all')}
              >
                <span className="flex items-center gap-2">
                  {t('common.all')}
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sourceFilter === 'bank'}
                onCheckedChange={() => handleSourceChange('bank')}
              >
                <span className="flex items-center gap-2">
                  <Wallet className="w-3 h-3" />
                  {t('transactions.bankAccount')}
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sourceFilter === 'card'}
                onCheckedChange={() => handleSourceChange('card')}
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-3 h-3" />
                  {t('transactions.creditCard')}
                </span>
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              
              {/* Category Filter */}
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {t('transactions.category')}
              </DropdownMenuLabel>
              {allCategories.slice(0, 8).map(category => {
                const translationKey = getCategoryTranslationKey(category, 'EXPENSE');
                const displayName = translationKey ? t(`transactions.categories.${translationKey}`) : category;
                return (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  >
                    {displayName}
                  </DropdownMenuCheckboxItem>
                );
              })}
              
              {hasActiveFilters && isPremium && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => {
                      setSourceFilter('all');
                      setSelectedCategories([]);
                    }}
                  >
                    {t('common.clearFilters')}
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {chartData.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
            {t('common.noData')}
          </div>
        ) : (
          <>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="stroke-background"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percentage = ((data.value / total) * 100).toFixed(1);
                        return (
                          <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                            <p className="text-sm font-medium text-foreground">{data.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(data.value)} ({percentage}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {chartData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-muted-foreground truncate max-w-[80px]">{item.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
