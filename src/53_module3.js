/* ============================================================
   Module 3: Logic and conditions
   Where the course stops being about spreadsheets and starts
   being about analysis. From here on, exercises deliberately mix
   in skills from Modules 1 and 2.
   ============================================================ */

/* Lay the shared transaction log onto a sheet. Columns:
   A Ref, B Supplier, C City, D Date, E Amount, then whatever the
   session adds. */
function txSheet(name, rows, extraHeads) {
  const sh = new Sheet(name, rows.length + 14, 5 + (extraHeads || []).length);
  const heads = ["Ref", "Supplier", "City", "Date", "Amount"].concat(extraHeads || []);
  heads.forEach((h, i) => sh.set(0, i, h, { hdr: true, locked: true }));
  rows.forEach((t, i) => {
    sh.set(1 + i, 0, t.ref, { locked: true });
    sh.set(1 + i, 1, t.supplier, { locked: true });
    sh.set(1 + i, 2, t.city, { locked: true });
    sh.set(1 + i, 3, t.date, { fmt: DATEFMT, locked: true });
    sh.set(1 + i, 4, t.amount, { fmt: GBP2, locked: true });
  });
  return sh;
}

/* ============================================================
   Session 1
   ============================================================ */
const M3S1 = {
  title: "IF: making the sheet decide",
  aim: "Write a formula that asks a question about each row and answers it differently depending on what it finds.",
  why: "Everything you have written so far calculates. IF is the first formula that <em>judges</em>, and every review queue, risk flag and exception report you will ever build is a variation on it.",
  concepts: ["m3.if", "m3.quotes", "m3.compareop", "m3.ifnumber"],
  unlocks: ["IF"],
  lesson: [
    { lead: "IF asks a yes-or-no question about a row and gives you one of two answers." },
    { f: "=IF(test, what to do if true, what to do if false)" },
    { p: "Three parts, separated by commas. The test is anything that can come out true or false. The second and third parts are what the cell should show in each case." },
    { f: '=IF(E2>500, "Review", "OK")' },
    { p: "Read it out loud: if the amount in E2 is over 500, show Review, otherwise show OK. Written down it looks like programming. Said out loud it is just a sentence." },
    { h: "The comparison operators" },
    {
      table: {
        cols: ["Written", "Means"], startRow: 1,
        rows: [
          ["=", "equal to"],
          [">", "greater than"],
          ["<", "less than"],
          [">=", "greater than or equal to"],
          ["<=", "less than or equal to"],
          ["<>", "not equal to"]
        ]
      }
    },
    { trap: "The difference between <span class='f'>&gt;</span> and <span class='f'>&gt;=</span> is one row in a hundred and it is always the row somebody queries. A threshold of over £500 excludes a transaction of exactly £500. A threshold of £500 and above includes it. Decide which the rule actually means before you write it, and write the rule down somewhere." },
    { h: "Text needs quotation marks. Numbers do not." },
    { p: "Any piece of text inside a formula must sit inside double quotation marks, because that is how Excel knows it is a value rather than a name." },
    { f: '=IF(C2="Leeds", 1, 0)        correct\n=IF(C2=Leeds, 1, 0)          #NAME?' },
    { p: "Without the quotation marks Excel goes looking for something called Leeds, finds nothing, and returns #NAME?. Numbers are never quoted: <span class='f'>=IF(E2&gt;500,...)</span>, not <span class='f'>=IF(E2&gt;\"500\",...)</span>." },
    { trap: 'A number in quotation marks becomes text, and text is always greater than any number in Excel\'s ordering. So <span class="f">=IF(E2&gt;"500","Review","OK")</span> returns OK for every row, including a transaction of ten thousand pounds. It never errors, and it is wrong for the whole column.' },
    { h: "Returning a number rather than a word" },
    { p: "The two outcomes do not have to be text. They can be numbers, or other formulas." },
    { f: '=IF(E2>500, E2*0.02, 0)' },
    { p: "That gives two per cent of the amount when it is over 500, and nothing otherwise. A column of these can then be totalled, which a column of the word Review cannot." },
    { pro: "If you will ever need to count or total the result, return numbers, not words. A 1 or 0 column can be summed to count the flags, averaged to get a rate, and charted. A Yes or No column can do none of those without extra work. Decide what the column is for before choosing what it returns." },
    { h: "An empty answer" },
    { p: 'Two double quotation marks with nothing between them, <span class="f">""</span>, mean empty text. <span class="f">=IF(E2&gt;500,"Review","")</span> leaves the cell looking blank when there is nothing to say, which makes the exceptions easy to spot down a long column.' },
    { trap: "The cell only looks blank. It contains a formula returning empty text, so ISBLANK says it is not blank and COUNTA counts it. That surprises people later, in Module 4." },
    { web: "Excel for the web colours each referenced cell as you type a formula and highlights the matching brackets, which is the fastest way to see whether your commas are in the right places. If a formula is rejected, it is nearly always a missing bracket or a comma in the wrong place." }
  ],
  reflect: [
    "Say the difference between &gt; and &gt;= in terms of a transaction of exactly £500.",
    "Look at your flag column and ask whether you would rather have 1 and 0 than Review and OK. What would that let you do next?"
  ],

  practice: function (seed) {
    const rows = txRows(seed, 20);
    const sh = txSheet("Transactions", rows, ["Flag", "Fee"]);
    const flagCells = [], feeCells = [];
    for (let i = 0; i < 20; i++) { flagCells.push("F" + (2 + i)); feeCells.push("G" + (2 + i)); }
    lockSheet(sh, flagCells.concat(feeCells));
    feeCells.forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });
    sh.rows = 22; sh.cols = 7;

    const over = rows.map(t => t.amount > 500);
    const lastIdx = 19;
    const feeAt = i => (rows[i].amount > 500 ? xround(rows[i].amount * 0.02, 2) : 0);
    const nOver = over.filter(Boolean).length;

    return {
      sheet: sh,
      maxRows: 22, maxCols: 7, colWidth: 92, startRow: 1, startCol: 5,
      formatBar: false, fillBar: true,
      highlight: flagCells.concat(feeCells),
      brief: {
        title: "Twenty payments, and a rule to apply to all of them",
        body: "Compliance policy: any payment <strong>over £500</strong> goes for review. Not £500 exactly, over it. " +
          "Add a flag column that applies that rule to every row, then a fee column that charges two per cent on the flagged ones only. " +
          "Write each formula once and fill it down."
      },
      hint: "Text inside a formula needs double quotation marks. Numbers do not. Use <strong>Fill down ↓</strong> after you have checked the first row.",
      tasks: [
        { id: "t1", text: 'In F2, show <strong>Review</strong> when the amount is over 500, and <strong>OK</strong> otherwise.', cell: "F2" },
        { id: "t2", text: "Fill F2 down to F21, then check the bottom row against the amount beside it.", cell: "F21" },
        { id: "t3", text: "In G2, charge a fee of two per cent of the amount, but only on payments over 500. Anything else should be 0.", cell: "G2" },
        { id: "t4", text: "Fill G2 down to G21.", cell: "G21" },
        { id: "t5", text: "Look down column F. How many say Review? Count them by eye for now; next session gives you a formula for it.", cell: null, ext: true }
      ],
      checks: [
        {
          cell: "F2", expect: over[0] ? "Review" : "OK", needFormula: true, mustUse: "IF",
          task: "F2: the review flag for the first payment.",
          answer: '=IF(E2>500,"Review","OK")',
          why: "The first payment is " + gbp(rows[0].amount) + ", so this returns " + (over[0] ? "Review" : "OK") + ". Both outcomes are text, so both are in quotation marks.",
          wrongWay: '<span class="f">=IF(E2>"500","Review","OK")</span>. The quotation marks turn 500 into text, and in Excel any text sorts above any number, so no amount is ever greater than it. Every row returns OK and nothing warns you.'
        },
        {
          cell: "F21", expect: over[lastIdx] ? "Review" : "OK", needFormula: true, mustUse: "IF",
          task: "F21: the flag on the last row, reached by filling.",
          answer: '=IF(E21>500,"Review","OK")',
          why: "The last payment is " + gbp(rows[lastIdx].amount) + ", so it is " + (over[lastIdx] ? "Review" : "OK") + ". Checking the bottom of a filled column is the habit from Module 2 and it applies to every column you ever fill.",
          wrongWay: "Locking the reference as <span class='f'>$E$2</span> out of caution. The whole column would then report on the first payment twenty times over."
        },
        {
          cell: "G2", expect: feeAt(0), needFormula: true, mustUse: "IF", tol: 0.005,
          task: "G2: a two per cent fee on flagged payments only.",
          answer: "=IF(E2>500,E2*0.02,0)",
          why: "The outcomes here are a calculation and a number, not text, so no quotation marks. Returning 0 rather than empty text matters: a column of numbers can be totalled, and a column with blanks in it cannot be averaged reliably.",
          wrongWay: '<span class="f">=IF(E2>500,E2*0.02,"")</span>. It looks tidier and it makes the column half text, so any later total silently skips the empty ones and any average is over the wrong count.'
        },
        {
          cell: "G21", expect: feeAt(lastIdx), needFormula: true, mustUse: "IF", tol: 0.005,
          task: "G21: the last fee, reached by filling.",
          answer: "=IF(E21>500,E21*0.02,0)",
          why: "Every reference moved down nineteen rows together, which is what you want when the whole formula is about one row. Nothing here should be locked.",
          wrongWay: "Writing the 0.02 rate into twenty formulas. If the fee changes, put it in its own cell and lock the reference, exactly as you did with VAT in Module 2. This exercise keeps it inline only because it is a one-off."
        }
      ]
    };
  },
  workbook: function (seed) {
    const wb = new Workbook("M3S1");
    wb.add(M3S1.practice(seed).sheet);
    return wb;
  }
};

/* ============================================================
   Session 2
   ============================================================ */
const M3S2 = {
  title: "More than two outcomes: IFS, AND, OR",
  aim: "Sort rows into three or four bands, and test two conditions at once.",
  why: "Real rules are rarely yes or no. They are low, medium and high; or over a threshold <em>and</em> from a particular place. Two tools cover almost all of it, and one of them has an ordering trap that silently ruins the answer.",
  concepts: ["m3.nested", "m3.ifs", "m3.ifsorder", "m3.andor"],
  unlocks: ["IFS", "AND", "OR", "NOT"],
  lesson: [
    { lead: "You can put an IF inside another IF, and you should stop doing it as soon as you learn IFS." },
    { h: "Nested IF" },
    { p: "The false part of an IF can be another IF. That gives three outcomes from two tests." },
    { f: '=IF(E2>1000,"High",IF(E2>500,"Medium","Low"))' },
    { p: "If it is over 1000, High. Otherwise ask a second question: if it is over 500, Medium, otherwise Low. It works, and with four or five bands it becomes a wall of brackets that nobody can read or check." },
    { h: "IFS is the same thing, readable" },
    { f: '=IFS(E2>1000,"High", E2>500,"Medium", TRUE,"Low")' },
    { p: "Pairs, all the way along: a test, then what to return if it is true. The first test that comes out true wins and the rest are never looked at." },
    { p: "The final <span class='f'>TRUE</span> is a catch-all. TRUE is always true, so anything that reached the end lands there. Without it, a value matching none of the tests returns #N/A." },
    { trap: "The order is the whole formula. Put the smallest test first and it captures everything: <span class='f'>=IFS(E2&gt;500,\"Medium\", E2&gt;1000,\"High\", TRUE,\"Low\")</span> never returns High, because anything over 1000 is also over 500 and the first match wins. It does not error. Every large transaction is quietly labelled Medium." },
    { pro: "Write the bands from the extreme inwards: highest test first when the tests use greater-than, lowest first when they use less-than. Then check one row from each band by hand before you fill it down." },
    { h: "AND and OR" },
    { p: "These take several tests and reduce them to one true or false, which you then hand to an IF." },
    {
      ul: [
        "<span class='f'>AND(a, b)</span> is true only when every test is true.",
        "<span class='f'>OR(a, b)</span> is true when at least one test is true.",
        "<span class='f'>NOT(a)</span> flips it."
      ]
    },
    { f: '=IF(AND(E2>500, C2="Leeds"), "Priority", "")' },
    { p: "Over 500 and from Leeds. Both must hold. Swap AND for OR and it flags anything that is either over 500 or from Leeds, which is a very different and much longer list." },
    { why: "The English word <em>and</em> is where this goes wrong. Somebody asks for payments from Leeds and Bristol, meaning both cities in the list. Written as <span class='f'>AND(C2=\"Leeds\", C2=\"Bristol\")</span> it returns nothing at all, because no single row can be both. What they meant was OR. Read the rule back as a test on one row: can this row be both things at once?" },
    { pro: "For more than about three OR conditions on the same column, stop and use a different approach. Module 5 has lookups against a list, which is what you actually want when the rule is really a list of accepted values." },
    { web: "IFS, AND and OR all work in Excel for the web. The desktop version adds SWITCH, which is neater when you are matching exact values rather than ranges; the web version has it too now, but it is not worth learning until you meet a case that needs it." }
  ],
  reflect: [
    "Say what happens to a £2,000 transaction if the Medium test comes before the High test.",
    "Take one rule you have been given in words and say whether it means AND or OR, by asking whether one row could satisfy both parts."
  ],

  practice: function (seed) {
    const rows = txRows(seed, 20);
    const sh = txSheet("Banding", rows, ["Band", "Priority"]);
    const bandCells = [], prioCells = [];
    for (let i = 0; i < 20; i++) { bandCells.push("F" + (2 + i)); prioCells.push("G" + (2 + i)); }
    lockSheet(sh, bandCells.concat(prioCells));
    sh.rows = 22; sh.cols = 7;

    const band = a => (a > 1000 ? "High" : (a > 500 ? "Medium" : "Low"));
    const prio = t => (t.amount > 500 && t.city === "Leeds") ? "Priority" : "";
    /* pick a row that actually lands in the High band, for the answer key note */
    const highIdx = rows.findIndex(t => t.amount > 1000);

    return {
      sheet: sh,
      maxRows: 22, maxCols: 7, colWidth: 92, startRow: 1, startCol: 5,
      formatBar: false, fillBar: true,
      highlight: bandCells.concat(prioCells),
      brief: {
        title: "Three bands and a two-part rule",
        body: "The same twenty payments. Policy now has three bands: <strong>over £1,000 is High</strong>, " +
          "<strong>over £500 is Medium</strong>, everything else is <strong>Low</strong>. " +
          "Separately, anything <strong>over £500 that also comes from Leeds</strong> is marked Priority. " +
          "Get the order of the bands right, and read the second rule carefully before you write it."
      },
      hint: "In IFS the first test that comes out true wins, so the order matters more than anything else in this exercise. Finish with <span class='f'>TRUE</span> as a catch-all.",
      tasks: [
        { id: "t1", text: "In F2, band the payment as High, Medium or Low. Think about which test has to come first.", cell: "F2" },
        { id: "t2", text: "Fill F2 down to F21. Now find a payment over £1,000 and confirm it says High, not Medium.", cell: "F21" },
        { id: "t3", text: 'In G2, show <strong>Priority</strong> when the payment is over £500 <em>and</em> from Leeds, and leave it empty otherwise.', cell: "G2" },
        { id: "t4", text: "Fill G2 down to G21.", cell: "G21" },
        { id: "t5", text: "Change the Priority rule to Leeds <em>or</em> Bristol, over £500, and watch how much longer the list gets. Then put it back.", cell: null, ext: true }
      ],
      checks: [
        {
          cell: "F2", expect: band(rows[0].amount), needFormula: true, mustUse: ["IFS", "IF"],
          task: "F2: the band for the first payment.",
          answer: '=IFS(E2>1000,"High", E2>500,"Medium", TRUE,"Low")',
          why: "The first payment is " + gbp(rows[0].amount) + ", so it is " + band(rows[0].amount) + ". The nested form <span class='f'>=IF(E2>1000,\"High\",IF(E2>500,\"Medium\",\"Low\"))</span> is equally correct and harder to read once there are four bands.",
          wrongWay: 'Putting the Medium test first. <span class="f">=IFS(E2>500,"Medium", E2>1000,"High", TRUE,"Low")</span> never returns High at all, because everything over 1000 is also over 500 and the first match wins. It produces a full column of plausible answers and no error.'
        },
        {
          cell: "F21", expect: band(rows[19].amount), needFormula: true, mustUse: ["IFS", "IF"],
          task: "F21: the band on the last row.",
          answer: '=IFS(E21>1000,"High", E21>500,"Medium", TRUE,"Low")',
          why: "The last payment is " + gbp(rows[19].amount) + ", so " + band(rows[19].amount) + "." +
            (highIdx >= 0 ? " Check row " + (highIdx + 2) + " as well, at " + gbp(rows[highIdx].amount) + ": it must read High. If it says Medium, your tests are in the wrong order." : ""),
          wrongWay: "Leaving off the final TRUE. Anything that fails every test returns #N/A, which at least shows up, unlike the ordering mistake."
        },
        {
          cell: "G2", expect: prio(rows[0]), needFormula: true, mustUse: "AND",
          task: "G2: the Priority flag.",
          answer: '=IF(AND(E2>500,C2="Leeds"),"Priority","")',
          why: "Both conditions must hold on the same row, so AND. The first payment is " + gbp(rows[0].amount) + " from " + rows[0].city + ", so it is " + (prio(rows[0]) === "Priority" ? "Priority" : "left empty") + ".",
          wrongWay: 'Using OR, which flags every Leeds payment however small, plus every large payment from anywhere. Ask whether one row has to satisfy both parts. Here it does, so AND.'
        },
        {
          cell: "G21", expect: prio(rows[19]), needFormula: true, mustUse: "AND",
          task: "G21: the Priority flag on the last row.",
          answer: '=IF(AND(E21>500,C21="Leeds"),"Priority","")',
          why: "Row 21 is " + gbp(rows[19].amount) + " from " + rows[19].city + ". City comparisons ignore capitalisation in Excel, so leeds and LEEDS would both match.",
          wrongWay: 'Writing <span class="f">=IF(AND(C21="Leeds",C21="Bristol"),...)</span> when asked for Leeds and Bristol. No row can be both cities, so it returns nothing at all. The word and in English often means OR in a formula.'
        }
      ]
    };
  },
  workbook: function (seed) {
    const wb = new Workbook("M3S2");
    wb.add(M3S2.practice(seed).sheet);
    return wb;
  }
};

/* ============================================================
   Session 3
   ============================================================ */
const M3S3 = {
  title: "Counting with conditions",
  aim: "Answer questions like how many transactions over £500 happened in March, in one cell, without touching the data.",
  why: "This is the first thing anyone will ask you to do with a spreadsheet in a job, and it is the question a filter can answer once but a formula answers permanently and updates itself.",
  concepts: ["m3.countif", "m3.criteria", "m3.countifs", "m3.wildcard"],
  unlocks: ["COUNTIF", "COUNTIFS"],
  lesson: [
    { lead: "COUNTIF counts the rows that match one condition. COUNTIFS counts the rows that match several." },
    { f: '=COUNTIF(where to look, what to look for)' },
    { f: '=COUNTIF(C2:C500, "Leeds")           how many Leeds rows\n=COUNTIF(E2:E500, ">500")            how many over 500' },
    { h: "The awkward part: criteria go in quotation marks" },
    { p: "A plain value can be written bare or quoted. A comparison must be quoted, all of it, operator included." },
    { f: '=COUNTIF(E2:E500, ">500")            correct\n=COUNTIF(E2:E500, >500)              rejected' },
    { why: "The whole criterion is a single instruction handed to the function as one piece of text, so the operator has to travel inside the quotation marks with the number. It reads oddly and it is the thing beginners get wrong most often with this family of functions." },
    { h: "Comparing against a cell" },
    { p: "Hard-coding 500 into the formula is the Module 2 mistake again. Put the threshold in a cell and join it on with an ampersand." },
    { f: '=COUNTIF(E2:E500, ">"&$H$1)' },
    { p: "The ampersand joins the text <span class='f'>&gt;</span> to whatever is in H1, producing the criterion. Now the threshold is visible on the sheet and changing it re-answers the question. The dollar signs are there because this formula might be filled." },
    { h: "COUNTIFS: several conditions at once" },
    { p: "Pairs again: a range, then the criterion for that range, repeated." },
    { f: '=COUNTIFS(E2:E500, ">500",\n          D2:D500, ">="&$B$24,\n          D2:D500, "<="&$B$25)' },
    { p: "How many payments over £500 fell in March. Every condition must hold on the same row for that row to be counted. Ranges are used more than once here, which is normal: the date column is tested twice to make a window." },
    { trap: "Every range in a COUNTIFS must be the same size. Mixing <span class='f'>E2:E500</span> with <span class='f'>D2:D499</span> gives #VALUE!, which at least announces itself. Mixing <span class='f'>E2:E500</span> with <span class='f'>D3:D501</span> is the same size and silently compares each amount against the wrong row's date." },
    { h: "Dates need a window, not a month name" },
    { p: "There is no way to say in March directly, because a date is a day count and knows nothing about months. You give it a start and an end and count what falls between. Put both dates in cells, format them as dates, and refer to them." },
    { pro: "Never type a date inside a criterion string. Regional settings decide whether 03/04/2024 is March or April, and the formula will quietly give a different answer on a colleague's machine. A cell reference has no such ambiguity." },
    { h: "Wildcards for partial text" },
    {
      ul: [
        "<span class='f'>*</span> stands for any number of characters. <span class='f'>\"*Ltd\"</span> matches anything ending in Ltd.",
        "<span class='f'>?</span> stands for exactly one character. <span class='f'>\"B?ll\"</span> matches Bell and Ball but not Bill Smith.",
        "To search for a literal asterisk, put a tilde in front of it: <span class='f'>\"~*\"</span>."
      ]
    },
    { p: "Wildcards work on text only. They do nothing on a column of numbers or dates." },
    { trap: "COUNTIF ignores capitalisation, so Leeds and LEEDS both match. It does not ignore spaces. A supplier stored as <span class='f'>Redgate Supplies </span> with a trailing space will not match <span class='f'>\"Redgate Supplies\"</span>, and your count will be short by however many rows have that flaw. Module 4 is about finding and fixing exactly this." },
    { web: "The status bar at the bottom of Excel shows a count of selected non-empty cells, which is a quick sanity check on a COUNTIF you have just written. Select the column, read the count, and see whether your formula is in the right region." }
  ],
  reflect: [
    "Say why the operator has to go inside the quotation marks.",
    "If your March count looked low, what would you check first? The answer involves Module 1."
  ],

  practice: function (seed) {
    const rows = txRows(seed, 24);
    const sh = txSheet("Counting", rows, []);
    const first = 2, last = 1 + rows.length;
    const R = r => r + first - 1;

    const base = rows.length + 3;                 // first free row after the data
    label(sh, "A" + (base), "Reference values");
    note(sh, "A" + (base + 1), "Threshold");
    put(sh, "B" + (base + 1), 500, { locked: true, fmt: GBP2 });
    note(sh, "A" + (base + 2), "March starts");
    put(sh, "B" + (base + 2), MAR_START, { locked: true, fmt: DATEFMT });
    note(sh, "A" + (base + 3), "March ends");
    put(sh, "B" + (base + 3), MAR_END, { locked: true, fmt: DATEFMT });

    label(sh, "A" + (base + 5), "Answers");
    /* Short labels: the grid columns are narrow and the full wording
       is already in the task list above the sheet. */
    const qs = ["Over threshold", "In March", "Both", "From Leeds", "Ends in Ltd"];
    qs.forEach((q, i) => note(sh, "A" + (base + 6 + i), q));
    const ansCells = qs.map((q, i) => "C" + (base + 6 + i));
    lockSheet(sh, ansCells);
    sh.rows = base + 6 + qs.length + 1;
    sh.cols = 5;

    const amtR = "E" + first + ":E" + last;
    const datR = "D" + first + ":D" + last;
    const citR = "C" + first + ":C" + last;
    const supR = "B" + first + ":B" + last;
    const thr = "B" + (base + 1), ms = "B" + (base + 2), me = "B" + (base + 3);

    const eOver = solve(sh, '=COUNTIF(' + amtR + ',">"&' + thr + ')');
    const eMar = solve(sh, '=COUNTIFS(' + datR + ',">="&' + ms + ',' + datR + ',"<="&' + me + ')');
    const eBoth = solve(sh, '=COUNTIFS(' + amtR + ',">"&' + thr + ',' + datR + ',">="&' + ms + ',' + datR + ',"<="&' + me + ')');
    const eLeeds = solve(sh, '=COUNTIF(' + citR + ',"Leeds")');
    const eLtd = solve(sh, '=COUNTIF(' + supR + ',"*Ltd")');

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 5, startRow: base + 5, startCol: 2,
      formatBar: false,
      brief: {
        title: "Five questions, five cells, no filtering",
        body: "Twenty-four payments. Answer each question with a single formula that reads the data where it sits. " +
          "The threshold and the March dates are in cells below the data; point at those rather than typing the values into your formulas, " +
          "so that changing the threshold re-answers every question at once."
      },
      hint: "Criteria go inside quotation marks, operator included. To compare against a cell, join them with an ampersand: <span class='f'>\">\"&amp;$B$" + (base + 1) + "</span>.",
      tasks: [
        { id: "t1", text: "How many payments are over the threshold?", cell: ansCells[0] },
        { id: "t2", text: "How many payments fell in March? You need two conditions on the date column: on or after the start, and on or before the end.", cell: ansCells[1] },
        { id: "t3", text: "How many were over the threshold <em>and</em> in March?", cell: ansCells[2] },
        { id: "t4", text: "How many payments came from Leeds?", cell: ansCells[3] },
        { id: "t5", text: "How many suppliers have a name ending in <strong>Ltd</strong>? Use a wildcard.", cell: ansCells[4], ext: true }
      ],
      checks: [
        {
          cell: ansCells[0], expect: eOver, needFormula: true, mustUse: "COUNTIF",
          task: "Payments over the threshold.",
          answer: '=COUNTIF(' + amtR + ',">"&' + thr + ')',
          why: "The ampersand joins the greater-than sign to the value in " + thr + ", building the criterion \">500\". Change the threshold cell and this answer changes with it, which is the whole point of not typing 500 into the formula.",
          wrongWay: '<span class="f">=COUNTIF(' + amtR + ',>' + '500)</span> without quotation marks, which Excel rejects, or <span class="f">">500"</span> typed literally, which works today and hides the threshold from anyone reading the sheet.'
        },
        {
          cell: ansCells[1], expect: eMar, needFormula: true, mustUse: "COUNTIFS",
          task: "Payments in March.",
          answer: '=COUNTIFS(' + datR + ',">="&' + ms + ',' + datR + ',"<="&' + me + ')',
          why: "The same date range appears twice, once for each end of the window. That is normal and it is how you express between in this family of functions. Note it is >= and <=, so payments on the first and last of March are included.",
          wrongWay: 'Typing the dates into the criteria as text, such as <span class="f">">=01/03/2024"</span>. Whether that means March or April depends on regional settings, so the formula gives a different answer on a colleague\'s machine and neither of you can see why.'
        },
        {
          cell: ansCells[2], expect: eBoth, needFormula: true, mustUse: "COUNTIFS",
          task: "Over the threshold and in March.",
          answer: '=COUNTIFS(' + amtR + ',">"&' + thr + ',' + datR + ',">="&' + ms + ',' + datR + ',"<="&' + me + ')',
          why: "Three conditions, all of which must hold on the same row. This is the question from the course outline, and it is the shape of most real analysis requests: a value test and a time window.",
          wrongWay: "Answering with the smaller of the two previous counts. Conditions combine by intersection, not by taking a minimum, and there is no way to reason the answer out from the other two figures."
        },
        {
          cell: ansCells[3], expect: eLeeds, needFormula: true, mustUse: "COUNTIF",
          task: "Payments from Leeds.",
          answer: '=COUNTIF(' + citR + ',"Leeds")',
          why: "A plain text criterion, quoted. Capitalisation is ignored, so LEEDS would match too. Spaces are not ignored, which is the failure mode to watch for on real data.",
          wrongWay: "Filtering the column and reading the count off the status bar. That answers it once. This cell answers it every time the data changes, and it leaves a record of what was asked."
        },
        {
          cell: ansCells[4], ext: true, expect: eLtd, needFormula: true, mustUse: "COUNTIF",
          task: "Suppliers whose name ends in Ltd.",
          answer: '=COUNTIF(' + supR + ',"*Ltd")',
          why: "The asterisk stands for any number of characters, so this matches anything finishing with Ltd. Putting it at the other end, <span class='f'>\"Ltd*\"</span>, would match names that begin with it, which is a different and much smaller list.",
          wrongWay: 'Writing <span class="f">"Ltd"</span> with no wildcard, which matches only a supplier called exactly Ltd and returns zero. A zero from a COUNTIF is worth a second look, because a missing wildcard and a genuine absence look identical.'
        }
      ]
    };
  },
  workbook: function (seed) {
    const wb = new Workbook("M3S3");
    wb.add(M3S3.practice(seed).sheet);
    return wb;
  }
};

/* ============================================================
   Session 4
   ============================================================ */
const M3S4 = {
  title: "Totalling and averaging with conditions",
  aim: "Move from how many to how much, and handle the case where the answer is nothing at all.",
  why: "Counting tells you the shape of a problem. Totalling tells you the size of it. The two together are most of what a junior analyst is asked for.",
  concepts: ["m3.sumif", "m3.sumifs", "m3.argorder", "m3.iferror"],
  unlocks: ["SUMIF", "SUMIFS", "AVERAGEIF", "AVERAGEIFS", "IFERROR", "IFNA"],
  lesson: [
    { lead: "SUMIFS is COUNTIFS with one extra argument, and that argument is in a different place from where you expect." },
    { h: "The argument order, which catches everybody once" },
    { f: '=SUMIF (range to test, criterion, range to add)      the range to add comes LAST\n=SUMIFS(range to add, range to test, criterion, ...)  the range to add comes FIRST' },
    { p: "That is not a typo. SUMIF and SUMIFS put the range being added at opposite ends. There is no logic to it; the functions were written years apart." },
    { pro: "Use SUMIFS always, even for a single condition. It is one character longer, it puts the thing being added first where you can see it, and you never have to remember which form you are in. Almost every experienced user has stopped using SUMIF entirely, and the only reason to recognise it is that you will meet it in other people's sheets." },
    { f: '=SUMIFS(E2:E500, C2:C500, "Leeds")\n=SUMIFS(E2:E500, E2:E500, ">500", D2:D500, ">="&$B$24, D2:D500, "<="&$B$25)' },
    { p: "The second one totals the payments over £500 that fell in March. Notice the amount column appears twice: once as the thing being added, once as a thing being tested. That is allowed and it is common." },
    { h: "AVERAGEIFS, and the answer that does not exist" },
    { p: "AVERAGEIFS works the same way. It has one behaviour worth knowing in advance: when nothing matches, there is nothing to average, so it returns #DIV/0!." },
    { p: "That is correct. There is no average of no numbers, and returning 0 would be a lie, because 0 is a real average that some data could genuinely produce. Excel refuses to invent one." },
    { trap: "SUMIFS in the same situation returns 0, because the total of nothing genuinely is nothing. So a summary table can show a 0 total and a #DIV/0! average side by side on the same row and both are right. This confuses people badly the first time." },
    { h: "IFERROR, and when not to use it" },
    { f: '=IFERROR(AVERAGEIFS(E2:E500,C2:C500,"Hull"), "no payments")' },
    { p: "If the formula errors, show your message instead. Useful at the end of a piece of work, on a summary somebody else will read, where a row of #DIV/0! looks broken even though it is not." },
    { why: "The danger is that IFERROR hides every error, not just the one you were expecting. Wrap it around a formula with a typo in a range and you get your tidy message instead of the #REF! that would have told you. Add it last, once the formula is right, and never while you are still debugging." },
    { pro: "Prefer IFNA when the error you expect is a lookup failure, which arrives in Module 5. It catches only #N/A and lets genuine breakage still show. IFERROR is the blunt instrument; IFNA is the scalpel." },
    { h: "Building a summary table" },
    { p: "The pattern that does most of the work in a junior analyst's week: put the categories down the left, write one formula, and fill it down against them." },
    { f: '=SUMIFS($E$2:$E$500, $C$2:$C$500, A30)' },
    { p: "The data ranges are locked so they do not drift as the formula fills. The criterion points at the label beside it, which does move. That is the mixed use of dollar signs from Module 2, doing real work." },
    { web: "Everything here works in Excel for the web. A summary table like this is also exactly what a pivot table builds in about four clicks, which is Module 6. Learn the formulas first: pivot tables are faster, and when one gives you a number you did not expect, the formulas are how you find out why." }
  ],
  reflect: [
    "Say where the range being added goes in SUMIF, and where it goes in SUMIFS.",
    "Why does SUMIFS return 0 where AVERAGEIFS returns an error? Both are right."
  ],

  practice: function (seed) {
    const rows = txRows(seed, 24);
    const sh = txSheet("Totalling", rows, []);
    const first = 2, last = 1 + rows.length;
    const base = rows.length + 3;

    label(sh, "A" + base, "Reference values");
    note(sh, "A" + (base + 1), "Threshold");
    put(sh, "B" + (base + 1), 500, { locked: true, fmt: GBP2 });
    note(sh, "A" + (base + 2), "March starts");
    put(sh, "B" + (base + 2), MAR_START, { locked: true, fmt: DATEFMT });
    note(sh, "A" + (base + 3), "March ends");
    put(sh, "B" + (base + 3), MAR_END, { locked: true, fmt: DATEFMT });

    const cityStart = base + 5;
    label(sh, "A" + cityStart, "Total by city");
    const cities = ["Leeds", "London", "Bristol", "Manchester", "Newcastle", "Hull"];
    cities.forEach((c, i) => note(sh, "A" + (cityStart + 1 + i), c));
    const cityCells = cities.map((c, i) => "B" + (cityStart + 1 + i));
    cityCells.forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });

    const qStart = cityStart + cities.length + 3;
    label(sh, "A" + qStart, "Summary");
    const qs = ["Over threshold, March", "Average, Leeds", "Average, Hull"];
    qs.forEach((q, i) => note(sh, "A" + (qStart + 1 + i), q));
    const qCells = qs.map((q, i) => "C" + (qStart + 1 + i));
    qCells.forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });

    lockSheet(sh, cityCells.concat(qCells));
    sh.rows = qStart + qs.length + 2;
    sh.cols = 5;

    const amtR = "$E$" + first + ":$E$" + last;
    const datR = "$D$" + first + ":$D$" + last;
    const citR = "$C$" + first + ":$C$" + last;
    const thr = "$B$" + (base + 1), ms = "$B$" + (base + 2), me = "$B$" + (base + 3);

    const eCity = cities.map((c, i) => solve(sh, "=SUMIFS(" + amtR + "," + citR + ",A" + (cityStart + 1 + i) + ")"));
    const eBoth = solve(sh, '=SUMIFS(' + amtR + ',' + amtR + ',">"&' + thr + ',' + datR + ',">="&' + ms + ',' + datR + ',"<="&' + me + ')');
    const eLeeds = solve(sh, '=AVERAGEIFS(' + amtR + ',' + citR + ',"Leeds")');

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 5, startRow: cityStart, startCol: 1,
      formatBar: false, fillBar: true,
      highlight: cityCells.concat(qCells),
      brief: {
        title: "How much, not just how many",
        body: "The same twenty-four payments. Build a total by city using <strong>one formula filled down</strong>, " +
          "which means thinking about which references must be locked. Then answer three summary questions. " +
          "One of the cities has no payments at all, and what happens there is the point of the last task."
      },
      hint: "Lock the data ranges with dollar signs so they do not drift as the formula fills. Let the criterion point at the city name beside it, which should move.",
      tasks: [
        { id: "t1", text: "In " + cityCells[0] + ", total the payments from the city named beside it. Write it so it can be filled down the whole list.", cell: cityCells[0] },
        { id: "t2", text: "Fill it down to " + cityCells[cityCells.length - 1] + ". Check the bottom one still points at the full data range.", cell: cityCells[4] },
        { id: "t3", text: "Look at the Hull row. It should be <strong>0</strong>, and that is correct: there are no Hull payments, so the total of them is nothing.", cell: cityCells[5] },
        { id: "t4", text: "In " + qCells[0] + ", total the payments over the threshold that fell in March.", cell: qCells[0] },
        { id: "t5", text: "In " + qCells[1] + ", the average payment from Leeds.", cell: qCells[1] },
        { id: "t6", text: "In " + qCells[2] + ", the average payment from Hull. It will error. Then wrap it so it reads <strong>no payments</strong> instead.", cell: qCells[2], ext: true }
      ],
      checks: [
        {
          cell: cityCells[0], expect: eCity[0], needFormula: true, mustUse: "SUMIFS", tol: 0.005,
          task: "Total for the first city.",
          answer: "=SUMIFS(" + amtR + "," + citR + ",A" + (cityStart + 1) + ")",
          why: "The range being added comes first in SUMIFS. The data ranges are locked so they stay put as the formula fills; the criterion points at the label beside it and moves down with each row, which is exactly the mixed use of dollar signs from Module 2.",
          wrongWay: 'Writing the city name into the formula as <span class="f">"Leeds"</span>. It works for one row and then you are writing six different formulas instead of filling one, and none of them updates if a label changes.'
        },
        {
          cell: cityCells[4], expect: eCity[4], needFormula: true, mustUse: "SUMIFS", tol: 0.005,
          task: "Total for the fifth city, reached by filling.",
          answer: "=SUMIFS(" + amtR + "," + citR + ",A" + (cityStart + 5) + ")",
          why: "Both data ranges are unchanged from the first row and only the criterion moved. If the ranges have drifted down, the dollar signs are missing and the lower rows are searching a shorter and shorter slice of the data.",
          wrongWay: "Locking the criterion as well. Every row would then report the first city's total, six times over, and the labels beside them would make it look correct at a glance."
        },
        {
          cell: cityCells[5], expect: 0, needFormula: true, mustUse: "SUMIFS",
          task: "Total for Hull.",
          answer: "=SUMIFS(" + amtR + "," + citR + ",A" + (cityStart + 6) + ")",
          why: "Zero, and that is the right answer rather than a failure. There are no Hull payments and the total of nothing is nothing. Compare this against the average of the same empty set in the last task.",
          wrongWay: "Deleting the row because it looks empty. A zero against a category you expected to see is information, and it is often the most interesting line in a summary."
        },
        {
          cell: qCells[0], expect: eBoth, needFormula: true, mustUse: "SUMIFS", tol: 0.005,
          task: "Total over the threshold, in March.",
          answer: '=SUMIFS(' + amtR + ',' + amtR + ',">"&' + thr + ',' + datR + ',">="&' + ms + ',' + datR + ',"<="&' + me + ')',
          why: "The amount column appears twice: once as the thing being totalled, once as a thing being tested. That is allowed and normal. Last session counted these payments; this totals them, and the two figures answer very different questions.",
          wrongWay: "Using SUMIF for this. SUMIF takes one condition only, and its arguments are in the opposite order, so an attempt to bolt a second condition on gives either an error or a confidently wrong number."
        },
        {
          cell: qCells[1], expect: eLeeds, needFormula: true, mustUse: "AVERAGEIFS", tol: 0.005,
          task: "Average payment from Leeds.",
          answer: '=AVERAGEIFS(' + amtR + ',' + citR + ',"Leeds")',
          why: "Same shape as SUMIFS: the range being averaged first, then range and criterion pairs. Worth comparing against the Leeds total above it, because an average and a total can point in opposite directions when one city has many small payments and another has few large ones.",
          wrongWay: "Dividing the Leeds total by 24. The denominator is the number of Leeds payments, not the number of rows, and getting that wrong is one of the most common errors in a hand-built summary."
        },
        {
          cell: qCells[2], ext: true, expect: "no payments", needFormula: true, mustUse: "IFERROR",
          task: "Average payment from Hull, made readable.",
          answer: '=IFERROR(AVERAGEIFS(' + amtR + ',' + citR + ',"Hull"),"no payments")',
          why: "Without the wrapper this is #DIV/0!, which is correct: there is no average of no numbers, and returning 0 would be a lie because 0 is an average some data could genuinely produce. IFERROR replaces it with something a reader understands. Note that the SUMIFS row above returns 0 for the same city, and both answers are right.",
          wrongWay: "Adding IFERROR while you are still building the formula. It would hide a mistyped range just as willingly as the error you expected, and you would have no idea the formula was broken. Add it last, once the formula is known to work."
        }
      ]
    };
  },
  workbook: function (seed) {
    const wb = new Workbook("M3S4");
    wb.add(M3S4.practice(seed).sheet);
    return wb;
  }
};

/* ============================================================
   Register
   ============================================================ */
defModule({
  id: "m3", n: 3, stage: "s1",
  title: "Logic and conditions",
  subtitle: "IF, IFS, AND, OR, COUNTIFS, SUMIFS",
  blurb: "Where analysis starts. Formulas that judge a row rather than just calculating it, and the conditional counting and totalling that answers most of what a junior analyst gets asked.",
  onComplete: "You can now answer a real question about a real dataset without touching the data: how many, how much, under what conditions. From here the exercises deliberately mix in earlier modules, because that is how the work actually arrives.",
  concepts: [
    { id: "m3.if", label: "IF: test, then, otherwise", blurb: "Three parts, separated by commas." },
    { id: "m3.quotes", label: "Text needs quotation marks", blurb: "And a quoted number stops being a number." },
    { id: "m3.compareop", label: "Comparison operators", blurb: "The difference between > and >= is always the queried row." },
    { id: "m3.ifnumber", label: "Return numbers, not words", blurb: "A 1 and 0 column can be counted, charted and totalled." },
    { id: "m3.nested", label: "Nested IF", blurb: "An IF inside the otherwise part of another IF." },
    { id: "m3.ifs", label: "IFS for several bands", blurb: "Pairs of test and result, with TRUE as a catch-all." },
    { id: "m3.ifsorder", label: "The order of IFS decides the answer", blurb: "The first test that is true wins, silently." },
    { id: "m3.andor", label: "AND against OR", blurb: "Ask whether one row could satisfy both parts." },
    { id: "m3.countif", label: "COUNTIF", blurb: "How many rows match one condition." },
    { id: "m3.criteria", label: "Criteria are quoted, operator included", blurb: "And a threshold belongs in a cell, joined with &." },
    { id: "m3.countifs", label: "COUNTIFS and date windows", blurb: "The same range twice, to express between." },
    { id: "m3.wildcard", label: "Wildcards in criteria", blurb: "* for any characters, ? for exactly one." },
    { id: "m3.sumif", label: "SUMIFS over SUMIF", blurb: "One character longer and impossible to get backwards." },
    { id: "m3.sumifs", label: "Totalling with conditions", blurb: "The column being added can also be a column being tested." },
    { id: "m3.argorder", label: "The argument order trap", blurb: "SUMIF puts the sum range last, SUMIFS puts it first." },
    { id: "m3.iferror", label: "IFERROR, added last", blurb: "It hides every error, not only the one you expected." }
  ],
  sessions: [M3S1, M3S2, M3S3, M3S4]
});
