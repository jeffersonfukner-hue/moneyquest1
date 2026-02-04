

# Correção: Saldo Corrido Deve Seguir a Ordem Visual da Tabela

## Problema Identificado

O código atual (linhas 170-205) usa uma abordagem incorreta:

```typescript
// 1. Calcula balanceMap com ordenação cronológica FIXA
const byDate = [...unifiedEntries].sort((a, b) => {...}); // sempre date ASC
balanceMap.set(entry.id, balance);

// 2. Aplica o mapa aos sortedEntries (ordenados pelo usuário)
return sortedEntries.map(entry => ({
  ...entry,
  runningBalance: balanceMap.get(entry.id) || 0, // ❌ Reutiliza valor fixo por ID
}));
```

**Resultado:** Quando o usuário inverte a ordenação, as linhas mudam de posição mas cada uma mantém o saldo calculado na ordem cronológica. Uma entrada de +500 no final (DESC) mostra o saldo como se estivesse no início (ASC).

## Comportamento Esperado

| Ordem ASC (antigo→novo) | Saldo |
|------------------------|-------|
| 24/01 +120 | 20.802,96 |
| 30/01 +140 | 20.942,96 |
| 30/01 +500 | 21.442,96 |

| Ordem DESC (novo→antigo) | Saldo |
|--------------------------|-------|
| 30/01 +500 | 500,00 |
| 30/01 +140 | 640,00 |
| 24/01 +120 | 760,00 |

O saldo de cada linha depende da **posição visual na tabela**, não do ID.

## Solução

Calcular o saldo **sempre na ordem exibida** (após aplicar filtros e ordenação do usuário):

```typescript
const entriesWithBalance = useMemo(() => {
  // Calcular saldo na ordem visual (sortedEntries já está na ordem do usuário)
  let balance = 0;
  
  return sortedEntries.map(entry => {
    // Transferências não afetam saldo consolidado
    if (entry.type !== 'TRANSFER') {
      balance += entry.type === 'INCOME' ? entry.amount : -entry.amount;
    }
    return {
      ...entry,
      runningBalance: balance,
    };
  });
}, [sortedEntries]); // Recalcula quando sortedEntries muda (inclui mudança de ordenação)
```

## Alteração

### Arquivo: `src/components/game/CashFlowTransactionTable.tsx`

**Substituir linhas 170-205:**

```typescript
// ANTES (ordenação fixa + mapa por ID):
const entriesWithBalance = useMemo(() => {
  const byDate = [...unifiedEntries].sort((a, b) => {
    // ordenação cronológica fixa...
  });
  
  let balance = 0;
  const balanceMap = new Map<string, number>();
  
  byDate.forEach(entry => {
    if (entry.type !== 'TRANSFER') {
      balance += entry.type === 'INCOME' ? entry.amount : -entry.amount;
    }
    balanceMap.set(entry.id, balance);
  });

  return sortedEntries.map(entry => ({
    ...entry,
    runningBalance: balanceMap.get(entry.id) || 0,
  }));
}, [unifiedEntries, sortedEntries]);

// DEPOIS (cálculo direto na ordem visual):
const entriesWithBalance = useMemo(() => {
  // Calcular saldo corrido seguindo a ordem visual da tabela (de cima para baixo)
  // Recalcula automaticamente quando sortedEntries muda (inclui mudanças de ordenação/filtro)
  let balance = 0;
  
  return sortedEntries.map(entry => {
    // Transferências não afetam saldo consolidado (movimento interno)
    if (entry.type !== 'TRANSFER') {
      balance += entry.type === 'INCOME' ? entry.amount : -entry.amount;
    }
    return {
      ...entry,
      runningBalance: balance,
    };
  });
}, [sortedEntries]);
```

## Regras Garantidas

| Regra | Implementação |
|-------|---------------|
| Saldo segue ordem visual | `sortedEntries.map()` percorre na ordem exibida |
| Mudou ordenação? Recalcula | `useMemo([sortedEntries])` reage a mudanças de sort |
| Mudou filtro? Recalcula | `sortedEntries` depende de `unifiedEntries` que depende de `transactions` |
| Sem cache por ID | Não usa `balanceMap.get(entry.id)` |

## Validação

1. Criar transações no mesmo mês:
   - 24/01 +120
   - 30/01 +140  
   - 30/01 +500

2. Ordenar ASC (antigo→novo):
   - 24/01: 120
   - 30/01: 260 
   - 30/01: 760

3. Ordenar DESC (novo→antigo):
   - 30/01 +500: 500
   - 30/01 +140: 640
   - 24/01 +120: 760

4. Confirmar que o saldo final (última linha) é igual em ambas as ordenações

