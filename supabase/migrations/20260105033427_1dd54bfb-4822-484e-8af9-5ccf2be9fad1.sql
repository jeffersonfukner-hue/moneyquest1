-- Fix function search path security issue
CREATE OR REPLACE FUNCTION generate_leaderboard_public_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := 'P' || UPPER(SUBSTRING(MD5(NEW.user_id::text || NOW()::text || gen_random_uuid()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

-- Fix view security definer issue - recreate as SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.leaderboard_public;
CREATE VIEW public.leaderboard_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  public_id,
  display_name,
  avatar_icon,
  xp,
  level,
  is_public,
  joined_at,
  updated_at
FROM public.leaderboard_participants
WHERE is_public = true;

-- Re-grant access to the view
GRANT SELECT ON public.leaderboard_public TO anon, authenticated;