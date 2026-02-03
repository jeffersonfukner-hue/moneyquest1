import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MessageSquare, ChevronRight, Inbox, Clock } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { NewTicketDialog } from '@/components/support/NewTicketDialog';
import { FAQSection } from '@/components/support/FAQSection';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { WHATSAPP_SUPPORT_NUMBER, SUPPORT_CONFIG } from '@/lib/supportConfig';
import { supabase } from '@/integrations/supabase/client';

export default function Support() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tickets, unreadCount } = useSupportTickets();
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);

  const trackWhatsAppClick = async () => {
    try {
      await supabase.from('ab_test_events').insert([{
        user_id: user?.id || null,
        test_name: 'whatsapp_click',
        variant: 'support_page',
        event_type: 'click',
        metadata: { location: 'support_page' }
      }]);
    } catch (error) {
      console.error('Error tracking WhatsApp click:', error);
    }
  };

  const handleWhatsAppClick = () => {
    trackWhatsAppClick();
    
    const userEmail = user?.email || 'N/A';
    const userId = user?.id ? user.id.substring(0, 8) + '...' : 'N/A';
    const message = `Olá, estou entrando em contato pelo MoneyQuest e preciso de ajuda.\n\n---\nInformações do usuário:\nEmail: ${userEmail}\nID: ${userId}`;
    
    window.open(
      `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const handleNewTicket = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowNewTicketDialog(true);
  };

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container flex items-center gap-3 py-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{t('support.pageTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('support.subtitle')}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container py-6 space-y-6">
        {/* Horário de atendimento */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg py-2 px-4">
          <Clock className="w-4 h-4" />
          <span>
            {t('support.hours.label')}: {SUPPORT_CONFIG.hours.weekdays} ({t('support.hours.weekdays')})
          </span>
        </div>

        <p className="text-muted-foreground text-center">
          {t('support.chooseContact')}
        </p>

        {/* WhatsApp Option */}
        <Card 
          className="cursor-pointer border-2 border-[#25D366]/30 hover:border-[#25D366]/60 transition-colors bg-[#25D366]/5"
          onClick={handleWhatsAppClick}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center shrink-0">
              <FaWhatsapp className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg">{t('support.whatsapp.title')}</p>
              <p className="text-sm text-muted-foreground">{t('support.whatsapp.subtitle')}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>

        {/* Internal Message Option */}
        <Card 
          className="cursor-pointer border-2 border-primary/30 hover:border-primary/60 transition-colors"
          onClick={handleNewTicket}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquare className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg">{t('support.email.title')}</p>
              <p className="text-sm text-muted-foreground">{t('support.email.subtitle')}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
        </div>

        {/* My Messages Link */}
        {user && (
          <Card 
            className="cursor-pointer hover:bg-accent/5 transition-colors"
            onClick={() => navigate('/support/messages')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Inbox className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{t('support.myMessages')}</p>
                {tickets && tickets.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {tickets.length} {tickets.length === 1 ? t('support.ticket') : t('support.tickets')}
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        )}

        {/* FAQ Section */}
        <div className="pt-4">
          <FAQSection />
        </div>
      </main>

      {/* New Ticket Dialog */}
      <NewTicketDialog 
        open={showNewTicketDialog} 
        onOpenChange={setShowNewTicketDialog} 
      />
    </AppShell>
  );
}
