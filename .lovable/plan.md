

# Correção: Exibir Valores das Transferências na Tabela

## Problema

As transferências mostram "-" nas colunas Entrada e Saída porque o tipo é `'TRANSFER'`, que não corresponde a `'INCOME'` nem `'EXPENSE'`.

```typescript
// Linha 357-363: só mostra valor se for INCOME
{entry.type === 'INCOME' ? formatMoney(...) : '-'}

// Linha 366-372: só mostra valor se for EXPENSE
{entry.type === 'EXPENSE' ? formatMoney(...) : '-'}
```

## Solução

Exibir o valor da transferência na coluna **Saída** (já que representa dinheiro saindo de uma conta), com cor diferenciada (azul/roxo) para diferenciar visualmente de despesas.

## Arquivo a Modificar

`src/components/game/CashFlowTransactionTable.tsx`

## Alteração (Linhas 365-372)

**De:**
```tsx
<TableCell className="text-right">
  {entry.type === 'EXPENSE' ? (
    <span className="text-red-600 ...">
      {formatMoney(entry.amount, displayCurrency)}
    </span>
  ) : (
    <span className="text-muted-foreground text-sm">-</span>
  )}
</TableCell>
```

**Para:**
```tsx
<TableCell className="text-right">
  {entry.type === 'EXPENSE' ? (
    <span className="text-red-600 ...">
      {formatMoney(entry.amount, displayCurrency)}
    </span>
  ) : entry.type === 'TRANSFER' ? (
    <span className="text-primary font-medium text-sm tabular-nums">
      {formatMoney(entry.amount, displayCurrency)}
    </span>
  ) : (
    <span className="text-muted-foreground text-sm">-</span>
  )}
</TableCell>
```

## Resultado Esperado

| Descrição | Entrada | Saída | Saldo |
|-----------|---------|-------|-------|
| PIX para Nubank | - | **R$ 500,00** (azul) | R$ 3.000 |
| Salário | R$ 5.000 | - | R$ 5.000 |
| Mercado | - | R$ 200 (vermelho) | R$ 2.800 |

A transferência agora mostra o valor R$ 500,00 em azul na coluna Saída, diferenciando-a de despesas (vermelho).

