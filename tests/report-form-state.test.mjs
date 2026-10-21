import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(fs.readFileSync(new URL('../src/lib/report-form-state.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exports = {};
vm.runInNewContext(`(function(exports) {${source}\n})`, { URL })(exports);
const { reportFormErrors, leavesReportPage } = exports;
const valid = { title: 'แอร์ไม่เย็น', location: 'E4-301', details: 'เปิดแล้วมีแต่ลม', building: 'e4', category: 'air' };

test('empty, whitespace and unselected lookup fields all have actionable feedback in form order', () => {
  const errors = reportFormErrors({ title: ' ', location: '', details: '\n', building: '', category: '' }, ['e4'], ['air']);
  assert.deepEqual(Object.keys(errors), ['title', 'building', 'location', 'category', 'details']);
  assert.equal(Object.keys(reportFormErrors(valid, ['e4'], ['air'])).length, 0);
});

test('client validation respects text limits and active options without requiring photos', () => {
  for (const [field, limit] of [['title', 200], ['location', 300], ['details', 5000]]) {
    assert.equal(reportFormErrors({ ...valid, [field]: 'ก'.repeat(limit) }, ['e4'], ['air'])[field], undefined);
    assert.ok(reportFormErrors({ ...valid, [field]: 'ก'.repeat(limit + 1) }, ['e4'], ['air'])[field]);
  }
  assert.ok(reportFormErrors(valid, ['other-building'], ['air']).building);
  assert.ok(reportFormErrors(valid, ['e4'], ['other-category']).category);
  assert.equal(Object.keys(reportFormErrors({ ...valid, title: ' 🔧 '.repeat(200).trim().replaceAll(' ', '') }, ['e4'], ['air'])).length, 0);
});

test('loss warning distinguishes actual navigation from anchors and same-page links', () => {
  const current = 'https://fix.example/user/report?area=internet';
  assert.equal(leavesReportPage('#report-details', current), false);
  assert.equal(leavesReportPage(current, current), false);
  assert.equal(leavesReportPage('/user/report?area=internet#photos', current), false);
  assert.equal(leavesReportPage('/user', current), true);
  assert.equal(leavesReportPage('/user/report', current), true);
  assert.equal(leavesReportPage('https://other.example/user/report?area=internet', current), true);
  assert.equal(leavesReportPage('mailto:help@example.com', current), false);
  assert.equal(leavesReportPage('http://[broken', current), false);
});
