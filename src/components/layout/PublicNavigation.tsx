import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';

const PublicNavigation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const isLoggedIn = !!user;

  const navItems = [
    { href: '/', label: t('nav.home', 'Início') },
    { href: '/about', label: t('nav.about', 'Sobre') },
    { href: '/features', label: t('nav.features', 'Funcionalidades') },
    { href: '/blog', label: 'Blog' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="xs" variant="full" priority />
          </Link>
          {/* Mobile: Back to App or Login Button next to logo */}
          {isLoggedIn ? (
            <Link to="/" className="md:hidden">
              <Button variant="outline" size="sm">
                {t('blog.backToApp', 'Voltar ao App')}
              </Button>
            </Link>
          ) : (
            <Link to="/login?mode=login" className="md:hidden">
              <Button variant="outline" size="sm">
                {t('auth.login', 'Entrar')}
              </Button>
            </Link>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "text-sm transition-colors",
                isActive(item.href)
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            {isLoggedIn ? (
              <Link to="/">
                <Button variant="gold" size="sm">
                  {t('blog.backToApp', 'Voltar ao App')}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login?mode=login">
                  <Button variant="ghost" size="sm">
                    {t('auth.login', 'Entrar')}
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="gold" size="sm">
                    {t('landing.cta.startFree', 'Começar Grátis')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <button
            className="p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden border-t border-border/50 bg-background px-4 py-4 space-y-3 animate-fade-in">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "block py-2 text-sm transition-colors",
                isActive(item.href)
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
            {isLoggedIn ? (
              <Link to="/" onClick={() => setIsMenuOpen(false)}>
                <Button variant="gold" size="sm" className="w-full">
                  {t('blog.backToApp', 'Voltar ao App')}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login?mode=login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    {t('auth.login', 'Entrar')}
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="gold" size="sm" className="w-full">
                    {t('landing.cta.startFree', 'Começar Grátis')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default PublicNavigation;
