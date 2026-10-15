-- Run AFTER sql/01_initial_schema.sql in a development project SQL Editor.
-- Uses temporary test Auth accounts without signing in or sending email.
-- ALL test rows and role changes are rolled back at the end.
-- Success: final result is "PASS: FixMFU database foundation".
-- If a statement fails, run ROLLBACK; before another query in the same session.
begin;

create function pg_temp.assert_true(result boolean, label text)
returns void language plpgsql as $$
begin
  if result is distinct from true then raise exception 'FAIL: %', label; end if;
end;
$$;

create function pg_temp.expect_error(statement text, expected_state text)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state then return; end if;
    raise exception 'Expected SQLSTATE %, got %: %', expected_state, sqlstate, sqlerrm;
  end;
  raise exception 'Expected SQLSTATE %, but statement succeeded: %', expected_state, statement;
end;
$$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'fixmfu-qa-a@example.invalid', '{"full_name":"QA User A","role":"admin"}'),
  ('22222222-2222-4222-8222-222222222222', 'fixmfu-qa-b@example.invalid', '{"full_name":"QA User B"}'),
  ('33333333-3333-4333-8333-333333333333', 'fixmfu-qa-admin@example.invalid', '{}');

select pg_temp.assert_true(
  (select role = 'user' from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'signup metadata cannot grant admin'
);
-- Only the trusted SQL owner performs this temporary test promotion.
update public.profiles set role = 'admin' where id = '33333333-3333-4333-8333-333333333333';

insert into public.tickets(id, reporter_id, building_id, category_id, title, description, location)
select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', b.id, c.id,
       'QA A', 'QA description A', 'QA location A'
from public.buildings b cross join public.categories c where b.code = 'E4' and c.code = 'AIR-WATER';
insert into public.tickets(id, reporter_id, building_id, category_id, title, description, location)
select 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', b.id, c.id,
       'QA B', 'QA description B', 'QA location B'
from public.buildings b cross join public.categories c where b.code = 'F1' and c.code = 'ELECTRICAL';

insert into public.ticket_attachments(id, ticket_id, uploaded_by, kind, object_path, original_name, mime_type, size_bytes)
select ('44444444-4444-4444-8444-44444444444' || i)::uuid,
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'report',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/report/44444444-4444-4444-8444-44444444444' || i || '.png',
       'qa-' || i || '.png', 'image/png', 100
from generate_series(1, 3) as i;

select pg_temp.expect_error($q$
  insert into public.ticket_attachments(id, ticket_id, uploaded_by, kind, object_path, original_name, mime_type, size_bytes)
  values ('44444444-4444-4444-8444-444444444444', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          '11111111-1111-4111-8111-111111111111', 'report',
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/report/44444444-4444-4444-8444-444444444444.png',
          'fourth.png', 'image/png', 1)
$q$, '23514');
select pg_temp.expect_error($q$
  update public.ticket_attachments set size_bytes = 2097152 where id = '44444444-4444-4444-8444-444444444441'
$q$, '23514');
select pg_temp.expect_error($q$
  update public.ticket_attachments set object_path = 'somebody-elses-file.png' where id = '44444444-4444-4444-8444-444444444441'
$q$, '23514');

set local role anon;
select pg_temp.expect_error('select * from public.tickets', '42501');
select pg_temp.expect_error('select * from public.profiles', '42501');
select pg_temp.expect_error('select * from public.ticket_attachments', '42501');
select pg_temp.expect_error('insert into public.tickets default values', '42501');
select pg_temp.expect_error('update public.profiles set full_name = ''QA forged''', '42501');
select pg_temp.expect_error('delete from public.tickets', '42501');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select pg_temp.assert_true((select count(*) = 1 from public.profiles), 'user sees only own profile');
select pg_temp.assert_true((select count(*) = 1 from public.tickets), 'user sees only own ticket');
select pg_temp.assert_true((select count(*) = 3 from public.ticket_attachments), 'user sees own attachments');
select pg_temp.assert_true((select count(*) = 1 from public.ticket_events), 'user sees own creation event');
select pg_temp.assert_true((select count(*) = 0 from public.tickets where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 'other ticket hidden');
update public.profiles set full_name = 'QA Updated' where id = '11111111-1111-4111-8111-111111111111';
select pg_temp.assert_true((select full_name = 'QA Updated' from public.profiles), 'user edits own name');
select pg_temp.expect_error($q$update public.profiles set role = 'admin'$q$, '42501');
select pg_temp.expect_error($q$update public.tickets set status = 'completed'$q$, '42501');
select pg_temp.expect_error($q$delete from public.tickets$q$, '42501');
select pg_temp.expect_error($q$insert into public.profiles(id, role) values ('55555555-5555-4555-8555-555555555555', 'admin')$q$, '42501');
select pg_temp.expect_error($q$insert into public.ticket_attachments default values$q$, '42501');
select pg_temp.expect_error($q$delete from public.ticket_attachments$q$, '42501');
select pg_temp.expect_error($q$update public.ticket_events set message = 'forged'$q$, '42501');
select pg_temp.expect_error($q$truncate public.tickets cascade$q$, '42501');
select pg_temp.expect_error($q$insert into public.buildings(code, name) values ('QA-HACK', 'QA')$q$, '42501');
select pg_temp.expect_error($q$
  insert into public.ticket_events(ticket_id, actor_role, kind, status, message)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'admin', 'note', 'pending', 'forged')
$q$, '42501');
select pg_temp.expect_error($q$
  insert into public.tickets(reporter_id, building_id, category_id, title, description, location)
  select '22222222-2222-4222-8222-222222222222', b.id, c.id, 'QA spoof', 'QA', 'QA'
  from public.buildings b cross join public.categories c where b.code = 'E4' and c.code = 'AIR-WATER'
$q$, '42501');
select pg_temp.expect_error($q$
  insert into public.tickets(building_id, category_id, title, description, location, status)
  select b.id, c.id, 'QA forged status', 'QA', 'QA', 'completed'
  from public.buildings b cross join public.categories c where b.code = 'E4' and c.code = 'AIR-WATER'
$q$, '42501');

insert into public.tickets(building_id, category_id, title, description, location)
select b.id, c.id, 'QA genuine', 'QA description', 'QA location'
from public.buildings b cross join public.categories c where b.code = 'E4' and c.code = 'AIR-WATER';
select pg_temp.assert_true((select count(*) = 2 from public.tickets), 'user creates own pending ticket');
select pg_temp.assert_true((select count(*) = 2 from public.ticket_events), 'creation history added automatically');

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select pg_temp.assert_true((select count(*) = 1 from public.tickets), 'second user remains isolated');
select pg_temp.assert_true((select count(*) = 0 from public.ticket_attachments), 'second user cannot read first user photos');
select pg_temp.assert_true((select count(*) = 1 from public.ticket_events), 'second user cannot read first user history');

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select pg_temp.assert_true((select count(*) = 3 from public.tickets), 'admin sees all tickets');
select pg_temp.assert_true((select count(*) = 3 from public.profiles), 'admin sees all profiles');
select pg_temp.assert_true((select count(*) = 3 from public.ticket_attachments), 'admin sees all attachment metadata');
insert into public.buildings(code, name) values ('QA-INACTIVE', 'QA inactive building');
update public.buildings set is_active = false where code = 'QA-INACTIVE';
select pg_temp.assert_true((select not is_active from public.buildings where code = 'QA-INACTIVE'), 'admin deactivates lookup rows');
select pg_temp.expect_error($q$update public.profiles set role = 'admin' where role = 'user'$q$, '42501');
select pg_temp.expect_error($q$update public.tickets set status = 'completed'$q$, '42501');
select pg_temp.expect_error($q$delete from public.tickets$q$, '42501');

select set_config('request.jwt.claim.sub', '', true);
select pg_temp.assert_true((select count(*) = 0 from public.profiles), 'missing user identity sees no profiles');
select pg_temp.assert_true((select count(*) = 0 from public.tickets), 'missing user identity sees no tickets');
select pg_temp.assert_true((select count(*) = 0 from public.ticket_attachments), 'missing user identity sees no attachments');
select pg_temp.assert_true((select count(*) = 0 from public.ticket_events), 'missing user identity sees no events');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select pg_temp.expect_error($q$
  insert into public.tickets(building_id, category_id, title, description, location)
  select b.id, c.id, 'QA inactive rejected', 'QA', 'QA'
  from public.buildings b cross join public.categories c where b.code = 'QA-INACTIVE' and c.code = 'AIR-WATER'
$q$, '23514');
select pg_temp.expect_error($q$
  insert into public.tickets(building_id, category_id, title, description, location)
  select b.id, c.id, '   ', 'QA', 'QA'
  from public.buildings b cross join public.categories c where b.code = 'E4' and c.code = 'AIR-WATER'
$q$, '23514');

reset role;
rollback;
select 'PASS: FixMFU database foundation' as result;
