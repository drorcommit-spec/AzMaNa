-- Per-event WhatsApp invitation message template.
-- Supports placeholders: {firstName} {lastName} {eventName} {date} {time}
-- The invite link is appended automatically after this text.
alter table public.event
  add column if not exists whatsapp_template text;
