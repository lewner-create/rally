import { getWeeklyAvailability } from '@/lib/actions/availability'
import { AvailabilityPicker } from '@/components/availability/availability-picker'

export const metadata = { title: 'Availability – Rally' }

export default async function AvailabilityPage() {
  const weekly = await getWeeklyAvailability()
  return <AvailabilityPicker initial={weekly} />
}
