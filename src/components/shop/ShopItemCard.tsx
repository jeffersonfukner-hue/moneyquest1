import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShopItem, RARITY_CONFIG, ITEM_TYPES } from '@/hooks/useShop';
import { Coins, Lock, Crown, Clock, Check, Sparkles, Timer, Eye } from 'lucide-react';
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

  const getRarityGlow = () => {
    switch (item.raridade) {
      case 'lendario': return 'shadow-amber-500/40 hover:shadow-amber-500/60';
      case 'epico': return 'shadow-purple-500/40 hover:shadow-purple-500/60';
      case 'raro': return 'shadow-blue-500/40 hover:shadow-blue-500/60';
      default: return '';
    }
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 group",
        "hover:scale-[1.02] hover:shadow-xl",
        getRarityGlow(),
        hasPurchased && "ring-2 ring-green-500/50",
        item.raridade === 'lendario' && "bg-gradient-to-br from-amber-950/40 via-background to-orange-950/40 border-amber-500/40",
        item.raridade === 'epico' && "bg-gradient-to-br from-purple-950/40 via-background to-pink-950/40 border-purple-500/40",
        item.raridade === 'raro' && "bg-gradient-to-br from-blue-950/40 via-background to-cyan-950/40 border-blue-500/40",
        item.raridade === 'comum' && "bg-card"
      )}
    >
      {/* Animated Glow Background for Legendary */}
      {item.raridade === 'lendario' && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 animate-pulse" />
      )}

      {/* Premium Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/40 animate-pulse">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <p className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Exclusivo Premium
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Assine para desbloquear este item
            </p>
          </div>
        </div>
      )}

      <CardContent className="p-5 relative">
        {/* Large Icon Center */}
        <div className="flex justify-center mb-4">
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center text-5xl transition-transform group-hover:scale-110",
            item.raridade === 'lendario' && "bg-gradient-to-br from-amber-500/20 to-orange-500/20 shadow-lg shadow-amber-500/20",
            item.raridade === 'epico' && "bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/20",
            item.raridade === 'raro' && "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 shadow-lg shadow-blue-500/20",
            item.raridade === 'comum' && "bg-muted"
          )}>
            {item.icone || typeConfig?.icon || '📦'}
          </div>
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-3">
          {/* Rarity Badge */}
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs font-semibold",
              rarityConfig.color,
              item.raridade === 'lendario' && "border-amber-500/50 bg-amber-500/10",
              item.raridade === 'epico' && "border-purple-500/50 bg-purple-500/10",
              item.raridade === 'raro' && "border-blue-500/50 bg-blue-500/10"
            )}
          >
            {rarityConfig.label}
          </Badge>

          {/* Premium Tag */}
          {item.premium_only && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}

          {/* Duration Tag */}
          {item.duracao_em_horas && (
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
              <Timer className="w-3 h-3 mr-1" />
              {formatDuration(item.duracao_em_horas)}
            </Badge>
          )}

          {/* Status visibility indicator */}
          {isStatus && (
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
              <Eye className="w-3 h-3 mr-1" />
              Visível
            </Badge>
          )}
        </div>

        {/* Name */}
        <h3 className="font-bold text-lg text-center mb-2 line-clamp-1">{item.nome}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-2 min-h-[40px]">
          {item.descricao || 'Item especial da loja MoneyQuest'}
        </p>

        {/* Status Benefits */}
        {isStatus && !isLocked && (
          <div className="mb-4 p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-center text-muted-foreground">
              ✨ Aparece em: <span className="text-foreground">Rankings • Perfil • Interações</span>
            </p>
          </div>
        )}

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Coins className="w-4 h-4 text-white" />
            </div>
            <span className={cn(
              "font-bold text-xl",
              canAfford ? "text-amber-500" : "text-destructive"
            )}>
              {item.preco_mq_coins.toLocaleString('pt-BR')}
            </span>
          </div>

          {hasPurchased ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1.5">
              <Check className="w-4 h-4 mr-1" />
              Adquirido
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={onPurchase}
              disabled={isLocked || !canAfford}
              className={cn(
                "transition-all font-semibold px-4",
                canAfford && !isLocked 
                  ? "bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-lg shadow-accent/30" 
                  : ""
              )}
            >
              {isLocked ? (
                <>
                  <Lock className="w-4 h-4 mr-1" />
                  Bloqueado
                </>
              ) : !canAfford ? (
                'Sem saldo'
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
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
