import { ReactNode } from 'react';

// Sort state
export interface SortState {
  id: string;
  desc: boolean;
}

// Column definition
export interface ColumnDef<T> {
  id: string;
  header: string | ReactNode;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => unknown;
  cell?: (info: { row: T; value: unknown }) => ReactNode;
  // Features
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  hideable?: boolean;
  // Visual
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  minWidth?: number;
  // Status columns (for badges)
  meta?: {
    type?: 'badge' | 'currency' | 'date' | 'actions';
    badgeVariants?: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'>;
  };
}

// Query for Server Mode
export interface DataTableQuery {
  page: number;
  pageSize: number;
  sort: SortState[];
  filters: Record<string, unknown>;
  search: string;
}

// Props for DataTable
export interface DataTableProps<T> {
  // Data
  data?: T[]; // Client mode
  totalRows?: number; // Server mode
  onQueryChange?: (query: DataTableQuery) => void; // Server mode

  // Columns
  columns: ColumnDef<T>[];

  // Configuration
  tableId: string; // For persistence (e.g., "mq.table.transactions")
  density?: 'compact' | 'normal';

  // Features
  searchable?: boolean;
  searchPlaceholder?: string;
  columnToggle?: boolean;
  pagination?: boolean;
  pageSizeOptions?: number[];

  // Actions
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;

  // State
  loading?: boolean;
  emptyState?: ReactNode;
}

// Options for useDataTable hook
export interface UseDataTableOptions<T> {
  tableId: string;
  data?: T[];
  columns: ColumnDef<T>[];
  onQueryChange?: (query: DataTableQuery) => void;
  totalRows?: number;
  defaultPageSize?: number;
}

// Return type for useDataTable hook
export interface UseDataTableReturn<T> {
  // Data
  data: T[];
  totalRows: number;
  
  // Sorting
  sortState: SortState[];
  setSortState: (state: SortState[]) => void;
  toggleSort: (colId: string, multi: boolean) => void;
  
  // Pagination
  pagination: { page: number; pageSize: number };
  setPagination: (pagination: { page: number; pageSize: number }) => void;
  pageCount: number;
  
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Columns
  visibleColumns: string[];
  setVisibleColumns: (columns: string[] | ((prev: string[]) => string[])) => void;
  
  // Filters
  filters: Record<string, unknown>;
  setFilter: (colId: string, value: unknown) => void;
  clearFilters: () => void;
  
  // Mode
  isServerMode: boolean;
}

// Reconciliation fields for future use
export interface ReconciliationFields {
  bank_reference_code?: string;
  bank_transaction_id?: string;
  reconciliation_status: 'pending' | 'reconciled' | 'ignored';
  reconciled_at?: string;
  reconciled_by?: string;
}
