/* ============================================================
   Downloads: .xlsx through SheetJS when it loaded, .csv otherwise.
   Nothing in the course depends on the CDN being reachable.
   ============================================================ */

function hasXLSX() { return typeof XLSX !== "undefined" && XLSX && XLSX.utils; }
function hasChart() { return typeof Chart !== "undefined"; }

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = $("#dl");
  a.href = url; a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------- CSV ---------- */
function csvCell(v, fmt) {
  if (v === null || v === undefined) return "";
  if (isErr(v)) return v.err;
  if (typeof v === "number" && fmt && /[dmy]/.test(fmt) && !/[#0]/.test(fmt)) return formatDate(v, "dd/mm/yyyy");
  let s = typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v);
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function sheetToCSV(sheet) {
  const lines = [];
  const aoa = sheet.toAOA();
  for (let r = 0; r < aoa.length; r++) {
    const row = [];
    for (let c = 0; c < aoa[r].length; c++) {
      const cell = sheet.cell(r, c);
      row.push(csvCell(aoa[r][c], cell && cell.fmt));
    }
    while (row.length && row[row.length - 1] === "") row.pop();
    lines.push(row.join(","));
  }
  return "﻿" + lines.join("\r\n");
}

/* ---------- XLSX ---------- */
function sheetToWS(sheet) {
  const ws = {};
  let maxR = 0, maxC = 0;
  for (let r = 0; r < sheet.rows; r++) {
    for (let c = 0; c < sheet.cols; c++) {
      const cell = sheet.cell(r, c);
      if (!cell) continue;
      const addr = XLSX.utils.encode_cell({ r, c });
      const o = {};
      if (cell.f) {
        o.f = cell.f;
        const v = sheet.value(r, c);
        if (typeof v === "number") { o.t = "n"; o.v = v; }
        else if (typeof v === "boolean") { o.t = "b"; o.v = v; }
        else if (isErr(v)) { o.t = "e"; o.v = 0; delete o.f; o.v = 0; }
        else { o.t = "s"; o.v = v == null ? "" : String(v); }
      } else {
        const v = cell.v;
        if (v === null || v === undefined) continue;
        if (typeof v === "number") { o.t = "n"; o.v = v; }
        else if (typeof v === "boolean") { o.t = "b"; o.v = v; }
        else if (isErr(v)) { o.t = "s"; o.v = v.err; }
        else { o.t = "s"; o.v = String(v); }
      }
      if (cell.fmt) o.z = cell.fmt;
      ws[addr] = o;
      if (r > maxR) maxR = r;
      if (c > maxC) maxC = c;
    }
  }
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(maxR, 0), c: Math.max(maxC, 0) } });
  const widths = [];
  for (let c = 0; c <= maxC; c++) {
    let w = 10;
    for (let r = 0; r <= maxR; r++) {
      const cell = sheet.cell(r, c);
      if (!cell) continue;
      const t = sheet.display(r, c);
      w = Math.max(w, Math.min(34, String(t).length + 3));
    }
    widths.push({ wch: w });
  }
  ws["!cols"] = widths;
  if (sheet.freeze) ws["!freeze"] = sheet.freeze;
  return ws;
}

function workbookToBlob(wb) {
  const out = XLSX.utils.book_new();
  wb.sheets.forEach(s => XLSX.utils.book_append_sheet(out, sheetToWS(s), s.name.slice(0, 31)));
  const wbout = XLSX.write(out, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/* Round-trips the file through SheetJS's reader before handing it over,
   so a corrupt workbook is caught here rather than by Excel. */
function validateWorkbookBlob(blob, wb) {
  return new Promise(resolve => {
    if (!hasXLSX()) return resolve({ ok: false, why: "SheetJS not loaded" });
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const back = XLSX.read(new Uint8Array(fr.result), { type: "array" });
        const names = back.SheetNames || [];
        const wantFirst = wb.sheets[0].name.slice(0, 31);
        if (names.length !== wb.sheets.length) return resolve({ ok: false, why: "sheet count " + names.length + " vs " + wb.sheets.length });
        if (names[0] !== wantFirst) return resolve({ ok: false, why: "first sheet named " + names[0] });
        const ws = back.Sheets[names[0]];
        if (!ws || !ws["!ref"]) return resolve({ ok: false, why: "first sheet has no used range" });
        resolve({ ok: true, sheets: names, ref: ws["!ref"] });
      } catch (e) { resolve({ ok: false, why: String(e && e.message || e) }); }
    };
    fr.onerror = () => resolve({ ok: false, why: "could not read back" });
    fr.readAsArrayBuffer(blob);
  });
}

/* ---------- the one call the session player uses ---------- */
function downloadWorkbook(wb, baseName) {
  if (hasXLSX()) {
    try {
      const blob = workbookToBlob(wb);
      validateWorkbookBlob(blob, wb).then(v => {
        if (!v.ok) console.warn("Workbook validation failed:", v.why);
      });
      saveBlob(blob, baseName + ".xlsx");
      return { format: "xlsx", name: baseName + ".xlsx" };
    } catch (e) {
      console.warn("xlsx build failed, falling back to csv:", e);
    }
  }
  // fallback: one csv per sheet, zipped only if there is more than one
  if (wb.sheets.length === 1) {
    saveBlob(new Blob([sheetToCSV(wb.sheets[0])], { type: "text/csv;charset=utf-8" }), baseName + ".csv");
    return { format: "csv", name: baseName + ".csv" };
  }
  let joined = "";
  wb.sheets.forEach((s, i) => {
    joined += (i ? "\r\n\r\n" : "") + "### " + s.name + "\r\n" + sheetToCSV(s).replace(/^﻿/, "");
  });
  saveBlob(new Blob(["﻿" + joined], { type: "text/csv;charset=utf-8" }), baseName + ".csv");
  return { format: "csv", name: baseName + ".csv", note: "multi-sheet CSV" };
}

/* ---------- progress export / import ---------- */
function exportProgress() {
  const payload = JSON.stringify(S, null, 2);
  saveBlob(new Blob([payload], { type: "application/json" }), APP_SLUG + "-progress-" + todayISO() + ".json");
}
function importProgress(file, done) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const obj = JSON.parse(fr.result);
      if (!obj || typeof obj !== "object" || !("cards" in obj)) throw new Error("not a " + APP_NAME + " progress file");
      S = Object.assign(blankState(), obj);
      saveState();
      done(null);
    } catch (e) { done(e); }
  };
  fr.onerror = () => done(new Error("could not read the file"));
  fr.readAsText(file);
}
