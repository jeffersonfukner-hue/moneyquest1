-- Create traffic_logs table for storing page views and user behavior
CREATE TABLE public.traffic_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    device_type TEXT DEFAULT 'desktop',
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    language TEXT,
    timezone TEXT,
    screen_resolution TEXT,
    time_on_page INTEGER DEFAULT 0,
    is_bounce BOOLEAN DEFAULT false,
    error_code INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_traffic_logs_created_at ON public.traffic_logs(created_at DESC);
CREATE INDEX idx_traffic_logs_page_url ON public.traffic_logs(page_url);
CREATE INDEX idx_traffic_logs_session_id ON public.traffic_logs(session_id);
CREATE INDEX idx_traffic_logs_user_id ON public.traffic_logs(user_id);
CREATE INDEX idx_traffic_logs_error_code ON public.traffic_logs(error_code) WHERE error_code IS NOT NULL;

-- Enable RLS
ALTER TABLE public.traffic_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view traffic logs (aggregated data)
CREATE POLICY "Super admins can view traffic logs"
ON public.traffic_logs
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Anyone can insert traffic logs (for tracking)
CREATE POLICY "Anyone can insert traffic logs"
ON public.traffic_logs
FOR INSERT
WITH CHECK (true);

-- Create function to get traffic analytics
CREATE OR REPLACE FUNCTION admin_get_traffic_analytics(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT (now() - interval '30 days'),
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
        'total_views', (SELECT COUNT(*) FROM traffic_logs WHERE created_at BETWEEN p_start_date AND p_end_date),
        'unique_users', (SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id)) FROM traffic_logs WHERE created_at BETWEEN p_start_date AND p_end_date),
        'unique_sessions', (SELECT COUNT(DISTINCT session_id) FROM traffic_logs WHERE created_at BETWEEN p_start_date AND p_end_date),
        'avg_pages_per_session', (
            SELECT COALESCE(AVG(page_count), 0)
            FROM (
                SELECT session_id, COUNT(*) as page_count
                FROM traffic_logs
                WHERE created_at BETWEEN p_start_date AND p_end_date
                GROUP BY session_id
            ) s
        ),
        'avg_time_on_page', (SELECT COALESCE(AVG(time_on_page), 0) FROM traffic_logs WHERE created_at BETWEEN p_start_date AND p_end_date AND time_on_page > 0),
        'bounce_rate', (
            SELECT COALESCE(
                (COUNT(*) FILTER (WHERE is_bounce = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100),
                0
            )
            FROM traffic_logs
            WHERE created_at BETWEEN p_start_date AND p_end_date
        ),
        'views_by_day', (
            SELECT COALESCE(json_agg(row_to_json(d)), '[]'::json)
            FROM (
                SELECT DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT session_id) as sessions
                FROM traffic_logs
                WHERE created_at BETWEEN p_start_date AND p_end_date
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 30
            ) d
        ),
        'views_by_hour', (
            SELECT COALESCE(json_agg(row_to_json(h)), '[]'::json)
            FROM (
                SELECT EXTRACT(HOUR FROM created_at)::INTEGER as hour, COUNT(*) as views
                FROM traffic_logs
                WHERE created_at BETWEEN p_start_date AND p_end_date
                GROUP BY EXTRACT(HOUR FROM created_at)
                ORDER BY hour
            ) h
        ),
        'views_by_device', (
            SELECT COALESCE(json_agg(row_to_json(dev)), '[]'::json)
            FROM (
                SELECT COALESCE(device_type, 'unknown') as device, COUNT(*) as views
                FROM traffic_logs
                WHERE created_at BETWEEN p_start_date AND p_end_date
                GROUP BY device_type
            ) dev
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- Create function to get top pages
CREATE OR REPLACE FUNCTION admin_get_top_pages(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT (now() - interval '30 days'),
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    p_limit INTEGER DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json)
    FROM (
        SELECT 
            page_url,
            MAX(page_title) as page_title,
            COUNT(*) as total_views,
            COUNT(DISTINCT COALESCE(user_id::text, session_id)) as unique_users,
            COALESCE(AVG(time_on_page) FILTER (WHERE time_on_page > 0), 0)::INTEGER as avg_time,
            (COUNT(*) FILTER (WHERE is_bounce = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100)::INTEGER as exit_rate
        FROM traffic_logs
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY page_url
        ORDER BY total_views DESC
        LIMIT p_limit
    ) p INTO result;

    RETURN result;
END;
$$;

-- Create function to get traffic sources
CREATE OR REPLACE FUNCTION admin_get_traffic_sources(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT (now() - interval '30 days'),
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
    IF NOT is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT json_build_object(
        'by_source', (
            SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
            FROM (
                SELECT 
                    CASE 
                        WHEN referrer IS NULL OR referrer = '' THEN 'direct'
                        WHEN referrer ILIKE '%google%' OR referrer ILIKE '%bing%' OR referrer ILIKE '%yahoo%' THEN 'organic'
                        WHEN referrer ILIKE '%facebook%' OR referrer ILIKE '%twitter%' OR referrer ILIKE '%instagram%' OR referrer ILIKE '%linkedin%' THEN 'social'
                        ELSE 'referral'
                    END as source,
                    COUNT(*) as views
                FROM traffic_logs
                WHERE created_at BETWEEN p_start_date AND p_end_date
                GROUP BY source
                ORDER BY views DESC
            ) s
        ),
        'by_utm', (
            SELECT COALESCE(json_agg(row_to_json(u)), '[]'::json)
            FROM (
                SELECT utm_source, utm_medium, utm_campaign, COUNT(*) as views
                FROM traffic_logs
                WHERE created_at BETWEEN p_start_date AND p_end_date
                  AND utm_source IS NOT NULL
                GROUP BY utm_source, utm_medium, utm_campaign
                ORDER BY views DESC
                LIMIT 20
            ) u
        ),
        'by_country', (
            SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json)
            FROM (
                SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as views
                FROM traffic_logs
                WHERE created_at BETWEEN p_start_date AND p_end_date
                GROUP BY country
                ORDER BY views DESC
                LIMIT 20
            ) c
        ),
        'by_language', (
            SELECT COALESCE(json_agg(row_to_json(l)), '[]'::json)
            FROM (
                SELECT COALESCE(language, 'Unknown') as language, COUNT(*) as views
                FROM traffic_logs
                WHERE created_at BETWEEN p_start_date AND p_end_date
                GROUP BY language
                ORDER BY views DESC
                LIMIT 10
            ) l
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- Create function to get error logs
CREATE OR REPLACE FUNCTION admin_get_traffic_errors(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT (now() - interval '30 days'),
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
    IF NOT is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json)
    FROM (
        SELECT 
            page_url,
            error_code,
            referrer as origin,
            COUNT(*) as occurrences,
            MAX(created_at) as last_occurrence
        FROM traffic_logs
        WHERE created_at BETWEEN p_start_date AND p_end_date
          AND error_code IS NOT NULL
        GROUP BY page_url, error_code, referrer
        ORDER BY occurrences DESC
        LIMIT 100
    ) e INTO result;

    RETURN result;
END;
$$;

-- Create function to detect suspicious access
CREATE OR REPLACE FUNCTION admin_get_suspicious_access(
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
    IF NOT is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT json_build_object(
        'high_frequency', (
            SELECT COALESCE(json_agg(row_to_json(h)), '[]'::json)
            FROM (
                SELECT 
                    session_id,
                    COUNT(*) as request_count,
                    MIN(created_at) as first_request,
                    MAX(created_at) as last_request
                FROM traffic_logs
                WHERE created_at BETWEEN p_start_date AND p_end_date
                GROUP BY session_id
                HAVING COUNT(*) > 100
                ORDER BY request_count DESC
                LIMIT 20
            ) h
        ),
        'admin_attempts', (
            SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
            FROM (
                SELECT 
                    page_url,
                    session_id,
                    COUNT(*) as attempts,
                    MAX(created_at) as last_attempt
                FROM traffic_logs
                WHERE created_at BETWEEN p_start_date AND p_end_date
                  AND (page_url ILIKE '%admin%' OR page_url ILIKE '%super-admin%')
                  AND error_code IN (401, 403)
                GROUP BY page_url, session_id
                ORDER BY attempts DESC
                LIMIT 20
            ) a
        ),
        'unusual_origins', (
            SELECT COALESCE(json_agg(row_to_json(u)), '[]'::json)
            FROM (
                SELECT 
                    country,
                    COUNT(*) as views,
                    COUNT(DISTINCT session_id) as sessions
                FROM traffic_logs
                WHERE created_at BETWEEN p_start_date AND p_end_date
                  AND country NOT IN ('Brazil', 'BR', 'United States', 'US', 'Portugal', 'PT')
                  AND country IS NOT NULL
                GROUP BY country
                HAVING COUNT(*) > 10
                ORDER BY views DESC
                LIMIT 10
            ) u
        )
    ) INTO result;

    RETURN result;
END;
$$;