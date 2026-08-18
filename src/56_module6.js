/* ============================================================
   Module 6: Pivot tables
   The highest-value skill in the course. The practice sessions
   drive a real pivot table with the same four field areas Excel
   has, then ask you to read the answer off it.
   ============================================================ */

const M6_FIELDS = [
  { name: "Supplier", type: "text" },
  { name: "City", type: "text" },
  { name: "Category", type: "text" },
  { name: "Date", type: "date" },
  { name: "Amount", type: "number", money: true }
];

function m6Data(seed, n) {
  return txRows(seed, n || 60).map(t => ({
    Ref: t.ref, Supplier: t.supplier, City: t.city,
    Category: t.category, Date: t.date, Amount: t.amount
  }));
}
/* Put the same records on a sheet, so the answer cells sit beside real data. */
function m6Sheet(recs, answerLabels) {
  const sh = new Sheet("Data", recs.length + 12, 6);
  ["Ref", "Supplier", "City", "Category", "Date", "Amount"].forEach((h, i) => sh.set(0, i, h, { hdr: true, locked: true }));
  recs.forEach((t, i) => {
    sh.set(1 + i, 0, t.Ref, { locked: true });
    sh.set(1 + i, 1, t.Supplier, { locked: true });
    sh.set(1 + i, 2, t.City, { locked: true });
    sh.set(1 + i, 3, t.Category, { locked: true });
    sh.set(1 + i, 4, t.Date, { fmt: DATEFMT, locked: true });
    sh.set(1 + i, 5, t.Amount, { fmt: GBP2, locked: true });
  });
  const base = recs.length + 3;
  label(sh, "A" + base, "Answers");
  const cells = [];
  answerLabels.forEach((lb, i) => {
    note(sh, "A" + (base + 1 + i), lb);
    cells.push("C" + (base + 1 + i));
  });
  sh.rows = base + answerLabels.length + 2;
  sh.cols = 6;
  return { sheet: sh, cells: cells };
}

/* ============================================================
   Session 1
   ============================================================ */
const M6S1 = {
  title: "Your first pivot table, and what it is actually doing",
  aim: "Summarise sixty rows by category in about four seconds, and understand why that works.",
  why: "Everything you built in Module 3 with SUMIFS, a pivot table does in four clicks and rearranges on demand. It is the highest-value thing in this course, and the reason to learn the formulas first is that a pivot cannot tell you why a number is wrong.",
  concepts: ["m6.whatitis", "m6.rowsvalues", "m6.reading", "m6.sourcerange"],
  unlocks: [],
  lesson: [
    { lead: "A pivot table does two things: it groups rows, then it does arithmetic on each group." },
    { p: "That is the entire idea. Put City in Rows and Amount in Values, and it finds every distinct city, gathers the rows for each, and totals the amounts. It is the SUMIFS summary table you built by hand in Module 3, except you did not write anything and you can rearrange it by changing one dropdown." },
    { h: "The four areas" },
    {
      table: {
        cols: ["Area", "What goes there"], startRow: 1,
        rows: [
          ["Rows", "the thing you want one line per: city, supplier, category"],
          ["Values", "the number being worked out: amount, count of transactions"],
          ["Columns", "a second grouping, across the top, giving a grid"],
          ["Filters", "restrict the whole table to part of the data"]
        ]
      }
    },
    { p: "In Excel these are four boxes at the bottom of the Field List and you drag field names into them. In the practice below they are four dropdowns with the same names, because dragging teaches nothing that choosing does not." },
    { h: "Building one" },
    {
      steps: [
        "Click any single cell inside your data. One cell, exactly as with sorting.",
        "<span class='path'><span>Insert</span><i>›</i><span>PivotTable</span></span>. Excel proposes a range: check it covers everything and no more.",
        "Choose to put it on a new sheet.",
        "Drag a field into Rows, and a numeric field into Values.",
        "Read it."
      ]
    },
    { trap: "Step 2 is the one that goes wrong. Excel guesses the source range by looking outward from your selected cell until it hits a blank row or column. A completely empty row in the middle of your data means it takes the top half and reports confidently on it. Always read the range in that dialogue before pressing OK." },
    { h: "What Values does by default" },
    { p: "Drop a numeric field into Values and Excel sums it. Drop a text field in, and it cannot sum text, so it counts instead. That is why a pivot sometimes shows Count of Amount when you wanted Sum of Amount: at least one cell in that column is text." },
    { why: "This is a genuinely useful diagnostic. If a pivot switches to Count when you expected Sum, you have found a number stored as text without looking for it, which is the Module 1 fault appearing in a new place." },
    { h: "Reading a pivot honestly" },
    { p: "A pivot always shows a Grand Total. Check it against a plain SUM over your source data. If they differ, either the source range is wrong or a filter is on, and you want to know which before you quote anything from it." },
    { pro: "Put the pivot on its own sheet, never beside the data. A pivot grows and shrinks as you rearrange it, and it will overwrite whatever it expands into, without asking and without undo once saved." },
    { web: "Excel for the web builds and rearranges pivot tables perfectly well. It cannot create a PivotChart, and it has fewer options under Value Field Settings, but everything this module teaches works." },
    { desk: "Desktop adds PivotCharts, which redraw as you rearrange the pivot, and the Data Model, which lets one pivot draw on several tables joined by a key rather than one flat sheet. Both are genuinely useful and neither changes what a pivot fundamentally is." }
  ],
  reflect: [
    "Say what a pivot table does, in two verbs.",
    "If a pivot shows Count of Amount when you wanted Sum, what have you learned about the data?"
  ],

  practice: function (seed) {
    const recs = m6Data(seed, 60);
    const built = m6Sheet(recs, ["Total for Leeds", "Grand total, all cities", "Number of transactions in Leeds"]);
    const sh = built.sheet, cells = built.cells;
    lockSheet(sh, cells);
    cells.slice(0, 2).forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });

    const leeds = recs.filter(r => r.City === "Leeds");
    const eLeeds = xround(leeds.reduce((a, b) => a + b.Amount, 0), 2);
    const eGrand = xround(recs.reduce((a, b) => a + b.Amount, 0), 2);
    const eCount = leeds.length;

    return {
      sheet: sh, cells,
      maxRows: sh.rows, maxCols: 6, startRow: parseA1(cells[0]).r, startCol: 2,
      formatBar: false,
      pivot: {
        data: recs, fields: M6_FIELDS,
        initial: { rowField: "", valueField: "", agg: "sum" },
        hint: "The same four areas as Excel's field list. Choose a field for <strong>Rows</strong> and a field for <strong>Values</strong>, and the table below builds itself."
      },
      highlight: cells,
      brief: {
        title: "Sixty transactions, three questions, no formulas",
        body: "Everything below can be answered from a pivot table without writing a single formula. " +
          "Build it, read the figures off it, and type them into the answer cells. " +
          "Then check the grand total against what you would expect from sixty rows: if it looks wrong, it is."
      },
      hint: "Set Rows to City and Values to Amount. Read the Leeds line. For the third question, change Summarise by from Sum to Count.",
      tasks: [
        { id: "t1", text: "Set the pivot to show total <strong>Amount</strong> by <strong>City</strong>.", cell: null },
        { id: "t2", text: "Type the Leeds total into " + cells[0] + ".", cell: cells[0] },
        { id: "t3", text: "Type the grand total into " + cells[1] + ".", cell: cells[1] },
        { id: "t4", text: "Change Summarise by to <strong>Count</strong>, then type the number of Leeds transactions into " + cells[2] + ".", cell: cells[2] },
        { id: "t5", text: "Set Summarise by back to Sum, and change Rows to <strong>Category</strong>. Same data, different question, one dropdown.", cell: null, ext: true }
      ],
      checks: [
        {
          pivotSpec: { rowField: "City", valueField: "Amount" },
          task: "The pivot set to City by Amount.",
          answer: "Rows = City, Values = Amount",
          why: "Rows is the thing you want one line per; Values is the number being worked out. Those two dropdowns are the whole of a basic pivot table.",
          wrongWay: "Putting Amount in Rows, which gives one line per distinct amount and is almost never useful. Ask what you want one line per."
        },
        {
          cell: cells[0], expect: eLeeds, tol: 1,
          task: cells[0] + ": the Leeds total.",
          answer: gbp(eLeeds),
          why: "Read straight off the Leeds row of the pivot. This is the same figure you would get from <span class='f'>=SUMIFS(Amount,City,\"Leeds\")</span> in Module 3, arrived at without writing anything.",
          wrongWay: "Adding the Leeds rows up by hand from the data. Sixty rows is possible; six thousand is not, and this is what a pivot exists for."
        },
        {
          cell: cells[1], expect: eGrand, tol: 1,
          task: cells[1] + ": the grand total.",
          answer: gbp(eGrand),
          why: "The bottom line of the pivot. Always check it against a plain SUM over the source: if the two disagree, either the source range is wrong or a filter is on, and you need to know which before quoting anything.",
          wrongWay: "Assuming the grand total covers all your data. It covers whatever range the pivot was built on, which is not always the same thing."
        },
        {
          cell: cells[2], expect: eCount,
          task: cells[2] + ": the number of Leeds transactions.",
          answer: String(eCount),
          why: "Same pivot, Summarise by changed from Sum to Count. Note how different a question that is: the largest total and the most transactions are frequently different cities, and confusing the two is a standard reporting error.",
          wrongWay: "Reporting the total when asked for the number, or the other way round. Say which one you mean."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M6S1"); wb.add(M6S1.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 2
   ============================================================ */
const M6S2 = {
  title: "Value field settings, and a second dimension",
  aim: "Change what the pivot works out, and add a column field to turn a list into a grid.",
  why: "Sum is the default and often the wrong question. The same rows can tell you how much, how many, how big on average, and what share of the whole, and the four answers frequently point in different directions.",
  concepts: ["m6.valuesettings", "m6.pctoftotal", "m6.columns", "m6.sumvscount"],
  unlocks: [],
  lesson: [
    { lead: "Sum, Count and Average over the same column answer three different questions." },
    { p: "A city with the largest total may have one enormous transaction. A city with the most transactions may be the smallest by value. A city with the highest average may have three rows. Report only one of these and you have chosen an argument, whether you meant to or not." },
    { h: "Changing the setting" },
    { p: "In Excel, click the field in the Values box and choose <span class='f'>Value Field Settings</span>, or right-click any figure in the pivot and choose <span class='f'>Summarize Values By</span>. In the practice below it is the <strong>Summarise by</strong> dropdown." },
    {
      ul: [
        "<strong>Sum</strong>: how much in total.",
        "<strong>Count</strong>: how many rows. Counts rows, not values, so it is unaffected by how large they are.",
        "<strong>Average</strong>: the mean per row. Sensitive to a single outlier, exactly as Module 2 warned.",
        "<strong>Max</strong> and <strong>Min</strong>: the largest and smallest single transaction in the group, which is often the most interesting line in an exception report.",
        "<strong>% of grand total</strong>: each figure as a share of the whole."
      ]
    },
    { h: "Percentage of total" },
    { p: "Shares are usually more useful than absolute figures when you are comparing groups of different sizes. Leeds at £40,000 means little; Leeds at 38 per cent of all spend means something immediately." },
    { trap: "A percentage without its base is not a fact. Thirty-eight per cent of what, over what period, out of how many transactions? Always show the count alongside the share, because 100 per cent of two transactions and 38 per cent of six hundred are not comparable claims." },
    { h: "Adding a column field" },
    { p: "Put City in Rows and Category in Columns and you get a grid: one line per city, one column per category, with each cell holding that combination. Row totals down the right, column totals along the bottom." },
    { p: "This is where a pivot stops being a faster SUMIFS and starts being something you would not have built by hand. Sixty rows become a five by five grid you can read in a glance." },
    { pro: "Two dimensions is usually the limit of what anybody can read. If you find yourself adding a third field to Rows and getting a nested table forty lines deep, stop: you are building a database query, and what you want is a filter or a chart." },
    { h: "Blank cells in a pivot" },
    { p: "An empty cell in the grid means no rows matched that combination. It does not mean zero, and it is not an error. If you would rather see 0, that is a display option, and think about whether it is honest before you turn it on: a genuine absence and a genuine nil are different facts." },
    { web: "Excel for the web has Sum, Count, Average, Max and Min, and Show Values As for percentages. The full set of Show Values As options, such as percentage of parent row, is desktop only and you will not miss it at this stage." },
    { desk: "Desktop's Show Values As includes running totals, rank within a column, and percentage difference from the previous period, which is genuinely useful for month-on-month reporting. Worth knowing exists; not worth learning until you have a question that needs it." }
  ],
  reflect: [
    "Name a case where the city with the largest total is not the city with the most transactions.",
    "Why is a percentage without its count a weak claim?"
  ],

  practice: function (seed) {
    const recs = m6Data(seed, 60);
    const built = m6Sheet(recs, [
      "Average transaction in Leeds",
      "Largest single transaction in Leeds",
      "Leeds share of total spend, %",
      "Leeds spend on Stock"
    ]);
    const sh = built.sheet, cells = built.cells;
    lockSheet(sh, cells);
    [cells[0], cells[1], cells[3]].forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });

    const leeds = recs.filter(r => r.City === "Leeds");
    const eAvg = leeds.length ? xround(leeds.reduce((a, b) => a + b.Amount, 0) / leeds.length, 2) : 0;
    const eMax = leeds.length ? Math.max.apply(null, leeds.map(r => r.Amount)) : 0;
    const grand = recs.reduce((a, b) => a + b.Amount, 0);
    const ePct = xround(100 * leeds.reduce((a, b) => a + b.Amount, 0) / grand, 1);
    const stock = leeds.filter(r => r.Category === "Stock");
    const eStock = xround(stock.reduce((a, b) => a + b.Amount, 0), 2);

    return {
      sheet: sh, cells,
      maxRows: sh.rows, maxCols: 6, startRow: parseA1(cells[0]).r, startCol: 2,
      formatBar: false,
      pivot: {
        data: recs, fields: M6_FIELDS,
        initial: { rowField: "City", valueField: "Amount", agg: "sum" },
        hint: "Start from City by Amount. Change <strong>Summarise by</strong> for the first three questions, then add a <strong>Columns</strong> field for the last one."
      },
      highlight: cells,
      brief: {
        title: "The same sixty rows, asked four different questions",
        body: "Nothing about the data changes in this exercise. Only the question does, and each answer comes from one dropdown. " +
          "The last one needs a second dimension: put Category across the top and read the cell where Leeds meets Stock."
      },
      hint: "Sum, Average, Max and % of grand total are all in Summarise by. For the final question, set Columns to Category and go back to Sum.",
      tasks: [
        { id: "t1", text: "Set Summarise by to <strong>Average</strong> and put the Leeds figure in " + cells[0] + ".", cell: cells[0] },
        { id: "t2", text: "Set it to <strong>Max</strong> and put the Leeds figure in " + cells[1] + ".", cell: cells[1] },
        { id: "t3", text: "Set it to <strong>% of grand total</strong> and put the Leeds share in " + cells[2] + ", as a number of per cent to one decimal place.", cell: cells[2] },
        { id: "t4", text: "Back to <strong>Sum</strong>, and set Columns to <strong>Category</strong>. Read the cell where Leeds meets Stock into " + cells[3] + ".", cell: cells[3] },
        { id: "t5", text: "Compare the Leeds average against the Leeds max. If the max is many times the average, the average is describing a group that is not really uniform.", cell: null, ext: true }
      ],
      checks: [
        {
          cell: cells[0], expect: eAvg, tol: 1,
          task: cells[0] + ": the average Leeds transaction.",
          answer: gbp(eAvg),
          why: "Sum divided by count, worked out per group. Compare it against the largest single transaction below: where one payment is many times the mean, the average is describing a group that is not uniform and quoting it alone is misleading.",
          wrongWay: "Dividing the Leeds total by 60. The denominator is the number of Leeds rows, not the number of rows in the file."
        },
        {
          cell: cells[1], expect: eMax, tol: 1,
          task: cells[1] + ": the largest single Leeds transaction.",
          answer: gbp(eMax),
          why: "Max is the most useful setting in exception work: it takes you straight to the single row worth looking at, without sorting or filtering anything.",
          wrongWay: "Reading the row total. The total is the whole group; the max is one transaction inside it."
        },
        {
          cell: cells[2], expect: ePct, tol: 0.15,
          task: cells[2] + ": the Leeds share of total spend.",
          answer: fmtNum(ePct, 1) + "%",
          why: "A share is usually more informative than an absolute figure, because it survives comparison across periods of different sizes. Quote it with the count beside it: a share without its base is not a fact.",
          wrongWay: "Reporting the share and dropping the underlying total. Both belong together, and the reader will assume the worst about whichever you left out."
        },
        {
          cell: cells[3], expect: eStock, tol: 1,
          task: cells[3] + ": Leeds spend on Stock.",
          answer: gbp(eStock),
          why: "The cell where the Leeds row meets the Stock column. Two dimensions turn sixty rows into a grid you can read in a glance, and this figure would have taken a two-condition SUMIFS to get in Module 3.",
          wrongWay: "Reading the Leeds row total, which covers every category. Check you are in the right column before you copy a figure out of a grid."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M6S2"); wb.add(M6S2.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 3
   ============================================================ */
const M6S3 = {
  title: "Grouping by month, filtering, and the traps",
  aim: "Turn a column of dates into a monthly trend, restrict a pivot to part of the data, and avoid the three ways a pivot lies.",
  why: "Nearly every question anyone asks about transaction data has a time dimension. Grouping dates is what turns a pivot from a summary into an analysis.",
  concepts: ["m6.groupdates", "m6.filters", "m6.refresh", "m6.pivottraps"],
  unlocks: [],
  lesson: [
    { lead: "Put a date field in Rows and, ungrouped, you get one line per day. That is not a trend, it is a list." },
    { h: "Grouping" },
    { p: "Right-click any date in the pivot and choose <span class='f'>Group</span>, then pick Months, or Months and Years together. In the practice below it is the <strong>Group dates by</strong> dropdown." },
    { trap: "Group by month alone and January 2023 and January 2024 are added together into one line called Jan. On any dataset spanning more than a year this is silently, badly wrong. Group by Years <em>and</em> Months, or make sure your data covers a single year and say so." },
    { p: "This only works if the dates are real dates. On text that looks like dates, the Group option is greyed out or missing entirely, which is Module 1 and Module 4 arriving again. If you cannot group, check the alignment first." },
    { h: "Filters, and slicers" },
    { p: "A field in the Filters area restricts the whole pivot: one dropdown above the table, and everything below it responds. Useful, and easy to forget you set." },
    { p: "A <strong>slicer</strong> is the same thing as a set of visible buttons, added with <span class='path'><span>Insert</span><i>›</i><span>Slicer</span></span>. It does exactly what the filter dropdown does, with one advantage that matters: you can see what is selected without clicking anything." },
    { pro: "On anything somebody else will read, use a slicer rather than a filter dropdown. A filter that is on and not visible is how a report ends up describing a quarter of the data while claiming to describe all of it. One slicer prevents an entire class of embarrassment." },
    { h: "The three traps" },
    { p: "<strong>One: the pivot does not update itself.</strong> Change the source data and the pivot keeps showing the old figures until you refresh it, with <span class='path'><span>PivotTable Analyze</span><i>›</i><span>Refresh</span></span> or right-click and Refresh. This is the single most common pivot error, and it produces a report that was right an hour ago." },
    { p: "<strong>Two: the source range is fixed at creation.</strong> Add rows to the bottom of your data and the pivot does not include them, even after refreshing, because the range it was built on stops above them. The fix is to format your data as a Table first, with <span class='path'><span>Insert</span><i>›</i><span>Table</span></span> or <kbd>Ctrl</kbd>+<kbd>T</kbd>. A pivot built on a Table grows with it automatically." },
    { p: "<strong>Three: a blank row splits your data.</strong> Excel guesses the range by looking outward until it meets a blank, so an empty row in the middle means the pivot covers the top half only. The grand total looks plausible and is half of what it should be." },
    { why: "Notice that all three traps produce believable numbers rather than errors, which is the Module 2 lesson again. Check the grand total against a plain SUM over the source every time, because that one comparison catches all three." },
    { web: "Grouping, filters and slicers all work in Excel for the web, and Refresh is on the PivotTable tab. Format as Table works there too and is worth doing on any data you will add to." },
    { desk: "Desktop lets you set a pivot to refresh whenever the file is opened, under PivotTable Options, Data. On a report somebody else runs monthly that is worth doing, because it removes the trap that depends on them remembering." }
  ],
  reflect: [
    "Say what happens if you group two years of data by month alone.",
    "Name the one check that catches all three pivot traps."
  ],

  practice: function (seed) {
    const recs = m6Data(seed, 90);
    const built = m6Sheet(recs, [
      "Total in March",
      "Busiest month by spend",
      "Leeds spend in March",
      "Transactions in March"
    ]);
    const sh = built.sheet, cells = built.cells;
    lockSheet(sh, cells);
    [cells[0], cells[2]].forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });

    const monthOf = d => formatDate(d, "mmm yyyy");
    const byMonth = {};
    recs.forEach(r => { byMonth[monthOf(r.Date)] = (byMonth[monthOf(r.Date)] || 0) + r.Amount; });
    const marchLabel = "Mar 2024";
    const eMarch = xround(byMonth[marchLabel] || 0, 2);
    let best = null;
    Object.keys(byMonth).forEach(k => { if (!best || byMonth[k] > byMonth[best]) best = k; });
    const marchLeeds = recs.filter(r => r.City === "Leeds" && monthOf(r.Date) === marchLabel);
    const eMarchLeeds = xround(marchLeeds.reduce((a, b) => a + b.Amount, 0), 2);
    const eMarchCount = recs.filter(r => monthOf(r.Date) === marchLabel).length;

    return {
      sheet: sh, cells,
      maxRows: sh.rows, maxCols: 6, startRow: parseA1(cells[0]).r, startCol: 2,
      formatBar: false,
      pivot: {
        data: recs, fields: M6_FIELDS,
        initial: { rowField: "Date", valueField: "Amount", agg: "sum", grouping: "none" },
        hint: "Rows is already set to Date, ungrouped, so you get one line per day. Change <strong>Group dates by</strong> to month and watch ninety lines become three."
      },
      highlight: cells,
      brief: {
        title: "Ninety transactions across three months",
        body: "Ungrouped, the date field gives you a line per day and tells you nothing. Group it by month and the shape of the data appears. " +
          "Then use the Filter area to answer a question about one city, and remember to clear it afterwards."
      },
      hint: "Group dates by month first. For the Leeds question use the Filter area rather than changing Rows, so the monthly shape stays visible.",
      tasks: [
        { id: "t1", text: "Set <strong>Group dates by</strong> to month. Ninety rows should collapse to three lines.", cell: null },
        { id: "t2", text: "Put the March total into " + cells[0] + ".", cell: cells[0] },
        { id: "t3", text: "Type the name of the busiest month by spend into " + cells[1] + ", as it appears in the pivot.", cell: cells[1] },
        { id: "t4", text: "Set <strong>Filter</strong> to City and <strong>Showing</strong> to Leeds, then put the March figure into " + cells[2] + ".", cell: cells[2] },
        { id: "t5", text: "Change Summarise by to Count and put the number of March transactions into " + cells[3] + ". Watch the row count note under the table while the filter is on.", cell: cells[3], ext: true },
        { id: "t6", text: "Set Filter back to none. Leaving it on is how a report ends up describing a quarter of the data.", cell: null, ext: true }
      ],
      checks: [
        {
          pivotSpec: { rowField: "Date", grouping: "month", valueField: "Amount" },
          task: "The pivot grouped by month.",
          answer: "Rows = Date, Group dates by = month, Values = Amount",
          why: "Ungrouped dates give one line per day, which is a list rather than a trend. Grouping is what makes a date field useful, and it only works because these are real dates rather than text that looks like dates.",
          wrongWay: "Building a helper column of month names with TEXT and using that in Rows. It works, and it sorts alphabetically, so April comes before January. If you must use a helper, format it as yyyy-mm so it sorts correctly."
        },
        {
          cell: cells[0], expect: eMarch, tol: 1,
          task: cells[0] + ": the March total.",
          answer: gbp(eMarch),
          why: "One line of the grouped pivot. Worth noting that this dataset covers a single year, so grouping by month alone is safe here. On two years of data it would have added March 2023 and March 2024 together, silently.",
          wrongWay: "Grouping by month on multi-year data and reporting the result. Group by years and months together whenever the span is uncertain."
        },
        {
          cell: cells[1], expect: best,
          task: cells[1] + ": the busiest month by spend.",
          answer: best,
          why: "The largest of the three monthly totals. Note this is the busiest by value, which need not be the busiest by number of transactions; change Summarise by to Count and you may well get a different month.",
          wrongWay: "Answering with the month having the most rows when asked about spend. Say which measure you used."
        },
        {
          cell: cells[2], expect: eMarchLeeds, tol: 1,
          task: cells[2] + ": Leeds spend in March.",
          answer: gbp(eMarchLeeds),
          why: "The Filter area restricts the whole table, so the monthly breakdown stays visible while showing Leeds only. Note the row count under the table drops, which is your visible confirmation that a filter is on.",
          wrongWay: "Forgetting to clear the filter afterwards. Every figure you read from then on describes Leeds while appearing to describe everything, and nothing on the pivot shouts about it."
        },
        {
          cell: cells[3], ext: true, expect: eMarchCount,
          task: cells[3] + ": the number of transactions in March.",
          answer: String(eMarchCount),
          why: "Summarise by set to Count, with the filter cleared so this covers every city. Compare it against the March total above: together they give you the average March transaction, and either figure alone would let a reader draw the wrong conclusion about the month.",
          wrongWay: "Leaving the Leeds filter on from the previous task, which gives the Leeds March count while the label says March. The row count under the pivot is there to stop exactly this."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M6S3"); wb.add(M6S3.practice(seed).sheet); return wb; }
};

/* ============================================================
   Register
   ============================================================ */
defModule({
  id: "m6", n: 6, stage: "s1",
  title: "Pivot tables",
  subtitle: "Build, rearrange, value settings, group by month, filters",
  blurb: "The highest-value skill in the course. Questions that take a careful SUMIFS to answer become a dropdown, and questions you would never have built by hand become readable in a glance.",
  onComplete: "You can summarise a dataset from four angles in under a minute, and you know the three ways a pivot quietly reports on the wrong rows. Module 7 is about turning these answers into something somebody else can read.",
  concepts: [
    { id: "m6.whatitis", label: "What a pivot actually does", blurb: "Groups rows, then does arithmetic on each group." },
    { id: "m6.rowsvalues", label: "Rows and Values", blurb: "One line per what, and which number." },
    { id: "m6.reading", label: "Check the grand total", blurb: "Against a plain SUM over the source, every time." },
    { id: "m6.sourcerange", label: "The source range", blurb: "Excel guesses it, and a blank row halves it." },
    { id: "m6.valuesettings", label: "Sum, Count, Average, Max", blurb: "Four different questions about the same rows." },
    { id: "m6.pctoftotal", label: "% of grand total", blurb: "A share is not a fact without its base." },
    { id: "m6.columns", label: "A second dimension", blurb: "Rows and Columns turn a list into a grid." },
    { id: "m6.sumvscount", label: "Count of, when you wanted Sum of", blurb: "A number stored as text, found without looking." },
    { id: "m6.groupdates", label: "Grouping dates", blurb: "By month and year, never month alone across years." },
    { id: "m6.filters", label: "Filters and slicers", blurb: "A slicer shows what is selected; a dropdown hides it." },
    { id: "m6.refresh", label: "Pivots do not update themselves", blurb: "Refresh, or report figures that were right an hour ago." },
    { id: "m6.pivottraps", label: "The three traps", blurb: "All three give believable numbers rather than errors." }
  ],
  sessions: [M6S1, M6S2, M6S3]
});
