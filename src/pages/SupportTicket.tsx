import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, Paperclip, X, Loader2, User, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupportTickets, SupportMessage } from '@/hooks/useSupportTickets';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  answered: 'bg-green-500/10 text-green-600 border-green-500/20',
  closed: 'bg-muted text-muted-foreground border-border',
};

export default function SupportTicket() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { useTicket, useTicketMessages, sendReply, markMessagesAsRead, isUploading } = useSupportTickets();
  
  const { data: ticket, isLoading: ticketLoading } = useTicket(id);
  const { data: messages, isLoading: messagesLoading } = useTicketMessages(id);
  
  const [replyText, setReplyText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getDateLocale = () => {
    if (language.startsWith('pt')) return ptBR;
    if (language.startsWith('es')) return es;
    return enUS;
  };

  const formatMessageDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM, HH:mm', { locale: getDateLocale() });
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (id && messages?.some(m => m.sender_type === 'admin' && !m.is_read)) {
      markMessagesAsRead.mutate(id);
    }
  }, [id, messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setAttachment(file);
    }
  };

  const handleSendReply = async () => {
    if (!id || !replyText.trim()) return;
    
    await sendReply.mutateAsync({
      ticketId: id,
      content: replyText.trim(),
      attachment: attachment || undefined,
    });
    
    setReplyText('');
    setAttachment(null);
  };

  const isLoading = ticketLoading || messagesLoading;
  const isSending = sendReply.isPending || isUploading;
  const isClosed = ticket?.status === 'closed';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
          <div className="container flex items-center gap-3 py-4">
            <Skeleton className="w-10 h-10 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </header>
        <main className="container py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </main>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container flex items-center gap-3 py-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/support/messages')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{ticket.subject}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={STATUS_COLORS[ticket.status]}>
                {t(`support.status.${ticket.status}`)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {t(`support.categories.${ticket.category}`)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 container py-4 space-y-4 overflow-y-auto">
        {messages?.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            formatDate={formatMessageDate}
          />
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Reply Input */}
      {!isClosed && (
        <footer className="sticky bottom-0 bg-background border-t border-border p-4">
          <div className="container">
            {attachment && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-secondary/50 rounded-lg">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{attachment.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setAttachment(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('support.form.messagePlaceholder')}
                  className="min-h-[80px] max-h-[200px] resize-none pr-10"
                  disabled={isSending}
                />
                <label className="absolute bottom-2 right-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Paperclip className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                </label>
              </div>
              <Button 
                size="icon" 
                className="h-10 w-10 shrink-0"
                onClick={handleSendReply}
                disabled={!replyText.trim() || isSending}
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </footer>
      )}

      {isClosed && (
        <footer className="sticky bottom-0 bg-secondary/50 border-t border-border p-4">
          <p className="text-center text-sm text-muted-foreground">
            {t('support.ticketClosed')}
          </p>
        </footer>
      )}
    </div>
  );
}

function MessageBubble({ 
  message, 
  formatDate 
}: { 
  message: SupportMessage; 
  formatDate: (date: string) => string;
}) {
  const isUser = message.sender_type === 'user';
  
  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Headphones className="w-4 h-4 text-primary" />
        </div>
      )}
      <Card className={cn(
        'max-w-[80%]',
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-secondary'
      )}>
        <CardContent className="p-3">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          {message.attachment_url && (
            <a 
              href={message.attachment_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-1 mt-2 text-xs underline',
                isUser ? 'text-primary-foreground/80' : 'text-muted-foreground'
              )}
            >
              <Paperclip className="w-3 h-3" />
              Attachment
            </a>
          )}
          <p className={cn(
            'text-xs mt-1',
            isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'
          )}>
            {formatDate(message.created_at)}
          </p>
        </CardContent>
      </Card>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
