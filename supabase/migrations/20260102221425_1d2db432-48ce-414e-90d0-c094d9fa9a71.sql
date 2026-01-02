-- Create function to get user's referral tier based on completed referrals
CREATE OR REPLACE FUNCTION public.get_referral_tier(p_completed_count INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_tier TEXT;
  v_tier_icon TEXT;
  v_next_tier TEXT;
  v_next_tier_icon TEXT;
  v_progress_to_next INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Determine current tier
  IF p_completed_count >= 15 THEN
    v_tier := 'gold';
    v_tier_icon := '🥇';
    v_next_tier := NULL;
    v_next_tier_icon := NULL;
    v_progress_to_next := 100;
    v_remaining := 0;
  ELSIF p_completed_count >= 5 THEN
    v_tier := 'silver';
    v_tier_icon := '🥈';
    v_next_tier := 'gold';
    v_next_tier_icon := '🥇';
    v_progress_to_next := ROUND(((p_completed_count - 5)::numeric / 10) * 100);
    v_remaining := 15 - p_completed_count;
  ELSIF p_completed_count >= 1 THEN
    v_tier := 'bronze';
    v_tier_icon := '🥉';
    v_next_tier := 'silver';
    v_next_tier_icon := '🥈';
    v_progress_to_next := ROUND(((p_completed_count - 1)::numeric / 4) * 100);
    v_remaining := 5 - p_completed_count;
  ELSE
    v_tier := 'none';
    v_tier_icon := '⭐';
    v_next_tier := 'bronze';
    v_next_tier_icon := '🥉';
    v_progress_to_next := 0;
    v_remaining := 1;
  END IF;

  RETURN jsonb_build_object(
    'tier', v_tier,
    'tier_icon', v_tier_icon,
    'next_tier', v_next_tier,
    'next_tier_icon', v_next_tier_icon,
    'progress_to_next', v_progress_to_next,
    'remaining', v_remaining,
    'completed_count', p_completed_count
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Create admin function to get suspicious referrals for review
CREATE OR REPLACE FUNCTION public.admin_get_suspicious_referrals()
RETURNS TABLE (
  id UUID,
  referrer_id UUID,
  referred_id UUID,
  referral_code TEXT,
  status TEXT,
  flagged_as_suspicious BOOLEAN,
  suspicion_reason TEXT,
  created_at TIMESTAMPTZ,
  referrer_email TEXT,
  referrer_name TEXT,
  referred_email TEXT,
  referred_name TEXT,
  transaction_count BIGINT
) AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    r.id,
    r.referrer_id,
    r.referred_id,
    r.referral_code,
    r.status,
    COALESCE(r.flagged_as_suspicious, false),
    r.suspicion_reason,
    r.created_at,
    (SELECT email FROM auth.users WHERE auth.users.id = r.referrer_id) as referrer_email,
    COALESCE(p_referrer.display_name, 'Unknown') as referrer_name,
    (SELECT email FROM auth.users WHERE auth.users.id = r.referred_id) as referred_email,
    COALESCE(p_referred.display_name, 'Unknown') as referred_name,
    (SELECT COUNT(*) FROM public.transactions WHERE user_id = r.referred_id) as transaction_count
  FROM public.referrals r
  LEFT JOIN public.profiles p_referrer ON p_referrer.id = r.referrer_id
  LEFT JOIN public.profiles p_referred ON p_referred.id = r.referred_id
  WHERE r.flagged_as_suspicious = true OR r.status = 'pending'
  ORDER BY r.flagged_as_suspicious DESC, r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create admin function to approve a suspicious referral
CREATE OR REPLACE FUNCTION public.admin_approve_referral(
  p_referral_id UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_referral RECORD;
  v_result JSONB;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  -- Get the referral
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE id = p_referral_id;
  
  IF v_referral IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral not found');
  END IF;
  
  -- Clear suspicious flag
  UPDATE public.referrals
  SET 
    flagged_as_suspicious = false,
    suspicion_reason = NULL,
    reviewed_at = now(),
    reviewed_by = auth.uid()
  WHERE id = p_referral_id;
  
  -- If the referral was pending and transactions are validated, complete it
  IF v_referral.status = 'pending' THEN
    IF public.validate_referral_transactions(v_referral.referred_id) THEN
      SELECT public.complete_referral_reward(v_referral.referred_id) INTO v_result;
    END IF;
  END IF;
  
  -- Log the action
  INSERT INTO public.admin_logs (admin_id, action_type, target_user_id, details, note)
  VALUES (
    auth.uid(),
    'APPROVE_REFERRAL',
    v_referral.referrer_id,
    jsonb_build_object('referral_id', p_referral_id, 'referred_id', v_referral.referred_id),
    p_note
  );
  
  RETURN jsonb_build_object('success', true, 'reward_result', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create admin function to reject a suspicious referral
CREATE OR REPLACE FUNCTION public.admin_reject_referral(
  p_referral_id UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_referral RECORD;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  -- Get the referral
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE id = p_referral_id;
  
  IF v_referral IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral not found');
  END IF;
  
  -- Mark as rejected
  UPDATE public.referrals
  SET 
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = auth.uid()
  WHERE id = p_referral_id;
  
  -- Log the action
  INSERT INTO public.admin_logs (admin_id, action_type, target_user_id, details, note)
  VALUES (
    auth.uid(),
    'REJECT_REFERRAL',
    v_referral.referrer_id,
    jsonb_build_object('referral_id', p_referral_id, 'referred_id', v_referral.referred_id, 'reason', v_referral.suspicion_reason),
    p_note
  );
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update get_detailed_referral_stats to include tier info
CREATE OR REPLACE FUNCTION public.get_detailed_referral_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referred_list JSONB;
  v_reward_history JSONB;
  v_ranking JSONB;
  v_user_rank INTEGER;
  v_referral_code TEXT;
  v_completed_count INTEGER;
  v_tier_info JSONB;
BEGIN
  -- Validate caller
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get user's referral code
  SELECT referral_code INTO v_referral_code
  FROM public.profiles WHERE id = p_user_id;

  -- Get completed referrals count
  SELECT COUNT(*) INTO v_completed_count
  FROM public.referrals
  WHERE referrer_id = p_user_id AND status IN ('completed', 'rewarded');

  -- Get tier info
  SELECT public.get_referral_tier(v_completed_count) INTO v_tier_info;

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
      'rank', rank,
      'tier', (public.get_referral_tier(completed_count::integer))->>'tier',
      'tier_icon', (public.get_referral_tier(completed_count::integer))->>'tier_icon'
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
    'user_rank', v_user_rank,
    'tier', v_tier_info
  );
END;
$$;