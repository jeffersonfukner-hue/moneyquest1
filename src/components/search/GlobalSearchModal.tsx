import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, ArrowRight, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTransactions } from '@/hooks/useTransactions';
import { useDebounce } from '@/hooks/useDebounce';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { transactions } = useTransactions();
  const { formatCurrency, currency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter transactions
  const results = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return [];
    
    const term = debouncedSearch.toLowerCase();
    return transactions
      .filter(tx => 
        tx.description.toLowerCase().includes(term) ||
        tx.category.toLowerCase().includes(term) ||
        (tx.supplier && tx.supplier.toLowerCase().includes(term))
      )
      .slice(0, 10);
  }, [debouncedSearch, transactions]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        navigateToTransaction(results[selectedIndex].id, results[selectedIndex].date);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const navigateToTransaction = (id: string, date: string) => {
    const txDate = new Date(date);
    const month = txDate.getMonth();
    const year = txDate.getFullYear();
    navigate(`/transactions?month=${month}&year=${year}&highlight=${id}`);
    onClose();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INCOME':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'EXPENSE':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'TRANSFER':
        return <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const highlightMatch = (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-primary/20 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : part
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="fixed left-1/2 top-1/4 -translate-x-1/2 w-full max-w-lg bg-card border rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative border-b">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search.placeholder', 'Buscar transações, categorias, fornecedores...')}
            className="pl-10 h-12 border-0 focus-visible:ring-0 rounded-none"
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <p className="text-sm text-muted-foreground p-4 text-center">
              {t('search.minChars', 'Digite pelo menos 2 caracteres')}
            </p>
          )}

          {debouncedSearch.length >= 2 && results.length === 0 && (
            <p className="text-sm text-muted-foreground p-4 text-center">
              {t('search.noResults', 'Nenhum resultado encontrado')}
            </p>
          )}

          {results.map((tx, index) => (
            <button
              key={tx.id}
              onClick={() => navigateToTransaction(tx.id, tx.date)}
              className={cn(
                "w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors",
                index === selectedIndex && "bg-muted"
              )}
            >
              {getTypeIcon(tx.type)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {highlightMatch(tx.description, debouncedSearch)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tx.category} • {format(new Date(tx.date), "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>
              <span className={cn(
                "text-sm font-medium tabular-nums",
                tx.type === 'INCOME' && "text-emerald-600 dark:text-emerald-400",
                tx.type === 'EXPENSE' && "text-red-600 dark:text-red-400"
              )}>
                {formatCurrency(tx.amount)}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd>
            <span>{t('search.navigate', 'navegar')}</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd>
            <span>{t('search.select', 'selecionar')}</span>
          </div>
          <div>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">ESC</kbd>
            <span className="ml-1">{t('search.close', 'fechar')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
