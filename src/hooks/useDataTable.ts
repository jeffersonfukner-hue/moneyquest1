import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useDebounce } from './useDebounce';
import type { 
  ColumnDef, 
  SortState, 
  UseDataTableOptions, 
  UseDataTableReturn,
  DataTableQuery,
  DateRangeFilter,
} from '@/components/ui/data-table/types';

// Helper to detect date range filter
function isDateRange(value: unknown): value is DateRangeFilter {
  return typeof value === 'object' && value !== null && ('from' in value || 'to' in value);
}

// Helper to normalize values for sorting
function normalizeForSort(value: unknown, colMeta?: ColumnDef<unknown>['meta']): number | string | null {
  if (value == null) return null;
  
  // Explicit type from column metadata
  if (colMeta?.type === 'date') {
    const date = value instanceof Date ? value : new Date(String(value));
    return isNaN(date.getTime()) ? null : date.getTime();
  }
  
  if (colMeta?.type === 'currency') {
    if (typeof value === 'number') return value;
    // Remove currency formatting: R$ 1.234,56 -> 1234.56
    const cleaned = String(value).replace(/[^\d,.-]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  
  // Auto-detection
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  
  // Try to parse as number
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (!isNaN(num) && value.trim() === String(num)) return num;
  }
  
  // Fallback to lowercase string
  return String(value).toLowerCase();
}

// Robust comparison function
function compareValues(a: unknown, b: unknown, colMeta?: ColumnDef<unknown>['meta']): number {
  const normA = normalizeForSort(a, colMeta);
  const normB = normalizeForSort(b, colMeta);
  
  // Nulls always last
  if (normA === null && normB === null) return 0;
  if (normA === null) return 1;
  if (normB === null) return -1;
  
  // Numeric comparison
  if (typeof normA === 'number' && typeof normB === 'number') {
    return normA - normB;
  }
  
  // String comparison with locale support
  return String(normA).localeCompare(String(normB), 'pt-BR', { sensitivity: 'base' });
}

export function useDataTable<T>({
  tableId,
  data,
  columns,
  onQueryChange,
  totalRows,
  defaultPageSize = 25,
}: UseDataTableOptions<T>): UseDataTableReturn<T> {
  // Sorting state
  const [sortState, setSortState] = useState<SortState[]>([]);

  // Pagination state
  const [pagination, setPagination] = useState({ page: 0, pageSize: defaultPageSize });

  // Search state (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Visible columns (persisted)
  const [visibleColumns, setVisibleColumns] = useLocalStorage<string[]>(
    `${tableId}.columns`,
    columns.filter(c => c.hideable !== false).map(c => c.id)
  );

  // Active filters
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  // Mode: Client or Server
  const isServerMode = Boolean(onQueryChange);

  // Ref to track previous query for deduplication
  const prevQueryRef = useRef<string>('');

  // Toggle sort handler
  const toggleSort = useCallback((colId: string, multi: boolean) => {
    setSortState(prev => {
      const existing = prev.find(s => s.id === colId);
      
      if (!multi) {
        // Single column sort
        if (!existing) {
          return [{ id: colId, desc: false }];
        }
        if (!existing.desc) {
          return [{ id: colId, desc: true }];
        }
        return [];
      }
      
      // Multi column sort (shift+click)
      if (!existing) {
        return [...prev, { id: colId, desc: false }];
      }
      if (!existing.desc) {
        return prev.map(s => s.id === colId ? { ...s, desc: true } : s);
      }
      return prev.filter(s => s.id !== colId);
    });
  }, []);

  // Set single filter
  const setFilter = useCallback((colId: string, value: unknown) => {
    setFilters(prev => {
      if (value === undefined || value === null || value === '') {
        const { [colId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [colId]: value };
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Processed data (client mode only)
  const processedData = useMemo(() => {
    if (isServerMode || !data) return data || [];

    let result = [...data];

    // 1. Search (only in searchable columns)
    if (debouncedSearch) {
      const searchableCols = columns.filter(c => c.searchable);
      const searchLower = debouncedSearch.toLowerCase();
      
      result = result.filter(row =>
        searchableCols.some(col => {
          const value = col.accessorFn?.(row) ?? (col.accessorKey ? row[col.accessorKey] : undefined);
          return String(value ?? '').toLowerCase().includes(searchLower);
        })
      );
    }

    // 2. Filters (supports array multi-select and date range)
    Object.entries(filters).forEach(([colId, filterValue]) => {
      if (filterValue === undefined || filterValue === null) return;
      const col = columns.find(c => c.id === colId);
      if (!col) return;
      
      result = result.filter(row => {
        const value = col.accessorFn?.(row) ?? (col.accessorKey ? row[col.accessorKey] : undefined);
        
        // Multi-select (array)
        if (Array.isArray(filterValue)) {
          if (filterValue.length === 0) return true;
          return filterValue.some(fv => fv === value);
        }
        
        // Date range
        if (isDateRange(filterValue)) {
          const dateValue = value instanceof Date ? value : new Date(String(value));
          if (isNaN(dateValue.getTime())) return false;
          
          const { from, to } = filterValue;
          const fromDate = from ? (from instanceof Date ? from : new Date(from)) : null;
          const toDate = to ? (to instanceof Date ? to : new Date(to)) : null;
          
          if (fromDate && dateValue < fromDate) return false;
          if (toDate && dateValue > toDate) return false;
          return true;
        }
        
        // Simple equality
        return value === filterValue;
      });
    });

    // 3. Sorting (robust with type handling)
    if (sortState.length > 0) {
      result.sort((a, b) => {
        for (const sort of sortState) {
          const col = columns.find(c => c.id === sort.id);
          if (!col) continue;
          
          const aVal = col.accessorFn?.(a) ?? (col.accessorKey ? a[col.accessorKey] : undefined);
          const bVal = col.accessorFn?.(b) ?? (col.accessorKey ? b[col.accessorKey] : undefined);
          
          const cmp = compareValues(aVal, bVal, col.meta);
          if (cmp !== 0) return sort.desc ? -cmp : cmp;
        }
        return 0;
      });
    }

    return result;
  }, [data, debouncedSearch, filters, sortState, columns, isServerMode]);

  // Paginated data (client mode)
  const paginatedData = useMemo(() => {
    if (isServerMode) return processedData;
    const start = pagination.page * pagination.pageSize;
    return processedData.slice(start, start + pagination.pageSize);
  }, [processedData, pagination, isServerMode]);

  // Total row count
  const totalRowCount = isServerMode ? (totalRows ?? 0) : processedData.length;

  // Page count
  const pageCount = Math.ceil(totalRowCount / pagination.pageSize);

  // Reset page when search/filters change
  useEffect(() => {
    if (!isServerMode) {
      setPagination(prev => ({ ...prev, page: 0 }));
    }
  }, [debouncedSearch, filters, isServerMode]);

  // Notify changes (server mode) - with deduplication
  useEffect(() => {
    if (!isServerMode) return;
    
    const query: DataTableQuery = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: sortState,
      filters,
      search: debouncedSearch,
    };
    
    // Serialize and compare with previous query
    const queryString = JSON.stringify(query);
    if (queryString === prevQueryRef.current) {
      return; // Identical query, skip callback
    }
    
    prevQueryRef.current = queryString;
    onQueryChange?.(query);
  }, [pagination, sortState, filters, debouncedSearch, isServerMode, onQueryChange]);

  return {
    data: paginatedData,
    totalRows: totalRowCount,
    // Sorting
    sortState,
    setSortState,
    toggleSort,
    // Pagination
    pagination,
    setPagination,
    pageCount,
    // Search
    searchTerm,
    setSearchTerm,
    // Columns
    visibleColumns,
    setVisibleColumns,
    // Filters
    filters,
    setFilter,
    clearFilters,
    // Mode
    isServerMode,
  };
}
