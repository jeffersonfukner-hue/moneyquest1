
# Plano: Fixes de Date Range Inclusivo + Currency Parsing (Prompt 01.3)

## Visao Geral

Este plano corrige tres problemas identificados no hook `useDataTable.ts`:
1. Filtro de date range exclui transacoes do ultimo dia
2. Parsing de currency falha com formato brasileiro "1.234,56"
3. Heuristica de auto-parse de numeros pode causar comportamento inconsistente

---

## 1. Date Range Inclusivo

### Problema Atual (linhas 184-189)

```typescript
const toDate = to ? (to instanceof Date ? to : new Date(to)) : null;
if (toDate && dateValue > toDate) return false;
```

Quando o usuario seleciona "ate 15/01/2025", o `toDate` e criado como `2025-01-15T00:00:00`, excluindo qualquer transacao feita apos meia-noite desse dia.

### Solucao

Normalizar `toDate` para o fim do dia (23:59:59.999):

```typescript
// Helper para normalizar data para fim do dia
function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

// No filtro de date range
const toDate = to ? (to instanceof Date ? to : new Date(to)) : null;
const toDateEnd = toDate ? endOfDay(toDate) : null;

if (toDateEnd && dateValue > toDateEnd) return false;
```

---

## 2. Currency Parsing Robusto

### Problema Atual (linhas 28-34)

```typescript
// R$ 1.234,56 -> erro!
const cleaned = String(value).replace(/[^\d,.-]/g, '').replace(',', '.');
// Resultado: "1.234.56" (dois pontos decimais = NaN)
```

O problema e que:
1. Primeiro remove simbolos: "R$ 1.234,56" → "1.234,56"
2. Troca virgula por ponto: "1.234,56" → "1.234.56" (INVALIDO)

### Solucao

Tratar formato brasileiro explicitamente:

```typescript
if (colMeta?.type === 'currency') {
  if (typeof value === 'number') return value;
  
  // Remove currency symbols and spaces: "R$ 1.234,56" → "1.234,56"
  let cleaned = String(value).replace(/[R$€$\s]/g, '');
  
  // Brazilian format: dots are thousand separators, comma is decimal
  // Check if format looks like Brazilian (has comma for decimal)
  if (cleaned.includes(',')) {
    // Remove thousand separator dots first, then replace comma with dot
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // US format: commas are thousand separators, dot is decimal
    cleaned = cleaned.replace(/,/g, '');
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
```

**Exemplos de conversao:**
| Input | Resultado |
|-------|-----------|
| `1234.56` | `1234.56` |
| `1,234.56` | `1234.56` (US) |
| `1.234,56` | `1234.56` (BR) |
| `R$ 1.234,56` | `1234.56` |
| `€ 1.234,56` | `1234.56` |

---

## 3. Sorting: Remover Auto-Parse Heuristico

### Problema Atual (linhas 40-44)

```typescript
if (typeof value === 'string') {
  const num = parseFloat(value);
  if (!isNaN(num) && value.trim() === String(num)) return num;
}
```

Esta heuristica tenta detectar numeros em strings, mas:
- Falha para "100" vs "100.00" (diferentes representacoes)
- Pode causar ordenacao inconsistente entre strings e numeros

### Solucao

Remover auto-parse e confiar apenas em `meta.type`:

```typescript
// Auto-detection (only for native types)
if (typeof value === 'number') return value;
if (value instanceof Date) return value.getTime();

// Fallback to lowercase string (no auto-parse of number strings)
return String(value).toLowerCase();
```

Se uma coluna precisa de ordenacao numerica, deve declarar `meta.type: 'currency'` ou similar.

---

## Arquivo a Modificar

**`src/hooks/useDataTable.ts`**

### Mudancas Especificas

1. **Adicionar helper `endOfDay`** (antes do hook)
2. **Atualizar parsing de currency** (linhas 28-34)
3. **Remover auto-parse heuristico** (linhas 40-44)
4. **Atualizar filtro de date range** (linhas 184-190)

---

## Codigo Final das Funcoes Afetadas

### Helper endOfDay

```typescript
// Helper to get end of day for inclusive date range
function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}
```

### normalizeForSort (atualizado)

```typescript
function normalizeForSort(value: unknown, colMeta?: ColumnDef<unknown>['meta']): number | string | null {
  if (value == null) return null;
  
  // Explicit type from column metadata
  if (colMeta?.type === 'date') {
    const date = value instanceof Date ? value : new Date(String(value));
    return isNaN(date.getTime()) ? null : date.getTime();
  }
  
  if (colMeta?.type === 'currency') {
    if (typeof value === 'number') return value;
    
    // Remove currency symbols and spaces
    let cleaned = String(value).replace(/[R$€$\s]/g, '');
    
    // Brazilian format: dots are thousand separators, comma is decimal
    if (cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: commas are thousand separators
      cleaned = cleaned.replace(/,/g, '');
    }
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  
  // Native types only
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  
  // Fallback to lowercase string (no auto-parse)
  return String(value).toLowerCase();
}
```

### Date Range Filter (atualizado)

```typescript
// Date range
if (isDateRange(filterValue)) {
  const dateValue = value instanceof Date ? value : new Date(String(value));
  if (isNaN(dateValue.getTime())) return false;
  
  const { from, to } = filterValue;
  const fromDate = from ? (from instanceof Date ? from : new Date(from)) : null;
  const toDate = to ? (to instanceof Date ? to : new Date(to)) : null;
  
  // Normalize toDate to end of day for inclusive comparison
  const toDateEnd = toDate ? endOfDay(toDate) : null;
  
  if (fromDate && dateValue < fromDate) return false;
  if (toDateEnd && dateValue > toDateEnd) return false;
  return true;
}
```

---

## Testes Recomendados

Apos implementacao:
- Filtrar por data "de 01/01 ate 31/01" → deve incluir transacoes de 31/01 23:59
- Ordenar coluna monetaria com valores "R$ 1.234,56" → deve ordenar corretamente
- Ordenar coluna de texto com valores mistos → deve usar ordenacao alfabetica consistente
