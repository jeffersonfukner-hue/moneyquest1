-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  level_title TEXT NOT NULL DEFAULT 'Novice Saver',
  avatar_icon TEXT NOT NULL DEFAULT '🎮',
  streak INTEGER NOT NULL DEFAULT 0,
  total_income NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create category_goals table
CREATE TABLE public.category_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  budget_limit NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Create quests table
CREATE TABLE public.quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  type TEXT NOT NULL CHECK (type IN ('DAILY', 'ACHIEVEMENT')),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('XP', 'STREAK', 'TOTAL_SAVED', 'COUNT')),
  requirement_value INTEGER NOT NULL,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Category goals policies
CREATE POLICY "Users can view own goals" ON public.category_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals" ON public.category_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.category_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.category_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Quests policies
CREATE POLICY "Users can view own quests" ON public.quests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quests" ON public.quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quests" ON public.quests
  FOR UPDATE USING (auth.uid() = user_id);

-- Badges policies
CREATE POLICY "Users can view own badges" ON public.badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own badges" ON public.badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own badges" ON public.badges
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, xp, level, level_title, avatar_icon, streak, total_income, total_expenses)
  VALUES (NEW.id, 0, 1, 'Novice Saver', '🎮', 0, 0, 0);
  
  -- Create default quests for new user
  INSERT INTO public.quests (user_id, title, description, xp_reward, type) VALUES
    (NEW.id, 'First Steps', 'Log your first transaction', 100, 'ACHIEVEMENT'),
    (NEW.id, 'Daily Logger', 'Log a transaction today', 25, 'DAILY'),
    (NEW.id, 'Budget Master', 'Set your first category goal', 75, 'ACHIEVEMENT'),
    (NEW.id, 'Week Warrior', 'Maintain a 7-day streak', 200, 'ACHIEVEMENT'),
    (NEW.id, 'Saver Supreme', 'Save $1000 total', 500, 'ACHIEVEMENT');
  
  -- Create default badges for new user
  INSERT INTO public.badges (user_id, name, icon, description, requirement_type, requirement_value) VALUES
    (NEW.id, 'First Steps', '👣', 'Logged your first transaction', 'COUNT', 1),
    (NEW.id, 'Getting Started', '🌟', 'Reached 100 XP', 'XP', 100),
    (NEW.id, 'Rising Star', '⭐', 'Reached 500 XP', 'XP', 500),
    (NEW.id, 'XP Champion', '🏆', 'Reached 1000 XP', 'XP', 1000),
    (NEW.id, 'Streak Starter', '🔥', '3-day streak', 'STREAK', 3),
    (NEW.id, 'Streak Master', '💪', '7-day streak', 'STREAK', 7),
    (NEW.id, 'Penny Pincher', '💰', 'Saved $100', 'TOTAL_SAVED', 100),
    (NEW.id, 'Savings Pro', '💎', 'Saved $1000', 'TOTAL_SAVED', 1000);
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get level title based on level
CREATE OR REPLACE FUNCTION public.get_level_title(user_level INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
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

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for updating profile timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();