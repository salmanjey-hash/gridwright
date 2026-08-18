/* ============================================================
   GridView: the in-app practice spreadsheet.
   Behaves like Excel where it matters: click to select, type to
   replace, F2 or double-click to edit, Enter down, Tab right,
   Escape cancels, arrows navigate, Delete clears.
   ============================================================ */

function GridView(sheet, opts) {
  this.sheet = sheet;
  this.opts = opts || {};
  this.sel = { r: this.opts.startRow || 0, c: this.opts.startCol || 0 };
  this.editing = false;
  this.root = null;
  this.marks = {};        // "r,c" -> "ok" | "bad"
  this.targets = {};      // "r,c" -> true
  (this.opts.targets || []).forEach(t => {
    if (!t) return;                                   // pivot-only checks carry no cell
    const p = parseA1(typeof t === "string" ? t : t.cell);
    if (p) this.targets[p.r + "," + p.c] = true;
  });
}

/* The handful of number formats Module 1 actually needs. */
const FORMAT_PRESETS = [
  { label: "General", fmt: null, title: "No format. Excel decides how to show it." },
  { label: "1,000", fmt: "#,##0", title: "Whole number with thousand separators" },
  { label: "0.00", fmt: "0.00", title: "Two decimal places" },
  { label: "£", fmt: "£#,##0.00", title: "Pounds sterling, two decimal places" },
  { label: "%", fmt: "0.0%", title: "Percentage" },
  { label: "Date", fmt: "dd/mm/yyyy", title: "Short date, day first" },
  { label: "Text", fmt: "@", title: "Store this as text, whatever it looks like" }
];
function fmtFamily(fmt) {
  if (!fmt) return "general";
  if (fmt === "@") return "text";
  if (/[dmy]/.test(fmt) && !/[#0]/.test(fmt)) return "date";
  if (fmt.includes("%")) return "percent";
  if (/[£$€]/.test(fmt)) return "currency";
  return "number";
}

function parseA1(ref) {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d{1,7})$/.exec(String(ref).trim());
  if (!m) return null;
  return { r: parseInt(m[2], 10) - 1, c: colToIndex(m[1]) };
}

/* Values spilled by a dynamic-array formula, so UNIQUE and TEXTSPLIT
   look the way they do in real Excel. */
GridView.prototype.spillMap = function () {
  const sh = this.sheet, map = Object.create(null);
  for (const k in sh.data) {
    const cell = sh.data[k];
    if (!cell.f) continue;
    const [r, c] = k.split(",").map(Number);
    const v = sh.value(r, c);
    if (!isRange(v)) continue;
    for (let i = 0; i < v.cells.length; i++) {
      for (let j = 0; j < v.cells[i].length; j++) {
        if (i === 0 && j === 0) continue;
        const tk = (r + i) + "," + (c + j);
        if (!sh.data[tk]) map[tk] = v.cells[i][j];
      }
    }
  }
  return map;
};

GridView.prototype.render = function () {
  const sh = this.sheet, o = this.opts;
  const wrap = el("div", { class: "sheet" });

  /* formula bar */
  const addr = el("div", { class: "sheet-addr", text: a1(this.sel.r, this.sel.c) });
  const fx = el("input", {
    class: "sheet-input", type: "text", spellcheck: "false",
    "aria-label": "Formula bar", value: sh.editText(this.sel.r, this.sel.c)
  });
  fx.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); this.commit(fx.value); this.move(1, 0); this.refresh(); }
    else if (e.key === "Escape") { fx.value = sh.editText(this.sel.r, this.sel.c); fx.blur(); }
  });
  fx.addEventListener("blur", () => { if (fx.value !== sh.editText(this.sel.r, this.sel.c)) { this.commit(fx.value); this.refresh(); } });
  wrap.appendChild(el("div", { class: "sheet-bar" }, [addr, el("span", { class: "sheet-fx", text: "fx" }), fx]));
  this.addrEl = addr; this.fxEl = fx;

  /* optional fill bar, standing in for Excel's fill handle */
  if (o.fillBar) {
    const fb = el("div", { class: "sheet-bar", style: "gap:6px;flex-wrap:wrap" });
    fb.appendChild(el("button", { class: "btn btn-sm", onclick: () => this.fillDownRun(), text: "Fill down ↓" }));
    fb.appendChild(el("span", { class: "tiny muted" }, [
      "copies the selected cell into the amber cells below it, exactly as dragging the fill handle would. ",
      el("kbd", { text: "Ctrl" }), " + ", el("kbd", { text: "D" }), " fills one cell from above."
    ]));
    wrap.appendChild(fb);
  }

  /* optional number-format bar, standing in for Excel's Home ribbon */
  if (o.formatBar) {
    const bar = el("div", { class: "sheet-bar", style: "gap:4px;flex-wrap:wrap" });
    bar.appendChild(el("span", { class: "tiny muted", style: "margin-right:4px", text: "Format:" }));
    FORMAT_PRESETS.forEach(p => {
      bar.appendChild(el("button", {
        class: "btn btn-sm", title: p.title,
        onclick: () => {
          const cell = this.sheet.cell(this.sel.r, this.sel.c);
          if (!cell) { toast("Select a cell that has something in it first."); return; }
          if (cell.locked && !this.opts.allowLocked) { toast("That cell is part of the data."); return; }
          if (p.fmt === "@") {
            // formatting as text in Excel converts the stored value to text
            const v = this.sheet.value(this.sel.r, this.sel.c);
            this.sheet.set(this.sel.r, this.sel.c, toText(v), { fmt: "@" });
          } else {
            cell.fmt = p.fmt;
          }
          delete this.marks[this.sel.r + "," + this.sel.c];
          this.refresh();
        },
        text: p.label
      }));
    });
    wrap.appendChild(bar);
  }

  /* table */
  const scroll = el("div", { class: "sheet-scroll" });
  const table = el("table", { class: "grid" });
  this.table = table;
  scroll.appendChild(table);
  wrap.appendChild(scroll);

  if (o.hint) wrap.appendChild(el("div", { class: "sheet-hint", html: o.hint }));

  this.root = wrap;
  this.paint();

  /* keyboard */
  scroll.tabIndex = 0;
  scroll.addEventListener("keydown", e => this.onKey(e));
  this.scrollEl = scroll;
  return wrap;
};

GridView.prototype.paint = function () {
  if (!this.table) return;              // not mounted yet
  const sh = this.sheet, o = this.opts, table = clear(this.table);
  const spill = this.spillMap();
  const nRows = Math.min(sh.rows, o.maxRows || sh.rows);
  const nCols = Math.min(sh.cols, o.maxCols || sh.cols);

  /* table-layout:fixed takes its column widths from the first row or a
     colgroup. Declaring them here rather than in CSS lets a wide sheet
     use narrower columns and still fit without a horizontal scrollbar. */
  const colW = o.colWidth || 104;
  const HDRW = 42;
  table.style.width = (HDRW + nCols * colW) + "px";
  const cg = el("colgroup");
  cg.appendChild(el("col", { style: "width:" + HDRW + "px" }));
  for (let c = 0; c < nCols; c++) cg.appendChild(el("col", { style: "width:" + colW + "px" }));
  table.appendChild(cg);

  const thead = el("thead");
  const hr = el("tr");
  hr.appendChild(el("th", { text: "" }));
  for (let c = 0; c < nCols; c++) hr.appendChild(el("th", { text: indexToCol(c) }));
  thead.appendChild(hr); table.appendChild(thead);

  const tb = el("tbody");
  for (let r = 0; r < nRows; r++) {
    const tr = el("tr");
    tr.appendChild(el("th", { text: String(r + 1) }));
    for (let c = 0; c < nCols; c++) {
      const k = r + "," + c;
      const cell = sh.cell(r, c);
      let text, cls;
      if (!cell && spill[k] !== undefined) {
        text = sh.fmtValue(spill[k], null);
        cls = typeof spill[k] === "number" ? "num" : "txt";
      } else {
        text = sh.display(r, c);
        cls = sh.cssClass(r, c);
      }
      const cv = el("div", { class: "cv", text });
      const td = el("td", { class: cls, data: { r: String(r), c: String(c) } }, [cv]);

      /* Excel lets a long label overflow into empty cells to its right.
         Doing the same keeps question labels readable without forcing
         every sheet to use wide columns. */
      if (text && (cls === "txt" || cls === "hdr") && text.length > 12) {
        let free = 0;
        for (let k = c + 1; k < nCols; k++) {
          const nb = sh.cell(r, k);
          if (nb && (nb.f || (nb.v !== null && nb.v !== ""))) break;
          if (spill[r + "," + k] !== undefined) break;
          free++;
        }
        if (free > 0) {
          td.classList.add("spill");
          cv.style.width = ((free + 1) * colW - 12) + "px";
        }
      }
      if (cell && cell.locked) td.classList.add("locked");
      if (this.targets[k]) td.classList.add("target");
      if (this.marks[k] === "ok") td.classList.add("ok-cell");
      if (this.marks[k] === "bad") td.classList.add("bad-cell");
      if (r === this.sel.r && c === this.sel.c) td.classList.add("sel");
      td.addEventListener("mousedown", e => {
        e.preventDefault();
        this.sel = { r, c }; this.editing = false; this.refresh();
        this.scrollEl.focus();
      });
      td.addEventListener("dblclick", () => this.startEdit(sh.editText(r, c)));
      tr.appendChild(td);
    }
    tb.appendChild(tr);
  }
  table.appendChild(tb);
};

GridView.prototype.refresh = function () {
  this.sheet.recalc();
  this.paint();
  if (this.addrEl) this.addrEl.textContent = a1(this.sel.r, this.sel.c);
  if (this.fxEl && document.activeElement !== this.fxEl) this.fxEl.value = this.sheet.editText(this.sel.r, this.sel.c);
  if (this.opts.onChange) this.opts.onChange(this);
};

GridView.prototype.selTd = function () {
  return this.table.querySelector('td[data-r="' + this.sel.r + '"][data-c="' + this.sel.c + '"]');
};

GridView.prototype.startEdit = function (initial) {
  const td = this.selTd();
  if (!td) return;
  const cell = this.sheet.cell(this.sel.r, this.sel.c);
  if (cell && cell.locked && !this.opts.allowLocked) { toast("That cell is part of the data. Work in the highlighted cells."); return; }
  this.editing = true;
  const inp = el("input", { class: "editor", type: "text", spellcheck: "false", value: initial === undefined ? "" : initial });
  td.appendChild(inp);
  inp.focus();
  if (initial && initial.length) inp.setSelectionRange(inp.value.length, inp.value.length);
  const done = (commit, dr, dc) => {
    if (!this.editing) return;
    this.editing = false;
    const val = inp.value;
    if (inp.parentNode) inp.parentNode.removeChild(inp);
    if (commit) this.commit(val);
    if (dr || dc) this.move(dr, dc);
    this.refresh();
    this.scrollEl.focus();
  };
  inp.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); done(true, 1, 0); }
    else if (e.key === "Tab") { e.preventDefault(); done(true, 0, e.shiftKey ? -1 : 1); }
    else if (e.key === "Escape") { e.preventDefault(); done(false, 0, 0); }
    e.stopPropagation();
  });
  inp.addEventListener("blur", () => done(true, 0, 0));
};

GridView.prototype.commit = function (text) {
  const { r, c } = this.sel;
  const cell = this.sheet.cell(r, c);
  if (cell && cell.locked && !this.opts.allowLocked) return;
  const before = this.sheet.editText(r, c);
  if (String(text) === before) return;
  this.sheet.input(r, c, text);
  delete this.marks[r + "," + c];
  this.sheet.recalc();
  // surface a parse problem straight away rather than silently storing text
  const cc = this.sheet.cell(r, c);
  if (cc && cc.f) {
    const res = computeFormula(cc.f, this.sheet.ctx());
    if (res && res.parseError) toast(res.parseError, 4200);
  }
  if (this.opts.onEdit) this.opts.onEdit(this, r, c);
};

GridView.prototype.move = function (dr, dc) {
  const nR = Math.min(this.sheet.rows, this.opts.maxRows || this.sheet.rows);
  const nC = Math.min(this.sheet.cols, this.opts.maxCols || this.sheet.cols);
  this.sel.r = Math.max(0, Math.min(nR - 1, this.sel.r + dr));
  this.sel.c = Math.max(0, Math.min(nC - 1, this.sel.c + dc));
  const td = this.selTd();
  if (td && td.scrollIntoView) td.scrollIntoView({ block: "nearest", inline: "nearest" });
};

GridView.prototype.onKey = function (e) {
  if (this.editing) return;
  const k = e.key;
  if (k === "ArrowUp") { e.preventDefault(); this.move(-1, 0); this.refresh(); }
  else if (k === "ArrowDown" || k === "Enter") { e.preventDefault(); this.move(1, 0); this.refresh(); }
  else if (k === "ArrowLeft") { e.preventDefault(); this.move(0, -1); this.refresh(); }
  else if (k === "ArrowRight") { e.preventDefault(); this.move(0, 1); this.refresh(); }
  else if (k === "Tab") { e.preventDefault(); this.move(0, e.shiftKey ? -1 : 1); this.refresh(); }
  else if (k === "F2") { e.preventDefault(); this.startEdit(this.sheet.editText(this.sel.r, this.sel.c)); }
  else if ((k === "d" || k === "D") && (e.ctrlKey || e.metaKey)) {
    /* Excel's Ctrl+D: copy the cell above into this one, references and all */
    e.preventDefault();
    this.fillFromAbove();
  }
  else if (k === "Delete" || k === "Backspace") {
    e.preventDefault();
    const cell = this.sheet.cell(this.sel.r, this.sel.c);
    if (!(cell && cell.locked && !this.opts.allowLocked)) {
      this.sheet.clearCell(this.sel.r, this.sel.c);
      delete this.marks[this.sel.r + "," + this.sel.c];
      this.refresh();
    }
  }
  else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault(); this.startEdit(k);
  }
};

/* ---------- filling ---------- */
GridView.prototype.canWrite = function (r, c) {
  const cell = this.sheet.cell(r, c);
  return !(cell && cell.locked && !this.opts.allowLocked);
};
GridView.prototype.fillFromAbove = function () {
  const { r, c } = this.sel;
  if (r === 0) { toast("There is no cell above this one to fill from."); return; }
  if (!this.canWrite(r, c)) { toast("That cell is part of the data."); return; }
  const above = this.sheet.cell(r - 1, c);
  if (!above || (above.v === null && !above.f)) { toast("The cell above is empty, so there is nothing to fill down."); return; }
  this.sheet.copyCell(r - 1, c, r, c);
  delete this.marks[r + "," + c];
  this.refresh();
};
/* Does this row still belong to the table? Used to decide how far a
   fill should travel, the same way double-clicking Excel's fill handle
   stops at the end of the neighbouring data. */
GridView.prototype.rowHasData = function (r, skipCol) {
  const nCols = Math.min(this.sheet.cols, this.opts.maxCols || this.sheet.cols);
  for (let c = 0; c < nCols; c++) {
    if (c === skipCol) continue;
    const cell = this.sheet.cell(r, c);
    if (cell && (cell.f || (cell.v !== null && cell.v !== ""))) return true;
  }
  return false;
};

/* Fill the selected cell down to the end of the table. */
GridView.prototype.fillDownRun = function () {
  const { r, c } = this.sel;
  const src = this.sheet.cell(r, c);
  if (!src || (src.v === null && !src.f)) { toast("Put a formula in the top cell first, then fill it down."); return; }
  const last = Math.min(this.sheet.rows, this.opts.maxRows || this.sheet.rows) - 1;
  let n = 0;
  for (let rr = r + 1; rr <= last; rr++) {
    if (!this.canWrite(rr, c)) break;
    if (!this.rowHasData(rr, c)) break;
    this.sheet.copyCell(r, c, rr, c);
    delete this.marks[rr + "," + c];
    n++;
  }
  this.refresh();
  toast(n ? "Filled down into " + n + " " + plural(n, "cell") : "Nothing below to fill into");
};

/* ---------- answer checking ---------- */
/* A check is { cell, expect, tol, mustUse, mustNotUse, why, wrongWay } */
GridView.prototype.check = function (checks) {
  const sh = this.sheet;
  const results = [];
  this.marks = {};
  for (const chk of checks) {
    const p = parseA1(chk.cell);
    if (!p) continue;
    const cell = sh.cell(p.r, p.c);
    const got = sh.value(p.r, p.c);
    const res = { cell: chk.cell, chk, got, ok: false, note: "" };

    if (!cell || (cell.v === null && !cell.f)) {
      res.note = "Empty. Nothing typed here yet.";
    } else if (isErr(got)) {
      res.note = "This returns " + got.err + ". " + errorHelp(got.err);
    } else if (chk.expectType && !typeMatches(got, chk.expectType)) {
      res.note = "The value is stored as " + storedAs(got) + ", and this task needs it stored as " + chk.expectType +
        ". Look at which side of the cell it sits on: Excel pushes real numbers and dates to the right, and text to the left.";
    } else if (chk.expectFmt && fmtFamily(cell.fmt) !== chk.expectFmt) {
      res.note = "The underlying value is fine, but the cell is formatted as " + fmtFamily(cell.fmt) +
        " and the task asks for " + chk.expectFmt + ". Use the Format buttons above the grid.";
    } else if (chk.expect === undefined) {
      res.ok = true;
    } else {
      let ok = valueMatches(got, chk.expect, chk.tol);
      /* mustUse lists alternatives: any one of them is acceptable.
         mustUseAll lists requirements: every one must appear. */
      if (ok && chk.mustUse) {
        const f = (cell.f || "").toUpperCase();
        const need = Array.isArray(chk.mustUse) ? chk.mustUse : [chk.mustUse];
        if (!need.some(nm => f.includes(nm.toUpperCase()))) {
          ok = false;
          res.note = "The number is right, but the task asks you to use " + need.join(" or ") +
            ". Typing the answer by hand will not survive the data changing.";
        }
      }
      if (ok && chk.mustUseAll) {
        const f = (cell.f || "").toUpperCase();
        const need = Array.isArray(chk.mustUseAll) ? chk.mustUseAll : [chk.mustUseAll];
        const missing = need.filter(nm => !f.includes(nm.toUpperCase()));
        if (missing.length) {
          ok = false;
          res.note = "The number is right, but this task needs " + need.join(" and ") +
            ", and " + missing.join(" and ") + " " + (missing.length > 1 ? "are" : "is") + " missing.";
        }
      }
      if (ok && chk.mustNotUse) {
        const f = (cell.f || "").toUpperCase();
        const bad = (Array.isArray(chk.mustNotUse) ? chk.mustNotUse : [chk.mustNotUse]).filter(nm => f.includes(nm.toUpperCase()));
        if (bad.length) { ok = false; res.note = "Right answer, wrong tool here: avoid " + bad.join(", ") + " for this task."; }
      }
      if (ok && chk.needFormula && !cell.f) {
        ok = false; res.note = "That is the right number, but it is typed in as a constant. The task needs a formula, so it updates when the data does.";
      }
      res.ok = ok;
      if (!ok && !res.note) {
        res.note = "Expected " + displayExpected(chk.expect) + ", got " + sh.fmtValue(got, null) + ".";
      }
    }
    this.marks[p.r + "," + p.c] = res.ok ? "ok" : "bad";
    results.push(res);
  }
  this.paint();
  return results;
};

function typeMatches(v, want) {
  if (want === "number" || want === "date") return typeof v === "number";
  if (want === "text") return typeof v === "string";
  if (want === "boolean") return typeof v === "boolean";
  return true;
}
function storedAs(v) {
  if (typeof v === "number") return "a number";
  if (typeof v === "boolean") return "TRUE or FALSE";
  if (v === null) return "nothing";
  return "text";
}

function valueMatches(got, expect, tol) {
  if (Array.isArray(expect)) return expect.some(e => valueMatches(got, e, tol));
  if (typeof expect === "number") {
    const n = typeof got === "number" ? got : toNum(got);
    if (isErr(n) || typeof n !== "number") return false;
    return Math.abs(n - expect) <= (tol === undefined ? 0.005 : tol);
  }
  if (typeof expect === "boolean") return got === expect || String(got).toUpperCase() === String(expect).toUpperCase();
  if (expect === null) return got === null;
  return String(got == null ? "" : (typeof got === "boolean" ? (got ? "TRUE" : "FALSE") : got)).trim().toUpperCase()
       === String(expect).trim().toUpperCase();
}
function displayExpected(e) {
  if (Array.isArray(e)) return e.map(displayExpected).join(" or ");
  if (typeof e === "number") return fmtNum(e, null);
  if (typeof e === "boolean") return e ? "TRUE" : "FALSE";
  if (e === null) return "an empty cell";
  return '"' + e + '"';
}
function errorHelp(code) {
  return ({
    "#VALUE!": "Excel found text where it needed a number. Check for a stray letter, a space, or a number stored as text.",
    "#REF!": "A reference points at nothing. A row or column it needed was deleted, or the range is off the edge of the sheet.",
    "#DIV/0!": "Something is being divided by zero or by an empty cell.",
    "#NAME?": "Excel does not recognise a name in the formula. Usually a typo in the function name, or missing quotation marks around text.",
    "#N/A": "A lookup found nothing. The value you searched for is not in the lookup column, or it has a trailing space.",
    "#NUM!": "The maths is impossible, like the square root of a negative number.",
    "#CIRC!": "This formula refers back to its own cell, directly or through a chain."
  })[code] || "";
}
