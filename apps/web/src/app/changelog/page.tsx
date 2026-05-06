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

type Tag = 'launch' | 'feature' | 'design' | 'fix' | 'infra'

const TAG_STYLES: Record<Tag, { bg: string; color: string; label: string }> = {
  launch:  { bg: 'rgba(232,182,90,0.15)',  color: '#e8b65a', label: '🚀 Launch'  },
  feature: { bg: 'rgba(127,119,221,0.15)', color: '#7F77DD', label: '✨ Feature'  },
  design:  { bg: 'rgba(95,207,138,0.15)',  color: '#5fcf8a', label: '🎨 Design'   },
  fix:     { bg: 'rgba(220,90,90,0.15)',   color: '#e87070', label: '🔧 Fix'      },
  infra:   { bg: 'rgba(90,180,220,0.15)',  color: '#5db4e8', label: '⚙️ Infra'    },
}

const entries: {
  date: string
  version: string
  title: string
  tag: Tag
  items: string[]
}[] = [
  {
    date: 'May 15, 2026',
    version: 'v1.0',
    title: 'Beta launch',
    tag: 'launch',
    items: [
      'Volta is live — closed beta open to invited users',
      'Request access flow: name + email form, admin approval panel',
      'Founders accounts: all beta users get Founders accounts (free Volta+ for life)',
      'User invite system: 5 invite credits per account',
      'Admin panel at /admin for managing access requests',
    ],
  },
  {
    date: 'May 5, 2026',
    version: 'v0.11',
    title: 'Mobile-first redesign + onboarding tour',
    tag: 'design',
    items: [
      'Full responsive pass — every page works on mobile',
      'Mobile sidebar drawer with hamburger navigation',
      'Messages hub: drill-down nav (thread list → chat) on mobile',
      'New onboarding intro screen: "Get your crew set up in 30 seconds"',
      'Dashboard tour: 4-step guided walkthrough on first login',
      'Repeat tour anytime from Settings',
      'Plan form: auto-populates name from type + time selection',
      'Plan form: success screen after submitting ("It\'s out there!")',
      'Best window CTA on dashboard replaces generic "Round up the crew"',
    ],
  },
  {
    date: 'April 22, 2026',
    version: 'v0.10',
    title: 'Rebrand to Volta + production deploy',
    tag: 'infra',
    items: [
      'Rebranded from Rally to Volta across all pages and assets',
      'Deployed to Vercel at volta-closed-beta.vercel.app',
      'Google OAuth sign-in and sign-up',
      'Real live stats on landing page (users, groups, events)',
      'New favicon, icon, and OG image',
      'Fixed 7 TypeScript build errors blocking deployment',
    ],
  },
  {
    date: 'April 8, 2026',
    version: 'v0.9',
    title: 'Post-event Moments + RSVP questionnaires',
    tag: 'feature',
    items: [
      'Moments: post-event photo upload and gallery with lightbox',
      'RSVP questionnaires: custom questions per event, answered on RSVP',
      'Events auto-transition to completed state after end time',
      'Photo uploads go to Supabase Storage (fixed body-size limit bug)',
    ],
  },
  {
    date: 'March 20, 2026',
    version: 'v0.8',
    title: 'Group availability + unread tracking',
    tag: 'feature',
    items: [
      'Group-scoped availability: free windows per group, no cross-group leakage',
      'markGroupRead: last_read_at tracked per member',
      'Unread badge on group chat drawer',
      'Sidebar active state highlighting on group subpages',
      'Group page left panel dark treatment',
    ],
  },
  {
    date: 'March 4, 2026',
    version: 'v0.7',
    title: 'Dashboard redesign + DMs',
    tag: 'design',
    items: [
      'Dashboard redesign: hero plan card, "Needs you" section, "What\'s brewing" list',
      'Direct messages: searchable DM threads, realtime updates',
      'Messages hub: unified sidebar with groups and DMs',
      'Settings page: notifications toggles, sign out',
      'Full dark pass across all pages',
    ],
  },
  {
    date: 'February 18, 2026',
    version: 'v0.6',
    title: 'Plan cards + open windows engine',
    tag: 'feature',
    items: [
      'Plan cards: "Check who\'s in" polls sent to group chat',
      'Voting: yes / maybe / can\'t with live response counts',
      'Lock it in: converts a plan card to a confirmed event',
      'Open windows engine v2: reads weekly availability, shows avatar stacks',
      'Best window hero card on group page',
    ],
  },
  {
    date: 'February 3, 2026',
    version: 'v0.5',
    title: 'Events, RSVP + group chat',
    tag: 'feature',
    items: [
      'Event creation: 7 event types, date/time pickers, banner upload',
      'RSVP: yes / maybe / no with avatar stacks',
      'Event detail page: two-column layout with sticky chat panel',
      'Group chat: realtime messaging via Supabase Realtime',
      'Per-event chat threads',
      'Invite links: fun slug format (e.g. five-pods-of-dolphins)',
      'Join via invite link: handles both logged-out and logged-in flows',
    ],
  },
  {
    date: 'January 20, 2026',
    version: 'v0.4',
    title: 'Availability v2 + group creation wizard',
    tag: 'feature',
    items: [
      'Availability v2: weekly drag grid, mark free by hour',
      'Preset-based availability: 6 presets with smart summary',
      'Group creation wizard: theme color, banner, description, interest chips',
      'Group name generator: 100 names across 5 vibe categories',
      'Banner picker: 18 gradient templates + custom upload',
    ],
  },
  {
    date: 'January 6, 2026',
    version: 'v0.1',
    title: 'Initial build',
    tag: 'infra',
    items: [
      'Next.js 15 + Supabase + TypeScript monorepo scaffolded',
      'Auth: sign up, sign in, sign out, protected routes',
      'Groups: create, invite members, join via link',
      'Profiles: avatar upload, display name, username, bio',
      'Onboarding flow',
      'Design system: violet, teal, coral, sand color ramps',
      'Sidebar navigation with group switcher',
    ],
  },
]

export const metadata = { title: 'Changelog — Volta' }

export default function ChangelogPage() {
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

      {/* Header */}
      <section style={{ padding: '72px 24px 48px', maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px', color: T.text }}>Changelog</h1>
        <p style={{ fontSize: 16, color: T.dim, margin: 0, lineHeight: 1.6 }}>
          Everything we've shipped, from first commit to beta launch.
        </p>
      </section>

      {/* Entries */}
      <section style={{ padding: '0 24px 100px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ position: 'relative' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: 0, top: 8, bottom: 0, width: 1, background: T.border }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
            {entries.map((entry, i) => {
              const tag = TAG_STYLES[entry.tag]
              return (
                <div key={i} style={{ paddingLeft: 28, position: 'relative' }}>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: -5, top: 6,
                    width: 11, height: 11, borderRadius: '50%',
                    background: i === 0 ? T.amber : T.violet,
                    border: `2px solid ${T.bg}`,
                    boxShadow: i === 0 ? '0 0 12px rgba(232,182,90,0.6)' : 'none',
                  }} />

                  {/* Date + version */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: T.mute, fontWeight: 500 }}>{entry.date}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: T.mute, background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 5 }}>{entry.version}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: tag.bg, color: tag.color }}>{tag.label}</span>
                  </div>

                  <h2 style={{ margin: '0 0 14px', fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>
                    {entry.title}
                  </h2>

                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {entry.items.map((item, j) => (
                      <li key={j} style={{ display: 'flex', gap: 10, fontSize: 14, color: T.dim, lineHeight: 1.5 }}>
                        <span style={{ color: T.mute, flexShrink: 0, marginTop: 1 }}>—</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

    </div>
  )
}
