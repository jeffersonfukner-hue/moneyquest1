import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import { SUPPORT_CONFIG } from '@/lib/supportConfig';

interface PublicFooterProps {
  showSupport?: boolean;
  className?: string;
}

const PublicFooter = ({ showSupport = false, className = '' }: PublicFooterProps) => {
  const { t } = useTranslation();

  return (
    <footer className={`text-center space-y-3 ${className}`}>
      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <Shield className="w-3.5 h-3.5" />
        {t('landing.security.dataProtected')}
      </p>
      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground flex-wrap">
        <Link to="/about" className="hover:text-primary transition-colors">
          {t('nav.about', 'Sobre')}
        </Link>
        <span>•</span>
        <Link to="/terms" className="hover:text-primary transition-colors">
          {t('legal.terms.title')}
        </Link>
        <span>•</span>
        <Link to="/privacy" className="hover:text-primary transition-colors">
          {t('legal.privacy.title')}
        </Link>
        {showSupport && (
          <>
            <span>•</span>
            <Link to="/support" className="hover:text-primary transition-colors">
              {t('support.needHelp')}
            </Link>
          </>
        )}
        <span>•</span>
        <a 
          href={SUPPORT_CONFIG.social.instagram} 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors inline-flex items-center gap-1"
          aria-label="Instagram"
        >
          <FaInstagram className="w-3.5 h-3.5" />
        </a>
      </div>
    </footer>
  );
};

export default PublicFooter;
