import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/types/database';
import { useAuth } from './useAuth';

export const useBadges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = async () => {
    if (!user) {
      setBadges([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', user.id)
      .order('is_unlocked', { ascending: false })
      .order('requirement_value', { ascending: true });

    if (!error && data) {
      setBadges(data.map(b => ({
        ...b,
        requirement_type: b.requirement_type as Badge['requirement_type']
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBadges();
  }, [user]);

  return { badges, loading, refetch: fetchBadges };
};
