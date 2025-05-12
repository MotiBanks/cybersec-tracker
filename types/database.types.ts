export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      badges: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string
          requirement: string | null
          xp_reward: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon: string
          requirement?: string | null
          xp_reward?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string
          requirement?: string | null
          xp_reward?: number
          created_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string | null
          event_type: string | null
          task_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time?: string | null
          event_type?: string | null
          task_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string | null
          event_type?: string | null
          task_id?: string | null
          created_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          user_id: string
          title: string
          progress: number
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          progress?: number
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          progress?: number
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      hack_challenges: {
        Row: {
          id: string
          title: string
          description: string
          code_snippet: string | null
          xp_reward: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          code_snippet?: string | null
          xp_reward?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          code_snippet?: string | null
          xp_reward?: number
          created_at?: string
        }
      }
      language_practice_history: {
        Row: {
          id: string
          user_language_id: string
          practice_date: string
          duration_minutes: number | null
          xp_earned: number | null
        }
        Insert: {
          id?: string
          user_language_id: string
          practice_date: string
          duration_minutes?: number | null
          xp_earned?: number | null
        }
        Update: {
          id?: string
          user_language_id?: string
          practice_date?: string
          duration_minutes?: number | null
          xp_earned?: number | null
        }
      }
      languages: {
        Row: {
          id: string
          name: string
          icon: string | null
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
        }
      }
      mood_suggestions: {
        Row: {
          id: string
          mood_type: string
          suggestion: string
        }
        Insert: {
          id?: string
          mood_type: string
          suggestion: string
        }
        Update: {
          id?: string
          mood_type?: string
          suggestion?: string
        }
      }
      moods: {
        Row: {
          id: string
          user_id: string
          mood_type: string
          recorded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mood_type: string
          recorded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mood_type?: string
          recorded_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          action_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          read?: boolean
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          action_url?: string | null
          created_at?: string
        }
      }
      reflections: {
        Row: {
          id: string
          user_id: string
          content: string
          created_at: string
          tags: string[] | null
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          created_at?: string
          tags?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          created_at?: string
          tags?: string[] | null
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          task_type: string
          scheduled_for: string | null
          duration_minutes: number | null
          completed: boolean
          completed_at: string | null
          xp_reward: number
          recurring_pattern: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          task_type: string
          scheduled_for?: string | null
          duration_minutes?: number | null
          completed?: boolean
          completed_at?: string | null
          xp_reward?: number
          recurring_pattern?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          task_type?: string
          scheduled_for?: string | null
          duration_minutes?: number | null
          completed?: boolean
          completed_at?: string | null
          xp_reward?: number
          recurring_pattern?: string | null
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          unlocked_at?: string
        }
      }
      user_languages: {
        Row: {
          id: string
          user_id: string
          language_id: string
          proficiency: number
          last_practiced: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          language_id: string
          proficiency?: number
          last_practiced?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          language_id?: string
          proficiency?: number
          last_practiced?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          username: string | null
          email: string | null
          level: number
          xp: number
          streak_count: number
          last_active_date: string | null
          profile_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          email?: string | null
          level?: number
          xp?: number
          streak_count?: number
          last_active_date?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          email?: string | null
          level?: number
          xp?: number
          streak_count?: number
          last_active_date?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weekly_reports: {
        Row: {
          id: string
          user_id: string
          week_start: string
          week_end: string
          xp_gained: number | null
          tasks_completed: number | null
          reflections_count: number | null
          languages_practiced: string[] | null
          generated_at: string
          report_data: Json | null
          markdown_content: string | null
          csv_content: string | null
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          week_end: string
          xp_gained?: number | null
          tasks_completed?: number | null
          reflections_count?: number | null
          languages_practiced?: string[] | null
          generated_at?: string
          report_data?: Json | null
          markdown_content?: string | null
          csv_content?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          week_end?: string
          xp_gained?: number | null
          tasks_completed?: number | null
          reflections_count?: number | null
          languages_practiced?: string[] | null
          generated_at?: string
          report_data?: Json | null
          markdown_content?: string | null
          csv_content?: string | null
        }
      }
      xp_tracker: {
        Row: {
          id: string
          user_id: string
          xp_amount: number
          source: string
          source_id: string | null
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          xp_amount: number
          source: string
          source_id?: string | null
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          xp_amount?: number
          source?: string
          source_id?: string | null
          earned_at?: string
        }
      }
    }
    Functions: {
      increment_user_xp: {
        Args: {
          user_id: string
          xp_amount: number
          source?: string
          source_id?: string
        }
        Returns: undefined
      }
      update_user_streak: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      check_for_burnout: {
        Args: Record<string, never>
        Returns: undefined
      }
      check_for_missed_streaks: {
        Args: Record<string, never>
        Returns: undefined
      }
      generate_weekly_summary: {
        Args: {
          user_id: string
          week_start_date?: string
        }
        Returns: string
      }
    }
  }
}
