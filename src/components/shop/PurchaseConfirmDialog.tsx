import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ShopItem, RARITY_CONFIG, ITEM_TYPES } from '@/hooks/useShop';
import { Coins, Clock, Crown, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PurchaseConfirmDialogProps {
  item: ShopItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
  userCoins: number;
}

export const PurchaseConfirmDialog = ({
  item,
  open,
  onOpenChange,
  onConfirm,
  loading,
  userCoins
}: PurchaseConfirmDialogProps) => {
  if (!item) return null;

  const rarityConfig = RARITY_CONFIG[item.raridade as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.comum;
  const typeConfig = ITEM_TYPES[item.tipo as keyof typeof ITEM_TYPES];
  const canAfford = userCoins >= item.preco_mq_coins;
  const remainingCoins = userCoins - item.preco_mq_coins;

  const formatDuration = (hours: number | null) => {
    if (!hours) return 'Permanente';
    if (hours < 24) return `${hours} hora${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `${days} dia${days > 1 ? 's' : ''}`;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Confirmar Compra
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Item Preview */}
              <div className={cn(
                "p-4 rounded-xl border",
                item.raridade === 'lendario' && "bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/30",
                item.raridade === 'epico' && "bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30",
                item.raridade === 'raro' && "bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-500/30",
                item.raridade === 'comum' && "bg-muted/50"
              )}>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{item.icone || typeConfig?.icon || '📦'}</div>
                  <div>
                    <h4 className="font-bold text-lg text-foreground">{item.nome}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn("text-xs", rarityConfig.color)}>
                        {rarityConfig.label}
                      </Badge>
                      {item.premium_only && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {item.descricao && (
                  <p className="text-sm text-muted-foreground mt-3">{item.descricao}</p>
                )}
                {item.duracao_em_horas && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                    <Clock className="w-4 h-4" />
                    <span>Duração: {formatDuration(item.duracao_em_horas)}</span>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Seu saldo atual:</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Coins className="w-4 h-4 text-amber-500" />
                    {userCoins.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Preço do item:</span>
                  <span className="font-semibold flex items-center gap-1 text-amber-500">
                    <Coins className="w-4 h-4" />
                    -{item.preco_mq_coins.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex items-center justify-between">
                  <span className="font-medium">Saldo após compra:</span>
                  <span className={cn(
                    "font-bold flex items-center gap-1",
                    canAfford ? "text-green-500" : "text-destructive"
                  )}>
                    <Coins className="w-4 h-4" />
                    {remainingCoins.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {!canAfford && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/30 text-destructive">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">
                    Você não tem MQ Coins suficientes para esta compra. Converta XP ou ganhe mais moedas!
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={!canAfford || loading}
            className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                Comprando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Confirmar Compra
              </span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
