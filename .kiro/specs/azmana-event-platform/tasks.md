# Implementation Plan

- [x] 1. Scaffold Next.js project and Supabase integration


  - Create a Next.js App Router project with TypeScript and configure environment variables for Supabase URL, anon key, and service role key
  - Add Supabase browser, server, and service-role client helpers
  - Add shared config for the two locales (`he`, `en`) with a labels/greeting dictionary module
  - _Requirements: 5.4, 5.5_

- [x] 2. Create database schema and access policies

- [x] 2.1 Write SQL migration for tables and constraints


  - Create `event`, `guest`, and `rsvp` tables with the fields and types from the data model
  - Add constraints: `event.language` in (`he`,`en`), unique `(event_id, mobile)`, `guest.predicted_guests >= 0`, `guest.token` default `gen_random_uuid()` unique indexed, `rsvp.attendee_count BETWEEN 0 AND 10`, `rsvp` keyed by `guest_id`
  - _Requirements: 2.2, 3.2, 3.4, 4.1, 7.2, 7.4_
- [x] 2.2 Write RLS policies and seed script


  - Enable RLS and add owner-scoped policies for `event`, `guest`, `rsvp` using `auth.uid()`
  - Add a seed script that creates one or more admin accounts in Supabase Auth
  - _Requirements: 1.1, 2.1, 8.1_

- [x] 3. Implement shared validation schemas


  - Create Zod schemas for event create/update (language, image, address, greeting required), guest create/update (names, mobile, predicted_guests >= 0, family), and RSVP (attendee_count 0–10)
  - Implement the `Navigation_Link` builder from an address and the predicted-guests-to-default clamp helper (bounded 0–10)
  - _Requirements: 2.3, 2.4, 3.4, 6.2, 7.1, 7.2_
- [ ]* 3.1 Write unit tests for schemas and helpers
  - Test required-field validation, attendee-count range, predicted-guests default clamp, and Navigation_Link output
  - _Requirements: 2.3, 2.4, 7.1, 7.2_

- [x] 4. Implement admin authentication and route guard


  - Build the `/login` page with an email/password form wired to Supabase Auth and a log-out action
  - Add `middleware.ts` to guard `/admin/*`, redirecting unauthenticated requests to `/login`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5. Implement event create and edit

- [x] 5.1 Build event Route Handlers


  - Implement `POST /api/events` (create, set `owner_id` to the session user) and `PATCH /api/events/[id]` (update settings and active state, owner-checked) using the shared schemas
  - _Requirements: 2.1, 2.4, 2.5, 8.2, 8.3_
- [x] 5.2 Build event form UI with image upload


  - Create `/admin/events/new` and `/admin/events/[id]` with language, image upload to Supabase Storage, address, and greeting fields, surfacing field-level and upload errors
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Implement guest list management


  - Implement `POST /api/events/[id]/guests` (adds guest, generates token, maps duplicate-mobile violation to a friendly error) and `PATCH/DELETE /api/events/[id]/guests/[gid]`
  - Build `/admin/events/[id]/guests` UI for add/edit/remove with the duplicate-mobile message
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1_
- [ ]* 6.1 Write integration test for duplicate-mobile handling
  - Verify adding a guest with an existing mobile in the same event is rejected
  - _Requirements: 3.2_

- [x] 7. Implement invite link view


  - Build `/admin/events/[id]/links` showing each guest's `Invite_Link` with multi-select to reveal/copy links for selected guests
  - _Requirements: 4.2, 4.3_

- [x] 8. Implement guest invite page and access control

- [x] 8.1 Build invite view-model handler


  - Implement `GET /api/invite/[token]` using the service-role client: return minimal event+guest view model for a valid token on an active event; signal denial for invalid token; signal unavailable for inactive event
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_
- [x] 8.2 Build the `/invite/[token]` page


  - Render image, address with Navigation_Link, and personalized greeting with first/last name; apply the locale dictionary and `dir` (RTL for Hebrew, LTR for English); render denial and unavailable states
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3_
- [ ]* 8.3 Write integration tests for invite access outcomes
  - Cover valid+active, invalid token, and inactive event outcomes
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. Implement RSVP submission


  - Build the Attendee_Count +/- control defaulting to the clamped predicted value and constrained to 0–10, with a submit button
  - Implement `POST /api/invite/[token]/rsvp` to re-validate token and active state, then upsert the RSVP (replacing any prior value)
  - _Requirements: 7.1, 7.2, 7.3, 7.4_
- [ ]* 9.1 Write integration test for RSVP upsert
  - Verify a resubmission replaces the previous attendee_count for the guest
  - _Requirements: 7.4_

- [x] 10. Implement event list and RSVP results



  - Build `/admin` event list showing only the authenticated admin's events with an active/inactive toggle wired to `PATCH /api/events/[id]`
  - Build `/admin/events/[id]/rsvps` showing per-guest Attendee_Count and the total confirmed count for the event
  - _Requirements: 8.1, 8.2, 8.3, 8.4_
