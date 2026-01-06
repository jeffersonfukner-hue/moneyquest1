-- Add active_shop_theme column to track which purchased theme is active
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_shop_theme TEXT DEFAULT NULL;