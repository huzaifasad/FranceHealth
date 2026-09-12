const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const OpenAI = require('openai').default;
const { PDFParse, PasswordException, InvalidPDFException } = require('pdf-parse');
require('dotenv').config();
const {
  getPrompt,
  setPrompt,
  getPromptUpdatedAt,
  getPrivacyPolicy,
  setPrivacyPolicy,
  getPrivacyPolicyUpdatedAt,
  getConsentText,
  setConsentText,
  getConsentTextUpdatedAt,
} = require('./db');
const { parseLabResults } = require('./lab-parser');
const app = express();
const PORT = process.env.PORT || 3001;

// Built lazily, not at module load — the OpenAI SDK throws immediately in
// its constructor if no API key is present, which used to crash anything
// that just requires this file (e.g. pdf-color.test.js, for its exports
// unrelated to OpenAI at all) whenever OPENAI_API_KEY isn't set. That's
// exactly the case in CI, which correctly never has a real key — so this
// was silently failing the GitHub Actions test step on every push. Only
// actually needs to exist once /api/analyze is really called.
let _openai = null;
function getOpenAIClient() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ========================
// PDF TEXT EXTRACTION
// ========================
// Built on pdf-parse (wraps Mozilla's pdf.js -- the same engine Firefox and
// Chrome render PDFs with), replacing the previous pdfreader/pdf2json-based
// implementation. That one reported text at whatever granularity the source
// PDF's own generator happened to use -- sometimes whole phrases per item,
// sometimes one glyph per item -- and the old code always inserted a literal
// space between same-line items, which silently corrupted any PDF using the
// glyph-per-item style (e.g. "Ibrahima Daff" extracted as "I b r a h i m a
// D a f f"). Verified against several real-world PDFs, including one that
// reproduced this exact corruption, before making this swap -- see the
// session notes for the comparison. pdf.js also degrades far more gracefully
// on malformed/non-PDF input: pdf2json's errors sometimes had no .message at
// all ("PDF extraction failed: undefined"), pdf-parse throws typed, always-
// readable exceptions.
async function extractTextFromPdf(buffer) {
  let parser;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    // Built from each page's own .text, not the convenience result.text --
    // that field splices in "-- N of M --" page-boundary marker lines by
    // default, which would otherwise leak into the line-by-line parsing
    // lab-parser.js does on this string.
    const rawText = result.pages.map((p) => p.text).join('\n\n');
    const cleanedText = cleanLabText(rawText);

    return {
      text: cleanedText.trim(),
      pages: result.pages.length || 1,
    };
  } catch (error) {
    if (error instanceof PasswordException) {
      throw new Error('Ce PDF est protégé par un mot de passe. Retirez la protection avant de le déposer ici.');
    }
    if (error instanceof InvalidPDFException) {
      throw new Error("Ce fichier n'est pas un PDF valide ou est corrompu.");
    }
    throw new Error(`PDF extraction failed: ${error.message || error}`);
  } finally {
    // Always free the parser's resources, success or failure -- per
    // pdf-parse's own documented usage pattern.
    if (parser) await parser.destroy();
  }
}

function cleanLabText(rawText) {
  let lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const junkPatterns = [
    /^Laboratoire de Biologie Médicale/i,
    /^LBM /i,
    /^SELAS /i,
    /^Biologistes?/i,
    /^Page \d+/,
    /^Prélevé le /,
    /^Édité le /,
    /^www\./i,
    /^Tél\s*:/i,
    /^Fax\s*:/i,
    /^\d{5}\s+[A-Z]/,
    /^Les informations contenues dans ce document/,
    /^Document confidentiel/,
    /^-- \d+ of \d+ --$/, // pdf-parse's own page-boundary marker, defense-in-depth in case it's ever fed in via result.text instead of the per-page join we actually use
  ];

  lines = lines.filter(line => !junkPatterns.some(p => p.test(line)));
  // NOTE: this used to also blindly replace every "O" with "0" and every "l"
  // with "1" here, on the theory of fixing OCR misreads. But extractTextFromPdf
  // reads the PDF's actual text layer (pdf-parse / pdf.js), not an OCR'd image
  // — the characters are already exact. That replacement was corrupting real
  // words instead (e.g. "Hémoglobine" -> "Hémog1obine"), so it's gone.
  lines = lines.map(line => line.replace(/\s+/g, ' ').trim());

  return lines.join('\n');
}

// ========================
// ENDPOINTS
// ========================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========================
// SYSTEM PROMPT (SQLite — persists on disk, no more JSONBin/in-memory bin id)
// ========================
// The frontend's /prompt page gates humans behind a password, but that
// check only exists in the frontend. This route sits on the backend's own
// port, which Docker exposes to the host — without something here, anyone
// who can reach port 3001 directly bypasses that password entirely. So the
// backend also requires a shared secret that only the frontend's proxy
// knows, on top of (not instead of) the frontend's own login.
function hasValidInternalSecret(req) {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) return false; // not configured -> fail closed, not open
  const provided = req.get('x-internal-api-secret') || '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function requireInternalSecret(req, res, next) {
  if (!hasValidInternalSecret(req)) {
    return res.status(401).json({ success: false, error: 'Non autorisé.' });
  }
  next();
}

app.get('/api/prompt', requireInternalSecret, (req, res) => {
  res.json({
    success: true,
    prompt: getPrompt() || '',
    updatedAt: getPromptUpdatedAt() || new Date().toISOString(),
  });
});

app.post('/api/prompt', requireInternalSecret, (req, res) => {
  const { prompt } = req.body;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, error: 'Prompt field required' });
  }
  setPrompt(prompt);
  res.json({ success: true, prompt, updatedAt: new Date().toISOString() });
});

// Same storage pattern as /api/prompt (a named row in the same SQLite
// "settings" table), but this content is meant to be publicly visible --
// it's rendered on the real /protection-des-donnees page for every visitor,
// not hidden behind a login. The frontend's own proxy route is what decides
// GET is open to anyone while POST (actually editing it) still goes through
// the same admin gate as the AI prompt; this backend layer only checks the
// shared internal secret either way, exactly like /api/prompt does.
app.get('/api/privacy-policy', requireInternalSecret, (req, res) => {
  res.json({
    success: true,
    content: getPrivacyPolicy() || '',
    updatedAt: getPrivacyPolicyUpdatedAt() || new Date().toISOString(),
  });
});

app.post('/api/privacy-policy', requireInternalSecret, (req, res) => {
  const { content } = req.body;
  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Content field required' });
  }
  setPrivacyPolicy(content);
  res.json({ success: true, content, updatedAt: new Date().toISOString() });
});

// Same storage/access pattern again -- the consent checkbox label shown on
// the homepage before analyzing, editable from the same /prompt admin page.
app.get('/api/consent-text', requireInternalSecret, (req, res) => {
  res.json({
    success: true,
    content: getConsentText() || '',
    updatedAt: getConsentTextUpdatedAt() || new Date().toISOString(),
  });
});

app.post('/api/consent-text', requireInternalSecret, (req, res) => {
  const { content } = req.body;
  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Content field required' });
  }
  setConsentText(content);
  res.json({ success: true, content, updatedAt: new Date().toISOString() });
});

app.post('/api/extract-pdf-text', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No PDF file provided' });
    const result = await extractTextFromPdf(req.file.buffer);
    res.json({
      success: true,
      text: result.text,
      metadata: { pages: result.pages, textLength: result.text.length },
    });
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Builds the JSON payload handed to the AI: results the CODE already
// classified as in/out of range. Sent as actual JSON (not prose) in the
// user message, per current OpenAI guidance for embedding authoritative
// data the model should treat as ground truth — the model is told in the
// system prompt to never recompute or contradict these statuses, only
// describe them.
function toAIResults(results) {
  return results.map((r) => ({
    name: r.name,
    status: r.status, // "NORMAL" | "ABOVE" | "BELOW" | "UNPARSED" — already decided by code
    values: r.entries.map((e) => ({ value: e.value, unit: e.unit, range: e.rangeText, status: e.status })),
  }));
}

app.post('/api/analyze', upload.single('pdf'), async (req, res) => {
  try {
    let textInput = req.body.text;
    let pdfBuffer = null;
    let fileName = 'analyse_cellude.pdf';

    if (req.file) {
      console.log('Processing PDF:', req.file.originalname);

      // Cheap upfront check, before ever invoking the parser: a real PDF
      // always starts with the "%PDF-" file signature. The frontend already
      // restricts the file picker to .pdf, but that's trivially bypassed
      // (drag-and-drop, or hitting this API directly) -- there was no
      // server-side check at all before this, so a non-PDF upload reached
      // the parser and crashed with a confusing, sometimes message-less
      // error instead of a clear "please upload a PDF".
      const isPdfSignature = req.file.buffer.length >= 5 && req.file.buffer.subarray(0, 5).toString('latin1') === '%PDF-';
      if (!isPdfSignature) {
        return res.status(400).json({ success: false, error: "Ce fichier ne semble pas être un PDF valide." });
      }

      const result = await extractTextFromPdf(req.file.buffer);
      textInput = result.text;
      pdfBuffer = req.file.buffer;
      fileName = `analyse_${req.file.originalname}`;

      if (!textInput || textInput.length < 50) {
        return res.status(400).json({ success: false, error: 'Extracted text too short or empty' });
      }
    }

    if (!textInput) {
      return res.status(400).json({ success: false, error: 'No text to analyze' });
    }

    // Deterministic, code-based classification — this replaces asking the
    // AI to parse numbers and judge in/out-of-range itself.
    const parsedResults = parseLabResults(textInput);
    const aiResultsJson = JSON.stringify(toAIResults(parsedResults), null, 2);

    const systemPrompt = getPrompt() || '';

    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content:
            `Voici les résultats, déjà classés par un programme (JSON ci-dessous). Le champ "status" de chaque ` +
            `analyse — et de chaque entrée dans "values" — est DÉFINITIF : ne le recalcule jamais, ne le remets ` +
            `jamais en question.\n\n${aiResultsJson}\n\n---\nTexte brut extrait du compte-rendu (pour contexte ` +
            `uniquement — ne sert PAS à recalculer un statut) :\n${textInput}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 3500,
    });

    const analysisResult = completion.choices[0].message.content.trim();

    let fileBase64 = null;
    if (pdfBuffer) {
      const updatedPdfBuffer = await appendResultsToPdf(pdfBuffer, analysisResult, textInput, parsedResults);
      fileBase64 = updatedPdfBuffer.toString('base64');
    }

    res.json({
      success: true,
      analysis: analysisResult,
      fileBase64,
      fileName,
      classification: parsedResults, // code-computed statuses, for transparency/debugging
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed',
    });
  }
});

// ========================
// PDF COLOR-CODING — reads the code-computed status, not the AI's prose
// ========================
function normalizeTestName(s) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Builds a normalized-name -> status ("NORMAL" | "ABOVE" | "BELOW") lookup
// from the classification array lab-parser.js already computed. UNPARSED
// entries are excluded on purpose — there's no real status to color with.
function buildStatusLookup(classification) {
  const map = new Map();
  for (const r of classification || []) {
    if (r.status === 'UNPARSED') continue;
    map.set(normalizeTestName(r.name), r.status);
  }
  return map;
}

function lookupStatus(map, rawName) {
  const norm = normalizeTestName(rawName);
  if (map.has(norm)) return map.get(norm);
  // Unambiguous partial match fallback (AI may phrase the name slightly
  // differently than the raw extracted line did).
  let match = null;
  let hits = 0;
  for (const [key, status] of map) {
    if (norm.includes(key) || key.includes(norm)) {
      match = status;
      hits++;
    }
  }
  return hits === 1 ? match : null;
}

// The single decision point for a bullet line's color: prefers the
// code-computed status looked up by name; only falls back to "whichever
// section the AI put this line under" (sectionContext) when the name isn't
// found in our classification at all (e.g. an UNPARSED line). This is what
// makes the PDF's red/green coloring immune to the AI mis-sorting a result
// into the wrong section — see pdf-color.test.js for the exact scenario.
function resolveBulletColor(rawLine, statusLookup, sectionContext) {
  const bulletName = (rawLine.includes(':') ? rawLine.slice(0, rawLine.indexOf(':')) : rawLine).trim();
  const computedStatus = lookupStatus(statusLookup, bulletName);
  const isAbnormal = computedStatus ? computedStatus === 'ABOVE' || computedStatus === 'BELOW' : sectionContext.inAbnormal;
  const isNormal = computedStatus ? computedStatus === 'NORMAL' : sectionContext.inNormal;
  return { isAbnormal, isNormal, computedStatus };
}

// The standard PDF fonts (Helvetica included) use WinAnsiEncoding, which
// covers plain ASCII + Latin-1 (so all normal French accents are fine —
// verified separately), but nothing outside it. pdf-lib's own docs confirm
// there's no way to check a character in advance; page.drawText() just
// throws, which used to crash the entire PDF generation the moment the
// AI's text (or a lab report's own extracted text) contained one — as
// happened here with "μ" (Greek mu, U+03BC), used constantly in lab units
// like "μg/L" and "μmol/L", but NOT the same character as "µ" (micro sign,
// U+00B5) which WinAnsi actually supports and which is what should have
// been there. Real analyses use micro-unit values constantly, so this
// wasn't a rare edge case -- it could crash on a large fraction of real
// reports. Fixed with a substitution pass for the common look-alikes,
// falling back to stripping anything else outside Latin-1 rather than
// crashing PDF generation over one stray character ever again.
const WINANSI_SUBSTITUTIONS = {
  'μ': 'µ', // Greek small letter mu -> the actual WinAnsi micro sign
  '–': '-', '—': '-', // en dash, em dash
  '‘': "'", '’': "'", // smart single quotes
  '“': '"', '”': '"', // smart double quotes
  '…': '...', // ellipsis
  ' ': ' ', // non-breaking space
};

function sanitizeForWinAnsi(text) {
  let out = '';
  for (const ch of text) {
    if (WINANSI_SUBSTITUTIONS[ch] !== undefined) {
      out += WINANSI_SUBSTITUTIONS[ch];
      continue;
    }
    // WinAnsi covers ASCII + Latin-1 supplement (every codepoint up to
    // 0xFF) -- anything past that (Greek, CJK, emoji, ...) has no safe
    // representation in these fonts, so drop it rather than crash.
    out += ch.codePointAt(0) <= 0xFF ? ch : '';
  }
  return out;
}

// ========================
// ULTIMATE PROFESSIONAL PDF DESIGN
// ========================
async function appendResultsToPdf(originalPdfBuffer, resultsText, textInput, classification) {
  resultsText = sanitizeForWinAnsi(resultsText);
  const statusLookup = buildStatusLookup(classification);
  const pdfDoc = await PDFDocument.load(originalPdfBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // PREMIUM COLOR PALETTE UPDATED TO MATCH CERBALLIANCE
  // Client request: no more red/out-of-range vs green/in-range coloring on
  // results -- status is now shown by bold (out-of-range) vs regular
  // (in-range) weight only, both in the same neutral charcoal. The red/
  // green palette entries that used to drive that are gone.
  const C = {
    navy: rgb(0.05, 0.20, 0.35),
    blue: rgb(0, 209/255, 220/255), // #00D1DC Robin's Egg Blue from Cerballiance brand
    lightBlue: rgb(0.88, 0.94, 0.98),
    orange: rgb(0.85, 0.50, 0.10),
    orangeBg: rgb(0.99, 0.97, 0.93),
    charcoal: rgb(0.15, 0.15, 0.18),
    gray: rgb(0.35, 0.35, 0.40),
    lightGray: rgb(0.55, 0.55, 0.58),
    silver: rgb(0.88, 0.88, 0.90),
    offWhite: rgb(0.98, 0.98, 0.99),
    white: rgb(1, 1, 1),
  };

  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 55;
  const maxWidth = width - margin * 2;

  // Parse report date from textInput
  let dateStr = 'Date inconnue';
  const editDateMatch = textInput.match(/Édité le (\d+) (\w+) (\d{4})/);
  if (editDateMatch) {
    const day = parseInt(editDateMatch[1], 10);
    const monthStr = editDateMatch[2].toLowerCase();
    const year = parseInt(editDateMatch[3], 10);
    const months = {
      janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
      juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11
    };
    const month = months[monthStr];
    if (month !== undefined) {
      const editDate = new Date(year, month, day);
      dateStr = editDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  // ========================
  // PREMIUM HEADER DESIGN
  // ========================
  
  page.drawRectangle({ 
    x: 0, y: height - 100, width, height: 100, 
    color: C.navy 
  });
  page.drawRectangle({ 
    x: 0, y: height - 105, width, height: 5, 
    color: C.blue 
  });
  
  page.drawText('CELLUDE', {
    x: margin, y: height - 45,
    size: 28, font: boldFont, color: C.white
  });
  
  page.drawText('Comprendre vos Analyses Biologiques', { 
    x: margin, y: height - 70, 
    size: 10, font: italicFont, color: C.lightBlue 
  });
  
  const dateW = font.widthOfTextAtSize(dateStr, 9);
  
  page.drawRectangle({ 
    x: width - margin - dateW - 25, y: height - 72, 
    width: dateW + 25, height: 24, 
    color: C.blue 
  });
  page.drawText(dateStr, { 
    x: width - margin - dateW - 12, y: height - 65, 
    size: 9, font: font, color: C.white 
  });

  let y = height - 140;

  // ========================
  // DOCUMENT TITLE SECTION
  // ========================
  
  page.drawRectangle({ 
    x: margin - 10, y: y - 5, width: 6, height: 32, 
    color: C.blue 
  });
  
  page.drawText('Guide Pédagogique de vos Résultats', {
    x: margin + 5, y: y, 
    size: 18, font: boldFont, color: C.navy 
  });
  
  page.drawLine({ 
    start: { x: margin + 5, y: y - 8 }, 
    end: { x: margin + 320, y: y - 8 }, 
    thickness: 2, color: C.blue 
  });

  y -= 50;

  // ========================
  // CONFIDENTIALITY NOTICE
  // ========================
  
  const noticeH = 32;
  page.drawRectangle({ 
    x: margin, y: y - noticeH, 
    width: maxWidth, height: noticeH, 
    color: C.lightBlue, 
    borderColor: C.blue, borderWidth: 1 
  });
  
  page.drawRectangle({ 
    x: margin + 12, y: y - 20, width: 8, height: 8, 
    color: C.navy, borderColor: C.navy, borderWidth: 1 
  });
  page.drawRectangle({ 
    x: margin + 14, y: y - 16, width: 4, height: 4, 
    color: C.lightBlue 
  });
  
  page.drawText('DOCUMENT PÉDAGOGIQUE', {
    x: margin + 30, y: y - 18,
    size: 9, font: boldFont, color: C.navy
  });
  page.drawText('- Aide à la compréhension des termes médicaux', {
    x: margin + 165, y: y - 18, 
    size: 8, font: font, color: C.gray 
  });

  y -= 60;

  // ========================
  // SMART CONTENT RENDERING
  // ========================
  
  const lines = resultsText.split('\n');
  let currentIsAbnormal = false;

  // The AI's exact decoration syntax is NOT consistent between
  // generations, even with the same system prompt -- confirmed across
  // THREE real production PDFs, each a genuinely different style for
  // the exact same content: "### Hémoglobine" / "**Résultat :**", then
  // a bare "Hémoglobine" / "- Résultat :", then (because the live
  // prompt tells it to show in-range results "en VERT", and plain text
  // can't literally be colored) "<span style=\"color:green;\">Dans
  // l'intervalle</span>" -- the model reaching for HTML once markdown
  // bold wasn't enough to express "green". Matching each style as it
  // turns up is a losing game -- there will be a fourth. So instead of
  // enumerating syntaxes, this strips anything that LOOKS like markup,
  // of any kind, plus classifies content generically (see below), and
  // separately the live prompt's actual color instruction needs fixing
  // too (flagged to the client) since it's the reason the model keeps
  // trying in the first place.
  //
  // Bold-vs-plain for the fact lines is decided entirely by OUR computed
  // classification (statusLookup / resolveBulletColor), never by
  // whatever emphasis the AI applied itself -- confirmed the live
  // prompt has the AI bold/color "Dans l'intervalle" while leaving "En
  // dehors de l'intervalle" plain, the opposite of what this PDF needs
  // to show. Same "never trust the AI's own formatting for status"
  // principle pdf-color.test.js already covers for the old bullet
  // format -- this is that same principle, just extended past markdown
  // to cover HTML too, generically, rather than tag-by-tag.
  const LEADING_DECOR = '(?:[\\s\\-•*#]|<\\/?[a-zA-Z][^>]*>)*';
  const FACT_LABEL_RE = new RegExp(`^${LEADING_DECOR}(Résultat|Intervalle|Statut)\\s*:?`, 'i');
  const SUBHEADING_RE = new RegExp(`^${LEADING_DECOR}(Qu'est-ce que c'est ?\\??|À quoi ça sert dans le corps ?\\??|Côté alimentation)\\s*(?:[*]|<\\/?[a-zA-Z][^>]*>)*\\s*$`, 'i');
  const SUMMARY_ITEM_RE = new RegExp(`^${LEADING_DECOR}(Dans l'intervalle|En dehors de l'intervalle|Données non interprétables)\\s*(?:[*]|<\\/?[a-zA-Z][^>]*>)*\\s*:`, 'i');
  const SEPARATOR_RE = /^-{2,}$/; // a bare "---" some generations use between blocks
  const stripLeading = (s) => s.replace(new RegExp(`^${LEADING_DECOR}`, 'i'), '').trim();
  // Strips markup generically rather than one enumerated syntax at a
  // time: any HTML/XML-ish tag (open or close, whatever attributes it
  // carries -- this is what actually catches the <span style="color:
  // ...">...</span> bug, and the next tag the model tries too, without
  // needing a matching update here), markdown links reduced to just
  // their visible text, and markdown's own punctuation (#, *, backtick,
  // underscore, tilde). Deliberately requires a letter or "/" right
  // after "<" -- "< 2,00 g/L" and "> 0,40 g/L" are real reference-range
  // syntax this app uses constantly (Cholestérol total, HDL...), not
  // markup, and must survive this untouched.
  const stripMarkdown = (s) => s
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*`_~]+/g, '')
    .trim();

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line || SEPARATOR_RE.test(line)) {
      y -= 16; // was 8 -- client asked for more breathing room between results
      continue;
    }

    if (y < margin + 100) {
      page = pdfDoc.addPage();
      y = height - margin - 20;
    }

    if (line.includes('====')) continue;

    let textFont = font;
    let textSize = 10;
    let textColor = C.charcoal;
    let leftPad = 0;
    let extraSpace = 0;
    let iconType = null;

    const hashHeadingMatch = line.match(/^#{1,6}\s*(.+)$/);
    const isResumeHeading = /^r[ée]sum[ée]$/i.test(stripLeading(stripMarkdown(line)));
    // No # required -- a bare line that's exactly one of our own known
    // test names (from the classification the code already computed) is
    // just as much a heading as a "### "-decorated one. Exact normalized
    // match only here (statusLookup.has), NOT lookupStatus()'s usual
    // fuzzy substring fallback -- that fallback is right for matching a
    // slightly-reworded bullet against a real name, but too permissive
    // for "is this random short sentence actually a heading": a test
    // literally named "Fer" (iron -- the exact example in the live
    // prompt) would fuzzy-match any sentence containing "fer" as a
    // substring, e.g. "référence" or "transfert".
    const bareCandidate = !hashHeadingMatch && line.length < 60 && !line.includes(':') ? stripLeading(stripMarkdown(line)) : null;
    const isBareHeading = bareCandidate && statusLookup.has(normalizeTestName(bareCandidate));

    // ========================
    // PARAMETER / SECTION HEADING ("### Name" or a bare "Name")
    // ========================
    if (hashHeadingMatch || isBareHeading || isResumeHeading) {
      const headingName = stripLeading(stripMarkdown(hashHeadingMatch ? hashHeadingMatch[1] : line));
      line = headingName;

      page.drawRectangle({
        x: margin + 5, y: y - 6,
        width: 4, height: 22,
        color: C.blue
      });

      textFont = boldFont;
      textSize = 13;
      textColor = C.navy;
      leftPad = 18;
      extraSpace = 14;

      if (isResumeHeading) {
        currentIsAbnormal = false; // the summary heading itself is never "bold"
        iconType = 'info';
      } else {
        currentIsAbnormal = resolveBulletColor(headingName, statusLookup, { inAbnormal: false, inNormal: false }).isAbnormal;
      }
    }

    // ========================
    // FACT LINES: "**Résultat :**", "- Résultat :", "Résultat :", ...
    // ========================
    else if (FACT_LABEL_RE.test(line)) {
      line = stripLeading(stripMarkdown(line));
      leftPad = 25;
      extraSpace = 4;
      textSize = 10;
      textColor = C.charcoal;
      textFont = currentIsAbnormal ? boldFont : font;
    }

    // ========================
    // SUB-HEADINGS: "Qu'est-ce que c'est ?", "À quoi ça sert...", "Côté alimentation"
    // ========================
    else if (SUBHEADING_RE.test(line)) {
      line = stripLeading(stripMarkdown(line));
      leftPad = 25;
      extraSpace = 4;
      textSize = 9.5;
      textFont = boldFont;
      textColor = C.navy;
    }

    // ========================
    // RÉSUMÉ CATEGORY LIST ITEMS: "**Dans l'intervalle :** ...", "- Dans l'intervalle : ..."
    // ========================
    else if (SUMMARY_ITEM_RE.test(line)) {
      line = stripLeading(stripMarkdown(line));
      leftPad = 18;
      textFont = boldFont;
      textSize = 9.5;
      textColor = C.navy;
    }

    // ========================
    // EVERYTHING ELSE: explanatory prose -- always plain, status never applies
    // ========================
    else {
      line = stripLeading(stripMarkdown(line));
      leftPad = 30;
      textSize = 9;
      textColor = C.charcoal;
    }

    // ========================
    // DRAW ICON
    // ========================
    // No more colored background box or red/green status icon (alert/
    // check) -- bold-vs-regular text is the only status indicator now.
    if (iconType === 'info') {
      const iconX = margin + leftPad - 16;
      const iconY = y + 2;
      page.drawCircle({
        x: iconX, y: iconY, size: 7,
        color: C.lightBlue, borderColor: C.blue, borderWidth: 1.5
      });
      page.drawText('i', {
        x: iconX - 2, y: iconY - 3,
        size: 9, font: italicFont, color: C.blue
      });
    }

    // ========================
    // WORD WRAP AND RENDER
    // ========================
    const words = line.split(' ');
    let currentLine = '';
    const effectiveWidth = maxWidth - leftPad;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = textFont.widthOfTextAtSize(testLine, textSize);
      
      if (testWidth > effectiveWidth && currentLine) {
        page.drawText(currentLine, { 
          x: margin + leftPad, y, 
          size: textSize, font: textFont, color: textColor 
        });
        y -= 16;
        
        if (y < margin + 100) {
          page = pdfDoc.addPage();
          y = height - margin - 20;
        }
        
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      page.drawText(currentLine, { 
        x: margin + leftPad, y, 
        size: textSize, font: textFont, color: textColor 
      });
      y -= 16 + extraSpace;
    }
  }

  // ========================
  // DISCLAIMER BOX
  // ========================
  
  y -= 50;
  if (y < margin + 140) {
    page = pdfDoc.addPage();
    y = height - margin - 20;
  }

  const disclaimerH = 110;
  
  page.drawRectangle({ 
    x: margin + 4, y: y - disclaimerH + 4, 
    width: maxWidth, height: disclaimerH, 
    color: rgb(0.85, 0.85, 0.87) 
  });
  
  page.drawRectangle({ 
    x: margin, y: y - disclaimerH, 
    width: maxWidth, height: disclaimerH, 
    color: C.orangeBg,
    borderColor: C.orange, borderWidth: 2 
  });
  
  const crossX = margin + 18;
  const crossY = y - 20;
  page.drawRectangle({ 
    x: crossX, y: crossY - 6, width: 2, height: 14, 
    color: C.orange 
  });
  page.drawRectangle({ 
    x: crossX - 5, y: crossY - 1, width: 12, height: 4, 
    color: C.orange 
  });
  
  page.drawText('IMPORTANT : AVERTISSEMENT', { 
    x: margin + 40, y: y - 18, 
    size: 10, font: boldFont, color: C.orange 
  });
  
  const disclaimerText = [
    'Ce résumé a pour objectif d\'aider à comprendre les analyses',
    'figurant sur ce compte-rendu. Il ne constitue pas une interprétation',
    'médicale. Pour toute question concernant vos résultats,',
    'veuillez consulter votre médecin.',
  ];
  
  disclaimerText.forEach((txt, idx) => {
    page.drawText(txt, { 
      x: margin + 25, y: y - 45 - idx * 14, 
      size: 9, font: font, color: C.gray 
    });
  });

  // ========================
  // PROFESSIONAL FOOTER
  // ========================
  
  const footerY = 35;
  
  page.drawLine({ 
    start: { x: margin, y: footerY + 18 }, 
    end: { x: width - margin, y: footerY + 18 }, 
    thickness: 1.5, color: C.silver 
  });
  
  page.drawText('Cellude', {
    x: margin, y: footerY,
    size: 8, font: boldFont, color: C.navy
  });
  
  const centerText = `Document généré le ${dateStr}`;
  const centerW = font.widthOfTextAtSize(centerText, 7);
  page.drawText(centerText, { 
    x: (width - centerW) / 2, y: footerY, 
    size: 7, font: font, color: C.lightGray 
  });
  
  const pageNum = pdfDoc.getPageCount();
  const pageText = `Page ${pageNum}`;
  const pageW = font.widthOfTextAtSize(pageText, 8);
  page.drawText(pageText, { 
    x: width - margin - pageW, y: footerY, 
    size: 8, font: font, color: C.lightGray 
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ========================
// Only actually bind to a port when this file is run directly (`node
// server.js`) — not when it's `require()`d, e.g. from a test script that
// just wants appendResultsToPdf() in isolation.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Celluid API running on port ${PORT}`);
  });
}

module.exports = {
  app,
  appendResultsToPdf,
  extractTextFromPdf,
  normalizeTestName,
  buildStatusLookup,
  lookupStatus,
  resolveBulletColor,
};
