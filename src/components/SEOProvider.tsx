import { useSEO } from '@/hooks/useSEO';

interface SEOProviderProps {
  children: React.ReactNode;
}

export function SEOProvider({ children }: SEOProviderProps) {
  useSEO();
  return <>{children}</>;
}

export default SEOProvider;
