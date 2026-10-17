-- Run ONCE after 01 and 02. Does not delete existing application data.
-- Images are uploaded through Storage API, then linked atomically with the ticket.
begin;

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'ticket-photos' and not public) then
    raise exception 'กรุณาสร้าง bucket ticket-photos แบบ Private ก่อน';
  end if;
end $$;

create function fixmfu_private.can_upload_report_photo(object_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select fixmfu_private.is_university_google_user()
    and object_name ~ '^[0-9a-f-]{36}/report/[0-9a-f-]{36}\.webp$'
    and not exists (select 1 from public.tickets where id::text = split_part(object_name, '/', 1));
$$;

-- Serialize cleanup against submission; linked files cannot be deleted by clients.
create function fixmfu_private.can_remove_report_photo(object_name text)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
begin
  if not fixmfu_private.is_university_google_user() then return false; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(split_part(object_name, '/', 1), 0));
  return not exists (select 1 from public.tickets where id::text = split_part(object_name, '/', 1));
end;
$$;

revoke all on function fixmfu_private.can_upload_report_photo(text),
  fixmfu_private.can_remove_report_photo(text) from public, anon, authenticated;
grant execute on function fixmfu_private.can_upload_report_photo(text),
  fixmfu_private.can_remove_report_photo(text) to authenticated;

create policy fixmfu_report_upload on storage.objects for insert to authenticated
with check (bucket_id = 'ticket-photos' and owner_id = (select auth.uid())::text
  and fixmfu_private.can_upload_report_photo(name));
create policy fixmfu_report_upload_guard on storage.objects as restrictive for insert to authenticated
with check (bucket_id <> 'ticket-photos' or (owner_id = (select auth.uid())::text
  and fixmfu_private.can_upload_report_photo(name)));

create policy fixmfu_photo_read on storage.objects for select to authenticated
using (bucket_id = 'ticket-photos' and (select fixmfu_private.is_university_google_user())
  and (owner_id = (select auth.uid())::text or exists (
    select 1 from public.ticket_attachments a where a.object_path = storage.objects.name and a.bucket_id = storage.objects.bucket_id
  )));
create policy fixmfu_photo_read_guard on storage.objects as restrictive for select to authenticated
using (bucket_id <> 'ticket-photos' or ((select fixmfu_private.is_university_google_user())
  and (owner_id = (select auth.uid())::text or exists (
    select 1 from public.ticket_attachments a where a.object_path = storage.objects.name and a.bucket_id = storage.objects.bucket_id
  ))));

create policy fixmfu_unlinked_photo_cleanup on storage.objects for delete to authenticated
using (bucket_id = 'ticket-photos' and owner_id = (select auth.uid())::text
  and fixmfu_private.can_remove_report_photo(name));
create policy fixmfu_photo_delete_guard on storage.objects as restrictive for delete to authenticated
using (bucket_id <> 'ticket-photos' or (owner_id = (select auth.uid())::text
  and fixmfu_private.can_remove_report_photo(name)));
create policy fixmfu_photo_no_overwrite on storage.objects as restrictive for update to authenticated
using (bucket_id <> 'ticket-photos') with check (bucket_id <> 'ticket-photos');
create policy fixmfu_photo_no_anonymous on storage.objects as restrictive for all to anon
using (bucket_id <> 'ticket-photos') with check (bucket_id <> 'ticket-photos');

create function public.submit_repair_report(
  p_id uuid, p_building uuid, p_category uuid, p_title text,
  p_description text, p_location text, p_photos jsonb default '[]'::jsonb
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  existing public.tickets%rowtype;
  photo record;
  stored storage.objects%rowtype;
  photo_count integer;
  total_bytes bigint;
begin
  if not fixmfu_private.is_university_google_user() or auth.uid() is null then
    raise exception 'กรุณาเข้าสู่ระบบด้วย Google มหาลัย' using errcode = '42501';
  end if;
  if p_id is null or p_building is null or p_category is null
    or char_length(btrim(coalesce(p_title, ''))) not between 1 and 200
    or char_length(btrim(coalesce(p_description, ''))) not between 1 and 5000
    or char_length(btrim(coalesce(p_location, ''))) not between 1 and 300
    or p_photos is null or jsonb_typeof(p_photos) <> 'array' then
    raise exception 'ข้อมูลแจ้งซ่อมไม่ครบหรือยาวเกินกำหนด' using errcode = '22023';
  end if;
  photo_count := jsonb_array_length(p_photos);
  if photo_count > 3 then raise exception 'แนบได้สูงสุด 3 รูป' using errcode = '22023'; end if;
  if (select count(distinct x.id) from jsonb_to_recordset(p_photos) as x(id uuid)) <> photo_count then
    raise exception 'ข้อมูลรูปซ้ำหรือไม่มีรหัสรูป' using errcode = '22023';
  end if;
  select coalesce(sum(size_bytes), 0) into total_bytes from jsonb_to_recordset(p_photos)
    as x(size_bytes integer);
  if total_bytes > 2097152 then raise exception 'ขนาดรูปรวมต้องไม่เกิน 2 MB' using errcode = '22023'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_id::text, 0));
  select * into existing from public.tickets where id = p_id;
  if found then
    -- A retry of the same request returns the original ticket, without another event.
    if existing.reporter_id <> auth.uid() or
      (existing.building_id, existing.category_id, existing.title, existing.description, existing.location)
      is distinct from (p_building, p_category, btrim(p_title), btrim(p_description), btrim(p_location))
      or (select count(*) from public.ticket_attachments where ticket_id = p_id and kind = 'report') <> photo_count
      or exists (select 1 from jsonb_to_recordset(p_photos) as x(
        id uuid, object_path text, original_name text, mime_type text, size_bytes integer
      ) where not exists (select 1 from public.ticket_attachments a where a.ticket_id = p_id
        and (a.id, a.object_path, a.original_name, a.mime_type, a.size_bytes)
          = (x.id, x.object_path, x.original_name, x.mime_type, x.size_bytes))) then
      raise exception 'รายการส่งซ้ำมีข้อมูลไม่ตรงกัน กรุณาเปิดฟอร์มใหม่' using errcode = '22023';
    end if;
    return p_id;
  end if;

  -- Lock actual Storage metadata while linking, and verify who uploaded every object.
  for photo in select * from jsonb_to_recordset(p_photos) as x(
    id uuid, object_path text, original_name text, mime_type text, size_bytes integer
  ) order by object_path loop
    if photo.id is null or photo.object_path is distinct from (p_id::text || '/report/' || photo.id::text || '.webp')
      or photo.mime_type is distinct from 'image/webp' or photo.size_bytes is null
      or photo.size_bytes not between 1 and 2097152
      or char_length(btrim(coalesce(photo.original_name, ''))) not between 1 and 255 then
      raise exception 'ข้อมูลรูปไม่ถูกต้อง' using errcode = '22023';
    end if;
    select * into stored from storage.objects where bucket_id = 'ticket-photos' and name = photo.object_path for update;
    if not found or stored.owner_id is distinct from auth.uid()::text
      or stored.metadata->>'mimetype' is distinct from photo.mime_type
      or (stored.metadata->>'size')::bigint is distinct from photo.size_bytes::bigint then
      raise exception 'รูปยังอัปโหลดไม่ครบหรือไม่ใช่รูปของคุณ' using errcode = '42501';
    end if;
  end loop;

  insert into public.tickets(id, reporter_id, building_id, category_id, title, description, location)
    values (p_id, auth.uid(), p_building, p_category, btrim(p_title), btrim(p_description), btrim(p_location));
  insert into public.ticket_attachments(id, ticket_id, uploaded_by, kind, object_path, original_name, mime_type, size_bytes)
    select id, p_id, auth.uid(), 'report', object_path, original_name, mime_type, size_bytes
    from jsonb_to_recordset(p_photos) as x(id uuid, object_path text, original_name text, mime_type text, size_bytes integer);
  return p_id;
end;
$$;

revoke all on function public.submit_repair_report(uuid, uuid, uuid, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_repair_report(uuid, uuid, uuid, text, text, text, jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
