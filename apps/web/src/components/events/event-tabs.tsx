'use client'

import { useState } from 'react'
import EventDetails from '@/components/events/event-details'
import { MomentsTab } from '@/components/events/moments-tab'
import type { EventPhoto } from '@/lib/actions/photos'

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
  currentUserId: string
  initialPhotos: EventPhoto[]
  aboutSlot: React.ReactNode
}

const TABS = [
  { id: 'about',   label: 'About'          },
  { id: 'details', label: 'Costs & details' },
  { id: 'moments', label: '📸 Moments'      },
] as const

type TabId = typeof TABS[number]['id']

export default function EventTabs({
  eventId, eventType, members, isCreator,
  currentUserId, initialPhotos, aboutSlot,
}: Props) {
  const [active, setActive] = useState<TabId>('about')

  return (
    <div>
      {/* Tab strip */}
      <div className="flex border-b mb-5" style={{ borderColor: '#1e1e1e' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              active === tab.id ? 'text-white' : 'text-[#555] hover:text-[#999]'
            }`}
          >
            {tab.label}
            {tab.id === 'moments' && initialPhotos.length > 0 && active !== 'moments' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '16px', height: '16px', borderRadius: '50%',
                background: '#7F77DD', color: '#fff',
                fontSize: '9px', fontWeight: 800,
                marginLeft: '5px', verticalAlign: 'middle',
              }}>
                {initialPhotos.length}
              </span>
            )}
            {active === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {active === 'about' && <div>{aboutSlot}</div>}

      {active === 'details' && (
        <EventDetails
          eventId={eventId}
          eventType={eventType}
          members={members}
          isCreator={isCreator}
        />
      )}

      {active === 'moments' && (
        <MomentsTab
          eventId={eventId}
          currentUserId={currentUserId}
          initialPhotos={initialPhotos}
        />
      )}
    </div>
  )
}
