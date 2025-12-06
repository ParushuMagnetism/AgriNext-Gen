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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_data: {
        Row: {
          agent_id: string
          created_at: string
          crop_health: string | null
          crop_type: string | null
          farm_location: string | null
          farmer_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          soil_moisture: string | null
          soil_ph: number | null
          soil_type: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          crop_health?: string | null
          crop_type?: string | null
          farm_location?: string | null
          farmer_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          soil_moisture?: string | null
          soil_ph?: number | null
          soil_type?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          crop_health?: string | null
          crop_type?: string | null
          farm_location?: string | null
          farmer_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          soil_moisture?: string | null
          soil_ph?: number | null
          soil_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crops: {
        Row: {
          created_at: string
          crop_name: string
          estimated_quantity: number | null
          farmer_id: string
          harvest_estimate: string | null
          id: string
          land_id: string | null
          quantity_unit: string | null
          sowing_date: string | null
          status: Database["public"]["Enums"]["crop_status"]
          updated_at: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          crop_name: string
          estimated_quantity?: number | null
          farmer_id: string
          harvest_estimate?: string | null
          id?: string
          land_id?: string | null
          quantity_unit?: string | null
          sowing_date?: string | null
          status?: Database["public"]["Enums"]["crop_status"]
          updated_at?: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          crop_name?: string
          estimated_quantity?: number | null
          farmer_id?: string
          harvest_estimate?: string | null
          id?: string
          land_id?: string | null
          quantity_unit?: string | null
          sowing_date?: string | null
          status?: Database["public"]["Enums"]["crop_status"]
          updated_at?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crops_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "farmlands"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_pickups: {
        Row: {
          created_at: string
          farmer_id: string
          id: string
          listing_id: string | null
          logistics_id: string
          notes: string | null
          pickup_location: string
          quantity: number | null
          route_id: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          farmer_id: string
          id?: string
          listing_id?: string | null
          logistics_id: string
          notes?: string | null
          pickup_location: string
          quantity?: number | null
          route_id?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          farmer_id?: string
          id?: string
          listing_id?: string | null
          logistics_id?: string
          notes?: string | null
          pickup_location?: string
          quantity?: number | null
          route_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_pickups_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_pickups_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "logistics_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      farmlands: {
        Row: {
          area: number
          area_unit: string
          created_at: string
          district: string | null
          farmer_id: string
          id: string
          location_lat: number | null
          location_long: number | null
          name: string
          soil_type: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          area?: number
          area_unit?: string
          created_at?: string
          district?: string | null
          farmer_id: string
          id?: string
          location_lat?: number | null
          location_long?: number | null
          name: string
          soil_type?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          area?: number
          area_unit?: string
          created_at?: string
          district?: string | null
          farmer_id?: string
          id?: string
          location_lat?: number | null
          location_long?: number | null
          name?: string
          soil_type?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          location: string | null
          price: number
          quantity: number
          seller_id: string
          title: string
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          price: number
          quantity: number
          seller_id: string
          title: string
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          price?: number
          quantity?: number
          seller_id?: string
          title?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      logistics_routes: {
        Row: {
          created_at: string
          distance_km: number | null
          end_location: string
          estimated_time_mins: number | null
          id: string
          logistics_id: string
          name: string
          start_location: string
          status: string
          updated_at: string
          waypoints: Json | null
        }
        Insert: {
          created_at?: string
          distance_km?: number | null
          end_location: string
          estimated_time_mins?: number | null
          id?: string
          logistics_id: string
          name: string
          start_location: string
          status?: string
          updated_at?: string
          waypoints?: Json | null
        }
        Update: {
          created_at?: string
          distance_km?: number | null
          end_location?: string
          estimated_time_mins?: number | null
          id?: string
          logistics_id?: string
          name?: string
          start_location?: string
          status?: string
          updated_at?: string
          waypoints?: Json | null
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          created_at: string
          crop_name: string
          date: string
          id: string
          market_name: string
          max_price: number | null
          min_price: number | null
          modal_price: number
          trend_direction: Database["public"]["Enums"]["price_trend"] | null
        }
        Insert: {
          created_at?: string
          crop_name: string
          date?: string
          id?: string
          market_name: string
          max_price?: number | null
          min_price?: number | null
          modal_price: number
          trend_direction?: Database["public"]["Enums"]["price_trend"] | null
        }
        Update: {
          created_at?: string
          crop_name?: string
          date?: string
          id?: string
          market_name?: string
          max_price?: number | null
          min_price?: number | null
          modal_price?: number
          trend_direction?: Database["public"]["Enums"]["price_trend"] | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          district: string | null
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          total_land_area: number | null
          updated_at: string
          village: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          total_land_area?: number | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          total_land_area?: number | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      transport_requests: {
        Row: {
          created_at: string
          crop_id: string | null
          farmer_id: string
          id: string
          notes: string | null
          pickup_location: string
          pickup_village: string | null
          preferred_date: string | null
          preferred_time: string | null
          quantity: number
          quantity_unit: string | null
          status: Database["public"]["Enums"]["transport_status"]
          transporter_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop_id?: string | null
          farmer_id: string
          id?: string
          notes?: string | null
          pickup_location: string
          pickup_village?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          quantity: number
          quantity_unit?: string | null
          status?: Database["public"]["Enums"]["transport_status"]
          transporter_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop_id?: string | null
          farmer_id?: string
          id?: string
          notes?: string | null
          pickup_location?: string
          pickup_village?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          quantity?: number
          quantity_unit?: string | null
          status?: Database["public"]["Enums"]["transport_status"]
          transporter_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_requests_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "farmer" | "buyer" | "agent" | "logistics" | "admin"
      crop_status: "growing" | "one_week" | "ready" | "harvested"
      price_trend: "up" | "down" | "flat"
      transport_status:
        | "requested"
        | "assigned"
        | "en_route"
        | "picked_up"
        | "delivered"
        | "cancelled"
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
      app_role: ["farmer", "buyer", "agent", "logistics", "admin"],
      crop_status: ["growing", "one_week", "ready", "harvested"],
      price_trend: ["up", "down", "flat"],
      transport_status: [
        "requested",
        "assigned",
        "en_route",
        "picked_up",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
