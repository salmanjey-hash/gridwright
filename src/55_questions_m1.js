/* ============================================================
   Question bank, Module 1.
   Types: mc (multiple choice), type (write it yourself),
   pred (predict what this returns).
   Every question names the common wrong turn, because the wrong
   turn is usually more instructive than the right answer.
   ============================================================ */

defQuestions([
  /* --- m1.grid --- */
  {
    c: "m1.grid", t: "mc",
    q: "You open one Excel file. Inside it are three tabs along the bottom, named Jan, Feb and Mar. What are those tabs?",
    opts: ["Three separate workbooks", "Three sheets inside one workbook", "Three ranges", "Three views of the same data"],
    a: 1,
    why: "The file is the workbook. The tabs are sheets inside it. They save and open together as one file, which is why you can write a formula on one sheet that reads from another.",
    trap: "Thinking of each tab as its own file. It matters when someone asks you to send them the January figures and you send the whole workbook without realising."
  },
  {
    c: "m1.grid", t: "mc",
    q: "Which of these is the smallest unit that can hold a value in Excel?",
    opts: ["A sheet", "A column", "A cell", "A range"],
    a: 2,
    why: "A cell holds exactly one value. Columns, rows and ranges are just groups of cells. One fact per cell is the rule the whole tool is built around.",
    trap: "Treating a cell as a small text box and typing several things into it, such as a quantity and a unit together."
  },

  /* --- m1.address --- */
  {
    c: "m1.address", t: "mc",
    q: "A value sits in the fourth column across and the ninth row down. What is its address?",
    opts: ["9D", "D9", "4:9", "D:9"],
    a: 1,
    why: "Column letter first, then row number. The fourth column is D, so D9.",
    trap: "Writing 9D. Excel will reject it, but the same habit shows up later as ranges written back to front, which Excel silently accepts."
  },
  {
    c: "m1.address", t: "mc",
    q: "Column Z is the twenty-sixth column. What is the twenty-seventh called?",
    opts: ["A1", "ZA", "AA", "Z1"],
    a: 2,
    why: "After Z the letters double up: AA, AB, AC, through to ZZ, then AAA. Wide exports from other systems reach column BK or further without anything being wrong.",
    trap: "Assuming a sheet that reaches column AA is corrupted. It is just wide."
  },

  /* --- m1.range --- */
  {
    c: "m1.range", t: "type",
    q: "Headings are in row 1. Amounts run down column D from row 2 to row 40. Write the range that holds the amounts, and nothing else.",
    accept: ["D2:D40", "$D$2:$D$40"],
    model: "D2:D40",
    why: "Top-left cell, colon, bottom-right cell. Row 1 is a heading, not an amount, so it is excluded.",
    trap: "Writing D1:D40 and pulling the heading in. In Module 2 that makes COUNT report 39 amounts when there are 39, but makes COUNTA report 40, and you will not know which one lied."
  },
  {
    c: "m1.range", t: "mc",
    q: "How many cells are in the range <span class='f'>B3:D6</span>?",
    opts: ["7", "12", "9", "10"],
    a: 1,
    why: "Three columns, B, C and D, by four rows, 3 to 6. Three times four is twelve.",
    trap: "Subtracting the corners and getting 3, or counting only one dimension. A range is a rectangle, so multiply."
  },

  /* --- m1.enter --- */
  {
    c: "m1.enter", t: "mc",
    q: "A cell contains a long supplier name with one letter wrong. You want to change that one letter without retyping the whole thing. What do you press?",
    opts: ["Enter", "F2", "Delete", "Ctrl and Z"],
    a: 1,
    why: "F2 puts the cursor inside the cell so you can edit the existing text. Double-clicking the cell does the same thing.",
    trap: "Selecting the cell and typing, which replaces everything. On a long value that is how a second typo gets introduced while fixing the first."
  },
  {
    c: "m1.enter", t: "mc",
    q: "You are filling a row of five figures across columns B to F. Which key moves you along the row as you type?",
    opts: ["Enter", "Tab", "Space", "The down arrow"],
    a: 1,
    why: "Tab moves right. Enter moves down. Useful detail: if you Tab across a row and then press Enter, you drop to the start of the next row rather than the last column, which makes entering a table quick.",
    trap: "Reaching for the mouse between every cell. It is the single biggest time cost for beginners."
  },

  /* --- m1.types --- */
  {
    c: "m1.types", t: "mc",
    q: "A column of amounts is right-aligned except for one value sitting on the left. What has happened to that value?",
    opts: ["It is formatted differently", "Excel is storing it as text, not a number", "It is negative", "It is a date"],
    a: 1,
    why: "Alignment is Excel reporting its decision. Right means it took the value as a number or date. Left means it took it as text, and text is skipped by every sum.",
    trap: "Assuming it is a display quirk and moving on. That single cell will quietly falsify a total."
  },
  {
    c: "m1.types", t: "mc",
    q: "Which of these is the fastest reliable way to check whether a cell holds a real number?",
    opts: ["Look at whether it has decimal places", "Look at which side of the cell it sits on", "Check the column width", "Check the font"],
    a: 1,
    why: "Left is text, right is a number or date. It takes about two seconds and needs no formulas.",
    trap: "Trusting how it looks. A number stored as text looks completely normal."
  },

  /* --- m1.textnum --- */
  {
    c: "m1.textnum", t: "mc",
    q: "A column of twenty amounts includes three that Excel is storing as text. You total the column. What happens?",
    opts: ["The total shows #VALUE!", "The total is correct", "The total silently leaves out those three", "Excel refuses to calculate"],
    a: 2,
    why: "SUM ignores text inside a range without complaining. The total is wrong and nothing on screen indicates it. That silence is what makes this the most expensive beginner mistake.",
    trap: "Expecting an error message. Excel only errors when it cannot proceed, and here it proceeds happily."
  },
  {
    c: "m1.textnum", t: "mc",
    q: "You need to store the sort code 04-17-22 and the account reference 0417. Which is the right approach?",
    opts: ["Store both as plain numbers", "Store both as text, on purpose", "Store the sort code as a date", "Store the reference as a number and the sort code as text"],
    a: 1,
    why: "Neither will ever be added up, and both would lose their leading zero as numbers. Codes and identifiers are text by nature. Start the entry with an apostrophe to force it.",
    trap: "Letting Excel take 0417 as a number, which gives 417. In a compliance context a mangled account number is a real incident, not a cosmetic problem."
  },

  /* --- m1.dateserial --- */
  {
    c: "m1.dateserial", t: "mc",
    q: "A cell that showed 01/03/2024 suddenly displays 45352. What has gone wrong?",
    opts: ["The data is corrupted", "Nothing: that is the number Excel always stored, now shown without a date format", "The date was entered incorrectly", "Excel has converted it to a serial number"],
    a: 1,
    why: "Excel always stored 45352. A date format was drawn over the top of it, and that format has been removed. Reapply a date format and it reads normally again.",
    trap: "Retyping the date, or worse, deleting the row. Nothing was lost."
  },
  {
    c: "m1.dateserial", t: "pred",
    q: "Two cells hold real dates: A1 is 10 March 2024 and A2 is 1 March 2024. What does this return?",
    formula: "=A1-A2",
    opts: ["#VALUE!", "9", "A date in 1900", "0.09"],
    a: 1,
    why: "Dates are day counts, so subtracting them gives a number of days. Nine days separate the first of March from the tenth.",
    trap: "Expecting an error because they look like text. Try this on two dates that are actually stored as text and you will get #VALUE!, which is the difference this whole session is about."
  },

  /* --- m1.format --- */
  {
    c: "m1.format", t: "mc",
    q: "Three cells hold 10.4, 10.3 and 10.4, formatted to show no decimal places. The screen shows 10, 10, 10 and the total shows 31. Why?",
    opts: ["The total is broken", "Formatting changed the display but not the stored values, and 10.4 plus 10.3 plus 10.4 is 31.1", "One value is text", "Excel rounded the total incorrectly"],
    a: 1,
    why: "Format changes the costume, never the value. Every calculation uses the stored number. If you need the stored value rounded rather than just displayed rounded, use the ROUND function.",
    trap: "Reporting the visible figures and being asked why they do not add up. This is a very common way to lose credibility with a number."
  },
  {
    c: "m1.format", t: "mc",
    q: "A cell holds the text \"1250\" and you apply a currency format to it. What happens?",
    opts: ["It becomes a number showing £1,250.00", "It stays text and the format does nothing useful", "It shows #VALUE!", "It becomes a date"],
    a: 1,
    why: "Formatting never changes what is stored. A text cell formatted as currency is still text, and still skipped by sums. The value has to be re-entered as a number.",
    trap: "Applying a format and assuming the underlying problem is fixed. This is the most common failed repair in Excel."
  },

  /* --- m1.freeze --- */
  {
    c: "m1.freeze", t: "mc",
    q: "You want row 1 and column A both to stay visible while you scroll a large sheet. Which cell do you select before choosing Freeze Panes?",
    opts: ["A1", "B2", "A2", "B1"],
    a: 1,
    why: "Freeze Panes pins everything above and to the left of the selected cell. Selecting B2 pins row 1 and column A together.",
    trap: "Selecting A1, which pins nothing because there is nothing above or to the left of it."
  },

  /* --- m1.sort --- */
  {
    c: "m1.sort", t: "mc",
    q: "What should you select before sorting a block of data?",
    opts: ["The column you want to sort by", "One single cell anywhere inside the data", "The whole sheet", "The heading row"],
    a: 1,
    why: "With one cell selected, Excel works out the extent of the block itself and moves whole rows. Selecting a single column invites the worst error in this module.",
    trap: "Selecting the column you want sorted, which feels like the obvious thing to do and is exactly what scrambles the file."
  },

  /* --- m1.sorttrap --- */
  {
    c: "m1.sorttrap", t: "mc",
    q: "You select only the Amount column and sort it largest to smallest. What is the result?",
    opts: ["Excel refuses", "The whole table reorders correctly", "The amounts reorder and every other column stays put, so rows no longer match", "Only the visible rows change"],
    a: 2,
    why: "Sorting a lone column reorders that column alone. Amounts are now attached to the wrong suppliers, dates and references, with nothing on screen to show it. Undo immediately if you catch it; if you have saved and closed, the data is gone.",
    trap: "Assuming Excel will protect you. It sometimes prompts to expand the selection, and it sometimes does not."
  },

  /* --- m1.filter --- */
  {
    c: "m1.filter", t: "mc",
    q: "What is the difference between filtering and deleting rows you do not want?",
    opts: ["No real difference", "Filtering hides rows and is reversible; deleting destroys them", "Filtering is slower", "Filtering only works on numbers"],
    a: 1,
    why: "Filtering is for looking, and can be cleared at any time. Sorting and deleting change the file. When you are exploring data, reach for the reversible tool.",
    trap: "Deleting rows to isolate a group, then needing the full set again an hour later."
  },
  {
    c: "m1.filter", t: "mc",
    q: "You glance at a sheet, read a total off it, and put it in a report. What should you have checked first?",
    opts: ["The font size", "Whether the row numbers skip, which means a filter is on", "The file name", "The column widths"],
    a: 1,
    why: "Blue, skipping row numbers mean rows are hidden and you are looking at a subset. Quoting a filtered figure as a full total is one of the easiest ways to publish a wrong number.",
    trap: "Forgetting a filter you applied twenty minutes earlier. Everyone does it once."
  }
]);
