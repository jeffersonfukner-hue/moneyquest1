-- Function to export all user data for admin
CREATE OR REPLACE FUNCTION public.admin_export_user_data(_target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
  v_profile jsonb;
  v_transactions jsonb;
  v_wallets jsonb;
  v_categories jsonb;
  v_goals jsonb;
  v_goal_history jsonb;
  v_quests jsonb;
  v_badges jsonb;
  v_xp_history jsonb;
  v_templates jsonb;
  v_referrals jsonb;
  v_daily_rewards jsonb;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  -- Get email
  SELECT email INTO v_email FROM auth.users WHERE id = _target_user_id;
  
  -- Get profile
  SELECT to_jsonb(p.*) INTO v_profile 
  FROM public.profiles p WHERE p.id = _target_user_id;
  
  -- Get transactions
  SELECT COALESCE(jsonb_agg(to_jsonb(t.*) ORDER BY t.date DESC), '[]'::jsonb) INTO v_transactions
  FROM public.transactions t WHERE t.user_id = _target_user_id;
  
  -- Get wallets
  SELECT COALESCE(jsonb_agg(to_jsonb(w.*)), '[]'::jsonb) INTO v_wallets
  FROM public.wallets w WHERE w.user_id = _target_user_id;
  
  -- Get categories
  SELECT COALESCE(jsonb_agg(to_jsonb(c.*)), '[]'::jsonb) INTO v_categories
  FROM public.categories c WHERE c.user_id = _target_user_id;
  
  -- Get category goals
  SELECT COALESCE(jsonb_agg(to_jsonb(g.*)), '[]'::jsonb) INTO v_goals
  FROM public.category_goals g WHERE g.user_id = _target_user_id;
  
  -- Get goal history
  SELECT COALESCE(jsonb_agg(to_jsonb(gh.*) ORDER BY gh.period_year DESC, gh.period_month DESC), '[]'::jsonb) INTO v_goal_history
  FROM public.category_goal_history gh WHERE gh.user_id = _target_user_id;
  
  -- Get quests
  SELECT COALESCE(jsonb_agg(to_jsonb(q.*)), '[]'::jsonb) INTO v_quests
  FROM public.quests q WHERE q.user_id = _target_user_id;
  
  -- Get badges
  SELECT COALESCE(jsonb_agg(to_jsonb(b.*)), '[]'::jsonb) INTO v_badges
  FROM public.badges b WHERE b.user_id = _target_user_id;
  
  -- Get XP history
  SELECT COALESCE(jsonb_agg(to_jsonb(xh.*) ORDER BY xh.created_at DESC), '[]'::jsonb) INTO v_xp_history
  FROM public.xp_history xh WHERE xh.user_id = _target_user_id;
  
  -- Get templates
  SELECT COALESCE(jsonb_agg(to_jsonb(tt.*)), '[]'::jsonb) INTO v_templates
  FROM public.transaction_templates tt WHERE tt.user_id = _target_user_id;
  
  -- Get referrals (as referrer)
  SELECT COALESCE(jsonb_agg(to_jsonb(r.*)), '[]'::jsonb) INTO v_referrals
  FROM public.referrals r WHERE r.referrer_id = _target_user_id OR r.referred_id = _target_user_id;
  
  -- Get daily rewards
  SELECT to_jsonb(dr.*) INTO v_daily_rewards
  FROM public.daily_rewards dr WHERE dr.user_id = _target_user_id;
  
  RETURN jsonb_build_object(
    'exported_at', now(),
    'user_id', _target_user_id,
    'email', v_email,
    'profile', v_profile,
    'transactions', v_transactions,
    'wallets', v_wallets,
    'categories', v_categories,
    'category_goals', v_goals,
    'goal_history', v_goal_history,
    'quests', v_quests,
    'badges', v_badges,
    'xp_history', v_xp_history,
    'transaction_templates', v_templates,
    'referrals', v_referrals,
    'daily_rewards', v_daily_rewards
  );
END;
$$;