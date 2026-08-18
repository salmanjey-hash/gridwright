/* Content integrity: runs the app's own self-test, which rebuilds every
   practice sheet, re-derives every answer key with the live formula
   engine, and re-checks every quiz answer. This is the gate the spec
   asks for: no unverified formula ships. */
const { sandbox, ok } = require("./run.js");

sandbox.selfTest();
const res = sandbox.__ddSelfTest || sandbox.window.__ddSelfTest || { problems: ["self-test did not run"], checked: 0 };

ok("content self-test finds no problems (" + res.checked + " items checked)",
   res.problems.length === 0,
   res.problems.length ? "\n      " + res.problems.join("\n      ") : "");

/* Pull the canonical formula out of a printed answer key, e.g.
   "=D8*0.9    or    =D8-D8*10%" -> "=D8*0.9". Anything not starting
   with an equals sign is a plain value rather than a formula. */
function keyFormula(answer) {
  const a = String(answer || "").trim();
  if (a[0] !== "=") return null;
  return a.split(/\s{2,}|\n/)[0].trim();
}

/* Beyond structure: solve every practice sheet with its own answer key
   and confirm the checker marks it correct. This is the important one:
   it types the exact formula the app prints for the learner, so a key
   that is wrong, or that fails its own mustUse rule, fails the build. */
sandbox.SESSION_ORDER.forEach(sid => {
  const s = sandbox.SESSIONS[sid];
  if (!s.practice) return;
  const p = s.practice(sid + ":7");
  const gv = new sandbox.GridView(p.sheet, {});

  (p.checks || []).forEach(chk => {
    const pos = sandbox.parseA1(chk.cell);
    if (!pos) return;
    const cell = p.sheet.cell(pos.r, pos.c);
    if (cell) cell.locked = false;

    // type in exactly what the app tells the learner to type
    const f = keyFormula(chk.answer);
    const want = Array.isArray(chk.expect) ? chk.expect[0] : chk.expect;
    if (f) {
      p.sheet.setFormula(pos.r, pos.c, f.slice(1));
    } else if (want === undefined) {
      // type/format-only checks: set a value of the right type
      if (chk.expectType === "number") p.sheet.set(pos.r, pos.c, 1234.5);
      else if (chk.expectType === "text") p.sheet.set(pos.r, pos.c, "abc");
    } else {
      p.sheet.set(pos.r, pos.c, want);
    }
    // satisfy any format requirement the key states
    if (chk.expectFmt) {
      const c2 = p.sheet.ensure(pos.r, pos.c);
      c2.fmt = ({ date: "dd/mm/yyyy", currency: "£#,##0.00", percent: "0.0%", number: "0.00", text: "@", general: null })[chk.expectFmt];
    }
    if (chk.expectType === "text" && !chk.expectFmt) {
      const c2 = p.sheet.ensure(pos.r, pos.c);
      c2.v = String(want);
    }
  });
  /* A learner fills the answer formula down the whole column; the keys
     only sample a couple of rows. Reproduce the fill so that totals and
     counts further down the sheet see a complete column. */
  const byCol = {};
  (p.highlight || []).forEach(ref => {
    const q = sandbox.parseA1(ref);
    if (!q) return;
    (byCol[q.c] = byCol[q.c] || []).push(q.r);
  });
  Object.keys(byCol).forEach(c => {
    const rowsInCol = byCol[c].sort((a, b) => a - b);
    let srcRow = -1;
    rowsInCol.forEach(r => {
      const cell = p.sheet.cell(r, +c);
      if (cell && cell.f) { srcRow = r; return; }
      const empty = !cell || (cell.v === null && !cell.f);
      if (srcRow >= 0 && empty) p.sheet.copyCell(srcRow, +c, r, +c);
    });
  });
  p.sheet.recalc();

  const results = gv.check(p.checks || []);
  const bad = results.filter(r => !r.ok);
  ok(sid + ": every answer key passes its own checker",
     bad.length === 0,
     bad.map(b => b.cell + " -> " + b.note).join("; "));
});

/* The interview drill is generated, not authored, so its keys need the
   same treatment: solve it with its own answers and confirm they pass. */
["drill:a", "drill:b", "drill:c"].forEach(seed => {
  const d = sandbox.buildDrill(seed);
  const gv = new sandbox.GridView(d.sheet, {});
  d.checks.forEach(chk => {
    const pos = sandbox.parseA1(chk.cell);
    const cell = d.sheet.cell(pos.r, pos.c);
    if (cell) cell.locked = false;
    const f = keyFormula(chk.answer);
    if (f) d.sheet.setFormula(pos.r, pos.c, f.slice(1));
    else d.sheet.set(pos.r, pos.c, Array.isArray(chk.expect) ? chk.expect[0] : chk.expect);
    ok("drill check on " + chk.cell + " names a module", !!chk.module, "no module tag");
  });
  d.sheet.recalc();
  const bad = gv.check(d.checks).filter(r => !r.ok);
  ok("drill (" + seed + "): every answer key passes its own checker", bad.length === 0,
     bad.map(b => b.cell + " -> " + b.note).join("; "));
});

/* Regenerating with a different seed must change the data but keep the
   answer key consistent with it. */
sandbox.SESSION_ORDER.forEach(sid => {
  const s = sandbox.SESSIONS[sid];
  if (!s.practice) return;
  const a = s.practice(sid + ":1");
  const b = s.practice(sid + ":2");
  /* A session's data may live on the practice sheet, in the pivot, or
     only in the downloadable workbook (the capstones). Consider all three. */
  const snap = (p, sd) => JSON.stringify([
    p.sheet.toAOA(),
    p.pivot ? p.pivot.data : null,
    s.workbook ? s.workbook(sd).sheets.map(x => x.toAOA()) : null
  ]);
  const aoaA = snap(a, sid + ":1"), aoaB = snap(b, sid + ":2");
  /* A session may legitimately have nothing to randomise: the Stage 3
     capstone supplies no data at all, because you fetch your own. */
  if (!a.noVariation) {
    ok(sid + ": a new seed produces different data", aoaA !== aoaB, "seeds 1 and 2 gave identical data");
  }

  const again = s.practice(sid + ":1");
  ok(sid + ": the same seed reproduces exactly", snap(again, sid + ":1") === aoaA);

  /* Keys must be reproducible for a given seed. They need not differ
     across seeds: a session may deliberately fix its keys so a planted
     fault lands on a known row, while the surrounding data still varies. */
  const keyA = JSON.stringify((a.checks || []).map(c => c.expect));
  const keyAgain = JSON.stringify((again.checks || []).map(c => c.expect));
  ok(sid + ": answer keys are reproducible for a given seed", keyA === keyAgain, "keys differed between two runs of the same seed");
});
