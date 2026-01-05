import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

type WebVitalsMetric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
};

// Send metrics to analytics endpoint
const sendToAnalytics = (metric: Metric) => {
  const vitalsData: WebVitalsMetric = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || 'unknown',
  };

  // Log in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: `${Math.round(metric.value)}${metric.name === 'CLS' ? '' : 'ms'}`,
      rating: metric.rating,
    });
    return;
  }

  // In production, send to analytics via beacon or fetch
  // Using navigator.sendBeacon for reliability (fires even on page unload)
  const url = '/api/vitals'; // Could be replaced with actual endpoint
  
  // For now, we'll store in sessionStorage for debugging and log to console
  try {
    const existingVitals = JSON.parse(sessionStorage.getItem('web-vitals') || '[]');
    existingVitals.push({
      ...vitalsData,
      timestamp: Date.now(),
      url: window.location.pathname,
    });
    sessionStorage.setItem('web-vitals', JSON.stringify(existingVitals.slice(-20)));
  } catch {
    // Silently fail if sessionStorage is not available
  }

  // Log to console in production for debugging via browser DevTools
  console.info(`[Web Vitals] ${metric.name}: ${Math.round(metric.value)}${metric.name === 'CLS' ? '' : 'ms'} (${metric.rating})`);
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

// Get stored vitals for debugging
export const getStoredVitals = (): WebVitalsMetric[] => {
  try {
    return JSON.parse(sessionStorage.getItem('web-vitals') || '[]');
  } catch {
    return [];
  }
};

// Clear stored vitals
export const clearStoredVitals = () => {
  try {
    sessionStorage.removeItem('web-vitals');
  } catch {
    // Silently fail
  }
};
