'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, and underscores only'),
})

export type SignupState = {
  error?: string
  fieldErrors?: Partial<Record<keyof z.infer<typeof signupSchema>, string>>
} | null

export async function signup(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
    username: formData.get('username'),
  })

  if (!parsed.success) {
    const fieldErrors: SignupState['fieldErrors'] = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof z.infer<typeof signupSchema>
      fieldErrors[field] = issue.message
    }
    return { fieldErrors }
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
      return { error: 'An account with that email already exists' }
    }
    return { error: error.message }
  }

  redirect('/dashboard')
}