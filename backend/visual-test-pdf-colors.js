// One-off manual verification for item 7 (PDF color-coding reads the
// computed flag, not the AI's prose). Not part of the automated test
// suite — run directly with `node visual-test-pdf-colors.js`, then look
// at the output PDF.
const fs = require("fs");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const { parseLabResults } = require("./lab-parser");
const { appendResultsToPdf } = require("./server");

const sampleText = `Hémoglobine 11,8 g/dL 12,0 - 16,0
Glycémie 5,4 mmol/L 3,9 - 5,5
Créatinine 130 µmol/L 60 - 110
Cholestérol non-HDL 10,00 mmol/L 2,00 g/L 5,13 à 14,23 mmol/L 0,58 à 1,61 g/L`;

const classification = parseLabResults(sampleText);
console.log("Code-computed classification:");
for (const r of classification) console.log(` - ${r.name}: ${r.status}`);

// Simulates the AI's expected output — but deliberately puts each test
// under the section its computed status says it belongs in, the same way
// the real AI call is instructed to (using the JSON we hand it).
const resultsText = `================================================================================
COMPRENDRE LES TERMES DE VOS ANALYSES
================================================================================

Vue d'ensemble :
Votre bilan comporte 4 analyses. 3 valeur(s) se situe(nt) en dehors des repères habituels du laboratoire, 1 valeur(s) se situe(nt) dans les repères habituels.

================================================================================
1. VALEURS EN DEHORS DES REPÈRES HABITUELS
================================================================================

• Hémoglobine
  Votre résultat : 11,8 g/dL
  Repères du laboratoire : 12,0 - 16,0
  Position : En-dessous des repères habituels

  Qu'est-ce que c'est ?
  L'hémoglobine est une protéine présente dans les globules rouges du sang.

• Créatinine
  Votre résultat : 130 µmol/L
  Repères du laboratoire : 60 - 110
  Position : Au-dessus des repères habituels

  Qu'est-ce que c'est ?
  La créatinine est une substance produite par les muscles, présente dans le sang.

• Cholestérol non-HDL
  Votre résultat : 10,00 mmol/L / 2,00 g/L
  Repères du laboratoire : 5,13 - 14,23 mmol/L / 0,58 - 1,61 g/L
  Position : Au-dessus des repères habituels (sur une des deux unités)

  Qu'est-ce que c'est ?
  Le cholestérol non-HDL est une mesure du cholestérol présent dans le sang, hors HDL.

================================================================================
2. VALEURS DANS LES REPÈRES HABITUELS
================================================================================

--- BIOCHIMIE

Métabolisme glucidique (sucre dans le sang) :
• Glycémie : 5,4 mmol/L (repères : 3,9 - 5,5)
  La glycémie est la concentration de glucose dans le sang.

================================================================================
3. RÉCAPITULATIF
================================================================================

Votre bilan comporte 4 analyses, dont 3 en dehors des repères et 1 dans les repères habituels.

================================================================================
RAPPEL IMPORTANT
================================================================================

Ce résumé a pour objectif d'aider à comprendre les analyses figurant sur ce compte-rendu. Il ne constitue pas une interprétation médicale. Pour toute question concernant vos résultats, veuillez consulter votre médecin.
================================================================================`;

// A tricky flip: the AI *mis-sorts* Glycémie into the abnormal section by
// mistake in its prose (this would happen with a hallucinating model) —
// if the PDF colors were still string-matching the AI's section headers,
// Glycémie would wrongly render red. With the computed-flag fix, it must
// still render GREEN because lab-parser.js says it's NORMAL.
const resultsTextWithAIMistake = resultsText.replace(
  `================================================================================
2. VALEURS DANS LES REPÈRES HABITUELS
================================================================================

--- BIOCHIMIE

Métabolisme glucidique (sucre dans le sang) :
• Glycémie : 5,4 mmol/L (repères : 3,9 - 5,5)
  La glycémie est la concentration de glucose dans le sang.
`,
  `================================================================================
2. VALEURS DANS LES REPÈRES HABITUELS
================================================================================
`
).replace(
  `  Le cholestérol non-HDL est une mesure du cholestérol présent dans le sang, hors HDL.
`,
  `  Le cholestérol non-HDL est une mesure du cholestérol présent dans le sang, hors HDL.

• Glycémie
  Votre résultat : 5,4 mmol/L
  Repères du laboratoire : 3,9 - 5,5
  Position : (l'IA se trompe et la met ici par erreur)
`
);

(async () => {
  // A minimal valid source PDF for appendResultsToPdf to load (it uses
  // pdf-lib to read/write, so a pdf-lib-authored buffer works fine here —
  // this test isolates the coloring logic from the unrelated pdf2json
  // extraction issue).
  const src = await PDFDocument.create();
  const p = src.addPage([595, 842]);
  const f = await src.embedFont(StandardFonts.Helvetica);
  p.drawText("Compte-rendu original (page 1)", { x: 50, y: 780, size: 14, font: f });
  const srcBuffer = Buffer.from(await src.save());

  const out1 = await appendResultsToPdf(srcBuffer, resultsText, sampleText, classification);
  fs.writeFileSync("visual-test-correct.pdf", out1);
  console.log("\nWrote visual-test-correct.pdf (AI sorted correctly)");

  const out2 = await appendResultsToPdf(srcBuffer, resultsTextWithAIMistake, sampleText, classification);
  fs.writeFileSync("visual-test-ai-mistake.pdf", out2);
  console.log("Wrote visual-test-ai-mistake.pdf (AI misplaces Glycémie in the abnormal section — should still render GREEN if the fix works)");
})();
