import { readFileSync } from 'fs'

// Full check-conflicts
const cc = readFileSync('apps/web/src/lib/actions/check-conflicts.ts', 'utf8')
console.log('\n=== check-conflicts.ts (full) ===')
console.log(cc)

// Mojibake scan on key files
const scanFiles = [
  'apps/web/src/components/groups/nudge-button.tsx',
  'apps/web/src/components/availability/availability-picker.tsx',
  'apps/web/src/components/calendar-sync-banner.tsx',
]
console.log('\n=== MOJIBAKE SCAN ===')
for (const path of scanFiles) {
  try {
    const content = readFileSync(path, 'utf8')
    const badLines = content.split('\n').map((l,i) => [i+1,l]).filter(([,l]) => /[\u0080-\u00ff]/.test(l))
    if (badLines.length) {
      console.log('\nBAD: ' + path)
      badLines.forEach(([n,l]) => console.log(`  ${n}: ${l}`))
    } else {
      console.log('OK: ' + path)
    }
  } catch(e) { console.log('NOT FOUND: ' + path) }
}