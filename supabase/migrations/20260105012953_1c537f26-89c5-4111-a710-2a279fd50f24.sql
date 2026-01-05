-- Create function to check web vitals and generate alerts
CREATE OR REPLACE FUNCTION public.admin_check_web_vitals_alerts()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  lcp_avg NUMERIC;
  cls_avg NUMERIC;
  fcp_avg NUMERIC;
  inp_avg NUMERIC;
  sample_count INTEGER;
  alert_created BOOLEAN := false;
BEGIN
  -- Check if user is super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get averages from last 24 hours
  SELECT 
    AVG(metric_value) FILTER (WHERE metric_name = 'LCP'),
    AVG(metric_value) FILTER (WHERE metric_name = 'CLS'),
    AVG(metric_value) FILTER (WHERE metric_name = 'FCP'),
    AVG(metric_value) FILTER (WHERE metric_name = 'INP'),
    COUNT(*)
  INTO lcp_avg, cls_avg, fcp_avg, inp_avg, sample_count
  FROM web_vitals_logs
  WHERE created_at >= now() - interval '24 hours';

  -- Only check if we have enough samples (at least 10)
  IF sample_count < 10 THEN
    RETURN json_build_object(
      'checked', false,
      'reason', 'Insufficient samples',
      'sample_count', sample_count
    );
  END IF;

  -- Check LCP threshold (> 2500ms is poor)
  IF lcp_avg IS NOT NULL AND lcp_avg > 2500 THEN
    INSERT INTO admin_notifications (notification_type, title, message, severity, metadata)
    VALUES (
      'web_vitals_alert',
      'LCP Performance Alert',
      format('Average LCP is %sms (threshold: 2500ms). Users may experience slow page loads.', ROUND(lcp_avg)),
      CASE WHEN lcp_avg > 4000 THEN 'error' ELSE 'warning' END,
      json_build_object('metric', 'LCP', 'value', lcp_avg, 'threshold', 2500)
    )
    ON CONFLICT DO NOTHING;
    alert_created := true;
  END IF;

  -- Check CLS threshold (> 0.1 is poor)
  IF cls_avg IS NOT NULL AND cls_avg > 0.1 THEN
    INSERT INTO admin_notifications (notification_type, title, message, severity, metadata)
    VALUES (
      'web_vitals_alert',
      'CLS Performance Alert',
      format('Average CLS is %s (threshold: 0.1). Users may experience layout shifts.', ROUND(cls_avg::numeric, 3)),
      CASE WHEN cls_avg > 0.25 THEN 'error' ELSE 'warning' END,
      json_build_object('metric', 'CLS', 'value', cls_avg, 'threshold', 0.1)
    )
    ON CONFLICT DO NOTHING;
    alert_created := true;
  END IF;

  -- Check FCP threshold (> 1800ms is poor)
  IF fcp_avg IS NOT NULL AND fcp_avg > 1800 THEN
    INSERT INTO admin_notifications (notification_type, title, message, severity, metadata)
    VALUES (
      'web_vitals_alert',
      'FCP Performance Alert',
      format('Average FCP is %sms (threshold: 1800ms). First paint is delayed.', ROUND(fcp_avg)),
      CASE WHEN fcp_avg > 3000 THEN 'error' ELSE 'warning' END,
      json_build_object('metric', 'FCP', 'value', fcp_avg, 'threshold', 1800)
    )
    ON CONFLICT DO NOTHING;
    alert_created := true;
  END IF;

  -- Check INP threshold (> 200ms is poor)
  IF inp_avg IS NOT NULL AND inp_avg > 200 THEN
    INSERT INTO admin_notifications (notification_type, title, message, severity, metadata)
    VALUES (
      'web_vitals_alert',
      'INP Performance Alert',
      format('Average INP is %sms (threshold: 200ms). Interactions may feel sluggish.', ROUND(inp_avg)),
      CASE WHEN inp_avg > 500 THEN 'error' ELSE 'warning' END,
      json_build_object('metric', 'INP', 'value', inp_avg, 'threshold', 200)
    )
    ON CONFLICT DO NOTHING;
    alert_created := true;
  END IF;

  RETURN json_build_object(
    'checked', true,
    'sample_count', sample_count,
    'alert_created', alert_created,
    'metrics', json_build_object(
      'lcp', lcp_avg,
      'cls', cls_avg,
      'fcp', fcp_avg,
      'inp', inp_avg
    )
  );
END;
$$;