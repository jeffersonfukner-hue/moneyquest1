import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Copy, Check, AlertCircle, Settings2 } from 'lucide-react';
import { useState } from 'react';

const GoogleOAuthConfigWidget = () => {
  const { t } = useTranslation();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const jsOrigins = [
    'https://moneyquest.app.br',
    'https://www.moneyquest.app.br',
    'https://moneyquest1.lovable.app',
  ];

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
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0"
      onClick={() => handleCopy(text, fieldId)}
    >
      {copiedField === fieldId ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">{t('admin.oauth.title')}</CardTitle>
          </div>
          <Badge variant="outline" className="border-amber-500/50 text-amber-600">
            {t('admin.oauth.requiresConfig')}
          </Badge>
        </div>
        <CardDescription>{t('admin.oauth.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert */}
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{t('admin.oauth.securityNote')}</p>
        </div>

        {/* Step 1: Google Cloud Console */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            {t('admin.oauth.step1Title')}
          </h4>
          
          <div className="pl-8 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t('admin.oauth.jsOrigins')}</p>
              <div className="space-y-1.5">
                {jsOrigins.map((url, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5 text-sm font-mono">
                    <span className="truncate">{url}</span>
                    <CopyButton text={url} fieldId={`js-${i}`} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">{t('admin.oauth.redirectUrl')}</p>
              <div className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5 text-sm font-mono">
                <span className="truncate">{googleRedirectUrl}</span>
                <CopyButton text={googleRedirectUrl} fieldId="google-redirect" />
              </div>
            </div>

            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {t('admin.oauth.openGoogleConsole')}
              </a>
            </Button>
          </div>
        </div>

        {/* Step 2: Lovable Cloud Auth Settings */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            {t('admin.oauth.step2Title')}
          </h4>
          
          <div className="pl-8 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t('admin.oauth.siteUrl')}</p>
              <div className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5 text-sm font-mono">
                <span className="truncate">https://moneyquest.app.br</span>
                <CopyButton text="https://moneyquest.app.br" fieldId="site-url" />
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">{t('admin.oauth.lovableRedirects')}</p>
              <div className="space-y-1.5">
                {lovableRedirectUrls.map((url, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5 text-sm font-mono">
                    <span className="truncate">{url}</span>
                    <CopyButton text={url} fieldId={`lovable-${i}`} />
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {t('admin.oauth.step2Instructions')}
            </p>
          </div>
        </div>

        {/* Step 3: Enter credentials */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
            {t('admin.oauth.step3Title')}
          </h4>
          
          <div className="pl-8 space-y-3">
            <p className="text-sm text-muted-foreground">{t('admin.oauth.step3Instructions')}</p>
            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
              <li>{t('admin.oauth.clientId')}</li>
              <li>{t('admin.oauth.clientSecret')}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleOAuthConfigWidget;
