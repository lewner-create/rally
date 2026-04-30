# Rally — Spec

## What it is
A scheduling and coordination app for friend groups. Syncs calendars, finds open windows when everyone is free, helps plan events (game nights, meetups, trips), includes group chat per event, and handles expense splitting.

## Tech stack
- Monorepo: pnpm workspaces + Turborepo
- Web: Next.js 15 (App Router), React 19, TypeScript
- Mobile: React Native + Expo (Phase 2)
- Backend: Supabase (Postgres, Auth, Realtime, Storage)
- Styling: Tailwind CSS + shadcn/ui
- Payments: Stripe Connect (Phase 3)
- Background jobs: Inngest (Phase 2+)
- Email: Resend (Phase 2+)

## Monorepo structure
```
/apps/web          → Next.js web app
/packages/db       → Database types (shared)
/packages/config   → Shared TypeScript configs
```

## Database tables (Phase 1)
- `profiles` — extends auth.users
- `groups` — a crew, has tier (0–3) and boost_count
- `group_members` — membership + role + boost status
- `availability_blocks` — manual busy/free blocks per user
- `events` — game_night | hangout | meetup | day_trip | road_trip | moto_trip | vacation
- `event_attendees` — per-event RSVP
- `messages` — group chat; event_id null = general, set = event thread

## Auth
Supabase email/password. Profile auto-created via DB trigger on signup.
Middleware handles session refresh and redirects unauthenticated users to /login.

## Monetization tiers
- 0: Free (ads, limited features)
- 1: Boosted tier 1 (1–2 boosts) — ads removed, meetup type, 2 gaming platforms, polls, custom splits
- 2: Boosted tier 2 (3–4 boosts) — trips, all gaming platforms, Rally wallet, crew fund
- 3: Boosted tier 3 / Rally+ individual (5+ boosts or paid sub) — travel, moto trips, multiple groups, up to 20 members

## Free tier limits
- 1 active group, up to 6 members
- Open windows capped at 3
- Game night and hangout event types only
- Manual gaming library entry only
- Even-split payments only
- Ads in open windows, event planning flow, general chat

## Phase 1 scope
- [x] Auth (sign up, sign in, sign out)
- [x] Database schema + RLS
- [x] App shell (sidebar layout)
- [ ] Groups (create, invite, join)
- [ ] Manual availability blocks
- [ ] Open windows calculation
- [ ] Event creation (game night, hangout)
- [ ] Event RSVP
- [ ] Group chat + event chat (Supabase Realtime)

## Phase 2 scope
- React Native + Expo mobile app
- Google Calendar OAuth sync (free/busy only)
- Outlook Calendar sync
- Push notifications
- Steam gaming library sync

## Phase 3 scope
- Stripe Connect payment integration
- Per-event cost splitting and pooling
- Event wallet (hold funds, release to organizer)
- Boost purchase flow
- Rally+ subscription

## Key product decisions
- Calendar data: read-only, free/busy only — no event details ever stored
- Address data: encrypted at rest, never shared raw between users
- Gaming library: opt-in per platform
- Boost model: Discord-inspired — group members contribute boosts to unlock features for everyone
- Boost threshold scales with group size so small groups aren't penalized
- Invite flow: deep link → calendar sync first → account creation second (value before commitment)
- Ads: contextual/local only, never in payment flows or active event threads

## Requirements list (full)

### Identity & onboarding
- User accounts with display name, avatar, home address (private), notification preferences
- Friend system — invite by phone number or username, accept/decline
- Group creation — named crew, one user can belong to multiple groups
- Referral incentive — inviter + new user both get 30-day boost credit on completion

### Calendar sync (Phase 2)
- OAuth read-only: Google Calendar, Outlook, Apple Calendar (on-device only via Expo)
- Only free/busy blocks read — zero event details stored
- Manual availability overrides
- Per-activity-type preferences
- Sync refresh: real-time push where supported, polling otherwise

### Open windows engine
- Aggregate free/busy across group members
- Score by attendee count, duration, activity-type preference match
- Flag multi-day windows as trip candidates
- Filter by minimum attendee count
- Free tier: capped at 3 windows

### Event types
- Game night (online or in-person, syncs gaming libraries)
- Meetup at venue (midpoint routing, venue search)
- Hang at home (host selection from saved addresses)
- Day trip
- Road trip
- Moto trip (route suggestions)
- Vacation/travel

### Gaming integration (Phase 2)
- Steam: public Web API
- Xbox / Game Pass: developer API
- PlayStation Network: developer API
- Nintendo Switch: manual input initially
- Surface common owned games filtered by player count

### Chat
- General chat per group (not event-tied)
- Per-event thread auto-created on booking, seeded with summary card
- In-thread polls for group decisions
- Push notifications with per-user mute/snooze
- Media sharing (links, images)

### Financials (Phase 3)
- Stripe Connect for bank/debit connection
- Per-event cost entry, even or custom split
- Payment requests sent in-app + push
- Event-scoped wallet — pool funds, organizer withdraws when fully funded
- Fully funded confirmation before organizer books
- Optional persistent Rally wallet per user
- Optional recurring crew fund (fixed monthly group contribution)
- Transaction history per event and per user
- Partial refund flow for cancellations
- Nudge reminders for unpaid members (configurable)

### Notifications
- New open window detected
- Event invite received
- RSVP reminder
- Payment request / received / event fully funded
- Chat message (per-conversation mute)
- Friend joins / syncs calendar

### Privacy
- Calendar data never stored beyond free/busy aggregation
- Address data encrypted at rest, never shared raw
- Gaming library opt-in per platform
- Granular notification controls
- Soft busy option — appear unavailable without blocking group windows
