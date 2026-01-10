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
      admin_users: {
        Row: {
          assigned_district: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_district?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_district?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      agent_tasks: {
        Row: {
          agent_id: string
          created_at: string
          crop_id: string | null
          due_date: string
          farmer_id: string
          id: string
          notes: string | null
          priority: number | null
          task_status: Database["public"]["Enums"]["agent_task_status"]
          task_type: Database["public"]["Enums"]["agent_task_type"]
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          crop_id?: string | null
          due_date?: string
          farmer_id: string
          id?: string
          notes?: string | null
          priority?: number | null
          task_status?: Database["public"]["Enums"]["agent_task_status"]
          task_type?: Database["public"]["Enums"]["agent_task_type"]
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          crop_id?: string | null
          due_date?: string
          farmer_id?: string
          id?: string
          notes?: string | null
          priority?: number | null
          task_status?: Database["public"]["Enums"]["agent_task_status"]
          task_type?: Database["public"]["Enums"]["agent_task_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_voice_notes: {
        Row: {
          agent_id: string
          audio_path: string | null
          created_at: string
          crop_id: string | null
          farmer_id: string | null
          id: string
          language_code: string
          note_text: string | null
          task_id: string | null
        }
        Insert: {
          agent_id: string
          audio_path?: string | null
          created_at?: string
          crop_id?: string | null
          farmer_id?: string | null
          id?: string
          language_code?: string
          note_text?: string | null
          task_id?: string | null
        }
        Update: {
          agent_id?: string
          audio_path?: string | null
          created_at?: string
          crop_id?: string | null
          farmer_id?: string | null
          id?: string
          language_code?: string
          note_text?: string | null
          task_id?: string | null
        }
        Relationships: []
      }
      agri_advisories: {
        Row: {
          crop_name: string | null
          district: string | null
          fetched_at: string | null
          id: string
          published_date: string | null
          recommended_actions: string | null
          source_url: string | null
          state: string | null
          summary: string | null
          title: string
        }
        Insert: {
          crop_name?: string | null
          district?: string | null
          fetched_at?: string | null
          id?: string
          published_date?: string | null
          recommended_actions?: string | null
          source_url?: string | null
          state?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          crop_name?: string | null
          district?: string | null
          fetched_at?: string | null
          id?: string
          published_date?: string | null
          recommended_actions?: string | null
          source_url?: string | null
          state?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      ai_admin_logs: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          input_data: Json | null
          module_type: string
          output_text: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          input_data?: Json | null
          module_type: string
          output_text?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          input_data?: Json | null
          module_type?: string
          output_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_logs: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          input_context: Json | null
          log_type: string
          output_text: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          input_context?: Json | null
          log_type: string
          output_text?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          input_context?: Json | null
          log_type?: string
          output_text?: string | null
        }
        Relationships: []
      }
      ai_audio_cache: {
        Row: {
          cache_key: string
          created_at: string
          id: string
          language_code: string
          storage_path: string
          text_hash: string
          voice_id: string
          voice_role: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          id?: string
          language_code: string
          storage_path: string
          text_hash: string
          voice_id: string
          voice_role: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          id?: string
          language_code?: string
          storage_path?: string
          text_hash?: string
          voice_id?: string
          voice_role?: string
        }
        Relationships: []
      }
      ai_farmer_logs: {
        Row: {
          ai_response: string
          created_at: string
          farmer_context_summary: Json | null
          id: string
          model: string | null
          router_category: string
          used_web: boolean
          user_id: string
          user_message: string
          web_context_summary: Json | null
          web_query: string | null
        }
        Insert: {
          ai_response: string
          created_at?: string
          farmer_context_summary?: Json | null
          id?: string
          model?: string | null
          router_category: string
          used_web?: boolean
          user_id: string
          user_message: string
          web_context_summary?: Json | null
          web_query?: string | null
        }
        Update: {
          ai_response?: string
          created_at?: string
          farmer_context_summary?: Json | null
          id?: string
          model?: string | null
          router_category?: string
          used_web?: boolean
          user_id?: string
          user_message?: string
          web_context_summary?: Json | null
          web_query?: string | null
        }
        Relationships: []
      }
      ai_market_logs: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          input_data: Json | null
          module_type: string
          output_text: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          input_data?: Json | null
          module_type: string
          output_text?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          input_data?: Json | null
          module_type?: string
          output_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_market_logs_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_transport_logs: {
        Row: {
          created_at: string
          id: string
          input_data: Json | null
          log_type: string
          output_text: string | null
          transporter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_data?: Json | null
          log_type?: string
          output_text?: string | null
          transporter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_data?: Json | null
          log_type?: string
          output_text?: string | null
          transporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_transport_logs_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "transporters"
            referencedColumns: ["id"]
          },
        ]
      }
      buyers: {
        Row: {
          buyer_type: string | null
          company_name: string | null
          created_at: string
          district: string | null
          id: string
          name: string
          phone: string | null
          preferred_crops: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_type?: string | null
          company_name?: string | null
          created_at?: string
          district?: string | null
          id?: string
          name: string
          phone?: string | null
          preferred_crops?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_type?: string | null
          company_name?: string | null
          created_at?: string
          district?: string | null
          id?: string
          name?: string
          phone?: string | null
          preferred_crops?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crop_aliases: {
        Row: {
          alias: string
          canonical_name: string
          created_at: string | null
          id: string
          language_code: string | null
        }
        Insert: {
          alias: string
          canonical_name: string
          created_at?: string | null
          id?: string
          language_code?: string | null
        }
        Update: {
          alias?: string
          canonical_name?: string
          created_at?: string | null
          id?: string
          language_code?: string | null
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
      farmer_segments: {
        Row: {
          active_farmer_count: number | null
          crawl_frequency_hours: number | null
          crop_canonical: string
          district: string
          last_crawled_at: string | null
          segment_key: string
          state: string | null
          updated_at: string | null
        }
        Insert: {
          active_farmer_count?: number | null
          crawl_frequency_hours?: number | null
          crop_canonical: string
          district: string
          last_crawled_at?: string | null
          segment_key: string
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          active_farmer_count?: number | null
          crawl_frequency_hours?: number | null
          crop_canonical?: string
          district?: string
          last_crawled_at?: string | null
          segment_key?: string
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      karnataka_districts: {
        Row: {
          created_at: string | null
          district: string
          id: string
        }
        Insert: {
          created_at?: string | null
          district: string
          id?: string
        }
        Update: {
          created_at?: string | null
          district?: string
          id?: string
        }
        Relationships: []
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
      mandi_registry: {
        Row: {
          created_at: string
          district: string
          id: string
          mandi_name: string
          priority: number
          state: string
        }
        Insert: {
          created_at?: string
          district: string
          id?: string
          mandi_name: string
          priority?: number
          state?: string
        }
        Update: {
          created_at?: string
          district?: string
          id?: string
          mandi_name?: string
          priority?: number
          state?: string
        }
        Relationships: []
      }
      market_orders: {
        Row: {
          buyer_id: string
          created_at: string
          crop_id: string | null
          delivery_address: string | null
          delivery_date: string | null
          farmer_id: string
          id: string
          notes: string | null
          payment_status: string | null
          price_offered: number | null
          quantity: number
          quantity_unit: string | null
          status: string
          transporter_id: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          crop_id?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          farmer_id: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          price_offered?: number | null
          quantity: number
          quantity_unit?: string | null
          status?: string
          transporter_id?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          crop_id?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          farmer_id?: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          price_offered?: number | null
          quantity?: number
          quantity_unit?: string | null
          status?: string
          transporter_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_orders_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices: {
        Row: {
          created_at: string
          crop_name: string
          date: string
          district: string | null
          fetched_at: string | null
          id: string
          market_name: string
          max_price: number | null
          min_price: number | null
          modal_price: number
          source: string | null
          state: string | null
          trend_direction: Database["public"]["Enums"]["price_trend"] | null
          unit: string | null
        }
        Insert: {
          created_at?: string
          crop_name: string
          date?: string
          district?: string | null
          fetched_at?: string | null
          id?: string
          market_name: string
          max_price?: number | null
          min_price?: number | null
          modal_price: number
          source?: string | null
          state?: string | null
          trend_direction?: Database["public"]["Enums"]["price_trend"] | null
          unit?: string | null
        }
        Update: {
          created_at?: string
          crop_name?: string
          date?: string
          district?: string | null
          fetched_at?: string | null
          id?: string
          market_name?: string
          max_price?: number | null
          min_price?: number | null
          modal_price?: number
          source?: string | null
          state?: string | null
          trend_direction?: Database["public"]["Enums"]["price_trend"] | null
          unit?: string | null
        }
        Relationships: []
      }
      market_prices_agg: {
        Row: {
          confidence: string | null
          crop_name: string
          district: string
          fetched_at: string | null
          id: string
          modal_price: number | null
          sources_count: number | null
          sources_used: Json | null
          state: string | null
          unit: string | null
        }
        Insert: {
          confidence?: string | null
          crop_name: string
          district: string
          fetched_at?: string | null
          id?: string
          modal_price?: number | null
          sources_count?: number | null
          sources_used?: Json | null
          state?: string | null
          unit?: string | null
        }
        Update: {
          confidence?: string | null
          crop_name?: string
          district?: string
          fetched_at?: string | null
          id?: string
          modal_price?: number | null
          sources_count?: number | null
          sources_used?: Json | null
          state?: string | null
          unit?: string | null
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
      price_forecasts: {
        Row: {
          based_on_points: number | null
          confidence: string
          crop_name: string
          data_freshness_hours: number | null
          direction: string
          district: string
          generated_at: string
          id: string
          reason: string | null
          state: string
        }
        Insert: {
          based_on_points?: number | null
          confidence?: string
          crop_name: string
          data_freshness_hours?: number | null
          direction: string
          district: string
          generated_at?: string
          id?: string
          reason?: string | null
          state?: string
        }
        Update: {
          based_on_points?: number | null
          confidence?: string
          crop_name?: string
          data_freshness_hours?: number | null
          direction?: string
          district?: string
          generated_at?: string
          id?: string
          reason?: string | null
          state?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          district: string | null
          district_confidence: string | null
          district_source: string | null
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          pincode: string | null
          taluk: string | null
          total_land_area: number | null
          updated_at: string
          village: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          district_confidence?: string | null
          district_source?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          pincode?: string | null
          taluk?: string | null
          total_land_area?: number | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          district_confidence?: string | null
          district_source?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          pincode?: string | null
          taluk?: string | null
          total_land_area?: number | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      schemes_catalog: {
        Row: {
          apply_steps: string | null
          benefits: string | null
          deadline: string | null
          documents: string | null
          eligibility: string | null
          fetched_at: string | null
          id: string
          official_link: string | null
          scheme_name: string
          state: string | null
        }
        Insert: {
          apply_steps?: string | null
          benefits?: string | null
          deadline?: string | null
          documents?: string | null
          eligibility?: string | null
          fetched_at?: string | null
          id?: string
          official_link?: string | null
          scheme_name: string
          state?: string | null
        }
        Update: {
          apply_steps?: string | null
          benefits?: string | null
          deadline?: string | null
          documents?: string | null
          eligibility?: string | null
          fetched_at?: string | null
          id?: string
          official_link?: string | null
          scheme_name?: string
          state?: string | null
        }
        Relationships: []
      }
      transport_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          crop_id: string | null
          delivery_photo_url: string | null
          distance_km: number | null
          farmer_id: string
          id: string
          notes: string | null
          pickup_location: string
          pickup_photo_url: string | null
          pickup_village: string | null
          preferred_date: string | null
          preferred_time: string | null
          quantity: number
          quantity_unit: string | null
          status: Database["public"]["Enums"]["transport_status"]
          transporter_id: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          crop_id?: string | null
          delivery_photo_url?: string | null
          distance_km?: number | null
          farmer_id: string
          id?: string
          notes?: string | null
          pickup_location: string
          pickup_photo_url?: string | null
          pickup_village?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          quantity: number
          quantity_unit?: string | null
          status?: Database["public"]["Enums"]["transport_status"]
          transporter_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          crop_id?: string | null
          delivery_photo_url?: string | null
          distance_km?: number | null
          farmer_id?: string
          id?: string
          notes?: string | null
          pickup_location?: string
          pickup_photo_url?: string | null
          pickup_village?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          quantity?: number
          quantity_unit?: string | null
          status?: Database["public"]["Enums"]["transport_status"]
          transporter_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_requests_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      transporters: {
        Row: {
          created_at: string
          id: string
          name: string
          operating_district: string | null
          operating_village: string | null
          phone: string | null
          registration_number: string | null
          updated_at: string
          user_id: string
          vehicle_capacity: number | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          operating_district?: string | null
          operating_village?: string | null
          phone?: string | null
          registration_number?: string | null
          updated_at?: string
          user_id: string
          vehicle_capacity?: number | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          operating_district?: string | null
          operating_village?: string | null
          phone?: string | null
          registration_number?: string | null
          updated_at?: string
          user_id?: string
          vehicle_capacity?: number | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      trusted_sources: {
        Row: {
          active: boolean | null
          category: string
          crawl_frequency_hours: number | null
          created_at: string | null
          crop_canonical: string | null
          district: string | null
          id: string
          last_crawled_at: string | null
          name: string
          priority: number | null
          state: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          active?: boolean | null
          category: string
          crawl_frequency_hours?: number | null
          created_at?: string | null
          crop_canonical?: string | null
          district?: string | null
          id?: string
          last_crawled_at?: string | null
          name: string
          priority?: number | null
          state?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          active?: boolean | null
          category?: string
          crawl_frequency_hours?: number | null
          created_at?: string | null
          crop_canonical?: string | null
          district?: string | null
          id?: string
          last_crawled_at?: string | null
          name?: string
          priority?: number | null
          state?: string | null
          updated_at?: string | null
          url?: string
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
      vehicles: {
        Row: {
          capacity: number
          created_at: string
          id: string
          is_active: boolean
          number_plate: string
          transporter_id: string
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          number_plate: string
          transporter_id: string
          updated_at?: string
          vehicle_type?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          number_plate?: string
          transporter_id?: string
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "transporters"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_ops_logs: {
        Row: {
          cache_hit: boolean | null
          created_at: string
          error: string | null
          id: string
          language_code: string | null
          latency_ms: number | null
          op: string
          role: string | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean | null
          created_at?: string
          error?: string | null
          id?: string
          language_code?: string | null
          latency_ms?: number | null
          op: string
          role?: string | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean | null
          created_at?: string
          error?: string | null
          id?: string
          language_code?: string | null
          latency_ms?: number | null
          op?: string
          role?: string | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      weather_cache: {
        Row: {
          data: Json
          fetched_at: string
          location_key: string
        }
        Insert: {
          data: Json
          fetched_at?: string
          location_key: string
        }
        Update: {
          data?: Json
          fetched_at?: string
          location_key?: string
        }
        Relationships: []
      }
      web_cache: {
        Row: {
          cache_key: string
          crop_key: string | null
          data: Json
          fetched_at: string
          location_key: string
          topic: string
        }
        Insert: {
          cache_key: string
          crop_key?: string | null
          data: Json
          fetched_at?: string
          location_key: string
          topic: string
        }
        Update: {
          cache_key?: string
          crop_key?: string | null
          data?: Json
          fetched_at?: string
          location_key?: string
          topic?: string
        }
        Relationships: []
      }
      web_documents: {
        Row: {
          content_hash: string | null
          error: string | null
          extracted_json: Json | null
          extracted_text: string | null
          fetched_at: string | null
          id: string
          source_id: string | null
          status: string | null
          url: string
        }
        Insert: {
          content_hash?: string | null
          error?: string | null
          extracted_json?: Json | null
          extracted_text?: string | null
          fetched_at?: string | null
          id?: string
          source_id?: string | null
          status?: string | null
          url: string
        }
        Update: {
          content_hash?: string | null
          error?: string | null
          extracted_json?: Json | null
          extracted_text?: string | null
          fetched_at?: string | null
          id?: string
          source_id?: string | null
          status?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_documents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "trusted_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      web_fetch_logs: {
        Row: {
          cache_hit: boolean | null
          cache_key: string | null
          endpoint: string
          error: string | null
          fetched_at: string
          http_status: number | null
          id: string
          latency_ms: number | null
          query: string | null
          response_size: number | null
          segment_key: string | null
          source_id: string | null
          success: boolean
        }
        Insert: {
          cache_hit?: boolean | null
          cache_key?: string | null
          endpoint: string
          error?: string | null
          fetched_at?: string
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          query?: string | null
          response_size?: number | null
          segment_key?: string | null
          source_id?: string | null
          success?: boolean
        }
        Update: {
          cache_hit?: boolean | null
          cache_key?: string | null
          endpoint?: string
          error?: string | null
          fetched_at?: string
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          query?: string | null
          response_size?: number | null
          segment_key?: string | null
          source_id?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "web_fetch_logs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "trusted_sources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      farmer_update_order_status: {
        Args: { p_new_status: string; p_order_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      normalize_district: { Args: { input_text: string }; Returns: string }
    }
    Enums: {
      agent_task_status: "pending" | "in_progress" | "completed"
      agent_task_type:
        | "visit"
        | "verify_crop"
        | "harvest_check"
        | "transport_assist"
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
      agent_task_status: ["pending", "in_progress", "completed"],
      agent_task_type: [
        "visit",
        "verify_crop",
        "harvest_check",
        "transport_assist",
      ],
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
