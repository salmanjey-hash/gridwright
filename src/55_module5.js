/* ============================================================
   Module 5: Lookups
   Three sessions. XLOOKUP is taught first because it is what you
   should use; VLOOKUP second because interviews still ask for it;
   INDEX and MATCH once, honestly.

   From this module the instructions get shorter. You have the
   habits now, and being told every keystroke past this point
   trains you to follow rather than to think.
   ============================================================ */

const M5_MASTER = [
  { code: "SUP-101", name: "Redgate Supplies", risk: "Low" },
  { code: "SUP-102", name: "Halden & Co", risk: "Medium" },
  { code: "SUP-103", name: "Northwood Ltd", risk: "Low" },
  { code: "SUP-104", name: "Peak Trading", risk: "High" },
  { code: "SUP-105", name: "Mersey Print", risk: "Medium" },
  { code: "SUP-106", name: "Calder Foods", risk: "Low" },
  { code: "SUP-107", name: "Ashby Motors", risk: "High" }
];

/* Write the supplier master below the transactions, as a second block
   on the same sheet. In a real workbook it would sit on its own sheet
   and be written Suppliers!A:C; the practice grid keeps everything in
   one place so the ranges stay readable. */
function writeMaster(sh, startRow, codes, extraHead) {
  const r0 = startRow - 1;
  label(sh, "A" + startRow, "Supplier master");
  sh.set(r0 + 1, 0, "Code", { hdr: true, locked: true });
  sh.set(r0 + 1, 1, "Supplier", { hdr: true, locked: true });
  sh.set(r0 + 1, 2, "Risk", { hdr: true, locked: true });
  if (extraHead) sh.set(r0 + 1, 3, extraHead, { hdr: true, locked: true });
  M5_MASTER.forEach((m, i) => {
    sh.set(r0 + 2 + i, 0, codes ? codes[i] : m.code, { locked: true });
    sh.set(r0 + 2 + i, 1, m.name, { locked: true });
    sh.set(r0 + 2 + i, 2, m.risk, { locked: true });
  });
  return { first: startRow + 2, last: startRow + 1 + M5_MASTER.length };
}

/* ============================================================
   Session 1
   ============================================================ */
const M5S1 = {
  title: "XLOOKUP: pulling one table's facts into another",
  aim: "Join two tables on a shared code, so a transaction log can show supplier names and risk ratings that were never in it.",
  why: "Real data always arrives split across tables, because storing the supplier's name against every one of their four thousand transactions would be madness. Joining them back together on demand is the most-used skill in this course after pivot tables.",
  concepts: ["m5.lookupidea", "m5.xlookup", "m5.lockarrays", "m5.returnrange"],
  unlocks: ["XLOOKUP"],
  lesson: [
    { lead: "A lookup answers one question: I have this code, what else do you know about it?" },
    { p: "A transaction log holds a supplier code because a code is short, stable and unambiguous. The supplier's name, city and risk rating live in a separate table, once each. A lookup is how you bring the second table's facts alongside the first table's rows, without either table storing the other's data." },
    { why: "This is not an Excel idea, it is how all data is organised. Store each fact once, in the place it belongs, and refer to it by a key. Duplicating the supplier name against every transaction guarantees that one day half the rows say Redgate Supplies and half say Redgate Supplies Ltd, and no one can tell which is right." },
    { h: "The shape of XLOOKUP" },
    { f: "=XLOOKUP(what to find, where to look, what to bring back)" },
    { f: "=XLOOKUP(C2, $A$17:$A$23, $B$17:$B$23)" },
    { p: "Find the code from C2 somewhere in the master's code column, and return whatever sits in the same position of the master's supplier column. Three arguments, in the order you would say them." },
    { h: "Two things it gets right that older lookups do not" },
    {
      ul: [
        "It matches <strong>exactly</strong> by default. No fourth argument to remember, and no silent approximate matching.",
        "The two ranges are independent, so the thing you return can sit anywhere, including to the <em>left</em> of the thing you search."
      ]
    },
    { h: "Locking the ranges" },
    { p: "The lookup value moves down with the formula, so it stays relative. The two master ranges must not move, so both are locked with dollar signs. Get this wrong and the master range slides down as you fill, so the lower rows search a shorter and shorter list and start returning #N/A for codes that are plainly there." },
    { f: "=XLOOKUP(C2, $A$17:$A$23, $B$17:$B$23)      right\n=XLOOKUP(C2, A17:A23, B17:B23)            wrong once filled" },
    { pro: "Make both ranges the same height. If the search range covers seven rows and the return range covers eight, XLOOKUP either errors or quietly returns the wrong row, depending on version. Select them the same way, and check the row numbers rather than trusting the drag." },
    { h: "Where the master lives" },
    { p: "In a real workbook the master sits on its own sheet, and the reference is written with the sheet name and an exclamation mark: <span class='f'>Suppliers!$A$2:$A$200</span>. Excel adds it for you when you click across while building the formula. The practice grid keeps both tables on one sheet so the ranges stay short enough to read." },
    { web: "Excel for the web has XLOOKUP. If a colleague on an older desktop build opens your file, the formula shows as <span class='f'>_xlfn.XLOOKUP</span> and returns #NAME?. That is a version problem, not a mistake in your formula, and it is the one genuine reason to reach for VLOOKUP instead." },
    { desk: "Nothing to add here: XLOOKUP behaves identically on desktop. For joining two large tables permanently rather than row by row, Power Query's <span class='f'>Merge Queries</span> is the proper tool and it is what a data team would use, but it produces a new table rather than a column beside your data, which is usually not what you want mid-analysis." }
  ],
  reflect: [
    "Say why the supplier name is not simply stored against every transaction.",
    "Which of the three arguments in your formula moves as you fill, and which two must not?"
  ],

  practice: function (seed) {
    const r = rng(seed);
    const n = 12;
    const rows = [];
    for (let i = 0; i < n; i++) {
      const m = M5_MASTER[rInt(r, 0, M5_MASTER.length - 1)];
      rows.push({
        ref: "TX-" + (8100 + i),
        date: ymdToSerial(2024, 3, 1) + rInt(r, 0, 30),
        code: m.code,
        amount: xround(rInt(r, 4000, 210000) / 100, 2)
      });
    }

    const sh = new Sheet("Join", 30, 6);
    ["Ref", "Date", "Code", "Amount", "Supplier", "Risk"].forEach((h, i) => sh.set(0, i, h, { hdr: true, locked: true }));
    rows.forEach((t, i) => {
      sh.set(1 + i, 0, t.ref, { locked: true });
      sh.set(1 + i, 1, t.date, { fmt: DATEFMT, locked: true });
      sh.set(1 + i, 2, t.code, { locked: true });
      sh.set(1 + i, 3, t.amount, { fmt: GBP2, locked: true });
    });

    const mStart = n + 4;
    const m = writeMaster(sh, mStart);
    const mCode = "$A$" + m.first + ":$A$" + m.last;
    const mName = "$B$" + m.first + ":$B$" + m.last;
    const mRisk = "$C$" + m.first + ":$C$" + m.last;

    const answers = [];
    for (let i = 0; i < n; i++) answers.push("E" + (2 + i), "F" + (2 + i));
    lockSheet(sh, answers);
    sh.rows = m.last + 2; sh.cols = 6;

    const nameOf = c => M5_MASTER.find(x => x.code === c).name;
    const riskOf = c => M5_MASTER.find(x => x.code === c).risk;

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 6, startRow: 1, startCol: 4,
      formatBar: false, fillBar: true,
      highlight: answers,
      brief: {
        title: "A transaction log that does not know who it paid",
        body: "Twelve payments, each carrying a supplier code and nothing else. The supplier master sits below the data, " +
          "holding the name and risk rating for each code once. Bring both across into columns E and F. " +
          "Scroll down inside the grid to see the master and read off its row numbers before you write anything."
      },
      hint: "Three arguments: what to find, where to look, what to bring back. The master ranges must be locked; the lookup value must not be.",
      tasks: [
        { id: "t1", text: "In E2, bring across the supplier name for the first payment, then fill down to E13.", cell: "E2" },
        { id: "t2", text: "Check E13. If the lower rows show #N/A while the codes are plainly in the master, your ranges are not locked.", cell: "E13" },
        { id: "t3", text: "In F2, bring across the risk rating. Fill down.", cell: "F2" },
        { id: "t4", text: "Check F13.", cell: "F13", ext: true }
      ],
      checks: [
        {
          cell: "E2", expect: nameOf(rows[0].code), needFormula: true, mustUse: "XLOOKUP",
          task: "E2: the supplier name for the first payment.",
          answer: "=XLOOKUP(C2," + mCode + "," + mName + ")",
          why: "Find the code from C2 in the master's code column, return the matching name. XLOOKUP matches exactly by default, so there is no fourth argument to remember and no chance of a silent approximate match.",
          wrongWay: "Typing the supplier names in by hand from the master. Twelve rows is possible and four thousand is not, and a hand-typed column stops being true the moment the master changes."
        },
        {
          cell: "E13", expect: nameOf(rows[n - 1].code), needFormula: true, mustUse: "XLOOKUP",
          task: "E13: the last supplier name, reached by filling.",
          answer: "=XLOOKUP(C13," + mCode + "," + mName + ")",
          why: "Only the lookup value moved. Both master ranges are unchanged from row 2, which is what the dollar signs are for.",
          wrongWay: "Writing the ranges without dollar signs. The master range slides down as you fill, so by the bottom it is searching past the end of the table and returning #N/A for codes that are obviously there."
        },
        {
          cell: "F2", expect: riskOf(rows[0].code), needFormula: true, mustUse: "XLOOKUP",
          task: "F2: the risk rating for the first payment.",
          answer: "=XLOOKUP(C2," + mCode + "," + mRisk + ")",
          why: "Same search, different return range. Note that you did not have to move the risk column next to the code column to make this work, which is the flexibility XLOOKUP buys you.",
          wrongWay: "Looking up the supplier name in E2 and then looking the risk up by name. It works and it chains one lookup off another, so a failure in the first quietly becomes a failure in the second. Look up from the code both times."
        },
        {
          cell: "F13", ext: true, expect: riskOf(rows[n - 1].code), needFormula: true, mustUse: "XLOOKUP",
          task: "F13: the last risk rating.",
          answer: "=XLOOKUP(C13," + mCode + "," + mRisk + ")",
          why: "Worth spot-checking against the master by eye. Pick a row, read its code, find that code in the master below, and confirm the rating matches. Doing this once on any join is the difference between trusting a formula and knowing it works.",
          wrongWay: "Assuming the column is right because the top row was. A mis-locked range fails at the bottom, not the top."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M5S1"); wb.add(M5S1.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 2
   ============================================================ */
const M5S2 = {
  title: "When a lookup fails, and what #N/A is actually telling you",
  aim: "Diagnose the three reasons a lookup returns #N/A, and fix each at its cause.",
  why: "You will spend more time on failed lookups than on working ones. #N/A means the value was not found, which is not one problem but three, with three different fixes and only one of them involving the formula.",
  concepts: ["m5.na", "m5.ifnotfound", "m5.dirtykeys", "m5.bothsides"],
  unlocks: ["IFNA"],
  lesson: [
    { lead: "#N/A is not a broken formula. It is a report that the value is not there." },
    { p: "Which is useful, because it is usually true. Before touching the formula, work out which of three things has happened." },
    { h: "One: the value genuinely is not in the master" },
    { p: "A new supplier has been paid and nobody has added them to the reference table. The formula is right and the data is incomplete, and the correct response is to tell somebody, not to hide it." },
    { p: "You still want the sheet readable, so give the lookup something to say:" },
    { f: '=XLOOKUP(C2, $A$17:$A$23, $B$17:$B$23, "not on file")' },
    { p: "The fourth argument is what to return when nothing matches. This is the reason to prefer XLOOKUP over everything else: no wrapper, no nesting, and the message sits where you can see it." },
    { pro: 'Use a message, not a blank and not a zero. "not on file" in a column tells the next reader that a lookup ran and found nothing. An empty cell tells them nothing at all, and gets counted as missing data rather than as an unmatched key.' },
    { h: "Two: the key is dirty on the transaction side" },
    { p: "The code in your data has a trailing space, or was imported as text while the master holds numbers. It looks identical on screen and does not match. This is Module 4 arriving with consequences." },
    { f: "=XLOOKUP(TRIM(C2), $A$17:$A$23, $B$17:$B$23, \"not on file\")" },
    { h: "Three: the key is dirty on the master side" },
    { p: "Exactly the same symptom, and TRIM on the lookup value does nothing, because the fault is in the table you are searching. This one catches people for a long time, because the obvious fix has already been applied and appears not to work." },
    { p: "The answer is to clean the master. Add a helper column beside it holding a trimmed copy of the code, and point the lookup at that instead of the original." },
    { why: "Which is the general lesson of this session: when a join fails, the fault can be on either side of it, and the side you did not clean is the one you will not think of. Clean both, then join. Module 4 comes before Module 5 for exactly this reason." },
    { h: "Telling them apart quickly" },
    { p: "Take one failing code and search for it in the master with COUNTIF." },
    { f: "=COUNTIF($A$17:$A$23, C5)          0 means no match\n=COUNTIF($A$17:$A$23, \"*\"&TRIM(C5)&\"*\")   1 means it is there, but not cleanly" },
    { p: "If the first is 0 and the second is 1, the value exists and one side is dirty. If both are 0, it genuinely is not there. That is a thirty-second diagnosis and it saves an hour of guessing." },
    { h: "IFNA rather than IFERROR" },
    { p: "If you must wrap a lookup, wrap it in IFNA. It catches only #N/A and lets a genuine #REF! or #VALUE! still show, so a mistyped range still announces itself instead of being swallowed by your tidy message." },
    { trap: "Wrapping a lookup in IFERROR while you are still building it will hide a broken range as willingly as a missing key, and you will spend an afternoon wondering why every row says not on file." },
    { web: "No difference in Excel for the web." },
    { desk: "Power Query's Merge Queries will not silently drop unmatched rows if you choose a Left Outer join, and it shows you the match count for each step, which makes this class of problem visible before you have written anything. It is worth the twenty minutes once you meet a join that will run every month." }
  ],
  reflect: [
    "Name the three causes of #N/A and the fix for each.",
    "Which of the three does TRIM on the lookup value not solve?"
  ],

  practice: function (seed) {
    const r = rng(seed);
    const n = 10;
    /* master with one dirty code, so the fault sits on the far side of the join */
    const codes = M5_MASTER.map(m => m.code);
    const dirtyMasterIdx = 4;
    codes[dirtyMasterIdx] = M5_MASTER[dirtyMasterIdx].code + " ";

    const rows = [];
    for (let i = 0; i < n; i++) {
      const m = M5_MASTER[i % M5_MASTER.length];
      rows.push({ ref: "TX-" + (8300 + i), code: m.code, amount: xround(rInt(r, 4000, 190000) / 100, 2) });
    }
    /* plant the three faults on known rows */
    rows[2].code = M5_MASTER[0].code + " ";   // row 4: trailing space on the transaction side
    rows[5].code = "SUP-999";                 // row 7: genuinely not in the master
    rows[7].code = M5_MASTER[dirtyMasterIdx].code;  // row 9: clean here, dirty in the master

    const sh = new Sheet("Failures", 28, 6);
    ["Ref", "Code", "Amount", "Supplier"].forEach((h, i) => sh.set(0, i, h, { hdr: true, locked: true }));
    rows.forEach((t, i) => {
      sh.set(1 + i, 0, t.ref, { locked: true });
      sh.set(1 + i, 1, t.code, { locked: true });
      sh.set(1 + i, 2, t.amount, { fmt: GBP2, locked: true });
    });

    const mStart = n + 4;
    const m = writeMaster(sh, mStart, codes, "Clean code");
    const cleanCol = "$D$" + m.first + ":$D$" + m.last;
    const mName = "$B$" + m.first + ":$B$" + m.last;

    const answers = [];
    for (let i = 0; i < n; i++) answers.push("D" + (2 + i));
    for (let i = m.first; i <= m.last; i++) answers.push("D" + i);
    lockSheet(sh, answers);
    sh.rows = m.last + 2; sh.cols = 6;

    const nameOf = c => { const f = M5_MASTER.find(x => x.code === String(c).trim()); return f ? f.name : "not on file"; };

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 6, startRow: 1, startCol: 3,
      formatBar: false, fillBar: true,
      highlight: answers,
      brief: {
        title: "Ten payments, three of which will not match",
        body: "Write the lookup and three rows come back #N/A, for three different reasons. One code has a trailing space. " +
          "One supplier is genuinely not in the master. And one master entry is itself dirty, so the transaction is clean and the match still fails. " +
          "Build the clean-code helper column in the master first, then write a single lookup that survives all three."
      },
      hint: "Scroll down in the grid to the master. Its column D is empty and waiting for a trimmed copy of the code. Point your lookup at that, not at column A.",
      tasks: [
        { id: "t1", text: "In the master's Clean code column, cell D" + m.first + ", produce a trimmed copy of the code beside it. Fill down through the master.", cell: "D" + m.first },
        { id: "t2", text: "Check the bottom of that helper column.", cell: "D" + m.last },
        { id: "t3", text: "In D2, look the supplier up against the clean code column, trimming the transaction's code as well, and returning <strong>not on file</strong> when nothing matches. Fill down to D11.", cell: "D2" },
        { id: "t4", text: "Row 4 has a trailing space in its code. Confirm it now matches.", cell: "D4" },
        { id: "t5", text: "Row 7 is a supplier that does not exist in the master. Confirm it reads not on file.", cell: "D7" },
        { id: "t6", text: "Row 9 is clean, but its master entry is not. Confirm it matches now that you are looking at the cleaned column.", cell: "D9", ext: true }
      ],
      checks: [
        {
          cell: "D" + m.first, expect: M5_MASTER[0].code, needFormula: true, mustUse: "TRIM",
          task: "The first clean code in the master.",
          answer: "=TRIM(A" + m.first + ")",
          why: "A trimmed copy of the master's key, in a helper column beside it. This is the Module 4 habit: never clean in place, and keep the original so you can prove what changed.",
          wrongWay: "Editing the master's code column directly to remove the space. It works and it destroys the evidence that the reference data was wrong, which is the thing somebody actually needs to fix."
        },
        {
          cell: "D" + m.last, expect: M5_MASTER[M5_MASTER.length - 1].code, needFormula: true, mustUse: "TRIM",
          task: "The last clean code in the master.",
          answer: "=TRIM(A" + m.last + ")",
          why: "Filled down the whole master. Compare column A against column D and you can see exactly which entry was damaged.",
          wrongWay: "Filling only as far as the row you happened to be looking at. A join searches the whole table, so the helper has to cover the whole table."
        },
        {
          cell: "D2", expect: nameOf(rows[0].code), needFormula: true, mustUseAll: ["XLOOKUP", "TRIM"],
          task: "D2: the supplier, looked up robustly.",
          answer: '=XLOOKUP(TRIM(B2),' + cleanCol + ',' + mName + ',"not on file")',
          why: "Four things at once: trim the key on this side, search the cleaned key on the other side, return the name, and say something useful when there is no match. One formula, all three failure modes handled.",
          wrongWay: "Building it without the fourth argument and then wrapping the whole thing in IFERROR. That works and it also hides a mistyped range, which is the error you most need to see while you are still writing the formula."
        },
        {
          cell: "D4", expect: nameOf(rows[2].code), needFormula: true, mustUseAll: ["XLOOKUP", "TRIM"],
          task: "D4: the row whose own code had a trailing space.",
          answer: '=XLOOKUP(TRIM(B4),' + cleanCol + ',' + mName + ',"not on file")',
          why: "The code in B4 reads " + M5_MASTER[0].code + " and is not, because of a space you cannot see. TRIM on the lookup value fixes this one. Check it with <span class='f'>=LEN(B4)</span> against <span class='f'>=LEN(TRIM(B4))</span> if you want to see the evidence.",
          wrongWay: "Retyping the code in B4. That fixes one row of a file you will receive again next month with the same fault."
        },
        {
          cell: "D7", expect: "not on file", needFormula: true, mustUse: "XLOOKUP",
          task: "D7: the supplier that is genuinely missing.",
          answer: '=XLOOKUP(TRIM(B7),' + cleanCol + ',' + mName + ',"not on file")',
          why: "SUP-999 is not in the master at all, and no amount of trimming will find it. The formula is correct and the reference data is incomplete. The right response is to report it, and the message keeps it visible while you do.",
          wrongWay: "Returning a blank or a zero instead of a message. A blank is indistinguishable from a row nobody has filled in yet, and this row needs somebody to act on it."
        },
        {
          cell: "D9", ext: true, expect: nameOf(rows[7].code), needFormula: true, mustUseAll: ["XLOOKUP", "TRIM"],
          task: "D9: the row that was clean all along.",
          answer: '=XLOOKUP(TRIM(B9),' + cleanCol + ',' + mName + ',"not on file")',
          why: "This is the one that teaches the session. The transaction code was always correct; the master entry carried the trailing space. TRIM on the lookup value alone would still fail here, and the only fix is the cleaned helper column on the master side. When a join fails, check both sides.",
          wrongWay: "Concluding the code is wrong because the lookup failed, and editing the transaction to match the damaged master. That propagates the fault into your data instead of out of it."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M5S2"); wb.add(M5S2.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 3
   ============================================================ */
const M5S3 = {
  title: "VLOOKUP, honestly, and INDEX with MATCH once",
  aim: "Use VLOOKUP correctly, name its three real flaws, and know the one job approximate matching is genuinely for.",
  why: "You should write XLOOKUP. You will be asked about VLOOKUP in an interview and you will meet it in every inherited workbook, so you need to read it, fix it, and say honestly what is wrong with it.",
  concepts: ["m5.vlookup", "m5.vlookupflaws", "m5.approx", "m5.indexmatch"],
  unlocks: ["VLOOKUP", "INDEX", "MATCH", "HLOOKUP"],
  lesson: [
    { lead: "VLOOKUP is the lookup everyone learned first and nobody should reach for now." },
    { f: "=VLOOKUP(what to find, the whole table, which column number, FALSE)" },
    { f: "=VLOOKUP(C2, $A$17:$C$23, 2, FALSE)" },
    { p: "Search the first column of that block for the code, and return whatever is in the second column of the same row. The FALSE at the end means exact match." },
    { h: "Flaw one: it only looks right" },
    { p: "VLOOKUP searches the first column of the block and can only return something to the right of it. If the code sits in column C and the name in column A, VLOOKUP cannot do it at all, and people restructure their data to suit the formula rather than the other way round." },
    { h: "Flaw two: the column number is a position, not a reference" },
    { p: "The 2 means second column of the block. Insert a column into the middle of the master and every VLOOKUP pointing past it silently returns the wrong field. Nothing errors. You now have a column of city names labelled Supplier." },
    { pro: "This is the flaw that costs real money, because it breaks a working sheet through an action taken somewhere else entirely, by someone who had no reason to think about your formula." },
    { h: "Flaw three: the last argument is optional and defaults to the dangerous value" },
    { p: "Leave off the FALSE and VLOOKUP performs an approximate match. On unsorted data that returns whatever it happened to land on: a real value, from the wrong row, with no error." },
    { trap: "Never omit the final FALSE on a normal lookup. Not once, not for a quick check. Every VLOOKUP you write should end in <span class='f'>,FALSE)</span> and every VLOOKUP you inherit should be checked for it." },
    { h: "The one time approximate matching is right" },
    { p: "Banding. Commission rates by order size, tax bands, postage by weight: a table where you want the row for the largest threshold not exceeding your value." },
    {
      table: {
        cols: ["Threshold", "Rate"], startRow: 1,
        rows: [["0", "0%"], ["500", "2%"], ["2000", "4%"], ["10000", "6%"]]
      }
    },
    { f: "=VLOOKUP(D2, $A$30:$B$33, 2, TRUE)" },
    { p: "An order of £750 finds no exact match, so it takes the row for 500 and returns 2%. That is the intended behaviour and it is genuinely useful. Two conditions: the threshold column must be sorted ascending, and it must start at a value below anything you will look up, or small orders return #N/A." },
    { why: "Approximate matching is not a bug. It is a feature with one legitimate use and a default that applies it everywhere else. Write TRUE deliberately when you mean banding, and FALSE explicitly every other time." },
    { h: "INDEX and MATCH, once" },
    { f: "=INDEX($B$17:$B$23, MATCH(C2, $A$17:$A$23, 0))" },
    { p: "MATCH finds the position of the code within the code column. INDEX returns the value at that position in the name column. Read it inside out: work out which row, then fetch from that row." },
    { p: "It does everything VLOOKUP does without any of the three flaws, because the two ranges are independent, so it can look left and it does not break when a column is inserted. For twenty years it was the right answer, and every experienced user can read it." },
    { pro: "Write XLOOKUP. Learn to read INDEX and MATCH because inherited workbooks are full of it. Learn VLOOKUP because you will be asked to write one at an interview, and when you do, add the FALSE and mention why you would normally use XLOOKUP. That answer is better than the formula." },
    { web: "All three work in Excel for the web. INDEX and MATCH have the widest compatibility of any of them, which is why it survives in files shared across organisations running different versions." },
    { desk: "No difference. The one desktop-only consideration is that very large INDEX and MATCH grids recalculate more slowly than XLOOKUP over the same data; on a hundred thousand rows it is noticeable, and on the file sizes in this course it is not." }
  ],
  reflect: [
    "Name VLOOKUP's three flaws without looking.",
    "Say the one situation where you would deliberately write TRUE as the last argument."
  ],

  practice: function (seed) {
    const r = rng(seed);
    const n = 10;
    const rows = [];
    for (let i = 0; i < n; i++) {
      const m = M5_MASTER[rInt(r, 0, M5_MASTER.length - 1)];
      rows.push({ ref: "TX-" + (8500 + i), code: m.code, amount: xround(rInt(r, 8000, 640000) / 100, 2) });
    }

    const sh = new Sheet("Legacy", 34, 6);
    ["Ref", "Code", "Amount", "Supplier", "Rate", "Commission"].forEach((h, i) => sh.set(0, i, h, { hdr: true, locked: true }));
    rows.forEach((t, i) => {
      sh.set(1 + i, 0, t.ref, { locked: true });
      sh.set(1 + i, 1, t.code, { locked: true });
      sh.set(1 + i, 2, t.amount, { fmt: GBP2, locked: true });
    });

    const mStart = n + 4;
    const m = writeMaster(sh, mStart);

    /* the banding table, sorted ascending, starting at zero */
    const bStart = m.last + 3;
    label(sh, "A" + bStart, "Commission bands");
    sh.set(bStart, 0, "Threshold", { hdr: true, locked: true });
    sh.set(bStart, 1, "Rate", { hdr: true, locked: true });
    const bands = [[0, 0], [500, 0.02], [2000, 0.04], [10000, 0.06]];
    bands.forEach((b, i) => {
      sh.set(bStart + 1 + i, 0, b[0], { locked: true, fmt: "#,##0" });
      sh.set(bStart + 1 + i, 1, b[1], { locked: true, fmt: "0%" });
    });
    const bFirst = bStart + 2, bLast = bStart + 1 + bands.length;
    const bandRange = "$A$" + bFirst + ":$B$" + bLast;

    const mTable = "$A$" + m.first + ":$C$" + m.last;
    const mCode = "$A$" + m.first + ":$A$" + m.last;
    const mName = "$B$" + m.first + ":$B$" + m.last;

    const answers = [];
    for (let i = 0; i < n; i++) answers.push("D" + (2 + i), "E" + (2 + i), "F" + (2 + i));
    lockSheet(sh, answers);
    for (let i = 0; i < n; i++) {
      const p = parseA1("E" + (2 + i)); sh.ensure(p.r, p.c).fmt = "0%";
      const q = parseA1("F" + (2 + i)); sh.ensure(q.r, q.c).fmt = GBP2;
    }
    sh.rows = bLast + 2; sh.cols = 6;

    const nameOf = c => M5_MASTER.find(x => x.code === c).name;
    const rateOf = a => { let rr = 0; bands.forEach(b => { if (a >= b[0]) rr = b[1]; }); return rr; };

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 6, startRow: 1, startCol: 3,
      formatBar: false, fillBar: true,
      highlight: answers,
      brief: {
        title: "The lookup an interviewer will ask you for, and the one job it is right for",
        body: "Do the supplier lookup with <strong>VLOOKUP</strong>, deliberately, because you need to be able to write one. " +
          "Then use approximate matching on the commission bands below the master, which is the one place it belongs. " +
          "Scroll inside the grid to read both tables and their row numbers."
      },
      hint: "VLOOKUP counts columns from the left edge of the block you give it. The bands table is sorted ascending and starts at zero, which is what makes approximate matching safe here.",
      tasks: [
        { id: "t1", text: "In D2, look the supplier name up with VLOOKUP. Fill down to D11.", cell: "D2" },
        { id: "t2", text: "Check D11.", cell: "D11" },
        { id: "t3", text: "In E2, find the commission rate for the amount, using the bands table and approximate matching. Fill down.", cell: "E2" },
        { id: "t4", text: "In F2, work out the commission itself. Fill down.", cell: "F2" },
        { id: "t5", text: "In D2, rewrite the supplier lookup using INDEX and MATCH instead, then put the VLOOKUP back. Notice which one you would rather inherit.", cell: null, ext: true }
      ],
      checks: [
        {
          cell: "D2", expect: nameOf(rows[0].code), needFormula: true, mustUse: ["VLOOKUP", "INDEX"],
          task: "D2: the supplier name, the legacy way.",
          answer: "=VLOOKUP(B2," + mTable + ",2,FALSE)",
          why: "The block starts at the code column, so the name is column 2 of that block. The FALSE is not optional in practice: leave it off and Excel approximate-matches unsorted data and returns a real name from the wrong row. INDEX with MATCH is accepted here too, since it does the same job without the flaws.",
          wrongWay: "<span class='f'>=VLOOKUP(B2," + mTable + ",2)</span> with no FALSE. On this data it will mostly appear to work, which is exactly what makes the habit dangerous."
        },
        {
          cell: "D11", expect: nameOf(rows[n - 1].code), needFormula: true, mustUse: ["VLOOKUP", "INDEX"],
          task: "D11: the last supplier name.",
          answer: "=VLOOKUP(B11," + mTable + ",2,FALSE)",
          why: "Now imagine somebody inserts a column into the master between Code and Supplier. Every one of these formulas still says 2, still returns a value, and every one of them is now wrong. That is flaw two, and nothing on the sheet would tell you.",
          wrongWay: "Not locking the table range, so it slides down as you fill and the bottom rows search a table that no longer contains the codes."
        },
        {
          cell: "E2", expect: rateOf(rows[0].amount), needFormula: true, mustUse: ["VLOOKUP", "INDEX"], tol: 0.0001,
          task: "E2: the commission rate for the first amount.",
          answer: "=VLOOKUP(C2," + bandRange + ",2,TRUE)",
          why: "The amount is " + gbp(rows[0].amount) + ", which falls in the " + (rateOf(rows[0].amount) * 100) + "% band. TRUE means take the row for the largest threshold not above my value, which is exactly what banding means. It works only because the table is sorted ascending and starts at 0.",
          wrongWay: "Using FALSE here, which looks for an amount exactly equal to a threshold and returns #N/A for almost every row. This is the one place the default behaviour is the behaviour you want, so write TRUE and mean it."
        },
        {
          cell: "F2", expect: xround(rows[0].amount * rateOf(rows[0].amount), 2), needFormula: true, tol: 0.005,
          task: "F2: the commission.",
          answer: "=C2*E2",
          why: "The amount times the rate you just looked up. Keeping the rate in its own column means you can see which band each row landed in, which is what makes the result checkable.",
          wrongWay: "Folding the whole VLOOKUP into this cell as <span class='f'>=C2*VLOOKUP(C2,...)</span>. It gives the same answer and hides which band was used, so a banding error becomes invisible."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M5S3"); wb.add(M5S3.practice(seed).sheet); return wb; }
};

/* ============================================================
   Register
   ============================================================ */
defModule({
  id: "m5", n: 5, stage: "s1",
  title: "Lookups",
  subtitle: "XLOOKUP first, VLOOKUP honestly, INDEX and MATCH once",
  blurb: "Joining two tables on a shared key. XLOOKUP as the tool you should use, the three reasons a lookup fails and how to tell them apart, and VLOOKUP taught properly because interviews still ask for it.",
  onComplete: "You can join tables, and more usefully you can work out why a join failed. That diagnosis, rather than the formula, is what separates somebody who can use a lookup from somebody who can be trusted with data. Module 6 is pivot tables, which is the highest-value skill in the course.",
  concepts: [
    { id: "m5.lookupidea", label: "Why data is split across tables", blurb: "Store each fact once, refer to it by a key." },
    { id: "m5.xlookup", label: "XLOOKUP", blurb: "Find, where to look, what to bring back. Exact by default." },
    { id: "m5.lockarrays", label: "Lock the lookup ranges", blurb: "The value moves, the master must not." },
    { id: "m5.returnrange", label: "Independent search and return ranges", blurb: "Which is what lets XLOOKUP look left." },
    { id: "m5.na", label: "#N/A means not found", blurb: "Three causes, three different fixes." },
    { id: "m5.ifnotfound", label: "The if_not_found argument", blurb: "A message, not a blank and not a zero." },
    { id: "m5.dirtykeys", label: "Dirty keys break joins", blurb: "A trailing space is invisible and fatal." },
    { id: "m5.bothsides", label: "The fault can be on either side", blurb: "Clean the master too, then join." },
    { id: "m5.vlookup", label: "VLOOKUP", blurb: "Table block, column number, and always FALSE." },
    { id: "m5.vlookupflaws", label: "The three flaws", blurb: "Looks right only, counts columns, dangerous default." },
    { id: "m5.approx", label: "Approximate matching, used properly", blurb: "Banding, on a sorted table starting at zero." },
    { id: "m5.indexmatch", label: "INDEX with MATCH", blurb: "Work out the row, then fetch from it." }
  ],
  sessions: [M5S1, M5S2, M5S3]
});
