/* ============================================================
   Module 10: Evidence for arguments
   Public data, used honestly, for writing you intend to publish.

   The practice files here are synthetic but structurally faithful
   to the real formats named in the sessions. Nothing in this app
   fetches anything, so the shapes are reproduced rather than the
   data; the capstone sends you to the genuine source.
   ============================================================ */

const M10_COUNTRIES = [
  { code: "GBR", name: "United Kingdom" }, { code: "FRA", name: "France" },
  { code: "DEU", name: "Germany" }, { code: "POL", name: "Poland" },
  { code: "TUR", name: "Türkiye" }, { code: "EGY", name: "Egypt" },
  { code: "IND", name: "India" }, { code: "BRA", name: "Brazil" }
];

/* ============================================================
   Session 1
   ============================================================ */
const M10S1 = {
  title: "Getting a public CSV in without breaking it",
  aim: "Open a downloaded dataset so that every column arrives as the type it should be, and record where it came from.",
  why: "Public data arrives in formats designed for machines. Half an hour of care at the import stage prevents a figure in your published piece being wrong for a reason you will never find afterwards.",
  concepts: ["m10.csv", "m10.encoding", "m10.sourcecol", "m10.sanctionsfmt"],
  unlocks: [],
  lesson: [
    { lead: "Double-clicking a CSV is the fastest way to damage it." },
    { p: "Excel opens a CSV by guessing every column's type from the first few rows. It usually guesses well and it occasionally does something you cannot undo: leading zeros stripped from country and commodity codes, long identifiers turned into scientific notation, and dates read in the wrong regional order." },
    { h: "Import rather than open" },
    { p: "Use <span class='path'><span>Data</span><i>›</i><span>From Text/CSV</span></span> instead of File Open. You get a preview and, crucially, the chance to set a column's type to Text before anything is parsed. Set every code, identifier and reference column to Text. You can always convert later; you cannot recover a stripped leading zero." },
    { trap: "Codes are the ones that suffer. A commodity code of <span class='f'>0901</span> becomes 901, an OFSI group ID becomes a number, and a long identifier becomes <span class='f'>1.23457E+14</span> with the last digits gone for good. If the column will never be added up, it is text." },
    { h: "Encoding" },
    { p: "If names come through as <span class='f'>TÃ¼rkiye</span> or <span class='f'>Ã©</span>, the file is UTF-8 and Excel has read it as something else. Set the encoding to <span class='f'>65001: Unicode (UTF-8)</span> in the import dialogue and reimport. Do not fix it with find and replace; you will miss cases and it will be wrong in a way nobody can audit." },
    { why: "This matters more than it sounds for the work you will do. Names of places and people are exactly where non-ASCII characters live, and a mangled name silently fails every lookup and every match against a sanctions list." },
    { h: "The shapes you will meet" },
    {
      table: {
        cols: ["Source", "What it looks like", "The awkward part"], startRow: 1,
        rows: [
          ["UN Comtrade", "one row per reporter, partner, commodity, year, flow", "reporter and partner both appear as codes and names; mirror statistics disagree"],
          ["World Bank indicators", "one row per country, then one column per year", "wide format; blanks are missing, not zero"],
          ["ACLED-style event data", "one row per event, with date, location, actors, fatalities", "free-text actor names that never quite match"],
          ["OFSI and OFAC lists", "one row per alias, not per person", "several rows per individual, so counting rows overcounts people"]
        ]
      }
    },
    { trap: "That last one is the trap that catches people writing about sanctions. Consolidated lists carry one row per name variant, so a person with an alias and two transliterations occupies four rows. Counting rows and reporting the total as a number of designated individuals overstates it, sometimes by a factor of three. Count the distinct group identifier instead." },
    { h: "The source column" },
    { p: "Add a column to every imported dataset recording where the row came from: the publisher, the dataset name, and the date you downloaded it. It costs one fill-down." },
    { pro: "You will be asked where a figure came from, sometimes months later, sometimes by somebody sceptical. A source column turns that question from an afternoon of archaeology into a glance. It also makes it obvious when you have combined two vintages of the same dataset without noticing, which is a genuinely common and invisible error." },
    { web: "Excel for the web can open a CSV but its import options are thinner than desktop's. For anything with codes or non-English names, do the import on desktop and work with the resulting file wherever you like." },
    { desk: "This is one of the two places desktop is meaningfully better. Power Query's From Text/CSV gives you per-column type control, an encoding setting, and a saved set of steps, so next month's release is a Refresh rather than a repeat performance. If you have desktop, use it for imports." }
  ],
  reflect: [
    "Name three column types you would set to Text before importing.",
    "Why does counting rows on a sanctions list overstate the number of people?"
  ],

  practice: function (seed) {
    const r = rng(seed);
    const sh = new Sheet("Import", 30, 6);
    ["Group ID", "Name", "Country code", "Commodity", "Listed"].forEach((h, i) => sh.set(0, i, h, { hdr: true, locked: true }));

    /* one row per alias, several rows per person, in the style of a consolidated list */
    const people = [
      { gid: "13045", names: ["Karim A. Haddad", "Kareem Al-Haddad", "K. Haddad"] },
      { gid: "13046", names: ["Nadia Petrova"] },
      { gid: "13047", names: ["Tomasz Nowak", "T. Nowak"] },
      { gid: "13048", names: ["Mei Chen", "Chen Mei", "M. Chen", "Mei-Ling Chen"] },
      { gid: "13049", names: ["Idris Rahman", "I. Rahman"] }
    ];
    let row = 1;
    people.forEach(p => p.names.forEach(nm => {
      sh.set(row, 0, p.gid, { locked: true, fmt: "@" });
      sh.set(row, 1, nm, { locked: true });
      sh.set(row, 2, rPick(r, M10_COUNTRIES).code, { locked: true });
      sh.set(row, 3, rPick(r, ["0901", "2709", "7208", "8703"]), { locked: true, fmt: "@" });
      sh.set(row, 4, ymdToSerial(2022, 1, 1) + rInt(r, 0, 900), { locked: true, fmt: DATEFMT });
      row++;
    }));
    const n = row - 1, last = n + 1;

    const srcCells = [];
    for (let i = 0; i < n; i++) srcCells.push("F" + (2 + i));
    sh.set(0, 5, "Source", { hdr: true, locked: true });

    const ansStart = n + 4;
    const cells = fcAnswers(sh, ansStart, ["Rows in the list", "Designated individuals", "Overstatement, rows minus people"]);
    lockSheet(sh, srcCells.concat(cells));
    sh.rows = ansStart + cells.length + 2; sh.cols = 6;

    const nPeople = people.length;

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 6, colWidth: 96, startRow: 1, startCol: 5,
      fillBar: true, highlight: srcCells.concat(cells),
      brief: {
        title: "A consolidated list, in the shape the real ones come in",
        body: "This is structured the way OFSI and OFAC consolidated lists are structured: <strong>one row per name variant</strong>, not one row per person. " +
          "Add a source column, then work out how badly counting rows would overstate the number of designated individuals. " +
          "Note that the group IDs and commodity codes are stored as text, which is what stops the leading zeros disappearing."
      },
      hint: "The source column is the same text on every row, so write it once and fill it down. For the number of people, count the distinct group IDs.",
      tasks: [
        { id: "t1", text: "In F2, record the source as <strong>OFSI consolidated list, downloaded 2026-08-18</strong>. Fill it down the whole list.", cell: "F2" },
        { id: "t2", text: "Check the bottom of the source column.", cell: "F" + last },
        { id: "t3", text: "In " + cells[0] + ", count the rows.", cell: cells[0] },
        { id: "t4", text: "In " + cells[1] + ", count the designated individuals.", cell: cells[1] },
        { id: "t5", text: "In " + cells[2] + ", the difference. That is how far out a row count would have been.", cell: cells[2], ext: true }
      ],
      checks: [
        {
          cell: "F2", expect: "OFSI consolidated list, downloaded 2026-08-18",
          task: "F2: the source note.",
          answer: "OFSI consolidated list, downloaded 2026-08-18",
          why: "Publisher, dataset and download date. It costs one fill-down and it answers the question you will be asked months later by somebody sceptical. It also reveals when two vintages of the same dataset have been combined, which is otherwise invisible.",
          wrongWay: "Putting the source in a note at the top of the sheet. It survives right up until somebody filters, sorts, or copies a subset of the rows into another file."
        },
        {
          cell: "F" + last, expect: "OFSI consolidated list, downloaded 2026-08-18",
          task: "The last row's source note.",
          answer: "OFSI consolidated list, downloaded 2026-08-18",
          why: "Every row carries its own provenance, so any subset of rows carries it too. That is the whole point of a column rather than a header.",
          wrongWay: "Filling only as far as the visible rows while a filter is on."
        },
        {
          cell: cells[0], expect: n, needFormula: true, mustUse: "COUNTA",
          task: cells[0] + ": rows in the list.",
          answer: "=COUNTA(A2:A" + last + ")",
          why: n + " rows. This is the number that gets misreported as a count of people, and it is the easiest published error to make on sanctions data.",
          wrongWay: "Publishing this as the number of designated individuals. It overstates by " + (n - nPeople) + " here, and on a real list the factor can be three or more."
        },
        {
          cell: cells[1], expect: nPeople, needFormula: true,
          task: cells[1] + ": designated individuals.",
          answer: "=COUNTA(UNIQUE(A2:A" + last + "))",
          why: nPeople + " people. The group identifier is what ties the aliases together, which is exactly why the publisher includes it. Counting its distinct values is the correct measure and the one the publisher intends.",
          wrongWay: "Counting distinct names instead. Aliases are distinct names, so that gives you the row count back with extra steps."
        },
        {
          cell: cells[2], ext: true, expect: n - nPeople, needFormula: true,
          task: cells[2] + ": the overstatement.",
          answer: "=" + cells[0] + "-" + cells[1],
          why: "On this small extract, " + (n - nPeople) + " phantom individuals, which is " + fmtNum(xround(100 * (n - nPeople) / nPeople, 0), 0) + " per cent more people than exist. Worth knowing the size of an error before deciding whether it matters.",
          wrongWay: "Assuming the difference is small because the list is short. The ratio is what travels to the full dataset, not the difference."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M10S1"); wb.add(M10S1.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 2
   ============================================================ */
const M10S2 = {
  title: "Wide against long, and reshaping without losing anything",
  aim: "Recognise the two shapes public data comes in, and convert between them deliberately.",
  why: "World Bank indicators arrive wide, one column per year. Everything you want to do with them, charting, filtering, pivoting, wants them long. Reshaping is the step between downloading and analysing, and doing it carelessly loses rows silently.",
  concepts: ["m10.widelong", "m10.reshape", "m10.blanksmissing", "m10.units"],
  unlocks: ["SORT", "FILTER", "YEAR", "MONTH", "COUNTBLANK"],
  lesson: [
    { lead: "The same data has two common shapes, and almost every tool prefers the one you were not given." },
    { h: "Wide" },
    {
      table: {
        cols: ["Country", "2020", "2021", "2022"], startRow: 1,
        rows: [["United Kingdom", "67.0", "67.3", "67.6"], ["France", "67.6", "67.8", "68.0"]]
      }
    },
    { p: "Compact and readable, and it is how World Bank and most statistical agencies publish. Adding a year means adding a column, which means every formula and chart pointing past it needs revisiting." },
    { h: "Long" },
    {
      table: {
        cols: ["Country", "Year", "Value"], startRow: 1,
        rows: [["United Kingdom", "2020", "67.0"], ["United Kingdom", "2021", "67.3"], ["France", "2020", "67.6"]]
      }
    },
    { p: "One row per observation, one column per variable. Longer, duller, and what every pivot table and chart actually wants. Adding a year means adding rows, which breaks nothing." },
    { pro: "Analyse in long, present in wide. Reshape to long as the first step after importing, do the work, then let a pivot table put it back into wide for the reader. Trying to analyse wide data directly is where most of the awkwardness in spreadsheet work comes from." },
    { h: "Reshaping by hand" },
    { p: "Without Power Query, the honest manual method is deliberate rather than clever: build the long table with three columns, and pull each value across with an INDEX and two MATCHes, or with an XLOOKUP against a concatenated key." },
    { f: '=INDEX($B$2:$D$9, MATCH($F2,$A$2:$A$9,0), MATCH($G2,$B$1:$D$1,0))' },
    { p: "Read it: find the row for this country, find the column for this year, return what is at that intersection. It is INDEX with MATCH from Module 5, used in two dimensions at once." },
    { trap: "Check your row count before and after. Eight countries and three years must give twenty-four long rows. If it gives twenty-two, two combinations are missing and you will never notice from looking at the numbers." },
    { h: "Blanks are missing, not zero" },
    { p: "Public datasets are full of gaps: a country did not report, an indicator was not collected, a year predates the series. Those cells are blank and they mean unknown." },
    { trap: "Never fill them with zero. A zero says the value was measured and was nothing, which is a factual claim you are not entitled to make, and it will drag every average and every chart towards it. Leave them empty, and state in your write-up how many observations were missing." },
    { h: "Units, and the footnotes nobody reads" },
    { p: "Check what the numbers actually are before comparing anything. GDP in current US dollars is not comparable across years; constant 2015 dollars is. Trade values in thousands and in units look identical in a spreadsheet and differ by a factor of a thousand." },
    { pro: "Copy the indicator's full name and unit into a cell on the sheet, verbatim from the source. It takes ten seconds and it is the single commonest cause of a published figure being wrong by orders of magnitude." },
    { desk: "Power Query's <span class='f'>Unpivot Columns</span> does this whole session in two clicks: select the year columns, right-click, Unpivot. It cannot lose rows and it is repeatable next release. If you have desktop, this is the second place it is meaningfully better." }
  ],
  reflect: [
    "Say which shape you analyse in and which you present in.",
    "What is wrong with filling a missing indicator value with zero?"
  ],

  practice: function (seed) {
    const r = rng(seed);
    const years = [2020, 2021, 2022];
    const sh = new Sheet("Reshape", 40, 8);
    sh.set(0, 0, "Country", { hdr: true, locked: true });
    years.forEach((y, i) => sh.set(0, 1 + i, y, { hdr: true, locked: true }));

    const vals = {};
    M10_COUNTRIES.forEach((c, i) => {
      sh.set(1 + i, 0, c.name, { locked: true });
      years.forEach((y, j) => {
        /* two genuine gaps, left blank because they are unknown */
        const missing = (i === 3 && j === 0) || (i === 6 && j === 2);
        if (missing) { vals[c.name + y] = null; return; }
        const v = xround(rInt(r, 1800, 96000) / 10, 1);
        vals[c.name + y] = v;
        sh.set(1 + i, 1 + j, v, { locked: true });
      });
    });
    const nC = M10_COUNTRIES.length;

    /* the long table skeleton: country and year given, value to be pulled across */
    const longStart = nC + 4;
    label(sh, "E" + longStart, "Country");
    label(sh, "F" + longStart, "Year");
    label(sh, "G" + longStart, "Value");
    const valCells = [];
    let lr = longStart + 1;
    M10_COUNTRIES.forEach(c => years.forEach(y => {
      sh.set(lr - 1, 4, c.name, { locked: true });
      sh.set(lr - 1, 5, y, { locked: true });
      valCells.push("G" + lr);
      lr++;
    }));
    const nLong = valCells.length;

    const ansStart = lr + 2;
    const cells = fcAnswers(sh, ansStart, ["Rows expected in the long table", "Values actually present", "Missing observations"]);
    lockSheet(sh, valCells.concat(cells));
    sh.rows = ansStart + cells.length + 2; sh.cols = 8;

    const wideRange = "$B$2:$D$" + (nC + 1);
    const countryCol = "$A$2:$A$" + (nC + 1);
    const yearRow = "$B$1:$D$1";
    const firstVal = vals[M10_COUNTRIES[0].name + years[0]];
    const nMissing = 2;

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 8, colWidth: 96, startRow: longStart, startCol: 6,
      fillBar: true, highlight: valCells.concat(cells),
      brief: {
        title: "Eight countries, three years, published wide",
        body: "The indicator arrives in the shape statistical agencies publish: one column per year. " +
          "The long-form skeleton is already laid out below with the country and year filled in; pull each value across into column G. " +
          "Two observations are genuinely missing and must stay missing."
      },
      hint: "INDEX with two MATCHes: find the row for the country, find the column for the year, return the intersection. Lock everything that points at the wide table.",
      tasks: [
        { id: "t1", text: "In " + valCells[0] + ", pull across the value for that country and year. Fill down the whole long table.", cell: valCells[0] },
        { id: "t2", text: "Check the bottom of the column.", cell: valCells[nLong - 1] },
        { id: "t3", text: "In " + cells[0] + ", how many rows the long table should have.", cell: cells[0] },
        { id: "t4", text: "In " + cells[1] + ", how many values are actually present.", cell: cells[1] },
        { id: "t5", text: "In " + cells[2] + ", how many observations are missing. Do not fill them with zero.", cell: cells[2], ext: true }
      ],
      checks: [
        {
          cell: valCells[0], expect: firstVal, tol: 0.05, needFormula: true, mustUseAll: ["INDEX", "MATCH"],
          task: valCells[0] + ": the first long-form value.",
          answer: "=INDEX(" + wideRange + ",MATCH(E" + (longStart + 1) + "," + countryCol + ",0),MATCH(F" + (longStart + 1) + "," + yearRow + ",0))",
          why: "INDEX with MATCH in two dimensions: one MATCH finds the row, the other finds the column. Everything pointing at the wide table is locked; the country and year references move down with the formula.",
          wrongWay: "Copying the values across by hand. Twenty-four is tempting and a real World Bank extract is two hundred countries by sixty years, which is twelve thousand."
        },
        {
          cell: valCells[nLong - 1], expect: vals[M10_COUNTRIES[nC - 1].name + years[years.length - 1]], tol: 0.05,
          needFormula: true, mustUseAll: ["INDEX", "MATCH"],
          task: "The last long-form value.",
          answer: "=INDEX(" + wideRange + ",MATCH(E" + (longStart + nLong) + "," + countryCol + ",0),MATCH(F" + (longStart + nLong) + "," + yearRow + ",0))",
          why: "If the lower rows return #REF! or #N/A, the wide-table ranges were not locked and have slid off the data. Check the bottom of the column, as always.",
          wrongWay: "A year heading imported as text will not match a numeric year column, and every MATCH fails at once. If a whole reshape returns #N/A, check the alignment of the heading row before you touch the formula. That is Module 1 arriving in Module 10."
        },
        {
          cell: cells[0], expect: nLong,
          task: cells[0] + ": rows expected.",
          answer: String(nC) + " countries × " + years.length + " years = " + nLong,
          why: "Work this out before reshaping, not after. If the long table comes out short, some combination has been dropped and no amount of looking at the numbers will reveal which.",
          wrongWay: "Trusting the reshape because the numbers look plausible. A missing combination looks exactly like a shorter table."
        },
        {
          cell: cells[1], expect: nLong - nMissing, needFormula: true, mustUse: "COUNT",
          task: cells[1] + ": values actually present.",
          answer: "=COUNT(" + valCells[0] + ":" + valCells[nLong - 1] + ")",
          why: (nLong - nMissing) + " of " + nLong + ". COUNT counts numbers only, so the two genuine gaps are correctly excluded rather than counted as anything.",
          wrongWay: "Using COUNTA, which counts a cell containing an empty-text formula result and would report the full " + nLong + ". That distinction was Module 4."
        },
        {
          cell: cells[2], ext: true, expect: nMissing, needFormula: true,
          task: cells[2] + ": missing observations.",
          answer: "=" + cells[0] + "-" + cells[1],
          why: nMissing + " observations were never reported. This figure belongs in your write-up, because a reader comparing country totals is entitled to know that two are computed on less data than the rest.",
          wrongWay: "Filling the gaps with zero to tidy the table. That asserts a measurement of nothing, drags every average towards it, and is a factual claim you cannot support."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M10S2"); wb.add(M10S2.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 3
   ============================================================ */
const M10S3 = {
  title: "Exact figures, and the number that cuts against you",
  aim: "Report figures at a precision you can defend, and build the habit of finding the data that weakens your own argument.",
  why: "You will publish these numbers under your own name. The two habits in this session are what separate an argument that survives a hostile reader from one that does not.",
  concepts: ["m10.exactfigures", "m10.rounding", "m10.againstyourself", "m10.citation"],
  unlocks: [],
  lesson: [
    { lead: "Round to the precision your data supports, and never to the precision that helps your argument." },
    { h: "Rounding that distorts" },
    {
      ul: [
        "<strong>Rounding to make a threshold.</strong> 49.6 per cent reported as 50 per cent, and then written about as half. Two roundings, one of them silent, and the claim has changed.",
        "<strong>Rounding one figure and not its comparator.</strong> If one is to the nearest thousand, both are.",
        "<strong>Precision beyond the source.</strong> Quoting 3.7241 per cent from a survey of four hundred people implies an accuracy the data does not have.",
        "<strong>Percentages of tiny bases.</strong> A rise from 2 to 3 is not a 50 per cent surge; it is one more, and you should write it that way."
      ]
    },
    { pro: "State the base with every percentage, every time: <em>up 50 per cent, from 2 to 3</em>. It is one clause, it makes the claim honest, and a reader who finds the base themselves and discovers you buried it will not trust the rest." },
    { h: "Where the reader can check" },
    { p: "For anything you publish, keep three things beside the figure: the source, the exact indicator or table name, and the date you downloaded it. Datasets are revised, and a figure that was right in March is not necessarily wrong in September; it is a figure from March." },
    { trap: "Mirror statistics are a specific hazard in trade data. A country's reported exports to a partner and that partner's reported imports from it routinely differ by ten per cent or more, for entirely mundane reasons: valuation basis, timing, transhipment. Say which side you used. An analyst who quotes trade data without saying whose figures they are has told you something about their care." },
    { h: "The number that cuts against you" },
    { p: "Before publishing, go looking for the figure that most weakens your argument. Not to bury it: to include it." },
    {
      ol: [
        "Write your claim in one sentence.",
        "Ask what somebody who disagreed would look up first.",
        "Look it up.",
        "Put it in, with your reason for thinking it does not overturn the claim."
      ]
    },
    { why: "This is the single most useful discipline in this module. A piece that acknowledges its strongest counter-evidence and explains why the argument survives is far more persuasive than one that does not, because the reader can see you looked. It is also the only reliable protection against being wrong, since the exercise sometimes reveals that you are." },
    { trap: "If step three overturns your claim, change the claim. That is the exercise working, not failing, and it is much cheaper before publication than after." },
    { h: "Charts, honestly" },
    { p: "Everything from Module 7 applies, plus two things specific to published work. Label the axis with the unit and the basis, in full: <em>Constant 2015 US dollars</em>, not <em>USD</em>. And if a series is incomplete, break the line rather than joining across the gap, because a continuous line asserts continuous data." },
    { desk: "Nothing desktop-only here. This is judgement, and it is the part of the course least likely to be automated away." }
  ],
  reflect: [
    "Write your next claim in one sentence, then name the figure that would most weaken it.",
    "Whose figures are you using, and on what date did you download them?"
  ],

  practice: function (seed) {
    const r = rng(seed);
    const sh = new Sheet("Precision", 24, 6);
    ["Country", "2021", "2022", "Change", "Change %"].forEach((h, i) => sh.set(0, i, h, { hdr: true, locked: true }));
    const a = [], b = [];
    M10_COUNTRIES.slice(0, 6).forEach((c, i) => {
      const v1 = i === 4 ? 2 : xround(rInt(r, 4000, 90000) / 10, 1);
      const v2 = i === 4 ? 3 : xround(v1 * (1 + rInt(r, -280, 340) / 1000), 1);
      a.push(v1); b.push(v2);
      sh.set(1 + i, 0, c.name, { locked: true });
      sh.set(1 + i, 1, v1, { locked: true, fmt: "#,##0.0" });
      sh.set(1 + i, 2, v2, { locked: true, fmt: "#,##0.0" });
    });
    const nC = 6, last = nC + 1;
    const chCells = [], pcCells = [];
    for (let i = 0; i < nC; i++) { chCells.push("D" + (2 + i)); pcCells.push("E" + (2 + i)); }

    const ansStart = nC + 4;
    const cells = fcAnswers(sh, ansStart, [
      "Largest percentage rise, %", "Country with that rise", "Its 2021 value", "Countries that fell"
    ]);
    lockSheet(sh, chCells.concat(pcCells, cells));
    pcCells.forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = "0.0"; });
    sh.rows = ansStart + cells.length + 2; sh.cols = 6;

    const pc = i => xround(100 * (b[i] - a[i]) / a[i], 1);
    const pcs = a.map((_, i) => pc(i));
    let bi = 0; pcs.forEach((v, i) => { if (v > pcs[bi]) bi = i; });
    const nFell = a.filter((v, i) => b[i] < v).length;

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 6, colWidth: 96, startRow: 1, startCol: 3,
      fillBar: true, highlight: chCells.concat(pcCells, cells),
      brief: {
        title: "Six countries, and one percentage that will mislead you",
        body: "Work out the change and the percentage change for each country. One of the six has a very large percentage rise and a base so small that reporting the percentage alone would be dishonest. " +
          "Find it, and note its base, because that is the figure that has to travel with the claim."
      },
      hint: "Percentage change is the difference over the original, times 100. Fill both columns down before looking at the answers.",
      tasks: [
        { id: "t1", text: "In D2, the change from 2021 to 2022. Fill down.", cell: chCells[0] },
        { id: "t2", text: "In E2, the percentage change, to one decimal place. Fill down.", cell: pcCells[0] },
        { id: "t3", text: "In " + cells[0] + ", the largest percentage rise.", cell: cells[0] },
        { id: "t4", text: "In " + cells[1] + ", the country with it.", cell: cells[1] },
        { id: "t5", text: "In " + cells[2] + ", that country's 2021 value. This is the base you must publish alongside the percentage.", cell: cells[2] },
        { id: "t6", text: "In " + cells[3] + ", how many countries fell.", cell: cells[3], ext: true }
      ],
      checks: [
        {
          cell: chCells[0], expect: xround(b[0] - a[0], 1), tol: 0.05, needFormula: true,
          task: chCells[0] + ": the change.",
          answer: "=C2-B2",
          why: "The absolute change, in the same units as the source. Always compute this beside the percentage: on small bases it is the honest figure and the percentage is the misleading one.",
          wrongWay: "Reporting only percentages. A reader cannot reconstruct the absolute change from a percentage without the base, and most will not try."
        },
        {
          cell: pcCells[0], expect: pcs[0], tol: 0.15, needFormula: true,
          task: pcCells[0] + ": the percentage change.",
          answer: "=(C2-B2)/B2*100",
          why: "Difference over the original, not over the new value. Dividing by the wrong one is a standard error that gets the direction right and the magnitude wrong.",
          wrongWay: "<span class='f'>=(C2-B2)/C2*100</span>. It looks equally reasonable and gives a different answer, and nothing on the sheet will tell you which you used."
        },
        {
          cell: cells[0], expect: pcs[bi], tol: 0.2, needFormula: true, mustUse: "MAX",
          task: cells[0] + ": the largest percentage rise.",
          answer: "=MAX(" + pcCells[0] + ":" + pcCells[nC - 1] + ")",
          why: fmtNum(pcs[bi], 1) + " per cent. A striking figure, and on its own an unusable one until you have looked at what it is a percentage of.",
          wrongWay: "Putting this in a headline. It is the most quotable number on the sheet and the least defensible without its base."
        },
        {
          cell: cells[1], expect: M10_COUNTRIES[bi].name,
          task: cells[1] + ": the country with the largest rise.",
          answer: M10_COUNTRIES[bi].name,
          why: "Now look at its 2021 value before writing anything about it.",
          wrongWay: "Naming the country and the percentage in the same sentence with no base. That is the sentence a hostile reader will check first."
        },
        {
          cell: cells[2], expect: a[bi], tol: 0.05,
          task: cells[2] + ": its 2021 base.",
          answer: fmtNum(a[bi], 1),
          why: "A rise from " + fmtNum(a[bi], 1) + " to " + fmtNum(b[bi], 1) + ". Written honestly that is <em>up " + fmtNum(pcs[bi], 1) + " per cent, from " + fmtNum(a[bi], 1) + " to " + fmtNum(b[bi], 1) + "</em>, and the reader can judge for themselves whether it matters. One clause, and the claim becomes unarguable.",
          wrongWay: "Omitting the base because it makes the finding less exciting. A reader who finds it themselves will discount everything else you wrote."
        },
        {
          cell: cells[3], ext: true, expect: nFell, needFormula: true, mustUse: "COUNTIF",
          task: cells[3] + ": countries that fell.",
          answer: '=COUNTIF(' + chCells[0] + ':' + chCells[nC - 1] + ',"<0")',
          why: "This is the number that cuts against a story about growth, and it is the one to go looking for before publishing rather than after. If most countries fell, the headline rise is an outlier and the piece should say so.",
          wrongWay: "Not computing it. The figure that weakens your argument is the one a disagreeing reader will look up first, so you should look it up first."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M10S3"); wb.add(M10S3.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 4: Stage 3 capstone
   ============================================================ */
const M10S4 = {
  title: "Stage 3 capstone: a real dataset, two charts, 300 words",
  aim: "Take one genuine public dataset from download to a short piece of analysis that presents both sides of what it shows.",
  why: "Everything in the course, on data nobody prepared for you, published under your own name.",
  concepts: ["m10.capstone"],
  unlocks: [],
  lesson: [
    { lead: "This is the only exercise in the course with no answer key, because there is no answer." },
    { p: "Everything before this used data generated to have a right answer. This one does not. You choose the dataset, you choose the question, and the marking is a rubric and your own honesty." },
    { h: "Choosing a dataset" },
    { p: "Pick one you actually want to know something about; the exercise is far harder if you do not care. Four sources worth starting from, all free and all downloadable as CSV:" },
    {
      ul: [
        "<strong>World Bank Open Data</strong>, at data.worldbank.org. Indicators by country and year. Arrives wide. Best for anything comparative across countries.",
        "<strong>UN Comtrade</strong>, at comtrade.un.org. Trade flows by reporter, partner, commodity and year. Watch the mirror statistics problem.",
        "<strong>ACLED</strong>, at acleddata.com. Conflict event data, one row per event. Registration required, free for academic use.",
        "<strong>OFSI consolidated list</strong>, on gov.uk, and <strong>OFAC SDN</strong>, on treasury.gov. One row per name variant, as you saw in session 1."
      ]
    },
    { pro: "Choose a question you can answer with one dataset. The commonest way this exercise goes wrong is picking a question that needs three sources joined together, spending the whole time on the join, and having nothing to say at the end." },
    { h: "What to produce" },
    {
      ol: [
        "<strong>A clean sheet</strong>, imported properly, with a source column and the indicator's full name and unit recorded verbatim.",
        "<strong>A note on what you had to decide.</strong> Which countries or years you excluded and why; how many observations were missing; which side of a mirror statistic you used.",
        "<strong>Two charts</strong>, decluttered, each titled with a finding, each with its axis labelled with the unit and basis in full.",
        "<strong>Three hundred words</strong> that state what the data shows, and then state what it shows that cuts against your reading.",
        "<strong>One paragraph on limits.</strong> What this dataset cannot tell you at all."
      ]
    },
    { h: "The three hundred words" },
    { p: "Roughly: a hundred words setting out the claim with its figures, a hundred on the strongest counter-evidence you could find and why you think the claim survives it, and a hundred on what the data cannot address. If the counter-evidence turns out to overturn the claim, write it the other way round and say so; that is a better piece, not a failed one." },
    { why: "This structure is not an academic exercise. It is how a piece of analysis earns the right to be believed by somebody who has no reason to trust you, which is the situation you will be in every time you publish." },
    { h: "Marking yourself" },
    { p: "The rubric is below, out of 24. There is no answer key and no figure to check against, so the honesty of the self-assessment is the whole of its value." },
    { h: "What desktop Excel adds, now that you have finished" },
    { p: "The course has taught Excel for the web throughout, so that nothing depended on a licence. Three things a desktop installation adds, in the order they are worth learning:" },
    {
      ul: [
        "<strong>Power Query</strong>, by a long way the most useful. Import, clean, reshape and join, as a saved list of steps that reruns on next month's file. Everything in Modules 4 and 10 becomes a Refresh. Learn this one.",
        "<strong>Power Pivot and the Data Model</strong>, which lets a single pivot table draw on several tables joined by a key, rather than one flat sheet. Worth it once your data no longer fits in one table.",
        "<strong>VBA macros</strong>, which automate anything at all and which almost nobody should learn now. Power Query covers most of what VBA was used for, without the maintenance burden, and Python in Excel covers the rest. Learn VBA only if you inherit a workbook that already contains it."
      ]
    },
    { desk: "You have desktop, so start with Power Query. Take the Module 4 capstone workbook, clean it again as a query, and compare the two. Half an hour, and it will change how you work." }
  ],
  reflect: [
    "Did the counter-evidence change your claim? If it did not, did you look hard enough?",
    "Which of the three desktop additions is worth your next hour?"
  ],

  practice: function (seed) {
    const sh = new Sheet("Checklist", 16, 6);
    const cells = fcAnswers(sh, 1, [
      "Dataset chosen (publisher)", "Download date, as yyyy-mm-dd",
      "Observations excluded", "Charts produced", "Words written"
    ]);
    lockSheet(sh, cells);
    sh.rows = cells.length + 4; sh.cols = 6;

    return {
      sheet: sh, rubric: STAGE3_RUBRIC, noVariation: true,
      maxRows: sh.rows, maxCols: 6, colWidth: 110, startRow: parseA1(cells[0]).r, startCol: 2,
      highlight: cells,
      brief: {
        title: "Your dataset, your question, your name on it",
        body: "There is no downloadable workbook for this one and no answer key. Choose a dataset from the four in the lesson, " +
          "do the work in Excel, and record the five facts below so the exercise is pinned to something concrete. " +
          "Then mark yourself against the rubric, honestly, because that is the only marking there is."
      },
      hint: "The two figures that must be numbers are the charts and the word count. Two charts and around 300 words is the target, and going far over on words is the commoner failure.",
      tasks: [
        { id: "t1", text: "Which publisher's data did you use? Type their name.", cell: cells[0] },
        { id: "t2", text: "The date you downloaded it, as yyyy-mm-dd.", cell: cells[1] },
        { id: "t3", text: "How many observations you excluded or found missing.", cell: cells[2] },
        { id: "t4", text: "How many charts you produced.", cell: cells[3] },
        { id: "t5", text: "How many words you wrote.", cell: cells[4] },
        { id: "t6", text: "Mark yourself against the rubric below. Under 16 means the module the marks came off is worth redoing.", cell: null, ext: true }
      ],
      checks: [
        {
          cell: cells[0], expectType: "text",
          task: cells[0] + ": the publisher.",
          answer: "the name of whoever published the data",
          why: "The first thing a reader needs and the first thing you forget. It belongs on the sheet, in a source column, and in the piece itself.",
          wrongWay: "Recording the file name instead. A file called wb_data_2.csv tells nobody anything six months later."
        },
        {
          cell: cells[1], expectType: "text",
          task: cells[1] + ": the download date.",
          answer: "the date you downloaded it, as yyyy-mm-dd",
          why: "Public datasets are revised. A figure that was right in March is not wrong in September; it is a figure from March, and only the date lets anybody tell the difference.",
          wrongWay: "Leaving it out because the data feels permanent. Revisions to headline indicators are routine and rarely announced."
        },
        {
          cell: cells[2], expectType: "number",
          task: cells[2] + ": observations excluded or missing.",
          answer: "the count, even if it is 0",
          why: "This number belongs in the write-up. A reader comparing your countries is entitled to know that some are computed on less data than others, and stating it costs you nothing while concealing it costs you everything.",
          wrongWay: "Not counting. If you do not know how much is missing you do not know what your averages are averaging."
        },
        {
          cell: cells[3], expect: 2,
          task: cells[3] + ": charts produced.",
          answer: "2",
          why: "Two: one carrying the claim, one carrying the counter-evidence. That pairing is the structure of the whole exercise and it is why the number is fixed.",
          wrongWay: "Producing six. A piece with six charts has not decided what it is arguing."
        },
        {
          cell: cells[4], expect: 300, tol: 60,
          task: cells[4] + ": words written.",
          answer: "around 300, give or take about sixty",
          why: "Three hundred words is enough for a claim, its counter-evidence and its limits, and short enough that every sentence has to earn its place. Going long is the commoner failure and it is almost always padding rather than substance.",
          wrongWay: "Writing twelve hundred words. The constraint is the exercise; anybody can be thorough at length."
        }
      ]
    };
  },
  workbook: function (seed) {
    /* No prepared workbook: the point is that you fetch the real thing. */
    const wb = new Workbook("M10S4");
    const sh = new Sheet("Start here", 24, 4);
    sh.set(0, 0, "Stage 3 capstone", { hdr: true });
    const lines = [
      "",
      "There is deliberately no data in this file.",
      "",
      "Choose one dataset and download it yourself:",
      "  World Bank Open Data      data.worldbank.org",
      "  UN Comtrade               comtrade.un.org",
      "  ACLED                     acleddata.com",
      "  OFSI consolidated list    gov.uk",
      "  OFAC SDN list             treasury.gov",
      "",
      "Import it with Data > From Text/CSV, not by double-clicking.",
      "Set every code and identifier column to Text before parsing.",
      "Add a source column: publisher, dataset, download date.",
      "Record the indicator's full name and unit, verbatim, below.",
      "",
      "Indicator name and unit:",
      "",
      "Source and download date:",
      ""
    ];
    lines.forEach((t, i) => { if (t) sh.set(1 + i, 0, t); });
    sh.rows = lines.length + 2; sh.cols = 4;
    wb.add(sh);
    return wb;
  }
};

const STAGE3_RUBRIC = [
  ["Import", "Imported rather than opened; codes kept as text; encoding correct.", 3],
  ["Provenance", "Source column on every row; indicator name and unit recorded verbatim.", 3],
  ["Shape", "Reshaped deliberately if needed, with the row count checked before and after.", 3],
  ["Missing data", "Gaps left as gaps, counted, and reported in the write-up.", 3],
  ["Charts", "Two, decluttered, titled with findings, axes labelled with unit and basis.", 4],
  ["Figures", "Precision defensible; every percentage carries its base; mirror side stated where relevant.", 4],
  ["Both sides", "The strongest counter-evidence found, included, and addressed.", 4]
];

defModule({
  id: "m10", n: 10, stage: "s3",
  title: "Evidence for arguments",
  subtitle: "Public datasets, reshaping, exact figures, both sides",
  blurb: "The same skills turned outwards, on data nobody prepared for you, for writing you intend to publish. Importing without damage, reshaping without loss, and the discipline of going looking for the figure that weakens your own argument.",
  onComplete: "That is the whole course. You can take a public dataset from download to a defensible published claim, and you know what your figures do not license you to say. The review queue keeps all of it alive; the interview drill keeps it quick.",
  concepts: [
    { id: "m10.csv", label: "Import, do not open", blurb: "Set codes to Text before anything is parsed." },
    { id: "m10.encoding", label: "Encoding", blurb: "UTF-8, or names arrive mangled and never match." },
    { id: "m10.sourcecol", label: "A source column on every row", blurb: "Publisher, dataset, download date." },
    { id: "m10.sanctionsfmt", label: "One row per alias", blurb: "Counting rows on a sanctions list overstates people." },
    { id: "m10.widelong", label: "Wide against long", blurb: "Analyse in long, present in wide." },
    { id: "m10.reshape", label: "Reshaping", blurb: "INDEX with two MATCHes, and check the row count." },
    { id: "m10.blanksmissing", label: "Blank means unknown", blurb: "Never zero, which is a claim you cannot support." },
    { id: "m10.units", label: "Units and basis", blurb: "Current against constant dollars, thousands against units." },
    { id: "m10.exactfigures", label: "Precision you can defend", blurb: "Not more than the source supports." },
    { id: "m10.rounding", label: "Rounding that distorts", blurb: "Thresholds, mismatched comparators, tiny bases." },
    { id: "m10.againstyourself", label: "The number that cuts against you", blurb: "Find it first, include it, address it." },
    { id: "m10.citation", label: "Source, table, date", blurb: "Datasets are revised; a figure has a vintage." },
    { id: "m10.capstone", label: "The Stage 3 workflow", blurb: "Import, decide, chart, claim, counter-claim, limits." }
  ],
  sessions: [M10S1, M10S2, M10S3, M10S4]
});
