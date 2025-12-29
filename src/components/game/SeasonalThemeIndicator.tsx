import { useState } from 'react';
import { useSeasonalTheme, SEASONAL_THEME_CONFIG, SeasonalTheme } from '@/contexts/SeasonalThemeContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, Eye, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SeasonalThemeIndicator = () => {
  const { activeTheme, detectedTheme, previewTheme, setPreviewTheme, availableThemes } = useSeasonalTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentConfig = SEASONAL_THEME_CONFIG[activeTheme];
  const isPreview = previewTheme !== null;

  const handleThemeSelect = (theme: SeasonalTheme) => {
    if (theme === detectedTheme) {
      setPreviewTheme(null); // Clear preview, use detected
    } else {
      setPreviewTheme(theme);
    }
  };

  const handleResetToDetected = () => {
    setPreviewTheme(null);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "gap-2 px-3 transition-all",
            isPreview && "ring-2 ring-primary/50 bg-primary/10"
          )}
        >
          <span className="text-lg">{currentConfig.icon}</span>
          <span className="hidden sm:inline text-sm font-medium">{currentConfig.name}</span>
          {isPreview && <Eye className="w-3 h-3 text-primary" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold">Seasonal Themes</h4>
          </div>

          <div className="space-y-1">
            {availableThemes.map((theme) => {
              const config = SEASONAL_THEME_CONFIG[theme];
              const isActive = activeTheme === theme;
              const isDetected = detectedTheme === theme;
              
              return (
                <button
                  key={theme}
                  onClick={() => handleThemeSelect(theme)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left",
                    isActive 
                      ? "bg-primary/10 border border-primary/30" 
                      : "hover:bg-muted/50 border border-transparent"
                  )}
                >
                  <span className="text-2xl">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{config.name}</span>
                      {isDetected && !isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{config.description}</p>
                  </div>
                  {isActive && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {isPreview && (
            <div className="pt-2 border-t border-border">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={handleResetToDetected}
              >
                <Eye className="w-3 h-3 mr-1" />
                Exit Preview Mode
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-1">
                Previewing {SEASONAL_THEME_CONFIG[previewTheme].name} theme
              </p>
            </div>
          )}

          {!isPreview && detectedTheme !== 'default' && (
            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border">
              🎉 {SEASONAL_THEME_CONFIG[detectedTheme].name} theme is active based on your quests!
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
