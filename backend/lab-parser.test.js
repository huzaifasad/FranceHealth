const test = require("node:test");
const assert = require("node:assert/strict");
const { parseLine } = require("./lab-parser");

test("normal value stays NORMAL", () => {
  const r = parseLine("Glycémie 5,4 mmol/L 3,9 - 5,5");
  assert.equal(r.status, "NORMAL");
  assert.equal(r.entries.length, 1);
  assert.equal(r.entries[0].value, 5.4);
});

test("out-of-range value is classified ABOVE", () => {
  const r = parseLine("Créatinine 130 µmol/L 60 - 110");
  assert.equal(r.status, "ABOVE");
  assert.equal(r.entries[0].value, 130);
});

test('"< X" threshold: value at/over the threshold is ABOVE', () => {
  const r = parseLine("TSH 5,2 mUI/L < 4,0");
  assert.equal(r.status, "ABOVE");
  assert.equal(r.entries[0].value, 5.2);
});

test('"< X" threshold: value under the threshold is NORMAL', () => {
  const r = parseLine("TSH 2,1 mUI/L < 4,0");
  assert.equal(r.status, "NORMAL");
});

test('"> X" threshold: value at/under the threshold is BELOW', () => {
  const r = parseLine("Vitamine D 15 ng/mL > 30");
  assert.equal(r.status, "BELOW");
});

test("double-unit: one pair in range, the other out — whole test is out-of-range", () => {
  // val1=10,00 mmol/L against 5,13-14,23  -> NORMAL
  // val2=2,00  g/L    against 0,58-1,61   -> ABOVE (2.00 > 1.61)
  // Overall must be ABOVE because at least one pair is out of range.
  const r = parseLine("Cholestérol non-HDL 10,00 mmol/L 2,00 g/L 5,13 à 14,23 mmol/L 0,58 à 1,61 g/L");
  assert.equal(r.entries.length, 2, "should capture both value/range pairs");
  assert.equal(r.entries[0].status, "NORMAL", "first pair (mmol/L) should be in range");
  assert.equal(r.entries[1].status, "ABOVE", "second pair (g/L) should be out of range");
  assert.equal(r.status, "ABOVE", "overall status must reflect the abnormal pair");
});

test("double-unit: both pairs in range — whole test is NORMAL", () => {
  const r = parseLine("Cholestérol non-HDL 10,00 mmol/L 1,00 g/L 5,13 à 14,23 mmol/L 0,58 à 1,61 g/L");
  assert.equal(r.entries.length, 2);
  assert.equal(r.entries[0].status, "NORMAL");
  assert.equal(r.entries[1].status, "NORMAL");
  assert.equal(r.status, "NORMAL");
});

test("unrecognized line with digits is UNPARSED, never guessed", () => {
  const r = parseLine("Une ligne bizarre 42 qui ne correspond a rien");
  assert.equal(r.status, "UNPARSED");
  assert.equal(r.entries.length, 0);
});

test("pure text line with no digits is dropped entirely", () => {
  const r = parseLine("HÉMATOLOGIE (Numération des cellules sanguines)");
  assert.equal(r, null);
});

test("comma and dot decimals both parse the same way", () => {
  const withComma = parseLine("Test 1,15 g/L 0,5 - 2,0");
  const withDot = parseLine("Test 1.15 g/L 0.5 - 2.0");
  assert.equal(withComma.entries[0].value, withDot.entries[0].value);
  assert.equal(withComma.status, withDot.status);
});

// Real bug, caught from an actual production PDF: "µg/L" extracted from a
// real lab report sometimes uses "μ" (Greek small letter mu, U+03BC), not
// "µ" (the actual micro sign, U+00B5) -- visually identical, different
// codepoint. Only the micro sign used to be in the unit character class,
// so a Greek-mu line matched nothing at all and fell through to UNPARSED
// ("Données non interprétables"), even though Ferritine's own value (310
// µg/L, range 20-250) was clearly, obviously out of range.
test("µ-prefixed units parse the same whether it's the micro sign or Greek mu", () => {
  const microSign = parseLine("Ferritine 310 µg/L 20 - 250");
  const greekMu = parseLine("Ferritine 310 μg/L 20 - 250");
  assert.equal(microSign.status, "ABOVE");
  assert.equal(greekMu.status, "ABOVE", "Greek mu variant must classify identically, not UNPARSED");
  assert.equal(greekMu.entries[0].value, 310);
});
