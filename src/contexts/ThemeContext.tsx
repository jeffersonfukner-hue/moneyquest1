import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { useProfile } from '@/hooks/useProfile';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

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
    };
  }
  return context;
};
