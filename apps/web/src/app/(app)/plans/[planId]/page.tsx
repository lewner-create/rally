import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PlanCardDetail from '@/components/plans/plan-card-detail'

type Props = { params: Promise<{ planId: string }> }

export default async function PlanPage({ params }: Props) {
  const { planId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load the plan card
  const { data: card, error } = await supabase
    .from('plan_cards')
    .select(`
      id, title, event_type, proposed_date, proposed_start, proposed_end,
      status, event_id, created_by, group_id,
      groups ( id, name, slug, theme_color )
    `)
    .eq('id', planId)
    .single()

  if (error || !card) notFound()

  // Load responses
  const { data: responses } = await supabase
    .from('plan_card_responses')
    .select('user_id, response, profiles(id, display_name, username, avatar_url)')
    .eq('plan_card_id', planId)

  // Load group members
  const { data: memberships } = await supabase
    .from('group_members')
    .select('profiles(id, display_name, username, avatar_url)')
    .eq('group_id', card.group_id)

  const members = (memberships ?? [])
    .map((m) => m.profiles)
    .filter(Boolean) as { id: string; display_name: string | null; username: string; avatar_url: string | null }[]

  const isCreator = card.created_by === user.id
  const userResponse = (responses ?? []).find((r) => r.user_id === user.id)?.response ?? null

  return (
    <PlanCardDetail
      card={card as any}
      responses={responses as any ?? []}
      members={members}
      currentUserId={user.id}
      isCreator={isCreator}
      userResponse={userResponse}
    />
  )
}
