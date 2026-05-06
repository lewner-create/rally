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

const features = [
  {
    emoji: '👥',
    title: 'Groups for every crew',
    body: 'Create a group for each part of your life — your gaming crew, your hiking friends, your college group. Each group has its own availability, chat, and plans. Nothing bleeds between them.',
    accent: T.violet,
  },
  {
    emoji: '🗓',
    title: 'Set your free time once',
    body: "Mark when you're usually around each week. Not your full calendar — just rough availability. Takes 30 seconds. Volta remembers it for every group you're in.",
    accent: '#5db4e8',
  },
  {
    emoji: '⚡',
    title: 'See when everyone overlaps',
    body: "Volta cross-references availability across your whole group and surfaces the windows where most people are free. No polling, no back-and-forth. It just shows you when to go.",
    accent: T.green,
  },
  {
    emoji: '👋',
    title: 'Check who\'s in',
    body: "Not sure if everyone can make it? Send a plan card to the group. They say yes, maybe, or can't — right in the chat. Once you have enough people, lock it in.",
    accent: T.amber,
  },
  {
    emoji: '📅',
    title: 'Lock in confirmed plans',
    body: 'Create a real event with a date, time, and type. Invite the group, collect RSVPs, track who\'s going. Game nights, day trips, vacations — it handles all of them.',
    accent: '#e85a7d',
  },
  {
    emoji: '💬',
    title: 'Chat that actually helps',
    body: 'Every group has a chat. Every event has its own thread. Plan cards show up inline — vote without leaving the conversation. No app-switching, no separate threads.',
    accent: '#b66adb',
  },
  {
    emoji: '📸',
    title: 'Moments after the hang',
    body: 'Once an event ends, it becomes a memory. Upload photos, drop a recap. Your group can look back at what you\'ve done together, not just what\'s coming up.',
    accent: T.amber,
  },
  {
    emoji: '📱',
    title: 'Works great on mobile',
    body: 'Fully responsive — the whole app works on your phone without a native install. iOS and Android apps are coming, but you don\'t need them to get started.',
    accent: T.green,
  },
]

export const metadata = { title: 'Features — Volta' }

export default function FeaturesPage() {
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
      <section style={{ textAlign: 'center', padding: '80px 24px 60px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: 'rgba(127,119,221,0.12)', border: '1px solid rgba(127,119,221,0.3)', fontSize: 12, color: T.violet, fontWeight: 600, marginBottom: 24 }}>
          ✨ Everything included, free during beta
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 20px', color: T.text }}>
          Built for the way friends actually plan.
        </h1>
        <p style={{ fontSize: 18, color: T.dim, lineHeight: 1.6, margin: '0 auto', maxWidth: 540 }}>
          No spreadsheets. No "anyone free this weekend?" texts. Just a simple place to see when your people are around and make something happen.
        </p>
      </section>

      {/* Feature grid */}
      <section style={{ padding: '20px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              padding: '28px', borderRadius: 20,
              background: T.bgElev, border: `1px solid ${T.border}`,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {f.emoji}
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>
                  {f.title}
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: T.dim, lineHeight: 1.6 }}>
                  {f.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 24px 100px' }}>
        <div style={{
          maxWidth: 700, margin: '0 auto', textAlign: 'center',
          padding: '60px 40px', borderRadius: 24,
          background: 'radial-gradient(80% 100% at 50% 0%, rgba(127,119,221,0.3), transparent 70%), linear-gradient(135deg, #1d1640, #2a1a3e)',
          border: '1px solid rgba(127,119,221,0.35)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
          <h2 style={{ margin: '0 0 12px', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: T.text }}>
            Ready to actually hang out?
          </h2>
          <p style={{ margin: '0 0 28px', fontSize: 16, color: T.dim }}>
            Request access and we'll send you an invite.
          </p>
          <Link href="/request-access" style={{ background: T.violet, color: '#fff', textDecoration: 'none', padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700, display: 'inline-block', boxShadow: '0 8px 24px rgba(127,119,221,0.4)' }}>
            Request early access →
          </Link>
        </div>
      </section>

    </div>
  )
}
