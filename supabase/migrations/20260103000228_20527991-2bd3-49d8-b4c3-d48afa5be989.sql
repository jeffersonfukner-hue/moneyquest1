-- Criar função para admin buscar tentativas de abuso de trial
CREATE OR REPLACE FUNCTION public.admin_get_trial_abuse_attempts()
RETURNS TABLE (
  id uuid,
  notification_type text,
  title text,
  message text,
  severity text,
  created_at timestamp with time zone,
  blocked_user_id uuid,
  blocked_user_email text,
  blocked_user_name text,
  reason text,
  fingerprint_hash text,
  fingerprint_user_agent text,
  fingerprint_ip text,
  fingerprint_timezone text,
  other_users_with_fingerprint bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    an.id,
    an.notification_type,
    an.title,
    an.message,
    an.severity,
    an.created_at,
    (an.metadata->>'blocked_user_id')::uuid as blocked_user_id,
    (SELECT email FROM auth.users WHERE auth.users.id = (an.metadata->>'blocked_user_id')::uuid) as blocked_user_email,
    COALESCE(p.display_name, 'Unknown') as blocked_user_name,
    an.metadata->>'reason' as reason,
    uf.fingerprint_hash,
    uf.user_agent as fingerprint_user_agent,
    uf.ip_address as fingerprint_ip,
    uf.timezone as fingerprint_timezone,
    (
      SELECT COUNT(DISTINCT uf2.user_id) - 1
      FROM public.user_fingerprints uf2
      WHERE uf2.fingerprint_hash = uf.fingerprint_hash
    ) as other_users_with_fingerprint
  FROM public.admin_notifications an
  LEFT JOIN public.profiles p ON p.id = (an.metadata->>'blocked_user_id')::uuid
  LEFT JOIN public.user_fingerprints uf ON uf.user_id = (an.metadata->>'blocked_user_id')::uuid
  WHERE an.notification_type = 'trial_abuse'
  ORDER BY an.created_at DESC;
END;
$function$;

-- Criar função para admin marcar abuso como revisado
CREATE OR REPLACE FUNCTION public.admin_mark_trial_abuse_reviewed(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  UPDATE public.admin_notifications
  SET is_read = true
  WHERE id = p_notification_id;
  
  INSERT INTO public.admin_logs (admin_id, action_type, details, note)
  VALUES (
    auth.uid(),
    'TRIAL_ABUSE_REVIEWED',
    jsonb_build_object('notification_id', p_notification_id),
    'Marked trial abuse attempt as reviewed'
  );
END;
$function$;

-- Criar função para buscar todos os usuários com determinado fingerprint
CREATE OR REPLACE FUNCTION public.admin_get_users_by_fingerprint(p_fingerprint_hash text)
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  subscription_plan text,
  has_used_trial boolean,
  trial_start_date timestamp with time zone,
  trial_end_date timestamp with time zone,
  created_at timestamp with time zone,
  fingerprint_created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    uf.user_id,
    (SELECT au.email FROM auth.users au WHERE au.id = uf.user_id) as email,
    COALESCE(p.display_name, 'Unknown') as display_name,
    p.subscription_plan,
    p.has_used_trial,
    p.trial_start_date,
    p.trial_end_date,
    p.created_at,
    uf.created_at as fingerprint_created_at
  FROM public.user_fingerprints uf
  JOIN public.profiles p ON p.id = uf.user_id
  WHERE uf.fingerprint_hash = p_fingerprint_hash
  ORDER BY uf.created_at ASC;
END;
$function$;