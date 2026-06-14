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
      appointments: {
        Row: {
          admin_notes: string | null
          appointment_number: string
          city_id: number | null
          confirmed_date: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          description: string | null
          id: string
          ip_address: string | null
          preferred_date: string
          status: string
          travel_cost: number | null
          updated_at: string
          wilaya_id: number | null
          window_count: number
        }
        Insert: {
          admin_notes?: string | null
          appointment_number: string
          city_id?: number | null
          confirmed_date?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          description?: string | null
          id?: string
          ip_address?: string | null
          preferred_date: string
          status?: string
          travel_cost?: number | null
          updated_at?: string
          wilaya_id?: number | null
          window_count?: number
        }
        Update: {
          admin_notes?: string | null
          appointment_number?: string
          city_id?: number | null
          confirmed_date?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          preferred_date?: string
          status?: string
          travel_cost?: number | null
          updated_at?: string
          wilaya_id?: number | null
          window_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointments_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_fr: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_fr: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_fr?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          id: number
          name_ar: string
          name_fr: string
          wilaya_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          name_ar: string
          name_fr: string
          wilaya_id: number
        }
        Update: {
          created_at?: string
          id?: number
          name_ar?: string
          name_fr?: string
          wilaya_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "cities_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          note: string | null
          old_status: string | null
          order_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
          order_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          admin_notes: string | null
          cancelled_reason: string | null
          city_id: number | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_type: string
          id: string
          ip_address: string | null
          notes: string | null
          order_number: string
          product_id: string | null
          product_snapshot: Json
          quantity: number
          status: string
          total_price: number
          unit_price: number
          updated_at: string
          wilaya_id: number | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          cancelled_reason?: string | null
          city_id?: number | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_type: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          order_number: string
          product_id?: string | null
          product_snapshot: Json
          quantity?: number
          status?: string
          total_price: number
          unit_price: number
          updated_at?: string
          wilaya_id?: number | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          cancelled_reason?: string | null
          city_id?: number | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_type?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          order_number?: string
          product_id?: string | null
          product_snapshot?: Json
          quantity?: number
          status?: string
          total_price?: number
          unit_price?: number
          updated_at?: string
          wilaya_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description_ar: string | null
          description_fr: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          meta_desc_ar: string | null
          meta_desc_fr: string | null
          meta_title_ar: string | null
          meta_title_fr: string | null
          name_ar: string
          name_fr: string
          price: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_fr?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          meta_desc_ar?: string | null
          meta_desc_fr?: string | null
          meta_title_ar?: string | null
          meta_title_fr?: string | null
          name_ar: string
          name_fr: string
          price?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_fr?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          meta_desc_ar?: string | null
          meta_desc_fr?: string | null
          meta_title_ar?: string | null
          meta_title_fr?: string | null
          name_ar?: string
          name_fr?: string
          price?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          group_name: string | null
          id: string
          key: string
          label: string | null
          type: string
          updated_at: string
          value: string | null
        }
        Insert: {
          group_name?: string | null
          id?: string
          key: string
          label?: string | null
          type?: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          group_name?: string | null
          id?: string
          key?: string
          label?: string | null
          type?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wilayas: {
        Row: {
          code: string
          created_at: string
          id: number
          name_ar: string
          name_fr: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
          name_ar: string
          name_fr: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
          name_ar?: string
          name_fr?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_appointment_number: { Args: never; Returns: string }
      next_order_number: { Args: never; Returns: string }
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
