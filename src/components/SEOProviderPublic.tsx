import { useSEO } from '@/hooks/useSEO';
import { useDeferredTracking } from '@/hooks/useDeferredTracking';

interface SEOProviderPublicProps {
  children: React.ReactNode;
}

/**
 * Optimized SEO Provider for public routes.
 * Uses deferred tracking to not block LCP/FCP.
 */
export function SEOProviderPublic({ children }: SEOProviderPublicProps) {
  useSEO();
  useDeferredTracking();
  return <>{children}</>;
}

export default SEOProviderPublic;
