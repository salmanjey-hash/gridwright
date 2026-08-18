/* ============================================================
   Home
   ============================================================ */

RENDERERS.home = function (root) {
  clear(root);
  const nextId = nextSessionId();
  const done = SESSION_ORDER.filter(sessionDone).length;
  const total = SESSION_ORDER.length;
  const due = dueCount();
  const gap = daysSinceLastSession();

  if (!STORAGE_OK) {
    root.appendChild(el("div", { class: "card", style: "border-color:var(--bad);background:var(--bad-soft)" }, [
      el("div", { class: "eyebrow", style: "color:var(--bad)", text: "Progress will not be saved" }),
      el("h2", { text: "This browser is blocking local storage", style: "margin-top:6px" }),
      el("p", { class: "small", style: "margin-top:8px;color:var(--ink-2)", html: "Everything still works, but when you close the tab your sessions and review cards will be gone. Two usual causes: you are in a private or incognito window, or the browser refuses storage for files opened straight from disk." }),
      el("p", { class: "small", style: "margin-top:8px;color:var(--ink-2)", html: "The fix is to open <code>" + APP_SLUG + ".html</code> in a normal window. If that is not it, use <strong>Settings, Export progress</strong> at the end of every session and import the file when you come back." })
    ]));
  }
  if (done === 0) root.appendChild(firstRunCard());

  /* returning after a break */
  if (gap !== null && gap >= 6 && due > 0) {
    root.appendChild(el("div", { class: "card", style: "border-color:var(--accent-line);background:var(--accent-soft)" }, [
      el("div", { class: "eyebrow", text: "Welcome back" }),
      el("h2", { text: "It has been " + gap + " " + plural(gap, "day") + ". Nothing is lost." }),
      el("p", { class: "small", style: "margin-top:6px;color:var(--ink-2)", text: "Gaps are normal and the schedule assumes them. Pick up where you left off, or spend ten minutes on the " + due + " " + plural(due, "concept") + " that have fallen due first." }),
      el("div", { class: "row", style: "margin-top:14px" }, [
        el("button", { class: "btn btn-primary", onclick: () => go("review"), text: "10-minute refresher" }),
        el("button", { class: "btn", onclick: () => startSession(nextId), text: "Straight to the next session" })
      ])
    ]));
  }

  /* next session */
  if (nextId) {
    const s = SESSIONS[nextId];
    const m = MODULES[s.module];
    root.appendChild(el("div", { class: "card" }, [
      el("div", { class: "eyebrow", text: "Next up  ·  Module " + m.n + ", session " + s.n + " of " + m.sessionIds.length }),
      el("h1", { text: s.title, style: "margin-top:6px" }),
      el("p", { class: "lede", style: "margin-top:8px", text: s.aim }),
      el("div", { class: "chipset", style: "margin-top:14px" },
        (s.concepts || []).map(c => el("span", { class: "chip", text: CONCEPTS[c] ? CONCEPTS[c].label : c }))),
      el("div", { class: "row", style: "margin-top:18px" }, [
        el("button", { class: "btn btn-primary btn-lg", onclick: () => startSession(nextId), text: "Start session" }),
        due > 0 ? el("button", { class: "btn btn-lg", onclick: () => go("review") }, [
          "Review first", el("span", { class: "pill pill-accent", style: "margin-left:8px", text: String(due) })
        ]) : null
      ]),
      el("p", { class: "tiny muted", style: "margin-top:12px", text: "About 25 minutes for the core, or an hour if you do the extension. You choose at the start." })
    ]));
  } else if (nextPendingModule()) {
    const np = nextPendingModule();
    root.appendChild(el("div", { class: "card" }, [
      el("div", { class: "eyebrow", text: "You are up to date" }),
      el("h1", { text: "Module " + np.n + " is next, and is still being built", style: "margin-top:6px" }),
      el("p", { class: "lede", style: "margin-top:8px", text: np.title + ": " + np.subtitle.toLowerCase() + "." }),
      el("p", { class: "small", style: "margin-top:10px;color:var(--ink-2)", text: "Everything released so far is finished. Keep the earlier material alive with the review queue in the meantime, since that is exactly what the spacing is for." }),
      el("div", { class: "row", style: "margin-top:16px" }, [
        el("button", { class: "btn btn-primary", onclick: () => go("review"), text: due > 0 ? "Review " + due + " due " + plural(due, "concept") : "Review early" }),
        el("button", { class: "btn", onclick: () => go("progress"), text: "See progress" })
      ])
    ]));
  } else {
    root.appendChild(el("div", { class: "card" }, [
      el("h1", { text: "Course complete" }),
      el("p", { class: "lede", style: "margin-top:8px", text: "Every session is done. The review queue keeps the skills from rotting; the interview drill keeps them sharp." }),
      el("div", { class: "row", style: "margin-top:16px" }, [
        el("button", { class: "btn btn-primary", onclick: () => go("review"), text: "Review due concepts" }),
        el("button", { class: "btn", onclick: () => go("drill"), text: "Interview drill" })
      ])
    ]));
  }

  /* honest progress, no streak pressure */
  root.appendChild(el("div", { class: "grid3", style: "margin-top:16px" }, [
    statTile(done + " / " + total, "sessions completed"),
    statTile(String(conceptsIntroduced().length), "concepts in rotation"),
    statTile(String(due), "due for review"),
    statTile(Math.round(S.stats.minutes) + " min", "time practised")
  ]));

  /* the map */
  const map = el("div", { class: "card", style: "margin-top:16px" });
  map.appendChild(el("h2", { text: "The course" }));
  map.appendChild(el("p", { class: "small muted", style: "margin-top:4px", text: "Ten modules across three stages. Modules open in order, because each one leans on the last." }));
  STAGES.forEach(st => {
    const mods = MODULE_ORDER.filter(id => MODULES[id].stage === st.id);
    if (!mods.length) return;
    map.appendChild(el("div", { style: "margin-top:20px" }, [
      el("div", { class: "eyebrow", text: "Stage " + st.n + "  ·  " + st.name }),
      el("p", { class: "small", style: "margin-top:3px;color:var(--ink-2)", text: st.goal })
    ]));
    const list = el("div", { class: "mods", style: "margin-top:10px" });
    mods.forEach(id => list.appendChild(moduleRow(id)));
    map.appendChild(list);
  });
  root.appendChild(map);
};

function statTile(n, label) {
  return el("div", { class: "stat" }, [el("div", { class: "n", text: n }), el("div", { class: "l", text: label })]);
}

function moduleRow(id) {
  const m = MODULES[id];
  const unlocked = moduleUnlocked(id);
  const complete = moduleDone(id);
  const prog = moduleProgress(id);
  const cur = currentModuleId() === id;
  const b = el("button", {
    class: "mod" + (complete ? " done" : (cur && !m.pending ? " now" : "")),
    disabled: !unlocked || m.pending,
    onclick: () => { if (unlocked && !m.pending) openModuleSheet(id); }
  }, [
    el("span", { class: "mnum", text: complete ? "✓" : String(m.n) }),
    el("span", { class: "mmain" }, [
      el("span", { class: "mt", text: m.title }),
      el("span", { class: "ms", text: m.subtitle }),
      prog > 0 && !complete ? el("span", { class: "bar", style: "margin-top:7px" }, [el("i", { style: "width:" + Math.round(prog * 100) + "%" })]) : null
    ]),
    m.pending ? el("span", { class: "pill", text: "in build" })
      : (!unlocked ? el("span", { class: "pill", text: "opens after module " + (m.n - 1) }) : null),
    complete ? el("span", { class: "pill pill-good", text: "done" }) : null
  ]);
  return b;
}

/* A module's sessions, so you can redo one or jump back. */
function openModuleSheet(id) {
  const m = MODULES[id];
  openModal((box, close) => {
    box.appendChild(el("div", { class: "eyebrow", text: "Module " + m.n }));
    box.appendChild(el("h2", { text: m.title, style: "margin-top:4px" }));
    box.appendChild(el("p", { class: "small", style: "margin-top:8px;color:var(--ink-2)", text: m.blurb }));
    const list = el("div", { class: "mods", style: "margin-top:16px" });
    m.sessionIds.forEach((sid, i) => {
      const s = SESSIONS[sid];
      const isDone = sessionDone(sid);
      list.appendChild(el("button", {
        class: "mod" + (isDone ? " done" : ""),
        onclick: () => { close(); startSession(sid); }
      }, [
        el("span", { class: "mnum", text: isDone ? "✓" : String(i + 1) }),
        el("span", { class: "mmain" }, [
          el("span", { class: "mt", text: s.title }),
          el("span", { class: "ms", text: s.aim })
        ]),
        isDone ? el("span", { class: "pill", text: "redo" }) : null
      ]));
    });
    box.appendChild(list);
    box.appendChild(el("div", { class: "row", style: "margin-top:18px" }, [
      el("button", { class: "btn row-end", onclick: close, text: "Close" })
    ]));
  });
}

/* ---------- first run ---------- */
function firstRunCard() {
  return el("div", { class: "card", style: "border-color:var(--accent-line)" }, [
    el("div", { class: "eyebrow", text: "Read this once" }),
    el("h2", { text: "How this works", style: "margin-top:6px" }),
    el("div", { class: "prose small", style: "margin-top:10px" }, [
      el("p", { html: "You will not learn Excel by reading about Excel. Each session is a few minutes of explanation and then a long stretch of you doing the work. That order is deliberate." }),
      el("p", { html: "Every session gives you the same exercise twice over. There is a <strong>practice grid inside this page</strong> that marks your work and tells you why something is wrong, and a <strong>downloadable workbook</strong> for doing the identical task in real Excel. Early on, lean on the grid. From Module 5, push yourself into real Excel, because that is what an employer puts in front of you." })
    ]),
    el("div", { class: "card-flat", style: "margin-top:14px" }, [
      el("h4", { text: "Setting up real Excel, free", style: "color:var(--ink);text-transform:none;letter-spacing:0;font-size:14.5px" }),
      el("ol", { class: "steps", style: "margin-top:8px" }, [
        el("li", { html: "Go to <span class='f'>office.com</span> and sign in, or create a free Microsoft account. There is no charge for the browser version." }),
        el("li", { html: "Click <b>Excel</b>. This is Excel for the web. Everything this course teaches works here." }),
        el("li", { html: "When a session gives you a workbook, download it, then in Excel for the web choose <span class='path'><span>Upload</span></span> and pick the file." })
      ]),
      el("p", { class: "tiny muted", style: "margin-top:10px", text: "If you would rather not set that up yet, you can do the whole of Stage 1 in the practice grid on this page. Nothing is locked behind it." })
    ]),
    el("div", { class: "row", style: "margin-top:16px" }, [
      el("button", { class: "btn btn-sm", onclick: () => go("settings"), text: "Where my progress is stored" })
    ])
  ]);
}
