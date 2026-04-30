import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/actions/profile'
import { SettingsForm } from '@/components/settings/settings-form'

export const metadata = { title: 'Settings – Rally' }

export default async function SettingsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  return <SettingsForm profile={profile} />
}
