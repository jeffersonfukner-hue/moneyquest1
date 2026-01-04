import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Gamepad2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Global auth guard that:
 * 1. Shows loading screen while auth initializes
 * 2. Redirects to /login if not authenticated
 * 3. Renders children if authenticated
 */
export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading screen while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Gamepad2 className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};
