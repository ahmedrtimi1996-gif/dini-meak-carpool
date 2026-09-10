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
      activity_logs: {
        Row: {
          created_at: string
          detail: Json
          id: string
          ip_address: string | null
          kind: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: Json
          id?: string
          ip_address?: string | null
          kind: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: Json
          id?: string
          ip_address?: string | null
          kind?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          commission: number
          created_at: string
          currency: string
          driver_id: string
          dropoff_note: string | null
          id: string
          is_waitlist: boolean
          message: string | null
          passenger_id: string
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pickup_note: string | null
          seats: number
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          trip_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          commission?: number
          created_at?: string
          currency?: string
          driver_id: string
          dropoff_note?: string | null
          id?: string
          is_waitlist?: boolean
          message?: string | null
          passenger_id: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_note?: string | null
          seats?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          trip_id: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          commission?: number
          created_at?: string
          currency?: string
          driver_id?: string
          dropoff_note?: string | null
          id?: string
          is_waitlist?: boolean
          message?: string | null
          passenger_id?: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_note?: string | null
          seats?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          trip_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          last_message_at: string
          passenger_id: string
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          last_message_at?: string
          passenger_id: string
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          last_message_at?: string
          passenger_id?: string
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_amount: number
          starts_at: string
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_amount?: number
          starts_at?: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_amount?: number
          starts_at?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      driver_documents: {
        Row: {
          created_at: string
          doc_type: string
          expires_on: string | null
          expiry_notified_at: string | null
          file_url: string
          id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          doc_type: string
          expires_on?: string | null
          expiry_notified_at?: string | null
          file_url: string
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          expires_on?: string | null
          expiry_notified_at?: string | null
          file_url?: string
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_drivers: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_routes: {
        Row: {
          created_at: string
          from_city: string
          id: string
          to_city: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_city: string
          id?: string
          to_city: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_city?: string
          id?: string
          to_city?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          booking_id: string | null
          commission: number
          created_at: string
          currency: string
          id: string
          issued_at: string
          number: string
          status: string
          tax_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          commission?: number
          created_at?: string
          currency?: string
          id?: string
          issued_at?: string
          number: string
          status?: string
          tax_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          commission?: number
          created_at?: string
          currency?: string
          id?: string
          issued_at?: string
          number?: string
          status?: string
          tax_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          booking_updates: boolean
          created_at: string
          email_enabled: boolean
          marketing_enabled: boolean
          message_alerts: boolean
          push_enabled: boolean
          sms_enabled: boolean
          trip_reminders: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_updates?: boolean
          created_at?: string
          email_enabled?: boolean
          marketing_enabled?: boolean
          message_alerts?: boolean
          push_enabled?: boolean
          sms_enabled?: boolean
          trip_reminders?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_updates?: boolean
          created_at?: string
          email_enabled?: boolean
          marketing_enabled?: boolean
          message_alerts?: boolean
          push_enabled?: boolean
          sms_enabled?: boolean
          trip_reminders?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          address: string | null
          avatar_url: string | null
          ban_reason: string | null
          bio: string | null
          birthday: string | null
          cancelled_trips: number
          city: string | null
          completed_trips: number
          cover_url: string | null
          created_at: string
          deleted_at: string | null
          driving_experience_years: number | null
          email_verified: boolean
          emergency_contact: string | null
          first_name: string | null
          gender: string | null
          id: string
          identity_verified: boolean
          insurance_verified: boolean
          is_featured: boolean
          languages: string[]
          last_name: string | null
          last_seen_at: string | null
          license_verified: boolean
          phone: string | null
          phone_verified: boolean
          preferred_locale: string
          rating: number
          reviews_count: number
          suspended_until: string | null
          suspension_reason: string | null
          updated_at: string
          vehicle_verified: boolean
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          address?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          bio?: string | null
          birthday?: string | null
          cancelled_trips?: number
          city?: string | null
          completed_trips?: number
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          driving_experience_years?: number | null
          email_verified?: boolean
          emergency_contact?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          identity_verified?: boolean
          insurance_verified?: boolean
          is_featured?: boolean
          languages?: string[]
          last_name?: string | null
          last_seen_at?: string | null
          license_verified?: boolean
          phone?: string | null
          phone_verified?: boolean
          preferred_locale?: string
          rating?: number
          reviews_count?: number
          suspended_until?: string | null
          suspension_reason?: string | null
          updated_at?: string
          vehicle_verified?: boolean
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          address?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          bio?: string | null
          birthday?: string | null
          cancelled_trips?: number
          city?: string | null
          completed_trips?: number
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          driving_experience_years?: number | null
          email_verified?: boolean
          emergency_contact?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          identity_verified?: boolean
          insurance_verified?: boolean
          is_featured?: boolean
          languages?: string[]
          last_name?: string | null
          last_seen_at?: string | null
          license_verified?: boolean
          phone?: string | null
          phone_verified?: boolean
          preferred_locale?: string
          rating?: number
          reviews_count?: number
          suspended_until?: string | null
          suspension_reason?: string | null
          updated_at?: string
          vehicle_verified?: boolean
        }
        Relationships: []
      }
      reports: {
        Row: {
          assigned_to: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolution_note: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_id: string
          booking_id: string
          cleanliness: number | null
          comment: string | null
          communication: number | null
          created_at: string
          driving: number | null
          friendliness: number | null
          id: string
          overall: number
          punctuality: number | null
          safety: number | null
          target_id: string
        }
        Insert: {
          author_id: string
          booking_id: string
          cleanliness?: number | null
          comment?: string | null
          communication?: number | null
          created_at?: string
          driving?: number | null
          friendliness?: number | null
          id?: string
          overall: number
          punctuality?: number | null
          safety?: number | null
          target_id: string
        }
        Update: {
          author_id?: string
          booking_id?: string
          cleanliness?: number | null
          comment?: string | null
          communication?: number | null
          created_at?: string
          driving?: number | null
          friendliness?: number | null
          id?: string
          overall?: number
          punctuality?: number | null
          safety?: number | null
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          depart_date: string | null
          filters: Json
          from_city: string | null
          id: string
          label: string | null
          notify: boolean
          seats: number | null
          to_city: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          depart_date?: string | null
          filters?: Json
          from_city?: string | null
          id?: string
          label?: string | null
          notify?: boolean
          seats?: number | null
          to_city?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          depart_date?: string | null
          filters?: Json
          from_city?: string | null
          id?: string
          label?: string | null
          notify?: boolean
          seats?: number | null
          to_city?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sos_alerts: {
        Row: {
          created_at: string
          handled_by: string | null
          id: string
          latitude: number | null
          longitude: number | null
          note: string | null
          resolved_at: string | null
          status: string
          trip_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          handled_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          note?: string | null
          resolved_at?: string | null
          status?: string
          trip_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          handled_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          note?: string | null
          resolved_at?: string | null
          status?: string
          trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_alerts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachment_url: string | null
          body: string
          created_at: string
          id: string
          is_internal: boolean
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachment_url?: string | null
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachment_url?: string | null
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          sender_id?: string
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
          assigned_to: string | null
          booking_id: string | null
          category: string
          created_at: string
          id: string
          last_reply_at: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          booking_id?: string | null
          category?: string
          created_at?: string
          id?: string
          last_reply_at?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          trip_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string | null
          category?: string
          created_at?: string
          id?: string
          last_reply_at?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          arrival_point: string | null
          arrive_time: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          depart_date: string
          depart_time: string
          description: string | null
          distance_km: number | null
          driver_id: string
          duration_minutes: number | null
          from_city: string
          id: string
          instant_booking: boolean
          is_featured: boolean
          is_hidden: boolean
          luggage: string
          meeting_point: string | null
          pets_allowed: boolean
          price: number
          seats_available: number
          seats_total: number
          smoking_allowed: boolean
          status: Database["public"]["Enums"]["trip_status"]
          stops: string[]
          to_city: string
          updated_at: string
          vehicle_id: string | null
          women_only: boolean
        }
        Insert: {
          arrival_point?: string | null
          arrive_time?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          depart_date: string
          depart_time: string
          description?: string | null
          distance_km?: number | null
          driver_id: string
          duration_minutes?: number | null
          from_city: string
          id?: string
          instant_booking?: boolean
          is_featured?: boolean
          is_hidden?: boolean
          luggage?: string
          meeting_point?: string | null
          pets_allowed?: boolean
          price: number
          seats_available: number
          seats_total: number
          smoking_allowed?: boolean
          status?: Database["public"]["Enums"]["trip_status"]
          stops?: string[]
          to_city: string
          updated_at?: string
          vehicle_id?: string | null
          women_only?: boolean
        }
        Update: {
          arrival_point?: string | null
          arrive_time?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          depart_date?: string
          depart_time?: string
          description?: string | null
          distance_km?: number | null
          driver_id?: string
          duration_minutes?: number | null
          from_city?: string
          id?: string
          instant_booking?: boolean
          is_featured?: boolean
          is_hidden?: boolean
          luggage?: string
          meeting_point?: string | null
          pets_allowed?: boolean
          price?: number
          seats_available?: number
          seats_total?: number
          smoking_allowed?: boolean
          status?: Database["public"]["Enums"]["trip_status"]
          stops?: string[]
          to_city?: string
          updated_at?: string
          vehicle_id?: string | null
          women_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
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
      vehicles: {
        Row: {
          air_conditioning: boolean
          brand: string
          color: string | null
          created_at: string
          fuel: string | null
          id: string
          insurance_valid_until: string | null
          is_default: boolean
          luggage: string
          model: string
          music: boolean
          owner_id: string
          pets_allowed: boolean
          photos: string[]
          plate: string | null
          seats: number
          smoking_allowed: boolean
          transmission: string | null
          updated_at: string
          usb_charger: boolean
          version: string | null
          wifi: boolean
          year: number | null
        }
        Insert: {
          air_conditioning?: boolean
          brand: string
          color?: string | null
          created_at?: string
          fuel?: string | null
          id?: string
          insurance_valid_until?: string | null
          is_default?: boolean
          luggage?: string
          model: string
          music?: boolean
          owner_id: string
          pets_allowed?: boolean
          photos?: string[]
          plate?: string | null
          seats?: number
          smoking_allowed?: boolean
          transmission?: string | null
          updated_at?: string
          usb_charger?: boolean
          version?: string | null
          wifi?: boolean
          year?: number | null
        }
        Update: {
          air_conditioning?: boolean
          brand?: string
          color?: string | null
          created_at?: string
          fuel?: string | null
          id?: string
          insurance_valid_until?: string | null
          is_default?: boolean
          luggage?: string
          model?: string
          music?: boolean
          owner_id?: string
          pets_allowed?: boolean
          photos?: string[]
          plate?: string | null
          seats?: number
          smoking_allowed?: boolean
          transmission?: string | null
          updated_at?: string
          usb_charger?: boolean
          version?: string | null
          wifi?: boolean
          year?: number | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          kind: string
          reference: string | null
          status: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          kind: string
          reference?: string | null
          status?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          kind?: string
          reference?: string | null
          status?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          is_locked: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_locked?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_locked?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_dashboard_stats: { Args: never; Returns: Json }
      create_booking: {
        Args: {
          _dropoff_note?: string
          _message?: string
          _pickup_note?: string
          _seats: number
          _trip_id: string
        }
        Returns: {
          commission: number
          created_at: string
          currency: string
          driver_id: string
          dropoff_note: string | null
          id: string
          is_waitlist: boolean
          message: string | null
          passenger_id: string
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pickup_note: string | null
          seats: number
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          trip_id: string
          unit_price: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      driver_publish_requirements: { Args: { _user_id: string }; Returns: Json }
      get_or_create_conversation: {
        Args: { _passenger_id?: string; _trip_id: string }
        Returns: {
          created_at: string
          driver_id: string
          id: string
          last_message_at: string
          passenger_id: string
          trip_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "conversations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      send_message: {
        Args: { _body: string; _conversation_id: string }
        Returns: {
          attachment_url: string | null
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      vehicle_verification_statuses: {
        Args: { _owner_id: string }
        Returns: Json
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "banned" | "deleted"
      app_role: "passenger" | "driver" | "admin" | "moderator" | "support"
      booking_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "cancelled_by_passenger"
        | "cancelled_by_driver"
        | "completed"
        | "expired"
      payment_status:
        | "unpaid"
        | "authorized"
        | "captured"
        | "refunded"
        | "partially_refunded"
        | "failed"
      report_status:
        | "open"
        | "investigating"
        | "resolved"
        | "rejected"
        | "archived"
      ticket_priority: "low" | "normal" | "high" | "urgent"
      ticket_status:
        | "open"
        | "pending"
        | "waiting_user"
        | "escalated"
        | "resolved"
        | "closed"
      trip_status:
        | "published"
        | "paused"
        | "cancelled"
        | "completed"
        | "archived"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_status: ["active", "suspended", "banned", "deleted"],
      app_role: ["passenger", "driver", "admin", "moderator", "support"],
      booking_status: [
        "pending",
        "accepted",
        "rejected",
        "cancelled_by_passenger",
        "cancelled_by_driver",
        "completed",
        "expired",
      ],
      payment_status: [
        "unpaid",
        "authorized",
        "captured",
        "refunded",
        "partially_refunded",
        "failed",
      ],
      report_status: [
        "open",
        "investigating",
        "resolved",
        "rejected",
        "archived",
      ],
      ticket_priority: ["low", "normal", "high", "urgent"],
      ticket_status: [
        "open",
        "pending",
        "waiting_user",
        "escalated",
        "resolved",
        "closed",
      ],
      trip_status: [
        "published",
        "paused",
        "cancelled",
        "completed",
        "archived",
      ],
    },
  },
} as const
