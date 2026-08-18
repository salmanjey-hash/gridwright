/* ============================================================
   Leitner spaced repetition
   Boxes 1..5 with intervals 1, 3, 7, 16, 35 days.
   A correct answer promotes one box. A wrong answer drops to box 1,
   due again the same day. Box 6 means retired: mastered, still
   sampled occasionally so it does not rot.
   ============================================================ */
const LEITNER_INTERVALS = [0, 1, 3, 7, 16, 35, 90];

/* CONCEPTS is populated by the curriculum modules:
   { id, label, module, blurb } */
const CONCEPTS = {};
function defConcepts(moduleId, list) {
  list.forEach(c => { CONCEPTS[c.id] = Object.assign({ module: moduleId }, c); });
}

function card(id) {
  if (!S.cards[id]) S.cards[id] = { box: 0, due: todayISO(), seen: 0, right: 0, wrong: 0, last: null };
  return S.cards[id];
}
function cardExists(id) { return !!S.cards[id]; }

/* Introduce a concept the first time it is taught. */
function introduceConcept(id) {
  if (!CONCEPTS[id]) return;
  const c = card(id);
  if (c.box === 0) { c.box = 1; c.due = addDays(todayISO(), 1); }
}

/* Record an attempt. correct = true/false. Returns the updated card. */
function gradeCard(id, correct) {
  if (!CONCEPTS[id]) return null;
  const c = card(id);
  c.seen++;
  c.last = todayISO();
  if (correct) {
    c.right++;
    c.box = Math.min(6, Math.max(1, c.box) + 1);
  } else {
    c.wrong++;
    c.box = 1;
  }
  c.due = addDays(todayISO(), LEITNER_INTERVALS[c.box]);
  saveState();
  return c;
}

/* The three-way self-rating after a lesson feeds the same cards.
   3 = I got it, 2 = shaky, 1 = lost. */
function rateConcept(id, r) {
  if (!CONCEPTS[id]) return;
  const c = card(id);
  c.last = todayISO();
  if (r === 3) c.box = Math.min(6, Math.max(1, c.box) + 1);
  else if (r === 2) c.box = Math.max(1, c.box);
  else c.box = 1;
  c.due = addDays(todayISO(), LEITNER_INTERVALS[c.box]);
  saveState();
}

function dueCards(onDate) {
  const d = onDate || todayISO();
  return Object.keys(S.cards)
    .filter(id => CONCEPTS[id] && S.cards[id].box > 0 && S.cards[id].due <= d)
    .sort((a, b) => (S.cards[a].box - S.cards[b].box) || (S.cards[a].due < S.cards[b].due ? -1 : 1));
}
function dueCount() { return dueCards().length; }

/* Mastery 0..4 for the heat map: derived from box and accuracy. */
function mastery(id) {
  const c = S.cards[id];
  if (!c || c.box === 0) return 0;
  if (c.box >= 6) return 4;
  if (c.box >= 5) return 4;
  if (c.box >= 4) return 3;
  if (c.box >= 3) return 2;
  return 1;
}
/* Rank every concept you have met, weakest first. A low box always
   beats a low accuracy, because the box is what actually decides how
   soon you see it again. Concepts never quizzed sit in the middle
   rather than the top, so an unanswered card does not masquerade as a
   failed one. */
function weakest(n) {
  return Object.keys(S.cards)
    .filter(id => CONCEPTS[id] && S.cards[id].box > 0)
    .map(id => {
      const c = S.cards[id];
      const acc = c.seen ? c.right / c.seen : 0.5;
      return { id, score: c.box * 2 + acc * 3, card: c };
    })
    .sort((a, b) => a.score - b.score || (a.id < b.id ? -1 : 1))
    .slice(0, n || 5);
}
function conceptsIntroduced() {
  return Object.keys(S.cards).filter(id => CONCEPTS[id] && S.cards[id].box > 0);
}
