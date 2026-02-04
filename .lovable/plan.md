

# Plano: Incluir Transferências na Tabela de Fluxo de Caixa

## Problema Identificado

No **modo tabela** (desktop), as **transferências entre carteiras não estão aparecendo**, o que causa:
- Saldo incorreto/negativo na coluna "Saldo"
- Inconsistência com o modo cards, que mostra transferências corretamente

### Causa Raiz

O componente `CashFlowTransactionTable` recebe apenas `Transaction[]`:

```text
┌─────────────────────────────────────────────────────┐
│ TransactionsList.tsx                                │
├─────────────────────────────────────────────────────┤
│ Modo Cards:                                         │
│   monthGroups → inclui transactions + transfers ✓   │
│                                                     │
│ Modo Tabela:                                        │
│   CashFlowTransactionTable(transactions) ✗         │
│   → transfers NÃO são passadas!                     │
└─────────────────────────────────────────────────────┘
```

---

## Solução Proposta

Criar um tipo unificado `CashFlowEntry` que representa tanto transações quanto transferências, e atualizar a tabela para exibir ambos corretamente.

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/game/CashFlowTransactionTable.tsx` | Adicionar suporte a transferências |
| `src/components/game/TransactionsList.tsx` | Passar transferências para a tabela |

---

## Implementação Técnica

### 1. Novo tipo `CashFlowEntry`

```typescript
interface CashFlowEntry {
  id: string;
  date: string;
  description: string;
  category?: string;
  supplier?: string | null;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  currency: string;
  wallet_id?: string | null;
  credit_card_id?: string | null;
  // Para transferências
  from_wallet_id?: string;
  to_wallet_id?: string;
  isTransfer: boolean;
}
```

### 2. Atualizar `CashFlowTransactionTable`

**Props atualizadas:**
```typescript
interface CashFlowTransactionTableProps {
  transactions: Transaction[];
  transfers: WalletTransfer[];  // NOVO
  onUpdate: (...) => Promise<...>;
  onDelete: (...) => Promise<...>;
  onEditTransfer?: (transfer: WalletTransfer) => void;  // NOVO
  onDeleteTransfer?: (id: string) => Promise<boolean>;  // NOVO
}
```

**Lógica de unificação:**
```typescript
const unifiedEntries = useMemo(() => {
  // Converter transactions para entries
  const txEntries = transactions.map(tx => ({
    ...tx,
    isTransfer: false,
  }));
  
  // Converter transfers para entries (aparecem como "neutras")
  const transferEntries = transfers.map(t => ({
    id: t.id,
    date: t.date,
    description: t.description || `Transferência`,
    type: 'TRANSFER' as const,
    amount: t.amount,
    currency: t.currency,
    from_wallet_id: t.from_wallet_id,
    to_wallet_id: t.to_wallet_id,
    isTransfer: true,
  }));
  
  // Combinar e ordenar por data
  return [...txEntries, ...transferEntries].sort(...);
}, [transactions, transfers]);
```

**Cálculo de saldo ajustado:**
```typescript
// Transferências NÃO afetam o saldo total (são movimentações internas)
// Mas aparecem visualmente na tabela para rastreabilidade
if (entry.type === 'TRANSFER') {
  // Saldo permanece igual
} else if (entry.type === 'INCOME') {
  balance += entry.amount;
} else {
  balance -= entry.amount;
}
```

### 3. Atualizar chamada em `TransactionsList.tsx`

```tsx
{isDesktop && viewMode === 'table' && activeSourceTab !== 'transfer' && (
  <CashFlowTransactionTable
    transactions={filteredBySource}
    transfers={transfers}  // NOVO
    onUpdate={onUpdate}
    onDelete={async (id) => { onDelete(id); return { error: null }; }}
    onEditTransfer={setEditingTransfer}  // NOVO
    onDeleteTransfer={deleteTransfer}    // NOVO
  />
)}
```

---

## Visualização na Tabela

```text
┌──────────┬─────────────────────────┬────────────┬──────────┬──────────┬───────────┐
│ Data     │ Descrição               │ Categoria  │ Entrada  │ Saída    │ Saldo     │
├──────────┼─────────────────────────┼────────────┼──────────┼──────────┼───────────┤
│ 01/02    │ SALÁRIO                 │ 💼 Salário │ R$ 5.000 │    -     │ R$ 5.000  │
│ 02/02    │ ↔️ Nubank → Caixa       │ Transf.    │    -     │    -     │ R$ 5.000  │ ← NOVO
│ 03/02    │ MERCADO                 │ 🛒 Mercado │    -     │ R$ 300   │ R$ 4.700  │
│ 05/02    │ ↔️ Caixa → Inter        │ Transf.    │    -     │    -     │ R$ 4.700  │ ← NOVO
└──────────┴─────────────────────────┴────────────┴──────────┴──────────┴───────────┘
```

**Características visuais das transferências:**
- Ícone `↔️` ou `ArrowRightLeft` antes da descrição
- Categoria mostra "Transferência" com ícone
- Colunas Entrada/Saída ficam vazias (transferência não altera saldo total)
- Linha com estilo diferenciado (fundo sutil azul/roxo)

---

## Resultado Esperado

1. **Saldos corretos**: O running balance agora reflete a realidade
2. **Rastreabilidade**: Transferências aparecem na timeline de fluxo de caixa
3. **Consistência**: Modo tabela e modo cards mostram as mesmas informações
4. **Editável**: Clicar em transferência abre o dialog de edição

