import { useTranslation } from 'react-i18next';
import { LANGUAGE_PREFERENCE_KEY, mapBrowserLanguage, type SupportedLanguage } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Globe, Database, Monitor, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const DebugI18n = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  // Collect all debug info
  const browserLanguage = navigator.language || (navigator as any).userLanguage || 'unknown';
  const browserLanguages = navigator.languages?.join(', ') || browserLanguage;
  const mappedLanguage = mapBrowserLanguage(browserLanguage);
  const storedLanguage = localStorage.getItem('i18nextLng') || 'not set';
  const hasExplicitPreference = localStorage.getItem(LANGUAGE_PREFERENCE_KEY) === 'true';
  const currentI18nLanguage = i18n.language as SupportedLanguage;

  const handleClearStorage = () => {
    localStorage.removeItem('i18nextLng');
    localStorage.removeItem(LANGUAGE_PREFERENCE_KEY);
    toast({
      title: 'Storage limpo',
      description: 'Recarregue a página para testar a detecção novamente.',
    });
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleForceLanguage = (lang: SupportedLanguage) => {
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, 'true');
    i18n.changeLanguage(lang);
    toast({
      title: 'Idioma alterado',
      description: `Idioma definido para ${lang}`,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Debug i18n</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            Voltar
          </Button>
        </div>

        {/* Browser Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Navegador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">navigator.language</span>
              <Badge variant="outline" className="font-mono">{browserLanguage}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">navigator.languages</span>
              <Badge variant="outline" className="font-mono text-xs">{browserLanguages}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Mapeado para</span>
              <Badge className="font-mono">{mappedLanguage}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* localStorage Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              localStorage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">i18nextLng</span>
              <Badge variant="outline" className="font-mono">{storedLanguage}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Preferência explícita</span>
              {hasExplicitPreference ? (
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Sim
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="w-3 h-3 mr-1" />
                  Não
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* i18n State */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Estado do i18n
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Idioma atual</span>
              <Badge className="font-mono">{currentI18nLanguage}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Idiomas suportados</span>
              <span className="text-sm font-mono">pt-BR, en-US, es-ES</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações de Teste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handleForceLanguage('pt-BR')}>
                🇧🇷 Forçar PT-BR
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleForceLanguage('en-US')}>
                🇺🇸 Forçar EN-US
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleForceLanguage('es-ES')}>
                🇪🇸 Forçar ES-ES
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={handleClearStorage}>
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Storage
              </Button>
              <Button variant="secondary" size="sm" onClick={handleReload}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expected Behavior */}
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">Comportamento Esperado</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>1ª visita:</strong> Detecta idioma do navegador e aplica automaticamente.</p>
            <p><strong>Visitas seguintes (sem login):</strong> Mantém o idioma detectado na 1ª visita.</p>
            <p><strong>Após escolha manual:</strong> Marca preferência explícita e respeita sempre.</p>
            <p><strong>Após login:</strong> Usa o idioma salvo no perfil do usuário.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugI18n;
