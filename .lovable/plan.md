

# Plano: Corrigir Chaves de Tradução da Tabela de Fluxo de Caixa

## Problema

As colunas da tabela estão mostrando as chaves brutas em vez do texto traduzido:
- `transactions.table.date` → deveria ser "Data"
- `transactions.table.description` → deveria ser "Descrição"
- etc.

## Causa Raiz

O componente `CashFlowTransactionTable.tsx` usa chaves de tradução que **não existem**:

| Chave Usada | Existe? | Chave Correta |
|-------------|---------|---------------|
| `transactions.table.date` | ❌ | `transactions.date` (existe) |
| `transactions.table.description` | ❌ | `transactions.description` (existe) |
| `transactions.table.category` | ❌ | `transactions.category` (existe) |
| `transactions.table.supplier` | ❌ | Não existe - precisa criar |
| `transactions.table.wallet` | ❌ | Não existe - precisa criar |
| `transactions.table.income` | ❌ | `transactions.income` (existe) |
| `transactions.table.expense` | ❌ | `transactions.expense` (existe) |
| `transactions.table.balance` | ❌ | Não existe - precisa criar |

## Solução Proposta

Adicionar a seção `table` dentro de `transactions` nos arquivos de tradução:

### Arquivo: `pt-BR.json`

```json
"transactions": {
  // ... chaves existentes ...
  "table": {
    "date": "Data",
    "description": "Descrição",
    "category": "Categoria",
    "supplier": "Fornecedor",
    "wallet": "Conta",
    "income": "Entrada",
    "expense": "Saída",
    "balance": "Saldo"
  }
}
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/i18n/locales/pt-BR.json` | Adicionar seção `transactions.table` |
| `src/i18n/locales/en-US.json` | Adicionar seção `transactions.table` |
| `src/i18n/locales/es-ES.json` | Adicionar seção `transactions.table` |
| `src/i18n/locales/pt-PT.json` | Adicionar seção `transactions.table` |

---

## Traduções por Idioma

### Português (BR)
```json
"table": {
  "date": "Data",
  "description": "Descrição",
  "category": "Categoria",
  "supplier": "Fornecedor",
  "wallet": "Conta",
  "income": "Entrada",
  "expense": "Saída",
  "balance": "Saldo"
}
```

### English (US)
```json
"table": {
  "date": "Date",
  "description": "Description",
  "category": "Category",
  "supplier": "Supplier",
  "wallet": "Account",
  "income": "Income",
  "expense": "Expense",
  "balance": "Balance"
}
```

### Español (ES)
```json
"table": {
  "date": "Fecha",
  "description": "Descripción",
  "category": "Categoría",
  "supplier": "Proveedor",
  "wallet": "Cuenta",
  "income": "Ingreso",
  "expense": "Gasto",
  "balance": "Saldo"
}
```

### Português (PT)
```json
"table": {
  "date": "Data",
  "description": "Descrição",
  "category": "Categoria",
  "supplier": "Fornecedor",
  "wallet": "Conta",
  "income": "Entrada",
  "expense": "Saída",
  "balance": "Saldo"
}
```

---

## Resultado Esperado

Após a correção, a tabela mostrará os cabeçalhos traduzidos:

```text
┌──────────┬─────────────┬────────────┬────────────┬──────────┬──────────┬──────────┬───────────┐
│ Data     │ Descrição   │ Categoria  │ Fornecedor │ Conta    │ Entrada  │ Saída    │ Saldo     │
├──────────┼─────────────┼────────────┼────────────┼──────────┼──────────┼──────────┼───────────┤
│ 01/02/26 │ SALÁRIO     │ 💼 Salário │ Empresa    │ Nubank   │ R$ 5.000 │    -     │ R$ 5.000  │
└──────────┴─────────────┴────────────┴────────────┴──────────┴──────────┴──────────┴───────────┘
```

