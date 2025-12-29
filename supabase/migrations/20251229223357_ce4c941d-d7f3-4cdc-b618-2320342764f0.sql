-- Create table to store monthly goal performance history
CREATE TABLE public.category_goal_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.category_goals(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  budget_limit NUMERIC NOT NULL,
  spent NUMERIC NOT NULL DEFAULT 0,
  percentage_used NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'within_budget',
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one record per user/category/period
  UNIQUE(user_id, category, period_month, period_year)
);

-- Enable RLS
ALTER TABLE public.category_goal_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own goal history"
ON public.category_goal_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal history"
ON public.category_goal_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to archive monthly goal performance
CREATE OR REPLACE FUNCTION public.archive_monthly_goals(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  prev_month INTEGER;
  prev_year INTEGER;
  month_start DATE;
  month_end DATE;
BEGIN
  -- Calculate previous month
  IF current_month = 1 THEN
    prev_month := 12;
    prev_year := current_year - 1;
  ELSE
    prev_month := current_month - 1;
    prev_year := current_year;
  END IF;
  
  -- Calculate previous month date range
  month_start := make_date(prev_year, prev_month, 1);
  month_end := (month_start + INTERVAL '1 month' - INTERVAL '1 day')::date;
  
  -- Archive each goal's performance for the previous month
  INSERT INTO public.category_goal_history (
    user_id,
    goal_id,
    category,
    budget_limit,
    spent,
    percentage_used,
    status,
    period_month,
    period_year
  )
  SELECT 
    g.user_id,
    g.id as goal_id,
    g.category,
    g.budget_limit,
    COALESCE(SUM(t.amount), 0) as spent,
    CASE 
      WHEN g.budget_limit > 0 THEN ROUND((COALESCE(SUM(t.amount), 0) / g.budget_limit) * 100, 1)
      ELSE 0
    END as percentage_used,
    CASE 
      WHEN COALESCE(SUM(t.amount), 0) <= g.budget_limit * 0.8 THEN 'excellent'
      WHEN COALESCE(SUM(t.amount), 0) <= g.budget_limit THEN 'within_budget'
      ELSE 'over_budget'
    END as status,
    prev_month,
    prev_year
  FROM public.category_goals g
  LEFT JOIN public.transactions t ON 
    t.user_id = g.user_id 
    AND t.category = g.category 
    AND t.type = 'EXPENSE'
    AND t.date >= month_start
    AND t.date <= month_end
  WHERE g.user_id = p_user_id
  GROUP BY g.id, g.user_id, g.category, g.budget_limit
  ON CONFLICT (user_id, category, period_month, period_year) 
  DO UPDATE SET
    budget_limit = EXCLUDED.budget_limit,
    spent = EXCLUDED.spent,
    percentage_used = EXCLUDED.percentage_used,
    status = EXCLUDED.status;
END;
$$;

-- Create index for faster queries
CREATE INDEX idx_goal_history_user_period ON public.category_goal_history(user_id, period_year DESC, period_month DESC);