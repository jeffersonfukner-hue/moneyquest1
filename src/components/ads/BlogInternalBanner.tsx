import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Crown, Sparkles, UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogInternalBannerProps {
  position?: 'sidebar' | 'inline';
  className?: string;
}

/**
 * BlogInternalBanner - Internal promotional banners for blog pages
 * 
 * Strategy by user type:
 * - PREMIUM: No internal ads (respect premium experience)
 * - FREE: Upgrade to Premium CTAs
 * - VISITOR: Institutional CTAs (create account, learn about app)
 * 
 * Note: Uses useProfile directly instead of useSubscription to work
 * on public routes without SubscriptionProvider
 */
export const BlogInternalBanner = ({ position = 'inline', className = '' }: BlogInternalBannerProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  
  // Check premium status safely without SubscriptionProvider
  const isPremium = profile?.subscription_plan === 'PREMIUM' || 
                    profile?.stripe_subscription_status === 'active';

  // Premium users: No internal promotional ads
  if (user && isPremium) {
    return null;
  }

  // FREE logged-in users: Premium upgrade CTAs
  if (user && !isPremium) {
    return (
      <div className={`rounded-xl overflow-hidden ${className}`}>
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 md:p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-lg shrink-0">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base md:text-lg mb-1">
                Desbloqueie todo o potencial
              </h3>
              <p className="text-white/90 text-sm mb-3">
                Relatórios avançados, metas ilimitadas e coach financeiro com IA.
              </p>
              <Button
                asChild
                size="sm"
                className="bg-white text-orange-600 hover:bg-white/90 font-semibold"
              >
                <Link to="/premium">
                  Conhecer Premium
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Visitors (not logged in): Institutional CTAs
  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-primary to-primary/80 p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base md:text-lg mb-1">
              Controle suas finanças de forma divertida
            </h3>
            <p className="text-white/90 text-sm mb-3">
              Gamificação, metas e insights para transformar sua vida financeira.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                size="sm"
                className="bg-white text-primary hover:bg-white/90 font-semibold"
              >
                <Link to="/signup">
                  <UserPlus className="mr-1 h-4 w-4" />
                  Criar conta grátis
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 border border-white/30"
              >
                <Link to="/features">
                  Conhecer recursos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogInternalBanner;
