import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDataTable } from '@/hooks/useDataTable';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTablePagination } from './DataTablePagination';
import type { DataTableProps, ColumnDef, SortState } from './types';

export function DataTable<T extends Record<string, unknown>>({
  data: inputData,
  totalRows: inputTotalRows,
  onQueryChange,
  columns,
  tableId,
  density: defaultDensity = 'normal',
  searchable = true,
  searchPlaceholder,
  columnToggle = true,
  pagination: showPagination = true,
  pageSizeOptions,
  onRowClick,
  onRowDoubleClick,
  rowActions,
  loading = false,
  emptyState,
}: DataTableProps<T>) {
  const [density, setDensity] = useState<'compact' | 'normal'>(defaultDensity);

  const {
    data,
    totalRows,
    sortState,
    toggleSort,
    pagination,
    setPagination,
    pageCount,
    searchTerm,
    setSearchTerm,
    visibleColumns,
    setVisibleColumns,
    filters,
    clearFilters,
  } = useDataTable<T>({
    tableId,
    data: inputData,
    columns,
    onQueryChange,
    totalRows: inputTotalRows,
  });

  // Get visible columns
  const displayedColumns = columns.filter(
    col => col.hideable === false || visibleColumns.includes(col.id)
  );

  // Check if column is sorted
  const getSortState = (columnId: string): SortState | undefined => {
    return sortState.find(s => s.id === columnId);
  };

  // Render sort icon
  const renderSortIcon = (columnId: string) => {
    const sort = getSortState(columnId);
    if (!sort) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sort.desc ? (
      <ArrowDown className="ml-1 h-3 w-3" />
    ) : (
      <ArrowUp className="ml-1 h-3 w-3" />
    );
  };

  // Get cell value
  const getCellValue = (row: T, column: ColumnDef<T>) => {
    if (column.accessorFn) {
      return column.accessorFn(row);
    }
    if (column.accessorKey) {
      return row[column.accessorKey as string];
    }
    return undefined;
  };

  // Render cell content
  const renderCell = (row: T, column: ColumnDef<T>) => {
    const value = getCellValue(row, column);

    // Custom cell renderer
    if (column.cell) {
      return column.cell({ row, value });
    }

    // Badge type
    if (column.meta?.type === 'badge' && column.meta.badgeVariants) {
      const variant = column.meta.badgeVariants[String(value)] ?? 'outline';
      return <Badge variant={variant}>{String(value ?? '')}</Badge>;
    }

    // Currency type
    if (column.meta?.type === 'currency') {
      const numValue = typeof value === 'number' ? value : Number(value);
      return (
        <span className="tabular-nums font-medium">
          {!isNaN(numValue)
            ? numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : String(value ?? '')}
        </span>
      );
    }

    // Date type
    if (column.meta?.type === 'date' && value) {
      return new Date(String(value)).toLocaleDateString('pt-BR');
    }

    return String(value ?? '');
  };

  // Row padding based on density
  const cellPadding = density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4';

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="w-full">
      {/* Toolbar */}
      <DataTableToolbar
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        columnToggle={columnToggle}
        columns={columns}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
        density={density}
        onDensityChange={setDensity}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {displayedColumns.map(column => (
                <TableHead
                  key={column.id}
                  className={cn(
                    cellPadding,
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer select-none hover:bg-muted/80',
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                  }}
                  onClick={(e) => {
                    if (column.sortable) {
                      toggleSort(column.id, e.shiftKey);
                    }
                  }}
                  aria-sort={
                    getSortState(column.id)
                      ? getSortState(column.id)!.desc
                        ? 'descending'
                        : 'ascending'
                      : undefined
                  }
                >
                  <div className={cn(
                    "flex items-center gap-1",
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end',
                  )}>
                    {typeof column.header === 'string' ? column.header : column.header}
                    {column.sortable && renderSortIcon(column.id)}
                  </div>
                </TableHead>
              ))}
              {rowActions && (
                <TableHead className={cn(cellPadding, "w-12")} />
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {displayedColumns.map(column => (
                    <TableCell key={column.id} className={cellPadding}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell className={cellPadding}>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell
                  colSpan={displayedColumns.length + (rowActions ? 1 : 0)}
                  className="h-32 text-center"
                >
                  {emptyState ?? (
                    <div className="text-muted-foreground">
                      Nenhum resultado encontrado
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              data.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    'hover:bg-muted/50 transition-colors'
                  )}
                  onClick={() => onRowClick?.(row)}
                  onDoubleClick={() => onRowDoubleClick?.(row)}
                >
                  {displayedColumns.map(column => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        cellPadding,
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.meta?.type === 'currency' && 'font-mono',
                      )}
                    >
                      {renderCell(row, column)}
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell className={cn(cellPadding, "text-right")}>
                      {rowActions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <DataTablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          pageCount={pageCount}
          totalRows={totalRows}
          pageSizeOptions={pageSizeOptions}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          onPageSizeChange={(pageSize) => setPagination({ page: 0, pageSize })}
        />
      )}
    </div>
  );
}
