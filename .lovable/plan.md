

# Correção: Mesclar Blocos Duplicados de `transactions`

## Problema Confirmado

O arquivo `pt-BR.json` contém **duas chaves `"transactions"` duplicadas**:

| Bloco | Linhas | Conteúdo |
|-------|--------|----------|
| 1º | 2-67 | `viewMode`, `table`, `selectCard`, etc. |
| 2º | 1416-1479 | `title`, `batchActions`, `categories`, etc. |

**Em JSON, a última chave sobrescreve a anterior** → as traduções `viewMode` e `table` são perdidas no runtime.

## Solução

Mover as chaves `viewMode` e `table` do **primeiro bloco** para o **segundo bloco** (que contém `title`, `batchActions`, etc.), e depois **remover o primeiro bloco duplicado**.

## Implementação

### 1. Adicionar ao segundo bloco (linha ~1478, antes do `}` final)

```json
    "viewMode": {
      "cards": "Cards",
      "table": "Fluxo de Caixa",
      "switchToCards": "Ver como cards",
      "switchToTable": "Ver como fluxo de caixa"
    },
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

### 2. Remover o primeiro bloco duplicado (linhas 2-67)

O primeiro bloco `"transactions": { ... }` será removido inteiramente, mantendo apenas o segundo bloco consolidado.

### 3. Mesclar chaves únicas

Algumas chaves do primeiro bloco não existem no segundo e precisam ser movidas:
- `selectCard`, `noCards`, `addFirstCard`, `changeCard`
- `supplierPlaceholder`, `incomeSource`, `incomeSourcePlaceholder`
- `transferDetected`, `transferSuggestion`, `goToTransfers`
- `paymentMethod`, `debit`, `credit`
- `dateFormat`, `today`, `source`, `cash`, `cashDesc`, `cashTransaction`
- `drilldown.*`
- `confirmSave`, `confirmSaveDesc`, `confirmDelete`, `confirmDeleteDesc`
- `hasLinks`, `linkedCard`, `linkedInvoice`, `linkedWallet`
- `deleteAnyway`, `deleteWarning`, `delete`

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/i18n/locales/pt-BR.json` | Consolidar blocos duplicados |

## Resultado Esperado

Após a correção, os cabeçalhos da tabela mostrarão:

```
Data │ Descrição │ Categoria │ Fornecedor │ Conta │ Entrada │ Saída │ Saldo
```

Em vez de:

```
transactions.table.date │ transactions.table.description │ ...
```

