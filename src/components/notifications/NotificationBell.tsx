import { useState } from 'react';
import { Bell, MessageSquare, Gift, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es, pt } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const getDateLocale = (language: string) => {
  switch (language) {
    case 'pt-BR': return ptBR;
    case 'pt-PT': return pt;
    case 'es-ES': return es;
    default: return enUS;
  }
};

export const NotificationBell = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'support': return MessageSquare;
      case 'referral': return Gift;
      case 'reward': return Star;
      default: return Bell;
    }
  };

  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'support': return 'bg-blue-500/10 text-blue-500';
      case 'referral': return 'bg-purple-500/10 text-purple-500';
      case 'reward': return 'bg-amber-500/10 text-amber-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setOpen(false);
  };

  const dateLocale = getDateLocale(i18n.language);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative min-h-[44px] min-w-[44px] text-primary hover:text-primary/80 hover:bg-primary/10"
          aria-label={t('notifications.title')}
        >
          <Bell className="w-5 h-5" />
          
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">{t('notifications.title')}</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllAsRead()}
            >
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>
        
        {/* Notification list */}
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.slice(0, 10).map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      !notification.isRead && "bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      getNotificationStyles(notification.type)
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        !notification.isRead && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { 
                          addSuffix: true,
                          locale: dateLocale
                        })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              className="w-full text-sm"
              onClick={() => {
                navigate('/my-messages');
                setOpen(false);
              }}
            >
              {t('notifications.viewAll')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
