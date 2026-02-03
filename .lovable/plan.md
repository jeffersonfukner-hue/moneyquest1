
# Plano de Implementacao: Desktop Layout + DataTable (Prompt 01.1)

## Visao Geral

Este plano implementa as correcoes e regras para o layout desktop e o componente DataTable, garantindo padronizacao de breakpoints, performance escalavel e preparacao para funcionalidades futuras (conciliacao, drill-down).

---

## 1. Padronizacao de Breakpoints

### 1.1 Atualizar Hook de Deteccao

**Arquivo:** `src/hooks/use-mobile.tsx`

Modificar para retornar breakpoints precisos:

```typescript
const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('mobile');

  useEffect(() => {
    const check = () => {
      if (window.innerWidth >= BREAKPOINTS.TABLET) {
        setBreakpoint('desktop');
      } else if (window.innerWidth >= BREAKPOINTS.MOBILE) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('mobile');
      }
    };
    // MediaQuery listeners...
  }, []);

  return breakpoint;
}

export function useIsMobile() {
  return useBreakpoint() === 'mobile';
}

export function useIsDesktop() {
  return useBreakpoint() === 'desktop';
}
```

### 1.2 Remover max-w-md no Desktop

**Arquivos afetados:**
- `src/pages/Index.tsx` (linha 262)
- `src/pages/Settings.tsx` (linhas 105, 120)
- `src/pages/Profile.tsx` (linhas 134, 150)
- `src/components/navigation/MobileHeader.tsx` (linha 59)
- Outras 35+ ocorrencias

**Estrategia:**
Criar classe CSS condicional:

```css
/* src/index.css */
@layer utilities {
  .content-container {
    @apply px-4 py-3 mx-auto;
    /* Mobile: restrito */
    max-width: 28rem; /* max-w-md */
  }

  @media (min-width: 1024px) {
    .content-container {
      max-width: 80rem; /* max-w-7xl */
      @apply px-6;
    }
  }

  .desktop-content {
    @apply max-w-7xl mx-auto px-6;
  }
}
```

---

## 2. Sistema de Layout Responsivo

### 2.1 Criar DesktopLayout Wrapper

**Novo arquivo:** `src/components/layout/DesktopLayout.tsx`

```typescript
interface DesktopLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  topbar?: ReactNode;
  fullWidth?: boolean; // Para tabelas em largura total
}

export function DesktopLayout({ children, sidebar, topbar, fullWidth }: DesktopLayoutProps) {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {sidebar || <AppSidebar />}
        <SidebarInset>
          {topbar || <DesktopTopbar />}
          <main className={cn(
            "flex-1",
            fullWidth ? "px-6" : "desktop-content"
          )}>
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
```

### 2.2 Atualizar AppLayout

**Arquivo:** `src/components/layout/AppLayout.tsx`

Integrar DesktopLayout condicionalmente:

```typescript
export const AppLayout = ({ children, ... }: AppLayoutProps) => {
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();

  // Desktop: usa sidebar + topbar
  if (isDesktop) {
    return (
      <DesktopLayout fullWidth={fullWidth}>
        {children}
      </DesktopLayout>
    );
  }

  // Mobile/Tablet: mantém layout atual
  return (
    <div className={cn("min-h-screen bg-background", getBottomPadding())}>
      {showHeader && <MobileHeader ... />}
      <div className="content-container">
        {children}
      </div>
      {showNavigation && <BottomNavigation ... />}
    </div>
  );
};
```

---

## 3. DataTable com Client/Server Mode

### 3.1 Tipos e Interfaces

**Novo arquivo:** `src/components/ui/data-table/types.ts`

```typescript
// Definicao de coluna
export interface ColumnDef<T> {
  id: string;
  header: string | ReactNode;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => unknown;
  cell?: (info: { row: T; value: unknown }) => ReactNode;
  // Recursos
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  hideable?: boolean;
  // Visual
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  minWidth?: number;
  // Status columns (para badges)
  meta?: {
    type?: 'badge' | 'currency' | 'date' | 'actions';
    badgeVariants?: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'>;
  };
}

// Query para Server Mode
export interface DataTableQuery {
  page: number;
  pageSize: number;
  sort: { id: string; desc: boolean }[];
  filters: Record<string, unknown>;
  search: string;
}

// Props do DataTable
export interface DataTableProps<T> {
  // Dados
  data?: T[]; // Client mode
  totalRows?: number; // Server mode
  onQueryChange?: (query: DataTableQuery) => void; // Server mode

  // Colunas
  columns: ColumnDef<T>[];

  // Configuracao
  tableId: string; // Para persistencia (ex: "mq.table.transactions")
  density?: 'compact' | 'normal';

  // Features
  searchable?: boolean;
  searchPlaceholder?: string;
  columnToggle?: boolean;
  pagination?: boolean;
  pageSizeOptions?: number[];

  // Acoes
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;

  // Estado
  loading?: boolean;
  emptyState?: ReactNode;
}
```

### 3.2 Hook useDataTable

**Novo arquivo:** `src/hooks/useDataTable.ts`

```typescript
export function useDataTable<T>({
  tableId,
  data,
  columns,
  onQueryChange,
  totalRows,
}: UseDataTableOptions<T>) {
  // Estado de ordenacao
  const [sortState, setSortState] = useState<SortState[]>([]);

  // Estado de paginacao
  const [pagination, setPagination] = useState({ page: 0, pageSize: 25 });

  // Estado de busca (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Colunas visiveis (persistidas)
  const [visibleColumns, setVisibleColumns] = useLocalStorage<string[]>(
    `${tableId}.columns`,
    columns.filter(c => c.hideable !== false).map(c => c.id)
  );

  // Filtros ativos
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  // Modo: Client ou Server
  const isServerMode = Boolean(onQueryChange);

  // Dados processados (apenas client mode)
  const processedData = useMemo(() => {
    if (isServerMode || !data) return data || [];

    let result = [...data];

    // 1. Busca (apenas em colunas searchable)
    if (debouncedSearch) {
      const searchableCols = columns.filter(c => c.searchable);
      result = result.filter(row =>
        searchableCols.some(col => {
          const value = col.accessorFn?.(row) ?? row[col.accessorKey!];
          return String(value).toLowerCase().includes(debouncedSearch.toLowerCase());
        })
      );
    }

    // 2. Filtros
    Object.entries(filters).forEach(([colId, filterValue]) => {
      if (filterValue === undefined) return;
      const col = columns.find(c => c.id === colId);
      if (!col) return;
      result = result.filter(row => {
        const value = col.accessorFn?.(row) ?? row[col.accessorKey!];
        return value === filterValue;
      });
    });

    // 3. Ordenacao
    if (sortState.length > 0) {
      result.sort((a, b) => {
        for (const sort of sortState) {
          const col = columns.find(c => c.id === sort.id);
          if (!col) continue;
          const aVal = col.accessorFn?.(a) ?? a[col.accessorKey!];
          const bVal = col.accessorFn?.(b) ?? b[col.accessorKey!];
          const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          if (cmp !== 0) return sort.desc ? -cmp : cmp;
        }
        return 0;
      });
    }

    return result;
  }, [data, debouncedSearch, filters, sortState, columns, isServerMode]);

  // Dados paginados (client mode)
  const paginatedData = useMemo(() => {
    if (isServerMode) return processedData;
    const start = pagination.page * pagination.pageSize;
    return processedData.slice(start, start + pagination.pageSize);
  }, [processedData, pagination, isServerMode]);

  // Total de linhas
  const totalRowCount = isServerMode ? (totalRows ?? 0) : processedData.length;

  // Notificar mudancas (server mode)
  useEffect(() => {
    if (!isServerMode) return;
    onQueryChange?.({
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: sortState,
      filters,
      search: debouncedSearch,
    });
  }, [pagination, sortState, filters, debouncedSearch, isServerMode]);

  return {
    data: paginatedData,
    totalRows: totalRowCount,
    // Ordenacao
    sortState,
    setSortState,
    toggleSort: (colId: string, multi: boolean) => { ... },
    // Paginacao
    pagination,
    setPagination,
    pageCount: Math.ceil(totalRowCount / pagination.pageSize),
    // Busca
    searchTerm,
    setSearchTerm,
    // Colunas
    visibleColumns,
    setVisibleColumns,
    // Filtros
    filters,
    setFilter: (colId: string, value: unknown) => { ... },
    clearFilters: () => setFilters({}),
  };
}
```

### 3.3 Componente DataTable

**Novo arquivo:** `src/components/ui/data-table/DataTable.tsx`

Recursos implementados:
- Renderizacao de tabela com Table do shadcn
- Toolbar com busca, densidade, toggle de colunas
- Cabecalhos clicaveis para ordenacao
- Celulas com badges, valores monetarios (tabular-nums), acoes
- Paginacao completa
- Estado vazio customizavel
- Acessibilidade (ARIA labels)

### 3.4 Colunas de Status e Acoes

Suporte nativo para:

```typescript
// Coluna de badge (status)
{
  id: 'reconciliationStatus',
  header: 'Conciliacao',
  accessorKey: 'reconciliation_status',
  meta: {
    type: 'badge',
    badgeVariants: {
      pending: 'outline',
      reconciled: 'default',
      ignored: 'secondary',
    },
  },
}

// Coluna monetaria (tabular-nums automatico)
{
  id: 'amount',
  header: 'Valor',
  accessorKey: 'amount',
  align: 'right',
  meta: { type: 'currency' },
}

// Coluna de acoes
{
  id: 'actions',
  header: '',
  meta: { type: 'actions' },
  cell: ({ row }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onEdit(row)}>
          Editar
        </DropdownMenuItem>
        ...
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
```

---

## 4. Hotkeys Seguras

### 4.1 Hook useGlobalHotkeys

**Novo arquivo:** `src/hooks/useGlobalHotkeys.ts`

```typescript
export function useGlobalHotkeys() {
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!isDesktop) return; // Hotkeys apenas no desktop

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se foco em input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // "/" ou Cmd+K -> Busca global
      if (e.key === '/' || (e.metaKey && e.key === 'k')) {
        e.preventDefault();
        // Abrir busca global
        document.dispatchEvent(new CustomEvent('open-global-search'));
      }

      // Ctrl+B -> Toggle sidebar (ja implementado no sidebar.tsx)
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop]);
}
```

### 4.2 Atualizar Sidebar para Verificar Desktop

**Arquivo:** `src/components/ui/sidebar.tsx` (linhas 79-89)

```typescript
React.useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Ignorar se nao for desktop
    if (window.innerWidth < 1024) return;

    // Ignorar se foco em input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      toggleSidebar();
    }
  };
  // ...
}, [toggleSidebar]);
```

---

## 5. Seguranca de Acoes Destrutivas

### 5.1 Remover Delete por Teclado na V1

O DataTable NAO implementara:
- Tecla Delete para exclusao
- Selecao de linha por teclado sem confirmacao

### 5.2 Acoes Destrutivas Requerem

1. Selecao explicita (checkbox ou clique)
2. Confirmacao modal clara
3. Toast com feedback

Exemplo no TransactionsList atual ja segue esse padrao (linhas 85-90, 292-303).

---

## 6. Preparacao para Conciliacao

### 6.1 Campos Futuros na Interface

O DataTable suportara colunas para:

```typescript
// Campos de conciliacao (futuro)
interface ReconciliationFields {
  bank_reference_code?: string;
  bank_transaction_id?: string;
  reconciliation_status: 'pending' | 'reconciled' | 'ignored';
  reconciled_at?: string;
  reconciled_by?: string;
}
```

Essas colunas podem ser adicionadas ao Transaction type futuramente.

### 6.2 Persistencia por Tabela

Chaves localStorage padronizadas:
- `mq.table.transactions.columns`
- `mq.table.transfers.columns`
- `mq.table.invoices.columns`
- `mq.table.loans.columns`

---

## 7. Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useGlobalHotkeys.ts` | Gerenciador de atalhos globais |
| `src/hooks/useDataTable.ts` | Estado e logica do DataTable |
| `src/components/ui/data-table/types.ts` | Tipos TypeScript |
| `src/components/ui/data-table/DataTable.tsx` | Componente principal |
| `src/components/ui/data-table/DataTableToolbar.tsx` | Busca, densidade, colunas |
| `src/components/ui/data-table/DataTablePagination.tsx` | Paginacao |
| `src/components/ui/data-table/index.ts` | Exports |
| `src/components/layout/DesktopLayout.tsx` | Wrapper desktop |
| `src/components/layout/AppSidebar.tsx` | Sidebar com navegacao |
| `src/components/layout/DesktopTopbar.tsx` | Topbar com busca/periodo |

---

## 8. Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/use-mobile.tsx` | Adicionar useBreakpoint, useIsDesktop |
| `src/components/layout/AppLayout.tsx` | Integrar DesktopLayout |
| `src/components/ui/sidebar.tsx` | Verificar desktop em hotkey |
| `src/index.css` | Adicionar .content-container, .desktop-content |
| `src/i18n/locales/pt-BR.json` | Adicionar chaves desktop.* |

---

## 9. Ordem de Implementacao

1. **Breakpoints** - Atualizar use-mobile.tsx
2. **CSS Utilities** - Adicionar classes em index.css
3. **DataTable Types** - Criar interfaces
4. **useDataTable Hook** - Implementar logica
5. **DataTable Component** - Criar componente completo
6. **Hotkeys Hook** - Criar useGlobalHotkeys
7. **DesktopLayout** - Criar wrapper
8. **AppSidebar** - Criar sidebar
9. **DesktopTopbar** - Criar topbar
10. **AppLayout Update** - Integrar desktop layout
11. **i18n** - Adicionar traducoes

---

## 10. Testes Recomendados

Apos implementacao:
- Testar em mobile (< 768px): deve manter layout atual
- Testar em tablet (768-1023px): deve usar bottom nav
- Testar em desktop (>= 1024px): deve mostrar sidebar
- Testar DataTable com 100+ linhas: verificar performance
- Testar hotkeys: "/" nao deve ativar em inputs
- Testar persistencia de colunas no localStorage
