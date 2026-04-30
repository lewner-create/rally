'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signup, type SignupState } from './actions'

export default function SignupPage() {
  const [state, action, pending] = useActionState<SignupState, FormData>(signup, null)

  return (
    <>
      <h1 className="text-[20px] font-medium tracking-tight mb-1">Create account</h1>
      <p className="text-sm text-muted-foreground mb-6">Join Rally and make plans with your people</p>

      <form action={action} className="space-y-4">
        {state?.error && (
          <div
            className="rounded-lg px-3 py-2.5 text-sm"
            style={{ background: '#FAECE7', color: '#712B13' }}
          >
            {state.error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="displayName" className="text-sm font-medium">Display name</Label>
          <Input id="displayName" name="displayName" required className="h-10" />
          {state?.fieldErrors?.displayName && (
            <p className="text-xs" style={{ color: '#D85A30' }}>{state.fieldErrors.displayName}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-sm font-medium">Username</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input id="username" name="username" className="pl-7 h-10" required />
          </div>
          {state?.fieldErrors?.username && (
            <p className="text-xs" style={{ color: '#D85A30' }}>{state.fieldErrors.username}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required className="h-10" />
          {state?.fieldErrors?.email && (
            <p className="text-xs" style={{ color: '#D85A30' }}>{state.fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required className="h-10" />
          {state?.fieldErrors?.password && (
            <p className="text-xs" style={{ color: '#D85A30' }}>{state.fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full h-10 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
          style={{
            background: '#7F77DD',
            boxShadow: '0 4px 14px rgba(127,119,221,0.4)',
          }}
        >
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-5">
        Already have an account?{' '}
        <Link href="/login" className="font-medium" style={{ color: '#7F77DD' }}>
          Sign in
        </Link>
      </p>
    </>
  )
}
