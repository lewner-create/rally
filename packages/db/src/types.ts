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
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          avatar_url: string | null
          home_address: string | null
          home_lat: number | null
          home_lng: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          avatar_url?: string | null
          home_address?: string | null
          home_lat?: number | null
          home_lng?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          display_name?: string
          avatar_url?: string | null
          home_address?: string | null
          home_lat?: number | null
          home_lng?: number | null
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          slug: string | null
          avatar_url: string | null
          owner_id: string
          tier: number
          boost_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          avatar_url?: string | null
          owner_id: string
          tier?: number
          boost_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string | null
          avatar_url?: string | null
          tier?: number
          boost_count?: number
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          boost_active: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: string
          boost_active?: boolean
          joined_at?: string
        }
        Update: {
          role?: string
          boost_active?: boolean
        }
      }
      availability_blocks: {
        Row: {
          id: string
          user_id: string
          start_time: string
          end_time: string
          block_type: string
          label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_time: string
          end_time: string
          block_type?: string
          label?: string | null
          created_at?: string
        }
        Update: {
          start_time?: string
          end_time?: string
          block_type?: string
          label?: string | null
        }
      }
      events: {
        Row: {
          id: string
          group_id: string
          created_by: string
          title: string
          event_type: string
          status: string
          start_time: string | null
          end_time: string | null
          location_name: string | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          created_by: string
          title: string
          event_type: string
          status?: string
          start_time?: string | null
          end_time?: string | null
          location_name?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          event_type?: string
          status?: string
          start_time?: string | null
          end_time?: string | null
          location_name?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          updated_at?: string
        }
      }
      event_attendees: {
        Row: {
          id: string
          event_id: string
          user_id: string
          rsvp_status: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          rsvp_status?: string
          responded_at?: string | null
        }
        Update: {
          rsvp_status?: string
          responded_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          group_id: string
          event_id: string | null
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          event_id?: string | null
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          content?: string
        }
      }
    }
  }
}