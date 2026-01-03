-- Add discount offer tracking fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS discount_offer_shown boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_offer_expires_at timestamp with time zone;

-- Create function to mark discount offer as shown
CREATE OR REPLACE FUNCTION public.mark_discount_offer_shown(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires_at timestamp with time zone;
BEGIN
  -- Validate caller
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Set expiration to 48 hours from now
  v_expires_at := now() + interval '48 hours';

  UPDATE public.profiles
  SET 
    discount_offer_shown = true,
    discount_offer_expires_at = v_expires_at,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'expires_at', v_expires_at
  );
END;
$$;