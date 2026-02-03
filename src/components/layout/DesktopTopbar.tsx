import { useNavigate } from 'react-router-dom';
import { Bell, Search, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SoundToggle } from '@/components/game/SoundToggle';
import { SeasonalThemeIndicator } from '@/components/game/SeasonalThemeIndicator';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface DesktopTopbarProps {
  className?: string;
}

export function DesktopTopbar({ className }: DesktopTopbarProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  // Listen for global search hotkey
  useEffect(() => {
    const handleOpenSearch = () => {
      setSearchOpen(true);
    };

    document.addEventListener('open-global-search', handleOpenSearch);
    return () => document.removeEventListener('open-global-search', handleOpenSearch);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6",
      className
    )}>
      {/* Sidebar Toggle */}
      <SidebarTrigger className="-ml-2" />

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar... (pressione / ou ⌘K)"
            className="pl-9 h-9 bg-muted/50"
            onFocus={() => setSearchOpen(true)}
            readOnly
            onClick={() => setSearchOpen(true)}
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Sound Toggle */}
        <SoundToggle />

        {/* Notifications */}
        <NotificationBell />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Seasonal Theme */}
        <SeasonalThemeIndicator />
      </div>

      {/* Global Search Modal - TODO: implement full search */}
      {searchOpen && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div 
            className="fixed left-1/2 top-1/4 -translate-x-1/2 w-full max-w-lg bg-card border rounded-lg shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações, categorias, carteiras..."
                className="pl-9"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Pressione ESC para fechar
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
