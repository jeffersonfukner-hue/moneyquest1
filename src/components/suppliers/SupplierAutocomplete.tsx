import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, ChevronDown, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCurrency } from '@/contexts/CurrencyContext';

interface SupplierAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isIncome?: boolean;
}

export const SupplierAutocomplete = ({ value, onChange, className, isIncome = false }: SupplierAutocompleteProps) => {
  const { t } = useTranslation();
  const { suppliers, searchSuppliers } = useSuppliers();
  const { formatCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState(suppliers.slice(0, 10));
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update suggestions when value changes
  useEffect(() => {
    setSuggestions(searchSuppliers(value));
  }, [value, searchSuppliers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelect = (name: string) => {
    onChange(name);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setSuggestions(searchSuppliers(value));
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const label = isIncome 
    ? t('transactions.incomeSource', 'Origem da Receita')
    : t('transactions.supplier', 'Fornecedor');
  
  const placeholder = isIncome
    ? t('transactions.incomeSourcePlaceholder', 'Ex: EMPRESA X, CLIENTE Y, NUBANK...')
    : t('transactions.supplierPlaceholder', 'Ex: AMAZON, IFOOD, UBER...');

  const Icon = isIncome ? Building2 : Store;

  return (
    <div ref={containerRef} className={cn("space-y-2 relative", className)}>
      <Label htmlFor="supplier" className="flex items-center gap-1">
        {label}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="supplier"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          style={{ textTransform: 'uppercase' }}
          className="min-h-[48px] pr-8"
          autoComplete="off"
        />
        {suppliers.length > 0 && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            tabIndex={-1}
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((supplier) => (
            <button
              key={supplier.id}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-accent flex items-center justify-between gap-2 transition-colors"
              onClick={() => handleSelect(supplier.name)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate font-medium">{supplier.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                <span>{supplier.usage_count}x</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {formatCurrency(supplier.total_spent)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
