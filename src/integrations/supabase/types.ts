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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          contact_email: string | null
          created_at: string
          external_id: string | null
          id: string
          name: string
          notes: string | null
          provider_id: string | null
          responsible: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          name: string
          notes?: string | null
          provider_id?: string | null
          responsible?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          provider_id?: string | null
          responsible?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          alert_date: string
          created_at: string
          days_until: number | null
          description: string
          id: string
          infrastructure_asset_id: string | null
          notify_channels: string[] | null
          resolved: boolean
          resolved_at: string | null
          service: string
          subscription_id: string | null
          type: string
          urgency: string
          user_id: string
        }
        Insert: {
          alert_date?: string
          created_at?: string
          days_until?: number | null
          description: string
          id?: string
          infrastructure_asset_id?: string | null
          notify_channels?: string[] | null
          resolved?: boolean
          resolved_at?: string | null
          service: string
          subscription_id?: string | null
          type: string
          urgency: string
          user_id: string
        }
        Update: {
          alert_date?: string
          created_at?: string
          days_until?: number | null
          description?: string
          id?: string
          infrastructure_asset_id?: string | null
          notify_channels?: string[] | null
          resolved?: boolean
          resolved_at?: string | null
          service?: string
          subscription_id?: string | null
          type?: string
          urgency?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_infrastructure_asset_id_fkey"
            columns: ["infrastructure_asset_id"]
            isOneToOne: false
            referencedRelation: "infrastructure_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          target_id: string | null
          target_table: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          account_id: string | null
          amount: number
          billing_type: string
          created_at: string
          currency: string
          due_date: string | null
          id: string
          infrastructure_asset_id: string | null
          notes: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          provider_id: string | null
          reference: string
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          billing_type?: string
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          infrastructure_asset_id?: string | null
          notes?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          provider_id?: string | null
          reference: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          billing_type?: string
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          infrastructure_asset_id?: string | null
          notes?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          provider_id?: string | null
          reference?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_infrastructure_asset_id_fkey"
            columns: ["infrastructure_asset_id"]
            isOneToOne: false
            referencedRelation: "infrastructure_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          kind: string
          name: string
          position: number
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          kind: string
          name: string
          position?: number
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          kind?: string
          name?: string
          position?: number
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credentials: {
        Row: {
          account: string | null
          account_id: string | null
          classification: string
          created_at: string
          has_2fa: boolean
          id: string
          login: string
          notes: string | null
          owner: string | null
          password_encrypted: string
          provider: string
          provider_id: string | null
          recovery_info: string | null
          security_notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account?: string | null
          account_id?: string | null
          classification?: string
          created_at?: string
          has_2fa?: boolean
          id?: string
          login: string
          notes?: string | null
          owner?: string | null
          password_encrypted: string
          provider: string
          provider_id?: string | null
          recovery_info?: string | null
          security_notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account?: string | null
          account_id?: string | null
          classification?: string
          created_at?: string
          has_2fa?: boolean
          id?: string
          login?: string
          notes?: string | null
          owner?: string | null
          password_encrypted?: string
          provider?: string
          provider_id?: string | null
          recovery_info?: string | null
          security_notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credentials_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentials_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_tags: {
        Row: {
          created_at: string
          id: string
          infrastructure_asset_id: string | null
          opportunity_id: string | null
          subscription_id: string | null
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          infrastructure_asset_id?: string | null
          opportunity_id?: string | null
          subscription_id?: string | null
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          infrastructure_asset_id?: string | null
          opportunity_id?: string | null
          subscription_id?: string | null
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_tags_infrastructure_asset_id_fkey"
            columns: ["infrastructure_asset_id"]
            isOneToOne: false
            referencedRelation: "infrastructure_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_tags_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_tags_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      infrastructure_assets: {
        Row: {
          account_id: string | null
          asset_type: string
          created_at: string
          id: string
          ip_address: string | null
          monthly_cost: number
          name: string
          notes: string | null
          provider_id: string | null
          region: string | null
          renewal_date: string | null
          responsible: string | null
          status: string
          updated_at: string
          usage_summary: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          asset_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          monthly_cost?: number
          name: string
          notes?: string | null
          provider_id?: string | null
          region?: string | null
          renewal_date?: string | null
          responsible?: string | null
          status?: string
          updated_at?: string
          usage_summary?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          asset_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          monthly_cost?: number
          name?: string
          notes?: string | null
          provider_id?: string | null
          region?: string | null
          renewal_date?: string | null
          responsible?: string | null
          status?: string
          updated_at?: string
          usage_summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "infrastructure_assets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "infrastructure_assets_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          alert_id: string | null
          body: string
          channel: string
          created_at: string
          error_message: string | null
          id: string
          recipient: string
          sent_at: string | null
          status: string
          subject: string | null
          user_id: string
        }
        Insert: {
          alert_id?: string | null
          body: string
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          alert_id?: string | null
          body?: string
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          category: string | null
          created_at: string
          estimated_cost: number
          expected_benefit: string | null
          id: string
          notes: string | null
          priority: string
          reason: string
          responsible: string | null
          status: string
          title: string
          tool: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          estimated_cost?: number
          expected_benefit?: string | null
          id?: string
          notes?: string | null
          priority?: string
          reason: string
          responsible?: string | null
          status?: string
          title: string
          tool?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          estimated_cost?: number
          expected_benefit?: string | null
          id?: string
          notes?: string | null
          priority?: string
          reason?: string
          responsible?: string | null
          status?: string
          title?: string
          tool?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          role_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          account: string | null
          account_id: string | null
          auto_renew: boolean
          category: string | null
          created_at: string
          currency: string
          cycle: string
          id: string
          next_renewal: string | null
          notes: string | null
          plan: string | null
          provider: string
          provider_id: string | null
          responsible: string | null
          status: string
          tags: string[] | null
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          account?: string | null
          account_id?: string | null
          auto_renew?: boolean
          category?: string | null
          created_at?: string
          currency?: string
          cycle?: string
          id?: string
          next_renewal?: string | null
          notes?: string | null
          plan?: string | null
          provider: string
          provider_id?: string | null
          responsible?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          account?: string | null
          account_id?: string | null
          auto_renew?: boolean
          category?: string | null
          created_at?: string
          currency?: string
          cycle?: string
          id?: string
          next_renewal?: string | null
          notes?: string | null
          plan?: string | null
          provider?: string
          provider_id?: string | null
          responsible?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_records: {
        Row: {
          created_at: string
          id: string
          infrastructure_asset_id: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          notes: string | null
          recorded_at: string
          subscription_id: string | null
          usage_period_end: string | null
          usage_period_start: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          infrastructure_asset_id?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number
          notes?: string | null
          recorded_at?: string
          subscription_id?: string | null
          usage_period_end?: string | null
          usage_period_start?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          infrastructure_asset_id?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          notes?: string | null
          recorded_at?: string
          subscription_id?: string | null
          usage_period_end?: string | null
          usage_period_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_infrastructure_asset_id_fkey"
            columns: ["infrastructure_asset_id"]
            isOneToOne: false
            referencedRelation: "infrastructure_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_alerts: { Args: { p_user_id: string }; Returns: undefined }
      get_category_cost_breakdown: {
        Args: { p_user_id: string }
        Returns: {
          name: string
          value: number
        }[]
      }
      get_monthly_cost_trend: {
        Args: { p_user_id: string }
        Returns: {
          month: string
          total: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "viewer"
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
      app_role: ["admin", "operator", "viewer"],
    },
  },
} as const
