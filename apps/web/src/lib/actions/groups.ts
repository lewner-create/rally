'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateInviteToken, slugify } from '@/lib/name-generator'

export async function createGroup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Group name is required' }
  if (name.length > 40) return { error: 'Name must be 40 characters or less' }

  const groupType   = (formData.get('group_type')  as string) || 'recurring'
  const occasion    = (formData.get('occasion')     as string) || null
  const themeColor  = (formData.get('theme_color')  as string) || '#7F77DD'
  const bannerUrl   = (formData.get('banner_url')   as string) || null
  const description = (formData.get('description')  as string) || null

  let interests: string[] = []
  try { interests = JSON.parse(formData.get('interests') as string ?? '[]') } catch {}

  // Generate a unique slug for this group
  const baseSlug = slugify(name)
  let slug = baseSlug
  let slugAttempt = 0
  while (true) {
    const { data: existing } = await supabase
      .from('groups').select('id').eq('slug', slug).maybeSingle()
    if (!existing) break
    slugAttempt++
    slug = `${baseSlug}-${slugAttempt}`
  }

  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name,
      slug,
      owner_id:    user.id,
      tier:        0,
      group_type:  groupType,
      occasion:    occasion || null,
      interests,
      theme_color: themeColor,
      banner_url:  bannerUrl || null,
      description: description || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'admin' })

  if (memberError) return { error: memberError.message }

  revalidatePath('/dashboard')
  redirect(`/dashboard?new=${group.id}`)
}

export async function getMyGroups() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, role, groups(id, name, tier, created_at)')
    .eq('user_id', user.id)

  if (error || !data) return []

  return data as {
    group_id: string
    role: 'admin' | 'member'
    groups: { id: string; name: string; tier: number; created_at: string }
  }[]
}

export async function getGroupWithMembers(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check membership first — use maybeSingle() so missing row returns null, not an error
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return null

  // Fetch group with all columns the UI needs
  const { data: group, error } = await supabase
    .from('groups')
    .select(`
      id, name, slug, owner_id, tier, created_at,
      theme_color, banner_url, description, interests,
      group_members (
        id, role, joined_at, user_id,
        profiles ( id, username, display_name, avatar_url )
      )
    `)
    .eq('id', groupId)
    .single()

  if (error || !group) return null
  return { ...group, myRole: membership.role as 'admin' | 'member' }
}

export async function joinGroupByToken(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/join/${token}`)

  const { data: invite } = await supabase
    .from('group_invites')
    .select('id, group_id, use_count, max_uses')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) return { error: 'This invite link is invalid or has expired.' }
  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
    return { error: 'This invite link has reached its maximum uses.' }
  }

  return joinGroup(invite.group_id, invite.id, invite.use_count)
}

export async function joinGroupBySlug(groupSlug: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/join/${groupSlug}/${slug}`)

  const { data: invite } = await supabase
    .from('group_invites')
    .select('id, group_id, use_count, max_uses')
    .eq('slug', slug)
    .eq('group_slug', groupSlug)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) return { error: 'This invite link is invalid or has expired.' }
  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
    return { error: 'This invite link has reached its maximum uses.' }
  }

  return joinGroup(invite.group_id, invite.id, invite.use_count)
}

async function joinGroup(groupId: string, inviteId: string, useCount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) redirect(`/groups/${groupId}`)

  const { count } = await supabase
    .from('group_members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId)

  const { data: group } = await supabase
    .from('groups')
    .select('tier')
    .eq('id', groupId)
    .single()

  const maxMembers = (group?.tier ?? 0) >= 3 ? 20 : 6
  if ((count ?? 0) >= maxMembers) return { error: 'This group is full.' }

  const { error } = await supabase.from('group_members').insert({
    group_id: groupId,
    user_id:  user.id,
    role:     'member',
  })

  if (error) return { error: error.message }

  await supabase
    .from('group_invites')
    .update({ use_count: useCount + 1 })
    .eq('id', inviteId)

  revalidatePath('/dashboard')
  redirect(`/groups/${groupId}`)
}

export async function inviteByUsername(groupId: string, username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, username')
    .eq('username', username.toLowerCase().trim())
    .single()

  if (!profile) return { error: `No user found with username @${username}` }

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', profile.id)
    .maybeSingle()

  if (existing) return { error: `@${username} is already in this group` }

  const { count } = await supabase
    .from('group_members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId)

  const { data: group } = await supabase
    .from('groups')
    .select('tier')
    .eq('id', groupId)
    .single()

  const maxMembers = (group?.tier ?? 0) >= 3 ? 20 : 6
  if ((count ?? 0) >= maxMembers) return { error: 'This group is full.' }

  const { error } = await supabase.from('group_members').insert({
    group_id: groupId,
    user_id:  profile.id,
    role:     'member',
  })

  if (error) return { error: error.message }

  revalidatePath(`/groups/${groupId}`)
  return { success: true, name: profile.display_name ?? profile.username }
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function updateGroup(groupId: string, fields: {
  name?:        string
  description?: string | null
  theme_color?: string
  banner_url?:  string | null
  interests?:   string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') return { error: 'Only admins can edit group settings' }

  const update: Record<string, unknown> = {}
  if (fields.name        !== undefined) {
    const trimmed = fields.name.trim()
    update.name = trimmed
    // Re-slugify with collision handling
    const baseSlug = slugify(trimmed)
    let slug = baseSlug
    let attempt = 0
    while (true) {
      const { data: existing } = await supabase
        .from('groups').select('id').eq('slug', slug).neq('id', groupId).maybeSingle()
      if (!existing) break
      attempt++
      slug = `${baseSlug}-${attempt}`
    }
    update.slug = slug
  }
  if (fields.description !== undefined) update.description = fields.description
  if (fields.theme_color !== undefined) update.theme_color = fields.theme_color
  if (fields.banner_url  !== undefined) update.banner_url  = fields.banner_url
  if (fields.interests   !== undefined) update.interests   = fields.interests

  const { error } = await supabase
    .from('groups')
    .update(update)
    .eq('id', groupId)

  if (error) return { error: error.message }

  revalidatePath(`/groups/${groupId}`)
  revalidatePath(`/groups/${groupId}/settings`)
  return { success: true }
}

export async function removeMember(groupId: string, targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') return { error: 'Only admins can remove members' }
  if (targetUserId === user.id)      return { error: 'Use Leave group to remove yourself' }

  await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', targetUserId)

  revalidatePath(`/groups/${groupId}`)
  revalidatePath(`/groups/${groupId}/settings`)
  return { success: true }
}

export async function getGroupStreak(groupId: string): Promise<{ streak: number; totalHangouts: number }> {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('ends_at')
    .eq('group_id', groupId)
    .eq('status', 'published')
    .lt('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: false })
    .limit(52) // max 52 weeks lookback

  if (!events?.length) return { streak: 0, totalHangouts: 0 }

  const totalHangouts = events.length

  // Get unique calendar weeks (YYYY-WW) for events
  const weeks = new Set(events.map(e => {
    const d = new Date(e.ends_at!)
    const jan1 = new Date(d.getFullYear(), 0, 1)
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
    return `${d.getFullYear()}-${week}`
  }))

  // Current week
  const now = new Date()
  const jan1 = new Date(now.getFullYear(), 0, 1)
  const currentWeek = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)

  let streak = 0
  let checkWeek = currentWeek
  let checkYear = now.getFullYear()

  while (true) {
    const key = `${checkYear}-${checkWeek}`
    if (!weeks.has(key)) break
    streak++
    checkWeek--
    if (checkWeek <= 0) { checkWeek = 52; checkYear-- }
  }

  return { streak, totalHangouts }
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') return { error: 'Only admins can delete groups' }

  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
