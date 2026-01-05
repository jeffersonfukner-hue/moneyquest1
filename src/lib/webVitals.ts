import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';

// Generate a session ID for grouping metrics
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('web-vitals-session');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('web-vitals-session', sessionId);
  }
  return sessionId;
};

// Detect device type
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

// Get browser name
const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera')) return 'Opera';
  return 'Other';
};

// Send metrics to Supabase
const sendToAnalytics = async (metric: Metric) => {
  const vitalsData = {
    session_id: getSessionId(),
    page_url: window.location.pathname,
    metric_name: metric.name,
    metric_value: metric.value,
    rating: metric.rating,
    navigation_type: metric.navigationType || 'unknown',
    device_type: getDeviceType(),
    browser: getBrowser(),
  };

  // Log in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: `${Math.round(metric.value)}${metric.name === 'CLS' ? '' : 'ms'}`,
      rating: metric.rating,
    });
    return;
  }

  // In production, send to Supabase
  try {
    const { error } = await supabase
      .from('web_vitals_logs')
      .insert(vitalsData);
    
    if (error) {
      console.warn('[Web Vitals] Failed to save:', error.message);
    }
  } catch (err) {
    // Silently fail - don't break the app for analytics
    console.warn('[Web Vitals] Error:', err);
  }
};

// Initialize Web Vitals monitoring
export const initWebVitals = () => {
  // Only initialize once
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  onLCP(sendToAnalytics);  // Largest Contentful Paint
  onCLS(sendToAnalytics);  // Cumulative Layout Shift
  onINP(sendToAnalytics);  // Interaction to Next Paint (replaced FID)
  
  // Additional metrics
  onFCP(sendToAnalytics);  // First Contentful Paint
  onTTFB(sendToAnalytics); // Time to First Byte
};
