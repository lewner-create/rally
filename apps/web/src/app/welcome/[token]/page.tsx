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
  return {
    title: result.valid
      ? `${result.inviterName} invited you to Volta`
      : 'Invalid invite — Volta',
  }
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
        <div style={{
          maxWidth: '400px', width: '100%', textAlign: 'center',
        }}>
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
              display: 'inline-block',
              padding: '12px 28px', borderRadius: '9999px',
              background: '#7F77DD', color: '#fff',
              fontSize: '14px', fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Request access instead
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(127,119,221,0.14) 0%, #0a0a0a 60%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>

        {/* Volta wordmark */}
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
          padding: '32px',
        }}>
          {/* Inviter avatar */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            {result.inviterAvatar ? (
              <img
                src={result.inviterAvatar}
                alt={result.inviterName}
                style={{
                  width: '64px', height: '64px',
                  borderRadius: '50%',
                  border: '3px solid #7F77DD',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                width: '64px', height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7F77DD, #5B9BD5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', fontWeight: 700, color: '#fff',
                margin: '0 auto',
                border: '3px solid rgba(127,119,221,0.4)',
              }}>
                {(result.inviterName ?? '?')[0].toUpperCase()}
              </div>
            )}
          </div>

          <h1 style={{
            textAlign: 'center',
            fontSize: '20px', fontWeight: 800,
            color: '#fff', margin: '0 0 8px',
            lineHeight: 1.3,
          }}>
            {result.inviterName} invited you
          </h1>
          <p style={{
            textAlign: 'center',
            fontSize: '14px', color: '#666',
            margin: '0 0 28px', lineHeight: 1.55,
          }}>
            Join Volta — the app for actually doing things with your crew. Set your free time, see when everyone's available, lock in plans.
          </p>

          {/* Signup form */}
          <InviteSignupForm token={token} />
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '13px', color: '#444',
          marginTop: '20px',
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
