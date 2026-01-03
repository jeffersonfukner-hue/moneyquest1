
-- Função admin para deletar usuário completamente (apenas para testes)
CREATE OR REPLACE FUNCTION public.admin_delete_user(_target_user_id uuid, _note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  -- Verificar permissão de super admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  -- Não permitir auto-exclusão
  IF _target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account.';
  END IF;
  
  -- Buscar email para log
  SELECT email INTO v_email FROM auth.users WHERE id = _target_user_id;
  
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Limpar todas as tabelas relacionadas
  DELETE FROM public.user_fingerprints WHERE user_id = _target_user_id;
  DELETE FROM public.daily_rewards WHERE user_id = _target_user_id;
  DELETE FROM public.reward_history WHERE user_id = _target_user_id;
  DELETE FROM public.xp_history WHERE user_id = _target_user_id;
  DELETE FROM public.leaderboard_participants WHERE user_id = _target_user_id;
  DELETE FROM public.user_messages WHERE user_id = _target_user_id;
  DELETE FROM public.user_bonuses WHERE user_id = _target_user_id;
  DELETE FROM public.referrals WHERE referrer_id = _target_user_id OR referred_id = _target_user_id;
  DELETE FROM public.transaction_narratives WHERE user_id = _target_user_id;
  DELETE FROM public.transactions WHERE user_id = _target_user_id;
  DELETE FROM public.wallets WHERE user_id = _target_user_id;
  DELETE FROM public.transaction_templates WHERE user_id = _target_user_id;
  DELETE FROM public.category_goal_history WHERE user_id = _target_user_id;
  DELETE FROM public.category_goals WHERE user_id = _target_user_id;
  DELETE FROM public.quests WHERE user_id = _target_user_id;
  DELETE FROM public.badges WHERE user_id = _target_user_id;
  DELETE FROM public.categories WHERE user_id = _target_user_id;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  DELETE FROM public.friend_connections WHERE user_id = _target_user_id OR friend_id = _target_user_id;
  DELETE FROM public.ab_test_events WHERE user_id = _target_user_id;
  
  -- Limpar support tickets e mensagens
  DELETE FROM public.support_messages WHERE ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = _target_user_id);
  DELETE FROM public.support_tickets WHERE user_id = _target_user_id;
  
  -- Limpar referências em admin_logs
  UPDATE public.admin_logs SET target_user_id = NULL WHERE target_user_id = _target_user_id;
  
  -- Deletar profile
  DELETE FROM public.profiles WHERE id = _target_user_id;
  
  -- Deletar do auth.users
  DELETE FROM auth.users WHERE id = _target_user_id;
  
  -- Registrar log (após deletar o usuário, então não tem target_user_id)
  INSERT INTO public.admin_logs (admin_id, action_type, target_user_id, details, note)
  VALUES (
    auth.uid(),
    'DELETE_USER',
    NULL,
    jsonb_build_object('deleted_user_id', _target_user_id, 'deleted_email', v_email),
    COALESCE(_note, 'User deleted by admin')
  );
  
  RETURN jsonb_build_object('success', true, 'deleted_email', v_email);
END;
$$;
