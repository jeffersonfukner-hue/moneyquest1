-- =====================================================
-- MoneyQuest: Sistema de Loja e Moeda Virtual (MQ Coins)
-- =====================================================

-- 1. Adicionar campos de moeda virtual ao profiles existente
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp_conversivel integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS mq_coins integer NOT NULL DEFAULT 0;

-- 2. Criar tabela de itens da loja
CREATE TABLE public.shop_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('tema', 'booster', 'status', 'funcao', 'premium', 'avatar', 'lootbox')),
  descricao text,
  preco_mq_coins integer NOT NULL DEFAULT 0,
  premium_only boolean NOT NULL DEFAULT false,
  duracao_em_horas integer, -- null se permanente
  raridade text NOT NULL DEFAULT 'comum' CHECK (raridade IN ('comum', 'raro', 'epico', 'lendario')),
  visivel_para_free boolean NOT NULL DEFAULT true,
  ativo boolean NOT NULL DEFAULT true,
  icone text DEFAULT '🎁',
  imagem_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Criar tabela de compras
CREATE TABLE public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  data_compra timestamp with time zone NOT NULL DEFAULT now(),
  data_expiracao timestamp with time zone, -- null se permanente
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'expirado', 'cancelado')),
  preco_pago integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Criar tabela de efeitos ativos
CREATE TABLE public.active_effects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo_efeito text NOT NULL CHECK (tipo_efeito IN ('boost_xp', 'boost_moeda', 'funcao_temporaria', 'status_visual', 'tema', 'avatar')),
  valor numeric, -- multiplicador ou valor do efeito
  origem_item_id uuid REFERENCES public.shop_items(id) ON DELETE SET NULL,
  origem_compra_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  data_expiracao timestamp with time zone, -- null se permanente
  ativo boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. Criar tabela de log de conversão XP -> MQ Coins
CREATE TABLE public.xp_conversion_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_gasto integer NOT NULL,
  mq_coins_recebidos integer NOT NULL,
  taxa_conversao numeric NOT NULL DEFAULT 100, -- quantos XP por 1 MQ Coin
  data timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- ÍNDICES para performance
-- =====================================================
CREATE INDEX idx_shop_items_tipo ON public.shop_items(tipo);
CREATE INDEX idx_shop_items_ativo ON public.shop_items(ativo);
CREATE INDEX idx_shop_items_raridade ON public.shop_items(raridade);
CREATE INDEX idx_purchases_usuario ON public.purchases(usuario_id);
CREATE INDEX idx_purchases_status ON public.purchases(status);
CREATE INDEX idx_active_effects_usuario ON public.active_effects(usuario_id);
CREATE INDEX idx_active_effects_ativo ON public.active_effects(ativo);
CREATE INDEX idx_xp_conversion_usuario ON public.xp_conversion_log(usuario_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Shop Items: todos podem ver itens ativos, apenas admin gerencia
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shop items"
  ON public.shop_items FOR SELECT
  USING (ativo = true);

CREATE POLICY "Super admins can manage shop items"
  ON public.shop_items FOR ALL
  USING (is_super_admin(auth.uid()));

-- Purchases: usuários veem e criam suas próprias compras
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create own purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own purchases"
  ON public.purchases FOR UPDATE
  USING (auth.uid() = usuario_id);

-- Active Effects: usuários veem e gerenciam seus próprios efeitos
ALTER TABLE public.active_effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own active effects"
  ON public.active_effects FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create own active effects"
  ON public.active_effects FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own active effects"
  ON public.active_effects FOR UPDATE
  USING (auth.uid() = usuario_id);

-- XP Conversion Log: usuários veem e criam seus próprios logs
ALTER TABLE public.xp_conversion_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp conversion logs"
  ON public.xp_conversion_log FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create own xp conversion logs"
  ON public.xp_conversion_log FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- =====================================================
-- TRIGGER para updated_at em shop_items
-- =====================================================
CREATE TRIGGER update_shop_items_updated_at
  BEFORE UPDATE ON public.shop_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FUNÇÃO para expirar efeitos automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.expire_old_effects()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Expirar efeitos ativos que passaram da data
  UPDATE public.active_effects
  SET ativo = false
  WHERE ativo = true 
    AND data_expiracao IS NOT NULL 
    AND data_expiracao < now();
  
  -- Expirar compras que passaram da data
  UPDATE public.purchases
  SET status = 'expirado'
  WHERE status = 'ativo' 
    AND data_expiracao IS NOT NULL 
    AND data_expiracao < now();
END;
$$;