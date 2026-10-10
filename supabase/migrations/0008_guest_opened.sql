-- Track when a guest first opened their invite page (engagement proxy, since
-- free WhatsApp cannot report delivery/read). Null = not opened yet.
alter table public.guest
  add column if not exists first_opened_at timestamptz;
