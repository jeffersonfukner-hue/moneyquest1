import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useDebounce } from './useDebounce';
import type { 
  ColumnDef, 
  SortState, 
  UseDataTableOptions, 
  UseDataTableReturn,
  DataTableQuery 
} from '@/components/ui/data-table/types';

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

    // 2. Filters
    Object.entries(filters).forEach(([colId, filterValue]) => {
      if (filterValue === undefined || filterValue === null) return;
      const col = columns.find(c => c.id === colId);
      if (!col) return;
      
      result = result.filter(row => {
        const value = col.accessorFn?.(row) ?? (col.accessorKey ? row[col.accessorKey] : undefined);
        return value === filterValue;
      });
    });

    // 3. Sorting
    if (sortState.length > 0) {
      result.sort((a, b) => {
        for (const sort of sortState) {
          const col = columns.find(c => c.id === sort.id);
          if (!col) continue;
          
          const aVal = col.accessorFn?.(a) ?? (col.accessorKey ? a[col.accessorKey] : undefined);
          const bVal = col.accessorFn?.(b) ?? (col.accessorKey ? b[col.accessorKey] : undefined);
          
          // Handle nulls
          if (aVal == null && bVal == null) continue;
          if (aVal == null) return sort.desc ? -1 : 1;
          if (bVal == null) return sort.desc ? 1 : -1;
          
          // Compare
          const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
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

  // Notify changes (server mode)
  useEffect(() => {
    if (!isServerMode) return;
    
    const query: DataTableQuery = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: sortState,
      filters,
      search: debouncedSearch,
    };
    
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
