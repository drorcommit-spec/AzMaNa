-- AzMaNa Storage bucket for event images (public read).
-- Admins upload via the authenticated client; guests read via public URL.
-- Requirement: 2.1 (image), 6.1 (invite page image)

insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

-- Allow authenticated admins to upload/update/delete images.
drop policy if exists event_images_admin_write on storage.objects;
create policy event_images_admin_write
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'event-images')
  with check (bucket_id = 'event-images');

-- Public read of event images.
drop policy if exists event_images_public_read on storage.objects;
create policy event_images_public_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'event-images');
