-- Drop the overly permissive policies and recreate with proper restrictions
DROP POLICY IF EXISTS "Service Role Upload OG Images" ON storage.objects;
DROP POLICY IF EXISTS "Service Role Update OG Images" ON storage.objects;

-- Service role has automatic bypass, so we don't need explicit INSERT/UPDATE policies
-- The public read policy is sufficient since only edge functions (using service role) upload