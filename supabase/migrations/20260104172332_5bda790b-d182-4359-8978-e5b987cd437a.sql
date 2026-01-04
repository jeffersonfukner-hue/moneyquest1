-- Drop and recreate admin_get_analytics with updated logic
DROP FUNCTION IF EXISTS admin_get_analytics();

CREATE OR REPLACE FUNCTION admin_get_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    total_users INTEGER;
    active_today INTEGER;
    premium_users INTEGER;
    engagement_rate DECIMAL;
BEGIN
    IF NOT is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Exclude internal users from metrics
    SELECT COUNT(*) INTO total_users 
    FROM profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role IN ('super_admin', 'admin')
    );
    
    SELECT COUNT(*) INTO active_today 
    FROM profiles p
    WHERE p.last_active_date = CURRENT_DATE
    AND NOT EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role IN ('super_admin', 'admin')
    );
    
    SELECT COUNT(*) INTO premium_users 
    FROM profiles p
    WHERE p.subscription_plan = 'PREMIUM'
    AND NOT EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role IN ('super_admin', 'admin')
    );
    
    -- Calculate engagement rate (users active in last 7 days / total)
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE last_active_date >= CURRENT_DATE - INTERVAL '7 days')::DECIMAL / NULLIF(COUNT(*), 0) * 100),
        0
    ) INTO engagement_rate
    FROM profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role IN ('super_admin', 'admin')
    );

    SELECT json_build_object(
        'total_users', total_users,
        'active_today', active_today,
        'premium_users', premium_users,
        'engagement_rate', ROUND(engagement_rate, 1)
    ) INTO result;

    RETURN result;
END;
$$;