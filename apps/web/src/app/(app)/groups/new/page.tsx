import { CreateGroupForm } from '@/components/groups/create-group-form'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'New group — Rally' }

export default async function NewGroupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_podium, boost_count')
    .eq('id', user?.id ?? '')
    .single()

  return (
    <CreateGroupForm
      isPodium={profile?.is_podium ?? false}
      boostCount={profile?.boost_count ?? 0}
    />
  )
}
