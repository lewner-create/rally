'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { consumeInviteToken } from '@/lib/actions/invites'
import { createAdminSignup } from '@/lib/actions/invite-signup'

const ACCENT = '#7F77DD'

export function InviteSignupForm({ token }: { token: string }) {
  const router = useRouter()
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Create the Supabase auth user via server action (email confirmed = true)
      const result = await createAdminSignup({ email, password, displayName: name.trim(), token })
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // 2. Sign in immediately (no email confirmation needed)
      const supabase = createClient()
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) {
        setError(signInErr.message)
        setLoading(false)
        return
      }

      // 3. Go to onboarding
      router.push('/onboarding')
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={e => setName(e.target.value)}
        style={inputStyle}
        autoComplete="name"
      />
      <input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={inputStyle}
        autoComplete="email"
      />
      <input
        type="password"
        placeholder="Password (min 8 characters)"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={inputStyle}
        autoComplete="new-password"
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
      />

      {error && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'rgba(224,90,90,0.12)',
          border: '1px solid rgba(224,90,90,0.25)',
          color: '#e05a5a',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          marginTop: '4px',
          padding: '13px',
          borderRadius: '9999px',
          border: 'none',
          background: loading ? '#3a3a3a' : ACCENT,
          color: loading ? '#666' : '#fff',
          fontSize: '15px',
          fontWeight: 700,
          cursor: loading ? 'default' : 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.2s',
        }}
      >
        {loading ? 'Creating account…' : 'Join Volta →'}
      </button>

      <p style={{ fontSize: '11px', color: '#444', textAlign: 'center', margin: 0 }}>
        By joining you agree to our{' '}
        <a href="/terms" style={{ color: '#666' }}>Terms</a>
        {' '}and{' '}
        <a href="/privacy" style={{ color: '#666' }}>Privacy Policy</a>
      </p>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #2a2a2a',
  background: '#0f0f0f',
  color: '#fff',
  fontSize: '15px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}
