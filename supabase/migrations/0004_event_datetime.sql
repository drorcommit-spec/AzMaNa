-- Add event date and time fields.
-- event_date stored as a DATE; event_time stored as text "HH:MM" (24h).
-- Both nullable so existing events remain valid.

alter table public.event
  add column if not exists event_date date,
  add column if not exists event_time text;
