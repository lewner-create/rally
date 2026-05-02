import { CreateEventForm } from '@/components/events/create-event-form'
import { getGroupWithMembers } from '@/lib/actions/groups'

export default async function NewEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>
  searchParams: Promise<{ type?: string; date?: string; start?: string; end?: string }>
}) {
  const { groupId } = await params
  const sp = await searchParams

  const group = await getGroupWithMembers(groupId)

  return (
    <CreateEventForm
      groupId={groupId}
      groupName={group?.name}
      groupType={(group as any)?.group_type ?? 'recurring'}
      interests={(group as any)?.interests ?? []}
      themeColor={(group as any)?.theme_color ?? '#7F77DD'}
      memberCount={group?.group_members?.length ?? 0}
      // Prefill from nudge button
      prefillType={sp.type}
      prefillDate={sp.date}
      prefillStart={sp.start}
      prefillEnd={sp.end}
    />
  )
}
