import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useShop, ActiveEffect, RARITY_CONFIG } from '@/hooks/useShop';
import { Zap, Clock, Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, differenceInMinutes, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EFFECT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  boost_xp: { label: 'Boost de XP', icon: '⚡', color: 'text-yellow-500' },
  boost_moeda: { label: 'Boost de Moedas', icon: '💰', color: 'text-amber-500' },
  boost_conversao: { label: 'Boost de Conversão', icon: '🔄', color: 'text-blue-500' },
  funcao_temporaria: { label: 'Função Desbloqueada', icon: '🔧', color: 'text-green-500' },
  status_visual: { label: 'Status Visual', icon: '✨', color: 'text-purple-500' },
};

export const ActiveEffectsCard = () => {
  const { activeEffects, isPremium } = useShop();

  const validEffects = activeEffects.filter(e => 
    e.ativo && 
    (!e.data_expiracao || new Date(e.data_expiracao) > new Date())
  );

  const getTimeRemaining = (expiration: string | null) => {
    if (!expiration) return { text: 'Permanente', progress: 100 };
    
    const expDate = new Date(expiration);
    const now = new Date();
    const minutesRemaining = differenceInMinutes(expDate, now);
    const hoursRemaining = differenceInHours(expDate, now);
    
    if (minutesRemaining <= 0) return { text: 'Expirado', progress: 0 };
    
    // Assume 24h total duration for progress calculation
    const totalMinutes = 24 * 60;
    const progress = Math.min(100, (minutesRemaining / totalMinutes) * 100);
    
    let text = '';
    if (hoursRemaining >= 24) {
      const days = Math.floor(hoursRemaining / 24);
      text = `${days} dia${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`;
    } else if (hoursRemaining >= 1) {
      text = `${hoursRemaining}h restante${hoursRemaining > 1 ? 's' : ''}`;
    } else {
      text = `${minutesRemaining} min restante${minutesRemaining > 1 ? 's' : ''}`;
    }
    
    return { text, progress };
  };

  return (
    <div className="space-y-6">
      {/* Active Effects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Efeitos Ativos
          </CardTitle>
          <CardDescription>
            Seus boosters e efeitos temporários atualmente ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validEffects.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold">Nenhum efeito ativo</p>
              <p className="text-sm text-muted-foreground mt-1">
                Compre itens na loja para ativar boosters e efeitos especiais
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {validEffects.map((effect) => {
                const config = EFFECT_LABELS[effect.tipo_efeito] || { 
                  label: effect.tipo_efeito, 
                  icon: '📦', 
                  color: 'text-muted-foreground' 
                };
                const timeInfo = getTimeRemaining(effect.data_expiracao);

                return (
                  <div 
                    key={effect.id}
                    className="p-4 rounded-lg bg-gradient-to-r from-accent/5 to-accent/10 border border-accent/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.icon}</span>
                        <div>
                          <p className={cn("font-semibold", config.color)}>
                            {config.label}
                          </p>
                          {effect.valor && effect.valor > 1 && (
                            <p className="text-sm text-muted-foreground">
                              Multiplicador: <span className="font-bold text-accent">{effect.valor}x</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                        Ativo
                      </Badge>
                    </div>

                    {/* Time Remaining */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{timeInfo.text}</span>
                        </div>
                        {effect.data_expiracao && (
                          <span className="text-xs text-muted-foreground">
                            Expira {formatDistanceToNow(new Date(effect.data_expiracao), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        )}
                      </div>
                      {effect.data_expiracao && (
                        <Progress 
                          value={timeInfo.progress} 
                          className="h-1.5"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Benefits */}
      {isPremium && (
        <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-400">
              <Crown className="w-5 h-5" />
              Benefícios Premium Permanentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { icon: '⚡', label: '+20% XP Conversível', desc: 'Ganhe mais XP em todas as transações' },
                { icon: '💎', label: 'Melhor Taxa de Conversão', desc: 'Taxa fixa de 8 XP = 1 MQ Coin' },
                { icon: '📈', label: 'Limite Diário Aumentado', desc: 'Até 10.000 XP/dia de conversão' },
                { icon: '🎁', label: 'Itens Exclusivos', desc: 'Acesso a itens premium na loja' },
                { icon: '🔓', label: 'Funções Permanentes', desc: 'Todas as funções temporárias desbloqueadas' },
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <span className="text-xl">{benefit.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{benefit.label}</p>
                    <p className="text-xs text-muted-foreground">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
