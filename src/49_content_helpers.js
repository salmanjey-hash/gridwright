/* ============================================================
   Helpers shared by the module content files.
   ============================================================ */

/* Lock every cell that currently holds something, then unlock the
   listed answer cells. Keeps practice sheets from being edited into
   nonsense while leaving the tasks writable. */
function lockSheet(sh, exceptRefs) {
  for (const k in sh.data) sh.data[k].locked = true;
  (exceptRefs || []).forEach(ref => {
    const p = parseA1(ref);
    if (!p) return;
    const c = sh.cell(p.r, p.c);
    if (c) c.locked = false;
  });
}
function put(sh, ref, value, opts) {
  const p = parseA1(ref);
  if (!p) return;
  if (typeof value === "string" && value[0] === "=") sh.setFormula(p.r, p.c, value.slice(1), opts);
  else sh.set(p.r, p.c, value, opts);
}
function label(sh, ref, text) { put(sh, ref, text, { locked: true, hdr: true }); }
function note(sh, ref, text) { put(sh, ref, text, { locked: true }); }
function valAt(sh, ref) {
  const p = parseA1(ref);
  return p ? sh.value(p.r, p.c) : null;
}

/* Compute an answer with the live engine rather than in JavaScript, so
   the key and the learner's formula are graded by the same code. If
   these ever disagree, the tests fail rather than the learner. */
function solve(sh, formula) {
  const out = computeFormula(formula, sh.ctx());
  if (out && out.parseError) throw new Error("answer key does not parse: " + formula + " (" + out.parseError + ")");
  if (isErr(out)) throw new Error("answer key errors: " + formula + " -> " + out.err);
  return isRange(out) ? (out.cells[0] ? out.cells[0][0] : null) : out;
}

const GBP2 = "£#,##0.00";
const DATEFMT = "dd/mm/yyyy";

/* A transaction log used from Module 3 onwards. Deterministic from the
   seed, deliberately imperfect, and shaped like something a compliance
   team would actually receive. */
const TX_SUPPLIERS = [
  { name: "Redgate Supplies", city: "Leeds" },
  { name: "Halden & Co", city: "London" },
  { name: "Northwood Ltd", city: "Bristol" },
  { name: "Peak Trading", city: "Leeds" },
  { name: "Mersey Print", city: "Manchester" },
  { name: "Calder Foods", city: "London" },
  { name: "Ashby Motors", city: "Leeds" },
  { name: "Wear Valley Steel", city: "Newcastle" }
];
const TX_CATEGORIES = ["Stock", "Services", "Travel", "Equipment", "Utilities"];

/* Dates land inside February to April 2024 so "in March" is a real
   question with a real answer rather than a rounding of one. */
function txRows(seed, n) {
  const r = rng(seed);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const s = TX_SUPPLIERS[rInt(r, 0, TX_SUPPLIERS.length - 1)];
    const day = rInt(r, 0, 89);                       // 1 Feb 2024 + 0..89 days
    const amount = rWeighted(r, [
      [xround(rInt(r, 1500, 49999) / 100, 2), 6],     // most are small
      [xround(rInt(r, 50000, 150000) / 100, 2), 3],   // some are large
      [xround(rInt(r, 150000, 480000) / 100, 2), 1]   // a few are very large
    ]);
    rows.push({
      ref: "TX-" + (5100 + i),
      supplier: s.name,
      city: s.city,
      category: TX_CATEGORIES[rInt(r, 0, TX_CATEGORIES.length - 1)],
      date: ymdToSerial(2024, 2, 1) + day,
      amount: amount
    });
  }
  return rows;
}
const MAR_START = ymdToSerial(2024, 3, 1);
const MAR_END = ymdToSerial(2024, 3, 31);
