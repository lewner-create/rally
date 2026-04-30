'use server'

import { createClient } from '@/lib/supabase/server'
import { getOpenWindows } from '@/lib/actions/windows'

export type MemberPreview = {
  id: string
  display_name: string | null
  username: string
  avatar_url: string | null
}

export type GroupWithWindows = {
  id: string
  name: string
  slug: string
  theme_color: string | null
  banner_url: string | null
  description: string | null
  member_count: number
  members: MemberPreview[]
  next_window: {
    label: string
    day: string
    start_hour: number
    end_hour: number
    members: MemberPreview[]
  } | null
}

export async function getGroupsWithWindows(userId: string): Promise<GroupWithWindows[]> {
  const supabase = await createClient()

  const { data: memberships } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups (
        id, name, slug, theme_color, banner_url, description
      )
    `)
    .eq('user_id', userId)

  if (!memberships || memberships.length === 0) return []

  const groups = memberships
    .map((m) => m.groups)
    .filter(Boolean) as Array<{
      id: string; name: string; slug: string;
      theme_color: string | null; banner_url: string | null; description: string | null
    }>

  const results: GroupWithWindows[] = []

  for (const group of groups) {
    const { data: members } = await supabase
      .from('group_members')
      .select('profiles(id, display_name, username, avatar_url)')
      .eq('group_id', group.id)
      .limit(6)

    const memberProfiles: MemberPreview[] = (members ?? [])
      .map((m) => m.profiles)
      .filter(Boolean) as MemberPreview[]

    let nextWindow: GroupWithWindows['next_window'] = null
    try {
      const windows = await getOpenWindows(group.id)
      if (windows && windows.length > 0) {
        const w = windows[0] as any
        // Handle both snake_case and camelCase field names
        const startHour = w.start_hour ?? w.startHour ?? w.start ?? 0
        const endHour   = w.end_hour   ?? w.endHour   ?? w.end   ?? 0
        nextWindow = {
          label: w.label ?? '',
          day: w.day ?? '',
          start_hour: Number(startHour),
          end_hour: Number(endHour),
          members: (w.members ?? []) as MemberPreview[],
        }
      }
    } catch {
      // no windows yet
    }

    results.push({
      id: group.id,
      name: group.name,
      slug: group.slug,
      theme_color: group.theme_color,
      banner_url: group.banner_url,
      description: group.description,
      member_count: memberProfiles.length,
      members: memberProfiles,
      next_window: nextWindow,
    })
  }

  return results
}
