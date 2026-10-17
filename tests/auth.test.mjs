import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, modules = {}, context = {}) {
  const source = ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(`(function(exports, require) {${source}\n})`, { FormData, URL, ...context })(exports, (name) => {
    if (!(name in modules)) throw new Error(`Unexpected dependency ${name}`);
    return modules[name];
  });
  return exports;
}
const policy = load('../src/lib/auth-policy.ts');
function redirect(path) { throw new Error(`REDIRECT:${path}`); }
const universityUser = { id: 'verified-user', email: 'qa@lamduan.mfu.ac.th', email_confirmed_at: '2026-10-17T00:00:00Z', identities: [{provider:'google', identity_data:{sub:'google-sub',iss:'https://accounts.google.com',email:'qa@lamduan.mfu.ac.th',email_verified:true,custom_claims:{hd:'lamduan.mfu.ac.th'}}}] };
function fakeClient({ claims = { data: { claims: { sub: 'verified-user', amr: [{method:'oauth'}] } }, error: null }, role = 'user', profileError = false, signInError = null, user = universityUser, oauthUrl = 'https://project.supabase.co/auth/v1/authorize?provider=google', exchangeError = null } = {}) {
  let signOuts = 0;
  const row = role === null ? null : { id: 'verified-user', full_name: 'QA', role };
  const client = {
    auth: {
      getClaims: async () => claims,
      getUser: async () => ({data:{user},error:null}),
      exchangeCodeForSession: async () => ({error:exchangeError}),
      signInWithOAuth: async (options) => {
        assert.equal(options.provider, 'google');
        assert.equal(options.options.redirectTo, 'https://portal.example/auth/callback');
        assert.equal(options.options.queryParams.hd, 'lamduan.mfu.ac.th');
        assert.equal(options.options.scopes, 'openid email profile');
        return {data:{url:oauthUrl},error:signInError};
      },
      signOut: async () => { signOuts++; return { error: null }; },
    },
    from: () => ({ select: () => ({ eq: (_field, id) => {
      assert.equal(id, 'verified-user');
      return { maybeSingle: async () => ({ data: row, error: profileError ? new Error('offline') : null }) };
    } }) }),
  };
  return { client, signOuts: () => signOuts };
}
function authModule(client) {
  return load('../src/lib/auth.ts', { 'server-only': {}, react: { cache: (fn) => fn }, 'next/navigation': { redirect }, './supabase/server': { createClient: async () => client }, './auth-policy': policy });
}
function actions(client) {
  return load('../src/app/auth/actions.ts', { 'next/navigation': { redirect }, '../../lib/supabase/server': { createClient: async () => client }, '../../lib/auth-policy': policy, '../../lib/supabase/origin': {getAuthOrigin:()=> 'https://portal.example'}, '../../lib/supabase/config': {getSupabaseConfig:()=> ({url:'https://project.supabase.co'})} });
}
function callback(client) {
  return load('../src/app/auth/callback/route.ts', {'next/server': {NextResponse:{redirect:(url,status)=>new Response(null,{status,headers:{location:String(url)}})}}, '../../../lib/supabase/server':{createClient:async()=>client}, '../../../lib/supabase/origin':{getAuthOrigin:()=> 'https://portal.example'}, '../../../lib/auth-policy':policy});
}

test('unverified claims never authorize a profile or either portal', async () => {
  const { client } = fakeClient({ claims: { data: null, error: new Error('invalid signature') }, role: 'admin' });
  const auth = authModule(client);
  assert.equal((await auth.getAuthState()).profile, null);
  await assert.rejects(auth.requireProfile(), /REDIRECT:\/login/);
  await assert.rejects(auth.requireProfile(true), /REDIRECT:\/login/);
});
test('missing, unknown or unavailable DB roles fail closed', async () => {
  for (const options of [{ role: null }, { role: 'superadmin' }, { profileError: true }]) {
    const auth = authModule(fakeClient(options).client);
    assert.equal((await auth.getAuthState()).error, true);
    await assert.rejects(auth.requireProfile(true), /REDIRECT:\/auth\/error/);
  }
});
test('verified user can enter user portal but admin is rejected; admin can enter both', async () => {
  const user = authModule(fakeClient().client);
  assert.equal((await user.requireProfile()).role, 'user');
  await assert.rejects(user.requireProfile(true), /REDIRECT:\/forbidden/);
  const admin = authModule(fakeClient({ role: 'admin' }).client);
  assert.equal((await admin.requireProfile(true)).role, 'admin');
  assert.equal((await admin.requireProfile()).role, 'admin');
});
test('OAuth start targets only the configured Supabase authorize endpoint', async () => {
  await assert.rejects(actions(fakeClient().client).loginWithGoogle(), /REDIRECT:https:\/\/project.supabase.co\/auth\/v1\/authorize/);
  for (const oauthUrl of ['https://attacker.invalid/auth/v1/authorize', 'https://project.supabase.co/other']) {
    assert.ok((await actions(fakeClient({oauthUrl}).client).loginWithGoogle()).error);
  }
  assert.ok((await actions(fakeClient({signInError:new Error('provider disabled')}).client).loginWithGoogle()).error);
});
test('missing role after OAuth callback signs out the session', async () => {
  const fake = fakeClient({ role: null });
  const result = await callback(fake.client).GET({nextUrl:new URL('https://portal.example/auth/callback?code=fixture')});
  assert.equal(fake.signOuts(), 1);
  assert.equal(result.headers.get('location'), 'https://portal.example/login?error=profile');
});
test('Google identity must be verified, match current email and have exact hosted domain', () => {
  assert.equal(policy.hasUniversityGoogleIdentity(universityUser), true);
  for (const email of ['qa@gmail.com','qa@mfu.ac.th','qa@sub.lamduan.mfu.ac.th','qa@lamduan.mfu.ac.th.attacker.invalid','qa@@lamduan.mfu.ac.th']) assert.equal(policy.isUniversityEmail(email), false);
  const data = universityUser.identities[0].identity_data;
  for (const altered of [{...data,email_verified:false},{...data,custom_claims:{hd:'mfu.ac.th'}},{...data,custom_claims:{}},{...data,iss:'https://attacker.invalid'},{...data,email:'someoneelse@lamduan.mfu.ac.th'}]) {
    assert.equal(policy.hasUniversityGoogleIdentity({...universityUser,identities:[{provider:'google',identity_data:altered}]}),false);
  }
  assert.equal(policy.hasUniversityGoogleIdentity({...universityUser,identities:[],user_metadata:data}),false);
});
test('password sessions with Google linked cannot enter the portal', async () => {
  const auth = authModule(fakeClient({claims:{data:{claims:{sub:'verified-user',amr:[{method:'password'}]}},error:null}}).client);
  await assert.rejects(auth.requireProfile(), /REDIRECT:\/login/);
});
test('OAuth callback uses only canonical origin and DB role, ignores next and request host', async () => {
  for (const role of ['user','admin']) {
    const response = await callback(fakeClient({role}).client).GET({nextUrl:new URL('https://attacker.invalid/auth/callback?code=fixture&next=https://attacker.invalid')});
    assert.equal(response.status,303);
    assert.equal(response.headers.get('location'),`https://portal.example${role==='admin'?'/admin/dashboard':'/user'}`);
    assert.match(response.headers.get('cache-control'),/no-store/);
  }
});
test('cancelled, missing and rejected OAuth codes fail closed without reflecting secrets', async () => {
  for (const query of ['', '?error=access_denied&error_description=secret']) {
    const response=await callback(fakeClient().client).GET({nextUrl:new URL('https://portal.example/auth/callback'+query)});
    assert.equal(response.headers.get('location'),'https://portal.example/login?error=oauth');
  }
  const response=await callback(fakeClient({exchangeError:new Error('bad code')}).client).GET({nextUrl:new URL('https://portal.example/auth/callback?code=secret')});
  assert.equal(response.headers.get('location'),'https://portal.example/login?error=oauth');
});
test('non-university Google identity is signed out on callback and denied on all portals', async () => {
  const fake = fakeClient({user:{...universityUser,email:'qa@gmail.com'}});
  const response=await callback(fake.client).GET({nextUrl:new URL('https://portal.example/auth/callback?code=fixture')});
  assert.equal(response.headers.get('location'),'https://portal.example/login?error=domain');
  assert.equal(fake.signOuts(),1);
  await assert.rejects(authModule(fake.client).requireProfile(true),/REDIRECT:\/login/);
});
test('logout calls provider signout then redirects to login', async () => {
  const fake = fakeClient();
  await assert.rejects(actions(fake.client).logout(), /REDIRECT:\/login/);
  assert.equal(fake.signOuts(), 1);
});

test('OAuth site origin rejects insecure remote URLs and redirect injection', () => {
  for (const value of [undefined, 'http://attacker.invalid', 'javascript:alert(1)', 'https://portal.example/other', 'https://user:secret@portal.example', 'https://portal.example/?next=evil', 'https://portal.example/#evil']) {
    const origin = load('../src/lib/supabase/origin.ts', {'server-only':{}}, {process:{env:{NEXT_PUBLIC_SITE_URL:value}}});
    assert.throws(()=>origin.getAuthOrigin());
  }
  for (const value of ['http://localhost:3100','https://portal.example']) {
    const origin=load('../src/lib/supabase/origin.ts', {'server-only':{}}, {process:{env:{NEXT_PUBLIC_SITE_URL:value}}});
    assert.equal(origin.getAuthOrigin(),value);
  }
});
