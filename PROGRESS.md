# Rally — Session 20 Progress
_Date: May 1 2026_

---

## What we built

Session 20 was the biggest single session yet — eight feature areas shipped across the full stack.

---

## New Features

### Event Creation v2
Full contextual fields by event type. The form now adapts its right panel based on which event type is selected:
- **Game night** → 📍 Where + 🎮 Games tag input (type + Enter to chip, Backspace removes last, up to 10 games)
- **Hangout / Meetup** → 📍 Venue / Location
- **Day trip / Road trip / Moto trip / Vacation** → destination field with type-appropriate icon and placeholder
- Location and games appear in the live preview card as the user types
- Switching event type clears stale location/games
- Description placeholder is type-aware ("Fuel stops, gear notes…" for moto, etc.)
- Full dark treatment throughout (`#0f0f0f` bg, `#161616` cards, `#1a1a1a` inputs)
- Banner upload re-added with drag handle + remove button

**DB migration:** `ALTER TABLE events ADD COLUMN IF NOT EXISTS location text, ADD COLUMN IF NOT EXISTS games text[]`

**Files:** `create-event-form.tsx`, `events.ts`, `migration_s20.sql`

### Plan Lock-in Confetti Screen
When a plan card is locked in, `plan-card-detail.tsx` now renders a full celebratory screen:
- Canvas confetti: 120 particles (rect + circle), 8 colors, 4s runtime with 1.2s fade-out
- Animated summary card slides up with spring easing, 🎉 emoji pops in with rotation
- Shows event type gradient, title, date/time from card data, "Who's in" avatar stack + names
- Glowing "See the plan →" CTA button

**Files:** `plan-card-detail.tsx`

### Group Page — Start Something Fork
The "Start something" card on the group overview now presents two clear options:
- **📅 It's happening** → `/events/new` (create and invite flow)
- **👋 Check who's in** → `/plans/new` (polling flow)
- Both buttons are neutral by default, hover fills with accent
- Card pulses with a glow animation every 3s to draw attention
- `ProactiveBanner` component removed entirely (was showing bad data)
- Plans tab section headers: "👋 Checking who's in" vs "📅 Events"

**Files:** `group-page-client.tsx`

### Events Showing on Plans Tab (bug fix)
`Event.name` → `Event.title` throughout `group-page-client.tsx`. Events created via the new form now appear correctly in the Plans tab.

### Group Page Dark Left Panel
Left sidebar: `#fff` → `#141414`, borders `#E8E6E0` → `#1e1e1e`, group name in `themeColor`, member count / description in `#555`.

**Files:** `groups/[groupId]/page.tsx`

### Edit Event (host-only)
`EditEventModal` — slide-up bottom sheet accessible via "✏️ Edit" button top-right on the event page (host only, hidden when completed):
- Fields: title, date (`input[type=date]` with `colorScheme: dark`), start/end time pickers, location, description
- Calls `updateEvent` server action, patches local state optimistically via `onSaved` callback — no page reload
- Spring slide-up animation, backdrop fade, Escape to close, body scroll locked

Event page refactored: server page delegates to `EventPageClient` (client component) so edit modal can update state. Hero card now shows `location` inline. Auto-complete logic moved inline with literal emoji.

**Files:** `edit-event-modal.tsx`, `event-page-client.tsx`, `events/[eventId]/page.tsx`, `events.ts` (added `updateEvent`)

### Messages Unread Badge
Sidebar subscribes to `postgres_changes INSERT` on `chat_messages` via Supabase Realtime. Increments a local counter for any message not from the current user. Violet pill badge on "Messages" nav item. Resets to 0 when navigating to `/messages`.

Layout updated to pass `currentUserId` to `<Sidebar>`.

**Files:** `sidebar.tsx`, `layout.tsx`

### Dashboard Redesign
Three major additions:

**"What's on" upcoming events strip** — horizontal scroll across all groups, up to 6 events sorted by date. Each card: type gradient, group accent bottom-border, title, group name in theme color, smart date label ("Today · 7 PM", "Tomorrow", weekday), going count, RSVP status badge (green/yellow if responded, violet "RSVP" nudge if not).

**Quick actions 2×2 grid** — Availability, Messages, New group (violet tinted), Profile. Each tile has icon + label + description, all linked.

**Header** — time-aware greeting, avatar/initials top-right as profile link.

New `getUpcomingEventsForUser(userId, groupIds)` server action queries events joined with groups + attendees, returns RSVP status per user.

**Files:** `dashboard-client.tsx`, `dashboard/page.tsx`, `dashboard.ts`

### Nudge Flow → Event Creation
NudgeButton completely rewrote with a 4-step flow: `idle → fork → type_picker → popover → sent`

**Fork step** (new): shows "📅 It's happening" and "👋 Check who's in" before the type picker. Choosing "It's happening" navigates to `/events/new?type=game_night&date=...&start=...&end=...`.

**Type picker**: all 7 event types now shown, no "Boost" locks. Dark panel (`#1a1a1a`, `#2a2a2a` borders). Each step has ← Back.

**Pre-fill**: `events/new/page.tsx` reads `searchParams` for `type`, `date`, `start`, `end`. `CreateEventForm` accepts `prefillType`, `prefillDate`, `prefillStart`, `prefillEnd` props — calendar and time pickers open pre-populated from window data.

**Files:** `nudge-button.tsx`, `groups/[groupId]/events/new/page.tsx`, `create-event-form.tsx`

### Availability Overlay from Sidebar
`AvailabilitySheet` — bottom sheet portal triggered from sidebar "Availability" nav item:
- Loads availability on first open via `getWeeklyAvailability`, cached for subsequent opens
- `AvailabilityPickerBody` shared between full page and sheet (no logic duplication)
- Slide-up with `cubic-bezier(0.32, 0.72, 0, 1)`, blurred backdrop, Escape to close
- Auto-closes 200ms after "Saved ✓" state
- Body scroll locked while open
- Desktop-constrained to `maxWidth: 600px`
- Accent color inherited from the currently active group's theme color
- "Open full availability page →" escape hatch at bottom

`availability-picker.tsx` refactored: `AvailabilityPickerBody` extracted as separate named export, `AvailabilityPicker` (full page) becomes a thin wrapper. `MiniGrid` also exported.

Sidebar gains "Availability" as a proper nav item (Calendar icon), "active" state when sheet is open or on `/availability`. Sheet closes on navigation.

**Files:** `availability-picker.tsx`, `availability-sheet.tsx` (new), `sidebar.tsx`

---

## Bugs Fixed

| Bug | Fix |
|-----|-----|
| Events not showing on Plans tab | `Event.name` → `Event.title` in `group-page-client.tsx` |
| Event emoji unicode escapes | Replaced all surrogate pairs with literal emoji in event page |
| ProactiveBanner bad data | Removed component entirely |
| Open windows cap notice | Deleted "Boost your group" footer from `open-windows.tsx` |
| Secondary window rows white background | `#fff` → `#1a1a1a` in `open-windows.tsx` |

---

## Files Changed

| File | Change |
|------|--------|
| `components/events/create-event-form.tsx` | v2: contextual fields, games, dark UI, prefill props |
| `components/events/edit-event-modal.tsx` | **New** — slide-up edit sheet |
| `components/events/event-page-client.tsx` | **New** — client wrapper for event page with edit modal |
| `app/(app)/events/[eventId]/page.tsx` | Server delegates to EventPageClient |
| `app/(app)/groups/[groupId]/page.tsx` | Dark left panel |
| `app/(app)/groups/[groupId]/events/new/page.tsx` | Reads searchParams for prefill |
| `components/groups/group-page-client.tsx` | Fork CTAs, title fix, section labels, pulse animation |
| `components/groups/nudge-button.tsx` | 4-step flow, fork, all types, dark UI, prefill nav |
| `components/plans/plan-card-detail.tsx` | Confetti lock-in screen |
| `components/windows/open-windows.tsx` | Cap notice removed, dark secondary rows |
| `components/dashboard/dashboard-client.tsx` | What's on strip, quick actions, header |
| `app/(app)/dashboard/page.tsx` | Fetches upcoming events |
| `lib/actions/dashboard.ts` | `getUpcomingEventsForUser` added |
| `lib/actions/events.ts` | `updateEvent` added, `location`/`games` on `createEvent` |
| `components/availability/availability-picker.tsx` | Extracted `AvailabilityPickerBody`, exported `MiniGrid` |
| `components/availability/availability-sheet.tsx` | **New** — bottom sheet portal |
| `components/layout/sidebar.tsx` | Availability nav item, sheet trigger, unread badge |
| `app/(app)/layout.tsx` | Passes `currentUserId` to Sidebar |

---

## DB Changes

```sql
-- Run in Supabase SQL editor if not already applied (from migration_s20.sql)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS games    text[];
```

---

## Next Session (21) — Priorities

1. **Group-scoped availability** — separate free windows per group (gaming crew ≠ moto group); per-group availability settings page
2. **Post-event Moments polish** — photo grid lightbox, upload UX, "X photos" counter on completed event card
3. **Notifications / unread** — wire the actual unread count from DB rather than Realtime-only increment
4. **Edit event — banner** — host can swap the banner image post-creation
5. **RSVP questionnaires** — custom questions per event (Partiful feature parity)
