/* ============================================================
   Sheet model: cells, input parsing, recalculation, formatting.
   ============================================================ */

function Sheet(name, rows, cols) {
  this.name = name || "Sheet1";
  this.rows = rows || 30;
  this.cols = cols || 8;
  this.data = Object.create(null);   // "r,c" -> cell
  this.colw = {};
  this._cache = null;
  this._busy = null;
}
Sheet.prototype.key = function (r, c) { return r + "," + c; };
Sheet.prototype.cell = function (r, c) { return this.data[this.key(r, c)] || null; };
Sheet.prototype.ensure = function (r, c) {
  const k = this.key(r, c);
  if (!this.data[k]) this.data[k] = { v: null, f: null, fmt: null, locked: false, hdr: false };
  return this.data[k];
};
Sheet.prototype.clearCell = function (r, c) { delete this.data[this.key(r, c)]; this.dirty(); };
Sheet.prototype.dirty = function () { this._cache = null; };

/* ---------- writing ---------- */
Sheet.prototype.set = function (r, c, value, opts) {
  const cell = this.ensure(r, c);
  cell.v = value; cell.f = null;
  if (opts) Object.assign(cell, opts);
  this.dirty(); return cell;
};
Sheet.prototype.setFormula = function (r, c, f, opts) {
  const cell = this.ensure(r, c);
  cell.f = String(f).replace(/^=/, ""); cell.v = null;
  if (opts) Object.assign(cell, opts);
  this.dirty(); return cell;
};
/* Parse what a person types, the way Excel does. */
Sheet.prototype.input = function (r, c, text) {
  const s = String(text);
  if (s === "") { this.clearCell(r, c); return; }
  if (s[0] === "=") { this.setFormula(r, c, s.slice(1)); return; }
  if (s[0] === "'") { this.set(r, c, s.slice(1), { fmt: "@" }); return; }
  const t = s.trim();
  const up = t.toUpperCase();
  if (up === "TRUE") { this.set(r, c, true); return; }
  if (up === "FALSE") { this.set(r, c, false); return; }
  if (ERR_LIST.includes(up)) { this.set(r, c, mkErr(up)); return; }
  // percentage
  if (/^-?[\d,]*\.?\d+\s*%$/.test(t)) { this.set(r, c, parseFloat(t.replace(/[,%\s]/g, "")) / 100, { fmt: "0.00%" }); return; }
  // currency
  const cm = /^([£$€])\s*(-?[\d,]*\.?\d+)$/.exec(t);
  if (cm) { this.set(r, c, parseFloat(cm[2].replace(/,/g, "")), { fmt: cm[1] + "#,##0.00" }); return; }
  // plain number
  if (NUMRE.test(t) && t !== "" && /\d/.test(t)) { this.set(r, c, parseFloat(t.replace(/,/g, "")), { fmt: t.includes(",") ? "#,##0.##" : null }); return; }
  // date
  const d = parseDateText(t);
  if (d !== null) { this.set(r, c, d, { fmt: "dd/mm/yyyy" }); return; }
  this.set(r, c, s);
};

/* ---------- reading ---------- */
Sheet.prototype.ctx = function () {
  const self = this;
  return {
    get: function (r, c) { return self.value(r, c); },
    sheet: self
  };
};
Sheet.prototype.value = function (r, c) {
  if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return null;
  const cell = this.cell(r, c);
  if (!cell) return null;
  if (cell.f === null || cell.f === undefined) return cell.v === undefined ? null : cell.v;
  if (!this._cache) this._cache = Object.create(null);
  const k = this.key(r, c);
  if (k in this._cache) return this._cache[k];
  if (!this._busy) this._busy = Object.create(null);
  if (this._busy[k]) { this._cache[k] = mkErr(ERR.CYCLE); return this._cache[k]; }
  this._busy[k] = true;
  let out;
  try {
    out = computeFormula(cell.f, this.ctx());
    if (out && out.parseError) out = mkErr(ERR.NAME);
  } catch (e) { out = mkErr(ERR.VALUE); }
  finally { delete this._busy[k]; }
  this._cache[k] = out;
  return out;
};
Sheet.prototype.recalc = function () { this._cache = null; };

/* What the cell shows on screen. */
Sheet.prototype.display = function (r, c) {
  const cell = this.cell(r, c);
  const v = this.value(r, c);
  if (v === null || v === undefined) return "";
  if (isErr(v)) return v.err;
  if (isRange(v)) {
    const first = v.cells[0] && v.cells[0].length ? v.cells[0][0] : null;
    return first === null ? "" : this.fmtValue(first, cell && cell.fmt);
  }
  return this.fmtValue(v, cell && cell.fmt);
};
Sheet.prototype.fmtValue = function (v, fmt) {
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") {
    if (fmt) { const out = applyFormat(v, fmt); return isErr(out) ? out.err : out; }
    return numToGeneral(xround(v, 10));
  }
  return String(v);
};
Sheet.prototype.cssClass = function (r, c) {
  const cell = this.cell(r, c);
  const v = this.value(r, c);
  if (cell && cell.hdr) return "hdr";
  if (isErr(v)) return "err";
  if (typeof v === "number") return "num";
  if (typeof v === "boolean") return "bool";
  return "txt";
};
/* The text shown in the formula bar when the cell is selected. */
Sheet.prototype.editText = function (r, c) {
  const cell = this.cell(r, c);
  if (!cell) return "";
  if (cell.f) return "=" + cell.f;
  if (cell.v === null || cell.v === undefined) return "";
  if (isErr(cell.v)) return cell.v.err;
  if (typeof cell.v === "number" && cell.fmt && /[dmy]/.test(cell.fmt) && !/[#0]/.test(cell.fmt)) {
    return formatDate(cell.v, "dd/mm/yyyy");
  }
  if (typeof cell.v === "boolean") return cell.v ? "TRUE" : "FALSE";
  return String(cell.v);
};

/* Copy one cell into another, shifting relative references the way
   Excel does when you fill or copy a formula. */
Sheet.prototype.copyCell = function (fromR, fromC, toR, toC) {
  const src = this.cell(fromR, fromC);
  if (!src) { this.clearCell(toR, toC); return; }
  const dst = this.ensure(toR, toC);
  dst.fmt = src.fmt;
  dst.hdr = false;
  if (src.f) { dst.f = offsetFormula(src.f, toR - fromR, toC - fromC); dst.v = null; }
  else { dst.f = null; dst.v = src.v; }
  this.dirty();
  return dst;
};

/* ---------- bulk helpers used by the workbook generators ---------- */
Sheet.prototype.writeRow = function (r, c0, values, opts) {
  values.forEach((v, i) => {
    if (v === null || v === undefined) return;
    if (typeof v === "string" && v[0] === "=") this.setFormula(r, c0 + i, v.slice(1), opts);
    else this.set(r, c0 + i, v, opts);
  });
};
Sheet.prototype.writeTable = function (r0, c0, header, rowsData, colFmts) {
  header.forEach((h, i) => this.set(r0, c0 + i, h, { hdr: true, locked: true }));
  rowsData.forEach((row, ri) => row.forEach((v, ci) => {
    if (v === null || v === undefined) return;
    const fmt = colFmts ? colFmts[ci] : null;
    this.set(r0 + 1 + ri, c0 + ci, v, fmt ? { fmt } : null);
  }));
  this.rows = Math.max(this.rows, r0 + rowsData.length + 2);
  this.cols = Math.max(this.cols, c0 + header.length);
};
/* Flat array-of-arrays snapshot, used for .xlsx and .csv export. */
Sheet.prototype.toAOA = function (opts) {
  const raw = opts && opts.raw;
  const out = [];
  for (let r = 0; r < this.rows; r++) {
    const row = [];
    for (let c = 0; c < this.cols; c++) {
      const cell = this.cell(r, c);
      if (!cell) { row.push(null); continue; }
      if (cell.f && raw) { row.push({ f: cell.f, fmt: cell.fmt }); continue; }
      const v = raw ? cell.v : this.value(r, c);
      row.push(isErr(v) ? v.err : (isRange(v) ? (v.cells[0] ? v.cells[0][0] : null) : v));
    }
    out.push(row);
  }
  // trim trailing empty rows
  while (out.length && out[out.length - 1].every(v => v === null || v === "")) out.pop();
  return out;
};

/* ---------- a workbook is a named list of sheets ---------- */
function Workbook(name) { this.name = name; this.sheets = []; }
Workbook.prototype.add = function (sheet) { this.sheets.push(sheet); return sheet; };
Workbook.prototype.get = function (name) { return this.sheets.find(s => s.name === name); };
