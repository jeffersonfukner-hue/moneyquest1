import { useEffect } from 'react';
import { useFingerprint } from '@/hooks/useFingerprint';

/**
 * Component that captures device fingerprint on mount.
 * Should be placed inside AuthProvider to have access to user context.
 */
export const FingerprintCapture = () => {
  const { captureFingerprint } = useFingerprint();

  useEffect(() => {
    // The hook already handles capturing on user login
    // This component just ensures the hook is used
  }, [captureFingerprint]);

  return null; // This component doesn't render anything
};
