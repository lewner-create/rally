export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type WeeklyAvailability = Record<DayKey, number[]>

export function defaultWeekly(): WeeklyAvailability {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
}