-- FixMFU: database foundation, for a NEW/EMPTY Supabase project.
-- Run this entire file ONCE in SQL Editor as the project database owner.
-- No tables or existing data are dropped. Any error rolls back this transaction.
-- Read docs/03_design/supabase-setup.md before running.
-- This step does NOT connect the website, enable uploads, or implement admin actions.

begin;

create schema fixmfu_private;
revoke all on schema fixmfu_private from public, anon, authenticated;
grant usage on schema fixmfu_private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 200),
  contact text not null default '' check (char_length(contact) <= 255),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(btrim(code)) between 1 and 50),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(btrim(code)) between 1 and 50),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number bigint generated always as identity unique,
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  building_id uuid not null references public.buildings(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null check (char_length(btrim(description)) between 1 and 5000),
  location text not null check (char_length(btrim(location)) between 1 and 300),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  resolution text not null default '' check (char_length(resolution) <= 1500),
  cancellation_reason text not null default '' check (char_length(cancellation_reason) <= 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cancellation_requires_reason check (
    (status = 'cancelled' and btrim(cancellation_reason) <> '')
    or (status <> 'cancelled' and cancellation_reason = '')
  ),
  constraint resolution_is_for_completed_tickets check (status = 'completed' or resolution = '')
);

create table public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  kind text not null check (kind in ('report', 'repair')),
  bucket_id text not null default 'ticket-photos' check (bucket_id = 'ticket-photos'),
  object_path text not null unique,
  original_name text not null check (char_length(btrim(original_name)) between 1 and 255),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 2097152),
  created_at timestamptz not null default now(),
  -- Generated object names, separate from the user's original filename.
  constraint attachment_path_matches_ticket check (
    object_path ~ ('^' || ticket_id::text || '/' || kind || '/' || id::text || '\.(jpg|jpeg|png|webp)$')
  )
);

create table public.ticket_events (
  id bigint generated always as identity primary key,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text not null check (actor_role in ('user', 'admin', 'system')),
  kind text not null check (kind in ('created', 'status', 'note')),
  status text not null check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  message text not null check (char_length(btrim(message)) between 1 and 1500),
  created_at timestamptz not null default now()
);

create index tickets_reporter_created_idx on public.tickets(reporter_id, created_at desc);
create index tickets_status_created_idx on public.tickets(status, created_at desc);
create index tickets_building_created_idx on public.tickets(building_id, created_at desc);
create index tickets_category_created_idx on public.tickets(category_id, created_at desc);
create index tickets_created_idx on public.tickets(created_at desc);
create index ticket_attachments_ticket_kind_idx on public.ticket_attachments(ticket_id, kind);
create index ticket_attachments_uploader_idx on public.ticket_attachments(uploaded_by);
create index ticket_events_ticket_created_idx on public.ticket_events(ticket_id, created_at, id);
create index ticket_events_actor_idx on public.ticket_events(actor_id);

create function fixmfu_private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

create function fixmfu_private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function fixmfu_private.touch_updated_at();
create trigger buildings_updated_at before update on public.buildings
for each row execute function fixmfu_private.touch_updated_at();
create trigger categories_updated_at before update on public.categories
for each row execute function fixmfu_private.touch_updated_at();
create trigger tickets_updated_at before update on public.tickets
for each row execute function fixmfu_private.touch_updated_at();

-- Never take the role from user-controlled signup metadata.
create function fixmfu_private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name, contact, role)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 200),
          left(coalesce(new.email, ''), 255), 'user');
  return new;
end;
$$;

create trigger fixmfu_auth_user_created after insert on auth.users
for each row execute function fixmfu_private.handle_new_user();

-- Covers Auth accounts created before this setup script, without changing their data.
insert into public.profiles(id, full_name, contact, role)
select id, left(coalesce(raw_user_meta_data ->> 'full_name', ''), 200),
       left(coalesce(email, ''), 255), 'user'
from auth.users;

create function fixmfu_private.validate_new_ticket()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.buildings where id = new.building_id and is_active)
     or not exists (select 1 from public.categories where id = new.category_id and is_active) then
    raise exception 'อาคารหรือหมวดหมู่นี้ปิดรับเรื่องแล้ว' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger tickets_validate_new before insert on public.tickets
for each row execute function fixmfu_private.validate_new_ticket();

create function fixmfu_private.record_new_ticket()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.ticket_events(ticket_id, actor_id, actor_role, kind, status, message)
  values (new.id, new.reporter_id,
          (select role from public.profiles where id = new.reporter_id),
          'created', new.status, 'ส่งเรื่องแจ้งซ่อมเข้าสู่ระบบ');
  return new;
end;
$$;

create trigger tickets_record_created after insert on public.tickets
for each row execute function fixmfu_private.record_new_ticket();

-- Serialize attachment metadata changes per ticket to enforce total limits under concurrency.
-- The future upload API must also validate the actual file and clean up failed uploads.
create function fixmfu_private.validate_attachment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  parent public.tickets%rowtype;
  existing_count integer;
  existing_bytes bigint;
begin
  if tg_op = 'UPDATE' and (new.id, new.ticket_id, new.kind, new.uploaded_by, new.object_path)
      is distinct from (old.id, old.ticket_id, old.kind, old.uploaded_by, old.object_path) then
    raise exception 'ไม่สามารถย้ายข้อมูลรูปแนบไปยังเรื่องอื่นได้' using errcode = '23514';
  end if;
  select * into parent from public.tickets where id = new.ticket_id for update;
  if not found then
    raise exception 'ไม่พบเรื่องแจ้ง' using errcode = '23503';
  end if;
  if (new.kind = 'report' and (parent.status <> 'pending' or new.uploaded_by <> parent.reporter_id))
     or (new.kind = 'repair' and (parent.status <> 'in_progress' or not exists (
       select 1 from public.profiles where id = new.uploaded_by and role = 'admin'
     ))) then
    raise exception 'ผู้แนบรูปหรือสถานะเรื่องไม่ถูกต้อง' using errcode = '23514';
  end if;
  select count(*), coalesce(sum(size_bytes), 0) into existing_count, existing_bytes
  from public.ticket_attachments where ticket_id = new.ticket_id and kind = new.kind and id <> new.id;
  if existing_count >= 3 or existing_bytes + new.size_bytes > 2097152 then
    raise exception 'แนบได้สูงสุด 3 รูปต่อประเภท ขนาดรวมไม่เกิน 2 MB' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger ticket_attachments_validate before insert or update on public.ticket_attachments
for each row execute function fixmfu_private.validate_attachment();

alter table public.profiles enable row level security;
alter table public.buildings enable row level security;
alter table public.categories enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_attachments enable row level security;
alter table public.ticket_events enable row level security;

-- Remove any project default grants, including TRUNCATE and REFERENCES.
revoke all on public.profiles, public.buildings, public.categories, public.tickets,
  public.ticket_attachments, public.ticket_events from public, anon, authenticated;
revoke all on sequence public.tickets_ticket_number_seq, public.ticket_events_id_seq
  from public, anon, authenticated;
grant usage on schema public to authenticated, service_role;
grant select on public.profiles, public.buildings, public.categories, public.tickets,
  public.ticket_attachments, public.ticket_events to authenticated;
grant update (full_name, contact) on public.profiles to authenticated;
grant insert (code, name, is_active), update (name, is_active)
  on public.buildings, public.categories to authenticated;
grant insert (reporter_id, building_id, category_id, title, description, location)
  on public.tickets to authenticated;
grant usage on sequence public.tickets_ticket_number_seq to authenticated;
grant all on public.profiles, public.buildings, public.categories, public.tickets,
  public.ticket_attachments, public.ticket_events to service_role;
grant all on sequence public.tickets_ticket_number_seq, public.ticket_events_id_seq to service_role;

revoke all on all functions in schema fixmfu_private from public, anon, authenticated;
grant execute on function fixmfu_private.is_admin() to authenticated;

create policy profiles_read on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select fixmfu_private.is_admin()));
create policy profiles_edit_own on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Inactive lookup rows stay readable so historical ticket names remain available.
create policy buildings_read on public.buildings for select to authenticated using (true);
create policy categories_read on public.categories for select to authenticated using (true);
create policy buildings_add_admin on public.buildings for insert to authenticated
with check ((select fixmfu_private.is_admin()));
create policy buildings_edit_admin on public.buildings for update to authenticated
using ((select fixmfu_private.is_admin())) with check ((select fixmfu_private.is_admin()));
create policy categories_add_admin on public.categories for insert to authenticated
with check ((select fixmfu_private.is_admin()));
create policy categories_edit_admin on public.categories for update to authenticated
using ((select fixmfu_private.is_admin())) with check ((select fixmfu_private.is_admin()));

create policy tickets_read on public.tickets for select to authenticated
using (reporter_id = (select auth.uid()) or (select fixmfu_private.is_admin()));
create policy tickets_create_own on public.tickets for insert to authenticated
with check (reporter_id = (select auth.uid()) and status = 'pending'
            and resolution = '' and cancellation_reason = '');
create policy attachments_read on public.ticket_attachments for select to authenticated
using (exists (select 1 from public.tickets where id = ticket_attachments.ticket_id));
create policy events_read on public.ticket_events for select to authenticated
using (exists (select 1 from public.tickets where id = ticket_events.ticket_id));

-- No client UPDATE/DELETE on tickets, or writes on attachments/events, at this stage.
-- Add audited admin RPCs and authorized upload APIs in subsequent versioned SQL files.

insert into public.buildings(code, name) values
  ('E4', 'อาคาร E4'), ('M-SQUARE', 'M-Square'), ('F1', 'หอพัก F1');
insert into public.categories(code, name) values
  ('AIR-WATER', 'แอร์/ประปา'), ('ELECTRICAL', 'ไฟฟ้า'), ('INTERNET', 'อินเทอร์เน็ต');

commit;
