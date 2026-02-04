
# Plano: Adicionar Filtro por Últimos Lançamentos

## Problema Identificado

No painel **"Todas as Transações"**, a ordenação atual usa `tx.date` (data da transação no banco/fatura), mas o usuário quer ver por **`tx.created_at`** (quando foi lançado no sistema MoneyQuest).

### Diferença

| Campo | Significado | Exemplo |
|-------|-------------|---------|
| `date` | Data da transação no banco | 15/01/2025 (quando gastou) |
| `created_at` | Data do lançamento no sistema | 20/01/2025 (quando registrou) |

---

## Solução Proposta

Adicionar um **seletor de ordenação** no painel TransactionDrilldown que permite escolher entre:

1. **Por data da transação** (comportamento atual)
2. **Por últimos lançamentos** (ordenar por `created_at`)

### Interface

```text
┌─────────────────────────────────────────┐
│ Todas as Transações                     │
├─────────────────────────────────────────┤
│ [Entradas] [Saídas] [Total]             │
├─────────────────────────────────────────┤
│ Ordenar por: [Data ▼] [Últimos lançam.] │  ← NOVO
├─────────────────────────────────────────┤
│ Data    │ Descrição        │ Valor      │
│ 20/01   │ Mercado          │ -R$ 150    │
│ 18/01   │ Salário          │ +R$ 3.000  │
└─────────────────────────────────────────┘
```

---

## Implementação Técnica

### Arquivo: `src/components/reports/TransactionDrilldown.tsx`

1. **Adicionar estado para tipo de ordenação**
   ```tsx
   const [sortBy, setSortBy] = useState<'date' | 'created_at'>('created_at');
   ```

2. **Atualizar lógica de ordenação**
   ```tsx
   const sortedTransactions = [...transactions].sort((a, b) => {
     if (sortBy === 'created_at') {
       return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
     }
     return parseDateString(b.date).getTime() - parseDateString(a.date).getTime();
   });
   ```

3. **Adicionar toggle de ordenação na UI**
   - Usar botões com `variant="ghost"` ou `variant="outline"`
   - Ícones: `Clock` para lançamentos, `Calendar` para data

4. **Exibir indicação na tabela**
   - Quando ordenar por `created_at`, mostrar "Lançado em" no tooltip ou subtexto

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/reports/TransactionDrilldown.tsx` | Adicionar estado + toggle + lógica de ordenação |
| `src/i18n/locales/pt-BR.json` | Adicionar traduções para labels |

---

## Traduções a Adicionar

```json
{
  "transactions": {
    "sortByDate": "Data da transação",
    "sortByCreated": "Últimos lançamentos",
    "createdAt": "Lançado em"
  }
}
```

---

## Resultado Esperado

- **Default**: Ordenar por `created_at` (últimos lançamentos primeiro)
- Toggle visível para alternar entre os dois modos
- Usuário consegue ver rapidamente o que foi registrado recentemente, independente da data da transação

