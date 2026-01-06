-- Add supplier column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS supplier text;

-- Add supplier column to scheduled_transactions table
ALTER TABLE public.scheduled_transactions 
ADD COLUMN IF NOT EXISTS supplier text;

-- Add comment for documentation
COMMENT ON COLUMN public.transactions.supplier IS 'Supplier/vendor name for credit card expenses';
COMMENT ON COLUMN public.scheduled_transactions.supplier IS 'Supplier/vendor name for scheduled credit card expenses';