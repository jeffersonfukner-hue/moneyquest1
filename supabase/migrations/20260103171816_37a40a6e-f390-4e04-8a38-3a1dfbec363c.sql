-- Drop existing function and recreate with rotating weekly challenges
CREATE OR REPLACE FUNCTION public.reset_expired_quests(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_timezone text;
  today date;
  week_start date;
  week_end date;
  month_start date;
  month_end date;
  week_number integer;
  current_year integer;
  seed integer;
  challenge_keys text[];
  challenge_key text;
  challenge_title text;
  challenge_desc text;
  challenge_xp integer;
  challenge_target integer;
BEGIN
  -- SECURITY: Validate caller owns this user_id
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only reset quests for your own account';
  END IF;

  -- Get user's timezone
  SELECT COALESCE(timezone, 'America/Sao_Paulo') INTO v_user_timezone
  FROM profiles WHERE id = p_user_id;
  
  -- Calculate dates in user's timezone
  today := (now() AT TIME ZONE v_user_timezone)::date;
  week_start := date_trunc('week', today)::date;
  week_end := (date_trunc('week', today) + interval '6 days')::date;
  month_start := date_trunc('month', today)::date;
  month_end := (date_trunc('month', today) + interval '1 month' - interval '1 day')::date;
  
  -- Calculate week number for rotation
  week_number := EXTRACT(WEEK FROM today)::integer;
  current_year := EXTRACT(YEAR FROM today)::integer;
  seed := (week_number * 7 + current_year) % 100;

  -- Reset expired DAILY quests
  UPDATE public.quests 
  SET 
    is_completed = false,
    completed_at = NULL,
    progress_current = 0,
    period_start_date = today,
    period_end_date = today
  WHERE user_id = p_user_id 
    AND type = 'DAILY' 
    AND period_end_date < today;

  -- Delete expired WEEKLY quests (will be recreated with rotation)
  DELETE FROM public.quests
  WHERE user_id = p_user_id 
    AND type = 'WEEKLY' 
    AND period_end_date < today;

  -- Create new rotating weekly challenges based on week seed
  -- Pool of 18 challenges, select 5 based on seed
  challenge_keys := ARRAY[
    'weekly_balance', 'weekly_categories', 'transaction_streak', 'detailed_tracker',
    'savings_sprint', 'category_focus', 'budget_guardian', 'mini_saver',
    'frugal_friday', 'spending_freeze', 'no_delivery_week', 'impulse_control', 'coffee_challenge',
    'income_hunter', 'side_hustle', 'cashback_hunter',
    'expense_reducer', 'subscription_audit'
  ];

  -- Rotate array based on seed to get different order each week
  challenge_keys := challenge_keys[(seed % 18) + 1:18] || challenge_keys[1:(seed % 18)];

  -- Check if user already has weekly quests for this period
  IF NOT EXISTS (
    SELECT 1 FROM public.quests 
    WHERE user_id = p_user_id 
      AND type = 'WEEKLY' 
      AND period_start_date = week_start
  ) THEN
    -- Insert first 5 challenges from rotated pool
    FOR i IN 1..5 LOOP
      challenge_key := challenge_keys[i];
      
      -- Map key to title, description, xp, and target
      CASE challenge_key
        WHEN 'weekly_balance' THEN
          challenge_title := 'Weekly Balance'; challenge_desc := 'Log transactions on 5 different days this week'; challenge_xp := 200; challenge_target := 5;
        WHEN 'weekly_categories' THEN
          challenge_title := 'Category Master'; challenge_desc := 'Use at least 3 different expense categories'; challenge_xp := 150; challenge_target := 3;
        WHEN 'transaction_streak' THEN
          challenge_title := 'Transaction Streak'; challenge_desc := 'Log at least one transaction every day this week'; challenge_xp := 250; challenge_target := 7;
        WHEN 'detailed_tracker' THEN
          challenge_title := 'Detailed Tracker'; challenge_desc := 'Log 10 or more transactions this week'; challenge_xp := 175; challenge_target := 10;
        WHEN 'savings_sprint' THEN
          challenge_title := 'Savings Sprint'; challenge_desc := 'Save at least 20% of your income this week'; challenge_xp := 250; challenge_target := 1;
        WHEN 'category_focus' THEN
          challenge_title := 'Category Focus'; challenge_desc := 'Keep one category under 80% of weekly budget'; challenge_xp := 180; challenge_target := 1;
        WHEN 'budget_guardian' THEN
          challenge_title := 'Budget Guardian'; challenge_desc := 'Keep 3 categories under their weekly limit'; challenge_xp := 220; challenge_target := 3;
        WHEN 'mini_saver' THEN
          challenge_title := 'Mini Saver'; challenge_desc := 'Save any amount this week (income > expenses)'; challenge_xp := 150; challenge_target := 1;
        WHEN 'frugal_friday' THEN
          challenge_title := 'Frugal Friday'; challenge_desc := 'Zero expenses on at least one Friday'; challenge_xp := 150; challenge_target := 1;
        WHEN 'spending_freeze' THEN
          challenge_title := 'Spending Freeze'; challenge_desc := 'Have 2 zero-spending days this week'; challenge_xp := 200; challenge_target := 2;
        WHEN 'no_delivery_week' THEN
          challenge_title := 'No Delivery Week'; challenge_desc := 'No food delivery expenses this week'; challenge_xp := 175; challenge_target := 1;
        WHEN 'impulse_control' THEN
          challenge_title := 'Impulse Control'; challenge_desc := 'No shopping/entertainment over R$50 this week'; challenge_xp := 200; challenge_target := 1;
        WHEN 'coffee_challenge' THEN
          challenge_title := 'Coffee at Home'; challenge_desc := 'Skip 5 coffee shop visits this week'; challenge_xp := 125; challenge_target := 5;
        WHEN 'income_hunter' THEN
          challenge_title := 'Income Hunter'; challenge_desc := 'Log income from 2 different sources'; challenge_xp := 175; challenge_target := 2;
        WHEN 'side_hustle' THEN
          challenge_title := 'Side Hustle'; challenge_desc := 'Register any freelance income this week'; challenge_xp := 200; challenge_target := 1;
        WHEN 'cashback_hunter' THEN
          challenge_title := 'Cashback Hunter'; challenge_desc := 'Get cashback or discounts on 3 purchases'; challenge_xp := 125; challenge_target := 3;
        WHEN 'expense_reducer' THEN
          challenge_title := 'Expense Reducer'; challenge_desc := 'Reduce total expenses by 10% vs last week'; challenge_xp := 225; challenge_target := 1;
        WHEN 'subscription_audit' THEN
          challenge_title := 'Subscription Audit'; challenge_desc := 'Review all recurring bills this week'; challenge_xp := 150; challenge_target := 1;
        ELSE
          challenge_title := 'Weekly Quest'; challenge_desc := 'Complete this weekly challenge'; challenge_xp := 150; challenge_target := 1;
      END CASE;
      
      INSERT INTO public.quests (
        user_id, title, description, xp_reward, type, quest_key,
        progress_target, period_start_date, period_end_date
      ) VALUES (
        p_user_id, challenge_title, challenge_desc, challenge_xp, 'WEEKLY', challenge_key,
        challenge_target, week_start, week_end
      );
    END LOOP;
  END IF;

  -- Reset expired MONTHLY quests
  UPDATE public.quests 
  SET 
    is_completed = false,
    completed_at = NULL,
    progress_current = 0,
    period_start_date = month_start,
    period_end_date = month_end
  WHERE user_id = p_user_id 
    AND type = 'MONTHLY' 
    AND period_end_date < today;
END;
$$;