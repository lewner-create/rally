import { Crown } from 'lucide-react'

interface Member {
  id: string
  user_id: string
  role: 'admin' | 'member'
  is_backing: boolean
  profiles: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }
}

interface MemberListProps {
  members: Member[]
  currentUserId: string
}

// Dark-themed avatar colors — tinted dark backgrounds with legible initials
const AV_COLORS = [
  { bg: '#2d2b4a', color: '#a5a0f0' },
  { bg: '#1e3530', color: '#6ecfa8' },
  { bg: '#2e2a24', color: '#c4aa80' },
  { bg: '#3a2020', color: '#e07e6a' },
]

export function MemberList({ members, currentUserId }: MemberListProps) {
  const sorted = [...members].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1
    if (b.role === 'admin' && a.role !== 'admin') return 1
    return 0
  })

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {sorted.map((member, i) => {
        const p        = member.profiles
        const name     = p.display_name ?? p.username ?? 'Unknown'
        const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
        const isYou    = member.user_id === currentUserId
        const av       = AV_COLORS[i % AV_COLORS.length]

        return (
          <li key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0' }}>
            {/* Avatar */}
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              flexShrink: 0, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: p.avatar_url ? 'transparent' : av.bg,
              fontSize: '11px', fontWeight: 700, color: av.color,
            }}>
              {p.avatar_url
                ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>

            {/* Name + username */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{
                  fontSize: '13px', fontWeight: 500,
                  color: '#e0e0e0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {name}
                </span>
                {isYou && (
                  <span style={{ fontSize: '11px', color: '#555', flexShrink: 0 }}>(you)</span>
                )}
              </div>
              {p.username && (
                <p style={{ fontSize: '11px', color: '#555', margin: 0, lineHeight: 1.4 }}>
                  @{p.username}
                </p>
              )}
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {member.role === 'admin' && (
                <Crown style={{ width: '14px', height: '14px', color: '#EF9F27' }} />
              )}
              {member.is_backing && (
                <span style={{
                  fontSize: '10px', fontWeight: 600,
                  padding: '2px 6px', borderRadius: '4px',
                  background: '#2d2b4a', color: '#a5a0f0',
                }}>
                  boosted
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
