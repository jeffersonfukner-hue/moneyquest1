import { useSEO } from '@/hooks/useSEO';
import { useTrafficTracking } from '@/hooks/useTrafficTracking';

interface SEOProviderProps {
  children: React.ReactNode;
}

export function SEOProvider({ children }: SEOProviderProps) {
  useSEO();
  useTrafficTracking();
  return <>{children}</>;
}

export default SEOProvider;
