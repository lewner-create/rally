'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  preferences: Record<string, any> | null
  created_at: string
  updated_at: string
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, preferences, created_at, updated_at')
    .eq('id', user.id)
    .single()

  return data ?? null
}

export async function updateProfile(fields: {
  display_name?: string
  username?: string
  avatar_url?: string
  bio?: string
  preferences?: Record<string, any>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/profile')
}

export async function uploadAvatar(formData: FormData): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const file = formData.get('avatar') as File
  if (!file) throw new Error('No file provided')

  const ext  = file.name.split('.').pop()
  const path = `${user.id}/avatar.${ext}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (error) throw new Error(error.message)

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  await updateProfile({ avatar_url: publicUrl })
  return publicUrl
}
