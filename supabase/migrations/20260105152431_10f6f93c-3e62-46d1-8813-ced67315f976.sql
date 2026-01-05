-- Create credit_cards table
CREATE TABLE public.credit_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  total_limit NUMERIC NOT NULL DEFAULT 0,
  available_limit NUMERIC NOT NULL DEFAULT 0,
  billing_close_day INTEGER NOT NULL CHECK (billing_close_day >= 1 AND billing_close_day <= 28),
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 28),
  linked_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own credit cards"
ON public.credit_cards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own credit cards"
ON public.credit_cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credit cards"
ON public.credit_cards FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credit cards"
ON public.credit_cards FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_credit_cards_updated_at
BEFORE UPDATE ON public.credit_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();