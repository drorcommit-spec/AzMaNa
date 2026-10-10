-- Add a display name for each event.
-- Nullable so existing events remain valid until edited.
alter table public.event
  add column if not exists name text;
