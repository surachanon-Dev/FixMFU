import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=ts.transpileModule(fs.readFileSync(new URL('../src/lib/user-ticket-filters.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const exports={};vm.runInNewContext(`(function(exports){${source}\n})`)(exports);
const {selectUserTickets}=exports;
const a={id:'a',number:'REQ-001',title:'แอร์ไม่เย็น',building:'อาคาร E4',location:'E4-301',category:'แอร์/ประปา',status:'pending',createdAt:'2026-10-21T09:00:00+07:00',updatedAt:'2026-10-21T12:00:00+07:00'};
const b={...a,id:'b',number:'REQ-002',title:'Wi-Fi ใช้ไม่ได้',category:'อินเทอร์เน็ต',status:'cancelled',createdAt:'2026-10-21T03:00:00Z',updatedAt:'2026-10-21T03:00:00Z'};
const c={...a,id:'c',number:'REQ-003',status:'completed',createdAt:'2026-10-20T03:00:00Z',updatedAt:'2026-10-20T04:00:00Z'};
test('user list search combines status with Thai, case-insensitive codes and location; source remains unchanged',()=>{
 const input=[a,b,c];
 assert.deepEqual(Array.from(selectUserTickets(input,'cancelled',' wi-FI ','newest'),x=>x.id),['b']);
 assert.deepEqual(Array.from(selectUserTickets(input,'all','e4-301','newest'),x=>x.id),['b','a','c']);
 assert.deepEqual(Array.from(selectUserTickets(input,'completed','REQ-003','newest'),x=>x.id),['c']);
 assert.equal(selectUserTickets(input,'pending','ไม่มี','newest').length,0);
 assert.deepEqual(input,[a,b,c]);
});
test('newest, oldest and recently updated sorts compare instants across timezones',()=>{
 assert.deepEqual(Array.from(selectUserTickets([a,b,c],'all','','newest'),x=>x.id),['b','a','c']);
 assert.deepEqual(Array.from(selectUserTickets([a,b,c],'all','','oldest'),x=>x.id),['c','a','b']);
 assert.deepEqual(Array.from(selectUserTickets([a,b,c],'all','','updated'),x=>x.id),['a','b','c']);
});
test('equal timestamps have stable ordering and empty arrays remain safe',()=>{
 assert.deepEqual(Array.from(selectUserTickets([{...a,id:'z'},a],'all','','newest'),x=>x.id),['a','z']);
 assert.equal(selectUserTickets([],'all','','newest').length,0);
});
