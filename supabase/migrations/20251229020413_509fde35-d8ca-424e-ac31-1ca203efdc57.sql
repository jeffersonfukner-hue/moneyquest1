-- Fix function search path for get_level_title
CREATE OR REPLACE FUNCTION public.get_level_title(user_level INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN CASE
    WHEN user_level <= 2 THEN 'Novice Saver'
    WHEN user_level <= 5 THEN 'Budget Apprentice'
    WHEN user_level <= 10 THEN 'Money Manager'
    WHEN user_level <= 20 THEN 'Finance Wizard'
    WHEN user_level <= 35 THEN 'Wealth Warrior'
    WHEN user_level <= 50 THEN 'Economy Expert'
    ELSE 'Legendary Investor'
  END;
END;
$$;