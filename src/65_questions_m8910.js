/* ============================================================
   Question banks, Modules 8, 9 and 10.
   ============================================================ */

const M89Q = {
  A2: "AC-1", B2: 9850, C2: 45352,
  A3: "AC-1", B3: 9700, C3: 45353,
  A4: "AC-2", B4: 320, C4: 45354,
  A5: "AC-1", B5: 5000, C5: 45360,
  A6: "AC-3", B6: 12400, C6: 45361
};

defQuestions([
  /* ---------------- Module 8 ---------------- */
  {
    c: "m8.structuring", t: "mc",
    q: "What is structuring?",
    opts: ["Paying in a foreign currency", "Splitting one large payment into several to stay under a reporting threshold",
           "Using several accounts", "Rounding payments to the nearest thousand"],
    a: 1,
    why: "Each payment looks ordinary on its own. The pattern is repetition just below a round number, from one account, close together in time.",
    trap: "Looking for large payments. Structuring is defined by everything being small enough not to be looked at."
  },
  {
    c: "m8.band", t: "mc",
    q: "Why count payments in the band just below a £10,000 threshold rather than all payments under it?",
    opts: ["It is faster", "Roughly nine payments in ten are under the threshold, so that count is the background",
           "Excel cannot count below a value", "The band is more accurate"],
    a: 1,
    why: "The signal is proximity. A payment at £9,850 is a decision; a payment at £320 is a Tuesday.",
    trap: "Choosing the band width without recording why. It is a judgement and it changes every count you report."
  },
  {
    c: "m8.perentity", t: "type",
    q: "Accounts are in A2:A6, amounts in B2:B6. Count how many payments account <strong>AC-1</strong> made between 9,000 and just under 10,000.",
    model: '=COUNTIFS(A2:A6,"AC-1",B2:B6,">=9000",B2:B6,"<10000")',
    check: { sheet: M89Q, expect: 2, mustUse: "COUNTIFS" },
    why: "Three conditions on the same rows: the account, and both ends of the band. AC-1 has two payments in it.",
    trap: "Counting across all accounts, which mixes the signal into the background and finds nothing."
  },
  {
    c: "m8.falsepositives", t: "mc",
    q: "A legitimate business trips your structuring test every month because it invoices in fixed instalments. What is the right response?",
    opts: ["Exclude the account from the rule", "Keep the flag and record the explanation on the file",
           "Lower the band width", "Ignore it"],
    a: 1,
    why: "An unexplained absence looks exactly like a miss. The next analyst needs to know the pattern was seen and understood rather than never detected.",
    trap: "Silently suppressing a rule for one account. It will be found, and it looks far worse than the false positive did."
  },
  {
    c: "m8.velocity", t: "mc",
    q: "Why is a total over two months a poor way to spot unusual activity?",
    opts: ["Totals are inaccurate", "It throws away the timing, so £40,000 over eight weeks and in four days look identical",
           "Two months is too short", "Totals ignore small payments"],
    a: 1,
    why: "Velocity asks how much, how fast. Only a windowed count can separate a steady trickle from a burst.",
    trap: "Adding more totals at different levels. What is needed is a window, not more aggregation."
  },
  {
    c: "m8.rollingwindow", t: "mc",
    q: "Why use a rolling seven-day window rather than calendar weeks?",
    opts: ["It is easier to write", "A burst straddling a Sunday would be split into two unremarkable halves",
           "Calendar weeks are inaccurate", "Rolling windows use less memory"],
    a: 1,
    why: "Calendar buckets have edges, and anybody deliberately spacing payments will find those edges quickly.",
    trap: "Assuming the choice does not matter. It changes which rows appear at the top of your ranking."
  },
  {
    c: "m8.ownbaseline", t: "mc",
    q: "What is wrong with one velocity threshold applied to every account in a book?",
    opts: ["Nothing", "A busy trading company breaches it daily and a dormant account never does, however strange its behaviour",
           "It is too slow", "Thresholds cannot be applied per account"],
    a: 1,
    why: "Comparing an account against its own normal catches the unusual and stops flooding you with the merely busy.",
    trap: "Raising the fixed threshold until the alert volume is manageable. That just hides the quiet accounts more thoroughly."
  },
  {
    c: "m8.windowchoice", t: "mc",
    q: "You find a striking result at a seven-day window. What should you do before reporting it?",
    opts: ["Report it immediately", "Rerun at another window length and see whether it survives",
           "Narrow the window until it looks stronger", "Nothing"],
    a: 1,
    why: "A finding that exists only at one window length is an artefact of the window. State the window beside every figure.",
    trap: "Tuning the window until the result looks best. That is fitting the test to the answer."
  },
  {
    c: "m8.roundamounts", t: "mc",
    q: "Why is the round-amount test weak on its own?",
    opts: ["MOD is unreliable", "Salaries, rent and standing orders are legitimately round, so most hits are noise",
           "Round amounts are rare", "It only works on small numbers"],
    a: 1,
    why: "It earns its place combined with something else: round and to a new counterparty, or round and inside a velocity burst.",
    trap: "Presenting a list of round payments as a finding. On most books it is mostly the payroll."
  },
  {
    c: "m8.modtest", t: "type",
    q: "Amounts are in column B. In C2, return 1 when the amount is an exact multiple of 1,000 and 0 otherwise.",
    model: "=IF(MOD(B2,1000)=0,1,0)",
    check: { sheet: { B2: 5000 }, expect: 1, mustUseAll: ["IF", "MOD"] },
    why: "MOD returns the remainder, so a remainder of zero means it divides exactly. Returning 1 and 0 lets the column be totalled.",
    trap: "Testing the last three characters as text, which depends on formatting rather than on the value."
  },
  {
    c: "m8.fuzzynames", t: "mc",
    q: "One counterparty appears as Marlow Freight Ltd, MARLOW FREIGHT LIMITED and Marlow Freight. What is the consequence?",
    opts: ["None, Excel matches them", "Every count and total broken down by counterparty is wrong",
           "Only sorting is affected", "The rows will be deleted"],
    a: 1,
    why: "They are three distinct values to Excel, so the party's true total is split three ways and it never appears near the top of any ranking.",
    trap: "Assuming case-insensitive matching saves you. It handles the capitals and does nothing about the missing suffix."
  },
  {
    c: "m8.normalise", t: "mc",
    q: "When stripping company suffixes with nested SUBSTITUTE, why remove LIMITED before LTD?",
    opts: ["It is alphabetical", "Removing LTD first leaves IMITED behind from LIMITED",
           "LIMITED is more common", "The order makes no difference"],
    a: 1,
    why: "LTD is a substring of LIMITED, so the shorter one must go second. Order matters in nested SUBSTITUTE and this is the classic way it bites.",
    trap: "The result looks like a data problem rather than a formula one, so people go hunting in the wrong place."
  },
  {
    c: "m8.dormancy", t: "mc",
    q: "An account is silent for eleven weeks, then makes three payments in line with its history. Is that a finding?",
    opts: ["Yes, the gap is enough", "Not on its own; a long gap followed by ordinary payments is somebody coming back",
           "No, gaps never matter", "Only if the payments are round"],
    a: 1,
    why: "Combine the gap with the amount. A long gap followed by the largest payments the account has ever made is the pattern worth writing up.",
    trap: "Flagging every gap. Most of them are holidays, seasonal businesses and closed contracts."
  },
  {
    c: "m8.gapdetect", t: "mc",
    q: "You measure the gap with MAXIFS and forget to guard the first payment on each account. What happens?",
    opts: ["Those rows return 0", "Those rows report a gap of about 45,000 days and dominate the ranking",
           "MAXIFS errors", "Nothing"],
    a: 1,
    why: "With no earlier date, MAXIFS returns 0 and you subtract that from the date serial, giving the date itself. Six artefacts then bury the genuine finding.",
    trap: "Trusting a ranking without looking at the top of it. The artefacts are obvious once seen and invisible in a summary."
  },
  {
    c: "m8.severity", t: "mc",
    q: "You combine four signals into one score per account. What must you also show?",
    opts: ["The formula", "The component signals beside the total",
           "The account holder's name", "Nothing else"],
    a: 1,
    why: "A weighted score is your judgement wearing a number. Showing the components lets a reader disagree with the weighting rather than having to accept it.",
    trap: "Presenting a single score as though it were measured rather than decided."
  },
  {
    c: "m8.writeup", t: "mc",
    q: "Which part of a four-part write-up do beginners most often leave out?",
    opts: ["What was seen", "Why it stands out", "What it might be", "What you checked and could not resolve"],
    a: 3,
    why: "Stating what you could not establish lets somebody pick the work up without repeating it. Its absence makes a reader wonder what else went unsaid.",
    trap: "Treating the limits as weakness. They are the part that makes the rest credible."
  },

  /* ---------------- Module 9 ---------------- */
  {
    c: "m9.meanmedian", t: "mc",
    q: "Mean £1,240, median £310. What does that tell you?",
    opts: ["Someone has made an error", "Most payments are small and a few are very large",
           "The data is symmetrical", "The median is wrong"],
    a: 1,
    why: "A mean well above the median means a minority of large values is pulling it up. That is right skew, and it is the normal shape of anything involving money.",
    trap: "Quoting the mean in a sentence containing the word typical. Here it describes almost no actual payment."
  },
  {
    c: "m9.skew", t: "mc",
    q: "On a right-skewed set of payments, roughly what share sits above the mean?",
    opts: ["About half", "Well under half", "Well over half", "Exactly half"],
    a: 1,
    why: "The mean is dragged upwards past most of the data by the long tail. The half-and-half intuition comes from the bell curve, which financial data is not.",
    trap: "Using that share as evidence of something unusual. It is the ordinary shape of the data."
  },
  {
    c: "m9.outlierpull", t: "mc",
    q: "Why is a z score awkward on badly skewed data?",
    opts: ["Excel cannot compute it", "The mean and standard deviation it uses are themselves inflated by the outliers you are hunting",
           "Z scores need whole numbers", "It is too slow"],
    a: 1,
    why: "One enormous payment inflates the standard deviation enough to hide the merely large ones behind it. Rank on percentiles, or compute the baseline with the extremes excluded and say that you did.",
    trap: "Assuming a standardised figure is neutral. It is standardised against a baseline you also computed."
  },
  {
    c: "m9.whichaverage", t: "mc",
    q: "You are asked what a typical transaction looks like. Which figure?",
    opts: ["Mean", "Median", "Mode", "Maximum"],
    a: 1,
    why: "The median is the middle value, so it describes a typical case. The mean is the only one that reconstructs the total, which is why budgets use it.",
    trap: "Thinking one is generally better. They answer different questions and public work should quote both."
  },
  {
    c: "m9.stdev", t: "mc",
    q: "STDEV.S or STDEV.P for a year of transactions from one bank?",
    opts: ["STDEV.P, since you have all of them", "STDEV.S, since these are a sample of a larger process",
           "Either, they are identical", "Neither"],
    a: 1,
    why: "You almost always hold a sample of something larger. On any reasonable number of rows the two differ trivially, and not looking at spread at all is the much larger error.",
    trap: "Spending longer on this choice than on looking at the distribution."
  },
  {
    c: "m9.zscore", t: "mc",
    q: "What is a z score of 2?",
    opts: ["Twice the mean", "Two standard deviations above the mean", "The second largest value", "A 2% chance"],
    a: 1,
    why: "It measures distance from the mean in units of spread, which makes values from different columns comparable and therefore rankable together.",
    trap: "Reading it as a probability. That requires a distribution you have not verified."
  },
  {
    c: "m9.percentile", t: "mc",
    q: "Why are percentiles better than z scores for sizing an exception queue?",
    opts: ["They are more accurate", "You choose the volume: the top 1% is 1% of your rows by definition",
           "They are faster to compute", "They handle text"],
    a: 1,
    why: "With a z threshold you find out how many alerts you generated only after generating them, and on skewed data the answer is often hundreds.",
    trap: "Setting a z threshold without checking the resulting volume. A rule nobody can work is not a rule."
  },
  {
    c: "m9.notnormal", t: "mc",
    q: "You find a payment with a z score of 3.4. What may you say?",
    opts: ["It is a one-in-a-thousand event", "It is among the most unusual rows relative to the spread of this data",
           "It is fraudulent", "It is 3.4 times the average"],
    a: 1,
    why: "Ranking needs no distributional assumption and is exactly true. The probability claim requires a bell curve, and payment data is not one.",
    trap: "The probability version sounds more rigorous and is checkable, which is a bad combination."
  },
  {
    c: "m9.correlation", t: "mc",
    q: "CORREL returns 0.08. What does that mean?",
    opts: ["The columns are unrelated", "There is no useful straight-line relationship between them",
           "One causes the other weakly", "The data is wrong"],
    a: 1,
    why: "CORREL measures straight-line association only. A strong curved relationship also produces a figure near zero, which is why you look at the scatter first.",
    trap: "Reading near-zero as proof of independence. It rules out a straight line and nothing else."
  },
  {
    c: "m9.causation", t: "mc",
    q: "Two columns correlate at 0.85. How many explanations are consistent with that?",
    opts: ["One", "Two", "Four", "None"],
    a: 2,
    why: "The first causes the second, the second causes the first, a third thing causes both, or coincidence. The figure cannot distinguish between them at any number of decimal places.",
    trap: "Writing drives or leads to. Write move together, and say plainly that a causal claim needs different work."
  },
  {
    c: "m9.linearonly", t: "mc",
    q: "What should you always do before quoting a correlation?",
    opts: ["Round it", "Draw the scatter plot and look at it", "Compute it twice", "Convert it to a percentage"],
    a: 1,
    why: "Ten seconds, and it catches curved relationships, clusters and the single outlier that created the whole figure.",
    trap: "A correlation nobody has looked at the scatter for is a number produced by a machine and unchecked by a person."
  },
  {
    c: "m9.spurious", t: "mc",
    q: "You compare twenty pairs of unrelated columns and report the strongest. What have you done?",
    opts: ["Good exploratory work", "Manufactured a finding, since roughly one in twenty will look impressive by chance",
           "Nothing wrong", "Proved a relationship"],
    a: 1,
    why: "The honest protection is to say what you tested before you tested it. A reader judging one correlation in isolation is judging it wrongly.",
    trap: "Reporting the winner without mentioning the competition. That is how spurious findings enter the world."
  },
  {
    c: "m9.capstone", t: "mc",
    q: "In the Stage 2 write-up, which paragraph marks the work as serious?",
    opts: ["The methodology", "The one stating what the data cannot tell you at all",
           "The executive summary", "The formula appendix"],
    a: 1,
    why: "This data has no account purpose, no customer type and no narrative field, so nothing in it can distinguish structuring from a business paying in instalments. Saying so is what earns trust in the parts you did claim.",
    trap: "Omitting limits to sound confident. It has the opposite effect on anybody experienced."
  },

  /* ---------------- Module 10 ---------------- */
  {
    c: "m10.csv", t: "mc",
    q: "Why import a CSV through Data, From Text/CSV rather than double-clicking it?",
    opts: ["It is faster", "You can set columns to Text before anything is parsed",
           "It uses less memory", "Double-clicking does not work"],
    a: 1,
    why: "You can always convert text to a number later. You cannot recover a leading zero that has already been stripped, or the lost digits of an identifier turned into scientific notation.",
    trap: "Checking the file afterwards and seeing plausible numbers. The damage looks like data."
  },
  {
    c: "m10.encoding", t: "mc",
    q: "Country names arrive as TÃ¼rkiye. What is wrong and what fixes it?",
    opts: ["The source is corrupt; request a new file", "The file is UTF-8 read as something else; set encoding to UTF-8 and reimport",
           "The font is wrong; change the font", "Nothing, it displays fine when printed"],
    a: 1,
    why: "Find and replace is the wrong fix: you will miss cases and it leaves no audit trail. Reimport with the right encoding.",
    trap: "Mangled names silently fail every lookup and every match against a sanctions list."
  },
  {
    c: "m10.sourcecol", t: "mc",
    q: "Why put the source in a column on every row rather than a note at the top of the sheet?",
    opts: ["It looks better", "Because a filtered, sorted or copied subset of rows carries its provenance with it",
           "Notes are not allowed", "It saves space"],
    a: 1,
    why: "It also reveals when two vintages of the same dataset have been combined, which is otherwise invisible.",
    trap: "A header note survives right up until somebody copies fifty rows into another workbook."
  },
  {
    c: "m10.sanctionsfmt", t: "mc",
    q: "A consolidated sanctions list has 4,200 rows. How many individuals is that?",
    opts: ["4,200", "Fewer, because there is one row per name variant",
           "More, because some rows cover groups", "Impossible to say"],
    a: 1,
    why: "A person with an alias and two transliterations occupies four rows. Count the distinct group identifier, which is exactly why the publisher includes it.",
    trap: "Publishing the row count as a number of designated persons. The overstatement can be a factor of three."
  },
  {
    c: "m10.widelong", t: "mc",
    q: "Which shape do pivot tables and charts want?",
    opts: ["Wide, one column per year", "Long, one row per observation", "Either", "Neither"],
    a: 1,
    why: "Analyse in long, present in wide. Adding a year to long data means adding rows, which breaks nothing; adding a column breaks every formula pointing past it.",
    trap: "Trying to analyse wide data directly. Most of the awkwardness in spreadsheet work comes from this."
  },
  {
    c: "m10.reshape", t: "mc",
    q: "You reshape 8 countries by 3 years into long form and get 22 rows. What has happened?",
    opts: ["That is correct", "Two combinations are missing", "Two rows are duplicated", "The years are wrong"],
    a: 1,
    why: "Eight times three is twenty-four. Check the row count before and after every reshape, because a missing combination looks exactly like a shorter table.",
    trap: "Checking the numbers instead of the count. The numbers present will all be correct."
  },
  {
    c: "m10.blanksmissing", t: "mc",
    q: "A World Bank indicator has no value for a country in 2020. What do you put in the cell?",
    opts: ["0", "Nothing; leave it blank", "The previous year's value", "The regional average"],
    a: 1,
    why: "Zero asserts that the value was measured and was nothing, which is a factual claim you cannot support, and it drags every average towards it.",
    trap: "Filling gaps to make a chart look continuous. Break the line instead, because a continuous line asserts continuous data."
  },
  {
    c: "m10.units", t: "mc",
    q: "Which pair of figures is safe to compare across years?",
    opts: ["GDP in current US dollars", "GDP in constant 2015 US dollars", "Both", "Neither"],
    a: 1,
    why: "Current dollars include inflation, so a change across years mixes real change with price change. Copy the indicator's full name and unit onto the sheet verbatim.",
    trap: "This is the commonest cause of a published figure being wrong by a wide margin, and the footnote that explains it is never read."
  },
  {
    c: "m10.exactfigures", t: "mc",
    q: "A figure rises from 2 to 3. How should you write it?",
    opts: ["A 50% surge", "Up 50%, from 2 to 3", "Up one", "A significant increase"],
    a: 1,
    why: "State the base with every percentage. It is one clause and it makes the claim honest.",
    trap: "A reader who finds the base themselves and sees you buried it will discount everything else you wrote."
  },
  {
    c: "m10.rounding", t: "mc",
    q: "You have 49.6 per cent. What is wrong with reporting it as half?",
    opts: ["Nothing", "Two roundings, one of them silent, and the claim has changed",
           "Halves are always wrong", "It should be 49%"],
    a: 1,
    why: "Rounding to reach a threshold, and then describing the rounded figure in words, moves the claim past what the data says.",
    trap: "It usually happens by accident, one small step at a time."
  },
  {
    c: "m10.againstyourself", t: "mc",
    q: "What should you do if the counter-evidence you went looking for overturns your claim?",
    opts: ["Leave it out", "Change the claim", "Report both without deciding", "Find a different dataset"],
    a: 1,
    why: "That is the exercise working, not failing, and it is much cheaper before publication than after.",
    trap: "Being committed to a conclusion before checking it. The point of looking is that you might find something."
  },
  {
    c: "m10.citation", t: "mc",
    q: "Why record the date you downloaded a dataset?",
    opts: ["For copyright", "Because datasets are revised, so a figure has a vintage",
           "To prove you did the work", "It is not necessary"],
    a: 1,
    why: "A figure that was right in March is not wrong in September; it is a figure from March. Only the date lets anybody tell the difference.",
    trap: "Assuming headline indicators are stable. Revisions are routine and rarely announced."
  },
  {
    c: "m10.capstone", t: "mc",
    q: "In the Stage 3 capstone, what are the two charts for?",
    opts: ["Two views of the same finding", "One carrying the claim, one carrying the counter-evidence",
           "One for print and one for screen", "Any two that look good"],
    a: 1,
    why: "That pairing is the structure of the whole exercise, and it is why the number is fixed at two rather than left open.",
    trap: "Producing six charts. A piece with six charts has not decided what it is arguing."
  }
]);
