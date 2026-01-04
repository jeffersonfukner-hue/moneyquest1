import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Internal user email to exclude from analytics
const INTERNAL_EMAILS = ['jeffersonfukner@outlook.com'];

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('traffic_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('traffic_session_id', sessionId);
  }
  return sessionId;
};

// Detect device type
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Get browser name
const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown';
};

// Get OS
const getOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
};

// Parse UTM parameters
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
  };
};

// Routes to exclude from tracking
const EXCLUDED_ROUTES = [
  '/super-admin',
  '/admin',
];

// Check if user is internal (developer/admin)
const checkIsInternalUser = async (userId: string | undefined, userEmail: string | undefined): Promise<boolean> => {
  // Check by email
  if (userEmail && INTERNAL_EMAILS.includes(userEmail.toLowerCase())) {
    return true;
  }
  
  // Check by role in database
  if (userId) {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['super_admin', 'admin'])
        .maybeSingle();
      
      if (data) return true;
    } catch {
      // Silently fail
    }
  }
  
  return false;
};

export const useTrafficTracking = () => {
  const location = useLocation();
  const { user } = useAuth();
  const pageLoadTime = useRef<number>(Date.now());
  const lastPath = useRef<string>('');

  useEffect(() => {
    // Don't track admin routes
    if (EXCLUDED_ROUTES.some(route => location.pathname.startsWith(route))) {
      return;
    }

    const trackPageView = async () => {
      // Check if internal user
      const isInternal = await checkIsInternalUser(user?.id, user?.email);

      pageLoadTime.current = Date.now();
      lastPath.current = location.pathname;

      const sessionId = getSessionId();
      const utmParams = getUTMParams();

      try {
        await supabase.from('traffic_logs').insert({
          user_id: user?.id || null,
          session_id: sessionId,
          page_url: location.pathname,
          page_title: document.title,
          referrer: document.referrer || null,
          ...utmParams,
          device_type: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          is_internal_user: isInternal,
        });
      } catch (error) {
        // Silently fail - don't impact user experience
        console.debug('Traffic tracking error:', error);
      }
    };

    trackPageView();
  }, [location.pathname, user?.id, user?.email]);

  // Track time on page when user leaves
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const timeOnPage = Math.round((Date.now() - pageLoadTime.current) / 1000);
      const sessionId = getSessionId();

      // Use sendBeacon for reliability on page unload
      const data = JSON.stringify({
        session_id: sessionId,
        page_url: location.pathname,
        time_on_page: timeOnPage,
      });

      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/update_traffic_time`,
        data
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [location.pathname]);
};

// Track errors (404, etc.)
export const trackTrafficError = async (errorCode: number, pageUrl?: string) => {
  try {
    const sessionId = getSessionId();
    await supabase.from('traffic_logs').insert({
      session_id: sessionId,
      page_url: pageUrl || window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || null,
      device_type: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      error_code: errorCode,
    });
  } catch (error) {
    console.debug('Error tracking failed:', error);
  }
};
