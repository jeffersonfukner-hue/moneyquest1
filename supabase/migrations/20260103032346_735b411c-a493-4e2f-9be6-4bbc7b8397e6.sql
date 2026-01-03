-- Drop existing functions and recreate with new signatures
DROP FUNCTION IF EXISTS public.admin_get_ip_whitelist();

CREATE OR REPLACE FUNCTION public.admin_get_ip_whitelist()
RETURNS TABLE (
  id UUID,
  ip_address TEXT,
  description TEXT,
  organization TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  is_cidr BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT w.id, w.ip_address, w.description, w.organization, w.created_by, w.created_at, w.is_active, COALESCE(w.is_cidr, false)
  FROM ip_whitelist w
  ORDER BY w.created_at DESC;
END;
$$;