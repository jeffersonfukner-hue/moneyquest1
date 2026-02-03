import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  SlidersHorizontal, 
  X, 
  Calendar as CalendarIcon,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ReportFilters, 
  PeriodPreset, 
  applyPeriodPreset 
} from '@/hooks/useReportsAnalytics';
import { Wallet } from '@/types/wallet';
import { Category } from '@/types/database';
import { CreditCard } from '@/hooks/useCreditCards';
import { cn } from '@/lib/utils';

interface ReportsFiltersPanelProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  wallets: Wallet[];
  cards: CreditCard[];
  categories: Category[];
  suppliers: string[];
}

const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: 'current-month', label: 'Mês atual' },
  { value: 'last-30-days', label: 'Últimos 30 dias' },
  { value: 'last-90-days', label: 'Últimos 90 dias' },
  { value: 'last-year', label: 'Último ano' },
  { value: 'custom', label: 'Personalizado' },
];

const RECENT_FILTERS_KEY = 'mq.reports.recentFilters';

export const ReportsFiltersPanel = ({
  filters,
  onFiltersChange,
  wallets,
  cards,
  categories,
  suppliers,
}: ReportsFiltersPanelProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ReportFilters>(filters);

  // Count active filters (excluding defaults)
  const activeFilterCount = [
    filters.transactionType !== 'all',
    filters.walletIds.length > 0,
    filters.cardIds.length > 0,
    filters.categoryIds.length > 0,
    filters.supplierIds.length > 0,
    filters.searchText !== '',
    filters.minAmount !== null,
    filters.maxAmount !== null,
    filters.includeFuture,
    filters.includeTransfers,
  ].filter(Boolean).length;

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handlePeriodPresetChange = (preset: PeriodPreset) => {
    const { startDate, endDate } = applyPeriodPreset(
      preset,
      localFilters.startDate,
      localFilters.endDate
    );
    setLocalFilters(prev => ({
      ...prev,
      periodPreset: preset,
      startDate,
      endDate,
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    // Save to recent filters
    try {
      localStorage.setItem(RECENT_FILTERS_KEY, JSON.stringify({
        walletIds: localFilters.walletIds,
        cardIds: localFilters.cardIds,
        categoryIds: localFilters.categoryIds,
        transactionType: localFilters.transactionType,
      }));
    } catch (e) {
      // Ignore localStorage errors
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    const { startDate, endDate } = applyPeriodPreset('current-month');
    const resetFilters: ReportFilters = {
      periodPreset: 'current-month',
      startDate,
      endDate,
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
      includeAdjustments: true,
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const toggleArrayFilter = <K extends keyof ReportFilters>(
    key: K,
    value: string
  ) => {
    const arr = localFilters[key] as string[];
    const newArr = arr.includes(value)
      ? arr.filter(v => v !== value)
      : [...arr, value];
    setLocalFilters(prev => ({ ...prev, [key]: newArr }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Filtros Avançados</SheetTitle>
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
              <RotateCcw className="w-3 h-3" />
              Limpar
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] pr-4">
          <div className="space-y-6">
            {/* Period Preset */}
            <div className="space-y-2">
              <Label>Período</Label>
              <Select 
                value={localFilters.periodPreset} 
                onValueChange={(v) => handlePeriodPresetChange(v as PeriodPreset)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_PRESETS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {localFilters.periodPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">De</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal text-xs">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {format(localFilters.startDate, 'dd/MM/yy', { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.startDate}
                        onSelect={(date) => date && setLocalFilters(prev => ({ ...prev, startDate: date }))}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Até</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal text-xs">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {format(localFilters.endDate, 'dd/MM/yy', { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.endDate}
                        onSelect={(date) => date && setLocalFilters(prev => ({ ...prev, endDate: date }))}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Transaction Type */}
            <div className="space-y-2">
              <Label>Tipo de Transação</Label>
              <Select 
                value={localFilters.transactionType} 
                onValueChange={(v) => setLocalFilters(prev => ({ ...prev, transactionType: v as 'all' | 'INCOME' | 'EXPENSE' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="INCOME">Apenas Entradas</SelectItem>
                  <SelectItem value="EXPENSE">Apenas Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wallets */}
            {wallets.length > 0 && (
              <div className="space-y-2">
                <Label>Contas</Label>
                <div className="flex flex-wrap gap-2">
                  {wallets.filter(w => w.is_active).map(wallet => (
                    <Badge
                      key={wallet.id}
                      variant={localFilters.walletIds.includes(wallet.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayFilter('walletIds', wallet.id)}
                    >
                      {wallet.name}
                      {localFilters.walletIds.includes(wallet.id) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Cards */}
            {cards.length > 0 && (
              <div className="space-y-2">
                <Label>Cartões</Label>
                <div className="flex flex-wrap gap-2">
                  {cards.filter(c => c.is_active).map(card => (
                    <Badge
                      key={card.id}
                      variant={localFilters.cardIds.includes(card.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayFilter('cardIds', card.id)}
                    >
                      {card.name}
                      {localFilters.cardIds.includes(card.id) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Categorias</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {categories.filter(c => c.type === 'EXPENSE').slice(0, 15).map(cat => (
                    <Badge
                      key={cat.id}
                      variant={localFilters.categoryIds.includes(cat.name) ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayFilter('categoryIds', cat.name)}
                    >
                      {cat.name}
                      {localFilters.categoryIds.includes(cat.name) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suppliers */}
            {suppliers.length > 0 && (
              <div className="space-y-2">
                <Label>Fornecedores</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {suppliers.slice(0, 15).map(supplier => (
                    <Badge
                      key={supplier}
                      variant={localFilters.supplierIds.includes(supplier) ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayFilter('supplierIds', supplier)}
                    >
                      {supplier}
                      {localFilters.supplierIds.includes(supplier) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Text Search */}
            <div className="space-y-2">
              <Label>Busca por texto</Label>
              <Input
                placeholder="Descrição, categoria ou fornecedor..."
                value={localFilters.searchText}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, searchText: e.target.value }))}
              />
            </div>

            {/* Amount Range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Valor mínimo</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={localFilters.minAmount ?? ''}
                  onChange={(e) => setLocalFilters(prev => ({ 
                    ...prev, 
                    minAmount: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Valor máximo</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={localFilters.maxAmount ?? ''}
                  onChange={(e) => setLocalFilters(prev => ({ 
                    ...prev, 
                    maxAmount: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Incluir lançamentos futuros</Label>
                  <p className="text-xs text-muted-foreground">Transações com data após hoje</p>
                </div>
                <Switch
                  checked={localFilters.includeFuture}
                  onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, includeFuture: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Incluir transferências</Label>
                  <p className="text-xs text-muted-foreground">Movimentações internas entre contas</p>
                </div>
                <Switch
                  checked={localFilters.includeTransfers}
                  onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, includeTransfers: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Incluir ajustes de caixa</Label>
                  <p className="text-xs text-muted-foreground">Correções de saldo em dinheiro</p>
                </div>
                <Switch
                  checked={localFilters.includeAdjustments}
                  onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, includeAdjustments: checked }))}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t mt-4">
          <Button variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            Aplicar Filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
