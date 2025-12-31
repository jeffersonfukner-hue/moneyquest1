import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Lock, TrendingUp, Filter, Table2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const PremiumCashFlowTeaser = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: Filter,
      label: t('premiumCashFlow.teaser.features.advancedFilters'),
    },
    {
      icon: TrendingUp,
      label: t('premiumCashFlow.teaser.features.periodComparison'),
    },
    {
      icon: Table2,
      label: t('premiumCashFlow.teaser.features.detailedTable'),
    },
    {
      icon: Sparkles,
      label: t('premiumCashFlow.teaser.features.narratives'),
    },
  ];

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-6">
        {/* Lock icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-center mb-2">
          {t('premiumCashFlow.teaser.title')}
        </h3>
        <p className="text-muted-foreground text-center text-sm mb-6">
          {t('premiumCashFlow.teaser.description')}
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/50"
            >
              <feature.icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={() => navigate('/upgrade')}
          className="w-full min-h-[44px]"
          size="lg"
        >
          <Lock className="w-4 h-4 mr-2" />
          {t('premiumCashFlow.teaser.unlock')}
        </Button>
      </CardContent>

      {/* Decorative elements */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
    </Card>
  );
};
