const test = require("node:test");
const assert = require("node:assert/strict");
const { buildStatusLookup, resolveBulletColor } = require("./server");

const classification = [
  { name: "Hémoglobine", status: "BELOW", entries: [] },
  { name: "Glycémie", status: "NORMAL", entries: [] },
  { name: "Créatinine", status: "ABOVE", entries: [] },
  { name: "Cholestérol non-HDL", status: "ABOVE", entries: [] },
];

test("bullet color follows the computed status when the AI sorts it correctly", () => {
  const lookup = buildStatusLookup(classification);

  const abnormalLine = resolveBulletColor("Hémoglobine", lookup, { inAbnormal: true, inNormal: false });
  assert.equal(abnormalLine.isAbnormal, true);
  assert.equal(abnormalLine.isNormal, false);

  const normalLine = resolveBulletColor("Glycémie : 5,4 mmol/L (repères : 3,9 - 5,5)", lookup, {
    inAbnormal: false,
    inNormal: true,
  });
  assert.equal(normalLine.isNormal, true);
  assert.equal(normalLine.isAbnormal, false);
});

test("THE KEY CASE: AI misfiles a normal result into the abnormal section — color still reads GREEN from the computed status, not the section it was placed in", () => {
  const lookup = buildStatusLookup(classification);

  // Section context says "abnormal" (the AI put this bullet under the
  // "EN DEHORS" header by mistake) — but Glycémie's real computed status
  // is NORMAL. The old code would have trusted the section and rendered
  // this red. The fix must render it green regardless.
  const misfiled = resolveBulletColor("Glycémie", lookup, { inAbnormal: true, inNormal: false });
  assert.equal(misfiled.isNormal, true, "must be colored NORMAL/green — the computed status, not the section");
  assert.equal(misfiled.isAbnormal, false, "must NOT be colored abnormal/red just because of the section it's in");
});

test("mirror case: AI misfiles an abnormal result into the normal section — color still reads RED", () => {
  const lookup = buildStatusLookup(classification);

  const misfiled = resolveBulletColor("Créatinine", lookup, { inAbnormal: false, inNormal: true });
  assert.equal(misfiled.isAbnormal, true, "must be colored ABOVE/red — the computed status, not the section");
  assert.equal(misfiled.isNormal, false);
});

test("double-unit test (one pair in range, one out) resolves to the aggregate ABOVE status", () => {
  const lookup = buildStatusLookup(classification);
  const resolved = resolveBulletColor("Cholestérol non-HDL", lookup, { inAbnormal: false, inNormal: true });
  assert.equal(resolved.isAbnormal, true);
});

test("a name with no match in the classification (e.g. UNPARSED) falls back to the section context", () => {
  const lookup = buildStatusLookup(classification); // UNPARSED entries are excluded from the lookup by design
  const resolved = resolveBulletColor("Analyse totalement inconnue", lookup, { inAbnormal: true, inNormal: false });
  assert.equal(resolved.computedStatus, null, "no match should be found");
  assert.equal(resolved.isAbnormal, true, "falls back to the section context when nothing was computed");
});

test("name matching is accent- and case-insensitive", () => {
  const lookup = buildStatusLookup(classification);
  const resolved = resolveBulletColor("CHOLESTEROL NON-HDL", lookup, { inAbnormal: false, inNormal: true });
  assert.equal(resolved.isAbnormal, true);
});
