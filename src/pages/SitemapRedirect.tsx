import { useEffect } from 'react';

const SitemapRedirect = () => {
  useEffect(() => {
    // Redirect to the dynamic sitemap backend function
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    window.location.replace(`${baseUrl}/functions/v1/sitemap`);
  }, []);

  return null;
};

export default SitemapRedirect;
