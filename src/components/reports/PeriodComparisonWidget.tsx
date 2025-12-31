import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftRight, ChevronRight } from 'lucide-react';

export const PeriodComparisonWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card 
      className="bg-card/50 backdrop-blur-sm border-border/50 cursor-pointer hover:bg-card/70 transition-colors"
      onClick={() => navigate('/period-comparison')}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-foreground">
                {t('periodComparison.widgetTitle', 'Comparar Períodos')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('periodComparison.widgetDescription', 'Este mês vs ano passado')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};
