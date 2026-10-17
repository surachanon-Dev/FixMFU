import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Compile the pure TypeScript models with the project's existing compiler.
const cache = new Map();
function loadModel(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const model = { exports: {} };
  cache.set(filename, model);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const evaluate = vm.runInThisContext(`(function(exports, require, module) { ${source}\n})`, { filename });
  evaluate(model.exports, name => { if (!name.startsWith(".")) throw new Error(`Unexpected model dependency: ${name}`); return loadModel(path.resolve(path.dirname(filename), `${name}.ts`)); }, model);
  return model.exports;
}
const { summarizeDashboard, filterTicketsByPeriod, dashboardTicketHref } = loadModel(fileURLToPath(new URL("../src/lib/dashboard.ts", import.meta.url)));
const { SAMPLE_TICKETS } = loadModel(fileURLToPath(new URL("../src/lib/tickets.ts", import.meta.url)));
const makeTicket = (id, status, createdAt, extra = {}) => ({ ...SAMPLE_TICKETS[0], id, status, createdAt, history: [], ...extra });

test("Bangkok date boundaries, annual and monthly figures agree", () => {
  const tickets = [
    makeTicket("jan", "completed", "2025-12-31T18:00:00Z"),
    makeTicket("dec", "cancelled", "2025-12-31T16:59:00Z"),
    makeTicket("feb", "pending", "2026-01-31T17:00:00Z"),
    makeTicket("jan-open", "in_progress", "2026-01-05T10:00:00+07:00"),
  ];
  const annual = summarizeDashboard(tickets, 2026, null);
  assert.equal(annual.total, 3);
  assert.equal(annual.monthly.length, 12);
  assert.equal(annual.monthly.reduce((sum, row) => sum + row.total, 0), 3);
  assert.deepEqual(annual.counts, { pending: 1, in_progress: 1, completed: 1, cancelled: 0 });
  const january = summarizeDashboard(tickets, 2026, 0);
  assert.equal(january.total, 2);
  assert.equal(january.completionRate, 50);
  assert.equal(january.annualTotal, 3);
  assert.equal(filterTicketsByPeriod(tickets, "2026", "2026-02")[0].id, "feb");
});

test("zero-data periods produce finite zero metrics and empty lists", () => {
  const empty = summarizeDashboard([], 2026, 6);
  assert.equal(empty.total, 0);
  assert.equal(empty.completionRate, 0);
  assert.deepEqual(empty.buildings, []);
  assert.deepEqual(empty.queue, []);
  assert.deepEqual(empty.activities, []);
  assert.ok(empty.monthly.every(row => row.total === 0 && row.completed === 0));
});

test("completion includes cancellations in denominator; queue and activity ordering are meaningful", () => {
  const tickets = [
    makeTicket("done", "completed", "2026-10-01T00:00:00+07:00", { history: [{ id: "new", actor: "ผู้ดูแลระบบ", at: "2026-10-14T09:00:00+07:00", message: "ปิดงาน", status: "completed" }] }),
    makeTicket("cancelled", "cancelled", "2026-10-02T00:00:00+07:00"),
    makeTicket("progress", "in_progress", "2026-10-03T00:00:00+07:00"),
    makeTicket("pending-new", "pending", "2026-10-10T00:00:00+07:00"),
    makeTicket("pending-old", "pending", "2026-10-05T00:00:00+07:00", { history: [{ id: "old", actor: "ผู้ดูแลระบบ", at: "2026-10-05T00:00:00+07:00", message: "หมายเหตุ", status: "pending" }] }),
  ];
  const data = summarizeDashboard(tickets, 2026, 9);
  assert.equal(data.completionRate, 20);
  assert.deepEqual(data.queue.map(ticket => ticket.id), ["pending-old", "pending-new", "progress"]);
  assert.deepEqual(data.activities.map(activity => activity.event.id), ["new", "old"]);
  assert.equal(data.buildings[0][1], 5);
});

test("drill-down links carry the same period, status, and building", () => {
  const url = new URL(dashboardTicketHref(2026, 9, "pending", "อาคาร E4"), "https://example.test");
  assert.equal(url.pathname, "/admin/tickets");
  assert.equal(url.searchParams.get("year"), "2026");
  assert.equal(url.searchParams.get("month"), "2026-10");
  assert.equal(url.searchParams.get("status"), "pending");
  assert.equal(url.searchParams.get("building"), "อาคาร E4");
  assert.equal(new URL(dashboardTicketHref(2026, null), "https://example.test").searchParams.has("month"), false);
});
