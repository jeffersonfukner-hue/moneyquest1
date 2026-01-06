import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useShop, RARITY_CONFIG, ITEM_TYPES } from '@/hooks/useShop';
import { History, Coins, Clock, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const PurchaseHistoryCard = () => {
  const { purchases } = useShop();

  const getStatusBadge = (status: string, expiration: string | null) => {
    if (status === 'expirado' || (expiration && new Date(expiration) < new Date())) {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
          <X className="w-3 h-3 mr-1" />
          Expirado
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
        <Check className="w-3 h-3 mr-1" />
        Ativo
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-accent" />
          Histórico de Compras
        </CardTitle>
        <CardDescription>
          Todas as suas compras na loja MoneyQuest
        </CardDescription>
      </CardHeader>
      <CardContent>
        {purchases.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold">Nenhuma compra realizada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Suas compras aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase) => {
              const item = purchase.shop_items;
              if (!item) return null;
              
              const rarityConfig = RARITY_CONFIG[item.raridade as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.comum;
              const typeConfig = ITEM_TYPES[item.tipo as keyof typeof ITEM_TYPES];

              return (
                <div 
                  key={purchase.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    purchase.status === 'ativo' && (!purchase.data_expiracao || new Date(purchase.data_expiracao) > new Date())
                      ? "bg-accent/5 border-accent/20"
                      : "bg-muted/30 border-border opacity-75"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icone || typeConfig?.icon || '📦'}</span>
                      <div>
                        <p className="font-semibold">{item.nome}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn("text-xs", rarityConfig.color)}>
                            {rarityConfig.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {typeConfig?.label || item.tipo}
                          </span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(purchase.status, purchase.data_expiracao)}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span>{purchase.preco_pago.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(purchase.data_compra), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    {purchase.data_expiracao && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(purchase.data_expiracao) > new Date() 
                          ? `Expira em ${format(new Date(purchase.data_expiracao), "dd/MM/yyyy", { locale: ptBR })}`
                          : `Expirou em ${format(new Date(purchase.data_expiracao), "dd/MM/yyyy", { locale: ptBR })}`
                        }
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
