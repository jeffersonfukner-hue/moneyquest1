import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  ScrollText,
  ChevronLeft,
  Shield,
  Menu,
  MessageSquare,
  Gift,
  Fingerprint,
  Megaphone,
  MessageSquareText,
  Activity,
  Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Labels fixos em pt-BR para o SuperAdmin (independente do idioma do usuário)
const navItems = [
  { path: '/super-admin', icon: LayoutDashboard, label: 'Painel Geral' },
  { path: '/super-admin/users', icon: Users, label: 'Usuários' },
  { path: '/super-admin/traffic', icon: Activity, label: 'Tráfego' },
  { path: '/super-admin/campaigns', icon: Megaphone, label: 'Campanhas' },
  { path: '/super-admin/support', icon: MessageSquare, label: 'Suporte' },
  { path: '/super-admin/comments', icon: MessageSquareText, label: 'Comentários' },
  { path: '/super-admin/referrals', icon: Gift, label: 'Indicações' },
  { path: '/super-admin/trial-abuse', icon: Fingerprint, label: 'Abuso de Trial' },
  { path: '/super-admin/engagement', icon: AlertTriangle, label: 'Engajamento' },
  { path: '/super-admin/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/super-admin/scoring-audit', icon: Calculator, label: 'Auditoria XP' },
  { path: '/super-admin/logs', icon: ScrollText, label: 'Logs' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-lg">Super Admin</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2"
          onClick={() => navigate('/')}
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao App
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col bg-card border-r border-border">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display font-bold">Super Admin</span>
          </div>
          
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
