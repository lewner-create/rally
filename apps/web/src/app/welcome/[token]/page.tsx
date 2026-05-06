import { Metadata } from 'next'
import { lookupInviteToken } from '@/lib/actions/invites'
import { InviteSignupForm } from './invite-signup-form'
import Link from 'next/link'

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const result = await lookupInviteToken(token)
  if (!result.valid) return { title: 'Invalid invite — Volta' }
  const title = result.groupName
    ? `${result.inviterName} invited you to join ${result.groupName}`
    : `${result.inviterName} invited you to Volta`
  return { title: `${title} — Volta` }
}

export default async function WelcomePage({ params }: Props) {
  const { token } = await params
  const result = await lookupInviteToken(token)

  if (!result.valid) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔗</div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>
            Invite unavailable
          </h1>
          <p style={{ fontSize: '15px', color: '#666', margin: '0 0 32px', lineHeight: 1.5 }}>
            {result.error ?? 'This invite link is no longer valid.'}
          </p>
          <Link
            href="/request-access"
            style={{
              display: 'inline-block', padding: '12px 28px',
              borderRadius: '9999px', background: '#7F77DD',
              color: '#fff', fontSize: '14px', fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Request access instead
          </Link>
        </div>
      </div>
    )
  }

  const groupColor  = result.groupColor ?? '#7F77DD'
  const accentColor = result.groupName ? groupColor : '#7F77DD'

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${accentColor}22 0%, #0a0a0a 60%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{
            fontSize: '28px', fontWeight: 500,
            letterSpacing: '-0.04em', color: '#7F77DD',
          }}>
            volta
          </span>
        </div>

        {/* Invitation card */}
        <div style={{
          background: '#161616',
          border: '1px solid #2a2a2a',
          borderRadius: '20px',
          overflow: 'hidden',
        }}>
          {/* Group banner (if group-scoped) */}
          {result.groupName && result.groupBanner && (
            <div style={{
              height: '80px',
              backgroundImage: `url(${result.groupBanner})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
          )}
          {result.groupName && !result.groupBanner && (
            <div style={{
              height: '80px',
              background: `linear-gradient(135deg, ${groupColor}88, ${groupColor}44)`,
            }} />
          )}

          <div style={{ padding: '28px 32px 32px' }}>
            {/* Inviter avatar */}
            <div style={{
              textAlign: 'center',
              marginTop: result.groupName ? '-44px' : '0',
              marginBottom: '16px',
            }}>
              {result.inviterAvatar ? (
                <img
                  src={result.inviterAvatar}
                  alt={result.inviterName}
                  style={{
                    width: '64px', height: '64px',
                    borderRadius: '50%',
                    border: `3px solid ${accentColor}`,
                    objectFit: 'cover',
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              ) : (
                <div style={{
                  width: '64px', height: '64px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', fontWeight: 700, color: '#fff',
                  margin: '0 auto',
                  border: `3px solid ${accentColor}66`,
                }}>
                  {(result.inviterName ?? '?')[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Headline */}
            <h1 style={{
              textAlign: 'center',
              fontSize: '20px', fontWeight: 800,
              color: '#fff', margin: '0 0 8px',
              lineHeight: 1.3,
            }}>
              {result.groupName
                ? <>{result.inviterName} invited you to join <span style={{ color: accentColor }}>{result.groupName}</span></>
                : <>{result.inviterName} invited you to Volta</>
              }
            </h1>

            <p style={{
              textAlign: 'center',
              fontSize: '14px', color: '#666',
              margin: '0 0 28px', lineHeight: 1.55,
            }}>
              {result.groupName
                ? `Sign up and you'll be added to ${result.groupName} automatically.`
                : 'Join Volta — set your free time, see when everyone\'s available, lock in plans.'
              }
            </p>

            {/* Signup form */}
            <InviteSignupForm token={token} />
          </div>
        </div>

        <p style={{
          textAlign: 'center', fontSize: '13px',
          color: '#444', marginTop: '20px',
        }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#7F77DD', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
