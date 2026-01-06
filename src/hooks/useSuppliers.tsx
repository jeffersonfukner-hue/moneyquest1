import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  usage_count: number;
  total_spent: number;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

export const useSuppliers = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = useCallback(async () => {
    if (!user) {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setSuppliers((data || []) as Supplier[]);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const upsertSupplier = useCallback(async (name: string, amount: number) => {
    if (!user || !name.trim()) return;

    const normalizedName = name.trim().toUpperCase();

    try {
      // Check if supplier exists
      const { data: existing } = await supabase
        .from('suppliers')
        .select('id, usage_count, total_spent')
        .eq('user_id', user.id)
        .eq('name', normalizedName)
        .single();

      if (existing) {
        // Update existing supplier
        const { data: updated, error } = await supabase
          .from('suppliers')
          .update({
            usage_count: existing.usage_count + 1,
            total_spent: Number(existing.total_spent) + amount,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select('*')
          .single();

        if (!error && updated) {
          setSuppliers(prev => 
            prev.map(s => s.id === updated.id ? (updated as Supplier) : s)
              .sort((a, b) => b.usage_count - a.usage_count)
          );
        }
      } else {
        // Insert new supplier
        const { data: inserted, error } = await supabase
          .from('suppliers')
          .insert({
            user_id: user.id,
            name: normalizedName,
            usage_count: 1,
            total_spent: amount,
          })
          .select('*')
          .single();

        if (!error && inserted) {
          setSuppliers(prev => [...prev, inserted as Supplier].sort((a, b) => b.usage_count - a.usage_count));
        }
      }
    } catch (error) {
      console.error('Error upserting supplier:', error);
    }
  }, [user]);

  const searchSuppliers = useCallback((query: string) => {
    if (!query.trim()) return suppliers.slice(0, 10);
    
    const normalizedQuery = query.trim().toUpperCase();
    return suppliers
      .filter(s => s.name.includes(normalizedQuery))
      .slice(0, 10);
  }, [suppliers]);

  return {
    suppliers,
    loading,
    fetchSuppliers,
    upsertSupplier,
    searchSuppliers,
  };
};
