import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AB_TESTS, ABTestName } from '@/lib/abTestConfig';
import { Json } from '@/integrations/supabase/types';

const STORAGE_PREFIX = 'ab_test_';

function getStoredVariant(testName: string): string | null {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${testName}`);
  } catch {
    return null;
  }
}

function storeVariant(testName: string, variant: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${testName}`, variant);
  } catch {
    // localStorage not available
  }
}

function selectVariant(variants: readonly string[], weights?: readonly number[]): string {
  if (!weights || weights.length !== variants.length) {
    // Equal distribution
    const index = Math.floor(Math.random() * variants.length);
    return variants[index];
  }

  // Weighted selection
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < variants.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return variants[i];
    }
  }
  
  return variants[variants.length - 1];
}

export function useABTest<T extends ABTestName>(testName: T) {
  const { user } = useAuth();
  const test = AB_TESTS[testName];
  const [variant] = useState<string>(() => {
    // Try to get stored variant first
    const stored = getStoredVariant(test.name);
    if (stored && (test.variants as readonly string[]).includes(stored)) {
      return stored;
    }
    // Select new variant
    const selected = selectVariant(test.variants, test.weights);
    storeVariant(test.name, selected);
    return selected;
  });

  const impressionTracked = useRef(false);

  // Track an event
  const trackEvent = useCallback(async (
    eventType: 'impression' | 'click' | 'conversion',
    metadata?: Record<string, string | number | boolean>
  ) => {
    try {
      await supabase.from('ab_test_events').insert([{
        user_id: user?.id || null,
        test_name: test.name,
        variant,
        event_type: eventType,
        metadata: (metadata || {}) as Json,
      }]);
    } catch (error) {
      console.warn('Failed to track A/B test event:', error);
    }
  }, [user?.id, test.name, variant]);

  // Track impression once per mount
  const trackImpression = useCallback(() => {
    if (!impressionTracked.current) {
      impressionTracked.current = true;
      trackEvent('impression');
    }
  }, [trackEvent]);

  // Track click
  const trackClick = useCallback((metadata?: Record<string, string | number | boolean>) => {
    trackEvent('click', metadata);
  }, [trackEvent]);

  // Track conversion (e.g., successful upgrade)
  const trackConversion = useCallback((metadata?: Record<string, string | number | boolean>) => {
    trackEvent('conversion', metadata);
  }, [trackEvent]);

  return {
    variant: variant as typeof test.variants[number],
    trackImpression,
    trackClick,
    trackConversion,
    isVariant: (v: typeof test.variants[number]) => variant === v,
  };
}
