-- =====================================================
-- ENHANCED REFERRAL ANTI-FRAUD SYSTEM V2
-- =====================================================

-- 1. Create fraud analysis history table for admin review
CREATE TABLE IF NOT EXISTS public.referral_fraud_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0, -- 0-100
  risk_level TEXT NOT NULL DEFAULT 'low', -- low, medium, high, critical
  analysis_details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

-- Enable RLS
ALTER TABLE public.referral_fraud_analysis ENABLE ROW LEVEL SECURITY;

-- Only super admins can view fraud analysis
CREATE POLICY "Super admins can manage fraud analysis"
ON public.referral_fraud_analysis
FOR ALL
USING (is_super_admin(auth.uid()));

-- 2. Enhanced fraud detection function with risk scoring
CREATE OR REPLACE FUNCTION public.check_referral_fraud_v2(p_referrer_id UUID, p_referred_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_risk_score INTEGER := 0;
  v_risk_level TEXT := 'low';
  v_reasons TEXT[] := ARRAY[]::TEXT[];
  v_details JSONB := '{}'::JSONB;
  
  -- Fingerprint analysis
  v_same_fingerprint INTEGER;
  v_same_ip INTEGER;
  v_same_timezone INTEGER;
  v_similar_resolution INTEGER;
  v_similar_user_agent INTEGER;
  
  -- Transaction pattern analysis
  v_referred_tx_count INTEGER;
  v_avg_tx_interval_seconds NUMERIC;
  v_round_amounts_ratio NUMERIC;
  v_same_hour_ratio NUMERIC;
  v_weekend_only BOOLEAN;
  v_descriptions_similarity NUMERIC;
  
  -- Timing analysis
  v_account_age_hours NUMERIC;
  v_time_to_complete_hours NUMERIC;
  
  -- Referrer pattern analysis
  v_referrer_total_referrals INTEGER;
  v_referrer_suspicious_rate NUMERIC;
  
  -- Helper variables
  v_tx_data RECORD;
  v_profile_data RECORD;
BEGIN
  -- ===== FINGERPRINT ANALYSIS (max 40 points) =====
  
  -- Same fingerprint hash (CRITICAL - 25 points)
  SELECT COUNT(*) INTO v_same_fingerprint
  FROM public.user_fingerprints f1
  JOIN public.user_fingerprints f2 ON f1.fingerprint_hash = f2.fingerprint_hash
  WHERE f1.user_id = p_referrer_id AND f2.user_id = p_referred_id;
  
  IF v_same_fingerprint > 0 THEN
    v_risk_score := v_risk_score + 25;
    v_reasons := array_append(v_reasons, 'same_device_fingerprint');
  END IF;
  
  -- Same IP within 48 hours (HIGH - 15 points)
  SELECT COUNT(*) INTO v_same_ip
  FROM public.user_fingerprints f1
  JOIN public.user_fingerprints f2 ON f1.ip_address = f2.ip_address
  WHERE f1.user_id = p_referrer_id 
    AND f2.user_id = p_referred_id
    AND f1.ip_address IS NOT NULL
    AND ABS(EXTRACT(EPOCH FROM (f1.created_at - f2.created_at))) < 172800;
  
  IF v_same_ip > 0 THEN
    v_risk_score := v_risk_score + 15;
    v_reasons := array_append(v_reasons, 'same_ip_within_48h');
  END IF;
  
  -- Same timezone (MEDIUM - 5 points, common but adds to pattern)
  SELECT COUNT(*) INTO v_same_timezone
  FROM public.user_fingerprints f1
  JOIN public.user_fingerprints f2 ON f1.timezone = f2.timezone
  WHERE f1.user_id = p_referrer_id 
    AND f2.user_id = p_referred_id
    AND f1.timezone IS NOT NULL;
  
  IF v_same_timezone > 0 THEN
    v_risk_score := v_risk_score + 5;
    v_reasons := array_append(v_reasons, 'same_timezone');
  END IF;
  
  -- Similar screen resolution (MEDIUM - 5 points)
  SELECT COUNT(*) INTO v_similar_resolution
  FROM public.user_fingerprints f1
  JOIN public.user_fingerprints f2 ON f1.screen_resolution = f2.screen_resolution
  WHERE f1.user_id = p_referrer_id 
    AND f2.user_id = p_referred_id
    AND f1.screen_resolution IS NOT NULL;
  
  IF v_similar_resolution > 0 THEN
    v_risk_score := v_risk_score + 5;
    v_reasons := array_append(v_reasons, 'same_screen_resolution');
  END IF;
  
  -- Similar user agent (MEDIUM - 5 points)
  SELECT COUNT(*) INTO v_similar_user_agent
  FROM public.user_fingerprints f1
  JOIN public.user_fingerprints f2 
    ON SIMILARITY(COALESCE(f1.user_agent, ''), COALESCE(f2.user_agent, '')) > 0.8
  WHERE f1.user_id = p_referrer_id 
    AND f2.user_id = p_referred_id
    AND f1.user_agent IS NOT NULL;
  
  IF v_similar_user_agent > 0 THEN
    v_risk_score := v_risk_score + 5;
    v_reasons := array_append(v_reasons, 'similar_user_agent');
  END IF;
  
  -- ===== TRANSACTION PATTERN ANALYSIS (max 35 points) =====
  
  -- Get transaction stats for referred user
  SELECT 
    COUNT(*) as tx_count,
    AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))) as avg_interval,
    SUM(CASE WHEN MOD(amount::INTEGER, 10) = 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) as round_ratio,
    SUM(CASE WHEN EXTRACT(HOUR FROM created_at) = EXTRACT(HOUR FROM MIN(created_at) OVER ()) THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) as same_hour_ratio,
    BOOL_AND(EXTRACT(DOW FROM date) IN (0, 6)) as weekend_only
  INTO v_tx_data
  FROM public.transactions
  WHERE user_id = p_referred_id;
  
  v_referred_tx_count := COALESCE(v_tx_data.tx_count, 0);
  v_avg_tx_interval_seconds := COALESCE(v_tx_data.avg_interval, 999999);
  v_round_amounts_ratio := COALESCE(v_tx_data.round_ratio, 0);
  v_same_hour_ratio := COALESCE(v_tx_data.same_hour_ratio, 0);
  v_weekend_only := COALESCE(v_tx_data.weekend_only, FALSE);
  
  -- Transactions created too fast (avg < 60 seconds apart) - HIGH 15 points
  IF v_referred_tx_count >= 5 AND v_avg_tx_interval_seconds < 60 THEN
    v_risk_score := v_risk_score + 15;
    v_reasons := array_append(v_reasons, 'transactions_too_fast');
  -- Transactions moderately fast (< 5 min apart) - MEDIUM 8 points
  ELSIF v_referred_tx_count >= 5 AND v_avg_tx_interval_seconds < 300 THEN
    v_risk_score := v_risk_score + 8;
    v_reasons := array_append(v_reasons, 'transactions_suspiciously_quick');
  END IF;
  
  -- All amounts are round numbers (>80%) - MEDIUM 10 points
  IF v_referred_tx_count >= 5 AND v_round_amounts_ratio > 0.8 THEN
    v_risk_score := v_risk_score + 10;
    v_reasons := array_append(v_reasons, 'mostly_round_amounts');
  END IF;
  
  -- All transactions at same hour - MEDIUM 10 points
  IF v_referred_tx_count >= 5 AND v_same_hour_ratio > 0.8 THEN
    v_risk_score := v_risk_score + 10;
    v_reasons := array_append(v_reasons, 'same_hour_pattern');
  END IF;
  
  -- Check for similar descriptions between referrer and referred
  SELECT COUNT(*)::NUMERIC / NULLIF(
    (SELECT COUNT(*) FROM public.transactions WHERE user_id = p_referred_id), 1
  ) INTO v_descriptions_similarity
  FROM public.transactions t1
  WHERE t1.user_id = p_referred_id
    AND EXISTS (
      SELECT 1 FROM public.transactions t2 
      WHERE t2.user_id = p_referrer_id 
        AND LOWER(t1.description) = LOWER(t2.description)
    );
  
  -- High similarity in descriptions - HIGH 15 points
  IF COALESCE(v_descriptions_similarity, 0) > 0.5 THEN
    v_risk_score := v_risk_score + 15;
    v_reasons := array_append(v_reasons, 'similar_descriptions_to_referrer');
  END IF;
  
  -- ===== TIMING ANALYSIS (max 15 points) =====
  
  -- Get account age and time to complete referral
  SELECT 
    EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600 as account_age_hours,
    EXTRACT(EPOCH FROM (COALESCE(r.completed_at, now()) - p.created_at)) / 3600 as time_to_complete_hours
  INTO v_profile_data
  FROM public.profiles p
  LEFT JOIN public.referrals r ON r.referred_id = p.id
  WHERE p.id = p_referred_id;
  
  v_account_age_hours := COALESCE(v_profile_data.account_age_hours, 0);
  v_time_to_complete_hours := COALESCE(v_profile_data.time_to_complete_hours, 999999);
  
  -- Completed referral requirements very quickly (<2 hours) - HIGH 15 points
  IF v_time_to_complete_hours < 2 THEN
    v_risk_score := v_risk_score + 15;
    v_reasons := array_append(v_reasons, 'completed_too_quickly');
  -- Completed quickly (<6 hours) - MEDIUM 8 points
  ELSIF v_time_to_complete_hours < 6 THEN
    v_risk_score := v_risk_score + 8;
    v_reasons := array_append(v_reasons, 'completed_suspiciously_fast');
  END IF;
  
  -- ===== REFERRER PATTERN ANALYSIS (max 10 points) =====
  
  -- Check referrer's suspicious referral rate
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN flagged_as_suspicious THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) as suspicious_rate
  INTO v_referrer_total_referrals, v_referrer_suspicious_rate
  FROM public.referrals
  WHERE referrer_id = p_referrer_id;
  
  -- Referrer has high rate of suspicious referrals - HIGH 10 points
  IF v_referrer_total_referrals >= 3 AND COALESCE(v_referrer_suspicious_rate, 0) > 0.3 THEN
    v_risk_score := v_risk_score + 10;
    v_reasons := array_append(v_reasons, 'referrer_high_suspicious_rate');
  END IF;
  
  -- ===== CALCULATE RISK LEVEL =====
  
  IF v_risk_score >= 50 THEN
    v_risk_level := 'critical';
  ELSIF v_risk_score >= 35 THEN
    v_risk_level := 'high';
  ELSIF v_risk_score >= 20 THEN
    v_risk_level := 'medium';
  ELSE
    v_risk_level := 'low';
  END IF;
  
  -- Build details object
  v_details := jsonb_build_object(
    'fingerprint_analysis', jsonb_build_object(
      'same_fingerprint', v_same_fingerprint > 0,
      'same_ip', v_same_ip > 0,
      'same_timezone', v_same_timezone > 0,
      'same_resolution', v_similar_resolution > 0,
      'similar_user_agent', v_similar_user_agent > 0
    ),
    'transaction_analysis', jsonb_build_object(
      'count', v_referred_tx_count,
      'avg_interval_seconds', v_avg_tx_interval_seconds,
      'round_amounts_ratio', v_round_amounts_ratio,
      'same_hour_ratio', v_same_hour_ratio,
      'descriptions_similarity', v_descriptions_similarity
    ),
    'timing_analysis', jsonb_build_object(
      'account_age_hours', v_account_age_hours,
      'time_to_complete_hours', v_time_to_complete_hours
    ),
    'referrer_analysis', jsonb_build_object(
      'total_referrals', v_referrer_total_referrals,
      'suspicious_rate', v_referrer_suspicious_rate
    )
  );
  
  -- Log analysis to history table if risk is medium or higher
  IF v_risk_score >= 20 THEN
    INSERT INTO public.referral_fraud_analysis (
      referral_id,
      referrer_id,
      referred_id,
      risk_score,
      risk_level,
      analysis_details
    )
    SELECT 
      r.id,
      p_referrer_id,
      p_referred_id,
      v_risk_score,
      v_risk_level,
      jsonb_build_object(
        'reasons', v_reasons,
        'details', v_details
      )
    FROM public.referrals r
    WHERE r.referrer_id = p_referrer_id AND r.referred_id = p_referred_id
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN jsonb_build_object(
    'risk_score', v_risk_score,
    'risk_level', v_risk_level,
    'is_suspicious', v_risk_score >= 35,
    'reasons', v_reasons,
    'details', v_details
  );
END;
$$;

-- 3. Enhanced transaction validation with stricter rules
CREATE OR REPLACE FUNCTION public.validate_referral_transactions_v2(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_transaction_count INTEGER;
  v_unique_days INTEGER;
  v_unique_categories INTEGER;
  v_unique_amounts INTEGER;
  v_unique_descriptions INTEGER;
  v_unique_wallets INTEGER;
  v_min_span_days INTEGER;
  v_is_valid BOOLEAN := FALSE;
  v_reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Contar transações totais
  SELECT COUNT(*) INTO v_transaction_count
  FROM public.transactions
  WHERE user_id = p_user_id;
  
  -- Mínimo de 5 transações
  IF v_transaction_count < 5 THEN
    v_reasons := array_append(v_reasons, 'min_5_transactions_required');
    RETURN jsonb_build_object('is_valid', FALSE, 'reasons', v_reasons, 'transaction_count', v_transaction_count);
  END IF;
  
  -- Obter estatísticas de diversidade
  SELECT 
    COUNT(DISTINCT date),
    COUNT(DISTINCT category),
    COUNT(DISTINCT amount),
    COUNT(DISTINCT LOWER(TRIM(description))),
    COUNT(DISTINCT wallet_id),
    COALESCE(MAX(date) - MIN(date), 0)
  INTO v_unique_days, v_unique_categories, v_unique_amounts, v_unique_descriptions, v_unique_wallets, v_min_span_days
  FROM public.transactions 
  WHERE user_id = p_user_id;
  
  -- Validação: pelo menos 3 dias diferentes
  IF v_unique_days < 3 THEN
    v_reasons := array_append(v_reasons, 'min_3_different_days_required');
  END IF;
  
  -- Validação: pelo menos 3 categorias diferentes
  IF v_unique_categories < 3 THEN
    v_reasons := array_append(v_reasons, 'min_3_different_categories_required');
  END IF;
  
  -- Validação: pelo menos 4 valores diferentes
  IF v_unique_amounts < 4 THEN
    v_reasons := array_append(v_reasons, 'min_4_different_amounts_required');
  END IF;
  
  -- Validação: pelo menos 3 descrições únicas
  IF v_unique_descriptions < 3 THEN
    v_reasons := array_append(v_reasons, 'min_3_different_descriptions_required');
  END IF;
  
  -- Validação: transações devem abranger pelo menos 2 dias de intervalo
  IF v_min_span_days < 2 THEN
    v_reasons := array_append(v_reasons, 'transactions_span_min_2_days');
  END IF;
  
  -- Considerar válido se passar em 4 das 5 verificações
  v_is_valid := array_length(v_reasons, 1) IS NULL OR array_length(v_reasons, 1) <= 1;
  
  RETURN jsonb_build_object(
    'is_valid', v_is_valid,
    'reasons', v_reasons,
    'stats', jsonb_build_object(
      'transaction_count', v_transaction_count,
      'unique_days', v_unique_days,
      'unique_categories', v_unique_categories,
      'unique_amounts', v_unique_amounts,
      'unique_descriptions', v_unique_descriptions,
      'unique_wallets', v_unique_wallets,
      'span_days', v_min_span_days
    )
  );
END;
$$;

-- 4. Update the original functions to use new versions
CREATE OR REPLACE FUNCTION public.check_referral_fraud(p_referrer_id UUID, p_referred_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Call enhanced version
  v_result := public.check_referral_fraud_v2(p_referrer_id, p_referred_id);
  
  -- Return in legacy format for backward compatibility
  RETURN jsonb_build_object(
    'is_suspicious', (v_result->>'is_suspicious')::boolean,
    'reason', COALESCE((v_result->'reasons'->>0), NULL),
    'same_fingerprint_count', CASE WHEN (v_result->'details'->'fingerprint_analysis'->>'same_fingerprint')::boolean THEN 1 ELSE 0 END,
    'same_ip_count', CASE WHEN (v_result->'details'->'fingerprint_analysis'->>'same_ip')::boolean THEN 1 ELSE 0 END,
    'risk_score', (v_result->>'risk_score')::integer,
    'risk_level', v_result->>'risk_level'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_referral_transactions(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Call enhanced version
  v_result := public.validate_referral_transactions_v2(p_user_id);
  
  -- Return boolean for backward compatibility
  RETURN (v_result->>'is_valid')::boolean;
END;
$$;

-- 5. Admin function to get detailed fraud analysis
CREATE OR REPLACE FUNCTION public.admin_get_fraud_analysis()
RETURNS TABLE (
  id UUID,
  referral_id UUID,
  referrer_id UUID,
  referrer_name TEXT,
  referred_id UUID,
  referred_name TEXT,
  risk_score INTEGER,
  risk_level TEXT,
  reasons TEXT[],
  analysis_details JSONB,
  created_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  referral_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify admin access
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;
  
  RETURN QUERY
  SELECT 
    fa.id,
    fa.referral_id,
    fa.referrer_id,
    COALESCE(p1.display_name, 'Unknown') as referrer_name,
    fa.referred_id,
    COALESCE(p2.display_name, 'Unknown') as referred_name,
    fa.risk_score,
    fa.risk_level,
    ARRAY(SELECT jsonb_array_elements_text(fa.analysis_details->'reasons')) as reasons,
    fa.analysis_details->'details' as analysis_details,
    fa.created_at,
    fa.reviewed_at,
    COALESCE(r.status, 'unknown') as referral_status
  FROM public.referral_fraud_analysis fa
  LEFT JOIN public.profiles p1 ON p1.id = fa.referrer_id
  LEFT JOIN public.profiles p2 ON p2.id = fa.referred_id
  LEFT JOIN public.referrals r ON r.id = fa.referral_id
  ORDER BY fa.risk_score DESC, fa.created_at DESC;
END;
$$;

-- 6. Function to mark fraud analysis as reviewed
CREATE OR REPLACE FUNCTION public.admin_mark_fraud_reviewed(p_analysis_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;
  
  UPDATE public.referral_fraud_analysis
  SET reviewed_at = now(), reviewed_by = auth.uid()
  WHERE id = p_analysis_id;
END;
$$;