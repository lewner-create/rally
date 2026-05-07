'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { requestAccess } from '@/lib/actions/access'

const accent = '#7F77DD'

export default function RequestAccessClient() {
  const searchParams = useSearchParams()
  const bounced      = searchParams.get('error') === 'not_approved'

  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone]   = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await requestAccess(email, name)
      if (result.error) setError(result.error)
      else setDone(true)
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #1C1B1A 0%, #2C2C2A 50%, #26215C 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-96px', right: '-96px', width: '288px', height: '288px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-96px', left: '-96px', width: '288px', height: '288px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,158,117,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ marginBottom: 28 }}>
        <Link href="/" style={{ fontSize: 28, fontWeight: 700, color: accent, textDecoration: 'none', letterSpacing: '-0.03em' }}>
          volta
        </Link>
      </div>

      <div style={{ width: '100%', maxWidth: '360px', background: '#fff', borderRadius: 20, padding: '32px', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>Ã°Å¸Å½â°</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 10px' }}>
              You're on the list!
            </h2>
            <p style={{ fontSize: 14, color: '#777', lineHeight: 1.6, margin: '0 0 24px' }}>
              We'll send an invite to <strong style={{ color: '#333' }}>{email}</strong> when your spot is ready.
            </p>
            <Link href="/" style={{ fontSize: 13, color: accent, textDecoration: 'none', fontWeight: 500 }}>Ã¢â Â Back to home</Link>
          </div>
        ) : (
          <>
            {bounced && (
              <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 10, padding: '12px 14px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>Ã°Å¸ââ</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 2 }}>Volta is invite-only right now</div>
                  <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>Your account wasn't found on the access list. Request access below and we'll reach out when your spot is ready.</div>
                </div>
              </div>
            )}

            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 6px' }}>
              {bounced ? 'Request access' : 'Request early access'}
            </h1>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 24px', lineHeight: 1.5 }}>
              Volta is in closed beta. Drop your details and we'll reach out when your spot is ready.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div style={{ background: '#FAECE7', color: '#712B13', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>{error}</div>
              )}
              <div>
                <label style={labelStyle}>Name</label>
                <input autoFocus required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = accent)} onBlur={e => (e.target.style.borderColor = '#e5e5e5')} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = accent)} onBlur={e => (e.target.style.borderColor = '#e5e5e5')} />
              </div>
              <button type="submit" disabled={isPending || !name.trim() || !email.trim()} style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: (name.trim() && email.trim()) ? accent : '#e5e5e5',
                color: (name.trim() && email.trim()) ? '#fff' : '#aaa',
                fontSize: 14, fontWeight: 700,
                cursor: (name.trim() && email.trim()) ? 'pointer' : 'default',
                fontFamily: 'inherit', marginTop: 4,
                boxShadow: (name.trim() && email.trim()) ? '0 4px 14px rgba(127,119,221,0.4)' : 'none',
                opacity: isPending ? 0.7 : 1, transition: 'all 0.15s',
              }}>
                {isPending ? 'SendingÃ¢â¬Â¦' : 'Request access Ã¢â â'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 20 }}>
              Already have access?{' '}
              <Link href="/login" style={{ color: accent, textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#888',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid #e5e5e5', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', color: '#111',
  background: '#fafafa', transition: 'border-color 0.15s',
}

