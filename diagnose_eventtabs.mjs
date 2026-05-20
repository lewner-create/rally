import { readFileSync } from 'fs'
const content = readFileSync('apps/web/src/components/events/event-tabs.tsx', 'utf8')
console.log(content)