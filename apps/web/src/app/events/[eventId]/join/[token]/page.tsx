import { notFound } from 'next/navigation'
import { getEventByToken } from '@/lib/actions/guest-invites'
import GuestEventView from '@/components/events/guest-event-view'

type Props = { params: Promise<{ eventId: string; token: string }> }

export default async function GuestJoinPage({ params }: Props) {
  const { eventId, token } = await params
  const data = await getEventByToken(token)

  if (!data) notFound()

  if (data.invite.status === 'declined') {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-white font-semibold text-lg mb-2">This invite is no longer valid</p>
          <p className="text-[#555] text-sm">The invite has been revoked by the host.</p>
        </div>
      </div>
    )
  }

  return <GuestEventView data={data} token={token} />
}
