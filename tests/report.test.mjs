import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

function load(file, modules = {}) {
  const source = ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(`(function(exports, require) {${source}\n})`, { FormData, Buffer })(exports, name => {
    if (!(name in modules)) throw new Error(`Unexpected dependency ${name}`);
    return modules[name];
  });
  return exports;
}
const validation = load('../src/lib/report-validation.ts');
const id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const photoId = 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb';
function form(withPhoto = false) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ submissionId: id, building: '11111111-1111-4111-8111-111111111111', category: '22222222-2222-4222-8222-222222222222', title: 'แอร์ไม่เย็น', details: 'เปิดแล้วไม่เย็น', location: 'E4-301' })) data.set(key, value);
  if (withPhoto) data.append('photos', new Blob(['bytes'], { type: 'image/png' }), 'QA.png');
  return data;
}
test('report validation rejects missing fields, forged lookup IDs, oversized input and invalid files', () => {
  assert.equal(validation.validateReport(form()).title, 'แอร์ไม่เย็น');
  for (const [key, value] of [['title', ' '], ['details', 'x'.repeat(5001)], ['location', ''], ['building', 'อาคาร E4'], ['submissionId', '../other']]) {
    const data = form(); data.set(key, value); assert.throws(() => validation.validateReport(data));
  }
  assert.equal(validation.reportFiles(form()).length, 0);
  const text = form(); text.append('photos', 'spoof'); assert.throws(() => validation.reportFiles(text));
  const large = form(); large.append('photos', new Blob([Buffer.alloc(2097153)], {type:'image/png'}), 'large.png'); assert.throws(() => validation.reportFiles(large));
  const many = form(); for (let i=0;i<4;i++) many.append('photos',new Blob(['x'],{type:'image/png'}),`${i}.png`); assert.throws(() => validation.reportFiles(many));
  const svg = form(); svg.append('photos',new Blob(['<svg/>'],{type:'image/svg+xml'}),'x.svg'); assert.throws(() => validation.reportFiles(svg));
});

const images = load('../src/lib/report-images.ts', {'server-only':{}, 'node:crypto':{createHash}, sharp, './report-validation':validation});
test('server decodes actual images, re-encodes to WebP and produces stable IDs for retries', async () => {
  const png = await sharp({create:{width:12,height:10,channels:3,background:'#F4A300'}}).png().toBuffer();
  const data = form(); data.append('photos',new Blob([png],{type:'image/png'}),'QA.png');
  const first = await images.prepareReportImages(id,validation.reportFiles(data));
  const retry = await images.prepareReportImages(id,validation.reportFiles(data));
  assert.equal(first[0].metadata.object_path,retry[0].metadata.object_path);
  assert.equal(first[0].metadata.size_bytes,first[0].bytes.length);
  assert.equal((await sharp(first[0].bytes).metadata()).format,'webp');
  assert.ok(validation.UUID_PATTERN.test(first[0].metadata.id));
  await assert.rejects(images.prepareReportImages(id,validation.reportFiles(form(true))));
  const svg = form(); svg.append('photos',new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'],{type:'image/png'}),'fake.png');
  await assert.rejects(images.prepareReportImages(id,validation.reportFiles(svg)));
});

function actionHarness(options = {}) {
  const calls = {uploads:[],removed:[],rpcs:[],revalidated:[],photos:0};
  const metadata = {id:photoId,object_path:`${id}/report/${photoId}.webp`,original_name:'QA.png',mime_type:'image/webp',size_bytes:5};
  const client = {
    from: table => {
      const query = {select:()=>query,eq:()=>query,maybeSingle:async()=>({data: table === 'tickets' ? options.prior ? {id} : null : options.inactive ? null : {id:'lookup'},error:null})};
      return query;
    },
    storage:{from:()=>({
      upload:async(path)=>{calls.uploads.push(path);return {error:options.uploadError || calls.uploads.length === options.failUploadNumber ? {message:'private failure'} : null};},
      download:async()=>({data:options.existingBytes ? new Blob([options.existingBytes]) : null,error:options.existingBytes ? null : {message:'not found'}}),
      remove:async(paths)=>{calls.removed.push(...paths);return {error:null};},
    })},
    rpc:async(name,args)=>{calls.rpcs.push({name,args});return {data:options.wrongId ? 'wrong' : id,error:options.rpcError ?? null};},
  };
  const action = load('../src/app/(user)/user/report/actions.ts', {
    'next/cache':{revalidatePath:path=>calls.revalidated.push(path)},
    '../../../../lib/auth':{getAuthState:async()=>({profile:options.noAuth ? null : {id:'verified-user',role:'user'},error:false})},
    '../../../../lib/supabase/server':{createClient:async()=>client},
    '../../../../lib/report-validation':validation,
    '../../../../lib/report-images':{prepareReportImages:async(_id,files)=>{calls.photos++;return files.map((_file,index)=>({metadata:{...metadata,object_path:`${id}/report/${index ? 'cccccccc-cccc-4ccc-accc-cccccccccccc' : photoId}.webp`},bytes:Buffer.from('bytes')}));}},
  });
  return {action,calls};
}
test('submit action authenticates and validates before touching Storage or the RPC', async () => {
  for (const options of [{noAuth:true},{inactive:true}]) {
    const {action,calls} = actionHarness(options);
    assert.ok((await action.submitReport(form(true))).error);
    assert.equal(calls.uploads.length,0); assert.equal(calls.rpcs.length,0);
  }
  const {action,calls} = actionHarness();const data=form();data.set('title','');
  assert.ok((await action.submitReport(data)).error); assert.equal(calls.photos,0);
});
test('successful submission awaits upload and atomic RPC then refreshes own list', async () => {
  const {action,calls} = actionHarness();
  assert.equal((await action.submitReport(form(true))).ticketId,id);
  assert.equal(calls.uploads.length,1);
  assert.equal(calls.rpcs[0].name,'submit_repair_report');
  assert.equal(calls.rpcs[0].args.p_photos.length,1);
  assert.ok(!('reporter_id' in calls.rpcs[0].args));
  assert.ok(calls.revalidated.includes('/user'));
});
test('failed upload does not create a ticket; retry reuses only byte-identical uploads', async () => {
  const failure=actionHarness({uploadError:true});
  assert.ok((await failure.action.submitReport(form(true))).error); assert.equal(failure.calls.rpcs.length,0);
  const retry=actionHarness({uploadError:true,existingBytes:'bytes'});
  assert.equal((await retry.action.submitReport(form(true))).ticketId,id);
  const wrong=actionHarness({uploadError:true,existingBytes:'wrong'});
  assert.ok((await wrong.action.submitReport(form(true))).error);assert.equal(wrong.calls.rpcs.length,0);
  const partial=actionHarness({failUploadNumber:2});const data=form(true);data.append('photos',new Blob(['next'],{type:'image/png'}),'next.png');
  assert.ok((await partial.action.submitReport(data)).error);
  assert.equal(partial.calls.rpcs.length,0);assert.equal(partial.calls.removed.length,1);
});
test('ambiguous RPC failure keeps uploads and retry verifies the existing ticket without uploading again', async () => {
  const lost=actionHarness({rpcError:{code:'NETWORK',message:'sensitive backend detail'}});
  const result=await lost.action.submitReport(form(true));
  assert.ok(result.error);assert.ok(!result.error.includes('sensitive'));assert.equal(lost.calls.removed.length,0);
  const retry=actionHarness({prior:true});
  assert.equal((await retry.action.submitReport(form(true))).ticketId,id);
  assert.equal(retry.calls.uploads.length,0);assert.equal(retry.calls.rpcs.length,1);
  const missing=actionHarness({rpcError:{code:'PGRST202'}});assert.match((await missing.action.submitReport(form())).error,/03_submit_reports/);
  const wrong=actionHarness({wrongId:true});assert.ok((await wrong.action.submitReport(form())).error);assert.equal(wrong.calls.revalidated.length,0);
});

test('list reads filter by authenticated reporter even for admin; failures never return demo data', async () => {
  const filters=[];
  let databaseError=false;
  const query={select:()=>query,eq:(...args)=>{filters.push(args);return query;},order:()=>query,range:async()=>({data:[],error:databaseError ? {message:'private'} : null})};
  const reports=load('../src/lib/user-reports.ts',{'server-only':{},'./auth':{requireProfile:async()=>({id:'real-admin',role:'admin',full_name:'QA'})},'./supabase/server':{createClient:async()=>({from:()=>query})},'./report-validation':validation});
  assert.equal((await reports.getOwnReports()).length,0);
  assert.ok(filters.some(([key,value])=>key==='reporter_id' && value==='real-admin'));
  databaseError=true;await assert.rejects(reports.getOwnReports(),/REPORTS_UNAVAILABLE/);
});
