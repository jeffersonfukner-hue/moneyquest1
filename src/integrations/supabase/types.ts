export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ab_test_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          test_name: string
          user_id: string | null
          variant: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          test_name: string
          user_id?: string | null
          variant: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          test_name?: string
          user_id?: string | null
          variant?: string
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          note: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          note?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          note?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          severity: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          severity?: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          severity?: string
          title?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_unlocked: boolean
          name: string
          requirement_type: string
          requirement_value: number
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          is_unlocked?: boolean
          name: string
          requirement_type: string
          requirement_value: number
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_unlocked?: boolean
          name?: string
          requirement_type?: string
          requirement_value?: number
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      category_goal_history: {
        Row: {
          budget_limit: number
          category: string
          created_at: string
          goal_id: string | null
          id: string
          percentage_used: number
          period_month: number
          period_year: number
          spent: number
          status: string
          user_id: string
        }
        Insert: {
          budget_limit: number
          category: string
          created_at?: string
          goal_id?: string | null
          id?: string
          percentage_used?: number
          period_month: number
          period_year: number
          spent?: number
          status?: string
          user_id: string
        }
        Update: {
          budget_limit?: number
          category?: string
          created_at?: string
          goal_id?: string | null
          id?: string
          percentage_used?: number
          period_month?: number
          period_year?: number
          spent?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_goal_history_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "category_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_goal_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      category_goals: {
        Row: {
          budget_limit: number
          category: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          budget_limit: number
          category: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          budget_limit?: number
          category?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_rewards: {
        Row: {
          created_at: string | null
          current_streak: number
          id: string
          last_claim_date: string | null
          total_claims: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number
          id?: string
          last_claim_date?: string | null
          total_claims?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number
          id?: string
          last_claim_date?: string | null
          total_claims?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: string
          id: string
          rate: number
          target_currency: string
          updated_at: string | null
        }
        Insert: {
          base_currency: string
          id?: string
          rate: number
          target_currency: string
          updated_at?: string | null
        }
        Update: {
          base_currency?: string
          id?: string
          rate?: number
          target_currency?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      friend_connections: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_participants: {
        Row: {
          avatar_icon: string
          display_name: string
          id: string
          is_public: boolean | null
          joined_at: string | null
          level: number
          updated_at: string | null
          user_id: string
          xp: number
        }
        Insert: {
          avatar_icon?: string
          display_name: string
          id?: string
          is_public?: boolean | null
          joined_at?: string | null
          level?: number
          updated_at?: string | null
          user_id: string
          xp?: number
        }
        Update: {
          avatar_icon?: string
          display_name?: string
          id?: string
          is_public?: boolean | null
          joined_at?: string | null
          level?: number
          updated_at?: string | null
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          title: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          title: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_icon: string
          avatar_url: string | null
          created_at: string
          currency: string
          display_name: string | null
          financial_mood: string
          id: string
          language: string
          last_active_date: string | null
          level: number
          level_title: string
          locale: string
          notification_preferences: Json
          onboarding_completed: boolean
          premium_override: Database["public"]["Enums"]["premium_override_type"]
          referral_code: string | null
          referred_by: string | null
          status: string | null
          streak: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_subscription_status: string | null
          subscription_expires_at: string | null
          subscription_plan: string
          subscription_started_at: string | null
          theme_preference: string
          timezone: string
          total_expenses: number
          total_income: number
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_icon?: string
          avatar_url?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          financial_mood?: string
          id: string
          language?: string
          last_active_date?: string | null
          level?: number
          level_title?: string
          locale?: string
          notification_preferences?: Json
          onboarding_completed?: boolean
          premium_override?: Database["public"]["Enums"]["premium_override_type"]
          referral_code?: string | null
          referred_by?: string | null
          status?: string | null
          streak?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string
          subscription_started_at?: string | null
          theme_preference?: string
          timezone?: string
          total_expenses?: number
          total_income?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_icon?: string
          avatar_url?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          financial_mood?: string
          id?: string
          language?: string
          last_active_date?: string | null
          level?: number
          level_title?: string
          locale?: string
          notification_preferences?: Json
          onboarding_completed?: boolean
          premium_override?: Database["public"]["Enums"]["premium_override_type"]
          referral_code?: string | null
          referred_by?: string | null
          status?: string | null
          streak?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string
          subscription_started_at?: string | null
          theme_preference?: string
          timezone?: string
          total_expenses?: number
          total_income?: number
          updated_at?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string
          id: string
          is_active: boolean
          is_completed: boolean
          period_end_date: string | null
          period_start_date: string | null
          progress_current: number
          progress_target: number
          quest_key: string | null
          season: string | null
          title: string
          type: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          is_completed?: boolean
          period_end_date?: string | null
          period_start_date?: string | null
          progress_current?: number
          progress_target?: number
          quest_key?: string | null
          season?: string | null
          title: string
          type: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_completed?: boolean
          period_end_date?: string | null
          period_start_date?: string | null
          progress_current?: number
          progress_target?: number
          quest_key?: string | null
          season?: string | null
          title?: string
          type?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          flagged_as_suspicious: boolean | null
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          rewarded_at: string | null
          status: string
          suspicion_reason: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          flagged_as_suspicious?: boolean | null
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rewarded_at?: string | null
          status?: string
          suspicion_reason?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          flagged_as_suspicious?: boolean | null
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rewarded_at?: string | null
          status?: string
          suspicion_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_history: {
        Row: {
          claimed_at: string | null
          id: string
          multiplier: number
          reward_type: string
          streak_day: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          claimed_at?: string | null
          id?: string
          multiplier?: number
          reward_type?: string
          streak_day: number
          user_id: string
          xp_earned: number
        }
        Update: {
          claimed_at?: string | null
          id?: string
          multiplier?: number
          reward_type?: string
          streak_day?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
          sender_type?: string
          ticket_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string | null
          id: string
          status: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: string
          status?: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transaction_narratives: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          event_type: string
          id: string
          impact: string
          narrative: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          event_type: string
          id?: string
          impact: string
          narrative: string
          transaction_id: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          event_type?: string
          id?: string
          impact?: string
          narrative?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_narratives_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_templates: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          description: string
          icon: string
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          currency?: string
          description: string
          icon?: string
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          date: string
          description: string
          id: string
          type: string
          user_id: string
          wallet_id: string | null
          xp_earned: number
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          currency?: string
          date?: string
          description: string
          id?: string
          type: string
          user_id: string
          wallet_id?: string | null
          xp_earned?: number
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          date?: string
          description?: string
          id?: string
          type?: string
          user_id?: string
          wallet_id?: string | null
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bonuses: {
        Row: {
          amount: number
          applied_at: string | null
          bonus_type: string
          granted_by: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          applied_at?: string | null
          bonus_type: string
          granted_by: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          applied_at?: string | null
          bonus_type?: string
          granted_by?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_fingerprints: {
        Row: {
          created_at: string | null
          fingerprint_hash: string
          id: string
          ip_address: string | null
          language: string | null
          screen_resolution: string | null
          timezone: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fingerprint_hash: string
          id?: string
          ip_address?: string | null
          language?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fingerprint_hash?: string
          id?: string
          ip_address?: string | null
          language?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          sender_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          sender_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          sender_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          color: string | null
          created_at: string | null
          currency: string
          current_balance: number
          icon: string | null
          id: string
          initial_balance: number
          institution: string | null
          is_active: boolean
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          currency?: string
          current_balance?: number
          icon?: string | null
          id?: string
          initial_balance?: number
          institution?: string | null
          is_active?: boolean
          name: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          currency?: string
          current_balance?: number
          icon?: string | null
          id?: string
          initial_balance?: number
          institution?: string | null
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      xp_history: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          source: string
          source_id: string | null
          user_id: string
          xp_after: number
          xp_before: number
          xp_change: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          source: string
          source_id?: string | null
          user_id: string
          xp_after: number
          xp_before: number
          xp_change: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          source?: string
          source_id?: string | null
          user_id?: string
          xp_after?: number
          xp_before?: number
          xp_change?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_approve_referral: {
        Args: { p_note?: string; p_referral_id: string }
        Returns: Json
      }
      admin_check_retention_alerts: { Args: never; Returns: Json }
      admin_get_all_profiles: {
        Args: never
        Returns: {
          avatar_icon: string
          avatar_url: string | null
          created_at: string
          currency: string
          display_name: string | null
          financial_mood: string
          id: string
          language: string
          last_active_date: string | null
          level: number
          level_title: string
          locale: string
          notification_preferences: Json
          onboarding_completed: boolean
          premium_override: Database["public"]["Enums"]["premium_override_type"]
          referral_code: string | null
          referred_by: string | null
          status: string | null
          streak: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_subscription_status: string | null
          subscription_expires_at: string | null
          subscription_plan: string
          subscription_started_at: string | null
          theme_preference: string
          timezone: string
          total_expenses: number
          total_income: number
          updated_at: string
          xp: number
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_get_analytics: { Args: never; Returns: Json }
      admin_get_at_risk_users: {
        Args: never
        Returns: {
          days_inactive: number
          display_name: string
          last_active_date: string
          risk_level: string
          subscription_plan: string
          user_id: string
        }[]
      }
      admin_get_suspicious_referrals: {
        Args: never
        Returns: {
          created_at: string
          flagged_as_suspicious: boolean
          id: string
          referral_code: string
          referred_email: string
          referred_id: string
          referred_name: string
          referrer_email: string
          referrer_id: string
          referrer_name: string
          status: string
          suspicion_reason: string
          transaction_count: number
        }[]
      }
      admin_get_user_email: { Args: { _user_id: string }; Returns: string }
      admin_grant_bonus: {
        Args: {
          _amount: number
          _bonus_type: string
          _note?: string
          _target_user_id: string
        }
        Returns: undefined
      }
      admin_reject_referral: {
        Args: { p_note?: string; p_referral_id: string }
        Returns: Json
      }
      admin_reset_premium_override: {
        Args: { _note?: string; _target_user_id: string }
        Returns: undefined
      }
      admin_update_retention_thresholds: {
        Args: {
          _day1: number
          _day30: number
          _day7: number
          _enabled: boolean
        }
        Returns: undefined
      }
      admin_update_subscription: {
        Args: {
          _expires_at?: string
          _note?: string
          _plan: string
          _target_user_id: string
        }
        Returns: undefined
      }
      admin_update_user_status: {
        Args: { _note?: string; _status: string; _target_user_id: string }
        Returns: undefined
      }
      archive_monthly_goals: { Args: { p_user_id: string }; Returns: undefined }
      check_referral_fraud: {
        Args: { p_referred_id: string; p_referrer_id: string }
        Returns: Json
      }
      claim_daily_reward: { Args: { p_user_id: string }; Returns: Json }
      complete_referral_reward: {
        Args: { p_referred_user_id: string }
        Returns: Json
      }
      create_default_categories: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      get_daily_reward_status: { Args: { p_user_id: string }; Returns: Json }
      get_detailed_referral_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_level_title: { Args: { user_level: number }; Returns: string }
      get_period_end: { Args: { period_type: string }; Returns: string }
      get_period_start: { Args: { period_type: string }; Returns: string }
      get_referral_stats: { Args: { p_user_id: string }; Returns: Json }
      get_referral_tier: { Args: { p_completed_count: number }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      process_referral_signup: {
        Args: { p_referral_code: string; p_referred_user_id: string }
        Returns: Json
      }
      reset_expired_quests: { Args: { p_user_id: string }; Returns: undefined }
      resolve_premium_status: {
        Args: {
          p_override: Database["public"]["Enums"]["premium_override_type"]
          p_stripe_status: string
        }
        Returns: string
      }
      validate_referral_transactions: {
        Args: { p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
      premium_override_type: "none" | "force_on" | "force_off"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "user"],
      premium_override_type: ["none", "force_on", "force_off"],
    },
  },
} as const
