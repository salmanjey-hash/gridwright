/* ============================================================
   Question bank, Module 4.
   ============================================================ */

defQuestions([
  /* --- m4.trim --- */
  {
    c: "m4.trim", t: "type",
    q: "A2 holds a supplier name with stray spaces around it. Write a formula giving the tidied version.",
    model: "=TRIM(A2)",
    check: { sheet: { A2: "  Acme   Ltd  " }, expect: "Acme Ltd", mustUse: "TRIM" },
    why: "TRIM strips the ends and collapses runs of spaces in the middle down to one. It changes nothing else.",
    trap: "Expecting it to fix capitalisation too. It does not; that is PROPER, UPPER or LOWER."
  },
  {
    c: "m4.trim", t: "mc",
    q: "You run TRIM on a column copied out of a web page and nothing changes. Why?",
    opts: ["TRIM only works on numbers", "The spaces are non-breaking spaces, character 160, which TRIM ignores",
           "The column is formatted as text", "TRIM needs the range, not one cell"],
    a: 1,
    why: "Web pages use non-breaking spaces, which look identical and are a different character. Substitute them out first: =TRIM(SUBSTITUTE(A2,CHAR(160),\" \")).",
    trap: "Concluding the data is clean because TRIM did nothing. Check with LEN instead of trusting appearances."
  },

  /* --- m4.lendiag --- */
  {
    c: "m4.lendiag", t: "pred",
    q: "A2 contains a name with one trailing space. What does this return?",
    formula: "=LEN(A2)-LEN(TRIM(A2))",
    opts: ["0", "1", "#VALUE!", "The length of the name"],
    a: 1,
    why: "One character disappeared when trimmed, so there was one stray space. This is how you measure damage you cannot see.",
    trap: "Trying to spot trailing spaces by widening the column. They are invisible at any width."
  },
  {
    c: "m4.lendiag", t: "mc",
    q: "Before cleaning a column of 5,000 names, what is the useful first step?",
    opts: ["Trim them all immediately", "Count how many rows are actually damaged",
           "Sort the column", "Convert everything to capitals"],
    a: 1,
    why: "If 3 rows in 5,000 are damaged you fix them. If 4,000 are, the export itself is wrong and you go back to whoever sent it rather than papering over it.",
    trap: "Cleaning first and never finding out how bad the source was. The count is evidence you may need later."
  },

  /* --- m4.case --- */
  {
    c: "m4.case", t: "pred",
    q: "What does this return?",
    formula: '=PROPER("BBC studios")',
    opts: ["BBC Studios", "Bbc Studios", "BBC STUDIOS", "bbc studios"],
    a: 1,
    why: "PROPER lowercases everything then capitalises the first letter of each word, so genuine acronyms are destroyed. Run it, then read the column.",
    trap: "Applying PROPER to a whole company list unchecked. Acronyms and names like McLeod come out wrong."
  },
  {
    c: "m4.case", t: "mc",
    q: "Which function suits a column of email addresses?",
    opts: ["PROPER", "UPPER", "LOWER", "TRIM only"],
    a: 2,
    why: "Email addresses are conventionally lower case, and lowering them makes two spellings of the same address match.",
    trap: "Using PROPER, which capitalises the name part and makes addresses look wrong to a human even though most mail servers do not care."
  },

  /* --- m4.helper --- */
  {
    c: "m4.helper", t: "mc",
    q: "You cleaned column A into column B with formulas, then deleted column A. What happens to column B?",
    opts: ["Nothing, it keeps the clean values", "Every cell becomes #REF!",
           "It reverts to the dirty values", "Excel refuses to delete column A"],
    a: 1,
    why: "Column B is formulas pointing at column A. Deleting the source destroys them. Copy column B and Paste Values over itself first, which cuts the link and makes the cleaning permanent.",
    trap: "Forgetting Paste Values. It is the step everyone misses once, and it costs a whole cleaning pass."
  },
  {
    c: "m4.helper", t: "mc",
    q: "Why clean into a new column rather than overwriting the original?",
    opts: ["It is faster", "So you can compare the two and prove what you changed",
           "Excel requires it", "To save memory"],
    a: 1,
    why: "Cleaning is a change to evidence. Keeping the original lets you spot-check the transformation and answer the question of what exactly you did, which somebody will eventually ask.",
    trap: "Cleaning in place on the only copy of a file. There is then no way to show the change was correct."
  },

  /* --- m4.value --- */
  {
    c: "m4.value", t: "type",
    q: "A2 holds the text <span class='f'>£1,250.50</span>. Write a formula turning it into a real number.",
    model: "=VALUE(A2)",
    check: { sheet: { A2: "£1,250.50" }, expect: 1250.5, mustUse: "VALUE" },
    why: "VALUE copes with the currency symbol and the thousands separator without help.",
    trap: "Formatting the cell as currency, which changes the display and leaves the value as text."
  },
  {
    c: "m4.value", t: "mc",
    q: "VALUE returns #VALUE! on a cell containing <span class='f'>45 units</span>. Why is that the right behaviour?",
    opts: ["The cell is formatted wrongly", "There are two facts in one cell and no function can guess which you meant",
           "VALUE cannot handle spaces", "The number is too small"],
    a: 1,
    why: "One fact per cell. The number and the unit need splitting apart, which is session 3, and no conversion function can do that guessing for you.",
    trap: "Wrapping it in IFERROR to make the error go away, which leaves you with a blank where a real value should be."
  },

  /* --- m4.datevalue --- */
  {
    c: "m4.datevalue", t: "mc",
    q: "A column of text dates converts with DATEVALUE without any errors, but about a third of them look wrong. What is the likely cause?",
    opts: ["The dates are corrupt", "Regional settings are reading day and month the other way round",
           "DATEVALUE needs a format argument", "The cells need widening"],
    a: 1,
    why: "03/04/2024 is 3 April in the United Kingdom and 4 March in the United States. Only the dates where the day is 13 or above are unambiguous, which is why roughly a third look wrong.",
    trap: "The absence of errors is not evidence of correctness. Rebuild from parts with DATE if you need certainty."
  },
  {
    c: "m4.datevalue", t: "mc",
    q: "You convert a text date and the cell shows 45368. What now?",
    opts: ["The conversion failed", "It worked: format the cell as a date",
           "Divide by 1000", "Use VALUE instead"],
    a: 1,
    why: "45368 is the day count Excel stores for 17 March 2024. The conversion is complete; only the display format is missing.",
    trap: "Assuming a five-digit number means failure. It means success, shown without its costume."
  },

  /* --- m4.coerce --- */
  {
    c: "m4.coerce", t: "mc",
    q: "You meet <span class='f'>=--A2</span> in somebody else's sheet. What is it doing?",
    opts: ["Subtracting twice", "Forcing text that looks numeric to become a number",
           "Making the value negative", "Nothing"],
    a: 1,
    why: "Two negations cancel out, and the arithmetic forces a conversion on the way. It is common inside SUMPRODUCT and worth recognising.",
    trap: "Writing it yourself. VALUE says the same thing and a reader does not have to stop and decode it."
  },
  {
    c: "m4.coerce", t: "pred",
    q: "A2 contains the text 12. What does this return?",
    formula: "=A2*1",
    opts: ["12 as text", "12 as a number", "#VALUE!", "121"],
    a: 1,
    why: "Arithmetic on text that looks purely numeric forces a conversion, so the result is a real number. This is why =\"12\"+1 gives 13 while SUM over a range containing \"12\" skips it.",
    trap: "Assuming the inconsistency is a bug. It is the rule: direct arithmetic converts, ranges do not."
  },

  /* --- m4.textisoneway --- */
  {
    c: "m4.textisoneway", t: "mc",
    q: "You build a column with =TEXT(B2,\"0.00\") and then total it. What do you get?",
    opts: ["The correct total", "Zero, because TEXT produces text and SUM skips text",
           "#VALUE!", "The total rounded to 2dp"],
    a: 1,
    why: "TEXT is for labels. Its output cannot be added, averaged or sorted as a number. If the figure will be calculated with, format the cell instead and leave the value alone.",
    trap: "Using TEXT to control decimal places on data. Formatting does that without destroying the number."
  },

  /* --- m4.split --- */
  {
    c: "m4.split", t: "type",
    q: "A2 holds <span class='f'>Smith, John</span>. Write a formula giving just the surname.",
    model: '=TEXTBEFORE(A2,", ")',
    check: { sheet: { A2: "Smith, John" }, expect: "Smith", mustUse: ["TEXTBEFORE", "LEFT"] },
    why: "Everything before the first comma-space. The older equivalent is =LEFT(A2,FIND(\",\",A2)-1) and both are worth knowing.",
    trap: "Forgetting the minus one in the LEFT version, which drags the comma along and gives \"Smith,\"."
  },
  {
    c: "m4.split", t: "mc",
    q: "Why split on <span class='f'>\", \"</span> rather than just <span class='f'>\",\"</span> when taking the part after a comma?",
    opts: ["It is faster", "Splitting on the comma alone leaves a leading space on the result",
           "Excel requires two characters", "It handles missing commas better"],
    a: 1,
    why: "The space after the comma belongs to the delimiter, not to the name. Leave it in and you have created exactly the invisible fault session 1 was about.",
    trap: "The result looks perfect on screen and fails every lookup in Module 5."
  },

  /* --- m4.findsearch --- */
  {
    c: "m4.findsearch", t: "mc",
    q: "What are the two differences between FIND and SEARCH?",
    opts: ["FIND is faster, SEARCH is newer",
           "FIND is case sensitive and takes no wildcards; SEARCH ignores case and accepts them",
           "FIND works on numbers, SEARCH on text", "There is no difference"],
    a: 1,
    why: "Both return the position of one piece of text inside another, and both return #VALUE! when it is not there, which is why they usually sit inside IFERROR.",
    trap: "Using FIND for a case-insensitive match and getting errors on rows that differ only in capitalisation."
  },

  /* --- m4.flashfill --- */
  {
    c: "m4.flashfill", t: "mc",
    q: "What is the main reason not to leave a Flash Fill result in a file you hand to somebody else?",
    opts: ["It is slow", "It leaves no formula and does not update when the data changes",
           "It only works on names", "It changes the formatting"],
    a: 1,
    why: "Flash Fill guesses from a pattern and writes fixed values. There is no record of the rule, no way to check it, and no recalculation when the source changes.",
    trap: "It also gets rows wrong silently when the pattern varies. Sort the result and inspect both ends, where the failures cluster."
  },

  /* --- m4.join --- */
  {
    c: "m4.join", t: "type",
    q: "B2 holds a surname and C2 a first name. Write a formula giving <strong>First Surname</strong> with a single space.",
    model: '=C2 & " " & B2',
    check: { sheet: { B2: "Smith", C2: "John" }, expect: "John Smith" },
    why: "The ampersand joins pieces together and the separator has to be supplied explicitly. TEXTJOIN does the same and can skip blanks, which matters when a middle name may be missing.",
    trap: "=C2&B2 with no separator, giving JohnSmith. Excel never adds a space for you."
  },

  /* --- m4.dupefind --- */
  {
    c: "m4.dupefind", t: "type",
    q: "References run down A2 to A12. In D2, write a formula counting how many times that row's reference appears in the whole column, ready to be filled down.",
    model: "=COUNTIF($A$2:$A$12,A2)",
    check: { sheet: { A2: "TX-1", A3: "TX-2", A4: "TX-1", A12: "TX-3" }, expect: 2, mustUse: "COUNTIF" },
    why: "The range is locked so every row searches the whole column; the criterion is relative so each row asks about its own reference. Anything above 1 is a repeat.",
    trap: "Leaving the range relative, so it shrinks as you fill and the bottom rows report 1 for everything."
  },
  {
    c: "m4.dupefind", t: "mc",
    q: "What is the right order of operations when dealing with suspected duplicates?",
    opts: ["Remove, then check what is left", "Count, inspect, decide, then act",
           "Sort, then delete visually identical rows", "Filter and delete"],
    a: 1,
    why: "Remove Duplicates does all four at once and shows you none of them. Counting first leaves evidence and lets you decide deliberately.",
    trap: "Deleting first. There is no undo once the file is saved and closed."
  },

  /* --- m4.dupetrap --- */
  {
    c: "m4.dupetrap", t: "mc",
    q: "On a transaction file you run Remove Duplicates with only the Supplier column ticked. What happens?",
    opts: ["Nothing, it needs all columns", "Every payment to each supplier is deleted except the first",
           "Only exact duplicate rows go", "Excel warns you first"],
    a: 1,
    why: "It compares only the ticked columns and keeps the first occurrence. Ticking one column on a transaction file destroys most of the data, with no record of what went.",
    trap: "Ask what one row represents. If it is a transaction, a duplicate needs the reference, date, amount and counterparty all to match."
  },
  {
    c: "m4.dupetrap", t: "mc",
    q: "Why must trimming happen before deduplicating?",
    opts: ["It is faster that way", "Trailing spaces make identical rows look different, so duplicates survive",
           "Remove Duplicates cannot handle spaces at all", "It does not matter"],
    a: 1,
    why: "Remove Duplicates ignores capitalisation but not spaces. Run it on a dirty file and \"Acme\" and \"Acme \" are kept as two distinct rows.",
    trap: "Deduplicating a fresh export and reporting the row count as clean."
  },

  /* --- m4.unique --- */
  {
    c: "m4.unique", t: "mc",
    q: "What is the advantage of UNIQUE over Remove Duplicates?",
    opts: ["It is faster", "It changes nothing: the source data is untouched",
           "It handles more rows", "It ignores case"],
    a: 1,
    why: "UNIQUE returns the distinct values as a live result and leaves the data alone. It should be your default, with Remove Duplicates reserved for when you genuinely mean to delete.",
    trap: "Running Remove Duplicates to answer a question. Counting distinct values needs no deletion at all."
  },

  /* --- m4.blanks --- */
  {
    c: "m4.blanks", t: "mc",
    q: "A cell contains <span class='f'>=IF(A2&gt;500,\"Review\",\"\")</span> and appears empty. Does COUNTBLANK count it?",
    opts: ["Yes", "No, because the cell contains a formula returning empty text",
           "Only if the column is formatted as text", "Only in newer versions"],
    a: 1,
    why: "Empty text is not the same as an empty cell. COUNTBLANK counts truly empty cells only, while COUNTIF with a criterion of \"\" counts both.",
    trap: "Using COUNTBLANK to audit a column full of IF formulas and concluding there are no gaps."
  },
  {
    c: "m4.blanks", t: "mc",
    q: "A sales column has gaps. Some days genuinely had no sales; some were never recorded. What should you do?",
    opts: ["Fill all of them with 0", "Leave them all blank",
           "0 for the genuine nils, blank for the unrecorded ones", "Delete those rows"],
    a: 2,
    why: "AVERAGE skips blanks and includes zeros, so the distinction changes every average on the sheet. Decide what the gap means before filling it.",
    trap: "Filling every blank with 0 to tidy the sheet, which quietly drags every average down."
  }
]);
