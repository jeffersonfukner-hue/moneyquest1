-- Add new columns to transactions table for credit card support
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'account',
ADD COLUMN IF NOT EXISTS transaction_subtype TEXT,
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT true;

-- Add constraint for source_type
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_source_type_check 
CHECK (source_type IN ('account', 'card'));

-- Add constraint for transaction_subtype
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_subtype_check 
CHECK (transaction_subtype IS NULL OR transaction_subtype IN ('debit', 'credit', 'card_expense', 'invoice_payment'));

-- Create index for credit_card_id for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_credit_card_id ON public.transactions(credit_card_id);

-- Create index for source_type
CREATE INDEX IF NOT EXISTS idx_transactions_source_type ON public.transactions(source_type);

-- Comment on columns for documentation
COMMENT ON COLUMN public.transactions.source_type IS 'account = affects wallet balance, card = affects card limit';
COMMENT ON COLUMN public.transactions.transaction_subtype IS 'debit/credit for accounts, card_expense/invoice_payment for cards';
COMMENT ON COLUMN public.transactions.credit_card_id IS 'Reference to credit card when source_type = card';
COMMENT ON COLUMN public.transactions.is_manual IS 'True if manually created by user';