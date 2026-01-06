import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useShop, RARITY_CONFIG, ITEM_TYPES } from '@/hooks/useShop';
import { useProfile } from '@/hooks/useProfile';
import { History, Coins, Clock, Check, X, Palette, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// Map theme names to CSS class names
const THEME_CLASS_MAP: Record<string, string> = {
  'black_card': 'theme-black-card',
  'crypto_neon': 'theme-crypto-neon',
  'galactic_wealth': 'theme-galactic-wealth',
  'executive_diamond': 'theme-executive-diamond',
  'executive_dark': 'theme-executive-dark',
  'gold_luxury': 'theme-gold-luxury',
  'obsidian_wealth': 'theme-obsidian-wealth',
  'dark_samurai': 'theme-dark-samurai',
  'midnight_wealth': 'theme-midnight-wealth',
  'royal_crown': 'theme-royal-crown',
  'legacy_gold': 'theme-legacy-gold',
  'minimal_white_pro': 'theme-minimal-white',
  'ocean_blue_wealth': 'theme-ocean-blue-wealth',
  'emerald_balance': 'theme-emerald-balance',
  'forest_wealth': 'theme-forest-wealth',
  'sunset_balance': 'theme-sunset-balance',
};

export const PurchaseHistoryCard = () => {
  const { purchases } = useShop();
  const { profile, updateProfile } = useProfile();

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

  const handleApplyTheme = async (themeId: string, themeName: string) => {
    try {
      // Apply CSS class immediately
      Object.values(THEME_CLASS_MAP).forEach(cls => {
        document.documentElement.classList.remove(cls);
      });
      
      if (THEME_CLASS_MAP[themeId]) {
        document.documentElement.classList.add(THEME_CLASS_MAP[themeId]);
      }

      // Save to profile
      await updateProfile({ active_shop_theme: themeId } as any);
      toast.success(`🎨 Tema "${themeName}" aplicado com sucesso!`);
    } catch (error) {
      console.error('Erro ao aplicar tema:', error);
      toast.error('Erro ao aplicar tema');
    }
  };

  const handleRemoveTheme = async () => {
    try {
      // Remove all theme classes
      Object.values(THEME_CLASS_MAP).forEach(cls => {
        document.documentElement.classList.remove(cls);
      });

      // Clear from profile
      await updateProfile({ active_shop_theme: null } as any);
      toast.success('Tema padrão restaurado!');
    } catch (error) {
      console.error('Erro ao remover tema:', error);
      toast.error('Erro ao remover tema');
    }
  };

  const isThemeActive = (themeId: string) => {
    return (profile as any)?.active_shop_theme === themeId;
  };

  // Filter theme purchases
  const themePurchases = purchases.filter(p => p.shop_items?.tipo === 'tema' && p.status === 'ativo');
  const otherPurchases = purchases.filter(p => p.shop_items?.tipo !== 'tema' || p.status !== 'ativo');

  return (
    <div className="space-y-6">
      {/* Active Themes Section */}
      {themePurchases.length > 0 && (
        <Card className="border-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-accent" />
              Meus Temas
            </CardTitle>
            <CardDescription>
              Clique em "Usar" para aplicar um tema comprado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themePurchases.map((purchase) => {
                const item = purchase.shop_items;
                if (!item) return null;
                
                const metadata = item.metadata as Record<string, unknown> | null;
                const themeId = metadata?.theme_id as string | undefined;
                const rarityConfig = RARITY_CONFIG[item.raridade as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.comum;
                const isActive = themeId && isThemeActive(themeId);

                return (
                  <div 
                    key={purchase.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      isActive 
                        ? "bg-accent/10 border-accent ring-2 ring-accent/50" 
                        : "bg-card border-border hover:border-accent/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.icone || '🎨'}</span>
                        <div>
                          <p className="font-semibold text-sm">{item.nome}</p>
                          <Badge variant="outline" className={cn("text-[10px] mt-0.5", rarityConfig.color)}>
                            {rarityConfig.label}
                          </Badge>
                        </div>
                      </div>
                      {themeId && (
                        isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRemoveTheme}
                            className="h-7 text-xs border-accent text-accent"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Em Uso
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleApplyTheme(themeId, item.nome)}
                            className="h-7 text-xs bg-accent hover:bg-accent/90"
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Usar
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Purchases History */}
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
    </div>
  );
};
