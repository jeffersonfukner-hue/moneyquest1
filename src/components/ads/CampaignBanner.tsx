import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Campaign } from '@/hooks/useCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CampaignBannerProps {
  campaign: Campaign;
  onDismiss?: () => void;
}

export const CampaignBanner = ({ campaign, onDismiss }: CampaignBannerProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const impressionTracked = useRef(false);

  // Track impression on mount
  useEffect(() => {
    if (!impressionTracked.current && campaign.id) {
      impressionTracked.current = true;
      trackCampaignEvent('impression');
    }
  }, [campaign.id]);

  const trackCampaignEvent = async (eventType: 'impression' | 'click') => {
    try {
      await supabase.from('ab_test_events').insert([{
        user_id: user?.id || null,
        test_name: 'campaign',
        variant: campaign.id,
        event_type: eventType,
        metadata: {
          campaign_name: campaign.name,
          campaign_type: campaign.campaign_type,
          cta_link: campaign.cta_link,
        },
      }]);
    } catch (error) {
      console.warn('Failed to track campaign event:', error);
    }
  };

  const handleClick = () => {
    trackCampaignEvent('click');
    
    if (campaign.cta_link.startsWith('http')) {
      window.open(campaign.cta_link, '_blank');
    } else {
      navigate(campaign.cta_link);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`relative flex items-center justify-between w-full h-full px-4 cursor-pointer overflow-hidden bg-gradient-to-r ${campaign.bg_gradient || 'from-blue-100 via-blue-50 to-blue-100 dark:from-blue-900 dark:via-blue-800 dark:to-blue-900'} hover:opacity-90 transition-opacity`}
    >
      <span className="text-xl shrink-0">{campaign.icon}</span>
      
      <div className="flex flex-col justify-center py-1 min-w-0 flex-1 ml-3">
        <span className={`text-sm font-medium ${campaign.text_color} truncate`}>
          {campaign.title}
        </span>
        {campaign.subtitle && (
          <span className="text-xs text-muted-foreground truncate">
            {campaign.subtitle}
          </span>
        )}
      </div>
      
      <Button 
        size="sm" 
        variant="outline" 
        className="shrink-0 ml-2 border-primary/50 text-primary hover:bg-primary/10"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        {campaign.cta_text}
      </Button>
    </div>
  );
};
