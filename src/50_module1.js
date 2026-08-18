/* ============================================================
   Module 1: The grid
   Three sessions. No formulas yet, deliberately: almost every
   formula problem a beginner has is really a problem with where
   the data is or what type Excel thinks it is.
   ============================================================ */

/* ---------- shared data generator ---------- */
const CAFE_ITEMS = [
  { name: "Flat white", price: 3.20 },
  { name: "Cappuccino", price: 3.40 },
  { name: "Filter coffee", price: 2.50 },
  { name: "English breakfast tea", price: 2.30 },
  { name: "Almond croissant", price: 3.10 },
  { name: "Bacon roll", price: 4.75 },
  { name: "Porridge", price: 3.60 }
];

function cafeData(seed) {
  const r = rng(seed);
  return CAFE_ITEMS.map(it => ({
    name: it.name,
    price: it.price,
    sold: rInt(r, 8, 46)
  }));
}

/* ============================================================
   Session 1
   ============================================================ */
const M1S1 = {
  title: "Cells, and the address system everything depends on",
  aim: "Learn how Excel names every cell, and get comfortable putting things in the right one.",
  why: "Every formula you will ever write is an instruction about <em>where</em> to look. If the addresses are vague in your head, every later module is guesswork. This is the cheapest hour you will spend on Excel.",
  concepts: ["m1.grid", "m1.address", "m1.range", "m1.enter"],
  unlocks: [],
  lesson: [
    { lead: "A spreadsheet is a filing cabinet with a very strict address system." },
    { p: "The file you open is a <strong>workbook</strong>. Inside it are <strong>sheets</strong>, shown as tabs along the bottom. Each sheet is a grid of <strong>cells</strong>. That is the whole structure. Everything else is decoration on top of it." },
    { h: "How cells are named" },
    { p: "Columns run across the top and are lettered: A, B, C, and after Z it carries on AA, AB, AC. Rows run down the side and are numbered: 1, 2, 3. A cell's name is its column letter followed by its row number, always in that order. The cell in column C, row 4 is <span class='f'>C4</span>. Never <span class='f'>4C</span>." },
    { p: "You will see this called a cell <strong>reference</strong> or a cell <strong>address</strong>. They mean the same thing." },
    { why: "The address is not a label someone chose. It is a coordinate, which is why Excel can shift a formula sideways or downwards and have it still make sense. Module 2 depends entirely on this." },
    { h: "Ranges: talking about a block of cells" },
    { p: "A range is written as the top-left cell, a colon, then the bottom-right cell. So <span class='f'>B2:B9</span> is the eight cells running down column B from row 2 to row 9. <span class='f'>A1:C9</span> is the whole rectangle three columns wide and nine rows deep." },
    { p: "The colon means <em>through to</em>. That is all it does." },
    {
      table: {
        cols: ["A", "B", "C"], startRow: 1,
        rows: [["Item", "Sold", "Price"], ["Flat white", 22, 3.2], ["Cappuccino", 17, 3.4], ["Filter coffee", 9, 2.5]]
      }
    },
    { p: "In the table above: <span class='f'>A1</span> holds Item. <span class='f'>B3</span> holds 17. The prices sit in <span class='f'>C2:C4</span>. The whole block including the headings is <span class='f'>A1:C4</span>." },
    { trap: "Beginners often say the prices are in <span class='f'>C1:C4</span> because they count the heading as part of the data. It is not. A heading is a label; the data is the numbers underneath. Getting this wrong is what makes a SUM come out slightly off in Module 2, and it is a maddening error to find." },
    { h: "Putting something in a cell" },
    { p: "Click the cell once to select it. It gets a border. Now type, and press <kbd>Enter</kbd>. Typing replaces whatever was there; it does not add to it." },
    { p: "To change part of what is already in a cell rather than replace all of it, press <kbd>F2</kbd> or double-click the cell. Now the cursor sits inside the text and you can edit it like a sentence. <kbd>Escape</kbd> abandons the edit and leaves the cell as it was." },
    {
      steps: [
        "Click any empty cell once, say <span class='f'>D10</span>. The address box near the top-left now reads D10.",
        "Type <span class='f'>14</span> and press <kbd>Enter</kbd>. The selection drops to D11.",
        "Click back on <span class='f'>D10</span> and press <kbd>F2</kbd>. The cursor is now inside the cell, at the end of the 14.",
        "Press <kbd>Escape</kbd>. Nothing has changed. This is the safe way to look inside a cell without breaking it.",
        "Press <kbd>Delete</kbd> to empty it again."
      ]
    },
    { pro: "Press <kbd>Enter</kbd> to move down and <kbd>Tab</kbd> to move right. Nobody who works in Excel all day reaches for the mouse to move one cell. When you fill a row of figures, Tab across it, and the Enter at the end drops you back to the start of the next row." },
    { h: "Moving around a large sheet" },
    { p: "Two shortcuts save more time than everything else combined:" },
    {
      ul: [
        "<kbd>Ctrl</kbd> + an arrow key jumps to the last filled cell in that direction. On a sheet of 40,000 rows, <kbd>Ctrl</kbd>+<kbd>↓</kbd> reaches the bottom instantly.",
        "<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + an arrow key does the same but <em>selects</em> everything on the way. This is how you select a whole column of data without dragging.",
        "<kbd>Ctrl</kbd> + <kbd>Z</kbd> undoes. <kbd>Ctrl</kbd> + <kbd>F</kbd> finds."
      ]
    },
    { trap: "<kbd>Ctrl</kbd>+arrow stops at the first blank cell. If your data has a gap in the middle of a column, it stops there rather than at the true bottom, and you can select half your data without noticing. Blank cells inside a data block cause more silent errors in Excel than almost anything else." },
    { web: "All of this is identical in Excel for the web. The one difference: <kbd>Ctrl</kbd>+<kbd>F</kbd> may be caught by your browser's own find. If it is, use the <span class='f'>Search</span> box at the top of the Excel window instead." }
  ],
  reflect: [
    "Say out loud where the prices live in the practice sheet, as a range. If you hesitated, that is the bit to redo.",
    "Next time you open the practice grid, try moving with <kbd>Tab</kbd> and <kbd>Enter</kbd> only, no mouse."
  ],

  practice: function (seed) {
    const data = cafeData(seed);
    /* Sheet rows: heading on row 1, so item i sits on row i + 2.
       English breakfast tea is item 3 (row 5), almond croissant item 4
       (row 6), porridge item 6 (row 8). */
    const missing1 = data[4].sold;   // almond croissant, sheet row 6
    const missing2 = data[6].sold;   // porridge, sheet row 8

    const sh = new Sheet("Monday", 12, 5);
    sh.writeTable(0, 0, ["Item", "Sold", "Price"],
      data.map(d => [d.name, d.sold, d.price]), [null, null, "£#,##0.00"]);

    /* the three flaws the learner has to fix */
    sh.set(4, 0, "Enlgish breakfast tea");   // A5 typo
    sh.clearCell(5, 1);                      // B6 quantity missing
    sh.clearCell(7, 1);                      // B8 quantity missing

    /* lock the data, leaving only the misspelled name editable */
    for (let r = 0; r <= 7; r++) for (let c = 0; c <= 2; c++) {
      const cell = sh.cell(r, c);
      if (cell) cell.locked = !(r === 4 && c === 0);
    }

    /* the answer column */
    sh.set(0, 3, "#", { hdr: true, locked: true });
    sh.set(0, 4, "Your answer", { hdr: true, locked: true });
    ["Q1", "Q2", "Q3", "Q4"].forEach((q, i) => sh.set(1 + i, 3, q, { locked: true }));
    sh.rows = 12; sh.cols = 5;

    return {
      sheet: sh,
      maxRows: 12, maxCols: 5, startRow: 5, startCol: 1, formatBar: false,
      brief: {
        title: "Sunrise Cafe, Monday takings",
        body: "The sheet below came off the till, and two quantities did not print. The till roll says <strong>" +
          missing1 + " almond croissants</strong> and <strong>" + missing2 + " porridges</strong> were sold. " +
          "There is also a spelling mistake in the item list. Fix all three, then answer the four address questions in column F."
      },
      hint: "Amber cells are the ones to fill. The grey cells are locked data, apart from the one name you are asked to correct.",
      tasks: [
        { id: "t1", text: "Enter the missing almond croissant quantity: <strong>" + missing1 + "</strong>.", cell: "B6" },
        { id: "t2", text: "Enter the missing porridge quantity: <strong>" + missing2 + "</strong>.", cell: "B8" },
        { id: "t3", text: "One item name is misspelled. Select it, press <kbd>F2</kbd>, and correct it to <strong>English breakfast tea</strong>.", cell: "A5" },
        { id: "t4", text: "<strong>Q1.</strong> In E2, type the range that holds every item name, headings excluded.", cell: "E2" },
        { id: "t5", text: "<strong>Q2.</strong> In E3, type the range that holds every price, headings excluded.", cell: "E3" },
        { id: "t6", text: "<strong>Q3.</strong> In E4, type the address of the single cell holding the price of porridge.", cell: "E4" },
        { id: "t7", text: "<strong>Q4.</strong> In E5, type the range covering the whole block including the headings.", cell: "E5", ext: true }
      ],
      checks: [
        {
          cell: "B6", expect: missing1, expectType: "number",
          task: "Enter the missing almond croissant quantity.",
          answer: String(missing1),
          why: "A quantity is a count of things, so it belongs in the sheet as a plain number with nothing else typed alongside it.",
          wrongWay: "Typing <span class='f'>" + missing1 + " sold</span> looks clearer to a human and is useless to Excel. The moment a number shares a cell with a word, the cell is text and no sum will ever include it."
        },
        {
          cell: "B8", expect: missing2, expectType: "number",
          task: "Enter the missing porridge quantity.",
          answer: String(missing2),
          why: "Same rule. One fact per cell.",
          wrongWay: "Adding a note in the same cell, or leaving it blank and writing the figure in the margin. Both defeat the point of a spreadsheet."
        },
        {
          cell: "A5", expect: "English breakfast tea",
          task: "Correct the misspelled item name.",
          answer: "English breakfast tea",
          why: "You could retype the whole thing, but <kbd>F2</kbd> puts the cursor inside the existing text so you only change the broken letters. On a long value, retyping is where new typos come from.",
          wrongWay: "Double-clicking and then typing without clicking into position, which replaces the lot."
        },
        {
          cell: "E2", expect: ["A2:A8"],
          task: "The range holding every item name.",
          answer: "A2:A8",
          why: "The names run down column A from row 2 to row 8. Row 1 is the heading, so it is not part of the data.",
          wrongWay: "<span class='f'>A1:A8</span>, which swallows the heading. In Module 2 that turns a COUNT of 7 items into a COUNT of 8."
        },
        {
          cell: "E3", expect: ["C2:C8"],
          task: "The range holding every price.",
          answer: "C2:C8",
          why: "Same rows, different column. Prices are in C.",
          wrongWay: "<span class='f'>C2:C9</span>. Row 9 is empty, and a range that reaches past your data is how blank rows creep into totals later."
        },
        {
          cell: "E4", expect: ["C8"],
          task: "The single cell holding the price of porridge.",
          answer: "C8",
          why: "Porridge is the seventh item, so it is on row 8 because row 1 is the heading. The price column is C.",
          wrongWay: "<span class='f'>C7</span>, from counting the items rather than reading the row number off the side of the sheet. Read the row number. Always."
        },
        {
          cell: "E5", ext: true, expect: ["A1:C8"],
          task: "The whole block including the headings.",
          answer: "A1:C8",
          why: "Top-left cell, colon, bottom-right cell. Here the headings <em>are</em> wanted, because this is the range you would hand to a sort, a filter or a pivot table, all of which need to know the column names.",
          wrongWay: "<span class='f'>A1:C9</span> or <span class='f'>A2:C8</span>. The first includes an empty row, the second loses the headings that sorting and filtering rely on."
        }
      ]
    };
  },

  workbook: function (seed) {
    const wb = new Workbook("M1S1");
    wb.add(M1S1.practice(seed).sheet);
    return wb;
  }
};

/* ============================================================
   Session 2
   ============================================================ */
const M1S2 = {
  title: "What Excel thinks your data is",
  aim: "Tell numbers, text and dates apart on sight, and stop Excel quietly changing your data behind your back.",
  why: "Roughly half of all beginner Excel problems are one problem wearing different hats: a number that Excel is storing as text. Once you can spot it in two seconds, that half disappears.",
  concepts: ["m1.types", "m1.textnum", "m1.dateserial", "m1.format"],
  unlocks: [],
  lesson: [
    { lead: "Excel decides what your data is the moment you press Enter, and it does not ask." },
    { p: "Every cell holds one of four things: a number, some text, a date or time, or a TRUE/FALSE value. Dates are really numbers in disguise, which is covered below. What matters is that Excel guesses which one you meant, and it guesses the instant you finish typing." },
    { h: "The two-second test" },
    { p: "Type something into a blank cell and look at where it lands." },
    {
      ul: [
        "It sticks to the <strong>right</strong> of the cell: Excel took it as a number or a date.",
        "It sticks to the <strong>left</strong>: Excel took it as text."
      ]
    },
    { p: "That is the whole test. No menus, no functions. A column of figures where one value hugs the left edge has one broken value, and you have just found it by looking." },
    { why: "The alignment is not a style choice. It is Excel showing you its decision. Right-aligned means it believes the value can be added up; left-aligned means it believes the value is a label. When you later override alignment for looks, you blind yourself to this, which is why professionals leave number alignment alone." },
    { h: "How numbers become text without you asking" },
    {
      ul: [
        "A space anywhere in the cell. <span class='f'>1250 </span> with a trailing space is text.",
        "A stray letter or symbol typed alongside, such as <span class='f'>1250 units</span> or <span class='f'>approx 1250</span>.",
        "Data pasted or imported from a website, a PDF or a bank statement. This is the usual culprit, and it usually arrives with invisible spaces.",
        "A leading apostrophe, as in <span class='f'>'0123</span>. This one is deliberate: it tells Excel to keep the value exactly as typed. It is the correct way to store a sort code, a phone number or any code with a leading zero."
      ]
    },
    { trap: "A number stored as text does not error. It sits there looking perfectly normal, and SUM silently skips it. Your total is wrong and nothing on screen says so. This is the single most expensive habit-forming mistake in Excel, and the reason this module comes before formulas." },
    { h: "Dates are numbers wearing a costume" },
    { p: "Excel stores a date as a count of days since 31 December 1899. <span class='f'>1</span> is 1 January 1900. <span class='f'>45352</span> is 1 March 2024. What you see on screen is only a format laid over that number." },
    { p: "This sounds like trivia until you need it. It is why you can subtract one date from another and get a sensible number of days. It is also why a date sometimes suddenly displays as <span class='f'>45352</span>: nothing broke, the costume just came off." },
    { f: "=DATE(2024,3,10) - DATE(2024,3,1)      gives 9" },
    { web: "Excel for the web reads dates using the region set on your Microsoft account. If yours is set to the United States, typing <span class='f'>03/04/2024</span> gives 4 March, not 3 April. Check it once under your account settings and save yourself a genuinely nasty class of error. When in doubt, type <span class='f'>2024-04-03</span>, which is unambiguous everywhere." },
    { h: "Formatting changes the costume, not the value" },
    { p: "Formatting is how a value is displayed. It never changes what is stored. Format <span class='f'>3.14159</span> to two decimal places and the cell shows <span class='f'>3.14</span>, but the cell still contains 3.14159 and every calculation still uses 3.14159." },
    { trap: "This catches people out constantly. A column formatted to zero decimal places can show 10, 10, 10 and total 31, because the real values are 10.4, 10.3 and 10.4. Nothing is broken. The display is rounded and the maths is not. If you need the stored value rounded, you need the ROUND function, which arrives in Module 2." },
    { pro: "Format for the reader at the end, not while you work. Store money as a plain number and apply a currency format on top. Never type <span class='f'>£3.20</span> as text into a cell, and never type the pound sign yourself if you can format it instead." },
    { web: "In Excel for the web the number formats sit on the Home tab: <span class='path'><span>Home</span></span> then the drop-down that reads General, plus the quick buttons for currency, percent and comma. In the practice grid below you get the same choices as buttons above the sheet." }
  ],
  reflect: [
    "Look at any spreadsheet you already have. Scan one numeric column for a value hugging the left edge.",
    "If you handle sort codes or reference numbers with leading zeros, decide now that they are text, on purpose, with an apostrophe."
  ],

  practice: function (seed) {
    const r = rng(seed);
    const sh = new Sheet("Invoices", 14, 8);
    const suppliers = ["Redgate Supplies", "Halden & Co", "Northwood Ltd", "Peak Trading", "Mersey Print"];
    const amounts = [];
    for (let i = 0; i < 5; i++) amounts.push(xround(rInt(r, 4200, 98000) / 100, 2));

    sh.set(0, 0, "Invoice", { hdr: true, locked: true });
    sh.set(0, 1, "Supplier", { hdr: true, locked: true });
    sh.set(0, 2, "Date received", { hdr: true, locked: true });
    sh.set(0, 3, "Amount", { hdr: true, locked: true });
    sh.set(0, 4, "Ref code", { hdr: true, locked: true });

    for (let i = 0; i < 5; i++) {
      sh.set(1 + i, 0, "INV-" + (2040 + i), { locked: true });
      sh.set(1 + i, 1, suppliers[i], { locked: true });
    }
    /* row 2 and 4 arrive from the supplier portal as text; the rest are clean */
    sh.set(1, 2, 45352, { fmt: "dd/mm/yyyy", locked: true });
    sh.set(2, 2, "17/03/2024");                 // text date, to be fixed
    sh.set(3, 2, 45383, { fmt: "dd/mm/yyyy", locked: true });
    sh.set(4, 2, "02/04/2024");                 // text date, to be fixed
    sh.set(5, 2, 45400, { fmt: "dd/mm/yyyy", locked: true });

    sh.set(1, 3, amounts[0], { locked: true });
    sh.set(2, 3, String(amounts[1]) + " ");     // number as text, trailing space
    sh.set(3, 3, amounts[2], { locked: true });
    sh.set(4, 3, amounts[3], { locked: true });
    sh.set(5, 3, "£" + amounts[4].toFixed(2));  // number as text, typed pound sign

    sh.set(0, 5, "Day count behind C3", { hdr: true, locked: true });
    sh.rows = 12; sh.cols = 6;

    return {
      sheet: sh,
      maxRows: 11, maxCols: 6, startRow: 2, startCol: 2, formatBar: true,
      brief: {
        title: "Five invoices, three of them broken",
        body: "This came out of a supplier portal. Three cells look fine and are not: Excel is storing them as text. " +
          "Find them by looking at which side of the cell each value sits on, then retype them so they are stored properly. " +
          "After that, format the amounts as pounds and the dates as dates, and put a reference code in E2 that keeps its leading zero."
      },
      hint: "Values on the <strong>left</strong> of a cell are text. Values on the <strong>right</strong> are numbers or dates. Use the Format buttons above the grid for the formatting tasks.",
      tasks: [
        { id: "t1", text: "C3 holds a date stored as text. Retype it as a real date.", cell: "C3" },
        { id: "t2", text: "C5 holds a date stored as text. Retype it as a real date.", cell: "C5" },
        { id: "t3", text: "D3 holds an amount stored as text, because of a trailing space. Retype it as a plain number.", cell: "D3" },
        { id: "t4", text: "D6 holds an amount stored as text, because a pound sign was typed into the cell. Retype it as a plain number, then format it as currency.", cell: "D6" },
        { id: "t5", text: "Format C3 as a date so it matches the others.", cell: "C3" },
        { id: "t6", text: "In E2, enter the reference code <strong>0417</strong> so that the leading zero survives.", cell: "E2" },
        { id: "t7", text: "Select C3 and press the <strong>General</strong> format button. A number appears: that is the day count Excel stores. Type it into F2, then put C3 back to <strong>Date</strong>.", cell: "F2", ext: true }
      ],
      checks: [
        {
          cell: "C3", expect: 45368, expectType: "date", expectFmt: "date",
          task: "C3: a date stored as text, made into a real date.",
          answer: "17/03/2024   (stored as 45368)",
          why: "Once it is a real date, Excel can sort it into order, subtract it from another date, and group it by month in a pivot table. As text it can do none of those, and it will sort 17/03 before 02/04 because text sorts character by character.",
          wrongWay: "Formatting the cell as a date without retyping the value. Formatting only changes the costume; a text value stays text no matter what format you put on it. You have to re-enter it."
        },
        {
          cell: "C5", expect: 45384, expectType: "date", expectFmt: "date",
          task: "C5: a date stored as text, made into a real date.",
          answer: "02/04/2024   (stored as 45384)",
          why: "Same reasoning. Note the stored numbers: 45368 and 45384 are 16 days apart, which is exactly the gap between the two dates. That is the day-count system doing its job.",
          wrongWay: "Typing <span class='f'>2 April</span> without a year. Excel will fill in the current year silently, and your 2024 invoice quietly becomes a " + new Date().getFullYear() + " one."
        },
        {
          cell: "D3", expect: amounts[1], expectType: "number",
          task: "D3: an amount stored as text because of a trailing space.",
          answer: amounts[1].toFixed(2) + "   retyped with no space",
          why: "A trailing space is invisible and completely disabling. The cell looks like a number, sits on the left, and is skipped by every sum. Retyping is the fix here; in Module 4 you will meet TRIM, which fixes hundreds of these at once.",
          wrongWay: "Widening the column, or clicking around looking for the problem. The space cannot be seen. Trust the alignment instead of your eyes."
        },
        {
          cell: "D6", expect: amounts[4], expectType: "number", expectFmt: "currency",
          task: "D6: an amount with a typed pound sign, made into a formatted number.",
          answer: amounts[4].toFixed(2) + "   typed plainly, then the £ format applied",
          why: "The pound sign belongs to the display, not the data. Store 843.10 and format it to show £843.10. Then it adds up, sorts correctly, and still reads as money.",
          wrongWay: "Typing <span class='f'>£843.10</span> straight into the cell. Excel for the web will sometimes accept that and convert it, and sometimes leave it as text depending on how it was pasted. Do not rely on it guessing right."
        },
        {
          cell: "E2", expect: "0417", expectType: "text",
          task: "E2: a reference code that keeps its leading zero.",
          answer: "'0417   (type an apostrophe first)",
          why: "This is the one time you <em>want</em> text. A reference code is not a quantity; nobody will ever add two of them together. The leading zero is part of its identity, so tell Excel to keep the value exactly as typed by starting with an apostrophe. The apostrophe itself is not stored.",
          wrongWay: "Typing <span class='f'>0417</span> plainly, which gives 417 and loses the zero. Sort codes, phone numbers, postcodes and account numbers all belong in this category, and losing leading zeros from account numbers is a genuine incident in a compliance team."
        },
        {
          cell: "F2", ext: true, expect: 45368,
          task: "F2: the day count Excel stores behind the date in C3.",
          answer: "45368",
          why: "17 March 2024 is 45,368 days after 31 December 1899. Seeing the number with your own eyes is the point: the date was never a piece of text that happened to look like a date, it was always this number wearing a format. That is why date arithmetic works, and why a date can suddenly appear as a five-digit number when a format is lost.",
          wrongWay: "Typing the date again, or a made-up number. If you did not press General and read it off the cell, you skipped the only part of this task that teaches anything."
        }
      ]
    };
  },
  workbook: function (seed) {
    const p = M1S2.practice(seed);
    const wb = new Workbook("M1S2");
    wb.add(p.sheet);
    return wb;
  }
};

/* ============================================================
   Session 3
   ============================================================ */
const M1S3 = {
  title: "Making a long sheet usable: freeze, sort, filter",
  aim: "Handle a sheet too long to see at once, and sort it without destroying it.",
  why: "The first time you open a file with 4,000 rows, the headings scroll away and you lose track of which column is which. These three tools are what turn an unreadable sheet into a workable one, and one of them can silently corrupt your data if you use it carelessly.",
  concepts: ["m1.freeze", "m1.sort", "m1.sorttrap", "m1.filter"],
  unlocks: [],
  lesson: [
    { lead: "Scrolling past the headings is the moment a spreadsheet stops making sense." },
    { h: "Freeze panes" },
    { p: "Freezing pins rows or columns in place so they stay visible while the rest scrolls. Almost always you want the top row pinned, because that is where the headings are." },
    { path: ["View", "Freeze Panes", "Freeze Top Row"] },
    { p: "To pin something other than just the first row, select the cell <em>below and to the right</em> of everything you want kept, then choose <span class='f'>Freeze Panes</span>. Selecting B2 and freezing pins row 1 and column A together." },
    { pro: "Freeze the top row on every sheet you expect to work in for more than five minutes. It costs one click and it prevents the specific mistake of reading a figure off the wrong column." },
    { h: "Sorting, and the mistake that ruins the file" },
    { p: "Sorting reorders rows. That is the important word: <strong>rows</strong>. Each row is one record, one invoice, one transaction, and the values across it belong together." },
    { trap: "If you select a single column and sort it, Excel reorders that column alone and leaves every other column where it was. Every row is now scrambled: the right amounts against the wrong customers. Nothing turns red. Nothing warns you. The file is quietly ruined, and unless you notice immediately, the undo history is your only way back." },
    { p: "Excel for the web will often show a prompt asking whether to expand the selection. Read it and choose to expand. But do not depend on the prompt, because it does not always appear." },
    { p: "The safe habit: click any single cell inside the data first, then sort. With one cell selected, Excel works out the full block for itself and moves whole rows." },
    { path: ["Home", "Sort & Filter", "Custom Sort"] },
    {
      steps: [
        "Click any one cell inside the data. Not a whole column, not a whole row. One cell.",
        "Go to <span class='path'><span>Home</span><i>›</i><span>Sort &amp; Filter</span><i>›</i><span>Custom Sort</span></span>.",
        "Tick <span class='f'>My data has headers</span> if it is not already ticked. This stops your heading row being sorted into the middle of the data.",
        "Choose the column to sort by, and the order.",
        "Check the result against something you know. If the top row was Redgate Supplies at £980 before, it should still be Redgate Supplies at £980 now, just in a different position."
      ]
    },
    { why: "Sorting by more than one column is where it gets useful: sort by supplier, then by date within each supplier. Excel calls the second one a level. It is the same idea as a contacts list ordered by surname and then by first name." },
    { h: "Filtering" },
    { p: "Filtering hides rows that do not match, without deleting anything. Turn it on and each heading gets a small arrow; click one and tick the values you want to keep." },
    { path: ["Home", "Sort & Filter", "Filter"] },
    { p: "Filtering is non-destructive and reversible, which makes it the right tool for looking. Sorting rearranges the file permanently, which makes it the tool for organising. Reach for filter first when you are exploring." },
    { pro: "Two things every filter gives you for free. First, the row numbers down the side turn blue and skip, which is how you know a filter is on and you are not looking at everything. Second, the status bar shows how many rows matched, which is a count you did not have to write a formula for." },
    { trap: "The most common filter error is forgetting it is on, then reading a total off the sheet and reporting it as the whole picture. Before quoting any figure, look at the row numbers. If they skip, you are looking at a subset." },
    { web: "Freeze, sort and filter all work in Excel for the web and sit in the same places as the desktop version. Desktop adds a few refinements, including sorting by cell colour and reusing a custom sort order, which you will not miss." }
  ],
  reflect: [
    "Say in one sentence why sorting a single column is dangerous. If it takes more than one sentence, reread that section.",
    "Before you quote a number off a filtered sheet, check whether the row numbers skip."
  ],

  practice: function (seed) {
    const r = rng(seed);
    const sh = new Sheet("Transactions", 30, 8);
    const names = ["Redgate Supplies", "Halden & Co", "Northwood Ltd", "Peak Trading", "Mersey Print", "Calder Foods", "Ashby Motors"];
    const cities = ["Leeds", "London", "Bristol", "Leeds", "Manchester", "London", "Leeds"];
    const rows = [];
    for (let i = 0; i < 18; i++) {
      const s = i % 7;
      rows.push([
        "TX-" + (5100 + i),
        names[s],
        cities[s],
        45352 + rInt(r, 0, 40),
        xround(rInt(r, 1500, 240000) / 100, 2)
      ]);
    }
    sh.writeTable(0, 0, ["Ref", "Supplier", "City", "Date", "Amount"], rows,
      [null, null, null, "dd/mm/yyyy", "£#,##0.00"]);
    for (let i = 0; i < 18; i++) for (let c = 0; c < 5; c++) { const cc = sh.cell(1 + i, c); if (cc) cc.locked = true; }

    sh.set(0, 5, "Your answer", { hdr: true, locked: true });
    sh.rows = 21; sh.cols = 6;

    /* answers derived from the same generated data, so they always agree */
    const leeds = rows.filter(x => x[2] === "Leeds");
    const biggest = rows.slice().sort((a, b) => b[4] - a[4])[0];
    const earliest = rows.slice().sort((a, b) => a[3] - b[3])[0];

    return {
      sheet: sh,
      maxRows: 21, maxCols: 6, startRow: 1, startCol: 5, formatBar: false,
      brief: {
        title: "Eighteen transactions, and three questions you can answer by looking",
        body: "No formulas in this one. Everything below can be answered by sorting and filtering, which is the point: " +
          "a great deal of real analysis is done by rearranging what you already have. " +
          "Work in the downloaded workbook if you want the real sort and filter menus, then type your answers in column G here."
      },
      hint: "The practice grid does not have Excel's sort and filter buttons. Do the sorting in the downloaded workbook, or read the answers off the grid by eye, then type them into the amber cells in column G.",
      tasks: [
        { id: "t1", text: "In the workbook, freeze the top row, then scroll. Confirm the headings stay put.", cell: null },
        { id: "t2", text: "Sort the whole block by Amount, largest first. In F2, type the <strong>Ref</strong> of the largest transaction.", cell: "F2" },
        { id: "t3", text: "Sort by Date, oldest first. In F3, type the <strong>Ref</strong> of the earliest transaction.", cell: "F3" },
        { id: "t4", text: "Filter City to Leeds only. In F4, type how many rows are showing.", cell: "F4" },
        { id: "t5", text: "In F5, type the name of the supplier with the single largest transaction.", cell: "F5", ext: true }
      ],
      checks: [
        {
          cell: "F2", expect: biggest[0],
          task: "Ref of the largest transaction.",
          answer: biggest[0] + "  at  " + gbp(biggest[4]),
          why: "Sorting by Amount descending puts it on the first data row. Do it by clicking one cell inside the block first, so whole rows move together and the Ref stays attached to its amount.",
          wrongWay: "Selecting only the Amount column and sorting it. The amounts reorder, the refs do not, and the answer you read off is a reference stapled to somebody else's figure."
        },
        {
          cell: "F3", expect: earliest[0],
          task: "Ref of the earliest transaction.",
          answer: earliest[0] + "  on  " + formatDate(earliest[3], "dd/mm/yyyy"),
          why: "This only works because the dates are stored as real dates. Sorted as text, 02/04/2024 would come before 17/03/2024, because text sorting compares the first character and 0 is less than 1. Module 1 session 2 is what makes this question answerable.",
          wrongWay: "Trusting a date sort without checking the dates are right-aligned first."
        },
        {
          cell: "F4", expect: leeds.length,
          task: "Number of rows showing when City is filtered to Leeds.",
          answer: String(leeds.length) + " rows",
          why: "Filtering hides the rest rather than deleting them. Excel shows the matching count in the status bar at the bottom, so you do not have to count by hand.",
          wrongWay: "Deleting the rows you do not want in order to count what is left. It works once and destroys the file. Filter, never delete."
        },
        {
          cell: "F5", ext: true, expect: biggest[1],
          task: "Supplier with the single largest transaction.",
          answer: biggest[1],
          why: "Same sort as the first question, read across instead of down. Notice that this is a different question from which supplier has the largest total, and the answer may differ. Keep the two apart, because confusing them is a classic reporting error.",
          wrongWay: "Answering with the supplier that appears most often, which is a count, not a size."
        }
      ]
    };
  },
  workbook: function (seed) {
    const p = M1S3.practice(seed);
    const wb = new Workbook("M1S3");
    wb.add(p.sheet);
    return wb;
  }
};

/* ============================================================
   Register the module
   ============================================================ */
defModule({
  id: "m1", n: 1, stage: "s1",
  title: "The grid",
  subtitle: "Cells, ranges, data types, sort and filter",
  blurb: "Before any formula, you need to know where things are and what Excel thinks they are. This module is short on theory and long on the two mistakes that cause most beginner errors: wrong ranges, and numbers stored as text.",
  onComplete: "You can now read a sheet the way Excel reads it. From here on, when a formula misbehaves, your first two questions are the ones this module taught: is my range right, and is this really a number.",
  concepts: [
    { id: "m1.grid", label: "Workbook, sheet, cell", blurb: "The structure a spreadsheet file actually has." },
    { id: "m1.address", label: "Cell addresses", blurb: "Column letter then row number, always in that order." },
    { id: "m1.range", label: "Ranges with a colon", blurb: "Top-left cell, colon, bottom-right cell." },
    { id: "m1.enter", label: "Entering and editing", blurb: "Enter, Tab, F2 and Escape." },
    { id: "m1.types", label: "Number, text or date", blurb: "The alignment test for what Excel stored." },
    { id: "m1.textnum", label: "Numbers stored as text", blurb: "Why a total can be wrong with nothing showing an error." },
    { id: "m1.dateserial", label: "Dates are numbers", blurb: "Days counted from 31 December 1899." },
    { id: "m1.format", label: "Format is not value", blurb: "Display changes; the stored number does not." },
    { id: "m1.freeze", label: "Freeze panes", blurb: "Keeping headings visible while you scroll." },
    { id: "m1.sort", label: "Sorting rows", blurb: "Select one cell inside the data, then sort." },
    { id: "m1.sorttrap", label: "The single-column sort trap", blurb: "How sorting silently scrambles a file." },
    { id: "m1.filter", label: "Filtering", blurb: "Hiding rows without deleting them." }
  ],
  sessions: [M1S1, M1S2, M1S3]
});
