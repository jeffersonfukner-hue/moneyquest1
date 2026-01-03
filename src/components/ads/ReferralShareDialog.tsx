import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Copy, Share2, Gift, ExternalLink } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ReferralShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralLink: string;
}

export const ReferralShareDialog = ({ 
  open, 
  onOpenChange, 
  referralLink 
}: ReferralShareDialogProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success(t('referral.linkCopied'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleShareWhatsApp = () => {
    const text = t('referral.shareMessage', { link: referralLink });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MoneyQuest',
          text: t('referral.shareMessage', { link: referralLink }),
          url: referralLink,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopyLink();
    }
  };

  const handleViewStats = () => {
    onOpenChange(false);
    navigate('/referral');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            {t('referral.dialogTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('referral.dialogDescription')}
          </DialogDescription>
        </DialogHeader>
        
        {/* Input com link */}
        <div className="flex gap-2 mt-4">
          <Input 
            value={referralLink} 
            readOnly 
            className="flex-1 text-sm bg-muted" 
          />
          <Button onClick={handleCopyLink} variant="outline" size="icon">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Botões de compartilhamento */}
        <div className="flex gap-3 mt-4">
          <Button 
            onClick={handleShareWhatsApp} 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <FaWhatsapp className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button 
            onClick={handleNativeShare} 
            variant="outline" 
            className="flex-1"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {t('referral.share')}
          </Button>
        </div>
        
        {/* Info sobre recompensas */}
        <div className="mt-4 p-3 bg-accent/50 rounded-lg border border-accent">
          <p className="text-sm font-medium text-foreground">
            {t('referral.rewards.title')}
          </p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1">
            <li>• {t('referral.rewards.xp', { amount: 500 })}</li>
            <li>• {t('referral.rewards.premium', { days: 7 })}</li>
          </ul>
        </div>

        {/* Link to full page */}
        <Button 
          variant="ghost" 
          onClick={handleViewStats}
          className="mt-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {t('referral.viewStats', 'Ver estatísticas completas')}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
