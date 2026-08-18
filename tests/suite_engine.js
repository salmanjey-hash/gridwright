/* Engine behaviour tests. Each one encodes something the course
   actually teaches, so a regression here means a lesson would lie. */
const { sandbox, mkSheet, ev, t, ok, near } = require("./run.js");

/* ---------- arithmetic and precedence ---------- */
t("add", "=1+2", 3);
t("precedence mul over add", "=2+3*4", 14);
t("brackets", "=(2+3)*4", 20);
t("unary minus binds above power", "=-2^2", 4);       // Excel gives 4, not -4
t("power left assoc", "=2^3^2", 64);                  // Excel gives 64, not 512
t("percent postfix", "=50%", 0.5);
t("percent in expression", "=200*10%", 20);
t("divide by zero", "=1/0", "#DIV/0!");
t("concat", '="a"&"b"', "ab");
t("concat number", '=1&2', "12");
t("negative divide", "=-10/4", -2.5);

/* ---------- comparison ordering ---------- */
t("num less than text", '=1<"a"', true);
t("text less than false", '="z"<FALSE', true);
t("text compare is case insensitive", '="ABC"="abc"', true);
t("not equal", "=1<>2", true);
t("blank equals zero", "=A1=0", true);

/* ---------- error propagation ---------- */
t("error propagates through add", "=1/0+1", "#DIV/0!");
t("text in maths is VALUE", '="abc"+1', "#VALUE!");
t("unknown function", "=NOTAREALFN(1)", "#NAME?");
t("IFERROR catches", '=IFERROR(1/0,"safe")', "safe");
t("IFERROR passes good values", "=IFERROR(6/2,0)", 3);
t("IF short circuits errors", "=IF(TRUE,10,1/0)", 10);
t("ISERROR", "=ISERROR(1/0)", true);

/* ---------- references and fill behaviour ---------- */
const grid = { A1: 10, A2: 20, A3: 30, B1: 1, B2: 2, B3: 3, C1: "x", C2: "", C3: "y" };
t("cell ref", "=A2", 20, grid);
t("range sum", "=SUM(A1:A3)", 60, grid);
t("absolute ref parses", "=$A$1+1", 11, grid);
t("mixed ref parses", "=A$1+1", 11, grid);
t("range with text is ignored by SUM", "=SUM(A1:C3)", 66, grid);
t("COUNT counts numbers only", "=COUNT(A1:C3)", 6, grid);
t("COUNTA counts non-empty", "=COUNTA(A1:C3)", 8, grid);
t("COUNTBLANK", "=COUNTBLANK(A1:C3)", 1, grid);

/* ---------- rounding ---------- */
t("ROUND half up", "=ROUND(2.5,0)", 3);
t("ROUND negative half away from zero", "=ROUND(-2.5,0)", -3);
t("ROUND 2dp", "=ROUND(1.005,2)", 1.01);      // the classic float trap
t("ROUND 2dp again", "=ROUND(2.675,2)", 2.68);
t("ROUNDDOWN", "=ROUNDDOWN(2.99,0)", 2);
t("ROUNDUP", "=ROUNDUP(2.01,0)", 3);
t("ROUND to tens", "=ROUND(1234,-2)", 1200);
t("MOD positive", "=MOD(7,3)", 1);
t("MOD negative like Excel", "=MOD(-7,3)", 2);

/* ---------- aggregation ---------- */
t("AVERAGE", "=AVERAGE(A1:A3)", 20, grid);
t("AVERAGE ignores text", "=AVERAGE(A1:C3)", 11, grid);
t("AVERAGE of nothing is DIV0", "=AVERAGE(D1:D3)", "#DIV/0!", grid);
t("MIN", "=MIN(A1:A3)", 10, grid);
t("MAX", "=MAX(A1:A3)", 30, grid);
t("MEDIAN odd", "=MEDIAN(A1:A3)", 20, grid);
t("MEDIAN even", "=MEDIAN(1,2,3,4)", 2.5);
t("SUMPRODUCT", "=SUMPRODUCT(A1:A3,B1:B3)", 140, grid);

/* ---------- logic ---------- */
t("IF true", '=IF(5>3,"yes","no")', "yes");
t("IF false", '=IF(5<3,"yes","no")', "no");
t("nested IF", '=IF(A1>25,"high",IF(A1>15,"mid","low"))', "low", grid);
t("IFS", '=IFS(A1>25,"high",A1>5,"mid",TRUE,"low")', "mid", grid);
t("IFS with no match is NA", '=IFS(1=2,"a")', "#N/A");
t("AND", "=AND(TRUE,TRUE,FALSE)", false);
t("OR", "=OR(FALSE,TRUE)", true);
t("NOT", "=NOT(TRUE)", false);

/* ---------- conditional aggregation ---------- */
const sales = {
  A1: "London", A2: "Leeds", A3: "London", A4: "Bath", A5: "London",
  B1: 600, B2: 400, B3: 750, B4: 120, B5: 90,
  C1: "Ann", C2: "Bob", C3: "Ann", C4: "Cara", C5: "Bob"
};
t("COUNTIF text", '=COUNTIF(A1:A5,"London")', 3, sales);
t("COUNTIF is case insensitive", '=COUNTIF(A1:A5,"london")', 3, sales);
t("COUNTIF numeric criteria", '=COUNTIF(B1:B5,">500")', 2, sales);
t("COUNTIF wildcard", '=COUNTIF(A1:A5,"L*")', 4, sales);
t("COUNTIF single wildcard", '=COUNTIF(A1:A5,"Bat?")', 1, sales);
t("SUMIF", '=SUMIF(A1:A5,"London",B1:B5)', 1440, sales);
t("SUMIF same range", '=SUMIF(B1:B5,">500")', 1350, sales);
t("SUMIFS two conditions", '=SUMIFS(B1:B5,A1:A5,"London",C1:C5,"Ann")', 1350, sales);
t("COUNTIFS", '=COUNTIFS(A1:A5,"London",B1:B5,">500")', 2, sales);
t("AVERAGEIFS", '=AVERAGEIFS(B1:B5,A1:A5,"London")', 480, sales);
t("COUNTIF not equal", '=COUNTIF(A1:A5,"<>London")', 2, sales);

/* ---------- text ---------- */
t("TRIM collapses inner spaces", '=TRIM("  a   b  ")', "a b");
t("UPPER", '=UPPER("abc")', "ABC");
t("PROPER", '=PROPER("jOHN o\'brien")', "John O'Brien");
t("PROPER on messy caps", '=PROPER("ACME  trading LTD")', "Acme  Trading Ltd");
t("LEN counts spaces", '=LEN(" ab ")', 4);
t("LEFT", '=LEFT("Sheffield",3)', "She");
t("RIGHT", '=RIGHT("Sheffield",5)', "field");
t("MID", '=MID("Sheffield",4,4)', "ffie");
t("FIND is case sensitive", '=FIND("f","Sheffield")', 4);
t("FIND missing is VALUE", '=FIND("z","abc")', "#VALUE!");
t("SEARCH is case insensitive", '=SEARCH("SHE","Sheffield")', 1);
t("SUBSTITUTE all", '=SUBSTITUTE("a-b-c","-","/")', "a/b/c");
t("SUBSTITUTE nth", '=SUBSTITUTE("a-b-c","-","/",2)', "a-b/c");
t("EXACT is case sensitive", '=EXACT("ABC","abc")', false);
t("CONCAT", '=CONCAT("a","b","c")', "abc");
t("TEXTJOIN skips blanks", '=TEXTJOIN(", ",TRUE,"a","","b")', "a, b");
t("TEXTJOIN keeps blanks", '=TEXTJOIN("-",FALSE,"a","","b")', "a--b");
t("VALUE on text number", '=VALUE("1,250")', 1250);
t("VALUE on rubbish", '=VALUE("abc")', "#VALUE!");
t("number stored as text still adds", '="1"+1', 2);
t("TEXT 2dp", '=TEXT(3.14159,"0.00")', "3.14");
t("TEXT thousands", '=TEXT(1234567,"#,##0")', "1,234,567");
t("TEXT percent", '=TEXT(0.256,"0.0%")', "25.6%");
t("TEXT currency", '=TEXT(1234.5,"£#,##0.00")', "£1,234.50");
t("TEXTSPLIT", '=TEXTSPLIT("a,b,c",",")', [["a", "b", "c"]]);
t("TEXTBEFORE", '=TEXTBEFORE("Smith, John",", ")', "Smith");
t("TEXTAFTER", '=TEXTAFTER("Smith, John",", ")', "John");

/* ---------- dates ---------- */
t("DATE to serial", "=DATE(2024,3,1)", 45352);
t("YEAR", "=YEAR(DATE(2024,3,1))", 2024);
t("MONTH", "=MONTH(DATE(2024,3,1))", 3);
t("DAY", "=DAY(DATE(2024,3,15))", 15);
t("DATEVALUE dd/mm/yyyy", '=DATEVALUE("01/03/2024")', 45352);
t("DATEVALUE iso", '=DATEVALUE("2024-03-01")', 45352);
t("DATEVALUE d mmm yyyy", '=DATEVALUE("1 Mar 2024")', 45352);
t("EOMONTH this month", "=EOMONTH(DATE(2024,2,10),0)", 45351);   // 29 Feb 2024
t("EOMONTH next month", "=EOMONTH(DATE(2024,1,31),1)", 45351);
t("date maths gives days", "=DATE(2024,3,10)-DATE(2024,3,1)", 9);
t("WEEKDAY type 2 Monday is 1", "=WEEKDAY(DATE(2024,3,4),2)", 1);
t("TEXT date format", '=TEXT(DATE(2024,3,1),"dd/mm/yyyy")', "01/03/2024");
t("TEXT month name", '=TEXT(DATE(2024,3,1),"mmm yyyy")', "Mar 2024");
t("NETWORKDAYS one week", "=NETWORKDAYS(DATE(2024,3,4),DATE(2024,3,8))", 5);

/* ---------- lookups ---------- */
const look = {
  A1: "SKU", B1: "Item", C1: "Price",
  A2: "A100", B2: "Bolt", C2: 2.5,
  A3: "B200", B3: "Nut", C3: 1.25,
  A4: "C300", B4: "Washer", C4: 0.4,
  E1: "B200"
};
t("XLOOKUP exact", '=XLOOKUP("B200",A2:A4,B2:B4)', "Nut", look);
t("XLOOKUP missing is NA", '=XLOOKUP("Z999",A2:A4,B2:B4)', "#N/A", look);
t("XLOOKUP if_not_found", '=XLOOKUP("Z999",A2:A4,B2:B4,"not on file")', "not on file", look);
t("XLOOKUP can look left", '=XLOOKUP("Nut",B2:B4,A2:A4)', "B200", look);
t("XLOOKUP by cell", "=XLOOKUP(E1,A2:A4,C2:C4)", 1.25, look);
t("VLOOKUP exact when told", '=VLOOKUP("B200",A2:C4,3,FALSE)', 1.25, look);
t("VLOOKUP missing exact is NA", '=VLOOKUP("Z999",A2:C4,3,FALSE)', "#N/A", look);
t("VLOOKUP column out of range", '=VLOOKUP("B200",A2:C4,9,FALSE)', "#REF!", look);
t("INDEX MATCH", '=INDEX(C2:C4,MATCH("C300",A2:A4,0))', 0.4, look);
t("MATCH exact", '=MATCH("B200",A2:A4,0)', 2, look);
t("MATCH missing", '=MATCH("Z",A2:A4,0)', "#N/A", look);
t("INDEX row and column", "=INDEX(A2:C4,2,2)", "Nut", look);

/* VLOOKUP's dangerous default: sorted data, approximate match */
const sorted = { A1: 0, B1: "Low", A2: 100, B2: "Mid", A3: 500, B3: "High" };
t("VLOOKUP default is approximate", "=VLOOKUP(250,A1:B3,2)", "Mid", sorted);
t("VLOOKUP approximate below range", "=VLOOKUP(-5,A1:B3,2)", "#N/A", sorted);

/* ---------- statistics ---------- */
const stats = { A1: 2, A2: 4, A3: 4, A4: 4, A5: 5, A6: 5, A7: 7, A8: 9 };
t("STDEV.P", "=STDEV.P(A1:A8)", 2, stats);
t("STDEV.S", "=STDEV.S(A1:A8)", 2.13808993529939, stats, 1e-9);
t("median vs mean differ", "=AVERAGE(A1:A8)-MEDIAN(A1:A8)", 0.5, stats);
t("PERCENTILE.INC 50 equals median", "=PERCENTILE.INC(A1:A8,0.5)", 4.5, stats);
t("QUARTILE.INC 1", "=QUARTILE.INC(A1:A8,1)", 4, stats);
t("LARGE", "=LARGE(A1:A8,2)", 7, stats);
t("SMALL", "=SMALL(A1:A8,2)", 4, stats);
t("STANDARDIZE z score", "=STANDARDIZE(9,5,2)", 2, stats);
const corr = { A1: 1, A2: 2, A3: 3, A4: 4, B1: 2, B2: 4, B3: 6, B4: 8 };
t("CORREL perfect", "=CORREL(A1:A4,B1:B4)", 1, corr);
const corr2 = { A1: 1, A2: 2, A3: 3, A4: 4, B1: 8, B2: 6, B3: 4, B4: 2 };
t("CORREL inverse", "=CORREL(A1:A4,B1:B4)", -1, corr2);

/* ---------- dynamic arrays ---------- */
const dup = { A1: "a", A2: "b", A3: "a", A4: "c" };
t("UNIQUE", "=UNIQUE(A1:A4)", [["a"], ["b"], ["c"]], dup);
t("COUNTA of UNIQUE style count", "=SUMPRODUCT(1/COUNTIF(A1:A4,A1:A4))", 3, dup);
const filt = { A1: 5, A2: 15, A3: 25, B1: false, B2: true, B3: true };
t("FILTER", "=FILTER(A1:A3,B1:B3)", [[15], [25]], filt);
t("SORT descending", "=SORT(A1:A3,1,-1)", [[25], [15], [5]], filt);

/* ---------- array arithmetic (needed for Module 8 pattern hunting) ---------- */
t("boolean array multiply counts matches", '=SUMPRODUCT((A1:A5="London")*(B1:B5>500))', 2, sales);
t("boolean array sums amounts", '=SUMPRODUCT((A1:A5="London")*B1:B5)', 1440, sales);
t("double unary on a comparison", '=SUMPRODUCT(--(B1:B5>500))', 2, sales);
t("distinct count idiom", "=SUMPRODUCT(1/COUNTIF(A1:A5,A1:A5))", 3, sales);
t("array comparison spills", "=A1:A3>15", [[false], [true], [true]], grid);

/* ---------- reference shifting when a formula is filled ---------- */
const off = (f, dr, dc) => sandbox.offsetFormula(f, dr, dc);
ok("fill down shifts a relative row", off("B2*C2", 1, 0) === "B3*C3", off("B2*C2", 1, 0));
ok("fill right shifts a relative column", off("B2*C2", 0, 1) === "C2*D2", off("B2*C2", 0, 1));
ok("a fully locked reference never moves", off("B2*$D$1", 1, 0) === "B3*$D$1", off("B2*$D$1", 1, 0));
ok("a locked row still moves sideways", off("B$1", 1, 1) === "C$1", off("B$1", 1, 1));
ok("a locked column still moves down", off("$B1", 1, 1) === "$B2", off("$B1", 1, 1));
ok("ranges shift at both ends", off("SUM(A2:A10)", 2, 0) === "SUM(A4:A12)", off("SUM(A2:A10)", 2, 0));
ok("a locked range stays put", off("SUM($A$2:$A$10)", 5, 3) === "SUM($A$2:$A$10)", off("SUM($A$2:$A$10)", 5, 3));
ok("function names are not mistaken for references", off("SUM(A1:A2)", 1, 0) === "SUM(A2:A3)", off("SUM(A1:A2)", 1, 0));
ok("text literals are left alone", off('IF(A1>1,"B2 is fine","no")', 1, 0) === 'IF(A2>1,"B2 is fine","no")', off('IF(A1>1,"B2 is fine","no")', 1, 0));
ok("shifting off the top gives #REF!", off("A1", -1, 0) === "#REF!", off("A1", -1, 0));
ok("mixed reference in a real formula", off("B2*$B$1", 3, 0) === "B5*$B$1", off("B2*$B$1", 3, 0));

(function fillTests() {
  const sh = new sandbox.Sheet("F", 20, 6);
  sh.set(0, 3, 0.2);                 // D1 rate
  sh.set(1, 1, 100); sh.set(2, 1, 200); sh.set(3, 1, 300);
  sh.setFormula(1, 2, "B2*D1");      // C2, relative rate: the mistake
  sh.copyCell(1, 2, 2, 2);
  sh.copyCell(1, 2, 3, 2);
  sh.recalc();
  ok("filling a relative rate breaks after the first row", sh.value(2, 2) === 0 && sh.value(3, 2) === 0,
     "got " + sh.value(2, 2) + ", " + sh.value(3, 2));

  sh.setFormula(1, 2, "B2*$D$1");    // the fix
  sh.copyCell(1, 2, 2, 2);
  sh.copyCell(1, 2, 3, 2);
  sh.recalc();
  ok("locking the rate makes the fill correct",
     near(sh.value(1, 2), 20) && near(sh.value(2, 2), 40) && near(sh.value(3, 2), 60),
     [sh.value(1, 2), sh.value(2, 2), sh.value(3, 2)].join(","));
  ok("the filled formula reads as expected", sh.cell(3, 2).f === "B4*$D$1", sh.cell(3, 2).f);
})();

/* ---------- sheet behaviour ---------- */
(function sheetTests() {
  const sh = new sandbox.Sheet("S", 20, 10);
  sh.input(0, 0, "5");
  sh.input(1, 0, "10");
  sh.setFormula(2, 0, "SUM(A1:A2)");
  ok("sheet computes SUM", sh.value(2, 0) === 15, "got " + sh.value(2, 0));
  sh.input(0, 0, "7");
  sh.recalc();
  ok("sheet recalculates after edit", sh.value(2, 0) === 17, "got " + sh.value(2, 0));

  sh.input(0, 1, "01/03/2024");
  ok("typed date becomes a serial", sh.value(0, 1) === 45352, "got " + sh.value(0, 1));
  ok("typed date is displayed as a date", sh.display(0, 1) === "01/03/2024", "got " + sh.display(0, 1));

  sh.input(1, 1, "'0123");
  ok("leading apostrophe forces text", sh.value(1, 1) === "0123", "got " + JSON.stringify(sh.value(1, 1)));

  sh.input(2, 1, "£1,250.50");
  ok("currency typed becomes a number", near(sh.value(2, 1), 1250.5), "got " + sh.value(2, 1));
  ok("currency keeps its format", sh.display(2, 1) === "£1,250.50", "got " + sh.display(2, 1));

  sh.input(3, 1, "12.5%");
  ok("percent typed becomes a fraction", near(sh.value(3, 1), 0.125), "got " + sh.value(3, 1));

  sh.setFormula(4, 4, "E5+1");
  ok("self reference is caught as circular", sandbox.isErr(sh.value(4, 4)), "got " + JSON.stringify(sh.value(4, 4)));

  sh.setFormula(5, 4, "E7+1");   // E6 depends on E7
  sh.setFormula(6, 4, "E6+1");   // E7 depends on E6
  sh.recalc();
  ok("two-cell cycle is caught", sandbox.isErr(sh.value(5, 4)) || sandbox.isErr(sh.value(6, 4)), "no cycle error");

  const parse = sandbox.computeFormula("SUM(A1:A2", sh.ctx());
  ok("unclosed bracket reports a readable message", !!(parse && parse.parseError), JSON.stringify(parse));
})();

/* ---------- grid answer checking ---------- */
(function checkTests() {
  const sh = new sandbox.Sheet("S", 20, 10);
  sh.set(0, 0, 10); sh.set(1, 0, 20);
  const gv = new sandbox.GridView(sh, { targets: ["A4"] });
  sh.setFormula(3, 0, "SUM(A1:A2)");
  let res = gv.check([{ cell: "A4", expect: 30, mustUse: "SUM" }]);
  ok("check passes a correct formula", res[0].ok, res[0].note);

  sh.set(3, 0, 30);
  res = gv.check([{ cell: "A4", expect: 30, mustUse: "SUM", needFormula: true }]);
  ok("check rejects a hard-typed number", !res[0].ok, "should have failed");
  ok("check explains the hard-typed number", /constant|by hand/i.test(res[0].note), res[0].note);

  sh.setFormula(3, 0, "A1+A2");
  res = gv.check([{ cell: "A4", expect: 30, mustUse: "SUM" }]);
  ok("check enforces mustUse", !res[0].ok, "should have failed");

  sh.clearCell(3, 0);
  res = gv.check([{ cell: "A4", expect: 30 }]);
  ok("check reports an empty cell", !res[0].ok && /Empty/i.test(res[0].note), res[0].note);

  sh.setFormula(3, 0, "1/0");
  res = gv.check([{ cell: "A4", expect: 30 }]);
  ok("check explains an error value", !res[0].ok && /DIV\/0/.test(res[0].note), res[0].note);
})();

/* ---------- Leitner ---------- */
(function leitnerTests() {
  sandbox.loadState();
  sandbox.defConcepts("m0", [{ id: "test.concept", label: "Test", blurb: "x" }]);
  sandbox.introduceConcept("test.concept");
  const c = sandbox.__dd.S.cards["test.concept"];
  ok("new concept enters box 1", c.box === 1, "box " + c.box);
  sandbox.gradeCard("test.concept", true);
  ok("correct answer promotes", sandbox.__dd.S.cards["test.concept"].box === 2, "box " + sandbox.__dd.S.cards["test.concept"].box);
  sandbox.gradeCard("test.concept", true);
  sandbox.gradeCard("test.concept", true);
  ok("three correct reaches box 4", sandbox.__dd.S.cards["test.concept"].box === 4, "box " + sandbox.__dd.S.cards["test.concept"].box);
  const dueDate = sandbox.__dd.S.cards["test.concept"].due;
  ok("box 4 is due in 16 days", sandbox.daysBetween(sandbox.todayISO(), dueDate) === 16, dueDate);
  sandbox.gradeCard("test.concept", false);
  ok("wrong answer resets to box 1", sandbox.__dd.S.cards["test.concept"].box === 1, "box " + sandbox.__dd.S.cards["test.concept"].box);
  ok("reset card is due tomorrow", sandbox.daysBetween(sandbox.todayISO(), sandbox.__dd.S.cards["test.concept"].due) === 1);
  delete sandbox.__dd.CONCEPTS["test.concept"];
  delete sandbox.__dd.S.cards["test.concept"];
})();

/* ---------- seeded randomness is reproducible ---------- */
(function seedTests() {
  const a = sandbox.rng("dojo-seed-1");
  const b = sandbox.rng("dojo-seed-1");
  let same = true;
  for (let i = 0; i < 50; i++) if (a() !== b()) same = false;
  ok("same seed gives the same sequence", same);
  const c = sandbox.rng("dojo-seed-2");
  ok("different seed gives a different sequence", sandbox.rng("dojo-seed-1")() !== c());
})();
