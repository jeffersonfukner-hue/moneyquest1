import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AdminAnalytics, AtRiskUser, AdminLog, AdminUser, MessageTemplate } from '@/types/admin';

interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_icon: string;
  status: string;
  subscription_plan: string;
  subscription_expires_at: string | null;
  last_active_date: string | null;
  created_at: string;
  xp: number;
  level: number;
  streak: number;
  premium_override: 'none' | 'force_on' | 'force_off';
  stripe_subscription_status: string | null;
}

export const useAdminData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_analytics');
      if (error) throw error;
      return data as unknown as AdminAnalytics;
    },
  });

  // Fetch all users
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.rpc('admin_get_all_profiles');
      if (error) throw error;
      
      // Get emails for each user
      const usersWithEmail = await Promise.all(
        ((profiles || []) as ProfileRow[]).map(async (profile) => {
          const { data: email } = await supabase.rpc('admin_get_user_email', { 
            _user_id: profile.id 
          });
          return { 
            ...profile, 
            email: (email as string) || 'N/A',
            status: (profile.status || 'active') as 'active' | 'inactive' | 'blocked',
            subscription_plan: profile.subscription_plan as 'FREE' | 'PREMIUM',
            premium_override: profile.premium_override || 'none',
            stripe_subscription_status: profile.stripe_subscription_status
          } as AdminUser;
        })
      );
      
      return usersWithEmail;
    },
  });

  // Fetch at-risk users
  const { data: atRiskUsers, isLoading: atRiskLoading } = useQuery({
    queryKey: ['admin-at-risk'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_at_risk_users');
      if (error) throw error;
      return data as AtRiskUser[];
    },
  });

  // Fetch admin logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as AdminLog[];
    },
  });

  // Fetch message templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MessageTemplate[];
    },
  });

  // Update subscription mutation
  const updateSubscription = useMutation({
    mutationFn: async ({ 
      targetUserId, 
      plan, 
      expiresAt, 
      note 
    }: { 
      targetUserId: string; 
      plan: string; 
      expiresAt?: string | null; 
      note?: string;
    }) => {
      const { error } = await supabase.rpc('admin_update_subscription', {
        _target_user_id: targetUserId,
        _plan: plan,
        _expires_at: expiresAt || null,
        _note: note || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      toast({ title: 'Subscription updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating subscription', description: String(error), variant: 'destructive' });
    },
  });

  // Update user status mutation
  const updateUserStatus = useMutation({
    mutationFn: async ({ 
      targetUserId, 
      status, 
      note 
    }: { 
      targetUserId: string; 
      status: string; 
      note?: string;
    }) => {
      const { error } = await supabase.rpc('admin_update_user_status', {
        _target_user_id: targetUserId,
        _status: status,
        _note: note || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      toast({ title: 'User status updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating user status', description: String(error), variant: 'destructive' });
    },
  });

  // Grant bonus mutation
  const grantBonus = useMutation({
    mutationFn: async ({ 
      targetUserId, 
      bonusType, 
      amount, 
      note 
    }: { 
      targetUserId: string; 
      bonusType: string; 
      amount: number; 
      note?: string;
    }) => {
      const { error } = await supabase.rpc('admin_grant_bonus', {
        _target_user_id: targetUserId,
        _bonus_type: bonusType,
        _amount: amount,
        _note: note || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      toast({ title: 'Bonus granted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error granting bonus', description: String(error), variant: 'destructive' });
    },
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ 
      targetUserId, 
      title, 
      content 
    }: { 
      targetUserId: string; 
      title: string; 
      content: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('admin-send-email', {
        body: { targetUserId, subject: title, content },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      toast({ title: 'Message sent successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error sending message', description: String(error), variant: 'destructive' });
    },
  });

  // Create template mutation
  const createTemplate = useMutation({
    mutationFn: async ({ 
      name, 
      title, 
      content, 
      category 
    }: { 
      name: string; 
      title: string; 
      content: string; 
      category: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('message_templates')
        .insert({
          name,
          title,
          content,
          category,
          created_by: user.id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast({ title: 'Template created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating template', description: String(error), variant: 'destructive' });
    },
  });

  // Reset premium override mutation
  const resetPremiumOverride = useMutation({
    mutationFn: async ({ 
      targetUserId, 
      note 
    }: { 
      targetUserId: string; 
      note?: string;
    }) => {
      const { error } = await supabase.rpc('admin_reset_premium_override', {
        _target_user_id: targetUserId,
        _note: note || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      toast({ title: 'Premium override reset successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error resetting override', description: String(error), variant: 'destructive' });
    },
  });

  // Delete user mutation (for test users)
  const deleteUser = useMutation({
    mutationFn: async ({ 
      targetUserId, 
      note 
    }: { 
      targetUserId: string; 
      note?: string;
    }) => {
      const { data, error } = await supabase.rpc('admin_delete_user', {
        _target_user_id: targetUserId,
        _note: note || null
      });
      if (error) throw error;
      return data as { success: boolean; deleted_email?: string; error?: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      toast({ title: `User ${data.deleted_email} deleted successfully` });
    },
    onError: (error) => {
      toast({ title: 'Error deleting user', description: String(error), variant: 'destructive' });
    },
  });

  return {
    analytics,
    users,
    atRiskUsers,
    logs,
    templates,
    loading: analyticsLoading || usersLoading || atRiskLoading || logsLoading,
    analyticsLoading,
    usersLoading,
    atRiskLoading,
    logsLoading,
    templatesLoading,
    updateSubscription,
    updateUserStatus,
    grantBonus,
    sendMessage,
    createTemplate,
    resetPremiumOverride,
    deleteUser,
    refetchUsers,
  };
};
