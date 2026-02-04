
# Plano: Corrigir "Ver todas as transações"

## Problema Identificado

O botão **"Ver todas"** no widget `RecentTransactionsWidget` navega para `/reports`, que mostra **gráficos e análises** em vez de uma **lista de transações**.

### Localização do Problema

```text
src/components/dashboard/RecentTransactionsWidget.tsx (linha 59)
├── onClick={() => navigate('/reports')}  ← Navega para relatórios
└── Deveria mostrar lista de transações
```

---

## Solução Proposta

Adicionar um **painel lateral (Sheet)** que mostra todas as transações, reutilizando o componente `TransactionDrilldown` já existente no sistema.

### Mudanças no RecentTransactionsWidget

1. Adicionar estado para controlar abertura do drilldown
2. Importar e usar o componente `TransactionDrilldown`
3. Alterar o botão "Ver todas" para abrir o painel em vez de navegar
4. Manter a navegação ao clicar em uma transação individual (para /reports)

### Fluxo Atualizado

```text
Dashboard
└── Widget "Últimas Transações"
    ├── [Ver todas] → Abre painel lateral com TODAS as transações
    └── [Clique na transação] → Navega para relatórios (comportamento atual)
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/dashboard/RecentTransactionsWidget.tsx` | Adicionar estado + componente TransactionDrilldown |

---

## Implementação Técnica

```tsx
// Novo estado
const [drilldownOpen, setDrilldownOpen] = useState(false);

// Botão atualizado
<Button onClick={() => setDrilldownOpen(true)}>
  Ver todas
</Button>

// Componente adicionado
<TransactionDrilldown
  isOpen={drilldownOpen}
  onClose={() => setDrilldownOpen(false)}
  transactions={transactions}
  title="Todas as Transações"
/>
```

---

## Resultado Esperado

Ao clicar em **"Ver todas"**, o usuário verá um painel lateral com:
- Resumo (entradas, saídas, total de transações)
- Lista ordenada por data das transações
- Todas as transações, não apenas as recentes

O comportamento é consistente com o drill-down já usado em outros lugares do sistema (gráficos de categorias, fornecedores, etc).
