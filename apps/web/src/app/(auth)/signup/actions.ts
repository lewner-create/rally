'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const signupSchema = z.object({
  email:       z.string().email('Invalid email address'),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  username:    z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, and underscores only'),
})

export type SignupState = {
  error?: string
  fieldErrors?: Partial<Record<keyof z.infer<typeof signupSchema>, string>>
  fields?: { email?: string; displayName?: string; username?: string }
} | null

export async function signup(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const raw = {
    email:       formData.get('email') as string,
    password:    formData.get('password') as string,
    displayName: formData.get('displayName') as string,
    username:    formData.get('username') as string,
  }

  const parsed = signupSchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof z.infer<typeof signupSchema>
      fieldErrors[field] = issue.message
    }
    return {
      fieldErrors,
      fields: { email: raw.email, displayName: raw.displayName, username: raw.username },
    }
  }

  const { email, password, displayName, username } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, username },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return {
        error: 'An account with that email already exists',
        fields: { email: raw.email, displayName: raw.displayName, username: raw.username },
      }
    }
    return {
      error: error.message,
      fields: { email: raw.email, displayName: raw.displayName, username: raw.username },
    }
  }

  redirect('/onboarding')
}
