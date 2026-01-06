import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useShop } from '@/hooks/useShop';
import { useProfile } from '@/hooks/useProfile';
import { Coins, Sparkles, TrendingUp, Crown, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const XpConversionCard = () => {
  const { profile } = useProfile();
  const { conversionInfo, convertXpToCoins, isPremium } = useShop();
  const [xpAmount, setXpAmount] = useState<number>(0);
  const [converting, setConverting] = useState(false);

  if (!conversionInfo) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-2 animate-pulse" />
          <p className="text-muted-foreground">Carregando informações...</p>
        </CardContent>
      </Card>
    );
  }

  const maxXp = Math.min(conversionInfo.xp_conversivel, conversionInfo.daily_remaining);
  const coinsPreview = Math.floor((xpAmount / conversionInfo.rate) * conversionInfo.boost_multiplier);
  const dailyProgress = (conversionInfo.daily_converted / conversionInfo.daily_limit) * 100;

  const tierLabels: Record<string, { label: string; icon: string }> = {
    beginner: { label: 'Iniciante', icon: '🌱' },
    intermediate: { label: 'Intermediário', icon: '⚔️' },
    advanced: { label: 'Avançado', icon: '🏆' },
    premium: { label: 'Premium', icon: '👑' }
  };

  const currentTier = tierLabels[conversionInfo.tier] || tierLabels.beginner;

  const handleConvert = async () => {
    if (xpAmount <= 0) return;
    setConverting(true);
    const success = await convertXpToCoins(xpAmount);
    if (success) {
      setXpAmount(0);
    }
    setConverting(false);
  };

  const quickAmounts = [
    { label: 'Mínimo', value: conversionInfo.rate },
    { label: '50%', value: Math.floor(maxXp * 0.5) },
    { label: 'Máximo', value: maxXp }
  ].filter(a => a.value > 0 && a.value <= maxXp);

  return (
    <div className="space-y-6">
      {/* Main Conversion Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-b border-amber-500/20">
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            Converter XP em MQ Coins
          </CardTitle>
          <CardDescription>
            Transforme seu XP conversível em moedas para gastar na loja
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">XP Conversível</p>
              <p className="text-xl font-bold text-primary">
                {conversionInfo.xp_conversivel.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Taxa Atual</p>
              <p className="text-xl font-bold text-amber-500">
                {conversionInfo.rate}:1
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Nível</p>
              <p className="text-xl font-bold">
                {currentTier.icon} {currentTier.label}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Saldo Atual</p>
              <p className="text-xl font-bold text-amber-500">
                {profile?.mq_coins?.toLocaleString('pt-BR') || 0}
              </p>
            </div>
          </div>

          {/* Daily Limit Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Limite Diário</span>
              <span className="font-medium">
                {conversionInfo.daily_converted.toLocaleString('pt-BR')} / {conversionInfo.daily_limit.toLocaleString('pt-BR')} XP
              </span>
            </div>
            <Progress value={dailyProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Restam {conversionInfo.daily_remaining.toLocaleString('pt-BR')} XP para converter hoje
            </p>
          </div>

          {/* Boost Indicator */}
          {conversionInfo.boost_active && (
            <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg border border-accent/30">
              <Zap className="w-5 h-5 text-accent" />
              <div>
                <p className="font-semibold text-sm">Boost Ativo!</p>
                <p className="text-xs text-muted-foreground">
                  Multiplicador de {conversionInfo.boost_multiplier}x nas conversões
                </p>
              </div>
            </div>
          )}

          {/* Conversion Slider */}
          {maxXp > 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantidade de XP</label>
                <Slider
                  value={[xpAmount]}
                  onValueChange={([value]) => setXpAmount(value)}
                  max={maxXp}
                  min={0}
                  step={conversionInfo.rate}
                  className="py-4"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setXpAmount(amount.value)}
                    className={cn(xpAmount === amount.value && "border-accent bg-accent/10")}
                  >
                    {amount.label}
                  </Button>
                ))}
              </div>

              {/* Preview */}
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Você receberá</p>
                    <div className="flex items-center gap-2">
                      <Coins className="w-6 h-6 text-amber-500" />
                      <span className="text-3xl font-bold text-amber-500">
                        {coinsPreview.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-lg text-muted-foreground">MQ Coins</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{xpAmount.toLocaleString('pt-BR')} XP</p>
                    <p>Taxa: {conversionInfo.rate}:1</p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                size="lg"
                onClick={handleConvert}
                disabled={xpAmount <= 0 || converting}
              >
                {converting ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Convertendo...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Converter {xpAmount.toLocaleString('pt-BR')} XP
                  </span>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Info className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {conversionInfo.daily_remaining <= 0 
                  ? 'Você atingiu o limite diário de conversão. Volte amanhã!'
                  : 'Você não tem XP conversível no momento. Continue usando o app para ganhar XP!'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Taxas de Conversão por Nível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { tier: 'Iniciante', icon: '🌱', rate: 15, limit: 500, levels: '1-4', active: conversionInfo.tier === 'beginner' },
              { tier: 'Intermediário', icon: '⚔️', rate: 10, limit: 2000, levels: '5-14', active: conversionInfo.tier === 'intermediate' },
              { tier: 'Avançado', icon: '🏆', rate: 8, limit: 5000, levels: '15+', active: conversionInfo.tier === 'advanced' },
              { tier: 'Premium', icon: '👑', rate: 8, limit: 10000, levels: 'Assinante', active: conversionInfo.tier === 'premium', isPremium: true }
            ].map((t) => (
              <div 
                key={t.tier}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  t.active ? "bg-accent/10 border-accent" : "bg-muted/30 border-border",
                  t.isPremium && "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      {t.tier}
                      {t.active && <Badge variant="outline" className="text-xs">Atual</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">Níveis {t.levels}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-500">{t.rate} XP = 1 Coin</p>
                  <p className="text-xs text-muted-foreground">{t.limit.toLocaleString('pt-BR')} XP/dia</p>
                </div>
              </div>
            ))}
          </div>

          {!isPremium && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/30">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-purple-500" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Benefícios Premium</p>
                  <p className="text-xs text-muted-foreground">
                    Melhor taxa de conversão (8:1) + Limite de 10.000 XP/dia + 20% XP extra
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
