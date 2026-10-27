import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const cache = new Map();
function load(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const model = { exports: {} };
  cache.set(filename, model);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInThisContext(`(function(exports, require, module) {${source}\n})`, { filename })(model.exports, name => load(path.resolve(path.dirname(filename), `${name}.ts`)), model);
  return model.exports;
}
const { ADMIN_PAGE_SIZE, readAdminFilters, adminTicketView, adminTicketHref, adminSummaryCsv } = load(fileURLToPath(new URL("../src/lib/admin-ticket-view.ts", import.meta.url)));
const { SAMPLE_TICKETS } = load(fileURLToPath(new URL("../src/lib/tickets.ts", import.meta.url)));
const ticket = (index, extra = {}) => ({ ...SAMPLE_TICKETS[0], id: `ticket-${String(index).padStart(3, "0")}`, number: `REQ-${index}`, title: `เรื่อง ${index}`, createdAt: `2026-10-${String(index % 20 + 1).padStart(2, "0")}T00:00:00Z`, building: "อาคาร E4", category: "ไฟฟ้า", status: "pending", ...extra });

test("Admin filter links preserve period and Thai values when navigating pages or removing one filter", () => {
  const params = new URLSearchParams({ q: "แอร์ & ไฟ", year: "2026", month: "2026-10", building: "อาคาร E4", status: "pending", page: "4" });
  const updated = new URL(adminTicketHref(params, { building: "" }), "https://example.test");
  assert.equal(updated.searchParams.has("building"), false);
  assert.equal(updated.searchParams.has("page"), false);
  assert.equal(updated.searchParams.get("q"), "แอร์ & ไฟ");
  assert.equal(updated.searchParams.get("month"), "2026-10");
  assert.equal(updated.searchParams.get("status"), "pending");
  const next = new URL(adminTicketHref(params, { page: "5" }, false), "https://example.test");
  assert.equal(next.searchParams.get("page"), "5");
  assert.equal(next.searchParams.get("building"), "อาคาร E4");
  assert.equal(params.get("page"), "4");
});

test("Every filter combines with Bangkok reporting dates and search includes reporter and public number", () => {
  const tickets = [ticket(1, { createdAt: "2026-09-30T18:00:00Z", reporter: { name: "อธิช", contact: "", id: "owner" } }), ticket(2, { building: "หอพัก" }), ticket(3, { status: "completed" }), ticket(4, { category: "อินเทอร์เน็ต" })];
  const params = new URLSearchParams({ year: "2026", month: "2026-10", building: "อาคาร E4", category: "ไฟฟ้า", status: "pending", q: "อธิช" });
  assert.deepEqual(adminTicketView(tickets, params).items.map(item => item.id), ["ticket-001"]);
  params.set("q", "req-1");
  assert.equal(adminTicketView(tickets, params).total, 1);
  params.set("q", "ไม่มีเรื่องนี้");
  assert.equal(adminTicketView(tickets, params).total, 0);
});

test("Pagination returns at most twenty unique tickets and clamps stale pages after data shrinks", () => {
  const tickets = Array.from({ length: 43 }, (_, index) => ticket(index));
  const all = [1, 2, 3].flatMap(page => adminTicketView(tickets, new URLSearchParams({ page: String(page) })).items);
  assert.equal(ADMIN_PAGE_SIZE, 20);
  assert.equal(all.length, 43);
  assert.equal(new Set(all.map(item => item.id)).size, 43);
  const last = adminTicketView(tickets, new URLSearchParams({ page: "999" }));
  assert.equal(last.page, 3);
  assert.equal(last.start, 41);
  assert.equal(last.end, 43);
  for (const page of ["-1", "NaN", "2.5", "9007199254740999"]) assert.equal(adminTicketView(tickets, new URLSearchParams({ page })).page, 1);
  const empty = adminTicketView([], new URLSearchParams({ page: "99" }));
  assert.equal(empty.page, 1); assert.equal(empty.start, 0); assert.equal(empty.end, 0);
});

test("Queue order places pending first and oldest first without changing source data", () => {
  const tickets = [ticket(1, { status: "completed" }), ticket(2, { status: "in_progress" }), ticket(3, { createdAt: "2026-10-12T00:00:00Z" }), ticket(4, { createdAt: "2026-10-01T00:00:00Z" })];
  const before = tickets.map(item => item.id);
  assert.deepEqual(adminTicketView(tickets, new URLSearchParams({ sort: "priority" })).items.map(item => item.id), ["ticket-004", "ticket-003", "ticket-002", "ticket-001"]);
  assert.equal(adminTicketView(tickets, new URLSearchParams({ sort: "oldest" })).items[0].id, "ticket-004");
  assert.equal(adminTicketView(tickets, new URLSearchParams()).items[0].id, "ticket-003");
  assert.deepEqual(tickets.map(item => item.id), before);
});

test("Malformed filter values cannot inherit object members or silently create invalid calendar periods", () => {
  const filters = readAdminFilters(new URLSearchParams({ status: "toString", sort: "constructor", year: "bad", month: "2026-13" }));
  assert.equal(filters.status, ""); assert.equal(filters.sort, "newest"); assert.equal(filters.year, ""); assert.equal(filters.month, "");
});

test("CSV keeps Thai Unicode, cell boundaries, quotes and embedded newlines", () => {
  const csv = adminSummaryCsv([["อาคาร E4", "ประปา, แอร์", 'ชื่อ "ทดสอบ"', "ชั้นหนึ่ง\nชั้นสอง", 20]]);
  assert.equal(csv, '\uFEFF"อาคาร E4","ประปา, แอร์","ชื่อ ""ทดสอบ""","ชั้นหนึ่ง\nชั้นสอง","20"');
});

test("CSV makes formula-looking building/category labels inert including hidden whitespace", () => {
  for (const value of ["=HYPERLINK(\"https://example.test\")", "+1+2", "-1+2", "@SUM(A1)", " \t=1+2", "\r\n@SUM(A1)", "\u0000=1+2"]) {
    assert.ok(adminSummaryCsv([[value]]).startsWith('\uFEFF"\''), value);
  }
  assert.equal(adminSummaryCsv([[-2, "อาคารทั่วไป"]]), '\uFEFF"-2","อาคารทั่วไป"');
});
