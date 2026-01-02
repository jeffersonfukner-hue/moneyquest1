-- Criar função de validação anti-cheating para referral
CREATE OR REPLACE FUNCTION public.validate_referral_transactions(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_transaction_count INTEGER;
  v_unique_days INTEGER;
  v_unique_categories INTEGER;
  v_unique_amounts INTEGER;
BEGIN
  -- Contar transações totais
  SELECT COUNT(*) INTO v_transaction_count
  FROM public.transactions
  WHERE user_id = p_user_id;
  
  -- Mínimo de 5 transações
  IF v_transaction_count < 5 THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar padrões anti-cheating:
  -- Pelo menos 3 dias diferentes
  SELECT COUNT(DISTINCT date) INTO v_unique_days
  FROM public.transactions WHERE user_id = p_user_id;
  
  -- Pelo menos 3 categorias diferentes
  SELECT COUNT(DISTINCT category) INTO v_unique_categories
  FROM public.transactions WHERE user_id = p_user_id;
  
  -- Pelo menos 4 valores diferentes
  SELECT COUNT(DISTINCT amount) INTO v_unique_amounts
  FROM public.transactions WHERE user_id = p_user_id;
  
  -- Validar: dias diferentes OU (categorias E valores distintos)
  IF v_unique_days >= 3 OR (v_unique_categories >= 3 AND v_unique_amounts >= 4) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Atualizar trigger de validação de referral com anti-cheating
CREATE OR REPLACE FUNCTION public.check_referral_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_valid BOOLEAN;
  v_result JSONB;
BEGIN
  -- Verificar se usuário tem referral pendente
  IF EXISTS (
    SELECT 1 FROM public.referrals 
    WHERE referred_id = NEW.user_id AND status = 'pending'
  ) THEN
    -- Validar transações com regras anti-cheating (mínimo 5 transações válidas)
    SELECT public.validate_referral_transactions(NEW.user_id) INTO v_is_valid;
    
    IF v_is_valid THEN
      -- Concluir referral e dar recompensas
      SELECT public.complete_referral_reward(NEW.user_id) INTO v_result;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Atualizar função de stats para incluir progresso dos indicados pendentes
CREATE OR REPLACE FUNCTION public.get_referral_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_stats JSONB;
  v_referral_code TEXT;
  v_total_referrals INTEGER;
  v_pending_referrals INTEGER;
  v_completed_referrals INTEGER;
  v_total_xp_earned INTEGER;
  v_total_premium_days INTEGER;
  v_pending_progress JSONB;
BEGIN
  -- Validate caller
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get user's referral code
  SELECT referral_code INTO v_referral_code
  FROM public.profiles
  WHERE id = p_user_id;

  -- Count referrals
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status IN ('completed', 'rewarded'))
  INTO v_total_referrals, v_pending_referrals, v_completed_referrals
  FROM public.referrals
  WHERE referrer_id = p_user_id;

  -- Calculate rewards earned
  v_total_xp_earned := v_completed_referrals * 500;
  v_total_premium_days := v_completed_referrals * 7;

  -- Get progress of pending referrals (how many transactions each pending referral has)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'referred_id', r.referred_id,
      'transaction_count', COALESCE(t.tx_count, 0),
      'required_count', 5
    )
  ), '[]'::jsonb) INTO v_pending_progress
  FROM public.referrals r
  LEFT JOIN (
    SELECT user_id, COUNT(*) as tx_count
    FROM public.transactions
    GROUP BY user_id
  ) t ON t.user_id = r.referred_id
  WHERE r.referrer_id = p_user_id AND r.status = 'pending';

  RETURN jsonb_build_object(
    'referral_code', v_referral_code,
    'referral_link', 'https://moneyquest.app.br/r/' || v_referral_code,
    'total_referrals', v_total_referrals,
    'pending_referrals', v_pending_referrals,
    'completed_referrals', v_completed_referrals,
    'total_xp_earned', v_total_xp_earned,
    'total_premium_days', v_total_premium_days,
    'pending_progress', v_pending_progress
  );
END;
$$;