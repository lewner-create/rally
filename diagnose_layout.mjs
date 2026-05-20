import { readFileSync } from 'fs'
const content = readFileSync('apps/web/src/app/(app)/layout.tsx', 'utf8')
console.log(content)