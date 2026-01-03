-- Create transaction_items table for expense breakdown (Premium feature)
CREATE TABLE public.transaction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own transaction items"
ON public.transaction_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transaction items"
ON public.transaction_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction items"
ON public.transaction_items
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transaction items"
ON public.transaction_items
FOR DELETE
USING (auth.uid() = user_id);

-- Add has_items flag to transactions for quick filtering
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS has_items BOOLEAN DEFAULT false;

-- Index for performance
CREATE INDEX idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_user_id ON public.transaction_items(user_id);