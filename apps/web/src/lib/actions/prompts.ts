'use server'

import { createClient } from '@/lib/supabase/server'
import { getOpenWindows } from './windows'

export interface ProactivePrompt {
  message:    string
  windowDate: string   // ISO date
  windowStart: string  // "18:00"
  windowEnd:   string  // "21:00"
  windowLabel: string
  freeCount:  number
}

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getTimeLabel(start: Date): string {
  const now      = new Date()
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const winDay   = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const diffDays = Math.round((winDay.getTime() - today.getTime()) / 86_400_000)
  const h        = start.getHours()
  const period   = h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'

  if (diffDays === 0) return h >= 17 ? 'tonight' : `this ${period}`
  if (diffDays === 1) return `tomorrow ${period}`
  return `${DAYS[start.getDay()].toLowerCase()} ${period}`
}

function buildMessage(label: string, freeCount: number, totalCount: number): string {
  const isAll = freeCount === totalCount

  if (isAll && freeCount === 2) return `You and 1 other are free ${label}. Start something?`
  if (isAll) return `Everyone's free ${label}. Start something?`
  if (freeCount === 3) return `You and 2 others are free ${label}. Start something?`
  return `${freeCount} people are free ${label}. Start something?`
}

function pad(n: number) { return String(n).padStart(2, '0') }

export async function getProactivePrompt(groupId: string): Promise<ProactivePrompt | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check current user is a member
  const { data: membership } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return null

  const windows = await getOpenWindows(groupId)
  if (!windows.length) return null

  // Only trigger if current user is in the free window
  const qualifying = windows.filter(w =>
    w.availableCount >= 3 &&
    w.availableUserIds.includes(user.id)
  )

  if (!qualifying.length) return null

  const best  = qualifying[0]
  const label = getTimeLabel(best.start)
  const d     = best.start

  return {
    message:     buildMessage(label, best.availableCount, best.totalCount),
    windowDate:  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    windowStart: `${pad(d.getHours())}:00`,
    windowEnd:   `${pad(best.end.getHours())}:00`,
    windowLabel: `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()} · ${label}`,
    freeCount:   best.availableCount,
  }
}
