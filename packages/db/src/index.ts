export type EventType =
  | 'game_night'
  | 'hangout'
  | 'meetup'
  | 'day_trip'
  | 'road_trip'
  | 'moto_trip'
  | 'vacation'

export type GroupRole = 'admin' | 'member'
export type RsvpStatus = 'yes' | 'no' | 'maybe'

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Group {
  id: string
  name: string
  tier: 0 | 1 | 2 | 3
  back_count: number
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: GroupRole
  boost_status: boolean
  joined_at: string
  profiles?: Profile
}

export interface GroupInvite {
  id: string
  group_id: string
  created_by: string
  token: string
  max_uses: number | null
  use_count: number
  expires_at: string
  created_at: string
  groups?: Group
}

export interface AvailabilityBlock {
  id: string
  user_id: string
  starts_at: string
  ends_at: string
  is_busy: boolean
  created_at: string
}

export interface Event {
  id: string
  group_id: string
  title: string
  type: EventType
  status: 'planning' | 'confirmed' | 'cancelled'
  created_by: string
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export interface EventAttendee {
  id: string
  event_id: string
  user_id: string
  rsvp: RsvpStatus
  created_at: string
}

export interface Message {
  id: string
  group_id: string
  event_id: string | null
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export type GroupWithMembers = Group & {
  group_members: (GroupMember & { profiles: Profile })[]
  myRole: GroupRole
}

export type GroupMembership = {
  group_id: string
  role: GroupRole
  groups: Group
}
export interface Message {
  id: string
  group_id: string
  event_id: string | null
  user_id: string
  content: string
  message_type: 'user' | 'radio'
  created_at: string
}