import { readFileSync } from 'fs'
const files = [
  'apps/web/src/components/events/guest-messages-tab.tsx',
  'apps/web/src/components/events/invite-guests-panel.tsx',
  'apps/web/src/lib/guest-invite-config.ts',
]
for (const path of files) {
  const lines = readFileSync(path, 'utf8').split('\n')
  console.log(`\n=== ${path} (${lines.length} lines) ===`)
  console.log(lines.join('\n'))
}