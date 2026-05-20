import { readFileSync, writeFileSync } from 'fs'

// ── 1. middleware.ts — add /welcome + guest join path ──────────────
{
  const path = 'apps/web/src/middleware.ts'
  let c = readFileSync(path, 'utf8')

  c = c.replace(
    `const PUBLIC_PATHS = ['/', '/login', '/signup', '/auth/callback', '/join', '/invite', '/request-access', '/features', '/pricing', '/changelog', '/about', '/privacy', '/terms', '/cookies']`,
    `const PUBLIC_PATHS = ['/', '/login', '/signup', '/auth/callback', '/join', '/invite', '/request-access', '/welcome', '/features', '/pricing', '/changelog', '/about', '/privacy', '/terms', '/cookies']`
  )

  c = c.replace(
    `  const isOnboarding = request.nextUrl.pathname.startsWith(ONBOARDING_PATH)`,
    `  const isOnboarding  = request.nextUrl.pathname.startsWith(ONBOARDING_PATH)
  const isGuestJoin   = /^\\/events\\/[^/]+\\/join\\/[^/]+/.test(request.nextUrl.pathname)`
  )

  c = c.replace(
    `  if (!user && !isPublicPath && !isOnboarding) {`,
    `  if (!user && !isPublicPath && !isOnboarding && !isGuestJoin) {`
  )

  writeFileSync(path, c, 'utf8')
  console.log('FIXED: middleware.ts')
}

// ── 2. guest-invite-config.ts — add APP_URL ────────────────────────
{
  const path = 'apps/web/src/lib/guest-invite-config.ts'
  let c = readFileSync(path, 'utf8')
  if (!c.includes('APP_URL')) {
    c = c.trimEnd() + '\nexport const APP_URL = \'https://volta-closed-beta.vercel.app\'\n'
    writeFileSync(path, c, 'utf8')
    console.log('FIXED: guest-invite-config.ts — APP_URL added')
  } else {
    console.log('SKIP: guest-invite-config.ts — APP_URL already present')
  }
}

// ── 3. guest-event-view.tsx — swap APP_URL import ─────────────────
{
  const path = 'apps/web/src/components/events/guest-event-view.tsx'
  let c = readFileSync(path, 'utf8')
  if (c.includes(`import { APP_URL } from '@/lib/resend'`)) {
    c = c.replace(
      `import { APP_URL } from '@/lib/resend'`,
      `import { APP_URL } from '@/lib/guest-invite-config'`
    )
    writeFileSync(path, c, 'utf8')
    console.log('FIXED: guest-event-view.tsx — APP_URL import moved')
  } else {
    console.log('SKIP: guest-event-view.tsx — import already clean')
  }
}