import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MessageSquare, Clock, CheckCircle, Send, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useState } from 'react';
import { NewTicketDialog } from '@/components/support/NewTicketDialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

const STATUS_CONFIG = {
  sent: { 
    icon: Send, 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  in_progress: { 
    icon: Clock, 
    color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  },
  answered: { 
    icon: MessageSquare, 
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  closed: { 
    icon: CheckCircle, 
    color: 'bg-muted text-muted-foreground border-border',
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  question: '❓',
  technical: '🔧',
  suggestion: '💡',
  financial: '💰',
  other: '📝',
};

export default function MyMessages() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { tickets, ticketsLoading } = useSupportTickets();
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);

  const getDateLocale = () => {
    if (language.startsWith('pt')) return ptBR;
    if (language.startsWith('es')) return es;
    return enUS;
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: getDateLocale() 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container flex items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/support')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">{t('support.myMessages')}</h1>
          </div>
          <Button 
            size="sm" 
            onClick={() => setShowNewTicketDialog(true)}
          >
            <Plus className="w-4 h-4" />
            {t('support.newTicket')}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container py-6 space-y-4">
        {ticketsLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : tickets && tickets.length > 0 ? (
          tickets.map((ticket) => {
            const statusConfig = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.sent;
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card 
                key={ticket.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/support/ticket/${ticket.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">
                      {CATEGORY_ICONS[ticket.category] || '📝'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{ticket.subject}</h3>
                        {ticket.status === 'answered' && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`${statusConfig.color} text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {t(`support.status.${ticket.status}`)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(ticket.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">{t('support.noMessages')}</p>
            <Button onClick={() => setShowNewTicketDialog(true)}>
              <Plus className="w-4 h-4" />
              {t('support.newTicket')}
            </Button>
          </div>
        )}
      </main>

      {/* New Ticket Dialog */}
      <NewTicketDialog 
        open={showNewTicketDialog} 
        onOpenChange={setShowNewTicketDialog} 
      />
    </div>
  );
}
