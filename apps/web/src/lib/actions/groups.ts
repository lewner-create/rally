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
  const useBoost    = formData.get('use_boost') === 'true'

  let interests: string[] = []
  try { interests = JSON.parse(formData.get('interests') as string ?? '[]') } catch {}

  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name,
      owner_id:    user.id,
      tier:        0,
      boost_count: 0,
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
    .insert({ group_id: group.id, user_id: user.id, role: 'admin', boost_active: false })

  if (memberError) return { error: memberError.message }

  if (useBoost) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('boost_count')
      .eq('id', user.id)
      .single()

    if (profile && profile.boost_count > 0) {
      await supabase
        .from('profiles')
        .update({ boost_count: profile.boost_count - 1 })
        .eq('id', user.id)

      await supabase
        .from('groups')
        .update({ tier: 1, boost_count: 1 })
        .eq('id', group.id)
    }
  }

  revalidatePath('/dashboard')
  redirect(`/dashboard?new=${group.id}`)}

export async function getMyGroups() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, role, groups(id, name, tier, boost_count, created_at)')
    .eq('user_id', user.id)

  if (error || !data) return []

  return data as {
    group_id: string
    role: 'admin' | 'member'
    groups: { id: string; name: string; tier: number; boost_count: number; created_at: string }
  }[]
}

export async function getGroupWithMembers(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) return null

  const { data: group } = await supabase
    .from('groups')
    .select(`
      id, name, tier, boost_count, created_at,
      group_members (
        id, role, boost_active, joined_at, user_id,
        profiles ( id, username, display_name, avatar_url )
      )
    `)
    .eq('id', groupId)
    .single()

  if (!group) return null
  return { ...group, myRole: membership.role as 'admin' | 'member' }
}

export async function createInviteLink(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get group name to build the group slug portion of the URL
  const { data: group } = await supabase
    .from('groups')
    .select('name')
    .eq('id', groupId)
    .single()

  const groupSlug = slugify(group?.name ?? 'group')

  // Retry up to 8 times on slug collision
  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = generateInviteToken()
    const { data, error } = await supabase
      .from('group_invites')
      .insert({ group_id: groupId, created_by: user.id, slug, group_slug: groupSlug })
      .select('token, slug, group_slug')
      .single()

    if (!error) {
      return { token: data.token, slug: data.slug, groupSlug: data.group_slug }
    }
    // Only retry on unique constraint violations
    if (!error.message.includes('unique') && !error.message.includes('duplicate')) {
      return { error: error.message }
    }
  }

  return { error: 'Could not generate a unique invite link — please try again.' }
}

export async function getGroupInvites(groupId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('group_invites')
    .select('id, token, slug, group_slug, use_count, expires_at, created_at')
    .eq('group_id', groupId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function revokeInvite(inviteId: string) {
  const supabase = await createClient()
  await supabase.from('group_invites').delete().eq('id', inviteId)
  revalidatePath('/groups')
}

// ─── Preview by hex token (old links, backward compat) ───────────────────────

export async function getInvitePreview(token: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('group_invites')
    .select('id, group_id, expires_at, groups(id, name)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  return data as {
    id: string
    group_id: string
    expires_at: string
    groups: { id: string; name: string }
  } | null
}

// ─── Preview by fun slug (new links) ─────────────────────────────────────────

export async function getInvitePreviewBySlug(groupSlug: string, slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('group_invites')
    .select('id, group_id, token, expires_at, groups(id, name)')
    .eq('slug', slug)
    .eq('group_slug', groupSlug)
    .gt('expires_at', new Date().toISOString())
    .single()

  return data as {
    id: string
    group_id: string
    token: string
    expires_at: string
    groups: { id: string; name: string }
  } | null
}

// ─── Join by hex token (backward compat) ─────────────────────────────────────

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

// ─── Join by fun slug ─────────────────────────────────────────────────────────

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

// ─── Shared join logic ────────────────────────────────────────────────────────

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
    boost_active: false,
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
    boost_active: false,
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
// ─── Update group ─────────────────────────────────────────────────────────────
// Paste this block at the bottom of groups.ts

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

  // Admin check
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') return { error: 'Only admins can edit group settings' }

  const update: Record<string, unknown> = {}
  if (fields.name        !== undefined) update.name        = fields.name.trim()
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

// ─── Remove member ────────────────────────────────────────────────────────────

export async function removeMember(groupId: string, targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Must be admin and cannot remove yourself via this path
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

// ─── Delete group (admin only) ────────────────────────────────────────────────

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

// ─── Update group ─────────────────────────────────────────────────────────────
// Paste this block at the bottom of groups.ts