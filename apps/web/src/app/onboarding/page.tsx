import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/actions/profile'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export const metadata = { title: 'Welcome to Rally' }

export default async function OnboardingPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.preferences?.onboarded) redirect('/dashboard')

  return <OnboardingFlow profile={profile} />
}
