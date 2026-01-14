import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, Wrench } from 'lucide-react';
import { Loader2 } from 'lucide-react';

/**
 * AI Coach Page - DISABLED (AI-free version)
 * Redirects users to home or shows "coming soon" message
 */
const AICoach = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background p-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/')}
        className="mb-4 self-start"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('common.back')}
      </Button>

      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold mb-2">{t('aiCoach.pageTitle')}</h1>
            <p className="text-muted-foreground mb-6">
              {t('common.comingSoon', 'Esta funcionalidade estará disponível em breve!')}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wrench className="w-4 h-4" />
              <span>{t('common.underDevelopment', 'Em desenvolvimento')}</span>
            </div>
            <Button 
              className="mt-6" 
              onClick={() => navigate('/')}
            >
              {t('common.backToHome', 'Voltar ao início')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AICoach;
