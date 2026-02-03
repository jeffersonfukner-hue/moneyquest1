
# Desktop-Friendly UI Transformation for MoneyQuest

## Overview

This plan transforms MoneyQuest from a mobile-only app into a professional desktop-friendly financial application while maintaining full mobile responsiveness. The changes will create a serious financial product feel while keeping gamification elements subtle.

---

## Architecture Changes

### Current State
- Mobile-first layout with max-width constraints (`max-w-md`)
- Bottom navigation for mobile
- MobileHeader with settings/profile access
- Card-based mobile UI
- No sidebar or desktop-optimized navigation

### Target State
- Responsive layout that adapts to desktop (sidebar) and mobile (bottom nav)
- Professional data tables with full functionality
- Clickable KPIs with drill-down capability
- Desktop topbar with global search and period selector
- Gamification elements reduced to subtle badges

---

## File Changes Summary

| Category | Action | Files |
|----------|--------|-------|
| **Layout** | Create | `src/components/layout/DesktopLayout.tsx`, `src/components/layout/AppSidebar.tsx`, `src/components/layout/DesktopTopbar.tsx` |
| **Layout** | Modify | `src/components/layout/AppLayout.tsx` |
| **Tables** | Create | `src/components/ui/data-table.tsx`, `src/components/ui/column-toggle.tsx`, `src/hooks/useDataTable.ts` |
| **Navigation** | Modify | `src/pages/Index.tsx`, `src/pages/Wallets.tsx`, `src/pages/CashFlow.tsx`, `src/pages/Settings.tsx` |
| **KPIs** | Modify | `src/components/game/StatsCards.tsx` |
| **Styling** | Modify | `src/index.css`, `tailwind.config.ts` |
| **i18n** | Modify | `src/i18n/locales/pt-BR.json` |
| **Mobile Detection** | Modify | `src/hooks/use-mobile.tsx` |

---

## Detailed Implementation

### 1. Desktop Layout Structure

**New: `src/components/layout/DesktopLayout.tsx`**

A wrapper component that conditionally renders:
- Desktop: Sidebar + Topbar + Main content
- Mobile: Existing MobileHeader + Bottom navigation

```text
┌──────────────────────────────────────────────────────────────┐
│ DESKTOP (width >= 1024px)                                    │
├──────────┬───────────────────────────────────────────────────┤
│          │  Topbar (Search, Period Selector, Add Button)     │
│ Sidebar  ├───────────────────────────────────────────────────┤
│ (fixed)  │  Main Content Area                                │
│          │  ┌─────────────────────────────────────────────┐  │
│ - Home   │  │  KPI Cards (clickable)                      │  │
│ - Trans  │  ├─────────────────────────────────────────────┤  │
│ - Banks  │  │  Data Table / Charts                        │  │
│ - Cards  │  └─────────────────────────────────────────────┘  │
│ - Loans  │                                                   │
│ - Future │                                                   │
│ - Report │                                                   │
│ - Config │                                                   │
├──────────┴───────────────────────────────────────────────────┤
│ MOBILE (width < 768px)                                       │
├──────────────────────────────────────────────────────────────┤
│  MobileHeader                                                │
├──────────────────────────────────────────────────────────────┤
│  Content (cards, existing mobile layout)                     │
├──────────────────────────────────────────────────────────────┤
│  BottomNavigation                                            │
└──────────────────────────────────────────────────────────────┘
```

**New: `src/components/layout/AppSidebar.tsx`**

Using the existing shadcn/ui `Sidebar` component with:

- Sections:
  - **Principal**: Dashboard, Transações
  - **Contas**: Bancos, Cartões, Empréstimos
  - **Planejamento**: Futuros (Agendados), Metas por Categoria
  - **Relatórios**: Fluxo de Caixa, Comparativo de Períodos
  - **Sistema**: Configurações, Suporte

- Features:
  - Collapsible with keyboard shortcut (Ctrl+B)
  - Active route highlighting
  - Mini-collapse mode (shows icons only when collapsed)
  - Logo at top, user avatar at bottom

**New: `src/components/layout/DesktopTopbar.tsx`**

- Global search input with "/" shortcut
- Period selector dropdown (Mês Atual, Últimos 30 dias, Personalizado)
- "Novo Lançamento" button (opens AddTransactionDialog)
- XP/Level indicator (subtle badge, not prominent)

---

### 2. Professional Data Table Component

**New: `src/components/ui/data-table.tsx`**

A reusable table component with:

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  // Features
  density?: 'compact' | 'normal';
  searchable?: boolean;
  searchPlaceholder?: string;
  sortable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  columnToggle?: boolean;
  // Keyboard navigation
  onRowSelect?: (row: T) => void;
  onRowAction?: (row: T) => void;
}
```

**Features:**

1. **Density Control**
   - Compact: 32px row height, smaller text
   - Normal: 48px row height, standard text

2. **Column Configuration**
   - Show/hide columns via popover menu
   - Persisted to localStorage per table

3. **Sorting**
   - Click header to sort
   - Multi-column sort with Shift+click

4. **Quick Filters**
   - Type filter (Income/Expense)
   - Category filter (multi-select)
   - Date range filter

5. **Text Search**
   - Debounced search across all visible columns

6. **Pagination**
   - Page size options: 10, 25, 50, 100
   - First/Prev/Next/Last navigation

7. **Keyboard Shortcuts**
   - Arrow Up/Down: Navigate rows
   - Enter: Open details/edit dialog
   - Escape: Close dialog/deselect
   - Delete: Delete selected (with confirmation)

**New: `src/hooks/useDataTable.ts`**

Custom hook managing table state:
- Sort state
- Filter state
- Pagination state
- Column visibility
- Selected rows
- Keyboard navigation

---

### 3. Drill-Down KPIs

**Modify: `src/components/game/StatsCards.tsx`**

Add onClick handlers to each stat:

```typescript
interface StatsCardsProps {
  profile: Profile;
  onDrillDown?: (metric: 'income' | 'expense' | 'balance' | 'initial') => void;
}
```

Clicking a KPI:
- On desktop: Opens a side panel or modal with filtered data table
- On mobile: Navigates to transactions tab with filter applied

**New: `src/components/reports/DrillDownPanel.tsx`**

A slide-over panel for desktop that shows:
- Title indicating the metric
- Filtered data table
- Summary statistics
- Close button

---

### 4. Visual Consistency Updates

**Typography Changes:**

Modify `tailwind.config.ts`:
- Headers: Keep Fredoka but reduce playfulness
- Body: Use Inter (already set)
- Numbers: Use tabular-nums for financial data alignment

**Gamification Reduction:**

Update `src/index.css`:
- Reduce glow effects intensity
- Smaller badge sizes
- Muted colors for XP/streak indicators
- Move gamification to subtle chips in corner

**Color adjustments:**
- Keep brand colors but reduce saturation for data-heavy views
- Increase contrast for better readability

---

### 5. Page Updates

**`src/pages/Index.tsx` (Dashboard)**

Desktop view changes:
- Two-column grid for KPIs
- Full-width data table below charts
- Gamification panel as sidebar widget

Mobile view:
- Keeps existing card-based layout
- No changes to mobile experience

**`src/pages/Wallets.tsx`**

Desktop view:
- Three-column grid for wallet cards
- Tab content uses data tables instead of card lists
- Transfer history as sortable table

**`src/pages/CashFlow.tsx`**

Desktop view:
- Chart takes 60% width, table takes 40%
- Full data table with all features enabled

---

### 6. Mobile Breakpoint Logic

**Modify: `src/hooks/use-mobile.tsx`**

Add additional breakpoints:
```typescript
export function useBreakpoint() {
  // Returns: 'mobile' | 'tablet' | 'desktop'
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  
  useEffect(() => {
    const checkBreakpoint = () => {
      if (window.innerWidth >= 1024) setBreakpoint('desktop');
      else if (window.innerWidth >= 768) setBreakpoint('tablet');
      else setBreakpoint('mobile');
    };
    // ...
  }, []);
  
  return breakpoint;
}
```

---

### 7. Global Search Implementation

**New: `src/components/layout/GlobalSearch.tsx`**

- Command palette style (Cmd+K or "/" to open)
- Search across:
  - Transactions (description, supplier)
  - Wallets (name)
  - Categories (name)
  - Pages (navigation)
- Recent searches stored in localStorage

---

### 8. Period Selector

**New: `src/components/layout/PeriodSelector.tsx`**

Global period filter that affects all data:
- Options:
  - Mês Atual
  - Últimos 30 dias
  - Últimos 90 dias
  - Este Ano
  - Personalizado (date range picker)
- State stored in React Context for app-wide access

**New: `src/contexts/PeriodFilterContext.tsx`**

Context providing:
- `startDate`, `endDate`
- `periodLabel`
- `setPeriod(preset | custom)`

---

## Implementation Order

1. **Phase 1: Layout Foundation**
   - Create DesktopLayout wrapper
   - Create AppSidebar component
   - Create DesktopTopbar component
   - Modify AppLayout to use responsive detection

2. **Phase 2: Data Table**
   - Create data-table.tsx component
   - Create useDataTable hook
   - Add column-toggle.tsx

3. **Phase 3: Page Integration**
   - Update Index.tsx for desktop
   - Update Wallets.tsx with data tables
   - Update CashFlow.tsx layout

4. **Phase 4: Drill-Down & Search**
   - Add drill-down to StatsCards
   - Create DrillDownPanel
   - Implement GlobalSearch
   - Add PeriodSelector

5. **Phase 5: Polish**
   - Typography refinements
   - Gamification subtlety
   - Keyboard navigation testing
   - Responsive testing

---

## Technical Details

### Sidebar Navigation Items

```typescript
const navSections = [
  {
    title: 'Principal',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/dashboard?tab=transactions', icon: ArrowLeftRight, label: 'Transações' },
    ]
  },
  {
    title: 'Contas',
    items: [
      { path: '/wallets', icon: Building2, label: 'Bancos' },
      { path: '/wallets?tab=cards', icon: CreditCard, label: 'Cartões' },
      { path: '/wallets?tab=loans', icon: Landmark, label: 'Empréstimos' },
    ]
  },
  {
    title: 'Planejamento',
    items: [
      { path: '/scheduled', icon: CalendarClock, label: 'Futuros' },
      { path: '/category-goals', icon: Target, label: 'Metas' },
    ]
  },
  {
    title: 'Relatórios',
    items: [
      { path: '/cash-flow', icon: TrendingUp, label: 'Fluxo de Caixa' },
      { path: '/period-comparison', icon: BarChart3, label: 'Comparativo' },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { path: '/settings', icon: Settings, label: 'Configurações' },
      { path: '/support', icon: HelpCircle, label: 'Suporte' },
    ]
  }
];
```

### Data Table Column Definition Example

```typescript
const transactionColumns: ColumnDef<Transaction>[] = [
  {
    id: 'date',
    header: 'Data',
    accessorKey: 'date',
    sortable: true,
    cell: ({ row }) => format(parseDateString(row.date), 'dd/MM/yy'),
  },
  {
    id: 'description',
    header: 'Descrição',
    accessorKey: 'description',
    searchable: true,
  },
  {
    id: 'category',
    header: 'Categoria',
    accessorKey: 'category',
    filterable: true,
    filterOptions: categories.map(c => ({ value: c.name, label: c.name })),
  },
  {
    id: 'amount',
    header: 'Valor',
    accessorKey: 'amount',
    sortable: true,
    align: 'right',
    cell: ({ row }) => (
      <span className={row.type === 'INCOME' ? 'text-income' : 'text-expense'}>
        {formatCurrency(row.amount)}
      </span>
    ),
  },
];
```

---

## New i18n Keys

```json
{
  "desktop": {
    "sidebar": {
      "principal": "Principal",
      "accounts": "Contas",
      "planning": "Planejamento",
      "reports": "Relatórios",
      "system": "Sistema",
      "collapse": "Recolher menu",
      "expand": "Expandir menu"
    },
    "topbar": {
      "search": "Buscar...",
      "searchShortcut": "Pressione / para buscar",
      "newTransaction": "Novo Lançamento",
      "period": {
        "currentMonth": "Mês Atual",
        "last30Days": "Últimos 30 dias",
        "last90Days": "Últimos 90 dias",
        "thisYear": "Este Ano",
        "custom": "Personalizado"
      }
    },
    "table": {
      "density": "Densidade",
      "compact": "Compacto",
      "normal": "Normal",
      "columns": "Colunas",
      "showColumns": "Mostrar colunas",
      "search": "Buscar na tabela...",
      "noResults": "Nenhum resultado encontrado",
      "rowsPerPage": "Linhas por página",
      "of": "de",
      "selected": "selecionado(s)"
    },
    "drillDown": {
      "title": "Detalhamento",
      "income": "Receitas do Período",
      "expense": "Despesas do Período",
      "balance": "Movimentações",
      "close": "Fechar"
    }
  }
}
```

---

## CSS Changes Summary

```css
/* New utility classes for desktop */
@layer utilities {
  /* Tabular numbers for financial data */
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
  
  /* Reduced gamification glow */
  .glow-subtle {
    box-shadow: 0 0 8px rgba(244, 180, 0, 0.2);
  }
  
  /* Desktop content max-width */
  .desktop-content {
    @apply max-w-7xl mx-auto;
  }
}
```

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Bottom nav, full-width cards |
| Tablet | 768px - 1023px | Bottom nav, 2-column grid |
| Desktop | >= 1024px | Sidebar, topbar, tables |

---

## Dependencies

No new dependencies required. Uses existing:
- shadcn/ui components (Sidebar, Table, Dialog, Popover)
- Lucide React icons
- TanStack Query for data management
- React Router for navigation
