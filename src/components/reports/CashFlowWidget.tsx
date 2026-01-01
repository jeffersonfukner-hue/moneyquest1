import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, ArrowRight } from 'lucide-react';

export const CashFlowWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card 
      className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
      onClick={() => navigate('/cash-flow')}
    >
      <CardContent className="py-3 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t('cashFlow.title')}</h3>
              <p className="text-xs text-muted-foreground">{t('cashFlow.projectionNote')}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};
