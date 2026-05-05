import { getInvitePreview, getInvitePreviewBySlug, joinGroupByToken, joinGroupBySlug } from '@/lib/actions/groups'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Join Group — Rally' }

interface Props {
  params: Promise<{ slug: string[] }>
}

export default async function JoinPage({ params }: Props) {
  const { slug } = await params

  // Two formats:
  // /join/[hextoken]           → slug.length === 1, old format
  // /join/[groupSlug]/[token]  → slug.length === 2, new fun slug format
  const isNewFormat = slug.length >= 2
  const groupSlug   = isNewFormat ? slug[0] : null
  const token       = isNewFormat ? slug[1] : slug[0]

  const invite = isNewFormat
    ? await getInvitePreviewBySlug(groupSlug! as string, token)
    : await getInvitePreview(token)

  if (!invite) {
    return (
      <div style={centerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💀</div>
          <h2 style={headingStyle}>Invite not found</h2>
          <p style={subStyle}>This link is invalid or has expired.</p>
          <Link href="/dashboard" style={btnSecondaryStyle}>Go to dashboard</Link>
        </div>
      </div>
    )
  }

  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const g = invite.groups as any
  const groupName = (Array.isArray(g) ? g[0]?.name : g?.name) ?? 'this group'
  const nextPath  = isNewFormat ? `/join/${groupSlug}/${token}` : `/join/${token}`

  return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
          You're invited
        </p>
        <h2 style={headingStyle}>{groupName}</h2>
        <p style={subStyle}>Join this group on Rally to coordinate hangouts and events.</p>

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
              <button type="submit" style={btnPrimaryStyle}>
                Join {groupName} →
              </button>
            </form>
          ) : (
            <>
              <Link href={`/login?next=${nextPath}`} style={btnPrimaryStyle}>
                Sign in to join
              </Link>
              <Link href={`/signup?next=${nextPath}`} style={btnSecondaryStyle}>
                Create account
              </Link>
            </>
          )}
        </div>

        <p style={{ fontSize: '12px', color: '#ccc', marginTop: '16px' }}>
          Expires {new Date(invite.expires_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const centerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: '#F1EFE8',
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '24px',
  padding: '44px 40px',
  maxWidth: '380px',
  width: '100%',
  textAlign: 'center',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
}

const headingStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#111',
  margin: '0 0 8px',
  letterSpacing: '-0.3px',
}

const subStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#999',
  margin: 0,
  lineHeight: 1.6,
}

const btnPrimaryStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '13px 24px',
  borderRadius: '9999px',
  background: '#7F77DD',
  color: 'white',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '15px',
  boxShadow: '0 4px 20px rgba(127,119,221,0.4)',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  textAlign: 'center',
}

const btnSecondaryStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '13px 24px',
  borderRadius: '9999px',
  background: 'white',
  color: '#555',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '15px',
  border: '1.5px solid #e5e5e5',
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  textAlign: 'center',
}
