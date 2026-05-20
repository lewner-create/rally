import { readFileSync, writeFileSync } from 'fs'

const fixes = [
  {
    path: 'apps/web/src/app/auth/callback/route.ts',
    find: `user.user_metadata?.invited === true ||\n                  user.app_metadata?.provider === 'email' && user.email_confirmed_at`,
    replace: `user.user_metadata?.invited === true ||\n                  (user.app_metadata?.provider === 'email' && !!user.email_confirmed_at)`,
  },
  {
    path: 'apps/web/src/app/(app)/dashboard/page.tsx',
    find: `if (!profile?.display_name || !profile?.preferences?.onboarded) redirect('/onboarding')`,
    replace: `if (!profile?.preferences?.onboarded) redirect('/onboarding')`,
  },
  {
    path: 'apps/web/src/components/groups/member-list.tsx',
    find: `  boost_status: boolean`,
    replace: `  is_backing: boolean`,
  },
  {
    path: 'apps/web/src/components/groups/member-list.tsx',
    find: `{member.boost_status && (`,
    replace: `{member.is_backing && (`,
  },
]

for (const { path, find, replace } of fixes) {
  const content = readFileSync(path, 'utf8')
  if (!content.includes(find)) {
    console.log(`SKIP: ${path} — string not found`)
    continue
  }
  writeFileSync(path, content.replace(find, replace), 'utf8')
  console.log(`FIXED: ${path}`)
}