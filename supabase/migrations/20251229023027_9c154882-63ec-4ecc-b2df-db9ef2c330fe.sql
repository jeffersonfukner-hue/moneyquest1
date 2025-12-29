-- Drop the old constraint and create a new one with all quest types
ALTER TABLE public.quests DROP CONSTRAINT quests_type_check;

ALTER TABLE public.quests ADD CONSTRAINT quests_type_check 
CHECK (type = ANY (ARRAY['DAILY'::text, 'WEEKLY'::text, 'MONTHLY'::text, 'SPECIAL'::text, 'ACHIEVEMENT'::text]));

-- Insert Christmas "Santa's Budget" quest for all existing users
INSERT INTO public.quests (
  user_id, 
  title, 
  description, 
  xp_reward, 
  type, 
  quest_key,
  progress_target,
  period_start_date,
  period_end_date,
  is_active,
  season
)
SELECT 
  id as user_id,
  'Santa''s Budget' as title,
  'Track 5 holiday expenses to earn the Christmas Planner badge!' as description,
  300 as xp_reward,
  'SPECIAL' as type,
  'special_christmas' as quest_key,
  5 as progress_target,
  CURRENT_DATE as period_start_date,
  '2025-12-31'::date as period_end_date,
  true as is_active,
  'christmas' as season
FROM public.profiles;