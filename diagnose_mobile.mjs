import { readFileSync } from 'fs'
const content = readFileSync('apps/web/src/components/layout/mobile-layout-wrapper.tsx', 'utf8')
console.log(content)