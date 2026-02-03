
# Plano: Sidebar Universal (Desktop/Tablet/Mobile) com Drawer Retratil

## Visao Geral

Transformar a arquitetura de navegacao do MoneyQuest para usar a Sidebar como elemento principal em todos os tamanhos de tela, eliminando a duplicacao de codigo entre BottomNavigation e Sidebar, e criando uma experiencia profissional e consistente.

---

## Arquitetura Atual vs. Proposta

```text
ATUAL:
+------------------+     +------------------+     +------------------+
|     Desktop      |     |     Tablet       |     |     Mobile       |
+------------------+     +------------------+     +------------------+
| Sidebar + Topbar |     | MobileHeader     |     | MobileHeader     |
|                  |     | BottomNav        |     | BottomNav        |
+------------------+     +------------------+     +------------------+

PROPOSTO:
+------------------+     +------------------+     +------------------+
|     Desktop      |     |     Tablet       |     |     Mobile       |
+------------------+     +------------------+     +------------------+
| Sidebar (fixed)  |     | Sidebar (collapsed)|   | Sidebar (drawer) |
| Topbar           |     | Topbar + menu btn|     | Topbar + hamburger|
| max-w-7xl        |     | max-w-3xl        |     | max-w-md         |
+------------------+     +------------------+     +------------------+
```

---

## Estrutura de Componentes

### 1. Novo Componente: `AppShell.tsx`

Wrapper unificado que substitui a logica fragmentada entre `AppLayout`, `DesktopLayout` e layouts inline.

```text
src/components/layout/
  AppShell.tsx          # NOVO - wrapper universal
  AppSidebar.tsx        # ATUALIZAR - adicionar variant props
  UnifiedTopbar.tsx     # NOVO - topbar que funciona em todos os breakpoints
  DesktopLayout.tsx     # REMOVER (absorvido pelo AppShell)
  AppLayout.tsx         # REMOVER (absorvido pelo AppShell)
```

### 2. Comportamento por Breakpoint

| Breakpoint | Sidebar Mode | Topbar | Content Width |
|------------|--------------|--------|---------------|
| Desktop (>=1024px) | fixed/collapsible | Busca + acoes | max-w-7xl |
| Tablet (768-1023px) | collapsed (icones) | Menu toggle + busca | max-w-3xl |
| Mobile (<768px) | drawer (offcanvas) | Hamburger + logo | max-w-md |

---

## Mudancas Detalhadas

### Arquivo 1: `src/components/layout/AppShell.tsx` (NOVO)

Componente central que unifica toda a logica de layout:

```typescript
interface AppShellProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function AppShell({ children, className, fullWidth }: AppShellProps) {
  const breakpoint = useBreakpoint();
  
  // Estado da sidebar
  const [isOpen, setIsOpen] = useState(false);      // Mobile drawer
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    'mq.sidebar.collapsed',
    breakpoint === 'tablet' // Tablet inicia colapsado
  );
  
  return (
    <SidebarProvider 
      defaultOpen={breakpoint === 'desktop'}
      open={breakpoint !== 'mobile' ? !isCollapsed : isOpen}
      onOpenChange={(open) => {
        if (breakpoint === 'mobile') {
          setIsOpen(open);
        } else {
          setIsCollapsed(!open);
        }
      }}
    >
      <div className="min-h-screen flex w-full">
        <AppSidebar variant={breakpoint === 'mobile' ? 'drawer' : 'fixed'} />
        
        <SidebarInset>
          <UnifiedTopbar breakpoint={breakpoint} />
          
          <main className={cn(
            "flex-1 px-4 py-3",
            fullWidth ? "" : getContentMaxWidth(breakpoint),
            "mx-auto",
            className
          )}>
            {children}
          </main>
        </SidebarInset>
      </div>
      
      <FloatingWhatsAppButton />
      <AdBanner />
    </SidebarProvider>
  );
}

function getContentMaxWidth(breakpoint: Breakpoint): string {
  switch (breakpoint) {
    case 'desktop': return 'max-w-7xl';
    case 'tablet': return 'max-w-3xl';
    default: return 'max-w-md';
  }
}
```

### Arquivo 2: `src/components/layout/AppSidebar.tsx` (ATUALIZAR)

Adicionar suporte para diferentes modos de renderizacao:

```typescript
interface AppSidebarProps {
  variant?: 'fixed' | 'collapsed' | 'drawer';
}

export function AppSidebar({ variant = 'fixed' }: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  
  // Fechar drawer ao clicar em item (mobile)
  const handleNavClick = (url: string) => {
    navigate(url);
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  // ... resto do componente com logica de navegacao
}
```

A sidebar do shadcn/ui ja suporta automaticamente:
- `Sheet` (drawer) quando `isMobile === true`
- Collapsible com icones quando `state === "collapsed"`
- Fixed quando `state === "expanded"`

### Arquivo 3: `src/components/layout/UnifiedTopbar.tsx` (NOVO)

Topbar que funciona em todos os breakpoints:

```typescript
interface UnifiedTopbarProps {
  breakpoint: Breakpoint;
  className?: string;
}

export function UnifiedTopbar({ breakpoint, className }: UnifiedTopbarProps) {
  const { toggleSidebar } = useSidebar();
  
  return (
    <header className={cn(
      "sticky top-0 z-40 flex h-14 items-center gap-4 border-b",
      "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      breakpoint === 'mobile' ? "px-4" : "px-6",
      className
    )}>
      {/* Menu trigger - sempre visivel */}
      <SidebarTrigger className="-ml-2" />
      
      {/* Logo no mobile */}
      {breakpoint === 'mobile' && (
        <Logo size="xs" variant="full" />
      )}
      
      {/* Busca - desktop e tablet */}
      {breakpoint !== 'mobile' && (
        <div className="flex-1 max-w-md">
          <GlobalSearchInput />
        </div>
      )}
      
      {/* Spacer no mobile */}
      {breakpoint === 'mobile' && <div className="flex-1" />}
      
      {/* Acoes */}
      <div className="flex items-center gap-2">
        {/* Botao Novo Lancamento (destaque) */}
        <NewTransactionButton breakpoint={breakpoint} />
        
        {breakpoint === 'mobile' ? (
          <>
            <NotificationBell />
            <ThemeToggle compact />
          </>
        ) : (
          <>
            <SoundToggle />
            <NotificationBell />
            <ThemeToggle />
            <SeasonalThemeIndicator />
          </>
        )}
      </div>
    </header>
  );
}
```

### Arquivo 4: Remover BottomNavigation

O `BottomNavigation` sera removido como navegacao principal. Opcionalmente, pode ser transformado em "Quick Actions" com apenas 3-4 botoes de acao rapida (nao navegacao).

**Opcao A: Remover completamente**
- Deletar `src/components/navigation/BottomNavigation.tsx`
- Remover referencias em `AppLayout.tsx`

**Opcao B: Transformar em FloatingActionBar** (recomendado)
Manter apenas acoes rapidas sem duplicar navegacao:

```typescript
export function FloatingActionBar() {
  const breakpoint = useBreakpoint();
  if (breakpoint !== 'mobile') return null;
  
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-2 bg-card/95 backdrop-blur rounded-full px-3 py-2 shadow-lg border">
        {/* Botao principal de adicionar */}
        <Button onClick={openAddTransaction} size="icon" className="rounded-full bg-primary">
          <Plus className="h-5 w-5" />
        </Button>
        
        {/* Busca rapida */}
        <Button variant="ghost" size="icon" className="rounded-full">
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
```

### Arquivo 5: `src/components/ui/sidebar.tsx` (ATUALIZAR)

Ajustar a logica de `isMobile` para usar o breakpoint correto:

```typescript
// Dentro do SidebarProvider
const breakpoint = useBreakpoint();
const isMobile = breakpoint === 'mobile'; // < 768px
const isTablet = breakpoint === 'tablet'; // 768-1023px

// Tablet: comportamento similar ao desktop, mas inicia colapsado
const defaultOpen = isTablet ? false : true;
```

### Arquivo 6: Atualizar `use-mobile.tsx`

Garantir que `useIsMobile` retorna `true` apenas para `<768px`:

```typescript
export function useIsMobile() {
  const breakpoint = useBreakpoint();
  return breakpoint === 'mobile';
}
```

---

## Migracao de Paginas

### Index.tsx (Dashboard)

```diff
- import { AppLayout } from '@/components/layout/AppLayout';
+ import { AppShell } from '@/components/layout/AppShell';

  return (
-   <AppLayout 
-     activeTab={activeTab}
-     onTabChange={setActiveTab}
-     onAddClick={() => setShowAddDialog(true)}
-   >
+   <AppShell>
      <SeasonalDecorations />
      <main className="relative z-10">
        {renderTabContent()}
      </main>
      {/* dialogs... */}
-   </AppLayout>
+   </AppShell>
  );
```

### Outras Paginas

Mesmo padrao - substituir `AppLayout` por `AppShell`:

```typescript
// Wallets.tsx, Settings.tsx, CashFlow.tsx, etc.
import { AppShell } from '@/components/layout/AppShell';

return (
  <AppShell>
    {/* conteudo da pagina */}
  </AppShell>
);
```

---

## Acessibilidade

### Mobile Drawer

1. **Foco**: Quando drawer abre, foco vai para primeiro item navegavel
2. **Escape**: Fecha drawer
3. **Click fora**: Fecha drawer
4. **Aria**: Labels adequados para leitores de tela

```typescript
// No Sheet (ja implementado pelo shadcn)
<SheetContent
  onOpenAutoFocus={(e) => {
    // Foco no primeiro item do menu
    const firstItem = e.currentTarget.querySelector('[data-sidebar="menu-button"]');
    if (firstItem) (firstItem as HTMLElement).focus();
  }}
>
```

### Keyboard Navigation

- `Tab`: Navega entre itens do menu
- `Enter/Space`: Ativa item
- `Escape`: Fecha drawer (mobile)
- `Ctrl+B`: Toggle sidebar (desktop/tablet)

---

## Estado Global da Sidebar

### LocalStorage Keys

```typescript
'mq.sidebar.collapsed'    // boolean - estado colapsado (desktop/tablet)
// Mobile drawer NAO persiste - sempre inicia fechado
```

### Context

O `SidebarContext` do shadcn ja fornece:
- `state`: 'expanded' | 'collapsed'
- `open`: boolean (desktop)
- `openMobile`: boolean (mobile drawer)
- `setOpen`, `setOpenMobile`: setters
- `toggleSidebar`: toggle inteligente baseado em breakpoint

---

## Arquivos a Criar/Modificar/Remover

| Arquivo | Acao |
|---------|------|
| `src/components/layout/AppShell.tsx` | CRIAR |
| `src/components/layout/UnifiedTopbar.tsx` | CRIAR |
| `src/components/navigation/FloatingActionBar.tsx` | CRIAR (opcional) |
| `src/components/layout/AppSidebar.tsx` | ATUALIZAR |
| `src/components/ui/sidebar.tsx` | ATUALIZAR |
| `src/hooks/use-mobile.tsx` | ATUALIZAR |
| `src/components/layout/AppLayout.tsx` | REMOVER |
| `src/components/layout/DesktopLayout.tsx` | REMOVER |
| `src/components/navigation/BottomNavigation.tsx` | REMOVER ou TRANSFORMAR |
| `src/components/navigation/MobileHeader.tsx` | REMOVER (absorvido) |
| `src/pages/Index.tsx` | ATUALIZAR import |
| `src/pages/Wallets.tsx` | ATUALIZAR import |
| `src/pages/Settings.tsx` | ATUALIZAR import |
| (todas outras paginas autenticadas) | ATUALIZAR import |

---

## Ordem de Implementacao

1. **Atualizar `use-mobile.tsx`** - garantir breakpoints corretos
2. **Atualizar `sidebar.tsx`** - ajustar logica de isMobile para usar breakpoint
3. **Criar `UnifiedTopbar.tsx`** - topbar responsiva
4. **Criar `AppShell.tsx`** - wrapper unificado
5. **Atualizar `AppSidebar.tsx`** - adicionar logica de fechar drawer no mobile
6. **Criar `FloatingActionBar.tsx`** (opcional) - acoes rapidas mobile
7. **Migrar `Index.tsx`** - testar dashboard
8. **Migrar demais paginas** - Wallets, Settings, etc.
9. **Remover arquivos obsoletos** - AppLayout, DesktopLayout, BottomNavigation, MobileHeader

---

## Testes Recomendados

1. **Desktop (>=1024px)**:
   - Sidebar expandida com collapse toggle funcionando
   - Topbar com busca, periodo, novo lancamento
   - Conteudo max-w-7xl centralizado
   
2. **Tablet (768-1023px)**:
   - Sidebar colapsada por padrao (apenas icones)
   - Toggle para expandir funcionando
   - Conteudo max-w-3xl
   
3. **Mobile (<768px)**:
   - Sidebar como drawer (offcanvas)
   - Hamburger na topbar abre drawer
   - Click em item fecha drawer e navega
   - Click fora fecha drawer
   - ESC fecha drawer
   - Foco no primeiro item ao abrir
   
4. **Transicoes**:
   - Redimensionar janela entre breakpoints
   - Estado da sidebar persiste (desktop/tablet)
   - Mobile sempre inicia com drawer fechado
   
5. **DataTable**:
   - Tabelas ocupam largura disponivel corretamente
   - Scroll horizontal quando necessario
