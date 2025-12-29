export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_icon: string;
  status: 'active' | 'inactive' | 'blocked';
  subscription_plan: 'FREE' | 'PREMIUM';
  subscription_expires_at: string | null;
  last_active_date: string | null;
  created_at: string;
  xp: number;
  level: number;
  streak: number;
}

export interface AdminAnalytics {
  total_users: number;
  active_today: number;
  active_7days: number;
  active_30days: number;
  free_users: number;
  premium_users: number;
  engagement_rate: number;
}

export interface AtRiskUser {
  user_id: string;
  display_name: string | null;
  last_active_date: string | null;
  days_inactive: number;
  risk_level: 'low' | 'medium' | 'high' | 'none';
  subscription_plan: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id: string | null;
  details: Record<string, unknown>;
  note: string | null;
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
  category: string;
  created_by: string | null;
  created_at: string;
}

export interface UserBonus {
  id: string;
  user_id: string;
  granted_by: string;
  bonus_type: 'XP' | 'PREMIUM_DAYS' | 'QUEST';
  amount: number;
  note: string | null;
  applied_at: string;
}

export interface UserMessage {
  id: string;
  user_id: string;
  sender_id: string | null;
  title: string;
  content: string;
  is_read: boolean;
  message_type: string;
  created_at: string;
}

export type AdminActionType = 
  | 'PREMIUM_GRANT' 
  | 'PREMIUM_REVOKE' 
  | 'BLOCK_USER' 
  | 'UNBLOCK_USER' 
  | 'GRANT_BONUS' 
  | 'SEND_MESSAGE';
