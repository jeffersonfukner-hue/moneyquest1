-- Create table for personal XP rewards
CREATE TABLE public.personal_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  xp_threshold INTEGER NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎁',
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, xp_threshold)
);

-- Enable RLS
ALTER TABLE public.personal_rewards ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own rewards
CREATE POLICY "Users can view own rewards"
ON public.personal_rewards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own rewards"
ON public.personal_rewards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards"
ON public.personal_rewards FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rewards"
ON public.personal_rewards FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_personal_rewards_user_id ON public.personal_rewards(user_id);
CREATE INDEX idx_personal_rewards_claimed ON public.personal_rewards(user_id, is_claimed);

-- Add level_unlocks column to track what features are unlocked per level
-- This stores as JSONB for flexibility
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS unlocked_features JSONB DEFAULT '{"weekly_quests": false, "monthly_quests": false, "leaderboard": false, "ai_coach": false, "custom_categories": false}'::jsonb;