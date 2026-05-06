export const metadata = { title: 'Privacy Policy — Volta' }

const s = {
  page:    { minHeight: '100vh', background: '#fafafa', color: '#111', fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif' } as React.CSSProperties,
  nav:     { padding: '16px 40px', borderBottom: '1px solid #e5e5e5', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
  logo:    { fontSize: 20, fontWeight: 700, color: '#7F77DD', textDecoration: 'none', letterSpacing: '-0.025em' } as React.CSSProperties,
  body:    { maxWidth: 680, margin: '0 auto', padding: '56px 24px 100px' } as React.CSSProperties,
  h1:      { fontSize: 34, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 8px', color: '#111' } as React.CSSProperties,
  meta:    { fontSize: 13, color: '#999', margin: '0 0 48px' } as React.CSSProperties,
  h2:      { fontSize: 18, fontWeight: 700, color: '#111', margin: '36px 0 10px' } as React.CSSProperties,
  p:       { fontSize: 15, color: '#444', lineHeight: 1.75, margin: '0 0 14px' } as React.CSSProperties,
  ul:      { paddingLeft: 20, margin: '0 0 14px' } as React.CSSProperties,
  li:      { fontSize: 15, color: '#444', lineHeight: 1.75, marginBottom: 6 } as React.CSSProperties,
}

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link href="/" style={s.logo}>volta</Link>
        <Link href="/request-access" style={{ fontSize: 13, background: '#7F77DD', color: '#fff', textDecoration: 'none', padding: '7px 14px', borderRadius: 8, fontWeight: 600 }}>Request access</Link>
      </nav>

      <div style={s.body}>
        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={s.meta}>Last updated: May 15, 2026 · Volta Labs LLC · United States</p>

        <p style={s.p}>This Privacy Policy describes how Volta Labs LLC ("Volta," "we," "us," or "our") collects, uses, and shares information about you when you use our website and application (collectively, the "Service"). By using the Service, you agree to this policy.</p>

        <h2 style={s.h2}>1. Information we collect</h2>
        <p style={s.p}><strong>Information you provide directly:</strong></p>
        <ul style={s.ul}>
          <li style={s.li}>Account information: name, email address, username, profile photo, and bio when you create an account.</li>
          <li style={s.li}>Availability data: the days and times you mark as free in the app.</li>
          <li style={s.li}>Group and event content: group names, event details, chat messages, and photos you share.</li>
        </ul>
        <p style={s.p}><strong>Information collected automatically:</strong></p>
        <ul style={s.ul}>
          <li style={s.li}>Log data: IP address, browser type, pages visited, and timestamps when you use the Service.</li>
          <li style={s.li}>Device information: device type, operating system, and browser version.</li>
          <li style={s.li}>Cookies and similar technologies: session cookies used for authentication. See our Cookies Policy for details.</li>
        </ul>
        <p style={s.p}><strong>Information from third parties:</strong></p>
        <ul style={s.ul}>
          <li style={s.li}>If you sign in with Google, we receive your name, email address, and profile picture from Google.</li>
          <li style={s.li}>If you connect Google Calendar, we receive read access to your calendar events to populate availability. We do not store raw calendar event data — we only process it to generate availability blocks.</li>
        </ul>

        <h2 style={s.h2}>2. How we use your information</h2>
        <ul style={s.ul}>
          <li style={s.li}>To operate and provide the Service, including matching availability across your groups.</li>
          <li style={s.li}>To send transactional emails (account confirmation, invite links, password reset).</li>
          <li style={s.li}>To improve the Service through anonymized usage analytics.</li>
          <li style={s.li}>To respond to support requests.</li>
          <li style={s.li}>To comply with legal obligations.</li>
        </ul>
        <p style={s.p}>We do not sell your personal data. We do not use your data to serve you advertising.</p>

        <h2 style={s.h2}>3. How we share your information</h2>
        <p style={s.p}>We share your information only in the following circumstances:</p>
        <ul style={s.ul}>
          <li style={s.li}><strong>With other users:</strong> your display name, username, profile photo, and availability are visible to members of groups you join.</li>
          <li style={s.li}><strong>Service providers:</strong> we use Supabase for database hosting and authentication, and Vercel for application hosting. These providers process data on our behalf under data processing agreements.</li>
          <li style={s.li}><strong>Legal requirements:</strong> we may disclose information if required by law or to protect the rights and safety of our users.</li>
          <li style={s.li}><strong>Business transfers:</strong> if Volta is acquired or merges with another entity, your information may be transferred as part of that transaction.</li>
        </ul>

        <h2 style={s.h2}>4. Data retention</h2>
        <p style={s.p}>We retain your data for as long as your account is active. You may delete your account at any time, which will delete your personal data within 30 days, except where we are required to retain it for legal reasons.</p>

        <h2 style={s.h2}>5. Your rights</h2>
        <p style={s.p}>Depending on where you are located, you may have the right to:</p>
        <ul style={s.ul}>
          <li style={s.li}>Access the personal data we hold about you.</li>
          <li style={s.li}>Correct inaccurate data.</li>
          <li style={s.li}>Request deletion of your data.</li>
          <li style={s.li}>Export your data in a portable format.</li>
        </ul>
        <p style={s.p}>To exercise any of these rights, contact us at <strong>privacy@voltaapp.com</strong>.</p>

        <h2 style={s.h2}>6. Children's privacy</h2>
        <p style={s.p}>Volta is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe we have collected data from a child under 13, contact us immediately.</p>

        <h2 style={s.h2}>7. Security</h2>
        <p style={s.p}>We use industry-standard security measures including encryption at rest and in transit, row-level security on our database, and secure authentication. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>

        <h2 style={s.h2}>8. Changes to this policy</h2>
        <p style={s.p}>We may update this policy from time to time. We will notify you of material changes via email or a notice within the app. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>

        <h2 style={s.h2}>9. Contact</h2>
        <p style={s.p}>Questions about this policy? Contact us at <strong>privacy@voltaapp.com</strong> or write to: Volta Labs LLC, United States.</p>
      </div>
    </div>
  )
}
