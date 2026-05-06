import Link from 'next/link'

const T = {
  bg:     '#0f0f0f',
  bgElev: '#17171a',
  border: 'rgba(255,255,255,0.08)',
  text:   '#f5f4f8',
  dim:    '#a8a4b8',
  mute:   '#6b6878',
  violet: '#7F77DD',
  green:  '#5fcf8a',
  amber:  '#e8b65a',
}

const freeFeatures = [
  'Up to 3 groups',
  'Availability grid',
  'Open windows engine',
  'Plan cards (check who\'s in)',
  'Group & event chat',
  'RSVP + event pages',
  'Invite links',
  'Mobile-ready',
]

const plusFeatures = [
  'Everything in Free',
  'Unlimited groups',
  'Post-event Moments (photos)',
  'RSVP questionnaires',
  'Calendar sync (Google, Apple)',
  'Priority support',
  'Early access to new features',
  '💜 Founder badge on your profile',
]

export const metadata = { title: 'Pricing — Volta' }

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, background: 'rgba(15,15,15,0.85)', backdropFilter: 'blur(14px)', zIndex: 10 }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 700, color: T.violet, textDecoration: 'none', letterSpacing: '-0.025em' }}>volta</Link>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" style={{ fontSize: 14, color: T.mute, textDecoration: 'none', padding: '8px 14px' }}>Log in</Link>
          <Link href="/request-access" style={{ background: T.violet, color: '#fff', textDecoration: 'none', padding: '8px 16px', borderRadius: 9, fontSize: 13.5, fontWeight: 600 }}>Request access</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 24px 60px', maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 16px', color: T.text }}>
          Simple pricing.
        </h1>
        <p style={{ fontSize: 17, color: T.dim, lineHeight: 1.6, margin: 0 }}>
          Free during beta. Founders who join now get Volta+ for life — no catch, no expiry.
        </p>
      </section>

      {/* Beta banner */}
      <section style={{ padding: '0 24px 48px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{
          padding: '20px 28px', borderRadius: 16,
          background: 'rgba(232,182,90,0.10)', border: '1px solid rgba(232,182,90,0.3)',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 28 }}>🎁</span>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 3 }}>
              Beta = free Volta+ for life
            </div>
            <div style={{ fontSize: 13.5, color: T.dim, lineHeight: 1.5 }}>
              Everyone who joins during the beta gets a Founders account — full Volta+ access, permanently. When we launch paid plans, you're grandfathered in forever.
            </div>
          </div>
          <Link href="/request-access" style={{ background: T.amber, color: '#111', textDecoration: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            Join the beta →
          </Link>
        </div>
      </section>

      {/* Pricing cards */}
      <section style={{ padding: '0 24px 80px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>

          {/* Free */}
          <div style={{ padding: '32px', borderRadius: 20, background: T.bgElev, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.mute, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Free</div>
              <div style={{ fontSize: 42, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', lineHeight: 1 }}>$0</div>
              <div style={{ fontSize: 13, color: T.mute, marginTop: 4 }}>forever</div>
            </div>
            <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {freeFeatures.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: T.dim }}>
                  <span style={{ color: T.green, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/request-access" style={{ marginTop: 'auto', display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10, border: `1px solid ${T.border}`, color: T.dim, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              Get started free
            </Link>
          </div>

          {/* Volta+ */}
          <div style={{
            padding: '32px', borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(127,119,221,0.18) 0%, #17171a 70%)',
            border: '1px solid rgba(127,119,221,0.4)',
            display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 16, right: 16, background: T.violet, color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 99, letterSpacing: '0.04em' }}>
              BETA = FREE
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.violet, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Volta+</div>
              <div style={{ fontSize: 42, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', lineHeight: 1 }}>$7.99 / mo</div>
              <div style={{ fontSize: 13, color: T.mute, marginTop: 4 }}>after beta · founders get it free</div>
            </div>
            <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plusFeatures.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: f.startsWith('Everything') ? T.mute : T.dim }}>
                  <span style={{ color: T.violet, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/request-access" style={{ marginTop: 'auto', display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10, background: T.violet, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 16px rgba(127,119,221,0.35)' }}>
              Join beta — get Volta+ free →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '0 24px 100px', maxWidth: 680, margin: '0 auto' }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 28, color: T.text }}>
          Common questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { q: 'What happens when beta ends?', a: "Everyone who joined during beta keeps their Volta+ access, permanently. We'll introduce a paid plan for new users after launch — beta users are grandfathered in at no cost." },
            { q: 'Do I need a credit card to join?', a: 'No. Volta is completely free during beta. No credit card, no trial period, no gotcha.' },
            { q: 'How many people can be in a group?', a: 'Up to 8 people per group on the Free plan. Volta+ increases this limit — exact numbers coming soon.' },
            { q: 'What is Volta+?', a: "Volta+ is our paid tier coming after beta. It adds unlimited groups, post-event photo albums, calendar sync, and more. Beta users get it free as a Founders account, forever." },
          ].map((item, i) => (
            <div key={i} style={{ padding: '20px 0', borderBottom: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: T.text }}>{item.q}</h3>
              <p style={{ margin: 0, fontSize: 14, color: T.dim, lineHeight: 1.6 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
