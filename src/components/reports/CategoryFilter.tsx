import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';

interface CategoryFilterProps {
  selectedCategories: string[];
  onSelect: (categories: string[]) => void;
  type?: 'INCOME' | 'EXPENSE' | 'ALL';
  className?: string;
}

export const CategoryFilter = ({
  selectedCategories,
  onSelect,
  type = 'ALL',
  className,
}: CategoryFilterProps) => {
  const { t } = useTranslation();
  const { categories } = useCategories();
  const [open, setOpen] = useState(false);

  const filteredCategories = useMemo(() => {
    if (type === 'ALL') return categories;
    return categories.filter(cat => cat.type === type);
  }, [categories, type]);

  const expenseCategories = filteredCategories.filter(c => c.type === 'EXPENSE');
  const incomeCategories = filteredCategories.filter(c => c.type === 'INCOME');

  const toggleCategory = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      onSelect(selectedCategories.filter(c => c !== categoryName));
    } else {
      onSelect([...selectedCategories, categoryName]);
    }
  };

  const selectAll = () => {
    onSelect(filteredCategories.map(c => c.name));
  };

  const clearAll = () => {
    onSelect([]);
  };

  const displayText = selectedCategories.length === 0
    ? t('premiumCashFlow.filters.allCategories')
    : selectedCategories.length === 1
    ? selectedCategories[0]
    : `${selectedCategories.length} ${t('premiumCashFlow.filters.categories').toLowerCase()}`;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between min-h-[44px]"
          >
            <span className="truncate">{displayText}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder={t('premiumCashFlow.filters.selectCategories')} />
            <CommandList>
              <CommandEmpty>{t('common.noData')}</CommandEmpty>
              
              {/* Quick actions */}
              <CommandGroup>
                <div className="flex gap-2 p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    className="flex-1 text-xs"
                  >
                    {t('common.all')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    className="flex-1 text-xs"
                  >
                    {t('premiumCashFlow.filters.clearFilters')}
                  </Button>
                </div>
              </CommandGroup>

              {/* Expense categories */}
              {expenseCategories.length > 0 && (
                <CommandGroup heading={t('transactions.expense')}>
                  {expenseCategories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={category.name}
                      onSelect={() => toggleCategory(category.name)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedCategories.includes(category.name) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="mr-2">{category.icon}</span>
                      <span>{category.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Income categories */}
              {incomeCategories.length > 0 && (
                <CommandGroup heading={t('transactions.income')}>
                  {incomeCategories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={category.name}
                      onSelect={() => toggleCategory(category.name)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedCategories.includes(category.name) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="mr-2">{category.icon}</span>
                      <span>{category.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected badges */}
      {selectedCategories.length > 0 && selectedCategories.length <= 5 && (
        <div className="flex flex-wrap gap-1">
          {selectedCategories.map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              className="text-xs cursor-pointer"
              onClick={() => toggleCategory(cat)}
            >
              {cat}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
