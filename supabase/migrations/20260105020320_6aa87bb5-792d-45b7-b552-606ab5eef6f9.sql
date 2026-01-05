-- Create scheduled_transactions table for recurring income/expenses
CREATE TABLE public.scheduled_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  category TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  month_of_year INTEGER CHECK (month_of_year >= 1 AND month_of_year <= 12),
  next_run_date DATE NOT NULL,
  last_run_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own scheduled transactions"
ON public.scheduled_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled transactions"
ON public.scheduled_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled transactions"
ON public.scheduled_transactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled transactions"
ON public.scheduled_transactions FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_scheduled_transactions_updated_at
BEFORE UPDATE ON public.scheduled_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();