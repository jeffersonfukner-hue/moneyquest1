import { useTranslation } from 'react-i18next';
import { Users, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';

interface ReferredUser {
  referred_id: string;
  status: string;
  flagged_as_suspicious: boolean;
  suspicion_reason: string | null;
  created_at: string;
  completed_at: string | null;
  transaction_count: number;
  required_count: number;
}

interface ReferredUsersListProps {
  referredList: ReferredUser[];
  isLoading: boolean;
}

export const ReferredUsersList = ({ referredList, isLoading }: ReferredUsersListProps) => {
  const { t, i18n } = useTranslation();

  const getLocale = () => {
    switch (i18n.language) {
      case 'pt-BR':
      case 'pt-PT':
        return ptBR;
      case 'es-ES':
        return es;
      default:
        return enUS;
    }
  };

  const getStatusBadge = (user: ReferredUser) => {
    if (user.flagged_as_suspicious) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {t('referral.status.suspicious', 'Suspeito')}
        </Badge>
      );
    }

    if (user.status === 'rewarded' || user.status === 'completed') {
      return (
        <Badge className="text-xs bg-green-500/20 text-green-600 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('referral.status.completed', 'Convertido')}
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="text-xs">
        <Clock className="w-3 h-3 mr-1" />
        {t('referral.status.pending', 'Pendente')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (referredList.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {t('referral.noReferred', 'Você ainda não indicou ninguém')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('referral.shareToStart', 'Compartilhe seu link para começar a ganhar recompensas')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {referredList.map((user) => {
        const progress = Math.min((user.transaction_count / user.required_count) * 100, 100);
        const isCompleted = user.status === 'rewarded' || user.status === 'completed';

        return (
          <Card key={user.referred_id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('referral.userLabel', 'Usuário')} #{user.referred_id.substring(0, 8)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(user.created_at), {
                      addSuffix: true,
                      locale: getLocale(),
                    })}
                  </p>
                </div>
                {getStatusBadge(user)}
              </div>

              {!isCompleted && !user.flagged_as_suspicious && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t('referral.transactionProgress', 'Progresso de transações')}
                    </span>
                    <span className="font-medium text-foreground">
                      {user.transaction_count}/{user.required_count}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {user.flagged_as_suspicious && user.suspicion_reason && (
                <p className="text-xs text-destructive mt-2">
                  {user.suspicion_reason === 'same_device_fingerprint'
                    ? t('referral.suspicionReasons.sameDevice', 'Mesmo dispositivo detectado')
                    : t('referral.suspicionReasons.sameIp', 'Mesmo IP detectado em 24h')}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
