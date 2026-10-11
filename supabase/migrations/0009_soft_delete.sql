-- Soft delete: never physically remove rows. Mark deleted_at instead.
-- All reads must filter `deleted_at is null`.
alter table public.event add column if not exists deleted_at timestamptz;
alter table public.guest add column if not exists deleted_at timestamptz;

-- Loosen the destructive cascade on event ownership so deleting an auth user
-- can never wipe event data again. (Reassign ownership instead.)
alter table public.event
  drop constraint if exists event_owner_id_fkey;
alter table public.event
  add constraint event_owner_id_fkey
  foreign key (owner_id) references auth.users (id) on delete set null;

-- owner_id must allow null now that deletion sets it null.
alter table public.event alter column owner_id drop not null;

-- Replace the strict unique(event_id, mobile) with a partial unique index that
-- only applies to non-deleted guests, so a mobile can be reused after a guest
-- is soft-deleted.
alter table public.guest
  drop constraint if exists guest_event_mobile_unique;
create unique index if not exists guest_event_mobile_active_unique
  on public.guest (event_id, mobile)
  where deleted_at is null;
