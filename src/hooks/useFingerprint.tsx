import { useEffect, useCallback, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface FingerprintResult {
  success: boolean;
  trialBlocked: boolean;
  reason?: string;
}

export const useFingerprint = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [trialBlocked, setTrialBlocked] = useState(false);

  const captureFingerprint = useCallback(async (): Promise<FingerprintResult> => {
    if (!user?.id) {
      return { success: false, trialBlocked: false };
    }

    try {
      // Initialize FingerprintJS
      const fp = await FingerprintJS.load();
      const result = await fp.get();

      // Gather additional device info
      const fingerprintData = {
        p_user_id: user.id,
        p_fingerprint_hash: result.visitorId,
        p_user_agent: navigator.userAgent,
        p_screen_resolution: `${screen.width}x${screen.height}`,
        p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        p_language: navigator.language,
      };

      // Call the RPC function that checks for trial abuse
      const { data, error } = await supabase.rpc(
        'register_fingerprint_with_trial_check',
        fingerprintData
      );

      if (error) {
        console.error('Error registering fingerprint:', error);
        return { success: false, trialBlocked: false };
      }

      const response = data as { success: boolean; trial_blocked: boolean; reason?: string; message?: string };

      // If trial was blocked due to abuse
      if (response?.trial_blocked) {
        setTrialBlocked(true);
        toast.error(t('trial.abuseDetected'), {
          description: t('trial.abuseMessage'),
          duration: 10000,
        });
        return { 
          success: false, 
          trialBlocked: true, 
          reason: response.reason 
        };
      }

      return { success: true, trialBlocked: false };
    } catch (error) {
      console.error('Error capturing fingerprint:', error);
      return { success: false, trialBlocked: false };
    }
  }, [user?.id, t]);

  // Capture fingerprint when user logs in
  useEffect(() => {
    if (user?.id) {
      captureFingerprint();
    }
  }, [user?.id, captureFingerprint]);

  return { captureFingerprint, trialBlocked };
};
