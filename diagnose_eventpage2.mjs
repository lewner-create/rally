import { readFileSync } from 'fs'
const lines = readFileSync('apps/web/src/app/(app)/events/[eventId]/page.tsx', 'utf8').split('\n')
lines.forEach((l, i) => {
  if (i >= 150 && i <= 215) console.log(`  ${i+1}: ${l}`)
})