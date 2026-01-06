import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

export interface ShopItem {
  id: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  preco_mq_coins: number;
  premium_only: boolean;
  icone: string | null;
  imagem_url: string | null;
  metadata: Record<string, unknown> | null;
  duracao_em_horas: number | null;
  raridade: string;
  visivel_para_free: boolean;
  ativo: boolean;
  // Rotation fields
  rotation_week: number | null;
  is_limited: boolean;
  stock_total: number | null;
  stock_remaining: number | null;
}

// Calculate current rotation week (1-8 cycle)
// Start date: Monday of a reference week
const ROTATION_START_DATE = new Date('2025-01-06'); // First Monday of 2025

export const getCurrentRotationWeek = (): number => {
  const now = new Date();
  const diffTime = now.getTime() - ROTATION_START_DATE.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  return (diffWeeks % 8) + 1; // 1-8 cycle
};

export const getNextRotationDate = (): Date => {
  const now = new Date();
  const currentWeek = getCurrentRotationWeek();
  const diffTime = now.getTime() - ROTATION_START_DATE.getTime();
  const weeksElapsed = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  const nextWeekStart = new Date(ROTATION_START_DATE.getTime() + (weeksElapsed + 1) * 7 * 24 * 60 * 60 * 1000);
  return nextWeekStart;
};

export interface Purchase {
  id: string;
  usuario_id: string;
  item_id: string;
  data_compra: string;
  data_expiracao: string | null;
  status: string;
  preco_pago: number;
  shop_items?: ShopItem;
}

export interface ActiveEffect {
  id: string;
  usuario_id: string;
  tipo_efeito: string;
  valor: number | null;
  origem_item_id: string | null;
  origem_compra_id: string | null;
  data_expiracao: string | null;
  ativo: boolean;
  metadata: Record<string, unknown> | null;
}

export interface ConversionInfo {
  success: boolean;
  xp_conversivel: number;
  rate: number;
  daily_limit: number;
  daily_converted: number;
  daily_remaining: number;
  boost_active: boolean;
  boost_multiplier: number;
  is_premium: boolean;
  tier: string;
}

export const ITEM_TYPES = {
  tema: { label: 'Temas', icon: '🎨' },
  booster: { label: 'Boosters', icon: '⚡' },
  status: { label: 'Status', icon: '✨' },
  funcao: { label: 'Funções', icon: '🔧' },
  premium: { label: 'Premium', icon: '👑' },
  avatar: { label: 'Avatares', icon: '🎭' },
  lootbox: { label: 'Lootboxes', icon: '🎁' },
} as const;

export const RARITY_CONFIG = {
  comum: { label: 'Comum', color: 'bg-muted text-muted-foreground', gradient: 'from-gray-400 to-gray-500' },
  raro: { label: 'Raro', color: 'bg-blue-500/20 text-blue-400', gradient: 'from-blue-400 to-blue-600' },
  epico: { label: 'Épico', color: 'bg-purple-500/20 text-purple-400', gradient: 'from-purple-400 to-purple-600' },
  lendario: { label: 'Lendário', color: 'bg-amber-500/20 text-amber-400', gradient: 'from-amber-400 to-orange-500' },
} as const;

export const useShop = () => {
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [conversionInfo, setConversionInfo] = useState<ConversionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const isPremium = profile?.subscription_plan === 'PREMIUM' || 
    profile?.premium_override === 'force_on' ||
    (profile?.trial_end_date && new Date(profile.trial_end_date) > new Date());

  const currentWeek = getCurrentRotationWeek();

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('shop_items')
      .select('*')
      .eq('ativo', true)
      .order('tipo')
      .order('raridade')
      .order('preco_mq_coins');

    if (!error && data) {
      // Filter items based on visibility, rotation week, and stock
      const visibleItems = (data as unknown as ShopItem[]).filter(item => {
        // Check visibility
        if (!isPremium && !item.visivel_para_free) return false;
        
        // Check rotation: null means always available, otherwise must match current week
        if (item.rotation_week !== null && item.rotation_week !== currentWeek) return false;
        
        // Check limited stock: hide if sold out
        if (item.is_limited && item.stock_remaining !== null && item.stock_remaining <= 0) return false;
        
        return true;
      });
      setItems(visibleItems);
    }
  };

  const fetchPurchases = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('purchases')
      .select('*, shop_items(*)')
      .eq('usuario_id', user.id)
      .order('data_compra', { ascending: false });

    if (!error && data) {
      setPurchases(data as Purchase[]);
    }
  };

  const fetchActiveEffects = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('active_effects')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('ativo', true);

    if (!error && data) {
      setActiveEffects(data as ActiveEffect[]);
    }
  };

  const fetchConversionInfo = async () => {
    if (!user) return;

    const { data, error } = await supabase.rpc('get_conversion_info', {
      p_user_id: user.id
    });

    if (!error && data) {
      setConversionInfo(data as unknown as ConversionInfo);
    }
  };

  const purchaseItem = async (item: ShopItem): Promise<boolean> => {
    if (!user || !profile) {
      toast.error('Você precisa estar logado para comprar');
      return false;
    }

    if (item.premium_only && !isPremium) {
      toast.error('Este item é exclusivo para usuários Premium');
      return false;
    }

    if (profile.mq_coins < item.preco_mq_coins) {
      toast.error('MQ Coins insuficientes');
      return false;
    }

    setPurchasing(true);

    try {
      // Deduct coins
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          mq_coins: profile.mq_coins - item.preco_mq_coins,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Calculate expiration
      let dataExpiracao: string | null = null;
      if (item.duracao_em_horas) {
        const expDate = new Date();
        expDate.setHours(expDate.getHours() + item.duracao_em_horas);
        dataExpiracao = expDate.toISOString();
      }

      // Create purchase record
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          usuario_id: user.id,
          item_id: item.id,
          preco_pago: item.preco_mq_coins,
          data_expiracao: dataExpiracao,
          status: 'ativo'
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Activate effect if it's a booster or function
      if (['booster', 'funcao', 'status'].includes(item.tipo)) {
        const effectType = getEffectType(item);
        const effectValue = getEffectValue(item);

        const { error: effectError } = await supabase
          .from('active_effects')
          .insert({
            usuario_id: user.id,
            tipo_efeito: effectType,
            valor: effectValue,
            origem_item_id: item.id,
            origem_compra_id: purchaseData.id,
            data_expiracao: dataExpiracao,
            ativo: true
          });

        if (effectError) {
          console.error('Erro ao criar efeito:', effectError);
        }
      }

      toast.success(`🎉 ${item.nome} adquirido com sucesso!`);
      
      // Refresh data
      await Promise.all([
        fetchPurchases(),
        fetchActiveEffects(),
        refetchProfile()
      ]);

      return true;
    } catch (error) {
      console.error('Erro na compra:', error);
      toast.error('Erro ao processar compra. Tente novamente.');
      return false;
    } finally {
      setPurchasing(false);
    }
  };

  const convertXpToCoins = async (xpAmount: number): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('convert_xp_to_coins', {
        p_user_id: user.id,
        p_xp_amount: xpAmount
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; coins_earned?: number; xp_spent?: number };

      if (!result.success) {
        const errorMessages: Record<string, string> = {
          user_not_found: 'Usuário não encontrado',
          invalid_amount: 'Quantidade inválida',
          insufficient_xp: 'XP conversível insuficiente',
          daily_limit_reached: 'Limite diário de conversão atingido',
          insufficient_xp_for_coin: 'XP insuficiente para gerar 1 moeda'
        };
        toast.error(errorMessages[result.error || ''] || 'Erro na conversão');
        return false;
      }

      toast.success(`✨ Convertido: ${result.xp_spent} XP → ${result.coins_earned} MQ Coins`);
      
      await Promise.all([
        fetchConversionInfo(),
        refetchProfile()
      ]);

      return true;
    } catch (error) {
      console.error('Erro na conversão:', error);
      toast.error('Erro ao converter XP');
      return false;
    }
  };

  const getEffectType = (item: ShopItem): string => {
    const metadata = item.metadata as Record<string, unknown> | null;
    if (metadata?.effect_type) return metadata.effect_type as string;
    
    switch (item.tipo) {
      case 'booster':
        if (item.nome.toLowerCase().includes('xp')) return 'boost_xp';
        if (item.nome.toLowerCase().includes('moeda') || item.nome.toLowerCase().includes('coin')) return 'boost_moeda';
        return 'boost_conversao';
      case 'funcao':
        return 'funcao_temporaria';
      case 'status':
        return 'status_visual';
      default:
        return 'outro';
    }
  };

  const getEffectValue = (item: ShopItem): number => {
    const metadata = item.metadata as Record<string, unknown> | null;
    if (metadata?.effect_value) return metadata.effect_value as number;
    
    // Default boost values based on rarity
    switch (item.raridade) {
      case 'lendario': return 2.0;
      case 'epico': return 1.5;
      case 'raro': return 1.25;
      default: return 1.1;
    }
  };

  const hasActiveEffect = (effectType: string): boolean => {
    return activeEffects.some(e => 
      e.tipo_efeito === effectType && 
      e.ativo && 
      (!e.data_expiracao || new Date(e.data_expiracao) > new Date())
    );
  };

  const getActiveBoostMultiplier = (effectType: string): number => {
    const effect = activeEffects.find(e => 
      e.tipo_efeito === effectType && 
      e.ativo && 
      (!e.data_expiracao || new Date(e.data_expiracao) > new Date())
    );
    return effect?.valor || 1;
  };

  const hasPurchased = (itemId: string): boolean => {
    return purchases.some(p => 
      p.item_id === itemId && 
      p.status === 'ativo' &&
      (!p.data_expiracao || new Date(p.data_expiracao) > new Date())
    );
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchItems(),
        fetchPurchases(),
        fetchActiveEffects(),
        fetchConversionInfo()
      ]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, isPremium]);

  return {
    items,
    purchases,
    activeEffects,
    conversionInfo,
    loading,
    purchasing,
    isPremium,
    purchaseItem,
    convertXpToCoins,
    hasActiveEffect,
    getActiveBoostMultiplier,
    hasPurchased,
    refetch: async () => {
      await Promise.all([
        fetchItems(),
        fetchPurchases(),
        fetchActiveEffects(),
        fetchConversionInfo()
      ]);
    }
  };
};
