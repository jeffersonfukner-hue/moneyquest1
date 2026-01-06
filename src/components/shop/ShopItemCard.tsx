import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShopItem, RARITY_CONFIG, ITEM_TYPES } from '@/hooks/useShop';
import { Coins, Lock, Crown, Check, Sparkles, Timer, Eye } from 'lucide-react';
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
  const isStatus = item.tipo === 'status' || item.tipo === 'avatar';

  const formatDuration = (hours: number | null) => {
    if (!hours) return null;
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-200 group",
        "hover:shadow-lg active:scale-[0.98]",
        hasPurchased && "ring-1 ring-green-500/50",
        item.raridade === 'lendario' && "bg-gradient-to-br from-amber-950/30 to-orange-950/30 border-amber-500/30",
        item.raridade === 'epico' && "bg-gradient-to-br from-purple-950/30 to-pink-950/30 border-purple-500/30",
        item.raridade === 'raro' && "bg-gradient-to-br from-blue-950/30 to-cyan-950/30 border-blue-500/30"
      )}
    >
      {/* Premium Lock Overlay - Compact */}
      {isLocked && (
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center p-2">
            <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-semibold text-purple-400">Exclusivo Premium</p>
          </div>
        </div>
      )}

      <CardContent className="p-3">
        {/* Header Row: Icon + Info */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
            item.raridade === 'lendario' && "bg-amber-500/20",
            item.raridade === 'epico' && "bg-purple-500/20",
            item.raridade === 'raro' && "bg-blue-500/20",
            item.raridade === 'comum' && "bg-muted"
          )}>
            {item.icone || typeConfig?.icon || '📦'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-1">{item.nome}</h3>
            
            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-1 mt-1">
              <Badge 
                variant="outline" 
                className={cn("text-[10px] px-1.5 py-0", rarityConfig.color)}
              >
                {rarityConfig.label}
              </Badge>
              
              {item.premium_only && (
                <Badge className="text-[10px] px-1.5 py-0 bg-purple-500/80 text-white border-0">
                  <Crown className="w-2.5 h-2.5 mr-0.5" />
                  Premium
                </Badge>
              )}
              
              {item.duracao_em_horas && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-400 border-blue-500/30">
                  <Timer className="w-2.5 h-2.5 mr-0.5" />
                  {formatDuration(item.duracao_em_horas)}
                </Badge>
              )}

              {isStatus && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-400 border-green-500/30">
                  <Eye className="w-2.5 h-2.5 mr-0.5" />
                  Visível
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Description - 1 line */}
        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
          {item.descricao || 'Item especial da loja'}
        </p>

        {/* Footer: Price + Action */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className={cn(
              "font-bold text-sm",
              canAfford ? "text-amber-500" : "text-destructive"
            )}>
              {item.preco_mq_coins.toLocaleString('pt-BR')}
            </span>
          </div>

          {hasPurchased ? (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-400 border-green-500/30">
              <Check className="w-3 h-3 mr-0.5" />
              Adquirido
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={onPurchase}
              disabled={isLocked || !canAfford}
              className={cn(
                "h-7 text-xs px-3",
                canAfford && !isLocked && "bg-accent hover:bg-accent/90"
              )}
            >
              {isLocked ? (
                <Lock className="w-3 h-3" />
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
