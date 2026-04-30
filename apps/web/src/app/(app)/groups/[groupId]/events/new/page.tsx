import { CreateEventForm } from '@/components/events/create-event-form'
import { getGroupWithMembers } from '@/lib/actions/groups'

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  const group = await getGroupWithMembers(groupId)
  return (
    <CreateEventForm
      groupId={groupId}
      groupName={group?.name}
      groupType={(group as any)?.group_type ?? 'recurring'}
      interests={(group as any)?.interests ?? []}
      themeColor={(group as any)?.theme_color ?? '#7F77DD'}
      memberCount={group?.group_members?.length ?? 0}
    />
  )
}