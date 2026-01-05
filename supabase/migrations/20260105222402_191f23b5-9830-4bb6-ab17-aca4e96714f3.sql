-- Update fraud check to also consider fingerprint whitelist
CREATE OR REPLACE FUNCTION public.check_referral_fraud_v2(p_referrer_id uuid, p_referred_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_risk_score INTEGER := 0;
  v_risk_level TEXT := 'low';
  v_reasons TEXT[] := ARRAY[]::TEXT[];
  v_referrer_fingerprint RECORD;
  v_referred_fingerprint RECORD;
  v_same_fingerprint INTEGER;
  v_same_ip INTEGER;
  v_same_timezone INTEGER;
  v_same_resolution INTEGER;
  v_similar_user_agent INTEGER;
  v_referrer_suspicious_rate NUMERIC;
  v_referred_transactions RECORD;
  v_transaction_similarity INTEGER;
  v_completion_hours INTEGER;
  v_analysis_details JSONB;
  v_is_ip_whitelisted BOOLEAN := false;
  v_is_fingerprint_whitelisted BOOLEAN := false;
  v_whitelisted_org TEXT;
  v_fingerprint_whitelist JSONB;
BEGIN
  -- Get fingerprints
  SELECT * INTO v_referrer_fingerprint 
  FROM user_fingerprints 
  WHERE user_id = p_referrer_id 
  ORDER BY created_at DESC LIMIT 1;
  
  SELECT * INTO v_referred_fingerprint 
  FROM user_fingerprints 
  WHERE user_id = p_referred_id 
  ORDER BY created_at DESC LIMIT 1;

  -- Check if referred user's IP is whitelisted
  IF v_referred_fingerprint.ip_address IS NOT NULL THEN
    SELECT true, organization INTO v_is_ip_whitelisted, v_whitelisted_org
    FROM ip_whitelist
    WHERE ip_address = v_referred_fingerprint.ip_address
      AND is_active = true
    LIMIT 1;
    
    IF v_is_ip_whitelisted THEN
      v_reasons := array_append(v_reasons, 'ip_whitelisted');
    END IF;
  END IF;

  -- Check if referrer's fingerprint is whitelisted (developer testing)
  SELECT setting_value INTO v_fingerprint_whitelist
  FROM admin_settings 
  WHERE setting_key = 'fingerprint_whitelist';
  
  IF v_fingerprint_whitelist IS NOT NULL AND v_referrer_fingerprint.fingerprint_hash IS NOT NULL THEN
    SELECT true INTO v_is_fingerprint_whitelisted
    FROM jsonb_array_elements(v_fingerprint_whitelist) AS elem
    WHERE elem->>'fingerprint_hash' = v_referrer_fingerprint.fingerprint_hash
      AND (elem->>'is_active')::boolean = true
    LIMIT 1;
    
    IF v_is_fingerprint_whitelisted THEN
      v_reasons := array_append(v_reasons, 'developer_fingerprint_whitelisted');
      -- Return immediately with zero risk for whitelisted developers
      v_analysis_details := jsonb_build_object(
        'referrer_fingerprint', v_referrer_fingerprint.fingerprint_hash,
        'referred_fingerprint', v_referred_fingerprint.fingerprint_hash,
        'is_fingerprint_whitelisted', true
      );
      
      RETURN json_build_object(
        'risk_score', 0,
        'risk_level', 'whitelisted',
        'is_abuse', false,
        'reasons', v_reasons,
        'analysis', v_analysis_details
      );
    END IF;
  END IF;

  -- ========== FINGERPRINT ANALYSIS ==========
  
  -- Check exact fingerprint match (CRITICAL - same device)
  SELECT COUNT(*) INTO v_same_fingerprint
  FROM user_fingerprints
  WHERE fingerprint_hash = v_referred_fingerprint.fingerprint_hash
    AND user_id = p_referrer_id;
  
  IF v_same_fingerprint > 0 THEN
    v_risk_score := v_risk_score + 25;
    v_reasons := array_append(v_reasons, 'same_device_fingerprint');
  END IF;

  -- Check same IP (only if NOT whitelisted)
  IF NOT COALESCE(v_is_ip_whitelisted, false) THEN
    SELECT COUNT(*) INTO v_same_ip
    FROM user_fingerprints
    WHERE ip_address = v_referred_fingerprint.ip_address
      AND user_id = p_referrer_id
      AND created_at > NOW() - INTERVAL '48 hours';
    
    IF v_same_ip > 0 THEN
      v_risk_score := v_risk_score + 5;
      v_reasons := array_append(v_reasons, 'same_ip_network');
      
      -- Discount if fingerprints are different
      IF v_same_fingerprint = 0 THEN
        v_risk_score := v_risk_score - 5;
        v_reasons := array_append(v_reasons, 'different_devices_same_network');
      END IF;
      
      -- Check similar user-agent combo
      SELECT COUNT(*) INTO v_similar_user_agent
      FROM user_fingerprints
      WHERE user_id = p_referrer_id
        AND v_referred_fingerprint.user_agent IS NOT NULL
        AND user_agent IS NOT NULL
        AND similarity(user_agent, v_referred_fingerprint.user_agent) > 0.8;
      
      IF v_similar_user_agent > 0 THEN
        v_risk_score := v_risk_score + 15;
        v_reasons := array_append(v_reasons, 'same_ip_and_user_agent_combo');
      END IF;
    END IF;
  ELSE
    v_same_ip := 0;
  END IF;

  -- Check same timezone (weak, only with fingerprint match)
  SELECT COUNT(*) INTO v_same_timezone
  FROM user_fingerprints
  WHERE timezone = v_referred_fingerprint.timezone
    AND user_id = p_referrer_id;
  
  IF v_same_timezone > 0 AND v_same_fingerprint > 0 THEN
    v_risk_score := v_risk_score + 3;
    v_reasons := array_append(v_reasons, 'same_timezone');
  END IF;

  -- Check same screen resolution (weak)
  SELECT COUNT(*) INTO v_same_resolution
  FROM user_fingerprints
  WHERE screen_resolution = v_referred_fingerprint.screen_resolution
    AND user_id = p_referrer_id;
  
  IF v_same_resolution > 0 AND v_same_fingerprint > 0 THEN
    v_risk_score := v_risk_score + 2;
    v_reasons := array_append(v_reasons, 'same_screen_resolution');
  END IF;

  -- ========== TRANSACTION PATTERN ANALYSIS ==========
  
  SELECT 
    COUNT(*) as total_count,
    COUNT(DISTINCT date) as unique_days,
    COUNT(DISTINCT category) as unique_categories,
    MIN(created_at) as first_transaction,
    MAX(created_at) as last_transaction,
    EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/3600 as hours_span
  INTO v_referred_transactions
  FROM transactions
  WHERE user_id = p_referred_id;

  -- Check if transactions are suspiciously fast
  IF v_referred_transactions.total_count >= 5 THEN
    v_completion_hours := COALESCE(v_referred_transactions.hours_span::INTEGER, 0);
    
    IF v_completion_hours < 1 THEN
      v_risk_score := v_risk_score + 15;
      v_reasons := array_append(v_reasons, 'transactions_completed_too_fast');
    ELSIF v_completion_hours < 6 THEN
      v_risk_score := v_risk_score + 8;
      v_reasons := array_append(v_reasons, 'transactions_completed_quickly');
    END IF;
    
    -- Check transaction diversity
    IF v_referred_transactions.unique_days < 2 THEN
      v_risk_score := v_risk_score + 5;
      v_reasons := array_append(v_reasons, 'low_day_diversity');
    END IF;
    
    IF v_referred_transactions.unique_categories < 2 THEN
      v_risk_score := v_risk_score + 5;
      v_reasons := array_append(v_reasons, 'low_category_diversity');
    END IF;
  END IF;

  -- ========== REFERRER PATTERN ANALYSIS ==========
  
  -- Check referrer's suspicious rate
  SELECT 
    COUNT(*) FILTER (WHERE flagged_as_suspicious = true)::NUMERIC / 
    NULLIF(COUNT(*)::NUMERIC, 0) * 100
  INTO v_referrer_suspicious_rate
  FROM referrals
  WHERE referrer_id = p_referrer_id;
  
  IF COALESCE(v_referrer_suspicious_rate, 0) > 30 THEN
    v_risk_score := v_risk_score + 10;
    v_reasons := array_append(v_reasons, 'referrer_high_suspicious_rate');
  END IF;

  -- ========== DETERMINE RISK LEVEL ==========
  
  IF v_risk_score >= 30 THEN
    v_risk_level := 'high';
  ELSIF v_risk_score >= 15 THEN
    v_risk_level := 'medium';
  ELSE
    v_risk_level := 'low';
  END IF;

  -- Build analysis details
  v_analysis_details := jsonb_build_object(
    'referrer_fingerprint', v_referrer_fingerprint.fingerprint_hash,
    'referred_fingerprint', v_referred_fingerprint.fingerprint_hash,
    'same_fingerprint', v_same_fingerprint > 0,
    'same_ip', v_same_ip > 0,
    'is_ip_whitelisted', COALESCE(v_is_ip_whitelisted, false),
    'is_fingerprint_whitelisted', COALESCE(v_is_fingerprint_whitelisted, false),
    'transaction_stats', jsonb_build_object(
      'count', COALESCE(v_referred_transactions.total_count, 0),
      'unique_days', COALESCE(v_referred_transactions.unique_days, 0),
      'unique_categories', COALESCE(v_referred_transactions.unique_categories, 0),
      'hours_span', COALESCE(v_referred_transactions.hours_span::INTEGER, 0)
    )
  );

  RETURN json_build_object(
    'risk_score', v_risk_score,
    'risk_level', v_risk_level,
    'is_abuse', v_risk_score >= 30,
    'reasons', v_reasons,
    'analysis', v_analysis_details
  );
END;
$function$;