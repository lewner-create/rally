'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, type LoginState } from './actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''

  return (
    <>
      <h1 className="text-[20px] font-medium tracking-tight mb-1">Sign in</h1>
      <p className="text-sm text-muted-foreground mb-6">Welcome back</p>

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        {state?.error && (
          <div
            className="rounded-lg px-3 py-2.5 text-sm"
            style={{ background: '#FAECE7', color: '#712B13' }}
          >
            {state.error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required className="h-10" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-10" />
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
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-5">
        No account?{' '}
        <Link href="/signup" className="font-medium" style={{ color: '#7F77DD' }}>
          Sign up
        </Link>
      </p>
    </>
  )
}
