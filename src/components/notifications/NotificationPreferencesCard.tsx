import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, MessageSquare, Gift, Star, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { NotificationPreferences } from '@/types/database';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  messages: true,
  support: true,
  referral: true,
  reward: true,
};

export const NotificationPreferencesCard = () => {
  const { t } = useTranslation();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.notification_preferences) {
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...(profile.notification_preferences as NotificationPreferences),
      });
    }
  }, [profile?.notification_preferences]);

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    
    setPreferences(newPreferences);
    setSaving(true);

    const { error } = await updateProfile({
      notification_preferences: newPreferences,
    });

    setSaving(false);

    if (error) {
      // Revert on error
      setPreferences(preferences);
      toast({
        title: t('common.error'),
        description: t('settings.notificationPreferences.saveError'),
        variant: 'destructive',
      });
    }
  };

  const notificationTypes = [
    {
      key: 'messages' as const,
      icon: MessageSquare,
      label: t('settings.notificationPreferences.messages'),
      description: t('settings.notificationPreferences.messagesDesc'),
    },
    {
      key: 'support' as const,
      icon: HelpCircle,
      label: t('settings.notificationPreferences.support'),
      description: t('settings.notificationPreferences.supportDesc'),
    },
    {
      key: 'referral' as const,
      icon: Gift,
      label: t('settings.notificationPreferences.referral'),
      description: t('settings.notificationPreferences.referralDesc'),
    },
    {
      key: 'reward' as const,
      icon: Star,
      label: t('settings.notificationPreferences.reward'),
      description: t('settings.notificationPreferences.rewardDesc'),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="w-5 h-5 text-primary" />
          {t('settings.notificationPreferences.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notificationTypes.map(({ key, icon: Icon, label, description }) => (
          <div 
            key={key} 
            className="flex items-center justify-between gap-3 py-2"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <Label 
                  htmlFor={`notification-${key}`} 
                  className="text-sm font-medium cursor-pointer"
                >
                  {label}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </p>
              </div>
            </div>
            <Switch
              id={`notification-${key}`}
              checked={preferences[key]}
              onCheckedChange={() => handleToggle(key)}
              disabled={saving}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
