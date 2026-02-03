
# Plano: Ajustes Finos (Prompt 01.2)

## Visao Geral

Este plano implementa ajustes de refinamento para o sistema de layout responsivo e o componente DataTable, garantindo melhor experiencia em tablets e robustez no processamento de dados.

---

## 1. Ajustar .content-container para Tablet

**Arquivo:** `src/index.css` (linhas 488-508)

### Problema Atual
A classe `.content-container` salta diretamente de `max-w-md` (28rem) no mobile para `max-w-7xl` (80rem) no desktop, sem considerar o tablet.

### Solucao
Adicionar breakpoint intermediario para tablets (768px-1023px):

```css
.content-container {
  @apply px-4 py-3 mx-auto;
  max-width: 28rem; /* max-w-md - mobile */
}

@media (min-width: 768px) {
  .content-container {
    max-width: 56rem; /* max-w-3xl - tablet */
    @apply px-5;
  }
}

@media (min-width: 1024px) {
  .content-container {
    max-width: 80rem; /* max-w-7xl - desktop */
    @apply px-6;
  }
}
```

### Impacto
- Mobile (< 768px): 28rem (448px)
- Tablet (768px-1023px): 56rem (896px)
- Desktop (>= 1024px): 80rem (1280px)

---

## 2. Otimizar useBreakpoint

**Arquivo:** `src/hooks/use-mobile.tsx`

### Estado Atual
O hook ja esta bem implementado, mas vou garantir:
1. Cleanup adequado de listeners
2. Chamada inicial de `check()` antes de qualquer render

### Ajustes Menores

```typescript
export function useBreakpoint(): Breakpoint {
  // Inicializacao sincrona para SSR/primeiro render
  const getInitialBreakpoint = (): Breakpoint => {
    if (typeof window === 'undefined') return 'mobile';
    if (window.innerWidth >= BREAKPOINTS.TABLET) return 'desktop';
    if (window.innerWidth >= BREAKPOINTS.MOBILE) return 'tablet';
    return 'mobile';
  };

  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>(getInitialBreakpoint);

  React.useEffect(() => {
    const check = () => {
      if (window.innerWidth >= BREAKPOINTS.TABLET) {
        setBreakpoint('desktop');
      } else if (window.innerWidth >= BREAKPOINTS.MOBILE) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('mobile');
      }
    };

    // Listener de resize com cleanup garantido
    window.addEventListener('resize', check);
    
    // Check inicial apos mount (caso haja diferenca do SSR)
    check();

    return () => {
      window.removeEventListener('resize', check);
    };
  }, []);

  return breakpoint;
}
```

### Beneficios
- Valor inicial correto sem flicker
- Unico listener de resize (mais eficiente que MediaQueryList para este caso)
- Cleanup garantido

---

## 3. Sorting Robusto no Client Mode

**Arquivo:** `src/hooks/useDataTable.ts` (linhas 116-137)

### Problema Atual
O sorting atual usa comparacao simples `aVal < bVal` que nao funciona corretamente para:
- Datas em formato string
- Valores monetarios com formatacao
- Tipos mistos

### Solucao: Funcao de Normalizacao

```typescript
// Helper para normalizar valores para comparacao
function normalizeForSort(value: unknown, colMeta?: ColumnDef<unknown>['meta']): number | string | null {
  if (value == null) return null;
  
  // Tipo especificado na coluna
  if (colMeta?.type === 'date') {
    const date = value instanceof Date ? value : new Date(String(value));
    return isNaN(date.getTime()) ? null : date.getTime();
  }
  
  if (colMeta?.type === 'currency') {
    if (typeof value === 'number') return value;
    // Remove formatacao de moeda: R$ 1.234,56 -> 1234.56
    const cleaned = String(value).replace(/[^\d,.-]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  
  // Deteccao automatica
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  
  // Tenta parsear como numero
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (!isNaN(num) && value.trim() === String(num)) return num;
  }
  
  // Fallback para string (case-insensitive)
  return String(value).toLowerCase();
}

// Funcao de comparacao robusta
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
  
  // String comparison
  return String(normA).localeCompare(String(normB), 'pt-BR', { sensitivity: 'base' });
}
```

### Sorting Atualizado

```typescript
// 3. Sorting
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
```

---

## 4. Filtros Avancados (Array e Date Range)

**Arquivo:** `src/hooks/useDataTable.ts` (linhas 104-114)

### Tipos de Filtro Suportados

```typescript
// Tipos de filtro no types.ts
export type FilterValue = 
  | unknown                           // Valor unico (igualdade)
  | unknown[]                         // Array (multi-select, OR)
  | { from?: Date | string; to?: Date | string }; // Range de datas
```

### Logica de Filtragem Expandida

```typescript
// 2. Filters
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
    
    // Igualdade simples
    return value === filterValue;
  });
});

// Helper para detectar range de datas
function isDateRange(value: unknown): value is { from?: Date | string; to?: Date | string } {
  return typeof value === 'object' && value !== null && ('from' in value || 'to' in value);
}
```

---

## 5. Server Mode: Evitar Chamadas Duplicadas

**Arquivo:** `src/hooks/useDataTable.ts` (linhas 162-175)

### Problema
Cada mudanca de estado dispara `onQueryChange`, potencialmente duplicando chamadas.

### Solucao: Comparar Query Anterior

```typescript
import { useRef } from 'react';

// Dentro do hook
const prevQueryRef = useRef<string>('');

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
  
  // Serializar e comparar com query anterior
  const queryString = JSON.stringify(query);
  if (queryString === prevQueryRef.current) {
    return; // Query identica, nao chamar
  }
  
  prevQueryRef.current = queryString;
  onQueryChange?.(query);
}, [pagination, sortState, filters, debouncedSearch, isServerMode, onQueryChange]);
```

### Beneficios
- Evita chamadas duplicadas ao backend
- Evita re-renders desnecessarios
- Compativel com StrictMode do React

---

## 6. Atualizacao de Tipos

**Arquivo:** `src/components/ui/data-table/types.ts`

### Adicionar Tipos de Filtro

```typescript
// Date range filter type
export interface DateRangeFilter {
  from?: Date | string;
  to?: Date | string;
}

// Filter value can be single, array (multi-select), or date range
export type FilterValue = unknown | unknown[] | DateRangeFilter;

// Update DataTableQuery
export interface DataTableQuery {
  page: number;
  pageSize: number;
  sort: SortState[];
  filters: Record<string, FilterValue>;
  search: string;
}
```

---

## Arquivos a Modificar

| Arquivo | Mudancas |
|---------|----------|
| `src/index.css` | Adicionar breakpoint tablet no .content-container |
| `src/hooks/use-mobile.tsx` | Otimizar inicializacao e cleanup |
| `src/hooks/useDataTable.ts` | Sorting robusto, filtros avancados, prevencao de duplicatas |
| `src/components/ui/data-table/types.ts` | Adicionar tipos DateRangeFilter, FilterValue |

---

## Ordem de Implementacao

1. Atualizar tipos em `types.ts`
2. Atualizar CSS para tablet
3. Otimizar `use-mobile.tsx`
4. Implementar sorting robusto em `useDataTable.ts`
5. Implementar filtros avancados
6. Adicionar ref para prevenir duplicatas

---

## Testes Recomendados

Apos implementacao:
- Tablet (768px-1023px): verificar max-width de 56rem
- Sorting: testar com datas, valores monetarios, nulls
- Filtros: testar array de valores e range de datas
- Server mode: verificar que onQueryChange nao e chamado duas vezes com mesma query
