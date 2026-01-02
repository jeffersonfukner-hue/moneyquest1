import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const REFERRAL_CODE_KEY = 'moneyquest_referral_code';

export const saveReferralCode = (code: string) => {
  localStorage.setItem(REFERRAL_CODE_KEY, code.toLowerCase());
};

export const getReferralCode = (): string | null => {
  return localStorage.getItem(REFERRAL_CODE_KEY);
};

export const clearReferralCode = () => {
  localStorage.removeItem(REFERRAL_CODE_KEY);
};

const ReferralRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      // Save referral code to localStorage
      saveReferralCode(code);
      console.log('[Referral] Code saved:', code);
    }
    
    // Redirect to signup page
    navigate('/signup', { replace: true });
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
};

export default ReferralRedirect;
