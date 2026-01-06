-- =====================================================
-- Regra: xp_total NUNCA diminui, apenas xp_conversivel
-- =====================================================

-- 1. Trigger para impedir que xp diminua
CREATE OR REPLACE FUNCTION public.prevent_xp_decrease()
RETURNS TRIGGER AS $$
BEGIN
  -- Se tentarem diminuir o XP total, manter o valor anterior
  IF NEW.xp < OLD.xp THEN
    NEW.xp := OLD.xp;
  END IF;
  
  -- xp_conversivel pode diminuir (para conversão em MQ Coins)
  -- mas nunca pode ficar negativo
  IF NEW.xp_conversivel < 0 THEN
    NEW.xp_conversivel := 0;
  END IF;
  
  -- mq_coins nunca pode ficar negativo
  IF NEW.mq_coins < 0 THEN
    NEW.mq_coins := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER protect_xp_total
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_xp_decrease();

-- 2. Atualizar trigger de reversão de XP para só afetar xp_conversivel
-- (quando transação é deletada, desconta apenas do conversível, não do total)
CREATE OR REPLACE FUNCTION public.reverse_transaction_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Só processa se a transação tinha XP ganho
  IF OLD.xp_earned > 0 THEN
    -- Deduz APENAS do xp_conversivel, NÃO do xp total
    UPDATE public.profiles
    SET xp_conversivel = GREATEST(0, xp_conversivel - OLD.xp_earned),
        updated_at = now()
    WHERE id = OLD.user_id;
    
    -- Registra no histórico
    INSERT INTO public.xp_history (
      user_id,
      xp_change,
      xp_before,
      xp_after,
      source,
      source_id,
      description
    )
    SELECT 
      OLD.user_id,
      -OLD.xp_earned,
      p.xp,
      p.xp, -- xp total não muda
      'transaction_deleted',
      OLD.id,
      'XP conversível deduzido por exclusão de transação: ' || OLD.description
    FROM public.profiles p
    WHERE p.id = OLD.user_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Função para adicionar XP (aumenta AMBOS: total e conversível)
CREATE OR REPLACE FUNCTION public.add_user_xp(
  p_user_id uuid,
  p_xp_amount integer,
  p_source text,
  p_source_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_xp_before integer;
  v_xp_after integer;
BEGIN
  -- Busca XP atual
  SELECT xp INTO v_xp_before FROM public.profiles WHERE id = p_user_id;
  
  -- Adiciona XP ao total E ao conversível
  UPDATE public.profiles
  SET 
    xp = xp + p_xp_amount,
    xp_conversivel = xp_conversivel + p_xp_amount,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING xp INTO v_xp_after;
  
  -- Registra no histórico
  INSERT INTO public.xp_history (
    user_id,
    xp_change,
    xp_before,
    xp_after,
    source,
    source_id,
    description
  ) VALUES (
    p_user_id,
    p_xp_amount,
    v_xp_before,
    v_xp_after,
    p_source,
    p_source_id,
    p_description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Função para converter XP em MQ Coins
CREATE OR REPLACE FUNCTION public.convert_xp_to_coins(
  p_user_id uuid,
  p_xp_amount integer,
  p_taxa_conversao integer DEFAULT 100 -- 100 XP = 1 MQ Coin
)
RETURNS jsonb AS $$
DECLARE
  v_xp_conversivel integer;
  v_mq_coins_ganhos integer;
BEGIN
  -- Verifica saldo de XP conversível
  SELECT xp_conversivel INTO v_xp_conversivel 
  FROM public.profiles WHERE id = p_user_id;
  
  IF v_xp_conversivel < p_xp_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'XP conversível insuficiente',
      'xp_disponivel', v_xp_conversivel
    );
  END IF;
  
  -- Calcula moedas a receber
  v_mq_coins_ganhos := FLOOR(p_xp_amount::numeric / p_taxa_conversao);
  
  IF v_mq_coins_ganhos < 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'XP insuficiente para converter (mínimo ' || p_taxa_conversao || ' XP)',
      'xp_minimo', p_taxa_conversao
    );
  END IF;
  
  -- Deduz XP conversível e adiciona MQ Coins
  UPDATE public.profiles
  SET 
    xp_conversivel = xp_conversivel - (v_mq_coins_ganhos * p_taxa_conversao),
    mq_coins = mq_coins + v_mq_coins_ganhos,
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Registra conversão
  INSERT INTO public.xp_conversion_log (
    usuario_id,
    xp_gasto,
    mq_coins_recebidos,
    taxa_conversao
  ) VALUES (
    p_user_id,
    v_mq_coins_ganhos * p_taxa_conversao,
    v_mq_coins_ganhos,
    p_taxa_conversao
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'xp_gasto', v_mq_coins_ganhos * p_taxa_conversao,
    'mq_coins_ganhos', v_mq_coins_ganhos,
    'xp_conversivel_restante', v_xp_conversivel - (v_mq_coins_ganhos * p_taxa_conversao)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;