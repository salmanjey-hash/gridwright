/* ============================================================
   Curriculum registry.
   Module files call defModule() to register themselves; nothing
   about the shell knows what is in the course.
   ============================================================ */

const STAGES = [
  {
    id: "s1", n: 1, name: "Job-ready core",
    goal: "Write \"proficient in Excel\" on a CV honestly, and survive a practical test.",
    blurb: "The 20 percent of Excel that 80 percent of jobs actually test."
  },
  {
    id: "s2", n: 2, name: "Financial crime analyst lens",
    goal: "Use the same skills on data shaped like the work you want to do.",
    blurb: "Harder data, synthetic but realistic: transactions, counterparties, risk ratings."
  },
  {
    id: "s3", n: 3, name: "Analysis for writing",
    goal: "Turn public datasets into evidence you can publish and defend.",
    blurb: "Real public data, honest charts, and the discipline of exact figures."
  }
];

const MODULES = {};      // id -> module
const MODULE_ORDER = []; // ids in course order
const SESSIONS = {};     // id -> session
const SESSION_ORDER = [];

/* A module registers itself with its concepts, sessions and the
   functions it unlocks in the reference. */
function defModule(m) {
  MODULES[m.id] = m;
  MODULE_ORDER.push(m.id);
  if (m.concepts) defConcepts(m.id, m.concepts);
  m.sessionIds = [];
  (m.sessions || []).forEach((s, i) => {
    s.module = m.id;
    s.n = i + 1;
    s.id = s.id || (m.id + "s" + (i + 1));
    SESSIONS[s.id] = s;
    SESSION_ORDER.push(s.id);
    m.sessionIds.push(s.id);
  });
}

/* ---------- progress helpers ---------- */
function sessionDone(id) { return !!(S.sessions[id] && S.sessions[id].done); }
function moduleSessions(mid) { return (MODULES[mid] && MODULES[mid].sessionIds) || []; }
function moduleDone(mid) {
  const ss = moduleSessions(mid);
  return ss.length > 0 && ss.every(sessionDone);
}
function moduleProgress(mid) {
  const ss = moduleSessions(mid);
  if (!ss.length) return 0;
  return ss.filter(sessionDone).length / ss.length;
}
/* Modules unlock in order. Nothing is gated behind a score. */
function moduleUnlocked(mid) {
  const i = MODULE_ORDER.indexOf(mid);
  if (i <= 0) return true;
  return moduleDone(MODULE_ORDER[i - 1]);
}
function nextSessionId() {
  for (const id of SESSION_ORDER) if (!sessionDone(id)) return id;
  return null;
}
function currentModuleId() {
  const s = nextSessionId();
  return s ? SESSIONS[s].module : MODULE_ORDER[MODULE_ORDER.length - 1];
}
function drillUnlocked() { return moduleDone("m7"); }

/* Functions appear in the reference only once they have been taught. */
function unlockFns(names) {
  (names || []).forEach(n => { if (!S.fns[n]) S.fns[n] = todayISO(); });
}
function fnUnlocked(n) { return !!S.fns[n]; }

/* Every concept taught up to and including a session, for warm-up quizzes. */
function conceptsBefore(sessionId) {
  const out = [];
  for (const id of SESSION_ORDER) {
    if (id === sessionId) break;
    (SESSIONS[id].concepts || []).forEach(c => { if (out.indexOf(c) < 0) out.push(c); });
  }
  return out;
}

/* ---------- the question bank ---------- */
/* Questions are tagged with a concept id. Types:
   mc   : multiple choice
   type : type the formula you would use
   pred : predict what this formula returns          */
const QUESTIONS = [];
function defQuestions(list) { list.forEach(q => QUESTIONS.push(q)); }
function questionsFor(conceptIds) {
  return QUESTIONS.filter(q => conceptIds.indexOf(q.c) >= 0);
}

/* Pick warm-up questions: prefer concepts whose cards are due, then
   anything taught earlier. Never asks about material not yet covered. */
function pickWarmup(sessionId, count, seed) {
  const taught = conceptsBefore(sessionId);
  if (!taught.length) return [];
  const r = rng(seed || (sessionId + ":" + todayISO()));
  const due = dueCards().filter(id => taught.indexOf(id) >= 0);
  const rest = taught.filter(id => due.indexOf(id) < 0);
  const ordered = due.concat(rShuffle(r, rest));
  const picked = [];
  const usedConcepts = [];
  for (const cid of ordered) {
    if (picked.length >= count) break;
    if (usedConcepts.indexOf(cid) >= 0) continue;
    const qs = questionsFor([cid]);
    if (!qs.length) continue;
    picked.push(rPick(r, qs));
    usedConcepts.push(cid);
  }
  // top up with any taught concept if the due list was short
  if (picked.length < count) {
    const pool = rShuffle(r, questionsFor(taught).filter(q => picked.indexOf(q) < 0));
    for (const q of pool) { if (picked.length >= count) break; picked.push(q); }
  }
  return picked.slice(0, count);
}

/* ---------- gentle return after a gap ---------- */
function daysSinceLastSession() {
  const dates = Object.keys(S.sessions).map(k => S.sessions[k].at).filter(Boolean).sort();
  if (!dates.length) return null;
  return daysBetween(dates[dates.length - 1].slice(0, 10), todayISO());
}
