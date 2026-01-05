-- Add public_id column for safe public display (short unique identifier)
ALTER TABLE public.leaderboard_participants 
ADD COLUMN public_id TEXT UNIQUE;

-- Generate public_id for existing records using a short hash
UPDATE public.leaderboard_participants 
SET public_id = 'P' || UPPER(SUBSTRING(MD5(user_id::text || COALESCE(joined_at::text, NOW()::text)) FROM 1 FOR 8))
WHERE public_id IS NULL;

-- Make public_id not nullable for future inserts
ALTER TABLE public.leaderboard_participants 
ALTER COLUMN public_id SET NOT NULL;

-- Create a function to generate public_id on insert
CREATE OR REPLACE FUNCTION generate_leaderboard_public_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := 'P' || UPPER(SUBSTRING(MD5(NEW.user_id::text || NOW()::text || gen_random_uuid()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate public_id
DROP TRIGGER IF EXISTS trigger_generate_public_id ON public.leaderboard_participants;
CREATE TRIGGER trigger_generate_public_id
  BEFORE INSERT ON public.leaderboard_participants
  FOR EACH ROW
  EXECUTE FUNCTION generate_leaderboard_public_id();

-- Drop existing SELECT policy if exists
DROP POLICY IF EXISTS "Anyone can view public leaderboard participants" ON public.leaderboard_participants;
DROP POLICY IF EXISTS "Leaderboard is public for all" ON public.leaderboard_participants;

-- Create new policy: only authenticated users can see full data including user_id
CREATE POLICY "Authenticated users can view leaderboard with user_id"
  ON public.leaderboard_participants FOR SELECT
  TO authenticated
  USING (true);

-- Anonymous users cannot access the table directly
CREATE POLICY "Anonymous cannot access leaderboard table directly"
  ON public.leaderboard_participants FOR SELECT
  TO anon
  USING (false);

-- Create a view for public/anonymous access without user_id
CREATE OR REPLACE VIEW public.leaderboard_public AS
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

-- Grant access to the view
GRANT SELECT ON public.leaderboard_public TO anon, authenticated;