-- Add subscription_plan column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_plan text NOT NULL DEFAULT 'FREE' 
CHECK (subscription_plan IN ('FREE', 'PREMIUM'));

-- Add subscription dates for tracking
ALTER TABLE public.profiles 
ADD COLUMN subscription_started_at timestamp with time zone,
ADD COLUMN subscription_expires_at timestamp with time zone,
ADD COLUMN stripe_customer_id text,
ADD COLUMN stripe_subscription_id text;