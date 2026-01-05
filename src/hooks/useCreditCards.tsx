import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  total_limit: number;
  available_limit: number;
  billing_close_day: number;
  due_day: number;
  linked_wallet_id: string | null;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCreditCardData {
  name: string;
  bank: string;
  total_limit: number;
  billing_close_day: number;
  due_day: number;
  linked_wallet_id?: string | null;
  currency?: string;
}

export interface UpdateCreditCardData {
  name?: string;
  bank?: string;
  total_limit?: number;
  billing_close_day?: number;
  due_day?: number;
  linked_wallet_id?: string | null;
  is_active?: boolean;
}

export const useCreditCards = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreditCards = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCreditCards(data || []);
    } catch (error) {
      console.error('Error fetching credit cards:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCreditCards();
  }, [fetchCreditCards]);

  const addCreditCard = async (cardData: CreateCreditCardData): Promise<CreditCard | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .insert({
          user_id: user.id,
          name: cardData.name,
          bank: cardData.bank,
          total_limit: cardData.total_limit,
          available_limit: cardData.total_limit, // Start with full limit available
          billing_close_day: cardData.billing_close_day,
          due_day: cardData.due_day,
          linked_wallet_id: cardData.linked_wallet_id || null,
          currency: cardData.currency || 'BRL',
        })
        .select()
        .single();

      if (error) throw error;

      setCreditCards(prev => [data, ...prev]);
      toast({
        title: t('creditCards.added', 'Cartão adicionado!'),
        description: t('creditCards.addedDesc', 'Seu cartão foi cadastrado com sucesso.'),
      });

      return data;
    } catch (error) {
      console.error('Error adding credit card:', error);
      toast({
        title: t('common.error', 'Erro'),
        description: t('creditCards.addError', 'Não foi possível adicionar o cartão.'),
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCreditCard = async (id: string, updates: UpdateCreditCardData): Promise<boolean> => {
    try {
      // If total_limit is being updated, adjust available_limit proportionally
      const finalUpdates: Record<string, any> = { ...updates };
      
      if (updates.total_limit !== undefined) {
        const card = creditCards.find(c => c.id === id);
        if (card) {
          const usedLimit = card.total_limit - card.available_limit;
          finalUpdates.available_limit = Math.max(0, updates.total_limit - usedLimit);
        }
      }

      const { error } = await supabase
        .from('credit_cards')
        .update(finalUpdates)
        .eq('id', id);

      if (error) throw error;

      setCreditCards(prev =>
        prev.map(card => card.id === id ? { ...card, ...finalUpdates } : card)
      );

      toast({
        title: t('creditCards.updated', 'Cartão atualizado!'),
      });

      return true;
    } catch (error) {
      console.error('Error updating credit card:', error);
      toast({
        title: t('common.error', 'Erro'),
        description: t('creditCards.updateError', 'Não foi possível atualizar o cartão.'),
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteCreditCard = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCreditCards(prev => prev.filter(card => card.id !== id));
      toast({
        title: t('creditCards.deleted', 'Cartão removido!'),
      });

      return true;
    } catch (error) {
      console.error('Error deleting credit card:', error);
      toast({
        title: t('common.error', 'Erro'),
        description: t('creditCards.deleteError', 'Não foi possível remover o cartão.'),
        variant: 'destructive',
      });
      return false;
    }
  };

  const activeCards = creditCards.filter(c => c.is_active);

  return {
    creditCards,
    activeCards,
    loading,
    refetch: fetchCreditCards,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
  };
};
