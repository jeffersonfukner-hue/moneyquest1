import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface Notification {
  id: string;
  type: 'message' | 'support' | 'referral' | 'reward';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch user messages
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['user-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch support tickets with answers
  const { data: tickets, isLoading: ticketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['support-tickets-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          support_messages!inner(id, is_read, sender_type)
        `)
        .eq('user_id', user.id)
        .eq('status', 'answered')
        .order('updated_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Combine and format notifications
  const notifications: Notification[] = useMemo(() => {
    const combined: Notification[] = [];

    // System messages
    messages?.forEach(msg => {
      combined.push({
        id: msg.id,
        type: msg.message_type === 'reward' ? 'reward' : 'message',
        title: msg.title,
        content: msg.content,
        isRead: msg.is_read || false,
        createdAt: msg.created_at,
        link: '/my-messages',
      });
    });

    // Support tickets with unread admin replies
    tickets?.forEach(ticket => {
      const hasUnreadAdminMessage = ticket.support_messages?.some(
        (msg: { sender_type: string; is_read: boolean }) => 
          msg.sender_type === 'admin' && !msg.is_read
      );
      
      if (hasUnreadAdminMessage) {
        combined.push({
          id: `ticket-${ticket.id}`,
          type: 'support',
          title: t('notifications.supportReply'),
          content: ticket.subject,
          isRead: false,
          createdAt: ticket.updated_at,
          link: `/support/ticket/${ticket.id}`,
        });
      }
    });

    // Sort by date descending
    return combined.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [messages, tickets, t]);

  // Unread count
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length,
    [notifications]
  );

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    if (notificationId.startsWith('ticket-')) {
      const ticketId = notificationId.replace('ticket-', '');
      await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('ticket_id', ticketId)
        .eq('sender_type', 'admin');
      refetchTickets();
    } else {
      await supabase
        .from('user_messages')
        .update({ is_read: true })
        .eq('id', notificationId);
      refetchMessages();
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    // Mark all user messages as read
    await supabase
      .from('user_messages')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    // Mark all admin support messages as read
    const ticketIds = tickets?.map(t => t.id) || [];
    if (ticketIds.length > 0) {
      await supabase
        .from('support_messages')
        .update({ is_read: true })
        .in('ticket_id', ticketIds)
        .eq('sender_type', 'admin');
    }
    
    refetchMessages();
    refetchTickets();
  };

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          refetchMessages();
          toast(payload.new.title as string, {
            description: payload.new.content as string,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetchMessages]);

  const refetch = () => {
    refetchMessages();
    refetchTickets();
  };

  return {
    notifications,
    unreadCount,
    isLoading: messagesLoading || ticketsLoading,
    markAsRead,
    markAllAsRead,
    refetch,
  };
};
