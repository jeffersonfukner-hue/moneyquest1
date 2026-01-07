import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BarChart3, Filter, Lock, CreditCard, Wallet } from 'lucide-react';
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

export const SpendingByCategoryChart = ({ transactions }: SpendingByCategoryChartProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency, convertToUserCurrency } = useCurrency();
  const { isPremium } = useSubscription();
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Filter only expenses from current month
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

  // Apply category filter
  const filteredExpenses = useMemo(() => {
    if (selectedCategories.length > 0) {
      return monthlyExpenses.filter(tx => selectedCategories.includes(tx.category || 'Outros'));
    }
    return monthlyExpenses;
  }, [monthlyExpenses, selectedCategories]);

  // Group by category with bank/card split
  const chartData = useMemo(() => {
    const categoryData: Record<string, { bank: number; card: number }> = {};
    
    filteredExpenses.forEach(tx => {
      const category = tx.category || 'Outros';
      const amount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
      const isCard = tx.source_type === 'card' || !!tx.credit_card_id;
      
      if (!categoryData[category]) {
        categoryData[category] = { bank: 0, card: 0 };
      }
      
      if (isCard) {
        categoryData[category].card += amount;
      } else {
        categoryData[category].bank += amount;
      }
    });

    return Object.entries(categoryData)
      .map(([name, values]) => {
        const translationKey = getCategoryTranslationKey(name, 'EXPENSE');
        const displayName = translationKey ? t(`transactions.categories.${translationKey}`) : name;
        // Shorten long category names for mobile
        const shortName = displayName.length > 8 ? displayName.substring(0, 7) + '…' : displayName;
        return { 
          name: shortName,
          fullName: displayName,
          originalName: name, 
          bank: values.bank,
          card: values.card,
          total: values.bank + values.card
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredExpenses, convertToUserCurrency, t]);

  const total = chartData.reduce((sum, item) => sum + item.total, 0);
  const hasActiveFilters = selectedCategories.length > 0;

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

  const handleCategoryToggle = (category: string) => {
    handleFilterClick(() => {
      setSelectedCategories(prev => 
        prev.includes(category) 
          ? prev.filter(c => c !== category)
          : [...prev, category]
      );
    });
  };

  if (chartData.length === 0 && !hasActiveFilters) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="w-4 h-4" />
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
                    {selectedCategories.length}
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
                    onClick={() => setSelectedCategories([])}
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
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <YAxis 
                    hide 
                    domain={[0, 'dataMax']}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percentage = total > 0 ? ((data.total / total) * 100).toFixed(1) : '0';
                        return (
                          <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                            <p className="text-sm font-medium text-foreground">{data.fullName}</p>
                            <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                              {data.bank > 0 && (
                                <p className="flex items-center gap-1">
                                  <Wallet className="w-3 h-3" />
                                  {t('transactions.bankAccount')}: {formatCurrency(data.bank)}
                                </p>
                              )}
                              {data.card > 0 && (
                                <p className="flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" />
                                  {t('transactions.creditCard')}: {formatCurrency(data.card)}
                                </p>
                              )}
                              <p className="font-medium text-foreground pt-1 border-t border-border/50">
                                Total: {formatCurrency(data.total)} ({percentage}%)
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="bank" 
                    name={t('transactions.bankAccount')}
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar 
                    dataKey="card" 
                    name={t('transactions.creditCard')}
                    fill="hsl(var(--chart-4))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                <Wallet className="w-3 h-3" />
                <span>{t('transactions.bankAccount')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-4))' }} />
                <CreditCard className="w-3 h-3" />
                <span>{t('transactions.creditCard')}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
