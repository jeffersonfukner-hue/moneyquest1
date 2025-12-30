import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Gamepad2, 
  Target, 
  Trophy, 
  Sparkles, 
  TrendingUp, 
  ChevronRight,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
interface OnboardingStep {
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
  color: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: <Gamepad2 className="w-12 h-12" />,
    titleKey: 'onboarding.steps.welcome.title',
    descriptionKey: 'onboarding.steps.welcome.description',
    color: 'from-primary to-primary/70',
  },
  {
    icon: <TrendingUp className="w-12 h-12" />,
    titleKey: 'onboarding.steps.track.title',
    descriptionKey: 'onboarding.steps.track.description',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: <Target className="w-12 h-12" />,
    titleKey: 'onboarding.steps.goals.title',
    descriptionKey: 'onboarding.steps.goals.description',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: <Trophy className="w-12 h-12" />,
    titleKey: 'onboarding.steps.rewards.title',
    descriptionKey: 'onboarding.steps.rewards.description',
    color: 'from-amber-500 to-amber-600',
  },
];

const Onboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateProfile } = useProfile();
  const [currentStep, setCurrentStep] = useState(0);

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const step = ONBOARDING_STEPS[currentStep];

  const completeOnboarding = async () => {
    await updateProfile({ onboarding_completed: true });
    navigate('/');
  };

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with progress */}
      <header className="p-4 safe-area-top">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  index === currentStep
                    ? 'w-6 bg-primary'
                    : index < currentStep
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            {t('common.skip')}
          </Button>
        </div>
        <Progress value={progress} className="h-1" />
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div
          key={currentStep}
          className="animate-scale-in max-w-sm mx-auto"
        >
          {/* Icon */}
          <div
            className={cn(
              'w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-8',
              'bg-gradient-to-br text-white shadow-lg',
              step.color
            )}
          >
            {step.icon}
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            {t(step.titleKey)}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t(step.descriptionKey)}
          </p>

          {/* Features list on last step */}
          {isLastStep && (
            <div className="mt-8 space-y-3 text-left">
              {['xp', 'badges', 'quests'].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">
                    {t(`onboarding.features.${feature}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer with action button */}
      <footer className="p-6 safe-area-bottom">
        <Button
          onClick={handleNext}
          className={cn(
            'w-full min-h-[56px] text-lg font-semibold',
            isLastStep
              ? 'bg-gradient-to-r from-primary to-primary/80 hover:opacity-90'
              : ''
          )}
          size="lg"
        >
          {isLastStep ? (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              {t('onboarding.startAdventure')}
            </>
          ) : (
            <>
              {t('common.continue')}
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </footer>
    </div>
  );
};

export default Onboarding;
