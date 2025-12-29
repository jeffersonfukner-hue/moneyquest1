-- Create admin settings table for retention thresholds
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage settings
CREATE POLICY "Super admins can manage settings"
  ON public.admin_settings
  FOR ALL
  USING (is_super_admin(auth.uid()));

-- Create admin notifications table
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  is_read boolean DEFAULT false,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Super admins can manage notifications
CREATE POLICY "Super admins can manage notifications"
  ON public.admin_notifications
  FOR ALL
  USING (is_super_admin(auth.uid()));

-- Insert default retention thresholds
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES (
  'retention_thresholds',
  '{"day1": 50, "day7": 30, "day30": 15, "enabled": true}'::jsonb
);

-- Create function to check retention and create notifications
CREATE OR REPLACE FUNCTION public.admin_check_retention_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings jsonb;
  day1_threshold numeric;
  day7_threshold numeric;
  day30_threshold numeric;
  is_enabled boolean;
  total_users integer;
  day1_rate numeric;
  day7_rate numeric;
  day30_rate numeric;
  alerts jsonb := '[]'::jsonb;
  now_time timestamp with time zone := now();
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  -- Get settings
  SELECT setting_value INTO settings
  FROM public.admin_settings
  WHERE setting_key = 'retention_thresholds';
  
  IF settings IS NULL THEN
    RETURN '{"alerts": [], "message": "No settings configured"}'::jsonb;
  END IF;
  
  is_enabled := COALESCE((settings->>'enabled')::boolean, true);
  
  IF NOT is_enabled THEN
    RETURN '{"alerts": [], "message": "Alerts disabled"}'::jsonb;
  END IF;
  
  day1_threshold := COALESCE((settings->>'day1')::numeric, 50);
  day7_threshold := COALESCE((settings->>'day7')::numeric, 30);
  day30_threshold := COALESCE((settings->>'day30')::numeric, 15);
  
  -- Calculate retention rates
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  
  IF total_users = 0 THEN
    RETURN '{"alerts": [], "message": "No users"}'::jsonb;
  END IF;
  
  -- Day 1 retention
  SELECT ROUND(
    (COUNT(*) FILTER (WHERE 
      last_active_date IS NOT NULL AND 
      last_active_date::text != created_at::date::text
    )::numeric / NULLIF(total_users, 0)) * 100, 1
  ) INTO day1_rate FROM public.profiles;
  
  -- Day 7 retention (users registered 7+ days ago who were active 7+ days after registration)
  SELECT ROUND(
    (COUNT(*) FILTER (WHERE 
      last_active_date IS NOT NULL AND
      CURRENT_DATE - created_at::date >= 7 AND
      last_active_date - created_at::date >= 7
    )::numeric / NULLIF(COUNT(*) FILTER (WHERE CURRENT_DATE - created_at::date >= 7), 0)) * 100, 1
  ) INTO day7_rate FROM public.profiles;
  
  -- Day 30 retention
  SELECT ROUND(
    (COUNT(*) FILTER (WHERE 
      last_active_date IS NOT NULL AND
      CURRENT_DATE - created_at::date >= 30 AND
      last_active_date - created_at::date >= 30
    )::numeric / NULLIF(COUNT(*) FILTER (WHERE CURRENT_DATE - created_at::date >= 30), 0)) * 100, 1
  ) INTO day30_rate FROM public.profiles;
  
  -- Check thresholds and create alerts
  IF COALESCE(day1_rate, 0) < day1_threshold THEN
    alerts := alerts || jsonb_build_object(
      'type', 'day1',
      'severity', 'error',
      'current', COALESCE(day1_rate, 0),
      'threshold', day1_threshold
    );
  END IF;
  
  IF COALESCE(day7_rate, 0) < day7_threshold THEN
    alerts := alerts || jsonb_build_object(
      'type', 'day7',
      'severity', CASE WHEN COALESCE(day7_rate, 0) < day7_threshold * 0.5 THEN 'error' ELSE 'warning' END,
      'current', COALESCE(day7_rate, 0),
      'threshold', day7_threshold
    );
  END IF;
  
  IF COALESCE(day30_rate, 0) < day30_threshold THEN
    alerts := alerts || jsonb_build_object(
      'type', 'day30',
      'severity', CASE WHEN COALESCE(day30_rate, 0) < day30_threshold * 0.5 THEN 'error' ELSE 'warning' END,
      'current', COALESCE(day30_rate, 0),
      'threshold', day30_threshold
    );
  END IF;
  
  RETURN jsonb_build_object(
    'alerts', alerts,
    'rates', jsonb_build_object('day1', day1_rate, 'day7', day7_rate, 'day30', day30_rate),
    'thresholds', jsonb_build_object('day1', day1_threshold, 'day7', day7_threshold, 'day30', day30_threshold)
  );
END;
$$;

-- Function to update retention thresholds
CREATE OR REPLACE FUNCTION public.admin_update_retention_thresholds(
  _day1 numeric,
  _day7 numeric,
  _day30 numeric,
  _enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;
  
  INSERT INTO public.admin_settings (setting_key, setting_value, updated_by, updated_at)
  VALUES (
    'retention_thresholds',
    jsonb_build_object('day1', _day1, 'day7', _day7, 'day30', _day30, 'enabled', _enabled),
    auth.uid(),
    now()
  )
  ON CONFLICT (setting_key) 
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();
END;
$$;