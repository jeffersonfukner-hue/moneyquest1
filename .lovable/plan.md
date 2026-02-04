

# Plano: Layout de Fluxo de Caixa para Desktop

## Situação Atual

A lista de transações (`TransactionsList`) usa um layout de **cards agrupados por mês**, otimizado para mobile. No desktop, esse layout não aproveita bem o espaço horizontal disponível.

Já existe o componente `TransactionTable.tsx` com layout estilo **fluxo de caixa contábil**:

| Data | Descrição | Categoria | Carteira | Entrada | Saída | Saldo |
|------|-----------|-----------|----------|---------|-------|-------|
| 15/01| Mercado   | 🛒 Alim.  | 🏦 BB    | -       |R$ 150 |R$ 850 |

---

## Solução Proposta

Criar uma visualização **híbrida** que:
- **Mobile/Tablet**: Mantém o layout atual de cards agrupados por mês
- **Desktop**: Mostra tabela estilo fluxo de caixa com todas as colunas

### Interface Desktop

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Transações                                      [📊 Cards] [📋 Fluxo de Caixa] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Contas] [Cartões] [Empréstimos] [Transferências]                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Data     │ Descrição      │ Categoria      │ Carteira │ Entrada│ Saída│Saldo│
│ 20/01/25 │ Salário        │ 💼 Trabalho    │ 🏦 BB    │ 3.000  │  -   │3.000│
│ 18/01/25 │ Mercado ABC    │ 🛒 Alimentação │ 💳 Nubank│  -     │ 150  │2.850│
│ 15/01/25 │ Energia        │ 🏠 Casa        │ 🏦 BB    │  -     │ 250  │2.600│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementação Técnica

### 1. Criar componente `CashFlowTransactionTable.tsx`

Um novo componente baseado no existente `TransactionTable.tsx`, mas com:
- Suporte a edição (clique na linha abre dialog)
- Exclusão de transações
- Filtro por tipo de fonte (Contas/Cartões/Empréstimos)
- Ordenação por data de lançamento ou data da transação

### 2. Modificar `TransactionsList.tsx`

Adicionar:
- Estado para modo de visualização: `'cards' | 'table'`
- Toggle para alternar entre visualizações
- Renderização condicional baseada no modo

### 3. Detectar Desktop

Usar o hook `useBreakpoint()` já existente para mostrar o toggle apenas em telas maiores.

---

## Arquivos a Modificar/Criar

| Arquivo | Ação |
|---------|------|
| `src/components/game/CashFlowTransactionTable.tsx` | **Criar** - Tabela estilo fluxo de caixa com edição |
| `src/components/game/TransactionsList.tsx` | **Modificar** - Adicionar toggle de visualização |
| `src/i18n/locales/pt-BR.json` | Adicionar traduções para labels |

---

## Detalhes da Tabela Fluxo de Caixa

### Colunas

| Coluna | Descrição | Ordenável |
|--------|-----------|-----------|
| Data | Data da transação ou lançamento | ✅ |
| Descrição | Texto da transação | ❌ |
| Categoria | Ícone + nome | ✅ |
| Fornecedor | Nome do fornecedor (se houver) | ❌ |
| Carteira/Cartão | Ícone + nome | ❌ |
| Entrada | Valor se INCOME | ✅ |
| Saída | Valor se EXPENSE | - |
| Saldo | Saldo acumulado | - |

### Funcionalidades

- **Clique na linha** → Abre dialog de edição (reusa `EditTransactionDialog`)
- **Ordenação** → Por data (transação ou lançamento), valor, categoria
- **Paginação** → 20 itens por página
- **Saldo acumulado** → Calculado em tempo real
- **Cores** → Entradas verdes, saídas vermelhas, saldo dinâmico

---

## Código do Toggle

```tsx
// No header do TransactionsList
const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
const isDesktop = useBreakpoint() === 'desktop';

{isDesktop && (
  <div className="flex gap-1 border rounded-lg p-1">
    <Button
      variant={viewMode === 'cards' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => setViewMode('cards')}
    >
      <Grid className="w-4 h-4" />
    </Button>
    <Button
      variant={viewMode === 'table' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => setViewMode('table')}
    >
      <Table className="w-4 h-4" />
    </Button>
  </div>
)}
```

---

## Traduções

```json
{
  "transactions": {
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
  }
}
```

---

## Resultado Esperado

1. No **mobile**: Comportamento atual mantido (cards por mês)
2. No **desktop**: Toggle para alternar entre cards e tabela fluxo de caixa
3. A tabela permite **edição ao clicar** na transação
4. **Saldo acumulado** mostra a progressão financeira
5. Mantém todos os filtros existentes (Contas/Cartões/Empréstimos/Transferências)

