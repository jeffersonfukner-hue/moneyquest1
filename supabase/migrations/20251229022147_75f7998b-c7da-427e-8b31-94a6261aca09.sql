-- Add financial_mood column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN financial_mood TEXT NOT NULL DEFAULT 'NEUTRAL' 
CHECK (financial_mood IN ('VERY_POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'CRITICAL'));