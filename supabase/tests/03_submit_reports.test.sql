-- ISOLATED LOCAL DATABASE ONLY: the harness mocks Storage metadata (no real files).
-- Do not run this file against hosted Supabase Storage. All fixtures roll back.
begin;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', label; end if; end;
$$;
create function pg_temp.denied(statement text) returns boolean language plpgsql as $$
begin execute statement; return false; exception when others then return true; end;
$$;
insert into auth.users(id,email,email_confirmed_at) values
 ('11111111-1111-4111-8111-111111111111','reporter@lamduan.mfu.ac.th',now()),
 ('22222222-2222-4222-8222-222222222222','other@lamduan.mfu.ac.th',now()),
 ('33333333-3333-4333-8333-333333333333','admin@lamduan.mfu.ac.th',now()),
 ('44444444-4444-4444-8444-444444444444','personal@gmail.com',now());
insert into auth.identities(id,user_id,provider,provider_id,identity_data)
select gen_random_uuid(),id,'google',id::text,jsonb_build_object('sub',id::text,
 'iss','https://accounts.google.com','email',email,'email_verified',true,
 'custom_claims',jsonb_build_object('hd','lamduan.mfu.ac.th')) from auth.users;
update public.profiles set role='admin' where id='33333333-3333-4333-8333-333333333333';
select set_config('qa.building',(select id::text from public.buildings where code='E4'),true);
select set_config('qa.category',(select id::text from public.categories where code='AIR-WATER'),true);
select set_config('qa.photos','[{"id":"bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb","object_path":"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/report/bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb.webp","original_name":"QA.png","mime_type":"image/webp","size_bytes":100}]',true);

set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","amr":[{"method":"oauth"}]}',true);
insert into storage.objects(bucket_id,name,owner_id,metadata) values ('ticket-photos',
 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/report/bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb.webp',
 '11111111-1111-4111-8111-111111111111','{"size":100,"mimetype":"image/webp"}');
select public.submit_repair_report('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',current_setting('qa.building')::uuid,current_setting('qa.category')::uuid,'QA title','QA details','QA room',current_setting('qa.photos')::jsonb);
select pg_temp.assert_true((select count(*)=1 from public.tickets),'submission creates one ticket');
select pg_temp.assert_true((select count(*)=1 from public.ticket_attachments),'submission links uploaded photo');
select pg_temp.assert_true((select count(*)=1 from public.ticket_events),'submission records history');
select public.submit_repair_report('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',current_setting('qa.building')::uuid,current_setting('qa.category')::uuid,'QA title','QA details','QA room',current_setting('qa.photos')::jsonb);
select pg_temp.assert_true((select count(*)=1 from public.ticket_events),'same request retry creates no duplicate history');
select pg_temp.assert_true(pg_temp.denied($q$select public.submit_repair_report(gen_random_uuid(),current_setting('qa.building')::uuid,current_setting('qa.category')::uuid,'','details','room','[]')$q$),'empty title rejected by RPC');
select pg_temp.assert_true(pg_temp.denied($q$select public.submit_repair_report(gen_random_uuid(),current_setting('qa.building')::uuid,current_setting('qa.category')::uuid,'oversized','details','room','[{"id":"bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb","size_bytes":2097153}]')$q$),'oversized metadata rejected by RPC');
select pg_temp.assert_true(pg_temp.denied($q$select public.submit_repair_report(gen_random_uuid(),current_setting('qa.building')::uuid,current_setting('qa.category')::uuid,'duplicate photo','details','room',current_setting('qa.photos')::jsonb || current_setting('qa.photos')::jsonb)$q$),'duplicate photo IDs rejected by RPC');
select pg_temp.assert_true(pg_temp.denied($q$select public.submit_repair_report('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',current_setting('qa.building')::uuid,current_setting('qa.category')::uuid,'changed title','QA details','QA room',current_setting('qa.photos')::jsonb)$q$),'changed payload cannot replace submitted ticket');
delete from storage.objects where bucket_id='ticket-photos';
select pg_temp.assert_true((select count(*)=1 from storage.objects),'linked object cannot be deleted');
update storage.objects set metadata='{}' where bucket_id='ticket-photos';
select pg_temp.assert_true((select metadata->>'size'='100' from storage.objects),'linked object cannot be overwritten');
insert into storage.objects(bucket_id,name,owner_id,metadata) values ('ticket-photos',
 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee/report/ffffffff-ffff-4fff-afff-ffffffffffff.webp',
 '11111111-1111-4111-8111-111111111111','{"size":100,"mimetype":"image/webp"}');

select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true((select count(*)=0 from public.tickets),'other user cannot read ticket');
select pg_temp.assert_true((select count(*)=0 from storage.objects),'other user cannot read photo');
select pg_temp.assert_true(pg_temp.denied($q$select public.submit_repair_report('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',current_setting('qa.building')::uuid,current_setting('qa.category')::uuid,'QA title','QA details','QA room',current_setting('qa.photos')::jsonb)$q$),'other user cannot reuse submission ID');
select pg_temp.assert_true(pg_temp.denied($q$insert into storage.objects(bucket_id,name,owner_id) values ('ticket-photos','cccccccc-cccc-4ccc-accc-cccccccccccc/report/dddddddd-dddd-4ddd-addd-dddddddddddd.webp','11111111-1111-4111-8111-111111111111')$q$),'uploader cannot spoof owner');
select pg_temp.assert_true(pg_temp.denied($q$select public.submit_repair_report('cccccccc-cccc-4ccc-accc-cccccccccccc',current_setting('qa.building')::uuid,current_setting('qa.category')::uuid,'missing upload','details','room','[{"id":"dddddddd-dddd-4ddd-addd-dddddddddddd","object_path":"cccccccc-cccc-4ccc-accc-cccccccccccc/report/dddddddd-dddd-4ddd-addd-dddddddddddd.webp","original_name":"x.png","mime_type":"image/webp","size_bytes":100}]')$q$),'missing upload rejected');
select pg_temp.assert_true((select count(*)=0 from public.tickets),'failed submission creates no partial ticket');
select pg_temp.assert_true(pg_temp.denied($q$select public.submit_repair_report('eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee',current_setting('qa.building')::uuid,current_setting('qa.category')::uuid,'steal file','details','room','[{"id":"ffffffff-ffff-4fff-afff-ffffffffffff","object_path":"eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee/report/ffffffff-ffff-4fff-afff-ffffffffffff.webp","original_name":"x.png","mime_type":"image/webp","size_bytes":100}]')$q$),'cannot link another users unsubmitted object');

insert into storage.objects(bucket_id,name,owner_id,metadata) values ('ticket-photos',
 'cccccccc-cccc-4ccc-accc-cccccccccccc/report/dddddddd-dddd-4ddd-addd-dddddddddddd.webp',
 '22222222-2222-4222-8222-222222222222','{"size":100,"mimetype":"image/webp"}');
delete from storage.objects where bucket_id='ticket-photos';
select pg_temp.assert_true((select count(*)=0 from storage.objects),'own unlinked uploads can be cleaned up');
select public.submit_repair_report('cccccccc-cccc-4ccc-accc-cccccccccccc',current_setting('qa.building')::uuid,current_setting('qa.category')::uuid,'without photos','details','room','[]');
select pg_temp.assert_true((select count(*)=1 from public.tickets),'optional photos may be omitted');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true((select count(*)=2 from public.tickets),'university admin can read tickets');
select pg_temp.assert_true((select count(*)=1 from storage.objects),'university admin can read linked photo');
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","amr":[{"method":"password"}]}',true);
select pg_temp.assert_true(pg_temp.denied($q$select public.submit_repair_report(gen_random_uuid(),current_setting('qa.building')::uuid,current_setting('qa.category')::uuid,'password','details','room','[]')$q$),'password session cannot submit through security definer');
select pg_temp.assert_true((select count(*)=0 from storage.objects),'password session cannot read images');
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true(pg_temp.denied($q$select public.submit_repair_report(gen_random_uuid(),current_setting('qa.building')::uuid,current_setting('qa.category')::uuid,'personal','details','room','[]')$q$),'personal Gmail cannot submit');
reset role;
set local role anon;
select pg_temp.assert_true(pg_temp.denied($q$select public.submit_repair_report(gen_random_uuid(),null,null,'anonymous','details','room','[]')$q$),'anonymous cannot execute submit RPC');
select pg_temp.assert_true((select count(*)=0 from storage.objects),'anonymous cannot read private photos');
reset role;
rollback;
select 'PASS: report submission and photo access' as result;
