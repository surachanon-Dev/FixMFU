-- Run ONCE after 01_initial_schema.sql. This switches data access to university Google OAuth.
-- Does NOT enable the Google provider or hook in the Dashboard; follow the setup guide.
-- Existing non-university/password accounts are retained, but lose client access to app data.
begin;

create function fixmfu_private.is_university_google_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (auth.jwt() -> 'amr' @> '[{"method":"oauth"}]'::jsonb)
    and exists (
      select 1 from auth.users u
      join auth.identities i on i.user_id = u.id and i.provider = 'google'
      where u.id = (select auth.uid())
        and u.email_confirmed_at is not null
        and lower(u.email) ~ '^[^[:space:]@]+@lamduan\.mfu\.ac\.th$'
        and lower(i.identity_data ->> 'email') = lower(u.email)
        and i.identity_data -> 'email_verified' = 'true'::jsonb
        and i.identity_data ->> 'iss' = 'https://accounts.google.com'
        and coalesce(i.identity_data ->> 'sub', '') <> ''
        and i.identity_data -> 'custom_claims' ->> 'hd' = 'lamduan.mfu.ac.th'
    ), false
  );
$$;
revoke all on function fixmfu_private.is_university_google_user() from public, anon, authenticated;
grant execute on function fixmfu_private.is_university_google_user() to authenticated;

-- RESTRICTIVE policies are ANDed with existing ownership/admin policies, not ORed.
do $$
declare target text;
begin
  foreach target in array array['profiles','buildings','categories','tickets','ticket_attachments','ticket_events'] loop
    execute format(
      'create policy fixmfu_university_google_only on public.%I as restrictive for all to authenticated '
      || 'using ((select fixmfu_private.is_university_google_user())) '
      || 'with check ((select fixmfu_private.is_university_google_user()))', target
    );
  end loop;
end;
$$;

-- Supabase Auth supplies app_metadata/provider and Google's verified claims for OAuth signups.
-- This function is NOT callable by a browser, and user_metadata is never used in the data gate.
create function public.hook_lamduan_google_signup(event jsonb)
returns jsonb language plpgsql set search_path = '' as $$
begin
  if coalesce(event -> 'user' -> 'app_metadata' ->> 'provider', '') <> 'google'
     or coalesce(lower(event -> 'user' ->> 'email'), '') !~ '^[^[:space:]@]+@lamduan\.mfu\.ac\.th$'
     or (event -> 'user' -> 'user_metadata' -> 'email_verified') is distinct from 'true'::jsonb
     or coalesce(event -> 'user' -> 'user_metadata' ->> 'iss', '') <> 'https://accounts.google.com'
     or coalesce(event -> 'user' -> 'user_metadata' -> 'custom_claims' ->> 'hd', '') <> 'lamduan.mfu.ac.th' then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403, 'message', 'อนุญาตเฉพาะบัญชี Google มหาวิทยาลัย @lamduan.mfu.ac.th'
    ));
  end if;
  return '{}'::jsonb;
end;
$$;
revoke all on function public.hook_lamduan_google_signup(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_lamduan_google_signup(jsonb) to supabase_auth_admin;

commit;
