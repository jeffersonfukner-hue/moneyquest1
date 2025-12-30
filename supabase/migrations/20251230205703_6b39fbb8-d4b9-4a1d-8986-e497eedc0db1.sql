-- Create enum type for premium override
CREATE TYPE public.premium_override_type AS ENUM ('none', 'force_on', 'force_off');

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN premium_override public.premium_override_type NOT NULL DEFAULT 'none';

ALTER TABLE public.profiles 
ADD COLUMN stripe_subscription_status text DEFAULT NULL;

-- Create function to resolve premium status
CREATE OR REPLACE FUNCTION public.resolve_premium_status(
  p_override public.premium_override_type,
  p_stripe_status text
) RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  -- Priority 1: Admin override
  IF p_override = 'force_off' THEN
    RETURN 'FREE';
  END IF;
  
  IF p_override = 'force_on' THEN
    RETURN 'PREMIUM';
  END IF;
  
  -- Priority 2: Stripe status
  IF p_stripe_status IN ('active', 'trialing') THEN
    RETURN 'PREMIUM';
  END IF;
  
  RETURN 'FREE';
END;
$$;

-- Update admin_update_subscription to set override
CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  _target_user_id uuid,
  _plan text,
  _expires_at timestamp with time zone DEFAULT NULL,
  _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_override public.premium_override_type;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  -- Set override based on admin action
  IF _plan = 'PREMIUM' THEN
    v_override := 'force_on';
  ELSE
    v_override := 'force_off';
  END IF;
  
  -- Update profile with override
  UPDATE public.profiles
  SET 
    subscription_plan = _plan,
    premium_override = v_override,
    subscription_started_at = CASE WHEN _plan = 'PREMIUM' THEN COALESCE(subscription_started_at, now()) ELSE subscription_started_at END,
    subscription_expires_at = _expires_at,
    updated_at = now()
  WHERE id = _target_user_id;
  
  -- Log the action
  INSERT INTO public.admin_logs (admin_id, action_type, target_user_id, details, note)
  VALUES (
    auth.uid(),
    CASE WHEN _plan = 'PREMIUM' THEN 'PREMIUM_GRANT' ELSE 'PREMIUM_REVOKE' END,
    _target_user_id,
    jsonb_build_object('plan', _plan, 'expires_at', _expires_at, 'override', v_override::text),
    _note
  );
END;
$$;

-- Create function to reset override (let Stripe decide)
CREATE OR REPLACE FUNCTION public.admin_reset_premium_override(
  _target_user_id uuid,
  _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_stripe_status text;
  v_new_plan text;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  -- Get current Stripe status
  SELECT stripe_subscription_status INTO v_stripe_status 
  FROM public.profiles WHERE id = _target_user_id;
  
  -- Resolve new plan based on Stripe
  v_new_plan := CASE WHEN v_stripe_status IN ('active', 'trialing') THEN 'PREMIUM' ELSE 'FREE' END;
  
  -- Reset override
  UPDATE public.profiles SET 
    premium_override = 'none',
    subscription_plan = v_new_plan,
    updated_at = now()
  WHERE id = _target_user_id;
  
  -- Log action
  INSERT INTO public.admin_logs (admin_id, action_type, target_user_id, details, note)
  VALUES (
    auth.uid(), 
    'OVERRIDE_RESET', 
    _target_user_id, 
    jsonb_build_object('new_plan', v_new_plan, 'stripe_status', v_stripe_status), 
    _note
  );
END;
$$;