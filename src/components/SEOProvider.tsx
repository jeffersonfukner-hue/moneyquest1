import { useSEO } from '@/hooks/useSEO';
import { useDeferredTracking } from '@/hooks/useDeferredTracking';

interface SEOProviderProps {
  children: React.ReactNode;
}

/**
 * SEO Provider with deferred tracking for authenticated routes.
 */
export function SEOProvider({ children }: SEOProviderProps) {
  useSEO();
  useDeferredTracking();
  return <>{children}</>;
}

export default SEOProvider;
