
# Plano: Mover Transferências para Coluna ENTRADA em Azul

## ✅ Validação Concluída

### Estrutura de Dados Confirmada no Código

| Campo | Linha | Valor |
|-------|-------|-------|
| `type` | 44 | `'INCOME' \| 'EXPENSE' \| 'TRANSFER'` ✅ |
| `isTransfer` | 51 | `boolean` ✅ |
| Mapeamento | 135 | `type: 'TRANSFER' as const` ✅ |

As transferências vindas de `wallet_transfers` são corretamente mapeadas com `type: 'TRANSFER'` e `isTransfer: true`.

### Cálculo do Saldo (já correto - sem alteração)

Linhas 177-182: O cálculo já ignora transferências:
```typescript
if (entry.type !== 'TRANSFER') {
  balance += entry.type === 'INCOME' ? entry.amount : -entry.amount;
}
```

### Problema Visual Atual

Linhas 383-394: Transferências aparecem na coluna **SAÍDA** com `text-primary`.

---

## Alteração a Implementar

**Arquivo:** `src/components/game/CashFlowTransactionTable.tsx`

**Linhas 374-395** - Mover TRANSFER para coluna ENTRADA em azul:

```typescript
// COLUNA ENTRADA (linhas 374-382)
<TableCell className="text-right">
  {entry.type === 'INCOME' ? (
    <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm tabular-nums">
      {formatMoney(entry.amount, displayCurrency)}
    </span>
  ) : entry.type === 'TRANSFER' ? (
    <span className="text-blue-500 dark:text-blue-400 font-medium text-sm tabular-nums">
      {formatMoney(entry.amount, displayCurrency)}
    </span>
  ) : (
    <span className="text-muted-foreground text-sm">-</span>
  )}
</TableCell>

// COLUNA SAÍDA (linhas 383-395) - remover TRANSFER
<TableCell className="text-right">
  {entry.type === 'EXPENSE' ? (
    <span className="text-red-600 dark:text-red-400 font-medium text-sm tabular-nums">
      {formatMoney(entry.amount, displayCurrency)}
    </span>
  ) : (
    <span className="text-muted-foreground text-sm">-</span>
  )}
</TableCell>
```

---

## Resumo das Mudanças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Transferência na coluna ENTRADA | ❌ Não | ✅ Sim (azul) |
| Transferência na coluna SAÍDA | ✅ Sim | ❌ Não |
| Cor da transferência | `text-primary` | `text-blue-500` |
| Cálculo do saldo | Ignora TRANSFER | Sem alteração |

---

## Resultado Visual Esperado

| Descrição | Entrada | Saída | Saldo |
|-----------|---------|-------|-------|
| Salário | R$ 5.000 (verde) | - | R$ 5.000 |
| **Transferência** | **R$ 500 (azul)** | **-** | R$ 5.000 (sem alteração) |
| Mercado | - | R$ 200 (vermelho) | R$ 4.800 |

---

## Validação Pós-Implementação

1. Abrir modo Tabela em `/transactions`
2. Confirmar que transferências aparecem:
   - Na coluna ENTRADA
   - Com cor azul (`text-blue-500`)
   - Com "-" na coluna SAÍDA
3. Confirmar que o saldo NÃO muda ao passar por uma transferência
4. Comparar Fevereiro e Março com modo Card - saldos devem ser idênticos
