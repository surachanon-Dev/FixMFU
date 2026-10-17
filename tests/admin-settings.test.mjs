import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, modules = {}) {
  const source = ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const exports = {};
  vm.runInNewContext(`(function(exports,require){${source}\n})`,{FormData})(exports,name=>{
    if (!(name in modules)) throw new Error(`Unexpected dependency ${name}`);
    return modules[name];
  });
  return exports;
}
const base = load('../src/lib/report-validation.ts');
const validation = load('../src/lib/master-data.ts',{'./report-validation':base});
const id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const requestId = 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb';
const updatedAt = '2026-10-18T02:30:00.123456+00:00';
const row = {id,code:requestId,name:'อาคาร E5',is_active:true,updated_at:updatedAt};
const form = (intent='create', table='buildings') => {
  const data = new FormData();
  for(const [key,value] of Object.entries({intent,table,requestId,id,updatedAt,name:' อาคาร E5 ',active:'false'})) data.set(key,value);
  return data;
};

function harness({role='admin',authError=false,replies=[{data:row,error:null}],throws=false}={}) {
  const calls={clients:0,queries:[],paths:[]};
  const client={from(table){
    const record={table,eq:[]};calls.queries.push(record);
    const query={insert(payload){record.insert=payload;return query;},update(payload){record.update=payload;return query;},select(columns){record.columns=columns;return query;},eq(key,value){record.eq.push([key,value]);return query;},async maybeSingle(){if(throws)throw Error('private connection secret');return replies.shift()??{data:row,error:null};}};
    return query;
  }};
  const actions=load('../src/app/(admin)/admin/settings/actions.ts',{
    'next/cache':{revalidatePath:(...args)=>calls.paths.push(args)},
    '../../../../lib/auth':{getAuthState:async()=>({profile:role?{id,role}:null,error:authError})},
    '../../../../lib/supabase/server':{createClient:async()=>{calls.clients++;return client;}},
    '../../../../lib/master-data':validation,
    '../../../../lib/report-validation':base,
  });
  return {actions,calls};
}

test('settings mutations deny User, anonymous and failed identity before touching data',async()=>{
  for(const options of [{role:'user'},{role:null},{authError:true}]) {
    const {actions,calls}=harness(options);
    const data=form();data.set('role','admin');
    assert.ok((await actions.saveMasterData(data)).error);
    assert.equal(calls.clients,0);
  }
});

test('settings reject table injection, delete, invalid versions, IDs, names and boolean coercion',async()=>{
  for(const [intent,key,value] of [
    ['create','table','profiles'],['create','table','buildings;drop table tickets'],['create','intent','delete'],
    ['create','requestId','../other'],['create','name',' '],['rename','name','ก'.repeat(121)],
    ['rename','id','REQ-001'],['rename','updatedAt','yesterday'],['rename','updatedAt','2026-99-99T00:00:00Z'],
    ['set_active','active','on'],['set_active','active','1'],
  ]){
    const {actions,calls}=harness();const data=form(intent);data.set(key,value);
    assert.ok((await actions.saveMasterData(data)).error,`${intent} ${key}`);
    assert.equal(calls.clients,0);
  }
});

test('create persists the trimmed name with a stable retry code; ignores forged IDs and roles',async()=>{
  for(const table of ['buildings','categories']) {
    const {actions,calls}=harness();const data=form('create',table);data.set('is_active','false');data.set('role','admin');
    const result=await actions.saveMasterData(data);
    assert.ok(result.success);assert.equal(result.row.id,id);
    const query=calls.queries[0];assert.equal(query.table,table);
    assert.deepEqual({...query.insert},{code:requestId,name:'อาคาร E5',is_active:true});
    assert.deepEqual(calls.paths,[['/admin','layout'],['/user','layout']]);
  }
});

test('a retry after a lost create response returns the existing row without making a duplicate',async()=>{
  const {actions,calls}=harness({replies:[{data:null,error:{code:'23505'}},{data:row,error:null}]});
  assert.ok((await actions.saveMasterData(form())).success);
  assert.equal(calls.queries.filter(q=>q.insert).length,1);
  assert.deepEqual(calls.queries[1].eq,[['code',requestId]]);
  const conflict=harness({replies:[{data:null,error:{code:'23505'}},{data:{...row,name:'เปลี่ยนชื่อแล้ว'},error:null}]});
  assert.ok((await conflict.actions.saveMasterData(form())).error);
  assert.equal(conflict.calls.paths.length,0);
});

test('rename changes only the name and compares the DB version to avoid overwriting another Admin',async()=>{
  const {actions,calls}=harness();
  assert.ok((await actions.saveMasterData(form('rename'))).success);
  assert.deepEqual({...calls.queries[0].update},{name:'อาคาร E5'});
  assert.deepEqual(calls.queries[0].eq,[['id',id],['updated_at',updatedAt]]);
  const conflict=harness({replies:[{data:null,error:null}]});
  const result=await conflict.actions.saveMasterData(form('rename'));
  assert.ok(result.error);assert.equal(result.refresh,true);assert.equal(result.success,undefined);
  assert.equal(conflict.calls.paths.length,0);
});

test('deactivate and reactivate use is_active updates, preserving the row used by old tickets',async()=>{
  for(const active of ['false','true']) {
    const {actions,calls}=harness();const data=form('set_active','categories');data.set('active',active);
    assert.ok((await actions.saveMasterData(data)).success);
    assert.deepEqual({...calls.queries[0].update},{is_active:active==='true'});
    assert.equal(calls.queries[0].insert,undefined);
  }
});

test('permission and network errors cannot claim success or leak database messages',async()=>{
  for(const options of [{replies:[{data:null,error:{code:'42501',message:'private connection secret'}}]},{throws:true}]) {
    const {actions,calls}=harness(options);const result=await actions.saveMasterData(form());
    assert.ok(result.error);assert.equal(result.success,undefined);
    assert.ok(!result.error.includes('private connection secret'));assert.equal(calls.paths.length,0);
  }
});

test('settings reads require Admin, include inactive rows and paginate past the API limit',async()=>{
  const calls=[];
  const reader=load('../src/lib/admin-settings.ts',{
    'server-only':{},
    './auth':{requireProfile:async admin=>{assert.equal(admin,true);calls.push('auth');}},
    './supabase/server':{createClient:async()=>({from(table){
      const query={select(){return query;},order(){return query;},async range(start,end){calls.push([table,start,end]);return {error:null,data:Array.from({length:start===0?500:1},(_,i)=>({...row,id:`${table}-${start+i}`,is_active:i!==0}))};}};return query;
    }})},
  });
  const data=await reader.getAdminSettings();
  assert.equal(calls[0],'auth');assert.equal(data.buildings.length,501);assert.equal(data.categories.length,501);
  assert.equal(data.buildings[0].is_active,false);
  assert.ok(calls.some(call=>Array.isArray(call)&&call[1]===500));
});

test('lookup load failures propagate instead of substituting sample data',async()=>{
  const reader=load('../src/lib/admin-settings.ts',{'server-only':{},'./auth':{requireProfile:async()=>{}},'./supabase/server':{createClient:async()=>({from(){const q={select(){return q;},order(){return q;},range:async()=>({data:null,error:{code:'offline'}})};return q;}})}});
  await assert.rejects(()=>reader.getAdminSettings(),/SETTINGS_UNAVAILABLE/);
});
