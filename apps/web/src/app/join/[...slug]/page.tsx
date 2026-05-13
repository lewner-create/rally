import { lookupInviteToken } from '@/lib/actions/invites'
import { joinGroupByToken, joinGroupBySlug } from '@/lib/actions/groups'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Join Group — Volta' }

interface Props {
  params: Promise<{ slug: string[] }>
}

export default async function JoinPage({ params }: Props) {
  const { slug } = await params

  const isNewFormat = slug.length >= 2
  const groupSlug   = isNewFormat ? slug[0] : null
  const token       = isNewFormat ? slug[1] : slug[0]

  const invite = await lookupInviteToken(token)

  if (!invite.valid) {
    return (
      <div style={centerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={headingStyle}>Invite not found</h2>
          <p style={subStyle}>This link is invalid or has expired.</p>
          <Link href="/dashboard" style={btnSecondaryStyle}>Go to dashboard</Link>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const groupName = invite.groupName ?? 'this group'
  const nextPath  = isNewFormat ? `/join/${groupSlug}/${token}` : `/join/${token}`
  const accentColor = invite.groupColor ?? '#7F77DD'

  return (
    <div style={{ ...centerStyle, background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${accentColor}22 0%, #0a0a0a 60%)` }}>
      <div style={{ maxWidth: '420px', width: '100%', padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.04em', color: '#7F77DD' }}>volta</span>
        </div>
        <div style={cardStyle}>
          {invite.groupName && (
            <div style={{ height: '80px', background: `linear-gradient(135deg, ${accentColor}88, ${accentColor}44)`, margin: '-44px -40px 0', borderRadius: '20px 20px 0 0' }} />
          )}
          <div style={{ padding: invite.groupName ? '28px 0 0' : '0' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', textAlign: 'center' }}>
              You’re invited
            </p>
            <h2 style={{ ...headingStyle, color: accentColor }}>{groupName}</h2>
            <p style={subStyle}>{invite.inviterName} invited you to join {groupName} on Volta.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
              {user ? (
                <form action={async () => {
                  'use server'
                  if (isNewFormat) {
                    await joinGroupBySlug(groupSlug!, token)
                  } else {
                    await joinGroupByToken(token)
                  }
                }}>
                  <button type="submit" style={{ ...btnPrimaryStyle, background: accentColor }}>
                    Join {groupName} →
                  </button>
                </form>
              ) : (
                <>
                  <Link href={`/login?next=${nextPath}`} style={{ ...btnPrimaryStyle, background: accentColor }}>
                    Sign in to join
                  </Link>
                  <Link href={`/signup?next=${nextPath}`} style={btnSecondaryStyle}>
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#444', marginTop: '20px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#7F77DD', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

const centerStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center',
  justifyContent: 'center', background: '#0a0a0a',
}
const cardStyle: React.CSSProperties = {
  background: '#161616', borderRadius: '20px', padding: '32px 40px',
  width: '100%', textAlign: 'center', border: '1px solid #2a2a2a',
}
const headingStyle: React.CSSProperties = {
  fontSize: '24px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.3px',
}
const subStyle: React.CSSProperties = {
  fontSize: '14px', color: '#666', margin: 0, lineHeight: 1.6,
}
const btnPrimaryStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '13px 24px',
  borderRadius: '9999px', background: '#7F77DD', color: 'white',
  textDecoration: 'none', fontWeight: 700, fontSize: '15px',
  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  boxSizing: 'border-box', textAlign: 'center',
}
const btnSecondaryStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '13px 24px',
  borderRadius: '9999px', background: 'transparent', color: '#888',
  textDecoration: 'none', fontWeight: 600, fontSize: '15px',
  border: '1.5px solid #333', cursor: 'pointer', fontFamily: 'inherit',
  boxSizing: 'border-box', textAlign: 'center',
}
