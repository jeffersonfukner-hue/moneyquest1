import { useEffect } from 'react';

const SitemapRedirect = () => {
  useEffect(() => {
    // Redirect to the dynamic sitemap edge function
    window.location.replace('https://dybbailvbaaovkstgpoh.supabase.co/functions/v1/sitemap');
  }, []);

  return null;
};

export default SitemapRedirect;
