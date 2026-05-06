import Link from 'next/link'

export const metadata = { title: 'Terms of Service — Volta' }

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

export default function TermsPage() {
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link href="/" style={s.logo}>volta</Link>
        <Link href="/request-access" style={{ fontSize: 13, background: '#7F77DD', color: '#fff', textDecoration: 'none', padding: '7px 14px', borderRadius: 8, fontWeight: 600 }}>Request access</Link>
      </nav>

      <div style={s.body}>
        <h1 style={s.h1}>Terms of Service</h1>
        <p style={s.meta}>Last updated: May 15, 2026 · Volta Labs LLC · United States</p>

        <p style={s.p}>These Terms of Service ("Terms") govern your use of the Volta application and website (the "Service") operated by Volta Labs LLC ("we," "us," or "our"). By accessing or using the Service, you agree to be bound by these Terms.</p>

        <h2 style={s.h2}>1. Eligibility</h2>
        <p style={s.p}>You must be at least 13 years old to use the Service. By using the Service, you represent that you meet this requirement. If you are under 18, you must have your parent or guardian's permission.</p>

        <h2 style={s.h2}>2. Accounts</h2>
        <p style={s.p}>You are responsible for maintaining the security of your account and for all activities that occur under it. You must provide accurate information when creating your account and keep it up to date. You may not share your account with others or use another person's account without permission.</p>

        <h2 style={s.h2}>3. Acceptable use</h2>
        <p style={s.p}>You agree not to use the Service to:</p>
        <ul style={s.ul}>
          <li style={s.li}>Post or share content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.</li>
          <li style={s.li}>Impersonate any person or entity.</li>
          <li style={s.li}>Attempt to gain unauthorized access to any part of the Service or another user's account.</li>
          <li style={s.li}>Use the Service in any way that could disrupt, damage, or impair it.</li>
          <li style={s.li}>Use automated tools to scrape, crawl, or extract data from the Service without our written permission.</li>
          <li style={s.li}>Violate any applicable laws or regulations.</li>
        </ul>

        <h2 style={s.h2}>4. Content</h2>
        <p style={s.p}>You retain ownership of content you submit to the Service, including messages, photos, and group information. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, store, and display that content solely to operate and improve the Service.</p>
        <p style={s.p}>You are solely responsible for the content you submit. We do not monitor all content but reserve the right to remove any content that violates these Terms.</p>

        <h2 style={s.h2}>5. Beta service</h2>
        <p style={s.p}>Volta is currently in beta. The Service is provided "as is" without any guarantees of availability, performance, or data retention. Features may change, be removed, or be unavailable without notice during beta. We will make reasonable efforts to preserve your data, but cannot guarantee it.</p>

        <h2 style={s.h2}>6. Paid features</h2>
        <p style={s.p}>The Service is currently free during beta. Users who join during the beta period ("Founders") will receive access to Volta+ features at no charge, permanently, as a thank-you for participating in beta. We reserve the right to introduce paid plans for new users after the beta period ends. Founders will not be charged retroactively.</p>

        <h2 style={s.h2}>7. Termination</h2>
        <p style={s.p}>You may delete your account at any time through the Settings page. We may suspend or terminate your account if you violate these Terms or engage in conduct harmful to other users or the Service. Upon termination, your right to use the Service ends immediately.</p>

        <h2 style={s.h2}>8. Disclaimer of warranties</h2>
        <p style={s.p}>The Service is provided "as is" and "as available" without warranty of any kind. To the fullest extent permitted by law, we disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>

        <h2 style={s.h2}>9. Limitation of liability</h2>
        <p style={s.p}>To the fullest extent permitted by law, Volta Labs LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability for any claim shall not exceed $100 USD.</p>

        <h2 style={s.h2}>10. Governing law</h2>
        <p style={s.p}>These Terms are governed by the laws of the United States and the state of Delaware, without regard to conflict of law principles. Any disputes shall be resolved in the courts located in Delaware.</p>

        <h2 style={s.h2}>11. Changes to these Terms</h2>
        <p style={s.p}>We may update these Terms from time to time. We will notify you of material changes via email or a notice within the app. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>

        <h2 style={s.h2}>12. Contact</h2>
        <p style={s.p}>Questions about these Terms? Contact us at <strong>legal@voltaapp.com</strong>.</p>
      </div>
    </div>
  )
}
