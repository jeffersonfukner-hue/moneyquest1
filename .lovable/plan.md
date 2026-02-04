
# Plano: Adicionar "Transações" na Sidebar

## Situação Atual

- O acesso às transações é feito pelo Dashboard (`/dashboard`) através de um estado interno `activeTab`
- A URL pode receber `?tab=transactions` mas isso não está documentado na sidebar
- A navegação atual exige que o usuário abra o Dashboard e depois encontre o widget de transações

## Solução Proposta

Adicionar um item **"Transações"** diretamente na sidebar, na seção "Principal", logo após o Dashboard.

### Opções de Implementação

**Opção A - Rota Dedicada (Recomendada)**
- Criar rota `/transactions` que renderiza a página de transações diretamente
- Mais limpo e seguindo o padrão de rotas do app

**Opção B - Navegação com Query Param**
- Navegar para `/dashboard?tab=transactions`
- Menos trabalho mas menos elegante

---

## Implementação Escolhida: Opção A

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/routes/routes.ts` | Adicionar `TRANSACTIONS: '/transactions'` |
| `src/App.tsx` | Adicionar rota `/transactions` |
| `src/components/layout/AppSidebar.tsx` | Adicionar item "Transações" com ícone |
| `src/i18n/locales/pt-BR.json` | Adicionar tradução `sidebar.transactions` |

---

## Detalhes Técnicos

### 1. routes.ts
```typescript
export const APP_ROUTES = {
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions', // NOVO
  // ...resto
}
```

### 2. App.tsx
```tsx
<Route path="/transactions" element={
  <AuthenticatedWrapper>
    <Suspense fallback={<PageLoader />}>
      <LazyTransactions />
    </Suspense>
  </AuthenticatedWrapper>
} />
```

### 3. AppSidebar.tsx
```tsx
import { Receipt } from 'lucide-react';

const mainNavItems = [
  { title: 'dashboard', url: APP_ROUTES.DASHBOARD, icon: Home },
  { title: 'transactions', url: APP_ROUTES.TRANSACTIONS, icon: Receipt }, // NOVO
];
```

### 4. Nova Página `Transactions.tsx`
Criar uma página dedicada que renderiza o `TransactionsList` diretamente, sem o contexto do Dashboard.

---

## Interface da Sidebar

```text
┌─────────────────────────────────────┐
│ 🎮 MoneyQuest                       │
├─────────────────────────────────────┤
│ PRINCIPAL                           │
│   🏠 Dashboard                      │
│   🧾 Transações        ← NOVO       │
│   💼 Carteiras ▼                    │
│      └── Contas                     │
│      └── Cartões                    │
│      └── ...                        │
├─────────────────────────────────────┤
│ FUNCIONALIDADES                     │
│   📅 Agendados                      │
│   👥 Fornecedores                   │
│   🎯 Metas                          │
│   📊 Relatórios                     │
└─────────────────────────────────────┘
```

---

## Resultado Esperado

1. **Sidebar** mostra "Transações" como segundo item após Dashboard
2. **Clique** navega para `/transactions`
3. **Página** exibe a lista completa de transações com todos os filtros
4. **Ícone**: `Receipt` (🧾) do lucide-react
5. **Mobile**: Fecha o drawer ao clicar, como os outros itens
