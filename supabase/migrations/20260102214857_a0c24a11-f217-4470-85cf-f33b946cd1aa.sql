-- Tabela para armazenar fingerprints de dispositivos
CREATE TABLE public.user_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, fingerprint_hash)
);

-- Índices para busca rápida de fraude
CREATE INDEX idx_fingerprints_hash ON public.user_fingerprints(fingerprint_hash);
CREATE INDEX idx_fingerprints_ip ON public.user_fingerprints(ip_address);
CREATE INDEX idx_fingerprints_user ON public.user_fingerprints(user_id);

-- RLS: usuários podem inserir próprios fingerprints
ALTER TABLE public.user_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own fingerprint" 
ON public.user_fingerprints FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own fingerprints" 
ON public.user_fingerprints FOR SELECT 
USING (auth.uid() = user_id);

-- Adicionar colunas de suspeita na tabela referrals
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS flagged_as_suspicious BOOLEAN DEFAULT false;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS suspicion_reason TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- Função para detectar fraude de referral
CREATE OR REPLACE FUNCTION public.check_referral_fraud(p_referrer_id UUID, p_referred_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_same_fingerprint INTEGER;
  v_same_ip INTEGER;
  v_is_suspicious BOOLEAN := FALSE;
  v_reason TEXT := NULL;
BEGIN
  -- Verificar se há fingerprints idênticos entre referrer e referred
  SELECT COUNT(*) INTO v_same_fingerprint
  FROM public.user_fingerprints f1
  JOIN public.user_fingerprints f2 ON f1.fingerprint_hash = f2.fingerprint_hash
  WHERE f1.user_id = p_referrer_id AND f2.user_id = p_referred_id;
  
  -- Verificar se há IPs idênticos dentro de 24 horas
  SELECT COUNT(*) INTO v_same_ip
  FROM public.user_fingerprints f1
  JOIN public.user_fingerprints f2 ON f1.ip_address = f2.ip_address
  WHERE f1.user_id = p_referrer_id 
    AND f2.user_id = p_referred_id
    AND f1.ip_address IS NOT NULL
    AND ABS(EXTRACT(EPOCH FROM (f1.created_at - f2.created_at))) < 86400;
  
  IF v_same_fingerprint > 0 THEN
    v_is_suspicious := TRUE;
    v_reason := 'same_device_fingerprint';
  ELSIF v_same_ip > 0 THEN
    v_is_suspicious := TRUE;
    v_reason := 'same_ip_within_24h';
  END IF;
  
  RETURN jsonb_build_object(
    'is_suspicious', v_is_suspicious,
    'reason', v_reason,
    'same_fingerprint_count', v_same_fingerprint,
    'same_ip_count', v_same_ip
  );
END;
$$;

-- Atualizar trigger de validação de referral para incluir anti-fraude
CREATE OR REPLACE FUNCTION public.check_referral_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_valid BOOLEAN;
  v_fraud_check JSONB;
  v_referral RECORD;
  v_result JSONB;
BEGIN
  -- Verificar se usuário tem referral pendente
  SELECT * INTO v_referral
  FROM public.referrals 
  WHERE referred_id = NEW.user_id AND status = 'pending'
  LIMIT 1;
  
  IF v_referral IS NOT NULL THEN
    -- Validar transações com regras anti-cheating (mínimo 5 transações válidas)
    SELECT public.validate_referral_transactions(NEW.user_id) INTO v_is_valid;
    
    IF v_is_valid THEN
      -- Verificar fraude (mesmo dispositivo/IP)
      SELECT public.check_referral_fraud(v_referral.referrer_id, NEW.user_id) INTO v_fraud_check;
      
      IF (v_fraud_check->>'is_suspicious')::boolean THEN
        -- Marcar como suspeito mas não dar recompensa
        UPDATE public.referrals
        SET 
          flagged_as_suspicious = true,
          suspicion_reason = v_fraud_check->>'reason'
        WHERE id = v_referral.id;
      ELSE
        -- Concluir referral e dar recompensas
        SELECT public.complete_referral_reward(NEW.user_id) INTO v_result;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Função para obter estatísticas detalhadas de referral
CREATE OR REPLACE FUNCTION public.get_detailed_referral_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referred_list JSONB;
  v_reward_history JSONB;
  v_ranking JSONB;
  v_user_rank INTEGER;
  v_referral_code TEXT;
BEGIN
  -- Validate caller
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get user's referral code
  SELECT referral_code INTO v_referral_code
  FROM public.profiles WHERE id = p_user_id;

  -- Lista de todos os indicados com progresso
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'referred_id', r.referred_id,
      'status', r.status,
      'flagged_as_suspicious', COALESCE(r.flagged_as_suspicious, false),
      'suspicion_reason', r.suspicion_reason,
      'created_at', r.created_at,
      'completed_at', r.completed_at,
      'transaction_count', COALESCE(t.tx_count, 0),
      'required_count', 5
    ) ORDER BY r.created_at DESC
  ), '[]'::jsonb) INTO v_referred_list
  FROM public.referrals r
  LEFT JOIN (
    SELECT user_id, COUNT(*) as tx_count
    FROM public.transactions
    GROUP BY user_id
  ) t ON t.user_id = r.referred_id
  WHERE r.referrer_id = p_user_id;

  -- Histórico de recompensas do usuário
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', xh.id,
      'xp_change', xh.xp_change,
      'description', xh.description,
      'created_at', xh.created_at,
      'source_id', xh.source_id
    ) ORDER BY xh.created_at DESC
  ), '[]'::jsonb) INTO v_reward_history
  FROM public.xp_history xh
  WHERE xh.user_id = p_user_id 
    AND xh.source IN ('referral', 'referral_bonus');

  -- Top 10 ranking de indicadores
  WITH referrer_stats AS (
    SELECT 
      referrer_id,
      COUNT(*) FILTER (WHERE status IN ('completed', 'rewarded')) as completed_count,
      COUNT(*) as total_count
    FROM public.referrals
    GROUP BY referrer_id
    HAVING COUNT(*) FILTER (WHERE status IN ('completed', 'rewarded')) > 0
  ),
  ranked AS (
    SELECT 
      rs.referrer_id,
      rs.completed_count,
      COALESCE(p.display_name, 'Anônimo') as display_name,
      p.avatar_icon,
      ROW_NUMBER() OVER (ORDER BY rs.completed_count DESC) as rank
    FROM referrer_stats rs
    JOIN public.profiles p ON p.id = rs.referrer_id
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'referrer_id', referrer_id,
      'display_name', display_name,
      'avatar_icon', avatar_icon,
      'completed_count', completed_count,
      'rank', rank
    ) ORDER BY rank
  ), '[]'::jsonb) INTO v_ranking
  FROM ranked
  WHERE rank <= 10;

  -- Posição do usuário no ranking
  WITH referrer_stats AS (
    SELECT 
      referrer_id,
      COUNT(*) FILTER (WHERE status IN ('completed', 'rewarded')) as completed_count
    FROM public.referrals
    GROUP BY referrer_id
  ),
  ranked AS (
    SELECT 
      referrer_id,
      ROW_NUMBER() OVER (ORDER BY completed_count DESC) as rank
    FROM referrer_stats
    WHERE completed_count > 0
  )
  SELECT rank INTO v_user_rank
  FROM ranked
  WHERE referrer_id = p_user_id;

  RETURN jsonb_build_object(
    'referral_code', v_referral_code,
    'referred_list', v_referred_list,
    'reward_history', v_reward_history,
    'ranking', v_ranking,
    'user_rank', v_user_rank
  );
END;
$$;