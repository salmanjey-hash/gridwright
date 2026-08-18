/* ============================================================
   Question bank, Module 2.
   The "type" questions are graded by running what you write
   against a real sheet, so any formula that gets the right answer
   is accepted, not just the one I had in mind.
   ============================================================ */

defQuestions([
  /* --- m2.equals --- */
  {
    c: "m2.equals", t: "mc",
    q: "You type <span class='f'>B2*C2</span> into a cell and press Enter. What happens?",
    opts: ["It multiplies B2 by C2", "The cell shows the text B2*C2", "Excel shows #NAME?", "Excel asks what you meant"],
    a: 1,
    why: "Without a leading equals sign Excel treats it as text and stores it exactly as typed. The cell will be left-aligned, which is the giveaway.",
    trap: "Assuming Excel will work out that you meant a formula. It will not, and the result looks like a label rather than an error."
  },
  {
    c: "m2.equals", t: "pred",
    q: "A cell contains this. What does it show?",
    formula: "=3*4",
    opts: ["3*4", "12", "#VALUE!", "34"],
    a: 1,
    why: "The equals sign makes it a question, and Excel answers it. The formula bar keeps showing =3*4 while the cell shows 12.",
    trap: "Expecting the cell to keep showing the formula. The cell shows the answer; the bar shows the question."
  },

  /* --- m2.refnotnum --- */
  {
    c: "m2.refnotnum", t: "mc",
    q: "A unit price of £1.45 sits in C2. You need the line total for 12 units. Which formula would a professional write in D2?",
    opts: ["=12*1.45", "=B2*C2", "=12*C2", "=17.40"],
    a: 1,
    why: "Both the quantity and the price already exist on the sheet, so point at both. When either changes, the total corrects itself and you have nothing to remember.",
    trap: "The third option looks like a reasonable compromise and is the worst of the four, because it hides a hard-coded number inside a formula that appears to be properly linked."
  },
  {
    c: "m2.refnotnum", t: "mc",
    q: "Which of these hard-coded numbers inside a formula is genuinely acceptable?",
    opts: ["A VAT rate of 0.2", "The 2 in =(A1+B1)/2 when averaging two figures", "An exchange rate of 1.27", "A headcount of 45"],
    a: 1,
    why: "The 2 is part of the arithmetic: averaging two numbers means dividing by two, and that will never change. Rates and counts are data, and data belongs in its own cell.",
    trap: "Rates feel constant while you are working on the sheet. They are exactly the thing that changes after you hand it over."
  },

  /* --- m2.arith --- */
  {
    c: "m2.arith", t: "pred",
    q: "What does this return?",
    formula: "=2+3*4",
    opts: ["20", "14", "24", "9"],
    a: 1,
    why: "Multiplication happens before addition, so it is 2 plus 12. Excel does not work left to right, whatever the formula looks like.",
    trap: "Reading left to right and getting 20. That is the reflex this question exists to break."
  },
  {
    c: "m2.arith", t: "mc",
    q: "Which symbol multiplies in Excel?",
    opts: ["x", "*", "×", "•"],
    a: 1,
    why: "The asterisk, on the number pad or Shift and 8. Typing the letter x gives #NAME?, because Excel looks for something called x.",
    trap: "Using the letter x, which is what you would write on paper."
  },

  /* --- m2.brackets --- */
  {
    c: "m2.brackets", t: "type",
    q: "Five line totals sit in D2 to D6. Write a formula for their average <strong>without using a function</strong>.",
    model: "=(D2+D3+D4+D5+D6)/5",
    check: { sheet: { D2: 10, D3: 20, D4: 30, D5: 40, D6: 50 }, expect: 30 },
    why: "The brackets force all five to be added before the division happens. Without them Excel divides D6 by 5 first and adds it to the other four.",
    trap: "<span class='f'>=D2+D3+D4+D5+D6/5</span>, which here gives 110 rather than 30. In real data the wrong answer is usually close enough to look right."
  },
  {
    c: "m2.brackets", t: "pred",
    q: "A1 holds 10, A2 holds 20, A3 holds 30. What does this return?",
    formula: "=A1+A2+A3/3",
    opts: ["20", "40", "30", "60"],
    a: 1,
    why: "Only A3 is divided by 3, giving 10, and that is added to 10 and 20. The answer is 40, not the average of 20.",
    trap: "The dangerous part is that 40 is a perfectly plausible figure. Nothing is flagged and nothing looks wrong."
  },

  /* --- m2.sum --- */
  {
    c: "m2.sum", t: "type",
    q: "Amounts run down column B from row 2 to row 20, with a heading in B1. Write a formula for their total.",
    model: "=SUM(B2:B20)",
    check: {
      sheet: { B1: "Amount", B2: 5, B3: 10, B4: 15, B20: 20 },
      expect: 50, mustUse: "SUM"
    },
    why: "SUM over the data rows only. The heading is text and would be ignored anyway, but including it is a habit that causes real errors with COUNTA later.",
    trap: "<span class='f'>=SUM(B:B)</span>, the whole-column form. It works until somebody puts a total at the bottom of the column, at which point the total includes itself."
  },
  {
    c: "m2.sum", t: "mc",
    q: "A range of 20 amounts includes three stored as text. What does SUM return?",
    opts: ["#VALUE!", "The total of all 20", "The total of the 17 real numbers, with no warning", "Zero"],
    a: 2,
    why: "SUM silently skips text inside a range. The total is wrong and nothing on screen says so, which is why COUNT next to COUNTA is worth two cells.",
    trap: "Expecting an error. SUM only errors when a text value is handed to it directly rather than sitting inside a range."
  },

  /* --- m2.avgblank --- */
  {
    c: "m2.avgblank", t: "mc",
    q: "Ten cells hold sales figures. Two are completely empty. What does AVERAGE over all ten divide by?",
    opts: ["10", "8", "2", "It returns #DIV/0!"],
    a: 1,
    why: "AVERAGE ignores empty cells entirely, so it divides by 8. If those two days genuinely had no sales you wanted a division by 10, and you should type 0 rather than leaving them blank.",
    trap: "Assuming blank behaves as zero. It does not, and the difference here is a 25 per cent swing in the answer."
  },
  {
    c: "m2.avgblank", t: "mc",
    q: "You tidy a sheet by filling every empty cell in a numeric column with 0. What have you changed?",
    opts: ["Nothing, it just looks neater", "Every average over that column", "Only the total", "The formatting"],
    a: 1,
    why: "Totals are unaffected, because adding zero changes nothing. Averages are affected, because the count of values has gone up. Tidying is never purely cosmetic in a numeric column.",
    trap: "Doing this to make a sheet presentable before sending it, and changing the figures in the process."
  },

  /* --- m2.countvcounta --- */
  {
    c: "m2.countvcounta", t: "mc",
    q: "Over the same range, COUNT returns 10 and COUNTA returns 11. What does that tell you?",
    opts: ["One cell is empty", "One cell holds something that is not a number", "The range is wrong", "One value is negative"],
    a: 1,
    why: "COUNT sees only numbers, COUNTA sees anything non-empty. A gap of one means exactly one cell holds a non-number, and it is almost always a number stored as text that SUM has just skipped.",
    trap: "Reading it the other way round. An empty cell is invisible to both, so blanks never open a gap between them."
  },
  {
    c: "m2.countvcounta", t: "type",
    q: "Values run down column B from row 2 to row 13. Write a formula for how many of those cells hold a real number.",
    model: "=COUNT(B2:B13)",
    check: { sheet: { B2: 1, B3: 2, B4: "x", B5: 4, B13: 5 }, expect: 4, mustUse: "COUNT" },
    why: "COUNT counts numbers only. Text and blanks are not counted.",
    trap: "Using COUNTA, which counts the text cell too and so cannot reveal it."
  },

  /* --- m2.round --- */
  {
    c: "m2.round", t: "mc",
    q: "Three cells hold 10.4, 10.3 and 10.4, formatted to show no decimals. What do you see, and what does SUM return?",
    opts: ["10, 10, 10 and a total of 30", "10, 10, 10 and a total of 31", "10.4, 10.3, 10.4 and a total of 31.1", "An error"],
    a: 1,
    why: "The display is rounded and the maths is not. SUM adds 31.1 and shows it rounded to 31, so the visible figures appear not to add up. Only ROUND changes what is stored.",
    trap: "Being asked why your column does not add up, and having no answer. This is one of the most common ways a report loses credibility."
  },
  {
    c: "m2.round", t: "pred",
    q: "What does this return?",
    formula: "=ROUND(1234, -2)",
    opts: ["1234.00", "1200", "12.34", "#VALUE!"],
    a: 1,
    why: "A negative number of digits rounds to the left of the decimal point, so -2 rounds to the nearest hundred. Useful for presenting large figures honestly at a stated precision.",
    trap: "Assuming a negative argument is invalid. It is not, and it is genuinely useful."
  },

  /* --- m2.fill --- */
  {
    c: "m2.fill", t: "mc",
    q: "You have filled one formula down two hundred rows. Which cell should you check first?",
    opts: ["The first one", "The last one", "A random one in the middle", "None, if the first was right"],
    a: 1,
    why: "The first one is the one you wrote and already checked. The bottom is where a drifting reference has moved furthest and where the failure is most obvious.",
    trap: "Checking only the top, which is guaranteed to look correct because it is the cell you built."
  },
  {
    c: "m2.fill", t: "mc",
    q: "What is the keyboard shortcut that copies the cell above into the selected cell?",
    opts: ["Ctrl and D", "Ctrl and F", "Ctrl and V", "F4"],
    a: 0,
    why: "Ctrl and D fills down, adjusting references as it goes. Ctrl and R does the same to the right.",
    trap: "Confusing it with F4, which cycles the dollar signs while you are editing a reference."
  },

  /* --- m2.relative --- */
  {
    c: "m2.relative", t: "pred",
    q: "D2 contains <span class='f'>=B2*C2</span>. You copy it to D5. What does D5 contain?",
    formula: "=B2*C2      copied from D2 to D5",
    opts: ["=B2*C2", "=B5*C5", "=B5*C2", "=E2*F2"],
    a: 1,
    why: "Excel stores directions, not addresses: two cells left times one cell left. Moved down three rows, both references move down three rows.",
    trap: "Expecting the formula to stay literally as written. If it did, filling a column would be useless."
  },
  {
    c: "m2.relative", t: "mc",
    q: "Why does Excel shift references when you copy a formula?",
    opts: ["To be helpful", "Because it stores the formula as a direction relative to its own cell", "Because of the dollar signs", "It only does this when filling, not copying"],
    a: 1,
    why: "The address is how the reference is written down; the direction is what it means. Shifting is not a feature added on top, it is the consequence of how references work.",
    trap: "Thinking of it as an autocorrect that can be switched off. The dollar sign does not switch it off, it pins one part of the coordinate."
  },

  /* --- m2.absolute --- */
  {
    c: "m2.absolute", t: "type",
    q: "A VAT rate sits in B1. Net amounts run down column B from row 4. Write the formula for C4 so it can be filled down the whole column.",
    model: "=B4*$B$1",
    check: { sheet: { B1: 0.2, B4: 100 }, expect: 20, mustUse: "$B$1" },
    why: "The net reference must move down with the formula, so it stays relative. The rate must not move, so both parts of it are locked.",
    trap: "<span class='f'>=B4*B1</span>. The first row is right and every row below returns zero, because the rate reference drifts down into empty cells."
  },
  {
    c: "m2.absolute", t: "mc",
    q: "A filled column is correct on the first row and zero on every row below. What is almost certainly wrong?",
    opts: ["The data is missing", "A reference that should have been locked was not", "The range is too short", "The cells are formatted as text"],
    a: 1,
    why: "That exact pattern, right at the top and dead underneath, is the signature of a reference to a single cell that has drifted down into empty space.",
    trap: "Retyping the formula in each row by hand. It works, takes an hour, and leaves a sheet nobody can maintain."
  },

  /* --- m2.mixed --- */
  {
    c: "m2.mixed", t: "mc",
    q: "What does <span class='f'>B$1</span> do when the formula is filled down and to the right?",
    opts: ["Nothing moves", "The column moves, the row stays on 1", "The row moves, the column stays on B", "Both move"],
    a: 1,
    why: "The dollar sign locks whatever comes immediately after it. Here it is in front of the row number, so the row is pinned and the column is free to move.",
    trap: "Reading the dollar sign as applying to the whole reference. It applies only to the part directly after it."
  },
  {
    c: "m2.mixed", t: "mc",
    q: "Amounts run down column A from row 5. Rates run across row 4 from column B. One formula must fill the whole rectangle. Which is right?",
    opts: ["=A5*B4", "=$A5*B$4", "=$A$5*$B$4", "=A$5*$B4"],
    a: 1,
    why: "Lock the column of the amount so it keeps reading from column A as the formula travels right, and lock the row of the rate so it keeps reading from row 4 as it travels down.",
    trap: "Locking everything, which gives a rectangle full of one identical figure. Ask which part should stay still rather than adding dollar signs by reflex."
  },

  /* --- m2.errvalue --- */
  {
    c: "m2.errvalue", t: "mc",
    q: "A formula returns #VALUE!. What is Excel telling you?",
    opts: ["The formula is misspelled", "It found text where it needed a number", "A reference points at nothing", "Something was divided by zero"],
    a: 1,
    why: "Look for a cell containing a word, a symbol, or a number with a unit typed after it. It is the Module 1 data type problem appearing inside a formula.",
    trap: "Changing the formula. The formula is usually fine; a cell it refers to is not."
  },
  {
    c: "m2.errvalue", t: "pred",
    q: "A2 contains the text <span class='f'>45 units</span>. What does this return?",
    formula: "=A2*2",
    opts: ["90", "#VALUE!", "45 units45 units", "0"],
    a: 1,
    why: "Excel can convert text that is purely a number, so <span class='f'>=\"45\"*2</span> gives 90. It cannot convert text with a word in it, so this errors.",
    trap: "Assuming Excel will strip the word out. One fact per cell: the number in the cell, the unit in the heading."
  },

  /* --- m2.errdiv0 --- */
  {
    c: "m2.errdiv0", t: "mc",
    q: "A cost-per-unit column shows #DIV/0! on one row. What is the most likely cause?",
    opts: ["The cost is wrong", "The unit count for that row is empty or zero", "The formula is misspelled", "The column is too narrow"],
    a: 1,
    why: "Dividing by an empty cell is dividing by zero. The formula is fine and the data is missing, so the fix is to supply the figure.",
    trap: "Wrapping the formula to hide the error before you have found out why the cell is empty."
  },
  {
    c: "m2.errdiv0", t: "mc",
    q: "You delete a column and forty formulas now show #REF!. What is the best move?",
    opts: ["Rewrite the forty formulas", "Undo immediately", "Delete the formulas too", "Replace #REF! with zero"],
    a: 1,
    why: "Undo restores the column and every reference to it. #REF! is destructive because the original reference is gone, so Excel cannot work out what you meant.",
    trap: "Starting to repair the formulas one by one, which takes far longer and loses information you can no longer recover."
  },

  /* --- m2.errname --- */
  {
    c: "m2.errname", t: "mc",
    q: "A cell shows ##### right across. What is wrong?",
    opts: ["The value is corrupted", "Nothing: the column is too narrow to display it", "The formula has an error", "The number is negative"],
    a: 1,
    why: "It is a display problem and nothing more. Widen the column, by double-clicking the line between the column letters, and it goes away.",
    trap: "Treating it as an error and retyping the value. The value was never affected."
  },
  {
    c: "m2.errname", t: "pred",
    q: "A1 contains the text London. What does this return?",
    formula: "=IF(A1=London,1,0)",
    opts: ["1", "0", "#NAME?", "#VALUE!"],
    a: 2,
    why: "Without quotation marks Excel looks for something named London, finds nothing, and says so. Text inside a formula always needs quotation marks.",
    trap: "This is the second most common cause of #NAME? after a misspelled function name, and it looks perfectly reasonable on screen."
  },

  /* --- m2.silentwrong --- */
  {
    c: "m2.silentwrong", t: "mc",
    q: "Which of these mistakes will Excel NOT warn you about?",
    opts: ["Dividing by an empty cell", "Misspelling SUM as SUMM", "A range that stops three rows short of the data", "Deleting a column a formula depended on"],
    a: 2,
    why: "A short range returns a perfectly ordinary number. The other three all produce a visible error code, which makes them harmless by comparison.",
    trap: "Believing that no error message means no error. The mistakes that reach a report are always the quiet ones."
  },
  {
    c: "m2.silentwrong", t: "mc",
    q: "A fortnight of takings averaging roughly £400 a day totals £4,800. What should you do?",
    opts: ["Report it", "Check the range, because that is roughly half of what it should be", "Format it as currency", "Round it"],
    a: 1,
    why: "Fourteen days at about £400 is around £5,600, so £4,800 is short by a quarter and is worth ten minutes. Knowing roughly what the answer should be before you calculate it is the only defence against silent errors.",
    trap: "Trusting a figure because a formula produced it. A formula guarantees arithmetic, not relevance."
  }
]);
