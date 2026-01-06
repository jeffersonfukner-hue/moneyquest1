import { ShoppingBag, Coins, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

export const ShopQuickAccessCard = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();

  if (!profile) return null;

  return (
    <button
      onClick={() => navigate('/shop')}
      className={cn(
        "w-full bg-gradient-to-r from-accent/10 via-accent/5 to-transparent",
        "border border-accent/20 rounded-xl p-3",
        "flex items-center justify-between gap-3",
        "hover:border-accent/40 hover:from-accent/15 transition-all",
        "group active:scale-[0.99]"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-accent" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            Loja MoneyQuest
            <Sparkles className="w-3.5 h-3.5 text-accent" />
          </p>
          <p className="text-xs text-muted-foreground">
            Temas, avatares, boosters e mais
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded-full">
          <Coins className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-bold text-accent">
            {profile.mq_coins?.toLocaleString() || 0}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
      </div>
    </button>
  );
};
