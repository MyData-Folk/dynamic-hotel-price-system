export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      category_rules: {
        Row: {
          base_source: string
          category_id: string
          created_at: string
          formula_multiplier: number
          formula_offset: number
          formula_type: string
          id: string
        }
        Insert: {
          base_source: string
          category_id: string
          created_at?: string
          formula_multiplier: number
          formula_offset: number
          formula_type: string
          id?: string
        }
        Update: {
          base_source?: string
          category_id?: string
          created_at?: string
          formula_multiplier?: number
          formula_offset?: number
          formula_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_prices: {
        Row: {
          created_at: string | null
          date: string
          id: string
          price: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          price: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          price?: number
        }
        Relationships: []
      }
      daily_base_rates: {
        Row: {
          created_at: string
          date: string
          ota_rate: number
          travco_rate: number
        }
        Insert: {
          created_at?: string
          date: string
          ota_rate: number
          travco_rate: number
        }
        Update: {
          created_at?: string
          date?: string
          ota_rate?: number
          travco_rate?: number
        }
        Relationships: []
      }
      occupancy_rates: {
        Row: {
          created_at: string | null
          date: string
          id: string
          rate: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          rate: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          rate?: number
        }
        Relationships: []
      }
      optimized_prices: {
        Row: {
          calculated_price: number
          created_at: string | null
          date: string
          id: string
        }
        Insert: {
          calculated_price: number
          created_at?: string | null
          date: string
          id?: string
        }
        Update: {
          calculated_price?: number
          created_at?: string | null
          date?: string
          id?: string
        }
        Relationships: []
      }
      partner_adjustments: {
        Row: {
          adjustment_type: string
          adjustment_value: string | null
          associated_plan_filter: string | null
          created_at: string
          default_checked: boolean
          description: string
          id: string
          partner_id: string
          ui_control: string
        }
        Insert: {
          adjustment_type: string
          adjustment_value?: string | null
          associated_plan_filter?: string | null
          created_at?: string
          default_checked?: boolean
          description: string
          id?: string
          partner_id: string
          ui_control: string
        }
        Update: {
          adjustment_type?: string
          adjustment_value?: string | null
          associated_plan_filter?: string | null
          created_at?: string
          default_checked?: boolean
          description?: string
          id?: string
          partner_id?: string
          ui_control?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_adjustments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_plans: {
        Row: {
          created_at: string
          partner_id: string
          plan_id: string
        }
        Insert: {
          created_at?: string
          partner_id: string
          plan_id: string
        }
        Update: {
          created_at?: string
          partner_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_plans_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      plan_rules: {
        Row: {
          base_source: string
          created_at: string
          id: string
          plan_id: string
          steps: Json
        }
        Insert: {
          base_source: string
          created_at?: string
          id?: string
          plan_id: string
          steps?: Json
        }
        Update: {
          base_source?: string
          created_at?: string
          id?: string
          plan_id?: string
          steps?: Json
        }
        Relationships: [
          {
            foreignKeyName: "plan_rules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: true
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
