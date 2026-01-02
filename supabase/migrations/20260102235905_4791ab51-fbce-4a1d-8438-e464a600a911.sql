-- Criar função para verificar se um fingerprint já foi usado por outro usuário com trial
CREATE OR REPLACE FUNCTION public.check_fingerprint_trial_abuse(p_fingerprint_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_existing_user_id uuid;
  v_has_used_trial boolean;
BEGIN
  -- Procurar se o fingerprint já existe em outro usuário que usou trial
  SELECT uf.user_id, p.has_used_trial 
  INTO v_existing_user_id, v_has_used_trial
  FROM public.user_fingerprints uf
  JOIN public.profiles p ON p.id = uf.user_id
  WHERE uf.fingerprint_hash = p_fingerprint_hash
    AND p.has_used_trial = true
  LIMIT 1;
  
  IF v_existing_user_id IS NOT NULL AND v_has_used_trial THEN
    RETURN jsonb_build_object(
      'is_abuse', true,
      'reason', 'fingerprint_already_used_trial',
      'existing_user_id', v_existing_user_id
    );
  END IF;
  
  RETURN jsonb_build_object(
    'is_abuse', false,
    'reason', null
  );
END;
$function$;

-- Criar função para bloquear trial de um usuário baseado em fingerprint abusivo
CREATE OR REPLACE FUNCTION public.block_trial_for_abuse(p_user_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET 
    subscription_plan = 'FREE',
    trial_start_date = null,
    trial_end_date = null,
    has_used_trial = true -- Marca como já usado para prevenir futuras tentativas
  WHERE id = p_user_id;
  
  -- Log the abuse detection (insert into admin_notifications)
  INSERT INTO public.admin_notifications (
    notification_type,
    severity,
    title,
    message,
    metadata
  ) VALUES (
    'trial_abuse',
    'warning',
    'Trial Abuse Detected',
    'A user attempted to create multiple accounts for trial abuse.',
    jsonb_build_object(
      'blocked_user_id', p_user_id,
      'reason', p_reason,
      'detected_at', now()
    )
  );
END;
$function$;

-- Criar função RPC para validar e registrar fingerprint com verificação de abuso
CREATE OR REPLACE FUNCTION public.register_fingerprint_with_trial_check(
  p_user_id uuid,
  p_fingerprint_hash text,
  p_user_agent text DEFAULT null,
  p_screen_resolution text DEFAULT null,
  p_timezone text DEFAULT null,
  p_language text DEFAULT null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_abuse_check jsonb;
  v_profile RECORD;
BEGIN
  -- Validar que o chamador é o próprio usuário
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only register fingerprint for your own account';
  END IF;
  
  -- Buscar perfil do usuário
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  
  -- Verificar se há abuso de fingerprint
  SELECT public.check_fingerprint_trial_abuse(p_fingerprint_hash) INTO v_abuse_check;
  
  -- Se detectado abuso e usuário está em trial ativo
  IF (v_abuse_check->>'is_abuse')::boolean AND v_profile.trial_end_date IS NOT NULL 
     AND v_profile.trial_end_date > now() THEN
    
    -- Bloquear trial do usuário
    PERFORM public.block_trial_for_abuse(p_user_id, v_abuse_check->>'reason');
    
    -- Inserir fingerprint mesmo assim (para tracking)
    INSERT INTO public.user_fingerprints (
      user_id, fingerprint_hash, user_agent, screen_resolution, timezone, language
    ) VALUES (
      p_user_id, p_fingerprint_hash, p_user_agent, p_screen_resolution, p_timezone, p_language
    ) ON CONFLICT (user_id, fingerprint_hash) DO NOTHING;
    
    RETURN jsonb_build_object(
      'success', false,
      'trial_blocked', true,
      'reason', 'duplicate_fingerprint_detected',
      'message', 'Trial period revoked due to duplicate account detection'
    );
  END IF;
  
  -- Inserir fingerprint normalmente
  INSERT INTO public.user_fingerprints (
    user_id, fingerprint_hash, user_agent, screen_resolution, timezone, language
  ) VALUES (
    p_user_id, p_fingerprint_hash, p_user_agent, p_screen_resolution, p_timezone, p_language
  ) ON CONFLICT (user_id, fingerprint_hash) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'trial_blocked', false
  );
END;
$function$;

-- Adicionar índice para melhorar performance das buscas de fingerprint
CREATE INDEX IF NOT EXISTS idx_user_fingerprints_hash ON public.user_fingerprints(fingerprint_hash);

-- Adicionar unique constraint se não existir (para upsert funcionar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_fingerprints_user_fingerprint_unique'
  ) THEN
    ALTER TABLE public.user_fingerprints 
    ADD CONSTRAINT user_fingerprints_user_fingerprint_unique 
    UNIQUE (user_id, fingerprint_hash);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;