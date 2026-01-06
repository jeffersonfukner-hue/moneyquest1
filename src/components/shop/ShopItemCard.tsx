import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShopItem, RARITY_CONFIG, ITEM_TYPES } from '@/hooks/useShop';
import { Coins, Lock, Crown, Clock, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShopItemCardProps {
  item: ShopItem;
  isPremium: boolean;
  userCoins: number;
  hasPurchased: boolean;
  onPurchase: () => void;
}

export const ShopItemCard = ({ 
  item, 
  isPremium, 
  userCoins, 
  hasPurchased,
  onPurchase 
}: ShopItemCardProps) => {
  const rarityConfig = RARITY_CONFIG[item.raridade as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.comum;
  const typeConfig = ITEM_TYPES[item.tipo as keyof typeof ITEM_TYPES];
  const canAfford = userCoins >= item.preco_mq_coins;
  const isLocked = item.premium_only && !isPremium;

  const formatDuration = (hours: number | null) => {
    if (!hours) return 'Permanente';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days} dia${days > 1 ? 's' : ''}`;
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg group",
        isLocked && "opacity-80",
        hasPurchased && "ring-2 ring-green-500/50",
        item.raridade === 'lendario' && "bg-gradient-to-br from-amber-900/20 via-background to-orange-900/20 border-amber-500/30",
        item.raridade === 'epico' && "bg-gradient-to-br from-purple-900/20 via-background to-pink-900/20 border-purple-500/30",
        item.raridade === 'raro' && "bg-gradient-to-br from-blue-900/20 via-background to-cyan-900/20 border-blue-500/30"
      )}
    >
      {/* Rarity Glow Effect */}
      {item.raridade !== 'comum' && (
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          `bg-gradient-to-t ${rarityConfig.gradient} blur-3xl`
        )} style={{ opacity: 0.1 }} />
      )}

      {/* Premium Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <p className="font-semibold text-sm">Exclusivo Premium</p>
            <p className="text-xs text-muted-foreground mt-1">Faça upgrade para desbloquear</p>
          </div>
        </div>
      )}

      <CardContent className="p-4 relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{item.icone || typeConfig?.icon || '📦'}</span>
            <div>
              <Badge variant="outline" className={cn("text-xs", rarityConfig.color)}>
                {rarityConfig.label}
              </Badge>
            </div>
          </div>
          {item.premium_only && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>

        {/* Item Info */}
        <h3 className="font-bold text-lg mb-1 line-clamp-1">{item.nome}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[40px]">
          {item.descricao || 'Sem descrição'}
        </p>

        {/* Duration Badge */}
        {item.duracao_em_horas && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Clock className="w-3 h-3" />
            <span>Duração: {formatDuration(item.duracao_em_horas)}</span>
          </div>
        )}

        {/* Price and Action */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Coins className="w-5 h-5 text-amber-500" />
            <span className={cn(
              "font-bold text-lg",
              canAfford ? "text-amber-500" : "text-destructive"
            )}>
              {item.preco_mq_coins.toLocaleString('pt-BR')}
            </span>
          </div>

          {hasPurchased ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              <Check className="w-3 h-3 mr-1" />
              Adquirido
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={onPurchase}
              disabled={isLocked || !canAfford}
              className={cn(
                "transition-all",
                canAfford && !isLocked 
                  ? "bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70" 
                  : ""
              )}
            >
              {isLocked ? (
                <>
                  <Lock className="w-3 h-3 mr-1" />
                  Bloqueado
                </>
              ) : !canAfford ? (
                'Sem saldo'
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Comprar
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
