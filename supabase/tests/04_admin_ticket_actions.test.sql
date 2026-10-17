-- ISOLATED LOCAL DATABASE ONLY: Storage metadata is mocked, not real files.
-- Do not run this test in hosted Supabase SQL Editor. Fixtures roll back.
begin;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', label; end if; end;
$$;
create function pg_temp.denied(statement text, expected_state text) returns boolean language plpgsql as $$
begin execute statement; return false; exception when others then return sqlstate = expected_state; end;
$$;
insert into auth.users(id,email,email_confirmed_at) values
 ('11111111-1111-4111-8111-111111111111','reporter@lamduan.mfu.ac.th',now()),
 ('22222222-2222-4222-8222-222222222222','admin@lamduan.mfu.ac.th',now()),
 ('33333333-3333-4333-8333-333333333333','admin2@lamduan.mfu.ac.th',now()),
 ('44444444-4444-4444-8444-444444444444','personal@gmail.com',now()),
 ('55555555-5555-4555-8555-555555555555','other@lamduan.mfu.ac.th',now());
insert into auth.identities(id,user_id,provider,provider_id,identity_data)
select gen_random_uuid(),id,'google',id::text,jsonb_build_object('sub',id::text,
 'iss','https://accounts.google.com','email',email,'email_verified',true,
 'custom_claims',jsonb_build_object('hd','lamduan.mfu.ac.th')) from auth.users;
update public.profiles set role='admin' where id in ('22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444');
insert into public.tickets(id,reporter_id,building_id,category_id,title,description,location)
select t.id::uuid,'11111111-1111-4111-8111-111111111111',b.id,c.id,'QA status','details','room'
from (values ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'),('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb'),('cccccccc-cccc-4ccc-accc-cccccccccccc'),('dddddddd-dddd-4ddd-addd-dddddddddddd')) t(id)
cross join public.buildings b cross join public.categories c where b.code='E4' and c.code='AIR-WATER';
select set_config('qa.photo','[{"id":"eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee","object_path":"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/repair/eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee.webp","original_name":"repair.jpg","mime_type":"image/webp","size_bytes":100}]',true);

set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true(pg_temp.denied($q$select public.admin_update_ticket(gen_random_uuid(),'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','pending','receive')$q$,'42501'),'User cannot call Admin RPC');
select pg_temp.assert_true(pg_temp.denied($q$update public.tickets set status='in_progress' where id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'$q$,'42501'),'direct ticket update stays denied');
select pg_temp.assert_true(pg_temp.denied($q$select * from fixmfu_private.ticket_operations$q$,'42501'),'operation ledger is private');
select pg_temp.assert_true(pg_temp.denied($q$insert into storage.objects(bucket_id,name,owner_id,metadata) values ('ticket-photos','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/repair/eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee.webp','11111111-1111-4111-8111-111111111111','{"size":100,"mimetype":"image/webp"}')$q$,'42501'),'User cannot upload repair photos');

select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true(not fixmfu_private.can_upload_report_photo('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/repair/eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee.webp'),'repair upload denied until accepted');
select public.admin_update_ticket('10000000-0000-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','pending','receive');
select pg_temp.assert_true((select status='in_progress' from public.tickets where id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'),'receive moves to in_progress');
select pg_temp.assert_true((select actor_id='22222222-2222-4222-8222-222222222222' and actor_role='admin' and kind='status' and created_at is not null from public.ticket_events where ticket_id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' and kind='status'),'history records authenticated actor role and time');
select public.admin_update_ticket('10000000-0000-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','pending','receive');
select pg_temp.assert_true((select count(*)=2 from public.ticket_events where ticket_id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'),'retry creates no duplicate receive event');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true(pg_temp.denied($q$insert into storage.objects(bucket_id,name,owner_id,metadata) values ('ticket-photos','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/repair/eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee.webp','11111111-1111-4111-8111-111111111111','{"size":100,"mimetype":"image/webp"}')$q$,'42501'),'User still cannot upload repair photo when ticket is in progress');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true(pg_temp.denied($q$select public.admin_update_ticket('10000000-0000-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','pending','cancel','changed payload')$q$,'22023'),'same operation ID cannot change intent');
select public.admin_update_ticket('10000000-0000-4000-a000-000000000002','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','in_progress','note','ประสานฝ่ายอาคารแล้ว');
select public.admin_update_ticket('10000000-0000-4000-a000-000000000002','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','in_progress','note','ประสานฝ่ายอาคารแล้ว');
select pg_temp.assert_true((select count(*)=1 from public.ticket_events where ticket_id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' and kind='note'),'retry does not duplicate note');
select pg_temp.assert_true(pg_temp.denied($q$select public.admin_update_ticket(gen_random_uuid(),'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','pending','note','stale')$q$,'40001'),'stale expected status rejected');
select pg_temp.assert_true(pg_temp.denied($q$select public.admin_update_ticket(gen_random_uuid(),'cccccccc-cccc-4ccc-accc-cccccccccccc','pending','complete','skip receive')$q$,'40001'),'cannot complete before receiving');
select pg_temp.assert_true(pg_temp.denied($q$select public.admin_update_ticket(gen_random_uuid(),'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','pending','cancel',' ')$q$,'22023'),'cancellation requires reason');
select pg_temp.assert_true(pg_temp.denied($q$select public.admin_update_ticket(gen_random_uuid(),'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','in_progress','complete','')$q$,'22023'),'completion requires resolution or photo');
select pg_temp.assert_true(pg_temp.denied($q$select public.admin_update_ticket(gen_random_uuid(),'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','in_progress','complete','fixed',current_setting('qa.photo')::jsonb)$q$,'42501'),'missing image cannot close job');
select pg_temp.assert_true((select status='in_progress' from public.tickets where id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'),'failed completion leaves status unchanged');
insert into storage.objects(bucket_id,name,owner_id,metadata) values ('ticket-photos',
 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/repair/eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee.webp',
 '22222222-2222-4222-8222-222222222222','{"size":100,"mimetype":"image/webp"}');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true(pg_temp.denied($q$select public.admin_update_ticket('10000000-0000-4000-a000-000000000001','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','pending','receive')$q$,'22023'),'another Admin cannot reuse operation ID');
select pg_temp.assert_true(pg_temp.denied($q$select public.admin_update_ticket(gen_random_uuid(),'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','in_progress','complete','steal upload',current_setting('qa.photo')::jsonb)$q$,'42501'),'Admin cannot claim another upload');
insert into storage.objects(bucket_id,name,owner_id,metadata) values ('ticket-photos',
 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/repair/ffffffff-ffff-4fff-afff-ffffffffffff.webp',
 '33333333-3333-4333-8333-333333333333','{"size":100,"mimetype":"image/webp"}');
delete from storage.objects where name='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/repair/ffffffff-ffff-4fff-afff-ffffffffffff.webp';
select pg_temp.assert_true((select count(*)=0 from storage.objects where owner_id='33333333-3333-4333-8333-333333333333'),'Admin can clean own unlinked repair upload');

select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","amr":[{"method":"oauth"}]}',true);
select public.admin_update_ticket('10000000-0000-4000-a000-000000000003','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','in_progress','complete','เปลี่ยนหลอดไฟและตรวจสอบแล้ว',current_setting('qa.photo')::jsonb);
select public.admin_update_ticket('10000000-0000-4000-a000-000000000003','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','in_progress','complete','เปลี่ยนหลอดไฟและตรวจสอบแล้ว',current_setting('qa.photo')::jsonb);
select pg_temp.assert_true((select status='completed' and resolution='เปลี่ยนหลอดไฟและตรวจสอบแล้ว' from public.tickets where id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'),'completion saves status and resolution');
select pg_temp.assert_true((select count(*)=1 from public.ticket_attachments where kind='repair'),'completion and retry link photo only once');
select pg_temp.assert_true((select count(*)=4 from public.ticket_events where ticket_id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'),'all operations record exactly one event');
delete from storage.objects where bucket_id='ticket-photos';
select pg_temp.assert_true((select count(*)=1 from storage.objects),'linked repair photo cannot be deleted');
select pg_temp.assert_true(not fixmfu_private.can_upload_report_photo('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/repair/ffffffff-ffff-4fff-afff-ffffffffffff.webp'),'cannot upload after close');
select pg_temp.assert_true(pg_temp.denied($q$select public.admin_update_ticket(gen_random_uuid(),'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','in_progress','note','after close')$q$,'40001'),'closed ticket cannot be edited');
select public.admin_update_ticket('10000000-0000-4000-a000-000000000004','bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','pending','cancel','แจ้งซ้ำกับเรื่องอื่น');
select pg_temp.assert_true((select status='cancelled' and cancellation_reason='แจ้งซ้ำกับเรื่องอื่น' from public.tickets where id='bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb'),'cancel pending saves reason');
select public.admin_update_ticket(gen_random_uuid(),'cccccccc-cccc-4ccc-accc-cccccccccccc','pending','receive');
select public.admin_update_ticket(gen_random_uuid(),'cccccccc-cccc-4ccc-accc-cccccccccccc','in_progress','cancel','ไม่พบปัญหาตามที่แจ้ง');
select pg_temp.assert_true((select status='cancelled' from public.tickets where id='cccccccc-cccc-4ccc-accc-cccccccccccc'),'cancel in-progress is allowed');
select public.admin_update_ticket(gen_random_uuid(),'dddddddd-dddd-4ddd-addd-dddddddddddd','pending','receive');
select public.admin_update_ticket(gen_random_uuid(),'dddddddd-dddd-4ddd-addd-dddddddddddd','in_progress','complete',repeat('ก',1500));
select pg_temp.assert_true((select status='completed' and char_length(resolution)=1500 from public.tickets where id='dddddddd-dddd-4ddd-addd-dddddddddddd'),'completion accepts full resolution without photo');

select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","amr":[{"method":"password"}]}',true);
select pg_temp.assert_true(pg_temp.denied($q$select public.admin_update_ticket(gen_random_uuid(),'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','pending','receive')$q$,'42501'),'password Admin session denied');
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true(pg_temp.denied($q$select public.admin_update_ticket(gen_random_uuid(),'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','pending','receive')$q$,'42501'),'personal Gmail Admin denied');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true((select count(*)=1 from public.ticket_attachments where kind='repair'),'reporter can read repair metadata');
select pg_temp.assert_true((select count(*)=1 from storage.objects),'reporter can read linked repair image');
select pg_temp.assert_true((select count(*)=1 from public.ticket_events where kind='note' and message='ประสานฝ่ายอาคารแล้ว'),'reporter can read Admin note');
select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',true);
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true((select count(*)=0 from public.ticket_attachments),'other User cannot read repair metadata');
select pg_temp.assert_true((select count(*)=0 from storage.objects),'other User cannot read repair image');
reset role;
set local role anon;
select pg_temp.assert_true(pg_temp.denied($q$select public.admin_update_ticket(gen_random_uuid(),'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','pending','receive')$q$,'42501'),'anonymous cannot execute Admin RPC');
reset role;
rollback;
select 'PASS: Admin ticket actions and repair photos' as result;
