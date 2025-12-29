import { Progress } from '@/components/ui/progress';
import { getXPProgress, XP_PER_LEVEL } from '@/lib/gameLogic';
import { Profile } from '@/types/database';

interface LevelProgressProps {
  profile: Profile;
}

export const LevelProgress = ({ profile }: LevelProgressProps) => {
  const progress = getXPProgress(profile.xp);
  const xpToNextLevel = XP_PER_LEVEL - (profile.xp % XP_PER_LEVEL);

  return (
    <div className="bg-card rounded-2xl p-6 shadow-md animate-slide-up">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-level rounded-full flex items-center justify-center text-3xl shadow-glow-primary animate-float">
            {profile.avatar_icon}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-xp text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-glow-accent">
            Lv.{profile.level}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {profile.level_title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {profile.xp.toLocaleString()} XP total
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress to Level {profile.level + 1}</span>
          <span className="font-semibold text-xp">{xpToNextLevel} XP to go</span>
        </div>
        <div className="relative">
          <Progress value={progress} className="h-3 bg-muted" />
          <div 
            className="absolute top-0 left-0 h-3 bg-gradient-xp rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
