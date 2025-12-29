-- Create table to store transaction narratives for the adventure journal
CREATE TABLE public.transaction_narratives (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  narrative text NOT NULL,
  impact text NOT NULL,
  category text NOT NULL,
  event_type text NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(transaction_id)
);

-- Enable RLS
ALTER TABLE public.transaction_narratives ENABLE ROW LEVEL SECURITY;

-- Users can only view their own narratives
CREATE POLICY "Users can view own narratives"
  ON public.transaction_narratives FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own narratives
CREATE POLICY "Users can insert own narratives"
  ON public.transaction_narratives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own narratives (when transaction is deleted)
CREATE POLICY "Users can delete own narratives"
  ON public.transaction_narratives FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_transaction_narratives_user_date ON public.transaction_narratives(user_id, created_at DESC);