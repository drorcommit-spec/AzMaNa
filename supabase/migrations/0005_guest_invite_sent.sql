-- Track when a guest's invitation was sent (null = not yet sent).
alter table public.guest
  add column if not exists invite_sent_at timestamptz;
