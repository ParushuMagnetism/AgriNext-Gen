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
      admin_scopes: {
        Row: {
          active: boolean | null
          admin_user_id: string
          created_at: string | null
          demo_tag: string | null
          id: string
          scope_level: string
          scope_value: string
        }
        Insert: {
          active?: boolean | null
          admin_user_id: string
          created_at?: string | null
          demo_tag?: string | null
          id?: string
          scope_level: string
          scope_value: string
        }
        Update: {
          active?: boolean | null
          admin_user_id?: string
          created_at?: string | null
          demo_tag?: string | null
          id?: string
          scope_level?: string
          scope_value?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          assigned_district: string | null
          created_at: string
          demo_tag: string | null
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
          demo_tag?: string | null
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
          demo_tag?: string | null
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
      agent_activity_logs: {
        Row: {
          action_type: string
          actor_id: string
          actor_role: string
          created_at: string
          details: Json | null
          farmer_id: string | null
          id: string
        }
        Insert: {
          action_type: string
          actor_id: string
          actor_role?: string
          created_at?: string
          details?: Json | null
          farmer_id?: string | null
          id?: string
        }
        Update: {
          action_type?: string
          actor_id?: string
          actor_role?: string
          created_at?: string
          details?: Json | null
          farmer_id?: string | null
          id?: string
        }
        Relationships: []
      }
      agent_data: {
        Row: {
          agent_id: string
          created_at: string
          crop_health: string | null
          crop_type: string | null
          demo_tag: string | null
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
          demo_tag?: string | null
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
          demo_tag?: string | null
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
      agent_farmer_assignments: {
        Row: {
          active: boolean | null
          agent_id: string
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          demo_tag: string | null
          farmer_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          agent_id: string
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          demo_tag?: string | null
          farmer_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          agent_id?: string
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          demo_tag?: string | null
          farmer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_tasks: {
        Row: {
          agent_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          created_by_role: string | null
          crop_id: string | null
          demo_tag: string | null
          due_date: string
          farmer_id: string
          id: string
          notes: string | null
          payload: Json | null
          priority: number | null
          task_status: Database["public"]["Enums"]["agent_task_status"]
          task_type: Database["public"]["Enums"]["agent_task_type"]
          updated_at: string
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_role?: string | null
          crop_id?: string | null
          demo_tag?: string | null
          due_date?: string
          farmer_id: string
          id?: string
          notes?: string | null
          payload?: Json | null
          priority?: number | null
          task_status?: Database["public"]["Enums"]["agent_task_status"]
          task_type?: Database["public"]["Enums"]["agent_task_type"]
          updated_at?: string
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_role?: string | null
          crop_id?: string | null
          demo_tag?: string | null
          due_date?: string
          farmer_id?: string
          id?: string
          notes?: string | null
          payload?: Json | null
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
      agent_visits: {
        Row: {
          agent_id: string
          check_in_at: string
          check_out_at: string | null
          created_at: string | null
          demo_tag: string | null
          farmer_id: string
          id: string
          notes: string | null
          task_id: string | null
        }
        Insert: {
          agent_id: string
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string | null
          demo_tag?: string | null
          farmer_id: string
          id?: string
          notes?: string | null
          task_id?: string | null
        }
        Update: {
          agent_id?: string
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string | null
          demo_tag?: string | null
          farmer_id?: string
          id?: string
          notes?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_visits_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
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
          demo_tag: string | null
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
          demo_tag?: string | null
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
          demo_tag?: string | null
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
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      crop_activity_logs: {
        Row: {
          activity_at: string | null
          activity_type: string
          consent_at: string | null
          consent_captured: boolean | null
          consent_note: string | null
          created_at: string | null
          created_by: string
          creator_role: string
          crop_id: string
          id: string
          media_id: string | null
          meta: Json | null
          notes: string | null
          owner_farmer_id: string
          severity: string | null
        }
        Insert: {
          activity_at?: string | null
          activity_type: string
          consent_at?: string | null
          consent_captured?: boolean | null
          consent_note?: string | null
          created_at?: string | null
          created_by: string
          creator_role?: string
          crop_id: string
          id?: string
          media_id?: string | null
          meta?: Json | null
          notes?: string | null
          owner_farmer_id: string
          severity?: string | null
        }
        Update: {
          activity_at?: string | null
          activity_type?: string
          consent_at?: string | null
          consent_captured?: boolean | null
          consent_note?: string | null
          created_at?: string | null
          created_by?: string
          creator_role?: string
          crop_id?: string
          id?: string
          media_id?: string | null
          meta?: Json | null
          notes?: string | null
          owner_farmer_id?: string
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_activity_logs_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_activity_logs_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "crop_media"
            referencedColumns: ["id"]
          },
        ]
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
      crop_calendar: {
        Row: {
          crop_name: string
          fetched_at: string | null
          id: string
          irrigation_notes: string | null
          nutrient_notes: string | null
          pest_watchouts: string | null
          season: string | null
          source_url: string | null
          sowing_window: string | null
          state: string | null
        }
        Insert: {
          crop_name: string
          fetched_at?: string | null
          id?: string
          irrigation_notes?: string | null
          nutrient_notes?: string | null
          pest_watchouts?: string | null
          season?: string | null
          source_url?: string | null
          sowing_window?: string | null
          state?: string | null
        }
        Update: {
          crop_name?: string
          fetched_at?: string | null
          id?: string
          irrigation_notes?: string | null
          nutrient_notes?: string | null
          pest_watchouts?: string | null
          season?: string | null
          source_url?: string | null
          sowing_window?: string | null
          state?: string | null
        }
        Relationships: []
      }
      crop_media: {
        Row: {
          caption: string | null
          captured_at: string | null
          created_at: string | null
          crop_id: string
          file_path: string
          geo_verified: boolean
          id: string
          latitude: number | null
          longitude: number | null
          mime_type: string
          owner_farmer_id: string
          tags: string[] | null
          uploaded_by: string
          uploader_role: string
        }
        Insert: {
          caption?: string | null
          captured_at?: string | null
          created_at?: string | null
          crop_id: string
          file_path: string
          geo_verified?: boolean
          id?: string
          latitude?: number | null
          longitude?: number | null
          mime_type: string
          owner_farmer_id: string
          tags?: string[] | null
          uploaded_by: string
          uploader_role?: string
        }
        Update: {
          caption?: string | null
          captured_at?: string | null
          created_at?: string | null
          crop_id?: string
          file_path?: string
          geo_verified?: boolean
          id?: string
          latitude?: number | null
          longitude?: number | null
          mime_type?: string
          owner_farmer_id?: string
          tags?: string[] | null
          uploaded_by?: string
          uploader_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_media_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          created_at: string
          crop_name: string
          demo_tag: string | null
          estimated_quantity: number | null
          farmer_id: string
          growth_stage: string | null
          harvest_estimate: string | null
          health_status: string | null
          id: string
          land_id: string | null
          last_observed_issue_at: string | null
          last_photo_at: string | null
          quantity_unit: string | null
          sowing_date: string | null
          status: Database["public"]["Enums"]["crop_status"]
          updated_at: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          crop_name: string
          demo_tag?: string | null
          estimated_quantity?: number | null
          farmer_id: string
          growth_stage?: string | null
          harvest_estimate?: string | null
          health_status?: string | null
          id?: string
          land_id?: string | null
          last_observed_issue_at?: string | null
          last_photo_at?: string | null
          quantity_unit?: string | null
          sowing_date?: string | null
          status?: Database["public"]["Enums"]["crop_status"]
          updated_at?: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          crop_name?: string
          demo_tag?: string | null
          estimated_quantity?: number | null
          farmer_id?: string
          growth_stage?: string | null
          harvest_estimate?: string | null
          health_status?: string | null
          id?: string
          land_id?: string | null
          last_observed_issue_at?: string | null
          last_photo_at?: string | null
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
      district_neighbors: {
        Row: {
          created_at: string | null
          district: string
          id: string
          neighbor_district: string
        }
        Insert: {
          created_at?: string | null
          district: string
          id?: string
          neighbor_district: string
        }
        Update: {
          created_at?: string | null
          district?: string
          id?: string
          neighbor_district?: string
        }
        Relationships: []
      }
      escalations: {
        Row: {
          assigned_admin_id: string | null
          category: string
          created_at: string
          created_by_agent_id: string
          demo_tag: string | null
          farmer_id: string
          id: string
          notes: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_admin_id?: string | null
          category: string
          created_at?: string
          created_by_agent_id: string
          demo_tag?: string | null
          farmer_id: string
          id?: string
          notes?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_admin_id?: string | null
          category?: string
          created_at?: string
          created_by_agent_id?: string
          demo_tag?: string | null
          farmer_id?: string
          id?: string
          notes?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
          demo_tag: string | null
          district: string | null
          farmer_id: string
          geo_verified: boolean
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
          demo_tag?: string | null
          district?: string | null
          farmer_id: string
          geo_verified?: boolean
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
          demo_tag?: string | null
          district?: string | null
          farmer_id?: string
          geo_verified?: boolean
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
      input_prices: {
        Row: {
          brand: string | null
          district: string | null
          fetched_at: string | null
          id: string
          item_name: string
          item_type: string | null
          price_max: number | null
          price_min: number | null
          source_url: string | null
          state: string | null
          unit: string | null
        }
        Insert: {
          brand?: string | null
          district?: string | null
          fetched_at?: string | null
          id?: string
          item_name: string
          item_type?: string | null
          price_max?: number | null
          price_min?: number | null
          source_url?: string | null
          state?: string | null
          unit?: string | null
        }
        Update: {
          brand?: string | null
          district?: string | null
          fetched_at?: string | null
          id?: string
          item_name?: string
          item_type?: string | null
          price_max?: number | null
          price_min?: number | null
          source_url?: string | null
          state?: string | null
          unit?: string | null
        }
        Relationships: []
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
          crop_id: string | null
          description: string | null
          id: string
          image_url: string | null
          inputs_summary: string | null
          is_active: boolean
          location: string | null
          price: number
          quantity: number
          seller_id: string
          test_report_urls: Json
          title: string
          trace_code: string | null
          trace_settings: Json
          trace_status: string
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          crop_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          inputs_summary?: string | null
          is_active?: boolean
          location?: string | null
          price: number
          quantity: number
          seller_id: string
          test_report_urls?: Json
          title: string
          trace_code?: string | null
          trace_settings?: Json
          trace_status?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          crop_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          inputs_summary?: string | null
          is_active?: boolean
          location?: string | null
          price?: number
          quantity?: number
          seller_id?: string
          test_report_urls?: Json
          title?: string
          trace_code?: string | null
          trace_settings?: Json
          trace_status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
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
          demo_tag: string | null
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
          demo_tag?: string | null
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
          demo_tag?: string | null
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
          demo_tag: string | null
          district: string | null
          fetched_at: string | null
          id: string
          market_name: string
          max_price: number | null
          min_price: number | null
          modal_price: number
          source: string | null
          source_url: string | null
          state: string | null
          trend_direction: Database["public"]["Enums"]["price_trend"] | null
          unit: string | null
        }
        Insert: {
          created_at?: string
          crop_name: string
          date?: string
          demo_tag?: string | null
          district?: string | null
          fetched_at?: string | null
          id?: string
          market_name: string
          max_price?: number | null
          min_price?: number | null
          modal_price: number
          source?: string | null
          source_url?: string | null
          state?: string | null
          trend_direction?: Database["public"]["Enums"]["price_trend"] | null
          unit?: string | null
        }
        Update: {
          created_at?: string
          crop_name?: string
          date?: string
          demo_tag?: string | null
          district?: string | null
          fetched_at?: string | null
          id?: string
          market_name?: string
          max_price?: number | null
          min_price?: number | null
          modal_price?: number
          source?: string | null
          source_url?: string | null
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
          demo_tag: string | null
          district: string
          fetched_at: string | null
          freshness_minutes: number | null
          id: string
          max_price: number | null
          min_price: number | null
          modal_price: number | null
          sources_count: number | null
          sources_used: Json | null
          state: string | null
          unit: string | null
        }
        Insert: {
          confidence?: string | null
          crop_name: string
          demo_tag?: string | null
          district: string
          fetched_at?: string | null
          freshness_minutes?: number | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          modal_price?: number | null
          sources_count?: number | null
          sources_used?: Json | null
          state?: string | null
          unit?: string | null
        }
        Update: {
          confidence?: string | null
          crop_name?: string
          demo_tag?: string | null
          district?: string
          fetched_at?: string | null
          freshness_minutes?: number | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          modal_price?: number | null
          sources_count?: number | null
          sources_used?: Json | null
          state?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      market_prices_raw: {
        Row: {
          content_hash: string | null
          crop_canonical: string | null
          crop_name: string
          district: string | null
          error: string | null
          fetched_at: string | null
          id: string
          mandi_name: string | null
          max_price: number | null
          min_price: number | null
          modal_price: number | null
          raw_json: Json | null
          reliability_score: number | null
          source_name: string | null
          source_url: string | null
          state: string | null
          status: string | null
          unit: string | null
        }
        Insert: {
          content_hash?: string | null
          crop_canonical?: string | null
          crop_name: string
          district?: string | null
          error?: string | null
          fetched_at?: string | null
          id?: string
          mandi_name?: string | null
          max_price?: number | null
          min_price?: number | null
          modal_price?: number | null
          raw_json?: Json | null
          reliability_score?: number | null
          source_name?: string | null
          source_url?: string | null
          state?: string | null
          status?: string | null
          unit?: string | null
        }
        Update: {
          content_hash?: string | null
          crop_canonical?: string | null
          crop_name?: string
          district?: string | null
          error?: string | null
          fetched_at?: string | null
          id?: string
          mandi_name?: string | null
          max_price?: number | null
          min_price?: number | null
          modal_price?: number | null
          raw_json?: Json | null
          reliability_score?: number | null
          source_name?: string | null
          source_url?: string | null
          state?: string | null
          status?: string | null
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
          demo_tag: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          demo_tag?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          demo_tag?: string | null
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
          demo_tag: string | null
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
          demo_tag?: string | null
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
          demo_tag?: string | null
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
          demo_tag: string | null
          district: string | null
          district_confidence: string | null
          district_source: string | null
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          pincode: string | null
          preferred_language: string | null
          taluk: string | null
          total_land_area: number | null
          updated_at: string
          village: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          demo_tag?: string | null
          district?: string | null
          district_confidence?: string | null
          district_source?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          pincode?: string | null
          preferred_language?: string | null
          taluk?: string | null
          total_land_area?: number | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          demo_tag?: string | null
          district?: string | null
          district_confidence?: string | null
          district_source?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          pincode?: string | null
          preferred_language?: string | null
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
      soil_test_reports: {
        Row: {
          consent_at: string | null
          consent_captured: boolean | null
          consent_note: string | null
          created_at: string
          ec: number | null
          extracted_data: Json | null
          farmer_id: string
          farmland_id: string
          id: string
          lab_name: string | null
          nitrogen: number | null
          notes: string | null
          organic_carbon: number | null
          ph: number | null
          phosphorus: number | null
          potassium: number | null
          report_date: string
          report_file_path: string
          report_file_type: string
          report_mime_type: string | null
          source_role: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          consent_at?: string | null
          consent_captured?: boolean | null
          consent_note?: string | null
          created_at?: string
          ec?: number | null
          extracted_data?: Json | null
          farmer_id: string
          farmland_id: string
          id?: string
          lab_name?: string | null
          nitrogen?: number | null
          notes?: string | null
          organic_carbon?: number | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          report_date: string
          report_file_path: string
          report_file_type: string
          report_mime_type?: string | null
          source_role?: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          consent_at?: string | null
          consent_captured?: boolean | null
          consent_note?: string | null
          created_at?: string
          ec?: number | null
          extracted_data?: Json | null
          farmer_id?: string
          farmland_id?: string
          id?: string
          lab_name?: string | null
          nitrogen?: number | null
          notes?: string | null
          organic_carbon?: number | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          report_date?: string
          report_file_path?: string
          report_file_type?: string
          report_mime_type?: string | null
          source_role?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "soil_test_reports_farmland_id_fkey"
            columns: ["farmland_id"]
            isOneToOne: false
            referencedRelation: "farmlands"
            referencedColumns: ["id"]
          },
        ]
      }
      trace_attachments: {
        Row: {
          captured_at: string | null
          created_at: string | null
          file_type: string
          file_url: string
          id: string
          notes: string | null
          owner_id: string
          owner_type: string
          tag: string
          uploaded_by: string
          visibility: string
        }
        Insert: {
          captured_at?: string | null
          created_at?: string | null
          file_type: string
          file_url: string
          id?: string
          notes?: string | null
          owner_id: string
          owner_type: string
          tag: string
          uploaded_by: string
          visibility?: string
        }
        Update: {
          captured_at?: string | null
          created_at?: string | null
          file_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          owner_id?: string
          owner_type?: string
          tag?: string
          uploaded_by?: string
          visibility?: string
        }
        Relationships: []
      }
      transport_issues: {
        Row: {
          created_at: string
          demo_tag: string | null
          description: string
          evidence_notes: string | null
          farmer_id: string
          id: string
          issue_code: string
          reported_by_id: string
          reported_by_role: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          transport_request_id: string | null
          transporter_id: string
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          demo_tag?: string | null
          description: string
          evidence_notes?: string | null
          farmer_id: string
          id?: string
          issue_code: string
          reported_by_id: string
          reported_by_role: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          transport_request_id?: string | null
          transporter_id: string
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          demo_tag?: string | null
          description?: string
          evidence_notes?: string | null
          farmer_id?: string
          id?: string
          issue_code?: string
          reported_by_id?: string
          reported_by_role?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          transport_request_id?: string | null
          transporter_id?: string
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_issues_transport_request_id_fkey"
            columns: ["transport_request_id"]
            isOneToOne: false
            referencedRelation: "transport_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_issues_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_requests: {
        Row: {
          assigned_at: string | null
          assigned_trip_id: string | null
          cancellation_reason: string | null
          completed_at: string | null
          created_at: string
          crop_id: string | null
          delivery_photo_url: string | null
          demo_tag: string | null
          distance_km: number | null
          drop_location: string | null
          fare_estimate: number | null
          farmer_id: string
          id: string
          notes: string | null
          pickup_location: string
          pickup_photo_url: string | null
          pickup_village: string | null
          pickup_window_end: string | null
          pickup_window_start: string | null
          preferred_date: string | null
          preferred_time: string | null
          quantity: number
          quantity_unit: string | null
          status: Database["public"]["Enums"]["transport_status"]
          status_updated_at: string | null
          transporter_id: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_trip_id?: string | null
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string
          crop_id?: string | null
          delivery_photo_url?: string | null
          demo_tag?: string | null
          distance_km?: number | null
          drop_location?: string | null
          fare_estimate?: number | null
          farmer_id: string
          id?: string
          notes?: string | null
          pickup_location: string
          pickup_photo_url?: string | null
          pickup_village?: string | null
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          quantity: number
          quantity_unit?: string | null
          status?: Database["public"]["Enums"]["transport_status"]
          status_updated_at?: string | null
          transporter_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_trip_id?: string | null
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string
          crop_id?: string | null
          delivery_photo_url?: string | null
          demo_tag?: string | null
          distance_km?: number | null
          drop_location?: string | null
          fare_estimate?: number | null
          farmer_id?: string
          id?: string
          notes?: string | null
          pickup_location?: string
          pickup_photo_url?: string | null
          pickup_village?: string | null
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          quantity?: number
          quantity_unit?: string | null
          status?: Database["public"]["Enums"]["transport_status"]
          status_updated_at?: string | null
          transporter_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_requests_assigned_trip_id_fkey"
            columns: ["assigned_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
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
      transport_status_events: {
        Row: {
          actor_id: string
          actor_role: string
          created_at: string | null
          demo_tag: string | null
          id: string
          new_status: string
          note: string | null
          old_status: string | null
          transport_request_id: string
          trip_id: string | null
        }
        Insert: {
          actor_id: string
          actor_role: string
          created_at?: string | null
          demo_tag?: string | null
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
          transport_request_id: string
          trip_id?: string | null
        }
        Update: {
          actor_id?: string
          actor_role?: string
          created_at?: string | null
          demo_tag?: string | null
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
          transport_request_id?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_status_events_transport_request_id_fkey"
            columns: ["transport_request_id"]
            isOneToOne: false
            referencedRelation: "transport_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_status_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      transporters: {
        Row: {
          created_at: string
          demo_tag: string | null
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
          demo_tag?: string | null
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
          demo_tag?: string | null
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
      trips: {
        Row: {
          actual_weight_kg: number | null
          arrived_at: string | null
          assigned_at: string | null
          cancelled_at: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_otp_required: boolean | null
          delivery_otp_verified: boolean | null
          delivery_proofs: Json | null
          demo_tag: string | null
          en_route_at: string | null
          id: string
          in_transit_at: string | null
          issue_code: string | null
          issue_notes: string | null
          picked_up_at: string | null
          pickup_otp_required: boolean | null
          pickup_otp_verified: boolean | null
          pickup_proofs: Json | null
          status: string
          transport_request_id: string
          transporter_id: string
          updated_at: string | null
        }
        Insert: {
          actual_weight_kg?: number | null
          arrived_at?: string | null
          assigned_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_otp_required?: boolean | null
          delivery_otp_verified?: boolean | null
          delivery_proofs?: Json | null
          demo_tag?: string | null
          en_route_at?: string | null
          id?: string
          in_transit_at?: string | null
          issue_code?: string | null
          issue_notes?: string | null
          picked_up_at?: string | null
          pickup_otp_required?: boolean | null
          pickup_otp_verified?: boolean | null
          pickup_proofs?: Json | null
          status?: string
          transport_request_id: string
          transporter_id: string
          updated_at?: string | null
        }
        Update: {
          actual_weight_kg?: number | null
          arrived_at?: string | null
          assigned_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_otp_required?: boolean | null
          delivery_otp_verified?: boolean | null
          delivery_proofs?: Json | null
          demo_tag?: string | null
          en_route_at?: string | null
          id?: string
          in_transit_at?: string | null
          issue_code?: string | null
          issue_notes?: string | null
          picked_up_at?: string | null
          pickup_otp_required?: boolean | null
          pickup_otp_verified?: boolean | null
          pickup_proofs?: Json | null
          status?: string
          transport_request_id?: string
          transporter_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_transport_request_id_fkey"
            columns: ["transport_request_id"]
            isOneToOne: true
            referencedRelation: "transport_requests"
            referencedColumns: ["id"]
          },
        ]
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
          demo_tag: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          demo_tag?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          demo_tag?: string | null
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
          demo_tag: string | null
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
          demo_tag?: string | null
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
          demo_tag?: string | null
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
          function_name: string | null
          http_status: number | null
          id: string
          latency_ms: number | null
          query: string | null
          request_json: Json | null
          response_meta: Json | null
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
          function_name?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          query?: string | null
          request_json?: Json | null
          response_meta?: Json | null
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
          function_name?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          query?: string | null
          request_json?: Json | null
          response_meta?: Json | null
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
      farmland_soil_latest: {
        Row: {
          created_at: string | null
          ec: number | null
          farmland_id: string | null
          last_test_date: string | null
          latest_report_id: string | null
          nitrogen: number | null
          organic_carbon: number | null
          ph: number | null
          phosphorus: number | null
          potassium: number | null
        }
        Relationships: [
          {
            foreignKeyName: "soil_test_reports_farmland_id_fkey"
            columns: ["farmland_id"]
            isOneToOne: false
            referencedRelation: "farmlands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_scope_match: {
        Args: {
          row_district: string
          row_state: string
          row_taluk: string
          row_village: string
          user_uuid: string
        }
        Returns: boolean
      }
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
      is_agent_assigned_to_farmer: {
        Args: { agent_uuid: string; farmer_uuid: string }
        Returns: boolean
      }
      normalize_crop_name: { Args: { input_name: string }; Returns: string }
      normalize_district: { Args: { input_text: string }; Returns: string }
    }
    Enums: {
      agent_task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "approved"
        | "rejected"
      agent_task_type:
        | "visit"
        | "verify_crop"
        | "harvest_check"
        | "transport_assist"
        | "onboard_farmer"
        | "update_profile"
        | "soil_report_upload"
        | "field_visit"
        | "farmer_request"
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
      agent_task_status: [
        "pending",
        "in_progress",
        "completed",
        "approved",
        "rejected",
      ],
      agent_task_type: [
        "visit",
        "verify_crop",
        "harvest_check",
        "transport_assist",
        "onboard_farmer",
        "update_profile",
        "soil_report_upload",
        "field_visit",
        "farmer_request",
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
