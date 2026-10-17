-- Development-only test after scripts 01 and 02. No emails, all fixture rows rolled back.
begin;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', label; end if; end;
$$;

insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data) values
 ('11111111-1111-4111-8111-111111111111','qa@lamduan.mfu.ac.th',now(),'{}'),
 ('22222222-2222-4222-8222-222222222222','qa@gmail.com',now(),'{"custom_claims":{"hd":"lamduan.mfu.ac.th"},"email_verified":true}'),
 ('33333333-3333-4333-8333-333333333333','qa-other@lamduan.mfu.ac.th',now(),'{}');
-- Identities are written by Auth, never by a client or editable profile metadata.
insert into auth.identities(id, user_id, provider, provider_id, identity_data)
select gen_random_uuid(), id, 'google', id::text, jsonb_build_object(
 'sub',id::text,'iss','https://accounts.google.com','email',email,'email_verified',true,
 'custom_claims',jsonb_build_object('hd', case when id='11111111-1111-4111-8111-111111111111'::uuid then 'lamduan.mfu.ac.th' else 'attacker.invalid' end)
) from auth.users where id in (
 '11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
update public.profiles set role='admin' where id='22222222-2222-4222-8222-222222222222';

set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true(fixmfu_private.is_university_google_user(),'university Google OAuth is allowed');
select pg_temp.assert_true((select count(*)=1 from public.profiles),'valid user sees own profile');
select pg_temp.assert_true((select count(*)=3 from public.buildings),'valid user reads lookup data');
insert into public.tickets(building_id,category_id,title,description,location)
select b.id,c.id,'QA Google','QA description','QA room'
from public.buildings b cross join public.categories c where b.code='E4' and c.code='AIR-WATER';
select pg_temp.assert_true((select count(*)=1 from public.ticket_events),'valid OAuth user creates ticket and history');

select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","amr":[{"method":"password"}]}',true);
select pg_temp.assert_true(not fixmfu_private.is_university_google_user(),'password session is denied even with linked Google');
select pg_temp.assert_true((select count(*)=0 from public.tickets),'password session cannot read tickets');

select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true(not fixmfu_private.is_university_google_user(),'personal Gmail with forged metadata is denied');
select pg_temp.assert_true((select count(*)=0 from public.profiles),'personal Gmail admin cannot read profiles');
select pg_temp.assert_true((select count(*)=0 from public.buildings),'restrictive rule also applies to lookup tables');
select pg_temp.assert_true((select count(*)=0 from public.tickets),'admin role cannot override domain gate');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","amr":[{"method":"oauth"}]}',true);
select pg_temp.assert_true(not fixmfu_private.is_university_google_user(),'email suffix without verified Google hosted domain is denied');
reset role;

set local role supabase_auth_admin;
select pg_temp.assert_true(public.hook_lamduan_google_signup('{"user":{"email":"qa@lamduan.mfu.ac.th","app_metadata":{"provider":"google"},"user_metadata":{"iss":"https://accounts.google.com","email_verified":true,"custom_claims":{"hd":"lamduan.mfu.ac.th"}}}}')='{}'::jsonb,'Auth hook allows verified Google organization');
select pg_temp.assert_true(public.hook_lamduan_google_signup('{"user":{"email":"qa@gmail.com","app_metadata":{"provider":"google"}}}') ? 'error','Auth hook blocks personal Gmail');
select pg_temp.assert_true(public.hook_lamduan_google_signup('{"user":{"email":"qa@lamduan.mfu.ac.th","app_metadata":{"provider":"email"},"user_metadata":{"iss":"https://accounts.google.com","email_verified":true,"custom_claims":{"hd":"lamduan.mfu.ac.th"}}}}') ? 'error','Auth hook blocks spoofed email/password signup');
select pg_temp.assert_true(public.hook_lamduan_google_signup('{"user":{"email":"qa@lamduan.mfu.ac.th.attacker.invalid","app_metadata":{"provider":"google"},"user_metadata":{"iss":"https://accounts.google.com","email_verified":true,"custom_claims":{"hd":"lamduan.mfu.ac.th"}}}}') ? 'error','Auth hook blocks lookalike suffix');
reset role;
rollback;
select 'PASS: university Google access restrictions' as result;
