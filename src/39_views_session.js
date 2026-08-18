/* ============================================================
   Session player: warm-up quiz -> lesson -> practice -> self-check
   -> concept rating. The order is the point: retrieval before new
   material, doing before checking.
   ============================================================ */

let RUN = null;

function startSession(sid, opts) {
  const s = SESSIONS[sid];
  if (!s) { toast("That session is not built yet."); return; }
  const warm = pickWarmup(sid, 4);
  RUN = {
    sid, s,
    phases: [],
    phase: 0,
    length: (opts && opts.length) || null,
    warm, wIdx: 0, wAnswers: [],
    variant: 0,
    grid: null, checks: [], results: null, checked: false,
    ratings: {},
    startedAt: Date.now(),
    reviewOnly: !!(opts && opts.reviewOnly)
  };
  RUN.phases = ["setup"].concat(warm.length ? ["warmup"] : [], ["lesson", "practice", "check", "wrap"]);
  go("session");
}

function phaseName() { return RUN.phases[RUN.phase]; }
function nextPhase() { RUN.phase = Math.min(RUN.phases.length - 1, RUN.phase + 1); go("session"); }
function prevPhase() { RUN.phase = Math.max(0, RUN.phase - 1); go("session"); }

RENDERERS.session = function (root) {
  clear(root);
  if (!RUN) { go("home"); return; }
  const s = RUN.s, m = MODULES[s.module];

  /* header rail */
  root.appendChild(el("div", { class: "row", style: "margin-bottom:10px" }, [
    el("button", { class: "btn btn-ghost btn-sm", onclick: () => leaveSession(), text: "← Leave" }),
    el("span", { class: "tiny muted row-end", text: "Module " + m.n + " · Session " + s.n + " · " + labelFor(phaseName()) })
  ]));
  const rail = el("div", { class: "rail" });
  RUN.phases.forEach((p, i) => rail.appendChild(el("i", { class: i === RUN.phase ? "on" : (i < RUN.phase ? "past" : "") })));
  root.appendChild(rail);

  ({ setup: viewSetup, warmup: viewWarmup, lesson: viewLesson, practice: viewPractice, check: viewCheck, wrap: viewWrap })[phaseName()](root);
};

function labelFor(p) {
  return ({ setup: "getting started", warmup: "warm-up", lesson: "lesson", practice: "practice", check: "self-check", wrap: "wrap-up" })[p] || p;
}
function leaveSession() {
  if (RUN && RUN.phase >= 2 && !sessionDone(RUN.sid)) {
    openModal((box, close) => {
      box.appendChild(el("h2", { text: "Leave this session?" }));
      box.appendChild(el("p", { class: "small", style: "margin-top:8px;color:var(--ink-2)", text: "Your quiz answers are already recorded. The practice work in the grid will not be kept." }));
      box.appendChild(el("div", { class: "row", style: "margin-top:18px" }, [
        el("button", { class: "btn", onclick: close, text: "Stay" }),
        el("button", { class: "btn btn-primary row-end", onclick: () => { close(); RUN = null; go("home"); }, text: "Leave" })
      ]));
    });
  } else { RUN = null; go("home"); }
}

/* ============================================================
   Phase 0: how long have you got
   ============================================================ */
function viewSetup(root) {
  const s = RUN.s;
  const card = el("div", { class: "card" });
  card.appendChild(el("div", { class: "eyebrow", text: "Session " + s.n }));
  card.appendChild(el("h1", { text: s.title, style: "margin-top:6px" }));
  card.appendChild(el("p", { class: "lede", style: "margin-top:8px", text: s.aim }));
  if (s.why) card.appendChild(el("div", { class: "callout callout-why", style: "margin-top:14px" }, [
    el("div", { class: "callout-h", text: "Why this matters" }), el("p", { html: s.why })
  ]));

  card.appendChild(el("h3", { text: "How long have you got?", style: "margin-top:22px" }));
  card.appendChild(el("p", { class: "small muted", style: "margin-top:4px", text: "Both count as completing the session. A short session done is worth more than a long one skipped." }));
  const pick = el("div", { class: "grid2", style: "margin-top:12px" });
  [["core", "About 25 minutes", "Warm-up, the lesson, and the tasks that carry the idea. Everything essential."],
   ["full", "About an hour", "The core plus the extension tasks, which are harder and mix in earlier modules."]]
    .forEach(([key, title, blurb]) => {
      pick.appendChild(el("button", {
        class: "mod", style: "align-items:flex-start",
        onclick: () => { RUN.length = key; S.prefs.length = key; saveState(); nextPhase(); }
      }, [
        el("span", { class: "mmain" }, [
          el("span", { class: "mt", text: title }),
          el("span", { class: "ms", style: "white-space:normal", text: blurb })
        ])
      ]));
    });
  card.appendChild(pick);
  root.appendChild(card);
}

/* ============================================================
   Phase 1: warm-up retrieval quiz
   ============================================================ */
function viewWarmup(root) {
  const q = RUN.warm[RUN.wIdx];
  const box = el("div", { class: "qbox" });
  const dots = el("div", { class: "qdots" });
  RUN.warm.forEach((_, i) => {
    const a = RUN.wAnswers[i];
    dots.appendChild(el("i", { class: i === RUN.wIdx ? "now" : (a ? (a.correct ? "done" : "miss") : "") }));
  });
  box.appendChild(el("div", { class: "qhead" }, [
    el("span", { class: "eyebrow", text: "Warm-up  ·  from memory" }),
    dots
  ]));

  const body = el("div", { class: "qbody" });
  box.appendChild(body);
  renderQuestion(body, q, RUN.wAnswers[RUN.wIdx], res => {
    if (!RUN.wAnswers[RUN.wIdx]) {
      RUN.wAnswers[RUN.wIdx] = res;
      gradeCard(q.c, res.correct);
      renderNav();
    }
    go("session");
  }, () => {
    if (RUN.wIdx < RUN.warm.length - 1) { RUN.wIdx++; go("session"); }
    else nextPhase();
  });

  root.appendChild(el("p", { class: "small muted", style: "margin-bottom:12px" }, [
    "Answer before looking anything up. Getting it wrong now is what makes it stick later; this is not a test."
  ]));
  root.appendChild(box);
}

/* Shared question renderer, used by warm-up, review and drill. */
function renderQuestion(body, q, answered, onAnswer, onNext) {
  const concept = CONCEPTS[q.c];
  if (concept) body.appendChild(el("div", { class: "chipset", style: "margin-bottom:12px" }, [
    el("span", { class: "chip", text: concept.label })
  ]));
  body.appendChild(el("div", { class: "qstem", html: q.q }));
  if (q.formula) body.appendChild(el("code", { class: "f-blk", style: "margin-top:12px", text: q.formula }));
  if (q.data) body.appendChild(miniTable(q.data));

  if (q.t === "type") {
    const inp = el("input", { class: "qtype", style: "margin-top:14px", type: "text", spellcheck: "false", placeholder: "=", value: answered ? answered.given : "" });
    if (answered) inp.disabled = true;
    body.appendChild(inp);
    if (!answered) {
      const go1 = () => {
        const given = inp.value.trim();
        if (!given) { toast("Type a formula, or your best guess at one."); return; }
        onAnswer(gradeTyped(q, given));
      };
      inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); go1(); } });
      body.appendChild(el("div", { class: "row", style: "margin-top:12px" }, [
        el("button", { class: "btn btn-primary", onclick: go1, text: "Check" })
      ]));
      setTimeout(() => inp.focus(), 20);
    }
  } else {
    const opts = el("div", { class: "qopts" });
    q.opts.forEach((text, i) => {
      const b = el("button", { class: "qopt", disabled: !!answered }, [
        el("span", { class: "key", text: "ABCD"[i] }),
        el("span", { html: text })
      ]);
      if (answered) {
        if (i === q.a) b.classList.add("right");
        else if (i === answered.given) b.classList.add("wrong");
      } else {
        b.addEventListener("click", () => onAnswer({ given: i, correct: i === q.a }));
      }
      opts.appendChild(b);
    });
    body.appendChild(opts);
  }

  if (answered) {
    const v = el("div", { class: "verdict " + (answered.correct ? "v-good" : "v-bad") });
    v.appendChild(el("div", { class: "vh", text: answered.correct ? "Correct" : "Not this time" }));
    if (q.t === "type" && !answered.correct && answered.note) v.appendChild(el("p", { html: answered.note }));
    if (q.model) v.appendChild(el("p", { style: "margin-top:6px" }, [
      el("span", { class: "tiny muted", text: "A formula that works: " }), el("code", { class: "f", text: q.model })
    ]));
    v.appendChild(el("p", { html: q.why, style: "margin-top:8px" }));
    if (!answered.correct && q.trap) v.appendChild(el("p", { class: "small", style: "margin-top:8px", html: "<strong>The common wrong turn:</strong> " + q.trap }));
    body.appendChild(v);
    body.appendChild(el("div", { class: "row", style: "margin-top:16px" }, [
      el("button", { class: "btn btn-primary row-end", onclick: onNext, text: "Next" })
    ]));
  }
}

function miniTable(data) {
  const t = el("table", { class: "reftable", style: "margin-top:12px;font-family:var(--mono);font-size:13px" });
  const head = el("tr");
  head.appendChild(el("th", { text: "" }));
  data.cols.forEach(c => head.appendChild(el("th", { text: c })));
  t.appendChild(head);
  data.rows.forEach((r, i) => {
    const tr = el("tr");
    tr.appendChild(el("th", { text: String(data.startRow ? data.startRow + i : i + 1), style: "text-align:right;color:var(--ink-3)" }));
    r.forEach(v => tr.appendChild(el("td", { text: v === null ? "" : String(v), style: typeof v === "number" ? "text-align:right" : "" })));
    t.appendChild(tr);
  });
  return el("div", { style: "overflow-x:auto" }, [t]);
}

/* Grade a typed formula by actually running it. */
function gradeTyped(q, given) {
  const norm = given.trim();
  if (q.check) {
    const sh = new Sheet("Q", 40, 12);
    const spec = q.check.sheet || {};
    for (const ref in spec) {
      const p = parseA1(ref);
      if (!p) continue;
      const v = spec[ref];
      if (typeof v === "string" && v[0] === "=") sh.setFormula(p.r, p.c, v.slice(1));
      else sh.set(p.r, p.c, v);
    }
    const out = computeFormula(norm, sh.ctx());
    if (out && out.parseError) return { given, correct: false, note: "Excel could not read that: " + esc(out.parseError) };
    if (isErr(out)) return { given, correct: false, note: "That returns " + out.err + ". " + errorHelp(out.err) };
    let ok = valueMatches(out, q.check.expect, q.check.tol);
    let note = "";
    if (ok && q.check.mustUse) {
      const up = norm.toUpperCase();
      const need = Array.isArray(q.check.mustUse) ? q.check.mustUse : [q.check.mustUse];
      if (!need.some(n => up.includes(n.toUpperCase()))) {
        ok = false; note = "The answer is right, but the question asks for " + need.join(" or ") + ".";
      }
    }
    if (!ok && !note) note = "That gives " + (out === null ? "an empty result" : String(isRange(out) ? "a range" : out)) + ", and the answer is " + displayExpected(q.check.expect) + ".";
    return { given, correct: ok, note };
  }
  const clean = t => String(t).toUpperCase().replace(/\s+/g, "").replace(/^=/, "");
  const accepts = (q.accept || []).map(clean);
  return { given, correct: accepts.indexOf(clean(norm)) >= 0, note: "" };
}

/* ============================================================
   Phase 2: the lesson
   ============================================================ */
function viewLesson(root) {
  const s = RUN.s;
  const card = el("div", { class: "card" });
  card.appendChild(el("div", { class: "eyebrow", text: "Lesson  ·  about 5 minutes" }));
  card.appendChild(el("h1", { text: s.title, style: "margin-top:6px" }));
  const prose = el("div", { class: "prose", style: "margin-top:16px" });
  renderBlocks(prose, s.lesson || []);
  card.appendChild(prose);
  root.appendChild(card);
  root.appendChild(el("div", { class: "row", style: "margin-top:16px" }, [
    el("button", { class: "btn", onclick: prevPhase, text: "Back" }),
    el("button", { class: "btn btn-primary btn-lg row-end", onclick: nextPhase, text: "Start practising" })
  ]));
  (s.concepts || []).forEach(introduceConcept);
  unlockFns(s.unlocks || []);
  saveState();
}

/* Declarative lesson blocks keep every lesson to the same shape. */
function renderBlocks(target, blocks) {
  blocks.forEach(b => {
    if (typeof b === "string") { target.appendChild(el("p", { html: b })); return; }
    if (b.lead) { target.appendChild(el("p", { class: "lead-blunt", html: b.lead })); return; }
    if (b.h) { target.appendChild(el("h3", { text: b.h })); return; }
    if (b.p) { target.appendChild(el("p", { html: b.p })); return; }
    if (b.ul) { target.appendChild(el("ul", {}, b.ul.map(x => el("li", { html: x })))); return; }
    if (b.ol) { target.appendChild(el("ol", {}, b.ol.map(x => el("li", { html: x })))); return; }
    if (b.steps) { target.appendChild(el("ol", { class: "steps" }, b.steps.map(x => el("li", { html: x })))); return; }
    if (b.f) { target.appendChild(el("code", { class: "f-blk", text: b.f })); return; }
    if (b.table) { target.appendChild(miniTable(b.table)); return; }
    if (b.charts) { target.appendChild(chartCards(b.charts)); return; }
    if (b.why) target.appendChild(callout("why", "Why it works this way", b.why));
    if (b.trap) target.appendChild(callout("trap", "Where people go wrong", b.trap));
    if (b.pro) target.appendChild(callout("pro", "What professionals do", b.pro));
    if (b.web) target.appendChild(callout("web", "Excel for the web", b.web));
    if (b.desk) target.appendChild(callout("desk", "On desktop Excel, faster", b.desk));
    if (b.path) {
      const p = el("div", { class: "path" });
      b.path.forEach((x, i) => { if (i) p.appendChild(el("i", { text: "›" })); p.appendChild(el("span", { text: x })); });
      target.appendChild(p);
    }
  });
}
function callout(kind, head, body) {
  return el("div", { class: "callout callout-" + kind }, [
    el("div", { class: "callout-h", text: head }),
    el("p", { html: body })
  ]);
}

/* ============================================================
   Phase 3: practice
   ============================================================ */
function buildPractice() {
  const s = RUN.s;
  const seed = s.id + ":" + RUN.variant;
  const p = s.practice(seed);
  RUN.practiceData = p;
  RUN.checks = p.checks.filter(c => RUN.length === "full" || !c.ext);
  RUN.tasks = p.tasks.filter(t => RUN.length === "full" || !t.ext);
  /* Highlight every cell the learner is meant to fill, not only the
     sampled ones the answer key checks. */
  const highlight = RUN.checks.map(c => c.cell).filter(Boolean)
    .concat((p.highlight || []).filter(ref => RUN.length === "full" || !p.extHighlight || p.extHighlight.indexOf(ref) < 0));
  RUN.grid = new GridView(p.sheet, {
    targets: highlight,
    maxRows: p.maxRows, maxCols: p.maxCols,
    startRow: p.startRow, startCol: p.startCol,
    hint: p.hint, formatBar: p.formatBar, fillBar: p.fillBar, colWidth: p.colWidth
  });
  RUN.pivot = p.pivot ? new PivotView(p.pivot.data, p.pivot.fields, { initial: p.pivot.initial }) : null;
  RUN.done = {};
  RUN.checked = false;
  RUN.results = null;
}

/* Checks that inspect the pivot rather than a cell. */
function checkPivot(checks) {
  const out = [];
  (checks || []).forEach(chk => {
    if (!chk.pivotSpec) return;
    const ok = RUN.pivot && RUN.pivot.matchesSpec(chk.pivotSpec);
    out.push({
      cell: "pivot", chk, ok,
      note: ok ? "" : "The pivot is not set up the way the task asked. Wanted " +
        Object.keys(chk.pivotSpec).map(k => k + " = " + chk.pivotSpec[k]).join(", ") + "."
    });
  });
  return out;
}

function viewPractice(root) {
  const s = RUN.s;
  if (!RUN.grid) buildPractice();

  const head = el("div", { class: "card" });
  head.appendChild(el("div", { class: "eyebrow", text: "Practice  ·  " + (RUN.length === "full" ? "about 40 minutes" : "about 15 minutes") }));
  head.appendChild(el("h2", { text: RUN.practiceData.brief.title, style: "margin-top:6px" }));
  head.appendChild(el("p", { style: "margin-top:8px;color:var(--ink-2)", html: RUN.practiceData.brief.body }));

  head.appendChild(el("div", { class: "row", style: "margin-top:16px" }, [
    el("button", {
      class: "btn", onclick: () => {
        const wb = s.workbook(s.id + ":" + RUN.variant);
        const r = downloadWorkbook(wb, APP_NAME + "-M" + MODULES[s.module].n + "S" + s.n + "-practice");
        toast(r.format === "xlsx" ? "Downloaded " + r.name : "SheetJS is offline, so you have " + r.name + " instead");
      }
    }, [downloadIcon(), "Download the workbook for real Excel"]),
    el("button", {
      class: "btn btn-ghost btn-sm", onclick: () => { RUN.variant++; buildPractice(); go("session"); },
      text: "New numbers"
    })
  ]));
  head.appendChild(el("p", { class: "tiny muted", style: "margin-top:8px", text: "The workbook and the grid below hold the same data and the same tasks. Do it in whichever you prefer; the answer key covers both." }));
  root.appendChild(head);

  /* task list */
  const tcard = el("div", { class: "card" });
  tcard.appendChild(el("h3", { text: "Tasks" }));
  const list = el("ul", { class: "tasks", style: "margin-top:6px" });
  RUN.tasks.forEach((t, i) => {
    const boxBtn = el("button", {
      class: "tbox", "aria-pressed": RUN.done[t.id] ? "true" : "false",
      "aria-label": "Mark task " + (i + 1) + " done",
      text: "✓",
      onclick: () => { RUN.done[t.id] = !RUN.done[t.id]; go("session"); }
    });
    list.appendChild(el("li", {}, [
      boxBtn,
      el("div", { class: "tmain" }, [
        el("div", { html: t.text }),
        t.cell ? el("div", { class: "tiny", style: "margin-top:3px" }, [
          el("span", { class: "muted", text: "Answer goes in " }), el("span", { class: "tcell", text: t.cell })
        ]) : null,
        t.ext ? el("span", { class: "pill", style: "margin-top:6px", text: "extension" }) : null
      ])
    ]));
  });
  tcard.appendChild(list);
  root.appendChild(tcard);

  /* the capstone's marking rubric */
  if (RUN.practiceData.rubric) {
    const rubric = RUN.practiceData.rubric === true ? STAGE1_RUBRIC : RUN.practiceData.rubric;
    const rc = el("div", { class: "card" });
    rc.appendChild(el("h3", { text: "Marking rubric" }));
    rc.appendChild(el("p", { class: "small muted", style: "margin-top:4px", text: "Mark yourself out of 24 once the workbook is finished. Under 16 means redo the module the marks came off, not the capstone." }));
    const t = el("table", { class: "rubric", style: "margin-top:12px" });
    t.appendChild(el("tr", {}, [el("th", { text: "Stage" }), el("th", { text: "What earns the marks" }), el("th", { text: "Marks" })]));
    let total = 0;
    rubric.forEach(([stage, crit, pts]) => {
      total += pts;
      t.appendChild(el("tr", {}, [el("td", { text: stage }), el("td", { text: crit }), el("td", { class: "pts", text: String(pts) })]));
    });
    t.appendChild(el("tr", {}, [el("td", { text: "Total" }), el("td", { text: "" }), el("td", { class: "pts", text: String(total) })]));
    rc.appendChild(t);
    root.appendChild(rc);
  }

  /* the pivot, when the session uses one */
  if (RUN.pivot) {
    const pc = el("div", { class: "card" });
    pc.appendChild(el("div", { class: "row" }, [
      el("h3", { text: "Pivot table" }),
      el("span", { class: "pill row-end", text: RUN.practiceData.pivot.data.length + " source rows" })
    ]));
    pc.appendChild(el("p", { class: "tiny muted", style: "margin:6px 0 12px", html: RUN.practiceData.pivot.hint ||
      "These four boxes are Excel's field list, with the same names. Change one and the table below rebuilds." }));
    pc.appendChild(RUN.pivot.render());
    root.appendChild(pc);
  }

  /* the grid */
  const gcard = el("div", { class: "card" });
  gcard.appendChild(el("div", { class: "row" }, [
    el("h3", { text: "Practice grid" }),
    el("span", { class: "pill row-end", text: "amber cells are yours to fill" })
  ]));
  gcard.appendChild(el("p", { class: "tiny muted", style: "margin:6px 0 12px" }, [
    "Click a cell and type. ", el("kbd", { text: "Enter" }), " moves down, ", el("kbd", { text: "Tab" }), " moves right, ",
    el("kbd", { text: "F2" }), " edits, ", el("kbd", { text: "Delete" }), " clears. Formulas start with an equals sign."
  ]));
  gcard.appendChild(RUN.grid.render());
  root.appendChild(gcard);

  root.appendChild(el("div", { class: "row", style: "margin-top:16px" }, [
    el("button", { class: "btn", onclick: prevPhase, text: "Back to the lesson" }),
    el("button", { class: "btn btn-primary btn-lg row-end", onclick: () => { runCheck(); nextPhase(); }, text: "Check my work" })
  ]));
}

function downloadIcon() {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("width", "15"); s.setAttribute("height", "15"); s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2");
  s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
  s.innerHTML = '<path d="M12 3v12M7 11l5 5 5-5M4 20h16"/>';
  return s;
}

function runCheck() {
  const cellChecks = RUN.checks.filter(c => !c.pivotSpec);
  RUN.results = checkPivot(RUN.checks.filter(c => c.pivotSpec)).concat(RUN.grid.check(cellChecks));
  RUN.checked = true;
  S.stats.exercisesChecked++;
  saveState();
}

/* ============================================================
   Phase 4: self-check and answer key
   ============================================================ */
function viewCheck(root) {
  const s = RUN.s;
  const res = RUN.results || [];
  const right = res.filter(r => r.ok).length;

  const head = el("div", { class: "card" });
  head.appendChild(el("div", { class: "eyebrow", text: "Self-check" }));
  head.appendChild(el("h2", { text: right + " of " + res.length + " correct", style: "margin-top:6px" }));
  head.appendChild(el("p", { class: "small", style: "margin-top:6px;color:var(--ink-2)", text: right === res.length ? "All of them. Read the reasoning anyway; knowing why an answer is right is what transfers to the next problem." : "Work through the ones that are wrong below. Each has the reasoning and the mistake that usually causes it." }));
  head.appendChild(el("div", { class: "row", style: "margin-top:14px" }, [
    el("button", { class: "btn", onclick: () => { RUN.phase = RUN.phases.indexOf("practice"); go("session"); }, text: "Back to the grid and fix them" })
  ]));
  root.appendChild(head);

  res.forEach((r, i) => {
    const chk = r.chk;
    const card = el("div", { class: "card" });
    card.appendChild(el("div", { class: "row" }, [
      el("span", { class: "pill " + (r.ok ? "pill-good" : "pill-bad"), text: r.ok ? "correct" : "not yet" }),
      el("span", { class: "tiny muted", text: chk.pivotSpec ? "pivot setup" : "cell " + chk.cell })
    ]));
    card.appendChild(el("p", { style: "margin-top:10px;font-weight:560", html: chk.task || "" }));
    if (!r.ok) card.appendChild(el("div", { class: "callout callout-trap", style: "margin-top:10px" }, [
      el("div", { class: "callout-h", text: "What happened" }), el("p", { text: r.note })
    ]));
    card.appendChild(el("h4", { text: "The answer", style: "margin-top:14px" }));
    card.appendChild(el("code", { class: "f-blk", style: "margin-top:6px", text: chk.answer }));
    if (chk.expect !== undefined) {
      card.appendChild(el("p", { class: "small", style: "margin-top:8px;color:var(--ink-2)", html: "Result: <strong>" + esc(displayExpected(chk.expect)) + "</strong>" }));
    }
    if (chk.why) card.appendChild(el("div", { class: "callout callout-why", style: "margin-top:12px" }, [
      el("div", { class: "callout-h", text: "Why" }), el("p", { html: chk.why })
    ]));
    if (chk.wrongWay) card.appendChild(el("div", { class: "callout callout-trap", style: "margin-top:10px" }, [
      el("div", { class: "callout-h", text: "The common wrong approach" }), el("p", { html: chk.wrongWay })
    ]));
    root.appendChild(card);
  });

  root.appendChild(el("div", { class: "row", style: "margin-top:16px" }, [
    el("button", { class: "btn btn-primary btn-lg row-end", onclick: nextPhase, text: "Rate how it went" })
  ]));
}

/* ============================================================
   Phase 5: rate the concepts, close the session
   ============================================================ */
function viewWrap(root) {
  const s = RUN.s;
  const card = el("div", { class: "card" });
  card.appendChild(el("div", { class: "eyebrow", text: "Wrap-up  ·  about 5 minutes" }));
  card.appendChild(el("h2", { text: "How solid does each of these feel?", style: "margin-top:6px" }));
  card.appendChild(el("p", { class: "small", style: "margin-top:6px;color:var(--ink-2)", text: "Be honest rather than kind. This sets when each idea comes back at you, and an over-generous rating means you meet it again too late to save it." }));

  (s.concepts || []).forEach(cid => {
    const c = CONCEPTS[cid];
    if (!c) return;
    const wrap = el("div", { style: "margin-top:18px" });
    wrap.appendChild(el("div", { style: "font-weight:600", text: c.label }));
    if (c.blurb) wrap.appendChild(el("div", { class: "small muted", style: "margin-top:2px", text: c.blurb }));
    const rate = el("div", { class: "rate", style: "margin-top:8px" });
    [[3, "I got it", "comes back in a week"], [2, "Shaky", "comes back in a few days"], [1, "Lost", "comes back tomorrow"]]
      .forEach(([v, label, sub]) => {
        const b = el("button", { data: { r: String(v) }, onclick: () => { RUN.ratings[cid] = v; go("session"); } }, [
          el("span", { text: label }), el("small", { text: sub })
        ]);
        if (RUN.ratings[cid] === v) b.classList.add("on");
        rate.appendChild(b);
      });
    wrap.appendChild(rate);
    card.appendChild(wrap);
  });
  root.appendChild(card);

  if (s.reflect) {
    const rc = el("div", { class: "card" });
    rc.appendChild(el("h3", { text: "Before you close" }));
    rc.appendChild(el("ul", { class: "prose small", style: "margin-top:8px" }, s.reflect.map(x => el("li", { html: x }))));
    root.appendChild(rc);
  }

  const allRated = (s.concepts || []).every(c => RUN.ratings[c]);
  root.appendChild(el("div", { class: "row", style: "margin-top:16px" }, [
    el("button", {
      class: "btn btn-primary btn-lg row-end", disabled: !allRated,
      onclick: finishSession, text: allRated ? "Finish session" : "Rate each one to finish"
    })
  ]));
}

function finishSession() {
  const s = RUN.s;
  const mins = Math.min(120, Math.max(1, Math.round((Date.now() - RUN.startedAt) / 60000)));
  for (const cid in RUN.ratings) rateConcept(cid, RUN.ratings[cid]);
  const right = (RUN.results || []).filter(r => r.ok).length;
  const wasDone = sessionDone(RUN.sid);
  S.sessions[RUN.sid] = {
    done: true, at: new Date().toISOString(),
    quiz: { right: RUN.wAnswers.filter(a => a && a.correct).length, total: RUN.warm.length },
    check: { right, total: (RUN.results || []).length },
    length: RUN.length
  };
  if (!wasDone) S.stats.sessionsDone++;
  S.stats.minutes += mins;
  S.lastSeen = todayISO();
  saveState();
  const mid = s.module;
  const justFinishedModule = moduleDone(mid);
  RUN = null;
  renderNav();
  if (justFinishedModule) showModuleComplete(mid); else { toast("Session recorded"); go("home"); }
}

function showModuleComplete(mid) {
  const m = MODULES[mid];
  go("home");
  openModal((box, close) => {
    box.appendChild(el("div", { class: "eyebrow", text: "Module " + m.n + " complete" }));
    box.appendChild(el("h2", { text: m.title, style: "margin-top:4px" }));
    box.appendChild(el("p", { class: "small", style: "margin-top:10px;color:var(--ink-2)", html: m.onComplete || "That module is done. The concepts are now in the review rotation, so they will come back at spaced intervals rather than being forgotten." }));
    box.appendChild(el("div", { class: "row", style: "margin-top:18px" }, [
      el("button", { class: "btn btn-primary row-end", onclick: () => { close(); go("home"); }, text: "Continue" })
    ]));
  });
}
