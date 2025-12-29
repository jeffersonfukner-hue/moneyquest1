-- Add language, locale, and currency columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BRL';

-- Add check constraints for valid values
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_language_check 
CHECK (language IN ('pt-BR', 'en-US', 'es-ES'));

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_currency_check 
CHECK (currency IN ('BRL', 'USD', 'EUR'));