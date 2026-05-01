'use client'

import { useState } from 'react'
import EventDetails from '@/components/events/event-details'
import MomentsTab from '@/components/events/moments-tab'

type Member = {
  id: string
  display_name: string | null
  username: string
}

type Props = {
  eventId: string
  eventType: string
  members: Member[]
  isCreator: boolean
  isCompleted: boolean
  aboutSlot: React.ReactNode
}

type TabId = 'about' | 'details' | 'moments'

export default function EventTabs({ eventId, eventType, members, isCreator, isCompleted, aboutSlot }: Props) {
  const [active, setActive] = useState<TabId>('about')

  const tabs: { id: TabId; label: string }[] = [
    { id: 'about',   label: 'About' },
    { id: 'details', label: 'Costs & details' },
    ...(isCompleted ? [{ id: 'moments' as TabId, label: '📷 Moments' }] : []),
  ]

  return (
    <div>
      {/* Tab strip */}
      <div className="flex border-b mb-5" style={{ borderColor: '#1e1e1e' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              active === tab.id ? 'text-white' : 'text-[#555] hover:text-[#999]'
            }`}
          >
            {tab.label}
            {active === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {active === 'about' && (
        <div>{aboutSlot}</div>
      )}
      {active === 'details' && (
        <EventDetails
          eventId={eventId}
          eventType={eventType}
          members={members}
          isCreator={isCreator}
          readOnly={isCompleted}
        />
      )}
      {active === 'moments' && isCompleted && (
        <MomentsTab eventId={eventId} />
      )}
    </div>
  )
}
