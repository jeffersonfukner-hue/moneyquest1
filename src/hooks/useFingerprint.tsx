import { useEffect, useCallback } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useFingerprint = () => {
  const { user } = useAuth();

  const captureFingerprint = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Initialize FingerprintJS
      const fp = await FingerprintJS.load();
      const result = await fp.get();

      // Gather additional device info
      const fingerprintData = {
        user_id: user.id,
        fingerprint_hash: result.visitorId,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
      };

      // Insert fingerprint (will be ignored if duplicate due to unique constraint)
      const { error } = await supabase
        .from('user_fingerprints')
        .upsert(fingerprintData, { 
          onConflict: 'user_id,fingerprint_hash',
          ignoreDuplicates: true 
        });

      if (error && !error.message.includes('duplicate')) {
        console.error('Error saving fingerprint:', error);
      }
    } catch (error) {
      console.error('Error capturing fingerprint:', error);
    }
  }, [user?.id]);

  // Capture fingerprint when user logs in
  useEffect(() => {
    if (user?.id) {
      captureFingerprint();
    }
  }, [user?.id, captureFingerprint]);

  return { captureFingerprint };
};
