import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useShop, ITEM_TYPES, RARITY_CONFIG, ShopItem } from '@/hooks/useShop';
import { useProfile } from '@/hooks/useProfile';
import { ShopItemCard } from '@/components/shop/ShopItemCard';
import { XpConversionCard } from '@/components/shop/XpConversionCard';
import { ActiveEffectsCard } from '@/components/shop/ActiveEffectsCard';
import { PurchaseHistoryCard } from '@/components/shop/PurchaseHistoryCard';
import { PurchaseConfirmDialog } from '@/components/shop/PurchaseConfirmDialog';
import { Coins, Crown, Sparkles, ShoppingBag, History, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = ['all', ...Object.keys(ITEM_TYPES)];
  
  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter(item => item.tipo === activeCategory);

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
            <p className="text-muted-foreground mt-1">
              Troque seus MQ Coins por itens exclusivos
            </p>
          </div>
          
          {/* Balance Card */}
          <Card className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-amber-500/30">
            <CardContent className="py-4 px-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seu saldo</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {profile?.mq_coins?.toLocaleString('pt-BR') || 0}
                    <span className="text-sm font-normal ml-1">MQ Coins</span>
                  </p>
                </div>
                {isPremium && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 ml-2">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
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
                    <h3 className="font-bold text-lg">Desbloqueie o Premium</h3>
                    <p className="text-sm text-muted-foreground">
                      Melhor taxa de conversão • +20% XP conversível • Itens exclusivos
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

        <Tabs defaultValue="shop" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="shop" className="flex items-center gap-2 py-3">
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
          <TabsContent value="shop" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className={activeCategory === category ? 'bg-accent text-accent-foreground' : ''}
                >
                  {category === 'all' ? '🏪 Todos' : `${ITEM_TYPES[category as keyof typeof ITEM_TYPES]?.icon || '📦'} ${ITEM_TYPES[category as keyof typeof ITEM_TYPES]?.label || category}`}
                </Button>
              ))}
            </div>

            {/* Items Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">Nenhum item disponível</h3>
                  <p className="text-muted-foreground">
                    {activeCategory !== 'all' 
                      ? 'Não há itens nesta categoria no momento.' 
                      : 'A loja está vazia no momento. Volte em breve!'}
                  </p>
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
