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
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          last_message_at?: string
          passenger_id: string
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          last_message_at?: string
          passenger_id?: string
          trip_id?: string | null
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
          address: string | null
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          cancelled_trips: number
          city: string | null
          completed_trips: number
          cover_url: string | null
          created_at: string
          driving_experience_years: number | null
          email_verified: boolean
          emergency_contact: string | null
          first_name: string | null
          gender: string | null
          id: string
          identity_verified: boolean
          languages: string[]
          last_name: string | null
          license_verified: boolean
          phone: string | null
          phone_verified: boolean
          preferred_locale: string
          rating: number
          reviews_count: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          cancelled_trips?: number
          city?: string | null
          completed_trips?: number
          cover_url?: string | null
          created_at?: string
          driving_experience_years?: number | null
          email_verified?: boolean
          emergency_contact?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          identity_verified?: boolean
          languages?: string[]
          last_name?: string | null
          license_verified?: boolean
          phone?: string | null
          phone_verified?: boolean
          preferred_locale?: string
          rating?: number
          reviews_count?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          cancelled_trips?: number
          city?: string | null
          completed_trips?: number
          cover_url?: string | null
          created_at?: string
          driving_experience_years?: number | null
          email_verified?: boolean
          emergency_contact?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          identity_verified?: boolean
          languages?: string[]
          last_name?: string | null
          license_verified?: boolean
          phone?: string | null
          phone_verified?: boolean
          preferred_locale?: string
          rating?: number
          reviews_count?: number
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
      trips: {
        Row: {
          arrival_point: string | null
          arrive_time: string | null
          created_at: string
          currency: string
          depart_date: string
          depart_time: string
          description: string | null
          distance_km: number | null
          driver_id: string
          duration_minutes: number | null
          from_city: string
          id: string
          instant_booking: boolean
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
          depart_date: string
          depart_time: string
          description?: string | null
          distance_km?: number | null
          driver_id: string
          duration_minutes?: number | null
          from_city: string
          id?: string
          instant_booking?: boolean
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
          depart_date?: string
          depart_time?: string
          description?: string | null
          distance_km?: number | null
          driver_id?: string
          duration_minutes?: number | null
          from_city?: string
          id?: string
          instant_booking?: boolean
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
