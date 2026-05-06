export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {

      // ─── Profiles ───────────────────────────────────────────────────────────
      profiles: {
        Row: {
          id:                  string
          username:            string
          display_name:        string | null
          avatar_url:          string | null
          bio:                 string | null
          preferences:         Json        // { onboarded: boolean, ... }
          weekly_availability: Json        // { Mon: number[], Tue: number[], ... }
          home_address:        string | null
          home_lat:            number | null
          home_lng:            number | null
          // Volta+ / Founders flags (formerly is_podium / boost_count)
          is_rally_plus:       boolean
          back_count:          number      // backs available to spend on groups
          created_at:          string
          updated_at:          string
        }
        Insert: {
          id:                   string
          username:             string
          display_name?:        string | null
          avatar_url?:          string | null
          bio?:                 string | null
          preferences?:         Json
          weekly_availability?: Json
          home_address?:        string | null
          home_lat?:            number | null
          home_lng?:            number | null
          is_rally_plus?:       boolean
          back_count?:          number
          created_at?:          string
          updated_at?:          string
        }
        Update: {
          username?:            string
          display_name?:        string | null
          avatar_url?:          string | null
          bio?:                 string | null
          preferences?:         Json
          weekly_availability?: Json
          home_address?:        string | null
          home_lat?:            number | null
          home_lng?:            number | null
          is_rally_plus?:       boolean
          back_count?:          number
          updated_at?:          string
        }
      }

      // ─── Groups ─────────────────────────────────────────────────────────────
      groups: {
        Row: {
          id:          string
          name:        string
          slug:        string | null
          owner_id:    string
          description: string | null
          theme_color: string | null
          banner_url:  string | null
          interests:   string[]           // activity type chips
          group_type:  string | null
          occasion:    string | null
          // Backing (formerly boost_count / tier)
          tier:        number             // 0 = standard, 1+ = backed
          back_count:  number             // total backs applied by members
          created_at:  string
          updated_at:  string
        }
        Insert: {
          id?:          string
          name:         string
          slug?:        string | null
          owner_id:     string
          description?: string | null
          theme_color?: string | null
          banner_url?:  string | null
          interests?:   string[]
          group_type?:  string | null
          occasion?:    string | null
          tier?:        number
          back_count?:  number
          created_at?:  string
          updated_at?:  string
        }
        Update: {
          name?:        string
          slug?:        string | null
          description?: string | null
          theme_color?: string | null
          banner_url?:  string | null
          interests?:   string[]
          group_type?:  string | null
          occasion?:    string | null
          tier?:        number
          back_count?:  number
          updated_at?:  string
        }
      }

      // ─── Group members ───────────────────────────────────────────────────────
      group_members: {
        Row: {
          id:         string
          group_id:   string
          user_id:    string
          role:       'admin' | 'member'
          is_backing: boolean             // formerly boost_active
          joined_at:  string
        }
        Insert: {
          id?:         string
          group_id:    string
          user_id:     string
          role?:       'admin' | 'member'
          is_backing?: boolean
          joined_at?:  string
        }
        Update: {
          role?:       'admin' | 'member'
          is_backing?: boolean
        }
      }

      // ─── Group invites ───────────────────────────────────────────────────────
      group_invites: {
        Row: {
          id:         string
          group_id:   string
          created_by: string
          token:      string
          slug:       string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?:         string
          group_id:    string
          created_by:  string
          token?:      string
          slug?:       string | null
          expires_at?: string
          created_at?: string
        }
        Update: {
          expires_at?: string
        }
      }

      // ─── Events ──────────────────────────────────────────────────────────────
      events: {
        Row: {
          id:          string
          group_id:    string
          created_by:  string
          title:       string
          description: string | null
          event_type:  string
          starts_at:   string | null
          ends_at:     string | null
          location:    string | null
          banner_url:  string | null
          status:      string             // 'upcoming' | 'cancelled' | 'completed'
          created_at:  string
          updated_at:  string
        }
        Insert: {
          id?:          string
          group_id:     string
          created_by:   string
          title:        string
          description?: string | null
          event_type:   string
          starts_at?:   string | null
          ends_at?:     string | null
          location?:    string | null
          banner_url?:  string | null
          status?:      string
          created_at?:  string
          updated_at?:  string
        }
        Update: {
          title?:       string
          description?: string | null
          event_type?:  string
          starts_at?:   string | null
          ends_at?:     string | null
          location?:    string | null
          banner_url?:  string | null
          status?:      string
          updated_at?:  string
        }
      }

      // ─── Event attendees ─────────────────────────────────────────────────────
      event_attendees: {
        Row: {
          id:           string
          event_id:     string
          user_id:      string
          rsvp_status:  'yes' | 'maybe' | 'no'
          responded_at: string | null
        }
        Insert: {
          id?:           string
          event_id:      string
          user_id:       string
          rsvp_status?:  'yes' | 'maybe' | 'no'
          responded_at?: string | null
        }
        Update: {
          rsvp_status?:  'yes' | 'maybe' | 'no'
          responded_at?: string | null
        }
      }

      // ─── Event details ───────────────────────────────────────────────────────
      event_details: {
        Row: {
          id:         string
          event_id:   string
          key:        string
          value:      string
          created_at: string
        }
        Insert: {
          id?:        string
          event_id:   string
          key:        string
          value:      string
          created_at?: string
        }
        Update: {
          value?: string
        }
      }

      // ─── Event costs ─────────────────────────────────────────────────────────
      event_costs: {
        Row: {
          id:          string
          event_id:    string
          label:       string
          amount:      number
          per_person:  boolean
          paid:        boolean
          payment_url: string | null
          created_at:  string
        }
        Insert: {
          id?:          string
          event_id:     string
          label:        string
          amount:       number
          per_person?:  boolean
          paid?:        boolean
          payment_url?: string | null
          created_at?:  string
        }
        Update: {
          label?:       string
          amount?:      number
          per_person?:  boolean
          paid?:        boolean
          payment_url?: string | null
        }
      }

      // ─── Plan cards ──────────────────────────────────────────────────────────
      plan_cards: {
        Row: {
          id:             string
          group_id:       string
          created_by:     string
          title:          string
          event_type:     string
          proposed_date:  string | null
          proposed_start: string | null
          proposed_end:   string | null
          status:         'open' | 'locked' | 'cancelled'
          event_id:       string | null   // set when locked in
          created_at:     string
        }
        Insert: {
          id?:             string
          group_id:        string
          created_by:      string
          title:           string
          event_type:      string
          proposed_date?:  string | null
          proposed_start?: string | null
          proposed_end?:   string | null
          status?:         'open' | 'locked' | 'cancelled'
          event_id?:       string | null
          created_at?:     string
        }
        Update: {
          title?:          string
          status?:         'open' | 'locked' | 'cancelled'
          event_id?:       string | null
        }
      }

      // ─── Plan card responses ─────────────────────────────────────────────────
      plan_card_responses: {
        Row: {
          id:           string
          plan_card_id: string
          user_id:      string
          response:     'in' | 'maybe' | 'cant'
          created_at:   string
        }
        Insert: {
          id?:           string
          plan_card_id:  string
          user_id:       string
          response:      'in' | 'maybe' | 'cant'
          created_at?:   string
        }
        Update: {
          response?: 'in' | 'maybe' | 'cant'
        }
      }

      // ─── Chat messages ───────────────────────────────────────────────────────
      chat_messages: {
        Row: {
          id:           string
          group_id:     string
          event_id:     string | null
          user_id:      string
          content:      string
          message_type: 'user' | 'radio' | 'plan_card'
          plan_card_id: string | null
          created_at:   string
        }
        Insert: {
          id?:           string
          group_id:      string
          event_id?:     string | null
          user_id:       string
          content:       string
          message_type?: 'user' | 'radio' | 'plan_card'
          plan_card_id?: string | null
          created_at?:   string
        }
        Update: {
          content?: string
        }
      }

      // ─── Direct messages ─────────────────────────────────────────────────────
      direct_messages: {
        Row: {
          id:         string
          sender_id:  string
          receiver_id: string
          content:    string
          read_at:    string | null
          created_at: string
        }
        Insert: {
          id?:          string
          sender_id:    string
          receiver_id:  string
          content:      string
          read_at?:     string | null
          created_at?:  string
        }
        Update: {
          read_at?: string | null
        }
      }

      // ─── Availability blocks (legacy v1) ─────────────────────────────────────
      availability_blocks: {
        Row: {
          id:         string
          user_id:    string
          start_time: string
          end_time:   string
          block_type: string
          label:      string | null
          created_at: string
        }
        Insert: {
          id?:         string
          user_id:     string
          start_time:  string
          end_time:    string
          block_type?: string
          label?:      string | null
          created_at?: string
        }
        Update: {
          start_time?: string
          end_time?:   string
          block_type?: string
          label?:      string | null
        }
      }

    }
  }
}

// ─── Convenience re-exports ───────────────────────────────────────────────────

export type Profile      = Database['public']['Tables']['profiles']['Row']
export type Group        = Database['public']['Tables']['groups']['Row']
export type GroupMember  = Database['public']['Tables']['group_members']['Row']
export type Event        = Database['public']['Tables']['events']['Row']
export type PlanCard     = Database['public']['Tables']['plan_cards']['Row']
export type ChatMessage  = Database['public']['Tables']['chat_messages']['Row']
export type DirectMessage = Database['public']['Tables']['direct_messages']['Row']
