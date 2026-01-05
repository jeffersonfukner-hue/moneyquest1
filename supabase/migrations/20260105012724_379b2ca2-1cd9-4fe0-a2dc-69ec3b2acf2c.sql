-- Create web_vitals_logs table for performance monitoring
CREATE TABLE public.web_vitals_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID,
  session_id TEXT,
  page_url TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  navigation_type TEXT,
  device_type TEXT DEFAULT 'desktop',
  browser TEXT,
  country TEXT
);

-- Enable RLS
ALTER TABLE public.web_vitals_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert vitals (including anonymous users)
CREATE POLICY "Anyone can insert web vitals"
ON public.web_vitals_logs
FOR INSERT
WITH CHECK (true);

-- Policy: Super admins can view all vitals
CREATE POLICY "Super admins can view web vitals"
ON public.web_vitals_logs
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Create index for common queries
CREATE INDEX idx_web_vitals_created_at ON public.web_vitals_logs(created_at DESC);
CREATE INDEX idx_web_vitals_metric_name ON public.web_vitals_logs(metric_name);
CREATE INDEX idx_web_vitals_page_url ON public.web_vitals_logs(page_url);

-- Create function to get web vitals summary
CREATE OR REPLACE FUNCTION public.admin_get_web_vitals_summary(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT (now() - interval '7 days'),
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if user is super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_build_object(
    'summary', (
      SELECT json_agg(row_to_json(s))
      FROM (
        SELECT 
          metric_name,
          ROUND(AVG(metric_value)::numeric, 2) as avg_value,
          ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY metric_value)::numeric, 2) as p75_value,
          ROUND(MIN(metric_value)::numeric, 2) as min_value,
          ROUND(MAX(metric_value)::numeric, 2) as max_value,
          COUNT(*) as sample_count,
          ROUND(
            (COUNT(*) FILTER (WHERE rating = 'good')::numeric / NULLIF(COUNT(*), 0) * 100)::numeric, 
            1
          ) as good_percentage
        FROM web_vitals_logs
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY metric_name
        ORDER BY metric_name
      ) s
    ),
    'by_page', (
      SELECT json_agg(row_to_json(p))
      FROM (
        SELECT 
          page_url,
          ROUND(AVG(metric_value) FILTER (WHERE metric_name = 'LCP')::numeric, 0) as avg_lcp,
          ROUND(AVG(metric_value) FILTER (WHERE metric_name = 'FCP')::numeric, 0) as avg_fcp,
          ROUND(AVG(metric_value) FILTER (WHERE metric_name = 'CLS')::numeric, 3) as avg_cls,
          ROUND(AVG(metric_value) FILTER (WHERE metric_name = 'INP')::numeric, 0) as avg_inp,
          ROUND(AVG(metric_value) FILTER (WHERE metric_name = 'TTFB')::numeric, 0) as avg_ttfb,
          COUNT(DISTINCT session_id) as sessions
        FROM web_vitals_logs
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY page_url
        ORDER BY COUNT(*) DESC
        LIMIT 20
      ) p
    ),
    'trend', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          ROUND(AVG(metric_value) FILTER (WHERE metric_name = 'LCP')::numeric, 0) as avg_lcp,
          ROUND(AVG(metric_value) FILTER (WHERE metric_name = 'FCP')::numeric, 0) as avg_fcp,
          ROUND(AVG(metric_value) FILTER (WHERE metric_name = 'CLS')::numeric, 3) as avg_cls
        FROM web_vitals_logs
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
      ) t
    ),
    'by_device', (
      SELECT json_agg(row_to_json(d))
      FROM (
        SELECT 
          COALESCE(device_type, 'unknown') as device_type,
          ROUND(AVG(metric_value) FILTER (WHERE metric_name = 'LCP')::numeric, 0) as avg_lcp,
          ROUND(AVG(metric_value) FILTER (WHERE metric_name = 'FCP')::numeric, 0) as avg_fcp,
          ROUND(AVG(metric_value) FILTER (WHERE metric_name = 'CLS')::numeric, 3) as avg_cls,
          COUNT(*) as samples
        FROM web_vitals_logs
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY device_type
      ) d
    )
  ) INTO result;

  RETURN result;
END;
$$;