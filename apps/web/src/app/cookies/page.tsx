import Link from 'next/link'

export const metadata = { title: 'Cookies Policy — Volta' }

const s = {
  page: { minHeight: '100vh', background: '#fafafa', color: '#111', fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif' } as React.CSSProperties,
  nav:  { padding: '16px 40px', borderBottom: '1px solid #e5e5e5', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
  logo: { fontSize: 20, fontWeight: 700, color: '#7F77DD', textDecoration: 'none', letterSpacing: '-0.025em' } as React.CSSProperties,
  body: { maxWidth: 680, margin: '0 auto', padding: '56px 24px 100px' } as React.CSSProperties,
  h1:   { fontSize: 34, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 8px', color: '#111' } as React.CSSProperties,
  meta: { fontSize: 13, color: '#999', margin: '0 0 48px' } as React.CSSProperties,
  h2:   { fontSize: 18, fontWeight: 700, color: '#111', margin: '36px 0 10px' } as React.CSSProperties,
  p:    { fontSize: 15, color: '#444', lineHeight: 1.75, margin: '0 0 14px' } as React.CSSProperties,
  ul:   { paddingLeft: 20, margin: '0 0 14px' } as React.CSSProperties,
  li:   { fontSize: 15, color: '#444', lineHeight: 1.75, marginBottom: 6 } as React.CSSProperties,
}

export default function CookiesPage() {
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link href="/" style={s.logo}>volta</Link>
        <Link href="/request-access" style={{ fontSize: 13, background: '#7F77DD', color: '#fff', textDecoration: 'none', padding: '7px 14px', borderRadius: 8, fontWeight: 600 }}>Request access</Link>
      </nav>

      <div style={s.body}>
        <h1 style={s.h1}>Cookies Policy</h1>
        <p style={s.meta}>Last updated: May 15, 2026 · Volta Labs LLC · United States</p>

        <p style={s.p}>This Cookies Policy explains how Volta Labs LLC ("we," "us," or "our") uses cookies and similar technologies when you use the Volta Service. By using the Service, you consent to our use of cookies as described in this policy.</p>

        <h2 style={s.h2}>1. What are cookies?</h2>
        <p style={s.p}>Cookies are small text files stored on your device by your browser when you visit a website. They allow the site to remember information about your visit, like your login status or preferences. Cookies cannot access or modify files on your device beyond the data they store.</p>

        <h2 style={s.h2}>2. What cookies do we use?</h2>
        <p style={s.p}><strong>Strictly necessary cookies</strong></p>
        <p style={s.p}>These cookies are required for the Service to function. Without them, you cannot log in or use the app. We use the following strictly necessary cookies:</p>
        <ul style={s.ul}>
          <li style={s.li}><strong>sb-access-token</strong> — Stores your Supabase authentication session. Required to keep you logged in. Expires when your session ends.</li>
          <li style={s.li}><strong>sb-refresh-token</strong> — Used to refresh your authentication session without requiring you to log in again. Expires after 60 days.</li>
        </ul>
        <p style={s.p}>These cookies are set by Supabase, our authentication provider, and are essential to the operation of the Service. They cannot be disabled without breaking core functionality.</p>

        <p style={s.p}><strong>Functional cookies</strong></p>
        <p style={s.p}>We use local storage (a browser feature similar to cookies) to remember UI preferences, such as whether you have dismissed a notification banner. This data stays on your device and is never sent to our servers.</p>

        <p style={s.p}><strong>Analytics cookies</strong></p>
        <p style={s.p}>We do not currently use third-party analytics cookies. If this changes, we will update this policy and notify you.</p>

        <p style={s.p}><strong>Advertising cookies</strong></p>
        <p style={s.p}>We do not use advertising cookies. We do not serve ads on Volta.</p>

        <h2 style={s.h2}>3. Third-party cookies</h2>
        <p style={s.p}>If you sign in using Google OAuth, Google may set its own cookies as part of the authentication flow. These are governed by Google's Privacy Policy, not ours. We do not have control over cookies set by third-party services.</p>

        <h2 style={s.h2}>4. Managing cookies</h2>
        <p style={s.p}>You can control cookies through your browser settings. Most browsers allow you to block, delete, or restrict cookies. However, blocking the authentication cookies listed above will prevent you from logging in to Volta.</p>
        <p style={s.p}>To manage cookies in popular browsers:</p>
        <ul style={s.ul}>
          <li style={s.li}><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
          <li style={s.li}><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
          <li style={s.li}><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
        </ul>

        <h2 style={s.h2}>5. Changes to this policy</h2>
        <p style={s.p}>We may update this policy as we add new features or change our technology stack. We will notify you of material changes via email or an in-app notice.</p>

        <h2 style={s.h2}>6. Contact</h2>
        <p style={s.p}>Questions about cookies? Contact us at <strong>privacy@voltaapp.com</strong>.</p>
      </div>
    </div>
  )
}
