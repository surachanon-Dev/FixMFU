import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { NextRequest, NextResponse } from 'next/server.js';
import nextConfig from '../next.config.mjs';

function load(file, modules = {}, env = {}) {
  const source = ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const exports = {};
  vm.runInNewContext(`(function(exports, require) {${source}\n})`, {URL, process:{env}})(exports, (name) => {
    if (!(name in modules)) throw new Error(`Unexpected dependency ${name}`);
    return modules[name];
  });
  return exports;
}

test('all routes prevent framing, MIME sniffing and unintended powerful browser APIs', async () => {
  const rules = await nextConfig.headers();
  const headers = Object.fromEntries(rules.find((rule) => rule.source === '/:path*').headers.map(({key,value}) => [key,value]));
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.equal(headers['Permissions-Policy'], 'microphone=(), payment=(), usb=()');
  const csp = headers['Content-Security-Policy'];
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp, /script-src|style-src|connect-src|default-src/);
  assert.equal(nextConfig.poweredByHeader, false);
});

test('Supabase configuration refuses remote HTTP, credentials and injected URL suffixes', () => {
  const key = 'sb_publishable_fixture';
  for (const url of ['http://project.supabase.co', 'ftp://project.supabase.co', 'https://user:password@project.supabase.co', 'https://project.supabase.co/other', 'https://project.supabase.co/?key=secret', 'https://project.supabase.co/#secret']) {
    assert.throws(() => load('../src/lib/supabase/config.ts', {}, {NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key}).getSupabaseConfig());
  }
  for (const [url, origin] of [['https://project.supabase.co/', 'https://project.supabase.co'], ['http://127.0.0.1:54321', 'http://127.0.0.1:54321']]) {
    const config = load('../src/lib/supabase/config.ts', {}, {NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key}).getSupabaseConfig();
    assert.equal(config.url, origin);
    assert.equal(config.key, key);
  }
});

test('Supabase auth cookies require HTTPS on HTTPS sites and retain localhost development support', () => {
  for (const [site, secure] of [['https://portal.example', true], ['http://localhost:3000', false]]) {
    const cookies = load('../src/lib/supabase/cookie-options.ts', {}, {NEXT_PUBLIC_SITE_URL:site}).getSupabaseCookieOptions();
    assert.equal(cookies.secure, secure);
    assert.equal(cookies.sameSite, 'lax');
    assert.equal(cookies.path, '/');
    assert.equal(cookies.domain, undefined);
  }
});

test('browser and server Supabase clients share the cookie policy', async () => {
  const policy = {secure:true,sameSite:'lax',path:'/'};
  const dependencies = {'./config':{getSupabaseConfig:() => ({url:'https://project.supabase.co',key:'sb_publishable_fixture'})}, './cookie-options':{getSupabaseCookieOptions:() => policy}};
  let browserOptions;
  load('../src/lib/supabase/client.ts', {...dependencies, '@supabase/ssr':{createBrowserClient:(_url,_key,options) => {browserOptions = options;}}}).createClient();
  let serverOptions;
  await load('../src/lib/supabase/server.ts', {...dependencies, 'server-only':{}, 'next/headers':{cookies:async () => ({getAll:() => [],set:() => {}})}, '@supabase/ssr':{createServerClient:(_url,_key,options) => {serverOptions = options;}}}).createClient();
  assert.equal(browserOptions.cookieOptions, policy);
  assert.equal(serverOptions.cookieOptions, policy);
});

test('Proxy preserves cookie refresh batches and prevents caching every personalized response', async () => {
  let options;
  const policy = {secure:true,sameSite:'lax',path:'/'};
  const {proxy} = load('../src/proxy.ts', {
    'next/server':{NextResponse},
    './lib/supabase/config':{getSupabaseConfig:() => ({url:'https://project.supabase.co',key:'sb_publishable_fixture'})},
    './lib/supabase/cookie-options':{getSupabaseCookieOptions:() => policy},
    '@supabase/ssr':{createServerClient:(_url,_key,settings) => {
      options = settings;
      return {auth:{getClaims:async () => {
        settings.cookies.setAll([{name:'sb-access',value:'new-access',options:policy}], {'Cache-Control':'public,max-age=3600'});
        settings.cookies.setAll([{name:'sb-refresh',value:'new-refresh',options:policy}], {});
        return {data:{claims:{sub:'fixture'}}};
      }}};
    }},
  });
  const response = await proxy(new NextRequest('https://portal.example/user', {headers:{cookie:'theme=cream'}}));
  assert.equal(options.cookieOptions, policy);
  assert.match(response.headers.get('cache-control'), /private.*no-store/);
  for (const name of ['sb-access','sb-refresh']) {
    assert.ok(response.cookies.get(name));
    assert.equal(response.cookies.get(name).secure, true);
    assert.match(response.headers.get('x-middleware-request-cookie'), new RegExp(`${name}=new-`));
  }
  assert.match(response.headers.get('x-middleware-request-cookie'), /theme=cream/);
});

test('Proxy Auth failure still keeps private pages uncacheable', async () => {
  const {proxy} = load('../src/proxy.ts', {
    'next/server':{NextResponse},
    './lib/supabase/config':{getSupabaseConfig:() => {throw new Error('Auth unavailable');}},
    './lib/supabase/cookie-options':{getSupabaseCookieOptions:() => ({})},
    '@supabase/ssr':{createServerClient:() => {throw new Error('must not initialize');}},
  });
  const response = await proxy(new NextRequest('https://portal.example/admin/dashboard'));
  assert.match(response.headers.get('cache-control'), /private.*no-store/);
});
