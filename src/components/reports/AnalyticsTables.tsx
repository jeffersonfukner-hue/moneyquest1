import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  ChevronUp, 
  ChevronDown, 
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CategoryAnalysis, SupplierAnalysis, AccountAnalysis } from '@/hooks/useReportsAnalytics';
import { cn } from '@/lib/utils';

// Shared variation badge component
const VariationBadge = ({ variation }: { variation: number | null }) => {
  if (variation === null) return <span className="text-muted-foreground">-</span>;
  
  const isPositive = variation > 0;
  const isNegative = variation < 0;
  
  return (
    <div className={cn(
      'flex items-center gap-1 text-xs font-medium',
      isPositive ? 'text-red-500' : isNegative ? 'text-green-500' : 'text-muted-foreground'
    )}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {isPositive ? '+' : ''}{variation.toFixed(0)}%
    </div>
  );
};

// Sort helper
type SortDirection = 'asc' | 'desc' | null;
type SortConfig<T> = { key: keyof T; direction: SortDirection };

function useSortableData<T>(items: T[], config: SortConfig<T> | null = null) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(config);

  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: keyof T) => {
    let direction: SortDirection = 'desc';
    if (sortConfig?.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = null;
    }
    setSortConfig(direction ? { key, direction } : null);
  };

  return { items: sortedItems, sortConfig, requestSort };
}

// Categories Table
interface CategoriesTableProps {
  data: CategoryAnalysis[];
  onRowClick?: (category: string) => void;
}

export const CategoriesAnalyticsTable = ({ data, onRowClick }: CategoriesTableProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  
  const filteredData = data.filter(cat => 
    t(`transactions.categories.${cat.category}`, cat.category).toLowerCase().includes(search.toLowerCase())
  );
  
  const { items, sortConfig, requestSort } = useSortableData(filteredData, { key: 'total', direction: 'desc' });

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: keyof CategoryAnalysis }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => requestSort(sortKey)}
    >
      {label}
      {sortConfig?.key === sortKey && (
        sortConfig.direction === 'desc' ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronUp className="ml-1 h-3 w-3" />
      )}
    </Button>
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Análise por Categoria
          </CardTitle>
          <div className="relative w-48">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]"><SortableHeader label="Categoria" sortKey="category" /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Total" sortKey="total" /></TableHead>
                <TableHead className="text-right"><SortableHeader label="%" sortKey="percentage" /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Qtde" sortKey="count" /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Ticket" sortKey="avgTicket" /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Variação" sortKey="variation" /></TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.slice(0, 20).map((cat) => (
                <TableRow 
                  key={cat.category}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick?.(cat.category)}
                >
                  <TableCell className="font-medium">
                    {t(`transactions.categories.${cat.category}`, cat.category)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(cat.total)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {cat.percentage.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {cat.count}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatCurrency(cat.avgTicket)}
                  </TableCell>
                  <TableCell className="text-right">
                    <VariationBadge variation={cat.variation} />
                  </TableCell>
                  <TableCell>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// Suppliers Table
interface SuppliersTableProps {
  data: SupplierAnalysis[];
  onRowClick?: (supplier: string) => void;
}

export const SuppliersAnalyticsTable = ({ data, onRowClick }: SuppliersTableProps) => {
  const { formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  
  const filteredData = data.filter(sup => 
    sup.supplier.toLowerCase().includes(search.toLowerCase())
  );
  
  const { items, sortConfig, requestSort } = useSortableData(filteredData, { key: 'total', direction: 'desc' });

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: keyof SupplierAnalysis }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => requestSort(sortKey)}
    >
      {label}
      {sortConfig?.key === sortKey && (
        sortConfig.direction === 'desc' ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronUp className="ml-1 h-3 w-3" />
      )}
    </Button>
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Análise por Fornecedor
          </CardTitle>
          <div className="relative w-48">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]"><SortableHeader label="Fornecedor" sortKey="supplier" /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Total" sortKey="total" /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Qtde" sortKey="count" /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Ticket" sortKey="avgTicket" /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Variação" sortKey="variation" /></TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.slice(0, 20).map((sup, idx) => (
                <TableRow 
                  key={`${sup.supplier}-${idx}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick?.(sup.supplier)}
                >
                  <TableCell className="font-medium truncate max-w-[200px]" title={sup.supplier}>
                    {sup.supplier}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(sup.total)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {sup.count}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatCurrency(sup.avgTicket)}
                  </TableCell>
                  <TableCell className="text-right">
                    <VariationBadge variation={sup.variation} />
                  </TableCell>
                  <TableCell>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// Accounts Table
interface AccountsTableProps {
  data: AccountAnalysis[];
  onRowClick?: (accountId: string, type: 'wallet' | 'card') => void;
}

export const AccountsAnalyticsTable = ({ data, onRowClick }: AccountsTableProps) => {
  const { formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  
  const filteredData = data.filter(acc => 
    acc.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const { items, sortConfig, requestSort } = useSortableData(filteredData, { key: 'netBalance', direction: 'desc' });

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: keyof AccountAnalysis }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => requestSort(sortKey)}
    >
      {label}
      {sortConfig?.key === sortKey && (
        sortConfig.direction === 'desc' ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronUp className="ml-1 h-3 w-3" />
      )}
    </Button>
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Análise por Conta / Cartão
          </CardTitle>
          <div className="relative w-48">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]"><SortableHeader label="Conta/Cartão" sortKey="name" /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Entradas" sortKey="income" /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Saídas" sortKey="expenses" /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Líquido" sortKey="netBalance" /></TableHead>
                <TableHead className="text-right"><SortableHeader label="Qtde" sortKey="count" /></TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((acc) => (
                <TableRow 
                  key={acc.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick?.(acc.id, acc.type)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {acc.name}
                      <Badge variant="outline" className="text-xs">
                        {acc.type === 'wallet' ? 'Conta' : 'Cartão'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">
                    {formatCurrency(acc.income)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                    {formatCurrency(acc.expenses)}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right tabular-nums font-medium',
                    acc.netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {acc.netBalance >= 0 ? '+' : ''}{formatCurrency(acc.netBalance)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {acc.count}
                  </TableCell>
                  <TableCell>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
