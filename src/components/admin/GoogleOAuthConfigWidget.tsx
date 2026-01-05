import { useState } from 'react';
import { ExternalLink, Copy, Check, AlertCircle, Settings2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LABELS = {
  title: 'Configuração do Google OAuth',
  requiresConfig: 'Requer configuração',
  description: 'Siga os passos abaixo para ativar o login com Google com segurança.',
  securityNote:
    'Atenção: mantenha o “Client Secret” em sigilo. Não compartilhe em chats, prints ou repositórios.',
  step1Title: 'Google Cloud Console',
  jsOrigins: 'Origens JavaScript autorizadas (Authorized JavaScript origins)',
  redirectUrl: 'URL de redirecionamento (Authorized redirect URIs)',
  openGoogleConsole: 'Abrir Google Cloud Console',
  step2Title: 'Configurações de autenticação do projeto',
  siteUrl: 'URL do site (Site URL)',
  lovableRedirects: 'URLs de redirecionamento permitidas (Redirect URLs)',
  step2Instructions:
    'Copie os valores acima exatamente como estão e cole nas configurações de autenticação do projeto.',
  step3Title: 'Credenciais',
  step3Instructions:
    'Depois, informe as credenciais do app do Google nas configurações do provedor.',
  clientId: 'Client ID (ID do cliente)',
  clientSecret: 'Client Secret (Segredo do cliente)',
};

const GoogleOAuthConfigWidget = () => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const jsOrigins = ['https://moneyquest.app.br', 'https://www.moneyquest.app.br', 'https://moneyquest1.lovable.app'];

  const googleRedirectUrl = 'https://dybbailvbaaovkstgpoh.supabase.co/auth/v1/callback';

  const lovableRedirectUrls = [
    'https://moneyquest.app.br',
    'https://www.moneyquest.app.br',
    'https://moneyquest1.lovable.app',
    'https://preview--moneyquest1.lovable.app',
  ];

  const handleCopy = async (text: string, fieldId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, fieldId }: { text: string; fieldId: string }) => (
    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleCopy(text, fieldId)}>
      {copiedField === fieldId ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  );

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">{LABELS.title}</CardTitle>
          </div>
          <Badge variant="outline" className="border-amber-500/50 text-amber-600">
            {LABELS.requiresConfig}
          </Badge>
        </div>
        <CardDescription>{LABELS.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{LABELS.securityNote}</p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              1
            </span>
            {LABELS.step1Title}
          </h4>

          <div className="pl-8 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{LABELS.jsOrigins}</p>
              <div className="space-y-1.5">
                {jsOrigins.map((url, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5 text-sm font-mono"
                  >
                    <span className="truncate">{url}</span>
                    <CopyButton text={url} fieldId={`js-${i}`} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">{LABELS.redirectUrl}</p>
              <div className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5 text-sm font-mono">
                <span className="truncate">{googleRedirectUrl}</span>
                <CopyButton text={googleRedirectUrl} fieldId="google-redirect" />
              </div>
            </div>

            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {LABELS.openGoogleConsole}
              </a>
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              2
            </span>
            {LABELS.step2Title}
          </h4>

          <div className="pl-8 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{LABELS.siteUrl}</p>
              <div className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5 text-sm font-mono">
                <span className="truncate">https://moneyquest.app.br</span>
                <CopyButton text="https://moneyquest.app.br" fieldId="site-url" />
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">{LABELS.lovableRedirects}</p>
              <div className="space-y-1.5">
                {lovableRedirectUrls.map((url, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5 text-sm font-mono"
                  >
                    <span className="truncate">{url}</span>
                    <CopyButton text={url} fieldId={`lovable-${i}`} />
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{LABELS.step2Instructions}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              3
            </span>
            {LABELS.step3Title}
          </h4>

          <div className="pl-8 space-y-3">
            <p className="text-sm text-muted-foreground">{LABELS.step3Instructions}</p>
            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
              <li>{LABELS.clientId}</li>
              <li>{LABELS.clientSecret}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleOAuthConfigWidget;
