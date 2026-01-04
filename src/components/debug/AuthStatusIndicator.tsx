import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Bug, ChevronDown, ChevronUp, Wifi, WifiOff, User, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Debug component for monitoring authentication status
 * Only visible in development mode
 */
export const AuthStatusIndicator = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Only show in development
  if (import.meta.env.PROD) return null;

  const isAuthenticated = !!user && !!session;
  const hasValidToken = !!session?.access_token;
  const tokenExpiry = session?.expires_at 
    ? new Date(session.expires_at * 1000) 
    : null;
  const isTokenExpired = tokenExpiry ? tokenExpiry < new Date() : false;

  return (
    <div className="fixed bottom-20 left-2 z-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono transition-all",
          "bg-background/80 backdrop-blur border shadow-sm",
          isAuthenticated && !isTokenExpired
            ? "border-green-500/50 text-green-600"
            : authLoading
            ? "border-yellow-500/50 text-yellow-600"
            : "border-red-500/50 text-red-600"
        )}
      >
        <Bug className="w-3 h-3" />
        {authLoading ? (
          <span className="animate-pulse">Loading...</span>
        ) : isAuthenticated ? (
          <>
            <Wifi className="w-3 h-3" />
            <User className="w-3 h-3" />
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <UserX className="w-3 h-3" />
          </>
        )}
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronUp className="w-3 h-3" />
        )}
      </button>

      {isExpanded && (
        <div className="absolute bottom-full left-0 mb-1 w-64 p-2 rounded-md bg-background/95 backdrop-blur border shadow-lg text-xs font-mono space-y-1.5">
          <div className="font-semibold text-foreground border-b pb-1 mb-1">
            Auth Debug
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Auth Loading:</span>
            <span className={authLoading ? "text-yellow-600" : "text-green-600"}>
              {authLoading ? "Yes" : "No"}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">User:</span>
            <span className={user ? "text-green-600" : "text-red-600"}>
              {user ? "✓" : "✗"}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Session:</span>
            <span className={session ? "text-green-600" : "text-red-600"}>
              {session ? "✓" : "✗"}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Token:</span>
            <span className={cn(
              hasValidToken && !isTokenExpired ? "text-green-600" : 
              isTokenExpired ? "text-red-600" : "text-yellow-600"
            )}>
              {hasValidToken ? (isTokenExpired ? "Expired" : "Valid") : "None"}
            </span>
          </div>
          
          {tokenExpiry && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires:</span>
              <span className="text-foreground truncate ml-2">
                {tokenExpiry.toLocaleTimeString()}
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Profile:</span>
            <span className={cn(
              profileLoading ? "text-yellow-600" : 
              profile ? "text-green-600" : "text-red-600"
            )}>
              {profileLoading ? "Loading..." : profile ? "✓" : "✗"}
            </span>
          </div>
          
          {user?.email && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="text-foreground truncate ml-2 max-w-[140px]">
                {user.email}
              </span>
            </div>
          )}
          
          {profile?.subscription_plan && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan:</span>
              <span className="text-foreground">
                {profile.subscription_plan}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
