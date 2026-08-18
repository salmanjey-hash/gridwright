/* ============================================================
   Function library.
   Every function taught anywhere in the course is implemented here
   with Excel's real behaviour, including the awkward parts
   (VLOOKUP defaulting to approximate match, COUNTIF wildcards,
   AVERAGE of nothing being #DIV/0!).
   ============================================================ */

function cellsOf(v) {
  if (isRange(v)) { const o = []; for (const row of v.cells) for (const x of row) o.push(x); return o; }
  return [v];
}
function dims(v) {
  if (isRange(v)) return [v.cells.length, v.cells[0] ? v.cells[0].length : 0];
  return [1, 1];
}
function asGrid(v) { return isRange(v) ? v.cells : [[v]]; }

/* ---------- criteria: 500, ">500", "London", "b*", "<>" ---------- */
function wildcardRe(pat) {
  let out = "";
  for (let i = 0; i < pat.length; i++) {
    const c = pat[i];
    if (c === "~" && (pat[i + 1] === "*" || pat[i + 1] === "?" || pat[i + 1] === "~")) { out += pat[i + 1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); i++; }
    else if (c === "*") out += ".*";
    else if (c === "?") out += ".";
    else out += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp("^" + out + "$", "i");
}
function makeMatcher(crit) {
  if (isErr(crit)) return () => false;
  let op = "=", target = crit;
  if (typeof crit === "string") {
    const m = /^(<>|>=|<=|=|<|>)\s*(.*)$/.exec(crit.trim());
    if (m) {
      op = m[1]; const rest = m[2].trim();
      if (rest === "") target = null;
      else if (NUMRE.test(rest)) target = parseFloat(rest.replace(/,/g, ""));
      else { const d = parseDateText(rest); target = d !== null ? d : rest; }
    } else {
      target = crit;
      const d = NUMRE.test(crit.trim()) ? parseFloat(crit.trim().replace(/,/g, "")) : null;
      if (d !== null && crit.trim() !== "") target = d;
    }
  }
  const useWild = (op === "=" || op === "<>") && typeof target === "string" && /[*?]/.test(target);
  const re = useWild ? wildcardRe(target) : null;
  return function (v) {
    if (isErr(v)) return false;
    if (re) {
      const s = v === null ? "" : toText(v);
      const hit = typeof s === "string" && re.test(s);
      return op === "=" ? hit : !hit;
    }
    if (op === "=" && target === null) return v === null || v === "";
    if (op === "<>" && target === null) return !(v === null || v === "");
    // an empty cell never satisfies a comparison against a real value
    if (v === null && target !== null && op !== "<>") return false;
    const c = cmpValues(v, target);
    switch (op) {
      case "=": return c === 0;
      case "<>": return c !== 0;
      case "<": return c < 0;
      case ">": return c > 0;
      case "<=": return c <= 0;
      case ">=": return c >= 0;
    }
    return false;
  };
}

/* ---------- number formatting for TEXT() ---------- */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function applyFormat(value, fmt) {
  if (value === null) value = 0;
  if (typeof value === "boolean") value = value ? 1 : 0;
  const f = String(fmt);
  if (f === "@") return toText(value);
  const isDateFmt = /[dmyhs]/.test(f.replace(/"[^"]*"/g, "")) && !/[#0]/.test(f.replace(/"[^"]*"/g, ""));
  if (isDateFmt) {
    const n = toNum(value); if (isErr(n)) return n;
    return formatDate(n, f);
  }
  const n = toNum(value); if (isErr(n)) return n;
  return formatNumber(n, f);
}
function pad(n, w) { return String(Math.abs(n)).padStart(w, "0"); }
function formatDate(serial, f) {
  const d = serialToDate(serial);
  const frac = serial - Math.floor(serial);
  const totalSec = Math.round(frac * 86400);
  const hh = Math.floor(totalSec / 3600), mi = Math.floor((totalSec % 3600) / 60), ss = totalSec % 60;
  let out = "", i = 0;
  const low = f.toLowerCase();
  while (i < f.length) {
    if (f[i] === '"') { const j = f.indexOf('"', i + 1); out += f.slice(i + 1, j < 0 ? f.length : j); i = (j < 0 ? f.length : j + 1); continue; }
    const rest = low.slice(i);
    let m;
    if ((m = /^yyyy/.exec(rest))) { out += d.getUTCFullYear(); i += 4; }
    else if ((m = /^yy/.exec(rest))) { out += pad(d.getUTCFullYear() % 100, 2); i += 2; }
    else if ((m = /^mmmm/.exec(rest))) { out += MONTHS[d.getUTCMonth()]; i += 4; }
    else if ((m = /^mmm/.exec(rest))) { out += MONTHS[d.getUTCMonth()].slice(0, 3); i += 3; }
    else if ((m = /^mm/.exec(rest))) {
      // mm after h means minutes
      const prev = out.replace(/[^0-9:]/g, "");
      out += /:$/.test(out) ? pad(mi, 2) : pad(d.getUTCMonth() + 1, 2); i += 2;
    }
    else if ((m = /^m/.exec(rest))) { out += /:$/.test(out) ? String(mi) : String(d.getUTCMonth() + 1); i += 1; }
    else if ((m = /^dddd/.exec(rest))) { out += DAYS[d.getUTCDay()]; i += 4; }
    else if ((m = /^ddd/.exec(rest))) { out += DAYS[d.getUTCDay()].slice(0, 3); i += 3; }
    else if ((m = /^dd/.exec(rest))) { out += pad(d.getUTCDate(), 2); i += 2; }
    else if ((m = /^d/.exec(rest))) { out += String(d.getUTCDate()); i += 1; }
    else if ((m = /^hh/.exec(rest))) { out += pad(hh, 2); i += 2; }
    else if ((m = /^h/.exec(rest))) { out += String(hh); i += 1; }
    else if ((m = /^ss/.exec(rest))) { out += pad(ss, 2); i += 2; }
    else { out += f[i]; i += 1; }
  }
  return out;
}
function formatNumber(n, f) {
  let prefix = "", suffix = "", body = f;
  // pull out quoted literals and currency signs at the edges
  const pm = /^((?:"[^"]*"|[£$€\-+ ])*)(.*?)((?:"[^"]*"|[%£$€ ])*)$/.exec(f);
  if (pm) { prefix = pm[1].replace(/"/g, ""); body = pm[2]; suffix = pm[3].replace(/"/g, ""); }
  let pct = false;
  if (suffix.includes("%") || body.includes("%")) { pct = true; body = body.replace(/%/g, ""); suffix = suffix.replace(/%/g, ""); }
  let value = pct ? n * 100 : n;
  const comma = body.includes(",");
  body = body.replace(/,/g, "");
  const dot = body.indexOf(".");
  const dp = dot < 0 ? 0 : (body.length - dot - 1);
  const neg = value < 0;
  let s = Math.abs(xround(value, dp)).toFixed(dp);
  let [ip, fp] = s.split(".");
  const intPat = dot < 0 ? body : body.slice(0, dot);
  const minInt = (intPat.match(/0/g) || []).length;
  while (ip.length < minInt) ip = "0" + ip;
  if (intPat.replace(/[#0]/g, "") === "" && minInt === 0 && ip === "0") ip = "";
  if (comma) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  let out = ip + (fp ? "." + fp : "");
  return (neg ? "-" : "") + prefix + out + suffix + (pct ? "%" : "");
}

/* ============================================================
   The registry
   ============================================================ */
const FN = {};
function def(names, fn, opts) {
  (Array.isArray(names) ? names : [names]).forEach(n => { FN[n] = Object.assign({ fn }, opts || {}); });
}
const NEEDNUM = v => { const n = toNum(v); return n; };

/* ---------- maths and aggregation ---------- */
def("SUM", vals => { const ns = numsFromRanges(vals); if (isErr(ns)) return ns; return ns.reduce((a, b) => a + b, 0); });
def("AVERAGE", vals => {
  const ns = numsFromRanges(vals); if (isErr(ns)) return ns;
  return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : mkErr(ERR.DIV0);
});
def("MIN", vals => { const ns = numsFromRanges(vals); if (isErr(ns)) return ns; return ns.length ? Math.min.apply(null, ns) : 0; });
def("MAX", vals => { const ns = numsFromRanges(vals); if (isErr(ns)) return ns; return ns.length ? Math.max.apply(null, ns) : 0; });
def("COUNT", vals => {
  let c = 0;
  for (const a of vals) {
    if (isRange(a)) { for (const v of cellsOf(a)) if (typeof v === "number") c++; }
    else if (typeof a === "number") c++;
    else if (typeof a === "string" && NUMRE.test(a) && a.trim() !== "") c++;
    else if (typeof a === "boolean") c++;
  }
  return c;
});
def("COUNTA", vals => {
  let c = 0;
  for (const a of vals) {
    if (isRange(a)) { for (const v of cellsOf(a)) if (v !== null && v !== "") c++; }
    else if (a !== null && a !== "") c++;
  }
  return c;
});
def("COUNTBLANK", vals => {
  let c = 0;
  for (const v of flatVals(vals)) if (v === null || v === "") c++;
  return c;
});
def("ROUND", vals => { const n = toNum(vals[0]), d = toNum(vals[1] === undefined ? 0 : vals[1]); const e = firstErr(n, d); if (e) return e; return xround(n, d); });
def("ROUNDUP", vals => {
  const n = toNum(vals[0]), d = toNum(vals[1] === undefined ? 0 : vals[1]); const e = firstErr(n, d); if (e) return e;
  const f = Math.pow(10, d); return Math.sign(n) * Math.ceil(Math.abs(n) * f - 1e-9) / f;
});
def("ROUNDDOWN", vals => {
  const n = toNum(vals[0]), d = toNum(vals[1] === undefined ? 0 : vals[1]); const e = firstErr(n, d); if (e) return e;
  const f = Math.pow(10, d); return Math.sign(n) * Math.floor(Math.abs(n) * f + 1e-9) / f;
});
def("ABS", vals => { const n = toNum(vals[0]); return isErr(n) ? n : Math.abs(n); });
def("INT", vals => { const n = toNum(vals[0]); return isErr(n) ? n : Math.floor(n); });
def("MOD", vals => {
  const a = toNum(vals[0]), b = toNum(vals[1]); const e = firstErr(a, b); if (e) return e;
  if (b === 0) return mkErr(ERR.DIV0);
  return a - b * Math.floor(a / b);
});
def("SQRT", vals => { const n = toNum(vals[0]); if (isErr(n)) return n; return n < 0 ? mkErr(ERR.NUM) : Math.sqrt(n); });
def("POWER", vals => { const a = toNum(vals[0]), b = toNum(vals[1]); const e = firstErr(a, b); if (e) return e; const r = Math.pow(a, b); return isFinite(r) ? r : mkErr(ERR.NUM); });
def("PRODUCT", vals => { const ns = numsFromRanges(vals); if (isErr(ns)) return ns; return ns.reduce((a, b) => a * b, 1); });
def("SUMPRODUCT", vals => {
  const grids = vals.map(asGrid);
  const rows = grids[0].length, cols = grids[0][0].length;
  let total = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    let p = 1;
    for (const g of grids) {
      const cell = (g[r] && g[r][c] !== undefined) ? g[r][c] : (g.length === 1 && g[0].length === 1 ? g[0][0] : 0);
      if (isErr(cell)) return cell;
      p *= (typeof cell === "number" ? cell : (typeof cell === "boolean" ? (cell ? 1 : 0) : 0));
    }
    total += p;
  }
  return total;
});

/* ---------- logic ---------- */
def("IF", h => {
  const c = toBool(scalar(h.ev(0))); if (isErr(c)) return c;
  if (c) return h.n > 1 ? scalar(h.ev(1)) : true;
  return h.n > 2 ? scalar(h.ev(2)) : false;
}, { lazy: true });
def("IFS", h => {
  for (let i = 0; i + 1 < h.n; i += 2) {
    const c = toBool(scalar(h.ev(i))); if (isErr(c)) return c;
    if (c) return scalar(h.ev(i + 1));
  }
  return mkErr(ERR.NA);
}, { lazy: true });
def("IFERROR", h => {
  const v = scalar(h.ev(0));
  return isErr(v) ? scalar(h.ev(1)) : v;
}, { lazy: true });
def("IFNA", h => {
  const v = scalar(h.ev(0));
  return (isErr(v) && v.err === ERR.NA) ? scalar(h.ev(1)) : v;
}, { lazy: true });
def("AND", vals => {
  let any = false;
  for (const v of flatVals(vals)) {
    if (v === null || typeof v === "string") continue;
    const b = toBool(v); if (isErr(b)) return b;
    any = true; if (!b) return false;
  }
  return any ? true : mkErr(ERR.VALUE);
});
def("OR", vals => {
  let any = false;
  for (const v of flatVals(vals)) {
    if (v === null || typeof v === "string") continue;
    const b = toBool(v); if (isErr(b)) return b;
    any = true; if (b) return true;
  }
  return any ? false : mkErr(ERR.VALUE);
});
def("NOT", vals => { const b = toBool(scalar(vals[0])); return isErr(b) ? b : !b; });
def("XOR", vals => { let n = 0; for (const v of flatVals(vals)) { const b = toBool(v); if (isErr(b)) return b; if (b) n++; } return n % 2 === 1; });
def("TRUE", () => true); def("FALSE", () => false);
def("NA", () => mkErr(ERR.NA));

/* ---------- conditional aggregation ---------- */
function ifsCore(pairs, pick) {
  // pairs: [[gridValues, matcher], ...] flattened arrays of equal length
  const len = pairs[0][0].length;
  const hits = [];
  for (let i = 0; i < len; i++) {
    let ok = true;
    for (const [arr, m] of pairs) { if (!m(arr[i])) { ok = false; break; } }
    if (ok) hits.push(i);
  }
  return pick(hits);
}
function buildPairs(args, start, step) {
  const pairs = [];
  for (let i = start; i + 1 < args.length + 1 && i + 1 <= args.length - 1; i += 2) {
    pairs.push([cellsOf(args[i]), makeMatcher(scalar(args[i + 1]))]);
  }
  return pairs;
}
def("COUNTIF", vals => {
  const arr = cellsOf(vals[0]);
  const count = crit => { const m = makeMatcher(crit); let c = 0; for (const v of arr) if (m(v)) c++; return c; };
  // A range of criteria returns a range of counts, which is what makes
  // the classic distinct-count idiom =SUMPRODUCT(1/COUNTIF(r,r)) work.
  if (isRange(vals[1]) && cellsOf(vals[1]).length > 1) {
    return mkRange(vals[1].cells.map(row => row.map(count)), -1, -1, -1, -1);
  }
  return count(scalar(vals[1]));
});
def("COUNTIFS", vals => {
  const pairs = [];
  for (let i = 0; i + 1 < vals.length; i += 2) pairs.push([cellsOf(vals[i]), makeMatcher(scalar(vals[i + 1]))]);
  if (!pairs.length) return mkErr(ERR.VALUE);
  return ifsCore(pairs, hits => hits.length);
});
def("SUMIF", vals => {
  const rng = cellsOf(vals[0]), m = makeMatcher(scalar(vals[1]));
  const sums = vals.length > 2 ? cellsOf(vals[2]) : rng;
  let t = 0;
  for (let i = 0; i < rng.length; i++) if (m(rng[i])) { const v = sums[i]; if (typeof v === "number") t += v; }
  return t;
});
def("SUMIFS", vals => {
  const sums = cellsOf(vals[0]);
  const pairs = [];
  for (let i = 1; i + 1 < vals.length; i += 2) pairs.push([cellsOf(vals[i]), makeMatcher(scalar(vals[i + 1]))]);
  if (!pairs.length) return mkErr(ERR.VALUE);
  return ifsCore(pairs, hits => hits.reduce((t, i) => t + (typeof sums[i] === "number" ? sums[i] : 0), 0));
});
def("AVERAGEIF", vals => {
  const rng = cellsOf(vals[0]), m = makeMatcher(scalar(vals[1]));
  const src = vals.length > 2 ? cellsOf(vals[2]) : rng;
  const got = [];
  for (let i = 0; i < rng.length; i++) if (m(rng[i]) && typeof src[i] === "number") got.push(src[i]);
  return got.length ? got.reduce((a, b) => a + b, 0) / got.length : mkErr(ERR.DIV0);
});
def("AVERAGEIFS", vals => {
  const src = cellsOf(vals[0]);
  const pairs = [];
  for (let i = 1; i + 1 < vals.length; i += 2) pairs.push([cellsOf(vals[i]), makeMatcher(scalar(vals[i + 1]))]);
  if (!pairs.length) return mkErr(ERR.VALUE);
  return ifsCore(pairs, hits => {
    const got = hits.map(i => src[i]).filter(v => typeof v === "number");
    return got.length ? got.reduce((a, b) => a + b, 0) / got.length : mkErr(ERR.DIV0);
  });
});
def("MAXIFS", vals => {
  const src = cellsOf(vals[0]); const pairs = [];
  for (let i = 1; i + 1 < vals.length; i += 2) pairs.push([cellsOf(vals[i]), makeMatcher(scalar(vals[i + 1]))]);
  return ifsCore(pairs, hits => { const g = hits.map(i => src[i]).filter(v => typeof v === "number"); return g.length ? Math.max.apply(null, g) : 0; });
});
def("MINIFS", vals => {
  const src = cellsOf(vals[0]); const pairs = [];
  for (let i = 1; i + 1 < vals.length; i += 2) pairs.push([cellsOf(vals[i]), makeMatcher(scalar(vals[i + 1]))]);
  return ifsCore(pairs, hits => { const g = hits.map(i => src[i]).filter(v => typeof v === "number"); return g.length ? Math.min.apply(null, g) : 0; });
});

/* ---------- text ---------- */
def("TRIM", vals => { const s = toText(scalar(vals[0])); if (isErr(s)) return s; return s.replace(/\s+/g, " ").trim(); });
def("UPPER", vals => { const s = toText(scalar(vals[0])); return isErr(s) ? s : s.toUpperCase(); });
def("LOWER", vals => { const s = toText(scalar(vals[0])); return isErr(s) ? s : s.toLowerCase(); });
def("PROPER", vals => {
  const s = toText(scalar(vals[0])); if (isErr(s)) return s;
  // Excel capitalises after any non-letter, apostrophes included:
  // PROPER("o'brien") is "O'Brien" and PROPER("don't") is "Don'T".
  return s.toLowerCase().replace(/(^|[^A-Za-z])([a-z])/g, (mm, a, b) => a + b.toUpperCase());
});
def("LEN", vals => { const s = toText(scalar(vals[0])); return isErr(s) ? s : s.length; });
def("LEFT", vals => { const s = toText(scalar(vals[0])); if (isErr(s)) return s; const n = vals.length > 1 ? toNum(vals[1]) : 1; if (isErr(n)) return n; return n < 0 ? mkErr(ERR.VALUE) : s.slice(0, n); });
def("RIGHT", vals => { const s = toText(scalar(vals[0])); if (isErr(s)) return s; const n = vals.length > 1 ? toNum(vals[1]) : 1; if (isErr(n)) return n; return n < 0 ? mkErr(ERR.VALUE) : (n === 0 ? "" : s.slice(-n)); });
def("MID", vals => {
  const s = toText(scalar(vals[0])); if (isErr(s)) return s;
  const st = toNum(vals[1]), ln = toNum(vals[2]); const e = firstErr(st, ln); if (e) return e;
  if (st < 1 || ln < 0) return mkErr(ERR.VALUE);
  return s.substr(st - 1, ln);
});
def(["CONCAT", "CONCATENATE"], vals => {
  let o = "";
  for (const v of flatVals(vals)) { const s = toText(v); if (isErr(s)) return s; o += s; }
  return o;
});
def("TEXTJOIN", vals => {
  const sep = toText(scalar(vals[0])); if (isErr(sep)) return sep;
  const skip = toBool(scalar(vals[1])); if (isErr(skip)) return skip;
  const parts = [];
  for (const v of flatVals(vals.slice(2))) {
    if (skip && (v === null || v === "")) continue;
    const s = toText(v); if (isErr(s)) return s; parts.push(s);
  }
  return parts.join(sep);
});
def("SUBSTITUTE", vals => {
  const s = toText(scalar(vals[0])), a = toText(scalar(vals[1])), b = toText(scalar(vals[2]));
  const e = firstErr(s, a, b); if (e) return e;
  if (a === "") return s;
  if (vals.length > 3) {
    const nth = toNum(vals[3]); if (isErr(nth)) return nth;
    let idx = -1, from = 0;
    for (let k = 0; k < nth; k++) { idx = s.indexOf(a, from); if (idx < 0) return s; from = idx + a.length; }
    return s.slice(0, idx) + b + s.slice(idx + a.length);
  }
  return s.split(a).join(b);
});
def("REPLACE", vals => {
  const s = toText(scalar(vals[0])); const st = toNum(vals[1]), ln = toNum(vals[2]); const nw = toText(scalar(vals[3]));
  const e = firstErr(s, st, ln, nw); if (e) return e;
  return s.slice(0, st - 1) + nw + s.slice(st - 1 + ln);
});
def("FIND", vals => {
  const f = toText(scalar(vals[0])), s = toText(scalar(vals[1])); const e = firstErr(f, s); if (e) return e;
  const start = vals.length > 2 ? toNum(vals[2]) : 1; if (isErr(start)) return start;
  const i = s.indexOf(f, start - 1);
  return i < 0 ? mkErr(ERR.VALUE) : i + 1;
});
def("SEARCH", vals => {
  const f = toText(scalar(vals[0])), s = toText(scalar(vals[1])); const e = firstErr(f, s); if (e) return e;
  const start = vals.length > 2 ? toNum(vals[2]) : 1; if (isErr(start)) return start;
  const re = wildcardRe("*" + f + "*");
  const hay = s.toUpperCase(), needle = f.toUpperCase().replace(/[*?]/g, "");
  const i = hay.indexOf(needle, start - 1);
  return i < 0 ? mkErr(ERR.VALUE) : i + 1;
});
def("EXACT", vals => {
  const a = toText(scalar(vals[0])), b = toText(scalar(vals[1])); const e = firstErr(a, b); if (e) return e;
  return a === b;
});
def("REPT", vals => { const s = toText(scalar(vals[0])); const n = toNum(vals[1]); const e = firstErr(s, n); if (e) return e; return n < 0 ? mkErr(ERR.VALUE) : s.repeat(Math.floor(n)); });
def("TEXT", vals => {
  const v = scalar(vals[0]), f = toText(scalar(vals[1])); if (isErr(f)) return f;
  return applyFormat(v, f);
});
def("VALUE", vals => {
  const v = scalar(vals[0]);
  if (typeof v === "number") return v;
  const s = toText(v); if (isErr(s)) return s;
  const n = toNum(s.trim());
  return isErr(n) ? mkErr(ERR.VALUE) : n;
});
def("DATEVALUE", vals => {
  const s = toText(scalar(vals[0])); if (isErr(s)) return s;
  const d = parseDateText(s.trim());
  return d === null ? mkErr(ERR.VALUE) : d;
});
def("TEXTSPLIT", h => {
  const s = toText(scalar(h.ev(0))); if (isErr(s)) return s;
  const colDelim = h.n > 1 ? toText(scalar(h.ev(1))) : ",";
  if (isErr(colDelim)) return colDelim;
  const parts = colDelim === "" ? [s] : s.split(colDelim);
  return mkRange([parts], -1, -1, -1, -1);
}, { lazy: true });
def("TEXTBEFORE", vals => {
  const s = toText(scalar(vals[0])), d = toText(scalar(vals[1])); const e = firstErr(s, d); if (e) return e;
  const i = s.indexOf(d); return i < 0 ? mkErr(ERR.NA) : s.slice(0, i);
});
def("TEXTAFTER", vals => {
  const s = toText(scalar(vals[0])), d = toText(scalar(vals[1])); const e = firstErr(s, d); if (e) return e;
  const i = s.indexOf(d); return i < 0 ? mkErr(ERR.NA) : s.slice(i + d.length);
});
def("CLEAN", vals => { const s = toText(scalar(vals[0])); return isErr(s) ? s : s.replace(/[\x00-\x1F\x7F]/g, ""); });

/* ---------- information ---------- */
def("ISBLANK", h => { const v = scalar(h.ev(0)); return v === null; }, { lazy: true });
def("ISNUMBER", h => { const v = scalar(h.ev(0)); return typeof v === "number"; }, { lazy: true });
def("ISTEXT", h => { const v = scalar(h.ev(0)); return typeof v === "string"; }, { lazy: true });
def("ISERROR", h => isErr(scalar(h.ev(0))), { lazy: true });
def("ISNA", h => { const v = scalar(h.ev(0)); return isErr(v) && v.err === ERR.NA; }, { lazy: true });
def("ISLOGICAL", h => typeof scalar(h.ev(0)) === "boolean", { lazy: true });
def("N", vals => { const v = scalar(vals[0]); if (typeof v === "number") return v; if (typeof v === "boolean") return v ? 1 : 0; return 0; });

/* ---------- lookup ---------- */
def("XLOOKUP", h => {
  const lv = scalar(h.ev(0));
  const la = h.ev(1), ra = h.ev(2);
  if (isErr(lv)) return lv;
  const look = cellsOf(la);
  const retGrid = asGrid(ra);
  const retIsRow = isRange(ra) && retGrid.length === 1 && retGrid[0].length > 1;
  const ret = cellsOf(ra);
  const notFound = h.n > 3 ? scalar(h.ev(3)) : undefined;
  const mode = h.n > 4 ? toNum(scalar(h.ev(4))) : 0;
  const search = h.n > 5 ? toNum(scalar(h.ev(5))) : 1;
  if (isErr(mode) || isErr(search)) return mkErr(ERR.VALUE);
  const order = search === -1 ? look.map((_, i) => look.length - 1 - i) : look.map((_, i) => i);
  let found = -1;
  if (mode === 2) {
    const m = makeMatcher(typeof lv === "string" ? lv : toText(lv));
    for (const i of order) if (m(look[i])) { found = i; break; }
  } else if (mode === 0) {
    for (const i of order) if (cmpValues(look[i], lv) === 0) { found = i; break; }
  } else if (mode === -1) {
    let best = -1, bestV = null;
    for (let i = 0; i < look.length; i++) {
      const c = cmpValues(look[i], lv);
      if (c === 0) { best = i; break; }
      if (c < 0 && (bestV === null || cmpValues(look[i], bestV) > 0)) { best = i; bestV = look[i]; }
    }
    found = best;
  } else if (mode === 1) {
    let best = -1, bestV = null;
    for (let i = 0; i < look.length; i++) {
      const c = cmpValues(look[i], lv);
      if (c === 0) { best = i; break; }
      if (c > 0 && (bestV === null || cmpValues(look[i], bestV) < 0)) { best = i; bestV = look[i]; }
    }
    found = best;
  }
  if (found < 0) return notFound === undefined ? mkErr(ERR.NA) : notFound;
  if (isRange(ra) && !retIsRow && retGrid[0] && retGrid[0].length > 1) {
    return mkRange([retGrid[found]], -1, -1, -1, -1);
  }
  return ret[found] === undefined ? mkErr(ERR.NA) : ret[found];
}, { lazy: true });

def("VLOOKUP", vals => {
  const lv = scalar(vals[0]);
  const grid = asGrid(vals[1]);
  const col = toNum(vals[2]); if (isErr(col)) return col;
  // Excel's default is TRUE: approximate match. This trips people up,
  // which is exactly why the course teaches it as a flaw.
  const approx = vals.length > 3 ? toBool(scalar(vals[3])) : true;
  if (isErr(approx)) return approx;
  if (col < 1 || (grid[0] && col > grid[0].length)) return mkErr(ERR.REF);
  if (!approx) {
    for (const row of grid) if (cmpValues(row[0], lv) === 0) return row[col - 1];
    return mkErr(ERR.NA);
  }
  let best = -1;
  for (let i = 0; i < grid.length; i++) {
    const c = cmpValues(grid[i][0], lv);
    if (c === 0) { best = i; break; }
    if (c < 0) best = i; else break;
  }
  return best < 0 ? mkErr(ERR.NA) : grid[best][col - 1];
});
def("HLOOKUP", vals => {
  const lv = scalar(vals[0]);
  const grid = asGrid(vals[1]);
  const row = toNum(vals[2]); if (isErr(row)) return row;
  const approx = vals.length > 3 ? toBool(scalar(vals[3])) : true;
  const head = grid[0] || [];
  let best = -1;
  for (let i = 0; i < head.length; i++) {
    const c = cmpValues(head[i], lv);
    if (c === 0) { best = i; break; }
    if (approx && c < 0) best = i;
  }
  if (best < 0) return mkErr(ERR.NA);
  return (grid[row - 1] || [])[best];
});
def("INDEX", vals => {
  const grid = asGrid(vals[0]);
  const rows = grid.length, cols = grid[0] ? grid[0].length : 0;
  let r = vals.length > 1 ? toNum(vals[1]) : 0;
  let c = vals.length > 2 ? toNum(vals[2]) : 0;
  if (isErr(r) || isErr(c)) return mkErr(ERR.VALUE);
  if (rows === 1 && vals.length === 2) { c = r; r = 1; }
  if (cols === 1 && vals.length === 2) { c = 1; }
  if (r === 0 && c === 0) return vals[0];
  if (r < 0 || c < 0 || r > rows || c > cols) return mkErr(ERR.REF);
  if (r === 0) return mkRange(grid.map(row => [row[c - 1]]), -1, -1, -1, -1);
  if (c === 0) return mkRange([grid[r - 1]], -1, -1, -1, -1);
  return grid[r - 1][c - 1];
});
def("MATCH", vals => {
  const lv = scalar(vals[0]);
  const arr = cellsOf(vals[1]);
  const type = vals.length > 2 ? toNum(vals[2]) : 1;
  if (isErr(type)) return type;
  if (type === 0) {
    const wild = typeof lv === "string" && /[*?]/.test(lv);
    const m = wild ? makeMatcher(lv) : null;
    for (let i = 0; i < arr.length; i++) if (m ? m(arr[i]) : cmpValues(arr[i], lv) === 0) return i + 1;
    return mkErr(ERR.NA);
  }
  if (type === 1) {
    let best = -1;
    for (let i = 0; i < arr.length; i++) { const c = cmpValues(arr[i], lv); if (c === 0) return i + 1; if (c < 0) best = i; else break; }
    return best < 0 ? mkErr(ERR.NA) : best + 1;
  }
  let best = -1;
  for (let i = 0; i < arr.length; i++) { const c = cmpValues(arr[i], lv); if (c === 0) return i + 1; if (c > 0) best = i; else break; }
  return best < 0 ? mkErr(ERR.NA) : best + 1;
});
def("CHOOSE", h => {
  const i = toNum(scalar(h.ev(0))); if (isErr(i)) return i;
  if (i < 1 || i >= h.n) return mkErr(ERR.VALUE);
  return scalar(h.ev(i));
}, { lazy: true });
def("ROW", h => {
  if (h.n === 0) return 1;
  const node = h.raw[0];
  if (node.k === "ref") return node.t.row + 1;
  if (node.k === "range") return Math.min(node.a.row, node.b.row) + 1;
  return mkErr(ERR.VALUE);
}, { lazy: true });
def("COLUMN", h => {
  if (h.n === 0) return 1;
  const node = h.raw[0];
  if (node.k === "ref") return node.t.col + 1;
  if (node.k === "range") return Math.min(node.a.col, node.b.col) + 1;
  return mkErr(ERR.VALUE);
}, { lazy: true });
def("ROWS", vals => dims(vals[0])[0]);
def("COLUMNS", vals => dims(vals[0])[1]);

/* ---------- dynamic arrays ---------- */
def("UNIQUE", vals => {
  const grid = asGrid(vals[0]);
  const byCol = grid[0] && grid[0].length === 1;
  const seen = [], out = [];
  const keyOf = v => (v === null ? " blank" : (typeof v === "string" ? "s:" + v.toUpperCase() : typeof v + ":" + String(v)));
  for (const row of grid) {
    const k = row.map(keyOf).join("");
    if (seen.indexOf(k) < 0) { seen.push(k); out.push(row.slice()); }
  }
  return mkRange(out, -1, -1, -1, -1);
});
def("SORT", vals => {
  const grid = asGrid(vals[0]).map(r => r.slice());
  const idx = vals.length > 1 ? toNum(vals[1]) : 1;
  const order = vals.length > 2 ? toNum(vals[2]) : 1;
  if (isErr(idx) || isErr(order)) return mkErr(ERR.VALUE);
  grid.sort((a, b) => cmpValues(a[idx - 1], b[idx - 1]) * (order < 0 ? -1 : 1));
  return mkRange(grid, -1, -1, -1, -1);
});
def("FILTER", vals => {
  const grid = asGrid(vals[0]);
  const cond = cellsOf(vals[1]);
  const out = [];
  for (let i = 0; i < grid.length; i++) {
    const c = cond[i];
    const b = (typeof c === "boolean") ? c : (typeof c === "number" ? c !== 0 : false);
    if (b) out.push(grid[i].slice());
  }
  if (!out.length) return vals.length > 2 ? scalar(vals[2]) : mkErr(ERR.CALC);
  return mkRange(out, -1, -1, -1, -1);
});

/* ---------- statistics ---------- */
function statNums(vals) { return numsFromRanges(vals); }
def("MEDIAN", vals => {
  const ns = statNums(vals); if (isErr(ns)) return ns;
  if (!ns.length) return mkErr(ERR.NUM);
  const s = ns.slice().sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
});
def("MODE.SNGL", vals => {
  const ns = statNums(vals); if (isErr(ns)) return ns;
  const counts = new Map(); let best = null, bc = 1;
  for (const n of ns) { const c = (counts.get(n) || 0) + 1; counts.set(n, c); if (c > bc) { bc = c; best = n; } }
  return best === null ? mkErr(ERR.NA) : best;
});
def(["STDEV.S", "STDEV"], vals => {
  const ns = statNums(vals); if (isErr(ns)) return ns;
  if (ns.length < 2) return mkErr(ERR.DIV0);
  const m = ns.reduce((a, b) => a + b, 0) / ns.length;
  return Math.sqrt(ns.reduce((a, b) => a + (b - m) * (b - m), 0) / (ns.length - 1));
});
def(["STDEV.P", "STDEVP"], vals => {
  const ns = statNums(vals); if (isErr(ns)) return ns;
  if (!ns.length) return mkErr(ERR.DIV0);
  const m = ns.reduce((a, b) => a + b, 0) / ns.length;
  return Math.sqrt(ns.reduce((a, b) => a + (b - m) * (b - m), 0) / ns.length);
});
def(["VAR.S", "VAR"], vals => {
  const ns = statNums(vals); if (isErr(ns)) return ns;
  if (ns.length < 2) return mkErr(ERR.DIV0);
  const m = ns.reduce((a, b) => a + b, 0) / ns.length;
  return ns.reduce((a, b) => a + (b - m) * (b - m), 0) / (ns.length - 1);
});
function percentileInc(sorted, p) {
  if (!sorted.length) return mkErr(ERR.NUM);
  if (p < 0 || p > 1) return mkErr(ERR.NUM);
  const n = sorted.length;
  const idx = p * (n - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
}
def(["PERCENTILE.INC", "PERCENTILE"], vals => {
  const ns = statNums(vals.slice(0, 1)); if (isErr(ns)) return ns;
  const p = toNum(vals[1]); if (isErr(p)) return p;
  return percentileInc(ns.slice().sort((a, b) => a - b), p);
});
def(["QUARTILE.INC", "QUARTILE"], vals => {
  const ns = statNums(vals.slice(0, 1)); if (isErr(ns)) return ns;
  const q = toNum(vals[1]); if (isErr(q)) return q;
  if (q < 0 || q > 4) return mkErr(ERR.NUM);
  return percentileInc(ns.slice().sort((a, b) => a - b), q / 4);
});
def(["PERCENTRANK.INC", "PERCENTRANK"], vals => {
  const ns = statNums(vals.slice(0, 1)); if (isErr(ns)) return ns;
  const x = toNum(vals[1]); if (isErr(x)) return x;
  const s = ns.slice().sort((a, b) => a - b);
  let below = 0; for (const v of s) if (v < x) below++;
  let equal = 0; for (const v of s) if (v === x) equal++;
  if (!s.length) return mkErr(ERR.NUM);
  return (below + 0) / (s.length - 1 || 1);
});
def("LARGE", vals => {
  const ns = statNums(vals.slice(0, 1)); if (isErr(ns)) return ns;
  const k = toNum(vals[1]); if (isErr(k)) return k;
  const s = ns.slice().sort((a, b) => b - a);
  return (k < 1 || k > s.length) ? mkErr(ERR.NUM) : s[k - 1];
});
def("SMALL", vals => {
  const ns = statNums(vals.slice(0, 1)); if (isErr(ns)) return ns;
  const k = toNum(vals[1]); if (isErr(k)) return k;
  const s = ns.slice().sort((a, b) => a - b);
  return (k < 1 || k > s.length) ? mkErr(ERR.NUM) : s[k - 1];
});
def(["RANK.EQ", "RANK"], vals => {
  const x = toNum(vals[0]); if (isErr(x)) return x;
  const ns = statNums(vals.slice(1, 2)); if (isErr(ns)) return ns;
  const desc = vals.length > 2 ? toBool(scalar(vals[2])) : false;
  const s = ns.slice().sort((a, b) => desc ? a - b : b - a);
  const i = s.indexOf(x);
  return i < 0 ? mkErr(ERR.NA) : i + 1;
});
def("CORREL", vals => {
  const a = statNums(vals.slice(0, 1)), b = statNums(vals.slice(1, 2));
  if (isErr(a)) return a; if (isErr(b)) return b;
  const n = Math.min(a.length, b.length);
  if (n < 2) return mkErr(ERR.DIV0);
  const ma = a.slice(0, n).reduce((x, y) => x + y, 0) / n;
  const mb = b.slice(0, n).reduce((x, y) => x + y, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  return (da === 0 || db === 0) ? mkErr(ERR.DIV0) : num / Math.sqrt(da * db);
});
def("STANDARDIZE", vals => {
  const x = toNum(vals[0]), m = toNum(vals[1]), s = toNum(vals[2]);
  const e = firstErr(x, m, s); if (e) return e;
  return s <= 0 ? mkErr(ERR.NUM) : (x - m) / s;
});

/* ---------- dates ---------- */
def("TODAY", () => dateToSerial(new Date()));
def("NOW", () => dateToSerial(new Date()) + (new Date().getHours() * 3600 + new Date().getMinutes() * 60) / 86400);
def("DATE", vals => {
  const y = toNum(vals[0]), m = toNum(vals[1]), d = toNum(vals[2]);
  const e = firstErr(y, m, d); if (e) return e;
  return ymdToSerial(y < 1900 ? 1900 + y : y, m, d);
});
def("YEAR", vals => { const n = toNum(vals[0]); return isErr(n) ? n : serialToDate(n).getUTCFullYear(); });
def("MONTH", vals => { const n = toNum(vals[0]); return isErr(n) ? n : serialToDate(n).getUTCMonth() + 1; });
def("DAY", vals => { const n = toNum(vals[0]); return isErr(n) ? n : serialToDate(n).getUTCDate(); });
def("HOUR", vals => { const n = toNum(vals[0]); if (isErr(n)) return n; return Math.floor((n - Math.floor(n)) * 24 + 1e-9); });
def("MINUTE", vals => { const n = toNum(vals[0]); if (isErr(n)) return n; const s = Math.round((n - Math.floor(n)) * 86400); return Math.floor((s % 3600) / 60); });
def("WEEKDAY", vals => {
  const n = toNum(vals[0]); if (isErr(n)) return n;
  const type = vals.length > 1 ? toNum(vals[1]) : 1; if (isErr(type)) return type;
  const dow = serialToDate(n).getUTCDay(); // 0 = Sunday
  if (type === 1) return dow + 1;
  if (type === 2) return dow === 0 ? 7 : dow;
  if (type === 3) return dow === 0 ? 6 : dow - 1;
  return dow + 1;
});
def("EOMONTH", vals => {
  const n = toNum(vals[0]), k = toNum(vals[1]); const e = firstErr(n, k); if (e) return e;
  const d = serialToDate(n);
  return ymdToSerial(d.getUTCFullYear(), d.getUTCMonth() + 1 + k + 1, 0);
});
def("EDATE", vals => {
  const n = toNum(vals[0]), k = toNum(vals[1]); const e = firstErr(n, k); if (e) return e;
  const d = serialToDate(n);
  return ymdToSerial(d.getUTCFullYear(), d.getUTCMonth() + 1 + k, d.getUTCDate());
});
def("DAYS", vals => { const a = toNum(vals[0]), b = toNum(vals[1]); const e = firstErr(a, b); if (e) return e; return a - b; });
def("NETWORKDAYS", vals => {
  const a = toNum(vals[0]), b = toNum(vals[1]); const e = firstErr(a, b); if (e) return e;
  const lo = Math.min(a, b), hi = Math.max(a, b);
  let n = 0;
  for (let s = Math.floor(lo); s <= Math.floor(hi); s++) { const d = serialToDate(s).getUTCDay(); if (d !== 0 && d !== 6) n++; }
  return a <= b ? n : -n;
});

/* ---------- reference-ish ---------- */
def("IFBLANK", h => { const v = scalar(h.ev(0)); return v === null ? scalar(h.ev(1)) : v; }, { lazy: true });

/* names taught in the course, for the searchable reference */
const FN_NAMES = Object.keys(FN).sort();
