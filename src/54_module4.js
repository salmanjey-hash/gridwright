/* ============================================================
   Module 4: Cleaning dirty data
   The practice files here are the filthiest in the course, on
   purpose. Cleaning is not a bonus topic; it is most of the job.

   Power Query appears only as a marked aside. It is the right
   professional tool and it hides the logic, so it is taught after
   the formulas rather than instead of them.
   ============================================================ */

const M4_NAMES = [
  "Redgate Supplies", "Halden & Co", "Northwood Ltd", "Peak Trading",
  "Mersey Print", "Calder Foods", "Ashby Motors", "Wear Valley Steel"
];

/* Break a clean name the way a real export does. */
function dirty(r, name) {
  return rWeighted(r, [
    [name, 4],
    ["  " + name, 2],
    [name + " ", 3],
    [" " + name + "  ", 1],
    [name.toUpperCase(), 2],
    [name.toLowerCase(), 1],
    [name.replace(/ /g, "  "), 1]
  ]);
}

/* ============================================================
   Session 1
   ============================================================ */
const M4S1 = {
  title: "Spaces you cannot see, and capitals that do not match",
  aim: "Find and fix the invisible flaws that make everything downstream fail quietly.",
  why: "A trailing space is invisible, harmless-looking, and breaks every lookup, count and match you will write in Module 5. It is the most common defect in real data and the cheapest to fix once you can see it.",
  concepts: ["m4.trim", "m4.lendiag", "m4.case", "m4.helper"],
  unlocks: ["TRIM", "UPPER", "LOWER", "PROPER", "LEN", "EXACT", "CLEAN"],
  lesson: [
    { lead: "Most dirty data does not look dirty." },
    { p: "Data that arrives from a portal, a bank statement, a PDF or somebody else's spreadsheet carries damage you cannot see on screen. Two cells that look identical are different to Excel, so a lookup returns #N/A and a count comes back short, and nothing on the sheet explains why." },
    { h: "TRIM" },
    { p: "TRIM removes spaces from the start and end of text, and reduces any run of spaces in the middle to a single one. It does nothing else, and it is the single most useful function in this module." },
    { f: '=TRIM("  Acme   Ltd  ")        "Acme Ltd"' },
    { trap: "TRIM does not remove the non-breaking space, character 160, which is what you get when you copy out of a web page. It looks exactly like a normal space and TRIM ignores it. The fix is to substitute it out first: <span class='f'>=TRIM(SUBSTITUTE(A2,CHAR(160),\" \"))</span>. If TRIM appears to do nothing on data copied from a website, this is why." },
    { h: "LEN, as a diagnostic" },
    { p: "You cannot see a trailing space, so measure instead. LEN counts characters, spaces included." },
    { f: '=LEN(A2)            14\n=LEN(TRIM(A2))      12' },
    { p: "Two characters have gone, so there were two stray spaces. Putting those side by side in a helper column tells you instantly how much of a column is damaged, without reading a single value." },
    { pro: "Before cleaning anything, count the damage. <span class='f'>=SUMPRODUCT(--(LEN(A2:A100)&lt;&gt;LEN(TRIM(A2:A100))))</span> tells you how many rows have hidden spaces. If it is 3 of 100 you fix them; if it is 80 of 100 the export itself is wrong and you go back to whoever sent it." },
    { h: "Capitals" },
    {
      ul: [
        "<span class='f'>UPPER</span> makes everything capitals. Useful for codes, references and postcodes.",
        "<span class='f'>LOWER</span> makes everything lower case. Useful for email addresses.",
        "<span class='f'>PROPER</span> capitalises the first letter of each word. Useful for names, with one caveat below."
      ]
    },
    { trap: "PROPER capitalises after any character that is not a letter, so <span class='f'>o'brien</span> becomes <span class='f'>O'Brien</span>, which is right, and <span class='f'>don't</span> becomes <span class='f'>Don'T</span>, which is not. It also lowercases genuine acronyms: <span class='f'>BBC</span> becomes <span class='f'>Bbc</span>. Run it, then read the column." },
    { h: "Excel ignores case. EXACT does not." },
    { p: "<span class='f'>=A2=B2</span> returns TRUE for London and LONDON, and so do COUNTIF, SUMIF and every lookup. That is usually convenient and occasionally dangerous, because two rows differing only in capitalisation will be treated as the same by everything except Remove Duplicates." },
    { f: '="ABC"="abc"           TRUE\n=EXACT("ABC","abc")    FALSE' },
    { h: "The helper column, and why you keep the original" },
    { p: "Never clean data in place. Put the cleaned version in a new column beside it, so you can compare the two and prove what you changed." },
    {
      steps: [
        "Insert a new column to the right of the dirty one.",
        "Write the cleaning formula in the first row, pointing at the dirty cell.",
        "Check it, then fill it down the whole column.",
        "Compare the two columns. Spot-check a few rows that changed.",
        "Only when you are satisfied, select the clean column, copy it, and use <span class='path'><span>Paste</span><i>›</i><span>Values</span></span> over itself. That turns the formulas into fixed text so you can delete the dirty column."
      ]
    },
    { why: "Paste Values is the step people forget. Until you do it, the clean column is a set of formulas that depend on the dirty column; delete the dirty one and every cleaned value collapses to #REF!. Paste Values cuts the link and makes the cleaning permanent." },
    { web: "Paste Values is in Excel for the web under the paste dropdown on the Home tab, or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd>. It behaves exactly as it does on desktop." },
    { desk: "Power Query does this whole session in four clicks: <span class='path'><span>Data</span><i>›</i><span>Get Data</span><i>›</i><span>From Table/Range</span></span>, then right-click the column and choose <span class='f'>Transform</span> for Trim, Clean and Capitalize Each Word. It also remembers the steps, so next month's file is cleaned by pressing Refresh. Learn it once the formulas make sense to you, because when a Power Query step gives you the wrong answer, the formulas are how you work out why." }
  ],
  reflect: [
    "Say what LEN told you that reading the column could not.",
    "If you had cleaned in place and deleted the original, what would you have lost?"
  ],

  practice: function (seed) {
    const r = rng(seed);
    const raw = [];
    for (let i = 0; i < 12; i++) raw.push(dirty(r, M4_NAMES[i % M4_NAMES.length]));

    const sh = new Sheet("Suppliers", 22, 6);
    sh.set(0, 0, "Supplier (as received)", { hdr: true });
    sh.set(0, 1, "Length", { hdr: true });
    sh.set(0, 2, "Trimmed", { hdr: true });
    sh.set(0, 3, "Trimmed length", { hdr: true });
    sh.set(0, 4, "Clean name", { hdr: true });
    raw.forEach((v, i) => sh.set(1 + i, 0, v));

    label(sh, "A15", "Rows with hidden spaces");
    label(sh, "A16", "Rows changed by cleaning");

    const answers = [];
    for (let i = 0; i < 12; i++) { answers.push("B" + (2 + i), "C" + (2 + i), "D" + (2 + i), "E" + (2 + i)); }
    answers.push("C15", "C16");
    lockSheet(sh, answers);
    sh.rows = 18; sh.cols = 6;

    const eLen0 = solve(sh, "=LEN(A2)");
    const eTrim0 = solve(sh, "=TRIM(A2)");
    const eTLen0 = solve(sh, "=LEN(TRIM(A2))");
    const eClean0 = solve(sh, "=PROPER(TRIM(A2))");
    const eLast = solve(sh, "=PROPER(TRIM(A13))");
    const eHidden = solve(sh, "=SUMPRODUCT(--(LEN(A2:A13)<>LEN(TRIM(A2:A13))))");
    const eChanged = solve(sh, "=SUMPRODUCT(--(EXACT(A2:A13,PROPER(TRIM(A2:A13)))=FALSE))");

    return {
      sheet: sh,
      maxRows: 18, maxCols: 6, startRow: 1, startCol: 1,
      formatBar: false, fillBar: true,
      highlight: answers,
      brief: {
        title: "Twelve supplier names, straight out of a portal export",
        body: "Every one of these looks fine and several are not. Build the diagnostic columns first, so you can see the damage, " +
          "then produce a clean name column. Do not touch column A: keeping the original is how you prove what you changed."
      },
      hint: "Write the formula in the top row, check it, then <strong>Fill down ↓</strong>. Column B and D exist so you can compare lengths before and after.",
      tasks: [
        { id: "t1", text: "In B2, count the characters in the name as received. Fill down.", cell: "B2" },
        { id: "t2", text: "In C2, produce a trimmed version. Fill down.", cell: "C2" },
        { id: "t3", text: "In D2, count the characters after trimming. Fill down, then compare B against D.", cell: "D2" },
        { id: "t4", text: "In E2, produce the final clean name: trimmed <em>and</em> consistently capitalised. Fill down to E13.", cell: "E2" },
        { id: "t5", text: "Check the bottom of column E against the raw name beside it.", cell: "E13" },
        { id: "t6", text: "In C15, count how many rows had hidden spaces, using the length comparison rather than your eyes.", cell: "C15", ext: true },
        { id: "t7", text: "In C16, count how many rows the cleaning actually changed. Capitalisation counts as a change, so ordinary equals will not do.", cell: "C16", ext: true }
      ],
      checks: [
        {
          cell: "B2", expect: eLen0, needFormula: true, mustUse: "LEN",
          task: "B2: the length as received.",
          answer: "=LEN(A2)",
          why: "LEN counts every character including spaces. On its own it means little; beside column D it tells you exactly how many stray spaces each row carries.",
          wrongWay: "Counting by eye. Trailing spaces are invisible, which is the entire problem this session exists to solve."
        },
        {
          cell: "C2", expect: eTrim0, needFormula: true, mustUse: "TRIM",
          task: "C2: the trimmed name.",
          answer: "=TRIM(A2)",
          why: "TRIM strips the ends and collapses internal runs of spaces to one. Note it does not touch capitalisation, which is the next problem.",
          wrongWay: "Retyping the names by hand. Twelve rows is tempting and forty thousand is not, and hand-retyping introduces its own errors."
        },
        {
          cell: "D2", expect: eTLen0, needFormula: true, mustUse: "LEN",
          task: "D2: the length after trimming.",
          answer: "=LEN(C2)   or   =LEN(TRIM(A2))",
          why: "Either is correct. Pointing at C2 is better, because the trimming lives in one place and D simply measures it. Where B and D differ, that row had hidden spaces.",
          wrongWay: "Writing <span class='f'>=LEN(A2)</span> again, which just reproduces column B and tells you nothing."
        },
        {
          cell: "E2", expect: eClean0, needFormula: true, mustUseAll: ["PROPER", "TRIM"],
          task: "E2: the final clean name.",
          answer: "=PROPER(TRIM(A2))",
          why: "Functions nest inside out: TRIM runs first on the raw value, then PROPER capitalises the result. Working from column A rather than column C keeps the whole cleaning rule visible in one cell, which matters when somebody asks what you did.",
          wrongWay: "<span class='f'>=TRIM(PROPER(A2))</span> gives the same answer here and is the wrong way round in principle: capitalise the tidy value, not the untidy one. Also check the result by eye, because PROPER turns genuine acronyms into Title Case."
        },
        {
          cell: "E13", expect: eLast, needFormula: true, mustUseAll: ["PROPER", "TRIM"],
          task: "E13: the last clean name, reached by filling.",
          answer: "=PROPER(TRIM(A13))",
          why: "The reference moved down eleven rows. Nothing here should be locked, because every part of this formula is about its own row.",
          wrongWay: "Stopping the fill short. Check the bottom row of every filled column: it is the Module 2 habit and it applies for the rest of the course."
        },
        {
          cell: "C15", ext: true, expect: eHidden, needFormula: true,
          task: "C15: how many rows had hidden spaces.",
          answer: "=SUMPRODUCT(--(LEN(A2:A13)<>LEN(TRIM(A2:A13))))",
          why: "The comparison produces TRUE and FALSE down the whole column; the double minus turns those into 1 and 0; SUMPRODUCT adds them up. Counting the damage before you fix it tells you whether this is a data problem or an export problem.",
          wrongWay: "<span class='f'>=COUNTIF(B2:B13,\"<>\"&D2:D13)</span>. COUNTIF compares a range against one criterion, not against another range row by row, so it cannot answer this."
        },
        {
          cell: "C16", ext: true, expect: eChanged, needFormula: true, mustUse: "EXACT",
          task: "C16: how many rows the cleaning changed.",
          answer: "=SUMPRODUCT(--(EXACT(A2:A13,PROPER(TRIM(A2:A13)))=FALSE))",
          why: "EXACT is needed because Excel's ordinary equals ignores capitalisation, so a row where only the capitals changed would count as unchanged. This number should be at least as large as C15, since some rows had capitalisation problems but no stray spaces.",
          wrongWay: "Using <span class='f'>A2:A13&lt;&gt;PROPER(TRIM(A2:A13))</span>, which misses every row that was only miscapitalised and quietly undercounts your own work."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M4S1"); wb.add(M4S1.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 2
   ============================================================ */
const M4S2 = {
  title: "Numbers and dates that are only pretending",
  aim: "Convert text that looks numeric into values Excel can actually calculate with.",
  why: "Module 1 taught you to spot these by their alignment. This session is what to do about a thousand of them at once, without retyping anything.",
  concepts: ["m4.value", "m4.datevalue", "m4.coerce", "m4.textisoneway"],
  unlocks: ["VALUE", "DATEVALUE", "TEXT", "SUBSTITUTE"],
  lesson: [
    { lead: "Spotting a number stored as text is Module 1. Converting fifty thousand of them is this session." },
    { h: "VALUE" },
    { p: "VALUE turns text that looks like a number into a number. It copes with thousands separators and currency symbols, and it refuses anything with a word in it." },
    { f: '=VALUE("1,250")        1250\n=VALUE("£84.30")       84.3\n=VALUE("45 units")     #VALUE!' },
    { p: "That last one is not a defect. A cell containing a number and a unit has two facts in it, and no function can guess which part you meant. Split it, which is next session." },
    { h: "The trick you will see in other people's sheets" },
    { p: "Any arithmetic forces Excel to convert text that looks numeric, so all of these work:" },
    { f: '=A2*1\n=A2+0\n=--A2\n=VALUE(A2)' },
    { pro: "They all give the same answer. Use VALUE. The others work by side effect, and a reader six months later has to stop and work out what <span class='f'>--A2</span> was for. The double minus is worth recognising because it is common, particularly inside SUMPRODUCT, but it is not worth writing when a named function says the same thing." },
    { h: "When VALUE is not enough" },
    { p: "European exports use a comma for the decimal point and a full stop for thousands, so <span class='f'>1.250,75</span> means one thousand two hundred and fifty. VALUE reads that as 1.25 or errors. Fix the separators before converting:" },
    { f: '=VALUE(SUBSTITUTE(SUBSTITUTE(A2,".",""),",","."))' },
    { p: "Read it inside out: remove the full stops, then turn the comma into a full stop, then convert. Nesting three functions is normal and it is why the helper-column habit matters, because a wrong answer in a stack like this is hard to locate otherwise." },
    { h: "DATEVALUE" },
    { p: "DATEVALUE turns text that looks like a date into the day count Excel stores. Format the result as a date afterwards, or it shows as a five-digit number." },
    { f: '=DATEVALUE("17/03/2024")     45368\n=DATEVALUE("2024-03-17")     45368' },
    { trap: "DATEVALUE reads the text using your regional settings, so <span class='f'>03/04/2024</span> becomes 3 April in the United Kingdom and 4 March in the United States. If a column of dates converts without error but a third of them look wrong, this is why. The safe fix is to rebuild the date from its parts: <span class='f'>=DATE(RIGHT(A2,4), MID(A2,4,2), LEFT(A2,2))</span>, which states the order explicitly and cannot be misread." },
    { h: "TEXT goes the other way, and only one way" },
    { p: "TEXT turns a number or date into text in a chosen format. It is for labels, not for data." },
    { f: '=TEXT(45368,"dd mmm yyyy")     "17 Mar 2024"\n=TEXT(0.256,"0.0%")             "25.6%"' },
    { trap: "The output is text. It can no longer be added, averaged or sorted as a number, and it will be silently skipped by SUM. Building a column with TEXT and then wondering why the total is zero is a common way to lose an afternoon. If the figure will be calculated with, format the cell instead and leave the value alone." },
    { h: "Making it permanent" },
    { p: "The converted values are formulas depending on the dirty column. Copy them, Paste Values over themselves, and only then delete the original. Same discipline as last session." },
    { web: "Excel for the web has one shortcut worth knowing: select a column of text-numbers and a small warning triangle appears offering <span class='f'>Convert to Number</span>. It works, it is fast, and it is a one-off that leaves no record of what you did. For a file you will receive again next month, the formula is better." },
    { desk: "Power Query's <span class='f'>Change Type</span> does all of this, and its <span class='f'>Using Locale</span> option is the proper answer to the European decimal problem: you tell it the file came from Germany and it reads every number correctly, with no nested SUBSTITUTE at all. It is genuinely better than the formula approach here, once you understand what it is doing." }
  ],
  reflect: [
    "Say why =A2*1 works, and why you should still write VALUE.",
    "If a converted date column looked half right, what would you suspect first?"
  ],

  practice: function (seed) {
    const r = rng(seed);
    const n = 10;
    const amounts = [], dates = [], rawAmt = [], rawDate = [];
    for (let i = 0; i < n; i++) {
      const a = xround(rInt(r, 4200, 240000) / 100, 2);
      amounts.push(a);
      rawAmt.push(rWeighted(r, [
        ["£" + a.toFixed(2), 3],
        [a.toFixed(2), 2],
        [a.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 3]
      ]));
      const d = ymdToSerial(2024, 2, 1) + rInt(r, 0, 80);
      dates.push(d);
      rawDate.push(formatDate(d, "dd/mm/yyyy"));
    }

    const sh = new Sheet("Conversions", 20, 6);
    sh.set(0, 0, "Invoice", { hdr: true });
    sh.set(0, 1, "Amount (text)", { hdr: true });
    sh.set(0, 2, "Amount", { hdr: true });
    sh.set(0, 3, "Date (text)", { hdr: true });
    sh.set(0, 4, "Date", { hdr: true });
    for (let i = 0; i < n; i++) {
      sh.set(1 + i, 0, "INV-" + (3100 + i));
      sh.set(1 + i, 1, rawAmt[i]);
      sh.set(1 + i, 3, rawDate[i]);
    }
    label(sh, "A13", "Total, before converting");
    label(sh, "A14", "Total, after converting");

    const answers = [];
    for (let i = 0; i < n; i++) { answers.push("C" + (2 + i), "E" + (2 + i)); }
    answers.push("C13", "C14");
    lockSheet(sh, answers);
    for (let i = 0; i < n; i++) {
      const p = parseA1("C" + (2 + i)); sh.ensure(p.r, p.c).fmt = GBP2;
      const q = parseA1("E" + (2 + i)); sh.ensure(q.r, q.c).fmt = DATEFMT;
    }
    ["C13", "C14"].forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });
    sh.rows = 16; sh.cols = 6;

    const eAmt0 = amounts[0];
    const eAmtLast = amounts[n - 1];
    const eDate0 = dates[0];
    const eBefore = 0;                      // SUM over a column of text is nothing at all
    const eAfter = xround(amounts.reduce((a, b) => a + b, 0), 2);

    return {
      sheet: sh,
      maxRows: 16, maxCols: 6, startRow: 1, startCol: 2,
      formatBar: false, fillBar: true,
      highlight: answers,
      brief: {
        title: "Ten invoices where nothing at all is a number",
        body: "Every amount and every date in this file arrived as text. Some amounts carry a typed pound sign, some carry thousands separators. " +
          "Convert them into real values in the columns beside them, then total the column before and after so you can see exactly what the damage was worth."
      },
      hint: "VALUE for the amounts, DATEVALUE for the dates. The converted date will look like a five-digit number until the cell is formatted as a date; that formatting is already applied for you here.",
      tasks: [
        { id: "t1", text: "In C2, convert the first amount into a real number. Fill down to C11.", cell: "C2" },
        { id: "t2", text: "Check C11 against the text beside it.", cell: "C11" },
        { id: "t3", text: "In E2, convert the first date into a real date. Fill down to E11.", cell: "E2" },
        { id: "t4", text: "In C13, total the <em>text</em> column B. Look at what you get.", cell: "C13" },
        { id: "t5", text: "In C14, total the converted column C.", cell: "C14" },
        { id: "t6", text: "Compare C13 and C14. That difference is what a column of text costs you, silently.", cell: null, ext: true }
      ],
      checks: [
        {
          cell: "C2", expect: eAmt0, needFormula: true, mustUse: "VALUE", tol: 0.005,
          task: "C2: the first amount as a number.",
          answer: "=VALUE(B2)",
          why: "VALUE handles the pound sign and the thousands separator without help. The result is right-aligned, which is the Module 1 confirmation that it worked.",
          wrongWay: "<span class='f'>=B2*1</span> gives the same answer and hides its purpose. Recognise it in other people's sheets; write VALUE in your own."
        },
        {
          cell: "C11", expect: eAmtLast, needFormula: true, mustUse: "VALUE", tol: 0.005,
          task: "C11: the last amount, reached by filling.",
          answer: "=VALUE(B11)",
          why: "If any row in this column shows #VALUE!, that row has something in it VALUE cannot interpret, and it needs looking at individually rather than being worked around.",
          wrongWay: "Wrapping the whole column in IFERROR to make the errors disappear. That converts a visible data problem into an invisible one."
        },
        {
          cell: "E2", expect: eDate0, needFormula: true, mustUse: "DATEVALUE",
          task: "E2: the first date as a real date.",
          answer: "=DATEVALUE(D2)",
          why: "The result is " + eDate0 + ", the day count for " + formatDate(eDate0, "dd mmm yyyy") + ". The cell is already formatted as a date so you see it as one. Now it can be sorted, subtracted and grouped by month.",
          wrongWay: "Formatting column D as a date and expecting the text to become a date. Formatting never changes what is stored, which was Module 1 session 2."
        },
        {
          cell: "C13", expect: eBefore, needFormula: true, mustUse: "SUM",
          task: "C13: the total of the text column.",
          answer: "=SUM(B2:B11)",
          why: "Zero. Not an error, not a warning: zero. Every value in that column is text, SUM skips text inside a range, and there is nothing left to add. This is what a text column does to a report.",
          wrongWay: "Assuming a zero total means the data is missing. The data is all there and none of it counts."
        },
        {
          cell: "C14", expect: eAfter, needFormula: true, mustUse: "SUM", tol: 0.005,
          task: "C14: the total of the converted column.",
          answer: "=SUM(C2:C11)",
          why: gbp(eAfter) + ". The difference between this and the cell above it is the entire value of the file, and nothing on the original sheet would have told you it was missing.",
          wrongWay: "Reporting the first total. If you had done, you would have reported nought pounds against ten real invoices."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M4S2"); wb.add(M4S2.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 3
   ============================================================ */
const M4S3 = {
  title: "One column that should have been three",
  aim: "Pull a single messy field apart into the separate facts it was hiding.",
  why: "One fact per cell is the rule the whole tool rests on. Data almost never arrives that way, and putting it right is what makes everything from Module 5 onwards possible.",
  concepts: ["m4.split", "m4.findsearch", "m4.flashfill", "m4.join"],
  unlocks: ["TEXTSPLIT", "TEXTBEFORE", "TEXTAFTER", "LEFT", "RIGHT", "MID", "FIND", "SEARCH", "CONCAT", "TEXTJOIN"],
  lesson: [
    { lead: "A cell holding \"Smith, John\" holds two facts and lets you sort by neither." },
    { h: "The modern way" },
    {
      ul: [
        "<span class='f'>=TEXTBEFORE(A2,\", \")</span> gives everything before the first comma-space.",
        "<span class='f'>=TEXTAFTER(A2,\", \")</span> gives everything after it.",
        "<span class='f'>=TEXTSPLIT(A2,\", \")</span> splits into as many cells as there are pieces, spilling across the row."
      ]
    },
    { p: "These are recent additions and they are what you should reach for. They are live formulas, so when the source data changes the split updates, which the menu-based tools do not." },
    { h: "The older way, which you still need" },
    { p: "LEFT, RIGHT and MID take characters by position. On their own they are useless, because the position varies from row to row. Paired with FIND, which reports where something sits, they become general." },
    { f: '=LEFT(A2, FIND(",",A2)-1)                 everything before the comma\n=MID(A2, FIND(",",A2)+2, 100)             everything after it' },
    { p: "Read the first one: find where the comma is, take one character fewer than that from the left. The minus one is there so the comma itself is not included, and forgetting it is the classic error." },
    { why: "Learn this pattern even though TEXTBEFORE is easier, for two reasons. Older workbooks are full of it, and you will meet cases TEXTBEFORE cannot express, such as taking everything before the <em>last</em> space in a name with a middle initial." },
    { h: "FIND and SEARCH" },
    {
      ul: [
        "<span class='f'>FIND</span> is case sensitive and does not accept wildcards.",
        "<span class='f'>SEARCH</span> ignores case and accepts wildcards.",
        "Both return #VALUE! when the thing is not there, which is why they usually sit inside IFERROR."
      ]
    },
    { f: '=IFERROR(TEXTBEFORE(A2,", "), A2)' },
    { p: "That returns the whole value when there is no comma, rather than an error. Deciding what should happen to the rows that do not fit the pattern is most of the work in a real split." },
    { h: "Flash Fill" },
    { p: "Type the answer you want for the first row in the column beside the data, then press <kbd>Ctrl</kbd>+<kbd>E</kbd>. Excel looks at what you did and does the same to the rest." },
    { pro: "Flash Fill is genuinely useful for a one-off and dangerous as a habit. It guesses from a pattern, it gives no formula and no record, it silently gets rows wrong when the pattern varies, and it does not update when the data changes. Use it to explore, then write the formula. If you do use it, sort the result and look at both ends: the failures cluster at the extremes." },
    { h: "Text to Columns" },
    { p: "The menu tool: <span class='path'><span>Data</span><i>›</i><span>Text to Columns</span></span>. It splits on a chosen character and writes the results across the sheet, permanently and destructively." },
    { trap: "It overwrites whatever is to the right without asking. Insert enough blank columns first, every time. It is also a one-off with no memory: when next month's file arrives you do the whole thing again by hand." },
    { h: "Joining back together" },
    { f: '=B2 & " " & C2\n=TEXTJOIN(", ", TRUE, C2, B2)' },
    { p: "The ampersand is what most people use for two or three pieces. TEXTJOIN earns its place when you have a list, because its second argument can skip empty cells, so you do not end up with stray commas where a middle name was missing." },
    { web: "Flash Fill, Text to Columns and all the text functions work in Excel for the web. TEXTSPLIT, TEXTBEFORE and TEXTAFTER need a reasonably current version; if Excel does not recognise the name, fall back on the LEFT and FIND pattern, which works everywhere." },
    { desk: "Power Query's <span class='f'>Split Column</span> handles by delimiter, by number of characters, and by position, including splitting on the <em>last</em> occurrence of a character, which is exactly the awkward case the formulas struggle with. As always it remembers, so next month is a Refresh rather than an afternoon." }
  ],
  reflect: [
    "Say why the minus one is needed in <span class='f'>=LEFT(A2,FIND(\",\",A2)-1)</span>.",
    "Name one reason not to leave a Flash Fill result in a file you will hand to somebody else."
  ],

  practice: function (seed) {
    const r = rng(seed);
    const first = ["John", "Aisha", "Tomasz", "Grace", "Idris", "Mei", "Callum", "Fatima", "Ewan", "Priya"];
    const last = ["Smith", "Okafor", "Nowak", "Bennett", "Rahman", "Chen", "Fraser", "Haddad", "MacLeod", "Sharma"];
    const rows = [];
    for (let i = 0; i < 10; i++) {
      const f = first[i], l = last[i];
      rows.push({ full: l + ", " + f, first: f, last: l, email: (f[0] + "." + l).toLowerCase() + "@" + rPick(r, ["example.com", "acme.co.uk", "northwood.org"]) });
    }

    const sh = new Sheet("Contacts", 18, 6);
    sh.set(0, 0, "Name (as received)", { hdr: true });
    sh.set(0, 1, "Surname", { hdr: true });
    sh.set(0, 2, "First name", { hdr: true });
    sh.set(0, 3, "Email", { hdr: true });
    sh.set(0, 4, "Domain", { hdr: true });
    sh.set(0, 5, "Display name", { hdr: true });
    rows.forEach((t, i) => { sh.set(1 + i, 0, t.full); sh.set(1 + i, 3, t.email); });

    const answers = [];
    for (let i = 0; i < 10; i++) answers.push("B" + (2 + i), "C" + (2 + i), "E" + (2 + i), "F" + (2 + i));
    lockSheet(sh, answers);
    sh.rows = 13; sh.cols = 6;

    const eSur0 = rows[0].last, eFirst0 = rows[0].first;
    const eSurLast = rows[9].last;
    const eDom0 = rows[0].email.split("@")[1];
    const eDisp0 = rows[0].first + " " + rows[0].last;

    return {
      sheet: sh,
      maxRows: 13, maxCols: 6, startRow: 1, startCol: 1,
      formatBar: false, fillBar: true,
      highlight: answers,
      brief: {
        title: "Ten contacts, each holding three facts in two cells",
        body: "Names arrived as <strong>Surname, First</strong> in one cell, which means you can sort by neither. " +
          "Email addresses hold the person and the organisation together. Pull them apart into separate columns, " +
          "then rebuild a display name in the order a human would write it."
      },
      hint: "TEXTBEFORE and TEXTAFTER split at a delimiter. The delimiter between surname and first name here is a comma followed by a space, written <span class='f'>\", \"</span>.",
      tasks: [
        { id: "t1", text: "In B2, pull out the surname. Fill down.", cell: "B2" },
        { id: "t2", text: "In C2, pull out the first name. Fill down to C11.", cell: "C2" },
        { id: "t3", text: "Check B11 against the name beside it.", cell: "B11" },
        { id: "t4", text: "In E2, pull the domain out of the email address, everything after the @ sign. Fill down.", cell: "E2" },
        { id: "t5", text: "In F2, build a display name reading <strong>First Surname</strong>, with a single space. Fill down.", cell: "F2", ext: true }
      ],
      checks: [
        {
          cell: "B2", expect: eSur0, needFormula: true, mustUse: ["TEXTBEFORE", "LEFT"],
          task: "B2: the surname.",
          answer: '=TEXTBEFORE(A2,", ")',
          why: "Everything before the first comma-space. The older equivalent is <span class='f'>=LEFT(A2,FIND(\",\",A2)-1)</span>, and both are accepted here because you will meet both.",
          wrongWay: "<span class='f'>=LEFT(A2,FIND(\",\",A2))</span> without the minus one, which brings the comma along and gives <span class='f'>" + eSur0 + ",</span>. It looks nearly right, and it will fail every lookup in Module 5."
        },
        {
          cell: "C2", expect: eFirst0, needFormula: true, mustUse: ["TEXTAFTER", "MID", "RIGHT"],
          task: "C2: the first name.",
          answer: '=TEXTAFTER(A2,", ")',
          why: "Everything after the comma-space. Using the full delimiter rather than just the comma is what stops a leading space coming through, and a leading space here is exactly the invisible fault from session 1.",
          wrongWay: '<span class="f">=TEXTAFTER(A2,",")</span>, splitting on the comma alone. The result is <span class="f"> ' + eFirst0 + '</span> with a leading space, it looks perfect on screen, and it breaks silently later. Wrap it in TRIM or split on the full delimiter.'
        },
        {
          cell: "B11", expect: eSurLast, needFormula: true, mustUse: ["TEXTBEFORE", "LEFT"],
          task: "B11: the last surname, reached by filling.",
          answer: '=TEXTBEFORE(A11,", ")',
          why: "Same formula, eleven rows down. If any row here errors, that row does not match the pattern, and deciding what to do with those rows is most of the work in a real split.",
          wrongWay: "Fixing an odd row by typing the answer in. Now the column is part formula and part constant, and nobody can tell which is which."
        },
        {
          cell: "E2", expect: eDom0, needFormula: true, mustUse: ["TEXTAFTER", "MID", "RIGHT"],
          task: "E2: the email domain.",
          answer: '=TEXTAFTER(D2,"@")',
          why: "The same idea with a different delimiter. Splitting the domain out is what lets you count contacts by organisation, which a full email address cannot do.",
          wrongWay: "<span class='f'>=RIGHT(D2,11)</span>, taking a fixed number of characters. It works for the row you tested and fails for every domain of a different length."
        },
        {
          cell: "F2", ext: true, expect: eDisp0, needFormula: true,
          task: "F2: the display name.",
          answer: '=C2 & " " & B2',
          why: "Joining the two pieces back in human order with a space between. <span class='f'>=TEXTJOIN(\" \",TRUE,C2,B2)</span> does the same and earns its keep when some parts may be missing, because it can skip the blanks rather than leaving double spaces.",
          wrongWay: "<span class='f'>=C2&B2</span> with no space, giving <span class='f'>" + eDisp0.replace(" ", "") + "</span>. The separator has to be supplied explicitly; Excel never adds one for you."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M4S3"); wb.add(M4S3.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 4
   ============================================================ */
const M4S4 = {
  title: "Duplicates, and when Remove Duplicates lies to you",
  aim: "Find duplicates before deleting anything, and understand exactly what Excel counts as a duplicate.",
  why: "Remove Duplicates is one click, it is destructive, and its idea of identical is not yours. Used carelessly on a transaction file it deletes real money.",
  concepts: ["m4.dupefind", "m4.dupetrap", "m4.unique", "m4.blanks"],
  unlocks: ["UNIQUE", "COUNTBLANK", "SUMPRODUCT"],
  lesson: [
    { lead: "Never remove a duplicate you have not looked at." },
    { h: "Find them first" },
    { p: "Put a helper column beside the data and count how many times each value appears." },
    { f: '=COUNTIF($A$2:$A$500, A2)' },
    { p: "Anything above 1 appears more than once. Note the locked range and the relative criterion: the same mixed-reference pattern as Module 3's summary table. Sort or filter that column to see every repeat together before you decide anything." },
    { pro: "The professional order is always: count, inspect, decide, then act. One click of Remove Duplicates does all four at once and shows you none of them." },
    { h: "What Excel counts as a duplicate" },
    {
      ul: [
        "It ignores capitalisation. <span class='f'>ACME</span> and <span class='f'>Acme</span> are the same row.",
        "It does not ignore spaces. <span class='f'>Acme</span> and <span class='f'>Acme </span> are different rows.",
        "It compares only the columns you tick, and it keeps the first occurrence it meets."
      ]
    },
    { trap: "The last point is the dangerous one. Tick only the supplier column on a transaction file and Excel deletes every payment to that supplier except the first, because it is comparing suppliers rather than transactions. The rows vanish, the totals drop, and there is no record of what went. This is a real way to destroy a file." },
    { why: "A duplicate is a repeat of the thing your table is about. If each row is one transaction, two rows are duplicates only when the reference, the date, the amount and the counterparty all match. Ask what one row represents before you tick a single box." },
    { h: "Order matters, so clean before you deduplicate" },
    { p: "Because trailing spaces make identical rows look different, running Remove Duplicates on a dirty file leaves duplicates behind. Sessions 1 and 2 come first for a reason: trim, standardise case, convert types, and only then look for repeats." },
    { h: "UNIQUE, which changes nothing" },
    { f: '=UNIQUE(A2:A100)' },
    { p: "Returns the distinct values, spilling down from wherever you put it, and leaves the source alone. Use it to see the distinct list, count the categories, or build the left-hand column of a summary table. It is the safe tool and it should be your default." },
    { f: '=COUNTA(UNIQUE(A2:A100))       how many distinct suppliers' },
    { h: "Blanks" },
    { p: "COUNTBLANK counts genuinely empty cells in a range. It does not count a cell containing empty text from an IF, which looks blank and is not. That distinction was flagged in Module 3 and this is where it bites." },
    { f: '=COUNTBLANK(B2:B100)         truly empty\n=COUNTIF(B2:B100,"")         empty or empty-text' },
    { pro: "Decide what a blank means before you fill it. An unknown value should stay blank so averages exclude it. A genuine nil should be 0. Filling blanks with zeros to tidy a sheet changes every average on it, which was Module 2." },
    { web: "Remove Duplicates and Go To Special are both in Excel for the web. <span class='path'><span>Data</span><i>›</i><span>Remove Duplicates</span></span> shows the tick boxes; read them rather than accepting the default of all columns." },
    { desk: "Power Query's <span class='f'>Remove Duplicates</span> is equally destructive but non-committal: it is a step in a list you can inspect, reorder and delete, and the source table is untouched. Its <span class='f'>Group By</span> is better still, letting you collapse repeats while summing the amounts rather than discarding them, which is usually what you actually wanted." }
  ],
  reflect: [
    "Say what one row of your practice file represents, and therefore what would make two rows genuine duplicates.",
    "Why must trimming happen before deduplicating, and not after?"
  ],

  practice: function (seed) {
    const r = rng(seed);
    const base = [];
    for (let i = 0; i < 9; i++) {
      base.push({
        ref: "TX-" + (7100 + i),
        supplier: M4_NAMES[i % M4_NAMES.length],
        amount: xround(rInt(r, 6000, 190000) / 100, 2)
      });
    }
    /* two genuine duplicates: the same transaction keyed twice */
    const rows = base.slice();
    rows.splice(4, 0, Object.assign({}, base[2]));
    rows.splice(8, 0, Object.assign({}, base[6]));

    const sh = new Sheet("Duplicates", 22, 6);
    sh.set(0, 0, "Ref", { hdr: true });
    sh.set(0, 1, "Supplier", { hdr: true });
    sh.set(0, 2, "Amount", { hdr: true });
    sh.set(0, 3, "Times ref appears", { hdr: true });
    rows.forEach((t, i) => {
      sh.set(1 + i, 0, t.ref);
      sh.set(1 + i, 1, t.supplier);
      sh.set(1 + i, 2, t.amount, { fmt: GBP2 });
    });
    const n = rows.length;

    label(sh, "A" + (n + 3), "Distinct suppliers");
    label(sh, "A" + (n + 4), "Rows that are repeats");
    label(sh, "A" + (n + 5), "Total as it stands");
    label(sh, "A" + (n + 6), "Total without the repeats");

    const answers = [];
    for (let i = 0; i < n; i++) answers.push("D" + (2 + i));
    const cDistinct = "C" + (n + 3), cRepeats = "C" + (n + 4), cTotal = "C" + (n + 5), cClean = "C" + (n + 6);
    answers.push(cDistinct, cRepeats, cTotal, cClean);
    lockSheet(sh, answers);
    [cTotal, cClean].forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });
    sh.rows = n + 8; sh.cols = 5;

    const refR = "$A$2:$A$" + (n + 1);
    const eCount0 = solve(sh, "=COUNTIF(" + refR + ",A2)");
    const eDistinct = solve(sh, "=COUNTA(UNIQUE(B2:B" + (n + 1) + "))");
    const eTotal = solve(sh, "=SUM(C2:C" + (n + 1) + ")");
    const eRepeats = 2;
    const eClean = xround(base.reduce((a, b) => a + b.amount, 0), 2);

    return {
      sheet: sh,
      maxRows: n + 8, maxCols: 5, startRow: 1, startCol: 3,
      formatBar: false, fillBar: true,
      highlight: answers,
      brief: {
        title: "Eleven rows, nine transactions",
        body: "Two payments were keyed into the system twice, so this file overstates what was actually spent. " +
          "Find them by counting before you delete anything, then work out what the total should have been. " +
          "Each row here represents <strong>one transaction</strong>, so a repeat is a repeat of the reference, not of the supplier."
      },
      hint: "Lock the range in your COUNTIF so it does not drift as you fill, and let the criterion point at the reference beside it. Anything above 1 is a repeat.",
      tasks: [
        { id: "t1", text: "In D2, count how many times that reference appears in the whole column. Fill down.", cell: "D2" },
        { id: "t2", text: "Look down column D. Two references should show 2. Those are your duplicates.", cell: null },
        { id: "t3", text: "In " + cDistinct + ", count the distinct suppliers.", cell: cDistinct },
        { id: "t4", text: "In " + cRepeats + ", count how many rows are repeats, meaning rows whose reference appears more than once, minus the originals.", cell: cRepeats },
        { id: "t5", text: "In " + cTotal + ", total the amounts as the file stands.", cell: cTotal },
        { id: "t6", text: "In " + cClean + ", work out what the total should be with each transaction counted once.", cell: cClean, ext: true }
      ],
      checks: [
        {
          cell: "D2", expect: eCount0, needFormula: true, mustUse: "COUNTIF",
          task: "D2: how many times the first reference appears.",
          answer: "=COUNTIF(" + refR + ",A2)",
          why: "The range is locked so every row searches the whole column; the criterion is relative so each row asks about its own reference. Anything above 1 is a repeat, and you can now see them before deciding anything.",
          wrongWay: "Leaving the range relative. It shrinks as the formula fills, so the bottom rows search only the last few cells and report 1 for everything, and the duplicates disappear from your own diagnostic."
        },
        {
          cell: cDistinct, expect: eDistinct, needFormula: true, mustUse: ["UNIQUE", "SUMPRODUCT"],
          task: cDistinct + ": the number of distinct suppliers.",
          answer: "=COUNTA(UNIQUE(B2:B" + (n + 1) + "))",
          why: "UNIQUE returns the distinct list without touching the data, and COUNTA counts it. The older idiom <span class='f'>=SUMPRODUCT(1/COUNTIF(range,range))</span> does the same on versions without UNIQUE and is worth recognising.",
          wrongWay: "Running Remove Duplicates on the supplier column to count what is left. That deletes rows of real transactions to answer a question that needed no deletion at all."
        },
        {
          cell: cRepeats, expect: eRepeats, needFormula: true,
          task: cRepeats + ": how many rows are repeats.",
          answer: "=COUNTIF(D2:D" + (n + 1) + ',">1")/2',
          why: "Two references appear twice, so four rows are involved and two of them are surplus. Dividing by two converts rows-involved into rows-to-remove. <span class='f'>=" + (n) + "-" + cDistinct + "</span> would not work here, because that counts distinct suppliers rather than distinct references.",
          wrongWay: "Counting the rows where D is above 1 and reporting 4. Four rows are <em>involved</em> in duplication; only two are extra. Say which of the two numbers you mean, because they answer different questions."
        },
        {
          cell: cTotal, expect: eTotal, needFormula: true, mustUse: "SUM", tol: 0.005,
          task: cTotal + ": the total as it stands.",
          answer: "=SUM(C2:C" + (n + 1) + ")",
          why: gbp(eTotal) + ", which is what the file claims was spent and is wrong by the value of the two repeated payments.",
          wrongWay: "Reporting this figure. It is the number the file gives you and it overstates the spend."
        },
        {
          cell: cClean, ext: true, expect: eClean, needFormula: true, tol: 0.005,
          task: cClean + ": the total with each transaction counted once.",
          answer: "=SUMPRODUCT(C2:C" + (n + 1) + "/D2:D" + (n + 1) + ")",
          why: "Dividing each amount by the number of times its reference appears means a payment recorded twice contributes half from each row, and therefore its full value once. The difference from the total above is " + gbp(xround(eTotal - eClean, 2)) + ", which is real money that was never spent.",
          wrongWay: "Deleting the duplicate rows and totalling what is left. That gives the same number and destroys the evidence. In any regulated context you keep the original and show your working, because somebody will ask why the figure changed."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M4S4"); wb.add(M4S4.practice(seed).sheet); return wb; }
};

/* ============================================================
   Register
   ============================================================ */
defModule({
  id: "m4", n: 4, stage: "s1",
  title: "Cleaning dirty data",
  subtitle: "Spaces, case, conversions, splitting, duplicates, blanks",
  blurb: "Most of the real job. The filthiest practice files in the course, because clean data is not what anyone actually sends you. Formulas first, with the Power Query shortcut marked as an aside at the end of each session.",
  onComplete: "You can now take a file that arrived broken and make it usable, and prove what you changed. That matters immediately, because Module 5 joins two tables together and a lookup fails on exactly the invisible faults this module taught you to find.",
  concepts: [
    { id: "m4.trim", label: "TRIM", blurb: "Strips the ends, collapses runs of spaces in the middle." },
    { id: "m4.lendiag", label: "LEN as a diagnostic", blurb: "Measure the damage you cannot see." },
    { id: "m4.case", label: "UPPER, LOWER, PROPER", blurb: "And the acronyms PROPER quietly ruins." },
    { id: "m4.helper", label: "Helper column, then Paste Values", blurb: "Never clean in place; keep the original until you are sure." },
    { id: "m4.value", label: "VALUE", blurb: "Text that looks numeric, turned into a number." },
    { id: "m4.datevalue", label: "DATEVALUE", blurb: "And why regional settings can silently reverse a date." },
    { id: "m4.coerce", label: "The *1 and -- tricks", blurb: "Recognise them; write VALUE instead." },
    { id: "m4.textisoneway", label: "TEXT makes text", blurb: "One-way, and skipped by every total afterwards." },
    { id: "m4.split", label: "TEXTBEFORE, TEXTAFTER, TEXTSPLIT", blurb: "And the LEFT with FIND pattern behind them." },
    { id: "m4.findsearch", label: "FIND against SEARCH", blurb: "Case sensitive or not, wildcards or not." },
    { id: "m4.flashfill", label: "Flash Fill", blurb: "Useful once, dangerous as a habit." },
    { id: "m4.join", label: "Joining with & and TEXTJOIN", blurb: "The separator is never added for you." },
    { id: "m4.dupefind", label: "Count duplicates before deleting", blurb: "Count, inspect, decide, then act." },
    { id: "m4.dupetrap", label: "What Excel calls a duplicate", blurb: "Ignores case, not spaces, and only the ticked columns." },
    { id: "m4.unique", label: "UNIQUE", blurb: "The distinct list, with nothing destroyed." },
    { id: "m4.blanks", label: "Blanks against empty text", blurb: "COUNTBLANK does not see a formula's empty string." }
  ],
  sessions: [M4S1, M4S2, M4S3, M4S4]
});
