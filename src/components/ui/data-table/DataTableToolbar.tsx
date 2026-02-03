import { Search, Columns3, LayoutGrid, LayoutList, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import type { ColumnDef } from './types';

interface DataTableToolbarProps<T> {
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  
  // Column toggle
  columnToggle?: boolean;
  columns: ColumnDef<T>[];
  visibleColumns: string[];
  onVisibleColumnsChange: (columns: string[]) => void;
  
  // Density
  density: 'compact' | 'normal';
  onDensityChange: (density: 'compact' | 'normal') => void;
  
  // Filters
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export function DataTableToolbar<T>({
  searchable = true,
  searchPlaceholder = 'Buscar...',
  searchTerm,
  onSearchChange,
  columnToggle = true,
  columns,
  visibleColumns,
  onVisibleColumnsChange,
  density,
  onDensityChange,
  hasActiveFilters,
  onClearFilters,
}: DataTableToolbarProps<T>) {
  const hideableColumns = columns.filter(col => col.hideable !== false);

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    if (checked) {
      onVisibleColumnsChange([...visibleColumns, columnId]);
    } else {
      onVisibleColumnsChange(visibleColumns.filter(id => id !== columnId));
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 py-3">
      <div className="flex items-center gap-2 flex-1">
        {/* Search */}
        {searchable && (
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => onSearchChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 gap-1"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Density toggle */}
        <div className="flex items-center border rounded-md">
          <Toggle
            pressed={density === 'normal'}
            onPressedChange={() => onDensityChange('normal')}
            size="sm"
            className={cn(
              "h-8 px-2 rounded-r-none border-0",
              density === 'normal' && "bg-muted"
            )}
            aria-label="Normal density"
          >
            <LayoutGrid className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={density === 'compact'}
            onPressedChange={() => onDensityChange('compact')}
            size="sm"
            className={cn(
              "h-8 px-2 rounded-l-none border-0 border-l",
              density === 'compact' && "bg-muted"
            )}
            aria-label="Compact density"
          >
            <LayoutList className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Column toggle */}
        {columnToggle && hideableColumns.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Columns3 className="h-4 w-4" />
                <span className="hidden sm:inline">Colunas</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {hideableColumns.map(column => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.includes(column.id)}
                  onCheckedChange={(checked) => handleColumnToggle(column.id, checked)}
                >
                  {typeof column.header === 'string' ? column.header : column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
