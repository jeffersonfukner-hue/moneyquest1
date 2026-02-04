

# Correção: Running Balance Inconsistente ao Mudar Ordenação

## Problema Identificado

No arquivo `CashFlowTransactionTable.tsx` (linhas 170-172), o cálculo do `balanceMap` ordena apenas por `date`:

```typescript
const byDate = [...unifiedEntries].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
);
```

Quando existem múltiplas transações no **mesmo dia**, a ordem entre elas não é determinística. Isso causa:
- Saldo corrido diferente ao alternar ASC/DESC
- Valores inconsistentes com o Dashboard

## Solução

Adicionar **tie-breakers estáveis** na ordenação do `balanceMap` e incluir o campo `created_at` na interface `CashFlowEntry`.

## Alterações

### Arquivo: `src/components/game/CashFlowTransactionTable.tsx`

#### 1. Atualizar interface `CashFlowEntry` (linhas 38-54)

Adicionar campo `created_at`:

```typescript
interface CashFlowEntry {
  id: string;
  date: string;
  created_at: string;  // ADICIONAR
  description: string;
  category?: string;
  // ... resto igual
}
```

#### 2. Atualizar conversão de transações (linhas 109-122)

Incluir `created_at` do objeto original:

```typescript
const txEntries: CashFlowEntry[] = transactions.map(tx => ({
  id: tx.id,
  date: tx.date,
  created_at: tx.created_at,  // ADICIONAR
  description: tx.description,
  // ... resto igual
}));
```

#### 3. Atualizar conversão de transferências (linhas 131-142)

Incluir `created_at` do objeto original:

```typescript
return {
  id: t.id,
  date: t.date,
  created_at: t.created_at,  // ADICIONAR
  description: t.description || `${fromName} → ${toName}`,
  // ... resto igual
};
```

#### 4. Corrigir ordenação para cálculo do balanceMap (linhas 170-172)

Substituir a ordenação simples por uma com tie-breakers:

```typescript
// ANTES:
const byDate = [...unifiedEntries].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
);

// DEPOIS:
const byDate = [...unifiedEntries].sort((a, b) => {
  // 1. Primeiro: ordenar por data
  const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
  if (dateCompare !== 0) return dateCompare;
  
  // 2. Segundo: ordenar por created_at (timestamp de criação)
  const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
  const createdCompare = aCreated - bCreated;
  if (createdCompare !== 0) return createdCompare;
  
  // 3. Terceiro: ordenar por ID (estabilidade garantida)
  return a.id.localeCompare(b.id);
});
```

## Resumo das Mudanças

| Local | Alteração |
|-------|-----------|
| Interface `CashFlowEntry` | +1 campo: `created_at: string` |
| Conversão de transactions | +1 linha: `created_at: tx.created_at` |
| Conversão de transfers | +1 linha: `created_at: t.created_at` |
| Ordenação do balanceMap | Substituir por ordenação com 3 critérios |

## Resultado Esperado

| Situação | Antes | Depois |
|----------|-------|--------|
| Ordenação ASC | Saldo X | Saldo X |
| Ordenação DESC | Saldo Y (diferente!) | Saldo X (igual!) |
| Múltiplas tx no mesmo dia | Ordem aleatória | Ordem por criação → id |

## Validação

1. Criar 3+ transações no mesmo dia
2. Abrir modo Tabela (`/transactions`)
3. Alternar entre ordenação ASC e DESC
4. Confirmar que:
   - O saldo de cada linha **permanece o mesmo**
   - O saldo final bate com o Dashboard
   - A ordem das transações no mesmo dia é consistente

