-- Add notification preferences column to profiles table
ALTER TABLE public.profiles
ADD COLUMN notification_preferences jsonb NOT NULL DEFAULT '{"messages": true, "support": true, "referral": true, "reward": true}'::jsonb;