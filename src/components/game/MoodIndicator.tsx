import { useFinancialMood } from '@/contexts/FinancialMoodContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const MoodIndicator = () => {
  const { mood, moodConfig, isLoading } = useFinancialMood();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full animate-pulse">
        <div className="w-5 h-5 bg-muted rounded-full" />
        <div className="w-16 h-4 bg-muted rounded" />
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border/50 rounded-full cursor-default transition-all duration-300 hover:bg-card hover:border-border shadow-sm">
          <span className="text-lg" role="img" aria-label={moodConfig.label}>
            {moodConfig.emoji}
          </span>
          <span className="text-sm font-medium text-foreground/90">
            {moodConfig.label}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px] text-center">
        <p className="text-sm">{moodConfig.message}</p>
      </TooltipContent>
    </Tooltip>
  );
};
