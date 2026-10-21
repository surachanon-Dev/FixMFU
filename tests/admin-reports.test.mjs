import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, modules = {}) {
  const source = ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(`(function(exports, require) {${source}\n})`, {})(exports, name => {
    if (!(name in modules)) throw new Error(`Unexpected dependency ${name}`);
    return modules[name];
  });
  return exports;
}
const { UUID_PATTERN } = load('../src/lib/report-validation.ts');
function row(index = 1, photo = false) {
  const id=`aaaaaaaa-aaaa-4aaa-aaaa-${String(index).padStart(12,'0')}`;
  return { id,ticket_number:index,reporter_id:`reporter-${index}`,title:`เรื่องจริง ${index}`,description:'รายละเอียด',location:'E4-301',status:'pending',created_at:'2026-10-17T12:30:00Z',updated_at:'2026-10-17T12:30:00Z',resolution:'',cancellation_reason:'',buildings:{name:'อาคาร E4'},categories:{name:'ไฟฟ้า'},profiles:{id:`reporter-${index}`,full_name:`ผู้แจ้ง ${index}`,contact:`qa${index}@lamduan.mfu.ac.th`},ticket_attachments:photo ? [{original_name:'QA.jpg',object_path:`${id}/report/photo.webp`,kind:'report'}] : [],ticket_events:[{id:index,created_at:'2026-10-17T12:30:00Z',actor_role:'user',status:'pending',message:'ส่งเรื่องแจ้งซ่อมเข้าสู่ระบบ'}] };
}
function harness({role='admin',rows=[],queryError=false,signError=false}={}) {
  const calls={auth:[],queries:[],signed:[],clients:0};
  const source={rows,queryError};
  const client={
    from: table=>{
      const entry={table,filters:[],orders:[],select:''};calls.queries.push(entry);
      const query={select:select=>{entry.select=select;return query;},eq:(...args)=>{entry.filters.push(args);return query;},order:(...args)=>{entry.orders.push(args);return query;},range:async(start,end)=>{
        entry.range=[start,end];
        return {data:source.rows.filter(row=>entry.filters.every(([key,value])=>row[key]===value)).slice(start,end+1),error:source.queryError ? {message:'database private details'} : null};
      }};
      return query;
    },
    storage:{from:bucket=>({createSignedUrls:async(paths,expires)=>{
      calls.signed.push({bucket,paths,expires});
      return {error:null,data:paths.map(path=>signError ? {path,error:'denied'} : {path,signedUrl:`https://storage.example/private/${path}?temporary=1`})};
    }})},
  };
  const reports=load('../src/lib/user-reports.ts',{'server-only':{},'./auth':{requireProfile:async admin=>{
    calls.auth.push(admin);
    if (!role || (admin && role!=='admin')) throw new Error('ACCESS_DENIED');
    return {id:'reporter-1',full_name:'บัญชีปัจจุบัน',role};
  }},'./supabase/server':{createClient:async()=>{calls.clients++;return client;}},'./report-validation':{UUID_PATTERN}});
  return {reports,calls,source};
}

test('admin reads tickets from different reporters with their actual profile and private photo',async()=>{
  const {reports,calls}=harness({rows:[row(1,true),row(2)]});
  const tickets=await reports.getAdminReports();
  assert.equal(tickets.length,2);assert.equal(tickets[1].title,'เรื่องจริง 2');
  assert.equal(tickets[1].reporter.id,'reporter-2');assert.equal(tickets[1].reporter.name,'ผู้แจ้ง 2');
  assert.equal(tickets[1].reporter.contact,'qa2@lamduan.mfu.ac.th');assert.equal(tickets[0].number,'REQ-001');
  assert.match(tickets[0].photos[0].dataUrl,/^https:\/\/storage\.example\/private\//);
  assert.equal(tickets[0].history[0].message,'ส่งเรื่องแจ้งซ่อมเข้าสู่ระบบ');
  assert.equal(calls.auth[0],true);assert.ok(!calls.queries[0].filters.some(([field])=>field==='reporter_id'));
  assert.match(calls.queries[0].select,/profiles!tickets_reporter_id_fkey/);
  assert.equal(calls.signed[0].bucket,'ticket-photos');assert.equal(calls.signed[0].expires,900);
});
test('admin detail filters the real UUID; invalid IDs never query the database',async()=>{
  const {reports,calls}=harness({rows:[row(1),row(2)]});
  const tickets=await reports.getAdminReports(row(2).id);
  assert.equal(tickets.length,1);assert.equal(tickets[0].id,row(2).id);
  assert.ok(calls.queries[0].filters.some(([field,value])=>field==='id' && value===row(2).id));
  const count=calls.clients;
  assert.equal((await reports.getAdminReports('REQ-001')).length,0);
  assert.equal((await reports.getAdminReports('')).length,0);assert.equal(calls.clients,count);
});
test('ordinary users and anonymous cannot load admin data; admin in user portal remains scoped to own reports',async()=>{
  for (const role of ['user',null]) {
    const {reports,calls}=harness({role,rows:[row(1),row(2)]});
    await assert.rejects(reports.getAdminReports(),/ACCESS_DENIED/);assert.equal(calls.clients,0);
  }
  const {reports,calls}=harness({rows:[row(1),row(2)]});
  const own=await reports.getOwnReports();
  assert.equal(own.length,1);assert.equal(own[0].reporter.id,'reporter-1');assert.equal(own[0].reporter.contact,'');
  assert.equal(calls.auth[0],false);assert.ok(calls.queries[0].filters.some(([field,value])=>field==='reporter_id' && value==='reporter-1'));
});
test('all result pages are read so admin counts are not truncated at the API default limit',async()=>{
  const {reports,calls}=harness({rows:Array.from({length:1001},(_,i)=>row(i+1))});
  assert.equal((await reports.getAdminReports()).length,1001);
  assert.equal(calls.queries.length,3);
  assert.deepEqual(calls.queries.map(query=>query.range),[[0,499],[500,999],[1000,1499]]);
  assert.ok(calls.queries.every(query=>query.orders.some(([field])=>field==='id')));
});
test('empty, unavailable or changed database never falls back to demo rows or cached browser data',async()=>{
  const {reports,source}=harness();
  assert.equal((await reports.getAdminReports()).length,0);
  source.rows=[row(2)];assert.equal((await reports.getAdminReports())[0].title,'เรื่องจริง 2');
  source.queryError=true;await assert.rejects(reports.getAdminReports(),/REPORTS_UNAVAILABLE/);
  const signed=harness({rows:[row(1,true)],signError:true});
  await assert.rejects(signed.reports.getAdminReports(),/REPORT_PHOTOS_UNAVAILABLE/);
});

test('admin list and report summaries skip photo signing, event histories and contact details',async()=>{
  const {reports,calls}=harness({rows:[row(1,true),row(2)]});
  const data=await reports.getAdminTicketSummaries();
  assert.equal(data.length,2);assert.equal(data[0].reporter.name,'ผู้แจ้ง 1');
  assert.equal(data[0].reporter.contact,'');assert.equal(data[0].photos.length,0);assert.equal(data[0].history.length,0);
  assert.equal(calls.signed.length,0);assert.equal(calls.auth[0],true);
  assert.ok(!calls.queries[0].select.includes('ticket_attachments'));
  assert.ok(!calls.queries[0].select.includes('ticket_events'));
  assert.ok(!calls.queries[0].select.includes('contact'));
  const denied=harness({role:'user'});
  await assert.rejects(()=>denied.reports.getAdminTicketSummaries(),/ACCESS_DENIED/);
  assert.equal(denied.calls.clients,0);
});
