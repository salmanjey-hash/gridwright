/* ============================================================
   Formula engine: values, tokenizer, parser, evaluator.

   Deliberately close to real Excel semantics, because a learning
   tool that accepts a formula Excel would reject teaches a lie.
   Covered: operator precedence including unary minus above ^,
   error propagation, Excel comparison ordering (number < text <
   FALSE < TRUE), blank-as-zero, 1900 date serials, and wildcards
   in criteria arguments.
   ============================================================ */

/* ---------- error values ---------- */
const ERR = {
  VALUE: "#VALUE!", REF: "#REF!", DIV0: "#DIV/0!", NAME: "#NAME?",
  NA: "#N/A", NUM: "#NUM!", NULL: "#NULL!", CALC: "#CALC!", CYCLE: "#CIRC!"
};
const ERR_LIST = Object.values(ERR);
function mkErr(e) { return { err: e }; }
function isErr(v) { return v !== null && typeof v === "object" && "err" in v; }
function firstErr() {
  for (let i = 0; i < arguments.length; i++) if (isErr(arguments[i])) return arguments[i];
  return null;
}

/* ---------- ranges ---------- */
function isRange(v) { return v !== null && typeof v === "object" && v.rng === true; }
function mkRange(cells, r1, c1, r2, c2) { return { rng: true, cells, r1, c1, r2, c2 }; }

/* Flatten arguments to a list of raw values. Ranges expand. */
function flatVals(args) {
  const out = [];
  for (const a of args) {
    if (isRange(a)) { for (const row of a.cells) for (const v of row) out.push(v); }
    else out.push(a);
  }
  return out;
}
/* Numbers only, the way SUM/AVERAGE treat a range: text and blanks
   inside a range are ignored, but a direct text argument is an error. */
function numsFromRanges(args) {
  const out = [];
  for (const a of args) {
    if (isRange(a)) {
      for (const row of a.cells) for (const v of row) {
        if (typeof v === "number") out.push(v);
        else if (isErr(v)) return v;
      }
    } else {
      if (isErr(a)) return a;
      if (a === null) continue;
      const n = toNum(a);
      if (isErr(n)) return n;
      out.push(n);
    }
  }
  return out;
}

/* ---------- coercion ---------- */
const NUMRE = /^\s*[-+]?(\d{1,3}(,\d{3})+|\d*)(\.\d+)?\s*$/;
function toNum(v) {
  if (isErr(v)) return v;
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") {
    let s = v.trim();
    if (s === "") return 0;
    let pct = false;
    if (s.endsWith("%")) { pct = true; s = s.slice(0, -1).trim(); }
    let cur = false;
    if (/^[£$€]/.test(s)) { cur = true; s = s.slice(1).trim(); }
    if (NUMRE.test(s)) {
      const n = parseFloat(s.replace(/,/g, ""));
      if (isFinite(n)) return pct ? n / 100 : n;
    }
    if (!pct && !cur) { const d = parseDateText(s); if (d !== null) return d; }
    return mkErr(ERR.VALUE);
  }
  return mkErr(ERR.VALUE);
}
function toText(v) {
  if (isErr(v)) return v;
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") return numToGeneral(v);
  return String(v);
}
function toBool(v) {
  if (isErr(v)) return v;
  if (v === null || v === undefined || v === "") return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v).trim().toUpperCase();
  if (s === "TRUE") return true;
  if (s === "FALSE") return false;
  return mkErr(ERR.VALUE);
}
/* Excel's General format: up to 15 significant digits, no trailing zeros. */
function numToGeneral(n) {
  if (!isFinite(n)) return n > 0 ? "#NUM!" : "#NUM!";
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  let s = Number(n.toPrecision(15)).toString();
  if (s.includes("e")) {
    const m = Number(n.toPrecision(6));
    s = m.toExponential().replace("e", "E").replace("E+", "E+").replace("E-", "E-");
  }
  return s;
}

/* ---------- Excel comparison ordering ---------- */
/* number(0) < text(1) < FALSE(2) < TRUE(3) */
function typeRank(v) {
  if (typeof v === "number") return 0;
  if (typeof v === "string") return 1;
  if (typeof v === "boolean") return v ? 3 : 2;
  return -1; // blank handled by caller
}
function cmpValues(a, b) {
  // blank takes the type of the other operand
  if (a === null && b === null) return 0;
  if (a === null) a = typeof b === "number" ? 0 : (typeof b === "boolean" ? false : "");
  if (b === null) b = typeof a === "number" ? 0 : (typeof a === "boolean" ? false : "");
  const ra = typeRank(a), rb = typeRank(b);
  if (ra !== rb) return ra < rb ? -1 : 1;
  if (ra === 0) return a === b ? 0 : (a < b ? -1 : 1);
  if (ra === 1) {
    const x = a.toUpperCase(), y = b.toUpperCase();
    return x === y ? 0 : (x < y ? -1 : 1);
  }
  return a === b ? 0 : (a ? 1 : -1);
}

/* ---------- dates: Excel 1900 serial system ---------- */
const EPOCH = Date.UTC(1899, 11, 30);
function serialToDate(s) { return new Date(EPOCH + Math.round(s) * DAY_MS); }
function dateToSerial(d) { return Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - EPOCH) / DAY_MS); }
function ymdToSerial(y, m, d) {
  // m is 1-based; JS Date normalises overflow, which matches Excel DATE()
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / DAY_MS);
}
/* Parse the date shapes a British user will actually type or meet in a CSV. */
function parseDateText(s) {
  s = String(s).trim();
  let m;
  if ((m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s)))
    return ymdToSerial(+m[3], +m[2], +m[1]);            // dd/mm/yyyy
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s)))
    return ymdToSerial(+m[1], +m[2], +m[3]);            // yyyy-mm-dd
  if ((m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})$/.exec(s)))
    return ymdToSerial(2000 + (+m[3]), +m[2], +m[1]);   // dd/mm/yy
  const MON = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  if ((m = /^(\d{1,2})[ \-]([A-Za-z]{3,9})[ \-](\d{4})$/.exec(s))) {
    const i = MON.indexOf(m[2].slice(0, 3).toLowerCase());
    if (i >= 0) return ymdToSerial(+m[3], i + 1, +m[1]);
  }
  if ((m = /^([A-Za-z]{3,9})[ \-](\d{1,2}),?[ \-](\d{4})$/.exec(s))) {
    const i = MON.indexOf(m[1].slice(0, 3).toLowerCase());
    if (i >= 0) return ymdToSerial(+m[3], i + 1, +m[2]);
  }
  return null;
}

/* ============================================================
   Tokenizer
   ============================================================ */
const T = { NUM: "num", STR: "str", BOOL: "bool", ERR: "err", REF: "ref", NAME: "name", OP: "op", LP: "(", RP: ")", COMMA: ",", COLON: ":" };

function tokenize(src) {
  const t = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r") { i++; continue; }
    // string
    if (c === '"') {
      let j = i + 1, out = "";
      while (j < n) {
        if (src[j] === '"') {
          if (src[j + 1] === '"') { out += '"'; j += 2; continue; }
          break;
        }
        out += src[j++];
      }
      if (j >= n) throw new FormulaError("A quotation mark is not closed.");
      t.push({ k: T.STR, v: out }); i = j + 1; continue;
    }
    // error literal
    if (c === "#") {
      const up = src.slice(i).toUpperCase();
      const hit = ERR_LIST.find(e => up.startsWith(e));
      if (hit) { t.push({ k: T.ERR, v: hit }); i += hit.length; continue; }
      throw new FormulaError("Unknown error value starting at '#'.");
    }
    // number
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
      let j = i;
      while (j < n && /[0-9]/.test(src[j])) j++;
      if (src[j] === ".") { j++; while (j < n && /[0-9]/.test(src[j])) j++; }
      if (/[eE]/.test(src[j] || "")) {
        let k = j + 1;
        if (/[+\-]/.test(src[k] || "")) k++;
        if (/[0-9]/.test(src[k] || "")) { k++; while (k < n && /[0-9]/.test(src[k])) k++; j = k; }
      }
      t.push({ k: T.NUM, v: parseFloat(src.slice(i, j)) }); i = j; continue;
    }
    // operators
    const two = src.substr(i, 2);
    if (two === "<=" || two === ">=" || two === "<>") { t.push({ k: T.OP, v: two }); i += 2; continue; }
    if ("+-*/^&=<>%".includes(c)) { t.push({ k: T.OP, v: c }); i++; continue; }
    if (c === "(") { t.push({ k: T.LP }); i++; continue; }
    if (c === ")") { t.push({ k: T.RP }); i++; continue; }
    if (c === "," || c === ";") { t.push({ k: T.COMMA }); i++; continue; }
    if (c === ":") { t.push({ k: T.COLON }); i++; continue; }
    // reference or name
    if (/[A-Za-z_$]/.test(c)) {
      const m = /^(\$?)([A-Za-z]{1,3})(\$?)([0-9]{1,7})(?![A-Za-z0-9_.])/.exec(src.slice(i));
      if (m) {
        t.push({ k: T.REF, col: colToIndex(m[2]), row: parseInt(m[4], 10) - 1, absC: m[1] === "$", absR: m[3] === "$", text: m[0].toUpperCase() });
        i += m[0].length; continue;
      }
      const nm = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(src.slice(i));
      if (nm) {
        const up = nm[0].toUpperCase();
        if (up === "TRUE" || up === "FALSE") t.push({ k: T.BOOL, v: up === "TRUE" });
        else t.push({ k: T.NAME, v: up });
        i += nm[0].length; continue;
      }
    }
    throw new FormulaError("I do not understand the character '" + c + "'.");
  }
  return t;
}

function FormulaError(msg) { this.message = msg; this.isFormulaError = true; }
FormulaError.prototype.toString = function () { return this.message; };

function colToIndex(letters) {
  let n = 0;
  const s = letters.toUpperCase();
  for (let i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64);
  return n - 1;
}
function indexToCol(idx) {
  let s = "", n = idx + 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
function a1(row, col) { return indexToCol(col) + (row + 1); }

/* ============================================================
   Parser  ->  AST
   node kinds: num str bool err ref range fn op unop pct
   ============================================================ */
function parseFormula(src) {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const at = (k, v) => toks[p] && toks[p].k === k && (v === undefined || toks[p].v === v);

  function parseExpr() { return parseCompare(); }

  function parseCompare() {
    let left = parseConcat();
    while (at(T.OP) && ["=", "<>", "<", ">", "<=", ">="].includes(peek().v)) {
      const op = next().v;
      left = { k: "op", op, a: left, b: parseConcat() };
    }
    return left;
  }
  function parseConcat() {
    let left = parseAdd();
    while (at(T.OP, "&")) { next(); left = { k: "op", op: "&", a: left, b: parseAdd() }; }
    return left;
  }
  function parseAdd() {
    let left = parseMul();
    while (at(T.OP) && (peek().v === "+" || peek().v === "-")) {
      const op = next().v; left = { k: "op", op, a: left, b: parseMul() };
    }
    return left;
  }
  function parseMul() {
    let left = parsePow();
    while (at(T.OP) && (peek().v === "*" || peek().v === "/")) {
      const op = next().v; left = { k: "op", op, a: left, b: parsePow() };
    }
    return left;
  }
  function parsePow() {
    let left = parseUnary();
    while (at(T.OP, "^")) { next(); left = { k: "op", op: "^", a: left, b: parseUnary() }; }
    return left;
  }
  function parseUnary() {
    if (at(T.OP, "-")) { next(); return { k: "unop", op: "-", a: parseUnary() }; }
    if (at(T.OP, "+")) { next(); return parseUnary(); }
    return parsePostfix();
  }
  function parsePostfix() {
    let node = parsePrimary();
    while (at(T.OP, "%")) { next(); node = { k: "pct", a: node }; }
    return node;
  }
  function parsePrimary() {
    if (!peek()) throw new FormulaError("The formula stops before it is finished.");
    const tk = next();
    if (tk.k === T.NUM) return { k: "num", v: tk.v };
    if (tk.k === T.STR) return { k: "str", v: tk.v };
    if (tk.k === T.BOOL) return { k: "bool", v: tk.v };
    if (tk.k === T.ERR) return { k: "err", v: tk.v };
    if (tk.k === T.LP) {
      const e = parseExpr();
      if (!at(T.RP)) throw new FormulaError("A closing bracket is missing.");
      next(); return e;
    }
    if (tk.k === T.REF) {
      if (at(T.COLON)) {
        next();
        if (!at(T.REF)) throw new FormulaError("A range needs a second cell after the colon, like A1:A10.");
        const b = next();
        return { k: "range", a: tk, b };
      }
      return { k: "ref", t: tk };
    }
    if (tk.k === T.NAME) {
      if (at(T.LP)) {
        next();
        const args = [];
        if (!at(T.RP)) {
          for (;;) {
            if (at(T.COMMA)) { args.push({ k: "missing" }); }
            else args.push(parseExpr());
            if (at(T.COMMA)) { next(); continue; }
            break;
          }
        }
        if (!at(T.RP)) throw new FormulaError("The function " + tk.v + " is missing its closing bracket.");
        next();
        return { k: "fn", name: tk.v, args };
      }
      return { k: "name", v: tk.v };
    }
    throw new FormulaError("Unexpected symbol in the formula.");
  }

  const ast = parseExpr();
  if (p < toks.length) throw new FormulaError("There is something extra after the end of the formula.");
  return ast;
}

/* ============================================================
   Evaluator
   ctx = { get(row,col) -> value, rowCount, colCount }
   ============================================================ */
function evalAst(node, ctx) {
  switch (node.k) {
    case "num": return node.v;
    case "str": return node.v;
    case "bool": return node.v;
    case "err": return mkErr(node.v);
    case "missing": return null;
    case "name": return mkErr(ERR.NAME);
    case "ref": {
      const t = node.t;
      if (t.row < 0 || t.col < 0) return mkErr(ERR.REF);
      return ctx.get(t.row, t.col);
    }
    case "range": {
      const r1 = Math.min(node.a.row, node.b.row), r2 = Math.max(node.a.row, node.b.row);
      const c1 = Math.min(node.a.col, node.b.col), c2 = Math.max(node.a.col, node.b.col);
      const cells = [];
      for (let r = r1; r <= r2; r++) {
        const row = [];
        for (let c = c1; c <= c2; c++) row.push(ctx.get(r, c));
        cells.push(row);
      }
      return mkRange(cells, r1, c1, r2, c2);
    }
    case "pct": {
      const v = evalAst(node.a, ctx);
      return mapVal(v, x => { const n = toNum(x); return isErr(n) ? n : n / 100; });
    }
    case "unop": {
      const v = evalAst(node.a, ctx);
      return mapVal(v, x => { const n = toNum(x); return isErr(n) ? n : -n; });
    }
    case "op": return evalOp(node, ctx);
    case "fn": return evalFn(node, ctx);
  }
  return mkErr(ERR.VALUE);
}

/* A range used where a single value is expected collapses to its
   top-left cell here. Real Excel uses implicit intersection; for the
   sheets in this course the top-left rule gives the same answer. */
function scalar(v) {
  if (isRange(v)) return v.cells.length && v.cells[0].length ? v.cells[0][0] : null;
  return v;
}

/* Apply a scalar operation across a range, so array idioms such as
   =SUMPRODUCT((A2:A50="London")*(B2:B50>500)) behave as they do in Excel. */
function mapVal(v, f) {
  if (!isRange(v)) return f(scalar(v));
  return mkRange(v.cells.map(row => row.map(f)), -1, -1, -1, -1);
}
function pickAt(g, v, r, c) {
  if (!g) return v;
  const row = g[g.length === 1 ? 0 : r];
  if (!row) return mkErr(ERR.NA);
  const x = row[row.length === 1 ? 0 : c];
  return x === undefined ? mkErr(ERR.NA) : x;
}
function broadcast(a, b, op) {
  const ga = isRange(a) ? a.cells : null, gb = isRange(b) ? b.cells : null;
  const rows = Math.max(ga ? ga.length : 1, gb ? gb.length : 1);
  const cols = Math.max(ga && ga[0] ? ga[0].length : 1, gb && gb[0] ? gb[0].length : 1);
  const out = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(binop(pickAt(ga, a, r, c), pickAt(gb, b, r, c), op));
    out.push(row);
  }
  return mkRange(out, -1, -1, -1, -1);
}

function evalOp(node, ctx) {
  const av = evalAst(node.a, ctx);
  const bv = evalAst(node.b, ctx);
  if (isRange(av) || isRange(bv)) return broadcast(av, bv, node.op);
  return binop(scalar(av), scalar(bv), node.op);
}

function binop(a, b, op) {
  const e = firstErr(a, b); if (e) return e;
  if (op === "&") {
    const x = toText(a), y = toText(b);
    const e2 = firstErr(x, y); if (e2) return e2;
    return x + y;
  }
  if (["=", "<>", "<", ">", "<=", ">="].includes(op)) {
    const c = cmpValues(a, b);
    switch (op) {
      case "=": return c === 0; case "<>": return c !== 0;
      case "<": return c < 0; case ">": return c > 0;
      case "<=": return c <= 0; case ">=": return c >= 0;
    }
  }
  const x = toNum(a), y = toNum(b);
  const e3 = firstErr(x, y); if (e3) return e3;
  switch (op) {
    case "+": return x + y;
    case "-": return x - y;
    case "*": return x * y;
    case "/": return y === 0 ? mkErr(ERR.DIV0) : x / y;
    case "^": {
      const r = Math.pow(x, y);
      return isFinite(r) ? r : mkErr(ERR.NUM);
    }
  }
  return mkErr(ERR.VALUE);
}

function evalFn(node, ctx) {
  const def = FN[node.name];
  if (!def) return mkErr(ERR.NAME);
  const helper = {
    ctx,
    raw: node.args,
    ev: i => (node.args[i] === undefined ? undefined : evalAst(node.args[i], ctx)),
    evs: i => (node.args[i] === undefined ? undefined : scalar(evalAst(node.args[i], ctx))),
    n: node.args.length
  };
  if (def.lazy) return def.fn(helper);
  const vals = node.args.map(a => evalAst(a, ctx));
  for (const v of vals) if (isErr(v)) return v;
  return def.fn(vals, helper);
}

/* ============================================================
   Reference shifting: what happens when a formula is filled or
   copied. A reference with no dollar sign moves with the formula;
   one with a dollar sign in front of that part stays put. This is
   the whole of Module 2 Session 3 in twenty lines.
   ============================================================ */
const REF_RE = /^(\$?)([A-Za-z]{1,3})(\$?)([0-9]{1,7})(?![A-Za-z0-9_.(])/;

function offsetFormula(src, dr, dc) {
  const s = String(src);
  let out = "", i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"') {                        // never rewrite inside a text literal
      let j = i + 1;
      while (j < s.length) {
        if (s[j] === '"') { if (s[j + 1] === '"') { j += 2; continue; } break; }
        j++;
      }
      out += s.slice(i, Math.min(j + 1, s.length));
      i = j + 1; continue;
    }
    const prev = i > 0 ? s[i - 1] : "";
    if (/[A-Za-z_$0-9.]/.test(prev) === false || i === 0) {
      const m = REF_RE.exec(s.slice(i));
      if (m) {
        const absC = m[1] === "$", absR = m[3] === "$";
        let col = colToIndex(m[2]), row = parseInt(m[4], 10) - 1;
        if (!absC) col += dc;
        if (!absR) row += dr;
        if (col < 0 || row < 0) { out += ERR.REF; i += m[0].length; continue; }
        out += (absC ? "$" : "") + indexToCol(col) + (absR ? "$" : "") + (row + 1);
        i += m[0].length; continue;
      }
    }
    out += c; i++;
  }
  return out;
}

/* ---------- public: compute a formula string against a context ---------- */
function computeFormula(src, ctx) {
  let body = String(src).trim();
  if (body.startsWith("=")) body = body.slice(1);
  if (body === "") return null;
  let ast;
  try { ast = parseFormula(body); }
  catch (e) { if (e && e.isFormulaError) return { parseError: e.message }; throw e; }
  try { return evalAst(ast, ctx); }
  catch (e) {
    if (e && e.isCycle) return mkErr(ERR.CYCLE);
    if (e && e.isFormulaError) return { parseError: e.message };
    throw e;
  }
}
