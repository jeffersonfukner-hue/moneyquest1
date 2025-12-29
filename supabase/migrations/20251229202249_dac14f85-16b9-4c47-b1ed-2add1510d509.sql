-- Add unique constraint for upsert to work
ALTER TABLE public.exchange_rates 
ADD CONSTRAINT exchange_rates_base_target_unique 
UNIQUE (base_currency, target_currency);

-- Enable required extensions for pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;