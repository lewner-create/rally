# Rally — Master Task List
_Synthesized from Sessions 1–22 · Last updated: Session 22_

---

## ✅ COMPLETE (Sessions 1–22)

### Infrastructure & Auth
- [x] Monorepo scaffolded (pnpm workspaces + Turborepo)
- [x] Next.js 15 + Tailwind + shadcn/ui configured
- [x] Supabase connected, schema applied, RLS policies, profile trigger
- [x] Auth: sign up, sign in, sign out, protected routes, session middleware
- [x] Middleware: /join/ and /invite/ exempt from auth guard; ?next= redirect on login
- [x] App shell: sidebar layout, (app) layout
- [x] Realtime enabled on chat_messages table
- [x] `next.config.ts` serverActions bodySizeLimit raised to 4mb

### Groups
- [x] Group creation (basic form → 5-step wizard → single-screen with vibe chips)
- [x] Group creation v2: theme color, banner picker (18 gradient templates + upload), description
- [x] Group creation: name generator (100 names across 5 vibe categories, "Suggest name" button, cycles pool, resets on vibe change)
- [x] Group creation: interest/activity type chips (foundational infrastructure for feature gating)
- [x] Invite links: create, copy, revoke — 7-day expiry
- [x] Invite by username
- [x] Join via link (catch-all handles old hex tokens + new fun slug format)
- [x] Group detail page: server + client split, tabs (Overview / Plans), floating chat drawer
- [x] Group settings page: admin (edit name/description/color/banner/interests, member management, delete), member (read-only + leave)
- [x] Group settings page: props contract fixed (flat props → group object)
- [x] Group page empty state: progressive reveal (0 members → invite CTA, 1 member → first window, first plan → full UI)
- [x] ProactiveBanner: purple gradient, dismissable, localStorage keyed per group+date, pre-fills NudgeButton
- [x] GroupChatDrawer: slide-out panel with unread badge
- [x] Group page left panel: dark treatment (#12102a background, matching sidebar family)

### Availability
- [x] Availability v1: manual busy/free blocks, add/delete, grouped by date
- [x] Availability v2: weekly drag grid (Mon–Sun, 0–23h), drag to paint free hours, click to erase
- [x] Availability page: preset-based redesign (6 presets), smart summary, "Adjust specific times" disclosure with WeeklyGrid
- [x] WeeklyGrid: full dark pass, green hover preview, period dividers (Morning/Afternoon/Evening), click day header to toggle column
- [x] `getWeeklyAvailability` / `saveWeeklyAvailability` server actions
- [x] DB: `profiles.weekly_availability JSONB` column
- [x] Group-scoped availability: `group_availability` table, fallback chain (group → profile default → empty)
- [x] `getGroupAvailability` / `saveGroupAvailability` / `clearGroupAvailability` server actions
- [x] `markGroupRead` wired in ChatPanel on mount (group chat only)
- [x] DB: `group_members.last_read_at` column

### Open Windows Engine
- [x] v1: generates candidate slots (weekday evenings + weekend blocks), scores by member availability, caps at 3 free tier
- [x] v2: reads `weekly_availability` from profiles, returns `MemberProfile[]` for avatar stacks
- [x] v3: reads `group_availability` first, falls back to profile default per member
- [x] Open windows display: human-readable labels, avatar stacks, best window as dark hero card, secondary as compact rows

### Events / Plans
- [x] Event creation form: two-column layout, live preview card, custom calendar + time pickers, type pills, banner upload
- [x] Event types: game_night, hangout, meetup, day_trip, road_trip, moto_trip, vacation
- [x] Event detail page: two-column layout (left: hero + RSVP + tabs, right: sticky chat)
- [x] Event page: correct DB columns (title / starts_at / ends_at)
- [x] Event page: emoji literals (no more unicode escapes)
- [x] RSVP: yes/maybe/no, optimistic updates, confirmation toast
- [x] RSVP bar: Going/Maybe/Can't avatar stacks, expand-to-names on click
- [x] RSVP questionnaires: creator adds questions at event creation, modal intercepts yes/maybe RSVP, answers saved per user
- [x] Event invite page: login + join + RSVP flow for non-members
- [x] Share event button: copies invite URL to clipboard
- [x] Banner persistence: Storage RLS, banner_url on events, hero card background with gradient overlay
- [x] EventTabs: About / Costs & details / Moments tabs
- [x] EventDetails: contextual cost/detail tabs by event type
- [x] Event costs: line items, per-person split, paid toggle, payment links
- [x] Plan cards ("Check who's in" flow): `postCheckWhosIn` action, PlanCard component, In/Maybe/Can't buckets, live avatar stacks, "Lock it in" button
- [x] Plan card detail page: `/plans/[planId]` — voting, response bar, lock-in for creator
- [x] New plan page: `/groups/[groupId]/plans/new` — 7 event type cards, optional date/time
- [x] `lockInPlanCard`: creates event from card, redirects to event page
- [x] Plan cards rendered inline in chat feed as interactive cards
- [x] Full flow: Start a plan → plan card → vote → lock in → event

### Post-Event Moments
- [x] `event_photos` table: RLS fixed (uploader_id, public_url schema)
- [x] `event-photos` Supabase Storage bucket (public)
- [x] `getEventPhotos` / `saveEventPhoto` / `deleteEventPhoto` server actions
- [x] MomentsTab: 3-col photo grid, client-side upload direct to Storage, lightbox with prev/next, delete own photos
- [x] Photo count badge on Moments tab when photos exist

### Chat & Messaging
- [x] Group chat (Supabase Realtime): send, receive, optimistic updates
- [x] Per-event chat thread
- [x] ChatPanel: dark surface, plan card rendering inline, empty state CTA, dark bubble colors
- [x] ChatPanel: markGroupRead called on mount for group chats
- [x] DM panel: received bubbles dark (#1e1e1e), input bar dark
- [x] MessagesHub: full dark pass, DM threads sidebar, thread switching
- [x] New DM button: inline search, debounced user search, start thread
- [x] Radio bot: system pill messages on RSVP + nudge actions
- [x] RLS policies: group members can insert/select chat_messages
- [x] Global ChatBubble removed from app layout — GroupChatDrawer handles group pages, Messages nav handles everything else
- [x] Overlapping chat bubble fix: ChatBubble hidden on /groups/ routes

### Profile & Onboarding
- [x] Profile page: avatar upload, display name, username, bio, activity interest chips (10 types), preferences saved to DB
- [x] Onboarding flow: 3-step (Name → Interests → Availability presets), `/onboarding` route outside app layout
- [x] Dashboard redirects new users to onboarding if no display_name or !preferences.onboarded
- [x] Settings page: Account section (links to Profile + Availability), Notifications toggles (4), Sign out

### Dashboard
- [x] Dashboard redesign: group cards in 2-col grid, best window hero banner, GroupCard + MemberAvatars
- [x] New group highlight animation on post-creation redirect
- [x] Time format bug fixed: window times use label only

### Design System
- [x] Full dark treatment across all pages
- [x] Violet, teal, coral, sand color ramps
- [x] Design tokens in CSS custom properties + TS tokens file
- [x] Auth pages: dark gradient, floating white card
- [x] Rally wordmark: lowercase violet

### Sidebar
- [x] Redesigned: deep purple (#1a1333), collapsible to icon rail, group dots, Settings at bottom
- [x] Collapse state persisted to localStorage
- [x] Active state: Settings highlights for /profile and /availability subpages
- [x] Active state: last visited group highlights on /events/ and /plans/ child routes (localStorage)
- [x] Sidebar background fixed: inline style overrides Tailwind bg-background resolving to white

### DB Migrations (cumulative through Session 22)
- [x] `group_invites`, `profiles.username`
- [x] `availability_blocks` RLS + index; security definer functions
- [x] `events`, `event_attendees`, invite slugs
- [x] `groups`: description, theme_color, banner_url, interests, group_type, occasion
- [x] `profiles`: is_podium, boost_count, weekly_availability, bio, preferences JSONB
- [x] `chat_messages`: plan_card_id, message_type constraint
- [x] `plan_cards`, `plan_card_responses`
- [x] `event_details`, `event_costs`
- [x] `direct_messages`
- [x] `group_availability` table + RLS
- [x] `group_members.last_read_at` column
- [x] `event_photos` table + RLS (uploader_id, public_url)
- [x] `event_questions` table + RLS
- [x] `event_question_answers` table + RLS + UNIQUE(question_id, user_id)

---

## 🔴 ACTIVE BUGS

- [ ] **Sidebar collapse/expand** — toggle gone after Session 22 sidebar rewrite; restore in Session 23
- [ ] **Event page plan chat** — showing group chat empty state instead of event thread; fix in Session 23
- [ ] **Plans tab titles** — events created before fix show dates but no title; data issue, new events correct
- [ ] **Group creation v2** — name#id uniqueness not enforced in DB
- [ ] **Onboarding** — not tested end-to-end with fresh account; needs Session 23 test pass

---

## 🟡 BACKLOG — Navigation & UX

- [ ] **Beta bug sweep** — formal logged test pass before Session 29
- [ ] **Group page empty state** — 0-member state needs own availability preview panel
- [ ] **Nudge button** — clipping inside hero banner card

---

## 🟡 BACKLOG — Core Features

### Availability
- [ ] Travel preferences per group — max distance/time, transport mode, host vs midpoint; powers venue search + midpoint routing (Session 27)
- [ ] Soft busy — appear unavailable to a group without blocking real calendar (Session 27)
- [ ] Calendar sync — Google OAuth (Session 24)
- [ ] Calendar sync — Apple CalDAV + Outlook Microsoft Graph (Session 25)
- [ ] Availability overlay — accessible from any page as bottom sheet
- [ ] Availability polls — show your own free time when you vote
- [ ] Window grouping — merge consecutive slots into large blocks, break-into-slots option
- [ ] Onboarding baseline availability selector by activity type

### Plans & Events
- [ ] Capacity limits + waitlist on events (Session 27)
- [ ] Nudge flow wired to draft event creation + notifications
- [ ] Co-host controls (manage RSVPs, edit details, send messages)
- [ ] Non-scheduling polls (where to go, what to do)

### Groups
- [ ] Event-specific groups — one-time groups for specific events
- [ ] Shared "next up" wishlist — group backlog of future hangout ideas
- [ ] Responsibility assignment — who brings what

### Gaming (Phase 2 — post-beta)
- [ ] Steam connect post-group-creation flow
- [ ] Group Games tab: library overlap, who owns what, catalog search, wishlist
- [ ] Event Games section: overlap scoped to attendees, poll/recommend, feed to wishlist
- [ ] Xbox / PlayStation / Nintendo integrations

---

## 🟢 BACKLOG — Social Layer (post-beta)

- [ ] Friends' plans social feed
- [ ] Reactions / emoji boops on events
- [ ] "Going / Pass" quick vote RSVP
- [ ] Annual "Wrapped" year-in-review (Rally Rewind)

---

## 🔵 BACKLOG — Monetization & Growth (post-beta)

- [ ] Terminology cleanup — rename before beta (Session 29): `boost_active` → `is_backing`, `is_podium` → `is_rally_plus`, `boost_count` → `back_count`
- [ ] Premium tier / cosmetic upsells (colors, themes, widgets)
- [ ] Cost splitting + fund collection (Stripe Connect)
- [ ] SMS text blasts to guests
- [ ] iOS / Android home screen widget (post web beta)
- [ ] Rally+ subscription + purchase flow
- [ ] Beta account setup — SQL script to auto-upgrade ~30 invited emails to Rally+ before launch (Session 29)

---

## 🚀 SPRINT TO BETA — Session 29 Target

| Session | Focus |
|---------|-------|
| 23 | Sidebar collapse restore · Event page chat fix · Onboarding fresh-account test |
| 24 | Google Calendar OAuth + auto-populate availability |
| 25 | Apple Calendar (CalDAV) + Outlook (Microsoft Graph) sync |
| 26 | Notifications — in-app unread badges + tab title counter + ping sound |
| 27 | Travel preferences per group · Capacity limits + waitlist · Soft busy |
| 28 | Dashboard polish + group page personality pass |
| **29** | **Beta prep** — terminology rename SQL · 30-invite Rally+ account setup · bug sweep · **launch** |

**Beta scope:** web-only, ~20 direct invites + their adds. Mobile (Capacitor + App Store) is v1.1.
**Mobile-first principle:** build all UI mobile-first even during web beta sessions.

---

## 📋 SQL MIGRATIONS STILL NEEDED

```sql
-- Run if not already applied (Session 11)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;

UPDATE profiles
  SET preferences = '{"onboarded": true}'::jsonb
  WHERE display_name IS NOT NULL;

-- Session 29 — terminology rename (run before beta launch)
ALTER TABLE group_members RENAME COLUMN boost_active TO is_backing;
ALTER TABLE groups        RENAME COLUMN boost_count  TO back_count;
ALTER TABLE profiles      RENAME COLUMN is_podium    TO is_rally_plus;
ALTER TABLE profiles      ADD COLUMN IF NOT EXISTS back_count integer DEFAULT 0;

-- Session 29 — beta invite setup (replace emails with actual list)
UPDATE profiles
  SET is_rally_plus = true
  WHERE id IN (
    SELECT id FROM auth.users WHERE email IN (
      'invite1@example.com',
      'invite2@example.com'
      -- add all ~30 beta invitees here
    )
  );
```

---

## 📁 File Placement Convention
- Session downloads: `D:\Rally\Progress\Session X\Downloads\`
- All files written with `[System.IO.File]::WriteAllText` + `UTF8Encoding::new($false)`
- Never use `Set-Content`; never paste TS/JS directly into PowerShell outside `@'...'@` here-strings
- Dev server: `pnpm dev` from `D:\Rally\rally`
- App: `http://localhost:3000`

---

## 🗄️ Critical DB Notes
- `get_my_group_ids()`, `get_group_member_ids()`, `get_my_event_ids()` — security definer functions, **do not drop**
- `get_my_event_ids()` must return `uuid[]` not `setof uuid`
- `is_group_member(uuid, uuid)` takes explicit `p_user_id` param — do not use `auth.uid()` inside security definer
- DB column is `boost_active` (not yet renamed — rename in Session 29)
- Events table uses `title` / `starts_at` / `ends_at`
- RSVP status values: `'yes'` / `'maybe'` / `'no'`
- `chat_messages.message_type` constraint: `'user' | 'radio' | 'plan_card'`
- `event_photos` columns: `uploader_id` (not `user_id`), `public_url` (not `photo_url`)
- Base64 data URLs in DB cause Server Action body size limit errors — always upload to Storage, save URL only
