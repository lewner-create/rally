import { getWeeklyAvailability } from '@/lib/actions/availability'
import { getCalendarConnection } from '@/lib/actions/google-calendar'
import { getMyBlocks } from '@/lib/actions/availability-blocks'
import { AvailabilityPicker } from '@/components/availability/availability-picker'
import { CalendarSyncBanner } from '@/components/availability/calendar-sync-banner'
import { BusyTimesPanel } from '@/components/availability/busy-times-panel'

export const metadata = { title: 'Availability – Rally' }

export default async function AvailabilityPage() {
  const [weekly, { connected }, blocks] = await Promise.all([
    getWeeklyAvailability(),
    getCalendarConnection(),
    getMyBlocks(),
  ])

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <CalendarSyncBanner connected={connected} />
        <AvailabilityPicker initial={weekly} inline blocks={blocks} />
        <BusyTimesPanel initialBlocks={blocks} />
      </div>
    </div>
  )
}
