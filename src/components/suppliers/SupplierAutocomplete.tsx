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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Update suggestions when value changes
  useEffect(() => {
    const results = searchSuppliers(value);
    setSuggestions(results);
    setHighlightedIndex(-1);
  }, [value, searchSuppliers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('button');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelect = (name: string) => {
    onChange(name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    // Focus next field after selection
    setTimeout(() => {
      const focusableSelectors = [
        'input:not([disabled]):not([tabindex="-1"])',
        'select:not([disabled]):not([tabindex="-1"])',
        'textarea:not([disabled]):not([tabindex="-1"])',
        'button:not([disabled]):not([tabindex="-1"]):not([type="button"])',
        '[tabindex]:not([tabindex="-1"]):not([disabled])',
      ].join(', ');

      const form = inputRef.current?.closest('form') || document.body;
      const allFocusable = Array.from(form.querySelectorAll<HTMLElement>(focusableSelectors))
        .filter(el => {
          if (el.offsetParent === null && el.tagName !== 'BODY') return false;
          return true;
        });

      const currentIndex = allFocusable.indexOf(inputRef.current!);
      if (currentIndex !== -1 && currentIndex < allFocusable.length - 1) {
        allFocusable[currentIndex + 1]?.focus();
      }
    }, 10);
  };

  const handleFocus = () => {
    setSuggestions(searchSuppliers(value));
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        setSuggestions(searchSuppliers(value));
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex].name);
        } else {
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
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
        <div 
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((supplier, index) => (
            <button
              key={supplier.id}
              type="button"
              className={cn(
                "w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors",
                index === highlightedIndex 
                  ? "bg-accent text-accent-foreground" 
                  : "hover:bg-accent/50"
              )}
              onClick={() => handleSelect(supplier.name)}
              onMouseEnter={() => setHighlightedIndex(index)}
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
