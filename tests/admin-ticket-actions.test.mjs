import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, modules = {}) {
  const source = ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020} }).outputText;
  const exports = {};
  vm.runInNewContext(`(function(exports,require){${source}\n})`,{FormData,Buffer})(exports,name=>{
    if (!(name in modules)) throw new Error(`Unexpected dependency ${name}`);
    return modules[name];
  });
  return exports;
}
const base=load('../src/lib/report-validation.ts');
const validation=load('../src/lib/admin-ticket-validation.ts',{'./report-validation':base});
const ticketId='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const requestId='bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb';
function form(action='receive',note='',photos=0) {
  const data=new FormData();
  for(const [key,value] of Object.entries({ticketId,requestId,action,note,expectedStatus:action==='receive'?'pending':'in_progress'}))data.set(key,value);
  for(let index=0;index<photos;index++)data.append('photos',new Blob(['bytes'],{type:'image/png'}),`QA-${index}.png`);
  return data;
}
function harness(options={}) {
  const calls={clients:0,rpcs:[],uploads:[],removed:[],revalidated:[],prepared:0};
  const client={
    from:()=>{const query={select:()=>query,eq:()=>query,maybeSingle:async()=>({data:options.missing?null:{id:ticketId,status:options.status??'pending'},error:options.readError?{message:'private database detail'}:null})};return query;},
    storage:{from:bucket=>({
      upload:async(path,bytes,settings)=>{calls.uploads.push({bucket,path,bytes,settings});return {error:options.uploadError||calls.uploads.length===options.failUploadNumber?{message:'private storage error'}:null};},
      download:async()=>({data:options.existingBytes?new Blob([options.existingBytes]):null,error:options.existingBytes?null:{message:'not found'}}),
      remove:async(paths)=>{calls.removed.push(...paths);return {error:null};},
    })},
    rpc:async(name,args)=>{calls.rpcs.push({name,args});return {data:options.wrongId?'wrong':ticketId,error:options.rpcError??null};},
  };
  const actions=load('../src/app/(admin)/admin/tickets/actions.ts',{
    'next/cache':{revalidatePath:path=>calls.revalidated.push(path)},
    '../../../../lib/auth':{getAuthState:async()=>({error:false,profile:options.role===null?null:{id:'verified-admin',role:options.role??'admin'}})},
    '../../../../lib/supabase/server':{createClient:async()=>{calls.clients++;return client;}},
    '../../../../lib/admin-ticket-validation':validation,
    '../../../../lib/report-validation':base,
    '../../../../lib/report-images':{prepareReportImages:async(id,files,kind)=>{
      calls.prepared++;assert.equal(id,ticketId);assert.equal(kind,'repair');
      return files.map((_file,index)=>({bytes:Buffer.from('bytes'),metadata:{id:`cccccccc-cccc-4ccc-accc-${String(index).padStart(12,'0')}`,object_path:`${ticketId}/repair/${index}.webp`,original_name:`QA-${index}.png`,mime_type:'image/webp',size_bytes:5}}));
    }},
  });
  return {actions,calls};
}

test('Admin mutation denies ordinary User and anonymous before any database or Storage call',async()=>{
  for(const role of ['user',null]){
    const {actions,calls}=harness({role});assert.ok((await actions.updateAdminTicket(form())).error);
    assert.equal(calls.clients,0);assert.equal(calls.rpcs.length,0);assert.equal(calls.uploads.length,0);
  }
});
test('Admin inputs reject forged status/action, blank reasons and incomplete closure before uploading',async()=>{
  for(const [key,value]of [['action','reopen'],['expectedStatus','completed'],['ticketId','REQ-001'],['requestId','../other'],['note','x'.repeat(1501)]]){
    const {actions,calls}=harness();const data=form();data.set(key,value);
    assert.ok((await actions.updateAdminTicket(data)).error);assert.equal(calls.clients,0);
  }
  for(const data of [form('cancel',' '),form('note',''),form('complete',''),form('note','text',1)]){
    const {actions,calls}=harness();assert.ok((await actions.updateAdminTicket(data)).error);assert.equal(calls.uploads.length,0);assert.equal(calls.rpcs.length,0);
  }
  const beforeReceive=form('complete','fixed');beforeReceive.set('expectedStatus','pending');
  assert.throws(()=>validation.validateAdminTicket(beforeReceive));
});
test('receive uses atomic RPC with request ID and refreshes both portals; form actor/role are ignored',async()=>{
  const {actions,calls}=harness();const data=form();data.set('actor_id','attacker');data.set('role','admin');
  assert.ok((await actions.updateAdminTicket(data)).success);
  assert.equal(calls.rpcs[0].name,'admin_update_ticket');assert.equal(calls.rpcs[0].args.p_request_id,requestId);
  assert.equal(calls.rpcs[0].args.p_expected_status,'pending');assert.equal(calls.rpcs[0].args.p_action,'receive');
  assert.ok(!('actor_id'in calls.rpcs[0].args));assert.ok(!('role'in calls.rpcs[0].args));
  for(const path of ['/admin/tickets','/admin/dashboard','/admin/reports',`/admin/tickets/${ticketId}`,'/user',`/user/ticket/${ticketId}`])assert.ok(calls.revalidated.includes(path));
});
test('closure validates and uploads private repair photos before the atomic status mutation',async()=>{
  const {actions,calls}=harness({status:'in_progress'});
  assert.ok((await actions.updateAdminTicket(form('complete','',1))).success);
  assert.equal(calls.uploads.length,1);assert.equal(calls.uploads[0].bucket,'ticket-photos');
  assert.match(calls.uploads[0].path,/\/repair\//);assert.equal(calls.uploads[0].settings.upsert,false);
  assert.equal(calls.rpcs[0].args.p_photos.length,1);assert.equal(calls.rpcs[0].args.p_action,'complete');
});
test('close with resolution and an empty optional file field succeeds without uploading',async()=>{
  for(const name of ['', 'undefined', 'blob']) {
    const {actions,calls}=harness({status:'in_progress'});
    const data=form('complete','เสร็จแล้ว');
    data.append('photos',new Blob([],{type:'application/octet-stream'}),name);
    assert.ok((await actions.updateAdminTicket(data)).success);
    assert.equal(calls.uploads.length,0);assert.equal(calls.rpcs.length,1);
    assert.equal(calls.rpcs[0].args.p_photos.length,0);
  }
  const {actions,calls}=harness({status:'in_progress'});
  const empty=form('complete','');empty.append('photos',new Blob([]),'undefined');
  assert.match((await actions.updateAdminTicket(empty)).error,/ระบุผลการแก้ไขหรือแนบรูป/);
  assert.equal(calls.rpcs.length,0);
});
test('failed repair upload never changes status and partial uploads are cleaned up',async()=>{
  const {actions,calls}=harness({status:'in_progress',failUploadNumber:2});
  assert.ok((await actions.updateAdminTicket(form('complete','fixed',2))).error);
  assert.equal(calls.rpcs.length,0);assert.equal(calls.removed.length,1);
  const retry=harness({status:'in_progress',uploadError:true,existingBytes:'bytes'});
  assert.ok((await retry.actions.updateAdminTicket(form('complete','fixed',1))).success);
  const wrong=harness({status:'in_progress',uploadError:true,existingBytes:'wrong'});
  assert.ok((await wrong.actions.updateAdminTicket(form('complete','fixed',1))).error);assert.equal(wrong.calls.rpcs.length,0);
});
test('ambiguous commit preserves files and a closed-ticket retry reuses its original request without uploading',async()=>{
  const lost=harness({status:'in_progress',rpcError:{code:'NETWORK',message:'private error'}});
  const failed=await lost.actions.updateAdminTicket(form('complete','fixed',1));
  assert.ok(failed.error);assert.ok(!failed.error.includes('private'));assert.equal(lost.calls.removed.length,0);
  const retry=harness({status:'completed'});
  assert.ok((await retry.actions.updateAdminTicket(form('complete','fixed',1))).success);
  assert.equal(retry.calls.uploads.length,0);assert.equal(retry.calls.rpcs[0].args.p_request_id,requestId);
});
test('stale status refreshes the UI while denied, missing migration and failed RPC never show success',async()=>{
  for(const code of ['40001','42501','P0002','22023','PGRST202','NETWORK']){
    const {actions,calls}=harness({rpcError:{code,message:'private details'}});
    const result=await actions.updateAdminTicket(form());assert.ok(result.error);assert.ok(!result.success);assert.ok(!result.error.includes('private'));
    assert.equal(calls.revalidated.length,0);
    if(code==='40001')assert.equal(result.refresh,true);
    if(code==='PGRST202')assert.match(result.error,/04_admin_ticket_actions/);
  }
  for(const options of [{missing:true},{readError:true},{wrongId:true}]){
    const {actions}=harness(options);assert.ok((await actions.updateAdminTicket(form())).error);
  }
});
