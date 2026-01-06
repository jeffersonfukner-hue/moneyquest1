import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShopItem, RARITY_CONFIG, ITEM_TYPES } from '@/hooks/useShop';
import { Coins, Lock, Crown, Check, Sparkles, Timer, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface ShopItemCardProps {
  item: ShopItem;
  isPremium: boolean;
  userCoins: number;
  hasPurchased: boolean;
  onPurchase: () => void;
}

// Map theme items to actual theme values
const THEME_MAP: Record<string, 'light' | 'dark'> = {
  'dark_finance': 'dark',
  'neon_budget': 'dark',
  'black_card': 'dark',
  'galactic_wealth': 'dark',
};

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
  const isTheme = item.tipo === 'tema';

  const { theme: currentTheme, setTheme } = useTheme();
  const [originalTheme, setOriginalTheme] = useState<string | undefined>(undefined);

  const formatDuration = (hours: number | null) => {
    if (!hours) return null;
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const handleMouseEnter = () => {
    if (!isTheme || isLocked) return;
    
    // Get theme_id from metadata
    const metadata = item.metadata as Record<string, unknown> | null;
    const themeId = metadata?.theme_id as string | undefined;
    
    if (themeId) {
      // Save current theme
      setOriginalTheme(currentTheme);
      
      // Apply preview theme
      const previewTheme = THEME_MAP[themeId] || 'dark';
      setTheme(previewTheme);
    }
  };

  const handleMouseLeave = () => {
    if (!isTheme || isLocked || !originalTheme) return;
    
    // Restore original theme
    setTheme(originalTheme);
    setOriginalTheme(undefined);
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-200 group hover:shadow-lg",
        hasPurchased && "ring-1 ring-green-500/50",
        item.raridade === 'lendario' && "bg-gradient-to-br from-amber-950/30 to-orange-950/30 border-amber-500/30",
        item.raridade === 'epico' && "bg-gradient-to-br from-purple-950/30 to-pink-950/30 border-purple-500/30",
        item.raridade === 'raro' && "bg-gradient-to-br from-blue-950/30 to-cyan-950/30 border-blue-500/30",
        isTheme && !isLocked && "cursor-pointer"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Animated Glow for Legendary */}
      {item.raridade === 'lendario' && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 animate-pulse" />
      )}

      {/* Theme Preview Indicator */}
      {isTheme && !isLocked && (
        <div className="absolute top-2 right-2 z-5">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-background/80 backdrop-blur-sm">
            👁️ Hover = Preview
          </Badge>
        </div>
      )}

      {/* Premium Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <p className="font-bold text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Exclusivo Premium
            </p>
          </div>
        </div>
      )}

      <CardContent className="p-3 relative">
        {/* Icon */}
        <div className="flex justify-center mb-2">
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110",
            item.raridade === 'lendario' && "bg-amber-500/15",
            item.raridade === 'epico' && "bg-purple-500/15",
            item.raridade === 'raro' && "bg-blue-500/15",
            item.raridade === 'comum' && "bg-muted"
          )}>
            {item.icone || typeConfig?.icon || '📦'}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 justify-center mb-2">
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

        {/* Name */}
        <h3 className="font-bold text-sm text-center mb-1 line-clamp-1">{item.nome}</h3>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground text-center mb-2 line-clamp-2 min-h-[28px]">
          {item.descricao || 'Item especial da loja MoneyQuest'}
        </p>

        {/* Status Benefits */}
        {isStatus && !isLocked && (
          <div className="mb-2 py-1 px-2 bg-muted/50 rounded text-[10px] text-center text-muted-foreground">
            ✨ Rankings • Perfil • Interações
          </div>
        )}

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className={cn(
              "font-bold text-base",
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
                "h-7 text-xs px-2.5",
                canAfford && !isLocked && "bg-accent hover:bg-accent/90"
              )}
            >
              {isLocked ? (
                <Lock className="w-3.5 h-3.5" />
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
