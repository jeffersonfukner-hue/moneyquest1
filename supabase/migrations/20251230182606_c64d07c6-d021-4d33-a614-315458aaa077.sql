-- Create A/B test events table for tracking ad banner performance
CREATE TABLE public.ab_test_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  test_name TEXT NOT NULL,
  variant TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'impression', 'click', 'conversion'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for querying by test and variant
CREATE INDEX idx_ab_test_events_test_variant ON public.ab_test_events(test_name, variant);
CREATE INDEX idx_ab_test_events_created_at ON public.ab_test_events(created_at);

-- Enable RLS
ALTER TABLE public.ab_test_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own events
CREATE POLICY "Users can insert their own ab test events"
ON public.ab_test_events
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow admins to view all events
CREATE POLICY "Admins can view all ab test events"
ON public.ab_test_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);