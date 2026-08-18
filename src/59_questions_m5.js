/* ============================================================
   Question bank, Module 5.
   ============================================================ */

const M5Q = {
  A2: "SUP-102",
  A10: "SUP-101", B10: "Redgate Supplies", C10: "Low",
  A11: "SUP-102", B11: "Halden & Co", C11: "Medium",
  A12: "SUP-103", B12: "Northwood Ltd", C12: "Low"
};

defQuestions([
  /* --- m5.lookupidea --- */
  {
    c: "m5.lookupidea", t: "mc",
    q: "Why does a transaction log store a supplier code rather than the supplier's name?",
    opts: ["To save disk space", "So each fact is stored once, in the place it belongs, and referred to by a key",
           "Because names are too long", "To make lookups necessary"],
    a: 1,
    why: "Duplicating the name against every transaction guarantees that one day half the rows say Redgate Supplies and half say Redgate Supplies Ltd, with no way to tell which is right.",
    trap: "Copying the names in permanently to avoid writing a lookup. You have then made the same mistake the split was designed to prevent."
  },

  /* --- m5.xlookup --- */
  {
    c: "m5.xlookup", t: "type",
    q: "A code sits in A2. The master's codes are in A10:A12 and its supplier names in B10:B12. Write the lookup for the supplier name.",
    model: "=XLOOKUP(A2,A10:A12,B10:B12)",
    check: { sheet: M5Q, expect: "Halden & Co", mustUse: "XLOOKUP" },
    why: "Three arguments in the order you would say them: what to find, where to look, what to bring back.",
    trap: "Giving it the whole master block as one range, as VLOOKUP wants. XLOOKUP takes the search column and the return column separately."
  },
  {
    c: "m5.xlookup", t: "mc",
    q: "How many arguments does XLOOKUP need for an exact match?",
    opts: ["Three", "Four, the last being FALSE", "Two", "Five"],
    a: 0,
    why: "Exact is the default, so there is no fourth argument to remember and no way to leave off a safeguard by accident. That is the main reason to prefer it over VLOOKUP.",
    trap: "Adding FALSE out of VLOOKUP habit. XLOOKUP's fourth argument is if_not_found, so a stray FALSE becomes the text shown when nothing matches."
  },

  /* --- m5.lockarrays --- */
  {
    c: "m5.lockarrays", t: "mc",
    q: "You fill a lookup down 200 rows and the lower rows return #N/A even though the codes are plainly in the master. What is wrong?",
    opts: ["The master is too small", "The master ranges were not locked, so they slid down as the formula filled",
           "The codes are numbers", "XLOOKUP cannot handle 200 rows"],
    a: 1,
    why: "Without dollar signs the master range moves with the formula, so by the bottom it is searching past the end of the table. Lock both master ranges; leave the lookup value relative.",
    trap: "Assuming the master is incomplete and asking somebody to add codes that are already there."
  },
  {
    c: "m5.lockarrays", t: "mc",
    q: "In <span class='f'>=XLOOKUP(C2,$A$17:$A$23,$B$17:$B$23)</span>, which part is meant to change as you fill down?",
    opts: ["All three", "Only C2", "Only the two ranges", "None of them"],
    a: 1,
    why: "Each row looks up its own code, so C2 must move. Both master ranges must stay pointing at the whole master, so both are locked.",
    trap: "Locking C2 as well, which makes all 200 rows report on the first transaction."
  },

  /* --- m5.returnrange --- */
  {
    c: "m5.returnrange", t: "mc",
    q: "The supplier name is in column A and the code in column C. Which will do the lookup?",
    opts: ["VLOOKUP", "XLOOKUP or INDEX with MATCH", "HLOOKUP", "None of them"],
    a: 1,
    why: "VLOOKUP can only return something to the right of the column it searches. XLOOKUP takes the search range and the return range as separate arguments, so direction does not matter.",
    trap: "Rearranging your data so VLOOKUP can cope. Restructuring a table to suit a formula is the wrong way round."
  },

  /* --- m5.na --- */
  {
    c: "m5.na", t: "mc",
    q: "A lookup returns #N/A. What has Excel told you?",
    opts: ["The formula is broken", "The value was not found in the range you searched",
           "The range is the wrong size", "A number is stored as text"],
    a: 1,
    why: "That is all it says, and it is usually true. The work is deciding which of three things caused it: the value is genuinely absent, the key is dirty on your side, or the key is dirty on the master's side.",
    trap: "Rewriting the formula first. In two of the three cases the formula was right and the data was not."
  },
  {
    c: "m5.na", t: "mc",
    q: "A code fails to match. <span class='f'>=COUNTIF(master,C5)</span> gives 0 and <span class='f'>=COUNTIF(master,\"*\"&TRIM(C5)&\"*\")</span> gives 1. What does that tell you?",
    opts: ["The code is genuinely missing", "The code is there, but one side of the join is dirty",
           "The master is sorted wrongly", "COUNTIF cannot be used this way"],
    a: 1,
    why: "The exact search finds nothing while the wildcard search finds it, so the value exists with something extra around it. That is a thirty-second diagnosis that saves an hour of guessing.",
    trap: "Skipping the diagnosis and trying fixes at random."
  },

  /* --- m5.ifnotfound --- */
  {
    c: "m5.ifnotfound", t: "type",
    q: "Look up the code in A2 against codes in A10:A12, returning the name from B10:B12, and showing <strong>not on file</strong> when nothing matches.",
    model: '=XLOOKUP(A2,A10:A12,B10:B12,"not on file")',
    check: { sheet: M5Q, expect: "Halden & Co", mustUse: "XLOOKUP" },
    why: "The fourth argument is what to return when nothing matches. No wrapper and no nesting, which is the main practical advantage of XLOOKUP.",
    trap: "Wrapping the whole thing in IFERROR instead, which also swallows a mistyped range and leaves you debugging blind."
  },
  {
    c: "m5.ifnotfound", t: "mc",
    q: "What should an unmatched lookup return on a sheet somebody else will read?",
    opts: ["A blank", "Zero", "A short message such as not on file", "#N/A, always"],
    a: 2,
    why: "A message says a lookup ran and found nothing, which is a fact somebody may need to act on. A blank is indistinguishable from a row nobody has filled in yet, and a zero will be added into totals.",
    trap: "Returning zero on a numeric lookup. It is silently wrong in every sum on the sheet."
  },

  /* --- m5.dirtykeys --- */
  {
    c: "m5.dirtykeys", t: "mc",
    q: "Which Module 4 fault most often breaks a lookup?",
    opts: ["Wrong capitalisation", "A trailing space", "Missing decimal places", "A merged cell"],
    a: 1,
    why: "Lookups ignore capitalisation, so case differences match fine. A trailing space is invisible and does not match, and it is the single commonest cause of an unexplained #N/A.",
    trap: "Trusting your eyes. Compare LEN against LEN of TRIM instead."
  },

  /* --- m5.bothsides --- */
  {
    c: "m5.bothsides", t: "mc",
    q: "You wrap your lookup value in TRIM and one row still returns #N/A. What is left to check?",
    opts: ["The formula syntax", "Whether the master's own key is dirty",
           "Whether the range is locked", "Whether the code is a number"],
    a: 1,
    why: "TRIM on the lookup value cleans your side only. If the entry in the master carries the space, the match still fails and the obvious fix appears not to work. Add a cleaned helper column to the master and search that.",
    trap: "Editing the transaction to match the damaged master, which propagates the fault into your data instead of out of it."
  },
  {
    c: "m5.bothsides", t: "mc",
    q: "Why is Module 4 taught before Module 5?",
    opts: ["Cleaning is easier", "Because a join fails on exactly the invisible faults cleaning finds",
           "Because lookups are harder", "No particular reason"],
    a: 1,
    why: "Clean both sides, then join. A lookup over dirty keys fails in a way that looks like a formula problem and is not.",
    trap: "Building the join first and then spending an afternoon on the formula."
  },

  /* --- m5.vlookup --- */
  {
    c: "m5.vlookup", t: "type",
    q: "The master occupies A10:C12, with codes in the first column and names in the second. Look up the code in A2 using VLOOKUP, exactly.",
    model: "=VLOOKUP(A2,A10:C12,2,FALSE)",
    check: { sheet: M5Q, expect: "Halden & Co", mustUse: "VLOOKUP" },
    why: "The whole block, then the column number counted from the block's left edge, then FALSE for exact.",
    trap: "Omitting the FALSE. On unsorted data that returns a real value from the wrong row, with no error."
  },
  {
    c: "m5.vlookup", t: "pred",
    q: "The master is A10:C12 with codes, names and risk. What does this return?",
    formula: "=VLOOKUP(A2,A10:C12,3,FALSE)",
    opts: ["The code", "The name", "The risk rating", "#REF!"],
    a: 2,
    why: "Column 3 of the block, counting the block's own left edge as 1. Here that is the risk column.",
    trap: "Counting from column A of the sheet rather than from the left edge of the block you supplied."
  },

  /* --- m5.vlookupflaws --- */
  {
    c: "m5.vlookupflaws", t: "mc",
    q: "Somebody inserts a column into the middle of your master. What happens to your VLOOKUPs?",
    opts: ["They error", "They return values from the wrong field, silently",
           "Excel updates the column numbers", "Nothing"],
    a: 1,
    why: "The column number is a position, not a reference, so it still says 2 and now points at something else. Nothing errors, and you have a column of city names labelled Supplier.",
    trap: "This flaw breaks a working sheet through an action taken by somebody who had no reason to think about your formula."
  },
  {
    c: "m5.vlookupflaws", t: "mc",
    q: "Which is NOT one of VLOOKUP's three flaws?",
    opts: ["It can only return values to the right of the search column",
           "The column number breaks when a column is inserted",
           "It cannot handle text values",
           "Its last argument is optional and defaults to approximate matching"],
    a: 2,
    why: "It handles text perfectly well. The other three are real, and the third is the one that produces confidently wrong answers.",
    trap: "Learning VLOOKUP as simply outdated. It is usable; it just has three specific traps you must name."
  },

  /* --- m5.approx --- */
  {
    c: "m5.approx", t: "mc",
    q: "When is approximate matching, the TRUE argument, the right choice?",
    opts: ["Never", "When looking up a code", "For banding, such as commission rates by order size",
           "When the data is unsorted"],
    a: 2,
    why: "Banding means take the row for the largest threshold not exceeding my value, which is exactly what approximate matching does. It needs the threshold column sorted ascending and starting below anything you will look up.",
    trap: "Using it anywhere else, or letting it happen by default because the FALSE was left off."
  },
  {
    c: "m5.approx", t: "mc",
    q: "A banding table starts at a threshold of 500. An order of £200 is looked up with TRUE. What comes back?",
    opts: ["0%", "The 500 band", "#N/A", "An error"],
    a: 2,
    why: "There is no row at or below 200, so there is nothing to fall back to. Banding tables must start at 0, which is why the practice table does.",
    trap: "Assuming the smallest band catches everything below it. It only catches values above its own threshold."
  },

  /* --- m5.indexmatch --- */
  {
    c: "m5.indexmatch", t: "type",
    q: "Codes are in A10:A12 and names in B10:B12. Look up the code from A2 using INDEX and MATCH.",
    model: "=INDEX(B10:B12,MATCH(A2,A10:A12,0))",
    check: { sheet: M5Q, expect: "Halden & Co", mustUseAll: ["INDEX", "MATCH"] },
    why: "MATCH finds which position the code sits at; INDEX fetches that position from the name column. Read it inside out: work out the row, then fetch from it.",
    trap: "Leaving the 0 off MATCH, which makes it approximate and, on unsorted data, wrong."
  },
  {
    c: "m5.indexmatch", t: "mc",
    q: "Why is INDEX with MATCH still worth being able to read?",
    opts: ["It is faster than XLOOKUP", "Inherited workbooks are full of it, and it has the widest version compatibility",
           "It is the only one that looks left", "It is easier"],
    a: 1,
    why: "For twenty years it was the right answer, so it is everywhere. It also works in every version of Excel, which is why it survives in files shared between organisations.",
    trap: "Writing it in new work. XLOOKUP says the same thing in a form a beginner can read."
  }
]);
