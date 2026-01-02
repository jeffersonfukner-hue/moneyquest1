-- Add referral_code to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);

-- Create referrals table for tracking
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, rewarded
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  UNIQUE(referrer_id, referred_id),
  UNIQUE(referred_id) -- Each user can only be referred once
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "Users can view own referrals as referrer"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view own referral as referred"
ON public.referrals FOR SELECT
USING (auth.uid() = referred_id);

CREATE POLICY "System can insert referrals"
ON public.referrals FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update referrals"
ON public.referrals FOR UPDATE
USING (true);

-- Function to generate referral code on profile creation
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := LOWER(SUBSTR(NEW.id::text, 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-generate referral code
DROP TRIGGER IF EXISTS set_referral_code ON public.profiles;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- Update existing profiles with referral codes
UPDATE public.profiles 
SET referral_code = LOWER(SUBSTR(id::text, 1, 8))
WHERE referral_code IS NULL;

-- Function to process referral on signup (called when user registers with referral code)
CREATE OR REPLACE FUNCTION public.process_referral_signup(
  p_referred_user_id UUID,
  p_referral_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_existing_referral UUID;
BEGIN
  -- Validate caller
  IF p_referred_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Find referrer by code
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = LOWER(p_referral_code);

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  -- Can't refer yourself
  IF v_referrer_id = p_referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'self_referral');
  END IF;

  -- Check if already referred
  SELECT id INTO v_existing_referral
  FROM public.referrals
  WHERE referred_id = p_referred_user_id;

  IF v_existing_referral IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_referred');
  END IF;

  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status)
  VALUES (v_referrer_id, p_referred_user_id, LOWER(p_referral_code), 'pending');

  -- Update referred user's profile
  UPDATE public.profiles
  SET referred_by = v_referrer_id
  WHERE id = p_referred_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'referrer_id', v_referrer_id
  );
END;
$$;

-- Function to complete referral and grant rewards (called after first transaction)
CREATE OR REPLACE FUNCTION public.complete_referral_reward(p_referred_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_referrer_xp_reward INTEGER := 500;
  v_referrer_premium_days INTEGER := 7;
  v_referred_xp_reward INTEGER := 100;
BEGIN
  -- Find pending referral for this user
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_id = p_referred_user_id
    AND status = 'pending';

  IF v_referral IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_pending_referral');
  END IF;

  -- Mark referral as completed
  UPDATE public.referrals
  SET 
    status = 'completed',
    completed_at = now()
  WHERE id = v_referral.id;

  -- Grant XP to referrer
  UPDATE public.profiles
  SET xp = xp + v_referrer_xp_reward
  WHERE id = v_referral.referrer_id;

  -- Record XP history for referrer
  INSERT INTO public.xp_history (user_id, source, source_id, xp_change, xp_before, xp_after, description)
  SELECT 
    v_referral.referrer_id,
    'referral',
    v_referral.id,
    v_referrer_xp_reward,
    xp - v_referrer_xp_reward,
    xp,
    'Referral reward - friend made first transaction'
  FROM public.profiles WHERE id = v_referral.referrer_id;

  -- Grant Premium days to referrer
  UPDATE public.profiles
  SET 
    subscription_plan = 'PREMIUM',
    subscription_started_at = COALESCE(subscription_started_at, now()),
    subscription_expires_at = GREATEST(
      COALESCE(subscription_expires_at, now()),
      now()
    ) + (v_referrer_premium_days || ' days')::interval
  WHERE id = v_referral.referrer_id;

  -- Grant bonus XP to referred user
  UPDATE public.profiles
  SET xp = xp + v_referred_xp_reward
  WHERE id = p_referred_user_id;

  -- Record XP history for referred
  INSERT INTO public.xp_history (user_id, source, source_id, xp_change, xp_before, xp_after, description)
  SELECT 
    p_referred_user_id,
    'referral_bonus',
    v_referral.id,
    v_referred_xp_reward,
    xp - v_referred_xp_reward,
    xp,
    'Welcome bonus - referred by friend'
  FROM public.profiles WHERE id = p_referred_user_id;

  -- Mark as rewarded
  UPDATE public.referrals
  SET 
    status = 'rewarded',
    rewarded_at = now()
  WHERE id = v_referral.id;

  RETURN jsonb_build_object(
    'success', true,
    'referrer_id', v_referral.referrer_id,
    'referrer_xp', v_referrer_xp_reward,
    'referrer_premium_days', v_referrer_premium_days,
    'referred_xp', v_referred_xp_reward
  );
END;
$$;

-- Trigger function to auto-complete referral on first transaction
CREATE OR REPLACE FUNCTION public.check_referral_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_count INTEGER;
  v_result JSONB;
BEGIN
  -- Count existing transactions for this user (excluding the one being inserted)
  SELECT COUNT(*) INTO v_transaction_count
  FROM public.transactions
  WHERE user_id = NEW.user_id
    AND id != NEW.id;

  -- If this is the first transaction, check for pending referral
  IF v_transaction_count = 0 THEN
    SELECT public.complete_referral_reward(NEW.user_id) INTO v_result;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for auto-completing referrals
DROP TRIGGER IF EXISTS trigger_check_referral ON public.transactions;
CREATE TRIGGER trigger_check_referral
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_on_transaction();

-- Function to get referral stats for a user
CREATE OR REPLACE FUNCTION public.get_referral_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSONB;
  v_referral_code TEXT;
  v_total_referrals INTEGER;
  v_pending_referrals INTEGER;
  v_completed_referrals INTEGER;
  v_total_xp_earned INTEGER;
  v_total_premium_days INTEGER;
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

  RETURN jsonb_build_object(
    'referral_code', v_referral_code,
    'referral_link', 'https://moneyquest.app.br/' || v_referral_code,
    'total_referrals', v_total_referrals,
    'pending_referrals', v_pending_referrals,
    'completed_referrals', v_completed_referrals,
    'total_xp_earned', v_total_xp_earned,
    'total_premium_days', v_total_premium_days
  );
END;
$$;