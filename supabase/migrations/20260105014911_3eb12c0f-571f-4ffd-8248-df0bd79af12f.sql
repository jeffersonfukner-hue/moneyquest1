-- Add display_order column to wallets table
ALTER TABLE public.wallets 
ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;

-- Set initial order based on created_at
WITH ordered_wallets AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM public.wallets
)
UPDATE public.wallets w
SET display_order = ow.rn
FROM ordered_wallets ow
WHERE w.id = ow.id;

-- Create index for ordering
CREATE INDEX idx_wallets_display_order ON public.wallets(user_id, display_order);