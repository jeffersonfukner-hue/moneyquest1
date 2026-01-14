import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Debug i18n - SIMPLIFICADO
 * Idioma fixo em pt-BR, página mantida apenas para referência
 */
const DebugI18n = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Debug i18n</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            Voltar
          </Button>
        </div>

        {/* Status Fixo */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              Idioma Fixo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Idioma da aplicação</span>
              <Badge className="font-mono bg-green-500/20 text-green-700 dark:text-green-400">
                🇧🇷 pt-BR
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              O aplicativo está configurado para funcionar exclusivamente em Português (Brasil).
              Não há detecção automática de idioma ou seletor de idiomas ativo.
            </p>
          </CardContent>
        </Card>

        {/* Estado i18n */}
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
              <Badge className="font-mono">pt-BR</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Idiomas suportados</span>
              <span className="text-sm font-mono">pt-BR (fixo)</span>
            </div>
          </CardContent>
        </Card>

        {/* Informação */}
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">Sobre a Configuração</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Idioma:</strong> Português (Brasil) - pt-BR</p>
            <p><strong>Detecção automática:</strong> Desativada</p>
            <p><strong>Seletor de idiomas:</strong> Removido da interface</p>
            <p><strong>Moedas:</strong> BRL, USD, EUR - funcionam normalmente</p>
            <p className="text-green-600 dark:text-green-400 font-medium pt-2">
              ✅ Todos os textos, labels e mensagens estão em português.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugI18n;
