import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getGroupWithMembers } from '@/lib/actions/groups'
import CreatePlanForm from '@/components/plans/create-plan-form'

type Props = { params: Promise<{ groupId: string }> }

export default async function NewPlanPage({ params }: Props) {
  const { groupId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const group = await getGroupWithMembers(groupId)
  if (!group) notFound()

  return (
    <CreatePlanForm
      groupId={groupId}
      groupName={group.name}
      themeColor={(group as any).theme_color ?? '#7F77DD'}
    />
  )
}
