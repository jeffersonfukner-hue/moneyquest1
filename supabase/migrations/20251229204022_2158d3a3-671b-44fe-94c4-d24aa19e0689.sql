-- Add currency column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN currency text NOT NULL DEFAULT 'BRL';

-- Add comment for clarity
COMMENT ON COLUMN public.transactions.currency IS 'The currency in which the transaction was originally recorded (BRL, USD, EUR)';