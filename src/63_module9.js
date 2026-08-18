/* ============================================================
   Module 9: Statistics for analysts
   Simple honest baselines rather than black boxes, and an
   insistence on saying what a number does not mean.
   ============================================================ */

/* ============================================================
   Session 1
   ============================================================ */
const M9S1 = {
  title: "Mean against median, and when an average lies",
  aim: "Know which average to quote, and be able to show why the other one would mislead.",
  why: "Transaction data is never symmetrical. A handful of large payments drag the mean upwards until it describes almost nobody, and quoting it without the median is the commonest quiet dishonesty in analysis.",
  concepts: ["m9.meanmedian", "m9.skew", "m9.outlierpull", "m9.whichaverage"],
  unlocks: ["MEDIAN", "MODE.SNGL"],
  lesson: [
    { lead: "The mean is what you get when you share everything out equally. Very little is shared out equally." },
    { h: "The two figures" },
    {
      ul: [
        "<strong>Mean</strong>: total divided by count. Every value pulls on it in proportion to its size.",
        "<strong>Median</strong>: line them all up in order and take the middle one. One enormous value moves it by one position and almost not at all."
      ]
    },
    { f: "=AVERAGE(D2:D500)\n=MEDIAN(D2:D500)" },
    { h: "Skew" },
    { p: "When the mean sits well above the median, a minority of large values is pulling it up. That is called right skew, and it is the normal shape of almost anything involving money: payments, incomes, company sizes, city populations." },
    { p: "The gap is the diagnosis. Mean £1,240 against median £310 is not a rounding difference; it says most payments are small and a few are very large, and any sentence beginning <em>the average payment was</em> is about to mislead somebody." },
    { pro: "Quote both, always, in the same sentence: <em>the median payment was £310, with a mean of £1,240 reflecting a small number of much larger transfers</em>. It takes eight extra words and it is unarguable." },
    { h: "Which one to use" },
    {
      table: {
        cols: ["Question", "Use"], startRow: 1,
        rows: [
          ["What does a typical payment look like?", "median"],
          ["What is the total, and how does it split?", "mean, because mean times count is the total"],
          ["Has behaviour changed since last month?", "both, because they can move in opposite directions"],
          ["How much should we budget per transaction?", "mean, since budgets need the total"]
        ]
      }
    },
    { why: "The mean is not a worse figure than the median. It answers a different question. The mean is the only one that reconstructs the total, which is why finance uses it and why it is right for budgets. The median is the only one that describes a typical case, which is why it is right for a sentence containing the word typical." },
    { h: "The mode, briefly" },
    { p: "The most frequent value. Almost useless on continuous amounts, where no two values repeat, and genuinely useful on categories and on round-number data, where a spike of identical figures is itself the finding." },
    { trap: "An average of a group with very few members is not a summary, it is one number wearing a hat. Always show the count beside any average, and treat means over fewer than about ten values as an illustration rather than a statistic." },
    { desk: "No difference on desktop. Excel's AVERAGE and MEDIAN behave identically everywhere; what varies is whether anybody looked at both." }
  ],
  reflect: [
    "Say what a mean well above the median tells you about the shape of the data.",
    "Which of the two would you quote to somebody asking what a typical payment looks like?"
  ],

  practice: function (seed) {
    const rows = fcRows(seed, { round: true, background: 80 });
    const sh = fcSheet("Distribution", rows);
    const n = rows.length, last = n + 1;
    const ansStart = n + 4;
    const cells = fcAnswers(sh, ansStart, [
      "Mean payment", "Median payment", "Gap between them", "Payments above the mean", "Share above the mean, %"
    ]);
    lockSheet(sh, cells);
    [cells[0], cells[1], cells[2]].forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });
    sh.rows = ansStart + cells.length + 2; sh.cols = 6;

    const amtR = "D2:D" + last;
    const eMean = solve(sh, "=AVERAGE(" + amtR + ")");
    const eMedian = solve(sh, "=MEDIAN(" + amtR + ")");
    const eGap = xround(eMean - eMedian, 2);
    const eAbove = rows.filter(t => t.amount > eMean).length;
    const ePct = xround(100 * eAbove / n, 1);

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 6, startRow: parseA1(cells[0]).r, startCol: 2,
      highlight: cells,
      brief: {
        title: "One column of payments, two different averages",
        body: "Work out both averages and the gap between them, then count how many payments actually sit above the mean. " +
          "That last figure is the one that settles the argument: on symmetrical data it would be about half."
      },
      hint: "AVERAGE and MEDIAN both take the same range. For the count above the mean, remember the criterion has to be built with an ampersand.",
      tasks: [
        { id: "t1", text: "The mean payment.", cell: cells[0] },
        { id: "t2", text: "The median payment.", cell: cells[1] },
        { id: "t3", text: "The gap between them, as a formula rather than a typed figure.", cell: cells[2] },
        { id: "t4", text: "How many payments are above the mean.", cell: cells[3] },
        { id: "t5", text: "That count as a percentage of all payments, to one decimal place.", cell: cells[4], ext: true }
      ],
      checks: [
        {
          cell: cells[0], expect: eMean, tol: 0.02, needFormula: true, mustUse: "AVERAGE",
          task: cells[0] + ": the mean.",
          answer: "=AVERAGE(" + amtR + ")",
          why: gbp(eMean) + ". Every value pulls on this in proportion to its size, so the large payments are doing most of the work.",
          wrongWay: "Quoting this alone in a sentence containing the word typical. It is the right figure for a total and the wrong one for a description."
        },
        {
          cell: cells[1], expect: eMedian, tol: 0.02, needFormula: true, mustUse: "MEDIAN",
          task: cells[1] + ": the median.",
          answer: "=MEDIAN(" + amtR + ")",
          why: gbp(eMedian) + ". Half the payments are below this and half above, and one enormous transfer would move it by a single position.",
          wrongWay: "Assuming the median is roughly the mean. Here they are " + gbp(Math.abs(eGap)) + " apart."
        },
        {
          cell: cells[2], expect: eGap, tol: 0.03, needFormula: true,
          task: cells[2] + ": the gap.",
          answer: "=" + cells[0] + "-" + cells[1],
          why: "The diagnosis in one cell. A mean " + gbp(Math.abs(eGap)) + " above the median says a minority of large payments is pulling it up, which is the normal shape of anything involving money.",
          wrongWay: "Typing the difference in as a number. It stops being right the moment either figure changes."
        },
        {
          cell: cells[3], expect: eAbove, needFormula: true, mustUse: "COUNTIF",
          task: cells[3] + ": payments above the mean.",
          answer: '=COUNTIF(' + amtR + ',">"&' + cells[0] + ')',
          why: "Only " + eAbove + " of " + n + ". On symmetrical data this would be about half; here the mean sits above most of the data, which is exactly what makes it a poor description of a typical payment.",
          wrongWay: "Expecting half. That intuition comes from the bell curve and almost no financial data is shaped like one."
        },
        {
          cell: cells[4], ext: true, expect: ePct, tol: 0.15, needFormula: true,
          task: cells[4] + ": that count as a percentage.",
          answer: "=" + cells[3] + "/" + n + "*100",
          why: fmtNum(ePct, 1) + " per cent of payments are above the average payment. That sentence is the clearest way to explain skew to somebody who does not want a statistics lesson.",
          wrongWay: "Reporting the mean and the median without this figure. The percentage is what makes the gap concrete."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M9S1"); wb.add(M9S1.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 2
   ============================================================ */
const M9S2 = {
  title: "Spread, z scores and percentiles",
  aim: "Put a number on how unusual something is, and know when that number is not trustworthy.",
  why: "Ranking anomalies is the whole of Module 8 done properly. A z score turns how odd is this into a figure you can sort by, provided you are honest about what it assumes.",
  concepts: ["m9.stdev", "m9.zscore", "m9.percentile", "m9.notnormal"],
  unlocks: ["STDEV.S", "STDEV.P", "PERCENTILE.INC", "QUARTILE.INC", "STANDARDIZE", "LARGE", "SMALL", "RANK.EQ"],
  lesson: [
    { lead: "Standard deviation is roughly how far a typical value sits from the mean." },
    { f: "=STDEV.S(D2:D500)" },
    { p: "Use <span class='f'>STDEV.S</span> when your rows are a sample of something larger, which they nearly always are. <span class='f'>STDEV.P</span> is for when you genuinely hold the entire population. On any reasonable number of rows the two differ trivially, and picking the wrong one is a much smaller sin than not looking at spread at all." },
    { h: "The z score" },
    { p: "How many standard deviations a value sits from the mean." },
    { f: "=STANDARDIZE(D2, $H$1, $H$2)\n=(D2-$H$1)/$H$2          the same thing written out" },
    { p: "A z of 0 is exactly average. A z of 2 is two standard deviations above. Negative means below. The point is that it is comparable: a z of 3 on payment amounts and a z of 3 on transaction counts mean the same degree of unusual, so you can rank across signals of different units." },
    { h: "What z scores assume, and why it matters here" },
    { p: "The familiar rules, that about 95 per cent of values lie within two standard deviations and 99.7 within three, hold for a bell curve. Payment data is not a bell curve. It is right-skewed with a long tail, so a z of 3 is far more common than the textbook says." },
    { trap: "Do not convert a z score into a probability on financial data and say something is a one-in-a-thousand event. It is not true, it is checkable, and somebody will check it. Use z scores to <em>rank</em>, which needs no distributional assumption, and stop there." },
    { why: "This is the difference between a defensible baseline and a black box. Ranking by z score says these are the most unusual rows relative to the spread of this data, which is exactly true. Claiming a probability says something about a distribution you have not verified and almost certainly do not have." },
    { h: "Percentiles, which assume nothing" },
    { f: "=PERCENTILE.INC(D2:D500, 0.95)" },
    { p: "The value below which 95 per cent of the data falls. No assumptions about shape at all: it is a fact about the numbers in front of you. For skewed data this is usually the better tool, and it is much easier to explain: <em>the top five per cent of payments start at £4,180</em>." },
    { p: "<span class='f'>QUARTILE.INC</span> is the same idea at 0, 25, 50, 75 and 100 per cent. The 50th percentile is the median, which is a useful thing to notice." },
    { pro: "For an exception queue, percentiles beat z scores. Take the top one per cent and you know exactly how many alerts you will generate, because you chose it. Take z above 3 and you find out afterwards, and on skewed data the answer is often hundreds." },
    { h: "Careful with the mean inside the z score" },
    { p: "The mean and standard deviation you divide by are themselves pulled about by the outliers you are hunting. One enormous payment inflates the standard deviation enough to hide the merely large ones behind it. On badly skewed data, rank on percentiles, or compute the baseline with the extreme values excluded and say that you did." },
    { desk: "The Analysis ToolPak on desktop produces descriptive statistics for a column in one dialogue, which is a convenience rather than a capability. Everything here is one formula." }
  ],
  reflect: [
    "Say why you would rank by z score but not quote a probability from one.",
    "Which would you use to size an exception queue, and why?"
  ],

  practice: function (seed) {
    const rows = fcRows(seed, { dormant: true, background: 80 });
    const sh = fcSheet("Spread", rows, ["z score"]);
    const n = rows.length, last = n + 1;

    label(sh, "H1", "Mean"); label(sh, "H2", "Std dev");
    const ansStart = n + 4;
    const cells = fcAnswers(sh, ansStart, [
      "95th percentile", "Largest z score", "Payments with z above 3", "Payments in the top 1%"
    ]);
    const zCells = [];
    for (let i = 0; i < n; i++) zCells.push("F" + (2 + i));
    lockSheet(sh, zCells.concat(cells, ["I1", "I2"]));
    [cells[0]].forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });
    sh.rows = ansStart + cells.length + 2; sh.cols = 9;

    const amtR = "$D$2:$D$" + last;
    const amounts = rows.map(t => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(amounts.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (n - 1));
    const z = a => (a - mean) / sd;
    const eZ0 = xround(z(amounts[0]), 4);
    const sorted = amounts.slice().sort((a, b) => a - b);
    const pct = p => {
      const idx = p * (sorted.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx);
      return lo === hi ? sorted[lo] : sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
    };
    const eP95 = xround(pct(0.95), 2);
    const eMaxZ = xround(Math.max.apply(null, amounts.map(z)), 4);
    const eOver3 = amounts.filter(a => z(a) > 3).length;
    const eTop1 = amounts.filter(a => a >= pct(0.99)).length;

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 9, colWidth: 92, startRow: 0, startCol: 8,
      fillBar: true, highlight: zCells.concat(cells, ["I1", "I2"]),
      brief: {
        title: "Ranking the unusual, without pretending to know the distribution",
        body: "Put the mean and standard deviation in <strong>I1</strong> and <strong>I2</strong>, then give every payment a z score. " +
          "Then answer the same question with percentiles and compare how many rows each approach would put in front of an analyst."
      },
      hint: "Lock the two baseline cells in your z score formula so they do not drift as it fills.",
      tasks: [
        { id: "t1", text: "In I1, the mean of the amounts.", cell: "I1" },
        { id: "t2", text: "In I2, the sample standard deviation.", cell: "I2" },
        { id: "t3", text: "In F2, the z score for that payment. Fill down.", cell: "F2" },
        { id: "t4", text: "In " + cells[0] + ", the 95th percentile of the amounts.", cell: cells[0] },
        { id: "t5", text: "In " + cells[1] + ", the largest z score in the file.", cell: cells[1] },
        { id: "t6", text: "In " + cells[2] + ", how many payments have a z above 3.", cell: cells[2] },
        { id: "t7", text: "In " + cells[3] + ", how many payments are in the top one per cent. Compare with the previous figure.", cell: cells[3], ext: true }
      ],
      checks: [
        {
          cell: "I1", expect: xround(mean, 2), tol: 0.02, needFormula: true, mustUse: "AVERAGE",
          task: "I1: the mean.",
          answer: "=AVERAGE(" + amtR + ")",
          why: "The baseline the z scores are measured against. Worth remembering it is itself pulled upwards by the outliers you are looking for.",
          wrongWay: "Using the median here. The z score is defined against the mean, and swapping one in without saying so makes the figure incomparable with anybody else's."
        },
        {
          cell: "I2", expect: xround(sd, 2), tol: 0.05, needFormula: true, mustUse: "STDEV",
          task: "I2: the standard deviation.",
          answer: "=STDEV.S(" + amtR + ")",
          why: "STDEV.S treats these rows as a sample of something larger, which they are. STDEV.P would differ here by well under a per cent and is only right if this is genuinely the entire population.",
          wrongWay: "Worrying at length about which. Not looking at spread at all is the much larger error."
        },
        {
          cell: "F2", expect: eZ0, tol: 0.01, needFormula: true,
          task: "F2: the z score for the first payment.",
          answer: "=STANDARDIZE(D2,$I$1,$I$2)   or   =(D2-$I$1)/$I$2",
          why: "How many standard deviations from the mean. Both forms are correct and the second is what most analysts write, because it is obvious what it does.",
          wrongWay: "Leaving I1 and I2 unlocked, so the baseline drifts down the sheet and every z score below the first is measured against different cells."
        },
        {
          cell: cells[0], expect: eP95, tol: 0.05, needFormula: true, mustUse: "PERCENTILE",
          task: cells[0] + ": the 95th percentile.",
          answer: "=PERCENTILE.INC(" + amtR + ",0.95)",
          why: "The top five per cent of payments start at " + gbp(eP95) + ". This assumes nothing about the shape of the data, which is why it is the safer tool on anything skewed.",
          wrongWay: "Reading it as the mean plus two standard deviations. That equivalence holds for a bell curve and this data is not one."
        },
        {
          cell: cells[1], expect: eMaxZ, tol: 0.02, needFormula: true, mustUse: "MAX",
          task: cells[1] + ": the largest z score.",
          answer: "=MAX(F2:F" + last + ")",
          why: "The most unusual row relative to the spread of this data. That statement is exactly true and needs no assumption about distribution, which is why ranking is a defensible use of z scores.",
          wrongWay: "Converting it to a probability. On right-skewed financial data a z of 3 is far commoner than the textbook figure, and the claim is checkable."
        },
        {
          cell: cells[2], expect: eOver3, needFormula: true, mustUse: "COUNTIF",
          task: cells[2] + ": payments with z above 3.",
          answer: '=COUNTIF(F2:F' + last + ',">3")',
          why: "You did not choose this number; the data did. That is the drawback of a z threshold for an exception queue: you find out how many alerts you have generated only after you have generated them.",
          wrongWay: "Setting a z threshold without checking the resulting volume. A rule producing hundreds of alerts a day will not be worked."
        },
        {
          cell: cells[3], ext: true, expect: eTop1, needFormula: true,
          task: cells[3] + ": payments in the top one per cent.",
          answer: '=COUNTIF(' + amtR + ',">="&PERCENTILE.INC(' + amtR + ',0.99))',
          why: "About " + eTop1 + " of " + n + ", because you chose one per cent. For sizing an exception queue this is the better tool: the volume is a decision rather than a discovery.",
          wrongWay: "Assuming the two approaches select the same rows. They usually overlap heavily and are not identical, and which you used belongs in the write-up."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M9S2"); wb.add(M9S2.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 3
   ============================================================ */
const M9S3 = {
  title: "Correlation, and the four ways it is abused",
  aim: "Measure whether two columns move together, and say precisely what that does and does not license you to claim.",
  why: "Correlation is the most misused number in analysis. Being able to compute it is trivial; being able to say what it means is what makes you worth listening to.",
  concepts: ["m9.correlation", "m9.causation", "m9.linearonly", "m9.spurious"],
  unlocks: ["CORREL"],
  lesson: [
    { lead: "Correlation measures whether two columns rise and fall together, and nothing else whatsoever." },
    { f: "=CORREL(D2:D500, E2:E500)" },
    { p: "The result runs from -1 to 1. Near 1 means they rise together, near -1 means one rises as the other falls, and near 0 means no straight-line relationship. That is the entire content of the number." },
    { h: "Abuse one: reading cause into it" },
    { p: "Two columns moving together is consistent with the first causing the second, the second causing the first, a third thing causing both, or coincidence. The figure cannot distinguish between them, and no amount of decimal places will help." },
    { pro: "Write correlations as <em>A and B move together</em>, never as <em>A drives B</em>. If somebody needs the causal claim, that is a different piece of work involving a controlled comparison, and saying so is the professional answer rather than a dodge." },
    { h: "Abuse two: assuming a straight line" },
    { p: "CORREL measures straight-line association only. Two columns can be perfectly and obviously related in a curve and return a correlation near zero. The defence costs ten seconds: draw the scatter plot and look at it before you quote the number." },
    { trap: "This is why Module 7 taught the scatter chart. A correlation quoted without anybody having looked at the scatter is a number produced by a machine that nobody has checked." },
    { h: "Abuse three: outliers" },
    { p: "One extreme point can create a strong correlation out of a shapeless cloud, or destroy a real one. On small samples this happens constantly. Recompute with the extreme values removed, and if the answer changes materially, report both figures and say which rows moved it." },
    { h: "Abuse four: fishing" },
    { p: "Compare twenty pairs of unrelated columns and, by chance alone, roughly one will look impressively correlated. Trawling a wide dataset for the strongest pair and reporting it is how spurious findings enter the world." },
    { why: "The honest protection is to say what you tested before you tested it. If you compared twenty pairs, say so, because a reader judging one correlation in isolation is judging it wrongly. This is not pedantry; it is the difference between an analysis and a coincidence dressed up." },
    { h: "How large is large" },
    {
      table: {
        cols: ["Roughly", "Reasonable words"], startRow: 1,
        rows: [
          ["0.0 to 0.2", "no useful relationship"],
          ["0.2 to 0.4", "weak, worth noting, not worth acting on"],
          ["0.4 to 0.7", "moderate"],
          ["0.7 to 1.0", "strong; check for an outlier and check it is not the same thing measured twice"]
        ]
      }
    },
    { trap: "A very strong correlation between two columns of your own data usually means they are the same quantity twice. Total spend correlates with number of transactions because both are driven by size; that is not a finding, it is arithmetic." },
    { desk: "The Analysis ToolPak's correlation matrix compares every column against every other in one step. It is convenient and it is a fishing expedition by design, so decide what you are testing before you run it." }
  ],
  reflect: [
    "Say the four things a strong correlation is consistent with.",
    "Before quoting a correlation, what should you have looked at?"
  ],

  practice: function (seed) {
    const r = rng(seed + ":corr");
    const n = 40;
    const sh = new Sheet("Correlation", n + 14, 6);
    ["Account", "Payments", "Total value", "Days active", "Staff"].forEach((h, i) => sh.set(0, i, h, { hdr: true, locked: true }));
    const pay = [], val = [], days = [], staff = [];
    for (let i = 0; i < n; i++) {
      const p = rInt(r, 4, 90);
      pay.push(p);
      val.push(xround(p * rInt(r, 180, 620) + rInt(r, -900, 900), 2));   // strongly related to payments
      days.push(rInt(r, 5, 60));                                          // unrelated
      staff.push(rInt(r, 1, 40));                                         // unrelated
      sh.set(1 + i, 0, "AC-" + (5100 + i), { locked: true });
      sh.set(1 + i, 1, pay[i], { locked: true });
      sh.set(1 + i, 2, val[i], { fmt: GBP2, locked: true });
      sh.set(1 + i, 3, days[i], { locked: true });
      sh.set(1 + i, 4, staff[i], { locked: true });
    }
    const last = n + 1;
    const ansStart = n + 4;
    const cells = fcAnswers(sh, ansStart, [
      "Payments against total value", "Payments against days active", "Staff against total value", "Pairs you would report"
    ]);
    lockSheet(sh, cells);
    sh.rows = ansStart + cells.length + 2; sh.cols = 6;

    const corr = (a, b) => {
      const ma = a.reduce((x, y) => x + y, 0) / a.length, mb = b.reduce((x, y) => x + y, 0) / b.length;
      let num = 0, da = 0, db = 0;
      for (let i = 0; i < a.length; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
      return num / Math.sqrt(da * db);
    };
    const c1 = xround(corr(pay, val), 4), c2 = xround(corr(pay, days), 4), c3 = xround(corr(staff, val), 4);

    return {
      sheet: sh,
      maxRows: sh.rows, maxCols: 6, startRow: parseA1(cells[0]).r, startCol: 2,
      highlight: cells,
      brief: {
        title: "Four columns, six possible pairs, one honest answer",
        body: "Compute three correlations. One will be very strong, and the interesting question is whether it is a finding or arithmetic. " +
          "Before you write anything down, build a scatter chart of the strong pair in the downloaded workbook and look at it."
      },
      hint: "CORREL takes two ranges of the same length. The last answer is a number, not a formula: how many of these three you would actually put in a report.",
      tasks: [
        { id: "t1", text: "Correlation between payments and total value.", cell: cells[0] },
        { id: "t2", text: "Correlation between payments and days active.", cell: cells[1] },
        { id: "t3", text: "Correlation between staff and total value.", cell: cells[2] },
        { id: "t4", text: "In " + cells[3] + ", how many of these three you would report as a finding.", cell: cells[3], ext: true }
      ],
      checks: [
        {
          cell: cells[0], expect: c1, tol: 0.02, needFormula: true, mustUse: "CORREL",
          task: cells[0] + ": payments against total value.",
          answer: "=CORREL(B2:B" + last + ",C2:C" + last + ")",
          why: fmtNum(c1, 2) + ", which is very strong and is not a finding. Total value is roughly the number of payments multiplied by a typical payment size, so the two columns are largely the same quantity measured twice. Arithmetic, not insight.",
          wrongWay: "Reporting it as a discovery. A very strong correlation between two of your own columns almost always means they are the same thing twice, and saying so is what shows you understand the number."
        },
        {
          cell: cells[1], expect: c2, tol: 0.02, needFormula: true, mustUse: "CORREL",
          task: cells[1] + ": payments against days active.",
          answer: "=CORREL(B2:B" + last + ",D2:D" + last + ")",
          why: fmtNum(c2, 2) + ", near zero, meaning no useful straight-line relationship. Note that near zero does not mean unrelated: a strong curved relationship would also produce a figure near zero, which is why the scatter plot comes first.",
          wrongWay: "Concluding the two are independent. CORREL rules out a straight line and nothing else."
        },
        {
          cell: cells[2], expect: c3, tol: 0.02, needFormula: true, mustUse: "CORREL",
          task: cells[2] + ": staff against total value.",
          answer: "=CORREL(E2:E" + last + ",C2:C" + last + ")",
          why: fmtNum(c3, 2) + ". With forty rows a figure of this size can arise by chance, and it is exactly the sort of result that gets reported when somebody has quietly tested six pairs and picked the best one.",
          wrongWay: "Reporting whichever pair scored highest without saying how many you compared. Test twenty pairs of unrelated columns and roughly one will look impressive."
        },
        {
          cell: cells[3], ext: true, expect: 0,
          task: cells[3] + ": how many you would report as a finding.",
          answer: "0",
          why: "None of them. The first is two measures of the same thing, the second is nothing, and the third is small enough to be chance on forty rows. Being able to say that a dataset shows nothing is a real result and it is the hardest one to write.",
          wrongWay: "Finding something because you were asked to. The pressure to produce a finding is exactly what generates spurious ones, and a reader who later checks will remember."
        }
      ]
    };
  },
  workbook: function (seed) { const wb = new Workbook("M9S3"); wb.add(M9S3.practice(seed).sheet); return wb; }
};

/* ============================================================
   Session 4: Stage 2 capstone
   ============================================================ */
const M9S4 = {
  title: "Stage 2 capstone: a thousand transactions, six planted patterns",
  aim: "Find all six, rank them by severity with evidence, and write a short summary of each.",
  why: "Everything in Stage 2 on one file, in the form the work actually takes: not what does this formula do, but what is going on here and how sure are you.",
  concepts: ["m9.capstone"],
  unlocks: [],
  lesson: [
    { lead: "One thousand synthetic transactions across twenty accounts. Six accounts are doing something worth writing up." },
    { p: "Nothing in this file is real. The shapes are what matter, and they are the shapes the tests in Module 8 were built for." },
    { h: "The six patterns, unlabelled and in no particular order" },
    {
      ul: [
        "An account making repeated payments just under a reporting threshold.",
        "An account moving an unusual number of payments in a very short window.",
        "An account whose payments are suspiciously round.",
        "An account silent for a long period and then suddenly very active.",
        "A counterparty appearing under several spellings, so its true total is understated.",
        "An account whose largest payments sit far outside the spread of everything else."
      ]
    },
    { h: "What to produce" },
    {
      ol: [
        "<strong>A tested sheet.</strong> One column per signal, each computed rather than eyeballed, with the parameters in cells.",
        "<strong>A ranked table.</strong> One row per account, one column per signal, sorted by how many signals it trips and how strongly.",
        "<strong>Six short summaries.</strong> A hundred words each, in the four-part structure: what was seen, why it stands out, what it might be including the innocent explanation, and what you checked and could not resolve.",
        "<strong>One paragraph on the limits of the whole exercise.</strong> What this data cannot tell you at all."
      ]
    },
    { h: "How to rank" },
    { p: "Count the signals per account first, because two independent signals on one account is stronger evidence than one signal being extreme. Then, within accounts tripping the same number, order by the strength of the strongest signal. Show the components, so a reader can disagree with the ordering rather than having to accept it." },
    { pro: "The last item on the list is the one that marks the work as serious. This data has no counterparty ownership, no account purpose, no customer type and no narrative field, so nothing here can distinguish structuring from a business that pays in instalments. Say that plainly. An analyst who states the limits is trusted on the parts they did claim." },
    { h: "Marking yourself" },
    { p: "The rubric is below, out of 24. Under 16 means the module the marks came off is worth redoing before you attempt Stage 3." },
    { desk: "If you want to see what this looks like at scale, the same six tests in Power Query over a hundred thousand rows will run in seconds where the formulas take minutes. The logic does not change; only the tool does." }
  ],
  reflect: [
    "Which of the six did you find last, and what would have found it sooner?",
    "Write the limits paragraph. It is the hardest hundred words in the capstone."
  ],

  practice: function (seed) {
    const rows = fcRows(seed, {
      accounts: 20, background: 940,
      structuring: true, structuringCount: 7, threshold: 10000,
      velocity: true, velocityCount: 14,
      round: true, dormant: true
    });
    const sh = new Sheet("Answers", 16, 6);
    const cells = fcAnswers(sh, 1, [
      "Rows in the file", "Distinct accounts", "Median payment", "Mean payment",
      "Payments in the band below 10,000", "Highest 7-day count", "Longest gap, in days"
    ]);
    lockSheet(sh, cells);
    [cells[2], cells[3]].forEach(ref => { const p = parseA1(ref); sh.ensure(p.r, p.c).fmt = GBP2; });
    sh.rows = cells.length + 4; sh.cols = 6;

    const n = rows.length;
    const accts = []; rows.forEach(t => { if (accts.indexOf(t.account) < 0) accts.push(t.account); });
    const amounts = rows.map(t => t.amount);
    const sorted = amounts.slice().sort((a, b) => a - b);
    const median = xround(sorted.length % 2 ? sorted[(sorted.length - 1) / 2]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2, 2);
    const mean = xround(amounts.reduce((a, b) => a + b, 0) / n, 2);
    const band = rows.filter(t => t.amount >= 9000 && t.amount < 10000).length;
    const winCount = t => rows.filter(x => x.account === t.account && x.date > t.date - 7 && x.date <= t.date).length;
    const maxWin = Math.max.apply(null, rows.map(winCount));
    const gapOf = t => {
      const prior = rows.filter(x => x.account === t.account && x.date < t.date);
      return prior.length ? t.date - Math.max.apply(null, prior.map(x => x.date)) : 0;
    };
    const maxGap = Math.max.apply(null, rows.map(gapOf));

    return {
      sheet: sh, rubric: STAGE2_RUBRIC,
      maxRows: sh.rows, maxCols: 6, startRow: parseA1(cells[0]).r, startCol: 2,
      highlight: cells,
      brief: {
        title: "One thousand transactions, six things going on",
        body: "<strong>Download the workbook and do the work there.</strong> Build the six tests, rank the accounts, write the six summaries and the limits paragraph. " +
          "Then come back and enter these seven figures to check your working, and mark yourself against the rubric. " +
          "The figures below will not find the patterns for you; they confirm you were looking at the same file."
      },
      hint: "Do the workbook first. These seven cells are a checksum on your analysis, not a shortcut to it.",
      tasks: [
        { id: "t1", text: "Rows in the file.", cell: cells[0] },
        { id: "t2", text: "Distinct accounts.", cell: cells[1] },
        { id: "t3", text: "Median payment.", cell: cells[2] },
        { id: "t4", text: "Mean payment.", cell: cells[3] },
        { id: "t5", text: "Payments in the band from 9,000 up to but not including 10,000.", cell: cells[4] },
        { id: "t6", text: "The highest seven-day payment count for any account.", cell: cells[5] },
        { id: "t7", text: "The longest gap between consecutive payments on one account.", cell: cells[6], ext: true }
      ],
      checks: [
        {
          cell: cells[0], expect: n,
          task: cells[0] + ": rows in the file.",
          answer: String(n),
          why: "Establish the size before anything else, so every later figure has something to be checked against.",
          wrongWay: "Assuming a thousand exactly. Count it."
        },
        {
          cell: cells[1], expect: accts.length,
          task: cells[1] + ": distinct accounts.",
          answer: String(accts.length),
          why: "The denominator for every per-account statement you are about to make. Six of these " + accts.length + " are doing something worth writing up.",
          wrongWay: "Counting the account column rather than its distinct values."
        },
        {
          cell: cells[2], expect: median, tol: 0.05,
          task: cells[2] + ": the median payment.",
          answer: gbp(median),
          why: "The typical payment. Compare it with the mean below: the gap tells you the shape of the file before you have run a single test.",
          wrongWay: "Skipping straight to the tests. Five minutes on the distribution tells you which tests are worth running."
        },
        {
          cell: cells[3], expect: mean, tol: 0.05,
          task: cells[3] + ": the mean payment.",
          answer: gbp(mean),
          why: gbp(mean) + " against a median of " + gbp(median) + ". The mean sits above, which is the ordinary right skew of payment data and the reason a z-score baseline here needs treating carefully.",
          wrongWay: "Quoting the mean in the summaries as though it described a typical payment."
        },
        {
          cell: cells[4], expect: band,
          task: cells[4] + ": payments in the band below 10,000.",
          answer: String(band),
          why: "The raw count across the whole book. Your finding is not this number, it is how much of it comes from one account.",
          wrongWay: "Reporting the total as the structuring finding. Without the per-account breakdown it is just a histogram bucket."
        },
        {
          cell: cells[5], expect: maxWin,
          task: cells[5] + ": the highest seven-day count.",
          answer: String(maxWin),
          why: "Against a book where most accounts sit in low single figures over a week. State the window beside the figure, because at fourteen days the answer is different and equally true.",
          wrongWay: "Quoting a velocity figure without its window. The number is meaningless on its own."
        },
        {
          cell: cells[6], ext: true, expect: maxGap,
          task: cells[6] + ": the longest gap.",
          answer: String(maxGap) + " days",
          why: "The dormancy signal. Remember the guard for the first payment on each account, or six accounts report a gap of about 45,000 days and swamp the ranking.",
          wrongWay: "Forgetting the guard and then trusting the ranking that comes out of it."
        }
      ]
    };
  },
  workbook: function (seed) {
    const p = M9S4.practice(seed);
    const wb = new Workbook("M9S4");
    const r = rng(seed + ":wb");
    const rows = fcRows(seed, {
      accounts: 20, background: 940,
      structuring: true, structuringCount: 7, threshold: 10000,
      velocity: true, velocityCount: 14,
      round: true, dormant: true
    });
    const variants = { "Marlow Freight Ltd": ["Marlow Freight Ltd", "MARLOW FREIGHT LIMITED", "Marlow Freight Ltd ", "marlow freight"] };
    const sh = new Sheet("Transactions", rows.length + 4, 6);
    ["Ref", "Account", "Date", "Amount", "Country", "Counterparty"].forEach((h, i) => sh.set(0, i, h, { hdr: true }));
    rows.forEach((t, i) => {
      sh.set(1 + i, 0, t.ref);
      sh.set(1 + i, 1, t.account);
      sh.set(1 + i, 2, t.date, { fmt: DATEFMT });
      sh.set(1 + i, 3, t.amount, { fmt: GBP2 });
      sh.set(1 + i, 4, t.country);
      const cp = t.counterparty;
      sh.set(1 + i, 5, variants[cp] ? rPick(r, variants[cp]) : cp);
    });
    sh.rows = rows.length + 1; sh.cols = 6;
    wb.add(sh);
    return wb;
  }
};

const STAGE2_RUBRIC = [
  ["Distribution", "Mean and median both computed and the skew described before any test was run.", 3],
  ["Structuring", "Band test per account, parameters in cells, ranked rather than flagged.", 4],
  ["Velocity", "Rolling window per row, window length stated, alert volume counted.", 4],
  ["Round and names", "MOD test combined with a second signal; counterparty normalised with the original kept.", 3],
  ["Dormancy", "Gap measured with the first payment on each account guarded.", 3],
  ["Ranking", "One row per account, components shown beside any combined score.", 3],
  ["Write-up", "Six summaries in the four-part structure, plus a paragraph on the limits of the data.", 4]
];

defModule({
  id: "m9", n: 9, stage: "s2",
  title: "Statistics for analysts",
  subtitle: "Mean against median, spread, z scores, percentiles, correlation",
  blurb: "Enough statistics to say how unusual something is and, more importantly, to say what a figure does not license you to claim. Simple defensible baselines rather than black boxes, and the Stage 2 capstone.",
  onComplete: "Stage 2 is done. You can find patterns in transaction data, rank them honestly, and state the limits of what you found. Module 10 turns the same skills outwards, on public data, for arguments you intend to publish.",
  concepts: [
    { id: "m9.meanmedian", label: "Mean against median", blurb: "Two figures answering two different questions." },
    { id: "m9.skew", label: "Skew", blurb: "A mean above the median means a long right tail." },
    { id: "m9.outlierpull", label: "Outliers pull the mean", blurb: "And the standard deviation you measure them against." },
    { id: "m9.whichaverage", label: "Which average to quote", blurb: "Median for typical, mean for totals, both in public." },
    { id: "m9.stdev", label: "Standard deviation", blurb: "STDEV.S unless you truly hold the whole population." },
    { id: "m9.zscore", label: "Z scores", blurb: "Comparable across units, so you can rank across signals." },
    { id: "m9.percentile", label: "Percentiles", blurb: "Assume nothing, and let you choose the alert volume." },
    { id: "m9.notnormal", label: "Financial data is not a bell curve", blurb: "So never turn a z score into a probability." },
    { id: "m9.correlation", label: "CORREL", blurb: "Whether two columns rise and fall together. Nothing else." },
    { id: "m9.causation", label: "Move together, not drives", blurb: "Four explanations, and the figure cannot separate them." },
    { id: "m9.linearonly", label: "Straight lines only", blurb: "Look at the scatter before quoting the number." },
    { id: "m9.spurious", label: "Fishing", blurb: "Test twenty pairs and one will look impressive." },
    { id: "m9.capstone", label: "The Stage 2 workflow", blurb: "Distribution, tests, ranking, write-up, limits." }
  ],
  sessions: [M9S1, M9S2, M9S3, M9S4]
});
