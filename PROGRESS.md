$path = "D:\Rally\rally\PROGRESS.md"
$content = @'
# Rally — Progress

## Session 1 — complete
- Monorepo scaffolded (pnpm workspaces + Turborepo)
- packages/config: shared TypeScript configs
- packages/db: database type definitions
- apps/web: Next.js 15 + Tailwind + shadcn/ui configured
- Supabase project connected
- Auth: sign up, sign in, sign out, protected routes, session middleware
- DB: full schema applied, RLS policies, profile auto-creation trigger
- App shell: sidebar with navigation, (app) layout, dashboard stub
- Realtime enabled on messages table
- Fixed: all files rewritten as UTF-8 to resolve PowerShell encoding issue

## Session 2 — complete
- SQL: group_invites table + RLS policies
- DB types: full type definitions in packages/db/src/index.ts
- Server actions: createGroup, getMyGroups, getGroupWithMembers, createInviteLink,
  getGroupInvites, revokeInvite, getInvitePreview, joinGroupByToken, inviteByUsername, leaveGroup
- Group creation flow: /groups/new with CreateGroupForm
- Group detail page: /groups/[groupId] — members list + invite panel (admins only)
- Invite links: create, copy, revoke — 7-day expiry
- Invite by username: direct add by @username
- Public join page: /join/[token] — works unauthed (redirects to login with ?next=)
- Dashboard: shows group cards, empty state with CTA
- Sidebar: updated nav with New group link
- Middleware: /join/* exempted from auth guard

## Up next (Session 3)
- Manual availability blocks (add/edit/delete busy/free windows)
- Open windows calculation (find when everyone is free)
- Display open windows on dashboard / group page

## Known issues / notes
- All files must be written with [System.IO.File]::WriteAllText and UTF8Encoding::new($false)
- Dev server runs from D:\Rally\rally with: pnpm dev
- App runs at http://localhost:3000
- Supabase schema applied, RLS policies active, profile trigger working
- Email confirmation disabled in Supabase (dev convenience)
- group_invites table added in Session 2 SQL migration
- profiles.username column added (unique) — users need username set to use invite-by-username

## Repo structure