'use client'

import { useActionState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, type LoginState } from './actions'
import { signInWithGoogle } from '@/lib/actions/google-calendar'

export default function LoginPage() {
  const [state, action, pending]  = useActionState<LoginState, FormData>(login, null)
  const [googlePending, startGoogle] = useTransition()
  const searchParams = useSearchParams()
  const next         = searchParams.get('next') ?? ''

  function handleGoogleSignIn() {
    startGoogle(async () => {
      const { url, error } = await signInWithGoogle(next || undefined)
      if (url) window.location.href = url
      else console.error('Google sign-in error:', error)
    })
  }

  return (
    <>
      <h1 className="text-[20px] font-medium tracking-tight mb-1">Sign in</h1>
      <p className="text-sm text-muted-foreground mb-6">Welcome back</p>

      {/* Google sign-in */}
      <button
        onClick={handleGoogleSignIn}
        disabled={googlePending || pending}
        className="w-full h-10 rounded-lg text-sm font-medium transition-all mb-4 flex items-center justify-center gap-2.5"
        style={{
          background: '#fff', color: '#333',
          border: '1px solid #ddd',
          opacity: googlePending ? 0.7 : 1,
        }}
      >
        {googlePending ? (
          <span>Redirecting…</span>
        ) : (
          <>
            <GoogleIcon />
            <span>Continue with Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

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
          disabled={pending || googlePending}
          className="w-full h-10 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
          style={{ background: '#7F77DD', boxShadow: '0 4px 14px rgba(127,119,221,0.4)' }}
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
