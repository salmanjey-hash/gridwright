/* ============================================================
   Module 7: Charts and communication, plus the Stage 1 capstone.
   ============================================================ */

/* ---------- small SVG specimens for the lessons ---------- */
function specimen(kind) {
  const A = "var(--accent)", L = "var(--line)", M = "var(--ink-3)";
  const bar = (vals, w, h) => {
    const max = Math.max.apply(null, vals), bw = w / vals.length;
    return vals.map((v, i) =>
      '<rect x="' + (i * bw + bw * 0.18) + '" y="' + (h - (v / max) * h) + '" width="' + (bw * 0.64) +
      '" height="' + ((v / max) * h) + '" rx="2" fill="' + A + '"/>').join("");
  };
  const line = (vals, w, h) => {
    const max = Math.max.apply(null, vals), step = w / (vals.length - 1);
    const pts = vals.map((v, i) => (i * step) + "," + (h - (v / max) * h)).join(" ");
    return '<polyline points="' + pts + '" fill="none" stroke="' + A + '" stroke-width="2.5" stroke-linejoin="round"/>';
  };
  const scatter = (pts, w, h) => pts.map(p =>
    '<circle cx="' + (p[0] * w) + '" cy="' + (h - p[1] * h) + '" r="3.2" fill="' + A + '" opacity=".75"/>').join("");
  const pie = (parts, cx, cy, r) => {
    let a0 = -Math.PI / 2, out = "";
    const tot = parts.reduce((a, b) => a + b, 0);
    parts.forEach((p, i) => {
      const a1 = a0 + (p / tot) * Math.PI * 2;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      out += '<path d="M' + cx + ' ' + cy + ' L' + x0 + ' ' + y0 + ' A' + r + ' ' + r + ' 0 ' +
        ((a1 - a0) > Math.PI ? 1 : 0) + ' 1 ' + x1 + ' ' + y1 + ' Z" fill="' + A + '" opacity="' + (1 - i * 0.17) + '"/>';
      a0 = a1;
    });
    return out;
  };
  const frame = inner => '<svg viewBox="0 0 200 96" role="img"><g transform="translate(6,6)">' + inner + '</g></svg>';
  const axis = '<line x1="0" y1="84" x2="188" y2="84" stroke="' + L + '" stroke-width="1"/>';

  switch (kind) {
    case "bar": return frame(axis + '<g transform="translate(0,0)">' + bar([62, 88, 45, 71, 30], 188, 84) + "</g>");
    case "line": return frame(axis + line([30, 42, 38, 61, 55, 78, 90], 188, 84));
    case "scatter": return frame(axis + scatter([[.08, .18], [.2, .3], [.3, .27], [.42, .5], [.5, .44], [.62, .66], [.7, .61], [.82, .8], [.92, .86]], 188, 84));
    case "pie": return frame(pie([32, 27, 22, 19], 94, 44, 40));
    case "bar-truncated": return frame(axis +
      '<g>' + [88, 90, 86, 92].map((v, i) =>
        '<rect x="' + (i * 47 + 9) + '" y="' + (84 - (v - 84) * 10) + '" width="30" height="' + ((v - 84) * 10) + '" rx="2" fill="' + A + '"/>').join("") + "</g>" +
      '<text x="0" y="94" font-size="9" fill="' + M + '">axis starts at 84</text>');
    case "bar-zero": return frame(axis +
      '<g>' + [88, 90, 86, 92].map((v, i) =>
        '<rect x="' + (i * 47 + 9) + '" y="' + (84 - (v / 100) * 84) + '" width="30" height="' + ((v / 100) * 84) + '" rx="2" fill="' + A + '"/>').join("") + "</g>" +
      '<text x="0" y="94" font-size="9" fill="' + M + '">axis starts at 0</text>');
  }
  return "";
}
function chartCards(list) {
  const grid = el("div", { class: "chart-grid" });
  list.forEach(c => {
    const card = el("div", { class: "chart-card" + (c.verdict ? " " + c.verdict : "") });
    if (c.verdict) card.appendChild(el("div", { class: "chart-verdict", text: c.verdict === "good" ? "use this" : "avoid" }));
    card.appendChild(el("h4", { text: c.title }));
    card.appendChild(el("div", { html: specimen(c.kind) }));
    card.appendChild(el("p", { html: c.note }));
    grid.appendChild(card);
  });
  return grid;
}

/* ============================================================
   Session 1
   ============================================================ */
const M7S1 = {
  title: "Choosing the chart, which is most of the work",
  aim: "Match the chart to the question, and know why pie charts almost never survive scrutiny.",
  why: "A chart is an argument. The type you choose decides which comparisons a reader can make and which are impossible, so it is a decision about meaning rather than decoration.",
  concepts: ["m7.chartchoice", "m7.pie", "m7.axiszero", "m7.onequestion"],
  unlocks: [],
  lesson: [
    { lead: "Pick the chart from the question, never from the ribbon." },
    { p: "There are three shapes of question in ordinary analysis, and each has one right answer." },
    { charts: [
      { kind: "bar", title: "Bar: comparison", verdict: "good", note: "Distinct things set side by side. Length is the easiest visual difference for people to judge." },
      { kind: "line", title: "Line: change over time", verdict: "good", note: "The line implies continuity between points, which is true of consecutive months and false of unrelated categories." },
      { kind: "scatter", title: "Scatter: relationship", verdict: "good", note: "Two numbers per record. The only one of the three that can answer whether they move together." }
    ] },
    { h: "Bar for comparison" },
    { p: "Comparing distinct things: spend by city, transactions by supplier, headcount by department. Bars, and if the labels are words of any length, horizontal bars so the text is readable without tilting your head." },
    { pro: "Sort the bars by value unless the categories have a natural order such as months or age bands. An unsorted bar chart makes the reader do the ranking themselves, which is the one job the chart existed to do." },
    { h: "Line for time" },
    { p: "Anything measured repeatedly over time. The line implies continuity between points, which is why it is right for a monthly series and wrong for unrelated categories: a line between Leeds and Bristol suggests a journey that does not exist." },
    { h: "Scatter for relationship" },
    { p: "Two numbers per record, asking whether they move together. Transaction size against processing time; income against spend. Every other chart type here has one number per category, and a scatter has two, which is why it answers a question the others cannot." },
    { h: "Pie, almost never" },
    { charts: [
      { kind: "pie", title: "Pie: four slices", verdict: "bad", note: "Which is larger, the second slice or the third? You cannot tell, and in a bar chart it would be obvious at a glance." },
      { kind: "bar", title: "The same data as bars", verdict: "good", note: "Sorted, directly comparable, and it still shows the shares if you label them." }
    ] },
    { p: "People are poor at comparing angles and areas, and good at comparing lengths. Two slices within a few per cent of each other are indistinguishable in a pie and obvious in a bar chart. A pie also cannot be sorted usefully, cannot show change over time, and becomes unreadable past about four slices." },
    { why: "The one defensible use: two or three parts of a single whole where the split is dramatic and the exact figures do not matter, such as showing that one supplier accounts for most of a budget. Even then a stacked bar does the same job and can be compared against last year. If you use a pie, be able to say why a bar chart would have been worse." },
    { h: "The axis must start at zero on a bar chart" },
    { charts: [
      { kind: "bar-truncated", title: "Axis starting at 84", verdict: "bad", note: "The values are 88, 90, 86 and 92. A difference of under 8 per cent looks like a fourfold one." },
      { kind: "bar-zero", title: "The same values from zero", verdict: "good", note: "Honest, and much duller, which is usually what the data actually deserves." }
    ] },
    { p: "A bar communicates through its length. Start the axis at 84 and a bar that is 8 per cent longer than another looks four times the size. This is the single most common way a chart misleads, and it usually happens by accident, because some tools do it by default." },
    { trap: "On a line chart a truncated axis is often legitimate, because a line communicates through its slope rather than its height, and a share price moving between 412 and 418 genuinely needs a zoomed axis. The rule is not never truncate; it is never truncate a bar, and always label the axis so the reader can see what you did." },
    { h: "One chart, one question" },
    { p: "Before drawing anything, write the sentence the chart has to support. If you cannot write it, you do not yet know what the chart is for, and you will produce something decorative. If it needs two sentences, you need two charts." },
    { web: "Excel for the web makes all of these. It cannot make a PivotChart, so build a chart from a pivot's output range instead, which works and does not redraw automatically when you rearrange the pivot." },
    { desk: "Desktop's Recommended Charts is a reasonable starting point and a poor decision-maker: it looks at the shape of your data, not at your question. Use it to save clicks once you have already decided what you want." }
  ],
  reflect: [
    "Say the chart type for each of the three question shapes, without looking.",
    "Write the one sentence your next chart has to support, before you draw it."
  ],

  practice: function (seed) {
    const recs = m6Data(seed, 60);
    const built = m6Sheet(recs, [
      "Spend by city",
      "Monthly spend trend",
      "Transaction size against processing days",
      "Share of spend, four suppliers",
      "Bar chart axis should start at"
    ]);
    const sh = built.sheet, cells = built.cells;
    lockSheet(sh, cells);
    sh.rows = sh.rows + 1;

    return {
      sheet: sh, cells,
      maxRows: sh.rows, maxCols: 6, startRow: parseA1(cells[0]).r, startCol: 2,
      formatBar: false,
      highlight: cells,
      brief: {
        title: "Five briefs, five decisions",
        body: "For each question below, type the chart you would use: <strong>BAR</strong>, <strong>LINE</strong>, <strong>SCATTER</strong> or <strong>PIE</strong>. " +
          "The last one asks for a number rather than a chart type. " +
          "Then build at least one of them for real in the downloaded workbook, because choosing is only half of it."
      },
      hint: "Comparison of distinct things, change over time, or relationship between two numbers. Those three cover almost everything.",
      tasks: [
        { id: "t1", text: "Spend by city, six cities. Which chart?", cell: cells[0] },
        { id: "t2", text: "Total spend per month across a year. Which chart?", cell: cells[1] },
        { id: "t3", text: "Whether larger transactions take longer to process. Which chart?", cell: cells[2] },
        { id: "t4", text: "The share of spend taken by each of four suppliers, where you want the exact figures compared. Which chart?", cell: cells[3] },
        { id: "t5", text: "In " + cells[4] + ", type the number a bar chart's value axis must start at.", cell: cells[4], ext: true }
      ],
      checks: [
        {
          cell: cells[0], expect: "BAR",
          task: cells[0] + ": spend by city.",
          answer: "BAR",
          why: "Distinct categories being compared, so length is the right encoding. With city names as labels, use horizontal bars so the text reads normally, and sort by value so the ranking is done for the reader.",
          wrongWay: "A pie. Six slices is already past the point where a reader can compare them, and cities are not parts of a story about proportion."
        },
        {
          cell: cells[1], expect: "LINE",
          task: cells[1] + ": monthly spend.",
          answer: "LINE",
          why: "Measured repeatedly over time, and the line implies continuity between the points, which is true of consecutive months.",
          wrongWay: "A bar chart. Not wrong exactly, and it hides the trend, which is the one thing a time series is for. Bars invite comparison of individual months; a line shows direction."
        },
        {
          cell: cells[2], expect: "SCATTER",
          task: cells[2] + ": size against processing time.",
          answer: "SCATTER",
          why: "Two numbers per record, asking whether they move together. Every other chart here has one number per category, which is why none of them can answer this.",
          wrongWay: "Two lines on one chart, one for size and one for time. That shows both series against the row number and says nothing about whether they are related."
        },
        {
          cell: cells[3], expect: "BAR",
          task: cells[3] + ": share of spend across four suppliers.",
          answer: "BAR",
          why: "The trap in the wording is <em>where you want the exact figures compared</em>. Shares sound like a pie, and the moment precision matters a pie fails, because two slices a few per cent apart are indistinguishable. A sorted bar chart of percentages does the job and can be set beside last year's.",
          wrongWay: "PIE. It is the intuitive answer and it is why so many bad charts exist. A pie is defensible only when the split is dramatic and the exact figures do not matter."
        },
        {
          cell: cells[4], ext: true, expect: 0,
          task: cells[4] + ": where a bar chart's axis starts.",
          answer: "0",
          why: "A bar communicates through length, so the length has to be proportional to the value. Truncating the axis makes an 8 per cent difference look like a fourfold one. On a line chart, where meaning comes from slope, a truncated axis is often legitimate.",
          wrongWay: "Letting the tool decide. Some default to a truncated axis, which is how most misleading charts get made without anybody intending it."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M7S1"); wb.add(M7S1.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 2
   ============================================================ */
const M7S2 = {
  title: "Decluttering, and the sentence the chart has to support",
  aim: "Strip a chart down to what carries meaning, and title it with a finding rather than a label.",
  why: "Most charts are 40 per cent ink that says nothing. Removing it is quick, and the result is not merely tidier: a reader gets the point in two seconds instead of twenty.",
  concepts: ["m7.declutter", "m7.title", "m7.condformat", "m7.labels"],
  unlocks: [],
  lesson: [
    { lead: "Every element on a chart has to earn its place, and most of them cannot." },
    { h: "What to remove, in order" },
    {
      ol: [
        "<strong>Gridlines.</strong> Usually unnecessary. If a reader needs exact values, label the bars directly instead.",
        "<strong>The legend, when there is one series.</strong> A legend explaining one colour is pure noise; put the series name in the title.",
        "<strong>Chart borders and background fills.</strong> They separate the chart from the page for no reason.",
        "<strong>Axis lines and tick marks.</strong> Keep the baseline of a bar chart; the rest can usually go.",
        "<strong>Decimal places.</strong> £41,283.71 on a chart should be £41,000 or £41.3k. Precision belongs in the table."
      ]
    },
    { pro: "Do it in that order and stop when removing the next thing would cost the reader something. The test for every element is: if I delete this, does anybody misunderstand the chart? If not, it goes." },
    { h: "Colour" },
    { p: "Use one colour for everything, and a second colour for the one thing you are talking about. A chart where every bar is a different colour is telling the reader that the colours mean something, and then they do not." },
    { trap: "Never rely on colour alone to carry meaning. Around one man in twelve has some colour vision deficiency, and a chart distinguishing red from green loses its content entirely for them. Also print it in black and white before you send it: whatever survives that will survive anything." },
    { h: "The title is not a label" },
    { p: "The default title is the field name, which tells a reader what they can already see. Replace it with the finding." },
    {
      table: {
        cols: ["Instead of", "Write"], startRow: 1,
        rows: [
          ["Spend by city", "Leeds accounts for 38% of spend, more than the next two cities combined"],
          ["Monthly transactions", "Transaction volume doubled after March"],
          ["Amount by supplier", "Four suppliers take 80% of the budget"]
        ]
      }
    },
    { why: "This is the single highest-return habit in the module. A titled finding survives being pasted into an email with no context; a labelled chart does not. It also forces you to check that the chart supports the sentence, and roughly a third of the time it turns out that it does not." },
    { trap: "Which is a discipline, not a licence. The title must be what the data shows, including when that is duller than you hoped. If you cannot write a finding, the honest title is descriptive and the honest next step is to say the data does not show much." },
    { h: "Conditional formatting, used sparingly" },
    { p: "Colour scales and data bars in cells are a chart inside a table, and they are excellent in exactly one situation: a table somebody will scan for outliers." },
    { path: ["Home", "Conditional Formatting", "Colour Scales"] },
    { pro: "One rule per table. A sheet with three overlapping colour scales, an icon set and two highlight rules is unreadable, and the usual cause is rules added over months by different people. Before adding a rule, check what is already there under Manage Rules." },
    { h: "Direct labels beat legends" },
    { p: "On a line chart with three series, put each series name at the end of its own line rather than in a legend. The reader's eye stops moving between the key and the chart, and it costs one text box each." },
    { web: "Excel for the web can remove gridlines, legends and borders, and edit titles, through the Chart pane. Direct data labels are supported; positioning them by dragging is fiddlier than on desktop." },
    { desk: "Desktop lets you save a cleaned-up chart as a template and apply it in one click, which is worth doing once you have decluttered the same chart three times." }
  ],
  reflect: [
    "Take a chart you have seen recently and name three things on it that carry no meaning.",
    "Write a finding-style title for the last chart you made."
  ],

  practice: function (seed) {
    const recs = m6Data(seed, 60);
    const built = m7SummarySheet(recs, [
      "Leeds share of spend, %",
      "Cities above 20% share",
      "Title style: LABEL or FINDING",
      "Elements to remove first"
    ]);
    const sh = built.sheet, cells = built.cells;
    lockSheet(sh, cells);

    const grand = recs.reduce((a, b) => a + b.Amount, 0);
    const byCity = {};
    recs.forEach(r => { byCity[r.City] = (byCity[r.City] || 0) + r.Amount; });
    const ePct = xround(100 * (byCity["Leeds"] || 0) / grand, 1);
    const eAbove = Object.keys(byCity).filter(c => 100 * byCity[c] / grand > 20).length;

    return {
      sheet: sh, cells,
      maxRows: sh.rows, maxCols: 6, startRow: parseA1(cells[0]).r, startCol: 2,
      formatBar: false,
      pivot: {
        data: recs, fields: M6_FIELDS,
        initial: { rowField: "City", valueField: "Amount", agg: "pct" },
        hint: "Already set to show each city's share of the grand total. Use it to work out the figures your chart title will have to state."
      },
      highlight: cells,
      brief: {
        title: "Write the title before you draw the chart",
        body: "You are about to chart spend by city. Before drawing anything, work out the numbers a finding-style title would have to state, " +
          "using the pivot above. Then build the chart in the downloaded workbook, declutter it, and give it that title."
      },
      hint: "The pivot is showing percentage of grand total. Read Leeds off it, and count how many cities clear 20 per cent.",
      tasks: [
        { id: "t1", text: "Put the Leeds share into " + cells[0] + ", to one decimal place.", cell: cells[0] },
        { id: "t2", text: "Put the number of cities above a 20 per cent share into " + cells[1] + ".", cell: cells[1] },
        { id: "t3", text: 'In ' + cells[2] + ', type <strong>FINDING</strong> or <strong>LABEL</strong> for which style a chart title should use.', cell: cells[2] },
        { id: "t4", text: "In " + cells[3] + ", type the element you should remove first when decluttering.", cell: cells[3] },
        { id: "t5", text: "In the workbook, build the bar chart, remove gridlines and legend, sort by value, and write a title stating the Leeds figure.", cell: null, ext: true }
      ],
      checks: [
        {
          cell: cells[0], expect: ePct, tol: 0.15,
          task: cells[0] + ": the Leeds share.",
          answer: fmtNum(ePct, 1) + "%",
          why: "This is the number the title will state. Working it out first is the point of the exercise: a finding-style title needs a figure, and getting the figure forces you to check the chart actually supports it.",
          wrongWay: "Drawing the chart first and writing the title afterwards from what it looks like. Eyeballing a share off a bar chart is how a title ends up claiming something the data does not."
        },
        {
          cell: cells[1], expect: eAbove,
          task: cells[1] + ": cities above a 20 per cent share.",
          answer: String(eAbove),
          why: "A second figure to keep the first honest. If several cities clear 20 per cent, a title calling Leeds dominant is overstating it, and the chart will not support the sentence.",
          wrongWay: "Reporting only the number that suits the story. Checking the figure that could undermine your title is the whole discipline, and it comes back in Module 10."
        },
        {
          cell: cells[2], expect: "FINDING",
          task: cells[2] + ": which title style.",
          answer: "FINDING",
          why: "The default title repeats the axis labels and tells the reader nothing they cannot see. A finding survives being pasted into an email with no context, which is where most charts end up.",
          wrongWay: "Leaving the automatic title. It is not neutral, it is wasted space at the top of the chart where the point should be."
        },
        {
          cell: cells[3], expect: ["GRIDLINES", "GRIDLINE"],
          task: cells[3] + ": what to remove first.",
          answer: "GRIDLINES",
          why: "Gridlines are almost always the largest quantity of meaningless ink on a chart. If a reader needs exact values they should be labelled directly, and if they do not, the gridlines were never doing anything.",
          wrongWay: "Starting with the axis. The baseline of a bar chart is doing real work; the gridlines above it are not."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M7S2"); wb.add(M7S2.practice(seed).sheet); return wb; }
};

/* A summary sheet with no source rows, for the judgement sessions. */
function m7SummarySheet(recs, answerLabels) {
  const sh = new Sheet("Work", answerLabels.length + 8, 6);
  label(sh, "A1", "Answers");
  const cells = [];
  answerLabels.forEach((lb, i) => {
    note(sh, "A" + (2 + i), lb);
    cells.push("C" + (2 + i));
  });
  sh.rows = answerLabels.length + 4;
  sh.cols = 6;
  return { sheet: sh, cells };
}

/* ============================================================
   Session 3
   ============================================================ */
const M7S3 = {
  title: "A one-page dashboard",
  aim: "Put four or five figures and two charts on one page so somebody can understand a dataset without asking you anything.",
  why: "This is the deliverable. Nobody wants your workbook; they want one page that answers their questions before they ask them.",
  concepts: ["m7.dashboard", "m7.headline", "m7.layout", "m7.honesty"],
  unlocks: [],
  lesson: [
    { lead: "A dashboard is not a collection of charts. It is an answer to a question somebody keeps asking." },
    { h: "Start with the questions" },
    { p: "Write down the four or five questions the reader actually has. For a spend dataset they are usually: how much in total, is it going up or down, who are the biggest, and is anything unusual. Everything on the page must answer one of those, and anything that answers none of them comes off." },
    { h: "The shape that works" },
    {
      ol: [
        "<strong>A headline row of three or four numbers</strong> across the top: total spend, number of transactions, average size, largest single payment. Big, plain, with the period stated.",
        "<strong>One chart showing change over time</strong>, usually a line by month.",
        "<strong>One chart showing composition</strong>, usually a sorted bar by city or supplier.",
        "<strong>One small table</strong> of the exceptions: the five largest, or everything above a threshold.",
        "<strong>A footer</strong> stating the source, the date range and when it was last refreshed."
      ]
    },
    { pro: "That footer is not bureaucracy. A dashboard with no date on it will be read six months later as though it were current, and you will not be there to explain. Source, period, refresh date. Three lines, every time." },
    { h: "Building it" },
    { p: "Put the pivot tables on a hidden working sheet and the dashboard on its own sheet, with the charts drawing from the pivots. Keep the raw data on a third sheet and never edit it. Three sheets: Data, Working, Dashboard." },
    { why: "Separating them means somebody can look at the dashboard without being able to break the calculations, and you can rebuild the working sheet without touching the layout. It also makes it obvious where a figure came from, which is the first question anybody competent will ask." },
    { h: "Layout that reads" },
    {
      ul: [
        "Most important thing top-left. Eyes start there and readers rarely reach the bottom right.",
        "Align things. Charts of different heights and sizes look careless and cost nothing to fix.",
        "Leave white space. A crowded page is read as noise and skipped.",
        "One accent colour, used only where you want attention."
      ]
    },
    { h: "Honesty on a dashboard" },
    { p: "Every number on the page should be traceable to the data in one step, and every chart should have a title stating what it shows. If a figure excludes something, say so on the page: <em>excludes 14 transactions with no supplier code</em> is one line and it prevents somebody discovering it later and doubting everything else." },
    { trap: "The commonest dishonesty on a dashboard is not a wrong number; it is a missing denominator. A headline saying 38 per cent with no total anywhere on the page cannot be checked, and a reader who cannot check a figure is entitled to distrust it." },
    { web: "Everything here works in Excel for the web. To keep a dashboard tidy, hide the working sheet by right-clicking its tab; that is presentation rather than security, and anybody can unhide it, which is fine." },
    { desk: "Desktop's Camera tool, and pasting a range as a linked picture, lets you place a live snapshot of a table anywhere on the layout without disturbing column widths. It is the one genuinely useful desktop-only trick for dashboard building." }
  ],
  reflect: [
    "Name the four questions your dashboard answers, and check every element answers one of them.",
    "Does your page state its source, its period and its refresh date?"
  ],

  practice: function (seed) {
    const recs = m6Data(seed, 90);
    const built = m7SummarySheet(recs, [
      "Total spend",
      "Number of transactions",
      "Average transaction",
      "Largest single transaction",
      "Distinct suppliers",
      "Elements the footer must state"
    ]);
    const sh = built.sheet, cells = built.cells;
    lockSheet(sh, cells);
    [cells[0], cells[2], cells[3]].forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });

    const total = xround(recs.reduce((a, b) => a + b.Amount, 0), 2);
    const count = recs.length;
    const avg = xround(total / count, 2);
    const max = Math.max.apply(null, recs.map(r => r.Amount));
    const sup = [];
    recs.forEach(r => { if (sup.indexOf(r.Supplier) < 0) sup.push(r.Supplier); });

    return {
      sheet: sh, cells,
      maxRows: sh.rows, maxCols: 6, startRow: parseA1(cells[0]).r, startCol: 2,
      formatBar: false,
      pivot: {
        data: recs, fields: M6_FIELDS,
        initial: { rowField: "City", valueField: "Amount", agg: "sum" },
        hint: "Use this to work out each headline figure. Changing <strong>Summarise by</strong> gives you count, average and max without rebuilding anything."
      },
      highlight: cells,
      brief: {
        title: "The headline row of a dashboard",
        body: "Work out the four or five figures that would sit across the top of a one-page dashboard for this data, " +
          "using the pivot rather than formulas. Then build the page itself in the downloaded workbook: headline numbers, " +
          "a line chart by month, a sorted bar by city, and a footer."
      },
      hint: "Every figure here comes from the same pivot with a different Summarise by setting. For distinct suppliers, put Supplier in Rows and count the lines.",
      tasks: [
        { id: "t1", text: "Total spend into " + cells[0] + ".", cell: cells[0] },
        { id: "t2", text: "Number of transactions into " + cells[1] + ".", cell: cells[1] },
        { id: "t3", text: "Average transaction into " + cells[2] + ".", cell: cells[2] },
        { id: "t4", text: "Largest single transaction into " + cells[3] + ".", cell: cells[3] },
        { id: "t5", text: "Number of distinct suppliers into " + cells[4] + ".", cell: cells[4] },
        { id: "t6", text: "In " + cells[5] + ", type how many things a dashboard footer must state.", cell: cells[5], ext: true }
      ],
      checks: [
        {
          cell: cells[0], expect: total, tol: 1,
          task: cells[0] + ": total spend.",
          answer: gbp(total),
          why: "The headline figure everything else is a share of. Put it on the page even when the interesting numbers are the percentages, because a share whose base is not shown cannot be checked.",
          wrongWay: "Showing only percentages. A reader who cannot verify a figure is entitled to distrust the whole page."
        },
        {
          cell: cells[1], expect: count,
          task: cells[1] + ": number of transactions.",
          answer: String(count),
          why: "Summarise by set to Count. This is what makes the total meaningful: " + gbp(total) + " across " + count + " transactions is a different story from the same total across five.",
          wrongWay: "Leaving it off because it seems obvious. It is the denominator for the average, and the reader cannot derive it from anything else on the page."
        },
        {
          cell: cells[2], expect: avg, tol: 1,
          task: cells[2] + ": average transaction.",
          answer: gbp(avg),
          why: "Total over count. Compare it with the largest single payment below: if the max is many times the mean, say so on the page, because the average alone would mislead.",
          wrongWay: "Reporting the mean without the maximum. On transaction data the distribution is almost always skewed and the mean alone flatters it."
        },
        {
          cell: cells[3], expect: max, tol: 1,
          task: cells[3] + ": largest single transaction.",
          answer: gbp(max),
          why: "One row, found with Summarise by set to Max. It is the most-asked follow-up question on any spend dashboard, so answer it before it is asked.",
          wrongWay: "Reading the largest row total from a grouped pivot, which is a supplier's whole spend rather than one payment."
        },
        {
          cell: cells[4], expect: sup.length,
          task: cells[4] + ": distinct suppliers.",
          answer: String(sup.length),
          why: "Put Supplier in Rows and count the lines the pivot produces, which is what a pivot's row list is: the distinct values. This is the UNIQUE from Module 4 arriving for free.",
          wrongWay: "Counting the supplier column, which counts rows rather than distinct names and gives you " + count + "."
        },
        {
          cell: cells[5], ext: true, expect: 3,
          task: cells[5] + ": how many things the footer states.",
          answer: "3",
          why: "Source, period covered, and when it was last refreshed. Three lines. A dashboard with no date on it will be read six months later as though it were current, and you will not be there to explain.",
          wrongWay: "Treating the footer as decoration. It is the part that stops the page being misused after you have moved on."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M7S3"); wb.add(M7S3.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 4: the Stage 1 capstone
   ============================================================ */
const M7S4 = {
  title: "Stage 1 capstone: a messy 500-row sales file",
  aim: "Clean it, enrich it with lookups, analyse it with a pivot, build a one-page dashboard, and write five sentences of findings.",
  why: "Everything in Stage 1, on one file, in the order the work actually arrives. This is the piece you could show somebody.",
  concepts: ["m7.capstone"],
  unlocks: [],
  lesson: [
    { lead: "One file, five hundred rows, every fault this stage has taught you to find." },
    { p: "Download the workbook. It has two sheets: a transaction log and a supplier master. Both are damaged in the ways real files are damaged, and none of it is labelled." },
    { h: "What you are going to do" },
    {
      ol: [
        "<strong>Assess.</strong> Before changing anything, count the damage. How many rows have hidden spaces, how many amounts are stored as text, how many dates are text, how many supplier codes will not match. Write the numbers down.",
        "<strong>Clean.</strong> Helper columns, never in place. Trim, standardise case, convert amounts and dates to real values. Paste Values when you are satisfied, then remove the working columns.",
        "<strong>Enrich.</strong> Join the supplier master on the code with XLOOKUP, bringing across the supplier name, city and risk rating. Handle the codes that do not match, and be able to say how many there were and why.",
        "<strong>Analyse.</strong> A pivot by city, one by month, and one by risk rating. Check the grand total against a plain SUM every time.",
        "<strong>Present.</strong> A one-page dashboard: headline figures, a line by month, a sorted bar by city, a small table of the five largest payments, and a footer.",
        "<strong>Write.</strong> Five sentences of findings. Not descriptions of the charts: findings, each with a figure in it."
      ]
    },
    { h: "The five sentences" },
    { p: "This is the part that matters and the part people skip. A finding states something the reader did not know, with the number that supports it, and without overclaiming." },
    {
      table: {
        cols: ["Not a finding", "A finding"], startRow: 1,
        rows: [
          ["Spend varies by city.", "Leeds accounts for 38% of spend, more than the next two cities combined."],
          ["There were some large payments.", "The five largest payments are 22% of total spend across 500 transactions."],
          ["Data quality was poor.", "31 of 500 rows had supplier codes that did not match the master, worth £24,100."]
        ]
      }
    },
    { pro: "Include at least one sentence about something that cuts against the obvious reading, or about a limit of the data. Anyone experienced will look for it, and its absence is what makes an analysis look junior." },
    { h: "Marking yourself" },
    { p: "The rubric is below. Mark honestly: an inflated self-assessment costs you the one thing this exercise is for, which is finding out what you cannot yet do. Anything under 16 out of 24 means redo the module the marks came off, not the capstone." },
    { web: "Everything in this capstone can be done entirely in Excel for the web." },
    { desk: "If you would rather do the cleaning in Power Query, do the formula version first and then rebuild it as a query. Comparing the two on the same file is the fastest way to understand what Power Query is doing on your behalf." }
  ],
  reflect: [
    "Which stage of the six took longest? That is the module worth revisiting.",
    "Does one of your five sentences cut against the obvious reading of the data?"
  ],

  practice: function (seed) {
    const r = rng(seed);
    const recs = [];
    const cities = ["Leeds", "London", "Bristol", "Manchester", "Newcastle"];
    for (let i = 0; i < 500; i++) {
      const s = M5_MASTER[rInt(r, 0, M5_MASTER.length - 1)];
      recs.push({
        Ref: "TX-" + (20000 + i),
        Code: s.code,
        City: cities[rInt(r, 0, cities.length - 1)],
        Category: TX_CATEGORIES[rInt(r, 0, TX_CATEGORIES.length - 1)],
        Date: ymdToSerial(2024, 1, 1) + rInt(r, 0, 364),
        Amount: rWeighted(r, [
          [xround(rInt(r, 1200, 60000) / 100, 2), 7],
          [xround(rInt(r, 60000, 300000) / 100, 2), 2],
          [xround(rInt(r, 300000, 1400000) / 100, 2), 1]
        ])
      });
    }
    /* the planted faults, in known quantities so the answer key is exact */
    const nUnmatched = 31, nTextAmount = 24, nSpaces = 40;
    for (let i = 0; i < nUnmatched; i++) recs[i * 13 % 500].Code = "SUP-9" + (10 + i % 80);

    const total = xround(recs.reduce((a, b) => a + b.Amount, 0), 2);
    const matched = recs.filter(x => M5_MASTER.some(m => m.code === x.Code));
    const matchedTotal = xround(matched.reduce((a, b) => a + b.Amount, 0), 2);
    const unmatchedCount = recs.length - matched.length;
    const unmatchedTotal = xround(total - matchedTotal, 2);
    const byCity = {};
    matched.forEach(x => { byCity[x.City] = (byCity[x.City] || 0) + x.Amount; });
    let topCity = null;
    Object.keys(byCity).forEach(c => { if (!topCity || byCity[c] > byCity[topCity]) topCity = c; });
    const topCityPct = xround(100 * byCity[topCity] / matchedTotal, 1);
    const sorted = recs.slice().sort((a, b) => b.Amount - a.Amount);
    const top5 = xround(sorted.slice(0, 5).reduce((a, b) => a + b.Amount, 0), 2);
    const top5Pct = xround(100 * top5 / total, 1);

    const built = m7SummarySheet(recs, [
      "Rows in the file",
      "Codes not in the master",
      "Value of unmatched rows",
      "Total spend, all rows",
      "Largest city by spend",
      "That city's share of matched spend, %",
      "Five largest payments as % of total"
    ]);
    const sh = built.sheet, cells = built.cells;
    lockSheet(sh, cells);
    [cells[2], cells[3]].forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });

    return {
      sheet: sh, cells,
      maxRows: sh.rows, maxCols: 6, startRow: parseA1(cells[0]).r, startCol: 2,
      formatBar: false,
      pivot: {
        data: recs, fields: [
          { name: "Code", type: "text" }, { name: "City", type: "text" },
          { name: "Category", type: "text" }, { name: "Date", type: "date" },
          { name: "Amount", type: "number", money: true }
        ],
        initial: { rowField: "", valueField: "", agg: "sum" },
        hint: "The full 500 rows, already clean, so you can check your own figures against them after you have done the work properly in the workbook."
      },
      rubric: true,
      highlight: cells,
      brief: {
        title: "Five hundred rows, and everything Stage 1 taught you",
        body: "<strong>Download the workbook and do the work there.</strong> It holds the damaged transaction log and the supplier master. " +
          "Clean it, join it, analyse it, build the dashboard and write your five sentences. " +
          "Then come back and enter the seven figures below to check yourself, and mark your work against the rubric. " +
          "The pivot here holds the clean data, so use it to check afterwards rather than to shortcut the exercise."
      },
      hint: "Do the workbook first. Reading the answers off the pivot before doing the work teaches you nothing and takes about four minutes.",
      tasks: [
        { id: "t1", text: "Rows in the file.", cell: cells[0] },
        { id: "t2", text: "How many supplier codes do not appear in the master.", cell: cells[1] },
        { id: "t3", text: "The total value of those unmatched rows.", cell: cells[2] },
        { id: "t4", text: "Total spend across all rows, matched or not.", cell: cells[3] },
        { id: "t5", text: "The largest city by spend, among matched rows.", cell: cells[4] },
        { id: "t6", text: "That city's share of matched spend, to one decimal place.", cell: cells[5] },
        { id: "t7", text: "The five largest payments as a percentage of total spend.", cell: cells[6], ext: true }
      ],
      checks: [
        {
          cell: cells[0], expect: 500,
          task: cells[0] + ": rows in the file.",
          answer: "500",
          why: "Start every piece of work by establishing how much data you have, so that every later figure can be checked against it. If your pivot's grand total covers fewer than 500 rows, the source range is wrong.",
          wrongWay: "Assuming the file is the size you were told. Count it."
        },
        {
          cell: cells[1], expect: unmatchedCount,
          task: cells[1] + ": codes not in the master.",
          answer: String(unmatchedCount),
          why: "These are the rows where your XLOOKUP returned your if_not_found message. Counting them is not optional: they are a data quality finding in their own right and they belong in your five sentences.",
          wrongWay: "Filtering them out and never mentioning them. Silently dropping rows is the difference between an analysis and a misrepresentation."
        },
        {
          cell: cells[2], expect: unmatchedTotal, tol: 2,
          task: cells[2] + ": value of the unmatched rows.",
          answer: gbp(unmatchedTotal),
          why: "The count alone understates it if the unmatched rows are large ones. This is " + fmtNum(xround(100 * unmatchedTotal / total, 1), 1) + " per cent of total spend, and a reader needs that figure to judge how much the gap matters.",
          wrongWay: "Reporting the count without the value. Thirty-one rows sounds trivial until you price them."
        },
        {
          cell: cells[3], expect: total, tol: 2,
          task: cells[3] + ": total spend.",
          answer: gbp(total),
          why: "All 500 rows, including the unmatched ones. Your dashboard should show this and state separately how much could not be attributed to a supplier.",
          wrongWay: "Reporting only matched spend as the total. It understates by " + gbp(unmatchedTotal) + " and nothing on the page would reveal it."
        },
        {
          cell: cells[4], expect: topCity,
          task: cells[4] + ": largest city by spend.",
          answer: topCity,
          why: "From a pivot with City in Rows and Amount in Values, over the matched rows. This is the headline of your bar chart and the subject of at least one of your five sentences.",
          wrongWay: "Answering with the city having the most transactions. Largest by value and busiest by volume are different questions and frequently different cities."
        },
        {
          cell: cells[5], expect: topCityPct, tol: 0.3,
          task: cells[5] + ": that city's share of matched spend.",
          answer: fmtNum(topCityPct, 1) + "%",
          why: "The figure your chart title should state. Note the base: share of <em>matched</em> spend, not of all spend, because the unmatched rows have no city attributed. Stating which base you used is the difference between a defensible figure and an arguable one.",
          wrongWay: "Dividing by the all-rows total, which quietly understates every city's share and makes the percentages fail to add to 100."
        },
        {
          cell: cells[6], ext: true, expect: top5Pct, tol: 0.3,
          task: cells[6] + ": the five largest payments as a share of total.",
          answer: fmtNum(top5Pct, 1) + "%",
          why: "Five rows out of five hundred, carrying " + fmtNum(top5Pct, 1) + " per cent of the value. Concentration like this is the single most useful thing to notice about a spend file, and it is what makes the mean a poor summary of it.",
          wrongWay: "Reporting the average transaction as though it described a typical payment. With this much concentration it describes almost none of them."
        }
      ]
    };
  },
  workbook: function (seed) {
    const p = M7S4.practice(seed);
    const wb = new Workbook("M7S4");
    const r = rng(seed + ":wb");
    const recs = p.pivot.data;

    /* the damaged transaction log */
    const tx = new Sheet("Transactions", recs.length + 4, 6);
    ["Ref", "Supplier code", "City", "Category", "Date", "Amount"].forEach((h, i) => tx.set(0, i, h, { hdr: true }));
    recs.forEach((t, i) => {
      const row = 1 + i;
      tx.set(row, 0, t.Ref);
      tx.set(row, 1, rWeighted(r, [[t.Code, 8], [t.Code + " ", 2], [" " + t.Code, 1], [t.Code.toLowerCase(), 1]]));
      tx.set(row, 2, rWeighted(r, [[t.City, 8], [t.City.toUpperCase(), 1], [t.City + " ", 1]]));
      tx.set(row, 3, t.Category);
      if (r() < 0.12) tx.set(row, 4, formatDate(t.Date, "dd/mm/yyyy"));
      else tx.set(row, 4, t.Date, { fmt: DATEFMT });
      if (r() < 0.05) tx.set(row, 5, "£" + t.Amount.toFixed(2));
      else if (r() < 0.05) tx.set(row, 5, t.Amount.toFixed(2) + " ");
      else tx.set(row, 5, t.Amount, { fmt: GBP2 });
    });
    tx.rows = recs.length + 1; tx.cols = 6;
    wb.add(tx);

    /* the supplier master, itself slightly dirty */
    const ms = new Sheet("Suppliers", M5_MASTER.length + 4, 4);
    ["Code", "Supplier", "City", "Risk"].forEach((h, i) => ms.set(0, i, h, { hdr: true }));
    M5_MASTER.forEach((m, i) => {
      ms.set(1 + i, 0, i === 2 ? m.code + " " : m.code);
      ms.set(1 + i, 1, m.name);
      ms.set(1 + i, 2, ["Leeds", "London", "Bristol", "Manchester", "Newcastle"][i % 5]);
      ms.set(1 + i, 3, m.risk);
    });
    ms.rows = M5_MASTER.length + 1; ms.cols = 4;
    wb.add(ms);
    return wb;
  }
};

/* the marking rubric, rendered under the tasks when a session asks for it */
const STAGE1_RUBRIC = [
  ["Assessment", "Damage counted and written down before any change was made.", 3],
  ["Cleaning", "Helper columns used, original preserved, values pasted before deleting anything.", 4],
  ["Conversion", "Amounts and dates are real values; COUNT matches COUNTA on every numeric column.", 3],
  ["Enrichment", "Lookup written with an if_not_found; unmatched rows counted and priced, not dropped.", 4],
  ["Analysis", "At least three pivots; grand total checked against a plain SUM each time.", 3],
  ["Dashboard", "Headline figures, one time chart, one composition chart, exception table, footer with source, period and refresh date.", 4],
  ["Findings", "Five sentences, each carrying a figure, at least one cutting against the obvious reading.", 3]
];

/* ============================================================
   Register
   ============================================================ */
defModule({
  id: "m7", n: 7, stage: "s1",
  title: "Charts and communication",
  subtitle: "Choosing a chart, decluttering, dashboards, and the Stage 1 capstone",
  blurb: "Turning an answer into something somebody else can read. Bar for comparison, line for time, scatter for relationship, pie almost never. Then a one-page dashboard, and a 500-row capstone bringing the whole of Stage 1 together.",
  onComplete: "Stage 1 is done. You can take a broken file to a defensible one-page answer, which is what the job is. The interview drill is now unlocked: twenty minutes, mixed, timed, because that is the shape of test employers set.",
  concepts: [
    { id: "m7.chartchoice", label: "Bar, line, scatter", blurb: "Comparison, change over time, relationship." },
    { id: "m7.pie", label: "Pie, almost never", blurb: "People compare lengths well and angles badly." },
    { id: "m7.axiszero", label: "Bar axes start at zero", blurb: "A bar means length; truncating it lies." },
    { id: "m7.onequestion", label: "One chart, one question", blurb: "Write the sentence before you draw." },
    { id: "m7.declutter", label: "Removing what says nothing", blurb: "Gridlines, then legend, then borders." },
    { id: "m7.title", label: "Title the finding, not the field", blurb: "It survives being pasted into an email." },
    { id: "m7.condformat", label: "Conditional formatting, sparingly", blurb: "One rule per table, checked against what is there." },
    { id: "m7.labels", label: "Direct labels beat legends", blurb: "And never let colour alone carry meaning." },
    { id: "m7.dashboard", label: "A dashboard answers questions", blurb: "Write the four questions first." },
    { id: "m7.headline", label: "The headline row", blurb: "Total, count, average, largest, with the period stated." },
    { id: "m7.layout", label: "Layout that reads", blurb: "Most important top-left, aligned, with white space." },
    { id: "m7.honesty", label: "Show the denominator", blurb: "A figure a reader cannot check will be distrusted." },
    { id: "m7.capstone", label: "The Stage 1 workflow", blurb: "Assess, clean, enrich, analyse, present, write." }
  ],
  sessions: [M7S1, M7S2, M7S3, M7S4]
});
