import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { TransactionType, SupportedCurrency } from '@/types/database';

export interface TransactionTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  currency: SupportedCurrency;
  icon: string;
  created_at: string;
}

interface CreateTemplateInput {
  name: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  currency: SupportedCurrency;
  icon?: string;
}

export const useTransactionTemplates = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transaction_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as TransactionTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const addTemplate = async (input: CreateTemplateInput) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('transaction_templates')
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description,
          amount: input.amount,
          category: input.category,
          type: input.type,
          currency: input.currency,
          icon: input.icon || '⚡',
        })
        .select()
        .single();

      if (error) throw error;
      
      setTemplates(prev => [data as TransactionTemplate, ...prev]);
      toast.success(t('templates.created'));
      return data as TransactionTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error(t('templates.createError'));
      return null;
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('transaction_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success(t('templates.deleted'));
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(t('templates.deleteError'));
      return false;
    }
  };

  return {
    templates,
    loading,
    addTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
};
