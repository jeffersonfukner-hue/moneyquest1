-- Create scheduled_transfers table
CREATE TABLE public.scheduled_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  to_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  next_run_date DATE NOT NULL,
  last_run_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scheduled transfers"
ON public.scheduled_transfers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled transfers"
ON public.scheduled_transfers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled transfers"
ON public.scheduled_transfers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled transfers"
ON public.scheduled_transfers
FOR DELETE
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_scheduled_transfers_user_id ON public.scheduled_transfers(user_id);
CREATE INDEX idx_scheduled_transfers_next_run ON public.scheduled_transfers(next_run_date) WHERE is_active = true;