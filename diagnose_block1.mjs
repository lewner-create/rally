import { readFileSync } from 'fs'

const files = [
  'apps/web/src/app/auth/callback/route.ts',
  'apps/web/src/app/(app)/dashboard/page.tsx',
  'apps/web/src/components/groups/member-list.tsx',
]

for (const path of files) {
  const lines = readFileSync(path, 'utf8').split('\n')
  console.log('\n=== ' + path + ' ===')
  lines.forEach((line, i) => {
    if (
      line.includes('isInvited') ||
      line.includes('email_confirmed') ||
      line.includes('display_name') ||
      line.includes('onboarded') ||
      line.includes('boost') ||
      line.includes('is_backing') ||
      line.includes('is_rally_plus')
    ) {
      console.log(`  ${i + 1}: ${line}`)
    }
  })
}