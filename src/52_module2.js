/* ============================================================
   Module 2: Formulas that think
   Four sessions. Each one is made tedious on purpose so the next
   tool arrives as a relief rather than a rule: adding five cells
   by hand earns SUM, and typing the same formula six times earns
   fill-down.
   ============================================================ */

const M2_ORDER = [
  { item: "Oat milk, 12 litres", unit: 1.45 },
  { item: "Arabica beans, 1kg", unit: 18.90 },
  { item: "Paper cups, 500", unit: 24.50 },
  { item: "Sourdough loaf", unit: 3.75 },
  { item: "Butter, 250g", unit: 2.10 }
];

/* ============================================================
   Session 1
   ============================================================ */
const M2S1 = {
  title: "The equals sign, and why you never type a number twice",
  aim: "Write your first formulas, and learn the habit that separates a spreadsheet from a calculator.",
  why: "A calculator gives you an answer. A spreadsheet gives you an answer that <em>updates</em>. The difference is entirely in whether you point at cells or type numbers, and it is the single habit that makes everything later possible.",
  concepts: ["m2.equals", "m2.refnotnum", "m2.arith", "m2.brackets"],
  unlocks: [],
  lesson: [
    { lead: "A formula is a question you leave in a cell, and Excel answers it again every time the data changes." },
    { p: "Every formula starts with an equals sign. That is how Excel knows you are asking rather than typing. Without it, <span class='f'>2+2</span> is a piece of text that says 2+2. With it, <span class='f'>=2+2</span> is a cell that shows 4." },
    { h: "Point at cells, do not type numbers" },
    { p: "You could write <span class='f'>=12*1.45</span>. It gives 17.4 and it is wrong, in the way that matters." },
    { p: "Write <span class='f'>=B2*C2</span> instead. Now the cell says <em>multiply whatever is in B2 by whatever is in C2</em>. When the price changes next month you edit one cell and every total that depends on it corrects itself." },
    { why: "A typed number is a fact frozen at the moment you typed it. A reference is a live link. The moment you type a number into a formula you have created something that will silently be out of date, and nothing will tell you when it happens. Auditors call these hard-coded values, and finding them is a large part of checking somebody else's spreadsheet." },
    { pro: "The one exception professionals accept: a genuine constant that is part of the arithmetic rather than part of the data. The 2 in <span class='f'>=(A1+B1)/2</span> is fine. A VAT rate is not, because rates change; that belongs in its own cell." },
    { h: "The operators" },
    {
      ul: [
        "<span class='f'>+</span> add, <span class='f'>-</span> subtract",
        "<span class='f'>*</span> multiply. Not the letter x. Excel will not understand x.",
        "<span class='f'>/</span> divide. Not a backslash.",
        "<span class='f'>^</span> raise to a power, so <span class='f'>=3^2</span> is 9",
        "<span class='f'>&amp;</span> joins text together, which comes back in Module 4"
      ]
    },
    { h: "Order of operations, and the brackets that save you" },
    { p: "Excel does not work left to right. It does powers first, then multiplication and division, then addition and subtraction. This is the same order you were taught at school, and it is the source of a genuinely common reporting error." },
    { p: "Say five line totals sit in D2 to D6 and you want their average. Write this and you get nonsense:" },
    { f: "=D2+D3+D4+D5+D6/5        wrong" },
    { p: "Excel divides D6 by 5 first, then adds the other four to it. Put brackets round the part you want done first:" },
    { f: "=(D2+D3+D4+D5+D6)/5      right" },
    { trap: "This error does not announce itself. It returns a plausible-looking number, usually a bit too large, and it will sit in a report until somebody checks it by hand. When a figure looks slightly off rather than obviously broken, brackets are the first thing to check." },
    { h: "Reading a formula back" },
    { p: "Click a cell that contains a formula and look at the formula bar along the top. The cell shows the answer; the bar shows the question. Pressing <kbd>F2</kbd> does the same thing and also highlights each referenced cell in colour, which is the quickest way to see whether a formula is pointing where you think." },
    { web: "Excel for the web behaves identically here. One small difference: the desktop version has a Formulas tab with Trace Precedents, which draws arrows from a formula to the cells it uses. The web version does not, so <kbd>F2</kbd> and its colour highlighting is your equivalent." }
  ],
  reflect: [
    "Look back at the total you built. If a price changed, how many cells would you have to edit? If the answer is more than one, something is hard-coded.",
    "The average you calculated with brackets: try it once without them and watch how believable the wrong answer looks."
  ],

  practice: function (seed) {
    const r = rng(seed);
    const qty = M2_ORDER.map(() => rInt(r, 2, 24));
    const sh = new Sheet("Order", 16, 5);

    sh.writeTable(0, 0, ["Item", "Qty", "Unit price", "Line total"],
      M2_ORDER.map((o, i) => [o.item, qty[i], o.unit, null]), [null, null, GBP2, GBP2]);

    label(sh, "A8", "Order total");
    label(sh, "A10", "Average line total");
    note(sh, "C10", "brackets needed");
    lockSheet(sh, ["D2", "D3", "D4", "D5", "D6", "D8", "D10", "D12"]);
    ["D2", "D3", "D4", "D5", "D6", "D8", "D10", "D12"].forEach(ref => {
      const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2;
    });
    label(sh, "A12", "Total after 10% discount");
    sh.cell(parseA1("A12").r, parseA1("A12").c).locked = true;
    sh.rows = 14; sh.cols = 5;

    /* Solve with the live engine so the key cannot drift from the data */
    const tmp = new Sheet("tmp", 16, 5);
    M2_ORDER.forEach((o, i) => { tmp.set(1 + i, 1, qty[i]); tmp.set(1 + i, 2, o.unit); });
    const lines = M2_ORDER.map((o, i) => xround(qty[i] * o.unit, 2));
    lines.forEach((v, i) => tmp.set(1 + i, 3, v));
    const total = solve(tmp, "=SUM(D2:D6)");
    const avg = solve(tmp, "=(D2+D3+D4+D5+D6)/5");

    return {
      sheet: sh,
      maxRows: 14, maxCols: 5, startRow: 1, startCol: 3, formatBar: false,
      brief: {
        title: "A supplier order, worked out properly",
        body: "Five items, a quantity and a unit price for each. Work out every line total, then the order total, " +
          "then the average line. Every answer must be a formula that points at cells. " +
          "If you find yourself typing a number that already exists somewhere on the sheet, stop and point at it instead."
      },
      hint: "Formulas start with <strong>=</strong>. Multiply with <strong>*</strong>. You will be typing the same shape of formula five times, which is annoying; session 3 fixes that permanently.",
      tasks: [
        { id: "t1", text: "In D2, work out the line total for the first item: quantity multiplied by unit price.", cell: "D2" },
        { id: "t2", text: "Do the same for D3, D4 and D5.", cell: "D3" },
        { id: "t3", text: "And D6, the last line.", cell: "D6" },
        { id: "t4", text: "In D8, add the five line totals together. Use the plus sign, not a function; SUM arrives next session.", cell: "D8" },
        { id: "t5", text: "In D10, work out the average line total <strong>without using a function</strong>. Add the five up and divide by 5, and think about where the brackets go.", cell: "D10" },
        { id: "t6", text: "In D12, work out the order total after a 10% discount.", cell: "D12", ext: true }
      ],
      checks: [
        {
          cell: "D2", expect: lines[0], needFormula: true, mustNotUse: ["SUM"],
          task: "D2: the first line total.",
          answer: "=B2*C2",
          why: "Quantity times unit price, pointing at both cells. Change the quantity in B2 and this corrects itself, which is the entire reason for using a spreadsheet rather than a calculator.",
          wrongWay: "Typing <span class='f'>=" + qty[0] + "*" + M2_ORDER[0].unit + "</span>, or worse, typing the answer " + lines[0].toFixed(2) + " straight in. Both are right today and wrong the moment anything changes, and neither leaves any trace that it was hard-coded."
        },
        {
          cell: "D3", expect: lines[1], needFormula: true,
          task: "D3: the second line total.",
          answer: "=B3*C3",
          why: "The same instruction, one row down. Every reference moves with it.",
          wrongWay: "Leaving this blank and jumping to the total. The order total below adds these five cells, so a gap here makes that wrong too."
        },
        {
          cell: "D4", expect: lines[2], needFormula: true,
          task: "D4: the third line total.",
          answer: "=B4*C4",
          why: "Same again. By now the repetition should be irritating, which is the point.",
          wrongWay: "Typing the answer from a calculator. It is faster for one row and useless for two hundred."
        },
        {
          cell: "D5", expect: lines[3], needFormula: true,
          task: "D5: the fourth line total.",
          answer: "=B5*C5",
          why: "Four down, one to go. Session 3 replaces all of this with one formula and a drag.",
          wrongWay: "Copying D2 by hand and forgetting to change the row numbers."
        },
        {
          cell: "D6", expect: lines[4], needFormula: true,
          task: "D6: the last line total.",
          answer: "=B6*C6",
          why: "Identical shape, one row further down. Noticing that every one of these five formulas is the same instruction moved down a row is the whole idea behind session 3.",
          wrongWay: "Copying the text of D2 by retyping it as <span class='f'>=B2*C2</span> on row 6, which totals the wrong item. Read the row number off the side of the sheet."
        },
        {
          cell: "D8", expect: total, needFormula: true, mustNotUse: ["SUM"],
          task: "D8: the order total.",
          answer: "=D2+D3+D4+D5+D6",
          why: "Adding the five line totals, not recalculating from quantities and prices. Build on figures you have already worked out, so there is one place to check if something looks wrong.",
          wrongWay: "<span class='f'>=B2*C2+B3*C3+B4*C4+B5*C5+B6*C6</span>. It gives the same number and is far harder to check, because a mistake in it is invisible. Long formulas that redo work already on the sheet are a reliable sign of trouble."
        },
        {
          cell: "D10", expect: avg, needFormula: true, tol: 0.005,
          task: "D10: the average line total, without a function.",
          answer: "=(D2+D3+D4+D5+D6)/5",
          why: "The brackets force the addition to happen before the division. Without them Excel divides D6 by 5 first and adds that to the other four, giving " + fmtNum(xround(lines[0] + lines[1] + lines[2] + lines[3] + lines[4] / 5, 2), 2) + " instead of " + fmtNum(avg, 2) + ".",
          wrongWay: "<span class='f'>=D2+D3+D4+D5+D6/5</span>. Notice how believable the wrong answer is. It is in the right ballpark, it has the right number of digits, and nothing flags it. This is why brackets are worth being fussy about."
        },
        {
          cell: "D12", ext: true, expect: xround(total * 0.9, 2), needFormula: true, tol: 0.02,
          task: "D12: the order total after a 10% discount.",
          answer: "=D8*0.9    or    =D8-D8*10%",
          why: "Both are correct. The first is shorter and most people write it. The second reads more like the sentence it came from, which matters when somebody else has to check your work six months later.",
          wrongWay: "<span class='f'>=D8-10%</span>, which subtracts nought point one from the total rather than a tenth of it. Percentages in Excel are just fractions, so 10% is 0.1, and subtracting 0.1 from a bill takes off ten pence."
        }
      ]
    };
  },
  workbook: function (seed) {
    const wb = new Workbook("M2S1");
    wb.add(M2S1.practice(seed).sheet);
    return wb;
  }
};

/* ============================================================
   Session 2
   ============================================================ */
const M2S2 = {
  title: "SUM and the family, and what COUNT quietly tells you",
  aim: "Replace hand-built arithmetic with functions, and learn to use two of them together as a data quality check.",
  why: "SUM is the first function everyone learns and the one that most often lies to them, because it skips text without saying so. The fix is not to distrust SUM; it is to put COUNT next to it.",
  concepts: ["m2.sum", "m2.avgblank", "m2.countvcounta", "m2.round"],
  unlocks: ["SUM", "AVERAGE", "MIN", "MAX", "COUNT", "COUNTA", "ROUND", "ROUNDUP", "ROUNDDOWN", "ABS"],
  lesson: [
    { lead: "A function is a formula somebody else has already written and named." },
    { p: "You write the name, open a bracket, tell it what to work on, and close the bracket. <span class='f'>=SUM(D2:D6)</span> does exactly what <span class='f'>=D2+D3+D4+D5+D6</span> did last session, and keeps doing it when you add a sixth row inside the range." },
    { h: "The six that cover most of the work" },
    {
      table: {
        cols: ["Function", "What it does", "Careful"], startRow: 1,
        rows: [
          ["SUM", "adds the numbers", "ignores text without saying so"],
          ["AVERAGE", "the mean", "ignores blanks, includes zeros"],
          ["MIN", "the smallest number", "ignores text"],
          ["MAX", "the largest number", "ignores text"],
          ["COUNT", "how many cells hold numbers", "text does not count"],
          ["COUNTA", "how many cells are not empty", "anything counts"]
        ]
      }
    },
    { h: "The blank and the zero are not the same thing" },
    { p: "AVERAGE skips empty cells entirely. It does not skip zeros. Ten sales of which two were nil is an average over ten; ten sales of which two were not recorded is an average over eight. Those are different questions and they give different answers, so the difference between a blank cell and a cell containing 0 is a real decision, not a typing preference." },
    { trap: "Filling blanks with zeros to tidy a sheet up changes every average on it. If a value is genuinely unknown, leave the cell empty. If it is genuinely nothing, type 0. Never do one to mean the other." },
    { h: "COUNT and COUNTA together, as a check" },
    { p: "Run both over the same range. COUNT tells you how many cells hold real numbers. COUNTA tells you how many hold anything at all." },
    { f: "=COUNT(B2:B13)      10\n=COUNTA(B2:B13)     11" },
    { p: "The gap is one cell that contains something which is not a number. Almost always that is a number stored as text, which means SUM has just quietly left it out of your total." },
    { pro: "Put both counts beside any total you are going to report. It costs two cells and it catches the single most common silent error in Excel. When the two numbers match, your total includes everything you think it includes." },
    { why: "This is why Module 1 spent a session on data types. The alignment test finds the broken cell; COUNT against COUNTA tells you a broken cell exists at all, on a sheet too long to scan by eye." },
    { h: "ROUND actually changes the number" },
    { p: "Formatting a cell to two decimal places changes what you see. ROUND changes what is stored." },
    { f: "=ROUND(3.14159, 2)      3.14\n=ROUND(1234, -2)        1200" },
    { p: "The second argument is how many decimal places. A negative number rounds to the left of the decimal point, so -2 rounds to the nearest hundred." },
    { trap: "Do not round as you go. Round once, at the end, in the cell somebody reads. Rounding intermediate figures and then adding them up produces totals that disagree with their own components, which is the classic way a set of numbers stops adding up in a report." },
    { web: "The AutoSum button on the Home tab writes a SUM formula for you and guesses the range. It guesses by looking for numbers directly above or to the left, and it guesses wrong whenever there is a blank row in the way. Always look at the range it chose before pressing Enter." }
  ],
  reflect: [
    "Say what the difference between COUNT and COUNTA told you about this sheet.",
    "If you had reported the SUM without checking, how far out would you have been?"
  ],

  practice: function (seed) {
    const r = rng(seed);
    const days = ["Mon 4 Mar", "Tue 5 Mar", "Wed 6 Mar", "Thu 7 Mar", "Fri 8 Mar", "Sat 9 Mar",
      "Sun 10 Mar", "Mon 11 Mar", "Tue 12 Mar", "Wed 13 Mar", "Thu 14 Mar", "Fri 15 Mar"];
    const takings = days.map(() => xround(rInt(r, 18000, 74000) / 100, 2));
    const textRow = 4;      // index into days: this one arrives as text
    const blankRow = 8;     // this one was never recorded

    const sh = new Sheet("Takings", 26, 4);
    sh.set(0, 0, "Day", { hdr: true }); sh.set(0, 1, "Takings", { hdr: true });
    days.forEach((d, i) => {
      sh.set(1 + i, 0, d);
      if (i === blankRow) return;
      if (i === textRow) sh.set(1 + i, 1, String(takings[i].toFixed(2)) + " ");   // text, trailing space
      else sh.set(1 + i, 1, takings[i], { fmt: GBP2 });
    });

    label(sh, "A15", "Total"); label(sh, "A16", "Average");
    label(sh, "A17", "Count of numbers"); label(sh, "A18", "Count of entries");
    label(sh, "A19", "Busiest day takings"); label(sh, "A20", "Quietest day takings");
    label(sh, "A21", "Average, rounded to 2dp");
    label(sh, "A23", "Cell stored as text");

    const answers = ["B15", "B16", "B17", "B18", "B19", "B20", "B21", "B23"];
    lockSheet(sh, answers);
    sh.rows = 24; sh.cols = 4;

    /* values the learner's formulas must produce, from the same sheet */
    const rng2 = "B2:B13";
    const expTotal = solve(sh, "=SUM(" + rng2 + ")");
    const expAvg = solve(sh, "=AVERAGE(" + rng2 + ")");
    const expCount = solve(sh, "=COUNT(" + rng2 + ")");
    const expCounta = solve(sh, "=COUNTA(" + rng2 + ")");
    const expMax = solve(sh, "=MAX(" + rng2 + ")");
    const expMin = solve(sh, "=MIN(" + rng2 + ")");
    const expRound = xround(expAvg, 2);
    const textCell = "B" + (2 + textRow);

    return {
      sheet: sh,
      maxRows: 24, maxCols: 4, startRow: 14, startCol: 1, formatBar: false,
      brief: {
        title: "Twelve days of takings, one of which is lying to you",
        body: "A fortnight of daily takings from the cafe. One day was never recorded and the cell is empty. " +
          "One day came in from a card terminal export and is not what it appears to be. " +
          "Build the summary below with functions, and let two of them tell you where the problem is."
      },
      hint: "Every answer is a function over the range <strong>B2:B13</strong>. Type <span class='f'>=SUM(</span> then drag or type the range, then close the bracket.",
      tasks: [
        { id: "t1", text: "In B15, total the takings.", cell: "B15" },
        { id: "t2", text: "In B16, the average daily takings.", cell: "B16" },
        { id: "t3", text: "In B17, how many cells hold a number.", cell: "B17" },
        { id: "t4", text: "In B18, how many cells hold anything at all.", cell: "B18" },
        { id: "t5", text: "Compare B17 and B18. They should not match. In B23, type the address of the cell that is stored as text.", cell: "B23" },
        { id: "t6", text: "In B19 and B20, the busiest and quietest days' takings.", cell: "B19", ext: true },
        { id: "t7", text: "In B21, the average rounded to two decimal places, as a stored value rather than a format.", cell: "B21", ext: true }
      ],
      checks: [
        {
          cell: "B15", expect: expTotal, needFormula: true, mustUse: "SUM", tol: 0.005,
          task: "B15: the total takings.",
          answer: "=SUM(B2:B13)",
          why: "Note what this total is not: it leaves out " + textCell + ", because that cell holds text. SUM gives you " + gbp(expTotal) + " and does not mention the omission. The true figure including that day is " + gbp(xround(expTotal + takings[textRow], 2)) + ".",
          wrongWay: "<span class='f'>=SUM(B2:B14)</span>, reaching one row past the data. It happens to give the same answer here because row 14 is empty, and it will quietly swallow whatever gets typed there next month."
        },
        {
          cell: "B16", expect: expAvg, needFormula: true, mustUse: "AVERAGE", tol: 0.005,
          task: "B16: the average daily takings.",
          answer: "=AVERAGE(B2:B13)",
          why: "This averages over " + expCount + " days, not 12. The empty day is skipped and the text day is skipped. Whether that is the number you want depends on the question: average takings per trading day, or average per day of the fortnight. They are different and the sheet cannot decide for you.",
          wrongWay: "Typing zeros into the blank cell to tidy it up. That would make Excel average over 12 days including a day of nil takings, dragging the figure down by a fifth for no reason other than neatness."
        },
        {
          cell: "B17", expect: expCount, needFormula: true, mustUse: "COUNT",
          task: "B17: how many cells hold a number.",
          answer: "=COUNT(B2:B13)",
          why: "COUNT only counts numbers. Twelve rows, one blank, one text, so " + expCount + ".",
          wrongWay: "Counting the rows by eye and typing 12. The whole point of this pair of cells is to catch what the eye misses."
        },
        {
          cell: "B18", expect: expCounta, needFormula: true, mustUse: "COUNTA",
          task: "B18: how many cells hold anything at all.",
          answer: "=COUNTA(B2:B13)",
          why: "COUNTA counts anything non-empty, so it sees the text day too and returns " + expCounta + ". The gap between this and B17 is exactly one, and that one cell is the problem.",
          wrongWay: "Confusing the two names. COUNTA is not <em>count all rows</em>; it is count non-empty. The blank day is missing from both."
        },
        {
          cell: "B23", expect: textCell,
          task: "B23: the address of the cell stored as text.",
          answer: textCell,
          why: "COUNT and COUNTA told you one exists. The alignment test from Module 1 tells you which: it is the takings figure sitting on the left of its cell instead of the right. In this case the cause is a trailing space from the card terminal export.",
          wrongWay: "Giving the address of the blank cell. The blank is counted by neither function, so it is not what the gap between them is pointing at."
        },
        {
          cell: "B19", ext: true, expect: expMax, needFormula: true, mustUse: "MAX", tol: 0.005,
          task: "B19: the busiest day's takings.",
          answer: "=MAX(B2:B13)",
          why: "MAX ignores the text cell as well, so if the true busiest day happens to be the broken one, this is wrong too. Every function in this family shares the same blind spot, which is why you fix the data rather than working around it.",
          wrongWay: "Sorting the column to find the largest. That reorders your data and, if you sort the one column alone, destroys the sheet. Module 1 covered why."
        },
        {
          cell: "B21", ext: true, expect: expRound, needFormula: true, mustUse: "ROUND", tol: 0.0005,
          task: "B21: the average rounded to two decimal places.",
          answer: "=ROUND(B16,2)",
          why: "This stores " + fmtNum(expRound, 2) + " rather than merely displaying it. Use it when a figure will be copied elsewhere or compared against another system, where a hidden extra decimal causes a mismatch nobody can find.",
          wrongWay: "<span class='f'>=ROUND(AVERAGE(B2:B13),2)</span> is also correct, but referring to B16 means the rounding and the average are in separate cells, each checkable on its own. Long nested formulas hide their mistakes."
        }
      ]
    };
  },
  workbook: function (seed) {
    const wb = new Workbook("M2S2");
    wb.add(M2S2.practice(seed).sheet);
    return wb;
  }
};

/* ============================================================
   Session 3
   ============================================================ */
const M2S3 = {
  title: "Filling a formula down, and the dollar signs that stop it breaking",
  aim: "Write a formula once and apply it to a thousand rows, and understand exactly what changes when you do.",
  why: "This is the moment Excel stops being a grid you type into and becomes something that scales. It is also the single most common place a beginner's sheet goes wrong, and the failure is visually obvious once you know what you are looking at.",
  concepts: ["m2.fill", "m2.relative", "m2.absolute", "m2.mixed"],
  unlocks: [],
  lesson: [
    { lead: "Excel remembers formulas as directions, not addresses." },
    { p: "When you put <span class='f'>=B2*C2</span> in D2, Excel does not really store <em>B2 times C2</em>. It stores <em>two cells to my left, times one cell to my left</em>. The address is how it is written down; the direction is what it means." },
    { p: "So when you copy that cell to D3, the directions still apply from the new position and it becomes <span class='f'>=B3*C3</span>. That is not Excel being clever. It is the only thing the stored instruction could possibly mean." },
    { h: "Filling down" },
    {
      steps: [
        "Write the formula once, in the top cell of the column.",
        "Check it. One correct formula is about to become two hundred, so check this one properly.",
        "Select that cell. A small square sits at its bottom-right corner: the fill handle.",
        "Drag the handle down to the last row, or double-click it and Excel fills down as far as the neighbouring column has data.",
        "Click a cell near the bottom and read the formula bar. Confirm it points where it should."
      ]
    },
    { pro: "That last step is not optional. Filling is the moment one mistake becomes hundreds, and the fastest way to catch it is to look at the last row rather than the first. The keyboard version is <kbd>Ctrl</kbd>+<kbd>D</kbd>, which fills from the cell above into the selected cell." },
    { h: "Where it breaks" },
    { p: "Put a VAT rate of 0.2 in B1. Now in C4 write <span class='f'>=B4*B1</span> to work out the VAT on the first amount. It gives the right answer. Fill it down and the column falls apart." },
    { p: "Read what happened. C5 became <span class='f'>=B5*B2</span>, C6 became <span class='f'>=B6*B3</span>, and so on. The reference to the rate moved down with everything else. What it hits depends on what happens to be sitting there: an empty cell gives zero, a heading gives #VALUE!, and another amount gives an enormous number where two invoices have been multiplied together." },
    { trap: "The tell-tale sign is a column that is right on the first row and nonsense underneath, in no consistent way. The mixture is itself the clue, because a genuine data problem tends to fail the same way every time. Beginners often conclude Excel is broken and retype the formula in every row, which works, takes an hour, and creates a sheet nobody can maintain." },
    { h: "The dollar sign locks a part in place" },
    { p: "A dollar sign in front of a part of a reference means <em>do not move this part when the formula moves</em>." },
    {
      table: {
        cols: ["Written", "When filled", "Called"], startRow: 1,
        rows: [
          ["B1", "both parts move", "relative"],
          ["$B$1", "neither part moves", "absolute"],
          ["B$1", "column moves, row is pinned", "mixed"],
          ["$B1", "column is pinned, row moves", "mixed"]
        ]
      }
    },
    { p: "So the VAT formula should be <span class='f'>=B4*$B$1</span>. Fill it down and the amount reference moves while the rate reference stays on B1, which is exactly what you meant." },
    { pro: "Do not type the dollar signs. Put the cursor on the reference while editing and press <kbd>F4</kbd>. It cycles through <span class='f'>B1</span>, <span class='f'>$B$1</span>, <span class='f'>B$1</span>, <span class='f'>$B1</span> and back. On a Mac laptop it may be <kbd>Fn</kbd>+<kbd>F4</kbd>. This is the shortcut experienced users reach for without thinking." },
    { h: "When you need only half a lock" },
    { p: "Mixed references matter when a formula is filled across as well as down. Imagine commission rates along the top row and sale amounts down the left column, and one formula that has to fill through the whole rectangle." },
    { f: "=$A5*B$4" },
    { p: "The <span class='f'>$A</span> keeps it reading the amount from column A however far right it travels. The <span class='f'>$4</span> keeps it reading the rate from row 4 however far down it travels. One formula, filled once, fills the entire table correctly." },
    { why: "Ask which part of the reference should stay still when the formula moves. If the answer is the column, lock the column. If the row, lock the row. If it should never move at all, lock both. The dollar sign is not decoration and there is no benefit in adding it everywhere." },
    { web: "The fill handle and <kbd>Ctrl</kbd>+<kbd>D</kbd> both work in Excel for the web. <kbd>F4</kbd> for cycling the dollar signs works in the web version too, though some browsers intercept it; if nothing happens, type the dollar signs by hand. In the practice grid below use the Fill down button, or <kbd>Ctrl</kbd>+<kbd>D</kbd> one cell at a time." }
  ],
  reflect: [
    "Say what <span class='f'>$B$1</span> means out loud, in terms of what happens when the formula moves.",
    "Next time a filled column is right at the top and wrong underneath, you already know what it is."
  ],

  practice: function (seed) {
    const r = rng(seed);
    const n = 10;
    const suppliers = ["Redgate Supplies", "Halden & Co", "Northwood Ltd", "Peak Trading", "Mersey Print",
      "Calder Foods", "Ashby Motors", "Wear Valley Steel", "Redgate Supplies", "Peak Trading"];
    const net = [];
    for (let i = 0; i < n; i++) net.push(xround(rInt(r, 4000, 190000) / 100, 2));

    const sh = new Sheet("VAT", 24, 6);
    label(sh, "A1", "VAT rate");
    put(sh, "B1", 0.2, { fmt: "0%", locked: true });

    sh.set(2, 0, "Supplier", { hdr: true });
    sh.set(2, 1, "Net", { hdr: true });
    sh.set(2, 2, "VAT", { hdr: true });
    sh.set(2, 3, "Gross", { hdr: true });
    for (let i = 0; i < n; i++) {
      sh.set(3 + i, 0, suppliers[i]);
      sh.set(3 + i, 1, net[i], { fmt: GBP2 });
    }
    const vatCells = [], grossCells = [];
    for (let i = 0; i < n; i++) {
      vatCells.push("C" + (4 + i));
      grossCells.push("D" + (4 + i));
    }
    lockSheet(sh, vatCells.concat(grossCells));
    vatCells.concat(grossCells).forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });
    sh.rows = 16; sh.cols = 5;

    const expVat = net.map(v => xround(v * 0.2, 2));
    const expGross = net.map((v, i) => xround(v + expVat[i], 2));

    return {
      sheet: sh,
      maxRows: 15, maxCols: 5, startRow: 3, startCol: 2, formatBar: false, fillBar: true,
      highlight: vatCells.concat(grossCells),
      brief: {
        title: "Ten invoices, one VAT rate, one formula",
        body: "The VAT rate sits in <strong>B1</strong> and nowhere else, which is where a rate belongs. " +
          "Work out the VAT and the gross for the first invoice, then fill both formulas down the whole column. " +
          "Write each formula once. If you find yourself typing the second one by hand, the first one was wrong."
      },
      hint: "Select the cell you want to copy, then press <strong>Fill down ↓</strong> above the grid. Before you fill, ask yourself which reference must not move.",
      tasks: [
        { id: "t1", text: "In C4, work out the VAT on the first invoice: the net amount times the rate in B1. Lock whichever reference must not move.", cell: "C4" },
        { id: "t2", text: "Fill C4 down to C13. Then click C13 and read the formula bar. Is it still pointing at B1?", cell: "C13" },
        { id: "t3", text: "In D4, work out the gross: net plus VAT.", cell: "D4" },
        { id: "t4", text: "Fill D4 down to D13.", cell: "D13" },
        { id: "t5", text: "Change B1 to 0.05 and watch all twenty cells update. Then put it back to 0.2.", cell: null, ext: true }
      ],
      checks: [
        {
          cell: "C4", expect: expVat[0], needFormula: true, mustUse: "$B$1", tol: 0.005,
          task: "C4: VAT on the first invoice.",
          answer: "=B4*$B$1",
          why: "The net reference must move down with the formula, so it stays relative. The rate reference must not, so both its parts are locked. Press <kbd>F4</kbd> on B1 while editing rather than typing the dollar signs.",
          wrongWay: "<span class='f'>=B4*0.2</span>. Right answer, wrong sheet. The rate is now buried in ten formulas instead of sitting in one cell, and when it changes you will have to find and edit every one of them, with no way of knowing whether you got them all."
        },
        {
          cell: "C13", expect: expVat[9], needFormula: true, mustUse: "$B$1", tol: 0.005,
          task: "C13: the last VAT figure, reached by filling.",
          answer: "=B13*$B$1",
          why: "This is the cell that proves the lock worked. The net reference travelled from B4 to B13 while the rate stayed on B1. Checking the bottom of a filled column rather than the top is the habit worth forming.",
          wrongWay: "If this shows 0, #VALUE!, or a number in the millions, the rate was written as <span class='f'>B1</span> without the dollar signs and has drifted down to B10, which holds another invoice. Two invoices have been multiplied together. Fix C4 and fill again rather than patching this cell."
        },
        {
          cell: "D4", expect: expGross[0], needFormula: true, tol: 0.005,
          task: "D4: the gross for the first invoice.",
          answer: "=B4+C4",
          why: "Both references move down together, which is what you want, so neither needs locking. Not every formula needs dollar signs, and adding them by reflex causes its own bugs.",
          wrongWay: "<span class='f'>=B4*1.2</span>. It gives the same number today and hides the rate again, and it will be wrong the moment VAT changes or a line is zero-rated."
        },
        {
          cell: "D13", expect: expGross[9], needFormula: true, tol: 0.005,
          task: "D13: the last gross figure.",
          answer: "=B13+C13",
          why: "Both references moved by nine rows, exactly as intended. A formula where everything should move is the normal case; the locked reference is the exception you reach for deliberately.",
          wrongWay: "Adding dollar signs here out of caution. <span class='f'>=$B$4+$C$4</span> filled down gives ten identical rows, all showing the first invoice."
        }
      ]
    };
  },
  workbook: function (seed) {
    const wb = new Workbook("M2S3");
    wb.add(M2S3.practice(seed).sheet);
    return wb;
  }
};

/* ============================================================
   Session 4
   ============================================================ */
const M2S4 = {
  title: "Errors are messages, and the worst ones are silent",
  aim: "Read every error Excel shows you as a specific diagnosis, and understand why the dangerous mistakes never show one.",
  why: "Beginners see a hash symbol and assume they have broken something. Every one of these is Excel telling you precisely what is wrong, in a code you can learn in ten minutes. The mistakes worth fearing are the ones that return a perfectly ordinary number.",
  concepts: ["m2.errvalue", "m2.errdiv0", "m2.errname", "m2.silentwrong"],
  unlocks: [],
  lesson: [
    { lead: "An error value is not a failure. It is a sentence." },
    { h: "The five you will actually meet" },
    {
      table: {
        cols: ["Shows", "Means", "Usually caused by"], startRow: 1,
        rows: [
          ["#DIV/0!", "divided by zero or by an empty cell", "a denominator that has not been filled in yet"],
          ["#VALUE!", "text where a number was needed", "a stray letter, a space, or an imported column"],
          ["#NAME?", "a name Excel does not recognise", "a misspelled function, or text without quotation marks"],
          ["#REF!", "a reference pointing at nothing", "a row or column that has been deleted"],
          ["#N/A", "a lookup found nothing", "the value is not in the list, or has a trailing space"]
        ]
      }
    },
    { h: "#DIV/0!" },
    { p: "Something is being divided by zero or by a blank. Often it is temporary: an average per unit where the units column is not filled in yet. The formula is fine and the data is not there." },
    { p: "The fix is to supply the missing figure. Hiding the error is a separate decision, and it belongs at the end of a project rather than the start, when you are certain the blank is expected rather than a gap you should have noticed." },
    { h: "#VALUE!" },
    { p: "You have asked for arithmetic on something that is not a number. Look for a cell that contains a word, a symbol, or a number with a unit typed after it. This is the Module 1 problem showing up in a formula rather than in a total." },
    { trap: "Excel is inconsistent here in a way that catches people out. <span class='f'>=\"12\"+1</span> gives 13, because Excel converts text that looks like a number when it is used directly in arithmetic. But SUM over a range containing that same text ignores it. So the same broken cell errors in one formula and is silently skipped in another." },
    { h: "#NAME?" },
    { p: "Excel does not recognise something you typed as a name. Three causes, in order of frequency: the function is misspelled, text is missing its quotation marks, or a range name does not exist." },
    { f: "=SUMM(B2:B10)        #NAME?  spelled wrong\n=IF(A1=London,1,0)   #NAME?  London needs quotation marks" },
    { h: "#REF!" },
    { p: "A reference has nothing to point at. The classic cause is deleting a row or column that a formula depended on. Unlike the others, this one is usually destructive: the original reference is gone and Excel cannot work out what you meant, so you have to rebuild the formula." },
    { pro: "When a #REF! appears immediately after you deleted something, undo straight away rather than trying to repair the formulas. Undo restores the reference; editing forty broken formulas does not." },
    { h: "##### is not an error" },
    { p: "A cell full of hash marks means the column is too narrow to display the number. The value is completely fine. Widen the column by double-clicking the line between the column letters and it goes away. Nothing has broken and there is nothing to fix." },
    { h: "The errors that do not show" },
    { p: "Everything above is Excel doing you a favour by refusing to proceed. The mistakes that damage real work look like ordinary numbers." },
    {
      ul: [
        "A range that stops short, so <span class='f'>=SUM(B2:B20)</span> misses the rows added last week.",
        "A range that reaches too far and picks up a subtotal, counting some figures twice.",
        "Missing brackets, from last session, giving a plausible number rather than the right one.",
        "A number stored as text, silently skipped by SUM."
      ]
    },
    { why: "None of these produce a symbol, so no amount of learning error codes will catch them. What catches them is a sense of scale: knowing roughly what the answer should be before you calculate it, and looking twice when it is not that. A total of £48,000 where you expected £52,000 is worth ten minutes even when nothing is flagged." },
    { pro: "Sanity-check a total against something independent before you report it. Count the rows and multiply by a typical value. If a fortnight of takings averaging around £400 a day totals £4,800, you are missing about half your data, and no error message was ever going to tell you." },
    { web: "Excel for the web highlights some errors with a small green triangle in the corner of the cell and offers a suggestion when you click it. Read the suggestion; do not apply it automatically. It is a guess based on what neighbouring cells do, and on a sheet with a deliberate exception in it, the guess is wrong." }
  ],
  reflect: [
    "Name the four error codes and what each one is telling you, without looking.",
    "Before your next total, write down what you expect it to be roughly. Then compare."
  ],

  practice: function (seed) {
    const r = rng(seed);
    const units = [rInt(r, 40, 180), rInt(r, 40, 180), rInt(r, 40, 180), rInt(r, 40, 180), rInt(r, 40, 180)];
    const cost = units.map(() => xround(rInt(r, 8000, 90000) / 100, 2));

    const sh = new Sheet("Diagnose", 22, 6);
    sh.set(0, 0, "Batch", { hdr: true });
    sh.set(0, 1, "Units", { hdr: true });
    sh.set(0, 2, "Total cost", { hdr: true });
    sh.set(0, 3, "Cost per unit", { hdr: true });

    for (let i = 0; i < 5; i++) {
      sh.set(1 + i, 0, "B-" + (301 + i));
      sh.set(1 + i, 2, cost[i], { fmt: GBP2 });
      sh.setFormula(1 + i, 3, "C" + (2 + i) + "/B" + (2 + i), { fmt: GBP2 });
    }
    sh.set(1, 1, units[0]);
    /* the three planted faults */
    sh.clearCell(2, 1);                                  // B3 empty  -> D3 is #DIV/0!
    sh.set(3, 1, String(units[2]) + " units");           // B4 text   -> D4 is #VALUE!
    sh.set(4, 1, units[3]);
    sh.set(5, 1, units[4]);
    sh.setFormula(7, 2, "SUMM(C2:C6)");                  // C8        -> #NAME?
    sh.setFormula(8, 2, "SUM(C2:C4)");                   // C9        -> silently short

    label(sh, "A8", "Total cost (broken)");
    label(sh, "A9", "Total cost (looks fine)");
    label(sh, "A11", "Corrected total");
    label(sh, "A13", "Which total was wrong with no error shown?");

    lockSheet(sh, ["B3", "B4", "C8", "C11", "C13"]);
    sh.rows = 15; sh.cols = 5;

    const trueTotal = xround(cost.reduce((a, b) => a + b, 0), 2);
    const shortTotal = xround(cost[0] + cost[1] + cost[2], 2);

    return {
      sheet: sh,
      maxRows: 15, maxCols: 5, startRow: 2, startCol: 1, formatBar: false,
      brief: {
        title: "Five batches, four faults, and only three of them announce themselves",
        body: "Column D works out cost per unit and two rows of it are showing errors. Two totals sit below the data: " +
          "one is obviously broken, and one looks perfectly reasonable and is wrong. " +
          "Read each error as a message about what is missing, fix the cause rather than hiding the symptom, and find the silent one. " +
          "Batch B-303 used <strong>" + units[1] + "</strong> units and batch B-304 used <strong>" + units[2] + "</strong>."
      },
      hint: "Fix the <em>cause</em>. Two of these are fixed by correcting the data in column B, not by touching the formula in column D.",
      tasks: [
        { id: "t1", text: "D3 shows #DIV/0!. Read what that means, then fix the cause by putting B-303's unit count in B3.", cell: "B3" },
        { id: "t2", text: "D4 shows #VALUE!. Fix the cause in B4.", cell: "B4" },
        { id: "t3", text: "C8 shows #NAME?. Fix the formula.", cell: "C8" },
        { id: "t4", text: "C9 shows no error and is still wrong. Work out the correct total in C11.", cell: "C11" },
        { id: "t5", text: "In C13, type the address of the cell that was wrong without showing an error.", cell: "C13", ext: true }
      ],
      checks: [
        {
          cell: "B3", expect: units[1], expectType: "number",
          task: "B3: the missing unit count behind #DIV/0!.",
          answer: String(units[1]),
          why: "#DIV/0! was pointing at an empty denominator. The formula in D3 was never wrong; the data was not there. Once B3 holds a number the error clears on its own.",
          wrongWay: "Editing D3 to hide the error, or deleting the row. The error was doing its job, which was to tell you a figure was missing."
        },
        {
          cell: "B4", expect: units[2], expectType: "number",
          task: "B4: the unit count behind #VALUE!.",
          answer: String(units[2]) + "   as a plain number, with no word after it",
          why: "<span class='f'>" + units[2] + " units</span> is text, so dividing by it is meaningless and Excel says so. One fact per cell: the number goes in the cell, the word units goes in the column heading.",
          wrongWay: "Leaving the word in and wrapping the formula in something to cope with it. You would be building machinery to work around a value that simply should not have a word in it."
        },
        {
          cell: "C8", expect: trueTotal, needFormula: true, mustUse: "SUM", tol: 0.005,
          task: "C8: the total showing #NAME?.",
          answer: "=SUM(C2:C6)",
          why: "SUMM is not a function, so Excel did not recognise the name. #NAME? almost always means a typo in a function name or text used without quotation marks around it.",
          wrongWay: "Assuming the range was at fault. The range was correct all along; only the name was wrong. Read the error before changing anything."
        },
        {
          cell: "C11", expect: trueTotal, needFormula: true, mustUse: "SUM", tol: 0.005,
          task: "C11: the correct total.",
          answer: "=SUM(C2:C6)",
          why: "C9 contains <span class='f'>=SUM(C2:C4)</span>, which stops at the third batch and reports " + gbp(shortTotal) + " instead of " + gbp(trueTotal) + ". It is roughly the right size, it carries no error, and it is out by " + gbp(xround(trueTotal - shortTotal, 2)) + ".",
          wrongWay: "Trusting it because it looked plausible. A short range is the most common silent error in Excel, and the only defence is knowing roughly what the answer should be before you calculate it."
        },
        {
          cell: "C13", ext: true, expect: "C9",
          task: "C13: the cell that was wrong without showing an error.",
          answer: "C9",
          why: "C8 announced itself with #NAME? and was therefore harmless; you could not possibly have reported it. C9 looked like a finished answer. The errors that damage real work are the ones that do not look like errors.",
          wrongWay: "Answering C8, which is the one that looks broken. The question is which one would have made it into a report."
        }
      ]
    };
  },
  workbook: function (seed) {
    const wb = new Workbook("M2S4");
    wb.add(M2S4.practice(seed).sheet);
    return wb;
  }
};

/* ============================================================
   Register
   ============================================================ */
defModule({
  id: "m2", n: 2, stage: "s1",
  title: "Formulas that think",
  subtitle: "References, SUM and friends, filling down, reading errors",
  blurb: "The equals sign, why you point at cells instead of typing numbers, the functions that cover most of the work, and the dollar signs that stop a filled formula from falling apart.",
  onComplete: "You can now write a formula once and apply it to a whole column, and you can read what Excel tells you when something is wrong. More importantly you know that the dangerous errors are the quiet ones. Module 3 turns all of this into analysis.",
  concepts: [
    { id: "m2.equals", label: "Formulas start with =", blurb: "How Excel knows you are asking rather than typing." },
    { id: "m2.refnotnum", label: "Point at cells, do not type numbers", blurb: "Why a typed number is a fact frozen in time." },
    { id: "m2.arith", label: "Order of operations", blurb: "Powers, then times and divide, then plus and minus." },
    { id: "m2.brackets", label: "Brackets change the answer", blurb: "And the wrong answer looks entirely plausible." },
    { id: "m2.sum", label: "SUM and the family", blurb: "One function instead of a chain of plus signs." },
    { id: "m2.avgblank", label: "Blank is not zero", blurb: "AVERAGE skips empty cells but not zeros." },
    { id: "m2.countvcounta", label: "COUNT against COUNTA", blurb: "Two cells that catch a number stored as text." },
    { id: "m2.round", label: "ROUND changes the value", blurb: "Unlike formatting, which only changes the display." },
    { id: "m2.fill", label: "Filling a formula down", blurb: "Write once, apply to a thousand rows, check the bottom." },
    { id: "m2.relative", label: "Relative references move", blurb: "Excel stores directions, not addresses." },
    { id: "m2.absolute", label: "$B$1 stays put", blurb: "The lock that stops a filled formula falling apart." },
    { id: "m2.mixed", label: "Mixed references", blurb: "Lock the column or the row, when filling both ways." },
    { id: "m2.errvalue", label: "#VALUE! and #NAME?", blurb: "Text where a number was needed, or a name not recognised." },
    { id: "m2.errdiv0", label: "#DIV/0! and #REF!", blurb: "A missing denominator, or a reference pointing at nothing." },
    { id: "m2.errname", label: "##### is not an error", blurb: "The column is too narrow. The value is fine." },
    { id: "m2.silentwrong", label: "The errors that do not show", blurb: "Short ranges and missing brackets return ordinary numbers." }
  ],
  sessions: [M2S1, M2S2, M2S3, M2S4]
});
