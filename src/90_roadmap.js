/* ============================================================
   Course map completion.
   Every module is now built, so this file registers nothing. It
   stays because it is where an unbuilt module would be declared,
   and because the home screen and the reference both rely on
   MODULES being complete rather than on modules existing.
   ============================================================ */

const ROADMAP = [];
ROADMAP.forEach(m => {
  if (MODULES[m.id]) return;
  defModule(Object.assign({ pending: true, concepts: [], sessions: [] }, m));
});

function pendingModules() { return MODULE_ORDER.filter(id => MODULES[id].pending); }
function nextPendingModule() {
  for (const id of MODULE_ORDER) if (MODULES[id].pending) return MODULES[id];
  return null;
}
