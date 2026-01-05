-- Add occurrence limit fields to scheduled_transactions
ALTER TABLE public.scheduled_transactions 
ADD COLUMN IF NOT EXISTS total_occurrences integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS remaining_occurrences integer DEFAULT NULL;

-- Add occurrence limit fields to scheduled_transfers
ALTER TABLE public.scheduled_transfers 
ADD COLUMN IF NOT EXISTS total_occurrences integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS remaining_occurrences integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.scheduled_transactions.total_occurrences IS 'Total number of occurrences (NULL = infinite)';
COMMENT ON COLUMN public.scheduled_transactions.remaining_occurrences IS 'Remaining occurrences before deactivation (NULL = infinite)';
COMMENT ON COLUMN public.scheduled_transfers.total_occurrences IS 'Total number of occurrences (NULL = infinite)';
COMMENT ON COLUMN public.scheduled_transfers.remaining_occurrences IS 'Remaining occurrences before deactivation (NULL = infinite)';