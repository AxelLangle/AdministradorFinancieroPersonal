export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          opening_balance: number
          opening_balance_at: string
          opening_balance_date: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          opening_balance?: number
          opening_balance_at?: string
          opening_balance_date?: string
          type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          opening_balance?: number
          opening_balance_at?: string
          opening_balance_date?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          entity_id: string
          entity_type: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          workspace_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          entity_id: string
          entity_type: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          workspace_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          entity_id?: string
          entity_type?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          alert_threshold_percent: number
          created_at: string
          id: string
          min_cushion_amount: number | null
          min_cushion_percent: number
          month: string
          total_limit: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          alert_threshold_percent?: number
          created_at?: string
          id?: string
          min_cushion_amount?: number | null
          min_cushion_percent?: number
          month: string
          total_limit?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          alert_threshold_percent?: number
          created_at?: string
          id?: string
          min_cushion_amount?: number | null
          min_cushion_percent?: number
          month?: string
          total_limit?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color_token: string
          created_at: string
          default_priority: string
          icon: string
          id: string
          is_active: boolean
          kind: string
          name: string
          sort_order: number
          workspace_id: string
        }
        Insert: {
          color_token?: string
          created_at?: string
          default_priority?: string
          icon?: string
          id?: string
          is_active?: boolean
          kind?: string
          name: string
          sort_order?: number
          workspace_id: string
        }
        Update: {
          color_token?: string
          created_at?: string
          default_priority?: string
          icon?: string
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          sort_order?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          related_transaction_id: string | null
          scheduled_for: string
          title: string
          type: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          related_transaction_id?: string | null
          scheduled_for?: string
          title: string
          type: string
          user_id: string
          workspace_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          related_transaction_id?: string | null
          scheduled_for?: string
          title?: string
          type?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_transaction_id_fkey"
            columns: ["related_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recurrence_rules: {
        Row: {
          account_id: string
          amount_type: string
          category_id: string | null
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          default_amount: number | null
          end_date: string | null
          frequency: string
          id: string
          interval_count: number
          notes: string | null
          priority: string
          semimonthly_days: string | null
          start_date: string
          status: string
          title: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          amount_type?: string
          category_id?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          default_amount?: number | null
          end_date?: string | null
          frequency: string
          id?: string
          interval_count?: number
          notes?: string | null
          priority?: string
          semimonthly_days?: string | null
          start_date: string
          status?: string
          title: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          amount_type?: string
          category_id?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          default_amount?: number | null
          end_date?: string | null
          frequency?: string
          id?: string
          interval_count?: number
          notes?: string | null
          priority?: string
          semimonthly_days?: string | null
          start_date?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurrence_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrence_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrence_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          actual_amount: number | null
          amount_type: string
          category_id: string | null
          created_at: string
          estimated_amount: number | null
          expected_date: string
          id: string
          is_exception: boolean
          notes: string | null
          occurrence_date: string | null
          priority: string
          recurrence_rule_id: string | null
          settled_at: string | null
          settled_date: string | null
          status: string
          title: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          actual_amount?: number | null
          amount_type?: string
          category_id?: string | null
          created_at?: string
          estimated_amount?: number | null
          expected_date: string
          id?: string
          is_exception?: boolean
          notes?: string | null
          occurrence_date?: string | null
          priority?: string
          recurrence_rule_id?: string | null
          settled_at?: string | null
          settled_date?: string | null
          status: string
          title: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          actual_amount?: number | null
          amount_type?: string
          category_id?: string | null
          created_at?: string
          estimated_amount?: number | null
          expected_date?: string
          id?: string
          is_exception?: boolean
          notes?: string | null
          occurrence_date?: string | null
          priority?: string
          recurrence_rule_id?: string | null
          settled_at?: string | null
          settled_date?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurrence_rule_id_fkey"
            columns: ["recurrence_rule_id"]
            isOneToOne: false
            referencedRelation: "recurrence_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          currency: string
          email: string
          id: string
          name: string
          onboarding_completed: boolean
          timezone: string
        }
        Insert: {
          created_at?: string
          currency?: string
          email: string
          id: string
          name?: string
          onboarding_completed?: boolean
          timezone?: string
        }
        Update: {
          created_at?: string
          currency?: string
          email?: string
          id?: string
          name?: string
          onboarding_completed?: boolean
          timezone?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: string
          status: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          status?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          status?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
