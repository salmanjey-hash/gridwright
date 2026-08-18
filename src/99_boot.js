/* ============================================================
   Boot
   ============================================================ */
(function boot() {
  // the Node test runner loads these sources without a real DOM
  if (typeof window !== "undefined" && window.__DD_NO_BOOT) return;
  loadState();
  applyTheme();

  $("#themeBtn").addEventListener("click", cycleTheme);

  /* Concepts are registered by the module files, but a card only
     exists once a lesson has introduced it. Nothing to do here
     except make sure the nav reflects what is due today. */
  S.lastSeen = todayISO();
  saveState();

  renderNav();
  go("home");

  /* A quick internal check that the engine agrees with the answer
     keys shipped in this build. Logs to the console only; a learner
     never sees it, but it means a broken formula cannot ship quietly. */
  setTimeout(selfTest, 0);
})();

function selfTest() {
  const problems = [];
  let checked = 0;

  SESSION_ORDER.forEach(sid => {
    const s = SESSIONS[sid];
    if (!s.practice) return;
    let p;
    try { p = s.practice(sid + ":0"); }
    catch (e) { problems.push(sid + " practice() threw: " + e.message); return; }

    if (!p.sheet) { problems.push(sid + " practice() returned no sheet"); return; }

    /* every check must point at a real cell and carry an answer key */
    (p.checks || []).forEach(c => {
      checked++;
      const where = c.pivotSpec ? "pivot setup" : c.cell;
      if (!c.pivotSpec && !parseA1(c.cell)) problems.push(sid + " check has an unreadable cell address: " + c.cell);
      if (c.pivotSpec && !p.pivot) problems.push(sid + " has a pivot check but no pivot table");
      if (!c.answer) problems.push(sid + " check on " + where + " has no answer key");
      if (!c.why) problems.push(sid + " check on " + where + " has no reasoning");
    });

    /* every task cell should be one of the checked cells or explicitly none */
    (p.tasks || []).forEach(t => {
      if (t.cell && !(p.checks || []).some(c => c.cell === t.cell)) {
        problems.push(sid + " task points at " + t.cell + " but nothing checks that cell");
      }
    });

    /* a pivot's fields must exist on its own data */
    if (p.pivot) {
      const keys = Object.keys(p.pivot.data[0] || {});
      (p.pivot.fields || []).forEach(f => {
        if (keys.indexOf(f.name) < 0) problems.push(sid + " pivot field " + f.name + " is not in the data");
      });
      if (!p.pivot.data.length) problems.push(sid + " pivot has no data");
    }

    /* the workbook must build */
    try {
      const wb = s.workbook(sid + ":0");
      if (!wb || !wb.sheets.length) problems.push(sid + " workbook() produced nothing");
    } catch (e) { problems.push(sid + " workbook() threw: " + e.message); }
  });

  /* every question must have a concept that exists and a defensible answer */
  QUESTIONS.forEach((q, i) => {
    checked++;
    if (!CONCEPTS[q.c]) problems.push("question " + i + " tags unknown concept " + q.c);
    if (!q.why) problems.push("question " + i + " has no explanation");
    if (q.t === "mc" || q.t === "pred") {
      if (!q.opts || q.opts.length < 2) problems.push("question " + i + " has too few options");
      if (typeof q.a !== "number" || q.a < 0 || q.a >= (q.opts || []).length) problems.push("question " + i + " has an answer index outside its options");
    } else if (q.t === "type") {
      if (!q.check && !(q.accept && q.accept.length)) problems.push("question " + i + " accepts nothing");
      if (q.check) {
        const sh = new Sheet("Q", 40, 12);
        for (const ref in (q.check.sheet || {})) {
          const pos = parseA1(ref); if (!pos) continue;
          const v = q.check.sheet[ref];
          if (typeof v === "string" && v[0] === "=") sh.setFormula(pos.r, pos.c, v.slice(1)); else sh.set(pos.r, pos.c, v);
        }
        const model = q.model || (q.accept || [])[0];
        if (model) {
          const out = computeFormula(model, sh.ctx());
          if (out && out.parseError) problems.push("question " + i + " model formula does not parse: " + out.parseError);
          else if (!valueMatches(out, q.check.expect, q.check.tol)) {
            problems.push("question " + i + " model formula returns " + JSON.stringify(out) + " but the key says " + JSON.stringify(q.check.expect));
          }
        }
      }
    }
  });

  /* every concept must have at least one question, or it can never be reviewed */
  Object.keys(CONCEPTS).forEach(cid => {
    if (!questionsFor([cid]).length) problems.push("concept " + cid + " has no question, so it can never come up in review");
  });

  /* every reference entry must name a function the engine implements */
  REFERENCE.forEach(r => {
    checked++;
    if (!FN[r.name]) problems.push("reference lists " + r.name + " but the engine does not implement it");
    if (!MODULES[r.module]) problems.push("reference entry " + r.name + " points at unknown module " + r.module);
  });

  if (problems.length) {
    console.error(APP_NAME + " self-test found " + problems.length + " problem(s):");
    problems.forEach(p => console.error("  · " + p));
  } else {
    console.log(APP_NAME + " self-test passed. " + checked + " items verified across " +
      SESSION_ORDER.length + " sessions, " + QUESTIONS.length + " questions and " +
      REFERENCE.length + " reference entries.");
  }
  window.__ddSelfTest = { problems, checked };
}
