import { readFileSync } from 'fs'

const files = [
  'apps/web/src/lib/actions/check-conflicts.ts',
  'apps/web/src/components/events/create-event-form.tsx',
]

for (const path of files) {
  try {
    const lines = readFileSync(path, 'utf8').split('\n')
    console.log('\n=== ' + path + ' ===')
    lines.forEach((line, i) => {
      if (
        line.includes('conflict') ||
        line.includes('Conflict') ||
        line.includes('Saving') ||
        line.includes('Lock it in') ||
        line.includes('neq') ||
        line.includes('group_id') ||
        line.includes('starts_at') ||
        line.includes('ends_at')
      ) {
        console.log(`  ${i + 1}: ${line}`)
      }
    })
  } catch(e) {
    console.log('FILE NOT FOUND: ' + path)
  }
}