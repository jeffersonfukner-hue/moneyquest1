import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useShop, ShopItem } from '@/hooks/useShop';
import { useProfile } from '@/hooks/useProfile';
import { ShopItemCard } from '@/components/shop/ShopItemCard';
import { XpConversionCard } from '@/components/shop/XpConversionCard';
import { ActiveEffectsCard } from '@/components/shop/ActiveEffectsCard';
import { PurchaseHistoryCard } from '@/components/shop/PurchaseHistoryCard';
import { PurchaseConfirmDialog } from '@/components/shop/PurchaseConfirmDialog';
import { Coins, Crown, Sparkles, ShoppingBag, History, Zap, Star, Palette, Flame, Award, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const SHOP_TABS = [
  { id: 'destaques', label: 'Destaques', icon: Star, description: 'Os melhores itens da loja' },
  { id: 'temas', label: 'Temas', icon: Palette, description: 'Personalize sua experiência' },
  { id: 'boosts', label: 'Boosts', icon: Zap, description: 'Acelere seu progresso' },
  { id: 'status', label: 'Status', icon: Award, description: 'Destaque-se na comunidade' },
  { id: 'premium', label: 'Premium', icon: Crown, description: 'Itens exclusivos' },
  { id: 'exclusivo', label: 'Exclusivo Premium', icon: Lock, description: 'Só para assinantes' },
];

const Shop = () => {
  const { profile } = useProfile();
  const { 
    items, 
    loading, 
    purchasing, 
    isPremium,
    purchaseItem,
    hasPurchased 
  } = useShop();
  
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>('destaques');

  // Filter items based on tab
  const getFilteredItems = (tabId: string): ShopItem[] => {
    switch (tabId) {
      case 'destaques':
        // Featured: legendary and epic items, or best sellers
        return items.filter(item => 
          item.raridade === 'lendario' || item.raridade === 'epico'
        ).slice(0, 6);
      case 'temas':
        return items.filter(item => item.tipo === 'tema');
      case 'boosts':
        return items.filter(item => item.tipo === 'booster');
      case 'status':
        return items.filter(item => item.tipo === 'status' || item.tipo === 'avatar');
      case 'premium':
        return items.filter(item => item.premium_only);
      case 'exclusivo':
        return items.filter(item => item.premium_only && item.raridade === 'lendario');
      default:
        return items;
    }
  };

  const filteredItems = getFilteredItems(activeTab);

  const handlePurchase = async () => {
    if (!selectedItem) return;
    const success = await purchaseItem(selectedItem);
    if (success) {
      setSelectedItem(null);
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-7 h-7 text-accent" />
              Loja MoneyQuest
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use seu XP para desbloquear itens e experiências exclusivas.
            </p>
          </div>
          
          {/* Balance Card - Compact */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Coins className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-amber-500">
                {profile?.mq_coins?.toLocaleString('pt-BR') || 0}
              </span>
              <span className="text-xs text-muted-foreground">MQ</span>
            </div>
            {isPremium && (
              <Badge className="bg-purple-500/80 text-white border-0 text-[10px] px-1.5 py-0">
                <Crown className="w-2.5 h-2.5 mr-0.5" />
                PRO
              </Badge>
            )}
          </div>
        </div>

        {/* Premium Banner for Free Users */}
        {!isPremium && (
          <Card className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 border-purple-500/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnptLTYgNnY2aDZ2LTZoLTZ6bTYgNmg2di02aC02djZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            <CardContent className="py-6 px-6 relative">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Itens Premium</h3>
                    <p className="text-sm text-muted-foreground">
                      Mostre seu status e desbloqueie o máximo do MoneyQuest.{' '}
                      <span className="text-purple-400">Experimente o Premium por tempo limitado.</span>
                    </p>
                  </div>
                </div>
                <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg">
                  <Link to="/premium">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Ver Benefícios
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="loja" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="loja" className="flex items-center gap-2 py-3">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Loja</span>
            </TabsTrigger>
            <TabsTrigger value="convert" className="flex items-center gap-2 py-3">
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Converter XP</span>
            </TabsTrigger>
            <TabsTrigger value="effects" className="flex items-center gap-2 py-3">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Efeitos</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 py-3">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          {/* Shop Tab */}
          <TabsContent value="loja" className="space-y-4">
            {/* Shop Category Tabs - Compact Pills */}
            <div className="flex flex-wrap gap-1.5">
              {SHOP_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isPremiumTab = tab.id === 'premium' || tab.id === 'exclusivo';
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                      ${isActive 
                        ? 'bg-accent text-accent-foreground shadow-md' 
                        : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }
                      ${isPremiumTab && !isActive ? 'bg-purple-500/10 text-purple-400' : ''}
                    `}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Items Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-xl" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">Nenhum item disponível</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'exclusivo' && !isPremium
                      ? 'Assine o Premium para ver os itens exclusivos!'
                      : 'Não há itens nesta categoria no momento.'}
                  </p>
                  {activeTab === 'exclusivo' && !isPremium && (
                    <Button asChild className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500">
                      <Link to="/premium">
                        <Crown className="w-4 h-4 mr-2" />
                        Assinar Premium
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    isPremium={isPremium}
                    userCoins={profile?.mq_coins || 0}
                    hasPurchased={hasPurchased(item.id)}
                    onPurchase={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Convert XP Tab */}
          <TabsContent value="convert">
            <XpConversionCard />
          </TabsContent>

          {/* Active Effects Tab */}
          <TabsContent value="effects">
            <ActiveEffectsCard />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <PurchaseHistoryCard />
          </TabsContent>
        </Tabs>

        {/* Purchase Confirmation Dialog */}
        <PurchaseConfirmDialog
          item={selectedItem}
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          onConfirm={handlePurchase}
          loading={purchasing}
          userCoins={profile?.mq_coins || 0}
        />
      </div>
    </AppLayout>
  );
};

export default Shop;
