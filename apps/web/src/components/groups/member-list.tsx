import { Crown } from 'lucide-react'

interface Member {
  id: string
  user_id: string
  role: 'admin' | 'member'
  boost_status: boolean
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

const AV_COLORS = [
  { bg: '#EEEDFE', color: '#3C3489' },
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#F1EFE8', color: '#444441' },
  { bg: '#FAECE7', color: '#712B13' },
]

export function MemberList({ members, currentUserId }: MemberListProps) {
  const sorted = [...members].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1
    if (b.role === 'admin' && a.role !== 'admin') return 1
    return 0
  })

  return (
    <ul className="space-y-1">
      {sorted.map((member, i) => {
        const p = member.profiles
        const name = p.display_name ?? p.username ?? 'Unknown'
        const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
        const isYou = member.user_id === currentUserId
        const av = AV_COLORS[i % AV_COLORS.length]

        return (
          <li key={member.id} className="flex items-center gap-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
              style={{ background: av.bg, color: av.color }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">{name}</span>
                {isYou && (
                  <span className="text-xs text-muted-foreground">(you)</span>
                )}
              </div>
              {p.username && (
                <p className="text-xs text-muted-foreground">@{p.username}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {member.role === 'admin' && (
                <Crown className="h-3.5 w-3.5" style={{ color: '#EF9F27' }} />
              )}
              {member.boost_status && (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{ background: '#EEEDFE', color: '#3C3489' }}
                >
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
