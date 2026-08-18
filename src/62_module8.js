/* ============================================================
   Module 8: Finding the needle
   Synthetic transaction data with planted patterns. Nothing here
   is real or sensitive; the shapes are what matter.
   ============================================================ */

const FC_NAMES = [
  "Marlow Freight Ltd", "Brackwell Holdings", "Corvina Trading", "Delmar Logistics",
  "Ellington Supply Co", "Fairholt Metals", "Grantley Partners", "Hesketh Imports"
];
const FC_COUNTRIES = ["GB", "IE", "NL", "DE", "AE", "SG", "PL", "US"];

/* One transaction log, with the pattern under test planted deliberately. */
function fcRows(seed, opts) {
  const o = opts || {};
  const r = rng(seed);
  const rows = [];
  const day0 = ymdToSerial(2024, 3, 1);
  const push = (acct, day, amount, country, kind) => rows.push({
    ref: "P" + (100000 + rows.length),
    account: acct,
    date: day0 + day,
    amount: xround(amount, 2),
    country: country || rPick(r, FC_COUNTRIES),
    counterparty: rPick(r, FC_NAMES),
    kind: kind || "normal"
  });

  const nAcct = o.accounts || 6;
  const accts = [];
  for (let i = 0; i < nAcct; i++) accts.push("AC-" + (4400 + i));

  /* ordinary background traffic */
  const bg = o.background === undefined ? 70 : o.background;
  for (let i = 0; i < bg; i++) {
    push(rPick(r, accts), rInt(r, 0, 59), rInt(r, 1200, 780000) / 100);
  }

  /* structuring: one account, several payments just under the threshold */
  if (o.structuring) {
    const acct = accts[1];
    const thr = o.threshold || 10000;
    for (let i = 0; i < (o.structuringCount || 6); i++) {
      push(acct, rInt(r, 10, 24), thr - rInt(r, 20, 400) - r(), null, "structuring");
    }
  }
  /* velocity: one account, many payments in a few days */
  if (o.velocity) {
    const acct = accts[3];
    for (let i = 0; i < (o.velocityCount || 11); i++) {
      push(acct, 32 + rInt(r, 0, 4), rInt(r, 8000, 160000) / 100, null, "velocity");
    }
  }
  /* round amounts: suspiciously exact figures */
  if (o.round) {
    const acct = accts[4];
    [5000, 10000, 2500, 7500, 15000].forEach((v, i) => push(acct, 5 + i * 7, v, null, "round"));
  }
  /* dormancy: an account silent for weeks, then three large payments */
  if (o.dormant) {
    const acct = accts[5];
    push(acct, 1, rInt(r, 2000, 9000) / 100, null, "pre-dormant");
    for (let i = 0; i < 3; i++) push(acct, 54 + i, rInt(r, 180000, 420000) / 100, null, "dormant-wake");
  }

  return rows.sort((a, b) => a.date - b.date || (a.ref < b.ref ? -1 : 1));
}

/* Lay a transaction log out: A Ref, B Account, C Date, D Amount, E Country */
function fcSheet(name, rows, extraHeads) {
  const sh = new Sheet(name, rows.length + 20, 5 + (extraHeads || []).length);
  ["Ref", "Account", "Date", "Amount", "Country"].concat(extraHeads || [])
    .forEach((h, i) => sh.set(0, i, h, { hdr: true, locked: true }));
  rows.forEach((t, i) => {
    sh.set(1 + i, 0, t.ref, { locked: true });
    sh.set(1 + i, 1, t.account, { locked: true });
    sh.set(1 + i, 2, t.date, { fmt: DATEFMT, locked: true });
    sh.set(1 + i, 3, t.amount, { fmt: GBP2, locked: true });
    sh.set(1 + i, 4, t.country, { locked: true });
  });
  return sh;
}
function fcAnswers(sh, startRow, labels) {
  label(sh, "A" + startRow, "Answers");
  const cells = [];
  labels.forEach((lb, i) => { note(sh, "A" + (startRow + 1 + i), lb); cells.push("C" + (startRow + 1 + i)); });
  return cells;
}

/* ============================================================
   Session 1
   ============================================================ */
const M8S1 = {
  title: "Structuring: payments that stop just short",
  aim: "Find accounts making repeated payments just under a reporting threshold, and understand why the test is about repetition rather than size.",
  why: "A single payment of £9,800 is unremarkable. Six of them from one account in a fortnight is a pattern, and the arithmetic that separates the two is a COUNTIFS you already know.",
  concepts: ["m8.structuring", "m8.band", "m8.perentity", "m8.falsepositives"],
  unlocks: [],
  lesson: [
    { lead: "Structuring is splitting one large payment into several smaller ones to stay under a reporting threshold." },
    { p: "The individual payments look ordinary. That is the point of them. What gives the pattern away is that they cluster just below a round number, from the same account, close together in time." },
    { h: "The test" },
    { p: "Count, per account, the payments falling in a narrow band below the threshold. Not payments under the threshold, which is most of them: payments in the band immediately beneath it." },
    { f: '=COUNTIFS($B$2:$B$90, $A20,\n          $D$2:$D$90, ">="&($H$1-$H$2),\n          $D$2:$D$90, "<"&$H$1)' },
    { p: "Three conditions: this account, at least the threshold minus the band width, and below the threshold. With the threshold in H1 and the band width in H2 you can widen or narrow the test without touching the formula, which matters because you will."},
    { why: "Putting the parameters in cells is not tidiness. An analyst is asked constantly to rerun a test at a different threshold, and a sheet where that means editing forty formulas is a sheet that will be rerun wrongly." },
    { h: "Why the band, and not simply under the threshold" },
    { p: "Roughly nine payments in ten are under £10,000, so counting those tells you nothing. The signal is proximity: a payment at £9,850 is a decision, and a payment at £320 is a Tuesday." },
    { trap: "Pick the band deliberately and write down why. Ten per cent of the threshold is a common starting point and it is a choice, not a fact. Too narrow and you miss deliberate spacing; too wide and every ordinary invoice arrives on your desk." },
    { h: "Rank, do not just flag" },
    { p: "A flag column that says Yes on forty rows is not a result. Sort the accounts by how many band payments they made, and look at the top of the list. Two accounts with six each are a finding; thirty accounts with one each are the background." },
    { h: "False positives are the job" },
    { p: "Every one of these tests produces innocent hits. A business that invoices in fixed instalments will trip a structuring test forever, and the correct outcome is a note on the file saying so, not a suppressed rule." },
    { pro: "Never write a test that silently excludes a known-good account. Keep the flag and record the explanation beside it, because the next analyst needs to know the pattern was seen and understood rather than never detected. An unexplained absence looks exactly like a miss." },
    { web: "Everything in this module works in Excel for the web." },
    { desk: "On real volumes, tens of thousands of COUNTIFS across a whole column recalculate slowly. Restrict ranges to the rows that exist rather than whole columns, and if it is still slow, this is the point at which a data team would move the test into Power Query or SQL." }
  ],
  reflect: [
    "Say why counting payments under the threshold is useless and counting payments in the band beneath it is not.",
    "What would you write on the file about an innocent account that trips this test every month?"
  ],

  practice: function (seed) {
    const rows = fcRows(seed, { structuring: true, structuringCount: 6, threshold: 10000, background: 70 });
    const sh = fcSheet("Payments", rows);
    const n = rows.length, last = n + 1;

    label(sh, "G1", "Threshold"); put(sh, "H1", 10000, { locked: true, fmt: GBP2 });
    label(sh, "G2", "Band width"); put(sh, "H2", 1000, { locked: true, fmt: GBP2 });

    const accts = [];
    rows.forEach(t => { if (accts.indexOf(t.account) < 0) accts.push(t.account); });
    accts.sort();
    const tblStart = n + 4;
    label(sh, "A" + tblStart, "Account");
    label(sh, "B" + tblStart, "Payments in band");
    accts.forEach((a, i) => note(sh, "A" + (tblStart + 1 + i), a));
    const bandCells = accts.map((a, i) => "B" + (tblStart + 1 + i));

    const ansStart = tblStart + accts.length + 2;
    const cells = fcAnswers(sh, ansStart, ["Account with most band payments", "How many it made", "Payments in band, all accounts"]);
    lockSheet(sh, bandCells.concat(cells));
    sh.rows = ansStart + cells.length + 2; sh.cols = 8;

    const acctR = "$B$2:$B$" + last, amtR = "$D$2:$D$" + last;
    const inBand = t => t.amount >= 10000 - 1000 && t.amount < 10000;
    const counts = accts.map(a => rows.filter(t => t.account === a && inBand(t)).length);
    let bi = 0; counts.forEach((c, i) => { if (c > counts[bi]) bi = i; });
    const totalBand = counts.reduce((a, b) => a + b, 0);

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 8, colWidth: 92, startRow: tblStart, startCol: 1,
      fillBar: true, highlight: bandCells.concat(cells),
      brief: {
        title: "Ninety payments, one account stopping just short",
        body: "The reporting threshold is in <strong>H1</strong> and the band width in <strong>H2</strong>. " +
          "Count, for each account, how many payments fall in the band immediately below the threshold. " +
          "One account is doing it deliberately and the arithmetic will show you which."
      },
      hint: "Three conditions in one COUNTIFS: the account, at or above the threshold minus the band, and below the threshold. Lock the data ranges and the two parameter cells; let the account reference move.",
      tasks: [
        { id: "t1", text: "In " + bandCells[0] + ", count that account's payments in the band. Write it so it fills down the whole list.", cell: bandCells[0] },
        { id: "t2", text: "Fill it down to " + bandCells[bandCells.length - 1] + ".", cell: bandCells[bandCells.length - 1] },
        { id: "t3", text: "In " + cells[0] + ", type the account with the most band payments.", cell: cells[0] },
        { id: "t4", text: "In " + cells[1] + ", how many it made.", cell: cells[1] },
        { id: "t5", text: "In " + cells[2] + ", the total across all accounts. Compare it with the figure above: that ratio is what makes the finding a finding.", cell: cells[2], ext: true }
      ],
      checks: [
        {
          cell: bandCells[0], expect: counts[0], needFormula: true, mustUse: "COUNTIFS",
          task: bandCells[0] + ": band payments for the first account.",
          answer: '=COUNTIFS(' + acctR + ',A' + (tblStart + 1) + ',' + amtR + ',">="&$H$1-$H$2,' + amtR + ',"<"&$H$1)',
          why: "The account reference moves down the list while the data ranges and the two parameter cells stay locked. Putting the threshold and band in cells means you can rerun the whole test at £5,000 by editing one cell, which you will be asked to do.",
          wrongWay: 'Counting everything below the threshold with <span class="f">"&lt;"&$H$1</span> alone. Around nine payments in ten are under £10,000, so that counts the background and finds nothing.'
        },
        {
          cell: bandCells[bandCells.length - 1], expect: counts[counts.length - 1], needFormula: true, mustUse: "COUNTIFS",
          task: "The last account's band count, reached by filling.",
          answer: '=COUNTIFS(' + acctR + ',A' + (tblStart + accts.length) + ',' + amtR + ',">="&$H$1-$H$2,' + amtR + ',"<"&$H$1)',
          why: "If the lower rows all read 0 while the top row was right, the data ranges were not locked and they have slid past the end of the data.",
          wrongWay: "Locking the account reference too, which makes every line report the first account's count under a different label."
        },
        {
          cell: cells[0], expect: accts[bi],
          task: cells[0] + ": the account with the most band payments.",
          answer: accts[bi],
          why: "Ranking rather than flagging. One account made " + counts[bi] + " payments in a £1,000 band below the threshold; the rest of the book made " + (totalBand - counts[bi]) + " between them. The comparison is the evidence, not the raw count.",
          wrongWay: "Reporting every account with at least one band payment. A list of forty flags is not a result and it will be ignored."
        },
        {
          cell: cells[1], expect: counts[bi],
          task: cells[1] + ": how many it made.",
          answer: String(counts[bi]),
          why: "The figure that goes in the write-up, alongside the period it covers and the band you chose. A count without its band width cannot be checked by anybody.",
          wrongWay: "Quoting the count without saying what band produced it. Change the band and the count changes, so the two travel together."
        },
        {
          cell: cells[2], ext: true, expect: totalBand,
          task: cells[2] + ": band payments across all accounts.",
          answer: String(totalBand),
          why: "The denominator. " + counts[bi] + " of " + totalBand + " band payments coming from one account out of " + accts.length + " is the sentence that makes this worth escalating.",
          wrongWay: "Presenting the flagged account's count alone. Without the base a reader cannot tell whether it is unusual."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M8S1"); wb.add(M8S1.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 2
   ============================================================ */
const M8S2 = {
  title: "Velocity: how much, how fast",
  aim: "Count activity inside a rolling time window rather than over the whole period, and compare it against the account's own normal.",
  why: "Totals hide timing. An account that moves £40,000 over two months is ordinary; the same £40,000 in four days is a different question, and only a windowed count can tell them apart.",
  concepts: ["m8.velocity", "m8.rollingwindow", "m8.ownbaseline", "m8.windowchoice"],
  unlocks: ["EOMONTH", "NETWORKDAYS"],
  lesson: [
    { lead: "Every total you have written so far has thrown the timing away." },
    { h: "A rolling window, per row" },
    { p: "For each payment, count how many payments that same account made in the seven days ending on that date. That is a COUNTIFS with the row's own date at both ends of the window." },
    { f: '=COUNTIFS($B$2:$B$90, B2,\n          $C$2:$C$90, ">"&C2-$H$1,\n          $C$2:$C$90, "<="&C2)' },
    { p: "With the window length in H1, this reads: same account, later than seven days before this payment, and up to and including this payment. Fill it down and every row carries its own local activity count." },
    { pro: "Use a rolling window rather than calendar weeks. Calendar buckets split a burst that happens to straddle a Sunday into two unremarkable halves, and anybody deliberately spacing payments will discover that boundary quickly." },
    { h: "The same shape for value" },
    { p: "Swap COUNTIFS for SUMIFS and the same three conditions give you how much moved in the window rather than how many payments. Analysts usually produce both, because a burst of small payments and a single large one are different concerns." },
    { h: "Compare against the account's own normal" },
    { p: "A count of 11 in a week means nothing on its own. Set it beside that account's usual rate: total payments divided by the number of weeks in the period." },
    { f: '=COUNTIFS($B$2:$B$90,B2) / ($H$2/7)' },
    { why: "A fixed threshold applied to every account is the commonest weakness in a monitoring rule. A busy trading company breaches it daily and a dormant personal account never does, however strange its behaviour. Comparing an account against itself catches the second and stops flooding you with the first." },
    { h: "Choosing the window" },
    { p: "Seven days is conventional and arbitrary. Short windows catch bursts and miss slow accumulation; long windows do the reverse. State the window beside every figure, and rerun with a different one before you commit to a conclusion, because a finding that only exists at one window length is not a finding." },
    { trap: "Windowed counts on unsorted data are fine, because the criteria do the work rather than the row order. But a windowed count against dates stored as text returns nothing at all, silently. If a velocity column comes back full of zeros, check the alignment of the date column before you check the formula." },
    { desk: "This is where a real monitoring system stops using a spreadsheet. Thirty thousand rows each running a three-condition COUNTIFS over thirty thousand rows is nine hundred million comparisons, and Excel will take minutes. The formula is right; the tool has run out." }
  ],
  reflect: [
    "Say why a rolling window is better than calendar weeks for this test.",
    "What is wrong with applying one velocity threshold to every account in a book?"
  ],

  practice: function (seed) {
    const rows = fcRows(seed, { velocity: true, velocityCount: 11, background: 70 });
    const sh = fcSheet("Velocity", rows, ["In 7 days", "Value in 7 days"]);
    const n = rows.length, last = n + 1;

    label(sh, "H1", "Window, days"); put(sh, "I1", 7, { locked: true });

    const cntCells = [], valCells = [];
    for (let i = 0; i < n; i++) { cntCells.push("F" + (2 + i)); valCells.push("G" + (2 + i)); }
    const ansStart = n + 4;
    const cells = fcAnswers(sh, ansStart, ["Highest 7-day count", "Account that reached it", "Rows with 6 or more in 7 days"]);
    lockSheet(sh, cntCells.concat(valCells, cells));
    valCells.forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });
    sh.rows = ansStart + cells.length + 2; sh.cols = 9;

    const acctR = "$B$2:$B$" + last, datR = "$C$2:$C$" + last, amtR = "$D$2:$D$" + last;
    const winCount = t => rows.filter(x => x.account === t.account && x.date > t.date - 7 && x.date <= t.date).length;
    const counts = rows.map(winCount);
    const maxC = Math.max.apply(null, counts);
    const maxIdx = counts.indexOf(maxC);
    const nBursty = counts.filter(c => c >= 6).length;
    const firstVal = xround(rows.filter(x => x.account === rows[0].account && x.date > rows[0].date - 7 && x.date <= rows[0].date)
      .reduce((a, b) => a + b.amount, 0), 2);

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 9, colWidth: 86, startRow: 1, startCol: 5,
      fillBar: true, highlight: cntCells.concat(valCells, cells),
      brief: {
        title: "Ninety payments, one account in a hurry",
        body: "For every payment, work out how many payments that account made in the seven days ending on that date, and how much moved. " +
          "The window length is in <strong>I1</strong>, so you can rerun the whole test at fourteen days by editing one cell. " +
          "One account is far outside its own normal."
      },
      hint: "Three conditions: same account, later than this date minus the window, and up to and including this date. Join the operators to the cell values with an ampersand.",
      tasks: [
        { id: "t1", text: "In F2, count that account's payments in the seven days ending on this row's date. Fill down.", cell: "F2" },
        { id: "t2", text: "Check the bottom of the column.", cell: "F" + (n + 1) },
        { id: "t3", text: "In G2, the value moved in the same window. Fill down.", cell: "G2" },
        { id: "t4", text: "In " + cells[0] + ", the highest seven-day count anywhere in the file.", cell: cells[0] },
        { id: "t5", text: "In " + cells[1] + ", the account that reached it.", cell: cells[1] },
        { id: "t6", text: "In " + cells[2] + ", how many rows show six or more in seven days.", cell: cells[2], ext: true }
      ],
      checks: [
        {
          cell: "F2", expect: counts[0], needFormula: true, mustUse: "COUNTIFS",
          task: "F2: the seven-day count for the first payment.",
          answer: '=COUNTIFS(' + acctR + ',B2,' + datR + ',">"&C2-$I$1,' + datR + ',"<="&C2)',
          why: "The date column appears twice, once for each end of the window, exactly as in Module 3. The window is rolling rather than calendar-based, so a burst straddling a weekend is not split into two unremarkable halves.",
          wrongWay: 'Using <span class="f">">="&C2-$I$1</span> at the lower end, which makes the window eight days rather than seven. Off-by-one on a window is easy and it changes every count in the column.'
        },
        {
          cell: "F" + (n + 1), expect: counts[n - 1], needFormula: true, mustUse: "COUNTIFS",
          task: "The last row's seven-day count.",
          answer: '=COUNTIFS(' + acctR + ',B' + last + ',' + datR + ',">"&C' + last + '-$I$1,' + datR + ',"<="&C' + last + ')',
          why: "If this column is all zeros, check the date column is right-aligned. A windowed count against dates stored as text returns nothing at all and says nothing about why.",
          wrongWay: "Leaving the data ranges relative, so the window shrinks as the formula fills and the later rows quietly see less data."
        },
        {
          cell: "G2", expect: firstVal, needFormula: true, mustUse: "SUMIFS", tol: 0.02,
          task: "G2: the value moved in the same window.",
          answer: '=SUMIFS(' + amtR + ',' + acctR + ',B2,' + datR + ',">"&C2-$I$1,' + datR + ',"<="&C2)',
          why: "Identical conditions, SUMIFS instead of COUNTIFS, with the amount range moved to the front. Produce both: a burst of small payments and one large payment are different concerns and the count alone cannot separate them.",
          wrongWay: "Writing it in SUMIF order. SUMIF takes one condition, so a three-condition window cannot be expressed in it at all."
        },
        {
          cell: cells[0], expect: maxC, needFormula: true, mustUse: "MAX",
          task: cells[0] + ": the highest seven-day count.",
          answer: "=MAX(F2:F" + last + ")",
          why: "One account reached " + maxC + " payments in a week. Against a book where most rows sit in low single figures, that is the finding, and it is only visible because the count is per row rather than per period.",
          wrongWay: "Reading the largest number by eye down ninety rows. It works here and will not on thirty thousand."
        },
        {
          cell: cells[1], expect: rows[maxIdx].account,
          task: cells[1] + ": the account that reached it.",
          answer: rows[maxIdx].account,
          why: "Found with a lookup on the maximum, or by filtering the count column. Note this is the account's own peak, not a comparison against a fixed threshold: a busy account and a dormant one need different yardsticks.",
          wrongWay: "Applying one fixed velocity threshold to every account. A busy trading company breaches it daily and a dormant account never does, however strange its behaviour."
        },
        {
          cell: cells[2], ext: true, expect: nBursty, needFormula: true, mustUse: "COUNTIF",
          task: cells[2] + ": rows showing six or more in seven days.",
          answer: '=COUNTIF(F2:F' + last + ',">=6")',
          why: "The size of the alert queue this rule would generate. Always produce this figure before proposing a rule, because a threshold that flags four hundred rows a day is a threshold nobody will action.",
          wrongWay: "Proposing a rule without counting what it would catch. The count of alerts is as much a part of the proposal as the logic."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M8S2"); wb.add(M8S2.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 3
   ============================================================ */
const M8S3 = {
  title: "Round amounts and names spelled three ways",
  aim: "Flag artificially exact figures, and match counterparties whose names do not quite agree.",
  why: "Genuine commerce produces untidy numbers and inconsistent spelling. Suspiciously round figures and near-duplicate identities are two of the cheapest signals available, and both are pure Module 4 arithmetic.",
  concepts: ["m8.roundamounts", "m8.modtest", "m8.fuzzynames", "m8.normalise"],
  unlocks: ["MOD", "SUMPRODUCT", "EXACT"],
  lesson: [
    { lead: "Real invoices end in 47p. Payments ending in three zeros were decided rather than calculated." },
    { h: "Testing for roundness" },
    { p: "MOD gives the remainder after division. A payment that divides exactly by 1,000 leaves no remainder." },
    { f: '=MOD(D2, 1000) = 0        TRUE for 5,000 and 15,000\n=MOD(D2, 500)  = 0        a wider net' },
    { p: "Wrap it in an IF to produce a 1 or a 0 rather than TRUE and FALSE, so the column can be summed and charted. That was Module 3." },
    { trap: "Roundness alone is weak. Salaries, rent, standing orders and inter-company transfers are all legitimately round, and on most books the round-amount test on its own produces mostly noise. It earns its place combined with something else: round <em>and</em> to a new counterparty, or round <em>and</em> in a velocity burst." },
    { h: "Names that do not agree" },
    { p: "The same counterparty arrives as <span class='f'>Marlow Freight Ltd</span>, <span class='f'>MARLOW FREIGHT LIMITED</span> and <span class='f'>Marlow Freight</span>. Excel treats those as three different parties, so every count and total involving them is wrong." },
    { p: "The practical answer is normalisation: reduce every name to a comparable form, then match on that." },
    {
      ol: [
        "<span class='f'>TRIM</span> to remove stray spaces.",
        "<span class='f'>UPPER</span> to remove case differences.",
        "<span class='f'>SUBSTITUTE</span> to strip punctuation, then the common suffixes: LIMITED, LTD, PLC, CO, AND.",
        "Match on the result, keeping the original in its own column."
      ]
    },
    { f: '=TRIM(SUBSTITUTE(SUBSTITUTE(UPPER(F2),"LIMITED",""),"LTD",""))' },
    { why: "This is exact matching on a cleaned key, not fuzzy matching. Real fuzzy matching scores how similar two strings are and Excel has no function for it. Normalising first catches most of the value for a fraction of the effort, and everything it catches is defensible, which matters when somebody asks how you decided two names were the same party." },
    { pro: "Never overwrite the original name. When a match is queried, and it will be, you have to show both the raw values and the rule that made them equal. A normalised column beside the original is evidence; a cleaned column on its own is an assertion." },
    { trap: "Normalising too hard merges genuinely different parties. Strip enough and Marlow Freight and Marlow Freightways become the same key. Check the distinct list after normalising, and check what collapsed into what." },
    { desk: "Power Query has Fuzzy Merge, which scores similarity and lets you set a threshold. It is genuinely useful and it is a judgement call wearing a number, so record the threshold you used alongside the results." }
  ],
  reflect: [
    "Say why the round-amount test is weak on its own and what you would combine it with.",
    "What could go wrong if you strip too much when normalising a name?"
  ],

  practice: function (seed) {
    const r = rng(seed + ":names");
    const rows = fcRows(seed, { round: true, background: 60 });
    const variants = ["Marlow Freight Ltd", "MARLOW FREIGHT LIMITED", "Marlow Freight Ltd ", "marlow freight ltd"];
    rows.forEach((t, i) => { if (t.counterparty === "Marlow Freight Ltd") t.counterparty = rPick(r, variants); });

    const sh = fcSheet("Signals", rows, ["Counterparty", "Round?", "Clean name"]);
    const n = rows.length, last = n + 1;
    rows.forEach((t, i) => sh.set(1 + i, 5, t.counterparty, { locked: true }));

    const roundCells = [], nameCells = [];
    for (let i = 0; i < n; i++) { roundCells.push("G" + (2 + i)); nameCells.push("H" + (2 + i)); }
    const ansStart = n + 4;
    const cells = fcAnswers(sh, ansStart, ["Round payments (multiples of 1,000)", "Distinct counterparties, as received", "Distinct after normalising"]);
    lockSheet(sh, roundCells.concat(nameCells, cells));
    sh.rows = ansStart + cells.length + 2; sh.cols = 9;

    const isRound = a => Math.abs(a - Math.round(a)) < 1e-9 && Math.round(a) % 1000 === 0;
    const eRound0 = isRound(rows[0].amount) ? 1 : 0;
    const eRoundTotal = rows.filter(t => isRound(t.amount)).length;
    const normal = s => String(s).toUpperCase().replace(/LIMITED/g, "").replace(/LTD/g, "").replace(/\s+/g, " ").trim();
    const rawSet = [], normSet = [];
    rows.forEach(t => {
      if (rawSet.indexOf(String(t.counterparty).toUpperCase()) < 0) rawSet.push(String(t.counterparty).toUpperCase());
      if (normSet.indexOf(normal(t.counterparty)) < 0) normSet.push(normal(t.counterparty));
    });
    const eClean0 = normal(rows[0].counterparty);

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 9, colWidth: 86, startRow: 1, startCol: 6,
      fillBar: true, highlight: roundCells.concat(nameCells, cells),
      brief: {
        title: "Two cheap signals on the same file",
        body: "Flag payments that are exact multiples of 1,000, and normalise the counterparty names so the same party is counted once. " +
          "One counterparty appears under four spellings, which means every total involving it is currently wrong."
      },
      hint: "MOD gives the remainder after division. For the names, work from the outside in: uppercase, then strip the suffixes, then trim.",
      tasks: [
        { id: "t1", text: "In G2, return 1 when the amount is an exact multiple of 1,000 and 0 otherwise. Fill down.", cell: "G2" },
        { id: "t2", text: "In H2, produce a normalised counterparty name: uppercase, with LIMITED and LTD removed, and trimmed. Fill down.", cell: "H2" },
        { id: "t3", text: "In " + cells[0] + ", total the round-payment flags.", cell: cells[0] },
        { id: "t4", text: "In " + cells[1] + ", count the distinct counterparties as received.", cell: cells[1] },
        { id: "t5", text: "In " + cells[2] + ", count them again after normalising. The difference is what the spelling was costing you.", cell: cells[2], ext: true }
      ],
      checks: [
        {
          cell: "G2", expect: eRound0, needFormula: true, mustUseAll: ["IF", "MOD"],
          task: "G2: the round-amount flag.",
          answer: "=IF(MOD(D2,1000)=0,1,0)",
          why: "MOD returns the remainder, so a remainder of zero means an exact multiple. Returning 1 and 0 rather than TRUE and FALSE means the column can be totalled and charted, which was the Module 3 rule.",
          wrongWay: "<span class='f'>=IF(RIGHT(D2,3)=\"000\",1,0)</span>. It treats the amount as text, so it depends on formatting, and it misses 5000 stored without decimals while catching 1000.5 displayed as 1,000."
        },
        {
          cell: "H2", expect: eClean0, needFormula: true, mustUseAll: ["UPPER", "SUBSTITUTE"],
          task: "H2: the normalised counterparty name.",
          answer: '=TRIM(SUBSTITUTE(SUBSTITUTE(UPPER(F2),"LIMITED",""),"LTD",""))',
          why: "Uppercase first so the suffix strip is case-insensitive, then remove LIMITED before LTD, because removing LTD first would leave IMITED behind from LIMITED. Order matters in nested SUBSTITUTE and this is the classic way it bites.",
          wrongWay: "Stripping LTD first. <span class='f'>MARLOW FREIGHT LIMITED</span> becomes <span class='f'>MARLOW FREIGHT IMITED</span>, which matches nothing and looks like a data problem rather than a formula one."
        },
        {
          cell: cells[0], expect: eRoundTotal, needFormula: true, mustUse: "SUM",
          task: cells[0] + ": the number of round payments.",
          answer: "=SUM(G2:G" + last + ")",
          why: "Because the flag column holds numbers, one SUM answers it. On its own this figure is weak evidence, since salaries and rent are legitimately round; it earns its place combined with a second signal.",
          wrongWay: "Reporting it as a finding by itself. Round-amount analysis without a corroborating signal is mostly noise."
        },
        {
          cell: cells[1], expect: rawSet.length, needFormula: true,
          task: cells[1] + ": distinct counterparties as received.",
          answer: "=COUNTA(UNIQUE(F2:F" + last + "))",
          why: "The book appears to have " + rawSet.length + " counterparties. It does not, and every count and total broken down by counterparty is currently wrong by the difference.",
          wrongWay: "Trusting this figure. A distinct count over uncleaned names is a measure of spelling, not of parties."
        },
        {
          cell: cells[2], ext: true, expect: normSet.length, needFormula: true,
          task: cells[2] + ": distinct counterparties after normalising.",
          answer: "=COUNTA(UNIQUE(H2:H" + last + "))",
          why: normSet.length + " rather than " + rawSet.length + ". Now check what collapsed into what, because normalising too hard merges genuinely different parties, and a wrong merge is worse than a missed one.",
          wrongWay: "Reporting the reduced figure without inspecting the merges. You have asserted that certain names are the same party and you must be able to show the rule that decided it."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M8S3"); wb.add(M8S3.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 4
   ============================================================ */
const M8S4 = {
  title: "Dormancy, and turning flags into a case",
  aim: "Spot an account that has been quiet and suddenly is not, then rank what you have found and write it up.",
  why: "A pile of flags is not analysis. The last step, ranking by severity and stating the evidence in plain sentences, is the part that gets read and the part beginners skip.",
  concepts: ["m8.dormancy", "m8.gapdetect", "m8.severity", "m8.writeup"],
  unlocks: ["MAXIFS", "MINIFS"],
  lesson: [
    { lead: "Dormancy is interesting because of what it means, not what it looks like." },
    { p: "An account with no activity for weeks and then three large payments has changed behaviour. The payments themselves may be perfectly ordinary in size; it is the gap in front of them that is the signal." },
    { h: "Measuring the gap" },
    { p: "For each payment, find the most recent earlier payment on the same account and subtract. Without helper columns the clean way is a windowed MAX:" },
    { f: '=C2 - MAXIFS($C$2:$C$90, $B$2:$B$90, B2, $C$2:$C$90, "<"&C2)' },
    { p: "Read it: the largest date on this account that is earlier than this one, subtracted from this one. That is the days since the account last moved. The first payment on an account has no earlier date, so the result is the date itself and needs handling; an IF checking whether any earlier payment exists is the honest fix." },
    { pro: "Combine the gap with the amount. A long gap followed by a payment in line with the account's history is a customer coming back from holiday. A long gap followed by the largest payment the account has ever made is the pattern worth writing up." },
    { h: "Ranking" },
    { p: "You now have four signals across this module: band payments, velocity, roundness and dormancy. Score each account on each, and sort. Two signals on one account is more interesting than one signal on two accounts, and a scored list is the difference between a report somebody reads and a spreadsheet somebody files." },
    { trap: "Do not add scores from signals of different quality and present the total as though it meant something. A weighted score is a judgement, and the weights are yours. Show the component signals beside the total so a reader can disagree with your weighting rather than having to accept it." },
    { h: "Writing it up" },
    { p: "Each finding is a short paragraph with the same four parts, in this order:" },
    {
      ol: [
        "<strong>What was seen.</strong> Account, period, and the specific behaviour, with figures.",
        "<strong>Why it stands out.</strong> The comparison that makes it unusual, against the account's own history or the rest of the book.",
        "<strong>What it might be.</strong> Named plainly, including the innocent explanation.",
        "<strong>What you checked and could not resolve.</strong> The honest limits."
      ]
    },
    { p: "Roughly a hundred words each. Longer than that and it will be skimmed; shorter and it cannot be acted on." },
    { why: "The fourth part is what separates a competent write-up from a junior one. Stating what you could not establish is not weakness, it is the thing that lets somebody else pick the work up without repeating it, and its absence makes a reader wonder what else went unsaid." },
    { desk: "Nothing desktop-only here. This is judgement, and no tool supplies it." }
  ],
  reflect: [
    "Say why the gap in front of a payment can matter more than the payment.",
    "Write the fourth part of a write-up for the account you found: what did you check and fail to resolve?"
  ],

  practice: function (seed) {
    const rows = fcRows(seed, { dormant: true, structuring: true, structuringCount: 5, background: 60 });
    const sh = fcSheet("Dormancy", rows, ["Days since last"]);
    const n = rows.length, last = n + 1;

    const gapCells = [];
    for (let i = 0; i < n; i++) gapCells.push("F" + (2 + i));
    const ansStart = n + 4;
    const cells = fcAnswers(sh, ansStart, ["Longest gap, in days", "Account with that gap", "Payment after the gap"]);
    lockSheet(sh, gapCells.concat(cells));
    { const p = parseA1(cells[2]); sh.ensure(p.r, p.c).fmt = GBP2; }
    sh.rows = ansStart + cells.length + 2; sh.cols = 8;

    const acctR = "$B$2:$B$" + last, datR = "$C$2:$C$" + last;
    const gapOf = t => {
      const prior = rows.filter(x => x.account === t.account && x.date < t.date);
      if (!prior.length) return 0;
      return t.date - Math.max.apply(null, prior.map(x => x.date));
    };
    const gaps = rows.map(gapOf);
    const maxGap = Math.max.apply(null, gaps);
    const gi = gaps.indexOf(maxGap);

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 8, colWidth: 92, startRow: 1, startCol: 5,
      fillBar: true, highlight: gapCells.concat(cells),
      brief: {
        title: "One account wakes up",
        body: "For every payment, work out how many days had passed since that account last moved money. " +
          "The first payment on any account has nothing before it, so return 0 for those rather than a nonsense figure. " +
          "One account has been silent for weeks and then moves a great deal."
      },
      hint: "MAXIFS gives the largest date on this account earlier than this row. Guard the first payment on each account with an IF that checks whether any earlier payment exists.",
      tasks: [
        { id: "t1", text: "In F2, the days since that account last moved money, or 0 if this is its first payment. Fill down.", cell: "F2" },
        { id: "t2", text: "In " + cells[0] + ", the longest gap in the file.", cell: cells[0] },
        { id: "t3", text: "In " + cells[1] + ", the account that had it.", cell: cells[1] },
        { id: "t4", text: "In " + cells[2] + ", the amount of the payment that ended the gap.", cell: cells[2] },
        { id: "t5", text: "Away from the grid: list the accounts showing two or more of this module's four signals, and write the four-part write-up for the strongest one. This is judgement, so nothing marks it but you.", cell: null, ext: true }
      ],
      checks: [
        {
          cell: "F2", expect: gaps[0], needFormula: true, mustUseAll: ["MAXIFS", "IF"],
          task: "F2: days since that account last moved.",
          answer: '=IF(COUNTIFS(' + acctR + ',B2,' + datR + ',"<"&C2)=0,0,C2-MAXIFS(' + datR + ',' + acctR + ',B2,' + datR + ',"<"&C2))',
          why: "The IF handles the first payment on each account, where there is no earlier date and MAXIFS returns 0, which would otherwise subtract from the date and give a gap of about 45,000 days. Guarding the empty case explicitly is more honest than letting a wrong number through.",
          wrongWay: "Using MAXIFS alone. The first payment on every account reports an enormous gap, those rows dominate any ranking, and the genuine dormancy finding is buried under six artefacts."
        },
        {
          cell: cells[0], expect: maxGap, needFormula: true, mustUse: "MAX",
          task: cells[0] + ": the longest gap.",
          answer: "=MAX(F2:F" + last + ")",
          why: maxGap + " days of silence. Note that the payment ending it is not remarkable by size against the whole book; it is remarkable against this account's own history, which is why a fixed amount threshold would never have found it.",
          wrongWay: "Ignoring gaps because no individual payment looks large. The gap is the signal and the payment is only what ended it."
        },
        {
          cell: cells[1], expect: rows[gi].account,
          task: cells[1] + ": the account with the longest gap.",
          answer: rows[gi].account,
          why: "Found by looking up the maximum, or by sorting the gap column. This account and the structuring account from session 1 are different accounts, which is what makes a scored ranking across signals worth building.",
          wrongWay: "Assuming the same account trips every test. Real books rarely oblige, and a scoring approach exists precisely because signals land in different places."
        },
        {
          cell: cells[2], expect: rows[gi].amount, tol: 0.02,
          task: cells[2] + ": the payment that ended the gap.",
          answer: gbp(rows[gi].amount),
          why: "This figure and the gap belong in the same sentence of the write-up: silent for " + maxGap + " days, then " + gbp(rows[gi].amount) + ". Either alone is unremarkable and together they are the finding.",
          wrongWay: "Reporting the gap without the amount. A long gap on a dormant account with a small payment is somebody paying a subscription."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M8S4"); wb.add(M8S4.practice(seed).sheet); return wb; }
};

defModule({
  id: "m8", n: 8, stage: "s2",
  title: "Finding the needle",
  subtitle: "Structuring, velocity, round amounts, fuzzy names, dormancy",
  blurb: "Synthetic transaction data with patterns planted in it. Every test here is built from Module 3 arithmetic; what is new is knowing which question to ask and how to rank what comes back.",
  onComplete: "You can build the four standard detection tests and, more importantly, turn what they return into a ranked case with evidence. Module 9 gives you the statistics to say how unusual something actually is rather than merely that it stood out.",
  concepts: [
    { id: "m8.structuring", label: "Structuring", blurb: "Repeated payments stopping just short of a threshold." },
    { id: "m8.band", label: "Test the band, not the threshold", blurb: "Nearly everything is under it; proximity is the signal." },
    { id: "m8.perentity", label: "Count per account", blurb: "One payment is a Tuesday; six is a decision." },
    { id: "m8.falsepositives", label: "False positives are the job", blurb: "Explain an innocent hit on the file; never suppress it." },
    { id: "m8.velocity", label: "Velocity", blurb: "How much, how fast, rather than how much in total." },
    { id: "m8.rollingwindow", label: "Rolling windows", blurb: "Calendar buckets split a burst that straddles a Sunday." },
    { id: "m8.ownbaseline", label: "Compare against its own normal", blurb: "One threshold for every account is the commonest weakness." },
    { id: "m8.windowchoice", label: "The window is a choice", blurb: "State it, and rerun with another before concluding." },
    { id: "m8.roundamounts", label: "Round amounts", blurb: "Real invoices end in 47p." },
    { id: "m8.modtest", label: "MOD for exact multiples", blurb: "Remainder of zero means it divides exactly." },
    { id: "m8.fuzzynames", label: "One party, three spellings", blurb: "Every total by counterparty is wrong until fixed." },
    { id: "m8.normalise", label: "Normalise, keep the original", blurb: "And check what collapsed into what." },
    { id: "m8.dormancy", label: "Dormancy", blurb: "The gap in front of a payment can matter more than the payment." },
    { id: "m8.gapdetect", label: "Measuring the gap", blurb: "MAXIFS for the previous date, guarded for the first row." },
    { id: "m8.severity", label: "Rank, do not flag", blurb: "Show the components beside any combined score." },
    { id: "m8.writeup", label: "The four-part write-up", blurb: "Seen, why unusual, what it might be, what you could not resolve." }
  ],
  sessions: [M8S1, M8S2, M8S3, M8S4]
});
