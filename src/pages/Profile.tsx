import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, User, Flame, TrendingUp, TrendingDown, Coins, Star, Target } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const AVATAR_OPTIONS = [
  '🎮', '🚀', '💎', '🔥', '⭐', '🏆', '💰', '🎯', 
  '🦊', '🐱', '🐶', '🦁', '🐼', '🐨', '🐸', '🦉',
  '🧙', '🧚', '🦸', '🧛', '🥷', '👨‍🚀', '👩‍💻', '🎅'
];

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, updateProfile, loading } = useProfile();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar_icon || '🎮');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      display_name: displayName || null,
      avatar_icon: selectedAvatar,
    });
    
    if (error) {
      toast({
        title: t('common.error'),
        description: t('profile.saveError'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('common.success'),
        description: t('profile.saveSuccess'),
      });
    }
    setSaving(false);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  const totalSaved = profile.total_income - profile.total_expenses;

  const stats = [
    { 
      icon: Flame, 
      label: t('stats.streak'), 
      value: `${profile.streak} ${t('stats.days')}`,
      color: 'text-orange-500' 
    },
    { 
      icon: Star, 
      label: t('stats.xp'), 
      value: profile.xp.toLocaleString(),
      color: 'text-yellow-500' 
    },
    { 
      icon: Target, 
      label: t('stats.level'), 
      value: `${profile.level} - ${profile.level_title}`,
      color: 'text-primary' 
    },
    { 
      icon: TrendingUp, 
      label: t('stats.totalIncome'), 
      value: formatCurrency(profile.total_income),
      color: 'text-emerald-500' 
    },
    { 
      icon: TrendingDown, 
      label: t('stats.totalExpenses'), 
      value: formatCurrency(profile.total_expenses),
      color: 'text-rose-500' 
    },
    { 
      icon: Coins, 
      label: t('stats.totalSaved'), 
      value: formatCurrency(totalSaved),
      color: totalSaved >= 0 ? 'text-emerald-500' : 'text-rose-500' 
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
        <div className="flex items-center h-14 px-4 max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-lg text-foreground ml-2">
            {t('profile.title')}
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('profile.avatar')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center text-5xl border-4 border-primary/30">
                {selectedAvatar}
              </div>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${
                    selectedAvatar === avatar
                      ? 'bg-primary text-primary-foreground scale-110 shadow-lg'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Display Name Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.displayName')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="displayName">{t('profile.displayNameLabel')}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={user?.email?.split('@')[0] || t('profile.displayNamePlaceholder')}
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                {t('profile.displayNameHint')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.yourStats')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={index}
                    className="bg-muted/50 rounded-lg p-3 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="font-semibold text-sm truncate">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          className="w-full" 
          disabled={saving}
        >
          <Check className="w-4 h-4 mr-2" />
          {saving ? t('common.saving') : t('profile.saveChanges')}
        </Button>
      </main>
    </div>
  );
};

export default Profile;
