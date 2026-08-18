/* ============================================================
   Question bank, Module 3.
   From here the questions start mixing modules, because that is
   how the material has to be recalled in practice.
   ============================================================ */

const QSHEET = {
  A2: "TX-01", B2: "Redgate Supplies", C2: "Leeds", D2: 45352, E2: 620,
  A3: "TX-02", B3: "Halden & Co", C3: "London", D3: 45360, E3: 180,
  A4: "TX-03", B4: "Northwood Ltd", C4: "Bristol", D4: 45368, E4: 1400,
  A5: "TX-04", B5: "Peak Trading", C5: "Leeds", D5: 45400, E5: 500,
  A6: "TX-05", B6: "Mersey Print", C6: "Leeds", D6: 45375, E6: 950
};

defQuestions([
  /* --- m3.if --- */
  {
    c: "m3.if", t: "mc",
    q: "What are the three parts of an IF, in order?",
    opts: ["Range, criterion, result", "Test, what to do if true, what to do if false",
           "What to do if true, test, what to do if false", "Test, range, result"],
    a: 1,
    why: "Read it as a sentence: if this is true, do that, otherwise do the other. The commas separate the three parts.",
    trap: "Confusing it with COUNTIF, which takes a range first. IF works on one row at a time and never takes a range."
  },
  {
    c: "m3.if", t: "type",
    q: "Amounts are in column E. In F2, write a formula showing <strong>Review</strong> when the amount is over 500 and <strong>OK</strong> otherwise.",
    model: '=IF(E2>500,"Review","OK")',
    check: { sheet: QSHEET, expect: "Review", mustUse: "IF" },
    why: "E2 holds 620, so this returns Review. Both outcomes are text, so both are quoted.",
    trap: 'Quoting the 500. <span class="f">=IF(E2>"500",...)</span> compares a number against text, and text always ranks above numbers in Excel, so every row returns OK.'
  },

  /* --- m3.quotes --- */
  {
    c: "m3.quotes", t: "pred",
    q: "C2 contains the text Leeds. What does this return?",
    formula: '=IF(C2=Leeds,1,0)',
    opts: ["1", "0", "#NAME?", "#VALUE!"],
    a: 2,
    why: "Without quotation marks Excel looks for something named Leeds, finds nothing, and returns #NAME?. Text inside a formula is always quoted.",
    trap: "It looks completely reasonable written down, which is why this is one of the two most common causes of #NAME?."
  },
  {
    c: "m3.quotes", t: "mc",
    q: 'What does <span class="f">""</span> mean inside a formula?',
    opts: ["A space", "Empty text", "A blank cell", "An error"],
    a: 1,
    why: "Two quotation marks with nothing between them mean empty text, which makes a cell look blank. It is not the same as a blank cell: the cell contains a formula, so COUNTA still counts it and ISBLANK says it is not blank.",
    trap: "Assuming a cell that looks empty is empty. This catches people in Module 4 when they go looking for gaps."
  },

  /* --- m3.compareop --- */
  {
    c: "m3.compareop", t: "mc",
    q: "A rule says payments over £500 go for review. A payment of exactly £500 arrives. Which operator is correct?",
    opts: ["=E2>500", "=E2>=500", "=E2<500", "=E2<>500"],
    a: 0,
    why: "Over £500 excludes £500 itself, so it is greater-than. If the rule was meant to include it, the rule should have said £500 and above, and you should ask rather than guess.",
    trap: "This is one row in a hundred and it is always the row somebody queries. Write down which reading you used."
  },
  {
    c: "m3.compareop", t: "mc",
    q: 'Which operator means "not equal to"?',
    opts: ["!=", "><", "<>", "=/="],
    a: 2,
    why: "Excel writes it as less-than followed by greater-than. Other languages use an exclamation mark; Excel does not.",
    trap: "Typing != , which Excel rejects outright rather than misinterpreting, so at least it fails loudly."
  },

  /* --- m3.ifnumber --- */
  {
    c: "m3.ifnumber", t: "mc",
    q: "You will need to count how many rows were flagged, and chart the flag rate by month. What should your IF return?",
    opts: ['"Yes" and "No"', "1 and 0", '"Flagged" and ""', "TRUE and FALSE"],
    a: 1,
    why: "A column of 1s and 0s can be summed to count the flags and averaged to get the rate directly. Words need a COUNTIF wrapped round them before they can do anything.",
    trap: 'Returning "" for the false case. It looks tidy and makes the column half text, which breaks averages and counts in ways that are hard to spot.'
  },
  {
    c: "m3.ifnumber", t: "pred",
    q: "A column of twenty cells each contains =IF(E2>500,1,0). What does AVERAGE over that column give you?",
    formula: "=AVERAGE(F2:F21)",
    opts: ["The average payment", "The proportion of payments over 500", "The count of payments over 500", "An error"],
    a: 1,
    why: "The mean of a column of ones and zeros is the proportion that are one. It is a genuinely useful trick and it only works if the IF returns numbers.",
    trap: "Reaching for a more complicated formula. Averaging a flag column is the shortest route to a rate."
  },

  /* --- m3.nested --- */
  {
    c: "m3.nested", t: "mc",
    q: "Where does the second IF go when you nest one inside another to get three outcomes?",
    opts: ["In the test", "In the true part", "In the false part", "After the closing bracket"],
    a: 2,
    why: "The false part is what happens when the first question fails, so that is where the next question goes. Each nesting adds one more outcome.",
    trap: "Losing track of the closing brackets. This is exactly why IFS exists."
  },

  /* --- m3.ifs --- */
  {
    c: "m3.ifs", t: "type",
    q: "Amounts are in column E. In F2, band the payment: over 1000 is <strong>High</strong>, over 500 is <strong>Medium</strong>, anything else is <strong>Low</strong>.",
    model: '=IFS(E2>1000,"High",E2>500,"Medium",TRUE,"Low")',
    check: { sheet: QSHEET, expect: "Medium", mustUse: ["IFS", "IF"] },
    why: "E2 holds 620, so it is Medium. The highest test must come first, and TRUE at the end catches everything that failed the others.",
    trap: "Putting the 500 test first, which makes the 1000 test unreachable. Every large payment is then labelled Medium and nothing errors."
  },
  {
    c: "m3.ifs", t: "mc",
    q: "What happens in IFS when a value matches none of the tests and there is no final TRUE?",
    opts: ["It returns 0", "It returns empty", "It returns #N/A", "It returns the last result"],
    a: 2,
    why: "IFS has nothing to give back, so it says so. Finishing with TRUE and a catch-all value avoids it.",
    trap: "Treating the #N/A as a bug in the data. It is IFS reporting that your bands do not cover everything."
  },

  /* --- m3.ifsorder --- */
  {
    c: "m3.ifsorder", t: "pred",
    q: "A payment of £2,000 is banded with this formula. What does it return?",
    formula: '=IFS(E2>500,"Medium", E2>1000,"High", TRUE,"Low")',
    opts: ["High", "Medium", "Low", "#N/A"],
    a: 1,
    why: "£2,000 is over 500, so the first test wins and the High test is never reached. IFS stops at the first match.",
    trap: "This is the single worst trap in the module, because it returns a plausible label for every row and never errors. Always put the extreme test first."
  },
  {
    c: "m3.ifsorder", t: "mc",
    q: "You have banded 3,000 rows with IFS and want to check the order is right. What is the quickest test?",
    opts: ["Check the first row", "Find the largest value and confirm it lands in the top band",
           "Count the bands", "Check that no row returns #N/A"],
    a: 1,
    why: "An ordering mistake makes the top band unreachable, so the largest value is where it shows. The first row tells you nothing unless it happens to be extreme.",
    trap: "Checking for errors. An ordering mistake produces no errors at all, which is precisely why it survives to the report."
  },

  /* --- m3.andor --- */
  {
    c: "m3.andor", t: "mc",
    q: "Somebody asks for payments from Leeds and Bristol. You write <span class='f'>AND(C2=\"Leeds\",C2=\"Bristol\")</span>. What comes back?",
    opts: ["Both cities", "Nothing at all", "Only Leeds", "#VALUE!"],
    a: 1,
    why: "No single row can be two cities at once, so the test is never true. They said and, meaning both in the list; the formula needs OR.",
    trap: "The English word and almost always means OR when the conditions are on the same column. Ask whether one row could satisfy both parts."
  },
  {
    c: "m3.andor", t: "type",
    q: "In F2, show <strong>Priority</strong> when the amount in E is over 500 <em>and</em> the city in C is Leeds, and leave it empty otherwise.",
    model: '=IF(AND(E2>500,C2="Leeds"),"Priority","")',
    check: { sheet: QSHEET, expect: "Priority", mustUse: "AND" },
    why: "Both conditions apply to the same row, so AND. Row 2 is £620 from Leeds, so it is Priority.",
    trap: "Using OR here, which flags every Leeds payment however small, plus every large payment from anywhere."
  },

  /* --- m3.countif --- */
  {
    c: "m3.countif", t: "type",
    q: "Cities are in C2 to C6. Write a formula for how many rows say Leeds.",
    model: '=COUNTIF(C2:C6,"Leeds")',
    check: { sheet: QSHEET, expect: 3, mustUse: "COUNTIF" },
    why: "Range first, then what to look for. Capitalisation is ignored, so LEEDS would match as well.",
    trap: "Spaces are not ignored. A city stored as \"Leeds \" with a trailing space will not match, and your count comes back short with no warning."
  },
  {
    c: "m3.countif", t: "mc",
    q: "A COUNTIF over a supplier column returns 0 when you expected several. What are the two likeliest causes?",
    opts: ["The range is empty, or the function is misspelled",
           "Trailing spaces in the data, or a missing wildcard in the criterion",
           "The column is formatted wrongly, or the sheet is protected",
           "There are too many rows"],
    a: 1,
    why: "Those two account for most surprising zeros. A partial name needs an asterisk, and imported data very often carries invisible spaces.",
    trap: "Accepting the zero as an answer. A zero from a COUNTIF and a genuine absence look identical, so it always deserves a second look."
  },

  /* --- m3.criteria --- */
  {
    c: "m3.criteria", t: "mc",
    q: "Which of these is written correctly?",
    opts: ['=COUNTIF(E2:E500, >500)', '=COUNTIF(E2:E500, ">500")',
           '=COUNTIF(E2:E500, ">"500)', '=COUNTIF(E2:E500, "500">)'],
    a: 1,
    why: "The whole criterion, operator included, travels inside one pair of quotation marks. It reads oddly and it is the thing beginners get wrong most often with this family.",
    trap: "Leaving the operator outside the quotes, which Excel rejects."
  },
  {
    c: "m3.criteria", t: "type",
    q: "Amounts are in E2 to E6. The threshold 500 sits in H1. Write a formula counting the amounts <em>above</em> the threshold, pointing at H1 rather than typing 500.",
    model: '=COUNTIF(E2:E6,">"&H1)',
    check: { sheet: Object.assign({ H1: 500 }, QSHEET), expect: 3, mustUse: "COUNTIF" },
    why: "The ampersand joins the greater-than sign to whatever is in H1, building the criterion. Now changing the threshold re-answers the question.",
    trap: "Typing 500 into the formula, which is the Module 2 hard-coding mistake wearing a different hat."
  },

  /* --- m3.countifs --- */
  {
    c: "m3.countifs", t: "mc",
    q: "You want transactions between two dates. How many conditions does the date column need?",
    opts: ["One", "Two, one for each end of the window", "Three", "None, use a filter"],
    a: 1,
    why: "There is no between in this family, so you give the same range twice: on or after the start, and on or before the end. That is normal and it is how a window is expressed.",
    trap: "Trying to write a single criterion for a month. A date is a day count and knows nothing about months."
  },
  {
    c: "m3.countifs", t: "mc",
    q: "In a COUNTIFS you use E2:E500 for the amounts and D3:D501 for the dates. What happens?",
    opts: ["#VALUE!", "It works correctly", "It compares each amount against the wrong row's date", "It returns 0"],
    a: 2,
    why: "The ranges are the same size, so Excel accepts them, and every row is tested against its neighbour's date. Mismatched sizes give #VALUE!, which is far safer because you find out.",
    trap: "Assuming Excel checks that your ranges line up. It only checks that they are the same shape."
  },

  /* --- m3.wildcard --- */
  {
    c: "m3.wildcard", t: "mc",
    q: "Which criterion counts every supplier whose name ends in Ltd?",
    opts: ['"Ltd"', '"*Ltd"', '"Ltd*"', '"?Ltd"'],
    a: 1,
    why: "The asterisk stands for any number of characters, so it matches anything finishing with Ltd. Putting it after would match names beginning with Ltd instead.",
    trap: 'The question mark stands for exactly one character, so "?Ltd" only matches four-character names such as XLtd.'
  },
  {
    c: "m3.wildcard", t: "mc",
    q: "Do wildcards work on a column of amounts?",
    opts: ["Yes", "No, they only apply to text", "Only with COUNTIFS", "Only for whole numbers"],
    a: 1,
    why: "Wildcards are a text-matching device. On numbers and dates you use comparison operators instead.",
    trap: "Trying to match numbers beginning with a digit using a wildcard. For that you need the text functions in Module 4."
  },

  /* --- m3.sumif --- */
  {
    c: "m3.sumif", t: "mc",
    q: "Why do experienced users write SUMIFS even when there is only one condition?",
    opts: ["It is faster", "It puts the range being added first, so the argument order is never in doubt",
           "SUMIF is being removed", "It handles text better"],
    a: 1,
    why: "SUMIF and SUMIFS put the range being added at opposite ends of the argument list. Using one of them always means never having to remember which you are in.",
    trap: "Learning both properly and using them interchangeably. You will eventually reverse them, and the result is a wrong number rather than an error."
  },
  {
    c: "m3.sumif", t: "type",
    q: "Cities are in C2 to C6 and amounts in E2 to E6. Write a formula totalling the Leeds amounts, using SUMIFS.",
    model: '=SUMIFS(E2:E6,C2:C6,"Leeds")',
    check: { sheet: QSHEET, expect: 2070, mustUse: "SUMIFS" },
    why: "The range being added comes first, then range and criterion pairs. Leeds rows are 620, 500 and 950, totalling 2,070.",
    trap: "Writing it in SUMIF order, which puts the amount range last and totals the wrong column."
  },

  /* --- m3.sumifs --- */
  {
    c: "m3.sumifs", t: "mc",
    q: "Can the column being totalled also be one of the columns being tested?",
    opts: ["No", "Yes, and it is common", "Only in SUMIF", "Only if it is sorted"],
    a: 1,
    why: "Totalling the amounts that are themselves over a threshold means naming the amount range twice, once as the thing added and once as the thing tested. Perfectly normal.",
    trap: "Assuming a range can only appear once. There is no such rule, and date ranges routinely appear twice as well."
  },
  {
    c: "m3.sumifs", t: "mc",
    q: "You build a summary of totals by city, one formula filled down against a list of city labels. What must be locked?",
    opts: ["Nothing", "The data ranges, but not the criterion",
           "The criterion, but not the data ranges", "Everything"],
    a: 1,
    why: "The data ranges must stay pointing at the whole dataset as the formula travels down, so they are locked. The criterion must move so each row reads the label beside it.",
    trap: "Locking the criterion too, which makes every row report the first city's total under a different label. It looks entirely correct at a glance."
  },

  /* --- m3.argorder --- */
  {
    c: "m3.argorder", t: "mc",
    q: "In SUMIF, where does the range being added go?",
    opts: ["First", "Second", "Last", "It is not needed"],
    a: 2,
    why: "SUMIF takes the range to test, the criterion, then the range to add. SUMIFS puts the range to add first. They are the opposite way round, and there is no logic to it.",
    trap: "Reversing them, which produces a number rather than an error, because both arguments are valid ranges."
  },
  {
    c: "m3.argorder", t: "mc",
    q: "Somebody hands you a sheet containing <span class='f'>=SUMIF(E2:E500,\">500\",C2:C500)</span> where E is amounts and C is city names. What is wrong?",
    opts: ["Nothing", "It totals the city column, which is text, and returns 0",
           "The criterion needs to be a number", "The ranges are different sizes"],
    a: 1,
    why: "It tests the amounts correctly and then adds up the city names, which are text, so the total is 0. No error is shown.",
    trap: "A zero total looks like nothing matched. Here everything matched and the wrong column was added."
  },

  /* --- m3.iferror --- */
  {
    c: "m3.iferror", t: "mc",
    q: "AVERAGEIFS finds no matching rows. What does it return, and why?",
    opts: ["0, because nothing is nothing", "#DIV/0!, because there is no average of no numbers",
           "Empty", "#N/A"],
    a: 1,
    why: "Returning 0 would be a lie, since 0 is a real average that some data could genuinely produce. SUMIFS in the same situation returns 0, because the total of nothing really is nothing. Both are right.",
    trap: "Assuming a summary row showing a 0 total and an errored average is broken. It is consistent."
  },
  {
    c: "m3.iferror", t: "mc",
    q: "When should IFERROR be added to a formula?",
    opts: ["While building it, so errors do not distract you",
           "Last, once the formula is known to work",
           "Never", "Around every formula as a matter of habit"],
    a: 1,
    why: "IFERROR hides every error, not only the one you expected. Wrapped around a formula with a mistyped range, it gives you your tidy message instead of the #REF! that would have told you.",
    trap: "Using it as a general tidying tool. A sheet with no visible errors and IFERROR everywhere is less trustworthy than one showing its problems."
  }
]);
