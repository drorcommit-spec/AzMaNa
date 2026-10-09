-- AzMaNa Row Level Security policies
-- Admin access is scoped to the authenticated owner (auth.uid()).
-- Public guest access is NOT granted here; the invite Route Handlers use the
-- service-role client and enforce token + is_active checks in code.
-- Requirements: 1.1, 2.1, 8.1

alter table public.event enable row level security;
alter table public.guest enable row level security;
alter table public.rsvp  enable row level security;

-- ---------------------------------------------------------------------------
-- event: owner-only access
-- ---------------------------------------------------------------------------
drop policy if exists event_owner_all on public.event;
create policy event_owner_all
  on public.event
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- guest: accessible when the parent event belongs to the current admin
-- ---------------------------------------------------------------------------
drop policy if exists guest_owner_all on public.guest;
create policy guest_owner_all
  on public.guest
  for all
  to authenticated
  using (
    exists (
      select 1 from public.event e
      where e.id = guest.event_id and e.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.event e
      where e.id = guest.event_id and e.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- rsvp: accessible when the guest's event belongs to the current admin
-- (admins read results; guest writes go through the service-role handler)
-- ---------------------------------------------------------------------------
drop policy if exists rsvp_owner_all on public.rsvp;
create policy rsvp_owner_all
  on public.rsvp
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.guest g
      join public.event e on e.id = g.event_id
      where g.id = rsvp.guest_id and e.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.guest g
      join public.event e on e.id = g.event_id
      where g.id = rsvp.guest_id and e.owner_id = auth.uid()
    )
  );
