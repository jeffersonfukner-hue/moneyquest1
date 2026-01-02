import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_id: string | null;
  content: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NewTicketData {
  subject: string;
  category: string;
  message: string;
  attachment?: File;
}

export function useSupportTickets() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch all tickets for the user
  const { data: tickets, isLoading: ticketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['support-tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user?.id,
  });

  // Fetch messages for a specific ticket
  const useTicketMessages = (ticketId: string | undefined) => {
    return useQuery({
      queryKey: ['support-messages', ticketId],
      queryFn: async () => {
        if (!ticketId) return [];
        
        const { data, error } = await supabase
          .from('support_messages')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data as SupportMessage[];
      },
      enabled: !!ticketId,
    });
  };

  // Fetch single ticket
  const useTicket = (ticketId: string | undefined) => {
    return useQuery({
      queryKey: ['support-ticket', ticketId],
      queryFn: async () => {
        if (!ticketId) return null;
        
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (error) throw error;
        return data as SupportTicket;
      },
      enabled: !!ticketId,
    });
  };

  // Upload attachment to storage
  const uploadAttachment = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('support-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Create new ticket with initial message
  const createTicket = useMutation({
    mutationFn: async (data: NewTicketData) => {
      if (!user?.id) throw new Error('User not authenticated');

      // First, upload attachment if exists
      let attachmentUrl: string | null = null;
      if (data.attachment) {
        attachmentUrl = await uploadAttachment(data.attachment);
      }

      // Create the ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: data.subject,
          category: data.category,
          status: 'sent',
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create the initial message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_type: 'user',
          sender_id: user.id,
          content: data.message,
          attachment_url: attachmentUrl,
        });

      if (messageError) throw messageError;

      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success(t('support.success.title'), {
        description: t('support.success.description'),
      });
    },
    onError: (error) => {
      console.error('Error creating ticket:', error);
      toast.error(t('common.error'));
    },
  });

  // Send a reply to an existing ticket
  const sendReply = useMutation({
    mutationFn: async ({ ticketId, content, attachment }: { ticketId: string; content: string; attachment?: File }) => {
      if (!user?.id) throw new Error('User not authenticated');

      let attachmentUrl: string | null = null;
      if (attachment) {
        attachmentUrl = await uploadAttachment(attachment);
      }

      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'user',
          sender_id: user.id,
          content,
          attachment_url: attachmentUrl,
        });

      if (error) throw error;

      // Update ticket status to 'sent' if it was 'answered'
      await supabase
        .from('support_tickets')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', ticketId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success(t('support.replySent'));
    },
    onError: (error) => {
      console.error('Error sending reply:', error);
      toast.error(t('common.error'));
    },
  });

  // Mark messages as read
  const markMessagesAsRead = useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('ticket_id', ticketId)
        .eq('sender_type', 'admin');

      if (error) throw error;
    },
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', ticketId] });
    },
  });

  // Count unread messages (from admin responses)
  const unreadCount = tickets?.reduce((count, ticket) => {
    // This would need a separate query for accurate counts
    // For now, we'll check if status is 'answered'
    if (ticket.status === 'answered') {
      return count + 1;
    }
    return count;
  }, 0) || 0;

  return {
    tickets,
    ticketsLoading,
    refetchTickets,
    useTicket,
    useTicketMessages,
    createTicket,
    sendReply,
    markMessagesAsRead,
    isUploading,
    unreadCount,
  };
}
