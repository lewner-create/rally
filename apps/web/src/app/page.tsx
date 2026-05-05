import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing/landing-page'

export const metadata = {
  title: 'Volta - Find when the whole crew is free',
  description: 'A low-effort home base for your friend group. Drop your free times, see when everyone overlaps, lock in a hang.',
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const [
    { count: userCount },
    { count: groupCount },
    { count: eventCount },
    { count: blockCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('groups').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('availability_blocks').select('*', { count: 'exact', head: true }),
  ])

  const stats = {
    groups:     fmt(groupCount ?? 0),
    users:      fmt(userCount ?? 0),
    events:     fmt(eventCount ?? 0),
    freeBlocks: fmt(blockCount ?? 0),
  }

  return <LandingPage stats={stats} />
}
