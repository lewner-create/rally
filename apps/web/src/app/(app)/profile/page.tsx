import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/actions/profile'
import { ProfileForm } from '@/components/profile/profile-form'

export const metadata = { title: 'Profile — Rally' }

export default async function ProfilePage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  return <ProfileForm profile={profile} />
}