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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      dispute_messages: {
        Row: {
          created_at: string
          dispute_id: string
          id: string
          message: string
          sender: string
        }
        Insert: {
          created_at?: string
          dispute_id: string
          id?: string
          message?: string
          sender: string
        }
        Update: {
          created_at?: string
          dispute_id?: string
          id?: string
          message?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          buyer: string
          created_at: string
          id: string
          order_id: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          seller: string
          status: string
        }
        Insert: {
          buyer: string
          created_at?: string
          id?: string
          order_id: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          seller: string
          status?: string
        }
        Update: {
          buyer?: string
          created_at?: string
          id?: string
          order_id?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          seller?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          listing_id: string
          position: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          listing_id: string
          position?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          listing_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string
          id: string
          price_eur: number
          price_ltc: number
          seller: string
          title: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          price_eur: number
          price_ltc: number
          seller: string
          title: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          price_eur?: number
          price_ltc?: number
          seller?: string
          title?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          from_user: string
          id: string
          read: boolean
          subject: string
          to_user: string
        }
        Insert: {
          body?: string
          created_at?: string
          from_user: string
          id?: string
          read?: boolean
          subject?: string
          to_user: string
        }
        Update: {
          body?: string
          created_at?: string
          from_user?: string
          id?: string
          read?: boolean
          subject?: string
          to_user?: string
        }
        Relationships: []
      }
      order_deliveries: {
        Row: {
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          message: string | null
          order_id: string
          sender: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          message?: string | null
          order_id: string
          sender: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          message?: string | null
          order_id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer: string
          created_at: string
          id: string
          listing_id: string
          price_eur: number
          price_ltc: number
          product_title: string
          seller: string
          status: string
        }
        Insert: {
          buyer: string
          created_at?: string
          id?: string
          listing_id: string
          price_eur: number
          price_ltc: number
          product_title: string
          seller: string
          status?: string
        }
        Update: {
          buyer?: string
          created_at?: string
          id?: string
          listing_id?: string
          price_eur?: number
          price_ltc?: number
          product_title?: string
          seller?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          feedback_score: number | null
          id: string
          join_date: string | null
          ltc_address: string | null
          total_sales: number | null
          username: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          feedback_score?: number | null
          id: string
          join_date?: string | null
          ltc_address?: string | null
          total_sales?: number | null
          username: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          feedback_score?: number | null
          id?: string
          join_date?: string | null
          ltc_address?: string | null
          total_sales?: number | null
          username?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_eur: number | null
          amount_ltc: number
          created_at: string
          id: string
          status: string
          txn_id: string | null
          type: string
          username: string
          wallet_address: string | null
        }
        Insert: {
          amount_eur?: number | null
          amount_ltc: number
          created_at?: string
          id?: string
          status?: string
          txn_id?: string | null
          type: string
          username: string
          wallet_address?: string | null
        }
        Update: {
          amount_eur?: number | null
          amount_ltc?: number
          created_at?: string
          id?: string
          status?: string
          txn_id?: string | null
          type?: string
          username?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string
          id: string
          ltc_balance: number
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          ltc_balance?: number
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          ltc_balance?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_username: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
