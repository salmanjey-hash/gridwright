/* ============================================================
   Question banks, Modules 6 and 7.
   ============================================================ */

defQuestions([
  /* ---------------- Module 6 ---------------- */
  {
    c: "m6.whatitis", t: "mc",
    q: "In two verbs, what does a pivot table do?",
    opts: ["Sorts and filters", "Groups rows, then does arithmetic on each group",
           "Charts and formats", "Copies and pastes"],
    a: 1,
    why: "It finds every distinct value of the field you put in Rows, gathers the rows for each, and applies the value setting to them. That is all a pivot table is.",
    trap: "Treating it as magic. It is the SUMIFS summary from Module 3 with a interface on top, which is why the formulas were taught first."
  },
  {
    c: "m6.whatitis", t: "mc",
    q: "Why learn SUMIFS before pivot tables, when the pivot is faster?",
    opts: ["Pivots are unreliable", "Because a pivot cannot tell you why a number is wrong",
           "SUMIFS is more powerful", "Interviews only ask about SUMIFS"],
    a: 1,
    why: "When a pivot gives you an unexpected figure, the formulas are how you work out whether the source range, a filter, or the data is at fault.",
    trap: "Skipping the formulas because the pivot is quicker. It is quicker right up until it is wrong."
  },
  {
    c: "m6.rowsvalues", t: "mc",
    q: "You want one line per supplier showing their total spend. What goes in Rows and what in Values?",
    opts: ["Amount in Rows, Supplier in Values", "Supplier in Rows, Amount in Values",
           "Both in Rows", "Supplier in Filters, Amount in Values"],
    a: 1,
    why: "Rows is the thing you want one line per. Values is the number being worked out.",
    trap: "Putting the number in Rows, which gives one line per distinct amount: hundreds of lines, each with a total of itself."
  },
  {
    c: "m6.reading", t: "mc",
    q: "What single check catches a wrong source range, a forgotten filter and a stale pivot?",
    opts: ["Counting the rows in the pivot", "Comparing the pivot's grand total against a plain SUM over the source",
           "Refreshing twice", "Checking the row labels"],
    a: 1,
    why: "All three faults change the grand total and none of them produce an error. One comparison catches the lot.",
    trap: "Trusting a pivot because it looks tidy. Tidiness is not evidence."
  },
  {
    c: "m6.sourcerange", t: "mc",
    q: "Your data has one completely empty row in the middle. What does Excel propose as the pivot's source range?",
    opts: ["All of it", "Only the rows above the blank", "Only the rows below the blank", "It refuses"],
    a: 1,
    why: "Excel guesses by looking outward from the selected cell until it hits a blank row or column, so it takes the top half and reports confidently on it.",
    trap: "Accepting the proposed range without reading it. The grand total will look plausible and be roughly half."
  },
  {
    c: "m6.valuesettings", t: "mc",
    q: "A city has the largest total spend but only four transactions. Which value setting would reveal that?",
    opts: ["Sum", "Count", "% of grand total", "Max"],
    a: 1,
    why: "Count tells you how many rows are behind a figure. A large total from four rows is a very different story from the same total across four hundred.",
    trap: "Reporting the total alone. It is the single easiest way to mislead without stating anything false."
  },
  {
    c: "m6.pctoftotal", t: "mc",
    q: "A pivot shows a supplier at 100% of spend. What must you check before reporting it?",
    opts: ["The formatting", "How many transactions are behind it",
           "The chart type", "Whether the total is rounded"],
    a: 1,
    why: "A share without its base is not a fact. One hundred per cent of two transactions and 38 per cent of six hundred are not comparable claims.",
    trap: "Percentages feel more rigorous than raw numbers and are easier to mislead with."
  },
  {
    c: "m6.columns", t: "mc",
    q: "You put City in Rows and Category in Columns. What does each inner cell show?",
    opts: ["The city total", "The category total",
           "The value for that city and that category together", "A count of rows"],
    a: 2,
    why: "Rows and Columns together give a grid, and each cell is the intersection: the rows matching both. Totals run down the right and along the bottom.",
    trap: "Reading a row total when you wanted a specific cell. Check the column before copying a figure out of a grid."
  },
  {
    c: "m6.sumvscount", t: "mc",
    q: "You drop Amount into Values and the pivot shows <strong>Count of Amount</strong>. What has it told you?",
    opts: ["You chose the wrong field", "At least one cell in that column is not a number",
           "The pivot needs refreshing", "The column is formatted as text"],
    a: 1,
    why: "Excel cannot sum text, so if any cell in the column is text it defaults to counting. That is a free diagnostic for the Module 1 fault, found without looking for it.",
    trap: "Changing the setting to Sum and moving on. It will now silently exclude the text rows from the total."
  },
  {
    c: "m6.groupdates", t: "mc",
    q: "Two years of data, grouped by month alone. What happens?",
    opts: ["Twenty-four lines", "Twelve lines, with each month's two years added together",
           "An error", "It refuses to group"],
    a: 1,
    why: "Month alone ignores the year, so January 2023 and January 2024 become one line called Jan. Group by Years and Months together whenever the span is uncertain.",
    trap: "It produces twelve tidy lines and no warning, which is why it survives into reports."
  },
  {
    c: "m6.filters", t: "mc",
    q: "Why prefer a slicer over a filter dropdown on a report somebody else will read?",
    opts: ["It is faster", "You can see what is selected without clicking anything",
           "It allows more values", "It refreshes automatically"],
    a: 1,
    why: "A filter that is on and not visible is how a report ends up describing a quarter of the data while claiming to describe all of it.",
    trap: "Assuming you will remember. You will not, and neither will the person who opens it next month."
  },
  {
    c: "m6.refresh", t: "mc",
    q: "You correct three figures in your source data. What does the pivot show?",
    opts: ["The corrected figures immediately", "The old figures until you refresh it",
           "An error", "A warning triangle"],
    a: 1,
    why: "A pivot is a snapshot, not a live formula. Right-click and Refresh, or use the Refresh button on the PivotTable tab.",
    trap: "This is the commonest pivot error of all, and it produces a report that was correct an hour ago."
  },
  {
    c: "m6.pivottraps", t: "mc",
    q: "You add 200 rows to the bottom of your data and refresh the pivot. The new rows are missing. Why?",
    opts: ["You need to refresh twice", "The source range was fixed when the pivot was created",
           "Pivots have a row limit", "The new rows are formatted differently"],
    a: 1,
    why: "Refresh re-reads the range the pivot was built on, and that range stops above your new rows. Format the data as a Table first, with Ctrl and T, and a pivot built on it grows automatically.",
    trap: "Refreshing repeatedly and concluding Excel is broken. Refresh is doing exactly what it says; the range is the problem."
  },

  /* ---------------- Module 7 ---------------- */
  {
    c: "m7.chartchoice", t: "mc",
    q: "You are showing total spend for each of six cities. Which chart?",
    opts: ["Line", "Bar", "Scatter", "Pie"],
    a: 1,
    why: "Distinct categories being compared, so length is the right encoding. Sort by value, and use horizontal bars if the labels are long.",
    trap: "A line chart between cities implies a progression from one to the next, which does not exist."
  },
  {
    c: "m7.chartchoice", t: "mc",
    q: "You want to know whether larger transactions take longer to process. Which chart?",
    opts: ["Bar", "Line", "Scatter", "Stacked bar"],
    a: 2,
    why: "Two numbers per record, asking whether they move together. Every other chart type has one number per category and cannot answer it.",
    trap: "Plotting both as lines against the row number, which shows two series and says nothing about their relationship."
  },
  {
    c: "m7.pie", t: "mc",
    q: "What is the strongest argument against pie charts?",
    opts: ["They are old-fashioned", "People compare lengths well and angles badly",
           "They use too much colour", "Excel makes them badly"],
    a: 1,
    why: "Two slices within a few per cent are indistinguishable in a pie and obvious as bars. A pie also cannot be sorted usefully or show change over time.",
    trap: "Using one for four or more categories, where it stops being readable at all."
  },
  {
    c: "m7.axiszero", t: "mc",
    q: "Values of 88, 90, 86 and 92 are charted as bars with the axis starting at 84. What is the effect?",
    opts: ["It is clearer", "A difference of under 8 per cent looks like a fourfold one",
           "Nothing, as long as the axis is labelled", "The bars become unreadable"],
    a: 1,
    why: "A bar communicates through length, so length has to be proportional to value. This is the commonest way a chart misleads, and usually nobody intended it.",
    trap: "Applying the same rule to line charts. A line communicates through slope, so a truncated axis there is often legitimate."
  },
  {
    c: "m7.onequestion", t: "mc",
    q: "What should you do before drawing any chart?",
    opts: ["Choose the colours", "Write the sentence the chart has to support",
           "Sort the data", "Pick the chart type"],
    a: 1,
    why: "If you cannot write the sentence, you do not yet know what the chart is for. If it takes two sentences, you need two charts.",
    trap: "Drawing first and captioning afterwards, which produces decoration rather than an argument."
  },
  {
    c: "m7.declutter", t: "mc",
    q: "What should you remove first when tidying a chart?",
    opts: ["The axis", "The gridlines", "The data labels", "The title"],
    a: 1,
    why: "Gridlines are almost always the largest quantity of meaningless ink on a chart. If exact values matter, label the bars directly instead.",
    trap: "Removing the baseline of a bar chart, which is doing real work."
  },
  {
    c: "m7.declutter", t: "mc",
    q: "What is the test for whether a chart element should stay?",
    opts: ["Does it look professional", "If I delete it, does anybody misunderstand the chart",
           "Is it on by default", "Does it match the brand"],
    a: 1,
    why: "Every element has to earn its place. Remove things in order and stop when the next removal would cost the reader something.",
    trap: "Keeping elements because they are the default. Defaults are not decisions."
  },
  {
    c: "m7.title", t: "mc",
    q: "Which is the better chart title?",
    opts: ["Spend by city", "Leeds accounts for 38% of spend, more than the next two cities combined",
           "Figure 3", "City analysis 2024"],
    a: 1,
    why: "A finding survives being pasted into an email with no context. It also forces you to check the chart supports the sentence, and about a third of the time it turns out it does not.",
    trap: "Writing a finding the data does not support. The title must be what the data shows, including when that is duller than you hoped."
  },
  {
    c: "m7.condformat", t: "mc",
    q: "How many conditional formatting rules should a table normally carry?",
    opts: ["As many as help", "One", "One per column", "None"],
    a: 1,
    why: "Overlapping colour scales, icon sets and highlight rules make a table unreadable, and they usually accumulate over months from different people. Check Manage Rules before adding one.",
    trap: "Adding a rule without looking at what is already there."
  },
  {
    c: "m7.labels", t: "mc",
    q: "Why should colour never be the only thing carrying meaning on a chart?",
    opts: ["It prints badly", "Around one man in twelve has some colour vision deficiency",
           "Colours are distracting", "Excel changes them"],
    a: 1,
    why: "A chart distinguishing red from green loses its content entirely for those readers. Print it in black and white before sending: whatever survives that will survive anything.",
    trap: "Relying on a red-green good-and-bad convention, which is the worst possible pairing."
  },
  {
    c: "m7.dashboard", t: "mc",
    q: "What is the first step in building a dashboard?",
    opts: ["Choose the charts", "Write down the four or five questions the reader actually has",
           "Set up the colour scheme", "Build the pivot tables"],
    a: 1,
    why: "Everything on the page must answer one of those questions, and anything that answers none of them comes off. Without the list you produce a collection of charts.",
    trap: "Starting from what the data can show rather than from what the reader needs to know."
  },
  {
    c: "m7.headline", t: "mc",
    q: "Which set of headline figures is most useful across the top of a spend dashboard?",
    opts: ["Total only", "Total, count, average and largest single payment",
           "Average only", "The five biggest suppliers"],
    a: 1,
    why: "The total is meaningless without the count, the average is misleading without the maximum, and together the four describe the shape of the data rather than just its size.",
    trap: "Showing the mean alone on transaction data, where the distribution is almost always skewed."
  },
  {
    c: "m7.layout", t: "mc",
    q: "Where does the most important element go on a dashboard?",
    opts: ["Centre", "Top-left", "Bottom-right", "It does not matter"],
    a: 1,
    why: "Eyes start top-left and readers rarely reach the bottom right. Layout is a claim about what matters, whether you meant it or not.",
    trap: "Putting the headline figures at the bottom under the charts, where a third of readers will never see them."
  },
  {
    c: "m7.honesty", t: "mc",
    q: "What is the commonest dishonesty on a dashboard?",
    opts: ["A wrong number", "A missing denominator", "Bad colours", "Too many charts"],
    a: 1,
    why: "A headline saying 38 per cent with no total anywhere on the page cannot be checked, and a reader who cannot check a figure is entitled to distrust it.",
    trap: "Assuming that because nothing is false, nothing is misleading."
  },
  {
    c: "m7.honesty", t: "mc",
    q: "Your analysis excludes 31 rows whose supplier code did not match. What should you do?",
    opts: ["Nothing, they are only 6% of rows", "State the exclusion and its value on the page",
           "Delete them from the data", "Assign them to the largest supplier"],
    a: 1,
    why: "One line saying what was excluded and what it was worth prevents somebody discovering it later and doubting everything else on the page.",
    trap: "Silently dropping rows. It is the difference between an analysis and a misrepresentation."
  },
  {
    c: "m7.capstone", t: "mc",
    q: "What is the order of work on a messy file?",
    opts: ["Analyse, clean, present", "Assess, clean, enrich, analyse, present, write",
           "Clean, present, analyse", "Enrich, assess, clean, write"],
    a: 1,
    why: "Assess first so you know how bad it is and can report that as a finding. Clean before enriching, because a join fails on dirty keys. Write last, because the findings come from the analysis rather than the other way round.",
    trap: "Cleaning before counting the damage. The count is a finding, and once you have cleaned you can no longer produce it."
  },
  {
    c: "m7.capstone", t: "mc",
    q: "Which of these is a finding rather than a description?",
    opts: ["Spend varies by city", "There were some large payments",
           "The five largest payments are 22% of total spend across 500 transactions",
           "The data was quite messy"],
    a: 2,
    why: "A finding states something the reader did not know, carries the figure that supports it, and does not overclaim.",
    trap: "Describing the chart in words. If the sentence adds nothing to the picture, it is not a finding."
  }
]);
