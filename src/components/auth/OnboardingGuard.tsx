import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * Guard component that redirects users to onboarding if they haven't completed it.
 * Used to wrap the main app routes.
 */
export const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for both auth and profile to load
    if (authLoading || profileLoading) return;

    // If user is logged in and hasn't completed onboarding, redirect
    if (user && profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, profile, authLoading, profileLoading, navigate]);

  return <>{children}</>;
};
