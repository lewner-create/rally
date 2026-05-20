import { readFileSync } from 'fs'
const content = readFileSync('apps/web/src/app/(app)/events/[eventId]/page.tsx', 'utf8')
const lines = content.split('\n')
console.log(`Total lines: ${lines.length}`)
lines.forEach((l, i) => {
  if (
    l.includes('guest') || l.includes('Guest') ||
    l.includes('invite') || l.includes('Invite') ||
    l.includes('tab') || l.includes('Tab') ||
    l.includes('import')
  ) console.log(`  ${i+1}: ${l}`)
})