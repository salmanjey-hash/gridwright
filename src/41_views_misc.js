/* ============================================================
   Review, progress, reference, drill, settings
   ============================================================ */

/* ---------- Review: the spaced repetition queue ---------- */
let REVIEW = null;

RENDERERS.review = function (root) {
  clear(root);
  const due = dueCards();

  if (!REVIEW) {
    if (!due.length) {
      const nextDue = Object.keys(S.cards)
        .filter(id => CONCEPTS[id] && S.cards[id].box > 0)
        .map(id => S.cards[id].due).sort()[0];
      root.appendChild(el("div", { class: "card" }, [
        el("h1", { text: "Nothing due" }),
        el("p", { class: "lede", style: "margin-top:8px", text: conceptsIntroduced().length ? "Every concept you have met is still inside its interval. Coming back early does not help; the spacing is what does the work." : "Once you finish a session, the concepts from it enter the review queue." }),
        nextDue ? el("p", { class: "small muted", style: "margin-top:10px", text: "Next review falls due on " + fmtDate(nextDue) + "." }) : null,
        el("div", { class: "row", style: "margin-top:16px" }, [
          el("button", { class: "btn btn-primary", onclick: () => go("home"), text: "Back to the course" }),
          conceptsIntroduced().length ? el("button", { class: "btn", onclick: () => startReview(true), text: "Review early anyway" }) : null
        ])
      ]));
      return;
    }
    root.appendChild(el("div", { class: "card" }, [
      el("div", { class: "eyebrow", text: "Spaced review" }),
      el("h1", { text: due.length + " " + plural(due.length, "concept") + " due", style: "margin-top:6px" }),
      el("p", { class: "lede", style: "margin-top:8px", text: "Short questions on things you learned days ago. Answer from memory. Roughly ten minutes." }),
      el("div", { class: "chipset", style: "margin-top:14px" }, due.slice(0, 12).map(id => el("span", { class: "chip", text: CONCEPTS[id].label }))),
      el("div", { class: "row", style: "margin-top:18px" }, [
        el("button", { class: "btn btn-primary btn-lg", onclick: () => startReview(false), text: "Start review" })
      ])
    ]));
    return;
  }

  /* running a review */
  const q = REVIEW.qs[REVIEW.i];
  if (!q) {
    const right = REVIEW.answers.filter(a => a.correct).length;
    const total = REVIEW.answers.length;
    root.appendChild(el("div", { class: "card" }, [
      el("h1", { text: "Review done" }),
      el("p", { class: "lede", style: "margin-top:8px", text: right + " of " + total + " from memory." }),
      el("p", { class: "small muted", style: "margin-top:8px", text: "Everything you got right has moved to a longer interval. Everything you missed comes back tomorrow." }),
      el("div", { class: "row", style: "margin-top:16px" }, [
        el("button", { class: "btn btn-primary", onclick: () => { REVIEW = null; go("home"); }, text: "Back to the course" }),
        dueCount() > 0 ? el("button", { class: "btn", onclick: () => startReview(false), text: "Keep going (" + dueCount() + " left)" }) : null
      ])
    ]));
    REVIEW = null;
    return;
  }
  const box = el("div", { class: "qbox" });
  const dots = el("div", { class: "qdots" });
  REVIEW.qs.forEach((_, i) => {
    const a = REVIEW.answers[i];
    dots.appendChild(el("i", { class: i === REVIEW.i ? "now" : (a ? (a.correct ? "done" : "miss") : "") }));
  });
  box.appendChild(el("div", { class: "qhead" }, [el("span", { class: "eyebrow", text: "Review " + (REVIEW.i + 1) + " of " + REVIEW.qs.length }), dots]));
  const body = el("div", { class: "qbody" });
  box.appendChild(body);
  renderQuestion(body, q, REVIEW.answers[REVIEW.i], res => {
    if (!REVIEW.answers[REVIEW.i]) { REVIEW.answers[REVIEW.i] = res; gradeCard(q.c, res.correct); renderNav(); }
    go("review");
  }, () => { REVIEW.i++; go("review"); });
  root.appendChild(box);
};

function startReview(early) {
  const pool = early ? conceptsIntroduced() : dueCards();
  const r = rng("review:" + todayISO() + ":" + pool.length);
  const qs = [];
  rShuffle(r, pool).forEach(cid => {
    const opts = questionsFor([cid]);
    if (opts.length) qs.push(rPick(r, opts));
  });
  if (!qs.length) { toast("No questions are written for those concepts yet."); return; }
  REVIEW = { qs: qs.slice(0, 12), i: 0, answers: [] };
  go("review");
}
function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/* ---------- Progress ---------- */
RENDERERS.progress = function (root) {
  clear(root);
  const done = SESSION_ORDER.filter(sessionDone).length;
  const intro = conceptsIntroduced();

  root.appendChild(el("h1", { text: "Progress" }));
  root.appendChild(el("p", { class: "lede", style: "margin-top:6px", text: "What you can do, not what you have watched." }));

  root.appendChild(el("div", { class: "grid3", style: "margin-top:18px" }, [
    statTile(done + " / " + SESSION_ORDER.length, "sessions completed"),
    statTile(MODULE_ORDER.filter(moduleDone).length + " / " + MODULE_ORDER.length, "modules complete"),
    statTile(String(intro.length), "concepts in rotation"),
    statTile(String(intro.filter(id => mastery(id) >= 3).length), "concepts solid"),
    statTile(Math.round(S.stats.minutes) + " min", "time practised"),
    statTile(String(S.stats.exercisesChecked), "exercises checked")
  ]));

  /* module bars */
  const mods = el("div", { class: "card", style: "margin-top:16px" });
  mods.appendChild(el("h2", { text: "Modules" }));
  const chartHost = el("div", { style: "margin-top:14px" });
  mods.appendChild(chartHost);
  drawModuleChart(chartHost);
  root.appendChild(mods);

  /* heat map */
  const hm = el("div", { class: "card", style: "margin-top:16px" });
  hm.appendChild(el("div", { class: "row" }, [
    el("h2", { text: "Concept mastery" }),
    el("span", { class: "tiny muted row-end", text: "darker means a longer interval before you see it again" })
  ]));
  if (!intro.length) {
    hm.appendChild(el("p", { class: "small muted", style: "margin-top:10px", text: "Nothing here yet. Concepts appear once you have met them in a lesson." }));
  } else {
    MODULE_ORDER.forEach(mid => {
      const cs = intro.filter(id => CONCEPTS[id].module === mid);
      if (!cs.length) return;
      hm.appendChild(el("div", { class: "small", style: "margin-top:16px;font-weight:600", text: "Module " + MODULES[mid].n + " · " + MODULES[mid].title }));
      const grid = el("div", { class: "heat", style: "margin-top:6px" });
      cs.forEach(id => {
        const i = el("i", { data: { m: String(mastery(id)) }, title: CONCEPTS[id].label + " — " + masteryWord(mastery(id)) });
        grid.appendChild(i);
      });
      hm.appendChild(grid);
    });
    const key = el("div", { class: "heat-key" }, [el("span", { text: "fragile" })]);
    [1, 2, 3, 4].forEach(m => key.appendChild(el("i", { data: { m: String(m) } })));
    key.appendChild(el("span", { text: "durable" }));
    hm.appendChild(key);
  }
  root.appendChild(hm);

  /* weakest five */
  const weak = weakest(5);
  if (weak.length) {
    const wk = el("div", { class: "card", style: "margin-top:16px" });
    wk.appendChild(el("h2", { text: "The five to work on" }));
    wk.appendChild(el("p", { class: "small muted", style: "margin-top:4px", text: "Lowest interval and lowest accuracy. Not a criticism, just where the next ten minutes pays best." }));
    const ul = el("ul", { class: "tasks", style: "margin-top:10px" });
    weak.forEach(w => {
      const c = CONCEPTS[w.id];
      const seenBit = w.card.seen
        ? "quizzed " + w.card.seen + " " + plural(w.card.seen, "time") + " · " + Math.round(100 * w.card.right / w.card.seen) + "% right"
        : "not yet quizzed";
      ul.appendChild(el("li", {}, [
        el("div", { class: "tmain" }, [
          el("div", { style: "font-weight:560", text: c.label }),
          el("div", { class: "tiny muted", style: "margin-top:2px", text: "Module " + MODULES[c.module].n + " · " + masteryWord(mastery(w.id)) + " · " + seenBit + " · next due " + fmtDate(w.card.due) })
        ])
      ]));
    });
    wk.appendChild(ul);
    wk.appendChild(el("div", { class: "row", style: "margin-top:14px" }, [
      el("button", { class: "btn btn-primary btn-sm", onclick: () => startReview(true), text: "Drill these now" })
    ]));
    root.appendChild(wk);
  }
};
function masteryWord(m) { return ["not started", "fragile", "getting there", "solid", "durable"][m]; }

let chartInstance = null;
function drawModuleChart(host) {
  clear(host);
  const labels = MODULE_ORDER.map(id => "M" + MODULES[id].n);
  const data = MODULE_ORDER.map(id => Math.round(moduleProgress(id) * 100));
  const accent = getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#15605a";
  const line = getComputedStyle(document.body).getPropertyValue("--line").trim() || "#ddd";
  const ink = getComputedStyle(document.body).getPropertyValue("--ink-3").trim() || "#888";

  if (hasChart()) {
    const cv = el("canvas", { height: "200" });
    host.appendChild(cv);
    if (chartInstance) { try { chartInstance.destroy(); } catch (e) {} }
    chartInstance = new Chart(cv, {
      type: "bar",
      data: { labels, datasets: [{ data, backgroundColor: accent, borderRadius: 5, barPercentage: .7 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.parsed.y + "% complete" } } },
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { callback: v => v + "%", color: ink }, grid: { color: line } },
          x: { ticks: { color: ink }, grid: { display: false } }
        }
      }
    });
    return;
  }
  /* SVG fallback so the dashboard works with no CDN */
  const w = 640, h = 200, pad = 28, n = labels.length;
  const bw = (w - pad * 2) / n;
  let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="200" role="img" aria-label="Module completion">';
  svg += '<line x1="' + pad + '" y1="' + (h - pad) + '" x2="' + (w - pad) + '" y2="' + (h - pad) + '" stroke="' + line + '"/>';
  labels.forEach((lb, i) => {
    const bh = (data[i] / 100) * (h - pad * 2);
    const x = pad + i * bw + bw * .15, bwid = bw * .7;
    svg += '<rect x="' + x + '" y="' + (h - pad - bh) + '" width="' + bwid + '" height="' + Math.max(bh, 1) + '" rx="4" fill="' + accent + '"/>';
    svg += '<text x="' + (x + bwid / 2) + '" y="' + (h - pad + 15) + '" font-size="11" fill="' + ink + '" text-anchor="middle">' + lb + '</text>';
  });
  svg += "</svg>";
  host.innerHTML = svg;
}

/* ---------- Reference ---------- */
RENDERERS.reference = function (root) {
  clear(root);
  root.appendChild(el("h1", { text: "Formula reference" }));
  root.appendChild(el("p", { class: "lede", style: "margin-top:6px", text: "Every function this course teaches, with one honest example each. Functions appear here once you have been taught them." }));

  const search = el("input", { class: "searchbox", style: "margin-top:16px", type: "search", placeholder: "Search by name or by what you want to do, for example \"count\" or \"tidy up text\"" });
  root.appendChild(search);
  const host = el("div", { style: "margin-top:14px" });
  root.appendChild(host);

  const draw = () => {
    clear(host);
    const q = search.value.trim().toLowerCase();
    const unlocked = REFERENCE.filter(r => fnUnlocked(r.name));
    const locked = REFERENCE.filter(r => !fnUnlocked(r.name));
    const match = r => !q || r.name.toLowerCase().includes(q) || r.what.toLowerCase().includes(q) || (r.tags || []).some(t => t.includes(q));
    const rows = unlocked.filter(match);

    if (!unlocked.length) {
      host.appendChild(el("div", { class: "card" }, [
        el("p", { text: "Nothing here yet, and that is on purpose." }),
        el("p", { class: "small", style: "margin-top:8px;color:var(--ink-2)", text: "Module 1 teaches no formulas at all. Almost every formula that goes wrong for a beginner goes wrong because of a wrong range or a number stored as text, so the course fixes that first. The functions start in Module 2 and appear here as you meet them." })
      ]));
    } else if (!rows.length) {
      host.appendChild(el("div", { class: "card" }, [el("p", { class: "muted", text: "No match among the functions you have been taught." })]));
    } else {
      const card = el("div", { class: "card", style: "padding:6px 10px" });
      rows.forEach(r => card.appendChild(refRow(r)));
      host.appendChild(card);
    }
    if (locked.length && !q) {
      host.appendChild(el("p", { class: "tiny muted", style: "margin-top:14px", text: locked.length + " more " + plural(locked.length, "function") + " unlock as you go: " + locked.slice(0, 14).map(r => r.name).join(", ") + (locked.length > 14 ? "…" : "") }));
    }
  };
  search.addEventListener("input", draw);
  draw();
};

function refRow(r) {
  const wrap = el("div", { style: "padding:14px 6px;border-top:1px solid var(--line-soft)" });
  wrap.appendChild(el("div", { class: "row" }, [
    el("code", { class: "f", style: "font-size:14px", text: r.name }),
    el("span", { class: "pill row-end", text: "Module " + (MODULES[r.module] ? MODULES[r.module].n : "?") })
  ]));
  wrap.appendChild(el("p", { style: "margin-top:7px", html: r.what }));
  wrap.appendChild(el("code", { class: "f-blk", style: "margin-top:9px", text: r.syntax }));
  wrap.appendChild(el("div", { class: "small", style: "margin-top:8px;color:var(--ink-2)" }, [
    el("code", { class: "f", text: r.example }), el("span", { text: "  →  " }), el("strong", { text: r.result })
  ]));
  if (r.note) wrap.appendChild(el("p", { class: "small", style: "margin-top:8px;color:var(--ink-3)", html: r.note }));
  return wrap;
}

/* ---------- Drill (unlocks after Module 7) ---------- */
RENDERERS.drill = function (root) {
  clear(root);
  root.appendChild(el("h1", { text: "Interview drill" }));
  root.appendChild(el("p", { class: "lede", style: "margin-top:6px", text: "A timed twenty-minute practical mixing everything in Stage 1, because that is the shape of test employers actually set." }));
  if (!drillUnlocked()) {
    root.appendChild(el("div", { class: "card", style: "margin-top:16px" }, [
      el("p", { text: "This unlocks when Module 7 is complete. Before then it would only tell you what you already know: that you have not learned it yet." })
    ]));
    return;
  }
  root.appendChild(el("div", { class: "card", style: "margin-top:16px" }, [
    el("p", { class: "muted", text: "Drill content arrives with Stage 1's capstone." })
  ]));
};

/* ---------- Settings ---------- */
RENDERERS.settings = function (root) {
  clear(root);
  root.appendChild(el("h1", { text: "Settings" }));

  const s1 = el("div", { class: "card", style: "margin-top:16px" });
  s1.appendChild(el("h2", { text: "Your progress" }));
  s1.appendChild(el("p", { class: "small", style: "margin-top:8px;color:var(--ink-2)", html: "Everything is stored in this browser only, under <code>localStorage</code>. Nothing is sent anywhere, there is no account, and no server ever sees it. That also means clearing your browser data will erase it, so export a copy now and then." }));
  const fileInput = el("input", { type: "file", accept: ".json", style: "display:none" });
  fileInput.addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    importProgress(f, err => {
      if (err) { toast("That file could not be read: " + err.message, 4000); return; }
      applyTheme(); renderNav(); go("home"); toast("Progress restored");
    });
  });
  s1.appendChild(fileInput);
  s1.appendChild(el("div", { class: "row", style: "margin-top:14px" }, [
    el("button", { class: "btn", onclick: exportProgress, text: "Export progress (.json)" }),
    el("button", { class: "btn", onclick: () => fileInput.click(), text: "Import progress" })
  ]));

  const s2 = el("div", { class: "card" });
  s2.appendChild(el("h2", { text: "Appearance" }));
  s2.appendChild(el("div", { class: "row", style: "margin-top:12px" },
    ["auto", "light", "dark"].map(t => {
      const b = el("button", { class: "btn btn-sm", onclick: () => { S.theme = t; applyTheme(); saveState(); go("settings"); }, text: t });
      if ((S.theme || "auto") === t) { b.classList.add("btn-primary"); }
      return b;
    })));

  const s3 = el("div", { class: "card" });
  s3.appendChild(el("h2", { text: "Offline and libraries" }));
  const xl = hasXLSX(), ch = hasChart();
  s3.appendChild(el("div", { class: "row", style: "margin-top:12px" }, [
    el("span", { class: "pill " + (xl ? "pill-good" : "pill-warn"), text: xl ? "SheetJS loaded — .xlsx downloads" : "SheetJS offline — .csv downloads" }),
    el("span", { class: "pill " + (ch ? "pill-good" : "pill-warn"), text: ch ? "Chart.js loaded" : "Chart.js offline — SVG charts" })
  ]));
  s3.appendChild(el("p", { class: "small muted", style: "margin-top:10px", text: "Both are optional. The course works completely without them; only the download format and the chart drawing change." }));

  const s4 = el("div", { class: "card" });
  s4.appendChild(el("h2", { text: "Start again" }));
  s4.appendChild(el("p", { class: "small", style: "margin-top:8px;color:var(--ink-2)", text: "Erases every session, card and rating in this browser. Export first if you are not certain." }));
  s4.appendChild(el("div", { class: "row", style: "margin-top:12px" }, [
    el("button", {
      class: "btn", onclick: () => openModal((box, close) => {
        box.appendChild(el("h2", { text: "Erase all progress?" }));
        box.appendChild(el("p", { class: "small", style: "margin-top:8px;color:var(--ink-2)", text: "This cannot be undone from inside the app. If you exported a file you can import it back." }));
        box.appendChild(el("div", { class: "row", style: "margin-top:18px" }, [
          el("button", { class: "btn", onclick: close, text: "Cancel" }),
          el("button", { class: "btn row-end", style: "border-color:var(--bad);color:var(--bad)", onclick: () => { resetState(); close(); applyTheme(); renderNav(); go("home"); toast("Progress erased"); }, text: "Erase everything" })
        ]));
      }), text: "Erase all progress"
    })
  ]));

  root.appendChild(s1); root.appendChild(s2); root.appendChild(s3); root.appendChild(s4);
};
