// Turns extracted PDF text into a list of structured, ALREADY-CLASSIFIED
// lab results — in/out-of-range is decided HERE with real number
// comparisons, never by the AI. This is what fixes the "random all
// abnormal" bug: that was the model inconsistently judging its own
// extraction instead of deterministic math doing it.
//
// Coverage: handles the common documented formats — single value+unit with
// a "min - max" or "X à Y" range, "< X" / "> X" threshold-only bounds, the
// old manual-entry "name: value (Réf: min - max)" shape, and double-unit
// tests (two value/unit pairs, each with its own range — e.g. "29,23
// mmol/L 3,31 g/L" against "5,13 à 14,23 mmol/L  0,58 à 1,61 g/L"), where
// EACH pair is compared separately and the test counts as out-of-range if
// EITHER pair is. Lines that don't match any known shape are returned with
// status "UNPARSED" — never guessed.
//
// Every result has the same shape:
//   { name, status, entries: [{ value, unit, rangeText, status }, ...] }
// `status` is the overall/aggregate verdict; `entries` holds one item for
// a normal single-value test, two for a double-unit test.

function parseNumber(str) {
  if (str === undefined || str === null) return null;
  const n = parseFloat(String(str).trim().replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

// Per-pair verdict: NORMAL, ABOVE (over the max / over a "< X" threshold),
// or BELOW (under the min / under-or-equal a "> X" threshold).
function classify(value, { min, max, lt, gt }) {
  if (lt !== undefined) return value >= lt ? "ABOVE" : "NORMAL";
  if (gt !== undefined) return value <= gt ? "BELOW" : "NORMAL";
  if (min !== undefined && value < min) return "BELOW";
  if (max !== undefined && value > max) return "ABOVE";
  return "NORMAL";
}

// Combines each entry's status into one overall verdict for the test: if
// ANY entry is out of range, the whole test is out of range (first
// abnormal entry's direction wins for display purposes).
function overallStatus(entries) {
  const abnormal = entries.find((e) => e.status === "ABOVE" || e.status === "BELOW");
  return abnormal ? abnormal.status : "NORMAL";
}

const NUM = "\\d+(?:[.,]\\d+)?";
const UNIT = "[A-Za-zµ%/°²³\\.\\-]{0,15}";
const UNIT_REQUIRED = "[A-Za-zµ%/°²³\\.]{1,15}"; // non-empty, needed to disambiguate the double-value pattern

// name  value1 unit1  value2 unit2  min1-max1 [unit1]  min2-max2 [unit2]
// e.g. "Cholestérol non-HDL 29,23 mmol/L 3,31 g/L 5,13 à 14,23 mmol/L 0,58 à 1,61 g/L"
const RE_DOUBLE = new RegExp(
  `^(.+?)\\s+(${NUM})\\s*(${UNIT_REQUIRED})\\s+(${NUM})\\s*(${UNIT_REQUIRED})\\s+` +
    `(${NUM})\\s*(?:-|à)\\s*(${NUM})\\s*(${UNIT_REQUIRED})?\\s+` +
    `(${NUM})\\s*(?:-|à)\\s*(${NUM})\\s*(${UNIT_REQUIRED})?\\s*$`
);

// name: value unit (Réf: min - max)   — the old manual-entry shape
const RE_MANUAL = new RegExp(
  `^(.+?):\\s*(${NUM})\\s*(${UNIT})?\\s*\\(?\\s*R[ée]f\\s*:?\\s*(${NUM})\\s*(?:-|à|to)\\s*(${NUM})\\)?`,
  "i"
);

// name  value unit  min - max unit2   — typical PDF-extracted line
const RE_RANGE = new RegExp(
  `^(.+?)\\s+(${NUM})\\s*(${UNIT})?\\s+(${NUM})\\s*(?:-|à)\\s*(${NUM})\\s*(${UNIT})?\\s*$`
);

// name  value unit  < X   (upper-bound-only reference)
const RE_LT = new RegExp(`^(.+?)\\s+(${NUM})\\s*(${UNIT})?\\s*[:\\s]*[<˂]\\s*(${NUM})`);

// name  value unit  > X   (lower-bound-only reference)
const RE_GT = new RegExp(`^(.+?)\\s+(${NUM})\\s*(${UNIT})?\\s*[:\\s]*[>˃]\\s*(${NUM})`);

function parseLine(rawLine) {
  const line = rawLine.trim();
  if (!line) return null;

  let m = line.match(RE_DOUBLE);
  if (m) {
    const [, name, val1, unit1, val2, unit2, min1, max1, unit1b, min2, max2, unit2b] = m;
    const v1 = parseNumber(val1);
    const v2 = parseNumber(val2);
    const mn1 = parseNumber(min1);
    const mx1 = parseNumber(max1);
    const mn2 = parseNumber(min2);
    const mx2 = parseNumber(max2);
    if ([v1, v2, mn1, mx1, mn2, mx2].every((n) => n !== null)) {
      const entries = [
        { value: v1, unit: unit1, rangeText: `${min1} - ${max1}`, status: classify(v1, { min: mn1, max: mx1 }) },
        { value: v2, unit: unit2, rangeText: `${min2} - ${max2}`, status: classify(v2, { min: mn2, max: mx2 }) },
      ];
      return { name: name.trim(), entries, status: overallStatus(entries) };
    }
  }

  m = line.match(RE_MANUAL);
  if (m) {
    const [, name, val, unit, min, max] = m;
    const value = parseNumber(val);
    const rangeMin = parseNumber(min);
    const rangeMax = parseNumber(max);
    if (value !== null && rangeMin !== null && rangeMax !== null) {
      const entries = [
        { value, unit: (unit || "").trim(), rangeText: `${min} - ${max}`, status: classify(value, { min: rangeMin, max: rangeMax }) },
      ];
      return { name: name.trim(), entries, status: overallStatus(entries) };
    }
  }

  m = line.match(RE_RANGE);
  if (m) {
    const [, name, val, unit, min, max, unit2] = m;
    const value = parseNumber(val);
    const rangeMin = parseNumber(min);
    const rangeMax = parseNumber(max);
    if (value !== null && rangeMin !== null && rangeMax !== null) {
      const entries = [
        { value, unit: (unit || unit2 || "").trim(), rangeText: `${min} - ${max}`, status: classify(value, { min: rangeMin, max: rangeMax }) },
      ];
      return { name: name.trim(), entries, status: overallStatus(entries) };
    }
  }

  m = line.match(RE_LT);
  if (m) {
    const [, name, val, unit, bound] = m;
    const value = parseNumber(val);
    const boundVal = parseNumber(bound);
    if (value !== null && boundVal !== null) {
      const entries = [{ value, unit: (unit || "").trim(), rangeText: `< ${bound}`, status: classify(value, { lt: boundVal }) }];
      return { name: name.trim(), entries, status: overallStatus(entries) };
    }
  }

  m = line.match(RE_GT);
  if (m) {
    const [, name, val, unit, bound] = m;
    const value = parseNumber(val);
    const boundVal = parseNumber(bound);
    if (value !== null && boundVal !== null) {
      const entries = [{ value, unit: (unit || "").trim(), rangeText: `> ${bound}`, status: classify(value, { gt: boundVal }) }];
      return { name: name.trim(), entries, status: overallStatus(entries) };
    }
  }

  // Nothing matched. If the line at least contains a digit, keep it as
  // UNPARSED (still shown, never given a fabricated status). Pure
  // header/junk lines with no digits at all are dropped.
  if (/\d/.test(line)) {
    return { name: line, entries: [], status: "UNPARSED" };
  }
  return null;
}

function parseLabResults(text) {
  const lines = text.split("\n");
  const results = [];
  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) results.push(parsed);
  }
  return results;
}

module.exports = { parseLabResults, parseLine, parseNumber, classify, overallStatus };
