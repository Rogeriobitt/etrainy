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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bioimpedance_uploads: {
        Row: {
          file_name: string
          file_url: string
          id: string
          notes: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_name: string
          file_url: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_name?: string
          file_url?: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_equivalents: {
        Row: {
          bodyweight_equivalent: string
          freeweight_equivalent: string
          id: string
          limited_space_equivalent: string | null
          original_exercise: string
        }
        Insert: {
          bodyweight_equivalent: string
          freeweight_equivalent: string
          id?: string
          limited_space_equivalent?: string | null
          original_exercise: string
        }
        Update: {
          bodyweight_equivalent?: string
          freeweight_equivalent?: string
          id?: string
          limited_space_equivalent?: string | null
          original_exercise?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          equipment_type: string
          id: string
          image_url: string | null
          muscle_group: string
          name: string
          notes: string | null
          short_description: string | null
          suggested_level: string
        }
        Insert: {
          created_at?: string
          equipment_type: string
          id?: string
          image_url?: string | null
          muscle_group: string
          name: string
          notes?: string | null
          short_description?: string | null
          suggested_level?: string
        }
        Update: {
          created_at?: string
          equipment_type?: string
          id?: string
          image_url?: string | null
          muscle_group?: string
          name?: string
          notes?: string | null
          short_description?: string | null
          suggested_level?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_trainers: {
        Row: {
          city: string | null
          created_at: string
          cref: string | null
          experience: string | null
          full_name: string
          gym_name: string | null
          id: string
          personal_code: string
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          cref?: string | null
          experience?: string | null
          full_name: string
          gym_name?: string | null
          id?: string
          personal_code: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          cref?: string | null
          experience?: string | null
          full_name?: string
          gym_name?: string | null
          id?: string
          personal_code?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          email: string | null
          experience_level: string | null
          full_name: string | null
          goal: string | null
          has_injury: boolean | null
          has_personal: boolean | null
          height: number | null
          id: string
          injury_description: string | null
          personal_code: string | null
          personal_trainer_id: string | null
          sex: string | null
          training_days: string | null
          training_location: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          goal?: string | null
          has_injury?: boolean | null
          has_personal?: boolean | null
          height?: number | null
          id?: string
          injury_description?: string | null
          personal_code?: string | null
          personal_trainer_id?: string | null
          sex?: string | null
          training_days?: string | null
          training_location?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          goal?: string | null
          has_injury?: boolean | null
          has_personal?: boolean | null
          height?: number | null
          id?: string
          injury_description?: string | null
          personal_code?: string | null
          personal_trainer_id?: string | null
          sex?: string | null
          training_days?: string | null
          training_location?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_personal_trainer_id_fkey"
            columns: ["personal_trainer_id"]
            isOneToOne: false
            referencedRelation: "personal_trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_entries: {
        Row: {
          created_at: string
          id: string
          note: string | null
          recorded_at: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          recorded_at?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          recorded_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      student_invitations: {
        Row: {
          created_at: string
          id: string
          personal_name: string | null
          personal_trainer_id: string
          status: string
          student_email: string
          student_name: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          personal_name?: string | null
          personal_trainer_id: string
          status?: string
          student_email: string
          student_name: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          personal_name?: string | null
          personal_trainer_id?: string
          status?: string
          student_email?: string
          student_name?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_invitations_personal_trainer_id_fkey"
            columns: ["personal_trainer_id"]
            isOneToOne: false
            referencedRelation: "personal_trainers"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      video_classes: {
        Row: {
          calories: string | null
          created_at: string
          created_by: string
          description: string | null
          duration: string
          id: string
          tag: string
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          calories?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          duration: string
          id?: string
          tag: string
          thumbnail_url?: string | null
          title: string
          video_url: string
        }
        Update: {
          calories?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration?: string
          id?: string
          tag?: string
          thumbnail_url?: string | null
          title?: string
          video_url?: string
        }
        Relationships: []
      }
      workout_days: {
        Row: {
          id: string
          muscle_groups: string
          name: string
          sort_order: number
          workout_plan_id: string
        }
        Insert: {
          id?: string
          muscle_groups: string
          name: string
          sort_order?: number
          workout_plan_id: string
        }
        Update: {
          id?: string
          muscle_groups?: string
          name?: string
          sort_order?: number
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_days_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          exercise_name: string
          id: string
          image_url: string | null
          notes: string | null
          reps: string
          sets: string
          sort_order: number
          workout_day_id: string
        }
        Insert: {
          exercise_name: string
          id?: string
          image_url?: string | null
          notes?: string | null
          reps: string
          sets: string
          sort_order?: number
          workout_day_id: string
        }
        Update: {
          exercise_name?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          reps?: string
          sets?: string
          sort_order?: number
          workout_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string
          days_per_week: number
          division: string
          expired_notified_at: string | null
          expires_at: string | null
          expiry_warning_sent_at: string | null
          id: string
          level: string
          objective: string
          personal_trainer_id: string | null
          status: string
          training_location: string | null
          updated_at: string
          user_id: string
          validity_months: number
        }
        Insert: {
          created_at?: string
          days_per_week: number
          division: string
          expired_notified_at?: string | null
          expires_at?: string | null
          expiry_warning_sent_at?: string | null
          id?: string
          level: string
          objective: string
          personal_trainer_id?: string | null
          status?: string
          training_location?: string | null
          updated_at?: string
          user_id: string
          validity_months?: number
        }
        Update: {
          created_at?: string
          days_per_week?: number
          division?: string
          expired_notified_at?: string | null
          expires_at?: string | null
          expiry_warning_sent_at?: string | null
          id?: string
          level?: string
          objective?: string
          personal_trainer_id?: string | null
          status?: string
          training_location?: string | null
          updated_at?: string
          user_id?: string
          validity_months?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_personal_trainer_id_fkey"
            columns: ["personal_trainer_id"]
            isOneToOne: false
            referencedRelation: "personal_trainers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_invitation: { Args: { _token: string }; Returns: boolean }
      create_notification: {
        Args: {
          _link?: string
          _message: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          id: string
          personal_name: string
          personal_trainer_id: string
          status: string
          student_email: string
          student_name: string
        }[]
      }
      get_personal_by_code: {
        Args: { _code: string }
        Returns: {
          full_name: string
          id: string
          personal_code: string
        }[]
      }
      get_personal_public_info: {
        Args: { _personal_id: string }
        Returns: {
          full_name: string
          id: string
          personal_code: string
        }[]
      }
      get_personal_user_id: { Args: { _personal_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      nextval_personal_code: { Args: never; Returns: number }
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
