/* ============================================================
   Gridwright core: utilities, persistent state, router
   ============================================================ */
"use strict";

/* ---------- tiny DOM helpers ---------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function el(tag, attrs, kids) {
  const n = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (k === "data") for (const d in v) n.dataset[d] = v[d];
    else n.setAttribute(k, v === true ? "" : v);
  }
  if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(c => {
    if (c == null || c === false) return;
    n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return n;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

/* ---------- numbers, dates, formatting ---------- */
const DAY_MS = 86400000;
function todayISO(d) { return (d || new Date()).toISOString().slice(0, 10); }
function addDays(iso, n) { return new Date(new Date(iso + "T00:00:00Z").getTime() + n * DAY_MS).toISOString().slice(0, 10); }
function daysBetween(a, b) { return Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / DAY_MS); }
function plural(n, one, many) { return n === 1 ? one : (many || one + "s"); }

/* Round half away from zero, the way Excel ROUND does, and without
   the floating-point drift that (Math.round(x*100)/100) suffers. */
function xround(x, digits) {
  if (!isFinite(x)) return x;
  const f = Math.pow(10, digits || 0);
  const y = x * f;
  const r = Math.sign(y) * Math.round(Math.abs(y) + Number.EPSILON * Math.abs(y));
  return r / f;
}
function fmtNum(n, dp) {
  if (typeof n !== "number" || !isFinite(n)) return String(n);
  return n.toLocaleString("en-GB", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp == null ? 10 : dp });
}
function gbp(n) { return "£" + fmtNum(xround(n, 2), 2); }

/* ---------- seeded randomness (mulberry32) ---------- */
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function rng(seed) {
  let a = typeof seed === "number" ? seed >>> 0 : hashStr(String(seed));
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rInt(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }
function rPick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
function rShuffle(r, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/* Weighted pick: items is [[value, weight], ...] */
function rWeighted(r, items) {
  let total = 0; for (const it of items) total += it[1];
  let x = r() * total;
  for (const it of items) { x -= it[1]; if (x <= 0) return it[0]; }
  return items[items.length - 1][0];
}

/* ============================================================
   Persistent state
   ============================================================ */
/* The app is named in one place. Change these two lines and the browser
   tab, the wordmark and the download filenames all follow. */
const APP_NAME = "Gridwright";
const APP_SLUG = "gridwright";

const STORE_KEY = APP_SLUG + ".v1";
const LEGACY_KEYS = ["datadojo.v1"];
const STATE_VERSION = 1;

function blankState() {
  return {
    v: STATE_VERSION,
    created: todayISO(),
    theme: "auto",
    cards: {},          // conceptId -> {box, due, seen, right, wrong, last}
    sessions: {},       // sessionId -> {done, at, quiz:{right,total}, tasks:n, ratings:{}}
    modules: {},        // moduleId -> {completed, at}
    stats: { minutes: 0, sessionsDone: 0, exercisesChecked: 0 },
    fns: {},            // function name -> iso first taught
    prefs: { length: "full", handholding: "auto" },
    drills: [],         // interview drill results
    lastSeen: todayISO()
  };
}

let S = blankState();
let STORAGE_OK = true;

/* Some browsers refuse localStorage on file:// pages, and private
   windows refuse it everywhere. Find out once, at boot, rather than
   discovering it after an hour of work has evaporated. */
function checkStorage() {
  try {
    localStorage.setItem(APP_SLUG + ".probe", "1");
    localStorage.removeItem(APP_SLUG + ".probe");
    STORAGE_OK = true;
  } catch (e) { STORAGE_OK = false; }
  return STORAGE_OK;
}

function saveState() {
  if (!STORAGE_OK) return;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
  catch (e) { STORAGE_OK = false; console.warn("Could not save progress:", e); toast("Progress could not be saved in this browser.", 5000); }
}
function loadState() {
  checkStorage();
  let raw = null;
  try {
    raw = localStorage.getItem(STORE_KEY);
    /* Carry progress over from a previous name of the app rather than
       silently starting somebody from scratch. */
    if (!raw) {
      for (const k of LEGACY_KEYS) {
        const old = localStorage.getItem(k);
        if (old) { raw = old; localStorage.setItem(STORE_KEY, old); break; }
      }
    }
  } catch (e) { /* storage blocked */ }
  if (!raw) { S = blankState(); return; }
  try {
    const parsed = JSON.parse(raw);
    S = Object.assign(blankState(), parsed);
    S.stats = Object.assign(blankState().stats, parsed.stats || {});
    S.prefs = Object.assign(blankState().prefs, parsed.prefs || {});
  } catch (e) { console.warn("Saved progress was unreadable, starting fresh."); S = blankState(); }
}
function resetState() { S = blankState(); saveState(); }

/* ---------- theme ---------- */
function applyTheme() {
  const t = S.theme || "auto";
  document.documentElement.setAttribute("data-theme", t === "auto" ? "auto" : t);
  if (t === "auto") document.documentElement.removeAttribute("data-theme");
}
function cycleTheme() {
  const order = ["auto", "light", "dark"];
  S.theme = order[(order.indexOf(S.theme || "auto") + 1) % 3];
  applyTheme(); saveState();
  toast("Theme: " + S.theme);
}

/* ---------- toast + modal ---------- */
let toastTimer = null;
function toast(msg, ms) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("on"), ms || 2400);
}
function openModal(build) {
  const bg = $("#modalBg"), m = $("#modal");
  clear(m); build(m, closeModal);
  bg.hidden = false;
  const first = m.querySelector("button, input, a"); if (first) first.focus();
}
function closeModal() { $("#modalBg").hidden = true; }
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#modalBg").hidden) closeModal(); });

/* ============================================================
   Router
   ============================================================ */
const VIEWS = {
  home:      { id: "view-home",      label: "Home" },
  session:   { id: "view-session",   label: "Session", hideNav: true },
  review:    { id: "view-review",    label: "Review" },
  progress:  { id: "view-progress",  label: "Progress" },
  reference: { id: "view-reference", label: "Reference" },
  drill:     { id: "view-drill",     label: "Drill" },
  settings:  { id: "view-settings",  label: "Settings" }
};
let currentView = "home";
let routeArg = null;

function go(view, arg) {
  currentView = view; routeArg = arg || null;
  for (const k in VIEWS) $("#" + VIEWS[k].id).hidden = (k !== view);
  renderNav();
  const r = RENDERERS[view];
  if (r) r($("#" + VIEWS[view].id), routeArg);
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function renderNav() {
  const nav = clear($("#nav"));
  const due = dueCount();
  for (const k in VIEWS) {
    const v = VIEWS[k];
    if (v.hideNav) continue;
    if (k === "drill" && !drillUnlocked()) continue;
    const b = el("button", { onclick: () => go(k) }, [v.label]);
    if (k === currentView) b.setAttribute("aria-current", "page");
    if (k === "review" && due > 0) b.appendChild(el("span", { class: "pip", text: String(due) }));
    nav.appendChild(b);
  }
}

const RENDERERS = {}; // filled in by view modules
