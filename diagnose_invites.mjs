import { readFileSync, existsSync } from 'fs'

const files = [
  'apps/web/src/app/events/[eventId]/join/[token]/page.tsx',
  'apps/web/src/lib/actions/event-invites.ts',
  'apps/web/src/lib/resend.ts',
  'apps/web/src/components/events/guest-event-view.tsx',
  'apps/web/src/components/events/invite-guests-modal.tsx',
]

for (const path of files) {
  if (existsSync(path)) {
    const lines = readFileSync(path, 'utf8').split('\n')
    console.log(`\n=== ${path} (${lines.length} lines) ===`)
    lines.slice(0, 40).forEach((l, i) => console.log(`  ${i+1}: ${l}`))
    if (lines.length > 40) console.log(`  ... (${lines.length - 40} more lines)`)
  } else {
    console.log(`\nMISSING: ${path}`)
  }
}