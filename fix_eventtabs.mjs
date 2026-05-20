import { readFileSync, writeFileSync } from 'fs'

const path = 'apps/web/src/components/events/event-tabs.tsx'
let c = readFileSync(path, 'utf8')

// Fix 1: Moments tab label leading space
c = c.replace(
  `{ id: 'moments',  label: ' Moments'   }`,
  `{ id: 'moments',  label: 'Moments'    }`
)

// Fix 2: Remove duplicate ExpensesTab render + fix guests tab visibility
c = c.replace(
  `      {active === 'guests' && isCreator && (
          <GuestMessagesTab eventId={eventId} />
        )}
        {active === 'expenses' && (
          <ExpensesTab eventId={eventId} members={members} currentUserId={currentUserId} />
        )}
        {active === 'expenses' && (
          <ExpensesTab eventId={eventId} members={members} currentUserId={currentUserId} />
        )}`,
  `      {active === 'guests' && isCreator && (
          <GuestMessagesTab eventId={eventId} />
        )}
        {active === 'expenses' && (
          <ExpensesTab eventId={eventId} members={members} currentUserId={currentUserId} />
        )}`
)

// Fix 3: Hide Guests tab for non-creators in the tab strip
c = c.replace(
  `        {TABS.map((tab) => (
          <button`,
  `        {TABS.filter(tab => tab.id !== 'guests' || isCreator).map((tab) => (
          <button`
)

writeFileSync(path, c, 'utf8')
console.log('FIXED: event-tabs.tsx')