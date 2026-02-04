
# Plano: Transações em Tempo Real (Sincronização Instantânea)

## Problema Identificado

Quando você adiciona uma transação na página Index, ela NÃO aparece automaticamente na página `/transactions`. Isso acontece porque:

1. Cada página (Index e Transactions) usa sua própria instância do `useTransactions()`
2. Cada instância tem seu próprio estado local (`useState`)
3. Quando Index adiciona uma transação e chama `fetchTransactions()`, apenas o estado do Index é atualizado
4. A página Transactions não sabe que algo mudou até você navegar para fora e voltar

## Solução Proposta

Usar o mesmo padrão já implementado para `useWallets` - eventos de sincronização entre instâncias do hook.

## Alterações Necessárias

### Arquivo 1: `src/lib/appEvents.ts`

Adicionar evento para transações:

```typescript
// Novo evento
export const APP_EVENT_TRANSACTIONS_CHANGED = 'mq:transactions-changed';

// Nova função para emitir
export function emitTransactionsChanged() {
  safeWindow()?.dispatchEvent(new CustomEvent(APP_EVENT_TRANSACTIONS_CHANGED));
}

// Nova função para escutar
export function onTransactionsChanged(handler: AnyFn) {
  const w = safeWindow();
  if (!w) return () => {};
  const listener = () => handler();
  w.addEventListener(APP_EVENT_TRANSACTIONS_CHANGED, listener);
  return () => w.removeEventListener(APP_EVENT_TRANSACTIONS_CHANGED, listener);
}
```

### Arquivo 2: `src/hooks/useTransactions.tsx`

Mudança 1 - Importar funções de evento:
```typescript
import { emitTransactionsChanged, onTransactionsChanged } from '@/lib/appEvents';
```

Mudança 2 - Adicionar listener para sincronização (após o useEffect do fetchTransactions):
```typescript
// Keep multiple instances of this hook in sync across the app
useEffect(() => {
  return onTransactionsChanged(() => {
    fetchTransactions();
  });
}, [user]); // fetchTransactions depends on user
```

Mudança 3 - Emitir evento após addTransaction (linha ~261):
```typescript
await fetchTransactions();
await refetchProfile();
emitTransactionsChanged(); // <-- ADICIONAR
```

Mudança 4 - Emitir evento após updateTransaction (linha ~418):
```typescript
await fetchTransactions();
await refetchProfile();
emitTransactionsChanged(); // <-- ADICIONAR
```

Mudança 5 - Emitir evento após deleteTransaction (linha ~440):
```typescript
await fetchTransactions();
emitTransactionsChanged(); // <-- ADICIONAR
```

Mudança 6 - Emitir evento após batchDeleteTransactions (linha ~490):
```typescript
// Após setTransactions e recalculateBalance
emitTransactionsChanged(); // <-- ADICIONAR
```

## Fluxo Resultante

```text
Usuário adiciona transação no Index
    ↓
addTransaction() é executado
    ↓
fetchTransactions() atualiza estado do Index
    ↓
emitTransactionsChanged() dispara evento global
    ↓
Todas as outras instâncias de useTransactions escutam o evento
    ↓
Página Transactions executa fetchTransactions() automaticamente
    ↓
Transação aparece INSTANTANEAMENTE em todas as páginas
```

## Por Que Esta Solução?

| Alternativa | Prós | Contras |
|-------------|------|---------|
| Eventos CustomEvent (escolhida) | Já usada no projeto (useWallets), leve, sem dependências | Não é "verdadeiro" realtime |
| React Query | Cache compartilhado, invalidação automática | Requer refatorar todo o hook |
| Supabase Realtime | Verdadeiro realtime do banco | Latência de rede, overhead |
| Context global | Estado único | Complexo, re-renders excessivos |

A solução de eventos já está provada no projeto e mantém consistência com o padrão existente.

## Resultado Esperado

- Lançou transação → aparece IMEDIATAMENTE em `/transactions`
- Editou transação → atualiza IMEDIATAMENTE em todas as páginas
- Excluiu transação → some IMEDIATAMENTE de todas as páginas
- Zero delay perceptível ao usuário
