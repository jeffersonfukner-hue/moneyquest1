import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, XCircle, User } from 'lucide-react';

type TicketStatus = 'sent' | 'in_progress' | 'answered' | 'closed';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_type: 'user' | 'admin';
  sender_id: string | null;
  content: string;
  attachment_url: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<TicketStatus, { color: string; icon: React.ElementType }> = {
  sent: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock },
  in_progress: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: AlertCircle },
  answered: { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
  closed: { color: 'bg-muted text-muted-foreground border-border', icon: XCircle },
};

export default function SupportTickets() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch all tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Ticket[];
    },
  });

  // Fetch messages for selected ticket
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['admin-ticket-messages', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) return [];
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', selectedTicket.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedTicket,
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert admin reply
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'admin',
          sender_id: user.id,
          content,
        });
      
      if (messageError) throw messageError;

      // Update ticket status to answered
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .update({ status: 'answered', updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      
      if (ticketError) throw ticketError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-messages'] });
      setReplyContent('');
      toast({ title: t('admin.support.replySent') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: TicketStatus }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      toast({ title: t('admin.support.statusUpdated') });
    },
  });

  const filteredTickets = tickets?.filter(ticket => 
    statusFilter === 'all' || ticket.status === statusFilter
  );

  const handleSendReply = () => {
    if (!selectedTicket || !replyContent.trim()) return;
    sendReplyMutation.mutate({ ticketId: selectedTicket.id, content: replyContent });
  };

  if (ticketsLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">{t('admin.support.title')}</h1>
          <p className="text-muted-foreground">{t('admin.support.description')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['sent', 'in_progress', 'answered', 'closed'] as TicketStatus[]).map(status => {
            const count = tickets?.filter(t => t.status === status).length || 0;
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            return (
              <Card key={status} className="cursor-pointer hover:border-primary/30" onClick={() => setStatusFilter(status)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{t(`support.status.${status}`)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('admin.support.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="sent">{t('support.status.sent')}</SelectItem>
              <SelectItem value="in_progress">{t('support.status.in_progress')}</SelectItem>
              <SelectItem value="answered">{t('support.status.answered')}</SelectItem>
              <SelectItem value="closed">{t('support.status.closed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t('admin.support.tickets')}
            </CardTitle>
            <CardDescription>
              {filteredTickets?.length || 0} {t('admin.support.ticketsFound')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('support.form.subject')}</TableHead>
                  <TableHead>{t('support.form.category')}</TableHead>
                  <TableHead>{t('admin.support.status')}</TableHead>
                  <TableHead>{t('admin.support.created')}</TableHead>
                  <TableHead>{t('admin.support.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets?.map(ticket => {
                  const config = STATUS_CONFIG[ticket.status];
                  return (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(`support.categories.${ticket.category}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={config.color}>
                          {t(`support.status.${ticket.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          {t('admin.support.view')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!filteredTickets || filteredTickets.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {t('admin.support.noTickets')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Ticket Detail Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {selectedTicket?.subject}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Ticket Info */}
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline">
                  {selectedTicket && t(`support.categories.${selectedTicket.category}`)}
                </Badge>
                <Select 
                  value={selectedTicket?.status} 
                  onValueChange={(value) => {
                    if (selectedTicket) {
                      updateStatusMutation.mutate({ ticketId: selectedTicket.id, status: value as TicketStatus });
                      setSelectedTicket({ ...selectedTicket, status: value as TicketStatus });
                    }
                  }}
                >
                  <SelectTrigger className="w-36 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sent">{t('support.status.sent')}</SelectItem>
                    <SelectItem value="in_progress">{t('support.status.in_progress')}</SelectItem>
                    <SelectItem value="answered">{t('support.status.answered')}</SelectItem>
                    <SelectItem value="closed">{t('support.status.closed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messages */}
              <ScrollArea className="h-[300px] border rounded-lg p-4">
                {messagesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-3/4" />
                    <Skeleton className="h-16 w-3/4 ml-auto" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages?.map(message => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.sender_type === 'admin' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-3 h-3" />
                            <span className="text-xs opacity-80">
                              {message.sender_type === 'admin' ? t('admin.support.admin') : t('admin.support.user')}
                            </span>
                            <span className="text-xs opacity-60">
                              {format(new Date(message.created_at), 'dd/MM HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.attachment_url && (
                            <a 
                              href={message.attachment_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs underline mt-2 block"
                            >
                              {t('admin.support.viewAttachment')}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Reply Input */}
              {selectedTicket?.status !== 'closed' && (
                <div className="flex gap-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={t('admin.support.replyPlaceholder')}
                    className="flex-1"
                    rows={3}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                {t('common.close')}
              </Button>
              {selectedTicket?.status !== 'closed' && (
                <Button 
                  onClick={handleSendReply} 
                  disabled={!replyContent.trim() || sendReplyMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {t('admin.support.sendReply')}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
