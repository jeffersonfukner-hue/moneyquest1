import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLevelAccess } from '@/hooks/useLevelAccess';
import { Bot, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AICoachCard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canAccess, getFeatureStatus } = useLevelAccess();
  
  const hasAccess = canAccess('ai_coach');
  const { requiredLevel } = getFeatureStatus('ai_coach');

  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all hover:shadow-lg",
        "bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5",
        "border-primary/20"
      )}
      onClick={() => navigate('/ai-coach')}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            hasAccess 
              ? "bg-gradient-to-br from-primary to-primary/80" 
              : "bg-muted"
          )}>
            <Bot className={cn(
              "h-6 w-6",
              hasAccess ? "text-primary-foreground" : "text-muted-foreground"
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{t('aiCoach.title')}</h3>
              {!hasAccess && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-400/20 rounded-full">
                  <Lock className="h-3 w-3 text-amber-500" />
                  <span className="text-[10px] font-medium text-amber-600">
                    {t('levelLock.needLevel', { level: requiredLevel })}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {t('aiCoach.pageDescription')}
            </p>
          </div>

          <Button 
            size="sm" 
            variant={hasAccess ? "default" : "outline"}
            className="shrink-0"
          >
            {hasAccess ? (
              <Sparkles className="h-4 w-4" />
            ) : (
              t('subscription.upgrade')
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
