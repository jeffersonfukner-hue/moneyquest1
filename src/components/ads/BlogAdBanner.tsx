import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';

interface BlogAdBannerProps {
  position: 'header' | 'in-article' | 'footer';
  className?: string;
}

// Ad slot mapping and heights to prevent CLS
const AD_CONFIG = {
  header: {
    slot: ADSENSE_CONFIG.slots.blogHeader || ADSENSE_CONFIG.slots.bottomBanner,
    format: 'auto',
    minHeight: '90px',
  },
  'in-article': {
    slot: ADSENSE_CONFIG.slots.blogInArticle || ADSENSE_CONFIG.slots.bottomBanner,
    format: 'fluid',
    minHeight: '250px',
  },
  footer: {
    slot: ADSENSE_CONFIG.slots.blogFooter || ADSENSE_CONFIG.slots.bottomBanner,
    format: 'auto',
    minHeight: '90px',
  },
};

export const BlogAdBanner = ({ position, className = '' }: BlogAdBannerProps) => {
  const { user } = useAuth();
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const initAttempted = useRef(false);

  const config = AD_CONFIG[position];

  // CRITICAL: Never render ads for logged-in users
  if (user) {
    return null;
  }

  // Check if AdSense is configured
  if (!ADSENSE_CONFIG.client || !config.slot) {
    return null;
  }

  useEffect(() => {
    if (initAttempted.current || !adRef.current) return;
    initAttempted.current = true;

    const timer = setTimeout(() => {
      try {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
        setAdLoaded(true);
      } catch (error) {
        console.error('BlogAdBanner: Error initializing ad', error);
        setAdError(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Don't render anything if there's an error
  if (adError) {
    return null;
  }

  return (
    <div 
      className={`w-full overflow-hidden rounded-lg ${className}`}
      style={{ minHeight: config.minHeight }}
      aria-label="Publicidade"
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ 
          display: 'block',
          minHeight: config.minHeight,
          width: '100%',
        }}
        data-ad-client={ADSENSE_CONFIG.client}
        data-ad-slot={config.slot}
        data-ad-format={config.format}
        data-full-width-responsive="true"
        {...(position === 'in-article' && {
          'data-ad-layout': 'in-article',
        })}
      />
    </div>
  );
};

export default BlogAdBanner;
