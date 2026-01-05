-- Create wallet_transfers table
CREATE TABLE public.wallet_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  to_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transfers"
ON public.wallet_transfers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transfers"
ON public.wallet_transfers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transfers"
ON public.wallet_transfers
FOR DELETE
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_wallet_transfers_user_id ON public.wallet_transfers(user_id);
CREATE INDEX idx_wallet_transfers_date ON public.wallet_transfers(date DESC);