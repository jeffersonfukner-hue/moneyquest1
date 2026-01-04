import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SUPPORTED_LANGUAGES, type SupportedLanguage, LANGUAGE_PREFERENCE_KEY } from '@/i18n';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

const LanguageSelection: React.FC = () => {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(null);

  // Se já tem idioma definido, redirecionar
  useEffect(() => {
    const hasPreference = localStorage.getItem(LANGUAGE_PREFERENCE_KEY) === 'true';
    const savedLang = localStorage.getItem('i18nextLng');
    
    if (hasPreference && savedLang) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    // Atualizar i18n para mostrar textos no idioma selecionado
    i18n.changeLanguage(lang);
  };

  const handleContinue = () => {
    if (!selectedLanguage) return;
    
    // Salvar preferência
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, 'true');
    localStorage.setItem('i18nextLng', selectedLanguage);
    
    // Redirecionar para login
    navigate('/login', { replace: true });
  };

  const languages = [
    { code: 'pt-BR' as SupportedLanguage, flag: '🇧🇷', name: 'Português (Brasil)' },
    { code: 'pt-PT' as SupportedLanguage, flag: '🇵🇹', name: 'Português (Portugal)' },
    { code: 'en-US' as SupportedLanguage, flag: '🇺🇸', name: 'English (US)' },
    { code: 'es-ES' as SupportedLanguage, flag: '🇪🇸', name: 'Español' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <Logo size="lg" priority />
        <h1 className="text-2xl font-bold text-foreground mt-4">MoneyQuest</h1>
      </div>

      {/* Card de seleção */}
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {/* Ícone e título */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground text-center">
              {t('languageSelection.title', 'Choose your language')}
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-1">
              {t('languageSelection.subtitle', 'Select your language to continue')}
            </p>
          </div>

          {/* Lista de idiomas */}
          <div className="space-y-3 mb-6">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  selectedLanguage === lang.code
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                )}
              >
                <span className="text-3xl">{lang.flag}</span>
                <span className="flex-1 text-left font-medium text-foreground">
                  {lang.name}
                </span>
                {selectedLanguage === lang.code && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Botão Continuar */}
          <Button
            onClick={handleContinue}
            disabled={!selectedLanguage}
            className="w-full"
            size="lg"
          >
            {t('common.continue', 'Continue')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSelection;
