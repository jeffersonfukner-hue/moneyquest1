-- Create wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  institution TEXT,
  type TEXT NOT NULL DEFAULT 'checking',
  currency TEXT NOT NULL DEFAULT 'BRL',
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  icon TEXT DEFAULT '🏦',
  color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallets
CREATE POLICY "Users can view own wallets" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wallets" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallets" ON public.wallets
  FOR DELETE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_wallets_user_active ON public.wallets(user_id, is_active);

-- Add wallet_id to transactions table
ALTER TABLE public.transactions
ADD COLUMN wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL;

-- Index for filtering transactions by wallet
CREATE INDEX idx_transactions_wallet ON public.transactions(wallet_id);

-- Trigger for updated_at
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();