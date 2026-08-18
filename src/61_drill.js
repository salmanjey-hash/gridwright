/* ============================================================
   Interview drill: a timed twenty-minute practical mixing every
   Stage 1 skill, because that is the shape of test employers set.
   One messy file, eight tasks, a clock, and a mark at the end
   broken down by module so you know what to go back to.
   ============================================================ */

let DRILL = null;
const DRILL_SECONDS = 20 * 60;

function buildDrill(seed) {
  const r = rng(seed);
  const n = 24;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const s = M5_MASTER[rInt(r, 0, M5_MASTER.length - 1)];
    rows.push({
      ref: "TX-" + (9100 + i),
      code: s.code,
      city: rPick(r, ["Leeds", "London", "Bristol", "Manchester"]),
      date: ymdToSerial(2024, 2, 1) + rInt(r, 0, 89),
      amount: xround(rInt(r, 3000, 280000) / 100, 2)
    });
  }
  /* the faults, on known rows so the key is exact */
  rows[3].code = rows[3].code + " ";      // trailing space
  rows[9].code = "SUP-999";               // not in the master
  const textAmountRow = 6;

  const sh = new Sheet("Drill", n + 26, 6);
  ["Ref", "Code", "City", "Date", "Amount", "Supplier"].forEach((h, i) => sh.set(0, i, h, { hdr: true, locked: true }));
  rows.forEach((t, i) => {
    sh.set(1 + i, 0, t.ref, { locked: true });
    sh.set(1 + i, 1, t.code, { locked: true });
    sh.set(1 + i, 2, t.city, { locked: true });
    if (i === 2) sh.set(1 + i, 3, formatDate(t.date, "dd/mm/yyyy"), { locked: true });
    else sh.set(1 + i, 3, t.date, { fmt: DATEFMT, locked: true });
    if (i === textAmountRow) sh.set(1 + i, 4, t.amount.toFixed(2) + " ", { locked: true });
    else sh.set(1 + i, 4, t.amount, { fmt: GBP2, locked: true });
  });

  const mStart = n + 4;
  const m = writeMaster(sh, mStart);
  const mCode = "$A$" + m.first + ":$A$" + m.last;
  const mName = "$B$" + m.first + ":$B$" + m.last;

  const qStart = m.last + 3;
  label(sh, "A" + qStart, "Answers");
  const qs = [
    "Rows in the file",
    "Amounts stored as text",
    "Total, all amounts",
    "Transactions over 500",
    "Total for Leeds",
    "Codes not in the master",
    "Distinct cities"
  ];
  qs.forEach((q, i) => note(sh, "A" + (qStart + 1 + i), q));
  const cells = qs.map((q, i) => "C" + (qStart + 1 + i));

  const answers = [];
  for (let i = 0; i < n; i++) answers.push("F" + (2 + i));
  cells.forEach(c => answers.push(c));
  lockSheet(sh, answers);
  sh.rows = qStart + qs.length + 2; sh.cols = 6;

  const amtR = "E2:E" + (n + 1);
  const cityR = "C2:C" + (n + 1);
  const eRows = n;
  const eTextAmounts = solve(sh, "=COUNTA(" + amtR + ")-COUNT(" + amtR + ")");
  const eTotal = solve(sh, "=SUM(" + amtR + ")");
  const eOver = solve(sh, '=COUNTIF(' + amtR + ',">500")');
  const eLeeds = solve(sh, '=SUMIFS(' + amtR + ',' + cityR + ',"Leeds")');
  const eUnmatched = rows.filter(t => !M5_MASTER.some(x => x.code === String(t.code).trim())).length;
  const eCities = solve(sh, "=COUNTA(UNIQUE(" + cityR + "))");
  const nameOf = c => { const f = M5_MASTER.find(x => x.code === String(c).trim()); return f ? f.name : "not on file"; };

  return {
    sheet: sh,
    maxRows: sh.rows, maxCols: 6, startRow: 1, startCol: 5, fillBar: true,
    highlight: answers,
    brief: "Twenty-four payments and a supplier master. Bring the supplier name across in column F, then answer the seven questions below. " +
      "The file is damaged in the usual ways and nothing is labelled. Twenty minutes.",
    checks: [
      {
        cell: "F2", module: "m5", expect: nameOf(rows[0].code), needFormula: true, mustUse: "XLOOKUP",
        task: "F2: the supplier name, filled down the column.",
        answer: '=XLOOKUP(TRIM(B2),' + mCode + ',' + mName + ',"not on file")',
        why: "TRIM handles the row with a trailing space; the if_not_found argument handles the code that is not in the master. Both faults are present, and a plain lookup fails on each."
      },
      {
        cell: "F11", module: "m5", expect: "not on file", needFormula: true, mustUse: "XLOOKUP",
        task: "F11: the row whose code is not in the master.",
        answer: '=XLOOKUP(TRIM(B11),' + mCode + ',' + mName + ',"not on file")',
        why: "A genuine gap in the reference data. The right answer is a message, not a blank and not an error."
      },
      {
        cell: cells[0], module: "m1", expect: eRows,
        task: cells[0] + ": rows in the file.",
        answer: String(eRows),
        why: "Establish the size of the data before anything else, so every later figure can be checked against it."
      },
      {
        cell: cells[1], module: "m2", expect: eTextAmounts, needFormula: true,
        task: cells[1] + ": amounts stored as text.",
        answer: "=COUNTA(" + amtR + ")-COUNT(" + amtR + ")",
        why: "COUNTA counts everything non-empty, COUNT counts only numbers, and the gap is the number of text values. This is the two-cell check from Module 2, written as one."
      },
      {
        cell: cells[2], module: "m2", expect: eTotal, tol: 0.02, needFormula: true, mustUse: "SUM",
        task: cells[2] + ": the total of all amounts.",
        answer: "=SUM(" + amtR + ")",
        why: "Note this excludes the text amount, silently. The honest answer states the total and the fact that one row could not be included."
      },
      {
        cell: cells[3], module: "m3", expect: eOver, needFormula: true, mustUse: "COUNTIF",
        task: cells[3] + ": transactions over 500.",
        answer: '=COUNTIF(' + amtR + ',">500")',
        why: "Criteria quoted, operator included. Over 500 excludes 500 exactly."
      },
      {
        cell: cells[4], module: "m3", expect: eLeeds, tol: 0.02, needFormula: true, mustUse: "SUMIFS",
        task: cells[4] + ": the total for Leeds.",
        answer: '=SUMIFS(' + amtR + ',' + cityR + ',"Leeds")',
        why: "Range being added first in SUMIFS, then range and criterion pairs."
      },
      {
        cell: cells[5], module: "m5", expect: eUnmatched,
        task: cells[5] + ": codes not in the master.",
        answer: String(eUnmatched),
        why: "Count the not-on-file results in column F. This is a data quality finding, not a nuisance to be filtered away."
      },
      {
        cell: cells[6], module: "m4", expect: eCities, needFormula: true,
        task: cells[6] + ": distinct cities.",
        answer: "=COUNTA(UNIQUE(" + cityR + "))",
        why: "UNIQUE returns the distinct list without touching the data; COUNTA counts it."
      }
    ]
  };
}

/* ---------- the view ---------- */
RENDERERS.drill = function (root) {
  clear(root);

  if (!drillUnlocked()) {
    root.appendChild(el("h1", { text: "Interview drill" }));
    root.appendChild(el("div", { class: "card", style: "margin-top:16px" }, [
      el("p", { text: "This unlocks when Module 7 is complete. Before then it would only tell you what you already know: that you have not learned it yet." })
    ]));
    return;
  }

  if (!DRILL) {
    const past = S.drills || [];
    root.appendChild(el("h1", { text: "Interview drill" }));
    root.appendChild(el("p", { class: "lede", style: "margin-top:6px", text: "Twenty minutes, one damaged file, nine answers. Everything from Stage 1, mixed and unlabelled, which is how a practical test actually arrives." }));
    root.appendChild(el("div", { class: "card", style: "margin-top:16px" }, [
      el("h3", { text: "Before you start" }),
      el("ul", { class: "prose small", style: "margin-top:8px" }, [
        el("li", { html: "The clock runs from the moment you begin and does not pause. Finishing late is not a failure; not finishing tells you where you are slow." }),
        el("li", { html: "Nothing tells you which faults are in the file. Finding them is part of the test." }),
        el("li", { html: "You can submit early. Marks are shown by module, so a low score points at what to revisit." })
      ]),
      el("div", { class: "row", style: "margin-top:18px" }, [
        el("button", { class: "btn btn-primary btn-lg", onclick: () => startDrill(), text: "Start the twenty minutes" })
      ])
    ]));

    if (past.length) {
      const h = el("div", { class: "card", style: "margin-top:16px" });
      h.appendChild(el("h3", { text: "Previous attempts" }));
      const ul = el("ul", { class: "tasks", style: "margin-top:8px" });
      past.slice(-6).reverse().forEach(d => {
        ul.appendChild(el("li", {}, [el("div", { class: "tmain" }, [
          el("div", { style: "font-weight:560", text: d.score + " of " + d.total + " correct" }),
          el("div", { class: "tiny muted", style: "margin-top:2px", text: fmtDate(d.at.slice(0, 10)) + " · " + Math.floor(d.seconds / 60) + " min " + (d.seconds % 60) + " sec" })
        ])]));
      });
      h.appendChild(ul);
      root.appendChild(h);
    }
    return;
  }

  if (DRILL.finished) { drillResults(root); return; }

  /* running */
  const left = Math.max(0, DRILL_SECONDS - Math.floor((Date.now() - DRILL.startedAt) / 1000));
  const mins = Math.floor(left / 60), secs = left % 60;
  root.appendChild(el("div", { class: "row", style: "margin-bottom:12px" }, [
    el("span", { class: "eyebrow", text: "Interview drill" }),
    el("span", {
      class: "pill row-end " + (left < 120 ? "pill-bad" : left < 360 ? "pill-warn" : "pill-accent"),
      style: "font-variant-numeric:tabular-nums;font-size:14px",
      text: mins + ":" + String(secs).padStart(2, "0") + " left"
    })
  ]));

  root.appendChild(el("div", { class: "card" }, [
    el("h2", { text: "The brief" }),
    el("p", { style: "margin-top:8px;color:var(--ink-2)", text: DRILL.data.brief })
  ]));

  const tcard = el("div", { class: "card" });
  tcard.appendChild(el("h3", { text: "Answers required" }));
  const list = el("ul", { class: "tasks", style: "margin-top:6px" });
  DRILL.data.checks.forEach(c => {
    list.appendChild(el("li", {}, [el("div", { class: "tmain" }, [
      el("div", { html: c.task })
    ])]));
  });
  tcard.appendChild(list);
  root.appendChild(tcard);

  const gcard = el("div", { class: "card" });
  gcard.appendChild(el("h3", { text: "The file" }));
  gcard.appendChild(DRILL.grid.render());
  root.appendChild(gcard);

  root.appendChild(el("div", { class: "row", style: "margin-top:16px" }, [
    el("button", { class: "btn btn-ghost", onclick: () => { DRILL = null; go("home"); }, text: "Abandon" }),
    el("button", { class: "btn btn-primary btn-lg row-end", onclick: () => finishDrill(), text: "Submit" })
  ]));
};

function startDrill() {
  const seed = "drill:" + Date.now();
  const data = buildDrill(seed);
  DRILL = {
    data, seed, startedAt: Date.now(), finished: false,
    grid: new GridView(data.sheet, {
      targets: data.highlight, maxRows: data.maxRows, maxCols: data.maxCols,
      startRow: data.startRow, startCol: data.startCol, fillBar: data.fillBar
    })
  };
  DRILL.tick = setInterval(() => {
    if (!DRILL || DRILL.finished) return;
    const left = DRILL_SECONDS - Math.floor((Date.now() - DRILL.startedAt) / 1000);
    if (left <= 0) { finishDrill(); return; }
    if (currentView === "drill") {
      const pill = $("#view-drill .pill");
      if (pill) {
        const m = Math.floor(left / 60), s = left % 60;
        pill.textContent = m + ":" + String(s).padStart(2, "0") + " left";
        pill.className = "pill row-end " + (left < 120 ? "pill-bad" : left < 360 ? "pill-warn" : "pill-accent");
      }
    }
  }, 1000);
  go("drill");
}

function finishDrill() {
  if (!DRILL || DRILL.finished) return;
  clearInterval(DRILL.tick);
  DRILL.finished = true;
  DRILL.seconds = Math.min(DRILL_SECONDS, Math.floor((Date.now() - DRILL.startedAt) / 1000));
  DRILL.results = DRILL.grid.check(DRILL.data.checks);
  const score = DRILL.results.filter(r => r.ok).length;
  S.drills = (S.drills || []).concat([{
    at: new Date().toISOString(), score, total: DRILL.results.length, seconds: DRILL.seconds
  }]);
  saveState();
  go("drill");
}

function drillResults(root) {
  const res = DRILL.results;
  const score = res.filter(r => r.ok).length;
  const mins = Math.floor(DRILL.seconds / 60), secs = DRILL.seconds % 60;

  root.appendChild(el("div", { class: "card" }, [
    el("div", { class: "eyebrow", text: "Drill complete" }),
    el("h1", { text: score + " of " + res.length + " correct", style: "margin-top:6px" }),
    el("p", { class: "small", style: "margin-top:6px;color:var(--ink-2)", text: "Finished in " + mins + " minutes " + secs + " seconds." +
      (DRILL.seconds >= DRILL_SECONDS ? " The clock ran out, which is worth knowing before it happens in an interview." : "") })
  ]));

  /* where the marks went, by module */
  const byMod = {};
  res.forEach(r => {
    const m = r.chk.module || "?";
    byMod[m] = byMod[m] || { ok: 0, total: 0 };
    byMod[m].total++; if (r.ok) byMod[m].ok++;
  });
  const mc = el("div", { class: "card" });
  mc.appendChild(el("h3", { text: "Where the marks went" }));
  const ul = el("ul", { class: "tasks", style: "margin-top:8px" });
  Object.keys(byMod).sort().forEach(mid => {
    const b = byMod[mid], mod = MODULES[mid];
    ul.appendChild(el("li", {}, [
      el("div", { class: "tmain" }, [
        el("div", { style: "font-weight:560", text: mod ? "Module " + mod.n + " · " + mod.title : mid }),
        el("div", { class: "tiny muted", style: "margin-top:2px", text: b.ok + " of " + b.total + " correct" })
      ]),
      el("span", { class: "pill " + (b.ok === b.total ? "pill-good" : b.ok === 0 ? "pill-bad" : "pill-warn"), text: b.ok + "/" + b.total })
    ]));
  });
  mc.appendChild(ul);
  const weakest = Object.keys(byMod).filter(m => byMod[m].ok < byMod[m].total).sort();
  if (weakest.length) {
    mc.appendChild(el("p", { class: "small", style: "margin-top:12px;color:var(--ink-2)", html:
      "Marks came off in " + weakest.map(m => MODULES[m] ? "Module " + MODULES[m].n : m).join(" and ") +
      ". That is where the next hour is worth spending, not on another drill." }));
  }
  root.appendChild(mc);

  res.forEach(r => {
    const card = el("div", { class: "card" });
    card.appendChild(el("div", { class: "row" }, [
      el("span", { class: "pill " + (r.ok ? "pill-good" : "pill-bad"), text: r.ok ? "correct" : "not yet" }),
      el("span", { class: "tiny muted", text: r.chk.module && MODULES[r.chk.module] ? "Module " + MODULES[r.chk.module].n : "" })
    ]));
    card.appendChild(el("p", { style: "margin-top:10px;font-weight:560", html: r.chk.task }));
    if (!r.ok) card.appendChild(el("div", { class: "callout callout-trap", style: "margin-top:10px" }, [
      el("div", { class: "callout-h", text: "What happened" }), el("p", { text: r.note })
    ]));
    card.appendChild(el("code", { class: "f-blk", style: "margin-top:10px", text: r.chk.answer }));
    card.appendChild(el("p", { class: "small", style: "margin-top:8px;color:var(--ink-2)", html: r.chk.why }));
    root.appendChild(card);
  });

  root.appendChild(el("div", { class: "row", style: "margin-top:16px" }, [
    el("button", { class: "btn", onclick: () => { DRILL = null; go("home"); }, text: "Back to the course" }),
    el("button", { class: "btn btn-primary row-end", onclick: () => { DRILL = null; startDrill(); }, text: "Another drill, new file" })
  ]));
}
