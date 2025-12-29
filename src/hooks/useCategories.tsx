import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Category, TransactionType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export const useCategories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('name');

      if (fetchError) throw fetchError;

      setCategories((data || []) as Category[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const getCategoriesByType = useCallback((type: TransactionType): Category[] => {
    return categories.filter(cat => cat.type === type);
  }, [categories]);

  const addCategory = useCallback(async (
    name: string,
    type: TransactionType,
    icon: string = '📦',
    color: string = '#8B5CF6'
  ): Promise<Category | null> => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: name.trim(),
          type,
          icon,
          color,
          is_default: false
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          toast({
            title: t('common.error'),
            description: t('categories.duplicateError'),
            variant: 'destructive',
          });
        } else {
          throw insertError;
        }
        return null;
      }

      const newCategory = data as Category;
      setCategories(prev => [...prev, newCategory]);
      
      toast({
        title: t('common.success'),
        description: t('categories.addSuccess'),
      });

      return newCategory;
    } catch (err) {
      console.error('Error adding category:', err);
      toast({
        title: t('common.error'),
        description: t('categories.addError'),
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast, t]);

  const updateCategory = useCallback(async (
    id: string,
    updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setCategories(prev => 
        prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat)
      );
      
      toast({
        title: t('common.success'),
        description: t('categories.updateSuccess'),
      });

      return true;
    } catch (err) {
      console.error('Error updating category:', err);
      toast({
        title: t('common.error'),
        description: t('categories.updateError'),
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, t]);

  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    const category = categories.find(c => c.id === id);
    if (category?.is_default) {
      toast({
        title: t('common.error'),
        description: t('categories.cannotDeleteDefault'),
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setCategories(prev => prev.filter(cat => cat.id !== id));
      
      toast({
        title: t('common.success'),
        description: t('categories.deleteSuccess'),
      });

      return true;
    } catch (err) {
      console.error('Error deleting category:', err);
      toast({
        title: t('common.error'),
        description: t('categories.deleteError'),
        variant: 'destructive',
      });
      return false;
    }
  }, [user, categories, toast, t]);

  const getCategoryByName = useCallback((name: string, type: TransactionType): Category | undefined => {
    return categories.find(
      cat => cat.name.toLowerCase() === name.toLowerCase() && cat.type === type
    );
  }, [categories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    getCategoriesByType,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryByName,
  };
};
