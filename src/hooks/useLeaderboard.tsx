import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  display_name: string;
  avatar_icon: string;
  xp: number;
  level: number;
  is_public: boolean;
  rank?: number;
}

export interface FriendConnection {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export const useLeaderboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isOnLeaderboard, setIsOnLeaderboard] = useState(false);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendConnection[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's leaderboard entry
  const fetchMyEntry = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('leaderboard_participants')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setIsOnLeaderboard(true);
      setMyEntry(data as LeaderboardEntry);
    } else {
      setIsOnLeaderboard(false);
      setMyEntry(null);
    }
  }, [user]);

  // Fetch global leaderboard (top 50)
  const fetchGlobalLeaderboard = useCallback(async () => {
    const { data, error } = await supabase
      .from('leaderboard_participants')
      .select('*')
      .eq('is_public', true)
      .order('xp', { ascending: false })
      .limit(50);

    if (!error && data) {
      const ranked = data.map((entry, index) => ({
        ...entry,
        rank: index + 1
      })) as LeaderboardEntry[];
      setGlobalLeaderboard(ranked);
    }
  }, []);

  // Fetch friends leaderboard
  const fetchFriendsLeaderboard = useCallback(async () => {
    if (!user) return;

    // Get accepted friend connections
    const { data: connections } = await supabase
      .from('friend_connections')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (!connections || connections.length === 0) {
      setFriendsLeaderboard([]);
      return;
    }

    // Get friend user IDs
    const friendIds = connections.map(c => 
      c.user_id === user.id ? c.friend_id : c.user_id
    );

    // Include self in friends leaderboard
    friendIds.push(user.id);

    const { data } = await supabase
      .from('leaderboard_participants')
      .select('*')
      .in('user_id', friendIds)
      .order('xp', { ascending: false });

    if (data) {
      const ranked = data.map((entry, index) => ({
        ...entry,
        rank: index + 1
      })) as LeaderboardEntry[];
      setFriendsLeaderboard(ranked);
    }
  }, [user]);

  // Fetch pending friend requests
  const fetchFriendRequests = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('friend_connections')
      .select('*')
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (data) {
      setFriendRequests(data as FriendConnection[]);
    }
  }, [user]);

  // Join leaderboard
  const joinLeaderboard = async (isPublic: boolean = true) => {
    if (!user || !profile) return;

    const { error } = await supabase
      .from('leaderboard_participants')
      .insert({
        user_id: user.id,
        display_name: profile.display_name || `Player ${user.id.slice(0, 4)}`,
        avatar_icon: profile.avatar_icon,
        xp: profile.xp,
        level: profile.level,
        is_public: isPublic
      });

    if (error) {
      toast.error('Failed to join leaderboard');
      return false;
    }

    toast.success('Joined the leaderboard!');
    await fetchMyEntry();
    await fetchGlobalLeaderboard();
    return true;
  };

  // Leave leaderboard
  const leaveLeaderboard = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('leaderboard_participants')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to leave leaderboard');
      return false;
    }

    toast.success('Left the leaderboard');
    setIsOnLeaderboard(false);
    setMyEntry(null);
    await fetchGlobalLeaderboard();
    return true;
  };

  // Update visibility
  const updateVisibility = async (isPublic: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('leaderboard_participants')
      .update({ is_public: isPublic })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to update visibility');
      return false;
    }

    await fetchMyEntry();
    await fetchGlobalLeaderboard();
    return true;
  };

  // Send friend request (by user ID - in real app, use friend codes)
  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('friend_connections')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending'
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('Friend request already sent');
      } else {
        toast.error('Failed to send friend request');
      }
      return false;
    }

    toast.success('Friend request sent!');
    return true;
  };

  // Accept friend request
  const acceptFriendRequest = async (connectionId: string) => {
    const { error } = await supabase
      .from('friend_connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId);

    if (error) {
      toast.error('Failed to accept friend request');
      return false;
    }

    toast.success('Friend request accepted!');
    await fetchFriendRequests();
    await fetchFriendsLeaderboard();
    return true;
  };

  // Reject friend request
  const rejectFriendRequest = async (connectionId: string) => {
    const { error } = await supabase
      .from('friend_connections')
      .update({ status: 'rejected' })
      .eq('id', connectionId);

    if (error) {
      toast.error('Failed to reject friend request');
      return false;
    }

    await fetchFriendRequests();
    return true;
  };

  // Get user's rank in global leaderboard
  const getMyRank = useCallback((): number | null => {
    if (!myEntry || !myEntry.is_public) return null;
    const index = globalLeaderboard.findIndex(e => e.user_id === myEntry.user_id);
    return index >= 0 ? index + 1 : null;
  }, [myEntry, globalLeaderboard]);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchMyEntry(),
        fetchGlobalLeaderboard(),
        fetchFriendsLeaderboard(),
        fetchFriendRequests()
      ]);
      setLoading(false);
    };

    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, fetchMyEntry, fetchGlobalLeaderboard, fetchFriendsLeaderboard, fetchFriendRequests]);

  return {
    isOnLeaderboard,
    myEntry,
    globalLeaderboard,
    friendsLeaderboard,
    friendRequests,
    loading,
    joinLeaderboard,
    leaveLeaderboard,
    updateVisibility,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getMyRank,
    refetch: async () => {
      await Promise.all([
        fetchMyEntry(),
        fetchGlobalLeaderboard(),
        fetchFriendsLeaderboard(),
        fetchFriendRequests()
      ]);
    }
  };
};
