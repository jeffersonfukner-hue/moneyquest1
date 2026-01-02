import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';

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
      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
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
      </div>
    </footer>
  );
};

export default PublicFooter;
