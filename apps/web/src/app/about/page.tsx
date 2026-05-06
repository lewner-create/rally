import Link from 'next/link'

const T = {
  bg:     '#0f0f0f',
  bgElev: '#17171a',
  border: 'rgba(255,255,255,0.08)',
  text:   '#f5f4f8',
  dim:    '#a8a4b8',
  mute:   '#6b6878',
  violet: '#7F77DD',
}

export const metadata = { title: 'About — Volta' }

export default function AboutPage() {
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

      <section style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px 100px' }}>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg, ${T.violet}, #b66adb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: '#fff' }}>V</div>
          <span style={{ fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: '-0.025em' }}>volta</span>
        </div>

        <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 32px', color: T.text }}>
          We built this because we kept talking about hanging out and never actually doing it.
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 17, color: T.dim, lineHeight: 1.7, margin: 0 }}>
            Every friend group has the same problem. Someone says "we should do something this weekend." Everyone agrees. Then the thread goes quiet. You spend three days figuring out who's free, pick a time that half the group can't make, and eventually someone says "next weekend?" It never happens.
          </p>
          <p style={{ fontSize: 17, color: T.dim, lineHeight: 1.7, margin: 0 }}>
            Volta exists to fix that. Not with complicated scheduling tools, not with AI suggestions, not with yet another calendar integration. Just a simple answer to a simple question: when is everyone actually free?
          </p>
          <p style={{ fontSize: 17, color: T.dim, lineHeight: 1.7, margin: 0 }}>
            You mark when you're roughly available. Volta shows when your group lines up. You pick a time, see who's in, and lock it in. That's it.
          </p>
        </div>

        <div style={{
          margin: '48px 0',
          padding: '28px 32px', borderRadius: 18,
          background: `linear-gradient(135deg, rgba(127,119,221,0.15) 0%, ${T.bgElev} 70%)`,
          border: `1px solid rgba(127,119,221,0.3)`,
        }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 10px', letterSpacing: '-0.01em' }}>
            Our mission
          </p>
          <p style={{ fontSize: 16, color: T.dim, lineHeight: 1.7, margin: 0 }}>
            Make it as easy as possible for friends to spend time together in real life. Every feature we build starts with one question: does this help people actually hang out?
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 17, color: T.dim, lineHeight: 1.7, margin: 0 }}>
            Volta is built by a small team that got tired of the same problem in our own friend groups. We're not trying to replace texting, or social media, or any of that. We're just trying to answer the question that always starts a hang: "when is everyone free?"
          </p>
          <p style={{ fontSize: 17, color: T.dim, lineHeight: 1.7, margin: 0 }}>
            We're currently in closed beta. If you want in, request access below.
          </p>
        </div>

        <div style={{ marginTop: 48 }}>
          <Link href="/request-access" style={{ background: T.violet, color: '#fff', textDecoration: 'none', padding: '14px 26px', borderRadius: 12, fontSize: 15, fontWeight: 700, display: 'inline-block', boxShadow: '0 8px 24px rgba(127,119,221,0.35)' }}>
            Request early access →
          </Link>
        </div>

      </section>
    </div>
  )
}
