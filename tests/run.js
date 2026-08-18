/* Node test runner for the DataDojo engine.
   Loads the browser source files with a tiny DOM shim and asserts real
   Excel behaviour. Run with:  node tests/run.js
   Nothing ships to the learner until this passes. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = path.join(__dirname, "..", "src");
const FILES = fs.readdirSync(SRC).filter(f => f.endsWith(".js")).sort();

const listeners = [];
const shimEl = () => ({
  style: {}, dataset: {}, classList: { add() {}, remove() {}, contains() { return false; } },
  appendChild() {}, removeChild() {}, setAttribute() {}, removeAttribute() {},
  addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  focus() {}, click() {}, firstChild: null, textContent: "", innerHTML: "", value: ""
});
const sandbox = {
  console,
  document: {
    createElement: shimEl, createTextNode: () => ({}),
    querySelector: () => shimEl(), querySelectorAll: () => [],
    addEventListener: (t, f) => listeners.push(f),
    documentElement: { setAttribute() {}, removeAttribute() {} },
    activeElement: null
  },
  window: {},
  __DD_NO_BOOT: true,
  getComputedStyle: () => ({ getPropertyValue: () => "" }),
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; })(),
  setTimeout, clearTimeout, Math, Date, JSON, Number, String, Array, Object, isFinite, parseFloat, parseInt,
  Blob: function () {}, URL: { createObjectURL: () => "", revokeObjectURL() {} }, FileReader: function () {},
  Promise, Map, Set, RegExp, Error, TypeError
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

let combined = "";
for (const f of FILES) combined += "\n/* ==== " + f + " ==== */\n" + fs.readFileSync(path.join(SRC, f), "utf8");
// let/const declarations do not attach to the VM global, so expose them
combined += ";globalThis.__dd = { get S(){return S;}, CONCEPTS, FN, ERR, LEITNER_INTERVALS };" +
  ";globalThis.SESSIONS = SESSIONS; globalThis.SESSION_ORDER = SESSION_ORDER;" +
  ";globalThis.MODULES = MODULES; globalThis.MODULE_ORDER = MODULE_ORDER;" +
  ";globalThis.QUESTIONS = QUESTIONS; globalThis.REFERENCE = REFERENCE; globalThis.CONCEPTS = CONCEPTS;";

try {
  vm.runInContext(combined, sandbox, { filename: "datadojo-bundle.js" });
} catch (e) {
  console.error("FAILED TO LOAD SOURCES:\n", e && e.stack || e);
  process.exit(1);
}

/* ---------------- assertions ---------------- */
let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(name + (detail ? "  -> " + detail : "")); }
}
function near(a, b, tol) { return typeof a === "number" && Math.abs(a - b) < (tol === undefined ? 1e-9 : tol); }

/* Build a sheet from a compact spec: {A1: 5, B2: "=A1*2"} */
function mkSheet(spec, rows, cols) {
  const sh = new sandbox.Sheet("Test", rows || 60, cols || 20);
  for (const ref in spec) {
    const m = /^([A-Z]+)(\d+)$/.exec(ref);
    const c = sandbox.colToIndex(m[1]), r = parseInt(m[2], 10) - 1;
    const v = spec[ref];
    if (typeof v === "string" && v[0] === "=") sh.setFormula(r, c, v.slice(1));
    else sh.set(r, c, v);
  }
  return sh;
}
function ev(formula, spec) {
  const sh = mkSheet(spec || {});
  const out = sandbox.computeFormula(formula, sh.ctx());
  if (out && out.parseError) return "PARSE: " + out.parseError;
  if (sandbox.isErr(out)) return out.err;
  if (sandbox.isRange(out)) return out.cells;
  return out;
}
function t(name, formula, expected, spec, tol) {
  const got = ev(formula, spec);
  let good;
  if (typeof expected === "number") good = near(got, expected, tol);
  else if (Array.isArray(expected)) good = JSON.stringify(got) === JSON.stringify(expected);
  else good = got === expected;
  ok(name + "  " + formula, good, "got " + JSON.stringify(got) + ", expected " + JSON.stringify(expected));
}

module.exports = { sandbox, mkSheet, ev, t, ok, near, report };

function report(label) {
  console.log("\n" + label);
  console.log("  passed: " + pass + "   failed: " + fail);
  if (failures.length) {
    console.log("\nFAILURES:");
    failures.forEach(f => console.log("  - " + f));
  }
  return fail;
}

/* ---------------- load the test suites ---------------- */
require("./suite_engine.js");
require("./suite_content.js");
const failed = report("Gridwright engine tests");
process.exit(failed ? 1 : 0);
