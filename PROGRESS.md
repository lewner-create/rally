# Rally — Session 21 Progress
_Date: May 4 2026_

---

## What we built

Session 21 shipped three features plus a full sidebar system redesign.

---

## New Features

### Group-scoped availability
Each group now has its own availability layer separate from the user profile default. The windows engine uses a fallback chain: `group_availability` → `profiles.weekly_availability` → empty. Members who haven not set a group override automatically use their default.

**DB:** New `group_availability` table with composite PK (`user_id`, `group_id`), RLS for own-row write and group-member read, and supporting indexes.

**New server actions in `availability.ts`:**
- `getGroupAvailability(groupId)` — returns availability + `isCustom` flag
- `saveGroupAvailability(groupId, avail)` — upserts group-specific row
- `clearGroupAvailability(groupId)` — deletes override, falls back to profile default

**`windows.ts` updated:** fetches `group_availability` for the group, builds a `Map<userId, WeeklyAvailability>`, prefers group-specific data over profile data per member when scoring candidate windows.

**New components:**
- `group-availability-sheet.tsx` — bottom sheet with preset chips + mini drag grid + save/reset
- `group-availability-trigger.tsx` — status dot + label in group sidebar, opens sheet

### DB-backed unread message count
Unread badge on the Messages nav item now initialises from the database instead of always starting at 0.

- `getUnreadMessageCount()` — queries `group_members.last_read_at` per group, counts newer messages, sums across all groups
- `markGroupRead(groupId)` — updates `last_read_at` to now when user opens a group chat
- `layout.tsx` fetches initial count server-side, passes as `initialUnread` prop to Sidebar
- Realtime subscription still increments live; navigating to `/messages` resets to 0

**DB:** `ALTER TABLE group_members ADD COLUMN IF NOT EXISTS last_read_at timestamptz`

### Edit event — banner upload
`EditEventModal` now has a banner section at the top. Empty state shows a dashed upload button. Filled state shows a preview with Change/Remove overlays. Uploads to `event-banners` storage bucket on save only. `updateEvent` server action extended to accept `banner_url`.

---

## Sidebar redesign

Full replacement of the Tailwind class-based sidebar with a coherent inline-style system shared across the main nav sidebar and the new group panel sidebar.

### Design tokens
| Token | Value | Usage |
|-------|-------|-------|
| Main sidebar BG | `#1a1333` | Primary nav |
| Group sidebar BG | `#12102a` | Group panel — cooler, darker |
| Main border | `#2a1f4a` | Dividers |
| Group border | `#221a3e` | Group panel dividers |
| Muted | `#7b6fa0` | Inactive items |
| Accent | `#9b8fcc` | Hover state |
| Active BG | `#2d2250` | Selected item |

### Main sidebar (`sidebar.tsx`)
- Deep purple background replacing `bg-background` which was resolving to light
- Collapses to 68px icon rail with group circles showing initials
- Smooth `0.22s cubic-bezier` width transition with opacity crossfade between layers
- Collapse state persisted to localStorage
- Icons 19-21px (up from 16px)
- DB-backed initial unread count + Realtime live increment

### Group sidebar (`group-sidebar.tsx`) — new component
Replaces the inline left panel in `groups/[groupId]/page.tsx`:
- Distinct shade `#12102a` vs main sidebar `#1a1333` — same family, clearly separate
- Collapses to 52px showing group circle, member mini-avatars, availability dot, settings
- Collapse state persisted to localStorage (`group-sidebar-collapsed`)
- Availability trigger inline — dot shows custom/default status, tap opens GroupAvailabilitySheet

### Group page (`groups/[groupId]/page.tsx`)
- Replaced inline left panel div with GroupSidebar component
- `pageFadeIn` keyframe animation on main content area on route entry

---

## Bugs Fixed

| Bug | Fix |
|-----|-----|
| All groups highlighted on event/plan pages | `isGroupActive` now stores `lastGroupId` in localStorage on group navigation; only that group highlights on child routes |
| Sidebar background resolving to white | Replaced `bg-background` with explicit `background: '#1a1333'` inline style |
| Availability nav item in sidebar | Removed — availability lives in profile/settings and the group sidebar |
| `defaultWeekly` causing Server Actions must be async build error | Moved shared types to `availability-utils.ts` with no `use server` directive |
| Group sidebar same shade as main sidebar | Group sidebar uses `#12102a` / `#221a3e` — distinct but harmonically related |

---

## Files Changed

| File | Change |
|------|--------|
| `lib/actions/availability.ts` | Group availability actions + unread count + markGroupRead |
| `lib/actions/availability-utils.ts` | New — shared types without use server |
| `lib/actions/windows.ts` | Group availability fallback chain in window scoring |
| `components/availability/group-availability-sheet.tsx` | New — group-scoped availability bottom sheet |
| `components/groups/group-availability-trigger.tsx` | New — sidebar status dot + sheet trigger |
| `components/groups/group-sidebar.tsx` | New — collapsible group panel |
| `components/layout/sidebar.tsx` | Full redesign — purple, collapsible, highlight fix, DB unread |
| `components/events/edit-event-modal.tsx` | Banner upload added |
| `app/(app)/groups/[groupId]/page.tsx` | Uses GroupSidebar, pageFadeIn animation |
| `app/(app)/layout.tsx` | Passes initialUnread + currentUserId to Sidebar |

---

## DB Changes (run migration_s21.sql in Supabase if not already applied)

```sql
CREATE TABLE IF NOT EXISTS group_availability (
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id            uuid NOT NULL REFERENCES groups(id)   ON DELETE CASCADE,
  weekly_availability jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);
ALTER TABLE group_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group_availability: own rows"
  ON group_availability FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "group_availability: members can read"
  ON group_availability FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_chat_messages_group_created ON chat_messages (group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_group_availability_group ON group_availability (group_id);
```

---

## Next Session (22) — Priorities

1. **Post-event Moments** — photo grid lightbox, upload UX, X photos counter; fix `event_photos` RLS insert policy (currently blocking inserts — spotted in session 21 logs)
2. **Wire `markGroupRead`** — call when chat panel opens so DB unread count stays accurate after first load
3. **RSVP questionnaires** — custom questions per event (Partiful parity)
4. **Calendar sync** — Google/Apple/Outlook auto-populates availability
5. **Sidebar active state** — settings and profile subpages do not currently highlight their nav items