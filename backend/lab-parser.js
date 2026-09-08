// Turns extracted PDF text into a list of structured, ALREADY-CLASSIFIED
// lab results — in/out-of-range is decided HERE with real number
// comparisons, never by the AI. This is what fixes the "random all
// abnormal" bug: that was the model inconsistently judging its own
// extraction instead of deterministic math doing it.
//
// Coverage: handles the common documented formats (single value+unit with
// a "min - max" range, "< X" / "> X" bounds, and the "name: value (Réf: min
// - max)" manual-entry style). Lines that don't match any known shape are
// returned with status "UNPARSED" — never guessed — so the AI can still
// describe them but is explicitly told not to invent a range verdict for
// them.

function parseNumber(str) {
  if (str === undefined || str === null) return null;
  const n = parseFloat(String(str).trim().replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function classify(value, { min, max, lt, gt }) {
  if (lt !== undefined) return value >= lt ? "ABOVE" : "NORMAL";
  if (gt !== undefined) return value <= gt ? "BELOW" : "NORMAL";
  if (min !== undefined && value < min) return "BELOW";
  if (max !== undefined && value > max) return "ABOVE";
  return "NORMAL";
}

const NUM = "\\d+(?:[.,]\\d+)?";
const UNIT = "[A-Za-zµ%/°²³\\.\\-]{0,15}";

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

  let m = line.match(RE_MANUAL);
  if (m) {
    const [, name, val, unit, min, max] = m;
    const value = parseNumber(val);
    const rangeMin = parseNumber(min);
    const rangeMax = parseNumber(max);
    if (value !== null && rangeMin !== null && rangeMax !== null) {
      return {
        name: name.trim(),
        value,
        unit: (unit || "").trim(),
        rangeText: `${min} - ${max}`,
        status: classify(value, { min: rangeMin, max: rangeMax }),
      };
    }
  }

  m = line.match(RE_RANGE);
  if (m) {
    const [, name, val, unit, min, max, unit2] = m;
    const value = parseNumber(val);
    const rangeMin = parseNumber(min);
    const rangeMax = parseNumber(max);
    if (value !== null && rangeMin !== null && rangeMax !== null) {
      return {
        name: name.trim(),
        value,
        unit: (unit || unit2 || "").trim(),
        rangeText: `${min} - ${max}`,
        status: classify(value, { min: rangeMin, max: rangeMax }),
      };
    }
  }

  m = line.match(RE_LT);
  if (m) {
    const [, name, val, unit, bound] = m;
    const value = parseNumber(val);
    const boundVal = parseNumber(bound);
    if (value !== null && boundVal !== null) {
      return {
        name: name.trim(),
        value,
        unit: (unit || "").trim(),
        rangeText: `< ${bound}`,
        status: classify(value, { lt: boundVal }),
      };
    }
  }

  m = line.match(RE_GT);
  if (m) {
    const [, name, val, unit, bound] = m;
    const value = parseNumber(val);
    const boundVal = parseNumber(bound);
    if (value !== null && boundVal !== null) {
      return {
        name: name.trim(),
        value,
        unit: (unit || "").trim(),
        rangeText: `> ${bound}`,
        status: classify(value, { gt: boundVal }),
      };
    }
  }

  // Nothing matched. If the line at least contains a name-like word and a
  // number, keep it as UNPARSED (still shown, never given a fabricated
  // status). Pure header/junk lines with no digits at all are dropped.
  if (/\d/.test(line)) {
    return { name: line, value: null, unit: "", rangeText: "", status: "UNPARSED" };
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

module.exports = { parseLabResults, parseNumber, classify };
