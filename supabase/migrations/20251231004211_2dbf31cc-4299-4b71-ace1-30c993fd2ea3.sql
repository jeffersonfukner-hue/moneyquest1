-- Create XP history table for auditing
CREATE TABLE public.xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  xp_before INTEGER NOT NULL,
  xp_after INTEGER NOT NULL,
  xp_change INTEGER NOT NULL,
  source TEXT NOT NULL, -- 'transaction', 'quest', 'daily_reward', 'badge', 'bonus'
  source_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own xp history" ON public.xp_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp history" ON public.xp_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_xp_history_user_created ON public.xp_history(user_id, created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.xp_history;