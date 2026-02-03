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
      active_effects: {
        Row: {
          ativo: boolean
          created_at: string
          data_expiracao: string | null
          id: string
          metadata: Json | null
          origem_compra_id: string | null
          origem_item_id: string | null
          tipo_efeito: string
          usuario_id: string
          valor: number | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_expiracao?: string | null
          id?: string
          metadata?: Json | null
          origem_compra_id?: string | null
          origem_item_id?: string | null
          tipo_efeito: string
          usuario_id: string
          valor?: number | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_expiracao?: string | null
          id?: string
          metadata?: Json | null
          origem_compra_id?: string | null
          origem_item_id?: string | null
          tipo_efeito?: string
          usuario_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "active_effects_origem_compra_id_fkey"
            columns: ["origem_compra_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_effects_origem_item_id_fkey"
            columns: ["origem_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_effects_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      bank_statement_lines: {
        Row: {
          amount: number
          bank_reference: string | null
          counterparty: string | null
          created_at: string
          description: string
          id: string
          import_batch_id: string | null
          imported_at: string
          reconciliation_status: string
          source_file_name: string | null
          transaction_date: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          counterparty?: string | null
          created_at?: string
          description: string
          id?: string
          import_batch_id?: string | null
          imported_at?: string
          reconciliation_status?: string
          source_file_name?: string | null
          transaction_date: string
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          counterparty?: string | null
          created_at?: string
          description?: string
          id?: string
          import_batch_id?: string | null
          imported_at?: string
          reconciliation_status?: string
          source_file_name?: string | null
          transaction_date?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_statement_lines_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_articles_generated: {
        Row: {
          category: string
          content: string
          created_at: string
          excerpt: string
          id: string
          internal_links: Json | null
          keyword: string
          meta_description: string
          meta_title: string
          published_at: string
          read_time: number
          related_slugs: string[] | null
          slug: string
          status: string
          title: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          excerpt: string
          id?: string
          internal_links?: Json | null
          keyword: string
          meta_description: string
          meta_title: string
          published_at?: string
          read_time?: number
          related_slugs?: string[] | null
          slug: string
          status?: string
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          internal_links?: Json | null
          keyword?: string
          meta_description?: string
          meta_title?: string
          published_at?: string
          read_time?: number
          related_slugs?: string[] | null
          slug?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      blog_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_comments: {
        Row: {
          article_slug: string
          content: string
          created_at: string
          id: string
          is_approved: boolean
          is_hidden: boolean
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          article_slug: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_hidden?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          article_slug?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_hidden?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_user_id_fkey"
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
      credit_card_invoices: {
        Row: {
          closed_at: string | null
          created_at: string
          credit_card_id: string
          due_date: string
          id: string
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          credit_card_id: string
          due_date: string
          id?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          credit_card_id?: string
          due_date?: string
          id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_invoices_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          available_limit: number
          bank: string
          billing_close_day: number
          created_at: string
          currency: string
          due_day: number
          id: string
          is_active: boolean
          linked_wallet_id: string | null
          name: string
          total_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_limit?: number
          bank: string
          billing_close_day: number
          created_at?: string
          currency?: string
          due_day: number
          id?: string
          is_active?: boolean
          linked_wallet_id?: string | null
          name: string
          total_limit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_limit?: number
          bank?: string
          billing_close_day?: number
          created_at?: string
          currency?: string
          due_day?: number
          id?: string
          is_active?: boolean
          linked_wallet_id?: string | null
          name?: string
          total_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_linked_wallet_id_fkey"
            columns: ["linked_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_conversion_limits: {
        Row: {
          coins_received: number
          conversion_date: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          xp_converted: number
        }
        Insert: {
          coins_received?: number
          conversion_date?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          xp_converted?: number
        }
        Update: {
          coins_received?: number
          conversion_date?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          xp_converted?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_conversion_limits_user_id_fkey"
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
      daily_transaction_xp_limits: {
        Row: {
          created_at: string
          id: string
          transaction_date: string
          transactions_with_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          transaction_date: string
          transactions_with_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          transaction_date?: string
          transactions_with_xp?: number
          updated_at?: string
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
      internal_campaigns: {
        Row: {
          bg_gradient: string | null
          campaign_type: string
          created_at: string | null
          created_by: string | null
          cta_link: string
          cta_text: string
          end_date: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          start_date: string | null
          subtitle: string | null
          target_audience: string | null
          text_color: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          bg_gradient?: string | null
          campaign_type: string
          created_at?: string | null
          created_by?: string | null
          cta_link: string
          cta_text: string
          end_date?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          start_date?: string | null
          subtitle?: string | null
          target_audience?: string | null
          text_color?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          bg_gradient?: string | null
          campaign_type?: string
          created_at?: string | null
          created_by?: string | null
          cta_link?: string
          cta_text?: string
          end_date?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          start_date?: string | null
          subtitle?: string | null
          target_audience?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string | null
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
          public_id: string
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
          public_id: string
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
          public_id?: string
          updated_at?: string | null
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      loans: {
        Row: {
          considerar_orcamento: boolean
          created_at: string
          currency: string
          data_contratacao: string
          debitar_automaticamente: boolean
          enviar_lembrete: boolean
          id: string
          instituicao_pessoa: string
          notas: string | null
          parcelas_pagas: number
          primeiro_vencimento: string
          quantidade_parcelas: number
          saldo_devedor: number
          status: string
          taxa_juros: number | null
          tipo_emprestimo: string
          updated_at: string
          user_id: string
          valor_parcela: number
          valor_total: number
        }
        Insert: {
          considerar_orcamento?: boolean
          created_at?: string
          currency?: string
          data_contratacao?: string
          debitar_automaticamente?: boolean
          enviar_lembrete?: boolean
          id?: string
          instituicao_pessoa: string
          notas?: string | null
          parcelas_pagas?: number
          primeiro_vencimento: string
          quantidade_parcelas: number
          saldo_devedor: number
          status?: string
          taxa_juros?: number | null
          tipo_emprestimo: string
          updated_at?: string
          user_id: string
          valor_parcela: number
          valor_total: number
        }
        Update: {
          considerar_orcamento?: boolean
          created_at?: string
          currency?: string
          data_contratacao?: string
          debitar_automaticamente?: boolean
          enviar_lembrete?: boolean
          id?: string
          instituicao_pessoa?: string
          notas?: string | null
          parcelas_pagas?: number
          primeiro_vencimento?: string
          quantidade_parcelas?: number
          saldo_devedor?: number
          status?: string
          taxa_juros?: number | null
          tipo_emprestimo?: string
          updated_at?: string
          user_id?: string
          valor_parcela?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "loans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      monthly_closure_audit: {
        Row: {
          action: string
          closure_id: string
          created_at: string
          id: string
          reason: string | null
          snapshot_data: Json | null
          user_id: string
        }
        Insert: {
          action: string
          closure_id: string
          created_at?: string
          id?: string
          reason?: string | null
          snapshot_data?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          closure_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          snapshot_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_closure_audit_closure_id_fkey"
            columns: ["closure_id"]
            isOneToOne: false
            referencedRelation: "monthly_closures"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_closures: {
        Row: {
          cash_adjustment_count: number
          closed_at: string | null
          closed_by: string | null
          closing_notes: string | null
          created_at: string
          id: string
          net_result: number
          period_month: number
          period_year: number
          previous_closure_snapshot: Json | null
          reopen_reason: string | null
          reopened_at: string | null
          reopened_by: string | null
          status: string
          total_expenses: number
          total_income: number
          transaction_count: number
          updated_at: string
          user_id: string
          wallet_balances: Json
        }
        Insert: {
          cash_adjustment_count?: number
          closed_at?: string | null
          closed_by?: string | null
          closing_notes?: string | null
          created_at?: string
          id?: string
          net_result?: number
          period_month: number
          period_year: number
          previous_closure_snapshot?: Json | null
          reopen_reason?: string | null
          reopened_at?: string | null
          reopened_by?: string | null
          status?: string
          total_expenses?: number
          total_income?: number
          transaction_count?: number
          updated_at?: string
          user_id: string
          wallet_balances?: Json
        }
        Update: {
          cash_adjustment_count?: number
          closed_at?: string | null
          closed_by?: string | null
          closing_notes?: string | null
          created_at?: string
          id?: string
          net_result?: number
          period_month?: number
          period_year?: number
          previous_closure_snapshot?: Json | null
          reopen_reason?: string | null
          reopened_at?: string | null
          reopened_by?: string | null
          status?: string
          total_expenses?: number
          total_income?: number
          transaction_count?: number
          updated_at?: string
          user_id?: string
          wallet_balances?: Json
        }
        Relationships: [
          {
            foreignKeyName: "monthly_closures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_rewards: {
        Row: {
          claimed_at: string | null
          created_at: string
          description: string | null
          icon: string
          id: string
          is_claimed: boolean
          name: string
          user_id: string
          xp_threshold: number
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_claimed?: boolean
          name: string
          user_id: string
          xp_threshold: number
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_claimed?: boolean
          name?: string
          user_id?: string
          xp_threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "personal_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_shop_theme: string | null
          avatar_icon: string
          avatar_url: string | null
          created_at: string
          currency: string
          discount_offer_expires_at: string | null
          discount_offer_shown: boolean | null
          display_name: string | null
          financial_mood: string
          has_used_trial: boolean
          id: string
          language: string
          last_active_date: string | null
          level: number
          level_title: string
          locale: string
          mq_coins: number
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
          trial_end_date: string | null
          trial_start_date: string | null
          unlocked_features: Json | null
          updated_at: string
          xp: number
          xp_conversivel: number
        }
        Insert: {
          active_shop_theme?: string | null
          avatar_icon?: string
          avatar_url?: string | null
          created_at?: string
          currency?: string
          discount_offer_expires_at?: string | null
          discount_offer_shown?: boolean | null
          display_name?: string | null
          financial_mood?: string
          has_used_trial?: boolean
          id: string
          language?: string
          last_active_date?: string | null
          level?: number
          level_title?: string
          locale?: string
          mq_coins?: number
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
          trial_end_date?: string | null
          trial_start_date?: string | null
          unlocked_features?: Json | null
          updated_at?: string
          xp?: number
          xp_conversivel?: number
        }
        Update: {
          active_shop_theme?: string | null
          avatar_icon?: string
          avatar_url?: string | null
          created_at?: string
          currency?: string
          discount_offer_expires_at?: string | null
          discount_offer_shown?: boolean | null
          display_name?: string | null
          financial_mood?: string
          has_used_trial?: boolean
          id?: string
          language?: string
          last_active_date?: string | null
          level?: number
          level_title?: string
          locale?: string
          mq_coins?: number
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
          trial_end_date?: string | null
          trial_start_date?: string | null
          unlocked_features?: Json | null
          updated_at?: string
          xp?: number
          xp_conversivel?: number
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
      purchases: {
        Row: {
          created_at: string
          data_compra: string
          data_expiracao: string | null
          id: string
          item_id: string
          preco_pago: number
          status: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          data_compra?: string
          data_expiracao?: string | null
          id?: string
          item_id: string
          preco_pago?: number
          status?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          data_compra?: string
          data_expiracao?: string | null
          id?: string
          item_id?: string
          preco_pago?: number
          status?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_usuario_id_fkey"
            columns: ["usuario_id"]
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
      reconciliations: {
        Row: {
          bank_line_id: string
          confidence_score: number | null
          created_at: string
          id: string
          match_type: string
          notes: string | null
          reconciled_at: string
          reconciled_by: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          bank_line_id: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          match_type?: string
          notes?: string | null
          reconciled_at?: string
          reconciled_by?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          bank_line_id?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          match_type?: string
          notes?: string | null
          reconciled_at?: string
          reconciled_by?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliations_bank_line_id_fkey"
            columns: ["bank_line_id"]
            isOneToOne: false
            referencedRelation: "bank_statement_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliations_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_fraud_analysis: {
        Row: {
          analysis_details: Json
          created_at: string | null
          id: string
          referral_id: string | null
          referred_id: string
          referrer_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_level: string
          risk_score: number
        }
        Insert: {
          analysis_details?: Json
          created_at?: string | null
          id?: string
          referral_id?: string | null
          referred_id: string
          referrer_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string
          risk_score?: number
        }
        Update: {
          analysis_details?: Json
          created_at?: string | null
          id?: string
          referral_id?: string | null
          referred_id?: string
          referrer_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string
          risk_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_fraud_analysis_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
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
      scheduled_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          day_of_month: number | null
          day_of_week: number | null
          description: string
          frequency: string
          id: string
          is_active: boolean
          last_run_date: string | null
          month_of_year: number | null
          next_run_date: string
          remaining_occurrences: number | null
          supplier: string | null
          total_occurrences: number | null
          type: string
          updated_at: string
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          currency?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description: string
          frequency: string
          id?: string
          is_active?: boolean
          last_run_date?: string | null
          month_of_year?: number | null
          next_run_date: string
          remaining_occurrences?: number | null
          supplier?: string | null
          total_occurrences?: number | null
          type: string
          updated_at?: string
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_date?: string | null
          month_of_year?: number | null
          next_run_date?: string
          remaining_occurrences?: number | null
          supplier?: string | null
          total_occurrences?: number | null
          type?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_transfers: {
        Row: {
          amount: number
          created_at: string
          currency: string
          day_of_month: number | null
          day_of_week: number | null
          description: string | null
          frequency: string
          from_wallet_id: string
          id: string
          is_active: boolean
          last_run_date: string | null
          next_run_date: string
          remaining_occurrences: number | null
          to_wallet_id: string
          total_occurrences: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          frequency: string
          from_wallet_id: string
          id?: string
          is_active?: boolean
          last_run_date?: string | null
          next_run_date: string
          remaining_occurrences?: number | null
          to_wallet_id: string
          total_occurrences?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          frequency?: string
          from_wallet_id?: string
          id?: string
          is_active?: boolean
          last_run_date?: string | null
          next_run_date?: string
          remaining_occurrences?: number | null
          to_wallet_id?: string
          total_occurrences?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_transfers_from_wallet_id_fkey"
            columns: ["from_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_transfers_to_wallet_id_fkey"
            columns: ["to_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          duracao_em_horas: number | null
          icone: string | null
          id: string
          imagem_url: string | null
          is_limited: boolean | null
          metadata: Json | null
          nome: string
          preco_mq_coins: number
          premium_only: boolean
          raridade: string
          rotation_week: number | null
          stock_remaining: number | null
          stock_total: number | null
          tipo: string
          updated_at: string
          visivel_para_free: boolean
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          duracao_em_horas?: number | null
          icone?: string | null
          id?: string
          imagem_url?: string | null
          is_limited?: boolean | null
          metadata?: Json | null
          nome: string
          preco_mq_coins?: number
          premium_only?: boolean
          raridade?: string
          rotation_week?: number | null
          stock_remaining?: number | null
          stock_total?: number | null
          tipo: string
          updated_at?: string
          visivel_para_free?: boolean
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          duracao_em_horas?: number | null
          icone?: string | null
          id?: string
          imagem_url?: string | null
          is_limited?: boolean | null
          metadata?: Json | null
          nome?: string
          preco_mq_coins?: number
          premium_only?: boolean
          raridade?: string
          rotation_week?: number | null
          stock_remaining?: number | null
          stock_total?: number | null
          tipo?: string
          updated_at?: string
          visivel_para_free?: boolean
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          created_at: string | null
          id: string
          last_used_at: string | null
          name: string
          total_spent: number | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          total_spent?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          total_spent?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
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
      traffic_logs: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          error_code: number | null
          id: string
          is_bounce: boolean | null
          language: string | null
          os: string | null
          page_title: string | null
          page_url: string
          referrer: string | null
          screen_resolution: string | null
          session_id: string
          time_on_page: number | null
          timezone: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          error_code?: number | null
          id?: string
          is_bounce?: boolean | null
          language?: string | null
          os?: string | null
          page_title?: string | null
          page_url: string
          referrer?: string | null
          screen_resolution?: string | null
          session_id: string
          time_on_page?: number | null
          timezone?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          error_code?: number | null
          id?: string
          is_bounce?: boolean | null
          language?: string | null
          os?: string | null
          page_title?: string | null
          page_url?: string
          referrer?: string | null
          screen_resolution?: string | null
          session_id?: string
          time_on_page?: number | null
          timezone?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          id: string
          name: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          id?: string
          name: string
          transaction_id: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
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
          credit_card_id: string | null
          currency: string
          date: string
          description: string
          has_items: boolean | null
          id: string
          invoice_id: string | null
          is_manual: boolean
          source_type: string
          supplier: string | null
          transaction_subtype: string | null
          type: string
          user_id: string
          wallet_id: string | null
          xp_earned: number
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          credit_card_id?: string | null
          currency?: string
          date?: string
          description: string
          has_items?: boolean | null
          id?: string
          invoice_id?: string | null
          is_manual?: boolean
          source_type?: string
          supplier?: string | null
          transaction_subtype?: string | null
          type: string
          user_id: string
          wallet_id?: string | null
          xp_earned?: number
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          credit_card_id?: string | null
          currency?: string
          date?: string
          description?: string
          has_items?: boolean | null
          id?: string
          invoice_id?: string | null
          is_manual?: boolean
          source_type?: string
          supplier?: string | null
          transaction_subtype?: string | null
          type?: string
          user_id?: string
          wallet_id?: string | null
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "credit_card_invoices"
            referencedColumns: ["id"]
          },
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
      user_backups: {
        Row: {
          backup_data: Json
          created_at: string
          file_size: number
          id: string
          name: string
          user_id: string
        }
        Insert: {
          backup_data: Json
          created_at?: string
          file_size?: number
          id?: string
          name: string
          user_id: string
        }
        Update: {
          backup_data?: Json
          created_at?: string
          file_size?: number
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
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
      wallet_transfers: {
        Row: {
          amount: number
          created_at: string
          currency: string
          date: string
          description: string | null
          from_wallet_id: string
          id: string
          to_wallet_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          date?: string
          description?: string | null
          from_wallet_id: string
          id?: string
          to_wallet_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          date?: string
          description?: string | null
          from_wallet_id?: string
          id?: string
          to_wallet_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transfers_from_wallet_id_fkey"
            columns: ["from_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transfers_to_wallet_id_fkey"
            columns: ["to_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          color: string | null
          created_at: string | null
          currency: string
          current_balance: number
          display_order: number
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
          display_order?: number
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
          display_order?: number
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
      web_vitals_logs: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          metric_name: string
          metric_value: number
          navigation_type: string | null
          page_url: string
          rating: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          metric_name: string
          metric_value: number
          navigation_type?: string | null
          page_url: string
          rating: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          metric_name?: string
          metric_value?: number
          navigation_type?: string | null
          page_url?: string
          rating?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      xp_conversion_log: {
        Row: {
          data: string
          id: string
          mq_coins_recebidos: number
          taxa_conversao: number
          usuario_id: string
          xp_gasto: number
        }
        Insert: {
          data?: string
          id?: string
          mq_coins_recebidos: number
          taxa_conversao?: number
          usuario_id: string
          xp_gasto: number
        }
        Update: {
          data?: string
          id?: string
          mq_coins_recebidos?: number
          taxa_conversao?: number
          usuario_id?: string
          xp_gasto?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_conversion_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      leaderboard_public: {
        Row: {
          avatar_icon: string | null
          display_name: string | null
          id: string | null
          is_public: boolean | null
          joined_at: string | null
          level: number | null
          public_id: string | null
          updated_at: string | null
          xp: number | null
        }
        Insert: {
          avatar_icon?: string | null
          display_name?: string | null
          id?: string | null
          is_public?: boolean | null
          joined_at?: string | null
          level?: number | null
          public_id?: string | null
          updated_at?: string | null
          xp?: number | null
        }
        Update: {
          avatar_icon?: string | null
          display_name?: string | null
          id?: string | null
          is_public?: boolean | null
          joined_at?: string | null
          level?: number | null
          public_id?: string | null
          updated_at?: string | null
          xp?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_user_xp:
        | {
            Args: { p_user_id: string; p_xp_amount: number }
            Returns: undefined
          }
        | {
            Args: {
              p_description?: string
              p_source: string
              p_source_id?: string
              p_user_id: string
              p_xp_amount: number
            }
            Returns: undefined
          }
      admin_add_ip_whitelist: {
        Args: {
          p_description?: string
          p_ip_address: string
          p_organization?: string
        }
        Returns: string
      }
      admin_approve_referral: {
        Args: { p_note?: string; p_referral_id: string }
        Returns: Json
      }
      admin_check_retention_alerts: { Args: never; Returns: Json }
      admin_check_web_vitals_alerts: { Args: never; Returns: Json }
      admin_delete_user: {
        Args: { _note?: string; _target_user_id: string }
        Returns: Json
      }
      admin_export_user_data: {
        Args: { _target_user_id: string }
        Returns: Json
      }
      admin_get_all_profiles: {
        Args: never
        Returns: {
          active_shop_theme: string | null
          avatar_icon: string
          avatar_url: string | null
          created_at: string
          currency: string
          discount_offer_expires_at: string | null
          discount_offer_shown: boolean | null
          display_name: string | null
          financial_mood: string
          has_used_trial: boolean
          id: string
          language: string
          last_active_date: string | null
          level: number
          level_title: string
          locale: string
          mq_coins: number
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
          trial_end_date: string | null
          trial_start_date: string | null
          unlocked_features: Json | null
          updated_at: string
          xp: number
          xp_conversivel: number
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
      admin_get_fraud_analysis: {
        Args: never
        Returns: {
          analysis_details: Json
          created_at: string
          id: string
          reasons: string[]
          referral_id: string
          referral_status: string
          referred_id: string
          referred_name: string
          referrer_id: string
          referrer_name: string
          reviewed_at: string
          risk_level: string
          risk_score: number
        }[]
      }
      admin_get_ip_whitelist: {
        Args: never
        Returns: {
          created_at: string
          created_by: string
          description: string
          id: string
          ip_address: string
          is_active: boolean
          is_cidr: boolean
          organization: string
        }[]
      }
      admin_get_suspicious_access: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
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
      admin_get_top_pages: {
        Args: { p_end_date?: string; p_limit?: number; p_start_date?: string }
        Returns: Json
      }
      admin_get_traffic_analytics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      admin_get_traffic_errors: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      admin_get_traffic_sources: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      admin_get_trial_abuse_attempts: {
        Args: never
        Returns: {
          blocked_user_email: string
          blocked_user_id: string
          blocked_user_name: string
          created_at: string
          fingerprint_hash: string
          fingerprint_ip: string
          fingerprint_timezone: string
          fingerprint_user_agent: string
          id: string
          message: string
          notification_type: string
          other_users_with_fingerprint: number
          reason: string
          severity: string
          title: string
        }[]
      }
      admin_get_user_email: { Args: { _user_id: string }; Returns: string }
      admin_get_users_by_fingerprint: {
        Args: { p_fingerprint_hash: string }
        Returns: {
          created_at: string
          display_name: string
          email: string
          fingerprint_created_at: string
          has_used_trial: boolean
          subscription_plan: string
          trial_end_date: string
          trial_start_date: string
          user_id: string
        }[]
      }
      admin_get_web_vitals_summary: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      admin_grant_bonus: {
        Args: {
          _amount: number
          _bonus_type: string
          _note?: string
          _target_user_id: string
        }
        Returns: undefined
      }
      admin_link_referral_manually: {
        Args: { p_note?: string; p_referred_id: string; p_referrer_id: string }
        Returns: Json
      }
      admin_mark_fraud_reviewed: {
        Args: { p_analysis_id: string }
        Returns: undefined
      }
      admin_mark_trial_abuse_reviewed: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      admin_reject_referral: {
        Args: { p_note?: string; p_referral_id: string }
        Returns: Json
      }
      admin_remove_ip_whitelist: { Args: { p_id: string }; Returns: undefined }
      admin_reset_premium_override: {
        Args: { _note?: string; _target_user_id: string }
        Returns: undefined
      }
      admin_toggle_ip_whitelist: {
        Args: { p_id: string; p_is_active: boolean }
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
      admin_upsert_campaign: {
        Args: {
          p_bg_gradient?: string
          p_campaign_type?: string
          p_cta_link?: string
          p_cta_text?: string
          p_end_date?: string
          p_icon?: string
          p_id?: string
          p_is_active?: boolean
          p_name?: string
          p_priority?: number
          p_start_date?: string
          p_subtitle?: string
          p_target_audience?: string
          p_title?: string
        }
        Returns: string
      }
      archive_monthly_goals: { Args: { p_user_id: string }; Returns: undefined }
      block_trial_for_abuse: {
        Args: { p_reason: string; p_user_id: string }
        Returns: undefined
      }
      check_fingerprint_trial_abuse: {
        Args: { p_fingerprint_hash: string }
        Returns: Json
      }
      check_loan_badges: {
        Args: { p_user_id: string }
        Returns: {
          badge_icon: string
          badge_name: string
          unlocked: boolean
        }[]
      }
      check_referral_fraud: {
        Args: { p_referred_id: string; p_referrer_id: string }
        Returns: Json
      }
      check_referral_fraud_v2: {
        Args: { p_referred_id: string; p_referrer_id: string }
        Returns: Json
      }
      check_transaction_xp_limit: { Args: { p_user_id: string }; Returns: Json }
      claim_daily_reward: { Args: { p_user_id: string }; Returns: Json }
      close_credit_card_invoice: {
        Args: { p_invoice_id: string; p_user_id: string }
        Returns: Json
      }
      complete_referral_reward: {
        Args: { p_referred_user_id: string }
        Returns: Json
      }
      convert_xp_to_coins: {
        Args: { p_user_id: string; p_xp_amount: number }
        Returns: Json
      }
      create_default_categories: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      expire_old_effects: { Args: never; Returns: undefined }
      get_active_campaigns: {
        Args: { p_audience?: string }
        Returns: {
          bg_gradient: string | null
          campaign_type: string
          created_at: string | null
          created_by: string | null
          cta_link: string
          cta_text: string
          end_date: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          start_date: string | null
          subtitle: string | null
          target_audience: string | null
          text_color: string | null
          title: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "internal_campaigns"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_conversion_info: { Args: { p_user_id: string }; Returns: Json }
      get_daily_reward_status: { Args: { p_user_id: string }; Returns: Json }
      get_detailed_referral_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_level_title: { Args: { user_level: number }; Returns: string }
      get_or_create_current_invoice: {
        Args: {
          p_credit_card_id: string
          p_transaction_date: string
          p_user_id: string
        }
        Returns: string
      }
      get_period_end: { Args: { period_type: string }; Returns: string }
      get_period_start: { Args: { period_type: string }; Returns: string }
      get_referral_stats: { Args: { p_user_id: string }; Returns: Json }
      get_referral_tier: { Args: { p_completed_count: number }; Returns: Json }
      get_tier_rewards: { Args: { p_completed_count: number }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_loan_badges: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      mark_discount_offer_shown: { Args: { p_user_id: string }; Returns: Json }
      pay_credit_card_invoice: {
        Args: {
          p_invoice_id: string
          p_payment_date?: string
          p_user_id: string
          p_wallet_id: string
        }
        Returns: Json
      }
      process_referral_signup:
        | {
            Args: { p_referral_code: string; p_referred_user_id: string }
            Returns: Json
          }
        | {
            Args: { p_referral_code: string; p_referred_user_id: string }
            Returns: Json
          }
      recalculate_invoice_total: {
        Args: { p_invoice_id: string }
        Returns: number
      }
      register_fingerprint_with_trial_check: {
        Args: {
          p_fingerprint_hash: string
          p_language?: string
          p_screen_resolution?: string
          p_timezone?: string
          p_user_agent?: string
          p_user_id: string
        }
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
      validate_referral_transactions_v2: {
        Args: { p_user_id: string }
        Returns: Json
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
