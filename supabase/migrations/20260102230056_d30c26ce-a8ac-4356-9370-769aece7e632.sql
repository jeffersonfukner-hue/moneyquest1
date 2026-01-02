-- BUG 3: Corrigir badges de referral concedidos incorretamente

-- 1. Resetar TODOS os badges de referral para usuários sem referrals válidos
UPDATE public.badges
SET 
  is_unlocked = false,
  unlocked_at = NULL
WHERE name IN ('Referral Bronze', 'Referral Silver', 'Referral Gold')
  AND user_id NOT IN (
    SELECT DISTINCT referrer_id 
    FROM public.referrals 
    WHERE status IN ('completed', 'rewarded')
      AND referrer_id != referred_id -- Proteção contra auto-referral
  );

-- 2. Revalidar badges baseado em contagem real de referrals completados
WITH referral_counts AS (
  SELECT 
    referrer_id,
    COUNT(*) as completed_count
  FROM public.referrals
  WHERE status IN ('completed', 'rewarded')
    AND referrer_id != referred_id
  GROUP BY referrer_id
)
UPDATE public.badges b
SET 
  is_unlocked = true,
  unlocked_at = NOW()
FROM referral_counts rc
WHERE b.user_id = rc.referrer_id
  AND (
    (b.name = 'Referral Bronze' AND rc.completed_count >= 1) OR
    (b.name = 'Referral Silver' AND rc.completed_count >= 5) OR
    (b.name = 'Referral Gold' AND rc.completed_count >= 10)
  )
  AND b.is_unlocked = false;

-- 3. Atualizar função process_referral_signup para bloquear auto-referral
CREATE OR REPLACE FUNCTION public.process_referral_signup(p_referral_code TEXT, p_referred_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_existing_referral RECORD;
BEGIN
  -- Find the referrer by code
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;
  
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_referral_code');
  END IF;
  
  -- CRITICAL: Block self-referral
  IF p_referred_user_id = v_referrer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'self_referral_blocked');
  END IF;
  
  -- Check if user was already referred
  SELECT * INTO v_existing_referral
  FROM public.referrals
  WHERE referred_id = p_referred_user_id;
  
  IF v_existing_referral IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_referred');
  END IF;
  
  -- Create the referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status)
  VALUES (v_referrer_id, p_referred_user_id, p_referral_code, 'pending');
  
  -- Update the referred user's profile
  UPDATE public.profiles
  SET referred_by = v_referrer_id
  WHERE id = p_referred_user_id;
  
  -- Run fraud check
  PERFORM check_referral_fraud(v_referrer_id, p_referred_user_id);
  
  RETURN jsonb_build_object('success', true, 'referrer_id', v_referrer_id);
END;
$$;