-- AzMaNa initial schema
-- Tables: event, guest, rsvp
-- Requirements: 2.2, 3.2, 3.4, 4.1, 7.2, 7.4

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- event
-- ---------------------------------------------------------------------------
create table if not exists public.event (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  language    text not null,
  image_url   text not null,
  address     text not null,
  greeting    text not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint event_language_check check (language in ('he', 'en'))
);

create index if not exists event_owner_id_idx on public.event (owner_id);

-- ---------------------------------------------------------------------------
-- guest
-- ---------------------------------------------------------------------------
create table if not exists public.guest (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.event (id) on delete cascade,
  first_name       text not null,
  last_name        text not null,
  mobile           text not null,
  predicted_guests integer not null default 0,
  family_relation  text,
  token            uuid not null default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  constraint guest_predicted_guests_check check (predicted_guests >= 0),
  constraint guest_event_mobile_unique unique (event_id, mobile)
);

-- Unguessable per-guest token used in invite links (Req 4.1)
create unique index if not exists guest_token_unique on public.guest (token);
create index if not exists guest_event_id_idx on public.guest (event_id);

-- ---------------------------------------------------------------------------
-- rsvp (one row per guest; resubmission is an upsert) (Req 7.4)
-- ---------------------------------------------------------------------------
create table if not exists public.rsvp (
  guest_id        uuid primary key references public.guest (id) on delete cascade,
  attendee_count  integer not null,
  submitted_at    timestamptz not null default now(),
  constraint rsvp_attendee_count_check check (attendee_count between 0 and 10)
);
