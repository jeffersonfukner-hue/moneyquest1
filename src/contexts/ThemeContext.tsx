import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { useProfile } from '@/hooks/useProfile';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => Promise<void>;
  isLoading: boolean;
  activeShopTheme: string | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Map theme IDs to CSS class names
const SHOP_THEME_CLASS_MAP: Record<string, string> = {
  'black_card': 'theme-black-card',
  'crypto_neon': 'theme-crypto-neon',
  'galactic_wealth': 'theme-galactic-wealth',
  'executive_diamond': 'theme-executive-diamond',
  'executive_dark': 'theme-executive-dark',
  'gold_luxury': 'theme-gold-luxury',
  'obsidian_wealth': 'theme-obsidian-wealth',
  'dark_samurai': 'theme-dark-samurai',
  'midnight_wealth': 'theme-midnight-wealth',
  'royal_crown': 'theme-royal-crown',
  'legacy_gold': 'theme-legacy-gold',
  'minimal_white_pro': 'theme-minimal-white',
  'ocean_blue_wealth': 'theme-ocean-blue-wealth',
  'emerald_balance': 'theme-emerald-balance',
  'forest_wealth': 'theme-forest-wealth',
  'sunset_balance': 'theme-sunset-balance',
};

const ThemeProviderInner = ({ children }: { children: ReactNode }) => {
  const { theme: currentTheme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

  // Sync theme from profile on mount
  useEffect(() => {
    if (profile?.theme_preference && profile.theme_preference !== currentTheme) {
      setNextTheme(profile.theme_preference);
    }
  }, [profile?.theme_preference]);

  // Apply shop theme from profile
  useEffect(() => {
    const activeShopTheme = (profile as any)?.active_shop_theme as string | null;
    
    // Remove all shop theme classes first
    Object.values(SHOP_THEME_CLASS_MAP).forEach(cls => {
      document.documentElement.classList.remove(cls);
    });

    // Apply active shop theme if set
    if (activeShopTheme && SHOP_THEME_CLASS_MAP[activeShopTheme]) {
      document.documentElement.classList.add(SHOP_THEME_CLASS_MAP[activeShopTheme]);
    }
  }, [(profile as any)?.active_shop_theme]);

  const setTheme = async (newTheme: ThemePreference) => {
    setIsLoading(true);
    setNextTheme(newTheme);
    
    if (profile) {
      await updateProfile({ theme_preference: newTheme });
    }
    
    setIsLoading(false);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: (currentTheme as ThemePreference) || 'system',
        resolvedTheme: (resolvedTheme as 'light' | 'dark') || 'light',
        setTheme,
        isLoading: isLoading || profileLoading,
        activeShopTheme: (profile as any)?.active_shop_theme || null,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeProviderInner>{children}</ThemeProviderInner>
    </NextThemesProvider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return safe defaults when used outside provider (e.g., public pages)
    return {
      theme: 'system' as ThemePreference,
      resolvedTheme: 'light' as 'light' | 'dark',
      setTheme: async () => {},
      isLoading: false,
      activeShopTheme: null,
    };
  }
  return context;
};
