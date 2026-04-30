import Link from 'next/link'
import { Users } from 'lucide-react'

const TIER_LABELS = ['Free', 'Tier 1', 'Tier 2', 'Rally+'] as const

interface GroupCardProps {
  group: {
    id: string
    name: string
    tier: number
    boost_count: number
  }
  role: 'admin' | 'member'
  memberCount?: number
}

export function GroupCard({ group, role, memberCount }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`} className="block group">
      <div className="bg-card border border-border rounded-xl px-5 py-4 transition-colors hover:border-[var(--rally-primary-border)] hover:bg-secondary/40 cursor-pointer">

        {/* Name + badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[15px] font-medium leading-tight">{group.name}</span>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {group.tier > 0 && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded"
                style={{
                  background: 'var(--rally-primary-surface)',
                  color: 'var(--rally-primary-text)',
                }}
              >
                {TIER_LABELS[group.tier]}
              </span>
            )}
            {role === 'admin' && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded"
                style={{
                  background: 'var(--rally-primary-surface)',
                  color: 'var(--rally-primary-text)',
                }}
              >
                admin
              </span>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span>{memberCount ?? '—'} members</span>
        </div>

      </div>
    </Link>
  )
}
