import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

// Internal user email to exclude from analytics
const INTERNAL_EMAILS = ['jeffersonfukner@outlook.com'];

// Routes that are public and should defer tracking
const PUBLIC_ROUTES = [
  '/',
  '/blog',
  '/about',
  '/features',
  '/terms',
  '/privacy',
  '/controle-financeiro',
  '/educacao-financeira-gamificada',
  '/desafios-financeiros',
  '/app-financas-pessoais',
  '/login',
  '/signup',
  '/select-language',
];

// Routes to exclude from tracking entirely
const EXCLUDED_ROUTES = [
  '/super-admin',
  '/admin',
];

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

// Helper for requestIdleCallback with fallback
const scheduleIdleTask = (callback: () => void, timeout = 3000): number => {
  const win = window as typeof globalThis & { 
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (typeof win.requestIdleCallback === 'function') {
    return win.requestIdleCallback(callback, { timeout });
  }
  return setTimeout(callback, 2000) as unknown as number;
};

/**
 * Deferred tracking hook for public routes.
 * Delays Supabase calls to not block LCP/FCP.
 */
export const useDeferredTracking = () => {
  const location = useLocation();
  const { user } = useAuth();
  const pageLoadTime = useRef<number>(Date.now());
  const hasTracked = useRef<Set<string>>(new Set());

  const isPublicRoute = useCallback((pathname: string) => {
    return PUBLIC_ROUTES.some(route => 
      pathname === route || pathname.startsWith('/blog/')
    );
  }, []);

  const isExcludedRoute = useCallback((pathname: string) => {
    return EXCLUDED_ROUTES.some(route => pathname.startsWith(route));
  }, []);

  const trackPageView = useCallback(async () => {
    const { pathname } = location;
    
    // Skip if already tracked this path in this session
    if (hasTracked.current.has(pathname)) return;
    
    // Mark as tracked
    hasTracked.current.add(pathname);
    
    // Dynamically import supabase only when needed
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Check if internal user
    let isInternal = false;
    if (user?.email && INTERNAL_EMAILS.includes(user.email.toLowerCase())) {
      isInternal = true;
    } else if (user?.id) {
      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['super_admin', 'admin'])
          .maybeSingle();
        if (data) isInternal = true;
      } catch {
        // Silently fail
      }
    }

    const sessionId = getSessionId();
    const utmParams = getUTMParams();

    try {
      await supabase.from('traffic_logs').insert({
        user_id: user?.id || null,
        session_id: sessionId,
        page_url: pathname,
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
      console.debug('Traffic tracking error:', error);
    }
  }, [location, user]);

  useEffect(() => {
    const { pathname } = location;
    
    // Don't track admin routes
    if (isExcludedRoute(pathname)) return;
    
    pageLoadTime.current = Date.now();

    // For public routes, defer tracking to not block LCP
    if (isPublicRoute(pathname)) {
      const taskId = scheduleIdleTask(trackPageView);
      return () => {
        const win = window as typeof globalThis & { cancelIdleCallback?: (id: number) => void };
        if (typeof win.cancelIdleCallback === 'function') {
          win.cancelIdleCallback(taskId);
        } else {
          clearTimeout(taskId);
        }
      };
    } else {
      // Track immediately for authenticated routes
      trackPageView();
    }
  }, [location.pathname, isPublicRoute, isExcludedRoute, trackPageView]);

  // Track time on page when user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
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

// Track errors (404, etc.) - deferred
export const trackTrafficError = async (errorCode: number, pageUrl?: string) => {
  const track = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
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

  scheduleIdleTask(track, 1000);
};
