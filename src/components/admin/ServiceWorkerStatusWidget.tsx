import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Server, Clock, Code2 } from 'lucide-react';
import { toast } from 'sonner';

interface SWStatus {
  registered: boolean;
  state: 'installing' | 'installed' | 'activating' | 'activated' | 'redundant' | 'parsed' | 'unknown';
  updateAvailable: boolean;
  scriptURL: string | null;
}

export const ServiceWorkerStatusWidget = () => {
  const { t } = useTranslation();
  const [swStatus, setSwStatus] = useState<SWStatus>({
    registered: false,
    state: 'unknown',
    updateAvailable: false,
    scriptURL: null,
  });
  const [buildInfo, setBuildInfo] = useState({
    version: import.meta.env.VITE_BUILD_VERSION || 'dev',
    timestamp: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
    mode: import.meta.env.MODE,
  });
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [checking, setChecking] = useState(false);

  const checkSWStatus = async () => {
    setChecking(true);
    try {
      if (!('serviceWorker' in navigator)) {
        setSwStatus({
          registered: false,
          state: 'unknown',
          updateAvailable: false,
          scriptURL: null,
        });
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        const sw = registration.active || registration.waiting || registration.installing;
        setSwStatus({
          registered: true,
          state: sw?.state || 'unknown',
          updateAvailable: !!registration.waiting,
          scriptURL: sw?.scriptURL || null,
        });
      } else {
        setSwStatus({
          registered: false,
          state: 'unknown',
          updateAvailable: false,
          scriptURL: null,
        });
      }

      setLastCheck(new Date());
    } catch (error) {
      console.error('Error checking SW status:', error);
    } finally {
      setChecking(false);
    }
  };

  const forceUpdate = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        toast.error('Service Worker não suportado');
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        toast.success('Verificação de atualização iniciada');
        
        // If there's a waiting worker, activate it
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          toast.info('Nova versão sendo ativada...');
          setTimeout(() => window.location.reload(), 1000);
        }
      } else {
        toast.info('Nenhum Service Worker registrado');
      }
      
      await checkSWStatus();
    } catch (error) {
      console.error('Error forcing SW update:', error);
      toast.error('Erro ao atualizar Service Worker');
    }
  };

  const clearCacheAndReload = async () => {
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        toast.success(`${cacheNames.length} cache(s) limpo(s)`);
      }
      
      // Unregister SW
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        toast.success('Service Worker desregistrado');
      }
      
      // Hard reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Erro ao limpar cache');
    }
  };

  useEffect(() => {
    checkSWStatus();
    
    // Listen for SW state changes
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        checkSWStatus();
      });
    }
  }, []);

  const getStateIcon = () => {
    if (!swStatus.registered) {
      return <XCircle className="w-5 h-5 text-muted-foreground" />;
    }
    if (swStatus.updateAvailable) {
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
    if (swStatus.state === 'activated') {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <AlertCircle className="w-5 h-5 text-amber-500" />;
  };

  const getStateBadge = () => {
    if (!swStatus.registered) {
      return <Badge variant="secondary">Não registrado</Badge>;
    }
    if (swStatus.updateAvailable) {
      return <Badge variant="destructive">Atualização pendente</Badge>;
    }
    
    const stateLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      activated: { label: 'Ativo', variant: 'default' },
      installed: { label: 'Instalado', variant: 'secondary' },
      installing: { label: 'Instalando...', variant: 'outline' },
      activating: { label: 'Ativando...', variant: 'outline' },
      parsed: { label: 'Parsed', variant: 'outline' },
      redundant: { label: 'Obsoleto', variant: 'destructive' },
      unknown: { label: 'Desconhecido', variant: 'secondary' },
    };
    
    const config = stateLabels[swStatus.state] || stateLabels.unknown;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="w-5 h-5 text-primary" />
          Status do Sistema
        </CardTitle>
        <CardDescription>
          Monitoramento do Service Worker, versão do build e cache
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Worker Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              {getStateIcon()}
              Service Worker
            </h4>
            {getStateBadge()}
          </div>
          
          {swStatus.scriptURL && (
            <p className="text-xs text-muted-foreground font-mono truncate">
              {swStatus.scriptURL.split('/').pop()}
            </p>
          )}
        </div>

        {/* Build Info */}
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Build</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Versão</p>
              <p className="font-mono">{buildInfo.version}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Modo</p>
              <Badge variant={buildInfo.mode === 'production' ? 'default' : 'secondary'}>
                {buildInfo.mode}
              </Badge>
            </div>
          </div>
        </div>

        {/* Last Check */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
          <Clock className="w-3 h-3" />
          Última verificação: {lastCheck.toLocaleTimeString('pt-BR')}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={checkSWStatus}
            disabled={checking}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={forceUpdate}
          >
            Forçar Atualização
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={clearCacheAndReload}
          >
            Limpar Cache
          </Button>
        </div>

        {/* Update Available Warning */}
        {swStatus.updateAvailable && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
            <p className="font-medium text-amber-600 dark:text-amber-400">
              ⚠️ Nova versão disponível
            </p>
            <p className="text-muted-foreground mt-1">
              Clique em "Forçar Atualização" para aplicar a nova versão.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceWorkerStatusWidget;
