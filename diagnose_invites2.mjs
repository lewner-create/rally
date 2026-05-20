import { readFileSync, existsSync } from 'fs'

const files = [
  'apps/web/src/lib/actions/guest-invites.ts',
  'apps/web/src/middleware.ts',
]

for (const path of files) {
  if (existsSync(path)) {
    const lines = readFileSync(path, 'utf8').split('\n')
    console.log(`\n=== ${path} (${lines.length} lines) ===`)
    console.log(lines.join('\n'))
  } else {
    console.log(`\nMISSING: ${path}`)
  }
}

// Also list what guest-related files exist anywhere
import { readdirSync } from 'fs'
function findFiles(dir, pattern) {
  let results = []
  try {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const full = dir + '/' + f.name
      if (f.isDirectory() && !f.name.startsWith('.') && f.name !== 'node_modules') {
        results = results.concat(findFiles(full, pattern))
      } else if (f.isFile() && f.name.includes(pattern)) {
        results.push(full)
      }
    }
  } catch(e) {}
  return results
}
console.log('\n=== Guest-related files ===')
findFiles('apps/web/src', 'guest').forEach(f => console.log(' ', f))