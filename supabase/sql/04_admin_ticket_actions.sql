-- Run ONCE after SQL 01, 02 and 03. Existing tickets and photos are preserved.
begin;

create table fixmfu_private.ticket_operations (
  request_id uuid primary key,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
alter table fixmfu_private.ticket_operations enable row level security;
revoke all on fixmfu_private.ticket_operations from public, anon, authenticated;
grant all on fixmfu_private.ticket_operations to service_role;

-- Keep the existing helper names used by Storage policies from SQL 03.
-- Report uploads stay unchanged; repair uploads require a university Admin
-- and a ticket that is currently in progress. No overwrites are enabled.
create or replace function fixmfu_private.can_upload_report_photo(object_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select fixmfu_private.is_university_google_user() and (
    (object_name ~ '^[0-9a-f-]{36}/report/[0-9a-f-]{36}\.webp$'
      and not exists (select 1 from public.tickets where id::text = split_part(object_name, '/', 1)))
    or
    (object_name ~ '^[0-9a-f-]{36}/repair/[0-9a-f-]{36}\.webp$'
      and fixmfu_private.is_admin() and exists (
        select 1 from public.tickets where id::text = split_part(object_name, '/', 1) and status = 'in_progress'
      ))
  );
$$;

create or replace function fixmfu_private.can_remove_report_photo(object_name text)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
begin
  if not fixmfu_private.is_university_google_user() then return false; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(split_part(object_name, '/', 1), 0));
  if split_part(object_name, '/', 2) = 'report' then
    return not exists (select 1 from public.tickets where id::text = split_part(object_name, '/', 1));
  end if;
  return split_part(object_name, '/', 2) = 'repair' and fixmfu_private.is_admin()
    and not exists (select 1 from public.ticket_attachments where bucket_id = 'ticket-photos' and object_path = object_name);
end;
$$;

create function public.admin_update_ticket(
  p_request_id uuid, p_ticket_id uuid, p_expected_status text,
  p_action text, p_note text default '', p_photos jsonb default '[]'::jsonb
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  parent public.tickets%rowtype;
  previous fixmfu_private.ticket_operations%rowtype;
  payload jsonb;
  note text := btrim(coalesce(p_note, ''));
  next_status text;
  event_message text;
  photo record;
  stored storage.objects%rowtype;
  photo_count integer;
  total_bytes bigint;
begin
  -- SECURITY DEFINER bypasses RLS, so verify both identity and current DB role here.
  if auth.uid() is null or not fixmfu_private.is_university_google_user() or not fixmfu_private.is_admin() then
    raise exception 'เฉพาะผู้ดูแลระบบที่เข้าสู่ระบบด้วย Google มหาลัยเท่านั้น' using errcode = '42501';
  end if;
  if p_request_id is null or p_ticket_id is null
    or coalesce(p_action, '') not in ('receive', 'note', 'complete', 'cancel')
    or coalesce(p_expected_status, '') not in ('pending', 'in_progress')
    or char_length(note) > 1500 or p_photos is null or jsonb_typeof(p_photos) <> 'array' then
    raise exception 'ข้อมูลดำเนินการไม่ถูกต้อง' using errcode = '22023';
  end if;
  photo_count := jsonb_array_length(p_photos);
  if photo_count > 3 or (p_action <> 'complete' and photo_count <> 0)
    or (p_action in ('note', 'cancel') and note = '')
    or (p_action = 'complete' and note = '' and photo_count = 0)
    or (select count(distinct x.id) from jsonb_to_recordset(p_photos) as x(id uuid)) <> photo_count then
    raise exception 'กรุณาระบุหมายเหตุ เหตุผลยกเลิก หรือผลการแก้ไขให้ครบ แนบได้สูงสุด 3 รูป' using errcode = '22023';
  end if;
  select coalesce(sum(size_bytes), 0) into total_bytes from jsonb_to_recordset(p_photos) as x(size_bytes integer);
  if total_bytes > 2097152 then raise exception 'ขนาดรูปรวมต้องไม่เกิน 2 MB' using errcode = '22023'; end if;
  payload := jsonb_build_object('expected_status', p_expected_status, 'action', p_action, 'note', note, 'photos', p_photos);

  -- Also serializes Storage cleanup and concurrent administrators of this ticket.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_ticket_id::text, 0));
  select * into previous from fixmfu_private.ticket_operations where request_id = p_request_id;
  if found then
    if previous.ticket_id <> p_ticket_id or previous.actor_id <> auth.uid() or previous.payload <> payload then
      raise exception 'รหัสคำขอเดิมมีข้อมูลไม่ตรงกัน กรุณาโหลดหน้ารายละเอียดใหม่' using errcode = '22023';
    end if;
    return p_ticket_id;
  end if;

  select * into parent from public.tickets where id = p_ticket_id for update;
  if not found then raise exception 'ไม่พบเรื่องแจ้งซ่อม' using errcode = 'P0002'; end if;
  if parent.status in ('completed', 'cancelled') or parent.status <> p_expected_status then
    raise exception 'สถานะเรื่องเปลี่ยนแล้ว กรุณาอัปเดตข้อมูลก่อนดำเนินการ' using errcode = '40001';
  end if;
  next_status := parent.status;
  if p_action = 'receive' then
    if parent.status <> 'pending' then raise exception 'เรื่องนี้รับดำเนินการแล้ว' using errcode = '40001'; end if;
    next_status := 'in_progress';
    event_message := 'รับเรื่องและเริ่มดำเนินการ' || case when note <> '' then ': ' || note else '' end;
  elsif p_action = 'complete' then
    if parent.status <> 'in_progress' then raise exception 'กรุณารับเรื่องก่อนปิดงาน' using errcode = '40001'; end if;
    -- Attachment validation in SQL 01 requires an in-progress parent. Insert
    -- metadata first, then update the status, all inside this one transaction.
    for photo in select * from jsonb_to_recordset(p_photos) as x(
      id uuid, object_path text, original_name text, mime_type text, size_bytes integer
    ) order by object_path loop
      if photo.id is null or photo.object_path is distinct from (p_ticket_id::text || '/repair/' || photo.id::text || '.webp')
        or photo.mime_type is distinct from 'image/webp' or photo.size_bytes is null
        or photo.size_bytes not between 1 and 2097152
        or char_length(btrim(coalesce(photo.original_name, ''))) not between 1 and 255 then
        raise exception 'ข้อมูลรูปผลการแก้ไขไม่ถูกต้อง' using errcode = '22023';
      end if;
      select * into stored from storage.objects where bucket_id = 'ticket-photos' and name = photo.object_path for update;
      if not found or stored.owner_id is distinct from auth.uid()::text
        or stored.metadata->>'mimetype' is distinct from photo.mime_type
        or (stored.metadata->>'size')::bigint is distinct from photo.size_bytes::bigint then
        raise exception 'รูปผลการแก้ไขยังอัปโหลดไม่ครบหรือไม่ใช่รูปของคุณ' using errcode = '42501';
      end if;
    end loop;
    insert into public.ticket_attachments(id, ticket_id, uploaded_by, kind, object_path, original_name, mime_type, size_bytes)
      select id, p_ticket_id, auth.uid(), 'repair', object_path, original_name, mime_type, size_bytes
      from jsonb_to_recordset(p_photos) as x(id uuid, object_path text, original_name text, mime_type text, size_bytes integer);
    next_status := 'completed';
    event_message := 'ปิดงานเรียบร้อย' || case when note <> '' then ': ' || note else '' end
      || case when photo_count > 0 then ' (แนบรูป ' || photo_count::text || ' รูป)' else '' end;
  elsif p_action = 'cancel' then
    next_status := 'cancelled';
    event_message := 'ยกเลิกเรื่อง: ' || note;
  else
    event_message := note;
  end if;

  update public.tickets set status = next_status,
    resolution = case when p_action = 'complete' then note else resolution end,
    cancellation_reason = case when p_action = 'cancel' then note else cancellation_reason end
    where id = p_ticket_id;
  insert into public.ticket_events(ticket_id, actor_id, actor_role, kind, status, message)
    values (p_ticket_id, auth.uid(), 'admin', case when p_action = 'note' then 'note' else 'status' end,
      next_status, left(event_message, 1500));
  insert into fixmfu_private.ticket_operations(request_id, ticket_id, actor_id, payload)
    values (p_request_id, p_ticket_id, auth.uid(), payload);
  return p_ticket_id;
end;
$$;

revoke all on function public.admin_update_ticket(uuid, uuid, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.admin_update_ticket(uuid, uuid, text, text, text, jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
