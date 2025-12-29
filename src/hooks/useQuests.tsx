import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Quest } from '@/types/database';
import { useAuth } from './useAuth';

export const useQuests = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuests = async () => {
    if (!user) {
      setQuests([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', user.id)
      .order('is_completed', { ascending: true })
      .order('type', { ascending: true });

    if (!error && data) {
      setQuests(data.map(q => ({
        ...q,
        type: q.type as Quest['type']
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuests();
  }, [user]);

  return { quests, loading, refetch: fetchQuests };
};
