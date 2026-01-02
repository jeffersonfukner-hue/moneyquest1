-- Create function to get tier-based rewards
CREATE OR REPLACE FUNCTION public.get_tier_rewards(p_completed_count INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_tier TEXT;
  v_xp_reward INTEGER;
  v_premium_days INTEGER;
BEGIN
  -- Determine tier and rewards
  IF p_completed_count >= 15 THEN
    v_tier := 'gold';
    v_xp_reward := 750;
    v_premium_days := 10;
  ELSIF p_completed_count >= 5 THEN
    v_tier := 'silver';
    v_xp_reward := 600;
    v_premium_days := 8;
  ELSE
    v_tier := 'bronze';
    v_xp_reward := 500;
    v_premium_days := 7;
  END IF;

  RETURN jsonb_build_object(
    'tier', v_tier,
    'xp_reward', v_xp_reward,
    'premium_days', v_premium_days
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Update complete_referral_reward to use tier-based rewards
CREATE OR REPLACE FUNCTION public.complete_referral_reward(p_referred_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral RECORD;
  v_referrer_completed_count INTEGER;
  v_tier_rewards JSONB;
  v_referrer_xp_reward INTEGER;
  v_referrer_premium_days INTEGER;
  v_referred_xp_reward INTEGER := 100;
  v_new_tier TEXT;
  v_old_tier TEXT;
BEGIN
  -- Find pending referral for this user
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_id = p_referred_user_id
    AND status = 'pending';

  IF v_referral IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_pending_referral');
  END IF;

  -- Get referrer's current completed count (before this one)
  SELECT COUNT(*) INTO v_referrer_completed_count
  FROM public.referrals
  WHERE referrer_id = v_referral.referrer_id
    AND status IN ('completed', 'rewarded');

  -- Get old tier before this referral
  SELECT (public.get_referral_tier(v_referrer_completed_count))->>'tier' INTO v_old_tier;

  -- Get tier-based rewards (counting this new referral)
  SELECT public.get_tier_rewards(v_referrer_completed_count + 1) INTO v_tier_rewards;
  v_referrer_xp_reward := (v_tier_rewards->>'xp_reward')::integer;
  v_referrer_premium_days := (v_tier_rewards->>'premium_days')::integer;

  -- Mark referral as completed
  UPDATE public.referrals
  SET 
    status = 'completed',
    completed_at = now()
  WHERE id = v_referral.id;

  -- Grant XP to referrer
  UPDATE public.profiles
  SET xp = xp + v_referrer_xp_reward
  WHERE id = v_referral.referrer_id;

  -- Record XP history for referrer
  INSERT INTO public.xp_history (user_id, source, source_id, xp_change, xp_before, xp_after, description)
  SELECT 
    v_referral.referrer_id,
    'referral',
    v_referral.id,
    v_referrer_xp_reward,
    xp - v_referrer_xp_reward,
    xp,
    'Referral reward (' || (v_tier_rewards->>'tier') || ' tier) - friend completed transactions'
  FROM public.profiles WHERE id = v_referral.referrer_id;

  -- Grant Premium days to referrer
  UPDATE public.profiles
  SET 
    subscription_plan = 'PREMIUM',
    subscription_started_at = COALESCE(subscription_started_at, now()),
    subscription_expires_at = GREATEST(
      COALESCE(subscription_expires_at, now()),
      now()
    ) + (v_referrer_premium_days || ' days')::interval
  WHERE id = v_referral.referrer_id;

  -- Grant bonus XP to referred user
  UPDATE public.profiles
  SET xp = xp + v_referred_xp_reward
  WHERE id = p_referred_user_id;

  -- Record XP history for referred
  INSERT INTO public.xp_history (user_id, source, source_id, xp_change, xp_before, xp_after, description)
  SELECT 
    p_referred_user_id,
    'referral_bonus',
    v_referral.id,
    v_referred_xp_reward,
    xp - v_referred_xp_reward,
    xp,
    'Welcome bonus - referred by friend'
  FROM public.profiles WHERE id = p_referred_user_id;

  -- Mark as rewarded
  UPDATE public.referrals
  SET 
    status = 'rewarded',
    rewarded_at = now()
  WHERE id = v_referral.id;

  -- Check if tier was upgraded and unlock badge
  SELECT (public.get_referral_tier(v_referrer_completed_count + 1))->>'tier' INTO v_new_tier;
  
  IF v_new_tier != v_old_tier THEN
    -- Unlock the tier badge
    UPDATE public.badges
    SET 
      is_unlocked = true,
      unlocked_at = now()
    WHERE user_id = v_referral.referrer_id
      AND name = 'Referral ' || initcap(v_new_tier);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'referrer_id', v_referral.referrer_id,
    'referrer_xp', v_referrer_xp_reward,
    'referrer_premium_days', v_referrer_premium_days,
    'referred_xp', v_referred_xp_reward,
    'tier', v_new_tier,
    'tier_upgraded', v_new_tier != v_old_tier
  );
END;
$$;

-- Update handle_new_user to include referral tier badges
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  today date := CURRENT_DATE;
  week_start date := date_trunc('week', CURRENT_DATE)::date;
  week_end date := (date_trunc('week', CURRENT_DATE) + interval '6 days')::date;
  month_start date := date_trunc('month', CURRENT_DATE)::date;
  month_end date := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;
  user_language text;
  user_currency text;
BEGIN
  -- Get language and currency from signup metadata
  user_language := COALESCE(NEW.raw_user_meta_data->>'language', 'pt-BR');
  user_currency := COALESCE(NEW.raw_user_meta_data->>'currency', 'BRL');

  INSERT INTO public.profiles (id, xp, level, level_title, avatar_icon, streak, total_income, total_expenses, language, locale, currency)
  VALUES (NEW.id, 0, 1, 'Novice Saver', '🎮', 0, 0, 0, user_language, user_language, user_currency);
  
  -- Create default categories for new user
  PERFORM public.create_default_categories(NEW.id);
  
  -- Create DAILY quests
  INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target, period_start_date, period_end_date) VALUES
    (NEW.id, 'Daily Check-in', 'Log at least one transaction today', 50, 'DAILY', 'daily_checkin', 1, today, today),
    (NEW.id, 'Expense Tracker', 'Register an expense for the day', 70, 'DAILY', 'daily_expense', 1, today, today),
    (NEW.id, 'Mindful Spending', 'Log an expense with a category', 40, 'DAILY', 'daily_categorized', 1, today, today);
  
  -- Create WEEKLY quests (including new challenge quests)
  INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target, period_start_date, period_end_date) VALUES
    (NEW.id, 'Weekly Balance', 'Log transactions on at least 5 different days this week', 200, 'WEEKLY', 'weekly_balance', 5, week_start, week_end),
    (NEW.id, 'Category Master', 'Use at least 3 different expense categories this week', 150, 'WEEKLY', 'weekly_categories', 3, week_start, week_end),
    (NEW.id, 'Frugal Friday', 'Don''t spend anything on at least one Friday this week', 150, 'WEEKLY', 'frugal_friday', 1, week_start, week_end),
    (NEW.id, 'Income Hunter', 'Log income from 2 different sources this week', 175, 'WEEKLY', 'income_hunter', 2, week_start, week_end),
    (NEW.id, 'Spending Freeze', 'Have at least 2 no-spend days this week', 200, 'WEEKLY', 'spending_freeze', 2, week_start, week_end),
    (NEW.id, 'Category Focus', 'Keep your highest spending category under control this week', 180, 'WEEKLY', 'category_focus', 1, week_start, week_end),
    (NEW.id, 'Savings Sprint', 'Save at least 20% of your income this week', 250, 'WEEKLY', 'savings_sprint', 1, week_start, week_end);
  
  -- Create MONTHLY quests
  INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target, period_start_date, period_end_date) VALUES
    (NEW.id, 'Financial Discipline', 'Log transactions every week of the month', 500, 'MONTHLY', 'monthly_discipline', 4, month_start, month_end),
    (NEW.id, 'Savings Hero', 'Keep total expenses below your goal limit', 400, 'MONTHLY', 'monthly_savings', 1, month_start, month_end);
  
  -- Create ACHIEVEMENT quests (one-time)
  INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target) VALUES
    (NEW.id, 'First Steps', 'Log your first transaction', 100, 'ACHIEVEMENT', 'achievement_first', 1),
    (NEW.id, 'Budget Master', 'Set your first category goal', 75, 'ACHIEVEMENT', 'achievement_budget', 1),
    (NEW.id, 'Week Warrior', 'Maintain a 7-day streak', 200, 'ACHIEVEMENT', 'achievement_streak7', 7),
    (NEW.id, 'Saver Supreme', 'Save $1000 total', 500, 'ACHIEVEMENT', 'achievement_save1000', 1000);
  
  -- Create default badges for new user (including referral tier badges)
  INSERT INTO public.badges (user_id, name, icon, description, requirement_type, requirement_value) VALUES
    (NEW.id, 'First Steps', '👣', 'Logged your first transaction', 'COUNT', 1),
    (NEW.id, 'Getting Started', '🌟', 'Reached 100 XP', 'XP', 100),
    (NEW.id, 'Rising Star', '⭐', 'Reached 500 XP', 'XP', 500),
    (NEW.id, 'XP Champion', '🏆', 'Reached 1000 XP', 'XP', 1000),
    (NEW.id, 'Streak Starter', '🔥', '3-day streak', 'STREAK', 3),
    (NEW.id, 'Streak Master', '💪', '7-day streak', 'STREAK', 7),
    (NEW.id, 'Penny Pincher', '💰', 'Saved $100', 'TOTAL_SAVED', 100),
    (NEW.id, 'Savings Pro', '💎', 'Saved $1000', 'TOTAL_SAVED', 1000),
    (NEW.id, 'Pumpkin Saver', '🎃', 'Completed Halloween quest', 'COUNT', 1),
    (NEW.id, 'Christmas Planner', '🎄', 'Completed Christmas quest', 'COUNT', 1),
    (NEW.id, 'Smart Reveler', '🎭', 'Completed Carnival quest', 'COUNT', 1),
    (NEW.id, 'Golden Egg', '🥚', 'Completed Easter quest', 'COUNT', 1),
    -- Referral tier badges
    (NEW.id, 'Referral Bronze', '🥉', 'Reached Bronze tier in referral program (1+ referrals)', 'COUNT', 1),
    (NEW.id, 'Referral Silver', '🥈', 'Reached Silver tier in referral program (5+ referrals)', 'COUNT', 5),
    (NEW.id, 'Referral Gold', '🥇', 'Reached Gold tier in referral program (15+ referrals)', 'COUNT', 15);
  
  RETURN NEW;
END;
$$;

-- Add referral badges to existing users who don't have them
INSERT INTO public.badges (user_id, name, icon, description, requirement_type, requirement_value)
SELECT p.id, 'Referral Bronze', '🥉', 'Reached Bronze tier in referral program (1+ referrals)', 'COUNT', 1
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.badges b WHERE b.user_id = p.id AND b.name = 'Referral Bronze'
);

INSERT INTO public.badges (user_id, name, icon, description, requirement_type, requirement_value)
SELECT p.id, 'Referral Silver', '🥈', 'Reached Silver tier in referral program (5+ referrals)', 'COUNT', 5
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.badges b WHERE b.user_id = p.id AND b.name = 'Referral Silver'
);

INSERT INTO public.badges (user_id, name, icon, description, requirement_type, requirement_value)
SELECT p.id, 'Referral Gold', '🥇', 'Reached Gold tier in referral program (15+ referrals)', 'COUNT', 15
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.badges b WHERE b.user_id = p.id AND b.name = 'Referral Gold'
);

-- Unlock badges for users who already have the required referrals
UPDATE public.badges b
SET is_unlocked = true, unlocked_at = now()
FROM (
  SELECT referrer_id, COUNT(*) as completed_count
  FROM public.referrals
  WHERE status IN ('completed', 'rewarded')
  GROUP BY referrer_id
) r
WHERE b.user_id = r.referrer_id
  AND b.name = 'Referral Bronze'
  AND r.completed_count >= 1
  AND b.is_unlocked = false;

UPDATE public.badges b
SET is_unlocked = true, unlocked_at = now()
FROM (
  SELECT referrer_id, COUNT(*) as completed_count
  FROM public.referrals
  WHERE status IN ('completed', 'rewarded')
  GROUP BY referrer_id
) r
WHERE b.user_id = r.referrer_id
  AND b.name = 'Referral Silver'
  AND r.completed_count >= 5
  AND b.is_unlocked = false;

UPDATE public.badges b
SET is_unlocked = true, unlocked_at = now()
FROM (
  SELECT referrer_id, COUNT(*) as completed_count
  FROM public.referrals
  WHERE status IN ('completed', 'rewarded')
  GROUP BY referrer_id
) r
WHERE b.user_id = r.referrer_id
  AND b.name = 'Referral Gold'
  AND r.completed_count >= 15
  AND b.is_unlocked = false;