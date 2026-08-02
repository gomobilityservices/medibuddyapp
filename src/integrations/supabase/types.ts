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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          balance: number
          created_at: string
          email: string
          gender: string
          id: string
          name: string
          pending_earnings: number
          photo: string
          role: string
          total_earnings: number
          updated_at: string
          wallet_balance: number
        }
        Insert: {
          balance?: number
          created_at?: string
          email: string
          gender?: string
          id: string
          name?: string
          pending_earnings?: number
          photo?: string
          role: string
          total_earnings?: number
          updated_at?: string
          wallet_balance?: number
        }
        Update: {
          balance?: number
          created_at?: string
          email?: string
          gender?: string
          id?: string
          name?: string
          pending_earnings?: number
          photo?: string
          role?: string
          total_earnings?: number
          updated_at?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      providers: {
        Row: {
          area: string
          available: boolean
          categories: string[]
          created_at: string
          description: string
          distance_km: number
          experience: string
          gender: string
          id: string
          languages: string[]
          name: string
          photo: string
          preferred_customer_gender: string
          rate_call: number
          rate_chat: number
          rating: number
          response_sec: number
          reviews: number
          sessions: number
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          area?: string
          available?: boolean
          categories?: string[]
          created_at?: string
          description?: string
          distance_km?: number
          experience?: string
          gender?: string
          id?: string
          languages?: string[]
          name?: string
          photo?: string
          preferred_customer_gender?: string
          rate_call?: number
          rate_chat?: number
          rating?: number
          response_sec?: number
          reviews?: number
          sessions?: number
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          area?: string
          available?: boolean
          categories?: string[]
          created_at?: string
          description?: string
          distance_km?: number
          experience?: string
          gender?: string
          id?: string
          languages?: string[]
          name?: string
          photo?: string
          preferred_customer_gender?: string
          rate_call?: number
          rate_chat?: number
          rating?: number
          response_sec?: number
          reviews?: number
          sessions?: number
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          customer_id: string
          customer_name: string
          id: string
          provider_id: string
          rating: number
        }
        Insert: {
          comment?: string
          created_at?: string
          customer_id: string
          customer_name?: string
          id?: string
          provider_id: string
          rating: number
        }
        Update: {
          comment?: string
          created_at?: string
          customer_id?: string
          customer_name?: string
          id?: string
          provider_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_providers: {
        Row: {
          created_at: string
          provider_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          provider_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          provider_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_providers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          amount: number
          customer_id: string
          ended_at: string | null
          id: string
          minutes: number
          mode: string
          provider_earnings: number
          provider_id: string
          rate: number
          seconds: number
          started_at: string
          status: string
        }
        Insert: {
          amount?: number
          customer_id: string
          ended_at?: string | null
          id?: string
          minutes?: number
          mode: string
          provider_earnings?: number
          provider_id: string
          rate: number
          seconds?: number
          started_at?: string
          status?: string
        }
        Update: {
          amount?: number
          customer_id?: string
          ended_at?: string | null
          id?: string
          minutes?: number
          mode?: string
          provider_earnings?: number
          provider_id?: string
          rate?: number
          seconds?: number
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          label: string
          sub: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          label: string
          sub?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          label?: string
          sub?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      end_session: {
        Args: { p_seconds: number; p_session_id: string }
        Returns: Json
      }
      request_withdrawal: { Args: { p_amount: number }; Returns: boolean }
      start_session: {
        Args: { p_mode: string; p_provider_id: string }
        Returns: {
          amount: number
          customer_id: string
          ended_at: string | null
          id: string
          minutes: number
          mode: string
          provider_earnings: number
          provider_id: string
          rate: number
          seconds: number
          started_at: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_review: {
        Args: { p_comment: string; p_provider_id: string; p_rating: number }
        Returns: boolean
      }
      top_up_wallet: { Args: { p_amount: number }; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
