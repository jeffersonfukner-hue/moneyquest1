import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuests } from '@/hooks/useQuests';

export type SeasonalTheme = 'default' | 'christmas' | 'halloween' | 'easter' | 'carnival';

interface SeasonalThemeContextType {
  activeTheme: SeasonalTheme;
  detectedTheme: SeasonalTheme;
  previewTheme: SeasonalTheme | null;
  isLoading: boolean;
  setPreviewTheme: (theme: SeasonalTheme | null) => void;
  availableThemes: SeasonalTheme[];
}

const SeasonalThemeContext = createContext<SeasonalThemeContextType | undefined>(undefined);

// Theme configuration with icons and descriptions
export const SEASONAL_THEME_CONFIG: Record<SeasonalTheme, {
  name: string;
  icon: string;
  description: string;
}> = {
  default: {
    name: 'Default',
    icon: '🎮',
    description: 'Standard MoneyQuest theme'
  },
  christmas: {
    name: 'Christmas',
    icon: '🎄',
    description: 'Festive red and green holiday theme'
  },
  halloween: {
    name: 'Halloween',
    icon: '🎃',
    description: 'Spooky orange and purple theme'
  },
  easter: {
    name: 'Easter',
    icon: '🥚',
    description: 'Pastel spring colors theme'
  },
  carnival: {
    name: 'Carnival',
    icon: '🎭',
    description: 'Vibrant party colors theme'
  }
};

const ALL_THEMES: SeasonalTheme[] = ['default', 'christmas', 'halloween', 'easter', 'carnival'];

export const SeasonalThemeProvider = ({ children }: { children: ReactNode }) => {
  const { quests, loading } = useQuests();
  const [detectedTheme, setDetectedTheme] = useState<SeasonalTheme>('default');
  const [previewTheme, setPreviewTheme] = useState<SeasonalTheme | null>(null);

  // The active theme is either the preview or the detected theme
  const activeTheme = previewTheme ?? detectedTheme;

  useEffect(() => {
    if (loading) return;

    // Find active special quests with seasons
    const activeSpecialQuests = quests.filter(
      q => q.type === 'SPECIAL' && q.is_active && !q.is_completed && q.season
    );

    // Determine theme based on active quest season
    // Priority: christmas > halloween > easter > carnival
    const today = new Date();
    const seasonPriority: SeasonalTheme[] = ['christmas', 'halloween', 'easter', 'carnival'];
    
    let newTheme: SeasonalTheme = 'default';
    
    for (const season of seasonPriority) {
      const hasActiveSeason = activeSpecialQuests.some(
        q => q.season?.toLowerCase() === season && 
             q.period_start_date && 
             q.period_end_date &&
             new Date(q.period_start_date) <= today &&
             new Date(q.period_end_date) >= today
      );
      
      if (hasActiveSeason) {
        newTheme = season;
        break;
      }
    }

    setDetectedTheme(newTheme);
  }, [quests, loading]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all seasonal theme classes
    root.classList.remove('season-christmas', 'season-halloween', 'season-easter', 'season-carnival');
    
    // Add active theme class if not default
    if (activeTheme !== 'default') {
      root.classList.add(`season-${activeTheme}`);
    }
  }, [activeTheme]);

  return (
    <SeasonalThemeContext.Provider value={{ 
      activeTheme, 
      detectedTheme,
      previewTheme,
      isLoading: loading,
      setPreviewTheme,
      availableThemes: ALL_THEMES
    }}>
      {children}
    </SeasonalThemeContext.Provider>
  );
};

export const useSeasonalTheme = () => {
  const context = useContext(SeasonalThemeContext);
  if (!context) {
    return { 
      activeTheme: 'default' as SeasonalTheme, 
      detectedTheme: 'default' as SeasonalTheme,
      previewTheme: null,
      isLoading: false,
      setPreviewTheme: () => {},
      availableThemes: ALL_THEMES
    };
  }
  return context;
};
