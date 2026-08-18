# Gridwright

Excel and data analysis, from zero. Free, offline-capable, no account, no server,
no paid API.

A *wright* is someone who makes things by hand and by trade: a wheelwright, a
shipwright, a playwright. This is a course built the same way — almost no reading,
a great deal of doing.

**→ [salmanjey-hash.github.io/gridwright](https://salmanjey-hash.github.io/gridwright/)**

## How to use it

Open the link above, or download **`gridwright.html`** and double-click it. Either way
it is the same single file, and either way it works with no install and no account.
Your progress is saved in that browser and survives closing it.

Progress is stored per browser and per address, so the hosted version and a local copy
keep separate records. Pick one and stay with it, or move between them with
**Settings → Export progress**.

Back it up now and then with **Settings → Export progress**, which writes a small
`.json` file you can import on another machine or after clearing your browser data.

## What it is

Ten modules across three stages, 37 sessions, 204 questions.

| Stage | Modules | What you get out of it |
| --- | --- | --- |
| 1 | 1–7 | Write "proficient in Excel" on a CV honestly, and survive a practical test. |
| 2 | 8–9 | The same skills on synthetic financial-crime data: pattern detection, ranked findings, honest statistics. |
| 3 | 10 | Public datasets as evidence for writing you intend to publish. |

Each session is a warm-up quiz from memory, about five minutes of lesson, a long
stretch of practice, a self-check with worked reasoning, and a three-way honesty
rating that feeds a spaced-repetition queue.

Both Stage 1 and Stage 2 end in a capstone with a marking rubric, and finishing
Module 7 unlocks a timed twenty-minute interview drill that marks itself and tells
you which module the lost marks came from.

## How it teaches

- **Practice first.** Every session gives the same exercise twice over: a practice
  grid inside the page that marks your work and explains what went wrong, and a
  downloadable `.xlsx` for doing the identical task in real Excel.
- **A real formula engine.** The page evaluates what you type the way Excel does,
  including the awkward parts — `-2^2` is 4, `VLOOKUP` defaults to approximate
  match, `COUNTIF` takes wildcards, dates are 1900 serials.
- **A real pivot table.** Module 6 drives a working pivot with Excel's four field
  areas, value field settings and date grouping.
- **Messy data throughout.** Trailing spaces, inconsistent capitalisation, numbers
  stored as text, dates as text, near-duplicate identities, genuine gaps. Cleaning
  is not a bonus topic here; it is most of the job.
- **Spaced repetition.** Every concept is a Leitner card on 1, 3, 7, 16 and 35-day
  intervals. Missed days are never punished; coming back after a gap offers a short
  refresher built from your weakest cards.

Lessons target **Excel for the web**, so nothing depends on a licence. Where desktop
Excel does a job meaningfully better, it appears as a marked *"On desktop Excel,
faster"* aside rather than as the main instruction. Power Query is taught that way:
formulas first so the mechanism is understood, then the shortcut.

## What is in the folder

| File | What it is |
| --- | --- |
| `gridwright.html` | **The app.** The only file you need. |
| `src/` | The source, split into readable parts. |
| `build.py` | Concatenates `src/` into `gridwright.html`. Run `python build.py`. |
| `tests/` | Node test suite. Run `node tests/run.js`. |

The split is purely for editing comfort. The shipped file has no build step and no
dependencies.

## Built-in verification

A learning tool that teaches one wrong formula is worse than no tool, so nothing
ships unverified.

- `node tests/run.js` runs **358 checks**. Most assert real Excel behaviour against
  the formula engine: operator precedence, error propagation, reference shifting on
  fill, `COUNTIF` wildcards, 1900 date serials, Excel's comparison ordering.
- The same run rebuilds every practice sheet, types in **the exact answer formula
  the app prints for the learner**, fills it down the way you would, and confirms
  the checker accepts it. A wrong answer key, or one that breaks its own "use SUM"
  rule, fails the build. The generated interview drills are solved the same way.
- The app repeats a self-test in the browser on every load and logs the result to
  the console: `Gridwright self-test passed`.

## Offline behaviour

Two optional libraries load from cdnjs: SheetJS for `.xlsx` downloads and Chart.js
for the progress chart. Neither is required. With no internet the practice workbooks
download as `.csv` and the charts draw as inline SVG. **Settings → Offline and
libraries** shows which are loaded.

## A note on the data

Every dataset in the app is synthetic and generated from a seed, so regenerating an
exercise gives fresh numbers with an answer key computed from the same seed. Nothing
is real, and nothing is sensitive. The Stage 2 financial-crime material reproduces
the *shapes* of transaction monitoring, not any real institution's data. The Stage 3
capstone deliberately ships no data at all: you fetch a genuine public dataset
yourself, because that is the skill.

## Licence

MIT. Do what you like with it.
