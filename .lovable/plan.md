
# Plano: Correcao de Links Quebrados apos Sidebar Universal

## Visao Geral

Apos a introducao da Sidebar Universal, foram identificadas **5 rotas quebradas** no menu de navegacao que apontam para paginas inexistentes. Este plano cria um arquivo centralizado de rotas e corrige a Sidebar para usar somente rotas validas.

---

## Analise de Links Quebrados

### Rotas da Sidebar vs Rotas Reais

| Item da Sidebar | URL Atual | Rota Real | Status |
|-----------------|-----------|-----------|--------|
| Dashboard | `/` | `/dashboard` | PROBLEMA - navega para Home publica |
| Wallets | `/wallets` | `/wallets` | OK |
| Credit Cards | `/credit-cards` | N/A (tab em `/wallets`) | QUEBRADO |
| Goals | `/goals` | `/category-goals` | QUEBRADO |
| Reports | `/cashflow` | `/cash-flow` | QUEBRADO (typo) |
| Scheduled | `/scheduled` | `/scheduled` | OK |
| Loans | `/loans` | N/A (tab em `/wallets`) | QUEBRADO |
| Suppliers | `/suppliers` | `/suppliers` | OK |
| Leaderboard | `/leaderboard` | `/leaderboard` | OK |
| Journal | `/journal` | `/journal` | OK |
| Shop | `/shop` | `/shop` | OK |
| AI Coach | `/ai-coach` | Redireciona para `/dashboard` | DESATIVADO |
| Settings | `/settings` | `/settings` | OK |
| Support | `/support` | `/support` | OK |
| Profile | `/profile` | `/profile` | OK |

### Problemas Identificados

1. **`/` vs `/dashboard`**: A Sidebar aponta para `/` que e a Home publica. Usuarios autenticados devem ir para `/dashboard`.
2. **`/credit-cards`**: Nao existe rota. Cartoes estao como tab em `/wallets`.
3. **`/goals`**: Nao existe. A pagina correta e `/category-goals`.
4. **`/cashflow`**: Typo. A rota correta e `/cash-flow` com hifen.
5. **`/loans`**: Nao existe rota. Emprestimos estao como tab em `/wallets`.
6. **`/ai-coach`**: Redireciona para dashboard (desativado).

---

## Solucao Proposta

### 1. Criar Arquivo Central de Rotas

**Arquivo**: `src/routes/routes.ts`

```typescript
// Rotas publicas (nao autenticadas)
export const PUBLIC_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FEATURES: '/features',
  ABOUT: '/about',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  BLOG: '/blog',
} as const;

// Rotas autenticadas (app principal)
export const APP_ROUTES = {
  DASHBOARD: '/dashboard',
  WALLETS: '/wallets',
  CATEGORY_GOALS: '/category-goals',
  CATEGORIES: '/categories',
  CASH_FLOW: '/cash-flow',
  PERIOD_COMPARISON: '/period-comparison',
  SCHEDULED: '/scheduled',
  SUPPLIERS: '/suppliers',
  LEADERBOARD: '/leaderboard',
  JOURNAL: '/journal',
  SHOP: '/shop',
  SETTINGS: '/settings',
  SUPPORT: '/support',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  REFERRAL: '/referral',
  PREMIUM: '/premium',
  PREMIUM_SUCCESS: '/premium-success',
  ONBOARDING: '/onboarding',
} as const;

// Rotas de admin
export const ADMIN_ROUTES = {
  DASHBOARD: '/super-admin',
  USERS: '/super-admin/users',
  TRAFFIC: '/super-admin/traffic',
  CAMPAIGNS: '/super-admin/campaigns',
  SUPPORT: '/super-admin/support',
  COMMENTS: '/super-admin/comments',
  REFERRALS: '/super-admin/referrals',
  TRIAL_ABUSE: '/super-admin/trial-abuse',
  ENGAGEMENT: '/super-admin/engagement',
  LOGS: '/super-admin/logs',
  SCORING_AUDIT: '/super-admin/scoring-audit',
} as const;

// Helpers
export type AppRoute = typeof APP_ROUTES[keyof typeof APP_ROUTES];
export type PublicRoute = typeof PUBLIC_ROUTES[keyof typeof PUBLIC_ROUTES];
```

---

### 2. Atualizar AppSidebar

**Arquivo**: `src/components/layout/AppSidebar.tsx`

Corrigir URLs quebradas e remover itens de funcionalidades nao implementadas:

```typescript
import { APP_ROUTES } from '@/routes/routes';

// Navegacao principal - apenas rotas existentes
const mainNavItems = [
  { title: 'dashboard', url: APP_ROUTES.DASHBOARD, icon: Home },
  { title: 'wallets', url: APP_ROUTES.WALLETS, icon: Wallet },
  { title: 'goals', url: APP_ROUTES.CATEGORY_GOALS, icon: Target },
  { title: 'reports', url: APP_ROUTES.CASH_FLOW, icon: BarChart3 },
];

// Funcionalidades
const featuresNavItems = [
  { title: 'scheduled', url: APP_ROUTES.SCHEDULED, icon: Calendar },
  { title: 'suppliers', url: APP_ROUTES.SUPPLIERS, icon: Users },
  // REMOVIDO: loans (nao tem rota propria, esta em /wallets)
];

// Gamificacao
const gamificationNavItems = [
  { title: 'leaderboard', url: APP_ROUTES.LEADERBOARD, icon: Trophy },
  { title: 'journal', url: APP_ROUTES.JOURNAL, icon: BookOpen },
  { title: 'shop', url: APP_ROUTES.SHOP, icon: ShoppingBag },
  // REMOVIDO: aiCoach (desativado)
];
```

### Decisoes de Design

**Itens Removidos:**
- **Credit Cards**: Acesso via aba em `/wallets` (sem duplicar navegacao)
- **Loans**: Acesso via aba em `/wallets` (sem duplicar navegacao)
- **AI Coach**: Funcionalidade desativada (redireciona para dashboard)

**Alternativa**: Se preferir manter visibilidade dessas funcionalidades, podemos adicionar como items desabilitados com badge "Em breve" ou navegar diretamente para a aba correta em `/wallets`.

---

### 3. Corrigir isActive para Dashboard

O metodo `isActive` atual tem um problema:

```typescript
// PROBLEMA: '/' e ativo em qualquer pagina que comeca com '/'
const isActive = (path: string) => {
  if (path === '/') return location.pathname === '/';
  return location.pathname.startsWith(path);
};
```

Correcao:

```typescript
const isActive = (path: string) => {
  // Dashboard e ativo apenas em /dashboard
  if (path === APP_ROUTES.DASHBOARD) {
    return location.pathname === APP_ROUTES.DASHBOARD;
  }
  return location.pathname === path || location.pathname.startsWith(`${path}/`);
};
```

---

### 4. Atualizar routeConfig.ts

**Arquivo**: `src/lib/routeConfig.ts`

Sincronizar com o novo arquivo de rotas:

```typescript
import { APP_ROUTES, PUBLIC_ROUTES } from '@/routes/routes';

// Atualizar AUTHENTICATED_ROUTES para usar constantes
export const AUTHENTICATED_ROUTES = Object.values(APP_ROUTES);
```

---

### 5. Corrigir Navegacao Hardcoded

Buscar e substituir strings literais de rota espalhadas pelo codigo:

| Arquivo | De | Para |
|---------|-----|------|
| `Index.tsx` | `navigate('/auth')` | `navigate(PUBLIC_ROUTES.LOGIN)` |
| `CategoryGoals.tsx` | `navigate('/')` | `navigate(APP_ROUTES.DASHBOARD)` |
| `Settings.tsx` | `navigate('/')` | `navigate(APP_ROUTES.DASHBOARD)` |
| `PremiumSuccess.tsx` | `navigate('/')` | `navigate(APP_ROUTES.DASHBOARD)` |
| `Onboarding.tsx` | `navigate('/')` | `navigate(APP_ROUTES.DASHBOARD)` |

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/routes/routes.ts` | CRIAR |
| `src/components/layout/AppSidebar.tsx` | ATUALIZAR |
| `src/lib/routeConfig.ts` | ATUALIZAR |
| `src/pages/Index.tsx` | ATUALIZAR navegacao |
| `src/pages/CategoryGoals.tsx` | ATUALIZAR navegacao |
| `src/pages/Settings.tsx` | ATUALIZAR navegacao |
| `src/pages/PremiumSuccess.tsx` | ATUALIZAR navegacao |
| `src/pages/Onboarding.tsx` | ATUALIZAR navegacao |
| `src/components/layout/UnifiedTopbar.tsx` | ATUALIZAR navegacao |
| `src/components/admin/AdminLayout.tsx` | ATUALIZAR navegacao |

---

## Ordem de Implementacao

1. **Criar `src/routes/routes.ts`** - arquivo central de constantes
2. **Atualizar `AppSidebar.tsx`** - corrigir URLs quebradas
3. **Atualizar `routeConfig.ts`** - sincronizar com novo arquivo
4. **Migrar navegacoes hardcoded** - substituir strings literais

---

## Testes Recomendados

1. Clicar em cada item do menu da Sidebar
2. Verificar que nenhum redireciona para 404
3. Testar em desktop, tablet e mobile
4. Verificar highlight correto do item ativo
5. Testar navegacao via URL direta
